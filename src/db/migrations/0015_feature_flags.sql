-- Migration 0014: Feature flag / canary rollout system
--
-- Adds:
--   - flag_state enum  ('off' | 'canary' | 'on')
--   - feature_flags table  (name, state, description, timestamps)
--   - canary_flags jsonb column on admin_users  (string[] of flag names)
--   - audit_action enum additions:
--       feature_flag_state_changed
--       feature_flag_enrollment_changed
--
-- Note: ALTER TYPE … ADD VALUE is non-transactional in Postgres and must
-- run outside a transaction block. The migration runner handles this.

-- ─── New enum: flag_state ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE flag_state AS ENUM ('off', 'canary', 'on');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── feature_flags table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  state       flag_state  NOT NULL DEFAULT 'off',
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── canary_flags column on admin_users ──────────────────────────────────────
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS canary_flags JSONB;

-- ─── Extend audit_action enum ────────────────────────────────────────────────
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'feature_flag_state_changed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'feature_flag_enrollment_changed';
