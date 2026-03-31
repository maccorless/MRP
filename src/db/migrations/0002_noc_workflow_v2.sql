-- Migration: NOC workflow v2
-- EoI requested quantities + internal notes, ENR independent nominations

-- ─── EoI: requested quantities + internal note ──────────────────────────────

ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "requested_press" integer,
  ADD COLUMN IF NOT EXISTS "requested_photo" integer,
  ADD COLUMN IF NOT EXISTS "internal_note" text;

-- ─── ENR: independent nomination fields ─────────────────────────────────────

ALTER TABLE "enr_requests"
  ADD COLUMN IF NOT EXISTS "enr_org_name" text,
  ADD COLUMN IF NOT EXISTS "enr_website" text,
  ADD COLUMN IF NOT EXISTS "enr_description" text,
  ADD COLUMN IF NOT EXISTS "enr_justification" text,
  ADD COLUMN IF NOT EXISTS "must_have_slots" integer,
  ADD COLUMN IF NOT EXISTS "nice_to_have_slots" integer;

-- Make organizationId nullable (ENR orgs don't need an EoI record)
ALTER TABLE "enr_requests"
  ALTER COLUMN "organization_id" DROP NOT NULL;
