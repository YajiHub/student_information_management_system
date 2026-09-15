import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { AuthContext } from '../../../context/AuthContext';
import type { User } from '../../../types/auth.types';

describe('Sidebar Component Role-Based Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebarWithUser = (user: Partial<User> | null) => {
    const mockAuthContext = {
      user: user as User | null,
      token: user ? 'mock-token' : null,
      isAuthenticated: !!user,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };

    return render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('should render Admin-only navigation links when logged in as ADMIN', () => {
    renderSidebarWithUser({
      id: 1,
      email: 'admin@university.edu',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(screen.getByText('Students Directory')).toBeInTheDocument();
    expect(screen.getByText('Academic Terms')).toBeInTheDocument();
    expect(screen.getByText('Programs & Courses')).toBeInTheDocument();
    expect(screen.getByText('Course Offerings')).toBeInTheDocument();
    expect(screen.getByText('Enrollment Console')).toBeInTheDocument();
    expect(screen.getByText('Grades Entry')).toBeInTheDocument();
    expect(screen.getByText('Academic Records')).toBeInTheDocument();
  });

  it('should hide administrative links when logged in as STUDENT', () => {
    renderSidebarWithUser({
      id: 2,
      email: 'student@student.edu',
      name: 'Student User',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    expect(screen.queryByText('Students Directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Academic Terms')).not.toBeInTheDocument();
    expect(screen.queryByText('Programs & Courses')).not.toBeInTheDocument();
    expect(screen.queryByText('Grades Entry')).not.toBeInTheDocument();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Course Offerings')).toBeInTheDocument();
    expect(screen.getByText('Enrollment Console')).toBeInTheDocument();
    expect(screen.getByText('Academic Records')).toBeInTheDocument();
  });

  it('should display instructor-specific links when logged in as INSTRUCTOR', () => {
    renderSidebarWithUser({
      id: 3,
      email: 'faculty@university.edu',
      name: 'Faculty User',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    expect(screen.queryByText('Students Directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Academic Terms')).not.toBeInTheDocument();
    expect(screen.queryByText('Enrollment Console')).not.toBeInTheDocument();

    expect(screen.getByText('Programs & Courses')).toBeInTheDocument();
    expect(screen.getByText('Course Offerings')).toBeInTheDocument();
    expect(screen.getByText('Grades Entry')).toBeInTheDocument();
    expect(screen.getByText('Academic Records')).toBeInTheDocument();
  });
});
