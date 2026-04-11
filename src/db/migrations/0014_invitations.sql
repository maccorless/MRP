-- Migration 0014: MISS-05 — Invited-org flow
--
-- Adds the invitations table for NOC/IF admin pre-addressed invite links.
-- Extends audit_action enum with invitation_created and invitation_accepted.
-- Updates the applications entry_source comment (constraint is text, no enum).
--
-- Note: ALTER TYPE … ADD VALUE is non-transactional in Postgres.

-- ─── invitations table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash       TEXT NOT NULL UNIQUE,
  noc_code         TEXT NOT NULL,
  created_by       UUID REFERENCES admin_users(id),
  prefill_data     JSONB NOT NULL DEFAULT '{}',
  recipient_email  TEXT,
  expires_at       TIMESTAMPTZ NOT NULL,
  used_at          TIMESTAMPTZ,
  accepted_app_id  UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Extend applications entry_source accepted values ─────────────────────────
-- The column is plain TEXT (no pg enum) so we update the CHECK constraint.
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_entry_source_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_entry_source_check
    CHECK (entry_source IN ('self_submitted', 'noc_direct', 'invited'));

-- ─── Audit action enum additions ─────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invitation_created';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invitation_accepted';
