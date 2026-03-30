"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas, auditLog } from "@/db/schema";
import { requireNocSession, type SessionPayload } from "@/lib/session";

/** Shared save logic — no redirect. Returns totals. */
async function persistDraftAllocations(
  formData: FormData,
  session: SessionPayload & { nocCode: string }
): Promise<{ totalPress: number; totalPhoto: number }> {
  const nocCode = session.nocCode;

  const approvedApps = await db
    .select({ org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(and(eq(applications.nocCode, nocCode), eq(applications.status, "approved")));

  let totalPress = 0;
  let totalPhoto = 0;

  for (const { org } of approvedApps) {
    const pressVal = parseInt((formData.get(`press_${org.id}`) as string) ?? "0", 10);
    const photoVal = parseInt((formData.get(`photo_${org.id}`) as string) ?? "0", 10);
    const press = isNaN(pressVal) ? 0 : pressVal;
    const photo = isNaN(photoVal) ? 0 : photoVal;

    totalPress += press;
    totalPhoto += photo;

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
      if (existing.pbnState !== "draft") continue; // locked post-submission
      await db
        .update(orgSlotAllocations)
        .set({ pressSlots: press, photoSlots: photo, allocatedBy: session.userId, allocatedAt: new Date() })
        .where(eq(orgSlotAllocations.id, existing.id));
    } else {
      await db.insert(orgSlotAllocations).values({
        organizationId: org.id,
        nocCode,
        pressSlots: press,
        photoSlots: photo,
        allocatedBy: session.userId,
        pbnState: "draft",
      });
    }
  }

  return { totalPress, totalPhoto };
}

/** Save draft allocations without submitting. */
export async function saveSlotAllocations(formData: FormData) {
  const session = await requireNocSession();
  await persistDraftAllocations(formData, session);
  redirect("/admin/noc/pbn?success=saved");
}

/**
 * Save allocations and submit to OCOG.
 * Validates quota not exceeded, then moves all draft allocations to noc_submitted.
 */
export async function submitPbnToOcog(formData: FormData) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  // Save current form values first
  const { totalPress, totalPhoto } = await persistDraftAllocations(formData, session);

  // Get quota
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

  if (!quota) redirect("/admin/noc/pbn?error=no_quota");

  // Server-side quota enforcement
  if (totalPress > quota.pressTotal) redirect("/admin/noc/pbn?error=over_press_quota");
  if (totalPhoto > quota.photoTotal) redirect("/admin/noc/pbn?error=over_photo_quota");

  // Get all draft allocations to transition
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

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "pbn_submitted",
    detail: `${draftAllocs.length} orgs · ${totalPress} press · ${totalPhoto} photo`,
  });

  redirect("/admin/noc/pbn?success=submitted");
}
