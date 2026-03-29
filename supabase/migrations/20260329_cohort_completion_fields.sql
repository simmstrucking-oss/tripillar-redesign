-- Task 4: Cohort Summary / Completion fields on cohorts table
-- These fields are filled when a facilitator marks a cohort complete via the summary form.

ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS total_enrolled integer;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS total_completed integer;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS dropout_reasons text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS facilitator_assessment text CHECK (facilitator_assessment IN ('Strong', 'Moderate', 'Challenging'));
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS notable_outcomes text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS would_run_again boolean;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS curriculum_feedback text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS summary_submitted_at timestamptz;
