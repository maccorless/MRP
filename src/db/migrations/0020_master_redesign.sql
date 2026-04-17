-- Migration 0020: master redesign — entityType on nocQuotas, eventSettings table
-- entityType distinguishes NOC rows from IF rows in the quota/master tables.
-- eventSettings stores per-event IOC configuration (capacity target, holdback pool).

ALTER TABLE "noc_quotas" ADD COLUMN "entity_type" text NOT NULL DEFAULT 'noc';

CREATE TABLE "event_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" text NOT NULL DEFAULT 'LA28',
  "capacity" integer NOT NULL DEFAULT 6000,
  "ioc_holdback" integer NOT NULL DEFAULT 0,
  "updated_by" text,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "event_settings_event_id_unique" UNIQUE("event_id")
);
