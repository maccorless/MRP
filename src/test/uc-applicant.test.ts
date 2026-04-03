/**
 * Integration tests: EoI Applicant → Apply use cases.
 * Runs against the real DB configured in .env.local.
 * All test emails use @test.invalid to avoid contamination.
 */

import { vi, describe, it, expect, afterAll } from "vitest";

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
  headers: async () => ({
    get: (_name: string) => null,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { requestToken, submitApplication } from "@/app/apply/actions";
import { db } from "@/db";
import { magicLinkTokens, organizations, applications, auditLog } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { hashToken } from "@/lib/tokens";
import {
  callAction,
  createTestOrg,
  createTestApplication,
  makeFormData,
} from "./helpers";

// ─── Local test helpers ───────────────────────────────────────────────────────

const TS = Date.now();

/**
 * Insert a valid magic link token. Uses a unique raw token per call
 * (includes a counter) to avoid duplicate-hash collisions when multiple
 * tests call this in the same process.
 */
let tokenCounter = 0;
async function insertTestToken(
  email: string,
  opts: { expiresAt?: Date; usedAt?: Date } = {}
): Promise<string> {
  const raw = `TESTUC_${TS}_${++tokenCounter}`;
  const tokenHash = hashToken(raw);
  await db.insert(magicLinkTokens).values({
    email,
    tokenHash,
    expiresAt: opts.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    usedAt: opts.usedAt,
  });
  return raw;
}

/**
 * Clean up all data created by this test file.
 * Scoped to @test.invalid emails and orgs named with our TS marker.
 * Does NOT touch sudo_tokens (table may not exist in all environments).
 */
async function localCleanup(): Promise<void> {
  // Audit log entries referencing test applications (must go before applications)
  const testApps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(like(applications.contactEmail, "%@test.invalid"));
  for (const a of testApps) {
    await db.delete(auditLog).where(eq(auditLog.applicationId, a.id));
  }

  // Applications whose contact email is a test address
  await db.delete(applications).where(like(applications.contactEmail, "%@test.invalid"));

  // Orgs whose name contains the timestamp marker from this run
  const testOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(like(organizations.name, `%${TS}%`));
  for (const o of testOrgs) {
    await db.delete(organizations).where(eq(organizations.id, o.id));
  }

  // Magic link tokens for test addresses
  await db.delete(magicLinkTokens).where(like(magicLinkTokens.email, "%@test.invalid"));
}
const testEmail = (label: string) => `applicant_${label}_${TS}@test.invalid`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal valid EoI FormData for a new application. */
function buildValidFormData(token: string, email: string, overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.append("token", token);
  fd.append("email", email);
  fd.append("org_name", `Test Media Org ${TS}`);
  fd.append("org_type", "news_agency");
  fd.append("country", "US");
  fd.append("noc_code", "USA");
  fd.append("contact_first_name", "Jane");
  fd.append("contact_last_name", "Tester");
  fd.append("about", "Integration test application — please ignore.");
  // Category checkbox (parseCategorySelections reads "category_E" === "on")
  fd.append("category_E", "on");
  fd.append("requested_E", "3");

  for (const [k, v] of Object.entries(overrides)) {
    fd.append(k, v);
  }
  return fd;
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

afterAll(async () => {
  await localCleanup();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("requestToken", () => {
  it("valid email creates token and redirects to /apply/verify", async () => {
    const email = testEmail("req_valid");
    const fd = makeFormData({ email });

    const { redirect } = await callAction(() => requestToken(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toMatch(/^\/apply\/verify\?token=/);

    // Extract token from redirect URL and verify it exists in DB
    const url = new URL(redirect!.url, "http://localhost");
    const rawToken = url.searchParams.get("token");
    expect(rawToken).toBeTruthy();

    const tokenHash = hashToken(rawToken!);
    const [row] = await db
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.tokenHash, tokenHash),
          eq(magicLinkTokens.email, email)
        )
      );

    expect(row).toBeDefined();
    expect(row.usedAt).toBeNull();
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("invalid email redirects to /apply?error=invalid_email", async () => {
    const fd = makeFormData({ email: "notanemail" });

    const { redirect } = await callAction(() => requestToken(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/apply?error=invalid_email");
  });

  it("rate limits after 5 token requests from the same email in one hour", async () => {
    const email = testEmail("rate_limit");

    // Insert 5 tokens directly (simulating 5 prior requests within the last hour)
    for (let i = 0; i < 5; i++) {
      await db.insert(magicLinkTokens).values({
        email,
        tokenHash: hashToken(`RATELIMIT_${TS}_${i}`),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    }

    const fd = makeFormData({ email });
    const { redirect } = await callAction(() => requestToken(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/apply?error=rate_limited");
  });
});

describe("submitApplication", () => {
  it("valid new application creates org, application, marks token used", async () => {
    const email = testEmail("submit_new");
    const rawToken = await insertTestToken(email);
    const fd = buildValidFormData(rawToken, email);

    const { redirect } = await callAction(() => submitApplication(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toMatch(/^\/apply\/submitted\?ref=(APP|TEST)-/);

    // Extract ref from redirect
    const url = new URL(redirect!.url, "http://localhost");
    const ref = url.searchParams.get("ref");
    expect(ref).toBeTruthy();

    // Verify application exists with status=pending
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.referenceNumber, ref!));

    expect(app).toBeDefined();
    expect(app.status).toBe("pending");
    expect(app.contactEmail).toBe(email);

    // Verify token is marked used
    const tokenHash = hashToken(rawToken);
    const [tokenRow] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    expect(tokenRow.usedAt).not.toBeNull();
  });

  it("expired token redirects to /apply?error=invalid_token", async () => {
    const email = testEmail("submit_expired");
    const rawToken = await insertTestToken(email, {
      expiresAt: new Date(Date.now() - 60_000), // 1 minute in the past
    });

    const fd = buildValidFormData(rawToken, email);
    const { redirect } = await callAction(() => submitApplication(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/apply?error=invalid_token");
  });

  it("already-used token redirects to /apply?error=invalid_token", async () => {
    const email = testEmail("submit_used");
    const rawToken = await insertTestToken(email, {
      usedAt: new Date(), // already consumed
    });

    const fd = buildValidFormData(rawToken, email);
    const { redirect } = await callAction(() => submitApplication(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/apply?error=invalid_token");
  });

  it("no category selected redirects to /apply?error=invalid_category", async () => {
    const email = testEmail("submit_nocat");
    const rawToken = await insertTestToken(email);

    // Build FormData without any category checkboxes
    const fd = new FormData();
    fd.append("token", rawToken);
    fd.append("email", email);
    fd.append("org_name", `Test Org NoCategory ${TS}`);
    fd.append("org_type", "news_agency");
    fd.append("country", "US");
    fd.append("noc_code", "USA");
    fd.append("contact_first_name", "Bob");
    fd.append("contact_last_name", "Tester");
    fd.append("about", "No category test.");
    // Deliberately omitting all category_* checkboxes

    const { redirect } = await callAction(() => submitApplication(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toBe("/apply?error=invalid_category");
  });

  it("resubmission updates existing returned application", async () => {
    const email = testEmail("resubmit");

    // Create an org + returned application for this email
    const orgId = await createTestOrg("USA");

    // We need the org's emailDomain to match the email so the lookup works.
    // createTestOrg uses T_<TS>.test as domain, but our token lookup uses the
    // contactEmail on the application — we just need to make the application
    // directly with this email.
    const { id: appId, referenceNumber } = await createTestApplication(orgId, "USA", {
      status: "returned",
    });

    // Patch the application's contactEmail to match our test email
    await db
      .update(applications)
      .set({ contactEmail: email })
      .where(eq(applications.id, appId));

    // Create a fresh token for the same email
    const rawToken = await insertTestToken(email);

    // Build resubmission FormData with resubmit_id
    const fd = buildValidFormData(rawToken, email, { resubmit_id: appId });

    const { redirect } = await callAction(() => submitApplication(fd));

    expect(redirect).toBeDefined();
    expect(redirect!.url).toMatch(/^\/apply\/submitted\?ref=.+&resubmit=1$/);

    // Verify application status is now resubmitted
    const [updated] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, appId));

    expect(updated.status).toBe("resubmitted");

    // Verify token is marked used
    const tokenHash = hashToken(rawToken);
    const [tokenRow] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.tokenHash, tokenHash));

    expect(tokenRow.usedAt).not.toBeNull();
  });
});
