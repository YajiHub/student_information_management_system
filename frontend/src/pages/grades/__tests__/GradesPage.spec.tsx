import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { GradesPage } from '../GradesPage';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { gradesApi } from '../../../api/grades.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { CourseOffering, Enrollment } from '../../../types/academic.types';

vi.mock('../../../api/enrollments.api', () => ({
  enrollmentsApi: {
    getOfferings: vi.fn(),
    getEnrollments: vi.fn(),
  },
}));

vi.mock('../../../api/grades.api', () => ({
  gradesApi: {
    getGrades: vi.fn(),
    encodeGrade: vi.fn(),
    updateGrade: vi.fn(),
  },
}));

describe('GradesPage Component', () => {
  let queryClient: QueryClient;

  const mockInstructor: User = {
    id: 2,
    email: 'santos.j@university.edu',
    name: 'Dr. Juan Santos',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
  };

  const mockOfferings: CourseOffering[] = [
    {
      id: 201,
      course_id: 1,
      academic_term_id: 1,
      instructor_id: 2,
      section: 'BSIT-3A',
      schedule: 'MWF 10:00 - 11:30 AM',
      room: 'Lab 402',
      capacity: 30,
      course: { id: 1, course_code: 'IT 312', course_title: 'Special Topics in Software Dev', units: 3 },
    },
  ];

  const mockEnrollments: Enrollment[] = [
    {
      id: 501,
      student_id: 1,
      course_offering_id: 201,
      enrollment_date: '2026-08-15',
      status: 'ENROLLED',
      student: {
        id: 1,
        student_number: '2022-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@student.edu',
        program_id: 1,
        year_level: 3,
        student_type: 'REGULAR',
        max_allowed_units: 23,
        status: 'ACTIVE',
        birth_date: '2004-01-01',
      },
      grade: {
        id: 99,
        enrollment_id: 501,
        midterm_grade: 1.5,
        final_grade: 1.25,
        numerical_grade: 1.35,
        remarks: 'PASSED',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      success: true,
      message: 'Offerings fetched',
      data: mockOfferings,
    });

    vi.mocked(enrollmentsApi.getEnrollments).mockResolvedValue({
      success: true,
      message: 'Enrollments fetched',
      data: mockEnrollments,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: mockInstructor,
              token: 'tok',
              isAuthenticated: true,
              isLoading: false,
              login: vi.fn(),
              logout: vi.fn(),
            }}
          >
            <GradesPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('should render grades entry page with enrolled students and existing grades', async () => {
    renderComponent();

    expect(screen.getByText('Grades Entry & Encoding')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2022-00001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getAllByText('1.35').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('PASSED')).toBeInTheDocument();
    });
  });

  it('should allow updating grade and submitting save', async () => {
    vi.mocked(gradesApi.updateGrade).mockResolvedValue({
      success: true,
      message: 'Updated',
      data: {
        id: 99,
        enrollment_id: 501,
        midterm_grade: 1.25,
        final_grade: 1.0,
        numerical_grade: 1.1,
        remarks: 'PASSED',
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const finalGradeInput = screen.getByLabelText(/Final grade for John Doe/i);
    fireEvent.change(finalGradeInput, { target: { value: '1.00' } });

    const saveButton = screen.getByRole('button', { name: /Save grade for John Doe/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(gradesApi.updateGrade).toHaveBeenCalledWith(99, {
        midterm_grade: 1.5,
        final_grade: 1,
      });
    });
  });
});
