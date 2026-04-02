-- Migration 0008: Atomic application reference number sequences
--
-- Replaces COUNT(*)-based reference number generation with an atomic
-- upsert counter per NOC code. Eliminates the race condition where two
-- concurrent submissions for the same NOC computed the same sequence
-- number and one failed with a unique constraint violation.
--
-- Seed from existing data so that new sequences start above the current max.

CREATE TABLE IF NOT EXISTS application_sequences (
  noc_code  TEXT PRIMARY KEY,
  seq       INTEGER NOT NULL DEFAULT 0
);

-- Seed: for each NOC that already has applications, set the counter to
-- the current maximum sequence number so new inserts start above it.
INSERT INTO application_sequences (noc_code, seq)
SELECT
  noc_code,
  COALESCE(
    MAX(
      CASE
        WHEN reference_number ~ '^APP-2028-[A-Z]+-([0-9]+)$'
        THEN CAST(substring(reference_number FROM '[0-9]+$') AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) AS seq
FROM applications
GROUP BY noc_code
ON CONFLICT (noc_code) DO UPDATE SET seq = EXCLUDED.seq;
