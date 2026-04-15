/**
 * App.jsx — Route definitions only
 *
 * No UI, no components — just routing structure.
 * Auth state comes from Zustand (authStore) via useAuth().
 *
 * Route categories:
 *  - Public      → accessible to everyone
 *  - GuestOnly   → redirect to /dashboard if already logged in
 *  - Protected   → redirect to /login if not authenticated
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

// ─── Layouts ─────────────────────────────────────────────────────
import AuthLayout      from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// ─── Pages ───────────────────────────────────────────────────────
import LandingPage         from '@/pages/LandingPage';
import LoginPage           from '@/pages/auth/LoginPage';
import RegisterPage        from '@/pages/auth/RegisterPage';
import DashboardPage       from '@/pages/dashboard/DashboardPage';
import NewInterviewPage    from '@/pages/interview/NewInterviewPage';
import InterviewListPage   from '@/pages/interview/InterviewListPage';
import InterviewSessionPage from '@/pages/interview/InterviewSessionPage';
import SessionResultPage   from '@/pages/interview/SessionResultPage';
import SessionHistoryPage  from '@/pages/session/SessionHistoryPage';
import ResumesPage         from '@/pages/resume/ResumesPage';
import ProfilePage         from '@/pages/profile/ProfilePage';
import Jobs                from '@/pages/Jobs';

// ─── Route Guards ─────────────────────────────────────────────────

/**
 * ProtectedRoute — Requires authentication.
 * Redirects to /login if user is not authenticated.
 * Zustand persist rehydrates synchronously, so no spinner needed.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * GuestRoute — Only for non-authenticated users.
 * Redirects to /dashboard if already logged in.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Guest-only (auth) ────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={<GuestRoute><LoginPage /></GuestRoute>}
        />
        <Route
          path="/register"
          element={<GuestRoute><RegisterPage /></GuestRoute>}
        />
      </Route>

      {/* ── Protected (dashboard) ────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"                    element={<DashboardPage />} />
        <Route path="/interviews"                   element={<InterviewListPage />} />
        <Route path="/interviews/new"               element={<NewInterviewPage />} />
        <Route path="/interviews/:id/session"       element={<InterviewSessionPage />} />
        <Route path="/sessions/:id/results"         element={<SessionResultPage />} />
        <Route path="/sessions"                     element={<SessionHistoryPage />} />
        <Route path="/resumes"                      element={<ResumesPage />} />
        <Route path="/jobs"                         element={<Jobs />} />
        <Route path="/profile"                      element={<ProfilePage />} />
      </Route>

      {/* ── 404 fallback ─────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
