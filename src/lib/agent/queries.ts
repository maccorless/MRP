import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  auditLog,
  enrRequests,
  nocQuotas,
  orgSlotAllocations,
  organizations,
} from "@/db/schema";
import type { SessionPayload } from "@/lib/session";

const EVENT_ID = "LA28";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function clampLimit(n: number | undefined): number {
  return Math.min(n ?? DEFAULT_LIMIT, MAX_LIMIT);
}

/**
 * For NOC admins, always scope to their own NOC.
 * For IOC/OCOG/IF admins, use the requested nocCode or null (= all NOCs).
 */
function resolveNocCode(ctx: SessionPayload, requested?: string | null): string | null {
  if (ctx.role === "noc_admin") return ctx.nocCode;
  return requested ?? null;
}

// ─── Queue Summary ────────────────────────────────────────────────────────────

export type QueueSummary = {
  total: number;
  pending: number;
  resubmitted: number;
  approved: number;
  returned: number;
  rejected: number;
};

export async function getQueueSummary(
  ctx: SessionPayload,
  nocCode?: string | null,
): Promise<QueueSummary> {
  const noc = resolveNocCode(ctx, nocCode);

  const rows = await db
    .select({
      status: applications.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(applications)
    .where(
      and(
        eq(applications.eventId, EVENT_ID),
        noc ? eq(applications.nocCode, noc) : undefined,
      ),
    )
    .groupBy(applications.status);

  const out: QueueSummary = { total: 0, pending: 0, resubmitted: 0, approved: 0, returned: 0, rejected: 0 };
  for (const r of rows) {
    const s = r.status as keyof QueueSummary;
    if (s in out) out[s] = r.count;
    out.total += r.count;
  }
  return out;
}

// ─── List EOIs ────────────────────────────────────────────────────────────────

export type EoiListItem = {
  id: string;
  referenceNumber: string;
  status: string;
  orgName: string;
  orgType: string;
  nocCode: string;
  contactName: string;
  submittedAt: Date;
};

export type ListEoisFilters = {
  nocCode?: string | null;
  status?: string | null;
  orgName?: string | null;
  limit?: number;
  offset?: number;
};

export async function listEois(
  ctx: SessionPayload,
  filters: ListEoisFilters = {},
): Promise<{ items: EoiListItem[]; total: number }> {
  const noc = resolveNocCode(ctx, filters.nocCode);
  const limit = clampLimit(filters.limit);
  const offset = filters.offset ?? 0;

  const conditions = [
    eq(applications.eventId, EVENT_ID),
    noc ? eq(applications.nocCode, noc) : undefined,
    filters.status ? eq(applications.status, filters.status as "pending" | "approved" | "returned" | "rejected" | "resubmitted") : undefined,
    filters.orgName ? ilike(organizations.name, `%${filters.orgName}%`) : undefined,
  ].filter(Boolean);

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: applications.id,
        referenceNumber: applications.referenceNumber,
        status: applications.status,
        orgName: organizations.name,
        orgType: organizations.orgType,
        nocCode: applications.nocCode,
        contactName: applications.contactName,
        submittedAt: applications.submittedAt,
      })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(and(...(conditions as Parameters<typeof and>)))
      .orderBy(desc(applications.submittedAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(and(...(conditions as Parameters<typeof and>))),
  ]);

  return { items, total };
}

// ─── Get Single EOI ───────────────────────────────────────────────────────────

export async function getEoi(ctx: SessionPayload, id: string) {
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id));

  if (!app) return null;

  // NOC admin can only see their own NOC
  if (ctx.role === "noc_admin" && app.nocCode !== ctx.nocCode) return null;
  // IF admin: no cross-IF scoping implemented yet — block until it is
  if (ctx.role === "if_admin") return null;

  const [[org], [quota], [allocation], recentAudit] = await Promise.all([
    db.select().from(organizations).where(eq(organizations.id, app.organizationId)),
    db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, app.nocCode), eq(nocQuotas.eventId, EVENT_ID))),
    db
      .select()
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.organizationId, app.organizationId),
          eq(orgSlotAllocations.eventId, EVENT_ID),
        ),
      ),
    db
      .select()
      .from(auditLog)
      .where(eq(auditLog.applicationId, id))
      .orderBy(desc(auditLog.createdAt))
      .limit(10),
  ]);

  return { app, org: org ?? null, quota: quota ?? null, allocation: allocation ?? null, recentAudit };
}

// ─── Quota Summary ────────────────────────────────────────────────────────────

export type QuotaSummaryItem = {
  nocCode: string;
  category: string;
  total: number;
  allocated: number;
  utilization: number;
};

export async function getQuotaSummary(
  ctx: SessionPayload,
  nocCode?: string | null,
): Promise<QuotaSummaryItem[]> {
  const noc = resolveNocCode(ctx, nocCode);

  const quotaRows = await db
    .select()
    .from(nocQuotas)
    .where(
      and(
        eq(nocQuotas.eventId, EVENT_ID),
        noc ? eq(nocQuotas.nocCode, noc) : undefined,
      ),
    );

  const allocRows = await db
    .select({
      nocCode: orgSlotAllocations.nocCode,
      eSlots:   sql<number>`cast(sum(e_slots) as int)`,
      esSlots:  sql<number>`cast(sum(es_slots) as int)`,
      epSlots:  sql<number>`cast(sum(ep_slots) as int)`,
      epsSlots: sql<number>`cast(sum(eps_slots) as int)`,
      etSlots:  sql<number>`cast(sum(et_slots) as int)`,
      ecSlots:  sql<number>`cast(sum(ec_slots) as int)`,
    })
    .from(orgSlotAllocations)
    .where(
      and(
        eq(orgSlotAllocations.eventId, EVENT_ID),
        noc ? eq(orgSlotAllocations.nocCode, noc) : undefined,
      ),
    )
    .groupBy(orgSlotAllocations.nocCode);

  const allocMap = new Map(allocRows.map((r) => [r.nocCode, r]));

  const result: QuotaSummaryItem[] = [];
  for (const q of quotaRows) {
    const alloc = allocMap.get(q.nocCode);
    const cats: [string, number, number][] = [
      ["E",   q.eTotal,   alloc?.eSlots   ?? 0],
      ["Es",  q.esTotal,  alloc?.esSlots  ?? 0],
      ["EP",  q.epTotal,  alloc?.epSlots  ?? 0],
      ["EPs", q.epsTotal, alloc?.epsSlots ?? 0],
      ["ET",  q.etTotal,  alloc?.etSlots  ?? 0],
      ["EC",  q.ecTotal,  alloc?.ecSlots  ?? 0],
    ];
    for (const [cat, total, allocated] of cats) {
      result.push({
        nocCode: q.nocCode,
        category: cat,
        total,
        allocated,
        utilization: total > 0 ? Math.round((allocated / total) * 100) : 0,
      });
    }
  }
  return result;
}

// ─── PbN Summary ─────────────────────────────────────────────────────────────

export type PbnSummaryItem = {
  orgId: string;
  orgName: string;
  pbnState: string;
  eSlots: number;
  epSlots: number;
  etSlots: number;
  ecSlots: number;
};

export async function getPbnSummary(
  ctx: SessionPayload,
  nocCode?: string | null,
): Promise<PbnSummaryItem[]> {
  const noc = resolveNocCode(ctx, nocCode);
  if (!noc) return [];

  const rows = await db
    .select({
      orgId: orgSlotAllocations.organizationId,
      orgName: organizations.name,
      pbnState: orgSlotAllocations.pbnState,
      eSlots:   orgSlotAllocations.eSlots,
      epSlots:  orgSlotAllocations.epSlots,
      etSlots:  orgSlotAllocations.etSlots,
      ecSlots:  orgSlotAllocations.ecSlots,
    })
    .from(orgSlotAllocations)
    .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
    .where(
      and(
        eq(orgSlotAllocations.nocCode, noc),
        eq(orgSlotAllocations.eventId, EVENT_ID),
      ),
    )
    .orderBy(organizations.name);

  return rows;
}

// ─── ENR Status ──────────────────────────────────────────────────────────────

export async function getEnrStatus(ctx: SessionPayload, nocCode?: string | null) {
  const noc = resolveNocCode(ctx, nocCode);
  if (!noc) return [];

  return db
    .select({
      id: enrRequests.id,
      orgName: organizations.name,
      priorityRank: enrRequests.priorityRank,
      slotsRequested: enrRequests.slotsRequested,
      slotsGranted: enrRequests.slotsGranted,
      decision: enrRequests.decision,
    })
    .from(enrRequests)
    .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
    .where(
      and(eq(enrRequests.nocCode, noc), eq(enrRequests.eventId, EVENT_ID)),
    )
    .orderBy(enrRequests.priorityRank);
}

// ─── List Orgs ────────────────────────────────────────────────────────────────

export type ListOrgsFilters = {
  nocCode?: string | null;
  orgType?: string | null;
  country?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
};

export async function listOrgs(ctx: SessionPayload, filters: ListOrgsFilters = {}) {
  const noc = resolveNocCode(ctx, filters.nocCode);
  const limit = clampLimit(filters.limit);
  const offset = filters.offset ?? 0;

  const conditions = [
    eq(organizations.eventId, EVENT_ID),
    noc ? eq(organizations.nocCode, noc) : undefined,
    filters.orgType ? sql`${organizations.orgType} = ${filters.orgType}` : undefined,
    filters.country ? eq(organizations.country, filters.country) : undefined,
    filters.status ? sql`${organizations.status} = ${filters.status}` : undefined,
  ].filter(Boolean);

  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      orgType: organizations.orgType,
      country: organizations.country,
      nocCode: organizations.nocCode,
      status: organizations.status,
      website: organizations.website,
    })
    .from(organizations)
    .where(and(...(conditions as Parameters<typeof and>)))
    .orderBy(organizations.name)
    .limit(limit)
    .offset(offset);
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditLogFilters = {
  actorId?: string | null;
  action?: string | null;
  applicationId?: string | null;
  fromDate?: Date | null;
  toDate?: Date | null;
  limit?: number;
  offset?: number;
};

export async function getAuditLog(ctx: SessionPayload, filters: AuditLogFilters = {}) {
  const limit = clampLimit(filters.limit);
  const offset = filters.offset ?? 0;

  const conditions = [
    filters.actorId ? eq(auditLog.actorId, filters.actorId) : undefined,
    filters.action ? sql`${auditLog.action} = ${filters.action}` : undefined,
    filters.applicationId ? eq(auditLog.applicationId, filters.applicationId) : undefined,
    filters.fromDate ? gte(auditLog.createdAt, filters.fromDate) : undefined,
    filters.toDate ? lte(auditLog.createdAt, filters.toDate) : undefined,
  ].filter(Boolean);

  // NOC admins are scoped: join to applications and filter by nocCode
  if (ctx.role === "noc_admin" && ctx.nocCode) {
    return db
      .select({
        id: auditLog.id,
        actorType: auditLog.actorType,
        actorId: auditLog.actorId,
        actorLabel: auditLog.actorLabel,
        action: auditLog.action,
        applicationId: auditLog.applicationId,
        detail: auditLog.detail,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .innerJoin(applications, eq(auditLog.applicationId, applications.id))
      .where(
        and(
          eq(applications.nocCode, ctx.nocCode),
          ...(conditions as Parameters<typeof and>),
        ),
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select({
      id: auditLog.id,
      actorType: auditLog.actorType,
      actorId: auditLog.actorId,
      actorLabel: auditLog.actorLabel,
      action: auditLog.action,
      applicationId: auditLog.applicationId,
      detail: auditLog.detail,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);
}
