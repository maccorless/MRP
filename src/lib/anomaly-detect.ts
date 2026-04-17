/**
 * Anomaly detection functions for the IOC dashboard.
 * All functions are pure and operate on already-fetched data rows.
 * detectWithinNocDuplicates queries the DB directly.
 */

import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, organizations } from "@/db/schema";

export interface ConcentrationFlag {
  nocCode: string;
  orgName: string;
  orgId: string;
  slots: number;
  quota: number;
  pct: number;
}

export interface InactiveNoc {
  nocCode: string;
  lastApprovalAt: Date | null;
  windowOpenedAt: Date;
  daysSince: number;
}

// Minimal shape required from application rows for concentration risk
interface AppRowForConcentration {
  nocCode: string;
  organizationId: string;
  orgName: string;
  requestedE: number | null;
  requestedEs: number | null;
  requestedEp: number | null;
  requestedEps: number | null;
  requestedEt: number | null;
  requestedEc: number | null;
}

// Minimal shape required from application rows for NOC inactivity
interface AppRowForInactivity {
  nocCode: string;
  status: string;
  reviewedAt: Date | null;
}

// Minimal shape required from application rows for cross-NOC duplicates
interface AppRowForDuplicates {
  orgName: string;
  isMultiTerritoryFlag: boolean | null;
}

/**
 * Detects organisations whose total requested slots exceed `threshold` fraction
 * of their NOC's assigned quota.
 *
 * @param appRows     Rows from the applications table (all statuses, all NOCs for the event)
 * @param quotaMap    Map of nocCode → total quota (sum of all category totals)
 * @param threshold   Fractional threshold, defaults to 0.30 (30%)
 */
export function detectConcentrationRisk(
  appRows: AppRowForConcentration[],
  quotaMap: Record<string, number>,
  threshold = 0.30,
): ConcentrationFlag[] {
  // Sum requested slots per (nocCode, organizationId) pair
  const orgRequests: Record<string, { nocCode: string; orgName: string; orgId: string; slots: number }> = {};

  for (const r of appRows) {
    const key = `${r.nocCode}:${r.organizationId}`;
    const slots =
      (r.requestedE ?? 0) +
      (r.requestedEs ?? 0) +
      (r.requestedEp ?? 0) +
      (r.requestedEps ?? 0) +
      (r.requestedEt ?? 0) +
      (r.requestedEc ?? 0);
    if (!orgRequests[key]) {
      orgRequests[key] = { nocCode: r.nocCode, orgName: r.orgName, orgId: r.organizationId, slots: 0 };
    }
    orgRequests[key].slots += slots;
  }

  const flags: ConcentrationFlag[] = [];
  for (const { nocCode, orgName, orgId, slots } of Object.values(orgRequests)) {
    const quota = quotaMap[nocCode] ?? 0;
    if (quota > 0 && slots / quota > threshold) {
      flags.push({ nocCode, orgName, orgId, slots, quota, pct: slots / quota });
    }
  }

  return flags.sort((a, b) => b.pct - a.pct);
}

/**
 * Detects NOCs that have an open EoI window but haven't had an approved
 * application in the last `thresholdDays` days (or ever since the window opened).
 *
 * @param appRows        Rows from the applications table
 * @param activeWindows  Map of nocCode → window openedAt date
 * @param thresholdDays  Inactivity threshold in days, defaults to 7
 */
export function detectInactiveNocs(
  appRows: AppRowForInactivity[],
  activeWindows: Map<string, Date>,
  thresholdDays = 7,
): InactiveNoc[] {
  if (activeWindows.size === 0) return [];

  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Find the most recent approval per NOC
  const lastApprovalByNoc: Record<string, Date> = {};
  for (const r of appRows) {
    if (r.status === "approved" && r.reviewedAt) {
      const existing = lastApprovalByNoc[r.nocCode];
      if (!existing || r.reviewedAt > existing) {
        lastApprovalByNoc[r.nocCode] = r.reviewedAt;
      }
    }
  }

  const inactive: InactiveNoc[] = [];
  for (const [nocCode, windowOpenedAt] of activeWindows.entries()) {
    const lastApproval = lastApprovalByNoc[nocCode] ?? null;

    // Not inactive if the window itself was opened less than thresholdDays ago
    if (now - windowOpenedAt.getTime() < thresholdMs) continue;

    if (!lastApproval) {
      // No approvals at all — inactive since window opened
      const daysSince = Math.floor((now - windowOpenedAt.getTime()) / (24 * 60 * 60 * 1000));
      inactive.push({ nocCode, lastApprovalAt: null, windowOpenedAt, daysSince });
    } else if (now - lastApproval.getTime() > thresholdMs) {
      const daysSince = Math.floor((now - lastApproval.getTime()) / (24 * 60 * 60 * 1000));
      inactive.push({ nocCode, lastApprovalAt: lastApproval, windowOpenedAt, daysSince });
    }
  }

  return inactive.sort((a, b) => b.daysSince - a.daysSince);
}

/**
 * Returns the unique org names of organisations flagged as multi-territory
 * (i.e. the same email domain appears under multiple NOCs).
 *
 * @param appRows  Rows from the applications table joined to organisations
 */
export function detectCrossNocDuplicates(appRows: AppRowForDuplicates[]): string[] {
  const names = new Set<string>();
  for (const r of appRows) {
    if (r.isMultiTerritoryFlag) {
      names.add(r.orgName);
    }
  }
  return [...names].sort();
}

/**
 * Returns the Set of organization IDs that share an email domain with another
 * org in the same NOC's applications for the given event.
 *
 * @param nocCode  The NOC code to scope the check to
 * @param eventId  The event identifier, defaults to "LA28"
 */
export async function detectWithinNocDuplicates(
  nocCode: string,
  eventId: string = "LA28",
): Promise<Set<string>> {
  const rows = await db
    .select({
      orgId: organizations.id,
      emailDomain: organizations.emailDomain,
    })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(
        eq(applications.nocCode, nocCode),
        eq(applications.eventId, eventId),
        isNotNull(organizations.emailDomain),
      ),
    );

  // Group by email domain
  const domainToOrgs = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.emailDomain) continue;
    const existing = domainToOrgs.get(row.emailDomain) ?? [];
    existing.push(row.orgId);
    domainToOrgs.set(row.emailDomain, existing);
  }

  // Return org IDs where the domain appears more than once
  const duplicateOrgIds = new Set<string>();
  for (const [, orgIds] of domainToOrgs) {
    if (orgIds.length > 1) {
      orgIds.forEach((id) => duplicateOrgIds.add(id));
    }
  }
  return duplicateOrgIds;
}
