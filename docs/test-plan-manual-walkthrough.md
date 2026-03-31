# MRP Manual Test Walkthrough

**Version**: v0.1  
**Last updated**: 2026-03-31  
**Environment**: Production (Railway) — confirm URL before starting

---

## How to use this document

Each section anchors to one role. For each role you will find:

1. **What this role does** — the job this person has in the real-world process
2. **Pre-conditions** — what needs to exist in the system before you test
3. **Test cases** — numbered steps with expected results
4. **Wireframes** — ASCII sketches of the key screens to orient you

Work through the roles in order (Media Org → NOC → OCOG → IOC) because each role depends on data produced by the previous one.

---

## Test accounts and seed data

Run `npm run db:seed` (or `bun run db:seed`) once before testing to load the fixture dataset. **The seed script wipes and replaces all existing data** — do not run it against a database that holds real submissions.

### Admin credentials

All seeded admin accounts share the same password: **`Password1!`**

| Email | Role | NOC / IF | Display name |
|-------|------|----------|-------------|
| `ioc.admin@olympics.org` | IOC Admin | — | IOC Admin |
| `ioc.readonly@olympics.org` | IOC Viewer (read-only) | — | IOC Viewer |
| `noc.admin@usopc.org` | NOC Admin | **USA** | S. Kim (USOPC) |
| `noc.admin@teamgb.org` | NOC Admin | **GBR** | R. Clarke (Team GB) |
| `noc.admin@franceolympique.fr` | NOC Admin | **FRA** | M. Dupont (CNOSF) |
| `ocog.admin@la28.org` | OCOG Admin | — | LA28 OCOG Admin |
| `if.admin@worldathletics.org` | IF Admin | **ATH** (Athletics) | World Athletics IF Admin |

### Magic link tokens (pre-seeded for applicant testing)

These let you skip the email step and go straight to the form:

| Token | Email | Status |
|-------|-------|--------|
| `K7M2` | `demo@test.com` | **Valid** — expires 24 h after seed |
| `XXXX` | `expired@test.com` | **Expired** — use to test the expired-link error screen |

To use a token directly, navigate to:
```
/apply/verify?token=K7M2&email=demo@test.com
```

> **Submitting your own EoI or ENR EoI**: The seed data covers admin workflows, but the best way to test the full applicant journey is with a real email address you control. Go to `/apply`, enter your email, and follow the magic link. You can do this at any time without running the seed script — it won't affect seeded admin accounts or applications.

---

### Seeded organisations

| Org name | NOC | Type | Email domain |
|----------|-----|------|-------------|
| Associated Press (US) | USA | News Agency | `ap.org` |
| The New York Times | USA | Print / Online | `nytimes.com` |
| NBC Sports | USA | Broadcast | `nbcuni.com` |
| BBC Sport | GBR | Broadcast | `bbc.co.uk` |
| The Guardian | GBR | Print / Online | `theguardian.com` |
| L'Équipe | FRA | Print / Online | `lequipe.fr` |
| Reuters (North America) | USA | News Agency | `reuters.com` |
| Reuters (UK) | GBR | News Agency | `reuters.com` |

### Seeded applications

The seed covers all five application statuses so you can test each NOC action without waiting for a real submission.

| Ref # | Org | NOC | Status | Scenario |
|-------|-----|-----|--------|---------|
| `APP-2028-USA-00001` | Associated Press (US) | USA | **Pending** | E×8 | Ready to approve, return, or reject |
| `APP-2028-USA-00002` | The New York Times | USA | **Pending** | E×5, EP×3 | Second pending — useful for testing return flow |
| `APP-2028-GBR-00001` | The Guardian | GBR | **Pending** | E×4, Es×2 | Pending under GBR NOC |
| `APP-2028-USA-00003` | NBC Sports | USA | **Approved** | EP×6, EPs×2 | Already approved — no action buttons |
| `APP-2028-GBR-00002` | BBC Sport | GBR | **Approved** | E×6, EP×4, ET×2, EC×2 | Approved under GBR — multi-category |
| `APP-2028-FRA-00001` | L'Équipe | FRA | **Approved** | EP×4, EPs×2 | Approved under FRA |
| `APP-2028-USA-00004` | Reuters (North America) | USA | **Returned** | E×3 | Returned — applicant can resubmit |
| `APP-2028-GBR-00003` | Reuters (UK) | GBR | **Returned** | EP×5 | Returned under GBR with note |
| `APP-2028-USA-00005` | Associated Press (US) | USA | **Resubmitted** | E×8, EP×4 | AP resubmitted with full venue detail |
| `APP-2028-FRA-00002` | L'Équipe | FRA | **Rejected** | E×2 | Duplicate — permanent, no resubmit |

### Seeded NOC quotas (Paris 2024 fixture data)

Quotas are tracked **per sub-category** — the IOC assigns each independently. Pre-loaded for 18 NOCs. A selection:

| NOC | E | Es | EP | EPs | ET | EC | Total |
|-----|---|----|----|-----|----|----|-------|
| USA | 80 | 20 | 30 | 10 | 25 | 25 | 190 |
| GBR | 50 | 15 | 20 | 8 | 15 | 15 | 123 |
| FRA | 46 | 14 | 19 | 7 | 13 | 15 | 114 |
| GER | 44 | 12 | 18 | 6 | 12 | 14 | 106 |
| AUS | 38 | 10 | 15 | 5 | 10 | 9 | 87 |
| KEN | 10 | 2 | 0 | 0 | 0 | 0 | 12 |

All quotas are marked with a note: *"Paris 2024 fixture data — replace with real IOC import before July 2026."*

---

## Roles at a glance

| Role | Portal entry | Responsible for |
|------|-------------|-----------------|
| **Media Org** | `/apply` | Submitting an Expression of Interest (EoI) |
| **NOC Admin** | `/admin` → NOC | Reviewing EoIs, managing PbN allocations |
| **OCOG Admin** | `/admin` → OCOG | Approving NOC PbN submissions |
| **IOC Admin** | `/admin` → IOC | Setting quotas, ENR decisions, exports |

---

---

# Role 1 — Media Organisation

## What this role does

A media organisation (newspaper, broadcaster, agency, freelancer) wants to send a team to LA 2028. They have never applied before — or they have been invited to resubmit after their NOC returned a previous application. They fill out a multi-tab form with their organisation details, contact information, the accreditation categories they need, and their publication history. The NOC uses this information to decide how many accreditation slots to allocate before submitting to the IOC.

---

## Pre-conditions

- No database setup needed — this is the starting point for the applicant journey.
- **Option A (own email)**: Use any real email address you can receive mail on. Go to `/apply` and follow the link. Recommended for testing the full end-to-end email flow.
- **Option B (pre-seeded token)**: Use the seeded token `K7M2` at `/apply/verify?token=K7M2&email=demo@test.com` to skip the email step entirely. Useful for quick form testing.
- The application must be running and accessible.

---

## Test Case 1.1 — Request an access token

**Goal**: Confirm the email gate works and a token is sent.

```
┌─────────────────────────────────────────────────────────────────┐
│  LA 2028  Media Registration Portal                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Apply for media accreditation                                 │
│                                                                 │
│   Enter your work email address to receive a secure            │
│   access code.                                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  email@yourorganisation.com                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [ Send access code → ]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. Navigate to `/apply`
2. Enter a valid work email (e.g. `tester@apnews.com`)
3. Click **Send access code**

**Expected**: Page confirms the code was sent. Check your inbox for an email with a 4-character code.

**Negative test**: Repeat with a clearly invalid address (`notanemail`).  
**Expected**: Inline error — "Please enter a valid email address."

---

## Test Case 1.2 — Verify the access code

**Goal**: Confirm the code screen loads and the Continue button works.

```
┌─────────────────────────────────────────────────────────────────┐
│  LA 2028  Media Registration Portal                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Check your inbox                                              │
│                                                                 │
│   We sent a code to tester@apnews.com                          │
│                                                                 │
│              ┌──────────────────────┐                          │
│              │   A  B  7  3         │  ← 4-char code           │
│              └──────────────────────┘                          │
│                                                                 │
│   Use this code within 24 hours.                                │
│                                                                 │
│   [ Continue to application → ]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Steps (own email path)**:

1. Open the email you received — it contains a link
2. Click the link; the verify screen shows a 4-character code
3. Click **Continue to application**

**Steps (pre-seeded token shortcut)**:

1. Navigate directly to `/apply/verify?token=K7M2&email=demo@test.com`
2. Confirm the verify screen shows and the code `K7M2` is displayed
3. Click **Continue to application**

**Expected**: Redirected to `/apply/form` — the tabbed form loads.

**Negative test — expired token**: Navigate to `/apply/verify?token=XXXX&email=expired@test.com`  
**Expected**: Error page — "This link is invalid or has expired." (token `XXXX` is pre-seeded as expired)

---

## Test Case 1.3 — Submit a valid application

**Goal**: Confirm the full happy-path submission works end to end.

```
┌────────────────────────────────────────────────────────────────────┐
│  Tab bar                                                           │
│  ● Organisation  ○ Contacts  ○ Accreditation  ○ Publication  ○ History │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Tell us about your media organisation.                            │
│                                                                    │
│  Organisation name *           Website                             │
│  ┌─────────────────────┐       ┌─────────────────────┐            │
│  │ The Associated Press│       │ https://apnews.com  │            │
│  └─────────────────────┘       └─────────────────────┘            │
│                                                                    │
│  Organisation type *                                               │
│  ┌──────────────────────────────────────────────┐                 │
│  │  News Agency                             ▼  │                 │
│  └──────────────────────────────────────────────┘                 │
│                                                                    │
│  Country *                     NOC code *                          │
│  ┌─────────────────────┐       ┌─────────────────────┐            │
│  │ US — United States  │       │ USA — United States │            │
│  └─────────────────────┘       └─────────────────────┘            │
│                                                                    │
│                          [ Continue → ]                            │
└────────────────────────────────────────────────────────────────────┘
```

**Tab 1 — Organisation**

| Field | Value to enter |
|-------|---------------|
| Organisation name | `Test Media Co` |
| Website | `https://testmedia.example.com` |
| Organisation type | `News Agency` |
| Country | Start typing `US` — select **US — United States** |
| NOC code | Start typing `USA` — select **USA — United States of America** |

Click **Continue →**.

---

**Tab 2 — Contacts**

```
┌────────────────────────────────────────────────────────────────────┐
│  Primary Contact                                                   │
│                                                                    │
│  First name *              Last name *                             │
│  ┌─────────────────┐       ┌─────────────────┐                    │
│  │ Jane            │       │ Smith           │                    │
│  └─────────────────┘       └─────────────────┘                    │
│                                                                    │
│  Position / Title                                                  │
│  ┌───────────────────────────────────────────┐                    │
│  │ Deputy Sports Editor                      │                    │
│  └───────────────────────────────────────────┘                    │
│                                                                    │
│  Email address (verified — cannot change)                          │
│  ┌───────────────────────────────────────────┐                    │
│  │ tester@apnews.com                         │  (greyed out)      │
│  └───────────────────────────────────────────┘                    │
│                                                                    │
│  + Add a secondary contact                                         │
│                                                                    │
│  ← Back                          [ Continue → ]                    │
└────────────────────────────────────────────────────────────────────┘
```

| Field | Value |
|-------|-------|
| First name | `Jane` |
| Last name | `Smith` |
| Position | `Deputy Sports Editor` |

Click **Continue →**.

---

**Tab 3 — Accreditation**

```
┌────────────────────────────────────────────────────────────────────┐
│  Accreditation categories *  (select all that apply)               │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☑  E — Journalist                                           │  │
│  │    All venues + MPC. General reporters covering any sport.  │  │
│  │                                                             │  │
│  │    How many E accreditations?  ┌────┐                       │  │
│  │                                │ 4  │                       │  │
│  │                                └────┘                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☑  EP — Photographer                                        │  │
│  │    Photo positions at all venues.                           │  │
│  │                                                             │  │
│  │    How many EP accreditations?  ┌────┐                      │  │
│  │                                 │ 2  │                      │  │
│  │                                 └────┘                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☐  Es — Sport-specific journalist                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ... (ET, EC, EPs)                                                 │
│                                                                    │
│  About your coverage *                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Test Media Co will cover athletics, swimming, and           │  │
│  │ gymnastics with a 4-person writing team and 2              │  │
│  │ photographers. We serve 2M monthly readers.                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ← Back                          [ Continue → ]                    │
└────────────────────────────────────────────────────────────────────┘
```

| Action | Value |
|--------|-------|
| Check category | `E — Journalist` |
| Quantity for E | `4` |
| Check category | `EP — Photographer` |
| Quantity for EP | `2` |
| About | `Test Media Co will cover athletics, swimming and gymnastics with a 4-person writing team and 2 photographers. We serve 2M monthly readers.` |

Click **Continue →**.

---

**Tabs 4 & 5 — Publication and History**

These tabs are optional. Skip them for now — click **Continue →** on Tab 4 and **Submit Application** on Tab 5.

```
┌────────────────────────────────────────────────────────────────────┐
│  Tab bar                                                           │
│  ✓ Organisation  ✓ Contacts  ✓ Accreditation  ✓ Publication  ● History │
├────────────────────────────────────────────────────────────────────┤
│  ...history fields...                                              │
│                                                                    │
│  ← Back              [ Submit Application ]  ← green button       │
└────────────────────────────────────────────────────────────────────┘
```

**Expected after submit**: Redirected to `/apply/submitted` with a reference number in the format `APP-2028-USA-XXXXX`. Record this reference number.

---

## Test Case 1.4 — Validation errors on submit

**Goal**: Confirm that submitting with missing required fields shows inline errors and navigates to the first problem.

**Steps**:

1. Navigate to `/apply/form` using a fresh token
2. Click **Continue →** through all tabs without filling in anything
3. On the last tab, click **Submit Application**

**Expected**:
- The form jumps back to Tab 1 (Organisation)
- `org_name` field has a red border and "This field is required." appears below it
- Page auto-scrolls to and focuses that field

```
┌────────────────────────────────────────────────────────────────────┐
│  Organisation name *                                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │← red border
│  └─────────────────────────────────────────────────────────────┘  │
│  This field is required.                                           │← error text (red)
│                                                                    │
│  Organisation type *                                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Select type...                                         ▼  │  │← red border
│  └─────────────────────────────────────────────────────────────┘  │
│  This field is required.                                           │← error text (red)
└────────────────────────────────────────────────────────────────────┘
```

4. Fill in `org_name` and `org_type` only, then try submitting again
5. **Expected**: Form jumps to Tab 1 — `country` field now highlighted

6. Fill all of Tab 1, leave Contacts blank, try submitting again
7. **Expected**: Form jumps to Tab 2 — `contact_first_name` highlighted

8. Fill all required fields across all tabs, leave the Accreditation category checkboxes all unchecked, try submitting
9. **Expected**: Form jumps to Tab 3 — error "Please select at least one accreditation category."

---

## Test Case 1.5 — Auto-save and restore

**Goal**: Confirm progress is not lost on page refresh.

**Steps**:

1. Open the form, fill in Tab 1 entirely
2. Navigate to Tab 2 and fill in first/last name
3. Refresh the browser (Cmd+R / F5)

**Expected**: All previously entered values are restored exactly as entered. The tab status dots (blue/green) reflect completed tabs.

---

## Test Case 1.6 — Resubmission (after NOC returns the application)

*Run this test after completing NOC Test Case 2.3 (Return an application).*

**Goal**: Confirm the resubmission flow pre-fills data and locks the Organisation tab.

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠  Your application was returned by your NOC                      │
│  "Please clarify the size of your photography team and confirm    │
│   whether you need EP or EPs category."                           │
└────────────────────────────────────────────────────────────────────┘
│  Tab bar                                                           │
│  ● Organisation  ○ Contacts  ○ Accreditation  ○ Publication  ○ History │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Organisation details cannot be changed on resubmission.    │  │
│  │  If this information is incorrect, contact your NOC.        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Organisation    Test Media Co                                     │
│  NOC             USA                                               │
│  Country         US                                                │
│  Type            News Agency                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. Use the resubmission link from the return email (or navigate to `/apply/form?token=...&resubmit_id=...`)
2. Confirm:
   - Orange banner shows the NOC's return note
   - Tab 1 is read-only (fields replaced with display values, no inputs)
   - Tabs 2–5 are editable and pre-filled with previous data
3. Update the `about` field on Tab 3 to address the NOC's feedback
4. Click **Resubmit Application**

**Expected**: Redirected to `/apply/submitted?...&resubmit=1`. The reference number is the same as the original application.

---

---

# Role 2 — NOC Admin

## What this role does

The NOC Admin (National Olympic Committee administrator) receives all EoI applications from media organisations in their country. They review each one to check that the organisation is legitimate and that the accreditation request is reasonable. They can approve it (forwarding it toward the IOC), return it with a note asking for corrections, or reject it permanently. After reviewing all applications they build a Press-by-Number (PbN) allocation — a precise slot count per organisation — and submit it to OCOG for approval.

---

## Pre-conditions

- Seed data loaded (`npm run db:seed`). The seeded dataset gives you applications in every status state across USA, GBR, and FRA without needing to submit anything manually.
- If you want to test the full applicant→NOC chain end-to-end, complete Role 1 TC 1.3 first to create a fresh `pending` application.

---

## Test Case 2.1 — Log in as NOC Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  MRP Admin — Sign in                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Email address                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  noc.admin@usopc.org                                    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Password                                                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Password1!                                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [ Sign in ]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Credentials**: `noc.admin@usopc.org` / `Password1!`  
(To test GBR instead, use `noc.admin@teamgb.org` / `Password1!`)

**Steps**:

1. Navigate to `/admin`
2. Enter `noc.admin@usopc.org` and `Password1!`
3. Click **Sign in**

**Expected**: Redirected to `/admin/noc/home`. The header shows **USA** and a blue accent colour. The home dashboard shows a warning banner — there are pending applications awaiting review (seeded: 2 pending for USA).

---

## Test Case 2.2 — Review and approve an application

**Goal**: Confirm an application moves from `pending` to `approved`.

**Seeded record to use**: `APP-2028-USA-00001` — Associated Press (US), contact Jane Holloway, requesting E (press) accreditation.

```
┌────────────────────────────────────────────────────────────────────┐
│  EoI Queue                                                         │
│  [ All ] [ Pending ] [ Resubmitted ] [ Approved ] [ Returned ] [ Rejected ] │
├──────────────┬───────────┬──────────────────┬────────────┬─────────┤
│  Ref #       │  Status   │  Org name        │  Contact   │ Submitted │
├──────────────┼───────────┼──────────────────┼────────────┼─────────┤
│ APP-2028     │ ● Pending │ Associated Press │ J.Holloway │ (date)  │
│ -USA-00001   │           │ (US)             │            │         │
├──────────────┼───────────┼──────────────────┼────────────┼─────────┤
│ APP-2028     │ ● Pending │ The New York     │ M. Webb    │ (date)  │
│ -USA-00002   │           │ Times            │            │         │
└──────────────┴───────────┴──────────────────┴────────────┴─────────┘
```

**Steps**:

1. Click **EoI Queue** in the nav
2. Confirm at least two `Pending` rows appear for USA (`APP-2028-USA-00001` and `APP-2028-USA-00002`)
3. Click `APP-2028-USA-00001` to open the Associated Press application

```
┌────────────────────────────────────────────────────────────────────┐
│  APP-2028-USA-00001                  ● Pending                     │
├────────────────────────────────────────────────────────────────────┤
│  Organisation                                                      │
│  Associated Press (US)  ·  News Agency  ·  USA  ·  US             │
│  https://apnews.com                                                │
│                                                                    │
│  Primary contact: Jane Holloway — j.holloway@ap.org               │
│                                                                    │
│  Accreditation requested                                           │
│  E (press): yes   EP (photo): no                                   │
│                                                                    │
│  About coverage                                                    │
│  AP has covered every Olympic Games since 1896. Requesting        │
│  accreditation for 12 journalists and photographers...            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  [ Approve ]   [ Return with note ]   [ Reject ]            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

4. Review the application details — scroll through all sections
5. Click **Approve**

**Expected**: 
- Status badge changes to `Approved`
- Action buttons disappear (no further actions possible)
- Audit trail at the bottom shows a new entry: `approved by noc-usa@test.mrp`

---

## Test Case 2.3 — Return an application with a note

**Goal**: Confirm an application is returned and the applicant can resubmit.

**Seeded record to use**: `APP-2028-USA-00002` — The New York Times, contact Marcus Webb.

**Steps**:

1. Go back to the queue and open `APP-2028-USA-00002` (The New York Times)
2. Click **Return with note**

```
┌────────────────────────────────────────────────────────────────────┐
│  Return application                                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Your note will be sent to the applicant. They can correct        │
│  their application and resubmit.                                  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Please clarify the size of your photography team and        │  │
│  │ confirm whether you need EP or EPs category.               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [ Cancel ]                    [ Return application ]              │
└────────────────────────────────────────────────────────────────────┘
```

3. Enter a note: `Please clarify the size of your photography team and confirm whether you need EP or EPs category.`
4. Click **Return application**

**Expected**:
- Status changes to `Returned`
- Audit trail records the action and the note
- (In a real environment) The applicant's email receives a resubmission link

---

## Test Case 2.4 — Inspect an already-rejected application

**Goal**: Confirm a rejected application shows the rejection reason and no action buttons.

**Seeded record to use**: `APP-2028-FRA-00002` — L'Équipe duplicate, rejected by M. Dupont (CNOSF).  
*(Log out of the USA session first and log in as `noc.admin@franceolympique.fr` / `Password1!`)*

**Steps**:

1. Log in as FRA NOC admin (`noc.admin@franceolympique.fr` / `Password1!`)
2. Click **EoI Queue** and filter by **Rejected**
3. Open `APP-2028-FRA-00002`

**Expected**:
- Status badge shows `Rejected`
- Review note reads: *"L'Équipe already has an approved application for this Games (APP-2028-FRA-00001). Duplicate applications are not permitted."*
- No action buttons are shown — permanent state

**To test rejecting a live application yourself**: If you submitted an application in Role 1 TC 1.3 under USA, log back in as `noc.admin@usopc.org`, find it in the queue, and click **Reject**.

**Steps (live rejection)**:

1. Open any `Pending` application under your NOC
2. Click **Reject**
3. Enter a reason: `Organisation does not meet accreditation eligibility criteria.`
4. Click **Reject application**

**Expected**:
- Status changes to `Rejected`
- No action buttons shown (permanent — applicant cannot resubmit)
- Audit trail records the rejection reason

---

## Test Case 2.5 — Filter the queue

**Goal**: Confirm filter buttons narrow the list correctly.

Log back in as `noc.admin@usopc.org` (USA). The seeded USA dataset gives you all five statuses to test against.

**Expected counts for USA after seed** (before any additional live testing):

| Filter | Expected applications visible |
|--------|------------------------------|
| All | 5 (APP-USA-00001 through 00005) |
| Pending | 2 (AP, NYT) |
| Approved | 1 (NBC Sports) |
| Returned | 1 (Reuters NA) |
| Resubmitted | 1 (AP resubmission) |
| Rejected | 0 (FRA has the rejection — not visible to USA) |

**Steps**:

1. Go to `/admin/noc/queue` as USA NOC admin
2. Click **Pending** — verify only AP and NYT appear
3. Click **Approved** — verify only NBC Sports appears
4. Click **Returned** — verify only Reuters (North America) appears
5. Click **Resubmitted** — verify the AP resubmission (`APP-2028-USA-00005`) appears
6. Click **All** — verify all five appear

---

## Test Case 2.6 — Inspect a resubmitted application

**Goal**: Confirm the resubmission shows the original return note and updated content.

**Seeded record to use**: `APP-2028-USA-00005` — AP resubmission. The original `APP-2028-USA-00001` was returned asking for more venue detail; this is the corrected version.

**Steps**:

1. As USA NOC admin, filter the queue to **Resubmitted**
2. Open `APP-2028-USA-00005`

**Expected**:
- Banner or note shows the original return reason: *"Original submission lacked venue detail."*
- The About section now reads: *"AP photo desk requests photographer accreditation for 4 photographers covering athletics and aquatics at SoFi Stadium and the Olympic Aquatics Center…"*
- `resubmissionCount` shows 1
- Action buttons (Approve / Return / Reject) are present — this is back in the NOC's hands

---

## Test Case 2.7 — Create a PbN allocation

**Goal**: Confirm a NOC can allocate press slots for an approved organisation.

The seeded data includes one approved USA application (NBC Sports, `APP-2028-USA-00003`, requesting EP×6 and EPs×2). That organisation appears in the PbN allocation table. USA's per-category quota: **E:80 · Es:20 · EP:30 · EPs:10 · ET:25 · EC:25**.

The PbN table only shows columns for categories that at least one approved org in the NOC actually requested. For NBC Sports (photo-only), only **EP** and **EPs** columns are active.

```
┌────────────────────────────────────────────────────────────────────┐
│  Press by Number — USA                                             │
│  Assign slots per category to approved organisations               │
├──────────────────────────────────────────────────────────────────────┐
│  Quota bars (live):                                                │
│  EP  ──────── 0 / 30       EPs ──────── 0 / 10                    │
├─────────────────────┬────────────────┬─────────────────────────────┤
│  Organisation       │  EP  Req. Alloc│  EPs  Req.  Alloc          │
├─────────────────────┼────────────────┼─────────────────────────────┤
│  NBC Sports         │       6  [ 0 ] │         2  [ 0 ]           │
├─────────────────────┼────────────────┼─────────────────────────────┤
│  Total              │          0 /30 │             0 /10           │
└─────────────────────┴────────────────┴─────────────────────────────┘
│  [ Save Draft ]     [ Submit to OCOG ]                             │
└────────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. Click **PbN Allocations** in the nav
2. Confirm NBC Sports appears with **EP** and **EPs** columns (requested quantities shown in grey: EP: 6, EPs: 2)
3. Enter `5` in the EP allocation field and `2` in the EPs allocation field for NBC Sports
4. Click **Save draft**

**Expected**: Page reloads with `5` and `2` saved. Quota bars update: EP shows `5 / 30`, EPs shows `2 / 10`.

5. Click **Submit to OCOG**

**Expected**: Status changes to `Submitted`. The submit button is replaced with a "Pending OCOG approval" banner. USA's PbN row on the OCOG dashboard now shows as awaiting review.

---

---

# Role 3 — OCOG Admin

## What this role does

The OCOG Admin (Organising Committee) receives PbN submissions from all NOCs and decides whether the requested slot counts are reasonable within the venue capacity constraints. They can approve a submission as-is, or send it back to the NOC asking for reductions. Once all NOCs are approved, the OCOG exports the final allocation to the Accreditation system (ACR).

---

## Pre-conditions

- Complete Role 2 TC 2.7 (PbN allocation submitted by USA NOC) before running TC 3.2.
- **Credentials**: `ocog.admin@la28.org` / `Password1!`

---

## Test Case 3.1 — Log in as OCOG Admin

**Credentials**: `ocog.admin@la28.org` / `Password1!`

**Steps**:

1. Navigate to `/admin` — log out of the NOC session first
2. Enter `ocog.admin@la28.org` and `Password1!`
3. Click **Sign in**

**Expected**: Redirected to `/admin/ocog`. Header uses an orange accent. Dashboard shows PbN submission status.

```
┌────────────────────────────────────────────────────────────────────┐
│  OCOG Dashboard                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Milestones                                                        │
│  ✓ NOC EoI review window                                           │
│  ● NOC PbN submissions due          ← active step                 │
│  ○ OCOG approval                                                   │
│  ○ Push to ACR                                                     │
│                                                                    │
│  ⚠  1 NOC submission awaiting your approval.                       │
│  [ Go to PbN Approvals → ]                                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Test Case 3.2 — Approve a NOC PbN submission

**Goal**: Confirm OCOG can approve a submitted allocation.

**Steps**:

1. Click **PbN Approvals** in the nav
2. Find USA — status `noc_submitted`
3. Click to open the detail

```
┌────────────────────────────────────────────────────────────────────┐
│  USA — PbN Allocation                        ● Submitted           │
│  1 org · 7 total slots across 2 categories                         │
│  EP: 5/30  EPs: 2/10   (quota bars shown per category)            │
├─────────────────────────┬──────────┬────────┬────────┬─────────────┤
│  Organisation           │ Categories│  EP    │  EPs   │  Total      │
├─────────────────────────┼──────────┼────────┼────────┼─────────────┤
│  NBC Sports             │ EP, EPs  │   5    │   2    │   7         │
├─────────────────────────┼──────────┼────────┼────────┼─────────────┤
│  Total                  │          │   5    │   2    │   7         │
└─────────────────────────┴──────────┴────────┴────────┴─────────────┘
│  [ Approve Allocation ]                                             │
└────────────────────────────────────────────────────────────────────┘
```

4. Confirm the numbers look correct against per-category quota
5. Click **Approve Allocation**

**Expected**: Status changes to `ocog_approved`. Per-category slot values are locked. The NOC can no longer edit this submission.

---

## Test Case 3.3 — Request adjustments from a NOC

*Submit a second PbN draft from a different NOC (or re-use the same NOC after resetting) before running this test.*

**Steps**:

1. Open a submitted NOC allocation
2. Click **Request adjustments**

```
┌────────────────────────────────────────────────────────────────────┐
│  Request adjustments                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Your note will be sent to the NOC. They can revise their         │
│  allocation and resubmit.                                         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ EP allocation for Test Media Co exceeds typical ratio.      │  │
│  │ Please reduce to a maximum of 1 EP slot.                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [ Cancel ]              [ Send to NOC ]                           │
└────────────────────────────────────────────────────────────────────┘
```

3. Enter a note and click **Send to NOC**

**Expected**: Status returns to a `draft`-like state; NOC admin sees the feedback when they next open PbN allocations.

---

---

# Role 4 — IOC Admin

## What this role does

The IOC Admin has the highest-level view of the entire system. They set the quotas that define how many accreditation slots each NOC is permitted to allocate. They review ENR (non-rights broadcaster) requests. They can see every application across every NOC and export the full dataset. After all OCOG approvals are in, they trigger the final push to the ACR (Accreditation) system.

---

## Pre-conditions

- Seed data loaded. The seed provides applications across all statuses and quotas for 18 NOCs — no manual setup needed for most IOC tests.
- **Credentials**: `ioc.admin@olympics.org` / `Password1!`
- For a complete dashboard, complete Role 1–3 tests first to add live data on top of the seed.

---

## Test Case 4.1 — Log in as IOC Admin

**Credentials**: `ioc.admin@olympics.org` / `Password1!`

**Steps**:

1. Navigate to `/admin` — log out of OCOG session first
2. Enter `ioc.admin@olympics.org` and `Password1!`
3. Click **Sign in**

**Expected**: Redirected to `/admin/ioc`. Header uses a green accent.

---

## Test Case 4.2 — Review the IOC dashboard

**Goal**: Confirm the dashboard shows correct counts across all NOCs.

**Expected counts from seed data alone** (before any additional live testing):

```
┌────────────────────────────────────────────────────────────────────┐
│  IOC Dashboard                                                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌───────┐  ┌──────┐│
│  │ Pending  │  │ Resubmitted │  │ Approved │  │Returned│  │Reject││
│  │    3     │  │      1      │  │    3     │  │   2    │  │   1  ││
│  └──────────┘  └─────────────┘  └──────────┘  └───────┘  └──────┘│
│                                                                    │
│  Breakdown by NOC                                                  │
│  ┌──────┬─────────┬──────────────┬──────────┬─────────┬──────────┐│
│  │ NOC  │ Pending │ Resubmitted  │ Approved │ Returned│ Rejected ││
│  ├──────┼─────────┼──────────────┼──────────┼─────────┼──────────┤│
│  │ USA  │    2    │      1       │    1     │    1    │    0     ││
│  │ GBR  │    1    │      0       │    1     │    1    │    0     ││
│  │ FRA  │    0    │      0       │    1     │    0    │    1     ││
│  └──────┴─────────┴──────────────┴──────────┴─────────┴──────────┘│
│                                                                    │
│  [ Export all EoI CSV ↓ ]                                          │
└────────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. Navigate to `/admin/ioc`
2. Verify the stat cards match the seeded counts above (3 pending, 1 resubmitted, 3 approved, 2 returned, 1 rejected)
3. Verify the per-NOC breakdown shows USA, GBR, and FRA rows with the correct splits

**Expected**: Numbers match the table above. Any additional applications submitted during Role 1 testing will add to the USA row.

---

## Test Case 4.3 — Export all EoI data as CSV

**Goal**: Confirm the CSV export produces a valid, complete file.

**Steps**:

1. On the IOC dashboard, click **Export all EoI CSV ↓**

**Expected**:
- Browser downloads a `.csv` file
- File opens in a spreadsheet with one row per application
- Columns include: Reference number, Org name, NOC, Status, Contact name, Category columns (E, Es, EP, EPs, ET, EC), quantities requested, About text, submission date

---

## Test Case 4.4 — View and edit NOC quotas

**Goal**: Confirm quotas can be read and updated.

The seed loads quotas for 18 NOCs based on Paris 2024 benchmarks. Seeded values for USA, GBR, FRA:

```
┌────────────────────────────────────────────────────────────────────┐
│  Quotas                                                            │
├──────────┬────────────────────────────┬────────────────────────────┤
│  NOC     │  E quota (journalists)     │  EP quota (photographers)  │
├──────────┼────────────────────────────┼────────────────────────────┤
│  USA     │  150                       │  50                        │
│  GBR     │  95                        │  32                        │
│  FRA     │  88                        │  30                        │
│  KEN     │  12                        │  0                         │
│  ...     │  ...                       │  ...                       │
└──────────┴────────────────────────────┴────────────────────────────┘
│  (18 NOCs total)                                                   │
│  [ Edit quotas ]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. Click **Quotas** in the nav
2. Confirm USA shows E: 150 / EP: 50 (the seeded Paris 2024 fixture value)
3. Click **Edit quotas**
4. Change USA's E quota to `155`
5. Save

**Expected**: Table refreshes showing `155` for USA. A change log entry records the edit: *"Paris 2024 fixture → 155, changed by ioc.admin@olympics.org."*

6. Revert to `150` and save again to restore the baseline

---

## Test Case 4.5 — Review the audit trail

**Goal**: Confirm all actions taken during testing appear in the audit log.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Audit Trail                                                            │
├────────────────┬──────────────────────────┬──────────┬─────────────────┤
│  Timestamp     │  Actor                   │  Action  │  Details        │
├────────────────┼──────────────────────────┼──────────┼─────────────────┤
│ 31 Mar 12:01  │ noc-usa@test.mrp (noc)   │ approved │ APP-2028-USA-001 │
│ 31 Mar 12:00  │ tester@apnews.com        │ submitted│ APP-2028-USA-001 │
│ 31 Mar 11:59  │ noc-usa@test.mrp (noc)   │ quota_ch │ E: 80→85        │
└────────────────┴──────────────────────────┴──────────┴─────────────────┘
```

**Steps**:

1. Click **Audit Trail** in the nav
2. Scroll through the log

**Expected — seeded entries** (present before any live testing):

| Action | Actor | Subject |
|--------|-------|---------|
| `application_submitted` | Jane Holloway (AP) | APP-2028-USA-00001 |
| `application_submitted` | Marcus Webb (NYT) | APP-2028-USA-00002 |
| `application_submitted` | Priya Nair (Guardian) | APP-2028-GBR-00001 |
| `application_submitted` | Dana Kowalski (NBC) | APP-2028-USA-00003 |
| `application_submitted` | Tom Ashford (BBC) | APP-2028-GBR-00002 |
| `application_submitted` | Claire Fontaine (L'Équipe) | APP-2028-FRA-00001 |
| `application_submitted` | Sam Okafor (Reuters) | APP-2028-USA-00004 |
| `application_submitted` | Helen Brooks (Reuters UK) | APP-2028-GBR-00003 |
| `application_approved` | S. Kim (USOPC) | APP-2028-USA-00003 (NBC) |
| `application_approved` | R. Clarke (Team GB) | APP-2028-GBR-00002 (BBC) |
| `application_approved` | M. Dupont (CNOSF) | APP-2028-FRA-00001 (L'Équipe) |
| `application_returned` | S. Kim (USOPC) | APP-2028-USA-00004 (Reuters NA) |
| `application_returned` | R. Clarke (Team GB) | APP-2028-GBR-00003 (Reuters UK) |
| `application_resubmitted` | Jane Holloway (AP) | APP-2028-USA-00005 |
| `application_rejected` | M. Dupont (CNOSF) | APP-2028-FRA-00002 (L'Équipe dup.) |
| `admin_login` | S. Kim (USOPC) | — |
| `admin_login` | IOC Admin | — |

**Expected — live entries** (from your test run):
- `application_submitted` — for any submissions from Role 1 testing
- `application_approved` — from TC 2.2
- `application_returned` — from TC 2.3
- `pbn_submitted` — from TC 2.7
- `pbn_approved` — from TC 3.2
- `quota_changed` — from TC 4.4
- `export_generated` — from TC 4.3

---

## Test Case 4.6 — ENR review (smoke test)

**Goal**: Confirm the ENR section loads and is navigable.

*Full ENR testing requires a NOC to have submitted ENR requests — skip if not yet seeded.*

**Steps**:

1. Click **ENR Review** in the nav
2. Verify the page loads without errors
3. If any NOC has submitted ENR requests, click through to one

**Expected**: Page loads. If requests exist, each shows the NOC's requested quantity and a decision control (Grant / Partial / Deny).

---

---

# Cross-role regression checklist

After completing all role-specific tests above, run these end-to-end checks. The "seeded record" column tells you which fixture to use so you don't need to create fresh data for each check.

| # | Check | Seeded record | Pass / Fail |
|---|-------|--------------|-------------|
| R1 | IOC dashboard shows NBC Sports under USA → Approved | APP-2028-USA-00003 | |
| R2 | Reuters (NA) return note visible on the application detail | APP-2028-USA-00004 | |
| R3 | AP resubmission shows as `Resubmitted` in USA NOC queue | APP-2028-USA-00005 | |
| R4 | Action buttons absent on already-approved BBC Sport app | APP-2028-GBR-00002 | |
| R5 | EoI CSV export includes all 10 seeded apps; columns include E Req, Es Req, EP Req, EPs Req, ET Req, EC Req | — | |
| R6 | PbN table shows only EP and EPs columns for NBC Sports (the only active categories for that org) | APP-2028-USA-00003 | |
| R7 | Quota bars on PbN page update live as you type slot values | USA PbN page | |
| R8 | FRA NOC cannot see USA applications and vice versa (NOC isolation) | Login as FRA, check queue | |
| R9 | Rejected L'Équipe duplicate is NOT in FRA's PbN org list | APP-2028-FRA-00002 | |
| R10 | OCOG PbN review shows per-category columns matching the categories NBC requested | APP-2028-USA-00003 | |
| R11 | PbN allocations CSV export includes all 6 `*_slots` columns (not just press/photo) | Run export after TC 3.2 | |
| R12 | Audit trail is read-only (no edit or delete controls visible) | — | |
| R13 | Quota edit for USA E: 80 → 85 is immediately visible in NOC PbN quota bar | USA quota row | |
| R14 | Expired token `XXXX` shows error screen, not the form | `/apply/verify?token=XXXX&email=expired@test.com` | |
| R15 | IOC Viewer (`ioc.readonly@olympics.org`) can view dashboard but not edit quotas | — | |

---

## Known limitations in v0.1

- Email delivery is mocked in the local environment; tokens and return-links appear in server logs instead of inboxes.
- ENR workflow is not fully wired end-to-end; TC 4.6 is a smoke test only.
- IOC "Push to ACR" button generates a CSV export; live ACR integration is out of scope for v0.1.
- PbN slot allocation is per-aggregate (E and EP totals), not broken out per sub-category (Es, EPs, ET, EC) yet.
