import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PavonisRun } from '../../src/features/endgame/PavonisRun.jsx';

vi.mock('../../src/features/endgame/endgame.css', () => ({}));

const mockMarkDirty = vi.fn();

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGame: vi.fn(() => ({ markDirty: mockMarkDirty })),
}));

vi.mock('../../src/components/Button.jsx', () => ({
  Button: ({ children, onClick, ...rest }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

describe('PavonisRun', () => {
  let onComplete;
  let onCancel;

  beforeEach(() => {
    onComplete = vi.fn();
    onCancel = vi.fn();
    mockMarkDirty.mockClear();
  });

  it('renders confirmation screen initially with "POINT OF NO RETURN"', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    expect(screen.getByText('POINT OF NO RETURN')).toBeDefined();
  });

  it('cancel button calls onCancel', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('NOT YET'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm button transitions to jumping phase showing first jump text', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("YES, I'M READY"));

    expect(screen.queryByText('POINT OF NO RETURN')).toBeNull();
    expect(screen.getByText(/Range Extender hums/)).toBeDefined();
  });

  it('confirm calls markDirty on the game state manager', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("YES, I'M READY"));
    expect(mockMarkDirty).toHaveBeenCalledTimes(1);
  });

  it('continue button advances through the jump sequence', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("YES, I'M READY"));

    // First text visible
    expect(screen.getByText(/Range Extender hums/)).toBeDefined();

    // Advance to second text
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText(/Tanaka's voice crackles/)).toBeDefined();

    // Advance to third text
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText(/stars stretch/)).toBeDefined();
  });

  it('final continue button shows "Arrive at Delta Pavonis"', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("YES, I'M READY"));

    // Click through all but the last text (6 items, indices 0-5)
    // We start at index 0, need to click Continue 5 times to reach index 5
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Continue'));
    }

    expect(screen.getByText('You made it.')).toBeDefined();
    expect(screen.getByText('Arrive at Delta Pavonis')).toBeDefined();
  });

  it('after all text, clicking final button calls onComplete', () => {
    render(<PavonisRun onComplete={onComplete} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("YES, I'M READY"));

    // Advance through all 6 texts (click Continue 5 times, then Arrive)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Continue'));
    }

    fireEvent.click(screen.getByText('Arrive at Delta Pavonis'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
