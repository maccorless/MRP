---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, architecture, data-integrity, bug]
dependencies: []
---

# org_email Not Persisted to organizations Table on Resubmission

## Problem Statement

When an applicant resubmits their EoI, `submitApplication` in `src/app/apply/actions.ts` updates the `applications` table but does not update the `organizations` row. The `org_email` field (and potentially other org-level fields like `website`) lives on the `organizations` table. This means a resubmitting applicant who changes their `org_email` will see the new value in their form — but the `organizations` table will retain the old value from their original submission.

This is a pre-existing bug made more prominent by the recent move of `org_email` to the ContactsTab (a more visible location in the form).

## Findings

- **File**: `src/app/apply/actions.ts`, resubmission path (~lines 191–252)
- `organizations` table is updated only on the initial submission path
- On resubmission: `applications` row is updated, `organizations` row is not
- `org_email` is in `schema.ts` on the `organizations` table
- An applicant changing `org_email` during resubmission will have stale data in `organizations`

## Proposed Solutions

### Option A: Update organizations row in the resubmission transaction (Recommended)
```ts
// Inside the resubmission transaction in actions.ts:
await tx.update(organizations)
  .set({
    orgEmail: formData.get("org_email") as string || null,
    website: websiteRaw || null,
    // any other org-level fields that the applicant can edit
  })
  .where(eq(organizations.id, existingApp.organizationId));
```
- **Effort**: Small
- **Risk**: Low

### Option B: Log a warning and treat resubmission as read-only for org fields
- Show a note in the resubmission form: "Organisation details cannot be changed on resubmission"
- Grey out org fields in the resubmission form
- **Pros**: Simpler; prevents accidental org mutation
- **Cons**: Poor UX; applicants may have legitimately changed their org details
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A — updating the `organizations` row in the resubmission transaction is the correct behaviour.

## Technical Details

- **Affected files**: `src/app/apply/actions.ts` (resubmission transaction path)
- **DB tables**: `organizations`
- Confirm which other org fields are editable on resubmission and include them in the update

## Acceptance Criteria

- [ ] Resubmission transaction updates `organizations.orgEmail` when changed
- [ ] Resubmission transaction updates `organizations.website` when changed
- [ ] Test: resubmit application with changed org_email → `organizations` row reflects new value
- [ ] Audit log records the org update

## Work Log

- 2026-04-17: Identified by architecture-strategist in code review of main branch
