-- Migration: Add inner_work_reflections column to facilitator_profiles
ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS inner_work_reflections JSONB DEFAULT NULL;
