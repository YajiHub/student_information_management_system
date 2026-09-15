import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../context/AuthContext';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { StudentsPage } from '../../pages/students/StudentsPage';
import { authApi } from '../../api/auth.api';
import { studentsApi } from '../../api/students.api';
import { referenceApi } from '../../api/reference.api';
import { enrollmentsApi } from '../../api/enrollments.api';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

vi.mock('../../api/students.api', () => ({
  studentsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/reference.api', () => ({
  referenceApi: {
    getPrograms: vi.fn(),
    getCourses: vi.fn(),
    getTerms: vi.fn(),
  },
}));

vi.mock('../../api/enrollments.api', () => ({
  enrollmentsApi: {
    getOfferings: vi.fn(),
    getEnrollments: vi.fn(),
    enroll: vi.fn(),
    drop: vi.fn(),
  },
}));

describe('Integrated Application Flows', () => {
  let queryClient: QueryClient;

  const mockAdminUser = {
    id: 1,
    email: 'admin@university.edu',
    name: 'System Admin',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      message: 'Login successful',
      data: {
        access_token: 'valid-jwt-token',
        user: mockAdminUser,
      },
    });

    vi.mocked(referenceApi.getTerms).mockResolvedValue({
      success: true,
      message: 'Terms',
      data: [
        {
          id: 1,
          academic_year: '2026-2027',
          semester: 'FIRST_SEMESTER',
          start_date: '2026-08-15',
          end_date: '2026-12-18',
          is_active: true,
        },
      ],
    });

    vi.mocked(referenceApi.getPrograms).mockResolvedValue({
      success: true,
      message: 'Programs',
      data: [{ id: 1, code: 'BSIT', name: 'Information Technology' }],
    });

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      success: true,
      message: 'Offerings',
      data: [],
    });

    vi.mocked(studentsApi.getAll).mockResolvedValue({
      success: true,
      message: 'Students',
      data: [
        {
          id: 1,
          student_number: '2021-00042',
          first_name: 'Alex',
          last_name: 'Irregular',
          email: 'alex@student.edu',
          program_id: 1,
          year_level: 3,
          student_type: 'IRREGULAR',
          max_allowed_units: 15,
          status: 'ACTIVE',
          birth_date: '2003-01-01',
        },
      ],
      meta: { page: 1, per_page: 10, total_records: 1, total_pages: 1, has_next: false, has_prev: false },
    });
  });

  const renderAppFlow = (initialEntries = ['/login']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should authenticate user and navigate to dashboard with active metrics', async () => {
    renderAppFlow(['/login']);

    const emailInput = screen.getByLabelText(/University Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'admin@university.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'AdminPass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@university.edu',
        password: 'AdminPass123!',
      });
      expect(screen.getByText(/Welcome back, System Admin!/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-2027 \(FIRST_SEMESTER\)/i)).toBeInTheDocument();
    });
  });

  it('should display students directory with irregular load tags and allow registration', async () => {
    renderAppFlow(['/students']);

    await waitFor(() => {
      expect(screen.getByText('Students Directory')).toBeInTheDocument();
      expect(screen.getByText('2021-00042')).toBeInTheDocument();
      expect(screen.getByText('IRREGULAR')).toBeInTheDocument();
      expect(screen.getByText('15 units')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /Register New Student/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole('heading', { name: /Register New Student/i })).toBeInTheDocument();
  });
});
