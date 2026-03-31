# MRP Monkey Test Guide

**Production URL**: https://mrp-production-8073.up.railway.app/
**Admin URL**: https://mrp-production-8073.up.railway.app/admin
**EoI form**: https://mrp-production-8073.up.railway.app/apply

---

## What is this?

The **Media Registration Portal (MRP)** is LA28's digital replacement for the Excel-and-email press accreditation process. It handles two sequential workflows — Expression of Interest (EoI) then Press by Number (PbN) — for the roughly 206 NOCs that manage media access to the Olympic Games.

---

## The EoI Form (public, no login required)

Media organisations use the EoI form to express interest in press accreditation for LA28. A journalist or press officer visits the public URL, enters their email, and receives a magic link. They then fill in their organisation's details — publication name, type, circulation, and how many credentials they need across categories (E for written press, EP for photographers, ET for TV, etc.). The submission goes directly to their country's NOC for review.

You can jump straight to the form using a pre-seeded magic link — no email required:

```
https://mrp-production-8073.up.railway.app/apply/verify?token=K7M2&email=demo@test.com
```

---

## Admin accounts

All accounts share the password: **`Password1!`**

### IOC Admin
| Email | Role |
|-------|------|
| `ioc.admin@olympics.org` | IOC Admin (full access + sudo) |

### NOC Admins
| Email | NOC |
|-------|-----|
| `noc.admin@usopc.org` | USA (USOPC) |
| `noc.admin@teamgb.org` | GBR (Team GB) |
| `noc.admin@franceolympique.fr` | FRA (CNOSF) |

---

## What to do as an NOC Admin

Log in as one of the three NOC users above. You'll land on the EoI review queue — a list of pending applications from media organisations in your territory.

**EoI review** (`/admin/noc/enr` for ENR, `/admin` for EoI queue): Approve, return, or reject applications. Returning an application sends it back to the applicant with a note; rejection is permanent. Approved organisations become eligible for quota allocation in the next phase.

**Press by Number (PbN)** (`/admin/noc/pbn`): Once EoI is underway, this is where you allocate your IOC-assigned quota slots to approved organisations. Each category (E, Es, EP, EPs, ET, EC) has an independent quota. The running totals update live as you fill in numbers. Submit your allocation to the OCOG for formal approval.

**ENR nominations** (`/admin/noc/enr`): Separately from EoI, you can nominate Extended Non-Rights Broadcasters directly. This is NOC-driven — media orgs don't apply themselves. The IOC reviews and grants from a separate holdback pool.

---

## What to do as an IOC Admin

Log in as `ioc.admin@olympics.org`. The IOC admin has read-only visibility across all NOCs for both EoI and PbN — you can see every application and every allocation without being able to change them. You can also download CSV exports of PbN allocations and ENR nominations.

**OCOG PbN review** (`/admin/ocog/pbn`): The OCOG admin (`ocog.admin@la28.org`) formally approves or rejects NOC quota submissions before they flow to the ACR system. Log in as OCOG to see this queue.

### Sudo / Act as user

The IOC Admin can impersonate any NOC, OCOG, or IF admin for support and auditing purposes. From the IOC admin panel, use the **"Act as user"** form, enter a target admin email (e.g. `noc.admin@usopc.org`), and a one-time activation link is generated. Open that link to enter a sudo session — you'll see exactly what the target user sees with a visible banner indicating you're in sudo mode. The session is time-limited and every action is logged against the original IOC admin identity. Click **Exit sudo** to return to your own session.

---

## Seeded test data

The USA queue has the most variety: two pending applications, one approved, one returned, and one resubmitted. GBR and FRA have a mix of approved and pending. Go in as a USA NOC admin first, then move to IOC to see the cross-NOC view.
