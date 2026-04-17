"use server";

import { redirect } from "next/navigation";
import { eq, and, gte, count, isNull, isNotNull, gt, or } from "drizzle-orm";
import { db } from "@/db";
import {
  magicLinkTokens,
  organizations,
  applications,
  auditLog,
  reservedOrganizations,
  nocEoiWindows,
  invitations,
} from "@/db/schema";

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
    redirect("/apply?error=invalid_email");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Per-email rate limit: max 5 token requests per hour
  const [{ emailCount }] = await db
    .select({ emailCount: count() })
    .from(magicLinkTokens)
    .where(and(eq(magicLinkTokens.email, email), gte(magicLinkTokens.createdAt, oneHourAgo)));
  if (emailCount >= 5) redirect("/apply?error=rate_limited");

  // Per-IP rate limit: max 15 token requests per hour
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? null;
  if (ip) {
    const [{ ipCount }] = await db
      .select({ ipCount: count() })
      .from(magicLinkTokens)
      .where(and(eq(magicLinkTokens.ipAddress, ip), gte(magicLinkTokens.createdAt, oneHourAgo)));
    if (ipCount >= 15) redirect("/apply?error=rate_limited");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS ?? "24", 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt, ipAddress: ip });

  redirect(`/apply/verify?token=${token}&email=${encodeURIComponent(email)}`);
}

export async function submitApplication(formData: FormData) {
  const token = (formData.get("token") as string)?.toUpperCase().trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const resubmitId = (formData.get("resubmit_id") as string) || null;

  if (!token || !email) redirect("/apply");

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
    redirect("/apply?error=invalid_token");
  }

  // Common form fields
  const contactFirstName = (formData.get("contact_first_name") as string)?.trim() || "";
  const contactLastName = (formData.get("contact_last_name") as string)?.trim() || "";
  const contactName = `${contactFirstName} ${contactLastName}`.trim() || (formData.get("contact_name") as string)?.trim() || "";
  const contactTitle = (formData.get("contact_title") as string)?.trim() || null;
  const contactPhone = (formData.get("contact_phone") as string)?.trim() || null;
  const contactCell = (formData.get("contact_cell") as string)?.trim() || null;

  // Secondary contact
  const secondaryFirstName = (formData.get("secondary_first_name") as string)?.trim() || null;
  const secondaryLastName = (formData.get("secondary_last_name") as string)?.trim() || null;
  const secondaryTitle = (formData.get("secondary_title") as string)?.trim() || null;
  const secondaryEmail = (formData.get("secondary_email") as string)?.trim() || null;
  const secondaryPhone = (formData.get("secondary_phone") as string)?.trim() || null;
  const secondaryCell = (formData.get("secondary_cell") as string)?.trim() || null;

  // Category + quantities
  const cats = parseCategorySelections(formData);
  const quantities = parseRequestedQuantities(formData, cats);
  const { categoryPress, categoryPhoto } = deriveLegacyFlags(cats);
  const about = (formData.get("about") as string).trim();

  // Publication details
  const publicationTypesRaw = formData.getAll("publication_types") as string[];
  const publicationTypes = publicationTypesRaw.length > 0 ? publicationTypesRaw : null;
  const circulation = (formData.get("circulation") as string)?.trim() || null;
  const publicationFrequency = (formData.get("publication_frequency") as string)?.trim() || null;
  const sportsToCover = (formData.get("sports_to_cover") as string)?.trim() || null;
  const sportsSpecificSport = (formData.get("sports_specific_sport") as string | null)?.trim() || null;

  // Accreditation history
  const priorOlympicRaw = formData.get("prior_olympic") as string | null;
  const priorOlympic = priorOlympicRaw === "yes" ? true : priorOlympicRaw === "no" ? false : null;
  const priorOlympicYears = (formData.get("prior_olympic_years") as string)?.trim() || null;
  const priorParalympicRaw = formData.get("prior_paralympic") as string | null;
  const priorParalympic = priorParalympicRaw === "yes" ? true : priorParalympicRaw === "no" ? false : null;
  const priorParalympicYears = (formData.get("prior_paralympic_years") as string)?.trim() || null;
  const pastCoverageExamples = (formData.get("past_coverage_examples") as string)?.trim() || null;
  const additionalComments = (formData.get("additional_comments") as string)?.trim() || null;

  // Flags
  const accessibilityNeeds = formData.get("accessibility_needs") === "yes" ? true : null;

  // Must select at least one category
  if (!Object.values(cats).some(Boolean)) {
    redirect("/apply?error=invalid_category");
  }

  // All expanded fields for insert/update
  const expandedFields = {
    contactFirstName: contactFirstName || null,
    contactLastName: contactLastName || null,
    contactTitle,
    contactPhone,
    contactCell,
    secondaryFirstName,
    secondaryLastName,
    secondaryTitle,
    secondaryEmail,
    secondaryPhone,
    secondaryCell,
    // Per-category E accreditation flags + quantities
    categoryE:   cats.E,
    categoryEs:  cats.Es,
    categoryEp:  cats.EP,
    categoryEps: cats.EPs,
    categoryEt:  cats.ET,
    categoryEc:  cats.EC,
    requestedE:   quantities.E   ?? null,
    requestedEs:  quantities.Es  ?? null,
    requestedEp:  quantities.EP  ?? null,
    requestedEps: quantities.EPs ?? null,
    requestedEt:  quantities.ET  ?? null,
    requestedEc:  quantities.EC  ?? null,
    publicationTypes,
    circulation,
    publicationFrequency,
    sportsToCover,
    sportsSpecificSport,
    priorOlympic,
    priorOlympicYears,
    priorParalympic,
    priorParalympicYears,
    pastCoverageExamples,
    additionalComments,
    accessibilityNeeds,
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

    if (!returnedApp) redirect("/apply?error=invalid_token");

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
        redirect("/apply?error=invalid_token");
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

      await tx.insert(auditLog).values({
        actorType: "applicant",
        actorId: email,
        actorLabel: contactName,
        action: "application_resubmitted",
        applicationId: returnedApp.id,
        organizationId: returnedApp.organizationId,
      });
    });

    redirect(`/apply/submitted?ref=${returnedApp.referenceNumber}&resubmit=1&email=${encodeURIComponent(email)}`);
  }

  // ── NEW APPLICATION PATH ───────────────────────────────────────────────────

  // Limit: max 10 applications per email address
  const [{ appCount }] = await db
    .select({ appCount: count() })
    .from(applications)
    .where(eq(applications.contactEmail, email));
  if (appCount >= 10) {
    redirect("/apply?error=application_limit");
  }

  const orgName = (formData.get("org_name") as string).trim();
  // Accept either "US — United States" (datalist selection) or bare "US"
  const countryRaw = (formData.get("country") as string).trim();
  const country = countryRaw.split(" — ")[0].trim().toUpperCase();
  const nocRaw = (formData.get("noc_code") as string).trim();
  const nocCode = nocRaw.split(" — ")[0].trim().toUpperCase();

  if (!COUNTRY_CODE_SET.has(country)) {
    redirect("/apply?error=invalid_country");
  }
  if (!NOC_CODE_SET.has(nocCode)) {
    redirect("/apply?error=invalid_noc");
  }

  // Check if EoI window is closed for this NOC (absence of row = open)
  const [windowRow] = await db
    .select({ isOpen: nocEoiWindows.isOpen })
    .from(nocEoiWindows)
    .where(and(eq(nocEoiWindows.nocCode, nocCode), eq(nocEoiWindows.eventId, "LA28")));
  if (windowRow && !windowRow.isOpen) {
    redirect("/apply?error=window_closed");
  }

  const orgType = formData.get("org_type") as
    | "media_print_online"
    | "media_broadcast"
    | "news_agency"
    | "freelancer";
  const websiteRaw = (formData.get("website") as string)?.trim();
  const website = websiteRaw || null;

  const emailDomain = email.split("@")[1];

  // Block reserved IOC-direct organizations (AFP, AP, Reuters, Xinhua, etc.)
  const [reservedMatch] = await db
    .select({ name: reservedOrganizations.name })
    .from(reservedOrganizations)
    .where(
      and(
        eq(reservedOrganizations.eventId, "LA28"),
        eq(reservedOrganizations.emailDomain, emailDomain)
      )
    );
  if (reservedMatch) {
    redirect("/apply?error=reserved_org");
  }

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
      redirect("/apply?error=invalid_token");
    }

    let org;
    if (existingOrg) {
      org = existingOrg;
    } else {
      // CRIT-04: detect multi-territory but do NOT surface it in UI.
      // Flag is stored for future IOC analysis (Open Question #16).
      const samedomainOrgs = await tx
        .select()
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
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.recipientEmail, email),
          isNotNull(invitations.usedAt),
          isNull(invitations.acceptedAppId)
        )
      );

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

  redirect(`/apply/submitted?ref=${referenceNumber}&email=${encodeURIComponent(email)}`);
}
