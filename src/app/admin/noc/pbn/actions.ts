"use server";

import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas, auditLog } from "@/db/schema";
import { requireNocSession, requireWritable, type SessionPayload } from "@/lib/session";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";

/** Add an organisation directly to PbN without going through EoI. */
export async function addOrgDirectlyToPbn(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const orgType = (formData.get("orgType") as string | null) ?? "";
  const country = ((formData.get("country") as string | null) ?? "").trim() || null;

  if (!name || !orgType) redirect("/admin/noc/pbn?error=invalid_org");

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name,
        nocCode,
        orgType: orgType as "media_print_online" | "media_broadcast" | "news_agency" | "enr",
        ...(country ? { country } : {}),
        status: "active",
      })
      .returning({ id: organizations.id });

    await tx.insert(orgSlotAllocations).values({
      organizationId: org.id,
      nocCode,
      eSlots:   0,
      esSlots:  0,
      epSlots:  0,
      epsSlots: 0,
      etSlots:  0,
      ecSlots:  0,
      pressSlots: 0,
      photoSlots: 0,
      allocatedBy: session.userId,
      pbnState: "draft",
    });

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "noc_direct_entry",
      detail: name,
    });
  });

  redirect("/admin/noc/pbn?success=org_added");
}

type CategorySlots = Record<AccredCategory, number>;

function parseCategorySlots(formData: FormData, orgId: string): CategorySlots {
  const out = {} as CategorySlots;
  for (const cat of ACCRED_CATEGORIES) {
    const raw = formData.get(`${cat.value.toLowerCase()}_${orgId}`) as string | null;
    const n = raw !== null ? parseInt(raw, 10) : 0;
    out[cat.value] = isNaN(n) ? 0 : Math.max(0, n);
  }
  return out;
}

function parseNocERequested(formData: FormData): number | null {
  const raw = formData.get("noce_slots") as string | null;
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

/** Shared save logic. Returns per-category totals. */
async function persistDraftAllocations(
  formData: FormData,
  session: SessionPayload & { nocCode: string }
): Promise<CategorySlots> {
  const nocCode = session.nocCode;

  // Orgs from approved EoI applications
  const approvedApps = await db
    .select({ org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  const approvedOrgIds = new Set(approvedApps.map((a) => a.org.id));

  // Orgs added directly to PbN (no EoI application)
  const allNocAllocs = await db
    .select({ org: organizations })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

  const directOrgs = allNocAllocs
    .map((a) => a.org)
    .filter((o) => !approvedOrgIds.has(o.id));

  const allOrgs = [...approvedApps.map((a) => a.org), ...directOrgs];

  const totals: CategorySlots = { E: 0, Es: 0, EP: 0, EPs: 0, ET: 0, EC: 0 };

  for (const org of allOrgs) {
    const slots = parseCategorySlots(formData, org.id);

    for (const cat of ACCRED_CATEGORIES) {
      totals[cat.value] += slots[cat.value];
    }

    const [existing] = await db
      .select()
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.organizationId, org.id),
          eq(orgSlotAllocations.nocCode, nocCode),
          eq(orgSlotAllocations.eventId, "LA28")
        )
      );

    if (existing) {
      if (existing.pbnState !== "draft") continue;
      await db
        .update(orgSlotAllocations)
        .set({
          eSlots:   slots.E,
          esSlots:  slots.Es,
          epSlots:  slots.EP,
          epsSlots: slots.EPs,
          etSlots:  slots.ET,
          ecSlots:  slots.EC,
          // Keep legacy fields in sync
          pressSlots: slots.E + slots.Es + slots.ET + slots.EC,
          photoSlots: slots.EP + slots.EPs,
          allocatedBy: session.userId,
          allocatedAt: new Date(),
        })
        .where(eq(orgSlotAllocations.id, existing.id));
    } else {
      await db.insert(orgSlotAllocations).values({
        organizationId: org.id,
        nocCode,
        eSlots:   slots.E,
        esSlots:  slots.Es,
        epSlots:  slots.EP,
        epsSlots: slots.EPs,
        etSlots:  slots.ET,
        ecSlots:  slots.EC,
        pressSlots: slots.E + slots.Es + slots.ET + slots.EC,
        photoSlots: slots.EP + slots.EPs,
        allocatedBy: session.userId,
        pbnState: "draft",
      });
    }
  }

  // Save NocE requested count if present in form
  const nocERequested = parseNocERequested(formData);
  if (nocERequested !== null) {
    await db
      .update(nocQuotas)
      .set({ nocERequested })
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));
  }

  return totals;
}

/** Save draft allocations without submitting. */
export async function saveSlotAllocations(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  await persistDraftAllocations(formData, session);
  redirect("/admin/noc/pbn?success=saved");
}

/**
 * Save allocations and submit to OCOG.
 * Validates per-category quotas, then moves all draft allocations to noc_submitted.
 */
export async function submitPbnToOcog(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const totals = await persistDraftAllocations(formData, session);

  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  if (!quota) redirect("/admin/noc/pbn?error=no_quota");

  // Per-category quota enforcement
  const catQuotaMap: Partial<Record<AccredCategory, number>> = {
    E:   quota.eTotal   ?? 0,
    Es:  quota.esTotal  ?? 0,
    EP:  quota.epTotal  ?? 0,
    EPs: quota.epsTotal ?? 0,
    ET:  quota.etTotal  ?? 0,
    EC:  quota.ecTotal  ?? 0,
  };
  for (const cat of ACCRED_CATEGORIES) {
    const catQuota = catQuotaMap[cat.value] ?? 0;
    if (catQuota > 0 && totals[cat.value] > catQuota) {
      redirect(`/admin/noc/pbn?error=over_${cat.value.toLowerCase()}_quota`);
    }
  }

  const draftAllocs = await db
    .select({ id: orgSlotAllocations.id })
    .from(orgSlotAllocations)
    .where(
      and(
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28"),
        eq(orgSlotAllocations.pbnState, "draft")
      )
    );

  if (draftAllocs.length === 0) redirect("/admin/noc/pbn?error=no_allocations");

  const draftAllocIds = draftAllocs.map((a) => a.id);
  const nocERequested = parseNocERequested(formData) ?? quota.nocERequested ?? quota.nocETotal;
  const summary = [
    ...ACCRED_CATEGORIES.filter((c) => totals[c.value] > 0).map((c) => `${c.value}:${totals[c.value]}`),
    ...(nocERequested > 0 ? [`NocE:${nocERequested}`] : []),
  ].join(" · ");

  await db.transaction(async (tx) => {
    await tx
      .update(orgSlotAllocations)
      .set({ pbnState: "noc_submitted" })
      .where(inArray(orgSlotAllocations.id, draftAllocIds));

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "pbn_submitted",
      detail: `${draftAllocs.length} orgs · ${summary}`,
    });
  });

  redirect("/admin/noc/pbn?success=submitted");
}

/**
 * Cancel a PbN entry the NOC entered by mistake.
 * Per Emma 2026-04-24 #9: NOCs need a way to remove an org from their PbN
 * allocation table without using a workaround (setting all categories to 0
 * leaves a stranded row in the audit trail).
 *
 * Behaviour:
 * - Only permitted from `draft` and `noc_submitted` states. After
 *   `ocog_approved`, the OCOG must reverse the approval first; after
 *   `sent_to_acr`, cancellation is impossible in PRP (Model A handoff,
 *   subject to §4.3 master-status re-open).
 * - The allocation row is deleted.
 * - If the org was added via Direct Entry / Inline PbN Entry (no prior
 *   approved EoI application), the application record is also marked
 *   `cancelled` so it doesn't reappear as a stranded candidate.
 *   Org records persist per PRP-FR-029 (cross-Games persistence).
 * - Audit logged as `noc_pbn_cancel` with optional reason note.
 */
export async function cancelPbnEntry(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const orgId = (formData.get("organizationId") as string | null)?.trim();
  const reason = (formData.get("reason") as string | null)?.trim() || null;
  if (!orgId) redirect("/admin/noc/pbn?error=missing_org");

  const [alloc] = await db
    .select()
    .from(orgSlotAllocations)
    .where(
      and(
        eq(orgSlotAllocations.organizationId, orgId),
        eq(orgSlotAllocations.nocCode, nocCode),
        eq(orgSlotAllocations.eventId, "LA28"),
      ),
    );

  if (!alloc) redirect("/admin/noc/pbn?error=alloc_not_found");

  // Permission gate: only draft and noc_submitted are cancellable by the NOC.
  if (alloc.pbnState !== "draft" && alloc.pbnState !== "noc_submitted") {
    redirect("/admin/noc/pbn?error=cancel_not_allowed");
  }

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  // Was there a prior EoI application? If so, leave the application record
  // alone; the NOC may want to re-allocate later. If not, the org came from
  // Direct Entry / Inline PbN Entry — mark its application(s) as cancelled
  // to prevent stranded candidate-list entries.
  const apps = await db
    .select({ id: applications.id, status: applications.status, entrySource: applications.entrySource })
    .from(applications)
    .where(
      and(
        eq(applications.organizationId, orgId),
        eq(applications.nocCode, nocCode),
        eq(applications.eventId, "LA28"),
      ),
    );

  // Only direct-entry sources should flip to `rejected` on cancel.
  // EoI-sourced apps (`self_submitted`, `invited`) stay as approved
  // candidates so the NOC can re-allocate later.
  const directEntryAppIds = apps
    .filter((a) => a.entrySource === "noc_direct" || a.entrySource === "pbn_direct")
    .map((a) => a.id);

  await db.transaction(async (tx) => {
    await tx.delete(orgSlotAllocations).where(eq(orgSlotAllocations.id, alloc.id));

    if (directEntryAppIds.length > 0) {
      await tx
        .update(applications)
        .set({ status: "rejected", reviewNote: reason ?? "PbN entry cancelled by NOC", updatedAt: new Date() })
        .where(inArray(applications.id, directEntryAppIds));
    }

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "noc_pbn_cancel",
      organizationId: orgId,
      detail: `${org?.name ?? orgId}${reason ? ` — ${reason}` : ""}`,
    });
  });

  redirect("/admin/noc/pbn?success=entry_cancelled");
}
