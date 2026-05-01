ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api_key_created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api_key_revoked';
