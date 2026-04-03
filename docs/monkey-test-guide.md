# MRP Monkey Test Guide

**Production URL**: https://mrp-production-8073.up.railway.app/
**Admin URL**: https://mrp-production-8073.up.railway.app/admin
**EoI form**: https://mrp-production-8073.up.railway.app/apply

---

## What is this?

The **Media Registration Portal (MRP)** is the digital platform for managing press accreditation for the Olympic Games. It handles two sequential workflows — Expression of Interest (EoI) then Press by Number (PbN) — for the roughly 206 NOCs that manage media access to the Games.

This guide is for informal exploratory testing ("monkey testing") — click around, try unexpected inputs, and see if anything breaks. No scripted steps required.

---

## The EoI Form (public, no login required)

Media organisations use the EoI form to express interest in press accreditation. A journalist or press officer visits the public URL, enters their email, and receives a magic link. They then fill in their organisation's details — publication name, type, circulation, and how many credentials they need across categories (E for written press, EP for photographers, ET for TV technicians, EC for support staff, etc.). The submission goes directly to their country's NOC for review.

You can jump straight to the form using a pre-seeded magic link — no email required:

```
https://mrp-production-8073.up.railway.app/apply/verify?token=K7M2&email=demo@test.com
```

Things to try on the form:

- Select a country and watch the NOC field auto-fill (you can override it)
- Try submitting with missing required fields
- Request slots across multiple accreditation categories
- Resubmit after returning to the form via the magic link

---

## Admin accounts

All accounts share the password: **`Password1!`**

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

**Fast-track entry** (`/admin/noc/fast-track`): Submit a pre-approved org directly — bypasses the public EoI queue and auto-approves immediately. Useful for well-known domestic media and for nominating your NOC's own communications staff for E (Journalist) slots.

**Press by Number (PbN)** (`/admin/noc/pbn`): Allocate your IOC-assigned quota slots to approved organisations. Each category (E, Es, EP, EPs, ET, EC) has an independent quota. Running totals update live as you type. You can also add an org directly to the PbN table without an EoI record using the "+ Add organisation directly to PbN" button. Submit your allocation to the OCOG for formal approval.

**ENR nominations** (`/admin/noc/enr`): Nominate Extended Non-Rights Broadcasters directly. This is NOC-driven — media orgs don't apply themselves. The IOC reviews nominations and grants from a separate holdback pool of 350 slots.

**Settings** (`/admin/noc/settings`): Open or close your territory's EoI submission window. While the window is closed, the public apply form shows a "window closed" banner to applicants from your territory.

---

## What to do as an IOC Admin

Log in as `ioc.admin@olympics.org`. The IOC admin has visibility across all NOCs for both EoI and PbN. You can also download CSV exports of PbN allocations and ENR nominations.

**Dashboard** (`/admin/ioc`): Cross-NOC overview of EoI and PbN status.

**Quotas** (`/admin/ioc/quotas`): Set per-NOC, per-category quotas. Enter values inline or import via CSV.

**IOC Direct** (`/admin/ioc/direct`): Add major international wire services and agencies (AFP, AP, Reuters, Xinhua, etc.) that are accredited directly by the IOC, bypassing the NOC EoI process. Adding an org here also reserves it — NOCs will be blocked from submitting a duplicate EoI for any org in this list. Slot allocations for IOC-Direct orgs are managed and submitted to the OCOG through the same PbN state machine as NOC submissions.

**ENR Review** (`/admin/ioc/enr`): Review and grant ENR nominations from all NOCs. Manage the 350-slot combined holdback pool.

**Org Directory** (`/admin/ioc/orgs`): Browse all organisations across all NOCs.

**Audit Trail** (`/admin/ioc/audit`): Every admin action is logged — approvals, rejections, allocations, quota changes, sudo sessions.

**PBN Export** (`/admin/ioc/export`): Download CSV exports of PbN allocations and ENR nominations.

**OCOG PbN review** (`/admin/ocog/pbn`): The OCOG admin (`ocog.admin@la28.org`) formally approves or rejects NOC quota submissions before they flow to the ACR system. Log in as OCOG to see this queue.

### Sudo / Act as user

The IOC Admin can impersonate any NOC, OCOG, or IF admin for support and auditing purposes. From the IOC admin panel, use the **"Act as user"** form, enter a target admin email (e.g. `noc.admin@usopc.org`), and a one-time activation link is generated. Open that link to enter a sudo session — you'll see exactly what the target user sees with a visible banner indicating you're in sudo mode. The session is time-limited and every action is logged against the original IOC admin identity. Click **Exit sudo** to return to your own session.

---

## Seeded test data

The USA queue has the most variety: two pending applications, one approved, one returned, and one resubmitted. GBR and FRA have a mix of approved and pending.

**Suggested order:**
1. Start as USA NOC admin — review the queue, approve and return some applications, allocate PbN slots
2. Move to OCOG admin — approve the USA PbN submission
3. Move to IOC admin — see the cross-NOC view, check the audit trail, try sudo into a NOC

---

## Things to try (monkey test ideas)

- Submit the EoI form twice from the same magic link
- Return an application with a very long note
- Approve an application, then try to un-approve it after PbN is submitted
- Set a quota of 0 for one category and try to allocate to it in PbN
- Submit PbN with over-quota allocations (the form should block this)
- Add an IOC-Direct org, then check that a NOC can't submit a duplicate EoI for that org
- Try the fast-track form with only required fields; then with all fields
- Open the EoI window, submit a form from a matching country, then close the window
- Use sudo to view a NOC's queue, then verify the action appears in the audit trail
