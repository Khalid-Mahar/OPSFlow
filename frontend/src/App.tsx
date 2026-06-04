import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './shared/store/auth.store';
import { ThemeProvider } from './shared/store/theme.store';
import AppLayout from './shared/components/layout/AppLayout';
import LoginPage from './modules/auth/LoginPage';
import Dashboard from './modules/dashboard/DashboardPage';
import {
  EmployeesPage, AssetsPage, SimsPage, CredentialsPage,
  ProjectsPage, TasksPage, TodosPage, FilesPage,
  TicketsPage, ActivityLogPage, SettingsPage
} from './modules/pages';

function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { user, loading, can } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading OpsFlow...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<ProtectedRoute permission="employee.view"><EmployeesPage /></ProtectedRoute>} />
        <Route path="assets" element={<ProtectedRoute permission="asset.view"><AssetsPage /></ProtectedRoute>} />
        <Route path="sims" element={<ProtectedRoute permission="sim.view"><SimsPage /></ProtectedRoute>} />
        <Route path="cameras" element={<ProtectedRoute permission="sim.view"><SimsPage /></ProtectedRoute>} />
        <Route path="credentials" element={<ProtectedRoute permission="credential.view"><CredentialsPage /></ProtectedRoute>} />
        <Route path="projects" element={<ProtectedRoute permission="project.view"><ProjectsPage /></ProtectedRoute>} />
        <Route path="tasks" element={<ProtectedRoute permission="task.view"><TasksPage /></ProtectedRoute>} />
        <Route path="todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
        <Route path="tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="files" element={<ProtectedRoute permission="file.view"><FilesPage /></ProtectedRoute>} />
        <Route path="activity" element={<ProtectedRoute permission="audit.view"><ActivityLogPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
