/**
 * Shared helpers for integration tests.
 * Tests run against the real DB configured in .env.local.
 * All test data uses a T_ prefix and is cleaned up in afterEach.
 */

import { db } from "@/db";
import {
  magicLinkTokens,
  organizations,
  applications,
  orgSlotAllocations,
  nocQuotas,
  enrRequests,
  auditLog,
  adminUsers,
  sudoTokens,
} from "@/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import type { SessionPayload } from "@/lib/session";
import { hashToken } from "@/lib/tokens";

// ─── Redirect capture ─────────────────────────────────────────────────────────

export type Redirect = { url: string };

export function expectRedirect(err: unknown): Redirect {
  if (err instanceof Error && err.message.startsWith("REDIRECT:")) {
    return { url: err.message.slice("REDIRECT:".length) };
  }
  throw err; // not a redirect — rethrow
}

export async function callAction<T>(
  action: () => Promise<T>
): Promise<{ result?: T; redirect?: Redirect; error?: Error }> {
  try {
    const result = await action();
    return { result };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("REDIRECT:")) {
      return { redirect: { url: err.message.slice("REDIRECT:".length) } };
    }
    if (err instanceof Error) return { error: err };
    throw err;
  }
}

// ─── Cookie / session mocking ─────────────────────────────────────────────────
//
// Each test file must define its own mockCookieStore and vi.mock("next/headers")
// at the top level — vi.mock is hoisted and captures the file-local store.
// See any uc-*.test.ts for the required boilerplate.
//
// Helpers here are utilities only; they do NOT call vi.mock themselves.

// ─── Test session payloads ────────────────────────────────────────────────────

export const SESSIONS = {
  nocUSA: {
    userId: "test-noc-usa",
    email: "noc.admin@usopc.org",
    role: "noc_admin" as const,
    nocCode: "USA",
    ifCode: null,
    displayName: "S. Kim (USOPC)",
  },
  nocGBR: {
    userId: "test-noc-gbr",
    email: "noc.admin@teamgb.org",
    role: "noc_admin" as const,
    nocCode: "GBR",
    ifCode: null,
    displayName: "R. Clarke (Team GB)",
  },
  ocog: {
    userId: "test-ocog",
    email: "ocog.admin@la28.org",
    role: "ocog_admin" as const,
    nocCode: null,
    ifCode: null,
    displayName: "LA28 OCOG Admin",
  },
  ioc: {
    userId: "test-ioc",
    email: "ioc.admin@olympics.org",
    role: "ioc_admin" as const,
    nocCode: null,
    ifCode: null,
    displayName: "IOC Admin",
  },
  sudoAsNocUSA: {
    userId: "test-noc-usa",
    email: "noc.admin@usopc.org",
    role: "noc_admin" as const,
    nocCode: "USA",
    ifCode: null,
    displayName: "S. Kim (USOPC)",
    isSudo: true,
    sudoActorLabel: "IOC Admin",
  },
} satisfies Record<string, SessionPayload>;

// ─── FormData builder ─────────────────────────────────────────────────────────

export function makeFormData(data: Record<string, string | number>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, String(v));
  }
  return fd;
}

// ─── Test data helpers ────────────────────────────────────────────────────────

const TAG = `T_${Date.now()}`;

/** Creates a valid magic link token and returns the raw token string. */
export async function createTestToken(email: string): Promise<string> {
  const raw = `TEST_${TAG}`;
  const tokenHash = hashToken(raw);
  await db.insert(magicLinkTokens).values({
    email,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return raw;
}

/** Creates a test organisation and returns its id. */
export async function createTestOrg(nocCode: string, opts?: { type?: string }): Promise<string> {
  const [org] = await db
    .insert(organizations)
    .values({
      name: `${TAG} Test Org`,
      country: nocCode === "USA" ? "US" : nocCode === "GBR" ? "GB" : "FR",
      nocCode,
      orgType: (opts?.type as "media_print_online") ?? "news_agency",
      emailDomain: `${TAG.toLowerCase()}.test`,
    })
    .returning({ id: organizations.id });
  return org.id;
}

/** Creates a test application (default: pending) and returns its id and referenceNumber. */
export async function createTestApplication(
  orgId: string,
  nocCode: string,
  opts?: {
    status?: "pending" | "approved" | "returned" | "resubmitted" | "rejected";
    categoryE?: boolean;
    requestedE?: number;
    categoryEp?: boolean;
    requestedEp?: number;
  }
): Promise<{ id: string; referenceNumber: string }> {
  const seq = String(Math.floor(Math.random() * 99000) + 1000).padStart(5, "0");
  const referenceNumber = `TEST-2028-${nocCode}-${seq}`;
  const [app] = await db
    .insert(applications)
    .values({
      referenceNumber,
      organizationId: orgId,
      nocCode,
      contactName: `${TAG} Contact`,
      contactEmail: `${TAG}@test.invalid`,
      categoryPress: opts?.categoryE ?? true,
      categoryPhoto: opts?.categoryEp ?? false,
      categoryE: opts?.categoryE ?? true,
      requestedE: opts?.requestedE ?? 5,
      categoryEp: opts?.categoryEp ?? false,
      requestedEp: opts?.requestedEp ?? 0,
      about: "Automated test application",
      status: opts?.status ?? "pending",
    })
    .returning({ id: applications.id, referenceNumber: applications.referenceNumber });
  return { id: app.id, referenceNumber: app.referenceNumber };
}

/** Creates an orgSlotAllocation for a given application/org. */
export async function createTestAllocation(
  orgId: string,
  nocCode: string,
  opts?: { pbnState?: "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr"; eSlots?: number; epSlots?: number }
): Promise<string> {
  const [alloc] = await db
    .insert(orgSlotAllocations)
    .values({
      organizationId: orgId,
      nocCode,
      eventId: "LA28",
      eSlots: opts?.eSlots ?? 3,
      epSlots: opts?.epSlots ?? 0,
      pressSlots: opts?.eSlots ?? 3,
      photoSlots: opts?.epSlots ?? 0,
      pbnState: opts?.pbnState ?? "draft",
    })
    .returning({ id: orgSlotAllocations.id });
  return alloc.id;
}

/** Ensures a NOC quota row exists (upserts). */
export async function ensureTestQuota(nocCode: string, eTotal = 50): Promise<void> {
  await db
    .insert(nocQuotas)
    .values({
      nocCode,
      eventId: "LA28",
      pressTotal: eTotal,
      photoTotal: 20,
      eTotal,
      esTotal: 10,
      epTotal: 20,
      epsTotal: 5,
      etTotal: 10,
      ecTotal: 10,
    })
    .onConflictDoNothing();
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

/** Delete all rows created by this test run. Call in afterEach / afterAll. */
export async function cleanupTestData(): Promise<void> {
  // Delete in FK-safe order

  // 1. auditLog must be deleted BEFORE applications (FK: audit_log.application_id → applications.id)
  await db.delete(auditLog).where(
    or(
      eq(auditLog.actorId, "test-noc-usa"),
      eq(auditLog.actorId, "test-noc-gbr"),
      eq(auditLog.actorId, "test-ocog"),
      eq(auditLog.actorId, "test-ioc"),
    )
  );

  // 2. enrRequests
  await db.delete(enrRequests).where(like(enrRequests.nocCode, "T_%"));

  // 3. orgSlotAllocations and applications linked to test orgs
  const testOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(like(organizations.emailDomain, `${TAG.toLowerCase()}%`));
  if (testOrgs.length > 0) {
    for (const o of testOrgs) {
      await db.delete(orgSlotAllocations).where(eq(orgSlotAllocations.organizationId, o.id));
      await db.delete(applications).where(eq(applications.organizationId, o.id));
    }
    for (const o of testOrgs) {
      await db.delete(organizations).where(eq(organizations.id, o.id));
    }
  }

  // 4. magicLinkTokens
  await db.delete(magicLinkTokens).where(like(magicLinkTokens.email, `%@test.invalid`));
  await db.delete(magicLinkTokens).where(like(magicLinkTokens.tokenHash, "%"));

  // 5. sudo tokens (table may not exist in all environments — swallow error gracefully)
  try {
    await db.delete(sudoTokens).where(eq(sudoTokens.actorId, "test-ioc"));
  } catch {
    // sudo_tokens table not yet migrated — safe to ignore in tests
  }
}
