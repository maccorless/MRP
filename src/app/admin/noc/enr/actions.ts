"use server";

import { redirect } from "next/navigation";
import { eq, and, asc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { enrRequests, organizations, auditLog } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";

/** Add an ENR nomination (independent of EoI — NOC enters org details directly). */
export async function addEnrNomination(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const orgName = (formData.get("enr_org_name") as string)?.trim();
  const enrWebsite = (formData.get("enr_website") as string)?.trim() || null;
  const enrDescription = (formData.get("enr_description") as string)?.trim();
  const enrJustification = (formData.get("enr_justification") as string)?.trim();
  const mustHaveRaw = parseInt(formData.get("must_have_slots") as string, 10);
  const niceToHaveRaw = parseInt(formData.get("nice_to_have_slots") as string, 10);

  if (!orgName || !enrDescription || !enrJustification) {
    redirect("/admin/noc/enr?error=missing_fields");
  }

  const mustHaveSlots = isNaN(mustHaveRaw) || mustHaveRaw < 1 ? 1 : mustHaveRaw;
  const niceToHaveSlots = isNaN(niceToHaveRaw) ? 0 : Math.max(0, niceToHaveRaw);

  // Duplicate check: case-insensitive name match against existing ENR org names for this NOC
  const existingOrgs = await db
    .select({ orgName: organizations.name, reqId: enrRequests.id })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")));

  if (existingOrgs.some((r) => r.orgName.toLowerCase() === orgName.toLowerCase())) {
    redirect("/admin/noc/enr?error=already_added");
  }

  const nextRank = existingOrgs.length + 1;

  // Create the organization record first, then the ENR request that references it
  const [org] = await db
    .insert(organizations)
    .values({
      name: orgName,
      nocCode,
      orgType: "enr",
      website: enrWebsite,
    })
    .returning({ id: organizations.id });

  await db.insert(enrRequests).values({
    nocCode,
    organizationId: org.id,
    priorityRank: nextRank,
    slotsRequested: mustHaveSlots + niceToHaveSlots,
    enrWebsite,
    enrDescription,
    enrJustification,
    mustHaveSlots,
    niceToHaveSlots,
    submittedAt: null, // draft
  });

  redirect("/admin/noc/enr?success=added");
}

/** Remove a draft nomination (not allowed after submission). */
export async function removeEnrOrg(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const requestId = formData.get("request_id") as string;

  const [req] = await db
    .select()
    .from(enrRequests)
    .where(and(eq(enrRequests.id, requestId), eq(enrRequests.nocCode, nocCode)));

  if (!req || req.submittedAt !== null) redirect("/admin/noc/enr");

  await db.delete(enrRequests).where(eq(enrRequests.id, requestId));

  // Delete the linked org record if it is ENR-type (created solely for this nomination)
  const [org] = await db
    .select({ id: organizations.id, orgType: organizations.orgType })
    .from(organizations)
    .where(eq(organizations.id, req.organizationId));
  if (org?.orgType === "enr") {
    await db.delete(organizations).where(eq(organizations.id, org.id));
  }

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

/** Update priority ranks (for drag-and-drop or rank-number editing). */
export async function updateEnrRanks(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  const ranksJson = formData.get("ranks") as string;
  if (!ranksJson) redirect("/admin/noc/enr");

  const ranks: { id: string; rank: number }[] = JSON.parse(ranksJson);

  // Validate all belong to this NOC and are draft
  for (const { id, rank } of ranks) {
    const [req] = await db
      .select({ nocCode: enrRequests.nocCode, submittedAt: enrRequests.submittedAt })
      .from(enrRequests)
      .where(eq(enrRequests.id, id));

    if (!req || req.nocCode !== nocCode || req.submittedAt !== null) {
      redirect("/admin/noc/enr?error=invalid_rank");
    }

    await db
      .update(enrRequests)
      .set({ priorityRank: rank })
      .where(eq(enrRequests.id, id));
  }

  redirect("/admin/noc/enr?success=reordered");
}

/** Submit the ENR list to IOC. */
export async function submitEnrToIoc() {
  await requireWritable();
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
