/**
 * Anomaly detection functions for the IOC dashboard.
 * All functions are pure and operate on already-fetched data rows.
 * detectWithinNocDuplicates queries the DB directly.
 */

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { applications, dismissedDuplicatePairs, organizations } from "@/db/schema";

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

export type DuplicateSignal = "email_domain" | "contact_email" | "website_domain" | "org_name";

export interface DuplicatePairInfo {
  peerOrgId: string;
  signals: DuplicateSignal[];
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
 */
export function detectInactiveNocs(
  appRows: AppRowForInactivity[],
  activeWindows: Map<string, Date>,
  thresholdDays = 7,
): InactiveNoc[] {
  if (activeWindows.size === 0) return [];

  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

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
    if (now - windowOpenedAt.getTime() < thresholdMs) continue;
    if (!lastApproval) {
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
 * Returns the unique org names of organisations flagged as multi-territory.
 */
export function detectCrossNocDuplicates(appRows: AppRowForDuplicates[]): string[] {
  const names = new Set<string>();
  for (const r of appRows) {
    if (r.isMultiTerritoryFlag) names.add(r.orgName);
  }
  return [...names].sort();
}

// ─── Within-NOC duplicate detection ──────────────────────────────────────────

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "outlook.com", "hotmail.com", "yahoo.com",
  "icloud.com", "aol.com", "proton.me", "protonmail.com",
  "gmx.com", "mail.com", "live.com", "msn.com",
]);

export function isPersonalEmailDomain(domain: string | null | undefined): boolean {
  return !!domain && PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
}

const LEGAL_SUFFIX_RE = /\b(ltd|limited|inc|corp|corporation|llc|gmbh|pty|plc|bv|nv|sa|ag)\b\.?/gi;

function normalizeOrgName(name: string): string {
  return name
    .toLowerCase()
    .replace(LEGAL_SUFFIX_RE, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractWebsiteHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    return new URL(full).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

interface OrgRow {
  orgId: string;
  emailDomain: string | null;
  website: string | null;
  name: string;
  country: string | null;
  contactEmail: string;
  orgType: string | null;
}

function buildBucket(rows: OrgRow[], keyFn: (r: OrgRow) => string | null): Map<string, string[]> {
  const bucket = new Map<string, string[]>();
  for (const r of rows) {
    const key = keyFn(r);
    if (!key) continue;
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(r.orgId);
  }
  return bucket;
}

function addBucketSignal(
  pairSignals: Map<string, Set<DuplicateSignal>>,
  bucket: Map<string, string[]>,
  signal: DuplicateSignal,
): void {
  for (const [, orgIds] of bucket) {
    if (orgIds.length < 2) continue;
    for (let i = 0; i < orgIds.length; i++) {
      for (let j = i + 1; j < orgIds.length; j++) {
        const [a, b] = orgIds[i] < orgIds[j] ? [orgIds[i], orgIds[j]] : [orgIds[j], orgIds[i]];
        const key = `${a}:${b}`;
        if (!pairSignals.has(key)) pairSignals.set(key, new Set());
        pairSignals.get(key)!.add(signal);
      }
    }
  }
}

function computeRawPairSignals(rows: OrgRow[]): Map<string, Set<DuplicateSignal>> {
  const pairSignals = new Map<string, Set<DuplicateSignal>>();

  // Skip email_domain signal for personal email providers and freelancers —
  // shared gmail/outlook domains are coincidental, not indicative of duplicates.
  addBucketSignal(
    pairSignals,
    buildBucket(rows, (r) =>
      isPersonalEmailDomain(r.emailDomain) || r.orgType === "freelancer" ? null : r.emailDomain,
    ),
    "email_domain",
  );
  addBucketSignal(pairSignals, buildBucket(rows, (r) => r.contactEmail.toLowerCase()), "contact_email");
  addBucketSignal(pairSignals, buildBucket(rows, (r) => extractWebsiteHost(r.website)), "website_domain");
  addBucketSignal(
    pairSignals,
    buildBucket(rows, (r) => {
      if (!r.country) return null;
      const norm = normalizeOrgName(r.name);
      return norm ? `${norm}|${r.country}` : null;
    }),
    "org_name",
  );

  return pairSignals;
}

async function getDismissedPairs(nocCode: string, eventId: string): Promise<Set<string>> {
  const rows = await db
    .select({ orgIdA: dismissedDuplicatePairs.orgIdA, orgIdB: dismissedDuplicatePairs.orgIdB })
    .from(dismissedDuplicatePairs)
    .where(
      and(
        eq(dismissedDuplicatePairs.nocCode, nocCode),
        eq(dismissedDuplicatePairs.eventId, eventId),
      ),
    );
  return new Set(rows.map((r) => `${r.orgIdA}:${r.orgIdB}`));
}

async function fetchDuplicatePairMap(
  nocCode: string,
  eventId: string,
): Promise<Map<string, DuplicatePairInfo[]>> {
  const [rows, dismissed] = await Promise.all([
    db
      .select({
        orgId: organizations.id,
        emailDomain: organizations.emailDomain,
        website: organizations.website,
        name: organizations.name,
        country: organizations.country,
        contactEmail: applications.contactEmail,
        orgType: organizations.orgType,
      })
      .from(applications)
      .innerJoin(organizations, eq(applications.organizationId, organizations.id))
      .where(
        and(
          eq(applications.nocCode, nocCode),
          eq(applications.eventId, eventId),
          // Rejected applications are permanent NOC decisions and should no
          // longer participate in duplicate detection — the "other" half of
          // the pair is no longer a competing record.
          ne(applications.status, "rejected"),
        ),
      ),
    getDismissedPairs(nocCode, eventId),
  ]);

  const pairSignals = computeRawPairSignals(rows);

  const result = new Map<string, DuplicatePairInfo[]>();
  for (const [pairKey, signalSet] of pairSignals) {
    if (dismissed.has(pairKey)) continue;
    const colonIdx = pairKey.indexOf(":");
    const orgIdA = pairKey.slice(0, colonIdx);
    const orgIdB = pairKey.slice(colonIdx + 1);
    const signals = [...signalSet];

    if (!result.has(orgIdA)) result.set(orgIdA, []);
    result.get(orgIdA)!.push({ peerOrgId: orgIdB, signals });

    if (!result.has(orgIdB)) result.set(orgIdB, []);
    result.get(orgIdB)!.push({ peerOrgId: orgIdA, signals });
  }

  return result;
}

export async function detectWithinNocDuplicates(
  nocCode: string,
  eventId: string = "LA28",
): Promise<Set<string>> {
  const pairs = await fetchDuplicatePairMap(nocCode, eventId);
  return new Set(pairs.keys());
}

export async function detectWithinNocDuplicatePairs(
  nocCode: string,
  eventId: string = "LA28",
): Promise<Map<string, DuplicatePairInfo[]>> {
  return fetchDuplicatePairMap(nocCode, eventId);
}
