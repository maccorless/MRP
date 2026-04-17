-- Migration 0016: Add noc_e_requested to noc_quotas
--
-- Stores the NOC's requested NocE (Press Attaché) slot count.
-- NULL means not yet set; UI defaults to noc_e_total on display.
-- OCOG can adjust this value before approving the NOC's PbN.

ALTER TABLE noc_quotas
  ADD COLUMN IF NOT EXISTS noc_e_requested INTEGER;
