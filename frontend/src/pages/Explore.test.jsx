import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Explore from './Explore';
import listsService from '../services/lists';

vi.mock('../services/lists', () => ({
  default: {
    getAll: vi.fn(),
  },
}));

const publicLists = [
  {
    id: 10,
    title: 'Top Movies',
    description: 'Best films of 2025',
    visibility: 'public',
    items: [{ id: 1 }, { id: 2 }],
    user: { username: 'cinephile' },
  },
  {
    id: 11,
    title: 'Vinyl Records',
    description: 'My record collection',
    visibility: 'public',
    items: [{ id: 3 }],
    user: { username: 'musicfan' },
  },
];

const renderExplore = () =>
  render(
    <MemoryRouter>
      <Explore />
    </MemoryRouter>
  );

describe('Explore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listsService.getAll.mockResolvedValue({ data: publicLists });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders header and search', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    expect(screen.getByText('Explore Public Lists')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search public lists...')).toBeInTheDocument();
  });

  it('loads and displays public lists', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Top Movies')).toBeInTheDocument();
      expect(screen.getByText('Vinyl Records')).toBeInTheDocument();
    });
  });

  it('shows author username', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('by cinephile')).toBeInTheDocument();
      expect(screen.getByText('by musicfan')).toBeInTheDocument();
    });
  });

  it('shows item counts', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('1 items')).toBeInTheDocument();
    });
  });

  it('shows empty state when no lists match', async () => {
    listsService.getAll.mockResolvedValue({ data: [] });

    renderExplore();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('No public lists found.')).toBeInTheDocument();
    });
  });

  it('shows sort selector', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
  });

  it('has list count after loading', async () => {
    renderExplore();
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('2 lists found')).toBeInTheDocument();
    });
  });
});
