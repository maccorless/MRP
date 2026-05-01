-- Migration 0031: add eoi_receipt_sent and excel_reimport to audit_action enum
-- ALTER TYPE ADD VALUE cannot run inside a transaction in PG < 12;
-- the migration runner detects this and runs it outside a tx.

ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'eoi_receipt_sent';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'excel_reimport';
