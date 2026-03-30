-- Separate dismissed_trainer_orientation column for Trainer Hub
-- (distinct from dismissed_orientation used by Facilitator Hub onboarding)
ALTER TABLE facilitator_profiles 
  ADD COLUMN IF NOT EXISTS dismissed_trainer_orientation boolean DEFAULT false;
