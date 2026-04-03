-- Migration 0011: Indexes for audit_log query performance
--
-- The audit trail page runs three classes of queries:
--   1. Full scan ordered by created_at DESC with LIMIT/OFFSET (all pages, no filter)
--   2. Filtered scan: WHERE action = ? (or actor_type = ?) ORDER BY created_at DESC
--   3. Date range scan: WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC
--   4. NOC scope: LEFT JOIN on organization_id + actor_id
--
-- Without these indexes every page load is a full table scan that grows with
-- every event written to the log.

-- Primary sort index — covers ORDER BY created_at DESC and date range filters.
-- The DESC matches the query order so Postgres can satisfy LIMIT without sorting.
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);

-- Composite: action equality + sort. Covers "show me all approvals" style filters.
-- The leading action column handles the WHERE; created_at handles ORDER BY.
CREATE INDEX IF NOT EXISTS idx_audit_log_action_created_at
  ON audit_log (action, created_at DESC);

-- Composite: actor_type equality + sort. Covers "show me all noc_admin entries".
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_type_created_at
  ON audit_log (actor_type, created_at DESC);

-- NOC scope LEFT JOIN: audit_log.organization_id → organizations.id
-- Without this, the join is a full scan of audit_log for each NOC page load.
CREATE INDEX IF NOT EXISTS idx_audit_log_organization_id
  ON audit_log (organization_id);

-- NOC scope LEFT JOIN: audit_log.actor_id = admin_users.id::text
-- actor_id is stored as text; the join casts admin_users.id (uuid) to text.
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id
  ON audit_log (actor_id);

-- Optional: trigram index for ILIKE '%term%' searches on actorLabel and detail.
-- Standard btree indexes cannot accelerate leading-wildcard patterns.
-- Uncomment when pg_trgm is confirmed available in the target Postgres instance.
-- At tens-of-thousands of rows a seq scan is still fast (<50ms); enable this
-- before the table reaches ~500k rows or if actor name search becomes slow.
--
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_audit_log_actor_label_trgm ON audit_log USING gin (actor_label gin_trgm_ops);
-- CREATE INDEX idx_audit_log_detail_trgm       ON audit_log USING gin (detail gin_trgm_ops);
