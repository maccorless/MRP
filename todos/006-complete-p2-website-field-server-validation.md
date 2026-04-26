---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, security, xss, validation]
dependencies: []
---

# Website Field Not Server-Side Validated — Stored XSS Risk

## Problem Statement

The `submitApplication` server action in `src/app/apply/actions.ts` accepts any string in the `website` field without format validation:

```ts
const websiteRaw = (formData.get("website") as string)?.trim();
const website = websiteRaw || null;
```

A malicious submitter bypassing the browser can store a `javascript:` URL in the `website` column. This is then rendered as a clickable link in the admin NOC queue view and the applicant's own status view. If those views render `org.website` inside an `<a href>`, this is a stored XSS vector.

The client-side URL validation exists (lines 509–515 of `EoiFormTabs.tsx`) but `noValidate` is set and a direct POST to the server action bypasses all client-side logic entirely.

## Findings

- **File**: `src/app/apply/actions.ts` — no URL format validation on `website`
- Client-side validation exists but is bypassable
- `org.website` is rendered in admin NOC queue and status view
- Stored XSS vector via `javascript:` URLs

## Proposed Solutions

### Option A: Add server-side regex validation (Recommended)
```ts
const website = websiteRaw
  ? /^https?:\/\/.+\..+/.test(websiteRaw) ? websiteRaw : null
  : null;
```
Silently strips invalid URLs (same UX as leaving the field blank).

### Option B: Reject submission with error
```ts
if (websiteRaw && !/^https?:\/\//.test(websiteRaw)) {
  return { error: "Website must start with https://" };
}
```

### Option C: Sanitise at render time
Add `rel="noopener noreferrer"` and validate `href` before rendering `<a>` in admin/status views.

**Effort**: Small for A/B, Small for C (complementary)
**Risk**: Low

## Recommended Action

Option A (silent strip) + Option C (defensive rendering). Belt and suspenders.

## Technical Details

- **Affected files**: `src/app/apply/actions.ts`, admin NOC queue view, status view
- Audit all `org.website` render sites for `<a href={org.website}>` patterns

## Acceptance Criteria

- [ ] `submitApplication` rejects or strips non-http(s) URLs in `website` field
- [ ] Admin views render `org.website` in `<a href>` only after URL validation
- [ ] All `<a>` tags rendering external URLs have `rel="noopener noreferrer"`
- [ ] Direct POST to server action with `javascript:` URL does not store it

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
