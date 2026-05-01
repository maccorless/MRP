import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orgTypeEnum = pgEnum("org_type", [
  // Legacy values — kept for existing rows; hidden from /applyb dropdown
  "media_print_online",    // legacy: replaced by "print_media"
  "media_broadcast",       // legacy: IOC does not accredit Broadcast; hidden
  "news_agency",           // legacy: replaced by "press_agency"
  "enr",                   // legacy: ENR is a category, not an org type; replaced by "non_mrh"
  "freelancer",            // legacy: split into freelance_journalist / freelance_photographer
  "ino",                   // IOC-Direct workflow
  "if_staff",              // IOC-Direct workflow with IF-Staff flag

  // Excel-aligned values (LA28 Apr 2026 spec)
  "print_media",                    // Print (Newspaper/Magazine)
  "press_agency",                   // Press Agency
  "photo_agency",                   // Photo Agency
  "editorial_website",              // Editorial Website
  "sport_specialist_website",       // Sport Specialist Website
  "photographer",                   // Staff Photographer (non-freelance)
  "freelance_journalist",           // Freelance Journalist
  "freelance_photographer",         // Freelance Photographer
  "sport_specialist_print",         // Sport Specialist Print
  "sport_specialist_photographer",  // Sport Specialist Photographer
  "non_mrh",                        // Non-Media Rights-Holding Radio/TV

  "other",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",       // submitted, awaiting NOC review
  "approved",      // NOC approved
  "returned",      // NOC returned for corrections
  "resubmitted",   // applicant corrected and resubmitted
  "rejected",      // NOC rejected (permanent)
]);

export const actorTypeEnum = pgEnum("actor_type", [
  "applicant",
  "noc_admin",
  "ioc_admin",
  "ocog_admin",
  "if_admin",
  "system",
  "prp_admin",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "application_submitted",
  "application_resubmitted",
  "application_approved",
  "application_returned",
  "application_rejected",
  "email_verified",
  "admin_login",
  "duplicate_flag_raised",
  "duplicate_resolved",
  "export_generated",
  "pbn_submitted",
  "pbn_approved",
  "pbn_sent_to_acr",
  "quota_changed",
  "enr_submitted",
  "enr_decision_made",
  "sudo_initiated",
  // B4
  "noc_direct_entry",
  // B3
  "eoi_window_toggled",
  // B1 reversals
  "application_unapproved",
  "application_unreturned",
  "pbn_unapproved",
  "enr_decision_revised",
  // Feature flags
  "feature_flag_state_changed",
  "feature_flag_enrollment_changed",
  // MISS-05 — invited-org flow
  "invitation_created",
  "invitation_accepted",
  // B1 — rejection reversal
  "rejection_reversed",
  "unreject",
  // 2026-04-26 — cancel a PbN entry entered by mistake (Emma feedback #9)
  "noc_pbn_cancel",
  // 2026-04-30 — email receipt sent to applicant on submission
  "eoi_receipt_sent",
  // 2026-04-30 — Excel PbN re-import overwrote allocation values
  "excel_reimport",
]);

export const flagStateEnum = pgEnum("flag_state", ["off", "canary", "on"]);

export const preferredLangEnum = pgEnum("preferred_lang", ["EN", "FR", "ES"]);

export const pbnStateEnum = pgEnum("pbn_state", [
  "draft",
  "noc_submitted",
  "ocog_approved",
  "sent_to_acr",
]);

export const enrDecisionEnum = pgEnum("enr_decision", [
  "granted",
  "partial",
  "denied",
]);

export const orgStatusEnum = pgEnum("org_status", [
  "active",
  "inactive",
  "banned",
  "pending_review",
]);

// ─── Magic Link Tokens (applicant auth) ──────────────────────────────────────

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().default("LA28"),
  name: text("name").notNull(),
  country: text("country"),                    // ISO 3166-1 alpha-2; null for ENR-only orgs
  nocCode: text("noc_code").notNull(),         // e.g. USA, FRA, JPN
  orgType: orgTypeEnum("org_type").notNull(),
  website: text("website"),
  emailDomain: text("email_domain"),           // extracted from contact email; null for ENR-only orgs
  commonCodesId: text("common_codes_id"),      // null until coded
  status: orgStatusEnum("org_status").notNull().default("active"),
  isMultiTerritoryFlag: boolean("is_multi_territory_flag").default(false).notNull(),

  // Address (v2 expansion)
  address: text("address"),
  address2: text("address2"),
  city: text("city"),
  stateProvince: text("state_province"),
  postalCode: text("postal_code"),
  isFreelancer: boolean("is_freelancer"),

  orgEmail: text("org_email"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  contactInfoUpdatedAt: timestamp("contact_info_updated_at", { withTimezone: true }),
  countryFlagged: boolean("country_flagged").notNull().default(false),
});

// ─── Applications ─────────────────────────────────────────────────────────────

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().default("LA28"),
  referenceNumber: text("reference_number").notNull().unique(), // e.g. APP-2028-USA-00051
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  nocCode: text("noc_code").notNull(),

  // Contact — primary
  contactName: text("contact_name").notNull(),  // backward compat: firstName + " " + lastName
  contactEmail: text("contact_email").notNull(),
  contactFirstName: text("contact_first_name"),
  contactLastName: text("contact_last_name"),
  contactTitle: text("contact_title"),
  contactPhone: text("contact_phone"),
  contactCell: text("contact_cell"),

  // Contact — secondary
  secondaryFirstName: text("secondary_first_name"),
  secondaryLastName: text("secondary_last_name"),
  secondaryTitle: text("secondary_title"),
  secondaryEmail: text("secondary_email"),
  secondaryPhone: text("secondary_phone"),
  secondaryCell: text("secondary_cell"),

  // Category — legacy press/photo flags (kept for backward compat; derived from E-category flags below)
  categoryPress: boolean("category_press").notNull().default(false),
  categoryPhoto: boolean("category_photo").notNull().default(false),

  // E-category accreditation types (checkboxes on EoI form)
  categoryE:   boolean("category_e").notNull().default(false),   // Journalist
  categoryEs:  boolean("category_es").notNull().default(false),  // Sport-specific journalist
  categoryEp:  boolean("category_ep").notNull().default(false),  // Photographer
  categoryEps: boolean("category_eps").notNull().default(false), // Sport-specific photographer
  categoryEt:  boolean("category_et").notNull().default(false),  // Technician
  categoryEc:  boolean("category_ec").notNull().default(false),  // Support staff

  // Requested slot quantities per category (from EoI form)
  requestedPress: integer("requested_press"),   // legacy
  requestedPhoto: integer("requested_photo"),   // legacy
  requestedE:   integer("requested_e"),
  requestedEs:  integer("requested_es"),
  requestedEp:  integer("requested_ep"),
  requestedEps: integer("requested_eps"),
  requestedEt:  integer("requested_et"),
  requestedEc:  integer("requested_ec"),

  about: text("about").notNull(),

  // Publication details
  publicationTypes: jsonb("publication_types"),       // e.g. ["magazine","website","podcast"]
  circulation: text("circulation"),
  publicationFrequency: text("publication_frequency"),

  // Accreditation history
  priorOlympic: boolean("prior_olympic"),
  priorOlympicYears: text("prior_olympic_years"),
  priorParalympic: boolean("prior_paralympic"),
  priorParalympicYears: text("prior_paralympic_years"),
  pastCoverageExamples: text("past_coverage_examples"),
  sportsToCover: text("sports_to_cover"),
  sportsSpecificSport: text("sports_specific_sport"),
  orgTypeOther: text("org_type_other"),
  pressCard: boolean("press_card"),
  pressCardIssuer: text("press_card_issuer"),
  enrProgrammingType: text("enr_programming_type"),
  onlineUniqueVisitors: text("online_unique_visitors"),
  geographicalCoverage: text("geographical_coverage"),
  socialMediaAccounts: text("social_media_accounts"),
  additionalComments: text("additional_comments"),
  accessibilityNeeds: boolean("accessibility_needs"),

  // Editor-in-Chief contact (LA28 Apr 2026 spec) — optional for freelance org types
  editorInChiefFirstName: text("editor_in_chief_first_name"),
  editorInChiefLastName: text("editor_in_chief_last_name"),
  editorInChiefEmail: text("editor_in_chief_email"),

  // Organisation office phone (LA28 Apr 2026 spec) — with country code
  orgPhone: text("org_phone"),

  // Non-MRH sub-type (shown when org_type = non_mrh)
  nonMrhMediaType: text("non_mrh_media_type"),             // 'television' | 'radio' | 'other'
  nonMrhMediaTypeOther: text("non_mrh_media_type_other"),  // free text when above = 'other'

  // ENR as 7th accreditation category (LA28 Apr 2026 spec; max 3)
  categoryEnr: boolean("category_enr").notNull().default(false),
  requestedEnr: integer("requested_enr"),

  // Preferred language of the applicant (persisted from URL lang param at submission)
  preferredLanguage: preferredLangEnum("preferred_language"),

  // GDPR / privacy disclaimer acceptance (required)
  gdprAcceptedAt: timestamp("gdpr_accepted_at", { withTimezone: true }),

  // Entry source — how this application entered the system
  entrySource: text("entry_source").notNull().default("self_submitted"), // 'self_submitted' | 'noc_direct' | 'invited'

  // Status
  status: applicationStatusEnum("status").default("pending").notNull(),
  resubmissionCount: integer("resubmission_count").default(0).notNull(),
  enrRank: integer("enr_rank"),

  // Contact email transfer — set when NOC admin updates contactEmail
  previousContactEmail: text("previous_contact_email"),

  // NOC review
  reviewNote: text("review_note"),             // latest return/rejection reason
  internalNote: text("internal_note"),         // NOC-only, never shown to applicant
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),             // admin user id

  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Audit Log (append-only) ──────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorId: text("actor_id"),                   // user id or email
  actorLabel: text("actor_label"),             // display name e.g. "S. Kim (USOPC)"
  action: auditActionEnum("action").notNull(),
  applicationId: uuid("application_id").references(() => applications.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  detail: text("detail"),                      // free-text reason or note
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Admin Users ──────────────────────────────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  // "ioc_admin" | "ioc_readonly" | "noc_admin" | "ocog_admin" | "if_admin"
  role: text("role").notNull(),
  nocCode: text("noc_code"),                   // set for noc_admin
  ifCode: text("if_code"),                     // set for if_admin (e.g. "ATH")
  displayName: text("display_name").notNull(),
  // v1.0: replaced by D.TEC/DGP SSO — no password stored in production
  passwordHash: text("password_hash"),         // prototype only
  canaryFlags: jsonb("canary_flags"),          // string[] of feature flag names; null = no canary memberships
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Many-to-many additional roles for admin users (beyond their primary role).
// Foundational for PRP Admin role (B1). At v1.0 replaced by SSO group memberships.
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => adminUsers.id).notNull(),
  role: text("role").notNull(),                   // e.g. "prp_admin"
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  grantedBy: uuid("granted_by").references(() => adminUsers.id),
});

// ─── Content Management (B2) ───────────────────────────────────────────────────

export const contentStatusEnum = pgEnum("content_status", ["draft", "published"]);

// Per-key draft/published content strings, keyed by (section, key, language).
// At runtime, published strings are merged on top of the bundled i18n fallback.
export const contentStrings = pgTable("content_strings", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(),
  key: text("key").notNull(),
  language: text("language").notNull(),           // "EN" | "FR" | "ES"
  value: text("value").notNull(),
  status: contentStatusEnum("status").notNull().default("draft"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id),
});

// Publish state per (section, language). Drives language toggle visibility for users.
export const sectionPublishState = pgTable("section_publish_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(),
  language: text("language").notNull(),           // "EN" | "FR" | "ES"
  status: contentStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedBy: uuid("published_by").references(() => adminUsers.id),
});

// ─── NOC Quotas (IOC-assigned press/photo totals per NOC) ─────────────────────

export const nocQuotas = pgTable("noc_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  entityType: text("entity_type").notNull().default("noc"), // 'noc' | 'if'
  // Legacy totals (kept for compat; = eTotal + esTotal + etTotal + ecTotal and epTotal + epsTotal respectively)
  pressTotal: integer("press_total").notNull().default(0),
  photoTotal: integer("photo_total").notNull().default(0),
  // Per-category quota totals (IOC-assigned)
  eTotal:   integer("e_total").notNull().default(0),   // Journalist
  esTotal:  integer("es_total").notNull().default(0),  // Sport-specific journalist
  epTotal:  integer("ep_total").notNull().default(0),  // Photographer
  epsTotal: integer("eps_total").notNull().default(0), // Sport-specific photographer
  etTotal:  integer("et_total").notNull().default(0),  // Technician
  ecTotal:  integer("ec_total").notNull().default(0),  // Support staff
  nocETotal: integer("noc_e_total").notNull().default(0), // Press attachés quota (IOC-assigned)
  nocERequested: integer("noc_e_requested"),              // NOC's requested NocE count (null = not yet set; defaults to nocETotal on display)
  nocEsTotal: integer("noc_es_total").notNull().default(0), // Sport-specific press attachés quota (added 2026-04-26 per Emma #197)
  setBy: text("set_by"),                       // IOC admin user id
  setAt: timestamp("set_at", { withTimezone: true }).defaultNow(),
  notes: text("notes"),
});

// ─── Org Slot Allocations (NOC assigns slots per approved org in PbN) ─────────

export const orgSlotAllocations = pgTable("org_slot_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  // Legacy slot counts (kept for compat)
  pressSlots: integer("press_slots").notNull().default(0),
  photoSlots: integer("photo_slots").notNull().default(0),
  // Per-category slot allocations (NOC-assigned in PbN)
  eSlots:   integer("e_slots").notNull().default(0),   // Journalist
  esSlots:  integer("es_slots").notNull().default(0),  // Sport-specific journalist
  epSlots:  integer("ep_slots").notNull().default(0),  // Photographer
  epsSlots: integer("eps_slots").notNull().default(0), // Sport-specific photographer
  etSlots:  integer("et_slots").notNull().default(0),  // Technician
  ecSlots:  integer("ec_slots").notNull().default(0),  // Support staff
  nocESlots: integer("noc_e_slots").notNull().default(0), // Press attachés
  nocEsSlots: integer("noc_es_slots").notNull().default(0), // Sport-specific press attachés (added 2026-04-26 per Emma #197)
  allocatedBy: text("allocated_by"),           // NOC admin user id
  allocatedAt: timestamp("allocated_at", { withTimezone: true }).defaultNow(),
  pbnState: pbnStateEnum("pbn_state").notNull().default("draft"),
  ocogReviewedBy: text("ocog_reviewed_by"),
  ocogReviewedAt: timestamp("ocog_reviewed_at", { withTimezone: true }),
});

// ─── Quota Changes (audit log for import + manual edits) ─────────────────────

export const quotaChanges = pgTable("quota_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  quotaType: text("quota_type").notNull(),     // "press" | "photo"
  oldValue: integer("old_value").notNull(),
  newValue: integer("new_value").notNull(),
  changedBy: text("changed_by").notNull(),     // IOC admin user id
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
  changeSource: text("change_source").notNull(), // "import" | "manual_edit"
});

// ─── ENR Quotas (IOC holdback pool per NOC) ───────────────────────────────────

export const enrQuotas = pgTable("enr_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  enrTotal: integer("enr_total").notNull().default(0),
  grantedBy: text("granted_by"),               // IOC admin user id
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
});

// ─── ENR Requests (NOC prioritised list, IOC decides per org) ─────────────────

export const enrRequests = pgTable("enr_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  priorityRank: integer("priority_rank").notNull(),
  slotsRequested: integer("slots_requested").notNull(), // kept for backward compat; = mustHave + niceToHave
  slotsGranted: integer("slots_granted"),      // null until IOC decides
  decision: enrDecisionEnum("decision"),   // null until IOC decides
  decisionNotes: text("decision_notes"),
  reviewedBy: text("reviewed_by"),             // IOC admin user id
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),

  // ENR-specific nomination details (org is always in organizations table, orgType='enr')
  enrWebsite: text("enr_website"),
  enrDescription: text("enr_description"),
  enrJustification: text("enr_justification"),
  mustHaveSlots: integer("must_have_slots"),
  niceToHaveSlots: integer("nice_to_have_slots"),
});

// ─── Sudo Tokens ─────────────────────────────────────────────────────────────
// One-time tokens allowing an IOC admin to open a read-only session as another
// admin user. Consumed on first use; expire after 10 minutes if unused.

export const sudoTokens = pgTable("sudo_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  // The IOC admin who initiated the sudo
  actorId: text("actor_id").notNull(),
  actorLabel: text("actor_label").notNull(),
  // The target user to impersonate
  targetEmail: text("target_email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── NOC EoI Windows (B3 — per-NOC submission window control) ────────────────
// Absence of a row means the window is OPEN (safe default).
// NOC admin toggles is_open; public /apply form checks before issuing a token.

export const nocEoiWindows = pgTable("noc_eoi_windows", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  isOpen: boolean("is_open").notNull().default(true),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  toggledBy: text("toggled_by"),    // admin user id
  toggledAt: timestamp("toggled_at", { withTimezone: true }).defaultNow(),
  notes: text("notes"),
});

// ─── Application Reference Number Sequences ──────────────────────────────────
// Atomic per-NOC counters. Use nextApplicationSeq() from @/lib/ref-seq to get
// the next value — never read this table directly for seq generation.

export const applicationSequences = pgTable("application_sequences", {
  nocCode: text("noc_code").primaryKey(),
  seq: integer("seq").notNull().default(0),
});

// ─── Feature Flags ────────────────────────────────────────────────────────────
// Two-tier system: global state (off/canary/on) + per-user canary membership.
// Global state changes take effect immediately on next request (live DB read).
// Per-user canary membership is baked into the session cookie at login.

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),        // e.g. "new_pbn_ui"
  state: flagStateEnum("state").notNull().default("off"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Reserved Organizations ───────────────────────────────────────────────────

export const reservedOrganizations = pgTable("reserved_organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().default("LA28"),
  name: text("name").notNull(),                     // canonical org name
  emailDomain: text("email_domain"),                // primary domain for dedup (nullable for orgs with many domains)
  alternateNames: jsonb("alternate_names"),          // string[] — other known names/variants
  website: text("website"),
  country: text("country"),                         // ISO 3166-1 alpha-2
  notes: text("notes"),                             // e.g. "IOC recognised world news agency"
  addedBy: text("added_by"),                        // IOC admin user id
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Event Settings (IOC-configurable per-event parameters) ──────────────────

export const eventSettings = pgTable("event_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().unique().default("LA28"),
  capacity: integer("capacity").notNull().default(6000),
  iocHoldback: integer("ioc_holdback").notNull().default(0),
  enrPoolSize: integer("enr_pool_size").notNull().default(350),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Invitations (MISS-05 — NOC/IF invited-org flow) ─────────────────────────
// NOC and IF admins create invite links that pre-fill the EoI form for known orgs.
// Token is stored hashed; raw token is only in the shareable URL.

// ─── Dismissed Duplicate Pairs ───────────────────────────────────────────────
// When a NOC admin confirms two flagged applications are not duplicates,
// a record is stored here so they no longer appear as warnings in the queue.
// Pairs are stored with orgIdA < orgIdB (UUID string order) for uniqueness.

export const dismissedDuplicatePairs = pgTable("dismissed_duplicate_pairs", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
  orgIdA: uuid("org_id_a").references(() => organizations.id).notNull(),
  orgIdB: uuid("org_id_b").references(() => organizations.id).notNull(),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }).defaultNow().notNull(),
  dismissedBy: text("dismissed_by").notNull(),
});

export const invitations = pgTable("invitations", {
  id:             uuid("id").defaultRandom().primaryKey(),
  tokenHash:      text("token_hash").notNull().unique(),
  nocCode:        text("noc_code").notNull(),
  createdBy:      uuid("created_by").references(() => adminUsers.id),
  prefillData:    jsonb("prefill_data").notNull().default({}),
  recipientEmail: text("recipient_email"),            // nullable — NOC may not know email yet
  expiresAt:      timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt:         timestamp("used_at", { withTimezone: true }),           // null = unused
  acceptedAppId:  uuid("accepted_app_id"),            // FK to applications.id on conversion
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
