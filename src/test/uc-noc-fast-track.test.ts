/**
 * Integration tests: NOC Fast-Track EoI entry (B4).
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
  redirect: (url: string): never => { throw new Error(`REDIRECT:${url}`); },
}));

import { submitFastTrackApplication } from "@/app/admin/noc/fast-track/actions";
import { db } from "@/db";
import { applications, organizations, auditLog } from "@/db/schema";
import { eq, and, inArray, gte } from "drizzle-orm";
import { callAction, makeFormData, cleanupTestData, SESSIONS } from "./helpers";

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  const val = await encodeSession(payload);
  mockCookieStore.set("prp_session", val);
}
function clearSession() { mockCookieStore.clear(); }

const createdOrgIds: string[] = [];

beforeAll(async () => { await cleanupTestData(); });
afterAll(async () => {
  if (createdOrgIds.length) {
    const { inArray } = await import("drizzle-orm");
    // Must delete audit_log → applications → organizations (FK order)
    const apps = await db.select({ id: applications.id })
      .from(applications)
      .where(inArray(applications.organizationId, createdOrgIds));
    const appIds = apps.map((a) => a.id);
    if (appIds.length) {
      await db.delete(auditLog).where(inArray(auditLog.applicationId, appIds));
      await db.delete(applications).where(inArray(applications.id, appIds));
    }
    await db.delete(auditLog).where(inArray(auditLog.organizationId, createdOrgIds));
    await db.delete(organizations).where(inArray(organizations.id, createdOrgIds));
  }
  await cleanupTestData();
});

describe("NOC Fast-Track EoI", () => {
  it("creates org + application with status=approved and entrySource=noc_direct", async () => {
    await setSession(SESSIONS.nocUSA);
    const name = `FT Test Org ${Date.now()}`;

    const fd = makeFormData({
      org_name: name,
      org_type: "news_agency",
      country: "US",
      contact_name: "Fast Track Contact",
      contact_email: "ft@testorg.invalid",
      category_e: "on",
      requested_e: 3,
      about: "Fast-track integration test org.",
    });

    const { redirect } = await callAction(() => submitFastTrackApplication(fd));
    expect(redirect?.url).toBe("/admin/noc/queue?success=fast_track_submitted");

    const [org] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.name, name), eq(organizations.nocCode, "USA")));

    expect(org).toBeDefined();
    expect(org.orgType).toBe("news_agency");
    createdOrgIds.push(org.id);

    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.organizationId, org.id));

    expect(app).toBeDefined();
    expect(app.status).toBe("approved");
    expect(app.entrySource).toBe("noc_direct");
    expect(app.categoryE).toBe(true);
    expect(app.requestedE).toBe(3);
    expect(app.reviewedBy).toBe("test-noc-usa");

    clearSession();
  });

  it("writes a noc_direct_entry audit log entry", async () => {
    const testStart = new Date(Date.now() - 500);
    await setSession(SESSIONS.nocUSA);
    const name = `FT Audit Org ${Date.now()}`;

    const fd = makeFormData({
      org_name: name,
      org_type: "media_broadcast",
      contact_name: "Audit Test",
      contact_email: "audit@testorg.invalid",
      category_ep: "on",
      requested_ep: 1,
      about: "Audit log test.",
    });

    await callAction(() => submitFastTrackApplication(fd));

    const [org] = await db.select().from(organizations)
      .where(and(eq(organizations.name, name), eq(organizations.nocCode, "USA")));
    createdOrgIds.push(org.id);

    const [log] = await db.select().from(auditLog)
      .where(and(eq(auditLog.organizationId, org.id), gte(auditLog.createdAt, testStart)));

    expect(log.action).toBe("noc_direct_entry");
    expect(log.actorId).toBe("test-noc-usa");
    clearSession();
  });

  it("reference number follows APP-2028-{NOC}-{seq} pattern", async () => {
    await setSession(SESSIONS.nocUSA);
    const name = `FT Ref Org ${Date.now()}`;

    const fd = makeFormData({
      org_name: name,
      org_type: "media_print_online",
      contact_name: "Ref Test",
      contact_email: "ref@testorg.invalid",
      category_et: "on",
      about: "Ref number test.",
    });

    await callAction(() => submitFastTrackApplication(fd));

    const [org] = await db.select().from(organizations)
      .where(and(eq(organizations.name, name), eq(organizations.nocCode, "USA")));
    createdOrgIds.push(org.id);

    const [app] = await db.select().from(applications)
      .where(eq(applications.organizationId, org.id));

    expect(app.referenceNumber).toMatch(/^APP-2028-USA-\d{5}$/);
    clearSession();
  });

  it("rejects submission with no category selected", async () => {
    await setSession(SESSIONS.nocUSA);
    const fd = makeFormData({
      org_name: "No Category Org",
      org_type: "news_agency",
      contact_name: "Test",
      contact_email: "test@test.invalid",
      about: "No category.",
    });

    const { redirect } = await callAction(() => submitFastTrackApplication(fd));
    expect(redirect?.url).toBe("/admin/noc/fast-track?error=no_category");
    clearSession();
  });

  it("rejects submission with missing required fields", async () => {
    await setSession(SESSIONS.nocUSA);
    const fd = makeFormData({ org_name: "Incomplete", category_e: "on" });

    const { redirect } = await callAction(() => submitFastTrackApplication(fd));
    expect(redirect?.url).toBe("/admin/noc/fast-track?error=missing_fields");
    clearSession();
  });

  it("blocks submission in sudo mode", async () => {
    await setSession(SESSIONS.sudoAsNocUSA);
    const fd = makeFormData({
      org_name: "Sudo Org",
      org_type: "news_agency",
      contact_name: "Test",
      contact_email: "test@test.invalid",
      category_e: "on",
      about: "Sudo test.",
    });

    // requireWritable() redirects with sudo_readonly error
    const { redirect } = await callAction(() => submitFastTrackApplication(fd));
    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("sudo_readonly");
    clearSession();
  });
});
