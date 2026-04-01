"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  magicLinkTokens,
  organizations,
  applications,
  auditLog,
  reservedOrganizations,
  nocEoiWindows,
} from "@/db/schema";
import { generateToken, hashToken } from "@/lib/tokens";
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
          eq(applications.status, "returned")
        )
      );

    if (!returnedApp) redirect("/apply?error=invalid_token");

    await db
      .update(applications)
      .set({
        contactName,
        categoryPress,
        categoryPhoto,
        about,
        ...expandedFields,
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
    | "news_agency";
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

  let org;
  if (existingOrg) {
    org = existingOrg;
  } else {
    // CRIT-04: detect multi-territory but do NOT surface it in UI.
    // Flag is stored for future IOC analysis (Open Question #16).
    const samedomainOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.emailDomain, emailDomain));

    const isMultiTerritory = samedomainOrgs.length > 0;

    // Org address fields
    const orgAddress = (formData.get("address") as string)?.trim() || null;
    const orgAddress2 = (formData.get("address2") as string)?.trim() || null;
    const orgCity = (formData.get("city") as string)?.trim() || null;
    const orgStateProvince = (formData.get("state_province") as string)?.trim() || null;
    const orgPostalCode = (formData.get("postal_code") as string)?.trim() || null;
    const isFreelancer = formData.get("is_freelancer") === "yes" ? true : null;

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
        address: orgAddress,
        address2: orgAddress2,
        city: orgCity,
        stateProvince: orgStateProvince,
        postalCode: orgPostalCode,
        isFreelancer,
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
      categoryPress,
      categoryPhoto,
      about,
      ...expandedFields,
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
