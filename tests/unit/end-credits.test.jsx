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

  it('renders a pause button for pausing the credits scroll', () => {
    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    expect(pauseBtn).toBeInTheDocument();
  });

  it('toggles pause/play when pause button is clicked', () => {
    // Need a real animation mock that supports pause/play
    Element.prototype.animate = vi.fn(() => ({
      onfinish: null,
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      playState: 'running',
    }));

    render(<EndCredits onCreditsComplete={onCreditsComplete} />);
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);

    // After clicking pause, button should say "Play" or "Resume"
    expect(
      screen.getByRole('button', { name: /play|resume/i })
    ).toBeInTheDocument();
  });

  it('toggles pause/play on Space key', () => {
    Element.prototype.animate = vi.fn(() => ({
      onfinish: null,
      cancel: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      playState: 'running',
    }));

    render(<EndCredits onCreditsComplete={onCreditsComplete} />);

    // Press Space to pause
    fireEvent.keyDown(window, { key: ' ' });
    expect(
      screen.getByRole('button', { name: /play|resume/i })
    ).toBeInTheDocument();

    // Press Space to resume
    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
