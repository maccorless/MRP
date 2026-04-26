/**
 * Integration tests: NocEs (sport-specific press attaché) category — schema,
 * IOC quota import + manual edit, and OCOG ACR export.
 *
 * Covers test plan §7 for the 2026-04-26 changes.
 *
 * NOTE: nocQuotas + quotaChanges rows are scoped to a synthetic test NOC
 * code "T_USA" so we do not collide with seeded production data. Cleanup
 * removes those rows by NOC code in afterAll.
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

import { importQuotas, saveQuotaEdits } from "@/app/admin/ioc/quotas/actions";
import { sendToAcr } from "@/app/admin/ocog/pbn/actions";
import { db } from "@/db";
import {
  nocQuotas,
  quotaChanges,
  orgSlotAllocations,
  organizations,
  applications,
  auditLog,
} from "@/db/schema";
import { eq, and, like, inArray } from "drizzle-orm";
import {
  callAction,
  createTestOrg,
  createTestApplication,
  createTestAllocation,
  makeFormData,
  cleanupTestData,
  SESSIONS,
} from "./helpers";
import { acrClient } from "@/lib/acr/stub-client";

const TEST_NOC = "T_USA";

async function setSession(payload: (typeof SESSIONS)[keyof typeof SESSIONS]) {
  const { encodeSession } = await import("@/lib/session");
  mockCookieStore.set("prp_session", await encodeSession(payload));
}
function clearSession() { mockCookieStore.clear(); }

async function deleteTestQuotaRows() {
  await db.delete(quotaChanges).where(eq(quotaChanges.nocCode, TEST_NOC));
  await db.delete(nocQuotas).where(eq(nocQuotas.nocCode, TEST_NOC));
  await db.delete(auditLog).where(eq(auditLog.actorId, "test-ioc"));
}

beforeAll(async () => {
  await deleteTestQuotaRows();
  await cleanupTestData();
});

afterAll(async () => {
  await deleteTestQuotaRows();
  await cleanupTestData();
});

// ─── Schema: nocEsTotal + nocEsSlots round-trip ──────────────────────────────

describe("schema — NocEs columns", () => {
  it("noc_quotas.noc_es_total round-trips", async () => {
    await db.insert(nocQuotas).values({
      nocCode: TEST_NOC,
      eventId: "LA28",
      nocEsTotal: 5,
    });
    const [row] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, TEST_NOC), eq(nocQuotas.eventId, "LA28")));
    expect(row).toBeDefined();
    expect(row.nocEsTotal).toBe(5);

    // tidy so subsequent tests start clean
    await db.delete(nocQuotas).where(eq(nocQuotas.id, row.id));
  });

  it("org_slot_allocations.noc_es_slots round-trips", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved" });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "draft" });

    // Patch the alloc to set nocEsSlots — createTestAllocation doesn't take it
    await db
      .update(orgSlotAllocations)
      .set({ nocEsSlots: 3 })
      .where(eq(orgSlotAllocations.id, allocId));

    const [alloc] = await db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.id, allocId));

    expect(alloc.nocEsSlots).toBe(3);
  });
});

// ─── importQuotas — 8-column + legacy 7-column ───────────────────────────────

describe("IOC importQuotas — NocEs column", () => {
  it("8-column CSV writes both nocETotal and nocEsTotal", async () => {
    await db.delete(nocQuotas).where(eq(nocQuotas.nocCode, TEST_NOC));
    await db.delete(quotaChanges).where(eq(quotaChanges.nocCode, TEST_NOC));

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({ csv: `${TEST_NOC},5,2,3,1,0,0,2,1` });
    const { redirect } = await callAction(() => importQuotas(fd));
    expect(redirect?.url).toContain("success=imported");

    const [row] = await db
      .select()
      .from(nocQuotas)
      .where(eq(nocQuotas.nocCode, TEST_NOC));

    expect(row).toBeDefined();
    expect(row.eTotal).toBe(5);
    expect(row.esTotal).toBe(2);
    expect(row.nocETotal).toBe(2);
    expect(row.nocEsTotal).toBe(1);

    clearSession();
  });

  it("legacy 7-column CSV defaults nocEsTotal to 0 (back-compat)", async () => {
    await db.delete(nocQuotas).where(eq(nocQuotas.nocCode, TEST_NOC));
    await db.delete(quotaChanges).where(eq(quotaChanges.nocCode, TEST_NOC));

    await setSession(SESSIONS.ioc);

    const fd = makeFormData({ csv: `${TEST_NOC},5,2,3,1,0,0,2` });
    const { redirect } = await callAction(() => importQuotas(fd));
    expect(redirect?.url).toContain("success=imported");

    const [row] = await db
      .select()
      .from(nocQuotas)
      .where(eq(nocQuotas.nocCode, TEST_NOC));

    expect(row).toBeDefined();
    expect(row.nocETotal).toBe(2);
    expect(row.nocEsTotal).toBe(0);

    clearSession();
  });
});

// ─── saveQuotaEdits — manual NocEs edit logs a quota_change ──────────────────

describe("IOC saveQuotaEdits — NocEs", () => {
  it("updates nocEsTotal and writes a quota_changes row with quotaType='noc_es'", async () => {
    // Seed a row with nocEsTotal=1 so the manual edit produces a diff
    await db.delete(quotaChanges).where(eq(quotaChanges.nocCode, TEST_NOC));
    await db.delete(nocQuotas).where(eq(nocQuotas.nocCode, TEST_NOC));
    await db.insert(nocQuotas).values({
      nocCode: TEST_NOC,
      eventId: "LA28",
      eTotal: 5, esTotal: 2, epTotal: 3, epsTotal: 1, etTotal: 0, ecTotal: 0,
      nocETotal: 2, nocEsTotal: 1,
    });

    await setSession(SESSIONS.ioc);

    // saveQuotaEdits regex parses `${prefix}_${nocCode}`. We must hand it
    // every category key for THIS NOC so it can detect the row.
    const fd = makeFormData({
      [`e_${TEST_NOC}`]:      5,
      [`es_${TEST_NOC}`]:     2,
      [`ep_${TEST_NOC}`]:     3,
      [`eps_${TEST_NOC}`]:    1,
      [`et_${TEST_NOC}`]:     0,
      [`ec_${TEST_NOC}`]:     0,
      [`noc_e_${TEST_NOC}`]:  2,
      [`noc_es_${TEST_NOC}`]: 4,
    });

    const { redirect } = await callAction(() => saveQuotaEdits(fd));
    expect(redirect?.url).toContain("success=saved");

    const [row] = await db
      .select()
      .from(nocQuotas)
      .where(eq(nocQuotas.nocCode, TEST_NOC));
    expect(row.nocEsTotal).toBe(4);

    const changes = await db
      .select()
      .from(quotaChanges)
      .where(and(
        eq(quotaChanges.nocCode, TEST_NOC),
        eq(quotaChanges.quotaType, "noc_es"),
      ));
    expect(changes.length).toBe(1);
    expect(changes[0].oldValue).toBe(1);
    expect(changes[0].newValue).toBe(4);
    expect(changes[0].changeSource).toBe("manual_edit");

    clearSession();
  });
});

// ─── OCOG sendToAcr — nocEsSlots flows through to ACR records ────────────────

describe("OCOG sendToAcr — NocEs slots", () => {
  it("captured OrgExportRecord includes nocEsSlots", async () => {
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 3 });
    const allocId = await createTestAllocation(orgId, "USA", { pbnState: "ocog_approved", eSlots: 3 });

    await db
      .update(orgSlotAllocations)
      .set({ nocEsSlots: 2 })
      .where(eq(orgSlotAllocations.id, allocId));

    // Reset spy so we can read just THIS call's payload
    (acrClient.pushOrgData as ReturnType<typeof vi.fn>).mockClear();

    await setSession(SESSIONS.ocog);
    const { redirect } = await callAction(() => sendToAcr(makeFormData({ noc_code: "USA" })));
    expect(redirect?.url).toContain("success=sent_to_acr");

    const calls = (acrClient.pushOrgData as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const records = calls[0][0] as Array<{ organizationId: string; nocEsSlots: number }>;
    const ours = records.find((r) => r.organizationId === orgId);
    expect(ours).toBeDefined();
    expect(ours!.nocEsSlots).toBe(2);

    clearSession();
  });
});
