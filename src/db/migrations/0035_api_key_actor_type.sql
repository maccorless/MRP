-- Agent API keys: add api_key actor type for audit log attribution.
-- ALTER TYPE ADD VALUE cannot run inside a transaction.
ALTER TYPE "public"."actor_type" ADD VALUE IF NOT EXISTS 'api_key';
