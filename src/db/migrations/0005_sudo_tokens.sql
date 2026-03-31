-- 0005_sudo_tokens.sql
-- Adds sudo_tokens table and sudo_initiated audit action

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'sudo_initiated';

CREATE TABLE IF NOT EXISTS sudo_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  TEXT NOT NULL UNIQUE,
  actor_id    TEXT NOT NULL,
  actor_label TEXT NOT NULL,
  target_email TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
