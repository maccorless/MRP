-- Migration 0026: /applyb Excel-spec alignment (LA28 Apr 2026)
--
-- Adds new org_type enum values to match the Excel source-of-truth field list,
-- and new application columns for Editor-in-Chief contact, Non-MRH sub-type,
-- organisation office phone, GDPR acceptance, and ENR as a 7th accreditation
-- category (max 3).
--
-- Legacy enum values (media_broadcast, news_agency, enr, freelancer,
-- media_print_online) are retained to preserve existing rows; they are simply
-- hidden from the /applyb dropdown.

-- Org type enum — add Excel-aligned values
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'print_media';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'press_agency';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'photo_agency';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'editorial_website';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'sport_specialist_website';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'photographer';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'freelance_journalist';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'freelance_photographer';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'sport_specialist_print';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'sport_specialist_photographer';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'non_mrh';

-- Applications table — new columns
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "editor_in_chief_first_name" text,
  ADD COLUMN IF NOT EXISTS "editor_in_chief_last_name" text,
  ADD COLUMN IF NOT EXISTS "editor_in_chief_email" text,
  ADD COLUMN IF NOT EXISTS "org_phone" text,
  ADD COLUMN IF NOT EXISTS "non_mrh_media_type" text,
  ADD COLUMN IF NOT EXISTS "non_mrh_media_type_other" text,
  ADD COLUMN IF NOT EXISTS "category_enr" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requested_enr" integer,
  ADD COLUMN IF NOT EXISTS "gdpr_accepted_at" timestamp with time zone;
