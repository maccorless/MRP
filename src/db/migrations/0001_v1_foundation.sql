-- Migration: v1 foundation
-- Covers CRIT-01, CRIT-02, CRIT-03, MISS-04 and all new v1 tables

-- ─── New enums ───────────────────────────────────────────────────────────────

CREATE TYPE "org_status" AS ENUM ('active', 'inactive', 'banned', 'pending_review');
CREATE TYPE "pbn_state"  AS ENUM ('draft', 'noc_submitted', 'ocog_approved', 'sent_to_acr');
CREATE TYPE "enr_decision" AS ENUM ('granted', 'partial', 'denied');

-- Extend existing enums with new values (PG allows ADD VALUE, not DROP VALUE)
ALTER TYPE "actor_type"   ADD VALUE IF NOT EXISTS 'ocog_admin';
ALTER TYPE "actor_type"   ADD VALUE IF NOT EXISTS 'if_admin';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'pbn_approved';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'pbn_sent_to_acr';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'quota_changed';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'enr_submitted';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'enr_decision_made';

-- ─── MISS-04: event_id + org status on existing tables ───────────────────────

ALTER TABLE "organizations"
  ADD COLUMN "event_id" text NOT NULL DEFAULT 'LA28',
  ADD COLUMN "org_status" "org_status" NOT NULL DEFAULT 'active';

ALTER TABLE "applications"
  ADD COLUMN "event_id" text NOT NULL DEFAULT 'LA28';

-- ─── CRIT-03: if_code on admin_users ─────────────────────────────────────────

ALTER TABLE "admin_users"
  ADD COLUMN "if_code" text;

-- ─── CRIT-02: Replace category enum with boolean flags ───────────────────────

-- Step 1: Add the new columns (nullable first for migration safety)
ALTER TABLE "applications"
  ADD COLUMN "category_press" boolean,
  ADD COLUMN "category_photo" boolean;

-- Step 2: Migrate existing data
UPDATE "applications" SET "category_press" = true,  "category_photo" = false WHERE "category" = 'press';
UPDATE "applications" SET "category_press" = false, "category_photo" = true  WHERE "category" = 'photographer';
-- CRIT-01: ENR applications are invalid — flag them for manual NOC review
UPDATE "applications"
  SET "category_press" = false,
      "category_photo" = false,
      "review_note"    = COALESCE("review_note" || ' | ', '') || '[SYSTEM] Converted from invalid ENR EoI category — please reject or request resubmission.'
  WHERE "category" = 'enr';

-- Step 3: Set NOT NULL defaults now that data is migrated
--   ENR rows have false/false which violates business rules; set them to pending review
--   so the NOC can action them — but we can't enforce the check until after the drop below
ALTER TABLE "applications"
  ALTER COLUMN "category_press" SET NOT NULL,
  ALTER COLUMN "category_press" SET DEFAULT false,
  ALTER COLUMN "category_photo" SET NOT NULL,
  ALTER COLUMN "category_photo" SET DEFAULT false;

-- Step 4: Drop the old category column and enum
ALTER TABLE "applications" DROP COLUMN "category";
DROP TYPE "accreditation_category";

-- Step 5: Add constraint that at least one category must be true
--   (ENR-legacy rows with both false are excluded — they will be actioned by NOC)
--   We add this as a CHECK with a grace period comment; enforce strictly after seed cleanup
ALTER TABLE "applications"
  ADD CONSTRAINT "applications_category_at_least_one"
  CHECK ("category_press" = true OR "category_photo" = true OR "review_note" LIKE '%SYSTEM%');

-- ─── New tables ───────────────────────────────────────────────────────────────

CREATE TABLE "noc_quotas" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "noc_code"     text NOT NULL,
  "event_id"     text NOT NULL DEFAULT 'LA28',
  "press_total"  integer NOT NULL DEFAULT 0,
  "photo_total"  integer NOT NULL DEFAULT 0,
  "set_by"       text,
  "set_at"       timestamptz DEFAULT now(),
  "notes"        text
);

CREATE TABLE "org_slot_allocations" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  uuid NOT NULL REFERENCES "organizations"("id"),
  "noc_code"         text NOT NULL,
  "event_id"         text NOT NULL DEFAULT 'LA28',
  "press_slots"      integer NOT NULL DEFAULT 0,
  "photo_slots"      integer NOT NULL DEFAULT 0,
  "allocated_by"     text,
  "allocated_at"     timestamptz DEFAULT now(),
  "pbn_state"        "pbn_state" NOT NULL DEFAULT 'draft',
  "ocog_reviewed_by" text,
  "ocog_reviewed_at" timestamptz
);

CREATE TABLE "quota_changes" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "noc_code"      text NOT NULL,
  "event_id"      text NOT NULL DEFAULT 'LA28',
  "quota_type"    text NOT NULL,   -- 'press' | 'photo'
  "old_value"     integer NOT NULL,
  "new_value"     integer NOT NULL,
  "changed_by"    text NOT NULL,
  "changed_at"    timestamptz DEFAULT now(),
  "change_source" text NOT NULL    -- 'import' | 'manual_edit'
);

CREATE TABLE "enr_quotas" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "noc_code"    text NOT NULL,
  "event_id"    text NOT NULL DEFAULT 'LA28',
  "enr_total"   integer NOT NULL DEFAULT 0,
  "granted_by"  text,
  "granted_at"  timestamptz DEFAULT now()
);

CREATE TABLE "enr_requests" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "noc_code"         text NOT NULL,
  "event_id"         text NOT NULL DEFAULT 'LA28',
  "organization_id"  uuid NOT NULL REFERENCES "organizations"("id"),
  "priority_rank"    integer NOT NULL,
  "slots_requested"  integer NOT NULL,
  "slots_granted"    integer,
  "decision"         "enr_decision",
  "decision_notes"   text,
  "reviewed_by"      text,
  "reviewed_at"      timestamptz,
  "submitted_at"     timestamptz DEFAULT now()
);
