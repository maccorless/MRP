-- B1: PRP Admin role model
ALTER TYPE "public"."actor_type" ADD VALUE IF NOT EXISTS 'prp_admin';

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "admin_users"("id"),
  "role" text NOT NULL,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  "granted_by" uuid REFERENCES "admin_users"("id")
);

CREATE INDEX IF NOT EXISTS "user_roles_user_id_idx" ON "user_roles" ("user_id");
