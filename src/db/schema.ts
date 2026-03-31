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
  "media_print_online",
  "media_broadcast",
  "news_agency",
  "enr", // Non-Rights Broadcaster — set by ENR workflow, not EoI self-nomination
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
  "export_generated",
  "pbn_submitted",
  "pbn_approved",
  "pbn_sent_to_acr",
  "quota_changed",
  "enr_submitted",
  "enr_decision_made",
  "sudo_initiated",
]);

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().default("LA28"),
  name: text("name").notNull(),
  country: text("country").notNull(),         // ISO 3166-1 alpha-2
  nocCode: text("noc_code").notNull(),         // e.g. USA, FRA, JPN
  orgType: orgTypeEnum("org_type").notNull(),
  website: text("website"),
  emailDomain: text("email_domain").notNull(), // extracted from contact email for dedup
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

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  additionalComments: text("additional_comments"),
  accessibilityNeeds: boolean("accessibility_needs"),

  // Status
  status: applicationStatusEnum("status").default("pending").notNull(),
  resubmissionCount: integer("resubmission_count").default(0).notNull(),

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── NOC Quotas (IOC-assigned press/photo totals per NOC) ─────────────────────

export const nocQuotas = pgTable("noc_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nocCode: text("noc_code").notNull(),
  eventId: text("event_id").notNull().default("LA28"),
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
  nocETotal: integer("noc_e_total").notNull().default(0), // Press attachés (separate formula-based pool)
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
  organizationId: uuid("organization_id").references(() => organizations.id), // nullable for direct nominations
  priorityRank: integer("priority_rank").notNull(),
  slotsRequested: integer("slots_requested").notNull(), // kept for backward compat; = mustHave + niceToHave
  slotsGranted: integer("slots_granted"),      // null until IOC decides
  decision: enrDecisionEnum("decision"),   // null until IOC decides
  decisionNotes: text("decision_notes"),
  reviewedBy: text("reviewed_by"),             // IOC admin user id
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),

  // v2: independent nomination fields (org may not exist in organizations table)
  enrOrgName: text("enr_org_name"),
  enrWebsite: text("enr_website"),
  enrDescription: text("enr_description"),
  enrJustification: text("enr_justification"),
  mustHaveSlots: integer("must_have_slots"),
  niceToHaveSlots: integer("nice_to_have_slots"),
});

// ─── Reserved Organizations (IOC-direct — bypass NOC quota) ──────────────────
//
// AFP, AP, Reuters, Xinhua, and similar orgs are allocated directly by the IOC.
// The IOC acts as their "NOC" using noc_code = 'IOC_DIRECT'.
// When a real NOC submits an EoI from an org whose email domain or name matches
// a reserved entry, they receive a dedup warning and the application is blocked.
// The IOC admin manages this list before the EoI window opens.

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
