import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ListDetail from './ListDetail';
import listsService from '../services/lists';
import itemsService from '../services/items';
import toast from 'react-hot-toast';

vi.mock('../services/lists', () => ({
  default: {
    getById: vi.fn(),
    delete: vi.fn(),
    share: vi.fn(),
    getAttachments: vi.fn(),
    createAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    like: vi.fn(),
    unlike: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock('../services/items', () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    like: vi.fn(),
    unlike: vi.fn(),
  },
}));

const authState = {
  user: { id: 2, username: 'tester' },
  isAuthenticated: true,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderListDetail = () =>
  render(
    <MemoryRouter initialEntries={['/lists/1']}>
      <Routes>
        <Route path="/lists/:id" element={<ListDetail />} />
      </Routes>
    </MemoryRouter>
  );

const listPayload = {
  id: 1,
  user_id: 1,
  title: 'Test List',
  description: 'A public list',
  visibility: 'public',
  likes_count: 0,
  liked_by_current_user: false,
  items: [
    {
      id: 100,
      list_id: 1,
      name: 'Item One',
      category: 'General',
      notes: 'Notes',
      rating: 4,
      likes_count: 0,
      liked_by_current_user: false,
    },
  ],
  comments: [
    {
      id: 500,
      body: 'Existing comment',
      user_id: 3,
      list_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 3, username: 'someone' },
    },
    {
      id: 501,
      body: 'My own comment',
      user_id: 2,
      list_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { id: 2, username: 'tester' },
    },
  ],
  attachments: [
    {
      id: 900,
      kind: 'link',
      title: 'Reference Docs',
      url: 'https://example.com/docs',
      created_at: new Date().toISOString(),
    },
  ],
};

describe('ListDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listsService.getById.mockResolvedValue({ data: listPayload });
    authState.user = { id: 2, username: 'tester' };
    authState.isAuthenticated = true;
  });

  it('toggles list like state', async () => {
    listsService.like.mockResolvedValue({
      data: { list_id: 1, likes_count: 1, liked_by_current_user: true },
    });

    renderListDetail();

    await screen.findByText('Test List');

    fireEvent.click(screen.getByRole('button', { name: /i like it/i }));

    await waitFor(() => {
      expect(listsService.like).toHaveBeenCalledWith(1);
      expect(screen.getByRole('button', { name: /liked/i })).toHaveTextContent('(1)');
    });
  });

  it('posts a comment', async () => {
    listsService.addComment.mockResolvedValue({
      data: {
        id: 10,
        body: 'Looks awesome!',
        user_id: 2,
        list_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: { id: 2, username: 'tester' },
      },
    });

    renderListDetail();

    await screen.findByText('Comments');

    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: 'Looks awesome!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(listsService.addComment).toHaveBeenCalledWith(1, 'Looks awesome!');
      expect(screen.getByText('Looks awesome!')).toBeInTheDocument();
    });
  });

  it('toggles item like state', async () => {
    itemsService.like.mockResolvedValue({
      data: { item_id: 100, likes_count: 1, liked_by_current_user: true },
    });

    renderListDetail();

    await screen.findByText('Item One');
    fireEvent.click(screen.getByTitle('Like this item'));

    await waitFor(() => {
      expect(itemsService.like).toHaveBeenCalledWith(100);
      expect(screen.getByTitle('Like this item')).toHaveTextContent('(1)');
    });
  });

  it('shows delete for comment owner only', async () => {
    renderListDetail();

    await screen.findByText('My own comment');
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    // one for owner comment, plus potential item/list delete buttons are not rendered for non-owner list
    expect(deleteButtons.length).toBe(1);
  });

  it('hides comment delete when unauthenticated', async () => {
    authState.user = null;
    authState.isAuthenticated = false;

    renderListDetail();
    await screen.findByText('Existing comment');

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('blocks unauthenticated like/comment actions', async () => {
    authState.user = null;
    authState.isAuthenticated = false;

    renderListDetail();
    await screen.findByText('Comments');

    fireEvent.click(screen.getByRole('button', { name: /i like it/i }));
    expect(listsService.like).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Please log in to use this feature');

    fireEvent.change(screen.getByPlaceholderText(/log in to leave a comment/i), {
      target: { value: 'Should not post' },
    });
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }));
    expect(listsService.addComment).not.toHaveBeenCalled();
  });

  it('blocks owner from like/comment actions in UI', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;

    renderListDetail();
    await screen.findByText('Test List');

    expect(screen.getByText(/owner cannot like own list/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/owners cannot comment on their own lists/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /post comment/i })).toBeDisabled();
  });

  it('shows friendly moderation message on comment 422', async () => {
    listsService.addComment.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ['Content contains inappropriate language.'] },
      },
    });

    renderListDetail();

    await screen.findByText('Comments');
    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: 'n1gg@' },
    });
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Content contains inappropriate language. Please keep comments clean and age-friendly.'
      );
    });
  });

  it('creates a link attachment from the attachments section', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockResolvedValue({
      data: {
        id: 901,
        kind: 'link',
        title: 'API Guide',
        url: 'https://example.com/api-guide',
        created_at: new Date().toISOString(),
      },
    });

    renderListDetail();
    await screen.findByText('Attachments');

    fireEvent.change(screen.getAllByPlaceholderText(/attachment title/i)[0], {
      target: { value: 'API Guide' },
    });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com\/resource/i), {
      target: { value: 'https://example.com/api-guide' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add link/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalledWith(1, {
        kind: 'link',
        title: 'API Guide',
        url: 'https://example.com/api-guide',
      });
      expect(screen.getByText('API Guide')).toBeInTheDocument();
    });
  });
});
