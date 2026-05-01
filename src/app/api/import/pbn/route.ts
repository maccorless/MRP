/**
 * POST /api/import/pbn
 *
 * Full-overlay import of PbN allocations from a CSV or tab-separated payload.
 *
 * Accepts:
 *   - multipart/form-data with a `file` field (CSV upload)
 *   - application/json with a `text` field (clipboard paste — tab-separated)
 *
 * Full-overlay semantics:
 *   - Only affects allocations in `draft` state.
 *   - Rows in `noc_submitted`, `ocog_approved`, or `sent_to_acr` are NOT touched.
 *   - All existing draft allocations for this NOC are replaced by the import.
 *   - Organisations not present in the import file retain their existing draft slots
 *     (to avoid accidentally zeroing out orgs when a row is missing — caller must
 *     explicitly set slots to 0 to zero an org out).
 *
 * Validation:
 *   - org_name must be non-empty
 *   - Slot values must be non-negative integers
 *   - Per-category totals must not exceed quota caps (if quota is set)
 *
 * Returns JSON:
 *   { imported: number; skipped: number; errors: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  organizations,
  orgSlotAllocations,
  nocQuotas,
  auditLog,
} from "@/db/schema";
import { getSession } from "@/lib/session";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";
import { sumAllocations } from "@/lib/quota-calc";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportRow = {
  orgName: string;
  orgType: string;
  country: string;
  eSlots: number;
  esSlots: number;
  epSlots: number;
  epsSlots: number;
  etSlots: number;
  ecSlots: number;
  entrySource: string;
  notes: string;
};

type ParseResult = {
  rows: ImportRow[];
  errors: string[];
};

// ─── CSV / TSV Parsing ────────────────────────────────────────────────────────

/**
 * Very minimal CSV parser — handles quoted fields with internal commas and
 * doubled-quote escapes. Does NOT handle multi-line quoted fields (not needed
 * for our slot-count data).
 */
function parseCsvLine(line: string, sep: string): string[] {
  if (sep === "\t") {
    // TSV (Excel clipboard) — tabs are never part of cell values
    return line.split("\t").map((v) => v.trim());
  }

  const fields: string[] = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/** Detect whether a string is tab-separated or comma-separated.
 *  Skips leading comment/blank lines to find the first meaningful line. */
function detectSeparator(text: string): "\t" | "," {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    return trimmed.includes("\t") ? "\t" : ",";
  }
  return ",";
}

function parseNonNegInt(raw: string, fieldName: string, lineNum: number, errors: string[]): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return 0;
  const n = parseInt(trimmed, 10);
  if (isNaN(n) || n < 0 || String(n) !== trimmed) {
    errors.push(`Row ${lineNum}: ${fieldName} must be a non-negative integer (got "${raw}")`);
    return 0;
  }
  return n;
}

/** Parse raw text (CSV or TSV) into ImportRow array. */
function parseText(text: string): ParseResult {
  const sep = detectSeparator(text);
  const lines = text.split("\n").map((l) => l.trimEnd());
  const rows: ImportRow[] = [];
  const errors: string[] = [];

  // Find header row — skip comment lines (starting with #) and blank lines
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l === "" || l.startsWith("#")) continue;
    headerIdx = i;
    break;
  }

  if (headerIdx === -1) {
    errors.push("No header row found");
    return { rows, errors };
  }

  const headerFields = parseCsvLine(lines[headerIdx], sep).map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
  );

  // Build column index map
  const col = (name: string): number => headerFields.indexOf(name);

  const COL_ORG_NAME    = col("org_name");
  const COL_ORG_TYPE    = col("org_type");
  const COL_COUNTRY     = col("country");
  const COL_E           = col("e_slots");
  const COL_ES          = col("es_slots");
  const COL_EP          = col("ep_slots");
  const COL_EPS         = col("eps_slots");
  const COL_ET          = col("et_slots");
  const COL_EC          = col("ec_slots");
  const COL_ENTRY_SRC   = col("entry_source");
  const COL_NOTES       = col("notes");

  if (COL_ORG_NAME === -1) {
    errors.push('Header row must contain "org_name" column');
    return { rows, errors };
  }

  // Data rows
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const fields = parseCsvLine(line, sep);
    const lineNum = i + 1; // 1-based for error messages

    const getField = (colIdx: number): string =>
      colIdx >= 0 && colIdx < fields.length ? (fields[colIdx] ?? "").trim() : "";

    const orgName = getField(COL_ORG_NAME);
    if (!orgName) {
      errors.push(`Row ${lineNum}: org_name is empty — row skipped`);
      continue;
    }

    const rowErrors: string[] = [];
    const eSlots   = parseNonNegInt(getField(COL_E),   "e_slots",   lineNum, rowErrors);
    const esSlots  = parseNonNegInt(getField(COL_ES),  "es_slots",  lineNum, rowErrors);
    const epSlots  = parseNonNegInt(getField(COL_EP),  "ep_slots",  lineNum, rowErrors);
    const epsSlots = parseNonNegInt(getField(COL_EPS), "eps_slots", lineNum, rowErrors);
    const etSlots  = parseNonNegInt(getField(COL_ET),  "et_slots",  lineNum, rowErrors);
    const ecSlots  = parseNonNegInt(getField(COL_EC),  "ec_slots",  lineNum, rowErrors);

    errors.push(...rowErrors);
    if (rowErrors.length > 0) continue;

    rows.push({
      orgName,
      orgType:     getField(COL_ORG_TYPE),
      country:     getField(COL_COUNTRY),
      eSlots, esSlots, epSlots, epsSlots, etSlots, ecSlots,
      entrySource: getField(COL_ENTRY_SRC) || "pbn_direct",
      notes:       getField(COL_NOTES),
    });
  }

  return { rows, errors };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "noc_admin" || !session.nocCode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nocCode = session.nocCode;

  // Accept either multipart form (file upload) or JSON (clipboard paste)
  let rawText = "";
  const ct = request.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    rawText = await file.text();
  } else if (ct.includes("application/json")) {
    const body = await request.json() as { text?: string };
    if (!body.text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }
    rawText = body.text;
  } else {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const { rows: parsedRows, errors: parseErrors } = parseText(rawText);

  if (parsedRows.length === 0 && parseErrors.length > 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: parseErrors }, { status: 422 });
  }

  // Load existing NOC state
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  // Validate quota caps
  if (quota) {
    const catQuotaMap: Partial<Record<AccredCategory, number>> = {
      E:   quota.eTotal   ?? 0,
      Es:  quota.esTotal  ?? 0,
      EP:  quota.epTotal  ?? 0,
      EPs: quota.epsTotal ?? 0,
      ET:  quota.etTotal  ?? 0,
      EC:  quota.ecTotal  ?? 0,
    };

    const importTotals = sumAllocations(parsedRows);

    const quotaErrors: string[] = [];
    for (const cat of ACCRED_CATEGORIES) {
      const cap = catQuotaMap[cat.value] ?? 0;
      const used = importTotals[cat.value];
      if (cap > 0 && used > cap) {
        quotaErrors.push(
          `Category ${cat.value}: import total ${used} exceeds quota ${cap}`
        );
      }
    }

    if (quotaErrors.length > 0) {
      return NextResponse.json(
        { imported: 0, skipped: 0, errors: [...parseErrors, ...quotaErrors] },
        { status: 422 }
      );
    }
  }

  // Build lookup of existing organisations for this NOC
  const existingApprovedApps = await db
    .select({
      orgId:   organizations.id,
      orgName: organizations.name,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  const existingDirectOrgs = await db
    .select({
      orgId:    organizations.id,
      orgName:  organizations.name,
      pbnState: orgSlotAllocations.pbnState,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

  // Name -> orgId lookup (case-insensitive)
  const nameToOrgId = new Map<string, string>();
  for (const r of existingApprovedApps) {
    nameToOrgId.set(r.orgName.toLowerCase(), r.orgId);
  }
  for (const r of existingDirectOrgs) {
    nameToOrgId.set(r.orgName.toLowerCase(), r.orgId);
  }

  // Org state lookup — non-draft orgs are protected
  const orgIdToState = new Map<string, string>();
  for (const r of existingDirectOrgs) {
    orgIdToState.set(r.orgId, r.pbnState);
  }
  // EoI-backed orgs — load their pbnState from orgSlotAllocations
  const eioAllocStates = await db
    .select({ orgId: orgSlotAllocations.organizationId, pbnState: orgSlotAllocations.pbnState })
    .from(orgSlotAllocations)
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));
  for (const r of eioAllocStates) {
    orgIdToState.set(r.orgId, r.pbnState);
  }

  let imported = 0;
  let skipped = 0;
  const importErrors = [...parseErrors];

  for (const row of parsedRows) {
    const orgId = nameToOrgId.get(row.orgName.toLowerCase());

    if (!orgId) {
      // Org not found in this NOC's roster — skip (cannot create new orgs via import)
      skipped++;
      importErrors.push(
        `"${row.orgName}": not found in your PbN roster — skipped (use "Add organisation directly" to add new orgs)`
      );
      continue;
    }

    const state = orgIdToState.get(orgId);
    if (state && state !== "draft") {
      skipped++;
      importErrors.push(
        `"${row.orgName}": allocation is ${state} — cannot overwrite (only draft allocations can be imported)`
      );
      continue;
    }

    // Upsert the allocation
    const [existing] = await db
      .select({
        id: orgSlotAllocations.id,
        eSlots: orgSlotAllocations.eSlots,
        esSlots: orgSlotAllocations.esSlots,
        epSlots: orgSlotAllocations.epSlots,
        epsSlots: orgSlotAllocations.epsSlots,
        etSlots: orgSlotAllocations.etSlots,
        ecSlots: orgSlotAllocations.ecSlots,
      })
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.organizationId, orgId),
          eq(orgSlotAllocations.nocCode, nocCode),
          eq(orgSlotAllocations.eventId, "LA28")
        )
      );

    const slots = {
      eSlots:   row.eSlots,
      esSlots:  row.esSlots,
      epSlots:  row.epSlots,
      epsSlots: row.epsSlots,
      etSlots:  row.etSlots,
      ecSlots:  row.ecSlots,
      pressSlots: row.eSlots + row.esSlots + row.etSlots + row.ecSlots,
      photoSlots: row.epSlots + row.epsSlots,
      allocatedBy: session.userId,
      allocatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(orgSlotAllocations)
        .set(slots)
        .where(eq(orgSlotAllocations.id, existing.id));

      // Log per-field changes for audit trail
      const fieldKeys = ["eSlots", "esSlots", "epSlots", "epsSlots", "etSlots", "ecSlots"] as const;
      const changedEntries = fieldKeys
        .filter((k) => existing[k] !== row[k])
        .map((k) => ({
          actorType: "noc_admin" as const,
          actorId: session.userId,
          actorLabel: session.displayName,
          action: "excel_reimport" as const,
          detail: `PbN re-import: ${row.orgName} — ${k} ${existing[k]} → ${row[k]}`,
        }));
      if (changedEntries.length > 0) {
        await db.insert(auditLog).values(changedEntries);
      }
    } else {
      await db.insert(orgSlotAllocations).values({
        organizationId: orgId,
        nocCode,
        pbnState: "draft",
        ...slots,
      });
    }

    imported++;
  }

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "excel_reimport",
    detail: `PbN re-import: ${imported} rows imported, ${skipped} skipped — ${nocCode}`,
  });

  return NextResponse.json({
    imported,
    skipped,
    errors: importErrors,
  });
}
