/**
 * Integration tests: B5 — NOC quota dashboard (PbN screen).
 * Tests verify the DB queries that power the quota dashboard.
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

import { db } from "@/db";
import { applications, organizations, orgSlotAllocations, nocQuotas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  cleanupTestData, createTestOrg, createTestApplication, createTestAllocation, ensureTestQuota,
} from "./helpers";

beforeAll(async () => { await cleanupTestData(); });
afterAll(async () => { await cleanupTestData(); });

describe("Quota dashboard data layer", () => {
  it("computes allocated slots per category from DB", async () => {
    const nocCode = "USA";
    await ensureTestQuota(nocCode, 50);

    // Create two approved orgs with allocations
    const orgId1 = await createTestOrg(nocCode);
    const orgId2 = await createTestOrg(nocCode);
    await createTestApplication(orgId1, nocCode, { status: "approved", categoryE: true, requestedE: 10 });
    await createTestApplication(orgId2, nocCode, { status: "approved", categoryE: true, requestedE: 8 });
    await createTestAllocation(orgId1, nocCode, { eSlots: 7, pbnState: "draft" });
    await createTestAllocation(orgId2, nocCode, { eSlots: 5, pbnState: "draft" });

    // Simulate what the PbN page does: fetch quota and allocations
    const [quota] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    const allocs = await db
      .select({ eSlots: orgSlotAllocations.eSlots })
      .from(orgSlotAllocations)
      .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

    const totalAllocated = allocs.reduce((s, a) => s + (a.eSlots ?? 0), 0);

    expect(quota).toBeDefined();
    expect(quota.eTotal).toBeGreaterThanOrEqual(50);
    expect(totalAllocated).toBeGreaterThanOrEqual(12); // 7 + 5 from our test
    expect(totalAllocated).toBeLessThanOrEqual(quota.eTotal);
  });

  it("remaining quota is correctly computed", async () => {
    const nocCode = "USA";
    const [quota] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    const allocs = await db
      .select({ eSlots: orgSlotAllocations.eSlots })
      .from(orgSlotAllocations)
      .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

    const allocated = allocs.reduce((s, a) => s + (a.eSlots ?? 0), 0);
    const remaining = quota.eTotal - allocated;

    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBe(quota.eTotal - allocated);
  });

  it("shows zero remaining when fully allocated", async () => {
    const nocCode = "GBR";

    // Set a tight quota
    await db.delete(nocQuotas).where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));
    await db.insert(nocQuotas).values({
      nocCode,
      eventId: "LA28",
      pressTotal: 5,
      photoTotal: 0,
      eTotal: 5,
      esTotal: 0,
      epTotal: 0,
      epsTotal: 0,
      etTotal: 0,
      ecTotal: 0,
    });

    const orgId = await createTestOrg(nocCode);
    await createTestApplication(orgId, nocCode, { status: "approved" });
    await createTestAllocation(orgId, nocCode, { eSlots: 5 });

    const [quota] = await db.select().from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));
    const allocs = await db.select({ eSlots: orgSlotAllocations.eSlots })
      .from(orgSlotAllocations)
      .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

    const allocated = allocs.reduce((s, a) => s + (a.eSlots ?? 0), 0);
    expect(quota.eTotal - allocated).toBe(0);

    // Cleanup GBR quota
    await db.delete(nocQuotas).where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));
  });
});
