**Last updated: 17-Apr-2026 16:00 CEST**

# PRP Monkey Test Guide

**Production URL (primary)**: https://mrp.dgpbeta.com/
**Production URL (fallback)**: https://mrp-production-8073.up.railway.app/

> **If the primary URL is blocked on your network**, use the Railway fallback URL — both point to the same live environment. Anywhere below you see `mrp.dgpbeta.com`, you can swap in `mrp-production-8073.up.railway.app` and the link will work identically (e.g. `/admin`, `/apply`, `/apply/verify?token=…`).

**Admin URL**: https://mrp.dgpbeta.com/admin  *(or https://mrp-production-8073.up.railway.app/admin)*
**EoI form**: https://mrp.dgpbeta.com/apply  *(or https://mrp-production-8073.up.railway.app/apply)*

---

## What is this?

The **Press Registration Portal (PRP)** is the digital platform for managing press accreditation for the Olympic Games. It handles two sequential workflows — Expression of Interest (EoI) then Press by Number (PbN) — for the roughly 206 NOCs that manage media access to the Games.

This guide is for informal exploratory testing ("monkey testing") — click around, try unexpected inputs, and see if anything breaks. No scripted steps required.

---

## Applicant Status Page (public, no login required)

After submitting an EoI, applicants can check their status at any time without logging in:

```
https://mrp.dgpbeta.com/apply/status
```

Enter the email address used when applying. A magic link is sent with a 1-hour expiry. Click it to see the application status and submission details.

Things to try:
- Enter an email that has a submitted application — confirm the link arrives and status is shown
- Enter an email with no application — confirm a graceful "no application found" message
- Use the same magic link twice — confirm it works for the full hour and then expires

---

## The EoI Form (public, no login required)

Media organisations use the EoI form to express interest in press accreditation. A journalist or press officer visits the public URL, enters their email, and receives a magic link. They then fill in their organisation's details — publication name, type, circulation, and how many credentials they need across categories (E for written press, EP for photographers, ET for TV technicians, EC for support staff, etc.). The submission goes directly to their country's NOC for review.

You can jump straight to the form using a pre-seeded magic link — no email required:

```
https://mrp.dgpbeta.com/apply/verify?token=K7M2&email=demo@test.com
```

Things to try on the form:

- Select a country and watch the NOC field auto-fill (you can override it)
- Try submitting with missing required fields
- Request slots across multiple accreditation categories
- Resubmit after returning to the form via the magic link

---

## Admin accounts

All accounts share the password: **`Password1!`**

Admin sessions last **8 hours**.

> ⚠️ **Switching between user accounts — read this first.** Admin sessions are sticky. If you go straight to the login page while a session is still active, the app will take you back into the previous user's dashboard. To test as a different user, you **must fully log out first** using one of these methods:
>
> 1. **Sign out from the app** — click **Sign out** in the top-right header of any admin page. This is the cleanest way.
> 2. **Clear the session from the login page** — click the small **"clear session"** link in the bottom-left corner of the login form. Use this if you've navigated to the login page and realise you're still signed in.
> 3. **Open an incognito / private window** — the simplest option if you want to test multiple roles side by side. Each incognito window has its own isolated session, so you can be logged in as (say) a NOC admin in one window and an IOC admin in another without them stepping on each other.
>
> If you swap accounts without doing one of the above, you'll either stay logged in as the old user or see stale data in the header.

### IOC Admin

| Email | Role |
|-------|------|
| `ioc.admin@olympics.org` | IOC Admin (full access + sudo) |

### OCOG Admin

| Email | Role |
|-------|------|
| `ocog.admin@la28.org` | OCOG Admin (PbN approval) |

### NOC Admins

| Email | NOC |
|-------|-----|
| `noc.admin@usopc.org` | USA (USOPC) |
| `noc.admin@teamgb.org` | GBR (Team GB) |
| `noc.admin@franceolympique.fr` | FRA (CNOSF) |

---

## What to do as an NOC Admin

Log in as one of the three NOC users above. You'll land on the EoI review queue — a list of pending applications from media organisations in your territory.

**EoI queue** (`/admin/noc/queue`): Approve, return, or reject applications. Returning sends the application back to the applicant with a note; rejection is permanent. Approved organisations are marked as candidates for quota allocation — note this does not guarantee credentials, which are assigned in PbN.

**Application detail** (`/admin/noc/[id]`): Click any application to see full details. Approve as Candidate, Return, or Reject from here. An approved application can be un-approved (reversed) while PbN is still in draft.

**Direct entry** (`/admin/noc/direct-entry`): Submit a pre-approved org directly — bypasses the public EoI queue and auto-approves immediately. Useful for well-known domestic media and for nominating your NOC's own communications staff for E (Journalist) slots.

**Press by Number (PbN)** (`/admin/noc/pbn`): Allocate your IOC-assigned quota slots to approved organisations. Each category (E, Es, EP, EPs, ET, EC) has an independent quota. Running totals update live as you type. You can also add an org directly to the PbN table without an EoI record using the "+ Add organisation directly to PbN" button. Submit your allocation to the OCOG for formal approval.

**ENR nominations** (`/admin/noc/enr`): Nominate Extended Non-Rights Broadcasters directly. This is NOC-driven — media orgs don't apply themselves. The IOC reviews nominations and grants from a separate holdback pool of 350 slots.

**Help & Guide** (`/admin/noc/help`): In-portal guide covering the NOC workflow, key screens, Direct Entry, and FAQ. Accessible via the `? Help` link in the top-right of every admin page.

---

## What to do as an OCOG Admin

Log in as `ocog.admin@la28.org`. The OCOG admin is the formal approval authority for NOC PbN submissions and has cross-NOC visibility on EoI.

**PbN Approval** (`/admin/ocog/pbn`): Formally approve or adjust NOC PbN quota submissions before they flow to the ACR system.

**EoI Windows** (`/admin/ocog/windows`): Open or close EoI submission windows per NOC. Shows Open/Close toggle for each of the 206 NOCs, plus Open All / Close All bulk actions and a summary count of open vs. closed. All changes logged to the audit trail.

**EoI Summary** (`/admin/ocog/eoi`): Application counts by NOC and status (pending, approved, returned, rejected) in a pivot table. All 206 NOCs listed.

**Duplicate Detection** (`/admin/ocog/duplicates`): Surfaces cross-NOC duplicates (same email domain across multiple NOCs) and within-NOC duplicates.

**Master Allocation** (`/admin/ocog/master`): Same live view as IOC — quota and allocated slots adjacent per category for all NOCs and IFs, continent column, expandable org rows, capacity tracker, and grand totals banner.

**Help & Guide** (`/admin/ocog/help`): In-portal guide covering the OCOG workflow. Accessible via `? Help` in the top-right header.

---

## What to do as an IOC Admin

Log in as `ioc.admin@olympics.org`. The IOC admin has visibility across all NOCs for both EoI and PbN. You can also download CSV exports of PbN allocations and ENR nominations.

**Dashboard** (`/admin/ioc`): Cross-NOC overview of EoI and PbN status.

**Quotas** (`/admin/ioc/quotas`): Set per-NOC, per-category quotas. Enter values inline or import via CSV. Also set Event Capacity and IOC Holdback from this page.

**IOC Direct** (`/admin/ioc/direct`): Add major international wire services and agencies (AFP, AP, Reuters, Xinhua, etc.) that are accredited directly by the IOC, bypassing the NOC EoI process. Adding an org here also reserves it — NOCs will be blocked from submitting a duplicate EoI for any org in this list. Slot allocations for IOC-Direct orgs are managed and submitted to the OCOG through the same PbN state machine as NOC submissions.

**ENR Review** (`/admin/ioc/enr`): Review and grant ENR nominations from all NOCs. Manage the 350-slot combined holdback pool.

**Master Allocation** (`/admin/ioc/master`): Quota and allocated slots adjacent per category for all NOCs, IFs, and IOC Direct. Continent column (hideable), expandable org-level rows, capacity tracker, and grand totals banner.

**Org Directory** (`/admin/ioc/orgs`): Browse all organisations across all NOCs.

**Audit Trail** (`/admin/ioc/audit`): Every admin action is logged — approvals, rejections, allocations, quota changes, sudo sessions.

**PBN Export** (`/admin/ioc/export`): Download CSV exports of PbN allocations and ENR nominations.

**Help & Guide** (`/admin/ioc/help`): In-portal guide covering the IOC workflow. Accessible via `? Help` in the top-right header.

### Sudo / Act as user

The IOC Admin can impersonate any NOC, OCOG, or IF admin for support and auditing purposes. From the IOC admin panel, use the **"Act as user"** form, enter a target admin email (e.g. `noc.admin@usopc.org`), and a one-time activation link is generated. Open that link to enter a sudo session — you'll see exactly what the target user sees with a visible banner indicating you're in sudo mode. The session is time-limited and every action is logged against the original IOC admin identity. Click **Exit sudo** to return to your own session.

---

## Seeded test data

The USA queue has the most variety: two pending applications, one approved, one returned, and one resubmitted. GBR and FRA have a mix of approved and pending.

**Suggested order:**
1. Start as USA NOC admin — review the queue, approve and return some applications, allocate PbN slots
2. Move to OCOG admin — approve the USA PbN submission, try the EoI Windows page
3. Move to IOC admin — see the cross-NOC view, check the audit trail, try sudo into a NOC

---

## Things to try (monkey test ideas)

- Submit the EoI form twice from the same magic link
- Return an application with a very long note
- Approve an application, then try to un-approve it after PbN is submitted
- Set a quota of 0 for one category and try to allocate to it in PbN
- Submit PbN with over-quota allocations (the form should block this)
- Add an IOC-Direct org, then check that a NOC can't submit a duplicate EoI for that org
- Try the Direct Entry form with only required fields; then with all optional fields (Editor-in-Chief, website)
- On the EoI form, select Es or EPs — confirm the sport picker appears and is required
- On the Direct Entry form, select Es or EPs — confirm the sport picker appears
- On the EoI form, select "Freelancer / Independent" as org type — confirm the press card question reveals
- On the EoI form, select "Other" as org type — confirm the free-text field reveals
- Use OCOG admin to close a NOC's EoI window, then try submitting an EoI as an applicant from that territory
- Use OCOG admin to close all windows, then open all windows
- On the Master Allocation page (IOC or OCOG), toggle the Continent column on and off
- On the Master Allocation page, expand a NOC row to see org-level allocations
- Check the capacity tracker turns amber/red as NOC quotas are set near or over 6,000
- Click a "Possible Duplicate" badge in the NOC queue — confirm the side-by-side comparison modal opens with differences highlighted
- Use sudo to view a NOC's queue, then verify the action appears in the audit trail
- Visit the Help & Guide links for each admin role — confirm context-sensitive section opens
