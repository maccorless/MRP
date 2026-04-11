---
title: "feat: Invited-org flow for NOC/IF admin"
type: feat
status: active
date: 2026-04-10
---

# feat: Invited-Org Flow for NOC/IF Admin (MISS-05)

## Overview

NOC and IF admins can invite known media organisations via a pre-addressed link. The invited org receives a link that pre-fills their EoI form. This avoids manual re-entry for known publishers and reduces submission errors for partner organisations.

## Problem Statement

Currently the only way an org enters the system is via the public EoI form (`/apply`). Some NOCs have long-standing media relationships and can predict which orgs will apply. A bulk of data-entry friction — org name, address, type, country — is already known to the NOC admin. The invited-org flow lets the NOC address the form to the org directly, pre-filling org-level data and ensuring the application lands in the right territory.

## Proposed Solution

### New DB table: `invitations`

```sql
CREATE TABLE invitations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash     text NOT NULL UNIQUE,     -- hashToken(raw_token), never stored raw
  noc_code       text NOT NULL,
  created_by     uuid REFERENCES admin_users(id),
  prefill_data   jsonb NOT NULL DEFAULT '{}',   -- PrefillData shape
  recipient_email text,                    -- nullable: NOC may not know the contact email yet
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz,              -- null = unused; set atomically on first use
  accepted_app_id uuid,                    -- FK to applications.id on conversion
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

**Why separate from `magic_link_tokens`:** The existing magic-link table has `email NOT NULL`. Invitations may be created before the contact email is known. The `invitations` table carries a richer payload (prefill JSONB, nocCode, actor).

### Token mechanics

Reuse existing `generateToken()` + `hashToken()` from `src/lib/tokens.ts` verbatim. Token is 8 characters, SHA-256 hashed for storage. Default expiry: 7 days (new `INVITE_EXPIRY_DAYS` env var, default `7`).

### Token exchange on landing (Option A — preferred)

When an invited org visits `/invite/[token]`:

1. Server looks up `hashToken(token)` in `invitations` — validates not expired, not used
2. Extracts `prefill_data` and `noc_code`
3. **Creates a `magic_link_tokens` entry** for `recipient_email` (or a placeholder email if absent) — this exchanges the invite token for the standard form auth token
4. Marks `invitations.used_at = now()` atomically
5. Redirects to `/apply/form?token=<new_magic_token>&email=<email>&from=invite`

This means `submitApplication` in `/apply/actions.ts` **requires zero changes** — it already validates against `magic_link_tokens`. Option A is preferable over modifying the submission logic.

**If `recipient_email` is null:** The `/invite/[token]` landing page shows an "Enter your email to continue" step that captures the email before creating the magic-link token. This also populates `invitations.recipient_email` for tracking purposes.

### Pre-fill in the form

`PrefillData` type in `src/app/apply/form/EoiFormTabs.tsx` (lines 14–61) is already the correct shape. The invite pre-fill JSON maps directly to it — no type changes needed.

**localStorage gotcha:** The form currently restores a draft from `localStorage` keyed `eoi-draft-${email}`. This will overwrite server-supplied pre-fill if the applicant has a prior draft for that email. Fix: when `searchParams.from === 'invite'`, skip localStorage restore (or seed localStorage with the invite pre-fill before the restore runs). Change is in `EoiFormTabs.tsx` restore effect.

### Application `entrySource`

Add `'invited'` as a third variant. The `entrySource` column on `applications` is plain `text` with a CHECK constraint, not a pgEnum — adding `'invited'` requires only a migration to update the CHECK constraint.

```sql
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_entry_source_check,
  ADD CONSTRAINT applications_entry_source_check
    CHECK (entry_source IN ('self_submitted', 'noc_direct', 'invited'));
```

### Audit log additions

```typescript
// src/db/schema.ts — auditActionEnum
'invitation_created'   // NOC admin creates an invite
'invitation_accepted'  // org submits via invite link
```

---

## Technical Approach

### Implementation Phases

#### Phase 1: Schema + token exchange

- Add `invitations` table migration (`bun db:generate`)
- Add `INVITE_EXPIRY_DAYS` env var (default `7`)
- Add `invitation_created` + `invitation_accepted` to `auditActionEnum`
- Update `applications` entry_source CHECK constraint
- Write `/invite/[token]/page.tsx` server component: token lookup + email capture step + magic-link exchange + redirect

#### Phase 2: NOC admin invitation UI

- New `src/app/admin/noc/invite/page.tsx` — invite creation form
  - Fields: recipient org name (pre-fills `orgName`), org type, country, website, recipient email (optional), message/note
  - On submit: calls `createInvitation()` server action
  - Post-submit: shows the invite link (`/invite/[token]`) in a copy-to-clipboard panel
- New `src/app/admin/noc/invite/actions.ts` — `createInvitation(formData)`: validates session, generates token, inserts `invitations` row, writes audit log, returns `{ inviteUrl }`
- New `src/app/admin/noc/invite/[id]/page.tsx` — invite status: accepted / expired / pending
- Add `"Invite Org"` to `NocNavTabs.tsx` between Fast-Track and PbN Allocations

#### Phase 3: Invite management list + email (optional)

- `src/app/admin/noc/invite/page.tsx` becomes a list of sent invitations with status and resend capability
- Email sending: once email infrastructure is available (see TODO-006 plan), call `sendEmail()` from `createInvitation()` to deliver the invite link automatically
- Until email is set up, the copy-link panel (Phase 2) is the delivery mechanism — consistent with the existing magic-link prototype approach

---

## System-Wide Impact

- **Zero changes to `/apply` submission flow** (Option A token exchange keeps `submitApplication` untouched)
- **Dedup still fires** at submission time — if the invited org's email domain already has an application under this NOC, the existing org record is reused. NOC admin creating the invite cannot predict this, but it is correct behaviour.
- **`nocCode` is always session-derived** in `createInvitation()` — the applicant cannot change which NOC they're submitting to via the invite link

## Acceptance Criteria

- [ ] NOC admin can create an invitation from `/admin/noc/invite` with optional email and pre-fill data
- [ ] Invite link (`/invite/[token]`) pre-fills the EoI form with invitation data
- [ ] Invite link expires after `INVITE_EXPIRY_DAYS` days and shows a clear expired-link page
- [ ] Each invite link can only be used once — second visit shows an already-used page
- [ ] If `recipient_email` is null, `/invite/[token]` shows an email capture step before proceeding
- [ ] Application created via invite has `entrySource = 'invited'` in DB
- [ ] localStorage pre-fill restoration is skipped when `from=invite` is set
- [ ] NOC admin can see pending/accepted/expired status of sent invites
- [ ] `invitation_created` and `invitation_accepted` are written to the audit log
- [ ] IFs can use the same invite flow (same NOC routes, role-gated to noc_admin + if_admin)

## Files to Create / Modify

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `invitations` table, `invitation_created`/`invitation_accepted` to auditActionEnum, update entry_source CHECK |
| `src/db/migrations/0014_invitations.sql` | Generated — invitations table + CHECK update |
| `src/app/invite/[token]/page.tsx` | New — public invite landing page (token lookup → email capture → magic-link exchange → redirect) |
| `src/app/admin/noc/invite/page.tsx` | New — invite creation form + sent-invites list |
| `src/app/admin/noc/invite/actions.ts` | New — `createInvitation()`, `resendInvitation()` |
| `src/app/admin/noc/invite/[id]/page.tsx` | New — invite status detail |
| `src/app/admin/noc/NocNavTabs.tsx` | Add "Invite Org" tab |
| `src/app/apply/form/EoiFormTabs.tsx` | Skip localStorage restore when `from=invite` |
| `src/app/apply/actions.ts` | No change needed (Option A) |

## Sources & References

- Token generation: `src/lib/tokens.ts` (generateToken, hashToken)
- Magic-link token schema: `src/db/schema.ts:88` (template for invitations table)
- Sudo tokens schema: `src/db/schema.ts:336` (actor + metadata pattern)
- PrefillData type: `src/app/apply/form/EoiFormTabs.tsx:14`
- localStorage restore (gotcha): `src/app/apply/form/EoiFormTabs.tsx:127`
- Form pre-fill wiring: `src/app/apply/form/page.tsx:18`
- Fast-Track action (structural template): `src/app/admin/noc/fast-track/actions.ts`
- NOC nav: `src/app/admin/noc/NocNavTabs.tsx:6`
