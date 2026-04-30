-- ============================================================
-- TutionHut — Patch: Add missing columns to existing tables
-- Run this in Supabase SQL Editor BEFORE 002_rls_policies.sql
-- This safely adds any columns that were missed due to
-- "IF NOT EXISTS" skipping pre-existing tables.
-- ============================================================

-- ─── announcements: add scope + is_pinned if missing ────────
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'BATCH'
  CHECK (scope IN ('BATCH','ALL','PLATFORM'));

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- ─── batches: add missing columns ────────────────────────────
ALTER TABLE batches ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'OFFLINE'
  CHECK (type IN ('OFFLINE','ONLINE','HYBRID'));
ALTER TABLE batches ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE','PAUSED','COMPLETED','UPCOMING'));
ALTER TABLE batches ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '[]';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS meeting_link TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS max_students INT NOT NULL DEFAULT 30;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── profiles: add missing columns ──────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ─── teacher_profiles: add missing columns ───────────────────
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE'
  CHECK (plan IN ('FREE','STARTER','GROWTH','PRO','UNLIMITED'));
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'TRIAL'
  CHECK (plan_status IN ('ACTIVE','EXPIRED','CANCELLED','TRIAL'));
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS student_limit INT NOT NULL DEFAULT 10;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS batch_limit INT NOT NULL DEFAULT 1;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS storage_limit_mb INT NOT NULL DEFAULT 0;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;

-- ─── student_profiles: add missing columns ───────────────────
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS class TEXT;

-- ─── enrollments: add missing columns ───────────────────────
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK (status IN ('ACTIVE','PAUSED','DROPPED','COMPLETED'));
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS dropped_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS teacher_notes TEXT;

-- ─── Create missing tables if not present ───────────────────

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

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT,
  is_read    BOOLEAN DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes (safe to re-run) ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_batches_teacher     ON batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch   ON enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_batch      ON sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date       ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student  ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session  ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_batch  ON fee_payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_notes_batch         ON notes(batch_id);
CREATE INDEX IF NOT EXISTS idx_lectures_batch      ON video_lectures(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON announcements(teacher_id);
