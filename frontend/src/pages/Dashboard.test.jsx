import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import listsService from '../services/lists';
import toast from 'react-hot-toast';

vi.mock('../services/lists', () => ({
  default: {
    getAll: vi.fn(),
    getAnalytics: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const authState = { user: { id: 1, username: 'tester' }, isAuthenticated: true };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

const analyticsPayload = {
  total_lists: 2,
  public_lists: 1,
  total_items: 5,
  total_comments_received: 3,
  total_list_likes_received: 2,
  total_item_likes_received: 1,
  top_lists: [],
};

const listsPayload = [
  {
    id: 1,
    title: 'My Books',
    description: 'Books I read',
    visibility: 'public',
    items: [{ id: 10 }, { id: 11 }],
  },
  {
    id: 2,
    title: 'Private Notes',
    description: '',
    visibility: 'private',
    items: [],
  },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listsService.getAll.mockResolvedValue({ data: listsPayload });
    listsService.getAnalytics.mockResolvedValue({ data: analyticsPayload });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders dashboard with stats and lists', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // total_lists
    expect(screen.getByText('My Books')).toBeInTheDocument();
    expect(screen.getByText('Private Notes')).toBeInTheDocument();
  });

  it('shows welcome message with username', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('tester')).toBeInTheDocument();
    });
  });

  it('shows + New List button', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('+ New List')).toBeInTheDocument();
    });
  });

  it('opens create list modal', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('+ New List')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New List'));

    await waitFor(() => {
      expect(screen.getByText('Create New List')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('My Books')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete list');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to delete "My Books"/i)).toBeInTheDocument();
    });
  });

  it('deletes a list when confirmed', async () => {
    listsService.delete.mockResolvedValue({});
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('My Books')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete list');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete', { selector: 'button' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete', { selector: 'button' }));

    await waitFor(() => {
      expect(listsService.delete).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('List deleted');
    });
  });

  it('shows error toast when dashboard fails to load', async () => {
    listsService.getAll.mockRejectedValue(new Error('Server down'));
    listsService.getAnalytics.mockRejectedValue(new Error('Server down'));

    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load your dashboard data');
    });
  });

  it('shows empty state when user has no lists', async () => {
    listsService.getAll.mockResolvedValue({ data: [] });
    listsService.getAnalytics.mockResolvedValue({
      data: { ...analyticsPayload, total_lists: 0 },
    });

    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText(/you don't have any lists yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first list/i)).toBeInTheDocument();
    });
  });

  it('displays visibility badges', async () => {
    renderDashboard();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
    });
  });
});
