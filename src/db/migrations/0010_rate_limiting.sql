-- Add ip_address column to magic_link_tokens for per-IP rate limiting
ALTER TABLE "magic_link_tokens" ADD COLUMN IF NOT EXISTS "ip_address" text;
