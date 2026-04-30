// ─── Shared TypeScript Types for TutionHut ────────────────────────────────

// ─── Users & Auth ────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  language: string;
  created_at: string;
  updated_at: string;
}

// ─── Subscription ─────────────────────────────────────────────
export type SubscriptionPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'UNLIMITED';
export type PlanStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL';

export const PLAN_LIMITS: Record<SubscriptionPlan, { students: number; batches: number; storageMb: number; price: number }> = {
  FREE:      { students: 10,  batches: 1,  storageMb: 0,    price: 0 },
  STARTER:   { students: 30,  batches: 3,  storageMb: 500,  price: 199 },
  GROWTH:    { students: 75,  batches: 10, storageMb: 5120, price: 399 },
  PRO:       { students: 150, batches: 25, storageMb: 20480, price: 699 },
  UNLIMITED: { students: 9999, batches: 999, storageMb: 51200, price: 1199 },
};

// ─── Teacher ──────────────────────────────────────────────────
export interface TeacherProfile {
  id: string;
  user_id: string;
  bio: string | null;
  subjects: string[] | null;
  institution: string | null;
  city: string | null;
  state: string | null;
  plan: SubscriptionPlan;
  subscription_status: PlanStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  max_batches: number;
  max_students: number;
  storage_limit_mb: number;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
}

// ─── Student ──────────────────────────────────────────────────
export interface StudentProfile {
  id: string;
  user_id: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  institution: string | null;
  class_name: string | null;
  board: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
}

// ─── Batch ────────────────────────────────────────────────────
export type BatchType = 'OFFLINE' | 'ONLINE' | 'HYBRID';
export type BatchStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'UPCOMING';

export interface ScheduleSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface Batch {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  description: string | null;
  type: BatchType;
  status: BatchStatus;
  schedule: ScheduleSlot[];
  start_date: string;
  end_date: string | null;
  max_students: number;
  monthly_fee: number;
  meeting_link: string | null;
  is_public: boolean;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
  // joined
  teacher?: TeacherProfile;
  _count?: { enrollments: number };
}

// ─── Enrollment ───────────────────────────────────────────────
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'DROPPED' | 'COMPLETED';

export interface Enrollment {
  id: string;
  student_id: string;
  batch_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  dropped_at: string | null;
  notes: string | null;
  // joined
  student?: StudentProfile;
  batch?: Batch;
}

// ─── Session ──────────────────────────────────────────────────
export interface Session {
  id: string;
  batch_id: string;
  title: string | null;
  date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  notes: string | null;
  is_cancelled: boolean;
  created_at: string;
  // joined
  batch?: Batch;
  attendances?: Attendance[];
}

// ─── Attendance ───────────────────────────────────────────────
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: string;
  student_id: string;
  session_id: string;
  status: AttendanceStatus;
  marked_at: string;
  remark: string | null;
  // joined
  student?: StudentProfile;
  session?: Session;
}

// ─── Fee Payment ──────────────────────────────────────────────
export type FeeStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'WAIVED' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'ONLINE';

export interface FeePayment {
  id: string;
  student_id: string;
  batch_id: string;
  month: number;
  year: number;
  amount: number;
  status: FeeStatus;
  payment_method: PaymentMethod | null;
  paid_at: string | null;
  due_date: string | null;
  receipt_number: string | null;
  remark: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  student?: StudentProfile;
  batch?: Batch;
}

// ─── Note ─────────────────────────────────────────────────────
export interface Note {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_kb: number | null;
  is_public: boolean;
  downloads: number;
  uploaded_by: string | null;
  created_at: string;
  // joined
  batch?: Batch;
}

// ─── Video Lecture ────────────────────────────────────────────
export type LectureStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface VideoLecture {
  id: string;
  batch_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  topic: string | null;
  status: LectureStatus;
  is_public: boolean;
  views: number;
  uploaded_by: string | null;
  created_at: string;
  // joined
  batch?: Batch;
}

// ─── Progress Record ──────────────────────────────────────────
export interface ProgressRecord {
  id: string;
  student_id: string;
  batch_id: string | null;
  month: number;
  year: number;
  total_sessions: number;
  present_count: number;
  late_count: number;
  attendance_pct: number;
  exam_score: number | null;
  exam_total: number | null;
  performance_note: string | null;
  teacher_rating: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Announcement ─────────────────────────────────────────────
export type AnnouncementScope = 'BATCH' | 'ALL' | 'PLATFORM';

export interface Announcement {
  id: string;
  teacher_id: string | null;
  batch_id: string | null;
  title: string;
  body: string;
  scope: AnnouncementScope;
  is_pinned: boolean;
  created_at: string;
  // joined
  teacher?: TeacherProfile;
  batch?: Batch;
}

// ─── Notification ─────────────────────────────────────────────
export type NotificationType =
  | 'fee_paid' | 'attendance' | 'new_note' | 'new_lecture'
  | 'announcement' | 'enrollment' | 'subscription';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── UI Helpers ───────────────────────────────────────────────
export interface DashboardStats {
  activeStudents: number;
  todaySessions: number;
  pendingFees: number;
  newThisMonth: number;
}

export interface MonthYear {
  month: number;
  year: number;
}
