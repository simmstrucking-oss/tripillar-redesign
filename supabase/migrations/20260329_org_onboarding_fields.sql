-- Add org onboarding fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_progress jsonb DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dismissed_orientation boolean DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facilitator_candidate_name text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facilitator_candidate_email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS target_cohort_date date;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS training_requested boolean DEFAULT false;
