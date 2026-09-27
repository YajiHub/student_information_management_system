import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import { studentsApi } from '../../api/students.api';
import { referenceApi } from '../../api/reference.api';
import { enrollmentsApi } from '../../api/enrollments.api';
import * as AuthHook from '../../hooks/useAuth';

vi.mock('../../api/students.api', () => ({
  studentsApi: {
    getAll: vi.fn(),
    getAcademicRecord: vi.fn(),
  },
}));

vi.mock('../../api/reference.api', () => ({
  referenceApi: {
    getTerms: vi.fn(),
  },
}));

vi.mock('../../api/enrollments.api', () => ({
  enrollmentsApi: {
    getOfferings: vi.fn(),
  },
}));

describe('DashboardPage Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders student dashboard with student stats and schedule for regular student', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      user: {
        id: 7,
        email: 'student1@sims.edu',
        name: 'Juan Dela Cruz',
        role: 'STUDENT',
        status: 'ACTIVE',
        student: {
          id: 7,
          student_number: '2026-00001',
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          email: 'student1@sims.edu',
          program_id: 1,
          status: 'ACTIVE',
          student_type: 'REGULAR',
          year_level: 4,
          max_allowed_units: 24,
          program: {
            id: 1,
            code: 'BSIT',
            name: 'Bachelor of Science in Information Technology',
          },
        },
      },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(referenceApi.getTerms).mockResolvedValue({
      data: [{ id: 1, academic_year: '2026-2027', semester: 'FIRST', is_current: true }],
    } as any);

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      data: [],
    } as any);

    vi.mocked(studentsApi.getAcademicRecord).mockResolvedValue({
      data: {
        student: { id: 7, student_number: '2026-00001' },
        summary: {
          cumulative_gpa: '1.25',
          total_credited_units: 18,
          total_enrolled_courses: 6,
        },
        terms: [
          {
            term_id: 1,
            academic_term: { academic_year: '2026-2027', semester: 'FIRST' },
            term_gwa: '1.25',
            total_units: 6,
            courses: [
              {
                course_code: 'IT111',
                course_title: 'Introduction to IT',
                units: 3,
                midterm_grade: '1.25',
                final_grade: '1.25',
                remarks: 'PASSED',
              },
            ],
          },
        ],
      },
    } as any);

    renderDashboard();

    expect(await screen.findByText(/Welcome back, Juan Dela Cruz!/i)).toBeInTheDocument();
    const gpaElements = await screen.findAllByText('1.25');
    expect(gpaElements.length).toBeGreaterThan(0);
    expect(screen.getByText('REGULAR LOAD')).toBeInTheDocument();
    expect(await screen.findByText(/Current Semester Schedule/i)).toBeInTheDocument();
    expect(await screen.findByText('IT111')).toBeInTheDocument();
  });

  it('renders irregular load badge and warning for irregular student', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      user: {
        id: 8,
        email: 'student2@sims.edu',
        name: 'Maria Santos',
        role: 'STUDENT',
        status: 'ACTIVE',
        student: {
          id: 8,
          student_number: '2026-00002',
          first_name: 'Maria',
          last_name: 'Santos',
          email: 'student2@sims.edu',
          program_id: 1,
          status: 'ACTIVE',
          student_type: 'IRREGULAR',
          year_level: 2,
          max_allowed_units: 18,
          program: {
            id: 1,
            code: 'BSIT',
            name: 'Bachelor of Science in Information Technology',
          },
        },
      },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(referenceApi.getTerms).mockResolvedValue({
      data: [{ id: 1, academic_year: '2026-2027', semester: 'FIRST', is_current: true }],
    } as any);

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      data: [],
    } as any);

    vi.mocked(studentsApi.getAcademicRecord).mockResolvedValue({
      data: {
        student: { id: 8, student_number: '2026-00002' },
        summary: {
          cumulative_gpa: '1.75',
          total_credited_units: 12,
          total_enrolled_courses: 4,
        },
        terms: [],
      },
    } as any);

    renderDashboard();

    expect(await screen.findByText('IRREGULAR LOAD')).toBeInTheDocument();
  });

  it('renders institutional analytics for ADMIN', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'admin@sims.edu',
        name: 'Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(studentsApi.getAll).mockResolvedValue({
      data: [],
      meta: { total_records: 42 },
    } as any);

    vi.mocked(referenceApi.getTerms).mockResolvedValue({
      data: [{ id: 1, academic_year: '2026-2027', semester: 'FIRST', is_current: true }],
    } as any);

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      data: [
        { id: 1, is_active: true },
        { id: 2, is_active: true },
      ],
    } as any);

    renderDashboard();

    expect(await screen.findByText(/Welcome back, Administrator!/i)).toBeInTheDocument();
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Course Sections')).toBeInTheDocument();
  });
});
