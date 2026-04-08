-- Participant Outcomes System — tables for public form submissions

-- Add followup_reminder_sent to cohorts
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS followup_reminder_sent BOOLEAN DEFAULT FALSE;

-- Add session_delivered and observation to session_logs
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS session_delivered BOOLEAN DEFAULT TRUE;
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS observation TEXT;

CREATE TABLE IF NOT EXISTS participant_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  kit_subscriber_id BIGINT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_pre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  loss_type TEXT,
  time_since_loss TEXT,
  prior_support TEXT,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_disruption INT CHECK (score_disruption BETWEEN 1 AND 10),
  score_isolation INT CHECK (score_isolation BETWEEN 1 AND 10),
  score_meaning INT CHECK (score_meaning BETWEEN 1 AND 10),
  score_selfcare INT CHECK (score_selfcare BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  open_hope TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_mid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  score_connection INT CHECK (score_connection BETWEEN 1 AND 10),
  open_surprise TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sessions_attended INT,
  score_emotions INT CHECK (score_emotions BETWEEN 1 AND 10),
  score_disruption INT CHECK (score_disruption BETWEEN 1 AND 10),
  score_isolation INT CHECK (score_isolation BETWEEN 1 AND 10),
  score_meaning INT CHECK (score_meaning BETWEEN 1 AND 10),
  score_selfcare INT CHECK (score_selfcare BETWEEN 1 AND 10),
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  score_program_helpful INT CHECK (score_program_helpful BETWEEN 1 AND 10),
  score_safety INT CHECK (score_safety BETWEEN 1 AND 10),
  score_facilitator_support INT CHECK (score_facilitator_support BETWEEN 1 AND 10),
  open_change TEXT,
  open_recommend TEXT,
  open_improve TEXT,
  followup_consent BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);

CREATE TABLE IF NOT EXISTS outcomes_followup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  score_manageability INT CHECK (score_manageability BETWEEN 1 AND 10),
  open_reflection TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, cohort_id)
);
