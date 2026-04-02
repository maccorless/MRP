-- Migration 0006: ENR orgs become real organization records
--
-- Previously, independently-nominated ENR orgs stored their name in
-- enr_requests.enr_org_name with organizationId=null. This migration:
--   1. Makes organizations.email_domain and .country nullable (ENR orgs have neither)
--   2. Creates an organizations row for every ENR request that has no org link
--   3. Points enr_requests.organization_id at the new org rows
--   4. Adds NOT NULL constraint to enr_requests.organization_id
--   5. Drops the now-redundant enr_requests.enr_org_name column

-- Step 1: relax NOT NULL constraints on organizations so ENR orgs can be inserted
ALTER TABLE organizations
  ALTER COLUMN email_domain DROP NOT NULL,
  ALTER COLUMN country      DROP NOT NULL;

-- Step 2 + 3: for each ENR request without an org, create one and back-link it
DO $$
DECLARE
  r RECORD;
  new_org_id UUID;
BEGIN
  FOR r IN
    SELECT id, noc_code, event_id, enr_org_name, enr_website
    FROM   enr_requests
    WHERE  organization_id IS NULL
  LOOP
    INSERT INTO organizations (id, event_id, name, noc_code, org_type, website, org_status)
    VALUES (
      gen_random_uuid(),
      r.event_id,
      r.enr_org_name,
      r.noc_code,
      'enr',
      r.enr_website,
      'active'
    )
    RETURNING id INTO new_org_id;

    UPDATE enr_requests
    SET    organization_id = new_org_id
    WHERE  id = r.id;
  END LOOP;
END;
$$;

-- Step 4: enforce NOT NULL now that every row has an org
ALTER TABLE enr_requests
  ALTER COLUMN organization_id SET NOT NULL;

-- Step 5: drop the redundant text column
ALTER TABLE enr_requests
  DROP COLUMN IF EXISTS enr_org_name;
