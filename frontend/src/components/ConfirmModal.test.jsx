import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title and message', () => {
    render(
      <ConfirmModal
        title="Delete Item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        title="Test"
        message="Msg"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        title="Test"
        message="Msg"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('defaults confirm label to "Confirm"', () => {
    render(
      <ConfirmModal
        title="T"
        message="M"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('applies danger styling when danger prop is true', () => {
    render(
      <ConfirmModal
        title="T"
        message="M"
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        danger
      />
    );
    const btn = screen.getByText('Delete');
    expect(btn.className).toContain('bg-red-600');
  });
});
