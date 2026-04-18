ALTER TABLE "event_settings" ADD COLUMN IF NOT EXISTS "enr_pool_size" integer NOT NULL DEFAULT 350;
