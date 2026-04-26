Created: 19-Apr-2026 10:15 CEST

# Release Notes — April 19, 2026

Changes shipped April 18–19, 2026. Covers 13 commits merged into `main` since the April 17 release.

---

## EoI Form — Submission Hardening

Three commits together close a long-running regression class where non-Submit actions on the Expression of Interest form could inadvertently trigger server submission or the "missing required fields" modal.

### Publication tab Continue no longer triggers the submit modal

The Continue and Submit buttons share a ternary slot in the JSX. Because both rendered as plain `<button>` elements without distinct React keys, React reused the same DOM node across the transition and silently flipped `type="button"` → `type="submit"` mid-click. On production React builds (Railway staging and prod), this caused the native form-submission default to fire during a Continue click, so the applicant saw the **History: Tab not yet completed** validation modal even though they had only clicked Continue.

Two defenses are now in place:

- **Distinct React keys** (`key="eoi-nav-continue"` / `key="eoi-nav-submit"`) force React to unmount Continue and mount a fresh Submit node rather than flip `type` on a live DOM element.
- **`data-eoi-submit="final"`** marker on the Submit button, plus a submitter check in `handleSubmit`. Even if a stray submit event fires for any other reason (autofill, extension, a regressed button type), the handler routes it to the tab-advance branch instead of the validation modal.

Structural invariant tests were extended to cover both defenses, so this class of bug cannot regress at the source level.

### Form detached from server action

The `<form>` no longer carries an `action={submitApplication}` prop. `submitApplication` is invoked imperatively (with `new FormData(form)`) only from the pre-submission confirmation handler. This closes every ambient path that could previously reach the server — including Enter-key submission, autofill-triggered submits, and browser extensions that dispatch synthetic submit events.

### Publication tab requires at least one publication type

The Publication tab now enforces that at least one **Publication type** checkbox is selected:

- Red asterisk next to the "Publication type" label.
- Green completion dot only appears once a type is checked.
- Validation modal routes "Go to first missing field" to the publication-type checkbox group when it's the blocking field.
- Matches the existing pattern used for Accreditation categories.

---

## Security Hardening

Five commits batched from the April 18 security review.

### `/apply/submitted` requires email + reference match

The post-submit confirmation page previously looked up applications by reference number alone. Because reference numbers follow a guessable pattern (`APP-2028-{NOC}-{seq}`), an attacker could iterate references and surface applicant names, organisations, and requested category counts from the email-preview block.

The page now requires **both** a reference number **and** a contact email query parameter, and the DB query matches on both columns. A mismatched or missing email redirects to `/apply`. Both legitimate callers already pass `email`, so no applicant-facing change is visible.

### Cookies default to `Secure`

Session and CSRF cookies now default to `Secure: true`. Local development that runs over plain HTTP can opt out by setting `ALLOW_INSECURE_COOKIES=true` — any other value (including empty, `false`, `0`, or whitespace variants) fails secure. This prevents accidental production deploys from omitting the flag.

### `NEXTAUTH_URL` fails secure

The base-URL helper used by session/redirect logic now throws in production if `NEXTAUTH_URL` is unset rather than silently falling back to a dev default. Development still resolves to `http://localhost:3000` when explicitly in development mode.

### CSP `style-src` no longer allows `'unsafe-inline'`

The Content Security Policy header used to ship with `'unsafe-inline'` on `style-src` for compatibility with legacy inline styles. It has been tightened — all inline styles now flow through the nonce-based CSP already in place for scripts.

### Token generation is now bias-free

`generateToken` previously drew random bytes and took `byte % CHARSET.length`, which introduces a small modulo bias (CWE-327 — use of a weak RNG sampling pattern). The helper now uses rejection sampling: bytes ≥ the largest multiple of `CHARSET.length` that fits in 256 are discarded and redrawn, so every character of the 31-character charset is equally likely.

---

## Invitation Flow — Email Preview

When an admin issues an NOC invitation, the invite detail page now renders a **full draft email preview** directly below the copyable invite link, plus a `mailto:` button. Admins see exactly what the invitee will receive (subject, body, organisation, contact name, expiry, access code) before sending, and can launch their mail client pre-populated. No transactional mail is sent server-side; the admin remains the authoritative sender.

---

## Duplicate Detection — Rejected Applications Excluded

Rejected applications are no longer considered when surfacing potential duplicates in the NOC queue and OCOG cross-NOC view. If an organisation is flagged, rejected, and then re-applies with the same email domain, the re-application is no longer tagged as a duplicate of the old rejection. This matches the intent of the duplicate-dismissal workflow shipped April 17.

---

## NOC / OCOG Window Copy

The EoI window controls on the NOC and OCOG admin screens now make it explicit that **only OCOG sets the EoI window**. NOC admins see a read-only banner describing the current window status rather than UI that hints at a setting they cannot change.

---

## Test Infrastructure

- Vitest config migrated to ESM to unblock test runs on Next.js 16's stricter module resolution.
- `lib-env` tests now use `vi.stubEnv` / `vi.unstubAllEnvs` to satisfy strict typecheck without reaching into `process.env` directly.

These changes are internal-only; they restore a green local/CI test run but do not ship behaviour changes.

---

## Deployment

Merged to `main` April 19, 2026. Railway production will redeploy automatically. After deploy verification, the immediate applicant-visible changes are:

1. Continue on Publication tab no longer triggers the "Missing required fields" modal.
2. Publication tab now requires at least one publication type.
3. `/apply/submitted` only renders for an applicant who has the matching email in their link — direct navigation with just a reference number redirects to `/apply`.

All other changes are transparent to end users.
