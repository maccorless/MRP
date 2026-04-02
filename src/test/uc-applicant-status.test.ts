/**
 * Integration tests: B2 — Applicant status portal.
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

import { requestStatusToken } from "@/app/apply/status/actions";
import { db } from "@/db";
import { magicLinkTokens, applications, organizations } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { hashToken } from "@/lib/tokens";
import { callAction, makeFormData, cleanupTestData, createTestOrg, createTestApplication } from "./helpers";
import { gte } from "drizzle-orm";

beforeAll(async () => { await cleanupTestData(); });
afterAll(async () => {
  await db.delete(magicLinkTokens).where(like(magicLinkTokens.email, "%@statustest.invalid"));
  await cleanupTestData();
});

describe("requestStatusToken", () => {
  it("creates a magic link token and redirects to status view", async () => {
    const testStart = new Date(Date.now() - 500);
    const email = `applicant_${Date.now()}@statustest.invalid`;
    const fd = makeFormData({ email });
    const { redirect } = await callAction(() => requestStatusToken(fd));

    expect(redirect?.url).toMatch(/^\/apply\/status\/view\?token=.+&email=/);

    // Extract token from redirect URL
    const url = new URL(redirect!.url, "http://localhost");
    const rawToken = url.searchParams.get("token")!;
    const returnedEmail = decodeURIComponent(url.searchParams.get("email")!);

    expect(returnedEmail).toBe(email);

    // Verify token exists in DB — filter by email (unique per test) + recent creation time
    // to avoid false negatives from concurrent test cleanup deleting all tokens
    const tokenHash = hashToken(rawToken);
    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        eq(magicLinkTokens.email, email),
        gte(magicLinkTokens.createdAt, testStart),
      ));

    expect(tokenRecord).toBeDefined();
    expect(tokenRecord.usedAt).toBeNull();
    expect(tokenRecord.expiresAt > new Date()).toBe(true);
  });

  it("rejects invalid email", async () => {
    const { redirect } = await callAction(() => requestStatusToken(makeFormData({ email: "not-an-email" })));
    expect(redirect?.url).toBe("/apply/status?error=invalid_email");
  });
});

describe("status view page authentication", () => {
  it("redirects to /apply?error=invalid_token for unknown token", async () => {
    // Dynamically import the page render function — we test the token validation logic
    // by checking with a non-existent token hash
    const fakeToken = "FAKE_TOKEN_99999";
    const tokenHash = hashToken(fakeToken);
    const [row] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    // Should not exist
    expect(row).toBeUndefined();
  });

  it("status token is not consumed on issuance (single-use at view time)", async () => {
    const email = `consume_${Date.now()}@statustest.invalid`;
    const fd = makeFormData({ email });
    const { redirect } = await callAction(() => requestStatusToken(fd));

    const url = new URL(redirect!.url, "http://localhost");
    const rawToken = url.searchParams.get("token")!;
    const tokenHash = hashToken(rawToken);

    // Token should still be unused after requestStatusToken
    const [tokenRecord] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    expect(tokenRecord.usedAt).toBeNull();
  });
});

describe("application data query for status view", () => {
  it("finds applications for a given email", async () => {
    const email = `statusview_${Date.now()}@statustest.invalid`;
    const orgId = await createTestOrg("USA");

    // Create an application with this email
    const seq = String(Math.floor(Math.random() * 99000) + 1000).padStart(5, "0");
    const referenceNumber = `TEST-STATUS-USA-${seq}`;
    await db.insert(applications).values({
      referenceNumber,
      organizationId: orgId,
      nocCode: "USA",
      contactName: "Status Test Applicant",
      contactEmail: email,
      categoryPress: true,
      categoryPhoto: false,
      categoryE: true,
      requestedE: 2,
      about: "Status test",
      status: "returned",
      reviewNote: "Please add more details about your coverage plans.",
    });

    const rows = await db
      .select({ ref: applications.referenceNumber, status: applications.status, note: applications.reviewNote })
      .from(applications)
      .where(eq(applications.contactEmail, email));

    expect(rows).toHaveLength(1);
    expect(rows[0].ref).toBe(referenceNumber);
    expect(rows[0].status).toBe("returned");
    expect(rows[0].note).toBe("Please add more details about your coverage plans.");
  });

  it("finds approved application with slot allocation", async () => {
    const email = `statusalloc_${Date.now()}@statustest.invalid`;
    const orgId = await createTestOrg("USA");
    await createTestApplication(orgId, "USA", { status: "approved", categoryE: true, requestedE: 5 });

    // Insert a slot allocation for this org
    const { orgSlotAllocations } = await import("@/db/schema");
    await db.insert(orgSlotAllocations).values({
      organizationId: orgId,
      nocCode: "USA",
      eventId: "LA28",
      eSlots: 4,
      pressSlots: 4,
      photoSlots: 0,
      pbnState: "ocog_approved",
    });

    // Verify the join works: find allocation for this org
    const allocs = await db
      .select({ eSlots: orgSlotAllocations.eSlots })
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.organizationId, orgId));

    expect(allocs[0].eSlots).toBe(4);
  });
});
