-- Migration 0027: add NOC Es (sport-specific NOC press attaché) category.
--
-- Added 2026-04-26 per Emma Morris feedback (Word comment #197 on
-- stakeholder-questions-21-April-2026): "We will also need a category for
-- NOC Es (NOC press attaches who only have access to one sport)".
--
-- NOC Es complements the existing NOC E (general press attaché). Its quota
-- is set by the IOC alongside NOC E and other E-categories; allocation
-- happens during PbN against the NOC's nominated communications-staff org.

ALTER TABLE "noc_quotas"
  ADD COLUMN IF NOT EXISTS "noc_es_total" integer NOT NULL DEFAULT 0;

ALTER TABLE "org_slot_allocations"
  ADD COLUMN IF NOT EXISTS "noc_es_slots" integer NOT NULL DEFAULT 0;
