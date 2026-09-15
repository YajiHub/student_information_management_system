import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RecordsPage } from '../RecordsPage';
import { studentsApi } from '../../../api/students.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { AcademicRecord } from '../../../types/academic.types';

vi.mock('../../../api/students.api', () => ({
  studentsApi: {
    getAll: vi.fn(),
    getAcademicRecord: vi.fn(),
  },
}));

describe('RecordsPage Component & Official Transcript', () => {
  let queryClient: QueryClient;

  const mockAdmin: User = {
    id: 1,
    email: 'admin@university.edu',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const mockRecord: AcademicRecord = {
    student: {
      id: 1,
      student_number: '2022-00001',
      full_name: 'John Doe',
      program: 'BSIT',
      year_level: 3,
      student_type: 'REGULAR',
    },
    summary: {
      total_units_enrolled: 18,
      total_units_passed: 18,
      cumulative_gpa: 1.25,
    },
    terms: [
      {
        academic_term_id: 1,
        academic_year: '2026-2027',
        semester: 'FIRST_SEMESTER',
        term_units: 6,
        term_gwa: 1.25,
        courses: [
          {
            course_code: 'CS 101',
            course_title: 'Intro to Computing',
            units: 3,
            section: 'BSIT-1A',
            midterm_grade: 1.25,
            final_grade: 1.25,
            numerical_grade: 1.25,
            remarks: 'PASSED',
          },
          {
            course_code: 'IT 312',
            course_title: 'Special Topics in Software Dev',
            units: 3,
            section: 'BSIT-3A',
            midterm_grade: 1.25,
            final_grade: 1.25,
            numerical_grade: 1.25,
            remarks: 'PASSED',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(studentsApi.getAll).mockResolvedValue({
      success: true,
      message: 'Students fetched',
      data: [{ id: 1, student_number: '2022-00001', first_name: 'John', last_name: 'Doe' } as any],
    });

    vi.mocked(studentsApi.getAcademicRecord).mockResolvedValue({
      success: true,
      message: 'Record fetched',
      data: mockRecord,
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
            <RecordsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('should render official transcript header, GPA, and student metadata', async () => {
    renderComponent();

    expect(screen.getByText('Official Academic Record & Transcript')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getAllByText(/2022-00001/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('1.25').length).toBeGreaterThan(0);
      expect(screen.getByText('REGULAR LOAD')).toBeInTheDocument();
      expect(screen.getByText('CS 101')).toBeInTheDocument();
      expect(screen.getByText('IT 312')).toBeInTheDocument();
      expect(screen.getByText('Term GWA: 1.25')).toBeInTheDocument();
    });
  });

  it('should invoke window.print when Print Transcript button is clicked', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const printButton = screen.getByRole('button', { name: /Print Transcript/i });
    fireEvent.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });
});
