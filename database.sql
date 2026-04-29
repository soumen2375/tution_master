-- TutionHut Database Schema (PostgreSQL for Supabase)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
CREATE TYPE subscription_plan AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PRO', 'UNLIMITED');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'TRIAL');
CREATE TYPE batch_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'UPCOMING');
CREATE TYPE batch_type AS ENUM ('OFFLINE', 'ONLINE', 'HYBRID');
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'PAUSED', 'DROPPED', 'COMPLETED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE fee_status AS ENUM ('PAID', 'PENDING', 'PARTIAL', 'WAIVED', 'OVERDUE');
CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'PHONEPE', 'GOOGLE_PAY', 'PAYTM', 'BANK_TRANSFER', 'ONLINE');

-- 2. TABLES

-- Profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  role user_role DEFAULT 'STUDENT' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher Profiles
CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  subjects TEXT[],
  institution TEXT,
  plan subscription_plan DEFAULT 'FREE' NOT NULL,
  subscription_status subscription_status DEFAULT 'TRIAL' NOT NULL,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Profiles
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guardian_name TEXT,
  guardian_phone TEXT,
  institution TEXT,
  class_name TEXT,
  board TEXT, -- CBSE, ICSE, State Board
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  type batch_type DEFAULT 'OFFLINE' NOT NULL,
  status batch_status DEFAULT 'ACTIVE' NOT NULL,
  schedule JSONB NOT NULL, -- [{day: "Monday", startTime: "08:00", endTime: "09:30"}]
  start_date DATE NOT NULL,
  end_date DATE,
  max_students INT DEFAULT 30,
  monthly_fee NUMERIC DEFAULT 0,
  meeting_link TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'ACTIVE' NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  dropped_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(student_id, batch_id)
);

-- Class Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  topic TEXT,
  notes TEXT,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status attendance_status DEFAULT 'PRESENT' NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  UNIQUE(student_id, session_id)
);

-- Fee Payments
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  amount NUMERIC NOT NULL,
  status fee_status DEFAULT 'PENDING' NOT NULL,
  payment_method payment_method,
  paid_at TIMESTAMPTZ,
  due_date DATE NOT NULL,
  receipt_number TEXT UNIQUE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, batch_id, month, year)
);

-- Notes/Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INT,
  is_public BOOLEAN DEFAULT FALSE,
  downloads INT DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES (Row Level Security Examples)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- (More RLS policies would be added here for each table based on roles)
