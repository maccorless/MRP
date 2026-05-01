ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "previous_contact_email" text;
