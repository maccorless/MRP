-- Migration 0017: Add freelancer org type and sports_specific_sport field
--
-- 1. Adds 'freelancer' value to org_type enum (for freelance journalists/photographers)
-- 2. Adds sports_specific_sport column to applications (structured sport name for Es/EPs category requests)

ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'freelancer';

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS sports_specific_sport TEXT;
