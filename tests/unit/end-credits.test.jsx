import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndCredits } from '../../src/features/endgame/EndCredits.jsx';

vi.mock('../../src/context/GameContext', () => ({
  useGame: () => ({
    getShip: () => ({ name: 'The Rusty Bucket' }),
  }),
}));

// jsdom doesn't support Element.animate
beforeAll(() => {
  Element.prototype.animate = vi.fn(() => ({
    onfinish: null,
    cancel: vi.fn(),
  }));
});

describe('EndCredits', () => {
  const onCreditsComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('renders NPC cast members', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    expect(screen.getByText(/Wei Chen/)).toBeTruthy();
    expect(screen.getByText(/Marcus Cole/)).toBeTruthy();
  });

  it('renders the player ship name', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    expect(screen.getByText('The Rusty Bucket')).toBeTruthy();
    expect(screen.getByText('as itself')).toBeTruthy();
  });

  it('renders skip button', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    expect(screen.getByLabelText('Skip credits')).toBeTruthy();
  });

  it('calls onCreditsComplete when skip is clicked', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    fireEvent.click(screen.getByLabelText('Skip credits'));
    expect(onCreditsComplete).toHaveBeenCalledOnce();
  });

  it('renders disclaimer text', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    expect(screen.getByText(/fictitious/)).toBeTruthy();
  });
});
