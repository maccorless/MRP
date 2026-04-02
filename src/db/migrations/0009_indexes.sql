-- Migration 0009: Add missing indexes for production query performance
--
-- Every NOC page filters applications by noc_code; without an index this is
-- a full table scan that grows with every submission.
--
-- The applicant status portal filters by contact_email on a public-facing page.
--
-- Every PbN page (NOC and OCOG) joins/filters org_slot_allocations on
-- (noc_code, event_id); the composite index covers both access patterns.
--
-- noc_quotas has at most one row per (noc_code, event_id); the unique
-- constraint enforces that invariant and doubles as an efficient point lookup.

CREATE INDEX IF NOT EXISTS idx_applications_noc_code
  ON applications (noc_code);

CREATE INDEX IF NOT EXISTS idx_applications_contact_email
  ON applications (contact_email);

CREATE INDEX IF NOT EXISTS idx_org_slot_allocations_noc_event
  ON org_slot_allocations (noc_code, event_id);

-- De-duplicate noc_quotas before adding the unique constraint.
-- Keep one row per (noc_code, event_id); discard the rest by ctid.
DELETE FROM noc_quotas
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM noc_quotas
  GROUP BY noc_code, event_id
);

ALTER TABLE noc_quotas
  ADD CONSTRAINT noc_quotas_noc_event_unique
  UNIQUE (noc_code, event_id);
