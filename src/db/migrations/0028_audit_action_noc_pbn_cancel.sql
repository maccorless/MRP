-- Migration 0028: add `noc_pbn_cancel` to the audit_action enum.
--
-- Added 2026-04-26 per Emma Morris feedback (Word comment #9 on
-- stakeholder-questions-21-April-2026): "How do NOCs cancel an entry in
-- the PbN that they may have entered by mistake".
--
-- The cancel action is permitted from `draft` and `noc_submitted` PbN
-- states. After `ocog_approved`, OCOG must reverse first; after
-- `sent_to_acr`, cancellation is impossible in PRP (Model A handoff,
-- subject to §4.3 master-status re-open).

ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'noc_pbn_cancel';
