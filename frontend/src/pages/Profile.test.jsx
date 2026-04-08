import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';
import listsService from '../services/lists';
import authService from '../services/auth';
import toast from 'react-hot-toast';

vi.mock('../services/lists', () => ({
  default: {
    getAll: vi.fn(),
  },
}));

vi.mock('../services/auth', () => ({
  default: {
    mfaSetup: vi.fn(),
    mfaVerify: vi.fn(),
    mfaDisable: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const userState = {
  user: {
    id: 1,
    username: 'tester',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    mfa_enabled: false,
  },
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => userState,
}));

const renderProfile = () =>
  render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  );

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userState.user = {
      id: 1,
      username: 'tester',
      email: 'test@example.com',
      role: 'user',
      status: 'active',
      mfa_enabled: false,
    };
    listsService.getAll.mockResolvedValue({
      data: [
        { id: 1, user_id: 1, visibility: 'public', items: [{ id: 10 }, { id: 11 }] },
        { id: 2, user_id: 1, visibility: 'private', items: [{ id: 12 }] },
        { id: 3, user_id: 99, visibility: 'public', items: [{ id: 20 }] },
      ],
    });
  });

  it('renders user info', async () => {
    renderProfile();
    expect(screen.getByText('tester')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders initials avatar', () => {
    renderProfile();
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('shows stats after loading', async () => {
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 lists owned
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 public
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 total items
    });
  });

  it('shows MFA disabled state with enable button', () => {
    renderProfile();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable mfa/i })).toBeInTheDocument();
  });

  it('starts MFA setup flow', async () => {
    authService.mfaSetup.mockResolvedValue({
      data: { otp_secret: 'TESTSECRET123', provisioning_uri: 'otpauth://totp/test' },
    });

    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /enable mfa/i }));

    await waitFor(() => {
      expect(screen.getByText('TESTSECRET123')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
    });
  });

  it('verifies MFA code and enables', async () => {
    authService.mfaSetup.mockResolvedValue({
      data: { otp_secret: 'SECRET', provisioning_uri: 'otpauth://totp/test' },
    });
    authService.mfaVerify.mockResolvedValue({});

    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /enable mfa/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify & enable/i }));

    await waitFor(() => {
      expect(authService.mfaVerify).toHaveBeenCalledWith('123456');
      expect(toast.success).toHaveBeenCalledWith(
        'MFA enabled! You will need your authenticator on next login.'
      );
    });
  });

  it('shows disable button when MFA is enabled', () => {
    userState.user.mfa_enabled = true;
    renderProfile();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disable mfa/i })).toBeInTheDocument();
  });

  it('disables MFA', async () => {
    userState.user.mfa_enabled = true;
    authService.mfaDisable.mockResolvedValue({});

    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /disable mfa/i }));

    await waitFor(() => {
      expect(authService.mfaDisable).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('MFA disabled');
    });
  });

  it('has navigation links', () => {
    renderProfile();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Explore Lists')).toBeInTheDocument();
  });
});
