import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EnrollmentsPage } from '../EnrollmentsPage';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { studentsApi } from '../../../api/students.api';
import { referenceApi } from '../../../api/reference.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { Student } from '../../../types/student.types';
import type { CourseOffering, Enrollment, AcademicTerm } from '../../../types/academic.types';

vi.mock('../../../api/enrollments.api', () => ({
  enrollmentsApi: {
    getEnrollments: vi.fn(),
    getOfferings: vi.fn(),
    enroll: vi.fn(),
    drop: vi.fn(),
  },
}));

vi.mock('../../../api/students.api', () => ({
  studentsApi: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../../api/reference.api', () => ({
  referenceApi: {
    getTerms: vi.fn(),
  },
}));

describe('EnrollmentsPage Component & Irregular Load Gauge', () => {
  let queryClient: QueryClient;

  const mockAdmin: User = {
    id: 1,
    email: 'admin@university.edu',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const mockIrregularStudent: Student = {
    id: 42,
    student_number: '2021-00042',
    first_name: 'Irregular',
    last_name: 'Student',
    email: 'irregular@student.edu',
    program_id: 1,
    year_level: 4,
    student_type: 'IRREGULAR',
    max_allowed_units: 15,
    status: 'ACTIVE',
    birth_date: '2002-03-10',
  };

  const mockTerms: AcademicTerm[] = [
    {
      id: 1,
      academic_year: '2026-2027',
      semester: 'FIRST_SEMESTER',
      start_date: '2026-08-15',
      end_date: '2026-12-18',
      is_active: true,
    },
  ];

  const mockEnrollments: Enrollment[] = [
    {
      id: 1,
      student_id: 42,
      course_offering_id: 101,
      enrollment_date: '2026-08-16',
      status: 'ENROLLED',
      courseOffering: {
        id: 101,
        course_id: 1,
        academic_term_id: 1,
        instructor_id: 2,
        section: 'BSIT-4A',
        schedule: 'MWF 08:00 - 09:00 AM',
        room: 'Lab 101',
        capacity: 30,
        course: { id: 1, course_code: 'CS 401', course_title: 'Thesis Writing I', units: 3 },
      },
    },
    {
      id: 2,
      student_id: 42,
      course_offering_id: 102,
      enrollment_date: '2026-08-16',
      status: 'ENROLLED',
      courseOffering: {
        id: 102,
        course_id: 2,
        academic_term_id: 1,
        instructor_id: 2,
        section: 'BSIT-4B',
        schedule: 'TTH 09:00 - 10:30 AM',
        room: 'CL-202',
        capacity: 30,
        course: { id: 2, course_code: 'IT 412', course_title: 'Systems Administration', units: 3 },
      },
    },
  ];

  const mockOfferings: CourseOffering[] = [
    {
      id: 103,
      course_id: 3,
      academic_term_id: 1,
      instructor_id: 2,
      section: 'BSIT-3C',
      schedule: 'MWF 01:00 - 02:30 PM',
      room: 'Lab 305',
      capacity: 30,
      enrolled_count: 5,
      course: { id: 3, course_code: 'IT 315', course_title: 'Web Systems', units: 3 },
    },
    {
      id: 104,
      course_id: 4,
      academic_term_id: 1,
      instructor_id: 2,
      section: 'BSIT-3D',
      schedule: 'Sat 08:00 - 05:00 PM',
      room: 'Main Hall',
      capacity: 30,
      enrolled_count: 10,
      course: { id: 4, course_code: 'IT 499', course_title: 'Practicum Internship', units: 10 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(referenceApi.getTerms).mockResolvedValue({
      success: true,
      message: 'Terms fetched',
      data: mockTerms,
    });

    vi.mocked(studentsApi.getAll).mockResolvedValue({
      success: true,
      message: 'Students fetched',
      data: [mockIrregularStudent],
      meta: { page: 1, per_page: 10, total_records: 1, total_pages: 1, has_next: false, has_prev: false },
    });

    vi.mocked(enrollmentsApi.getEnrollments).mockResolvedValue({
      success: true,
      message: 'Enrollments fetched',
      data: mockEnrollments,
    });

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      success: true,
      message: 'Offerings fetched',
      data: mockOfferings,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: mockAdmin,
              token: 'tok',
              isAuthenticated: true,
              isLoading: false,
              login: vi.fn(),
              logout: vi.fn(),
            }}
          >
            <EnrollmentsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('should display Load Gauge with 15 units limit for irregular student', async () => {
    renderComponent();

    expect(screen.getByText('Enrollment Console')).toBeInTheDocument();

    await waitFor(() => {
      // 2 enrolled courses * 3 units = 6 units
      expect(screen.getByText('IRREGULAR • MAX 15 UNITS')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText(/40% utilized/i)).toBeInTheDocument();
      expect(screen.getByText('Capacity left:')).toBeInTheDocument();
      expect(screen.getByText('9 units')).toBeInTheDocument();
    });
  });

  it('should render active enrolled courses and allow dropping', async () => {
    vi.mocked(enrollmentsApi.drop).mockResolvedValue({
      success: true,
      message: 'Dropped',
      data: null,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('CS 401')).toBeInTheDocument();
      expect(screen.getByText('IT 412')).toBeInTheDocument();
    });

    const dropButton = screen.getByRole('button', { name: /Drop course CS 401/i });
    fireEvent.click(dropButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(enrollmentsApi.drop).toHaveBeenCalledWith(1);
    });
  });

  it('should disable enroll button with Exceeds Limit when course units exceed irregular cap', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('IT 315')).toBeInTheDocument();
      expect(screen.getByText('IT 499')).toBeInTheDocument();
    });

    // IT 315 has 3 units: 6 + 3 = 9 <= 15 -> Available to Enroll
    const enrollBtn = screen.getByRole('button', { name: /Enroll in section BSIT-3C/i });
    expect(enrollBtn).toBeInTheDocument();

    // IT 499 has 10 units: 6 + 10 = 16 > 15 -> Exceeds Limit!
    expect(screen.getByText('Exceeds Limit')).toBeInTheDocument();
  });
});
