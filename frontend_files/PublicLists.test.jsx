import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicLists from './PublicLists';
import { listsAPI } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  listsAPI: {
    getAll: vi.fn(),
  },
}));

const mockLists = [
  {
    id: 1,
    title: 'My Favorite Movies',
    description: 'A collection of must-watch films',
    visibility: 'public',
    user: { username: 'testuser' },
    items: [{ id: 1 }, { id: 2 }],
  },
  {
    id: 2,
    title: 'Book Recommendations',
    description: 'Great books to read',
    visibility: 'public',
    user: { username: 'reader123' },
    items: [{ id: 3 }],
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <PublicLists />
    </BrowserRouter>
  );
};

describe('PublicLists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    listsAPI.getAll.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByRole('status') || document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders lists after successful fetch', async () => {
    listsAPI.getAll.mockResolvedValue({ data: mockLists });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('My Favorite Movies')).toBeInTheDocument();
      expect(screen.getByText('Book Recommendations')).toBeInTheDocument();
    });
  });

  it('displays user attribution for each list', async () => {
    listsAPI.getAll.mockResolvedValue({ data: mockLists });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('by testuser')).toBeInTheDocument();
      expect(screen.getByText('by reader123')).toBeInTheDocument();
    });
  });

  it('displays item count for each list', async () => {
    listsAPI.getAll.mockResolvedValue({ data: mockLists });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('1 items')).toBeInTheDocument();
    });
  });

  it('renders error state on fetch failure', async () => {
    listsAPI.getAll.mockRejectedValue(new Error('Network error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load lists/i)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('renders empty state when no lists', async () => {
    listsAPI.getAll.mockResolvedValue({ data: [] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No lists found/i)).toBeInTheDocument();
    });
  });

  it('renders page header', async () => {
    listsAPI.getAll.mockResolvedValue({ data: mockLists });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Explore Public Lists')).toBeInTheDocument();
    });
  });
});
