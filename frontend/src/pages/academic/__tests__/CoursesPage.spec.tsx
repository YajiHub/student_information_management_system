import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CoursesPage } from '../CoursesPage';
import { referenceApi } from '../../../api/reference.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';

vi.mock('../../../api/reference.api', () => ({
  referenceApi: {
    getPrograms: vi.fn(),
    getCourses: vi.fn(),
    createProgram: vi.fn(),
    createCourse: vi.fn(),
  },
}));

describe('CoursesPage Component', () => {
  let queryClient: QueryClient;

  const mockAdmin: User = {
    id: 1,
    email: 'admin@university.edu',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const mockCourses = [
    { id: 1, course_code: 'CS 101', course_title: 'Intro to Computing', units: 3, description: 'Fundamentals' },
    { id: 2, course_code: 'IT 312', course_title: 'Special Topics in Software Dev', units: 3, description: 'Modern dev' },
  ];

  const mockPrograms = [
    { id: 1, code: 'BSIT', name: 'Bachelor of Science in Information Technology', description: 'IT Degree' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(referenceApi.getCourses).mockResolvedValue({
      success: true,
      message: 'Courses fetched',
      data: mockCourses,
    });

    vi.mocked(referenceApi.getPrograms).mockResolvedValue({
      success: true,
      message: 'Programs fetched',
      data: mockPrograms,
    });
  });

  const renderComponent = () => {
    return render(
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
            <CoursesPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render course catalog tab by default with course items', async () => {
    renderComponent();

    expect(screen.getByText('Programs & Course Catalog')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('CS 101')).toBeInTheDocument();
      expect(screen.getByText('Intro to Computing')).toBeInTheDocument();
      expect(screen.getByText('IT 312')).toBeInTheDocument();
    });
  });

  it('should switch to programs tab and display programs', async () => {
    renderComponent();

    const programsTab = screen.getByRole('button', { name: /Academic Programs/i });
    fireEvent.click(programsTab);

    await waitFor(() => {
      expect(screen.getByText('BSIT')).toBeInTheDocument();
      expect(screen.getByText('Bachelor of Science in Information Technology')).toBeInTheDocument();
    });
  });

  it('should open create course modal when New Course button is clicked', async () => {
    renderComponent();

    const newCourseBtn = screen.getByRole('button', { name: /New Course/i });
    fireEvent.click(newCourseBtn);

    expect(screen.getByRole('heading', { name: /Create Course Catalog Item/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Title/i)).toBeInTheDocument();
  });
});
