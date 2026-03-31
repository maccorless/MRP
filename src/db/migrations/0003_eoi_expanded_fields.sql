-- Migration: EoI expanded fields
-- Adds contact details, publication info, accreditation history, org address

-- Applications: expanded contact fields
ALTER TABLE "applications"
  ADD COLUMN "contact_first_name" text,
  ADD COLUMN "contact_last_name" text,
  ADD COLUMN "contact_title" text,
  ADD COLUMN "contact_phone" text,
  ADD COLUMN "contact_cell" text,
  ADD COLUMN "secondary_first_name" text,
  ADD COLUMN "secondary_last_name" text,
  ADD COLUMN "secondary_title" text,
  ADD COLUMN "secondary_email" text,
  ADD COLUMN "secondary_phone" text,
  ADD COLUMN "secondary_cell" text;

-- Applications: publication details
ALTER TABLE "applications"
  ADD COLUMN "publication_types" jsonb,
  ADD COLUMN "circulation" text,
  ADD COLUMN "publication_frequency" text;

-- Applications: accreditation history
ALTER TABLE "applications"
  ADD COLUMN "prior_olympic" boolean,
  ADD COLUMN "prior_olympic_years" text,
  ADD COLUMN "prior_paralympic" boolean,
  ADD COLUMN "prior_paralympic_years" text,
  ADD COLUMN "past_coverage_examples" text,
  ADD COLUMN "sports_to_cover" text,
  ADD COLUMN "additional_comments" text,
  ADD COLUMN "accessibility_needs" boolean;

-- Organizations: address + freelancer
ALTER TABLE "organizations"
  ADD COLUMN "address" text,
  ADD COLUMN "address2" text,
  ADD COLUMN "city" text,
  ADD COLUMN "state_province" text,
  ADD COLUMN "postal_code" text,
  ADD COLUMN "is_freelancer" boolean;
