-- B2: Content management tables for PRP Admin CMS
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');

CREATE TABLE IF NOT EXISTS "content_strings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "section" text NOT NULL,
  "key" text NOT NULL,
  "language" text NOT NULL,
  "value" text NOT NULL,
  "status" "content_status" NOT NULL DEFAULT 'draft',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" uuid REFERENCES "admin_users"("id"),
  UNIQUE ("section", "key", "language")
);

CREATE TABLE IF NOT EXISTS "section_publish_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "section" text NOT NULL,
  "language" text NOT NULL,
  "status" "content_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "published_by" uuid REFERENCES "admin_users"("id"),
  UNIQUE ("section", "language")
);

CREATE INDEX IF NOT EXISTS "content_strings_section_lang_idx" ON "content_strings" ("section", "language");
