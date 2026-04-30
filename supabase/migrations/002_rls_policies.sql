-- ============================================================
-- TutionHut v1.0 — Row Level Security Policies
-- Idempotent: drops and recreates all policies safely
-- Run AFTER: 001_initial_schema.sql AND 001b_patch_columns.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_lectures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ─── DROP EXISTING POLICIES (idempotent) ────────────────────
DROP POLICY IF EXISTS "Users can view own profile"                                  ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"                                ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students profiles"                   ON profiles;
DROP POLICY IF EXISTS "Teachers can view and update their own profile"              ON teacher_profiles;
DROP POLICY IF EXISTS "Students can view and update their own profile"              ON student_profiles;
DROP POLICY IF EXISTS "Teachers can view enrolled students profiles"                ON student_profiles;
DROP POLICY IF EXISTS "Teachers can CRUD their own batches"                         ON batches;
DROP POLICY IF EXISTS "Students can view enrolled batches"                          ON batches;
DROP POLICY IF EXISTS "Anyone can view public batches"                              ON batches;
DROP POLICY IF EXISTS "Students can view their own enrollments"                     ON enrollments;
DROP POLICY IF EXISTS "Students can insert enrollments (join batch)"                ON enrollments;
DROP POLICY IF EXISTS "Teachers can manage enrollments for their batches"           ON enrollments;
DROP POLICY IF EXISTS "Teachers can CRUD sessions for their batches"                ON sessions;
DROP POLICY IF EXISTS "Students can view sessions for enrolled batches"             ON sessions;
DROP POLICY IF EXISTS "Teachers can CRUD attendance for their batches"              ON attendance;
DROP POLICY IF EXISTS "Students can view their own attendance"                      ON attendance;
DROP POLICY IF EXISTS "Teachers can CRUD fee payments for their batches"            ON fee_payments;
DROP POLICY IF EXISTS "Students can view their own fee payments"                    ON fee_payments;
DROP POLICY IF EXISTS "Teachers can CRUD notes for their batches"                   ON notes;
DROP POLICY IF EXISTS "Students can view notes for enrolled batches"                ON notes;
DROP POLICY IF EXISTS "Anyone can view public notes"                                ON notes;
DROP POLICY IF EXISTS "Teachers can CRUD lectures for their batches"                ON video_lectures;
DROP POLICY IF EXISTS "Students can view lectures for enrolled batches"             ON video_lectures;
DROP POLICY IF EXISTS "Anyone can view public lectures"                             ON video_lectures;
DROP POLICY IF EXISTS "Teachers can CRUD progress records for their students"       ON progress_records;
DROP POLICY IF EXISTS "Students can view their own progress"                        ON progress_records;
DROP POLICY IF EXISTS "Teachers can CRUD their own announcements"                   ON announcements;
DROP POLICY IF EXISTS "Students can view announcements for enrolled batches"        ON announcements;
DROP POLICY IF EXISTS "Users can view and update their own notifications"           ON notifications;
DROP POLICY IF EXISTS "System can insert notifications for any user"                ON notifications;

-- ─── HELPER FUNCTIONS ────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION my_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM teacher_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION my_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM student_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_enrolled_in_batch(p_batch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments
    WHERE student_id = my_student_id()
    AND batch_id = p_batch_id
    AND status = 'ACTIVE'
  );
$$;

-- ─── PROFILES ────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Teachers can view their students profiles"
  ON profiles FOR SELECT USING (
    auth_role() = 'TEACHER' AND
    id IN (
      SELECT p.id FROM profiles p
      JOIN student_profiles sp ON sp.user_id = p.id
      JOIN enrollments e ON e.student_id = sp.id
      JOIN batches b ON b.id = e.batch_id
      WHERE b.teacher_id = my_teacher_id()
    )
  );

-- ─── TEACHER PROFILES ────────────────────────────────────────
CREATE POLICY "Teachers can view and update their own profile"
  ON teacher_profiles FOR ALL USING (user_id = auth.uid());

-- ─── STUDENT PROFILES ────────────────────────────────────────
CREATE POLICY "Students can view and update their own profile"
  ON student_profiles FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Teachers can view enrolled students profiles"
  ON student_profiles FOR SELECT USING (
    auth_role() = 'TEACHER' AND
    id IN (
      SELECT e.student_id FROM enrollments e
      JOIN batches b ON b.id = e.batch_id
      WHERE b.teacher_id = my_teacher_id()
    )
  );

-- ─── BATCHES ─────────────────────────────────────────────────
CREATE POLICY "Teachers can CRUD their own batches"
  ON batches FOR ALL USING (teacher_id = my_teacher_id());

CREATE POLICY "Students can view enrolled batches"
  ON batches FOR SELECT USING (
    id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id = my_student_id() AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Anyone can view public batches"
  ON batches FOR SELECT USING (is_public = true);

-- ─── ENROLLMENTS ─────────────────────────────────────────────
CREATE POLICY "Students can view their own enrollments"
  ON enrollments FOR SELECT USING (student_id = my_student_id());

CREATE POLICY "Students can insert enrollments (join batch)"
  ON enrollments FOR INSERT WITH CHECK (student_id = my_student_id());

CREATE POLICY "Teachers can manage enrollments for their batches"
  ON enrollments FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE POLICY "Teachers can CRUD sessions for their batches"
  ON sessions FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

CREATE POLICY "Students can view sessions for enrolled batches"
  ON sessions FOR SELECT USING (is_enrolled_in_batch(batch_id));

-- ─── ATTENDANCE ──────────────────────────────────────────────
CREATE POLICY "Teachers can CRUD attendance for their batches"
  ON attendance FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN batches b ON b.id = s.batch_id
      WHERE b.teacher_id = my_teacher_id()
    )
  );

CREATE POLICY "Students can view their own attendance"
  ON attendance FOR SELECT USING (student_id = my_student_id());

-- ─── FEE PAYMENTS ────────────────────────────────────────────
CREATE POLICY "Teachers can CRUD fee payments for their batches"
  ON fee_payments FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

CREATE POLICY "Students can view their own fee payments"
  ON fee_payments FOR SELECT USING (student_id = my_student_id());

-- ─── NOTES ───────────────────────────────────────────────────
CREATE POLICY "Teachers can CRUD notes for their batches"
  ON notes FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

CREATE POLICY "Students can view notes for enrolled batches"
  ON notes FOR SELECT USING (is_enrolled_in_batch(batch_id));

CREATE POLICY "Anyone can view public notes"
  ON notes FOR SELECT USING (is_public = true);

-- ─── VIDEO LECTURES ──────────────────────────────────────────
CREATE POLICY "Teachers can CRUD lectures for their batches"
  ON video_lectures FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

CREATE POLICY "Students can view lectures for enrolled batches"
  ON video_lectures FOR SELECT USING (is_enrolled_in_batch(batch_id));

CREATE POLICY "Anyone can view public lectures"
  ON video_lectures FOR SELECT USING (is_public = true);

-- ─── PROGRESS RECORDS ────────────────────────────────────────
CREATE POLICY "Teachers can CRUD progress records for their students"
  ON progress_records FOR ALL USING (
    batch_id IN (SELECT id FROM batches WHERE teacher_id = my_teacher_id())
  );

CREATE POLICY "Students can view their own progress"
  ON progress_records FOR SELECT USING (student_id = my_student_id());

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────
CREATE POLICY "Teachers can CRUD their own announcements"
  ON announcements FOR ALL USING (teacher_id = my_teacher_id());

CREATE POLICY "Students can view announcements for enrolled batches"
  ON announcements FOR SELECT USING (
    (scope = 'BATCH' AND is_enrolled_in_batch(batch_id))
    OR
    (scope = 'ALL' AND teacher_id IN (
      SELECT b.teacher_id FROM batches b
      JOIN enrollments e ON e.batch_id = b.id
      WHERE e.student_id = my_student_id()
    ))
  );

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE POLICY "Users can view and update their own notifications"
  ON notifications FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications for any user"
  ON notifications FOR INSERT WITH CHECK (true);
