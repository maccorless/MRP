/**
 * Shared utilities for the Audit Trail page and export route.
 * Token parser, Drizzle WHERE condition builder, label/badge maps.
 */

import { and, or, eq, ilike, gte, lte, SQL } from "drizzle-orm";
import { auditLog } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditRow = {
  id: string;
  actorType: string;
  actorId: string | null;
  actorLabel: string | null;
  action: string;
  applicationId: string | null;
  organizationId: string | null;
  detail: string | null;
  createdAt: Date;
};

export type ParsedAuditQuery = {
  actor?: string;      // actor:kim   → ilike actorLabel
  action?: string;     // action:approved → eq action (validated)
  actorType?: string;  // type:noc_admin  → eq actorType (validated)
  dateExact?: string;  // date:2025-11-04 or date:11/4/2025
  dateFrom?: string;   // from:2025-11-01
  dateTo?: string;     // to:2025-11-30
  freeText?: string;   // bare words → ilike actorLabel OR detail
};

// ─── Enum validators (prevent invalid SQL from malformed query params) ────────

const AUDIT_ACTIONS = [
  "application_submitted", "application_resubmitted", "application_approved",
  "application_returned", "application_rejected", "email_verified", "admin_login",
  "duplicate_flag_raised", "export_generated", "pbn_submitted", "pbn_approved",
  "pbn_sent_to_acr", "quota_changed", "enr_submitted", "enr_decision_made",
  "sudo_initiated", "noc_direct_entry", "eoi_window_toggled",
  "application_unapproved", "application_unreturned", "pbn_unapproved", "enr_decision_revised",
] as const;

const ACTOR_TYPES = [
  "applicant", "noc_admin", "ioc_admin", "ocog_admin", "if_admin", "system",
] as const;

function isAuditAction(s: string): s is typeof AUDIT_ACTIONS[number] {
  return (AUDIT_ACTIONS as readonly string[]).includes(s);
}
function isActorType(s: string): s is typeof ACTOR_TYPES[number] {
  return (ACTOR_TYPES as readonly string[]).includes(s);
}

// ─── Label + badge maps (all 22 enum values) ──────────────────────────────────

export const ACTION_LABEL: Record<string, string> = {
  application_submitted:    "Application submitted",
  application_resubmitted:  "Application resubmitted",
  application_approved:     "Application approved",
  application_returned:     "Application returned",
  application_rejected:     "Application rejected",
  application_unapproved:   "Approval reversed",
  application_unreturned:   "Return reversed",
  email_verified:           "Email verified",
  admin_login:              "Admin sign-in",
  duplicate_flag_raised:    "Duplicate flagged",
  export_generated:         "Export generated",
  pbn_submitted:            "PBN submitted",
  pbn_approved:             "PBN approved",
  pbn_unapproved:           "PBN approval reversed",
  pbn_sent_to_acr:          "PBN sent to ACR",
  quota_changed:            "Quota changed",
  enr_submitted:            "ENR submitted",
  enr_decision_made:        "ENR decision made",
  enr_decision_revised:     "ENR decision revised",
  sudo_initiated:           "Sudo session started",
  noc_direct_entry:         "NOC direct entry",
  eoi_window_toggled:       "EoI window toggled",
};

export const ACTION_BADGE: Record<string, string> = {
  application_submitted:    "bg-gray-100 text-gray-700",
  application_resubmitted:  "bg-blue-100 text-blue-700",
  application_approved:     "bg-green-100 text-green-700",
  application_returned:     "bg-orange-100 text-orange-700",
  application_rejected:     "bg-red-100 text-red-700",
  application_unapproved:   "bg-orange-100 text-orange-700",
  application_unreturned:   "bg-orange-100 text-orange-700",
  email_verified:           "bg-gray-100 text-gray-600",
  admin_login:              "bg-slate-100 text-slate-600",
  duplicate_flag_raised:    "bg-purple-100 text-purple-700",
  export_generated:         "bg-teal-100 text-teal-700",
  pbn_submitted:            "bg-teal-100 text-teal-700",
  pbn_approved:             "bg-green-100 text-green-700",
  pbn_unapproved:           "bg-orange-100 text-orange-700",
  pbn_sent_to_acr:          "bg-cyan-100 text-cyan-700",
  quota_changed:            "bg-yellow-100 text-yellow-700",
  enr_submitted:            "bg-indigo-100 text-indigo-700",
  enr_decision_made:        "bg-green-100 text-green-700",
  enr_decision_revised:     "bg-orange-100 text-orange-700",
  sudo_initiated:           "bg-red-100 text-red-700",
  noc_direct_entry:         "bg-purple-100 text-purple-700",
  eoi_window_toggled:       "bg-yellow-100 text-yellow-700",
};

// ─── Token parser ─────────────────────────────────────────────────────────────

/** Parse a "q" search string into structured filter tokens. */
export function parseAuditQuery(q: string | undefined): ParsedAuditQuery {
  if (!q?.trim()) return {};
  const result: ParsedAuditQuery = {};
  const bare: string[] = [];

  for (const token of q.trim().split(/\s+/)) {
    const lc = token.toLowerCase();
    if (lc.startsWith("actor:"))  { result.actor     = token.slice(6);  continue; }
    if (lc.startsWith("action:")) { result.action    = token.slice(7);  continue; }
    if (lc.startsWith("type:"))   { result.actorType = token.slice(5);  continue; }
    if (lc.startsWith("date:"))   { result.dateExact = token.slice(5);  continue; }
    if (lc.startsWith("from:"))   { result.dateFrom  = token.slice(5);  continue; }
    if (lc.startsWith("to:"))     { result.dateTo    = token.slice(3);  continue; }
    bare.push(token);
  }

  if (bare.length > 0) result.freeText = bare.join(" ");
  return result;
}

// ─── Date parsing (accepts YYYY-MM-DD or M/D/YYYY) ────────────────────────────

function parseDate(s: string): Date | null {
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s + "T00:00:00Z");
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split("/");
    const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// ─── Condition builder ────────────────────────────────────────────────────────

/** Build Drizzle WHERE conditions from a parsed query. Returns undefined if no filters active. */
export function buildAuditConditions(parsed: ParsedAuditQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (parsed.actor) {
    conditions.push(ilike(auditLog.actorLabel, `%${parsed.actor}%`));
  }
  if (parsed.action && isAuditAction(parsed.action)) {
    conditions.push(eq(auditLog.action, parsed.action));
  }
  if (parsed.actorType && isActorType(parsed.actorType)) {
    conditions.push(eq(auditLog.actorType, parsed.actorType));
  }
  if (parsed.dateExact) {
    const d = parseDate(parsed.dateExact);
    if (d) {
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      conditions.push(gte(auditLog.createdAt, d));
      conditions.push(lte(auditLog.createdAt, next));
    }
  }
  if (parsed.dateFrom) {
    const d = parseDate(parsed.dateFrom);
    if (d) conditions.push(gte(auditLog.createdAt, d));
  }
  if (parsed.dateTo) {
    const d = parseDate(parsed.dateTo);
    if (d) {
      d.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(auditLog.createdAt, d));
    }
  }
  if (parsed.freeText) {
    const term = `%${parsed.freeText}%`;
    const freeCondition = or(
      ilike(auditLog.actorLabel, term),
      ilike(auditLog.actorId, term),
      ilike(auditLog.detail, term),
    );
    if (freeCondition) conditions.push(freeCondition);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Short human-readable description of active filters, for the page subtitle. */
export function describeAuditQuery(parsed: ParsedAuditQuery): string {
  const parts: string[] = [];
  if (parsed.actor)      parts.push(`actor "${parsed.actor}"`);
  if (parsed.action)     parts.push(`action "${parsed.action.replace(/_/g, " ")}"`);
  if (parsed.actorType)  parts.push(`type "${parsed.actorType.replace(/_/g, " ")}"`);
  if (parsed.dateExact)  parts.push(`date ${parsed.dateExact}`);
  if (parsed.dateFrom)   parts.push(`from ${parsed.dateFrom}`);
  if (parsed.dateTo)     parts.push(`to ${parsed.dateTo}`);
  if (parsed.freeText)   parts.push(`"${parsed.freeText}"`);
  return parts.length > 0 ? `· filtered by ${parts.join(", ")}` : "";
}
