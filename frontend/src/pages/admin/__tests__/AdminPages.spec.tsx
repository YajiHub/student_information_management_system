import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UsersPage } from '../UsersPage';
import { LogsPage } from '../LogsPage';
import { usersApi } from '../../../api/users.api';
import { auditApi } from '../../../api/audit.api';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';
import type { ManagedUser, AuditLogEntry } from '../../../types/admin.types';

vi.mock('../../../api/users.api', () => ({
  usersApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getInstructors: vi.fn(),
  },
}));

vi.mock('../../../api/audit.api', () => ({
  auditApi: {
    getLogs: vi.fn(),
  },
}));

describe('Admin System Management Pages', () => {
  let queryClient: QueryClient;

  const mockAdminUser: User = {
    id: 1,
    email: 'admin@university.edu',
    name: 'Admin Master',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  const mockUsers: ManagedUser[] = [
    {
      id: 1,
      email: 'admin@university.edu',
      name: 'Admin Master',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    {
      id: 2,
      email: 'prof.smith@university.edu',
      name: 'Prof. Smith',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    },
  ];

  const mockLogs: AuditLogEntry[] = [
    {
      id: 101,
      actor_id: 1,
      actor_email: 'admin@university.edu',
      actor_role: 'ADMIN',
      action: 'CREATE',
      method: 'POST',
      path: '/api/v1/courses',
      resource: 'courses',
      resource_id: '5',
      status_code: 201,
      success: true,
      duration_ms: 45,
      ip: '127.0.0.1',
      user_agent: 'Vitest/TestAgent',
      error_message: null,
      created_at: '2026-09-22T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.mocked(usersApi.getAll).mockResolvedValue({
      success: true,
      message: 'Users fetched',
      data: mockUsers,
      meta: {
        total_records: 2,
        page: 1,
        per_page: 10,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    });

    vi.mocked(auditApi.getLogs).mockResolvedValue({
      success: true,
      message: 'Audit logs fetched',
      data: mockLogs,
      meta: {
        total_records: 1,
        page: 1,
        per_page: 15,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    });
  });

  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthContext.Provider
            value={{
              user: mockAdminUser,
              token: 'mock-token',
              isAuthenticated: true,
              isLoading: false,
              login: vi.fn(),
              logout: vi.fn(),
            }}
          >
            {ui}
          </AuthContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render UsersPage with user accounts list', async () => {
    renderWithContext(<UsersPage />);

    expect(screen.getByRole('heading', { name: /User Accounts/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
      expect(screen.getByText('Prof. Smith')).toBeInTheDocument();
      expect(screen.getByText('admin@university.edu')).toBeInTheDocument();
      expect(screen.getByText('prof.smith@university.edu')).toBeInTheDocument();
    });
  });

  it('should render LogsPage with activity log entries', async () => {
    renderWithContext(<LogsPage />);

    expect(screen.getByRole('heading', { name: /System Activity Logs/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('/api/v1/courses')).toBeInTheDocument();
      expect(screen.getByText('HTTP 201')).toBeInTheDocument();
      expect(screen.getByText('45 ms')).toBeInTheDocument();
    });
  });
});
