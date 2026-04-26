---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, security, validation, audit-log]
dependencies: []
---

# Unvalidated statusFilter Parameter Injected Into Audit Log

## Problem Statement

`src/app/api/export/eoi/route.ts` reads `statusFilter` from query params and interpolates it directly into the audit log `detail` field without validation:

```ts
if (statusFilter) conditions.push(eq(applications.status, statusFilter as typeof applications.status.enumValues[number]));
// ...
detail: `EoI export — ${filtered.length} applications${statusFilter ? ` (${statusFilter})` : ""}`,
```

The TypeScript `as typeof ...` cast is compile-time only. At runtime, any string is accepted. A malicious admin can write arbitrary strings into the audit table via this parameter. If audit logs are forwarded to a SIEM, this is a log injection vector.

## Findings

- **File**: `src/app/api/export/eoi/route.ts`, line ~80
- `statusFilter` from `searchParams.get("status")` — no validation
- Passed directly to Drizzle `eq()` and into audit log string
- This endpoint is admin-only, but log injection from an admin is still a compliance risk

## Proposed Solutions

### Option A: Allowlist validation (Recommended)
```ts
const VALID_STATUSES = ["pending", "approved", "returned", "resubmitted", "rejected"] as const;
const rawStatus = searchParams.get("status");
if (rawStatus && !VALID_STATUSES.includes(rawStatus as never)) {
  return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
}
const statusFilter = rawStatus as typeof VALID_STATUSES[number] | null;
```
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `src/app/api/export/eoi/route.ts`
- Valid statuses should match the `applicationStatus` pgEnum in `src/db/schema.ts`

## Acceptance Criteria

- [ ] `statusFilter` validated against allowed enum values before use
- [ ] Invalid `status` query param returns 400
- [ ] Audit log `detail` field only contains sanitised status strings

## Work Log

- 2026-04-17: Identified by security-sentinel in code review of main branch
