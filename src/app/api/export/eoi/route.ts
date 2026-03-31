import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
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

  // Optional status filter from query params
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = db
    .select({
      referenceNumber: applications.referenceNumber,
      nocCode: applications.nocCode,
      orgName: organizations.name,
      country: organizations.country,
      orgType: organizations.orgType,
      emailDomain: organizations.emailDomain,
      website: organizations.website,
      contactName: applications.contactName,
      contactEmail: applications.contactEmail,
      contactTitle: applications.contactTitle,
      contactPhone: applications.contactPhone,
      secondaryName: applications.secondaryFirstName,
      secondaryLastName: applications.secondaryLastName,
      secondaryEmail: applications.secondaryEmail,
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
      priorOlympic: applications.priorOlympic,
      priorOlympicYears: applications.priorOlympicYears,
      priorParalympic: applications.priorParalympic,
      priorParalympicYears: applications.priorParalympicYears,
      status: applications.status,
      resubmissionCount: applications.resubmissionCount,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
      internalNote: applications.internalNote,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .orderBy(asc(applications.nocCode), asc(applications.referenceNumber))
    .$dynamic();

  if (nocFilter) {
    query = query.where(eq(applications.nocCode, nocFilter));
  }

  const rows = await query;

  // Apply status filter in JS (simpler than dynamic where chaining)
  const filtered = statusFilter
    ? rows.filter((r) => r.status === statusFilter)
    : rows;

  const header = [
    "Reference", "NOC", "Organisation", "Country", "Org Type",
    "Email Domain", "Website",
    "Contact Name", "Contact Email", "Contact Title", "Contact Phone",
    "Secondary Contact", "Secondary Email",
    "Categories", "E Req", "Es Req", "EP Req", "EPs Req", "ET Req", "EC Req",
    "Publication Types", "Circulation", "Pub Frequency", "Sports to Cover",
    "Prior Olympic", "Olympic Years", "Prior Paralympic", "Paralympic Years",
    "Status", "About", "Resubmissions", "Submitted", "Reviewed",
    ...(isNoc ? ["Internal Note"] : []),
  ];

  const csvRows = filtered.map((r) => {
    const pubTypes = (r.publicationTypes as string[] | null) ?? [];
    return [
      r.referenceNumber, r.nocCode, r.orgName, r.country, r.orgType,
      r.emailDomain, r.website,
      r.contactName, r.contactEmail, r.contactTitle, r.contactPhone,
      [r.secondaryName, r.secondaryLastName].filter(Boolean).join(" "), r.secondaryEmail,
      categoryDisplayLabel(r.categoryE, r.categoryEs, r.categoryEp, r.categoryEps, r.categoryEt, r.categoryEc),
      r.requestedE, r.requestedEs, r.requestedEp, r.requestedEps, r.requestedEt, r.requestedEc,
      pubTypes.join(", "), r.circulation, r.publicationFrequency, r.sportsToCover,
      r.priorOlympic === true ? "Yes" : r.priorOlympic === false ? "No" : "",
      r.priorOlympicYears,
      r.priorParalympic === true ? "Yes" : r.priorParalympic === false ? "No" : "",
      r.priorParalympicYears,
      r.status, r.about, r.resubmissionCount,
      r.submittedAt.toISOString(),
      r.reviewedAt?.toISOString() ?? "",
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
      "Content-Disposition": `attachment; filename="mrp-${prefix}-${date}.csv"`,
    },
  });
}
