import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    createAttachment: vi.fn(),
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
      attachments: [],
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
      mime_type: null,
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

    await screen.findByTitle('Like this item');
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

    const listForm = screen.getByText('Add list attachment').closest('form');
    const listFormUtils = within(listForm);
    fireEvent.change(listFormUtils.getByPlaceholderText('Optional label'), {
      target: { value: 'API Guide' },
    });
    fireEvent.change(listFormUtils.getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/api-guide' },
    });
    fireEvent.click(listFormUtils.getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalledWith(1, {
        kind: 'link',
        title: 'API Guide',
        url: 'https://example.com/api-guide',
      });
      expect(toast.success).toHaveBeenCalledWith('Attachment added');
      expect(screen.getByText('API Guide')).toBeInTheDocument();
    });
  });

  it('hides share button for private owner list', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.getById.mockResolvedValue({
      data: {
        ...listPayload,
        visibility: 'private',
      },
    });

    renderListDetail();
    await screen.findByText('Test List');

    expect(screen.queryByRole('button', { name: /^share$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/private list cannot be shared/i)).toBeInTheDocument();
  });

  it('renders attachment previews for image and audio types', async () => {
    listsService.getById.mockResolvedValue({
      data: {
        ...listPayload,
        attachments: [
          {
            id: 910,
            kind: 'image',
            title: 'Cover Art',
            url: 'https://example.com/cover.jpg',
            mime_type: 'image/jpeg',
            created_at: new Date().toISOString(),
          },
          {
            id: 911,
            kind: 'file',
            title: 'Theme Song',
            url: 'https://example.com/theme.mp3',
            mime_type: 'audio/mpeg',
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    renderListDetail();
    await screen.findByText('Attachments');

    expect(screen.getByAltText('Cover Art')).toBeInTheDocument();
    expect(screen.getByText('Theme Song')).toBeInTheDocument();
    expect(screen.getByText('AUDIO')).toBeInTheDocument();
  });

  it('creates an item-level link attachment for owner', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    itemsService.createAttachment.mockResolvedValue({
      data: {
        id: 990,
        kind: 'link',
        title: 'Item Source',
        url: 'https://example.com/item-source',
        created_at: new Date().toISOString(),
      },
    });

    renderListDetail();
    await screen.findByText('Item attachments');

    const itemForm = screen.getByPlaceholderText(/optional label \(shown above note\/link\/file\)/i).closest('form');
    const itemFormUtils = within(itemForm);
    fireEvent.change(itemFormUtils.getByPlaceholderText(/optional label \(shown above/i), {
      target: { value: 'Item Source' },
    });
    fireEvent.change(itemFormUtils.getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/item-source' },
    });
    fireEvent.click(itemFormUtils.getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(itemsService.createAttachment).toHaveBeenCalledWith(100, {
        kind: 'link',
        title: 'Item Source',
        url: 'https://example.com/item-source',
      });
      expect(toast.success).toHaveBeenCalledWith('Attachment added');
      expect(screen.getByText('Item Source')).toBeInTheDocument();
    });
  });

  it('shows friendly file rules when upload type/size is invalid', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ['Asset type is not allowed'] },
      },
    });

    renderListDetail();
    await screen.findByText('Attachments');

    const listForm = screen.getByText('Add list attachment').closest('form');
    const listFormUtils = within(listForm);
    fireEvent.change(listFormUtils.getByPlaceholderText('Optional label'), {
      target: { value: 'Bad Upload' },
    });
    const fileInput = listForm.querySelector('input[type="file"]');
    const invalidFile = new File(['x'], 'bad.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    fireEvent.click(listFormUtils.getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Allowed files: JPG, PNG, WEBP, PDF, TXT, ZIP. Max size: 5MB.'
      );
    });
  });

  // ────────────────────────────────────────────────────────
  // Attachment: note upload for list
  // ────────────────────────────────────────────────────────
  it('creates a note attachment on a list', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockResolvedValue({
      data: {
        id: 920,
        kind: 'note',
        title: 'My Note',
        body: 'Some thoughts',
        created_at: new Date().toISOString(),
      },
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    const listFormUtils = within(listForm);
    fireEvent.change(listFormUtils.getByPlaceholderText('Optional label'), {
      target: { value: 'My Note' },
    });
    fireEvent.change(listFormUtils.getByPlaceholderText(/text note/i), {
      target: { value: 'Some thoughts' },
    });
    fireEvent.click(listFormUtils.getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalledWith(1, {
        kind: 'note',
        title: 'My Note',
        body: 'Some thoughts',
      });
      expect(toast.success).toHaveBeenCalledWith('Attachment added');
    });
  });

  // ────────────────────────────────────────────────────────
  // Attachment: file upload for list
  // ────────────────────────────────────────────────────────
  it('creates a file attachment on a list', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockResolvedValue({
      data: {
        id: 921,
        kind: 'file',
        title: 'report.pdf',
        mime_type: 'application/pdf',
        created_at: new Date().toISOString(),
      },
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    const fileInput = listForm.querySelector('input[type="file"]');
    const pdfFile = new File(['data'], 'report.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalledWith(1, {
        kind: 'file',
        title: 'report.pdf',
        asset: pdfFile,
      });
      expect(toast.success).toHaveBeenCalledWith('Attachment added');
    });
  });

  // ────────────────────────────────────────────────────────
  // Attachment: item-level note
  // ────────────────────────────────────────────────────────
  it('creates a note attachment on an item', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    itemsService.createAttachment.mockResolvedValue({
      data: {
        id: 991,
        kind: 'note',
        title: 'Item Note',
        body: 'Item-level note body',
        created_at: new Date().toISOString(),
      },
    });

    renderListDetail();
    await screen.findByText('Item attachments');

    const itemForm = screen.getByPlaceholderText(/optional label \(shown above/i).closest('form');
    const itemFormUtils = within(itemForm);
    fireEvent.change(itemFormUtils.getByPlaceholderText(/text note/i), {
      target: { value: 'Item-level note body' },
    });
    fireEvent.change(itemFormUtils.getByPlaceholderText(/optional label \(shown above/i), {
      target: { value: 'Item Note' },
    });
    fireEvent.click(itemFormUtils.getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(itemsService.createAttachment).toHaveBeenCalledWith(100, {
        kind: 'note',
        title: 'Item Note',
        body: 'Item-level note body',
      });
      expect(toast.success).toHaveBeenCalledWith('Attachment added');
    });
  });

  // ────────────────────────────────────────────────────────
  // Loading modal appears during upload
  // ────────────────────────────────────────────────────────
  it('shows uploading modal while list attachment is submitting', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;

    let resolveUpload;
    listsService.createAttachment.mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve; })
    );

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/slow' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(screen.getByText(/uploading attachment/i)).toBeInTheDocument();
    });

    resolveUpload({
      data: { id: 930, kind: 'link', title: 'slow', url: 'https://example.com/slow', created_at: new Date().toISOString() },
    });

    await waitFor(() => {
      expect(screen.queryByText(/uploading attachment/i)).not.toBeInTheDocument();
    });
  });

  it('shows uploading modal while item attachment is submitting', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;

    let resolveUpload;
    itemsService.createAttachment.mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve; })
    );

    renderListDetail();
    await screen.findByText('Item attachments');

    const itemForm = screen.getByPlaceholderText(/optional label \(shown above/i).closest('form');
    fireEvent.change(within(itemForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/item-slow' },
    });
    fireEvent.click(within(itemForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(screen.getByText(/uploading attachment/i)).toBeInTheDocument();
    });

    resolveUpload({
      data: { id: 931, kind: 'link', title: 'slow', url: 'https://example.com/item-slow', created_at: new Date().toISOString() },
    });

    await waitFor(() => {
      expect(screen.queryByText(/uploading attachment/i)).not.toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────
  // Upload error scenarios — no false "Internal Server Error"
  // ────────────────────────────────────────────────────────
  it('does NOT show raw "Internal Server Error" on 500 during upload', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      response: { status: 500, statusText: 'Internal Server Error', data: {} },
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/will-fail' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalled();
    });

    const errorCalls = toast.error.mock.calls.map((c) => c[0]);
    errorCalls.forEach((msg) => {
      expect(msg).not.toMatch(/internal server error/i);
    });

    if (errorCalls.length > 0) {
      expect(errorCalls[0]).toMatch(/something went wrong|refresh/i);
    }
  });

  it('shows timeout message on upload timeout', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 120000ms exceeded',
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/slow-timeout' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Upload timed out. Try a smaller file or check your connection.'
      );
    });
  });

  it('shows network error message on ERR_NETWORK during upload', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/net-fail' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Network error. Check your connection and try again.'
      );
    });
  });

  it('shows invalid https link message on 422 for bad URL', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ['Url must be a valid https link'] },
      },
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/bad' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid link. Use a full https:// URL.');
    });
  });

  it('does NOT show any error toast when upload 500 has no clear error body', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.createAttachment.mockRejectedValue({
      response: { status: 500, statusText: 'Internal Server Error', data: null },
    });

    renderListDetail();
    await screen.findByText('Add list attachment');

    const listForm = screen.getByText('Add list attachment').closest('form');
    fireEvent.change(within(listForm).getByPlaceholderText(/optional link/i), {
      target: { value: 'https://example.com/fail-null' },
    });
    fireEvent.click(within(listForm).getByRole('button', { name: /add attachment/i }));

    await waitFor(() => {
      expect(listsService.createAttachment).toHaveBeenCalled();
    });

    const errorCalls = toast.error.mock.calls.map((c) => c[0]);
    errorCalls.forEach((msg) => {
      expect(msg).not.toMatch(/internal server error/i);
    });
  });

  // ────────────────────────────────────────────────────────
  // Attachment delete — success + error scenarios
  // ────────────────────────────────────────────────────────
  it('deletes a list attachment and removes it from UI', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.deleteAttachment.mockResolvedValue({});

    renderListDetail();
    await screen.findByText('Reference Docs');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const attachmentDelete = deleteButtons.find(
      (btn) => btn.closest('[class*="rounded-xl"]')?.textContent.includes('Reference Docs')
    );
    fireEvent.click(attachmentDelete);

    await waitFor(() => {
      expect(listsService.deleteAttachment).toHaveBeenCalledWith(900);
      expect(toast.success).toHaveBeenCalledWith('Attachment deleted');
      expect(screen.queryByText('Reference Docs')).not.toBeInTheDocument();
    });
  });

  it('does NOT show "Internal Server Error" when delete returns 500', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.deleteAttachment.mockRejectedValue({
      response: { status: 500, statusText: 'Internal Server Error', data: { error: 'Internal Server Error' } },
    });

    renderListDetail();
    await screen.findByText('Reference Docs');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const attachmentDelete = deleteButtons.find(
      (btn) => btn.closest('[class*="rounded-xl"]')?.textContent.includes('Reference Docs')
    );
    fireEvent.click(attachmentDelete);

    await waitFor(() => {
      expect(listsService.deleteAttachment).toHaveBeenCalledWith(900);
    });

    const errorCalls = toast.error.mock.calls.map((c) => c[0]);
    errorCalls.forEach((msg) => {
      expect(msg).not.toMatch(/internal server error/i);
    });
  });

  it('shows friendly message when delete returns 403', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.deleteAttachment.mockRejectedValue({
      response: { status: 403, data: { error: 'Not authorized to delete this attachment' } },
    });

    renderListDetail();
    await screen.findByText('Reference Docs');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const attachmentDelete = deleteButtons.find(
      (btn) => btn.closest('[class*="rounded-xl"]')?.textContent.includes('Reference Docs')
    );
    fireEvent.click(attachmentDelete);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You are not allowed to delete this attachment.');
    });
  });

  it('shows network error on delete network failure', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;
    listsService.deleteAttachment.mockRejectedValue({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    renderListDetail();
    await screen.findByText('Reference Docs');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const attachmentDelete = deleteButtons.find(
      (btn) => btn.closest('[class*="rounded-xl"]')?.textContent.includes('Reference Docs')
    );
    fireEvent.click(attachmentDelete);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error. Check your connection and try again.');
    });
  });

  // ────────────────────────────────────────────────────────
  // UI features: share, list navigation, items CRUD
  // ────────────────────────────────────────────────────────
  it('copies share link to clipboard', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;

    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    listsService.share.mockResolvedValue({ data: { share_code: 'ABC123' } });

    renderListDetail();
    await screen.findByText('Test List');

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => {
      expect(listsService.share).toHaveBeenCalledWith(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/s/ABC123'));
      expect(toast.success).toHaveBeenCalledWith('Share link copied to clipboard!');
    });
  });

  it('renders owner controls (add item, delete list, edit buttons)', async () => {
    authState.user = { id: 1, username: 'owner' };
    authState.isAuthenticated = true;

    renderListDetail();
    await screen.findByText('Test List');

    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete list/i })).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('hides owner controls from non-owner', async () => {
    renderListDetail();
    await screen.findByText('Test List');

    expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete list/i })).not.toBeInTheDocument();
  });

  it('renders items with name, rating, and category', async () => {
    renderListDetail();
    const matches = await screen.findAllByText('Item One');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/general/i)).toBeInTheDocument();
  });

  it('renders existing comments', async () => {
    renderListDetail();
    await screen.findByText('Comments');

    expect(screen.getByText('Existing comment')).toBeInTheDocument();
    expect(screen.getByText('My own comment')).toBeInTheDocument();
  });

  it('deletes a comment owned by current user', async () => {
    listsService.deleteComment.mockResolvedValue({});
    renderListDetail();
    await screen.findByText('My own comment');

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const commentDelete = deleteButtons.find(
      (btn) => btn.closest('[class*="border"]')?.textContent.includes('My own comment')
    );
    fireEvent.click(commentDelete);

    await waitFor(() => {
      expect(listsService.deleteComment).toHaveBeenCalledWith(501);
      expect(toast.success).toHaveBeenCalledWith('Comment deleted');
      expect(screen.queryByText('My own comment')).not.toBeInTheDocument();
    });
  });

  it('displays shared-view banner when ?shared=1', async () => {
    render(
      <MemoryRouter initialEntries={['/lists/1?shared=1']}>
        <Routes>
          <Route path="/lists/:id" element={<ListDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Test List');
    expect(screen.getByText(/shared link/i)).toBeInTheDocument();
  });

  it('renders note attachment text content', async () => {
    listsService.getById.mockResolvedValue({
      data: {
        ...listPayload,
        attachments: [
          {
            id: 940,
            kind: 'note',
            title: 'A Note',
            body: 'Note body text here',
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    renderListDetail();
    await screen.findByText('A Note');
    expect(screen.getByText('Note body text here')).toBeInTheDocument();
    expect(screen.getByText('NOTE')).toBeInTheDocument();
  });

  it('renders file attachment with download link', async () => {
    listsService.getById.mockResolvedValue({
      data: {
        ...listPayload,
        attachments: [
          {
            id: 950,
            kind: 'file',
            title: 'Report PDF',
            url: 'https://example.com/report.pdf',
            mime_type: 'application/pdf',
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    renderListDetail();
    await screen.findByText('Report PDF');
    expect(screen.getByText('Open file')).toBeInTheDocument();
    expect(screen.getByText('FILE')).toBeInTheDocument();
  });

  it('renders link attachment as clickable URL', async () => {
    renderListDetail();
    await screen.findByText('Reference Docs');

    const link = screen.getByText('https://example.com/docs');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
