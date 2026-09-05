import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectWorkspacePage } from './pages/projects/ProjectWorkspacePage';
import { ProjectInvitationPage } from './pages/projects/ProjectInvitationPage';
import { MyTasksPage } from './pages/tasks/MyTasksPage';
import { AccountPage } from './pages/settings/AccountPage';
import { GlobalSearch, useGlobalSearch } from './components/search/GlobalSearch';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  const { checkAuth } = useAuthStore();
  const search = useGlobalSearch();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <GlobalSearch isOpen={search.isOpen} onClose={search.close} />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProjectsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProjectWorkspacePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/invitations/:token"
          element={<ProjectInvitationPage />}
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <AppShell>
                <MyTasksPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings/account"
          element={
            <ProtectedRoute>
              <AppShell>
                <AccountPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
