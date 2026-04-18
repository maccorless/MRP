import { NextResponse } from "next/server";
import { eq, asc, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { buildCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // NOC admins see their own NOC; IOC/OCOG see all
  const isNoc = session.role === "noc_admin" && session.nocCode;
  const nocFilter = isNoc ? session.nocCode : null;

  // Optional status filter from query params — allowlist to prevent log injection
  const { searchParams } = new URL(request.url);
  const VALID_STATUSES = ["pending", "approved", "returned", "resubmitted", "rejected"] as const;
  const rawStatus = searchParams.get("status");
  if (rawStatus && !(VALID_STATUSES as readonly string[]).includes(rawStatus)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const statusFilter = rawStatus as typeof VALID_STATUSES[number] | null;

  let query = db
    .select({
      referenceNumber: applications.referenceNumber,
      nocCode: applications.nocCode,
      orgName: organizations.name,
      country: organizations.country,
      orgType: organizations.orgType,
      emailDomain: organizations.emailDomain,
      website: organizations.website,
      // Organisation address
      address: organizations.address,
      address2: organizations.address2,
      city: organizations.city,
      stateProvince: organizations.stateProvince,
      postalCode: organizations.postalCode,
      contactFirstName: applications.contactFirstName,
      contactLastName: applications.contactLastName,
      contactName: applications.contactName,
      contactEmail: applications.contactEmail,
      contactTitle: applications.contactTitle,
      contactPhone: applications.contactPhone,
      contactCell: applications.contactCell,
      secondaryName: applications.secondaryFirstName,
      secondaryLastName: applications.secondaryLastName,
      secondaryTitle: applications.secondaryTitle,
      secondaryEmail: applications.secondaryEmail,
      secondaryPhone: applications.secondaryPhone,
      secondaryCell: applications.secondaryCell,
      categoryE:   applications.categoryE,
      categoryEs:  applications.categoryEs,
      categoryEp:  applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt:  applications.categoryEt,
      categoryEc:  applications.categoryEc,
      requestedE:   applications.requestedE,
      requestedEs:  applications.requestedEs,
      requestedEp:  applications.requestedEp,
      requestedEps: applications.requestedEps,
      requestedEt:  applications.requestedEt,
      requestedEc:  applications.requestedEc,
      about: applications.about,
      publicationTypes: applications.publicationTypes,
      circulation: applications.circulation,
      publicationFrequency: applications.publicationFrequency,
      sportsToCover: applications.sportsToCover,
      sportsSpecificSport: applications.sportsSpecificSport,
      priorOlympic: applications.priorOlympic,
      priorOlympicYears: applications.priorOlympicYears,
      priorParalympic: applications.priorParalympic,
      priorParalympicYears: applications.priorParalympicYears,
      status: applications.status,
      resubmissionCount: applications.resubmissionCount,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      internalNote: applications.internalNote,
      orgEmail: organizations.orgEmail,
      orgTypeOther: applications.orgTypeOther,
      onlineUniqueVisitors: applications.onlineUniqueVisitors,
      geographicalCoverage: applications.geographicalCoverage,
      socialMediaAccounts: applications.socialMediaAccounts,
      pressCard: applications.pressCard,
      pressCardIssuer: applications.pressCardIssuer,
      enrProgrammingType: applications.enrProgrammingType,
      pastCoverageExamples: applications.pastCoverageExamples,
      additionalComments: applications.additionalComments,
      accessibilityNeeds: applications.accessibilityNeeds,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .orderBy(asc(applications.nocCode), asc(applications.referenceNumber))
    .$dynamic();

  const conditions = [];
  if (nocFilter) conditions.push(eq(applications.nocCode, nocFilter));
  if (statusFilter) conditions.push(eq(applications.status, statusFilter));
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }

  const filtered = await query;

  const header = [
    "Reference", "NOC", "Organisation", "Country", "Org Type",
    "Email Domain", "Website",
    "Address", "Address 2", "City", "State/Province", "Postal Code",
    "Contact First Name", "Contact Last Name", "Contact Name",
    "Contact Email", "Contact Title", "Contact Phone", "Contact Cell",
    "Secondary First Name", "Secondary Last Name", "Secondary Title",
    "Secondary Email", "Secondary Phone", "Secondary Cell",
    "Categories", "E Req", "Es Req", "EP Req", "EPs Req", "ET Req", "EC Req",
    "Publication Types", "Circulation", "Pub Frequency", "Sports to Cover", "Sport (Es/EPs)",
    "Prior Olympic", "Olympic Years", "Prior Paralympic", "Paralympic Years",
    "Past Coverage Examples",
    "Status", "About", "Resubmissions", "Submitted", "Reviewed",
    "Org Email", "Org Type Other", "Online Unique Visitors", "Geographical Coverage",
    "Social Media Accounts", "Press Card", "Press Card Issuer", "ENR Programming Type",
    "Additional Comments",
    "Accessibility Needs",
    ...(isNoc ? ["Internal Note"] : []),
  ];

  const csvRows = filtered.map((r) => {
    const pubTypes = (r.publicationTypes as string[] | null) ?? [];
    return [
      r.referenceNumber, r.nocCode, r.orgName, r.country, r.orgType,
      r.emailDomain, r.website,
      r.address ?? "", r.address2 ?? "", r.city ?? "", r.stateProvince ?? "", r.postalCode ?? "",
      r.contactFirstName ?? "", r.contactLastName ?? "", r.contactName,
      r.contactEmail, r.contactTitle, r.contactPhone, r.contactCell ?? "",
      r.secondaryName ?? "", r.secondaryLastName ?? "", r.secondaryTitle ?? "",
      r.secondaryEmail ?? "", r.secondaryPhone ?? "", r.secondaryCell ?? "",
      categoryDisplayLabel(r.categoryE, r.categoryEs, r.categoryEp, r.categoryEps, r.categoryEt, r.categoryEc),
      r.requestedE, r.requestedEs, r.requestedEp, r.requestedEps, r.requestedEt, r.requestedEc,
      pubTypes.join(", "), r.circulation, r.publicationFrequency, r.sportsToCover, r.sportsSpecificSport ?? "",
      r.priorOlympic === true ? "Yes" : r.priorOlympic === false ? "No" : "",
      r.priorOlympicYears,
      r.priorParalympic === true ? "Yes" : r.priorParalympic === false ? "No" : "",
      r.priorParalympicYears,
      r.pastCoverageExamples ?? "",
      r.status, r.about, r.resubmissionCount,
      r.submittedAt.toISOString(),
      r.reviewedAt?.toISOString() ?? "",
      r.orgEmail ?? "",
      r.orgTypeOther ?? "",
      r.onlineUniqueVisitors ?? "",
      r.geographicalCoverage ?? "",
      r.socialMediaAccounts ?? "",
      r.pressCard === true ? "Yes" : r.pressCard === false ? "No" : "",
      r.pressCardIssuer ?? "",
      r.enrProgrammingType ?? "",
      r.additionalComments ?? "",
      r.accessibilityNeeds === true ? "Yes" : r.accessibilityNeeds === false ? "No" : "",
      ...(isNoc ? [r.internalNote] : []),
    ];
  });

  const csv = buildCsv(header, csvRows);
  const date = new Date().toISOString().slice(0, 10);
  const prefix = nocFilter ? `eoi-${nocFilter}` : "eoi-all";

  await db.insert(auditLog).values({
    actorType: session.role.startsWith("ioc_") ? "ioc_admin" : "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `EoI export — ${filtered.length} applications${statusFilter ? ` (${statusFilter})` : ""}`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prp-${prefix}-${date}.csv"`,
    },
  });
}
