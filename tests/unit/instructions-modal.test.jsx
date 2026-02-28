import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstructionsModal } from '../../src/features/instructions/InstructionsModal.jsx';

describe('InstructionsModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<InstructionsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("Captain's Briefing")).not.toBeInTheDocument();
  });

  it('should render all sections when isOpen is true', () => {
    render(<InstructionsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Captain's Briefing")).toBeInTheDocument();
    expect(screen.getByText('Your Goal')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Stations')).toBeInTheDocument();
    expect(screen.getByText('The Stars')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
