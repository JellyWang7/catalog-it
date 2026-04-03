import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Home from './Home';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  it('renders the hero section', () => {
    renderHome();
    expect(screen.getByText(/the cataloging/i)).toBeInTheDocument();
    expect(screen.getByText(/productivity/i)).toBeInTheDocument();
  });

  it('has CTA links for explore and signup', () => {
    renderHome();
    expect(screen.getByText(/explore public lists/i)).toBeInTheDocument();
    expect(screen.getByText(/start cataloging now/i)).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    renderHome();
    expect(screen.getByText('Organize Anything')).toBeInTheDocument();
    expect(screen.getByText('Rate & Review')).toBeInTheDocument();
    expect(screen.getByText('Share Publicly')).toBeInTheDocument();
  });

  it('links to signup when not authenticated', () => {
    renderHome();
    const startLink = screen.getByText(/start cataloging now/i);
    expect(startLink.closest('a')).toHaveAttribute('href', '/signup');
  });
});

describe('Home (authenticated)', () => {
  it('links to dashboard when authenticated', async () => {
    vi.resetModules();

    vi.doMock('../context/AuthContext', () => ({
      useAuth: () => ({ isAuthenticated: true }),
    }));

    const { default: HomeAuth } = await import('./Home');

    render(
      <MemoryRouter>
        <HomeAuth />
      </MemoryRouter>
    );

    const startLink = screen.getByText(/start cataloging now/i);
    expect(startLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});
