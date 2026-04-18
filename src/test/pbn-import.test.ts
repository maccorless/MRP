/**
 * Tests for the PbN import CSV/TSV parser logic.
 *
 * We extract and test the pure parsing functions independently of the
 * HTTP handler so they can run without a DB connection.
 */

import { describe, it, expect } from "vitest";

// ─── Inline the parser (mirrors route.ts implementation) ────────────────────
// We duplicate the core parsing logic here to avoid importing from a Next.js
// route file (which has side-effect imports like drizzle-orm and next/server).

function parseCsvLine(line: string, sep: string): string[] {
  if (sep === "\t") {
    return line.split("\t").map((v) => v.trim());
  }
  const fields: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { fields.push(current); current = ""; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

function detectSeparator(text: string): "\t" | "," {
  // Skip comment/blank lines to find the first meaningful line
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

type ImportRow = {
  orgName: string; orgType: string; country: string;
  eSlots: number; esSlots: number; epSlots: number;
  epsSlots: number; etSlots: number; ecSlots: number;
  entrySource: string; notes: string;
};

function parseText(text: string): { rows: ImportRow[]; errors: string[] } {
  const sep = detectSeparator(text);
  const lines = text.split("\n").map((l) => l.trimEnd());
  const rows: ImportRow[] = [];
  const errors: string[] = [];

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l === "" || l.startsWith("#")) continue;
    headerIdx = i;
    break;
  }
  if (headerIdx === -1) { errors.push("No header row found"); return { rows, errors }; }

  const headerFields = parseCsvLine(lines[headerIdx], sep).map((h) =>
    h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
  );

  const col = (name: string) => headerFields.indexOf(name);
  const COL_ORG_NAME  = col("org_name");
  const COL_ORG_TYPE  = col("org_type");
  const COL_COUNTRY   = col("country");
  const COL_E         = col("e_slots");
  const COL_ES        = col("es_slots");
  const COL_EP        = col("ep_slots");
  const COL_EPS       = col("eps_slots");
  const COL_ET        = col("et_slots");
  const COL_EC        = col("ec_slots");
  const COL_ENTRY_SRC = col("entry_source");
  const COL_NOTES     = col("notes");

  if (COL_ORG_NAME === -1) { errors.push('Header row must contain "org_name" column'); return { rows, errors }; }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const fields = parseCsvLine(line, sep);
    const lineNum = i + 1;
    const getField = (colIdx: number): string =>
      colIdx >= 0 && colIdx < fields.length ? (fields[colIdx] ?? "").trim() : "";

    const orgName = getField(COL_ORG_NAME);
    if (!orgName) { errors.push(`Row ${lineNum}: org_name is empty — row skipped`); continue; }

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PbN import parser — CSV", () => {
  const HEADER = "org_name,org_type,country,e_slots,es_slots,ep_slots,eps_slots,et_slots,ec_slots,entry_source,notes";

  it("parses a single CSV row correctly", () => {
    const csv = `${HEADER}\nAP Wirephoto,news_agency,US,4,0,2,0,1,0,eoi,`;
    const { rows, errors } = parseText(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      orgName: "AP Wirephoto",
      orgType: "news_agency",
      country: "US",
      eSlots: 4,
      epSlots: 2,
      etSlots: 1,
      entrySource: "eoi",
    });
  });

  it("skips comment lines and blank lines", () => {
    const csv = `# NOC: USA | Quota: E=50\n${HEADER}\n\nAP Wirephoto,news_agency,US,4,0,2,0,1,0,eoi,\n\n`;
    const { rows, errors } = parseText(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });

  it("handles multiple rows", () => {
    const csv = `${HEADER}\nOrg A,news_agency,US,2,0,0,0,0,0,eoi,\nOrg B,media_broadcast,FR,0,0,3,0,0,0,pbn_direct,`;
    const { rows } = parseText(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].orgName).toBe("Org A");
    expect(rows[1].orgName).toBe("Org B");
    expect(rows[1].epSlots).toBe(3);
  });

  it("records an error for empty org_name and skips row", () => {
    const csv = `${HEADER}\n,news_agency,US,4,0,2,0,1,0,eoi,`;
    const { rows, errors } = parseText(csv);
    expect(rows).toHaveLength(0);
    expect(errors.some((e) => e.includes("org_name is empty"))).toBe(true);
  });

  it("records an error for negative slot value", () => {
    const csv = `${HEADER}\nOrg A,news_agency,US,-1,0,2,0,1,0,eoi,`;
    const { rows, errors } = parseText(csv);
    expect(rows).toHaveLength(0);
    expect(errors.some((e) => e.includes("e_slots"))).toBe(true);
  });

  it("records an error for non-integer slot value", () => {
    const csv = `${HEADER}\nOrg A,news_agency,US,1.5,0,2,0,1,0,eoi,`;
    const { rows, errors } = parseText(csv);
    expect(rows).toHaveLength(0);
    expect(errors.some((e) => e.includes("e_slots"))).toBe(true);
  });

  it("treats empty slot fields as 0", () => {
    const csv = `${HEADER}\nOrg A,news_agency,US,,,,,,,,`;
    const { rows, errors } = parseText(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0].eSlots).toBe(0);
    expect(rows[0].ecSlots).toBe(0);
  });

  it("handles quoted fields with commas", () => {
    const csv = `${HEADER}\n"Smith, Jones & Partners",news_agency,GB,1,0,0,0,0,0,eoi,`;
    const { rows, errors } = parseText(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0].orgName).toBe("Smith, Jones & Partners");
  });

  it("handles doubled-quote escapes in quoted fields", () => {
    const csv = `${HEADER}\n"O""Brien Media",news_agency,IE,1,0,0,0,0,0,eoi,`;
    const { rows } = parseText(csv);
    expect(rows[0].orgName).toBe('O"Brien Media');
  });

  it("returns error when no header row present", () => {
    const { rows, errors } = parseText("   \n\n# comment only");
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/No header row/);
  });

  it("returns error when org_name column is missing", () => {
    const { rows, errors } = parseText("name,e_slots\nOrg A,3");
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/org_name/);
  });

  it("works with only org_name column present", () => {
    const csv = "org_name\nOrg A\nOrg B";
    const { rows, errors } = parseText(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].eSlots).toBe(0);
  });

  it("defaults entry_source to pbn_direct when column absent", () => {
    const csv = "org_name,e_slots\nOrg A,3";
    const { rows } = parseText(csv);
    expect(rows[0].entrySource).toBe("pbn_direct");
  });
});

describe("PbN import parser — TSV (Excel clipboard)", () => {
  const HEADER_TSV = "org_name\torg_type\tcountry\te_slots\tes_slots\tep_slots\teps_slots\tet_slots\tec_slots\tentry_source\tnotes";

  it("parses a TSV row correctly", () => {
    const tsv = `${HEADER_TSV}\nAP Wirephoto\tnews_agency\tUS\t4\t0\t2\t0\t1\t0\teoi\t`;
    const { rows, errors } = parseText(tsv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].orgName).toBe("AP Wirephoto");
    expect(rows[0].eSlots).toBe(4);
    expect(rows[0].epSlots).toBe(2);
  });

  it("detects tab separator from first line", () => {
    const tsv = `org_name\te_slots\nOrg A\t5`;
    const { rows } = parseText(tsv);
    expect(rows[0].eSlots).toBe(5);
  });

  it("skips comment lines in TSV", () => {
    const tsv = `# metadata\n${HEADER_TSV}\nOrg A\tnews_agency\tUS\t1\t0\t0\t0\t0\t0\teoi\t`;
    const { rows, errors } = parseText(tsv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });
});

describe("separator detection", () => {
  it("detects comma separator", () => {
    expect(detectSeparator("a,b,c\n1,2,3")).toBe(",");
  });

  it("detects tab separator", () => {
    expect(detectSeparator("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("defaults to comma when no separator found", () => {
    expect(detectSeparator("no_separator_here")).toBe(",");
  });
});
