/**
 * Integration tests: NOC cancelPbnEntry — state machine + audit + redirects.
 *
 * Covers test plan §8 for the 2026-04-26 changes (commit 824faee, plus
 * the e6e939e follow-on fix that scoped the rejection-on-cancel to
 * direct-entry / pbn-direct sources).
 */

import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

const mockCookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => {
      const v = mockCookieStore.get(name);
      return v !== undefined ? { name, value: v } : undefined;
    },
    set: (name: string, value: string) => mockCookieStore.set(name, value),
    delete: (name: string) => mockCookieStore.delete(name),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { cancelPbnEntry } from "@/app/admin/noc/pbn/actions";
import { db } from "@/db";
import {
  applications,
  organizations,
  orgSlotAllocations,
  auditLog,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  callAction,
  createTestOrg,
  createTestApplication,
  createTestAllocation,
  makeFormData,
  cleanupTestData,
  SESSIONS,
} from "./helpers";

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  mockCookieStore.set("prp_session", await encodeSession(payload));
}
function clearSession() { mockCookieStore.clear(); }

beforeAll(async () => { await cleanupTestData(); });
afterAll(async () => { await cleanupTestData(); });

describe("cancelPbnEntry — happy paths", () => {
  it("EoI-sourced draft alloc: deletes alloc, application stays approved, audit row written", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "approved" });
    // createTestApplication defaults entrySource to schema default ("self_submitted") = EoI
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "draft" });

    await setSession(SESSIONS.nocUSA);

    const fd = makeFormData({ organizationId: orgId, reason: "no longer needed" });
    const { redirect } = await callAction(() => cancelPbnEntry(fd));

    expect(redirect?.url).toBe("/admin/noc/pbn?success=entry_cancelled");

    const allocs = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(allocs).toHaveLength(0);

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.status).toBe("approved");

    const log = await db
      .select()
      .from(auditLog)
      .where(and(
        eq(auditLog.organizationId, orgId),
        eq(auditLog.action, "noc_pbn_cancel"),
      ));
    expect(log.length).toBeGreaterThan(0);

    clearSession();
  });

  it("EoI-sourced noc_submitted alloc: deletes alloc, application stays approved", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "approved" });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "noc_submitted" });

    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() =>
      cancelPbnEntry(makeFormData({ organizationId: orgId })),
    );
    expect(redirect?.url).toBe("/admin/noc/pbn?success=entry_cancelled");

    const allocs = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(allocs).toHaveLength(0);

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.status).toBe("approved");

    clearSession();
  });

  it("Direct-entry-sourced draft alloc: deletes alloc, application flips to rejected with reason", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "approved" });
    // Patch entrySource to direct-entry
    await db
      .update(applications)
      .set({ entrySource: "noc_direct" })
      .where(eq(applications.id, appId));

    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "draft" });

    await setSession(SESSIONS.nocUSA);

    const reason = "duplicate of approved EoI";
    const { redirect } = await callAction(() =>
      cancelPbnEntry(makeFormData({ organizationId: orgId, reason })),
    );
    expect(redirect?.url).toBe("/admin/noc/pbn?success=entry_cancelled");

    const allocs = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(allocs).toHaveLength(0);

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.status).toBe("rejected");
    expect(app.reviewNote).toContain(reason);

    clearSession();
  });
});

describe("cancelPbnEntry — guards", () => {
  it("ocog_approved alloc: redirects with cancel_not_allowed and changes nothing", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "approved" });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "ocog_approved" });

    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() =>
      cancelPbnEntry(makeFormData({ organizationId: orgId })),
    );
    expect(redirect?.url).toBe("/admin/noc/pbn?error=cancel_not_allowed");

    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(alloc).toBeDefined();
    expect(alloc.pbnState).toBe("ocog_approved");

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.status).toBe("approved");

    clearSession();
  });

  it("sent_to_acr alloc: redirects with cancel_not_allowed", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved" });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "sent_to_acr" });

    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() =>
      cancelPbnEntry(makeFormData({ organizationId: orgId })),
    );
    expect(redirect?.url).toBe("/admin/noc/pbn?error=cancel_not_allowed");

    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(alloc.pbnState).toBe("sent_to_acr");

    clearSession();
  });

  it("missing organizationId: redirects with missing_org", async () => {
    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() => cancelPbnEntry(makeFormData({})));
    expect(redirect?.url).toBe("/admin/noc/pbn?error=missing_org");

    clearSession();
  });

  it("org belongs to a different NOC: redirects with alloc_not_found", async () => {
    // Org/alloc belong to GBR but session is USA — the action filters by
    // session.nocCode, so the lookup misses and reports alloc_not_found.
    const orgId = await createTestOrg("GBR");
    await createTestApplication(orgId, "GBR", { status: "approved" });
    await createTestAllocation(orgId, "GBR", { pbnState: "draft" });

    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() =>
      cancelPbnEntry(makeFormData({ organizationId: orgId })),
    );
    expect(redirect?.url).toBe("/admin/noc/pbn?error=alloc_not_found");

    clearSession();
  });
});
