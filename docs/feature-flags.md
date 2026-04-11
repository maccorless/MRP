# Feature Flags — Developer Guide

Feature flags let D.TEC deploy new features to a controlled subset of NOC admin users before releasing to everyone. No extra deployment is required to graduate a feature once canary testing passes — it's a single DB update.

---

## How it works

### Two-tier model

**Global flag state** — stored in the `feature_flags` table, checked live on every request.

| State | Who sees the feature |
|-------|---------------------|
| `off` | Nobody |
| `canary` | Only users enrolled in this flag's canary group |
| `on` | Everyone |

Flipping global state takes effect immediately for all users — no deploy, no cache flush.

**Per-user canary membership** — stored in `admin_users.canary_flags` (a JSON array of flag names), baked into the session cookie at login. Controls who sees a feature when global state is `canary`.

Because canary membership is baked into the cookie at login, it only refreshes when the user logs in again. This is intentional: it avoids a live DB lookup on every request and keeps canary enrolment under D.TEC's explicit control.

### The `hasFlag` helper

All flag checks go through one function:

```typescript
// src/lib/feature-flags.ts
const session = await requireNocSession();

if (await hasFlag(session, "new_pbn_ui")) {
  return <NewPbnLayout />;
}
return <PbnLayout />;
```

`hasFlag` does one DB query per request (memoised via React `cache()`) to load all global flag states, then checks per-user membership from the session. This means every `hasFlag` call in a single page render shares one DB query — there is no N+1 risk.

### Safe defaults

- Unknown flag name → `false` (old behaviour)
- DB unreachable → `false` (error swallowed, falls back to old behaviour)
- Session created before `canaryFlags` was added → `false` (optional chaining)

---

## Flag lifecycle

```
[Deploy A]  Ship feature behind flag (state: off)
     │
     ▼
DTEC sets state → canary
DTEC enrolls 2–3 trusted NOC admins
     │
     ▼
Canary users test. Issues found → return to engineering → fix → redeploy
     │  No issues → expand canary if needed, then:
     ▼
DTEC sets state → on       ← NO DEPLOY. Immediate for all users.
     │
     ▼
[Deploy B]  Developer removes old code path + hasFlag check + deletes flag row
```

**Key rule:** Never add all users individually to a flag. When you're ready for everyone, flip global state to `on`. Old code cleanup happens in the next natural deploy — not a dedicated cleanup release.

**Max active flags:** Keep 2–3 at a time. When a flag moves to `on`, create the cleanup task immediately.

---

## Real-life example: rolling out the new PbN allocation UI

### Background

Engineering has rewritten the Press by Number allocation screen. The new UI has a drag-and-drop quota builder instead of manual number inputs. It touches the same `pbn_allocations` table — the data model is unchanged, so backward compatibility is guaranteed.

### Step 1 — Ship behind the flag (Deploy A)

The developer adds `hasFlag` to the PbN page:

```typescript
// src/app/admin/noc/pbn/page.tsx
const session = await requireNocSession();

if (await hasFlag(session, "new_pbn_ui")) {
  return <NewPbnLayout />;
}
return <PbnLayout />;
```

The flag does not exist in the DB yet, so `hasFlag` returns `false` for everyone. Deploy goes out; no user sees any change.

### Step 2 — Create the flag in the admin UI

D.TEC opens `/admin/ioc/flags` and creates:

| Field | Value |
|-------|-------|
| Name | `new_pbn_ui` |
| Description | New drag-and-drop PbN quota allocation screen |
| State | `off` (default) |

### Step 3 — Set state to `canary` and enrol test NOCs

D.TEC sets state to `canary`, then adds canary members:

- Adds USOPC admin by email (`admin@usopc.org`)
- Adds Team GB by NOC code (`GBR`) — enrolls all GBR admin users in one action

**Effect:** The next time those users log in, their session cookie includes `canaryFlags: ["new_pbn_ui"]`. They see the new drag-and-drop UI; all 204 other NOCs still see the original form.

### Step 4 — Canary testing

USOPC and Team GB test the new screen against their real quota data. A layout bug is found — columns overflow on Safari. Engineering fixes it and deploys. D.TEC does not need to do anything; the canary users are already enrolled.

### Step 5 — Expand canary (optional)

No further issues found after a week. D.TEC adds AUS and CAN to the canary group to increase confidence before going global.

### Step 6 — Graduate the feature (no deploy)

D.TEC flips global state to `on`. The change is immediate — every request from every user now sees the new UI without any deployment or user re-login.

Audit log entry: `feature_flag_state_changed: new_pbn_ui canary → on`

### Step 7 — Cleanup (Deploy B)

In the next sprint, the developer:

1. Removes the `hasFlag` call and the `<PbnLayout />` import from `pbn/page.tsx`
2. Deletes the old `<PbnLayout />` component
3. Deletes the `new_pbn_ui` row from `feature_flags` (only possible because state is `on`, not `canary`)

Deploy B is the last time this flag is mentioned in the codebase.

---

## Backward compatibility checklist

Any feature shipped behind a flag **must** follow these rules:

- [ ] **Schema changes are additive only.** New columns must be nullable or have a default. Old code ignores new columns. New code handles null data from old rows.
- [ ] **Data written by the new path must be readable by the old path.** OCOG and IOC cross-NOC views will see data from both flagged and unflagged users simultaneously — make sure both paths produce compatible records.
- [ ] **Data written by the old path must be readable by the new path.** New code must handle records created before the flag existed (missing new fields → nulls → graceful handling required).

If your feature requires a non-additive schema change, it cannot be shipped behind a flag. It needs a coordinated migration and a planned cutover.

---

## Admin UI quick reference

> **Note (2026-04-10):** The feature flags admin UI is not yet built. The DB schema (`feature_flags` table), `hasFlag` helper, and session model are implemented and ready to use, but the management routes below do not exist yet. Building the admin UI is deferred to v1.1.

| Path | Access | Purpose |
|------|--------|---------|
| `/admin/ioc/flags` | IOC admin (D.TEC) only | Create / list / delete flags |
| `/admin/ioc/flags/[name]` | IOC admin (D.TEC) only | Toggle state, manage canary enrolment |

State transitions allowed:

```
off → canary → on
on  → canary → off
```

Deletion is only permitted when state is `off`.

All state changes and enrolment changes are recorded in the audit log.

---

## Impersonation testing (sudo)

D.TEC can use `/admin/ioc/sudo` to impersonate a specific canary user and verify what they see. Because `hasFlag` reads from the session (which is overridden by the sudo session), impersonation accurately reflects the canary user's experience — no additional setup required.

---

## Frequently asked questions

**Can I enrol a user without them re-logging in?**

No. Canary membership is baked into the session cookie at login. Ask the user to log out and back in after enrolment. For urgent cases, D.TEC can use sudo to verify the experience without waiting.

**What happens if I delete a flag while users are still enrolled?**

Safe. `hasFlag` will return `false` for that flag name (no entry in the DB → off by default). Users fall back to the old behaviour. No errors.

**Can I have the same user in two canary groups?**

Yes. `canaryFlags` is an array. A user can be enrolled in `["new_pbn_ui", "new_quota_export"]` simultaneously.

**What's the maximum number of active flags?**

Convention is 2–3. Flags represent in-progress work. If you have more than 3 active flags, some are overdue for graduation or deletion.

**Do applicants (public form users) ever see flags?**

No. Feature flags only apply to admin users. The `hasFlag` helper requires a `SessionPayload`, which is only present in authenticated admin sessions.
