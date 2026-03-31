-- Migration: EoI expanded fields
-- Adds contact details, publication info, accreditation history, org address

-- Applications: expanded contact fields
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "contact_first_name" text,
  ADD COLUMN IF NOT EXISTS "contact_last_name" text,
  ADD COLUMN IF NOT EXISTS "contact_title" text,
  ADD COLUMN IF NOT EXISTS "contact_phone" text,
  ADD COLUMN IF NOT EXISTS "contact_cell" text,
  ADD COLUMN IF NOT EXISTS "secondary_first_name" text,
  ADD COLUMN IF NOT EXISTS "secondary_last_name" text,
  ADD COLUMN IF NOT EXISTS "secondary_title" text,
  ADD COLUMN IF NOT EXISTS "secondary_email" text,
  ADD COLUMN IF NOT EXISTS "secondary_phone" text,
  ADD COLUMN IF NOT EXISTS "secondary_cell" text;

-- Applications: publication details
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "publication_types" jsonb,
  ADD COLUMN IF NOT EXISTS "circulation" text,
  ADD COLUMN IF NOT EXISTS "publication_frequency" text;

-- Applications: accreditation history
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "prior_olympic" boolean,
  ADD COLUMN IF NOT EXISTS "prior_olympic_years" text,
  ADD COLUMN IF NOT EXISTS "prior_paralympic" boolean,
  ADD COLUMN IF NOT EXISTS "prior_paralympic_years" text,
  ADD COLUMN IF NOT EXISTS "past_coverage_examples" text,
  ADD COLUMN IF NOT EXISTS "sports_to_cover" text,
  ADD COLUMN IF NOT EXISTS "additional_comments" text,
  ADD COLUMN IF NOT EXISTS "accessibility_needs" boolean;

-- Organizations: address + freelancer
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "address" text,
  ADD COLUMN IF NOT EXISTS "address2" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "state_province" text,
  ADD COLUMN IF NOT EXISTS "postal_code" text,
  ADD COLUMN IF NOT EXISTS "is_freelancer" boolean;
