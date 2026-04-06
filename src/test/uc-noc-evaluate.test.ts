/**
 * Integration tests: NOC Admin — Evaluate EoI Forms
 * Use cases: approveApplication, returnApplication, rejectApplication
 *
 * Runs against the real DB configured in .env.local.
 * next/headers and next/navigation are mocked so redirect() throws a
 * catchable error and cookies() reads from an in-memory map.
 */

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

// ─── Mock next/headers and next/navigation BEFORE importing actions ───────────

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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { approveApplication, returnApplication, rejectApplication } from "@/app/admin/noc/actions";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  SESSIONS,
  makeFormData,
  createTestOrg,
  createTestApplication,
  cleanupTestData,
  callAction,
} from "./helpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setSession(payload: typeof SESSIONS.nocUSA) {
  const { encodeSession } = await import("@/lib/session");
  const encoded = await encodeSession(payload);
  mockCookieStore.set("mrp_session", encoded);
}

async function getAppStatus(id: string) {
  const [row] = await db
    .select({ status: applications.status, reviewNote: applications.reviewNote })
    .from(applications)
    .where(eq(applications.id, id));
  return row;
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockCookieStore.clear();
});

afterAll(async () => {
  await cleanupTestData();
});

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("approveApplication", () => {
  it("pending application becomes approved", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "pending" });

    await setSession(SESSIONS.nocUSA);

    const { redirect, error } = await callAction(() =>
      approveApplication(makeFormData({ id: appId }))
    );

    // Should redirect to success URL
    expect(error).toBeUndefined();
    expect(redirect?.url).toContain("success=approved");

    // DB should reflect the change
    const row = await getAppStatus(appId);
    expect(row.status).toBe("approved");
  });

  it("wrong NOC cannot approve — silently redirects, status unchanged", async () => {
    // GBR application, USA admin
    const orgId = await createTestOrg("GBR");
    const { id: appId } = await createTestApplication(orgId, "GBR", { status: "pending" });

    await setSession(SESSIONS.nocUSA);

    const { redirect, error } = await callAction(() =>
      approveApplication(makeFormData({ id: appId }))
    );

    // Action should redirect (not throw a hard error)
    expect(error).toBeUndefined();
    expect(redirect).toBeDefined();

    // Status must remain pending — USA admin has no authority over GBR
    const row = await getAppStatus(appId);
    expect(row.status).toBe("pending");
  });

  it("resubmitted application can be approved", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "resubmitted" });

    await setSession(SESSIONS.nocUSA);

    const { redirect, error } = await callAction(() =>
      approveApplication(makeFormData({ id: appId }))
    );

    expect(error).toBeUndefined();
    expect(redirect?.url).toContain("success=approved");

    const row = await getAppStatus(appId);
    expect(row.status).toBe("approved");
  });
});

describe("returnApplication", () => {
  it("returns application with a note", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "pending" });

    await setSession(SESSIONS.nocUSA);

    const note = "Please clarify EP coverage plan";
    const { redirect, error } = await callAction(() =>
      returnApplication(makeFormData({ id: appId, note }))
    );

    expect(error).toBeUndefined();
    expect(redirect?.url).toContain("success=returned");

    const row = await getAppStatus(appId);
    expect(row.status).toBe("returned");
    expect(row.reviewNote).toBe(note);
  });

  it("missing note redirects with error=note_required", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "pending" });

    await setSession(SESSIONS.nocUSA);

    // Intentionally omit the note field
    const { redirect, error } = await callAction(() =>
      returnApplication(makeFormData({ id: appId }))
    );

    expect(error).toBeUndefined();
    expect(redirect?.url).toContain("error=note_required");

    // Status must be unchanged
    const row = await getAppStatus(appId);
    expect(row.status).toBe("pending");
  });
});

describe("rejectApplication", () => {
  it("permanently rejects a pending application", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "pending" });

    await setSession(SESSIONS.nocUSA);

    const note = "Duplicate submission";
    const { redirect, error } = await callAction(() =>
      rejectApplication(makeFormData({ id: appId, note }))
    );

    expect(error).toBeUndefined();
    expect(redirect?.url).toContain("success=rejected");

    const row = await getAppStatus(appId);
    expect(row.status).toBe("rejected");
    expect(row.reviewNote).toBe(note);
  });
});

describe("approveApplication — sudo read-only guard", () => {
  it("sudo session cannot approve — throws SUDO_READ_ONLY, status unchanged", async () => {
    const orgId = await createTestOrg("USA");
    const { id: appId } = await createTestApplication(orgId, "USA", { status: "pending" });

    // Sudo session: IOC admin acting as USA NOC — should be read-only
    const { encodeSession } = await import("@/lib/session");
    const sudoPayload = { ...SESSIONS.nocUSA, isSudo: true, sudoActorLabel: "IOC Admin" };
    mockCookieStore.set("mrp_sudo_session", await encodeSession(sudoPayload));
    mockCookieStore.set("mrp_session", await encodeSession(SESSIONS.ioc));

    const { redirect, error } = await callAction(() =>
      approveApplication(makeFormData({ id: appId }))
    );

    // requireWritable() redirects to /admin?error=sudo_readonly
    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("sudo_readonly");

    // DB must be unchanged
    const row = await getAppStatus(appId);
    expect(row.status).toBe("pending");
  });
});
