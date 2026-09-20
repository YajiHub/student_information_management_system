import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

vi.mock('../../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render login form with title, inputs, and submit button', () => {
    renderLoginPage();

    expect(screen.getByText('Apex Institute of Technology')).toBeInTheDocument();
    expect(screen.getByLabelText(/University Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should populate fields when Evaluator Quick-Fill buttons are clicked', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/University Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;

    // 1. Admin
    fireEvent.click(screen.getByRole('button', { name: /admin@sims\.edu/i }));
    expect(emailInput.value).toBe('admin@sims.edu');
    expect(passwordInput.value).toBe('Password123!');

    // 2. Registrar
    fireEvent.click(screen.getByRole('button', { name: /registrar@sims\.edu/i }));
    expect(emailInput.value).toBe('registrar@sims.edu');
    expect(passwordInput.value).toBe('Password123!');

    // 3. Instructor
    fireEvent.click(screen.getByRole('button', { name: /prof\.cruz@sims\.edu/i }));
    expect(emailInput.value).toBe('prof.cruz@sims.edu');
    expect(passwordInput.value).toBe('Password123!');

    // 4. Regular Student
    fireEvent.click(screen.getByRole('button', { name: /student1@sims\.edu/i }));
    expect(emailInput.value).toBe('student1@sims.edu');
    expect(passwordInput.value).toBe('Password123!');

    // 5. Irregular Student
    fireEvent.click(screen.getByRole('button', { name: /student2@sims\.edu/i }));
    expect(emailInput.value).toBe('student2@sims.edu');
    expect(passwordInput.value).toBe('Password123!');
  });

  it('should call authApi.login and handle successful authentication', async () => {
    const mockUser = {
      id: 1,
      email: 'admin@university.edu',
      name: 'System Administrator',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
    };

    vi.mocked(authApi.login).mockResolvedValueOnce({
      success: true,
      message: 'Login successful',
      data: {
        access_token: 'mock-jwt-token-xyz',
        user: mockUser,
      },
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/University Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'admin@university.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'AdminPass123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@university.edu',
        password: 'AdminPass123!',
      });
      expect(localStorage.getItem('sims_access_token')).toBe('mock-jwt-token-xyz');
      expect(JSON.parse(localStorage.getItem('sims_user') || '{}')).toEqual(mockUser);
    });
  });

  it('should show error banner when authentication fails', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          message: 'Invalid credentials. Please verify email and password.',
        },
      },
    });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/University Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@university.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials. Please verify email and password.');
    });
  });
});
