/**
 * Integration tests: IOC-Direct ENR — addIocDirectEnrOrg.
 *
 * Covers test plan §9 for the 2026-04-26 changes. The IOC_DIRECT
 * pseudo-NOC bucket holds ENR orgs that the IOC grants directly
 * (CNN, Al Jazeera, BBC World, etc.) without going through a NOC.
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

import { addIocDirectEnrOrg } from "@/app/admin/ioc/enr/actions";
import { db } from "@/db";
import { organizations, enrRequests, auditLog } from "@/db/schema";
import { eq, and, like, inArray, sql } from "drizzle-orm";
import { callAction, makeFormData, cleanupTestData, SESSIONS } from "./helpers";

const TEST_PREFIX = "T_IOCDIR";

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  mockCookieStore.set("prp_session", await encodeSession(payload));
}
function clearSession() { mockCookieStore.clear(); }

async function getMaxIocDirectRank(): Promise<number> {
  const [{ maxRank }] = await db
    .select({ maxRank: sql<number>`coalesce(max(${enrRequests.priorityRank}), 0)` })
    .from(enrRequests)
    .where(and(eq(enrRequests.nocCode, "IOC_DIRECT"), eq(enrRequests.eventId, "LA28")));
  return maxRank ?? 0;
}

async function deleteTestIocDirectRows() {
  // Find any test orgs we created (name starts with TEST_PREFIX, nocCode IOC_DIRECT)
  const testOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(
      eq(organizations.nocCode, "IOC_DIRECT"),
      like(organizations.name, `${TEST_PREFIX}%`),
    ));
  const ids = testOrgs.map((o) => o.id);
  if (ids.length > 0) {
    await db.delete(auditLog).where(inArray(auditLog.organizationId, ids));
    await db.delete(enrRequests).where(inArray(enrRequests.organizationId, ids));
    await db.delete(organizations).where(inArray(organizations.id, ids));
  }
}

beforeAll(async () => {
  await deleteTestIocDirectRows();
  await cleanupTestData();
});

afterAll(async () => {
  await deleteTestIocDirectRows();
  await cleanupTestData();
});

describe("addIocDirectEnrOrg — happy path", () => {
  it("creates an IOC_DIRECT org + enr_requests row + audit log entry", async () => {
    const baseRank = await getMaxIocDirectRank();
    const orgName = `${TEST_PREFIX} CNN International ${Date.now()}`;
    const email = "press@cnn.example";

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      org_name: orgName,
      first_name: "Jane",
      last_name: "Doe",
      email,
      phone: "+1 212 555 0100",
      address: "1 CNN Center, Atlanta GA 30303",
      slots_requested: 5,
      justification: "Global news bureau, cross-NOC pool.",
    });

    const { redirect } = await callAction(() => addIocDirectEnrOrg(fd));
    expect(redirect?.url).toBe("/admin/ioc/enr/direct?success=added");

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, orgName));

    expect(org).toBeDefined();
    expect(org.nocCode).toBe("IOC_DIRECT");
    expect(org.orgType).toBe("enr");
    expect(org.orgEmail).toBe(email);
    expect(org.address).toBe("1 CNN Center, Atlanta GA 30303");
    expect(org.emailDomain).toBe("cnn.example");

    const [req] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.organizationId, org.id));
    expect(req).toBeDefined();
    expect(req.nocCode).toBe("IOC_DIRECT");
    expect(req.slotsRequested).toBe(5);
    expect(req.mustHaveSlots).toBe(5);
    expect(req.submittedAt).not.toBeNull();
    expect(req.priorityRank).toBe(baseRank + 1);

    expect(req.enrJustification).toContain("Contact: Jane Doe");
    expect(req.enrJustification).toContain(`Email: ${email}`);

    const [log] = await db
      .select()
      .from(auditLog)
      .where(and(
        eq(auditLog.organizationId, org.id),
        eq(auditLog.action, "enr_submitted"),
      ));
    expect(log).toBeDefined();
    expect(log.detail).toContain(orgName);

    clearSession();
  });

  it("second IOC-Direct entry gets next priorityRank", async () => {
    const baseRank = await getMaxIocDirectRank();

    await setSession(SESSIONS.ioc);

    const orgName = `${TEST_PREFIX} BBC World ${Date.now()}`;
    const fd = makeFormData({
      org_name: orgName,
      first_name: "Alex",
      last_name: "Tester",
      email: "press@bbc.example",
      slots_requested: 3,
    });

    const { redirect } = await callAction(() => addIocDirectEnrOrg(fd));
    expect(redirect?.url).toBe("/admin/ioc/enr/direct?success=added");

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, orgName));
    const [req] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.organizationId, org.id));

    // baseRank already includes the row from the previous test, so this
    // entry should land at baseRank + 1 — i.e. one above the previous run.
    expect(req.priorityRank).toBe(baseRank + 1);

    clearSession();
  });
});

describe("addIocDirectEnrOrg — guards", () => {
  it("missing org_name redirects to ?error=missing_fields", async () => {
    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      email: "x@example.com",
      slots_requested: 3,
    });

    const { redirect } = await callAction(() => addIocDirectEnrOrg(fd));
    expect(redirect?.url).toBe("/admin/ioc/enr/direct?error=missing_fields");

    clearSession();
  });

  it("missing email redirects to ?error=missing_fields", async () => {
    await setSession(SESSIONS.ioc);

    const fd = makeFormData({
      org_name: `${TEST_PREFIX} NoEmail`,
      slots_requested: 3,
    });

    const { redirect } = await callAction(() => addIocDirectEnrOrg(fd));
    expect(redirect?.url).toBe("/admin/ioc/enr/direct?error=missing_fields");

    clearSession();
  });
});
