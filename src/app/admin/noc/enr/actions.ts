"use server";

import { redirect } from "next/navigation";
import { eq, and, asc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, auditLog } from "@/db/schema";
import { requireNocSession } from "@/lib/session";

/** Add an org to the NOC's ENR list. org_id must be an existing organization. */
export async function addEnrOrg(formData: FormData) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const orgId = formData.get("org_id") as string;
  const slotsRaw = parseInt(formData.get("slots_requested") as string, 10);
  const slots = isNaN(slotsRaw) || slotsRaw < 1 ? 1 : slotsRaw;

  if (!orgId) redirect("/admin/noc/enr?error=no_org");

  // Already on list?
  const [existing] = await db
    .select({ id: enrRequests.id })
    .from(enrRequests)
    .where(
      and(
        eq(enrRequests.nocCode, nocCode),
        eq(enrRequests.eventId, "LA28"),
        eq(enrRequests.organizationId, orgId)
      )
    );
  if (existing) redirect("/admin/noc/enr?error=already_added");

  // Assign next priority rank
  const current = await db
    .select({ rank: enrRequests.priorityRank })
    .from(enrRequests)
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")))
    .orderBy(asc(enrRequests.priorityRank));

  const nextRank = current.length > 0 ? current[current.length - 1].rank + 1 : 1;

  await db.insert(enrRequests).values({
    nocCode,
    organizationId: orgId,
    priorityRank: nextRank,
    slotsRequested: slots,
    submittedAt: null, // draft
  });

  redirect("/admin/noc/enr?success=added");
}

/** Remove a draft org from the ENR list (not allowed after submission). */
export async function removeEnrOrg(formData: FormData) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const requestId = formData.get("request_id") as string;

  const [req] = await db
    .select()
    .from(enrRequests)
    .where(and(eq(enrRequests.id, requestId), eq(enrRequests.nocCode, nocCode)));

  if (!req || req.submittedAt !== null) redirect("/admin/noc/enr");

  await db.delete(enrRequests).where(eq(enrRequests.id, requestId));

  // Re-rank remaining entries
  const remaining = await db
    .select({ id: enrRequests.id })
    .from(enrRequests)
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")))
    .orderBy(asc(enrRequests.priorityRank));

  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(enrRequests)
      .set({ priorityRank: i + 1 })
      .where(eq(enrRequests.id, remaining[i].id));
  }

  redirect("/admin/noc/enr?success=removed");
}

/** Submit the ENR list to IOC. Sets submittedAt on all draft records, locking the list. */
export async function submitEnrToIoc() {
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const unsubmitted = await db
    .select({ id: enrRequests.id, slotsRequested: enrRequests.slotsRequested })
    .from(enrRequests)
    .where(
      and(
        eq(enrRequests.nocCode, nocCode),
        eq(enrRequests.eventId, "LA28"),
        isNull(enrRequests.submittedAt)
      )
    );

  if (unsubmitted.length === 0) redirect("/admin/noc/enr?error=nothing_to_submit");

  const now = new Date();
  for (const { id } of unsubmitted) {
    await db.update(enrRequests).set({ submittedAt: now }).where(eq(enrRequests.id, id));
  }

  const totalSlots = unsubmitted.reduce((s, r) => s + r.slotsRequested, 0);

  await db.insert(auditLog).values({
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "enr_submitted",
    detail: `${unsubmitted.length} orgs · ${totalSlots} slots requested`,
  });

  redirect("/admin/noc/enr?success=submitted");
}
