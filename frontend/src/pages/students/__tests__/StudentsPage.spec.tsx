import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StudentsPage } from '../StudentsPage';
import { studentsApi } from '../../../api/students.api';
import { referenceApi } from '../../../api/reference.api';
import type { Student } from '../../../types/student.types';

vi.mock('../../../api/students.api', () => ({
  studentsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../api/reference.api', () => ({
  referenceApi: {
    getPrograms: vi.fn(),
  },
}));

describe('StudentsPage Component', () => {
  let queryClient: QueryClient;

  const mockPrograms = [
    { id: 1, code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
    { id: 2, code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
  ];

  const mockStudents: Student[] = [
    {
      id: 1,
      student_number: '2022-00001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@student.edu',
      program_id: 1,
      year_level: 3,
      student_type: 'REGULAR',
      max_allowed_units: 23,
      status: 'ACTIVE',
      program: { id: 1, code: 'BSIT', name: 'BSIT' },
      birth_date: '2004-01-01',
    },
    {
      id: 2,
      student_number: '2021-00042',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@student.edu',
      program_id: 1,
      year_level: 4,
      student_type: 'IRREGULAR',
      max_allowed_units: 15,
      status: 'ACTIVE',
      program: { id: 1, code: 'BSIT', name: 'BSIT' },
      birth_date: '2003-05-12',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(referenceApi.getPrograms).mockResolvedValue({
      success: true,
      message: 'Programs retrieved',
      data: mockPrograms,
    });

    vi.mocked(studentsApi.getAll).mockResolvedValue({
      success: true,
      message: 'Students retrieved',
      data: mockStudents,
      meta: {
        page: 1,
        per_page: 10,
        total_records: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <StudentsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('should render page title, search bar, and action buttons', async () => {
    renderComponent();

    expect(screen.getByText('Students Directory')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by student number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register New Student/i })).toBeInTheDocument();
  });

  it('should display students with correct classification badges', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('2022-00001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('REGULAR')).toBeInTheDocument();
      expect(screen.getByText('23 units')).toBeInTheDocument();

      expect(screen.getByText('2021-00042')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('IRREGULAR')).toBeInTheDocument();
      expect(screen.getByText('15 units')).toBeInTheDocument();
    });
  });

  it('should open register student modal when register button is clicked', async () => {
    renderComponent();

    const registerBtn = screen.getByRole('button', { name: /Register New Student/i });
    fireEvent.click(registerBtn);

    expect(screen.getByRole('heading', { name: /Register New Student/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Institutional Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Classification \/ Load Type/i)).toBeInTheDocument();
  });

  it('should adjust max units default to 15 when Irregular classification is selected', async () => {
    renderComponent();

    const registerBtn = screen.getByRole('button', { name: /Register New Student/i });
    fireEvent.click(registerBtn);

    const typeSelect = screen.getByLabelText(/Classification \/ Load Type/i);
    const maxUnitsInput = screen.getByLabelText(/Max Allowed Units/i) as HTMLInputElement;

    expect(maxUnitsInput.value).toBe('23');

    fireEvent.change(typeSelect, { target: { value: 'IRREGULAR' } });

    expect(maxUnitsInput.value).toBe('15');
  });
});
