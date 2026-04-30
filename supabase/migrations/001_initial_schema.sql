-- ============================================================
-- TutionHut v1.0 — Supabase SQL Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS (via CHECK constraints for Supabase compatibility) ─
-- Using TEXT + CHECK constraints instead of ENUMs for flexibility

-- ─── 1. PROFILES ─────────────────────────────────────────────
-- Extends Supabase auth.users. Auto-created on signup via trigger.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  image_url   TEXT,
  role        TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN','TEACHER','STUDENT')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. TEACHER PROFILES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio                  TEXT,
  subjects             TEXT[] DEFAULT '{}',
  institution          TEXT,
  -- Subscription
  plan                 TEXT NOT NULL DEFAULT 'FREE'
                         CHECK (plan IN ('FREE','STARTER','GROWTH','PRO','UNLIMITED')),
  plan_status          TEXT NOT NULL DEFAULT 'TRIAL'
                         CHECK (plan_status IN ('ACTIVE','EXPIRED','CANCELLED','TRIAL')),
  plan_expires_at      TIMESTAMPTZ,
  student_limit        INT NOT NULL DEFAULT 10,
  batch_limit          INT NOT NULL DEFAULT 1,
  storage_limit_mb     INT NOT NULL DEFAULT 0,
  razorpay_customer_id TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. STUDENT PROFILES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_name   TEXT,
  guardian_phone  TEXT,
  institution     TEXT,
  class           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. BATCHES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  subject          TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'OFFLINE'
                     CHECK (type IN ('OFFLINE','ONLINE','HYBRID')),
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','PAUSED','COMPLETED','UPCOMING')),
  schedule         JSONB NOT NULL DEFAULT '[]',
  start_date       DATE NOT NULL,
  end_date         DATE,
  max_students     INT NOT NULL DEFAULT 30,
  monthly_fee      NUMERIC NOT NULL DEFAULT 0,
  meeting_link     TEXT,
  is_public        BOOLEAN DEFAULT false,
  invite_code      TEXT UNIQUE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. ENROLLMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id         UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','PAUSED','DROPPED','COMPLETED')),
  enrolled_at      TIMESTAMPTZ DEFAULT now(),
  dropped_at       TIMESTAMPTZ,
  teacher_notes    TEXT,
  UNIQUE(student_id, batch_id)
);

-- ─── 6. CLASS SESSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title        TEXT,
  date         DATE NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  topic        TEXT,
  notes        TEXT,
  is_cancelled BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. ATTENDANCE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'PRESENT'
               CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  marked_at  TIMESTAMPTZ DEFAULT now(),
  remark     TEXT,
  UNIQUE(student_id, session_id)
);

-- ─── 8. FEE PAYMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id         UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  month            INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INT NOT NULL,
  amount           NUMERIC NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PAID','PENDING','PARTIAL','WAIVED','OVERDUE')),
  payment_method   TEXT CHECK (payment_method IN ('CASH','UPI','BANK_TRANSFER','ONLINE')),
  paid_at          TIMESTAMPTZ,
  due_date         DATE,
  receipt_number   TEXT UNIQUE,
  remark           TEXT,
  recorded_by      UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, batch_id, month, year)
);

-- ─── 9. NOTES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT NOT NULL,
  file_type    TEXT NOT NULL,
  file_size_kb INT,
  is_public    BOOLEAN DEFAULT false,
  downloads    INT DEFAULT 0,
  uploaded_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. VIDEO LECTURES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_lectures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_sec  INT,
  topic         TEXT,
  status        TEXT NOT NULL DEFAULT 'PUBLISHED'
                  CHECK (status IN ('PUBLISHED','DRAFT','ARCHIVED')),
  is_public     BOOLEAN DEFAULT false,
  views         INT DEFAULT 0,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. PROGRESS RECORDS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id         UUID REFERENCES batches(id),
  month            INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INT NOT NULL,
  total_sessions   INT DEFAULT 0,
  present_count    INT DEFAULT 0,
  late_count       INT DEFAULT 0,
  attendance_pct   NUMERIC DEFAULT 0,
  exam_score       NUMERIC,
  exam_total       NUMERIC,
  performance_note TEXT,
  teacher_rating   INT CHECK (teacher_rating BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, batch_id, month, year)
);

-- ─── 12. ANNOUNCEMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  batch_id   UUID REFERENCES batches(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  scope      TEXT NOT NULL DEFAULT 'BATCH'
               CHECK (scope IN ('BATCH','ALL','PLATFORM')),
  is_pinned  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 13. NOTIFICATIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT, -- fee_paid | attendance | new_note | new_lecture | announcement | enrollment
  is_read    BOOLEAN DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_batches_teacher ON batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch ON enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_batch ON sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_batch ON fee_payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_notes_batch ON notes(batch_id);
CREATE INDEX IF NOT EXISTS idx_lectures_batch ON video_lectures(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON announcements(teacher_id);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON progress_records
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── STORAGE BUCKETS (run via Supabase Storage tab) ──────────
-- Create these manually in Supabase Dashboard > Storage:
--   notes       → private
--   lectures    → private
--   thumbnails  → public
--   avatars     → public
