/**
 * Integration tests: NOC Admin → PbN Allocation + ENR Nomination use cases.
 * Runs against the real DB configured in .env.local.
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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { saveSlotAllocations, submitPbnToOcog } from "@/app/admin/noc/pbn/actions";
import {
  addEnrNomination,
  removeEnrOrg,
  updateEnrRanks,
  submitEnrToIoc,
} from "@/app/admin/noc/enr/actions";
import { db } from "@/db";
import { orgSlotAllocations, enrRequests, organizations } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

// ─── Local session helpers (must write to THIS file's mockCookieStore) ────────

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  const encoded = await encodeSession(payload);
  mockCookieStore.set("mrp_session", encoded);
}

function clearSession() {
  mockCookieStore.clear();
}

// ─── ENR request IDs created during tests (need manual cleanup for USA) ───────

const createdEnrIds: string[] = [];

// ─── afterAll ─────────────────────────────────────────────────────────────────

afterAll(async () => {
  // Clean up ENR rows created under "USA" (cleanupTestData only handles T_* codes)
  if (createdEnrIds.length > 0) {
    await db.delete(enrRequests).where(inArray(enrRequests.id, createdEnrIds));
  }
  await cleanupTestData();
});

// ─── PbN Allocation tests ─────────────────────────────────────────────────────

describe("PbN Allocation", () => {
  it("saveSlotAllocations — saves draft slot values for an org", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 3 });
    await createTestAllocation(orgId, "USA", { pbnState: "draft", eSlots: 0 });

    await setSession(SESSIONS.nocUSA);

    // Field names: ${category.value.toLowerCase()}_${orgId}
    const fd = makeFormData({
      [`e_${orgId}`]: 2,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => saveSlotAllocations(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/pbn?success=saved");

    // Verify the allocation was updated with eSlots=2, pbnState=draft
    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.organizationId, orgId),
          eq(orgSlotAllocations.nocCode, "USA"),
          eq(orgSlotAllocations.eventId, "LA28")
        )
      );

    expect(alloc).toBeDefined();
    expect(alloc.eSlots).toBe(2);
    expect(alloc.pbnState).toBe("draft");

    clearSession();
  });

  it("submitPbnToOcog — valid allocation submits successfully", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 1 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "draft", eSlots: 1 });

    await setSession(SESSIONS.nocUSA);

    // Submit with 1 E slot — well within USA's quota
    const fd = makeFormData({
      [`e_${orgId}`]: 1,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => submitPbnToOcog(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/pbn?success=submitted");

    // Verify pbnState = noc_submitted
    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));

    expect(alloc.pbnState).toBe("noc_submitted");

    // Reset back to draft so it doesn't affect other tests
    await db
      .update(orgSlotAllocations)
      .set({ pbnState: "draft" })
      .where(eq(orgSlotAllocations.id, allocId));

    // Also reset any other USA draft allocations that got submitted (from real data)
    // Only reset the ones we created (identified by allocId above)

    clearSession();
  });

  it("submitPbnToOcog — over-quota allocation is rejected", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 9999 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "draft", eSlots: 9999 });

    await setSession(SESSIONS.nocUSA);

    // Submit with 9999 E slots — way over USA's quota
    const fd = makeFormData({
      [`e_${orgId}`]: 9999,
      [`es_${orgId}`]: 0,
      [`ep_${orgId}`]: 0,
      [`eps_${orgId}`]: 0,
      [`et_${orgId}`]: 0,
      [`ec_${orgId}`]: 0,
    });

    const { redirect } = await callAction(() => submitPbnToOcog(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toContain("over_");
    expect(redirect!.url).toContain("quota");

    // Verify pbnState is NOT noc_submitted
    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));

    expect(alloc.pbnState).toBe("draft");

    clearSession();
  });
});

// ─── ENR tests ────────────────────────────────────────────────────────────────

describe("ENR Nomination", () => {
  it("addEnrNomination — adds a new nomination", async () => {
    await setSession(SESSIONS.nocUSA);

    const uniqueName = `Test ENR Org ${Date.now()}`;
    const fd = makeFormData({
      enr_org_name: uniqueName,
      enr_description: "A test media organisation for integration testing.",
      enr_justification: "Integration test — please ignore.",
      must_have_slots: 2,
      nice_to_have_slots: 1,
    });

    const { redirect } = await callAction(() => addEnrNomination(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/enr?success=added");

    // Verify row was created in DB (join to get org name)
    const rows = await db
      .select({ req: enrRequests, orgName: organizations.name })
      .from(enrRequests)
      .innerJoin(organizations, eq(enrRequests.organizationId, organizations.id))
      .where(eq(enrRequests.nocCode, "USA"));

    const created = rows.find((r) => r.orgName === uniqueName);
    expect(created).toBeDefined();
    expect(created!.req.mustHaveSlots).toBe(2);
    expect(created!.req.niceToHaveSlots).toBe(1);
    expect(created!.req.slotsRequested).toBe(3);
    expect(created!.req.submittedAt).toBeNull();

    // Track for cleanup
    createdEnrIds.push(created!.req.id);

    clearSession();
  });

  it("removeEnrOrg — removes a draft nomination", async () => {
    // Create an ENR org + request directly in the DB (draft: submittedAt = null)
    const orgId = await createTestEnrOrg("USA", `Remove Test Org ${Date.now()}`);
    const [req] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId,
        priorityRank: 99,
        slotsRequested: 2,
        enrDescription: "To be removed",
        enrJustification: "Test removal",
        mustHaveSlots: 2,
        niceToHaveSlots: 0,
        submittedAt: null,
      })
      .returning({ id: enrRequests.id });

    // Track in case delete fails
    createdEnrIds.push(req.id);

    await setSession(SESSIONS.nocUSA);

    const fd = makeFormData({ request_id: req.id });
    const { redirect } = await callAction(() => removeEnrOrg(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/enr?success=removed");

    // Verify row was deleted
    const rows = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req.id));

    expect(rows.length).toBe(0);

    // Already deleted, remove from tracking list
    const idx = createdEnrIds.indexOf(req.id);
    if (idx !== -1) createdEnrIds.splice(idx, 1);

    clearSession();
  });

  it("updateEnrRanks — updates priority order", async () => {
    // Create 2 ENR orgs + requests
    const ts = Date.now();
    const orgId1 = await createTestEnrOrg("USA", `Rank Test Org A ${ts}`);
    const orgId2 = await createTestEnrOrg("USA", `Rank Test Org B ${ts}`);

    const [req1] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId1,
        priorityRank: 1,
        slotsRequested: 2,
        enrDescription: "Test org A",
        enrJustification: "Rank test A",
        mustHaveSlots: 2,
        niceToHaveSlots: 0,
        submittedAt: null,
      })
      .returning({ id: enrRequests.id });

    const [req2] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId2,
        priorityRank: 2,
        slotsRequested: 1,
        enrDescription: "Test org B",
        enrJustification: "Rank test B",
        mustHaveSlots: 1,
        niceToHaveSlots: 0,
        submittedAt: null,
      })
      .returning({ id: enrRequests.id });

    createdEnrIds.push(req1.id, req2.id);

    await setSession(SESSIONS.nocUSA);

    // Swap ranks: req1 → rank 2, req2 → rank 1
    const ranksJson = JSON.stringify([
      { id: req1.id, rank: 2 },
      { id: req2.id, rank: 1 },
    ]);

    const fd = makeFormData({ ranks: ranksJson });
    const { redirect } = await callAction(() => updateEnrRanks(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/enr?success=reordered");

    // Verify ranks were updated
    const [updated1] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req1.id));
    const [updated2] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req2.id));

    expect(updated1.priorityRank).toBe(2);
    expect(updated2.priorityRank).toBe(1);

    clearSession();
  });

  it("submitEnrToIoc — submits draft nominations", async () => {
    // Create a fresh draft ENR org + row
    const orgId = await createTestEnrOrg("USA", `Submit Test Org ${Date.now()}`);
    const [req] = await db
      .insert(enrRequests)
      .values({
        nocCode: "USA",
        eventId: "LA28",
        organizationId: orgId,
        priorityRank: 50,
        slotsRequested: 3,
        enrDescription: "To be submitted",
        enrJustification: "Test submission",
        mustHaveSlots: 3,
        niceToHaveSlots: 0,
        submittedAt: null,
      })
      .returning({ id: enrRequests.id });

    createdEnrIds.push(req.id);

    await setSession(SESSIONS.nocUSA);

    const { redirect } = await callAction(() => submitEnrToIoc());

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/admin/noc/enr?success=submitted");

    // Verify submittedAt is now set on our row
    const [updated] = await db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.id, req.id));

    expect(updated.submittedAt).not.toBeNull();

    clearSession();
  });

  it("addEnrNomination — blocked in sudo mode (requireWritable throws)", async () => {
    await setSession(SESSIONS.sudoAsNocUSA);

    const fd = makeFormData({
      enr_org_name: `Sudo Blocked Org ${Date.now()}`,
      enr_description: "Should not be created",
      enr_justification: "Sudo mode test",
      must_have_slots: 1,
      nice_to_have_slots: 0,
    });

    const { error, redirect } = await callAction(() => addEnrNomination(fd));

    // requireWritable() throws Error("SUDO_READ_ONLY") — not a redirect
    expect(error).toBeDefined();
    expect(error!.message).toBe("SUDO_READ_ONLY");
    expect(redirect).toBeUndefined();

    clearSession();
  });
});
