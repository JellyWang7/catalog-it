import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListFormModal from './ListFormModal';

describe('ListFormModal', () => {
  it('renders create form with empty fields', () => {
    render(
      <ListFormModal
        title="Create New List"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Create New List')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('My awesome list')).toHaveValue('');
    expect(screen.getByPlaceholderText('What is this list about?')).toHaveValue('');
    expect(screen.getByText('Create List')).toBeInTheDocument();
  });

  it('renders edit form with pre-filled values', () => {
    render(
      <ListFormModal
        title="Edit List"
        list={{ title: 'My List', description: 'A list', visibility: 'public' }}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Edit List')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('My awesome list')).toHaveValue('My List');
    expect(screen.getByPlaceholderText('What is this list about?')).toHaveValue('A list');
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('submits form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ListFormModal
        title="Create New List"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('My awesome list'), {
      target: { value: 'New Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('What is this list about?'), {
      target: { value: 'A description' },
    });
    fireEvent.click(screen.getByText('Create List'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'New Title',
        description: 'A description',
        visibility: 'private',
      });
    });
  });

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn();
    render(
      <ListFormModal
        title="Test"
        onSubmit={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has visibility select with all options', () => {
    render(
      <ListFormModal
        title="Test"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/private — only you can see/i)).toBeInTheDocument();
    expect(screen.getByText(/public — visible to everyone/i)).toBeInTheDocument();
    expect(screen.getByText(/shared — visible to invited/i)).toBeInTheDocument();
  });

  it('disables submit while saving', async () => {
    let resolveSubmit;
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveSubmit = resolve; })
    );

    render(
      <ListFormModal
        title="Test"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('My awesome list'), {
      target: { value: 'Title' },
    });
    fireEvent.click(screen.getByText('Create List'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    resolveSubmit();
  });
});
