import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TermsPage } from '../TermsPage';
import { referenceApi } from '../../../api/reference.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { AcademicTerm } from '../../../types/academic.types';

vi.mock('../../../api/reference.api', () => ({
  referenceApi: {
    getTerms: vi.fn(),
    createTerm: vi.fn(),
  },
}));

describe('TermsPage Component', () => {
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
      start_date: '2026-08-15T00:00:00.000Z',
      end_date: '2026-12-18T00:00:00.000Z',
      is_active: true,
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
            <TermsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render terms table with active status badge', async () => {
    renderComponent();

    expect(screen.getByText('Academic Terms & Semesters')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2026-2027')).toBeInTheDocument();
      expect(screen.getByText('FIRST_SEMESTER')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE TERM')).toBeInTheDocument();
    });
  });

  it('should open create term modal when button is clicked', async () => {
    renderComponent();

    const createBtn = screen.getByRole('button', { name: /Create Academic Term/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /Create Academic Term/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Academic Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Semester/i)).toBeInTheDocument();
  });
});
