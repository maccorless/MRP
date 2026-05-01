-- Migration 0029: add preferred_language to applications
-- Persists the applicant's chosen UI language (from URL ?lang= param) at submission time.
-- Used to send receipts and magic-link emails in the applicant's preferred language.

CREATE TYPE "public"."preferred_lang" AS ENUM('EN', 'FR', 'ES');

ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "preferred_language" "preferred_lang";
