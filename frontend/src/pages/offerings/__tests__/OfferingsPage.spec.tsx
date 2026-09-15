import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { OfferingsPage } from '../OfferingsPage';
import { enrollmentsApi } from '../../../api/enrollments.api';
import { referenceApi } from '../../../api/reference.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { CourseOffering, AcademicTerm, Course } from '../../../types/academic.types';
import type { Student } from '../../../types/student.types';

vi.mock('../../../api/enrollments.api', () => ({
  enrollmentsApi: {
    getOfferings: vi.fn(),
    createOffering: vi.fn(),
    getOfferingStudents: vi.fn(),
  },
}));

vi.mock('../../../api/reference.api', () => ({
  referenceApi: {
    getTerms: vi.fn(),
    getCourses: vi.fn(),
  },
}));

describe('OfferingsPage Component', () => {
  let queryClient: QueryClient;

  const mockAdmin: User = {
    id: 1,
    email: 'admin@university.edu',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
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

  const mockCourses: Course[] = [
    { id: 1, course_code: 'IT 312', course_title: 'Special Topics in Software Dev', units: 3 },
  ];

  const mockOfferings: CourseOffering[] = [
    {
      id: 101,
      course_id: 1,
      academic_term_id: 1,
      instructor_id: 2,
      section: 'BSIT-3A',
      schedule: 'MWF 09:00 - 10:30 AM',
      room: 'Lab 302',
      capacity: 30,
      enrolled_count: 15,
      course: mockCourses[0],
      instructor: { id: 2, name: 'Dr. Santos', email: 'santos@university.edu', role: 'INSTRUCTOR', status: 'ACTIVE' },
    },
    {
      id: 102,
      course_id: 1,
      academic_term_id: 1,
      instructor_id: 2,
      section: 'BSIT-3B',
      schedule: 'TTH 10:30 - 12:00 PM',
      room: 'Lab 401',
      capacity: 25,
      enrolled_count: 25,
      course: mockCourses[0],
      instructor: { id: 2, name: 'Dr. Santos', email: 'santos@university.edu', role: 'INSTRUCTOR', status: 'ACTIVE' },
    },
  ];

  const mockStudents: Student[] = [
    {
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

    vi.mocked(referenceApi.getCourses).mockResolvedValue({
      success: true,
      message: 'Courses fetched',
      data: mockCourses,
    });

    vi.mocked(enrollmentsApi.getOfferings).mockResolvedValue({
      success: true,
      message: 'Offerings fetched',
      data: mockOfferings,
    });

    vi.mocked(enrollmentsApi.getOfferingStudents).mockResolvedValue({
      success: true,
      message: 'Students fetched',
      data: mockStudents,
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
            <OfferingsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('should render course offerings table with capacity metrics', async () => {
    renderComponent();

    expect(screen.getByText('Course Offerings & Sections')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('BSIT-3A')).toBeInTheDocument();
      expect(screen.getByText('15 / 30')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();

      expect(screen.getByText('BSIT-3B')).toBeInTheDocument();
      expect(screen.getByText('25 / 25')).toBeInTheDocument();
      expect(screen.getByText('SECTION FULL')).toBeInTheDocument();
    });
  });

  it('should open student roster modal when Roster button is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('BSIT-3A')).toBeInTheDocument();
    });

    const rosterBtn = screen.getByRole('button', { name: /View Roster for BSIT-3A/i });
    fireEvent.click(rosterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Section Roster: BSIT-3A/i)).toBeInTheDocument();
      expect(screen.getByText('2022-00001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should open create section offering modal when button clicked', async () => {
    renderComponent();

    const createBtn = screen.getByRole('button', { name: /Create Section Offering/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /Create Section Offering/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Section Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maximum Capacity/i)).toBeInTheDocument();
  });
});
