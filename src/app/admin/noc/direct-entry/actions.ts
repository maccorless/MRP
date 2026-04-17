"use server";

import { redirect } from "next/navigation";
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
  const website       = (formData.get("website") as string)?.trim() || null;
  const contactName   = (formData.get("contact_name") as string)?.trim();
  const contactEmail  = (formData.get("contact_email") as string)?.trim().toLowerCase();
  const about         = (formData.get("about") as string)?.trim() || "";

  const VALID_ORG_TYPES = ["media_print_online", "media_broadcast", "news_agency"];
  if (!orgName || !orgType || !VALID_ORG_TYPES.includes(orgType) || !country || !contactName || !contactEmail) {
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

  // Create org, application, and audit log atomically
  const now = new Date();
  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name: orgName,
        country,
        nocCode,
        orgType: orgType as "media_print_online" | "media_broadcast" | "news_agency",
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
      detail: `${orgName} — direct entry by ${session.displayName}`,
    });
  });

  redirect("/admin/noc/queue?success=direct_entry_submitted");
}
