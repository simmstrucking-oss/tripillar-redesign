-- Migration: 20260408_fix_rls_recursion
-- Problem: RLS policies on session_feedback_submissions, critical_incident_reports,
--          and facilitator_reflections subqueried facilitator_profiles directly.
--          facilitator_profiles itself has RLS enabled, causing infinite recursion
--          (Postgres error 42P17) on every authenticated INSERT/SELECT.
--
-- Fix part 1: Create a SECURITY DEFINER helper function that resolves the current
--             user's facilitator_profiles.id without triggering RLS on that table.
--
-- Fix part 2: Drop all old broken policies (subquery-based) and replace with
--             function-based equivalents on all three affected tables.
--
-- Fix part 3: REVOKE SELECT on facilitator_reflections from service_role entirely.
--             RLS policies are bypassed by service_role by Postgres/Supabase design.
--             REVOKE is the only way to enforce "no admin read" at the privilege level.
--             This is a permanent architectural decision (per Wayne Simms 2026-04-05).
--
-- Applied live: 2026-04-08. All three fixes confirmed via end-to-end test.

-- ─────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER helper function
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_facilitator_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.facilitator_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 2. session_feedback_submissions — replace broken policies
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "facilitators_insert_own_feedback"  ON session_feedback_submissions;
DROP POLICY IF EXISTS "facilitators_read_own_feedback"    ON session_feedback_submissions;
DROP POLICY IF EXISTS "facilitator_insert_feedback"       ON session_feedback_submissions;
DROP POLICY IF EXISTS "facilitator_select_feedback"       ON session_feedback_submissions;

CREATE POLICY "facilitator_insert_feedback"
  ON session_feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK (facilitator_id = public.get_my_facilitator_id());

CREATE POLICY "facilitator_select_feedback"
  ON session_feedback_submissions FOR SELECT
  TO authenticated
  USING (facilitator_id = public.get_my_facilitator_id());

-- service_role may read for admin reporting
CREATE POLICY "service_role_select_feedback"
  ON session_feedback_submissions FOR SELECT
  TO service_role
  USING (true);

-- ─────────────────────────────────────────────────────────────────
-- 3. critical_incident_reports — replace broken policies
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "facilitators_insert_own_incidents" ON critical_incident_reports;
DROP POLICY IF EXISTS "facilitators_read_own_incidents"   ON critical_incident_reports;
DROP POLICY IF EXISTS "facilitator_insert_incidents"      ON critical_incident_reports;
DROP POLICY IF EXISTS "facilitator_select_incidents"      ON critical_incident_reports;

CREATE POLICY "facilitator_insert_incidents"
  ON critical_incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (facilitator_id = public.get_my_facilitator_id());

CREATE POLICY "facilitator_select_incidents"
  ON critical_incident_reports FOR SELECT
  TO authenticated
  USING (facilitator_id = public.get_my_facilitator_id());

-- service_role read and insert (admin reporting + API route uses service key)
CREATE POLICY "service_role_select_incidents"
  ON critical_incident_reports FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_insert_incidents"
  ON critical_incident_reports FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
-- 4. facilitator_reflections — replace broken policies
--    NO service_role policy. REVOKE enforces strict isolation.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "facilitators_own_reflections_insert" ON facilitator_reflections;
DROP POLICY IF EXISTS "facilitators_own_reflections_select" ON facilitator_reflections;
DROP POLICY IF EXISTS "facilitator_insert_reflections"      ON facilitator_reflections;
DROP POLICY IF EXISTS "facilitator_select_reflections"      ON facilitator_reflections;

CREATE POLICY "facilitator_insert_reflections"
  ON facilitator_reflections FOR INSERT
  TO authenticated
  WITH CHECK (facilitator_id = public.get_my_facilitator_id());

CREATE POLICY "facilitator_select_reflections"
  ON facilitator_reflections FOR SELECT
  TO authenticated
  USING (facilitator_id = public.get_my_facilitator_id());

-- NO service_role policy here — by permanent architectural decision.

-- ─────────────────────────────────────────────────────────────────
-- 5. Revoke SELECT from service_role on facilitator_reflections
--    RLS does not apply to service_role; REVOKE is the hard block.
-- ─────────────────────────────────────────────────────────────────
REVOKE SELECT ON facilitator_reflections FROM service_role;
