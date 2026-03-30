-- Migration: NOC workflow v2
-- EoI requested quantities + internal notes, ENR independent nominations

-- ─── EoI: requested quantities + internal note ──────────────────────────────

ALTER TABLE "applications"
  ADD COLUMN "requested_press" integer,
  ADD COLUMN "requested_photo" integer,
  ADD COLUMN "internal_note" text;

-- ─── ENR: independent nomination fields ─────────────────────────────────────

ALTER TABLE "enr_requests"
  ADD COLUMN "enr_org_name" text,
  ADD COLUMN "enr_website" text,
  ADD COLUMN "enr_description" text,
  ADD COLUMN "enr_justification" text,
  ADD COLUMN "must_have_slots" integer,
  ADD COLUMN "nice_to_have_slots" integer;

-- Make organizationId nullable (ENR orgs don't need an EoI record)
ALTER TABLE "enr_requests"
  ALTER COLUMN "organization_id" DROP NOT NULL;
