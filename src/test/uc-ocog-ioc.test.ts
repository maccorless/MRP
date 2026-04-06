/**
 * Integration tests: OCOG Admin and IOC Admin use cases.
 * Runs against the real DB configured in .env.local.
 *
 * Use cases:
 *   1. OCOG Admin → Approve PbN (approvePbn, sendToAcr)
 *   2. IOC Admin  → Manage ENR decisions (saveEnrDecisions)
 *   3. IOC Admin  → Sudo (initiateSudo)
 */

import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

// ─── Mocks must be declared before action imports ─────────────────────────────

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

vi.mock("@/lib/acr/stub-client", () => ({
  acrClient: {
    pushOrgData: vi.fn().mockResolvedValue({ pushed: 1 }),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { approvePbn, sendToAcr } from "@/app/admin/ocog/pbn/actions";
import { saveEnrDecisions } from "@/app/admin/ioc/enr/actions";
import { initiateSudo } from "@/app/admin/ioc/sudo/actions";
import { db } from "@/db";
import {
  orgSlotAllocations,
  enrRequests,
  sudoTokens,
  auditLog,
  adminUsers,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  callAction,
  createTestOrg,
  createTestEnrOrg,
  createTestApplication,
  createTestAllocation,
  makeFormData,
  cleanupTestData,
  SESSIONS,
} from "./helpers";
import { acrClient } from "@/lib/acr/stub-client";

// ─── Local session helpers (must write to THIS file's mockCookieStore) ────────

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  const encoded = await encodeSession(payload);
  mockCookieStore.set("mrp_session", encoded);
}

function clearSession() {
  mockCookieStore.clear();
}

// ─── Seeded admin user emails we depend on ────────────────────────────────────

const NOC_ADMIN_EMAIL = "noc.admin@usopc.org";
const IOC_READONLY_EMAIL = "ioc.readonly@olympics.org";

// ─── ENR rows created during tests (need manual cleanup) ─────────────────────

const createdEnrIds: string[] = [];

// ─── afterAll ─────────────────────────────────────────────────────────────────

afterAll(async () => {
  // Revert any enrRequests decision fields set during tests
  for (const id of createdEnrIds) {
    await db
      .update(enrRequests)
      .set({ decision: null, slotsGranted: null, reviewedBy: null, reviewedAt: null })
      .where(eq(enrRequests.id, id));
  }

  // Clean up sudo tokens created by the test IOC actor
  await db.delete(sudoTokens).where(eq(sudoTokens.actorId, "test-ioc"));

  await cleanupTestData();
});

// ─── OCOG PbN tests ───────────────────────────────────────────────────────────

describe("OCOG Admin — approvePbn", () => {
  it("approves a noc_submitted allocation", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 5 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "noc_submitted", eSlots: 3 });

    await setSession(SESSIONS.ocog);

    const fd = makeFormData({
      noc_code: "USA",
      [`e_${orgId}`]: 3,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => approvePbn(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("success=approved");
    expect(redirect!.url).toContain("noc=USA");

    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));

    expect(alloc.pbnState).toBe("ocog_approved");
    expect(alloc.ocogReviewedBy).toBe("test-ocog");

    clearSession();
  });

  it("fails with error=not_submitted when pbnState is draft", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 5 });
    await createTestAllocation(orgId, "USA", { pbnState: "draft", eSlots: 2 });

    await setSession(SESSIONS.ocog);

    const fd = makeFormData({
      noc_code: "USA",
      [`e_${orgId}`]: 2,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => approvePbn(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("error=not_submitted");

    clearSession();
  });

  it("blocked in sudo mode (requireWritable throws SUDO_READ_ONLY)", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 5 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "noc_submitted", eSlots: 3 });

    await setSession(SESSIONS.sudoAsNocUSA);

    const fd = makeFormData({
      noc_code: "USA",
      [`e_${orgId}`]: 3,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => approvePbn(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("sudo_readonly");

    // Verify pbnState was NOT changed
    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));

    expect(alloc.pbnState).toBe("noc_submitted");

    clearSession();
  });
});

describe("OCOG Admin — sendToAcr", () => {
  it("sends approved allocation to ACR stub and updates pbnState", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 3 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "ocog_approved", eSlots: 3 });

    await setSession(SESSIONS.ocog);

    const fd = makeFormData({ noc_code: "USA" });

    const { redirect } = await callAction(() => sendToAcr(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("success=sent_to_acr");

    // Verify acrClient.pushOrgData was called
    expect(acrClient.pushOrgData).toHaveBeenCalled();

    // Verify pbnState updated to sent_to_acr
    const [alloc] = await db
      .select({ pbnState: orgSlotAllocations.pbnState })
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));
    expect(alloc.pbnState).toBe("sent_to_acr");

    clearSession();
  });

  it("fails with error=not_approved when no ocog_approved allocation exists", async () => {
    // Use GBR which has no ocog_approved allocations in seeded data
    const orgId = await createTestOrg("GBR");
    await createTestApplication(orgId, "GBR", { status: "approved", categoryE: true, requestedE: 3 });
    await createTestAllocation(orgId, "GBR", { pbnState: "noc_submitted", eSlots: 3 });

    await setSession(SESSIONS.ocog);

    const fd = makeFormData({ noc_code: "GBR" });

    const { redirect } = await callAction(() => sendToAcr(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("error=not_approved");

    clearSession();
  });
});

// ─── IOC ENR tests ────────────────────────────────────────────────────────────

describe("IOC Admin — saveEnrDecisions", () => {
  it("saves a granted decision with slot count", async () => {
    // Create an ENR org + submitted request
    const orgId = await createTestEnrOrg("USA", `ENR Grant Test Org ${Date.now()}`);
    const [req] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId,
        priorityRank: 1,
        slotsRequested: 3,
        enrDescription: "Grant test org",
        enrJustification: "Test granted decision",
        mustHaveSlots: 2,
        niceToHaveSlots: 1,
        submittedAt: new Date(), // marks as submitted
      })
      .returning({ id: enrRequests.id });

    createdEnrIds.push(req.id);

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      noc_code: "USA",
      [`decision_${req.id}`]: "granted",
      [`slots_${req.id}`]: 3,
    });

    const { redirect } = await callAction(() => saveEnrDecisions(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("success=saved");

    const [updated] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req.id));

    expect(updated.decision).toBe("granted");
    expect(updated.slotsGranted).toBe(3);
    expect(updated.reviewedBy).toBe("test-ioc");

    clearSession();
  });

  it("saves a partial decision with reduced slot count", async () => {
    const orgId = await createTestEnrOrg("USA", `ENR Partial Test Org ${Date.now()}`);
    const [req] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId,
        priorityRank: 2,
        slotsRequested: 4,
        enrDescription: "Partial test org",
        enrJustification: "Test partial decision",
        mustHaveSlots: 3,
        niceToHaveSlots: 1,
        submittedAt: new Date(),
      })
      .returning({ id: enrRequests.id });

    createdEnrIds.push(req.id);

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      noc_code: "USA",
      [`decision_${req.id}`]: "partial",
      [`slots_${req.id}`]: 2,
    });

    const { redirect } = await callAction(() => saveEnrDecisions(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("success=saved");

    const [updated] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req.id));

    expect(updated.decision).toBe("partial");
    expect(updated.slotsGranted).toBe(2);
    expect(updated.reviewedBy).toBe("test-ioc");

    clearSession();
  });

  it("saves a denied decision with zero slots", async () => {
    const orgId = await createTestEnrOrg("USA", `ENR Denied Test Org ${Date.now()}`);
    const [req] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId,
        priorityRank: 3,
        slotsRequested: 2,
        enrDescription: "Denied test org",
        enrJustification: "Test denied decision",
        mustHaveSlots: 2,
        niceToHaveSlots: 0,
        submittedAt: new Date(),
      })
      .returning({ id: enrRequests.id });

    createdEnrIds.push(req.id);

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      noc_code: "USA",
      [`decision_${req.id}`]: "denied",
      [`slots_${req.id}`]: 0,
    });

    const { redirect } = await callAction(() => saveEnrDecisions(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("success=saved");

    const [updated] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req.id));

    expect(updated.decision).toBe("denied");
    expect(updated.slotsGranted).toBe(0);

    clearSession();
  });
});

// ─── IOC Sudo tests ───────────────────────────────────────────────────────────

describe("IOC Admin — initiateSudo", () => {
  let nocAdminExists = false;
  let iocReadonlyExists = false;

  beforeAll(async () => {
    // Check seeded admin users exist before running sudo tests
    const [noc] = await db
      .select({ email: adminUsers.email })
      .from(adminUsers)
      .where(eq(adminUsers.email, NOC_ADMIN_EMAIL))
      .limit(1);

    const [readonly] = await db
      .select({ email: adminUsers.email })
      .from(adminUsers)
      .where(eq(adminUsers.email, IOC_READONLY_EMAIL))
      .limit(1);

    nocAdminExists = !!noc;
    iocReadonlyExists = !!readonly;
  });

  it("generates a sudo token URL for a valid NOC admin email", async () => {
    if (!nocAdminExists) {
      console.warn(`SKIP: ${NOC_ADMIN_EMAIL} not found in adminUsers table`);
      return;
    }

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({ target_email: NOC_ADMIN_EMAIL });

    const { result, error } = await callAction(() => initiateSudo(fd));

    expect(error).toBeUndefined();
    expect(result).toBeDefined();
    expect((result as { url: string }).url).toMatch(/\/admin\/sudo\/activate\?token=/);

    // Verify sudoTokens row was created
    const tokens = await db
      .select()
      .from(sudoTokens)
      .where(
        and(
          eq(sudoTokens.actorId, "test-ioc"),
          eq(sudoTokens.targetEmail, NOC_ADMIN_EMAIL)
        )
      );

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Verify auditLog row with action="sudo_initiated"
    const logs = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.actorId, "test-ioc"),
          eq(auditLog.action, "sudo_initiated")
        )
      );

    expect(logs.length).toBeGreaterThan(0);

    clearSession();
  });

  it("rejects sudo into another IOC admin account (ioc_readonly)", async () => {
    if (!iocReadonlyExists) {
      console.warn(`SKIP: ${IOC_READONLY_EMAIL} not found in adminUsers table`);
      return;
    }

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({ target_email: IOC_READONLY_EMAIL });

    const { result } = await callAction(() => initiateSudo(fd));

    expect(result).toBeDefined();
    expect((result as { error: string }).error).toBe(
      "Cannot sudo into another IOC admin account."
    );

    clearSession();
  });

  it("rejects sudo for an unknown email", async () => {
    await setSession(SESSIONS.ioc);

    const fd = makeFormData({ target_email: "nobody@unknown.invalid" });

    const { result } = await callAction(() => initiateSudo(fd));

    expect(result).toBeDefined();
    expect((result as { error: string }).error).toMatch(/No admin user found for/);

    clearSession();
  });

  it("redirects to /admin/login for a non-IOC-admin session (NOC admin)", async () => {
    await setSession(SESSIONS.nocUSA);

    const fd = makeFormData({ target_email: NOC_ADMIN_EMAIL });

    const { redirect, result } = await callAction(() => initiateSudo(fd));

    // requireIocAdminSession() → redirect("/admin/login")
    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/login");
    expect(result).toBeUndefined();

    clearSession();
  });
});
