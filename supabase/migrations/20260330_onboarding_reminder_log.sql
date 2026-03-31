-- Tracks which facilitators have received each type of onboarding reminder.
-- UNIQUE(facilitator_id, reminder_type) prevents duplicate sends even under concurrent cron runs.
CREATE TABLE IF NOT EXISTS onboarding_reminder_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id  uuid        NOT NULL REFERENCES facilitator_profiles(id) ON DELETE CASCADE,
  reminder_type   text        NOT NULL DEFAULT 'day3',
  sent_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facilitator_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_log_fac
  ON onboarding_reminder_log (facilitator_id);
