-- Migration 0007: Sprint B1/B3/B4 schema additions
--
-- B4: applications.entry_source — distinguishes self-submitted vs NOC-direct entries
-- B3: noc_eoi_windows — per-NOC submission window open/close control
-- B1/B3/B4: extend audit_action enum with new action types
--
-- Note: ALTER TYPE … ADD VALUE is non-transactional in Postgres and must
-- run outside a transaction block. The migration runner handles this.

-- ─── B4: entry_source on applications ────────────────────────────────────────
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS entry_source text NOT NULL DEFAULT 'self_submitted';
-- Values: 'self_submitted' | 'noc_direct'

-- ─── B3: per-NOC EoI submission window ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS noc_eoi_windows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  noc_code    TEXT NOT NULL,
  event_id    TEXT NOT NULL DEFAULT 'LA28',
  is_open     BOOLEAN NOT NULL DEFAULT true,
  opened_at   TIMESTAMPTZ DEFAULT NOW(),
  closed_at   TIMESTAMPTZ,
  toggled_by  TEXT,
  toggled_at  TIMESTAMPTZ DEFAULT NOW(),
  notes       TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_noc_eoi_window
  ON noc_eoi_windows (noc_code, event_id);

-- ─── Audit action enum additions ─────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'noc_direct_entry';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'eoi_window_toggled';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'application_unapproved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'application_unreturned';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'pbn_unapproved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'enr_decision_revised';
