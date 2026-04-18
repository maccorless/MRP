Created: 18-Apr-2026 12:15 CDT

# PRP — Role Permissions Reference

This document describes the roles and permissions enforced by the LA28 Press Registration Portal (PRP) as implemented in the codebase. It is derived from the authentication helpers in `src/lib/session.ts`, the auth gate in `src/middleware.ts`, and the per-route guards present in every admin page and server action.

## Roles

The portal defines five admin roles plus the unauthenticated applicant user.

| Role | Code (`AdminRole`) | Scope |
|---|---|---|
| NOC Admin | `noc_admin` | A single National Olympic Committee. Identified by `nocCode`. |
| IF Admin | `if_admin` | A single International Federation. Identified by `ifCode`. |
| OCOG Admin | `ocog_admin` | LA28 Organising Committee — cross-NOC and cross-IF authority. |
| IOC Admin | `ioc_admin` | International Olympic Committee — full read, plus ENR grants, quota setting, IOC-Direct management, event settings, sudo, feature flags, and override authority. |
| IOC Readonly | `ioc_readonly` | Same read visibility as IOC Admin. No write actions. No sudo. |
| Applicant | (no account) | Public EoI applicant. Magic-link email verification; 90-day status token after submission. No admin surface access. |

Sudo is a mode, not a role. When an IOC Admin activates sudo to act as another user, the sudo session cookie (`prp_sudo_session`) overrides the normal session cookie (`prp_session`) for read views. Every write action rejects sudo sessions, making sudo strictly read-only.

## Authentication and session

- **Middleware** (`src/middleware.ts`) gates every `/admin/*` route except `/admin/login`. If no valid session cookie is present, the request is redirected to `/admin/login`.
- **Admin session cookie:** `prp_session`, HMAC-SHA256 signed, max-age 8 hours.
- **Sudo session cookie:** `prp_sudo_session`, HMAC-SHA256 signed, max-age 1 hour. Takes precedence over the normal session when present.
- **Applicant status session:** tied to application reference plus email, 90-day lifetime. Used to check application status and view the submitted application.

## Server-side guards

Every admin page and every server action calls one of the following guards before performing any data access. These are the enforcement points.

| Guard | Who passes | Typical use |
|---|---|---|
| `requireSession` | Any authenticated admin | Shared pages (rare — most screens are role-specific). |
| `requireNocSession` | `noc_admin` with `nocCode` | All `/admin/noc/*` pages and actions. |
| `requireIfSession` | `if_admin` with `ifCode` | IF-only surfaces. |
| `requireNocOrIfSession` | `noc_admin` or `if_admin` | Pages shared between NOC and IF admins (e.g. Direct Entry, PbN, ENR). |
| `requireOcogSession` | `ocog_admin` | All `/admin/ocog/*` pages and actions. |
| `requireIocSession` | `ioc_admin` or `ioc_readonly` | All `/admin/ioc/*` read pages (visibility, master allocation, audit, help). |
| `requireIocAdminSession` | `ioc_admin` only | IOC write surfaces: quotas, event settings, IOC-Direct management, ENR grants, sudo, feature flags. |
| `requireWritable` | Any non-sudo session | Called at the top of every write action, in addition to the role guard. Rejects sudo sessions. |

A page or action may call both a role guard and `requireWritable` — the role guard enforces identity; `requireWritable` enforces that the session is not a read-only sudo session. The combination produces a permission matrix that is enforced consistently across all write paths.

## Permissions by activity

The table below summarises what each role can do. A ✅ means the role can perform the activity; ✅ read-only means visibility without the ability to change data; ❌ means the role cannot access the capability.

### Expression of Interest (EoI)

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| Submit public EoI application | (applicant only) | (applicant only) | (applicant only) | (applicant only) | (applicant only) |
| Review EoI queue for territory | ✅ (own territory) | (no EoI queue — invited/Direct Entry only) | ❌ | ❌ | ❌ |
| Accept as Candidate / Return / Reject | ✅ (own territory) | ❌ | ❌ | ❌ | ❌ |
| Unapprove / Unreturn / Unreject (pre-window-close) | ✅ (own territory) | ❌ | ❌ | ❌ | ❌ |
| Add organisation via Direct Entry | ✅ (own territory) | ✅ (own sport) | ❌ | ❌ (uses IOC-Direct route) | ❌ |
| Invite organisation (pre-fill link) | ✅ (own territory) | ✅ (own sport) | ❌ | ❌ | ❌ |
| Set global EoI window open/close date | ❌ | ❌ | ✅ | ❌ | ❌ |
| Per-NOC EoI window override | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cross-NOC EoI summary (pivot view) | ❌ | ❌ | ✅ | ✅ read-only | ✅ read-only |
| Cross-NOC duplicate detection panel | ❌ | ❌ | ✅ | ✅ read-only | ✅ read-only |
| Dismiss a within-NOC duplicate pair | ✅ (own territory) | ✅ (own sport) | ❌ | ❌ | ❌ |
| Publish or unpublish EoI / PbN results to applicants | ❌ | ❌ | ✅ | ❌ | ❌ |

### Press by Number (PbN)

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| Allocate per-category slots to orgs | ✅ (own territory, within quota cap) | ✅ (own sport, within quota cap) | ❌ | ❌ (IOC-Direct workflow only) | ❌ |
| Add org directly to PbN without EoI record | ✅ (own territory) | ✅ (own sport) | ❌ | ❌ | ❌ |
| Export CSV template for offline PbN work | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reimport PbN CSV (full-overlay) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit PbN allocation for OCOG review | ✅ | ✅ | ❌ | ❌ | ❌ |
| Formally approve / adjust PbN allocation | ❌ | ❌ | ✅ | ❌ (override authority, rare) | ❌ |
| Reverse OCOG PbN approval | ❌ | ❌ | ✅ | ✅ (IOC override, audit-logged) | ❌ |
| Send approved PbN to ACR | ❌ | ❌ | ✅ | ❌ | ❌ |
| View PbN allocations across NOCs/IFs | ❌ | ❌ | ✅ | ✅ read-only | ✅ read-only |
| Post-`sent_to_acr` edits | ❌ | ❌ | ❌ | ❌ | ❌ |

### Quotas and event settings

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| Import per-NOC / per-IF quota totals (CSV) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Edit individual quota cells in-portal | ❌ | ❌ | ❌ | ✅ | ❌ |
| View quota totals for own body | ✅ | ✅ | ✅ (all) | ✅ (all) | ✅ (all) |
| Configure event capacity and IOC holdback | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Master Allocation Dashboard | ❌ | ❌ | ✅ | ✅ | ✅ |

### Extended Non-Rights Broadcasters (ENR)

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| Self-apply via public EoI form (ENR org type) | (applicant) | (applicant) | (applicant) | (applicant) | (applicant) |
| Prioritise ENR applications (1–99 ranking) | ✅ (own territory) | ❌ (IFs have no ENR) | ❌ | ❌ | ❌ |
| Submit ranked ENR list to IOC | ✅ (own territory) | ❌ | ❌ | ❌ | ❌ |
| Grant / partial / deny ENR slots | ❌ | ❌ | ❌ | ✅ | ❌ |
| Inline edit of granted slot counts | ❌ | ❌ | ❌ | ✅ | ❌ |
| View cross-NOC ENR combined review | ❌ | ❌ | ❌ | ✅ | ✅ read-only |

### IOC-Direct organisations

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| Add / remove orgs in the reserved list | ❌ | ❌ | ❌ | ✅ | ❌ |
| Perform NOC-equivalent EoI review for IOC-Direct orgs | ❌ | ❌ | ❌ | ✅ | ❌ |
| Allocate PbN slots for IOC-Direct orgs | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve IOC-Direct PbN (same state machine as any NOC) | ❌ | ❌ | ✅ | ❌ | ❌ |

### Platform and governance

| Activity | NOC | IF | OCOG | IOC | IOC Readonly |
|---|---|---|---|---|---|
| View audit log | ❌ | ❌ | ✅ | ✅ | ✅ |
| Initiate sudo (read-only impersonation) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Target of an IOC sudo session | ✅ | ✅ | ✅ | ❌ (IOC cannot sudo IOC) | ❌ |
| Manage feature flags | ❌ | ❌ | ❌ | ✅ | ❌ |
| View role-specific help page | ✅ | ✅ | ✅ | ✅ | ✅ |

## Sudo (read-only impersonation)

IOC Admins can open a read-only session as any non-IOC admin user.

- Sudo tokens are one-time-use, expire in 10 minutes if unused, and activate in a new browser tab.
- During sudo, `requireWritable()` rejects every write action. The amber SUDO MODE banner is shown on all admin pages.
- `getSession()` returns the target user's identity while sudo is active; `getBaseSession()` returns the original IOC admin's identity (used to verify the initiator when a new sudo token is generated).
- An IOC admin cannot sudo into another IOC account.
- Sudo activation and termination are audit-logged with both the initiating actor (IOC admin) and target.

## Territory scoping

- **NOC Admin** sees and can act on data where `noc_code` matches the session's `nocCode`. Scoping is enforced in the server-side guards (`requireNocSession`) and in every query used by those guards.
- **IF Admin** sees and can act on data where the row's `entity_type = 'if'` and the `noc_code` column (used as a body code for IFs) matches the session's `ifCode`.
- **OCOG Admin** has cross-NOC and cross-IF access on PbN, EoI summary, duplicates, and Master Allocation.
- **IOC Admin / IOC Readonly** have cross-NOC and cross-IF read access across all data; IOC Admin also has the IOC-Direct workflow and ENR grants plus override authority on OCOG PbN approvals.

## Applicant access (no account)

- The public EoI form at `/apply` is accessible without authentication.
- Email verification via magic link is required before submission.
- After submission, a 90-day status token allows the applicant to view their submitted application and its current status (`/apply/status`). Applicant-facing status is masked as "Application received" until the OCOG publishes PbN results.

## Change log

Update this document whenever:
- A new role is added to `AdminRole` in `src/lib/session.ts`.
- A new `require*Session` guard is introduced.
- A new activity moves between roles (e.g. a capability that used to be OCOG-only becomes IOC-only).
- The sudo model changes.

The code is the source of truth. If this document and the code disagree, the code is right and this document needs to be updated.
