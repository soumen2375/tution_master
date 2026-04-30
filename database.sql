-- ═══════════════════════════════════════════════════════════════════
-- TutionHut — Complete Supabase Database Schema
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. EXTENSIONS ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. ENUMS ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role           AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan   AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PRO', 'UNLIMITED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE batch_status        AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'UPCOMING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE batch_type          AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status   AS ENUM ('ACTIVE', 'PAUSED', 'DROPPED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status   AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fee_status          AS ENUM ('PAID', 'PENDING', 'PARTIAL', 'WAIVED', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method      AS ENUM ('CASH', 'UPI', 'PHONEPE', 'GOOGLE_PAY', 'PAYTM', 'BANK_TRANSFER', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type   AS ENUM ('FEE_REMINDER', 'ATTENDANCE_ALERT', 'CLASS_UPDATE', 'ANNOUNCEMENT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. TABLES ──────────────────────────────────────────────────────

-- 3.1 Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT UNIQUE,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'STUDENT',
  language     TEXT NOT NULL DEFAULT 'en',   -- 'en' | 'bn'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Teacher Profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio                 TEXT,
  subjects            TEXT[],
  institution         TEXT,
  city                TEXT,
  state               TEXT,
  plan                subscription_plan   NOT NULL DEFAULT 'FREE',
  subscription_status subscription_status NOT NULL DEFAULT 'TRIAL',
  subscription_start  TIMESTAMPTZ,
  subscription_end    TIMESTAMPTZ,
  max_batches         INT NOT NULL DEFAULT 3,
  max_students        INT NOT NULL DEFAULT 30,
  storage_limit_mb    INT NOT NULL DEFAULT 500,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  institution     TEXT,
  class_name      TEXT,
  board           TEXT,   -- CBSE | ICSE | State Board
  city            TEXT,
  state           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Batches
CREATE TABLE IF NOT EXISTS batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL,
  description     TEXT,
  type            batch_type   NOT NULL DEFAULT 'OFFLINE',
  status          batch_status NOT NULL DEFAULT 'ACTIVE',
  -- schedule: [{day:"Monday", startTime:"08:00", endTime:"09:30"}]
  schedule        JSONB NOT NULL DEFAULT '[]',
  start_date      DATE NOT NULL,
  end_date        DATE,
  max_students    INT NOT NULL DEFAULT 30,
  monthly_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  meeting_link    TEXT,
  invite_code     TEXT UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id    UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  status      enrollment_status NOT NULL DEFAULT 'ACTIVE',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at  TIMESTAMPTZ,
  notes       TEXT,
  UNIQUE(student_id, batch_id)
);

-- 3.6 Class Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title        TEXT,
  date         DATE NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  topic        TEXT,
  notes        TEXT,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_reason TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status     attendance_status NOT NULL DEFAULT 'PRESENT',
  marked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remark     TEXT,
  UNIQUE(student_id, session_id)
);

-- 3.8 Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  amount          NUMERIC(10,2) NOT NULL,
  status          fee_status NOT NULL DEFAULT 'PENDING',
  payment_method  payment_method,
  paid_at         TIMESTAMPTZ,
  due_date        DATE NOT NULL,
  receipt_number  TEXT UNIQUE,
  remark          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, batch_id, month, year)
);

-- 3.9 Resources (Study Materials)
CREATE TABLE IF NOT EXISTS resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES profiles(id),
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_type     TEXT,           -- 'pdf' | 'video' | 'image' | 'doc'
  file_size_kb  INT,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  downloads     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Announcements
DO $$ BEGIN
  CREATE TYPE announcement_scope AS ENUM ('BATCH', 'ALL', 'PLATFORM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  batch_id    UUID REFERENCES batches(id) ON DELETE CASCADE,  -- NULL = all batches
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  scope       announcement_scope NOT NULL DEFAULT 'BATCH',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Notes (Study Materials / PDFs uploaded by teachers)
CREATE TABLE IF NOT EXISTS notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  uploaded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_type     TEXT,           -- 'pdf' | 'doc' | 'image' | etc.
  file_size_kb  INT,
  is_public     BOOLEAN NOT NULL DEFAULT FALSE,
  downloads     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.12 Video Lectures
DO $$ BEGIN
  CREATE TYPE lecture_status AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS video_lectures (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id       UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  uploaded_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  video_url      TEXT NOT NULL,
  thumbnail_url  TEXT,
  duration_sec   INT,
  topic          TEXT,
  status         lecture_status NOT NULL DEFAULT 'PUBLISHED',
  is_public      BOOLEAN NOT NULL DEFAULT FALSE,
  views          INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.13 Progress Records (teacher-updated monthly performance)
CREATE TABLE IF NOT EXISTS progress_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id          UUID REFERENCES batches(id) ON DELETE SET NULL,
  month             SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year              SMALLINT NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  total_sessions    INT NOT NULL DEFAULT 0,
  present_count     INT NOT NULL DEFAULT 0,
  late_count        INT NOT NULL DEFAULT 0,
  attendance_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  exam_score        NUMERIC(6,2),
  exam_total        NUMERIC(6,2),
  performance_note  TEXT,
  teacher_rating    SMALLINT CHECK (teacher_rating BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, batch_id, month, year)
);

-- 3.14 Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. HELPER FUNCTIONS & TRIGGERS ─────────────────────────────────

-- 4.1 Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all relevant tables
DO $$ 
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','teacher_profiles','student_profiles','batches','fee_payments','progress_records']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
      CREATE TRIGGER trg_set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- 4.2 Auto-create profile on Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STUDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4.3 Auto-generate receipt number for fee payments
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'TH-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('receipt_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS receipt_seq START 1;

DROP TRIGGER IF EXISTS trg_receipt_number ON fee_payments;
CREATE TRIGGER trg_receipt_number
BEFORE INSERT ON fee_payments
FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- ── 5. INDEXES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_batches_teacher     ON batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch   ON enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_batch      ON sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date       ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_session  ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student  ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_batch   ON fee_payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_batch      ON resources(batch_id);

-- ── 6. ROW LEVEL SECURITY ──────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_lectures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ── profiles ──
DROP POLICY IF EXISTS "profiles_select_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON profiles;

CREATE POLICY "profiles_select_own"     ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"     ON profiles FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "profiles_insert_trigger" ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);

-- ── teacher_profiles ──
DROP POLICY IF EXISTS "tp_select_own"  ON teacher_profiles;
DROP POLICY IF EXISTS "tp_insert_own"  ON teacher_profiles;
DROP POLICY IF EXISTS "tp_update_own"  ON teacher_profiles;

CREATE POLICY "tp_select_own" ON teacher_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tp_insert_own" ON teacher_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tp_update_own" ON teacher_profiles FOR UPDATE USING (user_id = auth.uid());

-- ── student_profiles ──
DROP POLICY IF EXISTS "sp_select_own"  ON student_profiles;
DROP POLICY IF EXISTS "sp_insert_own"  ON student_profiles;
DROP POLICY IF EXISTS "sp_update_own"  ON student_profiles;

CREATE POLICY "sp_select_own" ON student_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sp_insert_own" ON student_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sp_update_own" ON student_profiles FOR UPDATE USING (user_id = auth.uid());

-- ── batches ──
DROP POLICY IF EXISTS "batches_teacher_all"   ON batches;
DROP POLICY IF EXISTS "batches_public_select"  ON batches;
DROP POLICY IF EXISTS "batches_enrolled_select" ON batches;

-- Teachers manage their own batches
CREATE POLICY "batches_teacher_all" ON batches FOR ALL
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

-- Students can see public batches or batches they're enrolled in
CREATE POLICY "batches_enrolled_select" ON batches FOR SELECT
  USING (
    is_public = TRUE
    OR teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())
    OR id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

-- ── enrollments ──
DROP POLICY IF EXISTS "enroll_teacher_select" ON enrollments;
DROP POLICY IF EXISTS "enroll_student_all"    ON enrollments;

CREATE POLICY "enroll_teacher_select" ON enrollments FOR SELECT
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "enroll_student_all" ON enrollments FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- ── sessions ──
DROP POLICY IF EXISTS "sessions_teacher_all"   ON sessions;
DROP POLICY IF EXISTS "sessions_student_select" ON sessions;

CREATE POLICY "sessions_teacher_all" ON sessions FOR ALL
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "sessions_student_select" ON sessions FOR SELECT
  USING (batch_id IN (
    SELECT batch_id FROM enrollments
    WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  ));

-- ── attendance ──
DROP POLICY IF EXISTS "attendance_teacher_all"   ON attendance;
DROP POLICY IF EXISTS "attendance_student_select" ON attendance;

CREATE POLICY "attendance_teacher_all" ON attendance FOR ALL
  USING (session_id IN (
    SELECT id FROM sessions WHERE batch_id IN (
      SELECT id FROM batches WHERE teacher_id IN (
        SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "attendance_student_select" ON attendance FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- ── fee_payments ──
DROP POLICY IF EXISTS "fees_teacher_all"   ON fee_payments;
DROP POLICY IF EXISTS "fees_student_select" ON fee_payments;

CREATE POLICY "fees_teacher_all" ON fee_payments FOR ALL
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "fees_student_select" ON fee_payments FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- ── resources ──
DROP POLICY IF EXISTS "resources_teacher_all"   ON resources;
DROP POLICY IF EXISTS "resources_student_select" ON resources;

CREATE POLICY "resources_teacher_all" ON resources FOR ALL
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "resources_student_select" ON resources FOR SELECT
  USING (
    is_public = TRUE
    OR batch_id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

-- ── announcements ──
DROP POLICY IF EXISTS "ann_teacher_all"   ON announcements;
DROP POLICY IF EXISTS "ann_student_select" ON announcements;

CREATE POLICY "ann_teacher_all" ON announcements FOR ALL
  USING (teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "ann_student_select" ON announcements FOR SELECT
  USING (
    batch_id IS NULL
    OR batch_id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

-- ── notes ──
DROP POLICY IF EXISTS "notes_teacher_all"    ON notes;
DROP POLICY IF EXISTS "notes_student_select" ON notes;

CREATE POLICY "notes_teacher_all" ON notes FOR ALL
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "notes_student_select" ON notes FOR SELECT
  USING (
    is_public = TRUE
    OR batch_id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

-- ── video_lectures ──
DROP POLICY IF EXISTS "vl_teacher_all"    ON video_lectures;
DROP POLICY IF EXISTS "vl_student_select" ON video_lectures;

CREATE POLICY "vl_teacher_all" ON video_lectures FOR ALL
  USING (batch_id IN (SELECT id FROM batches WHERE teacher_id IN (SELECT id FROM teacher_profiles WHERE user_id = auth.uid())));

CREATE POLICY "vl_student_select" ON video_lectures FOR SELECT
  USING (
    is_public = TRUE
    OR batch_id IN (
      SELECT batch_id FROM enrollments
      WHERE student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
    )
  );

-- ── progress_records ──
DROP POLICY IF EXISTS "progress_teacher_all"    ON progress_records;
DROP POLICY IF EXISTS "progress_student_select" ON progress_records;

CREATE POLICY "progress_teacher_all" ON progress_records FOR ALL
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN enrollments e ON e.student_id = sp.id
      WHERE e.batch_id IN (
        SELECT id FROM batches WHERE teacher_id IN (
          SELECT id FROM teacher_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "progress_student_select" ON progress_records FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- ── notifications ──
DROP POLICY IF EXISTS "notif_own_all" ON notifications;
CREATE POLICY "notif_own_all" ON notifications FOR ALL USING (user_id = auth.uid());

-- ── 7. STORAGE BUCKETS ─────────────────────────────────────────────
-- Run these separately in Supabase Dashboard → Storage, OR via API.
-- Creating via SQL is not supported in all Supabase plans.
--
-- Buckets to create manually in Supabase Dashboard → Storage:
--   • avatars      (public: true)   — user profile photos
--   • notes        (public: false)  — study materials / PDF uploads
--
-- Storage policies (add in Dashboard → Storage → Policies):
--   • avatars: INSERT/UPDATE for authenticated users
--   • notes: INSERT for teachers; SELECT for enrolled students and teachers

-- ── 8. USEFUL VIEWS ────────────────────────────────────────────────

-- Teacher dashboard summary
CREATE OR REPLACE VIEW teacher_dashboard AS
SELECT
  tp.id                    AS teacher_id,
  tp.user_id,
  p.full_name              AS teacher_name,
  tp.plan,
  COUNT(DISTINCT b.id)     AS total_batches,
  COUNT(DISTINCT e.id)     AS total_students,
  SUM(CASE WHEN fp.status = 'PAID' THEN fp.amount ELSE 0 END) AS total_fees_collected,
  SUM(CASE WHEN fp.status IN ('PENDING','OVERDUE') THEN fp.amount ELSE 0 END) AS total_fees_pending
FROM teacher_profiles tp
JOIN profiles p ON p.id = tp.user_id
LEFT JOIN batches b ON b.teacher_id = tp.id
LEFT JOIN enrollments e ON e.batch_id = b.id AND e.status = 'ACTIVE'
LEFT JOIN fee_payments fp ON fp.batch_id = b.id
GROUP BY tp.id, tp.user_id, p.full_name, tp.plan;

-- Batch attendance summary (last 30 days)
CREATE OR REPLACE VIEW batch_attendance_summary AS
SELECT
  b.id AS batch_id,
  b.name AS batch_name,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT a.id) AS total_marked,
  COUNT(DISTINCT CASE WHEN a.status = 'PRESENT' THEN a.id END) AS present_count,
  COUNT(DISTINCT CASE WHEN a.status = 'ABSENT'  THEN a.id END) AS absent_count
FROM batches b
LEFT JOIN sessions s ON s.batch_id = b.id AND s.date >= CURRENT_DATE - 30
LEFT JOIN attendance a ON a.session_id = s.id
GROUP BY b.id, b.name;

-- ── END OF SCHEMA ───────────────────────────────────────────────────
