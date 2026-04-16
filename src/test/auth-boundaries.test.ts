/**
 * Authorization boundary tests — TEST-1
 *
 * Verifies that every server action and export API route rejects:
 *   - unauthenticated requests (no session cookie)
 *   - wrong-role requests (session for a different role)
 *   - sudo sessions on any write action (requireWritable)
 *
 * These tests do NOT require a DB connection. Auth guards fire before any
 * query, so all assertions here are redirect/status checks only.
 *
 * Pattern: redirect to /admin/login  → role guard (requireXxxSession)
 *          redirect to /admin?error=sudo_readonly → write guard (requireWritable)
 *          HTTP 401                               → export route manual check
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// These tests don't need the real secret — they verify redirect behaviour only.
// Must be set before any import of @/lib/session.
process.env.NEXTAUTH_SECRET = "test-secret-for-boundary-tests";

// ─── Mocks (hoisted — must come before all imports) ───────────────────────────

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

import { SESSIONS, callAction, makeFormData } from "./helpers";
import type { SessionPayload } from "@/lib/session";

// ─── Session helpers ──────────────────────────────────────────────────────────

const IOC_READONLY: SessionPayload = {
  userId: "test-ioc-ro",
  email: "ioc.readonly@olympics.org",
  role: "ioc_readonly",
  nocCode: null,
  ifCode: null,
  displayName: "IOC Readonly",
};

async function setSession(payload: SessionPayload) {
  const { encodeSession } = await import("@/lib/session");
  const encoded = await encodeSession(payload);
  mockCookieStore.set("prp_session", encoded);
}

async function setSudoSession(payload: SessionPayload) {
  const { encodeSession } = await import("@/lib/session");
  const encoded = await encodeSession(payload);
  mockCookieStore.set("prp_sudo_session", encoded);
}

function expectLoginRedirect(out: { redirect?: { url: string }; error?: Error }) {
  expect(out.redirect?.url).toBe("/admin/login");
}

function expectSudoBlocked(out: { redirect?: { url: string }; error?: Error }) {
  expect(out.redirect?.url).toBe("/admin?error=sudo_readonly");
}

// ─── Shared form data (minimal — actions check auth before validating fields) ─

const ANY_ID = makeFormData({ id: "nonexistent-id" });
const ANY_CSV = makeFormData({ csv: "USA,10,5,10,5,10,10,0" });

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockCookieStore.clear();
});

// =============================================================================
// NOC ACTIONS
// =============================================================================

describe("NOC actions — approveApplication", () => {
  let approveApplication: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ approveApplication } = await import("@/app/admin/noc/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => approveApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects ioc_admin", async () => {
    await setSession(SESSIONS.ioc);
    const out = await callAction(() => approveApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects ocog_admin", async () => {
    await setSession(SESSIONS.ocog);
    const out = await callAction(() => approveApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects sudo session (write guard)", async () => {
    // Base NOC session + sudo overlay — requireWritable fires before requireNocSession
    await setSession(SESSIONS.ioc);
    await setSudoSession(SESSIONS.sudoAsNocUSA);
    const out = await callAction(() => approveApplication(ANY_ID));
    expectSudoBlocked(out);
  });
});

describe("NOC actions — returnApplication", () => {
  let returnApplication: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ returnApplication } = await import("@/app/admin/noc/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => returnApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects ioc_admin", async () => {
    await setSession(SESSIONS.ioc);
    const out = await callAction(() => returnApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects sudo session", async () => {
    await setSession(SESSIONS.ioc);
    await setSudoSession(SESSIONS.sudoAsNocUSA);
    const out = await callAction(() => returnApplication(ANY_ID));
    expectSudoBlocked(out);
  });
});

describe("NOC actions — rejectApplication", () => {
  let rejectApplication: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ rejectApplication } = await import("@/app/admin/noc/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => rejectApplication(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects ocog_admin", async () => {
    await setSession(SESSIONS.ocog);
    const out = await callAction(() => rejectApplication(ANY_ID));
    expectLoginRedirect(out);
  });
});

describe("NOC fast-track — submitFastTrackApplication", () => {
  let submitFastTrackApplication: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ submitFastTrackApplication } = await import(
      "@/app/admin/noc/fast-track/actions"
    ));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() =>
      submitFastTrackApplication(ANY_ID)
    );
    expectLoginRedirect(out);
  });

  it("rejects ioc_admin", async () => {
    await setSession(SESSIONS.ioc);
    const out = await callAction(() =>
      submitFastTrackApplication(ANY_ID)
    );
    expectLoginRedirect(out);
  });

  it("rejects sudo session", async () => {
    await setSession(SESSIONS.ioc);
    await setSudoSession(SESSIONS.sudoAsNocUSA);
    const out = await callAction(() =>
      submitFastTrackApplication(ANY_ID)
    );
    expectSudoBlocked(out);
  });
});

// =============================================================================
// IOC ACTIONS
// =============================================================================

describe("IOC quota actions — saveQuotaEdits", () => {
  let saveQuotaEdits: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ saveQuotaEdits } = await import("@/app/admin/ioc/quotas/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => saveQuotaEdits(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects noc_admin", async () => {
    await setSession(SESSIONS.nocUSA);
    const out = await callAction(() => saveQuotaEdits(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects ocog_admin", async () => {
    await setSession(SESSIONS.ocog);
    const out = await callAction(() => saveQuotaEdits(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects ioc_readonly (requireIocAdminSession, not just requireIocSession)", async () => {
    await setSession(IOC_READONLY);
    const out = await callAction(() => saveQuotaEdits(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects sudo session", async () => {
    await setSession(SESSIONS.ioc);
    await setSudoSession(SESSIONS.sudoAsNocUSA);
    const out = await callAction(() => saveQuotaEdits(ANY_CSV));
    expectSudoBlocked(out);
  });
});

describe("IOC quota actions — importQuotas", () => {
  let importQuotas: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ importQuotas } = await import("@/app/admin/ioc/quotas/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => importQuotas(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects noc_admin", async () => {
    await setSession(SESSIONS.nocUSA);
    const out = await callAction(() => importQuotas(ANY_CSV));
    expectLoginRedirect(out);
  });

  it("rejects ioc_readonly", async () => {
    await setSession(IOC_READONLY);
    const out = await callAction(() => importQuotas(ANY_CSV));
    expectLoginRedirect(out);
  });
});

// =============================================================================
// OCOG ACTIONS
// =============================================================================

describe("OCOG pbn actions — approvePbn", () => {
  let approvePbn: (fd: FormData) => Promise<never>;

  beforeEach(async () => {
    ({ approvePbn } = await import("@/app/admin/ocog/pbn/actions"));
  });

  it("rejects unauthenticated", async () => {
    const out = await callAction(() => approvePbn(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects noc_admin", async () => {
    await setSession(SESSIONS.nocUSA);
    const out = await callAction(() => approvePbn(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects ioc_admin", async () => {
    await setSession(SESSIONS.ioc);
    const out = await callAction(() => approvePbn(ANY_ID));
    expectLoginRedirect(out);
  });

  it("rejects sudo session", async () => {
    await setSession(SESSIONS.ioc);
    await setSudoSession(SESSIONS.sudoAsNocUSA);
    const out = await callAction(() => approvePbn(ANY_ID));
    expectSudoBlocked(out);
  });
});

// =============================================================================
// EXPORT API ROUTES
// =============================================================================

describe("Export routes — /api/export/pbn", () => {
  it("returns 401 with no session", async () => {
    const { GET } = await import("@/app/api/export/pbn/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 for noc_admin", async () => {
    await setSession(SESSIONS.nocUSA);
    const { GET } = await import("@/app/api/export/pbn/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 for ocog_admin", async () => {
    await setSession(SESSIONS.ocog);
    const { GET } = await import("@/app/api/export/pbn/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// /api/export/eoi, /api/export/enr, /api/export/pbn-allocations are intentionally
// accessible to all authenticated admins (NOC sees own-scoped data, IOC/OCOG see all).
// Only the unauthenticated case is tested here; the authorised path requires a live DB.
describe("Export routes — /api/export/eoi", () => {
  it("returns 401 with no session", async () => {
    const { GET } = await import("@/app/api/export/eoi/route");
    const res = await GET(new Request("http://localhost/api/export/eoi"));
    expect(res.status).toBe(401);
  });
});

describe("Export routes — /api/export/enr", () => {
  it("returns 401 with no session", async () => {
    const { GET } = await import("@/app/api/export/enr/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("Export routes — /api/export/pbn-allocations", () => {
  it("returns 401 with no session", async () => {
    const { GET } = await import("@/app/api/export/pbn-allocations/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
