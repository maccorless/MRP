**Last updated: 11-Apr-2026 20:30**

**Version:** 1.1 (draft) \| **Date:** 2026-04-11 \| **Status:** DRAFT --- pending IOC/OCOG confirmation at April 15/16 stakeholder meeting

# Document Introduction

## Purpose

This document describes the baseline and planned functional, non-functional, and operational requirements for the LA28 Media Registration Portal (MRP). The MRP is the digital platform through which media organisations express interest in press accreditation for the LA28 Olympic Games, National Olympic Committees (NOCs) manage and allocate their assigned quotas, and the Organising Committee (OCOG) formally approves those allocations for transfer to the ACR accreditation system.

This document covers v0.1 prototype capabilities (delivered April 2026) and the full v1 launch scope (August 24, 2026). It serves as the primary requirements reference for D.TEC product delivery, IOC Media Operations review, and OCOG/LA28 stakeholder sign-off. The design confirmation document (MRP-design-confirmation.md) remains the living working document; this document provides a structured, signable extract.

## Document Ownership

  ------------------------------------------------------------------------------------------------------------------
  **Role**                            **Name / Organisation**
  ----------------------------------- ------------------------------------------------------------------------------
  KPD Owner                           Ken Moore, Deloitte Olympic Technology (D.TEC)

  IOC Reviewer                        Emma Morris, IOC Media Operations

  OCOG Reviewer                       Martyn (LA28 Accreditation Lead)

  Approvers                           IOC Media Operations, LA28 / OCOG

  Target Audience                     IOC Media Operations, LA28/OCOG, D.TEC development team, NOC representatives
  ------------------------------------------------------------------------------------------------------------------

## Open Items

Items marked OPEN in this document require IOC/OCOG confirmation at the April 15/16 stakeholder meeting. Items marked PROVISIONAL have working defaults that will proceed unless overridden. See Section 9 (Open Questions Register) for the full list.

**Two architectural disputes were open at document creation; one is now resolved:**

- **PbN approval authority + quota entry ownership (MRP-FR-019, MRP-FR-020 and related): RESOLVED 2026-04-11.** Model A confirmed: IOC enters per-category quota totals directly in the portal; OCOG is the single PbN approval gate; IOC has read-only visibility on PbN. No rework required — this matches what is built. Open wrinkle: whether MRP should surface the gap between portal-entered quota and IOC total allocation (holdback caveat) — not blocking, to be confirmed before July quota-entry phase. See stakeholder-questions.md section 3.2.

- **ENR nomination model (MRP-FR-030 and related): OPEN-BLOCKING.** The current design has NOCs nominating ENR organisations only; media organisations cannot self-apply. IOC feedback proposes allowing ENR self-application via the EoI portal. If adopted, the EoI form, NOC queue action set, and ENR state machine all change. No ENR intake or routing work should proceed until Emma (IOC) and Martyn (OCOG) confirm the front door model — see stakeholder-questions.md section 5.1.

## Target Audience

Three primary reader groups:

- IOC Media Operations --- to confirm the portal design accurately reflects the press accreditation process and to identify any gaps or required changes.

- LA28 / OCOG --- to confirm the OCOG approval workflow, cross-NOC visibility requirements, and PbN state machine.

- D.TEC Development Team --- as the authoritative requirements baseline for sprint planning and delivery.

NOC representatives should review Sections 4 and 5 to validate that the NOC dashboard workflows match how they operate in practice.

# Application Introduction

## Overview

The LA28 Media Registration Portal (MRP) is a dedicated web application built by Deloitte Olympic Technology (D.TEC). It manages the end-to-end process of media press accreditation requests for the 2028 Olympic Games in Los Angeles, replacing the current Excel-based workflow.

The MRP is the single point of entry for all media accreditation expressions of interest. It serves three distinct workflows:

- Expression of Interest (EoI) --- public-facing form for media organisations to apply for press accreditation through their NOC (August--October 2026).

- Press by Number (PbN) --- NOC quota allocation and OCOG formal approval workflow (October--December 2026).

- Extended Non-Rights Broadcasters (ENR) --- separate IOC-managed track for broadcasters without Olympic media rights, running in parallel.

## Problem Statement

The current press accreditation process is managed through Excel spreadsheets emailed between the IOC, NOCs, and OCOG. Three parties suffer:

- IOC Media Operations: they allocate quotas to 206 NOCs but have zero visibility into what NOCs do with those quotas. Disputes cannot be investigated without audit trails.

- NOC press accreditation managers: Excel templates emailed back and forth. Multiple file versions, no deduplication, no audit trail.

- OCOG ACR staff (LA28): submissions from 206 NOCs reconciled manually. Entirely manual, no tooling.

For LA28 2028, the IOC has committed to launching a dedicated Media Registration Portal. This has been announced to all NOCs. The portal must be live by August 24, 2026.

## Vision

The 10x version of the MRP is an IOC-owned media credentialing platform that persists across every Olympic and Paralympic Games edition. By 2032 Brisbane, an accredited organisation from LA28 carries its record forward. The IOC has a global directory of legitimate press organisations with track records. The platform becomes the single source of truth for Olympic press identity worldwide.

## Process Overview

### Process 1 --- Expression of Interest (EoI)

August -- October 2026. A media organisation submits a structured application listing the accreditation categories they are seeking. The NOC reviews each application and makes an eligibility decision (approve / return / reject). Output: approved list of media organisations per NOC, tagged by E-category. Primary owner: NOC/IF. OCOG and IOC have read-only visibility.

### Process 2 --- Press by Number (PbN)

October -- December 2026. The NOC takes their EoI-approved org list and assigns per-category quota slots to each org, within their IOC-assigned per-category totals. The OCOG formally approves (or adjusts) the allocation. Approved allocations flow to ACR. Primary owner: OCOG (formal approval). NOC handles allocation. IOC has read-only visibility.

### Separate Track --- Extended Non-Rights Broadcasters (ENR)

Parallel to EoI/PbN window. In the current design, media organisations do NOT self-apply for ENR. The NOC nominates broadcasters and submits a prioritised list to the IOC. The IOC grants allocations from a separate holdback pool of 350 slots. Completely separate screens --- no connection to EoI or PbN. Primary owner: IOC (grants from holdback). NOC submits and receives decisions.

**OPEN-BLOCKING — ENR front door unresolved:** Whether ENR organisations self-apply via the EoI portal or are nominated only by NOCs is an unresolved architectural question. Awaiting Emma (IOC) and Martyn (OCOG). No ENR intake or routing work should proceed until confirmed — see stakeholder-questions.md section 5.1.

## System Architecture

Two-system boundary:

- System 1 --- MRP (this system): public EoI form, NOC/OCOG/IOC dashboards, PbN allocation and approval, ENR request and grant, quota management, audit trail.

- System 2 --- ACR / ACR system (LA28\'s existing accreditation platform): Common Codes org registry, Press by Name individual accreditation (Phase 2, 2027).

Technology stack: Next.js App Router (server components, server actions), Drizzle ORM, PostgreSQL, Tailwind CSS, shadcn/ui. Auth: magic link (applicants); D.TEC/DGP SSO (admin roles, v1.0). Deployed on D.TEC/DGP EU infrastructure (v1). Adapter pattern for ACR integration: AcrStubClient (dev/test) swapped for AcrApiClient (prod).

# User Roles and Personas

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Role**                         **Primary Process**                             **Permissions and Actions**
  -------------------------------- ----------------------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Applicant (media organisation)   EoI submission                                  Submits own application via public form. Views own application status. No account required --- email verification via magic link.

  NOC Admin                        EoI review + PbN allocation + ENR request       Sees own territory only. Approve/return/reject EoI applications. Invite known organisations. Allocate per-category slots in PbN. Submit prioritised ENR request list. Nominate NOC communications staff (NOC E).

  IF Admin                         PbN allocation + ENR request                    Same screens as NOC admin. No public EoI queue --- uses invited-org flow only. Allocates per-category slots. Submits ENR list.

  OCOG Admin (LA28)                PbN formal approval                             Cross-NOC access. Reviews and formally approves or adjusts NOC PbN submissions. Read-only visibility on EoI.

  IOC Admin                        ENR grant + quota-setting + IOC-Direct + sudo   Read-only visibility on EoI and PbN for all NOCs. Sets per-category quota totals. Reviews/grants ENR requests. Manages IOC-Direct reserved org list. Sudo impersonation mode (read-only).

  IOC Readonly                     Visibility only                                 Same read-only visibility as IOC Admin. Cannot write data. Cannot use sudo.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Functional Requirements --- Expression of Interest (EoI)

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-001**                      **Summary:** Public EoI form for media organisation self-nomination
  ----------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The MRP must provide a public-facing, multi-tab application form allowing media organisations worldwide to express interest in press accreditation for LA28. No account is required. Email verification via magic link is required before submission. The form must auto-save via browser local storage to prevent data loss.

  **Acceptance Criteria**             \- Form accessible at a public URL without login.\
                                      - Applicant receives email verification link before submission.\
                                      - Form auto-saves locally (500ms debounce, keyed by email).\
                                      - Per-tab completion indicators displayed.\
                                      - Completed submission assigned a unique reference number (e.g. APP-2028-USA-00051).
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-002**                      **Summary:** EoI form fields --- 5-tab structure
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The EoI form must capture data across five tabs: (1) Organisation --- org name, type, country, NOC code, website, address (street/city/state/postal), freelancer flag; (2) Contacts --- primary contact (first name, last name, title/position, email, phone, cell) and optional secondary contact (all fields); (3) Accreditation --- E-category multi-select with requested quantity per selected category, coverage description (required), accessibility needs flag; (4) Publication --- publication type checkboxes (13 types), circulation, frequency, sports to cover; (5) History --- prior Olympic/Paralympic accreditation by edition (checkboxes), past coverage examples, additional comments.

  **Acceptance Criteria**             \- All required fields validated before submission.\
                                      - Country field auto-suggests matching NOC code; override supported.\
                                      - URL fields enforce https:// format.\
                                      - Publication type multi-select includes 13 types plus \"Other\" free-text reveal.\
                                      - Olympic edition checkboxes: Sydney 2000 through Paris 2024.\
                                      - Secondary contact fields fully optional.\
                                      - Accessibility needs flag captured and visible to NOC reviewer.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-003**                      **Summary:** E-category accreditation selection
  ----------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Applicants must be able to select one or more of six accreditation categories: E (Journalist), Es (Sport-specific journalist), EP (Photographer), EPs (Sport-specific photographer), ET (Technician), EC (Support staff). Each category includes inline eligibility help text. Es and EPs applicants must declare the sport they specialise in. Applicants enter a requested quantity per selected category. ENR and NOC E (Press Attaché) are not available on the public form.

  **Acceptance Criteria**             \- At least one category required to submit.\
                                      - Requested quantity captured per selected category.\
                                      - Es and EPs require a sport declaration (free text, v1).\
                                      - Multi-category selection creates one application record with multiple category flags.\
                                      - NOC E and ENR are not selectable options on the public form.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-004**                      **Summary:** Email verification and security controls
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Email verification (magic link) is required before application submission. Rate limiting: max 5 token requests per email per hour; max 15 per IP per hour. CAPTCHA (hCaptcha) on the public form. Email domain blocklist rejects known disposable email providers. Atomic token consumption prevents concurrent double-submission.

  **Acceptance Criteria**             \- Applicant cannot submit without email verification.\
                                      - Rate limit exceeded shows appropriate error.\
                                      - Magic link tokens expire after 24 hours (configurable).\
                                      - Tokens are one-time-use; replay attacks blocked at DB level.\
                                      - CAPTCHA displayed on all public form submission points.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-005**                      **Summary:** EoI window management per NOC
  ----------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Each NOC must be able to independently open or close their EoI acceptance window. When closed, applicants see a clear message. The OCOG must have visibility of which NOC windows are open/closed. OPEN: OCOG override authority and global deadline enforcement mechanism pending IOC/OCOG confirmation.

  **Acceptance Criteria**             \- NOC admin toggles their window from the settings screen.\
                                      - Closed window blocks new submissions with appropriate message.\
                                      - Window state changes logged in audit trail.\
                                      - OCOG can view all 206 NOC window states.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-006**                      **Summary:** NOC EoI review queue
  ----------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must have a dashboard showing all EoI applications from their territory. Per application, the NOC can: approve (mark eligible for PbN); return with a review note (applicant may resubmit); reject with a reason. Approval does not set slot quantities --- it is an eligibility decision only. A QuotaBar component shows per-category impact if the application is approved.

  **Acceptance Criteria**             \- NOC sees only their own territory\'s applications.\
                                      - Approve, return (with note), reject actions available.\
                                      - Rejected applications are permanent (PROVISIONAL --- confirm with IOC/OCOG).\
                                      - QuotaBar shows allocated + this-request / total per selected category.\
                                      - Over-quota state highlighted in red.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-007**                      **Summary:** NOC fast-track entry
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must be able to add a known organisation directly to their approved list without the org submitting a public form. Fast-track collects: org name, type, country, category selection, primary contact details. Fast-track entries are logged as noc_direct_entry in the audit trail and are immediately eligible for PbN allocation.

  **Acceptance Criteria**             \- Fast-track form accessible from the NOC admin panel.\
                                      - Resulting record appears in the approved candidate list.\
                                      - Audit log records noc_direct_entry with NOC admin actor.\
                                      - No CAPTCHA or email verification required.\
                                      - PROVISIONAL: no limit on number of fast-track entries per NOC; no secondary approval required.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-008**                      **Summary:** Application resubmission
  ----------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     When a NOC returns an application with a review note, the applicant must be able to resubmit using a new magic link. The resubmission updates the application record and transitions status to resubmitted. Resubmission count is tracked. The NOC review note is cleared on resubmission; the NOC internal note is preserved.

  **Acceptance Criteria**             \- Applicant can initiate resubmission from the status-check page.\
                                      - New magic link required per resubmission.\
                                      - Status transitions from returned to resubmitted.\
                                      - Resubmission count incremented and visible to NOC.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-009**                      **Summary:** Applicant status tracking
  ----------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     After submitting, applicants must be able to check their application status using their reference number and email address, without an account. Status visible: pending, returned (with NOC review note), approved, rejected (with reason). Internal NOC notes are never shown to the applicant.

  **Acceptance Criteria**             \- Status accessible at /apply/status with reference number and email.\
                                      - NOC review note displayed when status is returned.\
                                      - Approved and rejected statuses clearly communicated.\
                                      - Internal NOC notes never exposed.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-010**                      **Summary:** OCOG and IOC read-only EoI visibility
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     During EoI, the OCOG must have cross-NOC visibility of all applications. The IOC must have the same read-only visibility. Neither OCOG nor IOC can approve, return, or reject applications during EoI --- these actions are reserved for the NOC.

  **Acceptance Criteria**             \- OCOG dashboard shows all applications across all territories with filtering.\
                                      - IOC dashboard shows same data in read-only mode.\
                                      - No approve/return/reject controls visible to OCOG or IOC on EoI screens.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-011**                      **Summary:** Decision reversals
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must be able to reverse an approve or return decision. Unapprove (approved → pending): org removed from PbN candidate pool; draft PbN allocations for the org reset. Unreturn (returned → pending): NOC can re-evaluate without waiting for resubmission. Rejections are permanent.

  **Acceptance Criteria**             \- Unapprove and Unreturn actions available from application detail page.\
                                      - Unapprove resets draft PbN allocations for the org.\
                                      - All reversals logged in the audit trail.\
                                      - No time limit on reversals (PROVISIONAL).
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Functional Requirements --- Press by Number (PbN)

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-012**                      **Summary:** IOC quota import and in-app editing
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The IOC must be able to import per-category quota totals for each of the 206 NOCs from a CSV file. Format: NOC, E, Es, EP, EPs, ET, EC, NocE (eight columns, one row per NOC). The IOC must also be able to edit individual NOC quota totals directly in the portal after import. All quota changes (import and manual edits) are logged in an append-only audit table with prior value, new value, actor, and timestamp.

  **Acceptance Criteria**             \- CSV import produces a viewable, editable quota table in the IOC dashboard.\
                                      - Seven per-category totals per NOC: E, Es, EP, EPs, ET, EC, NocE.\
                                      - In-app edit mode allows per-cell editing.\
                                      - All changes logged in quota_changes table with change_source (import / manual_edit).\
                                      - Prior Games comparison column shown for reference (Paris 2024 / Tokyo 2020).
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-013**                      **Summary:** NOC PbN slot allocation
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must be able to assign per-category slot quantities to each approved organisation in their territory, constrained by their IOC-assigned per-category totals. All seven categories (E, Es, EP, EPs, ET, EC, NOC E) are tracked independently. The system enforces a hard quota cap: the NOC cannot allocate more slots in any category than their IOC-assigned total for that category.

  **Acceptance Criteria**             \- PbN screen shows per-category quota state: X of Y allocated.\
                                      - Hard cap enforced server-side; over-quota allocation blocked.\
                                      - Org list includes EoI-approved orgs, fast-track orgs, and direct-entry orgs.\
                                      - NOC can save as draft and return to edit.\
                                      - NOC E allocated via a nominated communications-staff org record.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-014**                      **Summary:** Direct PbN entry without EoI record
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must be able to add an organisation directly to their PbN allocation table without a prior EoI record. A simple inline form captures: org name, type, country, category. The OCOG can see which PbN entries had a prior EoI record and which were added directly. The hard quota cap applies equally to direct-entry orgs.

  **Acceptance Criteria**             \- Inline add form available on the PbN screen.\
                                      - Direct-entry orgs appear alongside EoI-approved orgs in PbN.\
                                      - OCOG view distinguishes direct-entry orgs from EoI-approved orgs.\
                                      - Direct-entry blocked if it would exceed per-category quota.\
                                      - Audit logged as noc_direct_entry.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-015**                      **Summary:** PbN state machine and submission flow
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     PbN allocations must track four states: draft (NOC editing), noc_submitted (ready for OCOG review), ocog_approved (OCOG accepted), sent_to_acr (data pushed to ACR). NOC submits when their allocation is ready. State is visible to NOC at all times. sent_to_acr is a terminal state in MRP.

  **Acceptance Criteria**             \- State displayed prominently on NOC PbN screen.\
                                      - NOC receives in-app notification and email when OCOG approves or adjusts.\
                                      - NOC receives second notification when data flows to ACR.\
                                      - OCOG adjustments highlighted in NOC view.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-016**                      **Summary:** OCOG PbN approval
  ----------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The OCOG must be able to review and formally approve PbN submissions from all 206 NOC territories. The OCOG can approve as submitted or adjust individual per-org per-category slot allocations before approving. OCOG can reverse an approval (ocog_approved → noc_submitted) to return the allocation to the NOC for revision.

  **Acceptance Criteria**             \- OCOG dashboard shows all NOC PbN submissions with status filtering.\
                                      - OCOG can enter per-org slot overrides before approving.\
                                      - Approval transitions state from noc_submitted to ocog_approved.\
                                      - Reversal returns state to noc_submitted; NOC notified.\
                                      - All OCOG actions audit-logged.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-017**                      **Summary:** ACR data export (sendToAcr)
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Once the OCOG approves a PbN submission, the OCOG must be able to push the approved allocation to ACR. Output per organisation includes: NOC code, org name, country, org type, contact details, per-category EoI flags, per-category allocated slot counts (E, Es, EP, EPs, ET, EC, NOC E), ENR slots granted, Common Codes ID. ENR organisations appended as separate records. Fallback: structured CSV export if ACR API unavailable at June 1, 2026 go/no-go gate.

  **Acceptance Criteria**             \- sendToAcr() triggers only from ocog_approved state.\
                                      - All seven per-category slot counts included per record.\
                                      - IOC_DIRECT orgs included in standard export.\
                                      - ENR orgs included as separate records with enrSlotsGranted set.\
                                      - State transitions to sent_to_acr after successful push.\
                                      - CSV fallback available if ACR API unavailable.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-018**                      **Summary:** NOC quota dashboard
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The NOC must have a real-time per-category quota summary on their dashboard. Before IOC sets totals, each category shows \"not yet assigned\". After IOC sets totals, each category shows X allocated / Y total. On the application detail page, a QuotaBar shows the per-category impact of approving an application.

  **Acceptance Criteria**             \- Dashboard header shows per-category quota state at all times.\
                                      - QuotaBar visible on application detail page when quota data exists.\
                                      - Shown only for pending or resubmitted applications.\
                                      - Over-quota state highlighted in red with \"over quota\" text.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Functional Requirements --- Extended Non-Rights Broadcasters (ENR)

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-019**                      **Summary:** NOC ENR request submission
  ----------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     NOC admins must be able to submit a prioritised list of ENR organisations to the IOC. The list is ordered by priority rank (rank 1 = highest priority). For each nominated org, the NOC provides: org name, website, description, justification, must-have slots, nice-to-have slots. ENR orgs never appear in EoI queues or PbN allocation tables. After submission, the NOC cannot modify the list (OPEN: amendment policy).

  **Acceptance Criteria**             \- NOC can add, remove, and re-rank ENR nominations before submission.\
                                      - Each entry: org name, website, description, justification, must-have slots, nice-to-have slots.\
                                      - Priority rank maintained without gaps (re-ranked on remove via SQL window function).\
                                      - Unique partial index prevents duplicate ranks for draft entries.\
                                      - Submission transitions list to IOC review state.\
                                      - ENR orgs never appear in EoI or PbN screens.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-020**                      **Summary:** IOC ENR grant decisions --- combined multi-NOC view
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The IOC must be able to review all NOC ENR submissions and make grant decisions per organisation. CONFIRMED REQUIREMENT: the IOC must see all NOC ENR submissions combined in one view before allocating. Three outcomes per org: Granted (full slot count), Partial grant (fewer slots than requested), Denied (0 slots). The IOC works against a total holdback pool of 350 slots. Running pool balance always visible.

  **Acceptance Criteria**             \- IOC ENR screen shows all NOC submissions in a combined multi-NOC view (redesign required --- current single-NOC view is insufficient).\
                                      - Running total against 350-slot pool visible at all times.\
                                      - IOC sets granted slot count per org (0 to requested amount).\
                                      - Outcome: granted / partial / denied, with optional decision notes.\
                                      - NOC sees IOC decisions per org after IOC submits.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-021**                      **Summary:** ENR quota pool management
  ----------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     The ENR holdback pool (350 slots total) is completely separate from E-category totals. It is managed entirely by the IOC. Per-NOC E-category quotas are unaffected by ENR grants.

  **Acceptance Criteria**             \- ENR quota pool independent of all E-category quota calculations.\
                                      - IOC dashboard shows ENR pool state: total (350), allocated, remaining.\
                                      - Per-NOC ENR grants tracked in separate enr_quotas table.
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-022**                      **Summary:** ENR undertaking (v1.1, deferred)
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Before an ENR organisation can receive accreditation, they must sign an undertaking. This feature is deferred to v1.1 pending IOC News Access Rules finalisation. In v1, the undertaking continues via the existing external Adobe Acrobat process. When in scope: Path A (typed name + checkbox + timestamp + PDF receipt) or Path B (DocuSign-grade), subject to IOC Legal determination.

  **Acceptance Criteria**             \- V1: external Adobe Acrobat process continues.\
                                      - V1.1: in-portal mechanism to be built once IOC Legal confirms Path A or Path B.\
                                      - Decision from IOC Legal required after News Access Rules are finalised.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Functional Requirements --- Platform

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-023**                      **Summary:** IOC-Direct organisation management
  ----------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     A reserved list of major international media organisations (AFP, AP, Reuters, Xinhua, etc.) bypass the normal NOC quota process. The IOC acts as their Responsible Organisation under a special pseudo-NOC code IOC_DIRECT. The IOC manages this list via a dedicated admin screen. When a regular NOC attempts to submit an EoI for a reserved-list org, the form blocks submission with a clear message. OPEN: whether IOC manages this in-portal (built design) or offline with OCOG import.

  **Acceptance Criteria**             \- IOC admin can add/remove orgs from the IOC_DIRECT reserved list.\
                                      - IOC admin has NOC-equivalent workflow for IOC_DIRECT: EoI review queue, PbN allocation.\
                                      - OCOG approves IOC_DIRECT PbN on the same state machine as any NOC.\
                                      - Domain-based dedup block prevents regular NOC submissions for reserved org email domains.\
                                      - All add/remove/allocation changes audit-logged.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-024**                      **Summary:** IOC sudo (impersonation) mode
  ----------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     IOC admins must be able to open a read-only impersonation session as any non-IOC admin user. This allows IOC Operations to see exactly what another admin sees without sharing credentials. All write actions are blocked server-side during sudo sessions. An amber SUDO MODE banner is shown on all admin pages.

  **Acceptance Criteria**             \- IOC admin initiates sudo via \"Act as user\" button (ioc_admin role only).\
                                      - One-time activation token (expires in 10 minutes if unused).\
                                      - Token activates in a new browser tab; sudo session cookie set (1-hour max-age).\
                                      - Amber SUDO MODE banner on all admin pages during sudo.\
                                      - All write server actions reject requests from sudo sessions.\
                                      - IOC cannot sudo into another IOC account.\
                                      - sudo_initiated logged to audit trail at token creation time.
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-025**                      **Summary:** Audit trail
  ----------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     All significant actions across all three processes must be recorded in an immutable audit log with actor identity (type, ID, display label), action type, timestamp, and relevant entity IDs (application, organisation). The audit log is append-only. It is visible to IOC and OCOG admins.

  **Acceptance Criteria**             \- 24 defined audit actions (minimum): application_submitted, application_resubmitted, application_approved, application_returned, application_rejected, email_verified, admin_login, duplicate_flag_raised, export_generated, pbn_submitted, pbn_approved, pbn_sent_to_acr, quota_changed, enr_submitted, enr_decision_made, sudo_initiated, noc_direct_entry, eoi_window_toggled, application_unapproved, application_unreturned, pbn_unapproved, enr_decision_revised, and others.\
                                      - Audit log is append-only; no delete or update.\
                                      - Actor type, actor ID, actor display label captured for every entry.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-026**                      **Summary:** Games-to-Games organisation persistence
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Organisations must be first-class entities that persist across Games editions. All tables are scoped to event_id. Adding a future Games edition is a data operation, not a code change. An organisation record from LA28 carries forward as a contextual signal for subsequent Games.

  **Acceptance Criteria**             \- event_id column present in: organizations, applications, org_slot_allocations, enr_requests, noc_quotas, enr_quotas.\
                                      - Default event_id is LA28 for all LA28 operations.\
                                      - Organisation UUID stable across Games editions.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **MRP-FR-027**                      **Summary:** Deduplication and reserved-list block
  ----------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Description**                     Within a NOC territory, the system blocks duplicate submissions (same email domain + same NOC = hard block). The IOC-Direct reserved-list check blocks any NOC submission for a reserved organisation (by email domain or name + country). Cross-NOC deduplication is out of scope for v1 --- the isMultiTerritoryFlag is stored but not surfaced to users.

  **Acceptance Criteria**             \- Same email domain + same NOC = blocked as duplicate.\
                                      - Reserved list match = blocked with \"IOC-Direct organisation\" message.\
                                      - isMultiTerritoryFlag stored in DB for future cross-NOC analysis.\
                                      - Fail-open at submission time: dedup check failure accepts application; duplicates caught before ACR export.
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Non-Functional Requirements

## Authentication and Session Management

V0.1 prototype: email + password for admin roles. V1.0: D.TEC/DGP SSO with MFA required for all admin roles.

Applicants use email verification via magic link --- no account required to submit.

  ------------------------------------------------------------------------------------------------
  **Session Type**                 **Cookie**                              **Max-age**
  -------------------------------- --------------------------------------- -----------------------
  Normal admin session             mrp_session (HMAC-SHA256 signed)        8 hours

  IOC sudo impersonation session   mrp_sudo_session (HMAC-SHA256 signed)   1 hour
  ------------------------------------------------------------------------------------------------

Access control is role-based and enforced server-side on all data reads and writes. NOC admins are restricted to their territory\'s data at the data layer.

## Security

- TLS 1.3 minimum for all connections.

- Rate limiting: max 5 magic link requests per email per hour; max 15 per IP per hour.

- Email domain blocklist for disposable email providers.

- CAPTCHA (hCaptcha) on all public-facing form submission points.

- Atomic token consumption prevents concurrent double-submission attacks.

- Server-side row-level territory enforcement --- NOC data isolation at DB layer.

- Compliance with IOC Software Security Standard, IAM Standard, Data Protection Standard, Data Privacy Standard.

## Data Privacy and PII

- Data controller: IOC. Data processor: OCOG / D.TEC.

- EoI data is organisation-level only --- no individual journalist PII at this stage.

- Encryption at rest and in transit.

- Data residency: v0.1 --- US hosting (Railway), synthetic data only, no real PII. V1 --- EU hosting on D.TEC/DGP infrastructure.

- Retention: archive until December 31, 2030; then purge.

- Backup retention: 90 days rolling.

- GDPR compliance: formal legal sign-off required before v1 launch.

- Right-to-be-forgotten: restricted under GDPR Article 17(3)(b) for Games-legitimacy records.

## Performance and Reliability

- Database: AWS RDS PostgreSQL in production; connection pool sized for load (max connections TBD via load testing).

- ACR adapter retry on push failure: exponential backoff, max 5 attempts, 24-hour window.

- ACR fetchQuota() unavailable: cache last-known quota in MRP DB, surface staleness warning.

- Portal must support 206 NOC concurrent sessions during EoI and PbN windows.

- SLA requirements per the D.TEC/IOC SLA KPD document.

## Localisation

- V1: English only.

- V1.1: French and Spanish.

- Language packs beyond EN/FR/ES are out of scope for LA28.

## Maintainability

- Next.js App Router. Drizzle ORM. PostgreSQL. Tailwind CSS. shadcn/ui.

- All schema changes versioned as Drizzle kit migrations.

- Vitest integration tests run against a real database (pool: forks isolation).

- Adapter pattern for ACR: AcrStubClient in dev/test, AcrApiClient in production.

# Open Questions Register

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **\#**            **Question**                                                                                                                                          **Owner**                 **Status**
  ----------------- ----------------------------------------------------------------------------------------------------------------------------------------------------- ------------------------- -------------------------------------
  1                 EoI form fields: are the 5-tab fields confirmed complete? Any additions or removals? Are per-NOC configurable free-form fields needed?                IOC / OCOG                OPEN

  2                 EoI window: can OCOG override a NOC window? Is global deadline enforced automatically on October 23?                                                  IOC / OCOG                OPEN

  3                 Quota ownership: IOC enters quotas directly in-portal (Model A, built) vs. OCOG re-keys from IOC spreadsheet (Model B, Emma preference)?              IOC / OCOG                RESOLVED 2026-04-11 — Model A confirmed. Holdback caveat: confirm display of gap between portal quota and IOC total (not blocking).

  4                 IOC-Direct: managed in-portal (built) vs. offline list shared with OCOG for import (Emma preference)?                                                 IOC / OCOG                OPEN --- April 15/16 meeting

  5                 ENR combined multi-NOC view: IOC must see all NOC submissions against 350-slot pool before allocating. Confirm redesign scope and timeline.           D.TEC + IOC               CONFIRMED REQUIREMENT --- scope TBD

  6                 ENR submission deadline: separate from EoI deadline (Oct 23) or same?                                                                                 IOC                       OPEN

  7                 ENR amendment: can NOC amend their ENR list after submission to IOC?                                                                                  IOC                       OPEN

  8                 ENR self-application: should ENR orgs be able to apply via the EoI form, with NOC role being prioritisation rather than approve/reject?               IOC + OCOG                OPEN-BLOCKING — awaiting Emma (IOC) and Martyn (OCOG). No ENR intake/routing work until resolved.

  9                 After the MRP → ACR handoff: where do edits live? Model A (edits in ACR only — current implementation), Model B (edits in MRP, re-sent to ACR), or Model C (bidirectional sync)? See stakeholder-questions.md §4.3.   IOC / OCOG                OPEN-BLOCKING — P0 Thursday 2026-04-16. Joint discussion with §4.5.

  10                Rejection permanence: should NOCs be able to un-reject an application (e.g. requiring OCOG sign-off)?                                                 IOC / OCOG                OPEN

  11                RACI: IOC / LA28 / D.TEC ownership of form field changes, NOC account provisioning, production incidents, PbN approval escalations. No RACI exists.   IOC + OCOG                CRITICAL GAP

  12                Quota recipients: are NOCs, IFs, and IOC-Direct the complete list? Do INOs receive media quotas?                                                      IOC                       PARTIALLY RESOLVED --- INOs open

  13                Common Codes lookup at submission: should MRP look up existing Common Codes entries when an org submits EoI?                                          D.TEC Common Codes team   OPEN
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Delivery Roadmap

  ---------------------------------------------------------------------------------------------------------------------------------------------
  **Date**                            **Milestone**
  ----------------------------------- ---------------------------------------------------------------------------------------------------------
  April 30, 2026                      Gate 0: ACR API contract signed off. EoI form field list confirmed. ENR undertaking legal path decided.

  April 2026 (complete)               v0.1 prototype: all EoI, PbN, ENR screens built. Auth (3 roles). DB schema. AcrStubClient. Quota model.

  April--June 2026                    Hardening, capacity testing, security review, OCOG UAT.

  June 1, 2026                        ACR integration go/no-go gate. Fallback: structured CSV export.

  July 2026                           IOC imports per-category quota totals for all 206 NOCs.

  July 1 -- August 10, 2026           Production deployment, final QA, NOC onboarding.

  August 24, 2026                     Portal goes live. EoI window opens. PbN and ENR software live.

  September 1--25, 2026               v1.1: ACR real-time sync + French/Spanish localisation.

  October 5, 2026                     Press by Number process launches (v1.1 must be live).

  October 23, 2026                    EoI application window closes.

  December 18, 2026                   Press by Number closes.

  October 14, 2027                    Press by Name launches (ACR system).

  Summer 2028                         LA28 Olympic Games.
  ---------------------------------------------------------------------------------------------------------------------------------------------

## Success Criteria

- Portal live at www.olympics.com by August 24, 2026.

- 206 NOCs can log in, review EoI applications, and manage their PbN allocations.

- OCOG can formally approve PbN allocations across all NOCs.

- IOC has real-time read-only visibility on EoI and PbN; manages ENR from the 350-slot holdback pool.

- Zero quota overruns --- NOC cannot allocate more slots in any category than their IOC-assigned total.

- PbN output to ACR: per-category slots (E/Es/EP/EPs/ET/EC/NOC E) + ENR per org, OCOG-approved, zero manual cleanup; IOC-Direct orgs included.

- All PII handling compliant with GDPR.

# RACI --- Responsibilities

NOTE: This RACI reflects D.TEC\'s current understanding and has not been confirmed with IOC or OCOG. Confirming this RACI is Critical Gap #11 in the Open Questions Register.

  ---------------------------------------------------------------------------------------------------------------------------------
  **Activity**                           **D.TEC**      **IOC**        **OCOG (LA28)**   **Notes**
  -------------------------------------- -------------- -------------- ----------------- ------------------------------------------
  Requirements gathering                 R/A            C              C                 

  Application development and delivery   R/A            C/I            C/I               

  EoI form field ownership               R (build)      A (approve)    C                 Who decides what fields are on the form?

  PbN formal approval authority          R (build)      I              A (approve)       OCOG confirmed; escalation path TBD

  ENR grant authority                    R (build)      A (grant)      I                 IOC confirmed as ENR decision-maker

  NOC account provisioning               TBC            TBC            TBC               OPEN --- owner not yet assigned

  Production infrastructure              R/A            I              I                 D.TEC/DGP EU infrastructure for v1

  Production incident response           R/A            I              I                 SLA to be defined
  ---------------------------------------------------------------------------------------------------------------------------------

# Data Model Summary

The following are the core data entities in the MRP. Full schema maintained in src/db/schema.ts.

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Table**                           **Purpose**
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  organizations                       Master record for each media organisation. Stable UUID across Games editions. Org type, country, NOC code, email domain, address, freelancer flag, multi-territory flag, Common Codes ID.

  applications                        EoI application records. Per-category flags (E/Es/EP/EPs/ET/EC) and requested quantities. Primary and secondary contact details. Publication details. Accreditation history. Status lifecycle (pending / approved / returned / resubmitted / rejected).

  noc_quotas                          Per-NOC per-category quota totals set by IOC. Seven independent categories: E, Es, EP, EPs, ET, EC, NocE. IOC_DIRECT is a valid noc_code.

  org_slot_allocations                PbN slot allocations per org per NOC. Seven per-category slot counts plus noc_e_slots. PbN state machine (draft / noc_submitted / ocog_approved / sent_to_acr).

  enr_requests                        NOC ENR nomination records. Priority rank, slot request (must-have + nice-to-have), IOC decision (granted / partial / denied), granted slot count, decision notes.

  enr_quotas                          IOC-granted ENR slot totals per NOC. Separate from E-category quotas.

  quota_changes                       Append-only audit of all quota changes (import and manual edits). Per-category quota type. Prior and new values with actor and timestamp.

  audit_log                           Immutable record of all significant system actions. 24+ defined action types. Actor type, ID, and display label for every entry.

  reserved_organizations              IOC-Direct reserved list. Canonical org name, email domain for dedup, alternate name variants, country, website.

  sudo_tokens                         One-time IOC sudo activation tokens. SHA-256 token hash, actor and target identity, 10-minute expiry, one-time-use enforcement.

  magic_link_tokens                   Public EoI applicant email verification tokens. SHA-256 hash, email, IP address, expiry, one-time-use enforcement.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Glossary

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Term**                            **Definition**
  ----------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  EoI                                 Expression of Interest --- public-facing form where media organisations apply to their NOC for press accreditation consideration.

  ENR                                 Extended Non-Rights Broadcaster --- broadcasters without Olympic media rights. In the current design, ENR requests are submitted by the NOC to the IOC; media orgs do not self-apply. ENR self-application via the EoI portal is under review (see Open Items).

  PbN                                 Press by Number --- the phase where NOCs formally allocate their IOC-assigned per-category quotas to specific media organisations, subject to OCOG approval.

  ACR                                 Accreditation system (LA28\'s platform). Receives the final approved press allocation data from MRP.

  Common Codes                        Shared organisation registry within the ACR system, maintained by D.TEC. Used across all accreditation categories.

  NOC                                 National Olympic Committee (206 worldwide). Primary owner of the EoI review process and PbN allocation for their territory.

  IF                                  International Federation. Same role as NOC for their sport\'s media quota management. No public EoI queue --- uses invited-org flow only.

  OCOG                                Organising Committee (LA28). Formally approves PbN quota allocations submitted by NOCs. Cross-NOC visibility on EoI.

  IOC                                 International Olympic Committee. Sets per-category quota totals per NOC. Manages ENR holdback pool (350 slots). Manages IOC-Direct reserved organisations.

  IOC-Direct                          Reserved list of major international media organisations (e.g. AFP, AP, Reuters, Xinhua) for which the IOC acts as Responsible Organisation, bypassing the normal NOC quota process.

  Responsible Organisation            The body that acts as the owning entity for a media organisation in the accreditation system. IOC for IOC-Direct orgs; NOC for regular orgs. (Term per IOC Media Operations feedback --- replaces \"sponsoring organisation\".)

  D.TEC                               Deloitte Olympic Technology. Builds and operates the MRP portal. Also maintains Common Codes.

  MRP                                 Media Registration Portal --- this system.

  NOC E                               Press Attaché category. NOC communications staff / press officers. Nominated directly by the NOC during PbN --- not available on the public EoI form.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
