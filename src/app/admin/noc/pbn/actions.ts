"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas, auditLog } from "@/db/schema";
import { requireNocSession, type SessionPayload } from "@/lib/session";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";

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

/** Shared save logic. Returns per-category totals. */
async function persistDraftAllocations(
  formData: FormData,
  session: SessionPayload & { nocCode: string }
): Promise<CategorySlots> {
  const nocCode = session.nocCode;

  const approvedApps = await db
    .select({ org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  const totals: CategorySlots = { E: 0, Es: 0, EP: 0, EPs: 0, ET: 0, EC: 0 };

  for (const { org } of approvedApps) {
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

  return totals;
}

/** Save draft allocations without submitting. */
export async function saveSlotAllocations(formData: FormData) {
  const session = await requireNocSession();
  await persistDraftAllocations(formData, session);
  redirect("/admin/noc/pbn?success=saved");
}

/**
 * Save allocations and submit to OCOG.
 * Validates per-category quotas, then moves all draft allocations to noc_submitted.
 */
export async function submitPbnToOcog(formData: FormData) {
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

  for (const { id } of draftAllocs) {
    await db
      .update(orgSlotAllocations)
      .set({ pbnState: "noc_submitted" })
      .where(eq(orgSlotAllocations.id, id));
  }

  const summary = ACCRED_CATEGORIES
    .filter((c) => totals[c.value] > 0)
    .map((c) => `${c.value}:${totals[c.value]}`)
    .join(" · ");

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_submitted",
    detail: `${draftAllocs.length} orgs · ${summary}`,
  });

  redirect("/admin/noc/pbn?success=submitted");
}
