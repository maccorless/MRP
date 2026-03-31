-- Migration: E-category accreditation sub-categories + reserved organisations
-- Adds per-category columns to applications, noc_quotas, org_slot_allocations.
-- Adds reserved_organizations table for IOC-direct orgs (AFP, AP, Reuters, etc.)

-- ── applications: add per-category flags and requested quantities ──────────────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS category_e   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_es  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_ep  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_eps boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_et  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_ec  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requested_e   integer,
  ADD COLUMN IF NOT EXISTS requested_es  integer,
  ADD COLUMN IF NOT EXISTS requested_ep  integer,
  ADD COLUMN IF NOT EXISTS requested_eps integer,
  ADD COLUMN IF NOT EXISTS requested_et  integer,
  ADD COLUMN IF NOT EXISTS requested_ec  integer;

-- Back-fill from legacy press/photo flags so existing records remain coherent.
-- E = press journalist (best approximation for legacy data), EP = photo.
UPDATE applications
SET
  category_e  = category_press,
  category_ep = category_photo,
  requested_e  = requested_press,
  requested_ep = requested_photo
WHERE category_e = false AND category_ep = false;

-- ── noc_quotas: add per-category totals ───────────────────────────────────────

ALTER TABLE noc_quotas
  ADD COLUMN IF NOT EXISTS e_total    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_total   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ep_total   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eps_total  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS et_total   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ec_total   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS noc_e_total integer NOT NULL DEFAULT 0;

-- Back-fill: treat legacy press_total as e_total and photo_total as ep_total.
UPDATE noc_quotas
SET
  e_total  = press_total,
  ep_total = photo_total
WHERE e_total = 0 AND ep_total = 0;

-- ── org_slot_allocations: add per-category slot counts ────────────────────────

ALTER TABLE org_slot_allocations
  ADD COLUMN IF NOT EXISTS e_slots    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_slots   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ep_slots   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eps_slots  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS et_slots   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ec_slots   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS noc_e_slots integer NOT NULL DEFAULT 0;

-- Back-fill: treat legacy press_slots as e_slots and photo_slots as ep_slots.
UPDATE org_slot_allocations
SET
  e_slots  = press_slots,
  ep_slots = photo_slots
WHERE e_slots = 0 AND ep_slots = 0;

-- ── reserved_organizations: IOC-direct orgs (AFP, AP, Reuters, Xinhua, etc.) ──

CREATE TABLE IF NOT EXISTS reserved_organizations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     text NOT NULL DEFAULT 'LA28',
  name         text NOT NULL,
  email_domain text,
  alternate_names jsonb,
  website      text,
  country      text,
  notes        text,
  added_by     text,
  added_at     timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Seed the four IOC-recognised world news agencies that are always IOC-direct.
INSERT INTO reserved_organizations (event_id, name, email_domain, website, notes)
VALUES
  ('LA28', 'Agence France-Presse',  'afp.com',     'https://www.afp.com',     'IOC recognised world news agency'),
  ('LA28', 'The Associated Press',  'ap.org',      'https://www.ap.org',      'IOC recognised world news agency'),
  ('LA28', 'Reuters',               'reuters.com', 'https://www.reuters.com', 'IOC recognised world news agency'),
  ('LA28', 'Xinhua News Agency',    'xinhua.org',  'https://www.xinhua.org',  'IOC recognised world news agency')
ON CONFLICT DO NOTHING;
