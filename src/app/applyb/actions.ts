"use server";

import { redirect } from "next/navigation";
import { eq, and, gte, count, isNull, isNotNull, gt, or } from "drizzle-orm";
import { db } from "@/db";
import {
  magicLinkTokens,
  organizations,
  applications,
  auditLog,
  nocEoiWindows,
  invitations,
} from "@/db/schema";
import { isPersonalEmailDomain } from "@/lib/anomaly-detect";

export async function checkNocWindow(nocCode: string): Promise<{ closed: boolean }> {
  const [row] = await db
    .select({ isOpen: nocEoiWindows.isOpen })
    .from(nocEoiWindows)
    .where(and(eq(nocEoiWindows.nocCode, nocCode), eq(nocEoiWindows.eventId, "LA28")));
  return { closed: row ? !row.isOpen : false };
}
import { headers } from "next/headers";
import { generateToken, hashToken } from "@/lib/tokens";
import { nextApplicationRef } from "@/lib/ref-seq";
import { COUNTRY_CODE_SET, NOC_CODE_SET } from "@/lib/codes";
import {
  parseCategorySelections,
  parseRequestedQuantities,
  deriveLegacyFlags,
} from "@/lib/category";

export async function requestToken(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    redirect("/applyb?error=invalid_email");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Per-email rate limit: max 5 token requests per hour
  const [{ emailCount }] = await db
    .select({ emailCount: count() })
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.email, email), gte(magicLinkTokens.createdAt, oneHourAgo)));
  if (emailCount >= 5) redirect("/applyb?error=rate_limited");

  // Per-IP rate limit: max 15 token requests per hour
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
  if (ip) {
    const [{ ipCount }] = await db
      .select({ ipCount: count() })
      .from(magicLinkTokens)
      .where(and(eq(magicLinkTokens.ipAddress, ip), gte(magicLinkTokens.createdAt, oneHourAgo)));
    if (ipCount >= 15) redirect("/applyb?error=rate_limited");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS ?? "24", 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt, ipAddress: ip });

  redirect(`/applyb/verify?token=${token}&email=${encodeURIComponent(email)}`);
}

export async function submitApplication(formData: FormData) {
  const token = (formData.get("token") as string)?.toUpperCase().trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const resubmitId = (formData.get("resubmit_id") as string) || null;

  if (!token || !email) redirect("/applyb");

  // Lightweight pre-check (non-authoritative — the real gate is the atomic consume inside the tx)
  const tokenHash = hashToken(token);
  const [tokenCheck] = await db
    .select({ id: magicLinkTokens.id })
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        eq(magicLinkTokens.email, email),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, new Date())
      )
    );

  if (!tokenCheck) {
    redirect("/applyb?error=invalid_token");
  }

  // Primary contact
  const contactFirstName = (formData.get("contact_first_name") as string)?.trim() || "";
  const contactLastName = (formData.get("contact_last_name") as string)?.trim() || "";
  const contactName = `${contactFirstName} ${contactLastName}`.trim();
  const contactTitle = (formData.get("contact_title") as string)?.trim() || null;
  const contactCell = (formData.get("contact_cell") as string)?.trim() || null;

  // Editor-in-Chief (optional for freelance org types)
  const editorInChiefFirstName = (formData.get("editor_in_chief_first_name") as string)?.trim() || null;
  const editorInChiefLastName  = (formData.get("editor_in_chief_last_name") as string)?.trim() || null;
  const editorInChiefEmail     = (formData.get("editor_in_chief_email") as string)?.trim() || null;

  // Category + quantities — 7 categories including ENR
  const cats = parseCategorySelections(formData);
  const quantities = parseRequestedQuantities(formData, cats);
  const { categoryPress, categoryPhoto } = deriveLegacyFlags(cats);
  const categoryEnr = formData.get("category_ENR") === "on";
  const requestedEnrRaw = formData.get("requested_ENR") as string | null;
  const requestedEnr = requestedEnrRaw ? parseInt(requestedEnrRaw, 10) || null : null;

  const about = (formData.get("about") as string).trim();

  // Media questions (optional)
  const circulation = (formData.get("circulation") as string)?.trim() || null;
  const publicationFrequency = (formData.get("publication_frequency") as string)?.trim() || null;

  // Accreditation history — Olympic only (Paralympic removed per LA28 Apr 2026 spec)
  const priorOlympicRaw = formData.get("prior_olympic") as string | null;
  const priorOlympic = priorOlympicRaw === "yes" ? true : priorOlympicRaw === "no" ? false : null;
  const priorOlympicYears = (formData.get("prior_olympic_years") as string)?.trim() || null;
  const pastCoverageExamples = (formData.get("past_coverage_examples") as string)?.trim() || null;
  const additionalComments = (formData.get("additional_comments") as string)?.trim() || null;

  // Language — persist URL lang param to DB for email localisation
  const langParam = (formData.get("lang") as string | null)?.toLowerCase();
  const preferredLanguage =
    langParam === "fr" ? "FR" : langParam === "es" ? "ES" : "EN";

  // GDPR
  const gdprAccepted = formData.get("gdpr_accepted") === "true";
  if (!gdprAccepted) {
    redirect("/applyb?error=invalid_token");
  }

  // Must request at least one category (ENR counted)
  const anyRequested =
    Object.values(cats).some(Boolean) || (requestedEnr !== null && requestedEnr > 0);
  if (!anyRequested) {
    redirect("/applyb?error=invalid_category");
  }

  const expandedFields = {
    contactFirstName: contactFirstName || null,
    contactLastName: contactLastName || null,
    contactTitle,
    contactPhone: null,          // legacy — replaced by orgPhone on org section
    contactCell,
    // Editor-in-Chief
    editorInChiefFirstName,
    editorInChiefLastName,
    editorInChiefEmail,
    // Secondary contact — no longer collected; write null to clear old values on resubmit
    secondaryFirstName: null,
    secondaryLastName: null,
    secondaryTitle: null,
    secondaryEmail: null,
    secondaryPhone: null,
    secondaryCell: null,
    // Per-category E accreditation flags + quantities
    categoryE:   cats.E,
    categoryEs:  cats.Es,
    categoryEp:  cats.EP,
    categoryEps: cats.EPs,
    categoryEt:  cats.ET,
    categoryEc:  cats.EC,
    categoryEnr,
    requestedE:   quantities.E   ?? null,
    requestedEs:  quantities.Es  ?? null,
    requestedEp:  quantities.EP  ?? null,
    requestedEps: quantities.EPs ?? null,
    requestedEt:  quantities.ET  ?? null,
    requestedEc:  quantities.EC  ?? null,
    requestedEnr,
    // Publication details — publication_types, sports_to_cover, sports_specific_sport no longer collected
    publicationTypes: null,
    circulation,
    publicationFrequency,
    sportsToCover: null,
    sportsSpecificSport: null,
    // History — Paralympic no longer collected
    priorOlympic,
    priorOlympicYears,
    priorParalympic: null,
    priorParalympicYears: null,
    pastCoverageExamples,
    additionalComments,
    // accessibility_needs no longer collected
    accessibilityNeeds: null,
    orgTypeOther: (formData.get("org_type_other") as string | null) || null,
    pressCard: formData.get("press_card") === "yes" ? true : formData.get("press_card") === "no" ? false : null,
    pressCardIssuer: (formData.get("press_card_issuer") as string | null) || null,
    enrProgrammingType: (formData.get("enr_programming_type") as string | null) || null,
    onlineUniqueVisitors: (formData.get("online_unique_visitors") as string | null) || null,
    geographicalCoverage: (formData.get("geographical_coverage") as string | null) || null,
    socialMediaAccounts: (formData.get("social_media_accounts") as string | null) || null,
    // New LA28 Apr 2026 spec fields
    orgPhone: (formData.get("org_phone") as string)?.trim() || null,
    nonMrhMediaType: (formData.get("non_mrh_media_type") as string)?.trim() || null,
    nonMrhMediaTypeOther: (formData.get("non_mrh_media_type_other") as string)?.trim() || null,
    gdprAcceptedAt: new Date(),
  };

  // ── RESUBMISSION PATH ─────────────────────────────────────────────────────
  if (resubmitId) {
    const [returnedApp] = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, resubmitId),
          eq(applications.contactEmail, email),
          or(eq(applications.status, "returned"), eq(applications.status, "pending"))
        )
      );

    if (!returnedApp) redirect("/applyb?error=invalid_token");

    await db.transaction(async (tx) => {
      // Atomic token consumption — prevents concurrent double-submission
      const [consumed] = await tx
        .update(magicLinkTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(magicLinkTokens.tokenHash, tokenHash),
            eq(magicLinkTokens.email, email),
            isNull(magicLinkTokens.usedAt),
            gt(magicLinkTokens.expiresAt, new Date())
          )
        )
        .returning({ id: magicLinkTokens.id });

      if (!consumed) {
        // Token was consumed by a concurrent request — abort
        redirect("/applyb?error=invalid_token");
      }

      const wasReturned = returnedApp.status === "returned";
      await tx
        .update(applications)
        .set({
          contactName,
          categoryPress,
          categoryPhoto,
          about,
          ...expandedFields,
          status: wasReturned ? "resubmitted" : "pending",
          resubmissionCount: wasReturned ? returnedApp.resubmissionCount + 1 : returnedApp.resubmissionCount,
          reviewNote: null,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, resubmitId));

      await tx.update(organizations)
        .set({ orgEmail: (formData.get("org_email") as string | null) || null })
        .where(eq(organizations.id, returnedApp.organizationId));

      await tx.insert(auditLog).values({
        actorType: "applicant",
        actorId: email,
        actorLabel: contactName,
        action: "application_resubmitted",
        applicationId: returnedApp.id,
        organizationId: returnedApp.organizationId,
      });
    });

    redirect(`/applyb/submitted?ref=${returnedApp.referenceNumber}&resubmit=1&email=${encodeURIComponent(email)}`);
  }

  // ── NEW APPLICATION PATH ───────────────────────────────────────────────────

  // Limit: max 10 applications per email address
  const [{ appCount }] = await db
    .select({ appCount: count() })
    .from(applications)
    .where(eq(applications.contactEmail, email));
  if (appCount >= 10) {
    redirect("/applyb?error=application_limit");
  }

  const orgName = (formData.get("org_name") as string).trim();
  // Accept either "US — United States" (datalist selection) or bare "US"
  const countryRaw = (formData.get("country") as string).trim();
  const country = countryRaw.split(" — ")[0].trim().toUpperCase();
  const nocRaw = (formData.get("noc_code") as string).trim();
  const nocCode = nocRaw.split(" — ")[0].trim().toUpperCase();

  if (!COUNTRY_CODE_SET.has(country)) {
    redirect("/applyb?error=invalid_country");
  }
  if (!NOC_CODE_SET.has(nocCode)) {
    redirect("/applyb?error=invalid_noc");
  }

  // Check if EoI window is closed for this NOC (absence of row = open)
  const [windowRow] = await db
    .select({ isOpen: nocEoiWindows.isOpen })
    .from(nocEoiWindows)
    .where(and(eq(nocEoiWindows.nocCode, nocCode), eq(nocEoiWindows.eventId, "LA28")));
  if (windowRow && !windowRow.isOpen) {
    redirect("/applyb?error=window_closed");
  }

  // Accept any value from the LA28 Apr 2026 Excel-aligned enum.
  // Type-safe cast is handled by the orgTypeEnum pgEnum at insert time.
  const orgType = formData.get("org_type") as
    | "print_media"
    | "press_agency"
    | "photo_agency"
    | "editorial_website"
    | "sport_specialist_website"
    | "photographer"
    | "freelance_journalist"
    | "freelance_photographer"
    | "sport_specialist_print"
    | "sport_specialist_photographer"
    | "non_mrh"
    | "other"
    // Legacy values still accepted for resubmission of existing rows
    | "media_print_online"
    | "media_broadcast"
    | "news_agency"
    | "freelancer"
    | "enr";
  const websiteRaw = (formData.get("website") as string)?.trim();
  const website = websiteRaw && /^https?:\/\/.+\..+/.test(websiteRaw) ? websiteRaw : null;

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

  // Org address fields (parsed before transaction)
  const orgAddress = (formData.get("address") as string)?.trim() || null;
  const orgAddress2 = (formData.get("address2") as string)?.trim() || null;
  const orgCity = (formData.get("city") as string)?.trim() || null;
  const orgStateProvince = (formData.get("state_province") as string)?.trim() || null;
  const orgPostalCode = (formData.get("postal_code") as string)?.trim() || null;

  const referenceNumber = await nextApplicationRef(nocCode);

  await db.transaction(async (tx) => {
    // Atomic token consumption — prevents concurrent double-submission
    const [consumed] = await tx
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(magicLinkTokens.tokenHash, tokenHash),
          eq(magicLinkTokens.email, email),
          isNull(magicLinkTokens.usedAt),
          gt(magicLinkTokens.expiresAt, new Date())
        )
      )
      .returning({ id: magicLinkTokens.id });

    if (!consumed) {
      redirect("/applyb?error=invalid_token");
    }

    let org;
    if (existingOrg) {
      org = existingOrg;
    } else {
      // CRIT-04: detect multi-territory but do NOT surface it in UI.
      // Flag is stored for future IOC analysis (Open Question #16).
      // Skip domain check for personal email providers and freelancers — shared
      // gmail/outlook etc. are coincidental and not meaningful cross-NOC signals.
      const skipDomainCheck = isPersonalEmailDomain(emailDomain) || orgType === "freelancer";
      const samedomainOrgs = skipDomainCheck ? [] : await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.emailDomain, emailDomain));

      const isMultiTerritory = samedomainOrgs.length > 0;

      [org] = await tx
        .insert(organizations)
        .values({
          name: orgName,
          country,
          nocCode,
          orgType,
          website,
          emailDomain,
          orgEmail: (formData.get("org_email") as string | null) || null,
          isMultiTerritoryFlag: isMultiTerritory,
          address: orgAddress,
          address2: orgAddress2,
          city: orgCity,
          stateProvince: orgStateProvince,
          postalCode: orgPostalCode,
        })
        .returning();
    }

    // Server-side invite lookup — never trust client-supplied invite_id.
    // The applicant's email was validated against the magic-link token above.
    // An invitation is linked when: it belongs to this email, was redeemed
    // (usedAt IS NOT NULL), and has not yet been linked to an application.
    const [linkedInvite] = await tx
      .select({ id: invitations.id, nocCode: invitations.nocCode })
      .from(invitations)
      .where(
        and(
          eq(invitations.recipientEmail, email),
          isNotNull(invitations.usedAt),
          isNull(invitations.acceptedAppId)
        )
      );

    if (linkedInvite?.nocCode && linkedInvite.nocCode !== nocCode) {
      redirect("/applyb?error=invite_noc_mismatch");
    }

    const [app] = await tx
      .insert(applications)
      .values({
        referenceNumber,
        organizationId: org.id,
        nocCode,
        contactName,
        contactEmail: email,
        categoryPress,
        categoryPhoto,
        about,
        ...expandedFields,
        preferredLanguage,
        status: "pending",
        entrySource: linkedInvite ? "invited" : "self_submitted",
      })
      .returning();

    // Link the invitation record to the newly created application.
    // Use .returning() to verify the update actually matched a row.
    if (linkedInvite) {
      const updated = await tx
        .update(invitations)
        .set({ acceptedAppId: app.id })
        .where(
          and(
            eq(invitations.id, linkedInvite.id),
            isNull(invitations.acceptedAppId)
          )
        )
        .returning({ id: invitations.id });

      if (updated.length === 0) {
        // Concurrent submission claimed this invite — degrade gracefully
        console.warn(
          `[submitApplication] invite ${linkedInvite.id} already claimed; ` +
          `app ${app.id} will be recorded as self_submitted`
        );
        await tx
          .update(applications)
          .set({ entrySource: "self_submitted" })
          .where(eq(applications.id, app.id));
      }
    }

    await tx.insert(auditLog).values([
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
  });

  redirect(`/applyb/submitted?ref=${referenceNumber}&email=${encodeURIComponent(email)}`);
}
