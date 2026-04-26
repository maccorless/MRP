import { vi, describe, it, expect, afterAll } from "vitest";
import fs from "fs";
import path from "path";

// ─── Mocks for the integration block at the bottom ────────────────────────────
// (vi.mock is hoisted; the structural tests above don't import next/*, so the
// mocks are inert for them.)

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
  headers: async () => ({ get: (_n: string) => null }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

/**
 * Structural invariant tests for the EoI form submission flow.
 *
 * The Publication-tab-next-submits-the-form bug has regressed 6+ times. Every
 * prior fix patched a *runtime* event path (Enter key, hidden-tab validation,
 * etc.) while leaving the underlying structural issue in place: the <form>
 * element was bound to a server action via `action={submitApplication}`, which
 * made submission ambient — any DOM event that triggers native submission
 * reaches the server unless every code path is guarded.
 *
 * This suite asserts the invariant at the source-text level, which CANNOT be
 * bypassed by a new event path. If someone re-adds `action={submitApplication}`
 * to the form, or removes the imperative `submitApplication(new FormData(...))`
 * call from handleConfirmedSubmit, this test fails immediately.
 */

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/apply/form/EoiFormTabs.tsx"),
  "utf8"
);

describe("EoiFormTabs submission structural invariants", () => {
  it("form element is NOT bound to a server action via the action prop", () => {
    // Regression guard: the form must not carry action={submitApplication}
    // because that creates an ambient submit path that bypasses our validation.
    expect(source).not.toMatch(/<form[^>]*action=\{submitApplication\}/);
    expect(source).not.toMatch(/<form[^>]*action=\{[^}]*submitApplication/);
  });

  it("submitApplication is invoked imperatively with FormData", () => {
    // The only path to the server must be the explicit imperative call
    // inside handleConfirmedSubmit. Accepts either `submitApplication(new FormData(...))`
    // or the FormData built into a local then passed: `submitApplication(fd)`.
    const hasFormDataConstruction = /new FormData\(\s*form/.test(source);
    const hasSubmitCall = /submitApplication\(/.test(source);
    expect(hasFormDataConstruction, "expected `new FormData(form)` to be built in handleConfirmedSubmit").toBe(true);
    expect(hasSubmitCall, "expected `submitApplication(...)` call to be present").toBe(true);
  });

  it("handleConfirmedSubmit does not rely on formRef.requestSubmit", () => {
    // requestSubmit would re-fire the onSubmit handler and reintroduce the
    // ambient-submission pattern we are trying to eliminate.
    expect(source).not.toMatch(/requestSubmit\(\)/);
  });

  it("exactly one button has type=\"submit\" (the final-tab Submit)", () => {
    const matches = source.match(/type="submit"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("handleSubmit unconditionally preventDefaults before any branching", () => {
    // The early-return `confirmedRef` escape hatch is gone; preventDefault
    // must run on every submit event because no submit event is ever supposed
    // to reach the server via this handler.
    const handleSubmitBody = source.match(
      /function handleSubmit\(e: React\.FormEvent<HTMLFormElement>\) \{[\s\S]*?\n  \}/
    );
    expect(handleSubmitBody, "handleSubmit function not found in source").toBeTruthy();
    const body = handleSubmitBody![0];
    expect(body).toMatch(/e\.preventDefault\(\)/);
    expect(body).not.toMatch(/confirmedRef/);
  });

  it("history-tab-visited gate exists in handleSubmit", () => {
    // History (last tab) must be viewed before submission is accepted.
    expect(source).toMatch(/visitedTabsRef\.current\.has\(TABS\.length - 1\)/);
  });

  it("Continue button does not pre-mark the next tab as visited", () => {
    // Continue's onClick should only markVisited(activeTab), not activeTab + 1.
    // Pre-marking the next tab defeats the "must be viewed" gate because
    // the tab appears visited before the user has ever seen it.
    expect(source).not.toMatch(/markVisited\(activeTab \+ 1\)/);
  });

  it("Continue and Submit buttons have distinct keys so React cannot reuse the DOM node", () => {
    // Without distinct keys, React treats the Continue (type="button") and
    // Submit (type="submit") buttons as the same element across the ternary
    // and just flips `type`. If React reconciles the type flip mid-click, the
    // browser's native submit default fires — the exact Publication-tab race
    // that hit Railway staging but not dev.
    expect(source).toMatch(/key="eoi-nav-continue"/);
    expect(source).toMatch(/key="eoi-nav-submit"/);
  });

  it("Submit button carries a data-eoi-submit marker and handleSubmit checks the submitter", () => {
    // Belt-and-suspenders: even if a stray submit event fires with an
    // unexpected submitter (type-flip race, autofill, extension), handleSubmit
    // must ignore it unless the submitter is our explicit final Submit button.
    expect(source).toMatch(/data-eoi-submit="final"/);
    expect(source).toMatch(/submitter\?\.dataset\.eoiSubmit === "final"/);
  });
});

// ─── §5 from 2026-04-26 test plan: server accepts ENR > 3 for non_mrh ─────────

describe("submitApplication — ENR slot soft warning (server)", () => {
  // Lazy import after vi.mock hoist
  it("accepts requested_ENR > 3 for non_mrh org type", async () => {
    const { submitApplication } = await import("@/app/apply/actions");
    const { db } = await import("@/db");
    const { magicLinkTokens, organizations, applications, auditLog } = await import("@/db/schema");
    const { eq, like } = await import("drizzle-orm");
    const { hashToken } = await import("@/lib/tokens");

    const ts = Date.now();
    const email = `applicant_enr4_${ts}@test.invalid`;
    const rawToken = `TESTUC_ENR4_${ts}`;
    await db.insert(magicLinkTokens).values({
      email,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const fd = new FormData();
    fd.append("token", rawToken);
    fd.append("email", email);
    fd.append("org_name", `Test ENR Org ${ts}`);
    fd.append("org_type", "non_mrh");
    fd.append("country", "US");
    fd.append("noc_code", "USA");
    fd.append("contact_first_name", "Jane");
    fd.append("contact_last_name", "Tester");
    fd.append("about", "ENR > 3 server-acceptance test.");
    fd.append("gdpr_accepted", "true");
    fd.append("category_ENR", "on");
    fd.append("requested_ENR", "4");

    let redirected: string | undefined;
    try {
      await submitApplication(fd);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("REDIRECT:")) {
        redirected = err.message.slice("REDIRECT:".length);
      } else {
        throw err;
      }
    }

    expect(redirected).toBeDefined();
    // The action should land on /apply/submitted, NOT /apply?error=...
    expect(redirected!).toMatch(/^\/apply\/submitted\?ref=/);

    // Cleanup the rows this test created
    const testApps = await db
      .select({ id: applications.id, organizationId: applications.organizationId })
      .from(applications)
      .where(eq(applications.contactEmail, email));
    for (const a of testApps) {
      await db.delete(auditLog).where(eq(auditLog.applicationId, a.id));
    }
    await db.delete(applications).where(eq(applications.contactEmail, email));
    await db.delete(organizations).where(like(organizations.name, `%${ts}%`));
    await db.delete(magicLinkTokens).where(eq(magicLinkTokens.email, email));
  });
});
