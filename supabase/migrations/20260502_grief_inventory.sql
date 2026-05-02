-- Add grief_inventory JSONB column to facilitator_profiles
-- Stores Chapter 1 Inner Work Guide reflections (q1–q4).
-- Private: facilitators read/write their own row only via existing RLS.
-- service_role can UPDATE (facilitator_profiles is not restricted like facilitator_reflections).
ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS grief_inventory jsonb DEFAULT NULL;
