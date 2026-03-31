import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations, auditLog } from "@/db/schema";
import { getSession } from "@/lib/session";
import { categoryDisplayLabel } from "@/lib/category";
import { csvEscape } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  if (!session || !session.role.startsWith("ioc_")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      referenceNumber: applications.referenceNumber,
      nocCode: applications.nocCode,
      orgName: organizations.name,
      country: organizations.country,
      orgType: organizations.orgType,
      emailDomain: organizations.emailDomain,
      website: organizations.website,
      commonCodesId: organizations.commonCodesId,
      contactName: applications.contactName,
      contactEmail: applications.contactEmail,
      categoryE:   applications.categoryE,
      categoryEs:  applications.categoryEs,
      categoryEp:  applications.categoryEp,
      categoryEps: applications.categoryEps,
      categoryEt:  applications.categoryEt,
      categoryEc:  applications.categoryEc,
      about: applications.about,
      resubmissionCount: applications.resubmissionCount,
      submittedAt: applications.submittedAt,
      reviewedAt: applications.reviewedAt,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(eq(applications.status, "approved"))
    .orderBy(asc(applications.nocCode), asc(applications.referenceNumber));

  const header = [
    "Reference", "NOC", "Organization", "Country", "Org Type",
    "Email Domain", "Website", "Common Codes ID",
    "Contact Name", "Contact Email", "Category", "About",
    "Resubmission Count", "Submitted", "Reviewed",
  ].map(csvEscape).join(",");

  const csvRows = rows.map((r) =>
    [
      r.referenceNumber, r.nocCode, r.orgName, r.country, r.orgType,
      r.emailDomain, r.website, r.commonCodesId,
      r.contactName, r.contactEmail, categoryDisplayLabel(r.categoryE, r.categoryEs, r.categoryEp, r.categoryEps, r.categoryEt, r.categoryEc), r.about,
      String(r.resubmissionCount),
      r.submittedAt.toISOString(),
      r.reviewedAt?.toISOString() ?? "",
    ].map(csvEscape).join(",")
  );

  const csv = [header, ...csvRows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  // Write audit log entry
  await db.insert(auditLog).values({
    actorType: session.role.startsWith("ioc_") ? "ioc_admin" : "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "export_generated",
    detail: `PBN export — ${rows.length} approved applications`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mrp-pbn-${date}.csv"`,
    },
  });
}
