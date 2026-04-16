Created: 16-Apr-2026 14:00 CEST

# Press Registration Portal (PRP) — Rename + 2026-04-16 Demo Meeting Action Items

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the application from "Media Registration Portal (MRP)" to "Press Registration Portal (PRP)" across all code, config, and documentation; and implement the confirmed action items from the 2026-04-16 stakeholder demo meeting.

**Architecture:** The rename is a mechanical find-replace across ~40 files with three distinct scopes: (1) user-visible strings in source code, (2) technical identifiers (cookie names, export filenames, CI database name, package.json), and (3) documentation files and design HTML files. Meeting action items are a mix of bug fixes and feature enhancements covering the submission flow, quota UI, and ENR ranking.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Drizzle ORM, PostgreSQL, Bun, Vitest, Playwright

**Source documents:** `docs/input and feedback/2026-04-16 Media Portal - Meeting minutes (AI).docx` · `docs/stakeholder-questions.md`

---

## ⚠ Naming note

Name confirmed: **"Press Registration Portal (PRP)"** — agreed by Ken and consistent with the AI meeting minutes. This supersedes "Media Registration Portal (MRP)" everywhere.

## ⚠ Chat paste pending

Ken mentioned a paste of the live meeting chat. This plan covers action items clearly stated in the AI meeting minutes. Once the chat paste is provided, a follow-up plan addendum may be needed for additional decisions captured there.

## ⚠ Session cookie rename

Renaming `mrp_session` → `prp_session` will immediately invalidate all active admin sessions. Every logged-in user will need to sign in again. This is acceptable in the current prototype phase.

---

## File Map

### Source code — user-visible strings
- Modify: `src/app/layout.tsx` (metadata title + description)
- Modify: `src/components/AppHeader.tsx` (header text)
- Modify: `src/app/apply/layout.tsx` (if it contains the name)
- Modify: `src/app/admin/layout.tsx` (if it contains the name)
- Modify: `src/app/page.tsx` (homepage copy)
- Modify: `src/app/admin/login/page.tsx` (login page copy)
- Modify: `src/app/admin/noc/help/page.tsx` (help page copy)

### Source code — technical identifiers
- Modify: `src/lib/session.ts` — cookie names `mrp_session` → `prp_session`
- Modify: `src/middleware.ts` — cookie name references
- Modify: `src/app/api/export/eoi/route.ts` — download filename prefix
- Modify: `src/app/api/export/pbn/route.ts` — download filename prefix
- Modify: `src/app/api/export/pbn-allocations/route.ts` — download filename prefix
- Modify: `src/app/api/export/enr/route.ts` — download filename prefix
- Modify: `src/app/api/export/audit/route.ts` — download filename prefix

### Config / infrastructure
- Modify: `package.json` — `"name": "mrp"` → `"name": "prp"`
- Modify: `.github/workflows/playwright.yml` — `POSTGRES_DB: mrp_test` → `prp_test`

### Primary project docs
- Modify: `CLAUDE.md` — title + all MRP references
- Modify: `DESIGN.md` — title + all MRP references
- Modify: `TODOS.md` — all MRP references (architectural; keep meaning intact)

### Stakeholder and design docs
- Modify: `docs/stakeholder-questions.md`
- Modify: `docs/strategic-plan-gap-analysis.md`
- Modify: `docs/paris-quota-reference.md`
- Modify: `docs/monkey-test-guide.md` (then regenerate .docx)
- Modify: `docs/test-plan-manual-walkthrough.md` (then regenerate .docx)
- Rename + modify: `docs/MRP-rq.md` → `docs/PRP-rq.md`
- Rename + modify: `docs/MRP-design-confirmation.md` → `docs/PRP-design-confirmation.md`
- Modify all internal cross-references to the renamed files

### HTML design files (19 files — batch operation)
- All files matching `docs/designs/*.html`

### Plans and memory
- Modify: `docs/plans/*.md` — where MRP appears as product name (not as abbreviation in architectural prose)
- Modify: `.claude/projects/-Users-kcorless-Documents-Projects-MRP/memory/project-status.md`
- Modify: `Project at a glance for Claude.md`

### Meeting action items — new/changed source files
- Modify: `src/app/apply/confirmation/page.tsx` (or equivalent) — confirm auto-email trigger on EoI submit
- Modify: `src/app/admin/noc/queue/` — confirm no system-sent rejection emails
- Modify: `src/app/admin/ocog/` or PbN allocation view — quota consolidated view enhancements
- Modify: `src/app/admin/ioc/enr/` — ENR ranking/prioritisation UI
- Modify: `TODOS.md` — update language item from P2 to launch requirement; record meeting decisions

---

## Part A — Rename

### Task 1: Update user-visible strings in source code

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Update root metadata**

In `src/app/layout.tsx`, change:
```ts
export const metadata: Metadata = {
  title: "Media Registration Portal",
  description: "LA 2028 Olympic Games — Expression of Interest",
};
```
to:
```ts
export const metadata: Metadata = {
  title: "Press Registration Portal",
  description: "LA 2028 Olympic Games — Press Accreditation",
};
```

- [ ] **Step 2: Update AppHeader branding text**

In `src/components/AppHeader.tsx`, line 22, change:
```tsx
<div className="text-sm font-semibold text-white leading-tight">Media Registration Portal</div>
```
to:
```tsx
<div className="text-sm font-semibold text-white leading-tight">Press Registration Portal</div>
```

- [ ] **Step 3: Search for remaining "Media Registration Portal" and "media registration portal" strings in source**

```bash
grep -rn "Media Registration Portal\|media registration portal\|Media media portal" src/ --include="*.tsx" --include="*.ts"
```

Update every occurrence found to "Press Registration Portal".

- [ ] **Step 4: Check apply and admin layouts**

```bash
grep -rn "Media Registration\|MRP\b" src/app/apply/ src/app/admin/ --include="*.tsx" --include="*.ts"
```

Update all occurrences. "MRP" as a product-name label should become "PRP"; architectural references like "MRP stays authoritative" are not in source code and are handled in Task 7+.

- [ ] **Step 5: Run dev server briefly to visually confirm header text changed**

```bash
bun dev
```
Open http://localhost:3000 and http://localhost:3000/admin/login — confirm header shows "Press Registration Portal". Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/AppHeader.tsx src/app/page.tsx
git add -p src/app/admin/ src/app/apply/
git commit -m "feat(rename): update user-visible app name to Press Registration Portal (PRP)"
```

---

### Task 2: Rename session cookies and middleware references

**Files:**
- Modify: `src/lib/session.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update cookie names in session.ts**

In `src/lib/session.ts`, lines 31–32, change:
```ts
const COOKIE_NAME = "mrp_session";
const SUDO_COOKIE_NAME = "mrp_sudo_session";
```
to:
```ts
const COOKIE_NAME = "prp_session";
const SUDO_COOKIE_NAME = "prp_sudo_session";
```

- [ ] **Step 2: Check middleware.ts for cookie name references**

```bash
grep -n "mrp" src/middleware.ts
```

Update every `mrp_session` or `mrp_sudo_session` to `prp_session` / `prp_sudo_session`. If the middleware imports `COOKIE_NAME` from session.ts, no further change is needed there — the import will pick up the new value.

- [ ] **Step 3: Check for any other hardcoded cookie references**

```bash
grep -rn "mrp_session\|mrp_sudo" src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining occurrences.

- [ ] **Step 4: Commit**

```bash
git add src/lib/session.ts src/middleware.ts
git commit -m "feat(rename): rename session cookies mrp_session → prp_session"
```

> ⚠ All current admin sessions are now invalid. Testers must sign in again.

---

### Task 3: Rename export filenames

**Files:**
- Modify: `src/app/api/export/eoi/route.ts`
- Modify: `src/app/api/export/pbn/route.ts`
- Modify: `src/app/api/export/pbn-allocations/route.ts`
- Modify: `src/app/api/export/enr/route.ts`
- Modify: `src/app/api/export/audit/route.ts`

- [ ] **Step 1: Batch-replace mrp prefix in export routes**

```bash
sed -i '' 's/filename="mrp-/filename="prp-/g; s/filename="mrp_/filename="prp_/g' \
  src/app/api/export/eoi/route.ts \
  src/app/api/export/pbn/route.ts \
  src/app/api/export/pbn-allocations/route.ts \
  src/app/api/export/enr/route.ts \
  src/app/api/export/audit/route.ts
```

- [ ] **Step 2: Verify**

```bash
grep -n "mrp" src/app/api/export/*/route.ts
```

Expected: no remaining "mrp" occurrences.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/export/
git commit -m "feat(rename): update export filenames from mrp- prefix to prp-"
```

---

### Task 4: Update package.json and CI config

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/playwright.yml`

- [ ] **Step 1: Update package name**

In `package.json`, change:
```json
"name": "mrp",
```
to:
```json
"name": "prp",
```

- [ ] **Step 2: Update CI test database name**

In `.github/workflows/playwright.yml`, change all occurrences of `mrp_test` to `prp_test`:

```bash
sed -i '' 's/mrp_test/prp_test/g' .github/workflows/playwright.yml
```

- [ ] **Step 3: Verify**

```bash
grep -n "mrp" package.json .github/workflows/playwright.yml
```

Expected: zero remaining matches.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/playwright.yml
git commit -m "chore(rename): update package name and CI database to prp"
```

---

### Task 5: Update CLAUDE.md and DESIGN.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `DESIGN.md`

- [ ] **Step 1: Update CLAUDE.md**

Change:
- Title `# MRP — Claude Instructions` → `# PRP — Claude Instructions`
- First sentence of **Project** section: "LA 2028 Media Registration Portal" → "LA 2028 Press Registration Portal"
- All other `MRP` occurrences to `PRP` (admin role paths like `src/app/admin/{noc,ocog,ioc}/` are path references — keep them)
- Confirm acronym definitions remain accurate

```bash
grep -n "MRP\|Media Registration" CLAUDE.md
```

Update all occurrences manually.

- [ ] **Step 2: Update DESIGN.md**

```bash
grep -n "MRP\|Media Registration" DESIGN.md
```

Change title and all product-name references to PRP / Press Registration Portal.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md DESIGN.md
git commit -m "docs(rename): update CLAUDE.md and DESIGN.md to PRP"
```

---

### Task 6: Update TODOS.md

**Files:**
- Modify: `TODOS.md`

- [ ] **Step 1: Replace product-name occurrences**

"MRP" in TODOS.md appears in two contexts: (a) as the product name ("MRP is the single point of entry"), and (b) as an architectural label ("MRP stays authoritative after the ACR handoff"). Both should change to PRP.

```bash
grep -n "\bMRP\b" TODOS.md
```

Using your editor, replace all occurrences of:
- "MRP" (product name) → "PRP"
- "Media Registration Portal" → "Press Registration Portal"

Do NOT change TODO IDs (e.g., `[TODO-P0-A]`) or section headings unrelated to the product name.

- [ ] **Step 2: Add meeting outcome section at the top of P0**

Add directly below `## P0 — Thursday 2026-04-16 meeting prep` the following resolved-decisions block:

```markdown
### Meeting outcomes — 2026-04-16 demo session (Emma, Martyn, Amy, Lauren, Lucia, Troy, Randi)

**Decisions confirmed at this meeting:**
- ✅ Portal renamed to **Press Registration Portal (PRP)**; all references to "media" → "press" (Lucia/IOC)
- ✅ EoI term in portal: "press registration" preferred over "expression of interest"
- ✅ Auto email confirmation sent to applicant on submission (no NOC action required at that stage)
- ✅ NO system-generated rejection emails to applicants — NOCs handle rejections offline in own language
- ✅ Rejected applications retained permanently in audit trail — no deletions permitted
- ✅ Language requirement upgraded to: English + French + Spanish at launch (see [TODO-GAP-5] — promote to P0)
- ✅ Global submission deadline enforced platform-wide; NOCs can invite/fast-track after deadline; OCOG can reopen specific NOC windows
- ✅ NOC onboarding: same process as ACR onboarding (LA28 ACR to coordinate)
- ✅ ENR: NOCs submit prioritised lists to IOC; ranking UI needed
- ✅ Quota view needs consolidated totals (requests vs allocations per org)
- 🔲 IPC/Paralympic: build to accommodate; option to disable features per deployment
- 🔲 Submit button bug — Damien to investigate (see [TODO-BUG-001])
- 🔲 Final form fields: Emma to provide consolidated list by early next week
- 🔲 Next meeting: end of last week of April (Randi to send placeholder)
```

- [ ] **Step 3: Add new bug TODO**

Add this item in the P0 section:

```markdown
### [TODO-BUG-001] Submit button non-functional — reported at 2026-04-16 demo
**What:** Participants reported the submit button did not function correctly during the demo. Damien (D.TEC) owns the investigation.
**Steps:** (1) Reproduce on mrp.dgpbeta.com using monkey-test-guide. (2) Check browser console for JS errors. (3) Check Network tab for any failed requests on submit. (4) Trace `src/app/apply/` form submit handler.
**Priority:** P0 (blocking stakeholder testing)
```

- [ ] **Step 4: Update [TODO-GAP-5] language item**

Change status from `P2 (v1 feature, not blocking v0.1)` to `P0 — confirmed launch requirement at 2026-04-16 meeting`.

- [ ] **Step 5: Update Last updated header**

Change `**Last updated: 14-Apr-2026 17:30 CEST**` to `**Last updated: 16-Apr-2026 14:00 CEST**`.

- [ ] **Step 6: Commit**

```bash
git add TODOS.md
git commit -m "docs(todos): record 2026-04-16 meeting outcomes and add PRP rename"
```

---

### Task 7: Update stakeholder and requirements docs

**Files:**
- Modify: `docs/stakeholder-questions.md`
- Modify: `docs/strategic-plan-gap-analysis.md`
- Modify: `docs/paris-quota-reference.md`

- [ ] **Step 1: Batch search for MRP occurrences in docs**

```bash
grep -rn "\bMRP\b\|Media Registration Portal" docs/ --include="*.md" | grep -v "designs/" | grep -v "plans/"
```

- [ ] **Step 2: Update stakeholder-questions.md**

All occurrences of "MRP" as a product name → "PRP". All "Media Registration Portal" → "Press Registration Portal".
Update `**Last updated:**` header to `16-Apr-2026 14:00 CEST`.

Note: The stakeholder-questions.md doc references architectural model labels like "Model A (ACR takes over; MRP frozen at sent_to_acr)" — in these cases change "MRP" → "PRP" since they refer to the portal.

- [ ] **Step 3: Update strategic-plan-gap-analysis.md**

Same replacements. Update `**Last updated:**` header.

- [ ] **Step 4: Update paris-quota-reference.md**

```bash
grep -n "MRP\|Media Registration" docs/paris-quota-reference.md
```

Update any occurrences. Update Last updated header.

- [ ] **Step 5: Commit**

```bash
git add docs/stakeholder-questions.md docs/strategic-plan-gap-analysis.md docs/paris-quota-reference.md
git commit -m "docs(rename): update stakeholder docs MRP → PRP"
```

---

### Task 8: Update test guides and regenerate DOCX files

**Files:**
- Modify: `docs/monkey-test-guide.md`
- Modify: `docs/test-plan-manual-walkthrough.md`

- [ ] **Step 1: Update monkey-test-guide.md**

```bash
grep -n "MRP\|Media Registration" docs/monkey-test-guide.md
```

Replace all product-name occurrences. Also update `**Last updated:**` header to `16-Apr-2026 14:00 CEST`.

Note: These files have existing uncommitted local changes (`git status` shows them as modified). Review the existing diff first to understand what changed before making additional edits:
```bash
git diff docs/monkey-test-guide.md
```

- [ ] **Step 2: Update test-plan-manual-walkthrough.md**

Same process. Check `git diff docs/test-plan-manual-walkthrough.md` first.

- [ ] **Step 3: Regenerate DOCX files**

```bash
pandoc docs/monkey-test-guide.md -o docs/monkey-test-guide.docx --wrap=none
pandoc docs/test-plan-manual-walkthrough.md -o docs/test-plan-manual-walkthrough.docx --wrap=none
```

- [ ] **Step 4: Commit**

```bash
git add docs/monkey-test-guide.md docs/monkey-test-guide.docx
git add docs/test-plan-manual-walkthrough.md docs/test-plan-manual-walkthrough.docx
git commit -m "docs(rename): update test guides to PRP and regenerate DOCX"
```

---

### Task 9: Rename and update MRP-rq.md and MRP-design-confirmation.md

**Files:**
- Rename: `docs/MRP-rq.md` → `docs/PRP-rq.md`
- Rename: `docs/MRP-design-confirmation.md` → `docs/PRP-design-confirmation.md`

- [ ] **Step 1: Rename the files**

```bash
git mv docs/MRP-rq.md docs/PRP-rq.md
git mv docs/MRP-design-confirmation.md docs/PRP-design-confirmation.md
```

- [ ] **Step 2: Update all "MRP" occurrences inside PRP-rq.md**

```bash
grep -n "\bMRP\b\|Media Registration" docs/PRP-rq.md | wc -l
```

This file has ~45 occurrences. Use a batch replace:

```bash
sed -i '' \
  's/Media Registration Portal/Press Registration Portal/g; \
   s/Media Registration portal/Press Registration Portal/g; \
   s/\bMRP\b/PRP/g' \
  docs/PRP-rq.md
```

Then open the file and manually review — especially the header, title, and any section where "MRP" appeared as a technical artifact vs. product name. Update `**Last updated:**` header.

- [ ] **Step 3: Update all "MRP" occurrences inside PRP-design-confirmation.md**

```bash
sed -i '' \
  's/Media Registration Portal/Press Registration Portal/g; \
   s/\bMRP\b/PRP/g' \
  docs/PRP-design-confirmation.md
```

Review and update Last updated header.

- [ ] **Step 4: Update all cross-references to these renamed files**

Any other doc that links to `MRP-rq.md` or `MRP-design-confirmation.md` must be updated:

```bash
grep -rn "MRP-rq\|MRP-design-confirmation" docs/ --include="*.md"
```

Update every reference to the new filenames.

- [ ] **Step 5: Regenerate DOCX if they exist**

```bash
ls docs/MRP-rq.docx docs/MRP-design-confirmation.docx 2>/dev/null
```

If found, regenerate with new filenames:

```bash
pandoc docs/PRP-rq.md -o docs/PRP-rq.docx --wrap=none
pandoc docs/PRP-design-confirmation.md -o docs/PRP-design-confirmation.docx --wrap=none
```

Delete the old .docx files if they still exist.

- [ ] **Step 6: Commit**

```bash
git add docs/PRP-rq.md docs/PRP-design-confirmation.md
git add docs/*.docx
git commit -m "docs(rename): rename MRP-rq → PRP-rq and MRP-design-confirmation → PRP-design-confirmation"
```

---

### Task 10: Update HTML design files (batch)

**Files:**
- Modify: all 19 files in `docs/designs/*.html`

- [ ] **Step 1: Batch replace in all HTML design files**

```bash
sed -i '' \
  's/Media Registration Portal/Press Registration Portal/g; \
   s/media-registration-portal/press-registration-portal/g; \
   s/\bMRP\b/PRP/g' \
  docs/designs/*.html
```

- [ ] **Step 2: Verify**

```bash
grep -l "Media Registration\|MRP" docs/designs/*.html
```

Expected: no files listed. If any remain, open them and fix manually.

- [ ] **Step 3: Commit**

```bash
git add docs/designs/
git commit -m "docs(rename): update all HTML design files to Press Registration Portal"
```

---

### Task 11: Update plans, memory, and remaining files

**Files:**
- Modify: `docs/plans/*.md` (where MRP is product name)
- Modify: `.claude/projects/-Users-kcorless-Documents-Projects-MRP/memory/project-status.md`
- Modify: `Project at a glance for Claude.md`

- [ ] **Step 1: Update plan files**

```bash
grep -rln "\bMRP\b\|Media Registration" docs/plans/
```

For each matched file, replace product-name occurrences of MRP → PRP. Do NOT rename the plan files themselves (they are historical records).

- [ ] **Step 2: Update project-status.md memory file**

```bash
grep -n "MRP\|Media Registration" \
  "/Users/kcorless/.claude/projects/-Users-kcorless-Documents-Projects-MRP/memory/project-status.md"
```

Replace product-name occurrences.

- [ ] **Step 3: Update "Project at a glance for Claude.md"**

```bash
grep -n "MRP\|Media Registration" "Project at a glance for Claude.md"
```

This is an untracked file — update in place.

- [ ] **Step 4: Check for any remaining MRP occurrences in source code**

```bash
grep -rn "\bMRP\b\|Media Registration Portal" src/ --include="*.ts" --include="*.tsx"
```

Fix any that remain.

- [ ] **Step 5: Final sweep across all tracked files**

```bash
grep -rn "Media Registration Portal" . --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.yml" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git
```

Expected: zero results.

- [ ] **Step 6: Commit**

```bash
git add docs/plans/ "Project at a glance for Claude.md"
git commit -m "docs(rename): update remaining plan docs and project files to PRP"
```

- [ ] **Step 7: Push**

```bash
git push
```

---

## Part B — Meeting Action Items

### Task 12: Investigate and fix submit button bug [TODO-BUG-001]

**Context:** Participants at the 2026-04-16 demo reported the submit button on the EoI form was non-functional. This is a P0 blocker for stakeholder testing.

**Files:**
- Investigate: `src/app/apply/` — form submit handler and submit button component
- Likely suspect: `src/app/apply/EoiFormTabs.tsx` or `src/app/apply/actions.ts`

- [ ] **Step 1: Reproduce the bug**

Open http://localhost:3000/apply in a browser. Complete the form tabs and attempt to submit. Note any console errors, network failures, or UI issues.

```bash
bun dev
```

- [ ] **Step 2: Check the submit button component**

```bash
grep -n "submit\|Submit\|onClick\|handleSubmit" src/app/apply/EoiFormTabs.tsx | head -30
```

Look for: disabled state that isn't clearing correctly, missing `type="submit"` on the button, incorrect form action reference, or a client/server action mismatch.

- [ ] **Step 3: Check the form action**

```bash
grep -n "action\|submit\|formAction" src/app/apply/actions.ts 2>/dev/null || \
grep -rn "\"use server\"\|createApplication\|submitEoi" src/app/apply/ --include="*.ts" --include="*.tsx"
```

Verify the server action is correctly referenced and exported.

- [ ] **Step 4: Check the submission modal**

The submission modal was recently updated (commit `2ee597b`). Confirm the modal is not intercepting the submit event in an unexpected way.

```bash
grep -n "modal\|Modal\|confirmation" src/app/apply/EoiFormTabs.tsx | head -20
```

- [ ] **Step 5: Fix the bug**

Apply the minimal fix. The fix should not change surrounding code or add unrelated cleanup.

- [ ] **Step 6: Test the fix**

Submit a complete test EoI on localhost. Confirm:
- The confirmation modal appears correctly
- On confirmation, the form submits
- The applicant is redirected to the confirmation/submitted page
- An application record appears in the NOC admin queue

- [ ] **Step 7: Run the test suite**

```bash
bun test
```

Expected: all existing tests pass.

- [ ] **Step 8: Commit and push**

```bash
git add <changed files>
git commit -m "fix(apply): fix submit button non-functional (reported 2026-04-16 demo)"
git push
```

---

### Task 13: Confirm auto email confirmation on EoI submission

**Context:** The meeting confirmed: applicants should receive an automatic email confirmation when they submit their EoI. No NOC action required at that point.

**Files:**
- Investigate: `src/app/apply/actions.ts` (or equivalent server action)
- Investigate: `src/lib/email.ts` (email infrastructure, if it exists)
- Reference: `docs/plans/2026-04-10-004-feat-email-infrastructure-anomaly-digest-plan.md`

- [ ] **Step 1: Check current submission email behaviour**

```bash
grep -rn "email\|sendEmail\|confirmation\|notify" src/app/apply/ --include="*.ts" --include="*.tsx"
```

Is an email sent on submission today? If so, does it go to the applicant?

- [ ] **Step 2: Check email infrastructure status**

```bash
cat src/lib/email.ts 2>/dev/null || echo "file does not exist"
```

If the email infrastructure is not yet built (TODO-030 is marked as unbuilt), the confirmation email cannot be sent. In that case, do the following:

**Step 2a — Stub the email call:** In the EoI submission server action, add a clearly-stubbed call:

```ts
// TODO-030: replace with real Resend send once email infra is wired
// await sendEmail({ to: applicantEmail, subject: "Press Registration Portal — submission received", template: "eoi-confirmation" });
console.log(`[email stub] submission confirmation → ${applicantEmail}`);
```

This makes the intent explicit without blocking the stub until TODO-030 is done.

If `src/lib/email.ts` already exists with a stub: call it properly from the submission action.

- [ ] **Step 3: Commit**

```bash
git add src/app/apply/
git commit -m "feat(apply): confirm/stub auto email confirmation on EoI submission"
```

---

### Task 14: Confirm no system-generated rejection emails to applicants

**Context:** Meeting confirmed NOCs handle rejection communications offline in their own language. The system must NOT send automated rejection emails to applicants.

**Files:**
- Investigate: `src/app/admin/noc/queue/` — the reject action handler
- Investigate: any email-sending code triggered by status changes

- [ ] **Step 1: Trace the reject action**

```bash
grep -rn "reject\|Reject\|REJECTED\|sendEmail\|email" src/app/admin/noc/ --include="*.ts" --include="*.tsx"
```

Confirm that the reject action does NOT send an email to the applicant's address.

- [ ] **Step 2: If email IS sent on rejection, remove it**

If a rejection email send is found, remove it. Add a comment explaining the decision:

```ts
// Rejection comms are handled offline by the NOC in their own language.
// The system intentionally does not send automated rejection emails.
// Decision: 2026-04-16 demo meeting (Emma/IOC, Martyn/OCOG, Lucia/IOC).
```

- [ ] **Step 3: Commit if changed**

```bash
git add <changed files>
git commit -m "fix(noc): remove any automated rejection email to applicant (2026-04-16 decision)"
```

If no email was being sent, no commit needed — note in TODOS.md that this was confirmed.

---

### Task 15: Confirm rejected applications are permanently retained in audit trail

**Context:** IOC explicitly stated all applications — including rejected ones — must remain in the audit trail permanently. Deletion must be blocked.

**Files:**
- Investigate: `src/db/schema.ts` — application status states
- Investigate: any delete action handlers in admin routes

- [ ] **Step 1: Verify no delete route exists for applications**

```bash
grep -rn "delete\|DELETE\|destroy\|remove" src/app/admin/ --include="*.ts" --include="*.tsx" | grep -i "application\|eoi\|org"
```

- [ ] **Step 2: Verify the DB schema has no cascade-delete**

```bash
grep -A5 "applications\|eoi_applications" src/db/schema.ts | grep -i "delete"
```

Confirm there is no `onDelete: "cascade"` that would remove application rows.

- [ ] **Step 3: If any delete path exists, block it with a 403**

If a delete endpoint exists, replace the handler body with:

```ts
return new Response("Application records cannot be deleted per audit retention policy.", { status: 403 });
```

- [ ] **Step 4: Commit if changed**

```bash
git add <changed files>
git commit -m "fix(audit): block application record deletion per 2026-04-16 IOC requirement"
```

---

### Task 16: Record meeting decisions in stakeholder-questions.md

**Context:** Several items in stakeholder-questions.md have now been answered at the 2026-04-16 meeting. Update their status so the doc remains the live source of truth.

**Files:**
- Modify: `docs/stakeholder-questions.md`

- [ ] **Step 1: Mark confirmed decisions**

Update the following items in stakeholder-questions.md with resolution markers and date `[RESOLVED 2026-04-16]`:

| Section | Decision |
|---------|----------|
| **1.3 Q2** — Global deadline enforcement | Hard global close enforced platform-wide. NOC can invite/fast-track after deadline. OCOG can reopen specific NOC windows. |
| **2.2 Q1** — Rejection permanence | Rejections permanent confirmed. Retained in audit trail. No reversal path to be built. |
| **6.4c** — French localisation | English + French + Spanish required at launch (not v1.1). Promote to P0. |
| **6.4a** — NOC onboarding | Same process as ACR onboarding. LA28 ACR to coordinate. |
| Application email on submission | Auto email confirmation to applicant confirmed. NOC not contacted at this stage. |
| Rejection emails | System must NOT send automated rejection emails to applicants. NOC handles offline. |

- [ ] **Step 2: Mark still-open items with next meeting ETA**

For items not yet resolved (submit button bug, final field list, PbN approval authority, ENR self-apply, post-handoff source of truth), add a note:

```
**Next discussion:** Week of 2026-04-28 (placeholder sent by Randi/IOC)
```

- [ ] **Step 3: Update Last updated header**

Change to `16-Apr-2026 14:00 CEST`.

- [ ] **Step 4: Regenerate DOCX**

```bash
pandoc docs/stakeholder-questions.md -o docs/stakeholder-questions.docx --wrap=none
```

- [ ] **Step 5: Commit and push**

```bash
git add docs/stakeholder-questions.md docs/stakeholder-questions.docx
git commit -m "docs(stakeholder): record 2026-04-16 meeting decisions and resolutions"
git push
```

---

### Task 17: Applicant status page — show only submission status, not approval bucket

**Context (from live meeting chat):** The group agreed the status page should NOT reveal which approval/rejection bucket the applicant is in. "Accepted as Candidate" is too revealing. Only "submitted" (complete application in system) or "incomplete" (draft not yet submitted) should be shown. "Application received" was proposed as the neutral confirmation copy.

Emma confirmed: "the status shouldn't be displayed when the press organization goes back to the portal via the magic link. Maybe just the status of 'submitted' or 'incomplete' should be displayed here. Definitely nothing about which approval/rejection bucket the organization is in."

Additionally: change every instance of "Accepted as Candidate" in applicant-facing copy to "Application received".

**Files:**
- Modify: `src/app/apply/status/view/page.tsx` — the magic-link status view
- Modify: `src/app/apply/how-it-works/page.tsx` — if it references "Accepted as Candidate"
- Modify: `src/app/apply/EoiFormTabs.tsx` — if it references "Accepted as Candidate"
- Investigate: any other file that renders applicant-facing status copy

- [ ] **Step 1: Find all applicant-facing status copy**

```bash
grep -rn "Accepted as Candidate\|accepted_as_candidate\|approved\|rejected\|under.review\|returned" \
  src/app/apply/ --include="*.tsx" --include="*.ts"
```

Note: the NOC-side admin uses these statuses legitimately. Only the applicant-facing `/apply/` routes should be changed.

- [ ] **Step 2: Update status/view/page.tsx**

The magic-link status view must only display:
- **"Application received"** — if a submitted application exists for this email (regardless of what the NOC has decided)
- **"Application incomplete"** — if a draft exists but was never submitted

It must NOT show: Approved, Accepted as Candidate, Returned, Rejected, Under Review, or any other NOC decision state.

Replace any status-conditional rendering that shows NOC decision states with a simple two-state check:

```ts
// Show only whether the application was submitted or not.
// NOC decisions are internal and not surfaced to applicants.
const displayStatus = application.submittedAt ? "received" : "incomplete";
```

Render:
- `received` → heading "Application received", body "Your press registration application has been received. We will be in touch if further information is needed."
- `incomplete` → heading "Application incomplete", body "Your application has not been submitted. Please return to the form to complete and submit it."

- [ ] **Step 3: Update how-it-works/page.tsx and EoiFormTabs.tsx**

```bash
grep -rn "Accepted as Candidate\|accepted_as_candidate" src/app/apply/ --include="*.tsx"
```

Replace every occurrence with "Application received" (applicant copy) or remove if it described an internal state.

- [ ] **Step 4: Verify admin-side status labels are unchanged**

The NOC queue, OCOG view, and IOC audit still need to show "Approved", "Returned", "Rejected" etc. for admin users. Confirm these routes are NOT in `src/app/apply/` and are therefore untouched.

```bash
grep -rn "Accepted as Candidate\|accepted_as_candidate" src/app/admin/ --include="*.tsx"
```

If found in admin routes, those can stay (they are internal admin copy, not applicant-facing).

- [ ] **Step 5: Run tests**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/apply/
git commit -m "fix(apply): status page shows only submitted/incomplete — no approval bucket (2026-04-16 decision)"
git push
```

---

### Task 18: Email sender — must NOT be IOC or OCOG

**Context (from live meeting chat):** "Emails can't come from IOC or OCOG." The auto-confirmation email sent to applicants on submission must come from a neutral portal/D.TEC sender, not from any IOC or OCOG email address.

This is primarily a configuration constraint for when the email infrastructure (TODO-030) is wired up. The task is to document the constraint and ensure it is enforced in the email stub/config.

**Files:**
- Modify: `src/lib/email.ts` — if it exists, ensure sender address is portal-domain only
- Modify: `docs/plans/2026-04-10-004-feat-email-infrastructure-anomaly-digest-plan.md` — add sender constraint note
- Modify: `TODOS.md` — add note to TODO-030

- [ ] **Step 1: Check current email sender configuration**

```bash
cat src/lib/email.ts 2>/dev/null || echo "file does not exist"
grep -rn "from\|From\|sender\|email" src/lib/ --include="*.ts" | grep -v "session\|cookie"
```

- [ ] **Step 2: If email.ts exists, enforce sender address**

The `from` address must be a portal-domain address — e.g., `"Press Registration Portal <noreply@prp.la28.org>"` or whatever D.TEC's confirmed domain is. It must not be `@olympic.org`, `@la28.org`, or any IOC/OCOG domain.

Add a guard to the email wrapper:

```ts
const ALLOWED_SENDER_DOMAINS = ["dgpbeta.com", "deloitte.com"]; // update with confirmed D.TEC domain
// Sender must never be IOC or OCOG domain. Decision: 2026-04-16 meeting.
```

- [ ] **Step 3: Add note to TODOS.md TODO-030**

In the TODO-030 entry, add:

```
**Sender constraint (2026-04-16):** Emails must NOT come from IOC or OCOG email addresses. Sender must be a D.TEC/portal domain. Confirm the exact from-address with D.TEC infra before wiring Resend.
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ TODOS.md
git commit -m "docs(email): record sender-domain constraint — not IOC or OCOG (2026-04-16 decision)"
git push
```

---

## ⚠ Deferred to follow-up plan (pending Emma's field list + offline discussions)

The following items from the meeting require additional input before implementation can be planned:

**Pending Emma's consolidated field list (due early next week):**
- [ ] **Quota management consolidated view** — requests vs. allocations vs. totals per org in a single view.
- [ ] **ENR ranking/prioritisation UI** — NOCs need to rank orgs; IOC needs combined multi-NOC view with running 350-slot total.

**Pending offline discussion:**
- [ ] **IPC/Paralympics** — NPC Press by Number scheduled Q2 2027. NYT-style cross-Games org linking (NOC + NPC as separate legal entities, except USA/NOR/NED/KSA/RSA). IOC to confirm whether IPC wants EoI process. Ken to take offline with Randi/IOC. Do NOT build until requirements are confirmed.
- [ ] **Language support (EN/FR/ES)** — Confirmed P0 launch requirement. Requires translator procurement (TODO-009) and i18n architecture decision. Plan in sprint 2.
- [ ] **Responsible Organisation "blurry" cases** — Open question from chat: do all press orgs always know their responsible organisation? Needs IOC/Emma input before designing any disambiguation UI.

Once inputs arrive, create `docs/superpowers/plans/2026-04-23-prp-sprint-2.md`.

---

## Self-Review Checklist

- [x] Spec coverage: rename covers all 9 technical scope areas identified (source strings, cookie names, export filenames, package.json, CI, primary docs, stakeholder docs, HTML design files, plans/memory)
- [x] Meeting items: all confirmed decisions from AI meeting minutes have a task (reject emails, auto confirmation, audit retention, resolved stakeholder items, TODOS update)
- [x] Placeholder scan: no "TBD" or "implement later" in Part A; Part B deferred items explicitly labelled as deferred with reason
- [x] Type consistency: no new types introduced; file paths match explore-agent findings
- [x] Open items: chat paste dependency and field list dependency explicitly called out
