import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with email and password', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows link to signup and forgot password', () => {
    renderLogin();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('submits credentials and navigates on success', async () => {
    mockLogin.mockResolvedValue({ token: 'jwt123', user: { id: 1 } });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(toast.success).toHaveBeenCalledWith('Welcome back!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('shows MFA input when mfa_required returned', async () => {
    mockLogin.mockResolvedValue({ mfa_required: true });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'mfa@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter your authenticator code/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Authenticator Code')).toBeInTheDocument();
    });
  });

  it('shows error toast on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid email or password' } },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  it('shows generic error when no server message', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'));

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'x@x.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.');
    });
  });

  it('disables submit button while loading', async () => {
    let resolveLogin;
    mockLogin.mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled();
    });

    resolveLogin({ token: 'jwt', user: { id: 1 } });
  });
});
