CREATE TABLE IF NOT EXISTS facilitator_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facilitator_id uuid NOT NULL REFERENCES facilitator_profiles(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  session_number integer,
  went_well text,
  challenges text,
  concerns text,
  self_care boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE facilitator_reflections ENABLE ROW LEVEL SECURITY;

-- Facilitators read and write ONLY their own rows. Wayne (or any admin) cannot see these.
CREATE POLICY "facilitators_own_reflections_select" ON facilitator_reflections
  FOR SELECT USING (
    facilitator_id IN (SELECT id FROM facilitator_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "facilitators_own_reflections_insert" ON facilitator_reflections
  FOR INSERT WITH CHECK (
    facilitator_id IN (SELECT id FROM facilitator_profiles WHERE user_id = auth.uid())
  );
