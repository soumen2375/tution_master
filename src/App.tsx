import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { I18nProvider } from '@/lib/i18n';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OnboardingPage from '@/pages/OnboardingPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';

// Teacher Pages
import TeacherLayout from '@/pages/teacher/TeacherLayout';
import TeacherDashboard from '@/pages/teacher/DashboardPage';
import BatchesPage from '@/pages/teacher/BatchesPage';
import NewBatchPage from '@/pages/teacher/NewBatchPage';
import BatchDetailPage from '@/pages/teacher/BatchDetailPage';
import TeacherFeesPage from '@/pages/teacher/FeesPage';
import MaterialsPage from '@/pages/teacher/MaterialsPage';
import StudentsPage from '@/pages/teacher/StudentsPage';
import AnnouncementsPage from '@/pages/teacher/AnnouncementsPage';
import TeacherAttendancePage from '@/pages/teacher/AttendancePage';
import TeacherSettingsPage from '@/pages/teacher/SettingsPage';

// Student Pages
import StudentLayout from '@/pages/student/StudentLayout';
import StudentDashboard from '@/pages/student/DashboardPage';
import StudentBatches from '@/pages/student/BatchesPage';
import StudentAttendance from '@/pages/student/AttendancePage';
import StudentFees from '@/pages/student/FeesPage';
import StudentNotes from '@/pages/student/NotesPage';
import StudentProgress from '@/pages/student/ProgressPage';
import JoinBatch from '@/pages/student/JoinPage';

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* ── Teacher ── */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="batches/new" element={<NewBatchPage />} />
              <Route path="batches/:id" element={<BatchDetailPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="fees" element={<TeacherFeesPage />} />
              <Route path="attendance" element={<TeacherAttendancePage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="settings" element={<TeacherSettingsPage />} />
            </Route>

            {/* ── Student ── */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="batches" element={<StudentBatches />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="fees" element={<StudentFees />} />
              <Route path="notes" element={<StudentNotes />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="join" element={<JoinBatch />} />
            </Route>

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </I18nProvider>
    </ThemeProvider>
  );
}
