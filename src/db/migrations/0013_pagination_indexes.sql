-- Migration 0013: Indexes for DB-level pagination and IOC dashboard aggregations
--
-- Three new indexes to support:
--   1. NOC queue status filter + sort (noc_code, status, submitted_at DESC)
--      Covers: WHERE noc_code = ? AND status = ? ORDER BY submitted_at DESC LIMIT 50
--   2. IOC GROUP BY status (event_id, status)
--      Covers: WHERE event_id = ? GROUP BY status COUNT(*)
--   3. IOC GROUP BY noc + status (event_id, noc_code, status)
--      Covers: WHERE event_id = ? GROUP BY noc_code, status COUNT(*)
--
-- All additive — no data change, no downtime.

-- Speed up NOC queue status filter + paginated sort
CREATE INDEX IF NOT EXISTS idx_applications_noc_status
  ON applications (noc_code, status, submitted_at DESC);

-- Speed up IOC dashboard GROUP BY status
CREATE INDEX IF NOT EXISTS idx_applications_event_status
  ON applications (event_id, status);

-- Speed up IOC dashboard GROUP BY noc_code, status
CREATE INDEX IF NOT EXISTS idx_applications_event_noc_status
  ON applications (event_id, noc_code, status);
