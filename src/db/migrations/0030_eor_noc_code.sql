-- Migration 0030: insert EOR (Refugee Olympic Team) row into noc_quotas
-- EOR is country-less (no ISO country code) and bypasses ineligible-country checks.
-- All quota values default to 0; IOC will set them when needed.
-- EOR does NOT appear in the public EoI NOC dropdown (not in codes.ts NOC_CODES).

INSERT INTO noc_quotas (noc_code, event_id, entity_type)
VALUES ('EOR', 'LA28', 'noc')
ON CONFLICT DO NOTHING;
