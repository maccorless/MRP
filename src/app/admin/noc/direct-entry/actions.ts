"use server";

import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, auditLog } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";
import { nextApplicationRef } from "@/lib/ref-seq";

export async function submitDirectEntryApplication(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  // ── Parse form fields ──────────────────────────────────────────────────────
  const orgName       = (formData.get("org_name") as string)?.trim();
  const orgType       = (formData.get("org_type") as string)?.trim();
  const country       = (formData.get("country") as string)?.trim() || null;
  const rawWebsite    = (formData.get("website") as string)?.trim() || null;
  const website       = rawWebsite === "https://" ? null : rawWebsite;
  const contactName   = (formData.get("contact_name") as string)?.trim();
  const contactEmail  = (formData.get("contact_email") as string)?.trim().toLowerCase();
  const about         = (formData.get("about") as string)?.trim() || "";

  const sportsSpecificSport      = (formData.get("sports_specific_sport") as string)?.trim() || null;
  const secondaryFirstName       = (formData.get("secondary_first_name") as string)?.trim() || null;
  const secondaryLastName        = (formData.get("secondary_last_name") as string)?.trim() || null;
  const secondaryTitle           = (formData.get("secondary_title") as string)?.trim() || null;
  const secondaryEmail           = (formData.get("secondary_email") as string)?.trim() || null;
  const secondaryPhone           = (formData.get("secondary_phone") as string)?.trim() || null;
  const secondaryCell            = (formData.get("secondary_cell") as string)?.trim() || null;

  const VALID_ORG_TYPES = ["media_print_online", "media_broadcast", "news_agency", "enr"];
  const countryRequired = orgType !== "enr";
  if (!orgName || !orgType || !VALID_ORG_TYPES.includes(orgType) || (countryRequired && !country) || !contactName || !contactEmail) {
    redirect("/admin/noc/direct-entry?error=missing_fields");
  }

  // ── Category flags + slot quantities ──────────────────────────────────────
  const categoryE   = formData.get("category_e")   === "on";
  const categoryEs  = formData.get("category_es")  === "on";
  const categoryEp  = formData.get("category_ep")  === "on";
  const categoryEps = formData.get("category_eps") === "on";
  const categoryEt  = formData.get("category_et")  === "on";
  const categoryEc  = formData.get("category_ec")  === "on";

  if (![categoryE, categoryEs, categoryEp, categoryEps, categoryEt, categoryEc].some(Boolean)) {
    redirect("/admin/noc/direct-entry?error=no_category");
  }

  const parseSlots = (key: string) => {
    const v = parseInt(formData.get(key) as string, 10);
    return isNaN(v) || v < 0 ? 0 : v;
  };

  const requestedE   = categoryE   ? parseSlots("requested_e")   : null;
  const requestedEs  = categoryEs  ? parseSlots("requested_es")  : null;
  const requestedEp  = categoryEp  ? parseSlots("requested_ep")  : null;
  const requestedEps = categoryEps ? parseSlots("requested_eps") : null;
  const requestedEt  = categoryEt  ? parseSlots("requested_et")  : null;
  const requestedEc  = categoryEc  ? parseSlots("requested_ec")  : null;

  // ── Reference number ───────────────────────────────────────────────────────
  const referenceNumber = await nextApplicationRef(nocCode);

  // ── Soft dedup check — warn in audit log but do not block ─────────────────
  const emailDomain = contactEmail.split("@")[1] ?? null;
  let dupWarning: string | null = null;
  if (emailDomain) {
    const existing = await db
      .select({ orgName: organizations.name })
      .from(organizations)
      .innerJoin(applications, eq(applications.organizationId, organizations.id))
      .where(
        and(
          eq(applications.nocCode, nocCode),
          eq(applications.eventId, "LA28"),
          eq(organizations.emailDomain, emailDomain),
          // Skip rejected apps — a rejected sibling is no longer a live duplicate.
          ne(applications.status, "rejected"),
        ),
      );
    if (existing.length > 0) {
      dupWarning = `possible duplicate: same domain as ${existing.map((e) => e.orgName).join(", ")}`;
    }
  }

  // Create org, application, and audit log atomically
  const now = new Date();
  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: orgName,
        country,
        nocCode,
        orgType: orgType as "media_print_online" | "media_broadcast" | "news_agency" | "enr",
        website,
        emailDomain: contactEmail.split("@")[1] ?? null,
      })
      .returning({ id: organizations.id });

    const [app] = await tx
      .insert(applications)
      .values({
        referenceNumber,
        organizationId: org.id,
        nocCode,
        contactName,
        contactEmail,
        about,
        categoryE, categoryEs, categoryEp, categoryEps, categoryEt, categoryEc,
        categoryPress: categoryE || categoryEs || categoryEt || categoryEc,
        categoryPhoto: categoryEp || categoryEps,
        requestedE, requestedEs, requestedEp, requestedEps, requestedEt, requestedEc,
        sportsSpecificSport,
        secondaryFirstName, secondaryLastName, secondaryTitle,
        secondaryEmail, secondaryPhone, secondaryCell,
        status: "approved",
        entrySource: "noc_direct",
        reviewedAt: now,
        reviewedBy: session.userId,
      })
      .returning({ id: applications.id });

    await tx.insert(auditLog).values({
      actorType: "noc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "noc_direct_entry",
      applicationId: app.id,
      organizationId: org.id,
      detail: dupWarning
        ? `${orgName} — direct entry by ${session.displayName} — ${dupWarning}`
        : `${orgName} — direct entry by ${session.displayName}`,
    });
  });

  redirect("/admin/noc/queue?success=direct_entry_submitted");
}
