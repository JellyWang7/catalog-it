import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Signup from './Signup';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSignup = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderSignup = () =>
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderSignup();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows link to sign in', () => {
    renderSignup();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    renderSignup();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('creates account and navigates to dashboard', async () => {
    mockSignup.mockResolvedValue({ token: 'jwt', user: { id: 1 } });

    renderSignup();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secure123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'secure123',
        password_confirmation: 'secure123',
      });
      expect(toast.success).toHaveBeenCalledWith('Account created! Welcome to CatalogIt!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('shows server error message', async () => {
    mockSignup.mockRejectedValue({
      response: { status: 422, data: { errors: ['Email has already been taken'] } },
    });

    renderSignup();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dup@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email has already been taken');
    });
  });

  it('shows offline message when backend is unreachable', async () => {
    mockSignup.mockRejectedValue({ message: 'Network Error' });

    renderSignup();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass12' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass12' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot reach the API')
      );
    });
  });

  it('disables submit button while creating', async () => {
    let resolveSignup;
    mockSignup.mockImplementation(
      () => new Promise((resolve) => { resolveSignup = resolve; })
    );

    renderSignup();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'u' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass12' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'pass12' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    resolveSignup({ token: 'jwt', user: { id: 1 } });
  });
});
