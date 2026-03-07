import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndCredits } from '../../src/features/endgame/EndCredits.jsx';

vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
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
  const onReturnToTitle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('renders NPC cast members', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText(/Wei Chen/)).toBeTruthy();
    expect(screen.getByText(/Marcus Cole/)).toBeTruthy();
  });

  it('renders the player ship name', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText('The Rusty Bucket')).toBeTruthy();
    expect(screen.getByText('as itself')).toBeTruthy();
  });

  it('renders skip button', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByLabelText('Skip credits')).toBeTruthy();
  });

  it('shows Return to Title button when skip is clicked', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    fireEvent.click(screen.getByLabelText('Skip credits'));
    expect(screen.getByText('Return to Title')).toBeTruthy();
  });

  it('calls onReturnToTitle when Return to Title button is clicked', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    fireEvent.click(screen.getByLabelText('Skip credits'));
    fireEvent.click(screen.getByText('Return to Title'));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });

  it('renders disclaimer text', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText(/fictitious/)).toBeTruthy();
  });
});
