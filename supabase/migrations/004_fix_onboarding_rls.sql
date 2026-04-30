-- ============================================================
-- TutionHut — ONBOARDING FIX (run AFTER 003_fix_signup_trigger.sql)
-- Fixes the teacher_profiles FK violation during onboarding.
-- ============================================================

-- PROBLEM: When onboarding calls profiles.upsert() then teacher_profiles.upsert(),
-- the profiles INSERT fails due to missing RLS INSERT policy (only UPDATE was allowed).
-- This leaves profiles empty → teacher_profiles FK violation.

-- FIX 1: Allow users to INSERT their own profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- FIX 2: Allow users to INSERT their own teacher profile
DROP POLICY IF EXISTS "Teachers can insert own teacher profile" ON teacher_profiles;
CREATE POLICY "Teachers can insert own teacher profile"
  ON teacher_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- FIX 3: Allow users to INSERT their own student profile
DROP POLICY IF EXISTS "Students can insert own student profile" ON student_profiles;
CREATE POLICY "Students can insert own student profile"
  ON student_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- FIX 4: Allow users to UPDATE their own teacher/student profile (needed for upsert)
DROP POLICY IF EXISTS "Teachers can update own teacher profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own teacher profile"
  ON teacher_profiles FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own student profile" ON student_profiles;
CREATE POLICY "Students can update own student profile"
  ON student_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- FIX 5: Allow teachers to SELECT their own teacher profile
DROP POLICY IF EXISTS "Teachers can select own teacher profile" ON teacher_profiles;
CREATE POLICY "Teachers can select own teacher profile"
  ON teacher_profiles FOR SELECT
  USING (user_id = auth.uid());

-- FIX 6: Allow students to SELECT their own student profile
DROP POLICY IF EXISTS "Students can select own student profile" ON student_profiles;
CREATE POLICY "Students can select own student profile"
  ON student_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Verify policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'teacher_profiles', 'student_profiles')
ORDER BY tablename, cmd;
