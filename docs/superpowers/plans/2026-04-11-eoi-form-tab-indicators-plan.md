**Last updated: 11-Apr-2026 08:58**

# EoI Form Tab Indicators & Smart Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the confusing green-dot-only tab indicator with a three-state system (gray / green dot / green checkmark), gate indicators on tab visit, and replace the pre-submission confirmation modal with a context-aware version that nudges users with incomplete optional fields.

**Architecture:** All changes are confined to `EoiFormTabs.tsx`. Visited state is a `Set<number>` held in both a ref (for synchronous reads inside callbacks) and React state (for rendering). A `isTabFull` function does per-tab DOM inspection to determine checkmark eligibility. The submission modal is made context-aware by checking whether all five tabs are `"full"`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · localStorage · Vitest (node environment, no jsdom — DOM logic verified manually)

---

## File map

| File | Change |
|---|---|
| `src/app/apply/form/EoiFormTabs.tsx` | All logic + rendering changes |
| `src/test/eoi-visited.test.ts` | New — unit tests for pure helper functions |

No other files change.

---

## Task 1: Visited tracking — pure helpers + tests

The only logic we can test in Vitest's node environment without DOM is the localStorage serialization. Extract two pure functions.

**Files:**
- Create: `src/test/eoi-visited.test.ts`
- Modify: `src/app/apply/form/EoiFormTabs.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/test/eoi-visited.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { serializeVisited, deserializeVisited } from "@/app/apply/form/EoiFormTabs";

describe("serializeVisited", () => {
  it("serialises an empty set to an empty JSON array", () => {
    expect(serializeVisited(new Set())).toBe("[]");
  });

  it("serialises a populated set to a sorted JSON array", () => {
    expect(serializeVisited(new Set([2, 0, 4]))).toBe("[0,2,4]");
  });
});

describe("deserializeVisited", () => {
  it("returns an empty set for null", () => {
    expect(deserializeVisited(null).size).toBe(0);
  });

  it("returns an empty set for invalid JSON", () => {
    expect(deserializeVisited("not-json").size).toBe(0);
  });

  it("reconstructs a set from a valid JSON array", () => {
    const result = deserializeVisited("[0,2,4]");
    expect(result.has(0)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(4)).toBe(true);
    expect(result.size).toBe(3);
  });

  it("ignores non-number entries", () => {
    const result = deserializeVisited('["a", 1, null, 3]');
    expect(result.has(1)).toBe(true);
    expect(result.has(3)).toBe(true);
    expect(result.size).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/test/eoi-visited.test.ts
```

Expected: FAIL — `serializeVisited` and `deserializeVisited` not exported.

- [ ] **Step 3: Add exports to EoiFormTabs.tsx**

Add these two functions near the top of `EoiFormTabs.tsx`, after the imports and before the `TABS` constant:

```typescript
/** Serialize visited tab indices to a JSON string for localStorage. */
export function serializeVisited(visited: Set<number>): string {
  return JSON.stringify([...visited].sort((a, b) => a - b));
}

/** Deserialize visited tab indices from a localStorage string. Returns empty set on error. */
export function deserializeVisited(raw: string | null): Set<number> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is number => typeof x === "number"));
  } catch {
    return new Set();
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test src/test/eoi-visited.test.ts
```

Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/test/eoi-visited.test.ts src/app/apply/form/EoiFormTabs.tsx
git commit -m "feat: add visited-tab serialization helpers + tests"
```

---

## Task 2: Visited state in EoiFormTabs

Wire up `visitedTabs` state and ref, persist to localStorage, restore on mount, and call `markVisited` in all three navigation paths.

**Files:**
- Modify: `src/app/apply/form/EoiFormTabs.tsx`

- [ ] **Step 1: Add visited storage key and state**

In `EoiFormTabs`, alongside the existing `storageKey` line, add:

```typescript
const visitedKey = `eoi-visited-${email}`;
```

Add a ref and state for visited tabs directly after `const [fieldErrors, ...` state declarations:

```typescript
const visitedTabsRef = useRef<Set<number>>(new Set());
const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set());
```

- [ ] **Step 2: Add markVisited helper**

Add this function inside `EoiFormTabs`, after the `storageKey`/`visitedKey` declarations:

```typescript
const markVisited = useCallback((tabIndex: number) => {
  if (visitedTabsRef.current.has(tabIndex)) return;
  visitedTabsRef.current = new Set(visitedTabsRef.current).add(tabIndex);
  setVisitedTabs(new Set(visitedTabsRef.current));
  try {
    localStorage.setItem(visitedKey, serializeVisited(visitedTabsRef.current));
  } catch { /* storage full */ }
}, [visitedKey]);
```

- [ ] **Step 3: Restore visited state on mount**

In the existing `useEffect` that restores draft state (the one with `localStorage.getItem(storageKey)`), add restoration of visited state **after** the draft restore block and before `updateTabStatus()`:

```typescript
// Restore visited tabs
const savedVisited = localStorage.getItem(visitedKey);
const restoredVisited = deserializeVisited(savedVisited);
visitedTabsRef.current = restoredVisited;
setVisitedTabs(restoredVisited);
```

The full useEffect should now read:

```typescript
useEffect(() => {
  if (isResubmission || isFromInvite || !formRef.current) return;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved) as Record<string, string>;
      const form = formRef.current;
      for (const [name, value] of Object.entries(data)) {
        const elements = form.elements.namedItem(name);
        if (!elements) continue;
        if (elements instanceof RadioNodeList) {
          for (const el of elements) {
            if (el instanceof HTMLInputElement && el.type === "radio") {
              el.checked = el.value === value;
            } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
              el.checked = (data[name + "[]"] ?? "").includes(el.value);
            }
          }
        } else if (elements instanceof HTMLInputElement) {
          if (elements.type === "checkbox") {
            elements.checked = value === "true";
          } else {
            elements.value = value;
          }
        } else if (elements instanceof HTMLTextAreaElement || elements instanceof HTMLSelectElement) {
          elements.value = value;
        }
      }
    }
  } catch { /* ignore corrupt localStorage */ }

  // Restore visited tabs
  const savedVisited = localStorage.getItem(visitedKey);
  const restoredVisited = deserializeVisited(savedVisited);
  visitedTabsRef.current = restoredVisited;
  setVisitedTabs(restoredVisited);

  updateTabStatus();
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Call markVisited in all navigation paths**

**Tab bar click** — update the `onClick` handler:

```typescript
onClick={() => { markVisited(i); setActiveTab(i); }}
```

**Continue button** — update the onClick:

```typescript
onClick={() => { markVisited(activeTab); setActiveTab(activeTab + 1); }}
```

**Back button** — update the onClick:

```typescript
onClick={() => { markVisited(activeTab); setActiveTab(activeTab - 1); }}
```

- [ ] **Step 5: Verify in browser**

Run `bun dev`, open `/apply/form`, navigate through tabs. Open DevTools → Application → localStorage. Confirm `eoi-visited-<email>` key appears and updates as you navigate tabs. Reload and confirm visited state is restored.

- [ ] **Step 6: Commit**

```bash
git add src/app/apply/form/EoiFormTabs.tsx
git commit -m "feat: track and persist visited tab state"
```

---

## Task 3: Three-state tab status logic

Update the status type and `updateTabStatus` to produce `"empty" | "complete" | "full"`, removing `"partial"`. Add `isTabFull` for checkmark detection.

**Files:**
- Modify: `src/app/apply/form/EoiFormTabs.tsx`

- [ ] **Step 1: Update the status type**

Find this line:

```typescript
const [tabStatus, setTabStatus] = useState<("empty" | "partial" | "complete")[]>(
  TABS.map(() => "empty")
);
```

Replace with:

```typescript
const [tabStatus, setTabStatus] = useState<("empty" | "complete" | "full")[]>(
  TABS.map(() => "empty")
);
```

- [ ] **Step 2: Add CHECKMARK_FIELDS constant**

Add after `REQUIRED_FIELDS`:

```typescript
// Fields beyond required that must be filled for a "full" (checkmark) status.
// Accreditation and History use custom DOM logic in isTabFull — listed here for reference only.
const CHECKMARK_FIELDS: Record<number, string[]> = {
  0: ["website"],
  1: ["contact_title", "contact_phone", "contact_cell"],
  2: [], // handled in isTabFull (requested_* per checked category)
  3: ["circulation", "publication_frequency", "sports_to_cover"],
  4: [], // handled in isTabFull (prior_olympic, prior_paralympic, past_coverage_examples)
};
```

- [ ] **Step 3: Add isTabFull function**

Add inside the `EoiFormTabs` component, after the `markVisited` helper:

```typescript
function isTabFull(tabIndex: number, form: HTMLFormElement): boolean {
  // Check standard extra fields first
  const extraFields = CHECKMARK_FIELDS[tabIndex] ?? [];
  for (const name of extraFields) {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      if (!el.value.trim()) return false;
    }
  }

  // Tab-specific custom checks
  if (tabIndex === 2) {
    // All checked categories must have a quantity filled
    const categories = ["E", "Es", "EP", "EPs", "ET", "EC"];
    for (const cat of categories) {
      const checkbox = form.elements.namedItem(`category_${cat}`) as HTMLInputElement | null;
      if (checkbox?.checked) {
        const qty = form.elements.namedItem(`requested_${cat}`) as HTMLInputElement | null;
        if (!qty?.value.trim()) return false;
      }
    }
    // Also require at least one publication_types checkbox (already enforced by required validation,
    // but belt-and-suspenders for the full check)
    return true;
  }

  if (tabIndex === 3) {
    // At least one publication type must be checked
    const pubTypes = form.querySelectorAll<HTMLInputElement>('input[name="publication_types"]:checked');
    if (pubTypes.length === 0) return false;
  }

  if (tabIndex === 4) {
    // Both prior accreditation radios must be answered
    const olympicInputs = form.elements.namedItem("prior_olympic");
    const paralympicInputs = form.elements.namedItem("prior_paralympic");
    const olympicAnswered = olympicInputs instanceof RadioNodeList
      ? Array.from(olympicInputs).some((el) => el instanceof HTMLInputElement && el.checked)
      : false;
    const paralympicAnswered = paralympicInputs instanceof RadioNodeList
      ? Array.from(paralympicInputs).some((el) => el instanceof HTMLInputElement && el.checked)
      : false;
    if (!olympicAnswered || !paralympicAnswered) return false;
    // If the coverage textarea is in the DOM (shown when olympic=yes or both=no), it must be filled
    const coverage = form.elements.namedItem("past_coverage_examples");
    if (coverage instanceof HTMLTextAreaElement && !coverage.value.trim()) return false;
  }

  return true;
}
```

- [ ] **Step 4: Rewrite updateTabStatus**

Replace the existing `updateTabStatus` function entirely:

```typescript
function updateTabStatus() {
  if (!formRef.current) return;
  const form = formRef.current;
  const newStatus = TABS.map((_, tabIndex): "empty" | "complete" | "full" => {
    // Resubmission: org tab is read-only and fully pre-filled
    if (isResubmission && tabIndex === 0) return "full";

    // Must be visited first
    if (!visitedTabsRef.current.has(tabIndex)) return "empty";

    const required = REQUIRED_FIELDS[tabIndex] ?? [];

    // Check required fields
    const allRequired = required.every((name) => {
      const el = form.elements.namedItem(name);
      if (!el) return false;
      if (el instanceof RadioNodeList) {
        return Array.from(el).some(
          (item) => item instanceof HTMLInputElement && item.checked
        );
      }
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return el.value.trim() !== "";
      }
      return false;
    });

    // Accreditation tab: at least one category checkbox required
    if (tabIndex === 2) {
      const catChecked = Array.from(
        form.querySelectorAll<HTMLInputElement>('input[name^="category_"]')
      ).some((cb) => cb.checked);
      if (!catChecked || !allRequired) return "empty";
    } else if (!allRequired) {
      return "empty";
    }

    // All required fields satisfied — check for full completion
    return isTabFull(tabIndex, form) ? "full" : "complete";
  });
  setTabStatus(newStatus);
}
```

- [ ] **Step 5: Update STATUS_LABELS**

Find:

```typescript
const STATUS_LABELS: Record<string, string> = {
  empty: "Not started",
  partial: "Partially filled",
  complete: "Complete",
};
```

Replace with:

```typescript
const STATUS_LABELS: Record<string, string> = {
  empty: "Not started",
  complete: "Required fields complete",
  full: "Fully complete",
};
```

- [ ] **Step 6: Verify logic in browser**

Run `bun dev`. Fill out a few tabs, check that:
- Unvisited tabs stay gray
- Visiting a tab with no required fields (Publication, History) immediately shows green dot
- Filling all encouraged fields on Publication gives a checkmark

- [ ] **Step 7: Commit**

```bash
git add src/app/apply/form/EoiFormTabs.tsx
git commit -m "feat: three-state tab status logic (empty/complete/full)"
```

---

## Task 4: Three-state tab indicator rendering

Update the tab bar JSX to render gray dot / green dot / green checkmark SVG.

**Files:**
- Modify: `src/app/apply/form/EoiFormTabs.tsx`

- [ ] **Step 1: Replace the status dot span**

Find the existing status dot in the tab button render:

```tsx
{/* Status dot */}
<span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${
  status === "complete" ? "bg-green-500" :
  status === "partial"  ? "bg-[#0057A8]" :
  "bg-gray-300"
}`} />
```

Replace with:

```tsx
{/* Status indicator */}
{status === "full" ? (
  <svg
    aria-hidden="true"
    className="w-4 h-4 shrink-0 text-green-500"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="7" />
    <polyline points="5,8.5 7,10.5 11,6.5" />
  </svg>
) : (
  <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${
    status === "complete" ? "bg-green-500" : "bg-gray-300"
  }`} />
)}
```

- [ ] **Step 2: Verify in browser**

Run `bun dev`. Navigate all five tabs. Confirm:
- Unvisited tabs: gray dot
- Visited tab with required fields done: green dot (solid circle)
- Fully filled tab: green checkmark (circle with tick)
- The checkmark is visually clear at small size — adjust `strokeWidth` to `2.5` if it looks thin

- [ ] **Step 3: Commit**

```bash
git add src/app/apply/form/EoiFormTabs.tsx
git commit -m "feat: render green checkmark for fully-complete tabs"
```

---

## Task 5: Context-aware submission modal

Replace the existing pre-submission confirmation modal with a two-mode version: clean confirmation when all tabs are full, nudge + two CTAs otherwise.

**Files:**
- Modify: `src/app/apply/form/EoiFormTabs.tsx`

- [ ] **Step 1: Add allFull computed value to handleSubmit**

In `handleSubmit`, after the `setModalSummary(...)` call and before `setShowConfirmModal(true)`, add:

```typescript
const allFull = tabStatus.every((s) => s === "full");
setAllTabsFull(allFull);
```

Add the new state declaration near the other modal state:

```typescript
const [allTabsFull, setAllTabsFull] = useState(false);
```

- [ ] **Step 2: Replace the modal JSX**

Find the existing modal block (starting at `{showConfirmModal && modalSummary && (`). Replace it entirely with:

```tsx
{showConfirmModal && modalSummary && (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
  >
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
      <h2 id="confirm-modal-title" className="text-lg font-bold text-gray-900 mb-1">
        {isResubmission ? "Confirm resubmission" : "Confirm submission"}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {isResubmission
          ? "Your corrected application will be sent back to your NOC for review."
          : "Your application will be sent to your NOC for review. You won't be able to edit it until your NOC returns it."}
      </p>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 mb-5">
        <div>
          <span className="text-gray-500">Organisation</span>
          <span className="ml-2 font-medium text-gray-900">{modalSummary.orgName}</span>
        </div>
        <div>
          <span className="text-gray-500">Categories</span>
          <span className="ml-2 font-medium text-gray-900">{modalSummary.categories.join(", ")}</span>
        </div>
        <div>
          <span className="text-gray-500">Contact</span>
          <span className="ml-2 font-medium text-gray-900">
            {modalSummary.contactName} · {modalSummary.contactEmail}
          </span>
        </div>
      </div>

      {/* Nudge — shown only when optional fields are incomplete */}
      {!allTabsFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-5">
          <p className="font-semibold mb-1">Some optional sections are incomplete.</p>
          <p>
            Your application is ready to submit — all required information is complete.
            To give your organisation the best chance of approval, we recommend including
            supporting details such as publication history and coverage examples.
            NOCs give the most consideration to applications with full information.
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        {allTabsFull ? (
          <>
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={() => {
                confirmedRef.current = true;
                setShowConfirmModal(false);
                formRef.current?.requestSubmit();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              {isResubmission ? "Confirm resubmit" : "Confirm & submit"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setShowConfirmModal(false);
                // Navigate to the first tab that isn't full
                const firstIncomplete = tabStatus.findIndex((s) => s !== "full");
                if (firstIncomplete !== -1) setActiveTab(firstIncomplete);
              }}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors cursor-pointer"
            >
              Complete my application
            </button>
            <button
              type="button"
              onClick={() => {
                confirmedRef.current = true;
                setShowConfirmModal(false);
                formRef.current?.requestSubmit();
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Submit as-is
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify both modal modes in browser**

Run `bun dev`.

**Test Mode 2 (nudge):**
- Fill only required fields on all tabs (navigate through all five)
- Click Submit — confirm the amber nudge block appears, both CTAs visible
- Click "Complete my application" — confirm modal closes and focus jumps to first incomplete tab
- Return to Submit — click "Submit as-is" — confirm submission proceeds

**Test Mode 1 (clean):**
- Fill all encouraged fields on all five tabs
- Click Submit — confirm amber nudge is absent, only "Go back" and "Confirm & submit" visible

- [ ] **Step 4: Commit**

```bash
git add src/app/apply/form/EoiFormTabs.tsx
git commit -m "feat: context-aware submission modal with optional-field nudge"
```

---

## Task 6: Run full test suite and verify

- [ ] **Step 1: Run all tests**

```bash
bun test
```

Expected: All existing tests pass. New `eoi-visited.test.ts` passes (6 tests).

- [ ] **Step 2: Manual end-to-end walkthrough**

1. Open `/apply/form` in a fresh browser (clear localStorage for the domain first)
2. Confirm all tabs start gray
3. Click tab 3 (Publication) — confirm it goes green dot immediately (no required fields)
4. Navigate back to tab 1, fill required fields — confirm tab 1 goes green dot
5. Fill website on Organisation — confirm tab 0 goes green checkmark
6. Fill all Publication fields — confirm tab 3 goes green checkmark
7. Click Submit with mixed dots/checkmarks — confirm nudge modal appears
8. Click "Complete my application" — confirm navigation to first non-full tab
9. Complete all tabs — confirm clean modal with no nudge

- [ ] **Step 3: Commit if any fixes needed**

```bash
git add src/app/apply/form/EoiFormTabs.tsx
git commit -m "fix: <describe what needed fixing>"
```

Only create this commit if fixes were needed in Step 2. Skip otherwise.
