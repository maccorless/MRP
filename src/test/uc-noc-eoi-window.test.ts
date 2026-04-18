/**
 * Integration tests: EoI window checks (B3).
 *
 * NOC window self-service has been removed (decision 1.3). The window is now
 * controlled by OCOG only. These tests cover:
 *   - The window-open/closed check on application submit (still enforced).
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

import { submitApplication } from "@/app/apply/actions";
import { db } from "@/db";
import { nocEoiWindows, auditLog, organizations, applications, orgSlotAllocations } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { callAction, makeFormData, cleanupTestData } from "./helpers";
import { magicLinkTokens } from "@/db/schema";
import { hashToken } from "@/lib/tokens";

// Clean up any noc_eoi_windows rows we create
async function cleanupWindows() {
  await db.delete(nocEoiWindows).where(eq(nocEoiWindows.nocCode, "GBR"));
}

// Clean up BBC-domain test orgs and their applications (not covered by standard cleanupTestData)
// Also cleans stale GBR test-tagged orgs from old sessions (emailDomain LIKE 't\_%') that
// would inflate the APP-2028-GBR-XXXXX sequence count and cause reference number collisions.
async function cleanupBbcTestData() {
  await db.delete(magicLinkTokens).where(like(magicLinkTokens.email, "%@bbc.co.uk"));
  // Delete apps by contactEmail first (catches apps on reused orgs from prior runs)
  const bbcApps = await db.select({ id: applications.id })
    .from(applications)
    .where(like(applications.contactEmail, "%@bbc.co.uk"));
  for (const app of bbcApps) {
    await db.delete(auditLog).where(eq(auditLog.applicationId, app.id));
  }
  if (bbcApps.length) {
    await db.delete(applications).where(like(applications.contactEmail, "%@bbc.co.uk"));
  }
  // Delete orgs whose emailDomain is bbc.co.uk
  const bbcOrgs = await db.select({ id: organizations.id }).from(organizations)
    .where(like(organizations.emailDomain, "%bbc.co.uk%"));
  for (const org of bbcOrgs) {
    await db.delete(auditLog).where(eq(auditLog.organizationId, org.id));
    await db.delete(applications).where(eq(applications.organizationId, org.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));
  }
  // Purge ALL GBR applications to reset the reference-number sequence counter.
  // The sequence is count-based (COUNT(GBR apps) + 1), so any leftover GBR apps from
  // prior test runs — regardless of their email domain — cause reference number collisions.
  // This is a test DB only; no production GBR data exists here.
  const allGbrApps = await db.select({ id: applications.id })
    .from(applications).where(eq(applications.nocCode, "GBR"));
  for (const app of allGbrApps) {
    await db.delete(auditLog).where(eq(auditLog.applicationId, app.id));
  }
  if (allGbrApps.length) {
    await db.delete(orgSlotAllocations).where(
      eq(orgSlotAllocations.nocCode, "GBR")
    );
    await db.delete(applications).where(eq(applications.nocCode, "GBR"));
  }
  // Purge orphaned GBR orgs
  const orphanGbrOrgs = await db.select({ id: organizations.id })
    .from(organizations).where(eq(organizations.nocCode, "GBR"));
  for (const org of orphanGbrOrgs) {
    await db.delete(auditLog).where(eq(auditLog.organizationId, org.id));
    await db.delete(organizations).where(eq(organizations.id, org.id));
  }
}

let tokenIdx = 0;
async function createUniqueToken(email: string): Promise<string> {
  tokenIdx++;
  const raw = `WIN_TEST_${Date.now()}_${tokenIdx}`;
  const tokenHash = hashToken(raw);
  await db.insert(magicLinkTokens).values({
    email,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return raw;
}

beforeAll(async () => {
  await cleanupWindows();
  await cleanupBbcTestData();
  await cleanupTestData();
});
afterAll(async () => {
  await cleanupWindows();
  await cleanupBbcTestData();
  await cleanupTestData();
});

describe("EoI window check on application submit", () => {
  it("allows submission when window is open (no row = open)", async () => {
    // Ensure no row for GBR — absence = open
    await db.delete(nocEoiWindows).where(eq(nocEoiWindows.nocCode, "GBR"));

    const email = `windowtest_open_${Date.now()}@bbc.co.uk`;
    const token = await createUniqueToken(email);

    const fd = makeFormData({
      token,
      email,
      contact_name: "Open Window Test",
      contact_first_name: "Open",
      contact_last_name: "Window",
      org_name: "BBC Test",
      country: "GB",
      noc_code: "GBR",
      org_type: "media_broadcast",
      category_E: "on",
      requested_E: 2,
      about: "Window open test.",
    });

    const result = await callAction(() => submitApplication(fd));
    if (result.error) throw result.error;
    if (!result.redirect?.url?.startsWith("/apply/submitted")) {
      throw new Error(`Unexpected redirect: ${result.redirect?.url}`);
    }
    expect(result.redirect.url).toMatch(/^\/apply\/submitted\?ref=APP-2028-GBR-/);
  });

  it("blocks submission when window is closed", async () => {
    // Close the window for GBR
    await db.delete(nocEoiWindows).where(eq(nocEoiWindows.nocCode, "GBR"));
    await db.insert(nocEoiWindows).values({
      nocCode: "GBR",
      eventId: "LA28",
      isOpen: false,
      closedAt: new Date(),
      toggledBy: "test-noc-gbr",
      toggledAt: new Date(),
    });

    const email = `windowtest_closed_${Date.now()}@bbc.co.uk`;
    const token = await createUniqueToken(email);

    const fd = makeFormData({
      token,
      email,
      contact_name: "Closed Window Test",
      contact_first_name: "Closed",
      contact_last_name: "Window",
      org_name: "BBC Test Closed",
      country: "GB",
      noc_code: "GBR",
      org_type: "media_broadcast",
      category_E: "on",
      about: "Window closed test.",
    });

    const { redirect } = await callAction(() => submitApplication(fd));
    expect(redirect?.url).toBe("/apply?error=window_closed");
  });
});
