import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  organizations,
  auditLog,
  nocQuotas,
  orgSlotAllocations,
} from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { sumAllocations } from "@/lib/quota-calc";

/**
 * Returns full application detail for the NOC drawer view.
 *
 * Mirrors the queries used by /admin/noc/[id]/page.tsx so the drawer can render
 * the same sections without the caller having to hit multiple endpoints.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireNocSession();
  const { id } = await params;

  const [row] = await db
    .select({ app: applications, org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(eq(applications.id, id), eq(applications.nocCode, session.nocCode)),
    );

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [logs, quotaRow, existingAllocs] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(eq(auditLog.applicationId, id))
      .orderBy(asc(auditLog.createdAt)),
    db
      .select()
      .from(nocQuotas)
      .where(
        and(
          eq(nocQuotas.nocCode, session.nocCode),
          eq(nocQuotas.eventId, "LA28"),
        ),
      ),
    db
      .select({
        eSlots: orgSlotAllocations.eSlots,
        esSlots: orgSlotAllocations.esSlots,
        epSlots: orgSlotAllocations.epSlots,
        epsSlots: orgSlotAllocations.epsSlots,
        etSlots: orgSlotAllocations.etSlots,
        ecSlots: orgSlotAllocations.ecSlots,
      })
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.nocCode, session.nocCode),
          eq(orgSlotAllocations.eventId, "LA28"),
        ),
      ),
  ]);

  return NextResponse.json({
    app: row.app,
    org: row.org,
    logs,
    quota: quotaRow[0] ?? null,
    allocated: sumAllocations(existingAllocs),
  });
}
