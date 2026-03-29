import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const orgTypeEnum = pgEnum("org_type", [
  "media_print_online",
  "media_broadcast",
  "news_agency",
  "enr", // Non-Rights Broadcaster
]);

export const accreditationCategoryEnum = pgEnum("accreditation_category", [
  "press",
  "photographer",
  "enr",
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
  name: text("name").notNull(),
  country: text("country").notNull(),         // ISO 3166-1 alpha-2
  nocCode: text("noc_code").notNull(),         // e.g. USA, FRA, JPN
  orgType: orgTypeEnum("org_type").notNull(),
  website: text("website"),
  emailDomain: text("email_domain").notNull(), // extracted from contact email for dedup
  commonCodesId: text("common_codes_id"),      // null until coded
  isMultiTerritoryFlag: boolean("is_multi_territory_flag").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Applications ─────────────────────────────────────────────────────────────

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(), // e.g. APP-2028-US-00051
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  nocCode: text("noc_code").notNull(),

  // Contact (MICO26 provisional fields)
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  category: accreditationCategoryEnum("category").notNull(),
  about: text("about").notNull(),

  // Status
  status: applicationStatusEnum("status").default("pending").notNull(),
  resubmissionCount: integer("resubmission_count").default(0).notNull(),

  // NOC review
  reviewNote: text("review_note"),             // latest return/rejection reason
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
  role: text("role").notNull(),                // "ioc_admin" | "noc_admin" | "ioc_readonly"
  nocCode: text("noc_code"),                   // null for IOC roles
  displayName: text("display_name").notNull(),
  // v1.0: replaced by D.TEC/DGP SSO — no password stored in production
  passwordHash: text("password_hash"),         // prototype only
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
