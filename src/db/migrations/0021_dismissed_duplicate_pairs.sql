-- Dismissed duplicate pairs: stores org pairs a NOC admin has confirmed are NOT duplicates
CREATE TABLE IF NOT EXISTS "dismissed_duplicate_pairs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "noc_code" text NOT NULL,
  "event_id" text NOT NULL DEFAULT 'LA28',
  "org_id_a" uuid NOT NULL REFERENCES "organizations"("id"),
  "org_id_b" uuid NOT NULL REFERENCES "organizations"("id"),
  "dismissed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "dismissed_by" text NOT NULL,
  CONSTRAINT "dismissed_duplicate_pairs_unique" UNIQUE ("org_id_a", "org_id_b")
);

ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'duplicate_resolved';
