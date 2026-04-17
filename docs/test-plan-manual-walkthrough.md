**Last updated: 17-Apr-2026 16:00 CEST**

# PRP Manual Test Walkthrough

**Version**: v0.1  
**Production URL (primary)**: https://mrp.dgpbeta.com/  
**Production URL (fallback)**: https://mrp-production-8073.up.railway.app/

> **If the primary URL is blocked on your network**, use the Railway fallback URL — both point to the same live environment. Anywhere below you see `mrp.dgpbeta.com`, you can swap in `mrp-production-8073.up.railway.app` and the link will work identically (e.g. `/admin`, `/apply`, `/apply/verify?token=…`).

---

## How to use this document

Each section anchors to one **role**. Under each role you'll find one or more **use cases** (what the person is trying to accomplish), each broken into numbered test cases with expected results and ASCII wireframes.

Work through roles in order — **Applicant → NOC Admin → IOC Admin** — because each role produces data the next one consumes. IF Admin mirrors NOC Admin and can be tested in parallel.

> **Features ready for testing** — The following are fully built and should be included in any full test pass. Test cases for these are included in their respective role sections below.
> - **OCOG Admin** — reviews and approves NOC PbN submissions. Login: `ocog.admin@la28.org` / `Password1!`. Route: `/admin/ocog/pbn`
> - **IOC quota management** — IOC sets per-NOC, per-category quotas at `/admin/ioc/quotas`. Import via CSV or edit in-app.
> - **IOC data exports** — CSV download of PbN allocations and ENR nominations. Routes: `/api/export/pbn-allocations`, `/api/export/enr-nominations`
> - **IOC audit trail** — all admin actions logged and searchable at `/admin/ioc/audit`
> - **IOC sudo / impersonation** — IOC admin can open a read-only session as any NOC or OCOG admin at `/admin/ioc/sudo`
> - **NOC direct entry** — NOC admin can submit a pre-approved org directly at `/admin/noc/direct-entry`
> - **NOC PbN direct entry** — NOC admin can add an org directly to the PbN table without an EoI at `/admin/noc/pbn` (click "+ Add organisation directly to PbN")
> - **OCOG EoI Windows** — OCOG admin can open/close per-NOC EoI windows at `/admin/ocog/windows` (Settings tab removed from NOC nav; window control is OCOG-only)
> - **Application reversals** — NOC admin can unapprove or unreturn an application from the application detail page; OCOG admin can reverse a PbN approval
> - **IOC-Direct org management** — IOC admin can add and manage IOC-Direct organisations and allocate their PbN slots at `/admin/ioc/direct`
>
> **Not yet built (deferred):** email notifications, CAPTCHA, anomaly detection, org directory search, D.TEC SSO, French localisation, IF sport-scoped views.

---

## Test accounts and seed data

Run `npm run db:seed` (or `bun run db:seed`) once before testing to load the fixture dataset. **The seed script wipes and replaces all existing data** — do not run it against a database with real submissions.

### Admin credentials

All seeded admin accounts share the password: **`Password1!`**

| Email | Role | NOC / IF | Display name |
|-------|------|----------|-------------|
| `ioc.admin@olympics.org` | IOC Admin | — | IOC Admin |
| `ioc.readonly@olympics.org` | IOC Viewer (read-only) | — | IOC Viewer |
| `noc.admin@usopc.org` | NOC Admin | **USA** | S. Kim (USOPC) |
| `noc.admin@teamgb.org` | NOC Admin | **GBR** | R. Clarke (Team GB) |
| `noc.admin@franceolympique.fr` | NOC Admin | **FRA** | M. Dupont (CNOSF) |
| `ocog.admin@la28.org` | OCOG Admin | — | LA28 OCOG Admin |
| `if.admin@worldathletics.org` | IF Admin | **ATH** (Athletics) | World Athletics IF Admin |

### Session duration and switching accounts

Admin sessions last **8 hours**. During this time your login persists across page refreshes and browser restarts.

> ⚠️ **Switching between user accounts — read this first.** Admin sessions are sticky. If you go straight to the login page while a session is still active, the app will take you back into the previous user's dashboard. To test as a different user, you **must fully log out first** using one of these methods:
>
> 1. **Sign out from the app** — click **Sign out** in the top-right header (available on any admin page). This is the cleanest way.
> 2. **Clear the session from the login page** — click the small **"clear session"** link in the bottom-left corner of the login form. Use this if you've navigated to the login page and realise you're still signed in.
> 3. **Open an incognito / private window** — the simplest option if you want to test multiple roles side by side. Each incognito window has its own isolated session, so you can be logged in as (for example) a NOC admin in one window and an IOC admin in another without them stepping on each other.
>
> If you swap accounts without doing one of the above, you'll either stay logged in as the old user or see stale data in the header.

The same applies to EoI applicant sessions — to start a fresh application flow, sign out, clear your cookies for the host you're using (`mrp.dgpbeta.com` or `mrp-production-8073.up.railway.app`), or open an incognito window.

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

| Ref # | Org | NOC | Status | Categories requested | Scenario |
|-------|-----|-----|--------|----------------------|---------|
| `APP-2028-USA-00001` | Associated Press (US) | USA | **Pending** | E×8 | Ready to approve, return, or reject |
| `APP-2028-USA-00002` | The New York Times | USA | **Pending** | E×5, EP×3 | Second pending — test return flow |
| `APP-2028-GBR-00001` | The Guardian | GBR | **Pending** | E×4, Es×2 | Pending under GBR |
| `APP-2028-USA-00003` | NBC Sports | USA | **Candidate** | EP×6, EPs×2 | Already a candidate — no action buttons |
| `APP-2028-GBR-00002` | BBC Sport | GBR | **Candidate** | E×6, EP×4, ET×2, EC×2 | Multi-category |
| `APP-2028-FRA-00001` | L'Équipe | FRA | **Candidate** | EP×4, EPs×2 | Candidate under FRA |
| `APP-2028-USA-00004` | Reuters (North America) | USA | **Returned** | E×3 | Returned — applicant can resubmit |
| `APP-2028-GBR-00003` | Reuters (UK) | GBR | **Returned** | EP×5 | Returned under GBR with note |
| `APP-2028-USA-00005` | Associated Press (US) | USA | **Resubmitted** | E×8, EP×4 | AP resubmitted with full venue detail |
| `APP-2028-FRA-00002` | L'Équipe | FRA | **Rejected** | E×2 | Duplicate — permanent, no resubmit |

### Seeded NOC quotas (Paris 2024 fixture data)

Quotas are tracked **per accreditation sub-category** — E, Es, EP, EPs, ET, EC — each allocated independently by the IOC.

| NOC | E | Es | EP | EPs | ET | EC | Total |
|-----|---|----|----|-----|----|----|-------|
| USA | 80 | 20 | 30 | 10 | 25 | 25 | 190 |
| GBR | 50 | 15 | 20 | 8 | 15 | 15 | 123 |
| FRA | 46 | 14 | 19 | 7 | 13 | 15 | 114 |
| GER | 44 | 12 | 18 | 6 | 12 | 14 | 106 |
| AUS | 38 | 10 | 15 | 5 | 10 | 9 | 87 |
| KEN | 10 | 2 | 0 | 0 | 0 | 0 | 12 |

*Paris 2024 fixture data — replace with real IOC import before July 2026.*

---

## Accreditation category key

| Code | Meaning |
|------|---------|
| **E** | Written press |
| **Es** | Written press (special) |
| **EP** | Photographer |
| **EPs** | Photographer (special) |
| **ET** | Technical staff |
| **EC** | Commentator |

---

---

# Role 1 — EoI Applicant

**Who**: A journalist, photographer, broadcaster, or agency representative applying for media accreditation at LA 2028.

**Portal entry**: https://mrp.dgpbeta.com/apply

**What they do**: Submit an Expression of Interest (EoI) form covering their organisation, contact details, accreditation categories requested, and publication history. The NOC reviews their submission and allocates slots.

---

## Use Case: Apply

The applicant receives a magic link by email, fills out the multi-tab form, and submits. This is the core applicant journey.

---

### Test 1.1 — Request an access token

**Goal**: Confirm the email gate works and a token is sent.

```
┌─────────────────────────────────────────────────────────────────┐
│  LA 2028  Press Registration Portal                              │
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

1. Navigate to `https://mrp.dgpbeta.com/apply`
2. Enter a valid work email (e.g. `tester@apnews.com`)
3. Click **Send access code**

**Expected**: Page confirms the code was sent. Check inbox for a link containing a 4-character token.

**Negative**: Enter `notanemail` → inline error "Please enter a valid email address."

---

### Test 1.2 — Verify the access code

**Goal**: Confirm the verify screen loads and Continue works.

```
┌─────────────────────────────────────────────────────────────────┐
│   Check your inbox                                              │
│                                                                 │
│   We sent a code to tester@apnews.com                          │
│                                                                 │
│              ┌──────────────────────┐                          │
│              │   A  B  7  3         │  ← 4-char code           │
│              └──────────────────────┘                          │
│                                                                 │
│   [ Continue to application → ]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Option A — own email**:
1. Click the link in your email
2. The verify screen shows your 4-character code
3. Click **Continue to application**

**Option B — pre-seeded token** (skips email):
1. Navigate directly to `https://mrp.dgpbeta.com/apply/verify?token=K7M2&email=demo@test.com`
2. Click **Continue to application**

**Expected**: Redirected to the multi-tab EoI form.

**Negative**: Navigate to the same URL using token `XXXX` → error screen showing "This link has expired."

---

### Test 1.3 — Complete and submit the EoI form

**Goal**: Confirm all five tabs work, auto-save functions, and submission succeeds.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tab: [Organisation] [Contacts] [Accreditation] [Publications] [Review]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ORGANISATION                                                        │
│                                                                      │
│  Organisation name *    ┌──────────────────────────────────┐        │
│                         │ AP Test Org                      │        │
│                         └──────────────────────────────────┘        │
│  Organisation type *    ┌──────────────────────────────────┐        │
│                         │ News Agency                   ▼  │        │
│                         └──────────────────────────────────┘        │
│  Country *              ┌──────────────────────────────────┐        │
│                         │ United States                 ▼  │        │
│                         └──────────────────────────────────┘        │
│  NOC *                  ┌──────────────────────────────────┐        │
│                         │ USA - USOPC                   ▼  │        │
│                         └──────────────────────────────────┘        │
│                                                                      │
│  [Save draft]                            [Next: Contacts →]         │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:

1. **Organisation tab**: Fill in org name, type, country, NOC, address fields. Click **Next**.
2. **Contacts tab**: Fill primary contact first/last name, job title, email, phone. Click **Next**.
3. **Accreditation tab**: 
   - Check at least one category (E, Es, EP, EPs, ET, or EC)
   - Enter requested quantity for each checked category
   - Fill the "About your coverage" textarea
   - Click **Next**
4. **Publications tab**: Add at least one publication with title and circulation. Click **Next**.
5. **Review tab**: Confirm all sections show your entered data. Click **Submit application**.

**Expected**: Confirmation page with your reference number (e.g. `APP-2028-USA-00042`). Form data is cleared from localStorage.

**Auto-save test**: On any tab, fill a field, close the browser tab, reopen `https://mrp.dgpbeta.com/apply`, re-verify with the same token. The form should reload with your previously entered data.

---

### Test 1.4 — Submit with validation errors

**Goal**: Confirm required fields are enforced and the form navigates to the first tab with an error.

**Steps**:
1. On the Review tab, click **Submit application** without completing required fields (e.g. start fresh or clear the org name field)

**Expected**:
- Red border on every empty required field
- Error text below each required field ("This field is required" or similar)
- Active tab jumps to the earliest tab that has an error (e.g. if Organisation tab has errors, it becomes active)
- No submission occurs

---

### Test 1.5 — Resubmit a returned application

**Goal**: Confirm an applicant can update and resubmit after a NOC returns their application.

**Pre-condition**: Application `APP-2028-USA-00004` (Reuters, Returned status) is in the seed data. Log in as the applicant for that application, or create a new application and have a NOC admin return it.

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/apply` with the original email
2. Request a new access code and verify
3. The form should load pre-populated with the previous submission
4. The NOC's return note should be visible at the top of the form
5. Update any field (e.g. increase requested E slots from 3 to 5)
6. Click **Submit application**

**Expected**: Status changes from **Returned** to **Resubmitted**. Reference number is unchanged.

---

### Test 1.6 — Check application status

**Goal**: Confirm an applicant can look up their submission status without logging in.

```
┌─────────────────────────────────────────────────────────────────┐
│  Check Application Status                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Enter the email address you used to apply to view your        │
│  application status.                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  you@newsorg.com                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ View My Status ]                                             │
│                                                                 │
│  The status link is valid for 1 hour.                          │
└─────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/apply/status`
2. Enter the email address used for a seeded application (e.g. `demo@test.com`)
3. Click **View My Status**
4. Follow the magic link sent to that email (or use the pre-seeded token path if testing in isolation)

**Expected**: Status page shows the application reference number, current status (e.g. Pending, Returned, Candidate), submission date, and organisation name.

**Negative — unknown email**: Enter `nobody@unknown.com` → page shows "No application found for this email address."

**Negative — invalid email**: Enter `notanemail` → inline validation error before submission.

**Token expiry test**: Wait for the 1-hour window to pass (or use an expired token) → error page "This status link has expired. Request a new one."

---

---

# Role 2 — NOC Admin

**Who**: The accreditation coordinator at a National Olympic Committee (e.g. USOPC for USA, British Olympic Association for GBR).

**Portal entry**: https://mrp.dgpbeta.com/admin  
(Login with `noc.admin@usopc.org` / `Password1!` for USA; `noc.admin@teamgb.org` for GBR)

**What they do**: Review EoI submissions from media organisations in their country, decide how many accreditation slots to allocate per organisation, and submit the allocation plan (PbN) to the IOC. They also nominate organisations for Extra National Representatives (ENR).

---

## Use Case 1: Evaluate EoI Forms

The NOC admin reviews incoming EoI applications and approves, returns (with feedback), or rejects them.

---

### Test 2.1 — View the EoI review list

**Goal**: Confirm the review list loads and shows correct application statuses.

```
┌──────────────────────────────────────────────────────────────────────┐
│  NOC Admin — Applications                                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [ All ▼ ]  [ Filter by status ▼ ]        [ Search org name... ]    │
│                                                                      │
│  Organisation           Status       Categories    Ref              │
│  ─────────────────────────────────────────────────────────────────  │
│  Associated Press (US)  ● Pending    E×8           APP-2028-USA-00001│
│  The New York Times     ● Pending    E×5, EP×3     APP-2028-USA-00002│
│  NBC Sports             ✓ Candidate  EP×6, EPs×2   APP-2028-USA-00003│
│  Reuters (North Am.)    ↩ Returned   E×3           APP-2028-USA-00004│
│  Reuters (resubmit)     ↻ Resubmit.  E×8, EP×4     APP-2028-USA-00005│
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Log in as `noc.admin@usopc.org` at `https://mrp.dgpbeta.com/admin`
2. Navigate to **Applications** (or the EoI review section)

**Expected**: List shows all USA applications across all statuses. Counts match seed data.

**Filter test**: Filter by **Pending** → only AP and NYT appear.

---

### Test 2.2 — Approve an application

**Goal**: Confirm an application can be approved and the status updates correctly.

**Steps**:
1. Click on `APP-2028-USA-00001` (Associated Press, Pending)
2. Review the form — E×8, no photo categories
3. Click **Approve**

**Expected**: Status changes to **Candidate**. Application no longer appears in Pending filter. The org now appears in the PbN allocation table (Use Case 2).

---

### Test 2.3 — Return an application with a note

**Goal**: Confirm the NOC can send an application back to the applicant with feedback.

**Steps**:
1. Click on `APP-2028-USA-00002` (New York Times, Pending)
2. Click **Return to applicant**
3. Enter a return note: "Please provide additional detail on your EP coverage plan for track & field."
4. Confirm the return

**Expected**: Status changes to **Returned**. Return note is stored and visible if the applicant reopens their form.

---

### Test 2.4 — Reject an application permanently

**Goal**: Confirm a permanent rejection prevents resubmission.

**Steps**:
1. Find a Pending application (or use a second test org)
2. Click **Reject**
3. Confirm the rejection

**Expected**: Status changes to **Rejected**. No resubmit option shown. Rejection is permanent.

---

## Use Case 2: Allocate Quota (PbN)

After approving applications, the NOC admin decides how many accreditation slots to allocate to each approved organisation and submits the plan to the OCOG/IOC. Allocations are tracked per sub-category (E, Es, EP, EPs, ET, EC) against the NOC's quota.

---

### Test 2.5 — View the PbN allocation table

**Goal**: Confirm the allocation table shows only candidate orgs and the correct per-category quotas.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PbN Allocation — USA                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Quota:  E: 80  Es: 20  EP: 30  EPs: 10  ET: 25  EC: 25               │
│                                                                         │
│  Organisation      E Req  E Alloc  EP Req  EP Alloc  EPs Req EPs Alloc │
│  ──────────────────────────────────────────────────────────────────────│
│  NBC Sports         —      ─────    6       [  6 ]    2       [  2 ]   │
│  Reuters (resubm.)  8      [  8 ]   4       [  4 ]    —       ─────    │
│                                                                         │
│  Footer:           8      8/80     10      10/30      2       2/10     │
│                                                                         │
│  [ Save draft ]                             [ Submit to IOC → ]        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/noc/pbn`
2. Confirm only **Candidate** applications appear in the table

**Expected**:
- USA shows NBC Sports (EP, EPs) and Reuters resubmit (E, EP)
- Only columns for categories that at least one org requested are shown (dynamic columns)
- Quota totals shown at top: E=80, EP=30, EPs=10 for USA
- Footer totals update as you enter slot numbers

---

### Test 2.6 — Enter slot allocations and check quota enforcement

**Goal**: Confirm slot inputs work and the form prevents over-quota submission.

**Steps**:
1. Enter valid slot numbers for each org — e.g. NBC Sports: EP=6, EPs=2; Reuters: E=8, EP=4
2. Watch the footer totals and progress bars update in real time
3. Click **Save draft** — confirm values persist on page reload
4. Now try to over-allocate: enter EP=30 for each org (total = 60, quota = 30)
5. Click **Submit to IOC**

**Expected** (step 3): Draft saves without submitting.  
**Expected** (step 5): Submission blocked with an error indicating the EP quota is exceeded. Specific error identifies which category is over.

---

### Test 2.7 — Submit the PbN allocation plan

**Goal**: Confirm submission works when within quota.

**Steps**:
1. Ensure all slot values are within quota
2. Click **Submit to IOC**
3. Confirm the submission dialog

**Expected**: PbN state changes to `noc_submitted`. The submit button is no longer available. A confirmation message is shown.

---

## Use Case 2b: Direct Entry and Direct PbN Entry

Direct entry lets a NOC submit a pre-approved org (skipping the public EoI queue). Direct PbN entry lets a NOC add an org straight to the allocation table with no EoI record at all.

### Test 2.12 — Direct entry of a known organisation

**Who:** NOC Admin (S. Kim, USOPC)
**Route:** `/admin/noc/direct-entry`

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to Direct Entry | Form appears with Organisation, Primary Contact, Accreditation Categories, and About sections |
| 2 | Fill in: org name "USA Today Sports", type "Print / Online", country "US", contact name and email, check category E, enter 3 slots | All fields accept input |
| 3 | Click "Submit & Approve" | Redirected to NOC queue with success banner; "USA Today Sports" appears in the queue with status "Candidate" and badge "Direct Entry" |
| 4 | Open the EoI queue and filter by "Candidate" | "USA Today Sports" is visible with source badge "Direct Entry"; it is already in the PbN allocation table |

### Test 2.13 — Add an organisation directly to PbN

**Who:** NOC Admin (S. Kim, USOPC)
**Route:** `/admin/noc/pbn`

| # | Action | Expected |
|---|--------|----------|
| 1 | Scroll to bottom of PbN page; click "+ Add organisation directly to PbN" | Inline form expands with: Organisation name, Type, Country (optional) |
| 2 | Enter "National Press Association", type "Print / Online", country "US"; click "Add to PbN" | Page reloads with success banner; "National Press Association" appears as a new row in the allocation table |
| 3 | Note the new row | All category input fields are enabled (all categories eligible); Req. column shows "—" (no EoI request) |
| 4 | Enter 2 slots for E and save draft | Slot total updates in the quota progress bar |

---

## Use Case 3: Enter / Prioritize ENR Requests

After PbN submission, the NOC can nominate specific media organisations for Extra National Representative slots and rank them by priority.

---

### Test 2.8 — View the ENR nomination list

**Goal**: Confirm the ENR section is independent of EoI and accessible after seeding.

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/noc/enr`

**Expected**: ENR list page loads. If no nominations exist yet, a prompt to add the first nomination is shown.

---

### Test 2.9 — Add an ENR nomination

**Goal**: Confirm a nomination can be added with all required fields.

```
┌─────────────────────────────────────────────────────────────────┐
│  Add ENR Nomination                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Organisation name *   ┌───────────────────────────────────┐   │
│                        │ AP Test International             │   │
│                        └───────────────────────────────────┘   │
│                                                                 │
│  Description *         ┌───────────────────────────────────┐   │
│                        │ Global newswire covering 100+     │   │
│                        │ countries with 2,000 journalists  │   │
│                        └───────────────────────────────────┘   │
│                                                                 │
│  Justification *       ┌───────────────────────────────────┐   │
│                        │ Only newswire with live coverage  │   │
│                        │ in every Olympic city             │   │
│                        └───────────────────────────────────┘   │
│                                                                 │
│  Must-have slots       [ 3 ]    Nice-to-have slots   [ 2 ]     │
│                                                                 │
│  [ Add nomination ]                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Click **Add nomination**
2. Fill in: org name, description, justification, must-have slots (e.g. 3), nice-to-have slots (e.g. 2)
3. Click **Add nomination**

**Expected**: Nomination appears in the list. Priority position is assigned automatically (next available slot).

---

### Test 2.10 — Reorder ENR priority

**Goal**: Confirm nominations can be reordered to reflect NOC priority.

**Steps**:
1. Add at least two nominations (see Test 2.9)
2. Use the priority drag handle (or up/down buttons) to move the second nomination above the first

**Expected**: Priority order updates immediately. The new order persists on page reload.

---

### Test 2.11 — Submit ENR nominations to IOC

**Goal**: Confirm the NOC can submit the ENR list to the IOC.

**Steps**:
1. Ensure at least one nomination exists
2. Click **Submit to IOC**
3. Confirm the submission

**Expected**: ENR state changes to submitted. Nominations are read-only after submission (no edit, only remove-and-re-add to change).

---

---

# Role 3 — OCOG Admin

**Who**: The LA28 Organising Committee accreditation officer responsible for final approval of all NOC slot allocations before they are transmitted to the ACR (Accreditation) system.

**Portal entry**: https://mrp.dgpbeta.com/admin/ocog  
(Login with `ocog.admin@la28.org` / `Password1!`)

**What they do**: Monitor PbN submission status across all NOCs, review each NOC's proposed per-category slot allocations, adjust individual org slot counts if needed, formally approve the allocation, and push the final data to ACR.

**Dependency**: NOC Admin must have submitted a PbN allocation (Use Case 2, Test 2.7) before OCOG can act on it.

---

## Use Case 1: Review PbN Submissions

The OCOG admin monitors which NOCs have submitted their allocations and reviews each one before approving.

---

### Test 3.1 — View the OCOG PbN dashboard

**Goal**: Confirm the dashboard shows cross-NOC PbN submission status and highlights NOCs awaiting approval.

```
┌──────────────────────────────────────────────────────────────────────┐
│  OCOG Admin — Press by Number Approvals                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ⚠  1 NOC has submitted PbN allocations awaiting your approval.     │
│     Review them in PbN Approvals.                                    │
│                                                                      │
│  [ All ▼ ]  [ submitted ▼ ]                                          │
│                                                                      │
│  NOC   Status              Orgs  Press Quota  Photo Quota            │
│  ────────────────────────────────────────────────────────────────── │
│  USA   ● Submitted          2    8/190        10/40                  │
│  GBR   ○ Not started        0    0/123        0/31                   │
│  FRA   ○ Not started        0    0/114        0/26                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Log in as `ocog.admin@la28.org` at `https://mrp.dgpbeta.com/admin`
2. Navigate to **PbN Approvals** (or go directly to `https://mrp.dgpbeta.com/admin/ocog/pbn`)

**Expected**:
- Cross-NOC list with one row per NOC
- USA shows **Submitted** status (if Test 2.7 was completed)
- GBR and FRA show **Not started**
- Banner warns about pending approvals
- Filter by **Submitted** → only USA row visible

---

### Test 3.2 — Review a NOC's allocation detail

**Goal**: Confirm the OCOG can drill into a specific NOC's org-by-org allocation and see per-category slot breakdowns.

```
┌───────────────────────────────────────────────────────────────────────┐
│  OCOG Review — USA                                                    │
├───────────────────────────────────────────────────────────────────────┤
│  Quota summary                                                        │
│  E: 80   Es: 20   EP: 30   EPs: 10   ET: 25   EC: 25                 │
│                                                                       │
│  Organisation      E Alloc  EP Alloc  EPs Alloc  Total               │
│  ─────────────────────────────────────────────────────────────────── │
│  NBC Sports          —        6          2          8                 │
│  Reuters (resubm.)   8        4          —         12                 │
│                                                                       │
│  Footer:             8       10          2         20                 │
│                                                                       │
│  [ Approve allocation ]      [ Back to list ]                        │
└───────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. From the OCOG PbN list, click on **USA**
2. Review the per-org, per-category slot breakdown

**Expected**:
- One row per approved org in USA
- Per-category columns matching the categories those orgs requested
- Quota summary bars showing allocated vs. total for each category
- Grand total visible
- Approve button available (since state = `noc_submitted`)

---

## Use Case 2: Approve PbN Allocation (with optional adjustments)

The OCOG can accept the NOC's allocation as-is, or adjust individual org slot counts before approving.

---

### Test 3.3 — Approve a NOC allocation without changes

**Goal**: Confirm approval with no adjustments works and advances the state.

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/ocog/pbn/USA`
2. Review the allocation — do not change any slot values
3. Click **Approve allocation**

**Expected**:
- State changes to `ocog_approved`
- USA row on the PbN list now shows **Approved** status
- The **Approve** button is no longer shown on the USA detail page
- A new **Send to ACR** button appears

---

### Test 3.4 — Approve a NOC allocation with slot adjustments

**Goal**: Confirm the OCOG can override individual org slot counts before approving.

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/ocog/pbn/USA`
2. Change one org's E slot count (e.g. reduce Reuters from 8 to 6)
3. Click **Approve allocation**

**Expected**:
- Updated slot values are saved
- The adjusted org shows the OCOG-modified value, not the original NOC value
- State advances to `ocog_approved`
- Adjustment is reflected in any subsequent CSV export

---

## Use Case 3: Send to ACR

After approving, the OCOG transmits the final allocation to the ACR system.

---

### Test 3.5 — Send approved allocation to ACR

**Goal**: Confirm the Send to ACR action triggers the ACR adapter and logs the transmission.

**Steps**:
1. Ensure USA is in `ocog_approved` state (Test 3.3 or 3.4 complete)
2. On the USA detail page, click **Send to ACR**

**Expected**:
- Success banner: "X orgs sent to ACR" (where X = number of approved orgs for USA)
- Server log shows `[ACR STUB] pushOrgData called with X records` with per-org category breakdown
- Audit log records the `pbn_sent_to_acr` action
- The **Send to ACR** button is no longer available (or is disabled) after transmission

**Negative**: Attempt to send a NOC that is still in `noc_submitted` state (not yet OCOG approved) — the action should redirect with an error, not transmit.

---

---

# Role 5 — IF Admin

**Who**: An International Federation representative (e.g. World Athletics) who reviews media applications for organisations covering their sport.

**Portal entry**: https://mrp.dgpbeta.com/admin  
(Login with `if.admin@worldathletics.org` / `Password1!`)

**What they do**: The IF Admin role currently shares the NOC Admin UI. Sport-specific filtering is not yet implemented — the IF admin sees all applications for their associated NOC, not just their sport. ENR scenarios are not applicable to IF Admins.

> **Note**: IF Admin sport-scoping (filtering applications to a specific sport/IF) is on the roadmap but not yet built. All test cases below match the NOC Admin experience.

---

## Use Case 1: Evaluate EoI Forms

IF Admin uses the same screens as NOC Admin. Note: IFs do not have a public EoI queue — all IF territory orgs come in via direct entry. IF admins should use the Direct Entry page to add their sport-specialist organisations, then allocate PbN slots directly. IF admins do not use the ENR workflow.

Log in as `if.admin@worldathletics.org` and follow Tests 2.1 through 2.4 above for queue review behaviour. For adding IF orgs, use the Direct Entry flow (Tests 2.12–2.13).

---

## Use Case 2: Allocate Quota

Same as NOC Admin — see Tests 2.5 through 2.7. The IF admin can view the PbN allocation table and submit allocations using the same workflow.

> **ENR not applicable**: IF Admins do not submit ENR nominations. If the ENR navigation item is visible, confirm it is disabled or hidden — this is a known scope boundary.

---

---

# Role 6 — IOC Admin

**Who**: An IOC accreditation officer overseeing the full media registration process across all NOCs.

**Portal entry**: https://mrp.dgpbeta.com/admin  
(Login with `ioc.admin@olympics.org` / `Password1!`)

**What they do**: Monitor the status of EoI applications across all NOCs, make grant/partial/denied decisions on ENR nominations, and (when built) impersonate other users for support purposes.

---

## Use Case 1: View Dashboard

The IOC admin gets a cross-NOC overview of EoI application status, PbN submission progress, and ENR activity.

---

### Test 4.1 — View the IOC dashboard

**Goal**: Confirm the IOC admin sees data across all NOCs, not just one.

```
┌──────────────────────────────────────────────────────────────────────┐
│  IOC Admin — Dashboard                                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Applications at a glance                                            │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐           │
│  │ Pending  │ Approved │ Returned │ Resubmit │ Rejected │           │
│  │   3      │   4      │   3      │   1      │   1      │           │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘           │
│                                                                      │
│  NOC PbN status                                                      │
│  USA  ████████░░ noc_submitted     GBR  ██░░░░░░░░ draft             │
│  FRA  ██░░░░░░░░ draft                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Log in as `ioc.admin@olympics.org` at `https://mrp.dgpbeta.com/admin`

**Expected**:
- Dashboard shows totals across ALL NOCs (USA + GBR + FRA)
- Application counts match seed data (3 pending, 4 candidate, etc.)
- PbN status per NOC is visible
- NOC admin cannot see this view (confirm by logging in as `noc.admin@usopc.org` — should redirect or scope to USA only)

---

### Test 4.2 — Browse applications across NOCs

**Goal**: Confirm IOC Admin can see all applications, including those from other NOCs.

**Steps**:
1. Navigate to the applications list from the IOC dashboard
2. Confirm you can see GBR applications (Guardian, BBC Sport) alongside USA applications

**Expected**: Full cross-NOC list. No NOC filter applied by default. Filter controls available if needed.

---

## Use Case 2: Manage / Assign ENR Requests

After NOCs submit their ENR nominations, the IOC reviews each org and makes a decision: Grant, Partial Grant, or Denied.

---

### Test 4.3 — View ENR submissions from all NOCs

**Goal**: Confirm the IOC ENR list aggregates submissions from all NOCs.

```
┌──────────────────────────────────────────────────────────────────────┐
│  IOC Admin — ENR Nominations                                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NOC   Organisation          Priority  Must-Have  Nice-to-Have  Decision│
│  ────────────────────────────────────────────────────────────────── │
│  USA   AP Test International   1         3          2           —    │
│  USA   World Photo Agency       2         2          1           —    │
│  GBR   Reuters Global          1         4          2           —    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Pre-condition**: At least one NOC has submitted ENR nominations (run Tests 2.9–2.11 first, or use seeded ENR data if present).

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/ioc/enr`

**Expected**: All submitted ENR nominations from all NOCs are visible with their priority rankings.

---

### Test 4.4 — Make a decision on an ENR nomination

**Goal**: Confirm IOC can grant, partially grant, or deny an ENR nomination.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENR Decision — AP Test International (USA, Priority 1)              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Must-have slots requested:  3                                       │
│  Nice-to-have slots:         2                                       │
│                                                                      │
│  Decision   ○ Grant   ● Partial Grant   ○ Denied                    │
│                                                                      │
│  Slots granted   [ 2 ]                                               │
│                                                                      │
│  [ Save decision ]                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Click on a nomination (e.g. AP Test International, USA Priority 1)
2. Select **Partial Grant**
3. Enter granted slots: `2` (less than the 3 requested)
4. Click **Save decision**

**Expected**: Decision saved. The nomination row shows "Partial — 2 slots" in the decisions column. NOC Admin can see this decision when they view their ENR list.

**Repeat for**: Grant (enter the full must-have amount), Denied (no slots).

---

### Test 4.5 — View ENR decisions from NOC admin perspective

**Goal**: Confirm NOC can see IOC decisions after they are made.

**Steps**:
1. Log out, log back in as `noc.admin@usopc.org`
2. Navigate to `https://mrp.dgpbeta.com/admin/noc/enr`

**Expected**: Decisions (Grant / Partial / Denied) and granted slot counts are visible for each nomination.

---

## Use Case 4: Manage Quotas

### Test 4.6 — View and edit NOC quotas

**Who:** IOC Admin
**Route:** `/admin/ioc/quotas`

| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to Quotas | Table shows all NOCs with per-category totals (E, Es, EP, EPs, ET, EC, NOC E). Import CSV button visible. |
| 2 | Click "Edit" for USA row | Per-category fields become editable inline |
| 3 | Change USA E total from current value to 150; click Save | Page reloads with success banner; USA E shows 150; audit trail records the change |
| 4 | Return to NOC admin for USA and open PbN | Quota dashboard now shows E total of 150 |

### Test 4.7 — Import quotas from CSV

**Who:** IOC Admin
**Route:** `/admin/ioc/quotas`

| # | Action | Expected |
|---|--------|----------|
| 1 | Download a CSV export from the export page | CSV has columns for NOC code and per-category totals |
| 2 | Edit one NOC's E total in the CSV, save | — |
| 3 | Import the CSV via "Import CSV" | Success banner; changed NOC shows new value; audit trail records import |

---

## Use Case 3: Act as Another User (Sudo)

The IOC admin can open a read-only window impersonating any admin user for support and debugging. All form controls are disabled in sudo mode. The sudo event is audit logged.

---

### Test 6.3 — Open a sudo window as a NOC admin

**Goal**: Confirm the "Act as user" flow opens a new window with the correct session and banner.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [SUDO MODE]  Viewing as S. Kim (NOC Admin · USA)                    │
│              initiated by IOC Admin  [ Exit sudo ]                   │
├──────────────────────────────────────────────────────────────────────┤
│  (NOC Admin UI — all forms and buttons disabled)                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Steps**:
1. Log in as `ioc.admin@olympics.org`
2. In the header, click **Act as user**
3. Enter `noc.admin@usopc.org` in the email field
4. Click **Open as user →**

**Expected**:
- A new browser window opens
- The amber **SUDO MODE** banner appears at the very top: "Viewing as S. Kim (NOC Admin · USA) — initiated by IOC Admin"
- The window shows the NOC Admin home page for USA
- An **Exit sudo** button is visible in the banner

**Negative**: Attempt to enter `ioc.readonly@olympics.org` → error "Cannot sudo into another IOC admin account."

---

### Test 6.4 — Confirm sudo session is read-only

**Goal**: Confirm all write actions are blocked in the sudo window.

**Steps** (in the sudo window from Test 6.3):
1. Navigate to `https://mrp.dgpbeta.com/admin/noc/queue`
2. Click on a pending application
3. Try to click **Approve**

**Expected**: The approve button is disabled (greyed out). Attempting to submit any form should have no effect.

**Also test**: Navigate to `https://mrp.dgpbeta.com/admin/noc/pbn` — slot input fields should be disabled.

---

### Test 6.5 — Exit sudo

**Goal**: Confirm the Exit sudo button ends the session cleanly.

**Steps**:
1. In the sudo window, click **Exit sudo** in the amber banner

**Expected**: Window redirects to a "Sudo session ended — this window can be closed" confirmation page. The original IOC Admin window is unaffected.

---

### Test 6.6 — Confirm sudo is audit logged

**Goal**: Confirm the `sudo_initiated` action appears in the audit log.

**Steps**:
1. Navigate to `https://mrp.dgpbeta.com/admin/ioc/audit`
2. Look for the most recent `sudo_initiated` entry

**Expected**: Audit entry shows: actor = IOC Admin, action = `sudo_initiated`, detail = "Sudo initiated as S. Kim (noc_admin · USA)".

---

---

## Use Case: EoI Window Management (OCOG Admin)

> **Note:** Window control was moved from NOC Admin Settings to OCOG Admin in April 2026. The NOC admin no longer has a Settings page — `/admin/noc/settings` has been removed. Window management is now OCOG-only at `/admin/ocog/windows`.

### Test 5.1 — Close and reopen a NOC's EoI window

**Who:** OCOG Admin
**Route:** `/admin/ocog/windows`

| # | Action | Expected |
|---|--------|----------|
| 1 | Log in as `ocog.admin@la28.org` and navigate to `/admin/ocog/windows` | EoI Windows page shows a table of all NOCs with Open/Close toggle per row, plus Open All / Close All bulk actions and a summary count |
| 2 | Find the USA row and click "Close" | USA window shows as "Closed"; last-changed timestamp updates; audit trail records the change |
| 3 | In a separate browser/incognito, navigate to the EoI form and select USA as country | Applicant sees "This NOC has closed its Expression of Interest window" message |
| 4 | Return to `/admin/ocog/windows` and click "Open" for USA | Window returns to "Open"; applicant flow works again |
| 5 | Click "Close All" | All NOC windows close; summary shows 0 open |
| 6 | Click "Open All" | All NOC windows open; summary shows full count open |

## Use Case: Application Reversals (NOC Admin)

### Test 5.2 — Unapprove an application

**Who:** NOC Admin
**Route:** `/admin/noc/queue` → application detail

| # | Action | Expected |
|---|--------|----------|
| 1 | Open a candidate application | Detail page shows "Un-approve" section below the current status |
| 2 | Click "Un-approve" | Status reverts to "Pending"; organisation is removed from PbN candidate pool; any draft PbN slot allocation for this org is reset to 0 |
| 3 | Check the audit trail (IOC sudo view or IOC audit page) | "application_unapproved" event recorded |

---

## Cross-role regression checklist

Run this after any significant code change to catch regressions across the full journey.

| # | Action | Actor | Expected |
|---|--------|-------|---------|
| 1 | Submit EoI form with all required fields | Applicant | Ref number shown, status = Pending |
| 2 | View application list | NOC Admin (USA) | Only USA apps visible |
| 3 | Approve one pending application | NOC Admin | Status → Candidate |
| 4 | Return one pending application with note | NOC Admin | Status → Returned |
| 5 | Resubmit a returned application | Applicant | Status → Resubmitted |
| 6 | View PbN table after approval | NOC Admin | Approved org appears in table |
| 7 | Enter slot allocations | NOC Admin | Totals update in footer |
| 8 | Over-allocate one category and submit | NOC Admin | Error, submission blocked |
| 9 | Submit valid PbN allocation | NOC Admin | State → noc_submitted |
| 10 | Add ENR nomination | NOC Admin | Appears in list with priority |
| 11 | Reorder ENR nominations | NOC Admin | Order persists |
| 12 | Submit ENR to IOC | NOC Admin | Read-only state after submit |
| 13 | View dashboard totals | IOC Admin | Cross-NOC counts match |
| 14 | Grant ENR nomination | IOC Admin | Decision visible to NOC |
| 15 | Download PbN CSV export | IOC Admin | CSV with all 6 category columns |
| 16 | OCOG reviews submitted PbN | OCOG Admin | `https://mrp.dgpbeta.com/admin/ocog/pbn` — NOC's submission visible |
| 17 | OCOG approves PbN with adjustments | OCOG Admin | State → ocog_approved |
| 18 | OCOG sends to ACR | OCOG Admin | ACR stub logs all 6 category fields |
| 19 | Open sudo window as NOC admin | IOC Admin | New window shows SUDO MODE banner, NOC UI |
| 20 | Attempt approve action in sudo window | IOC Admin (sudo) | Button disabled, no write occurs |
| 21 | Exit sudo | IOC Admin (sudo) | Window shows "session ended" page |
| 22 | Check audit log for sudo event | IOC Admin | `sudo_initiated` entry with actor and target |
