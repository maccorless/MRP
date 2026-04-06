-- ENR rank integrity: unique partial index prevents duplicate priority ranks
-- within the same NOC/event for unsubmitted (draft) rows.
-- Submitted rows are frozen and excluded since their ranks are historical.
CREATE UNIQUE INDEX IF NOT EXISTS enr_unique_draft_rank
  ON enr_requests (noc_code, event_id, priority_rank)
  WHERE submitted_at IS NULL;
