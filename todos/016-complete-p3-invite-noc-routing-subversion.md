---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, security, architecture, invitations]
dependencies: []
---

# Invite Prefill NOC Code User-Modifiable via URL Parameters

## Problem Statement

When an invite is redeemed, `src/app/invite/[token]/actions.ts` extracts org details (including `nocCode`) from the invitation and appends them as URL query parameters before redirecting to `/apply/form`. A user who observes the redirect URL can manually modify the `noc_code` parameter before the form loads. On submission, the `noc_code` from the form is used — the server never re-verifies that the submitted NOC matches the invite's intended NOC.

An invited applicant could self-assign to a different NOC than the one that invited them, bypassing the invite's routing intent.

## Findings

- **File**: `src/app/invite/[token]/actions.ts`, lines 117–123
- **File**: `src/app/apply/form/page.tsx`, lines 84–91
- Prefill values arrive as `searchParams` on the form page
- `submitApplication` in `actions.ts` uses the NOC code from the form, not from the invite
- The `linkedInvite` lookup in `submitApplication` confirms the invite exists but does not assert NOC match

## Proposed Solutions

### Option A: Re-verify NOC at submission time (Recommended)
In `submitApplication`, when a `linked_invite_id` is present:
```typescript
const invite = await db.query.invitations.findFirst({ where: eq(invitations.id, linkedInviteId) });
if (invite && invite.nocCode && invite.nocCode !== submittedNocCode) {
  return { error: "The submitted NOC does not match the invitation." };
}
```
- **Effort**: Small
- **Risk**: Low

### Option B: Encrypt/sign the prefill values in the redirect URL
- HMAC-sign the `noc_code` parameter so tampering is detectable at form load
- **Effort**: Medium
- **Risk**: Low

### Option C: Pass prefill through session/cookie instead of URL
- Store invite prefill data in a short-lived server session on redemption
- Form page reads from session, not URL params
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

Option A — cheapest fix that directly prevents the exploit.

## Technical Details

- **Affected files**: `src/app/apply/actions.ts` (submitApplication)

## Acceptance Criteria

- [ ] `submitApplication` re-verifies submitted `noc_code` matches `invite.nocCode` when invite is linked
- [ ] Mismatched NOC submission returns an error (not a silent override)
- [ ] Test: submit application via invite URL with modified noc_code parameter → rejected

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
