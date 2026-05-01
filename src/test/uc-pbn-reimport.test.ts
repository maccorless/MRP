/**
 * Integration tests: PbN CSV re-import audit (A7).
 * Verifies that per-field excel_reimport audit entries are written with old→new format.
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

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { db } from "@/db";
import { organizations, orgSlotAllocations, nocQuotas, auditLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { POST } from "@/app/api/import/pbn/route";
import { NextRequest } from "next/server";
import { encodeSession } from "@/lib/session";

const TEST_NOC = "TST";
const TEST_ACTOR_ID = "test-reimport";
const ORG_NAME = `Test Wire Service ${Date.now()}`;

let orgId: string;

beforeAll(async () => {
  // Delete stale TST quota from prior failed runs (quota check is skipped when absent)
  await db
    .delete(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, TEST_NOC), eq(nocQuotas.eventId, "LA28")));

  // Create org
  const [org] = await db
    .insert(organizations)
    .values({ name: ORG_NAME, nocCode: TEST_NOC, orgType: "news_agency" })
    .returning({ id: organizations.id });
  orgId = org.id;

  // Create draft allocation with eSlots=2 — the CSV will change it to 5
  await db.insert(orgSlotAllocations).values({
    organizationId: orgId,
    nocCode: TEST_NOC,
    eventId: "LA28",
    eSlots: 2,
    epSlots: 1,
    pressSlots: 2,
    photoSlots: 1,
    pbnState: "draft",
  });
});

afterAll(async () => {
  await db.delete(auditLog).where(eq(auditLog.actorId, TEST_ACTOR_ID));
  await db.delete(orgSlotAllocations).where(eq(orgSlotAllocations.organizationId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
});

describe("PbN CSV reimport audit", () => {
  it("logs excel_reimport per-field entries when a slot value changes", async () => {
    const csv = [
      "org_name,org_type,country,e_slots,es_slots,ep_slots,eps_slots,et_slots,ec_slots",
      `${ORG_NAME},news_agency,,5,0,1,0,0,0`, // eSlots: 2 → 5
    ].join("\n");

    const sessionCookie = await encodeSession({
      userId: TEST_ACTOR_ID,
      email: "test-reimport@example.com",
      role: "noc_admin",
      nocCode: TEST_NOC,
      ifCode: null,
      displayName: "Test NOC Admin",
    });

    mockCookieStore.set("prp_session", sessionCookie);

    const request = new NextRequest("http://localhost/api/import/pbn", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: csv }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json() as { imported: number; skipped: number; errors: string[] };
    expect(body.imported).toBe(1);
    expect(body.errors).toHaveLength(0);

    // Assert the per-field audit entry with old→new format
    const auditEntries = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.actorId, TEST_ACTOR_ID), eq(auditLog.action, "excel_reimport")));

    const fieldEntry = auditEntries.find(
      (e) => e.detail?.includes("eSlots") && e.detail?.includes("2 → 5")
    );
    expect(fieldEntry).toBeDefined();
    expect(fieldEntry?.detail).toContain(ORG_NAME);
  });
});
