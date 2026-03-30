"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  magicLinkTokens,
  organizations,
  applications,
  auditLog,
} from "@/db/schema";
import { generateToken, hashToken } from "@/lib/tokens";

export async function requestToken(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    redirect("/apply?error=invalid_email");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS ?? "24", 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt });

  redirect(`/apply/verify?token=${token}&email=${encodeURIComponent(email)}`);
}

export async function submitApplication(formData: FormData) {
  const token = (formData.get("token") as string)?.toUpperCase().trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const resubmitId = (formData.get("resubmit_id") as string) || null;

  if (!token || !email) redirect("/apply");

  // Validate token
  const tokenHash = hashToken(token);
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        eq(magicLinkTokens.email, email)
      )
    );

  if (
    !tokenRecord ||
    tokenRecord.usedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    redirect("/apply?error=invalid_token");
  }

  // Common form fields
  const contactName = (formData.get("contact_name") as string).trim();
  const category = formData.get("category") as "press" | "photographer" | "enr";
  const about = (formData.get("about") as string).trim();

  // ── RESUBMISSION PATH ─────────────────────────────────────────────────────
  if (resubmitId) {
    const [returnedApp] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, resubmitId),
          eq(applications.contactEmail, email),
          eq(applications.status, "returned")
        )
      );

    if (!returnedApp) redirect("/apply?error=invalid_token");

    await db
      .update(applications)
      .set({
        contactName,
        category,
        about,
        status: "resubmitted",
        resubmissionCount: returnedApp.resubmissionCount + 1,
        reviewNote: null,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, resubmitId));

    await db.insert(auditLog).values({
      actorType: "applicant",
      actorId: email,
      actorLabel: contactName,
      action: "application_resubmitted",
      applicationId: returnedApp.id,
      organizationId: returnedApp.organizationId,
    });

    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.id, tokenRecord.id));

    redirect(`/apply/submitted?ref=${returnedApp.referenceNumber}&resubmit=1`);
  }

  // ── NEW APPLICATION PATH ───────────────────────────────────────────────────
  const orgName = (formData.get("org_name") as string).trim();
  const country = (formData.get("country") as string).trim().toUpperCase();
  const nocCode = (formData.get("noc_code") as string).trim().toUpperCase();
  const orgType = formData.get("org_type") as
    | "media_print_online"
    | "media_broadcast"
    | "news_agency"
    | "enr";
  const websiteRaw = (formData.get("website") as string)?.trim();
  const website = websiteRaw || null;

  const emailDomain = email.split("@")[1];

  const [existingOrg] = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.emailDomain, emailDomain),
        eq(organizations.nocCode, nocCode)
      )
    );

  let org;
  if (existingOrg) {
    org = existingOrg;
  } else {
    const samedomainOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.emailDomain, emailDomain));

    const isMultiTerritory = samedomainOrgs.length > 0;

    [org] = await db
      .insert(organizations)
      .values({
        name: orgName,
        country,
        nocCode,
        orgType,
        website,
        emailDomain,
        isMultiTerritoryFlag: isMultiTerritory,
      })
      .returning();
  }

  const nocApps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.nocCode, nocCode));
  const seq = String(nocApps.length + 1).padStart(5, "0");
  const referenceNumber = `APP-2028-${nocCode}-${seq}`;

  const [app] = await db
    .insert(applications)
    .values({
      referenceNumber,
      organizationId: org.id,
      nocCode,
      contactName,
      contactEmail: email,
      category,
      about,
      status: "pending",
    })
    .returning();

  await db.insert(auditLog).values([
    {
      actorType: "applicant",
      actorId: email,
      actorLabel: contactName,
      action: "email_verified",
      applicationId: app.id,
      organizationId: org.id,
    },
    {
      actorType: "applicant",
      actorId: email,
      actorLabel: contactName,
      action: "application_submitted",
      applicationId: app.id,
      organizationId: org.id,
    },
  ]);

  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, tokenRecord.id));

  redirect(`/apply/submitted?ref=${referenceNumber}`);
}
