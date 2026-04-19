import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

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
});
