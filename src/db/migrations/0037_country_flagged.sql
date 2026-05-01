ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "country_flagged" boolean NOT NULL DEFAULT false;
