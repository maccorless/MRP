ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'other';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_email TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS org_type_other TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS press_card BOOLEAN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS press_card_issuer TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS enr_programming_type TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS online_unique_visitors TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS geographical_coverage TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS social_media_accounts TEXT;
