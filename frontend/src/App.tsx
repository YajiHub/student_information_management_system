import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { CoursesPage } from './pages/academic/CoursesPage';
import { TermsPage } from './pages/academic/TermsPage';
import { OfferingsPage } from './pages/offerings/OfferingsPage';
import { EnrollmentsPage } from './pages/enrollments/EnrollmentsPage';
import { GradesPage } from './pages/grades/GradesPage';
import { RecordsPage } from './pages/records/RecordsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Admin and Registrar */}
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'REGISTRAR']}>
                      <StudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="academic/terms"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'REGISTRAR']}>
                      <TermsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Academic Courses & Curriculum */}
                <Route
                  path="academic/courses"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'REGISTRAR']}>
                      <CoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="grades"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'REGISTRAR', 'INSTRUCTOR']}>
                      <GradesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Enrollment Desk */}
                <Route
                  path="enrollments"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'REGISTRAR', 'STUDENT']}>
                      <EnrollmentsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Shared: All Authorized Roles */}
                <Route path="offerings" element={<OfferingsPage />} />
                <Route path="records" element={<RecordsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
