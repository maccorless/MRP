"use server";

import { redirect } from "next/navigation";
import { eq, and, asc, isNull, inArray, sql, count } from "drizzle-orm";
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

  // Duplicate check outside transaction (fast fail)
  const existingOrgs = await db
    .select({ orgName: organizations.name })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")));

  if (existingOrgs.some((r) => r.orgName.toLowerCase() === orgName.toLowerCase())) {
    redirect("/admin/noc/enr?error=already_added");
  }

  // Create org + ENR request inside transaction; derive rank under lock
  await db.transaction(async (tx) => {
    // Derive nextRank inside the transaction so concurrent adds serialize
    const [{ currentCount }] = await tx
      .select({ currentCount: count() })
      .from(enrRequests)
      .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")));

    const nextRank = currentCount + 1;

    const [org] = await tx
      .insert(organizations)
      .values({
        name: orgName,
        nocCode,
        orgType: "enr",
        website: enrWebsite,
      })
      .returning({ id: organizations.id });

    await tx.insert(enrRequests).values({
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

  await db.transaction(async (tx) => {
    await tx.delete(enrRequests).where(eq(enrRequests.id, requestId));

    // Delete the linked org record if it is ENR-type (created solely for this nomination)
    const [org] = await tx
      .select({ id: organizations.id, orgType: organizations.orgType })
      .from(organizations)
      .where(eq(organizations.id, req.organizationId));
    if (org?.orgType === "enr") {
      await tx.delete(organizations).where(eq(organizations.id, org.id));
    }

    // Re-rank remaining entries into contiguous 1..N
    await tx.execute(sql`
      UPDATE enr_requests SET priority_rank = sub.new_rank
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY priority_rank) AS new_rank
        FROM enr_requests
        WHERE noc_code = ${nocCode} AND event_id = 'LA28'
      ) sub
      WHERE enr_requests.id = sub.id
    `);
  });

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
  const rankIds = ranks.map((r) => r.id);

  // Batch validate: all submitted IDs must belong to this NOC and be draft
  const existing = await db
    .select({ id: enrRequests.id })
    .from(enrRequests)
    .where(and(
      inArray(enrRequests.id, rankIds),
      eq(enrRequests.nocCode, nocCode),
      eq(enrRequests.eventId, "LA28"),
      isNull(enrRequests.submittedAt)
    ));

  if (existing.length !== rankIds.length) {
    redirect("/admin/noc/enr?error=invalid_rank");
  }

  // No duplicate IDs or rank values in the payload
  if (new Set(rankIds).size !== rankIds.length) {
    redirect("/admin/noc/enr?error=invalid_rank");
  }
  const rankValues = ranks.map((r) => r.rank);
  if (new Set(rankValues).size !== rankValues.length) {
    redirect("/admin/noc/enr?error=invalid_rank");
  }

  // Ranks must be positive integers
  if (rankValues.some((r) => !Number.isInteger(r) || r < 1)) {
    redirect("/admin/noc/enr?error=invalid_rank");
  }

  // Update all ranks atomically within a transaction
  await db.transaction(async (tx) => {
    for (const { id, rank } of ranks) {
      await tx
        .update(enrRequests)
        .set({ priorityRank: rank })
        .where(eq(enrRequests.id, id));
    }
  });

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
  const totalSlots = unsubmitted.reduce((s, r) => s + r.slotsRequested, 0);
  const unsubmittedIds = unsubmitted.map((r) => r.id);

  await db.transaction(async (tx) => {
    await tx
      .update(enrRequests)
      .set({ submittedAt: now })
      .where(inArray(enrRequests.id, unsubmittedIds));

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "enr_submitted",
      detail: `${unsubmitted.length} orgs · ${totalSlots} slots requested`,
    });
  });

  redirect("/admin/noc/enr?success=submitted");
}
