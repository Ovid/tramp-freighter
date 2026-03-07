import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Epilogue } from '../../src/features/endgame/Epilogue.jsx';

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    getEpilogueData: () => [{ id: 'arrival', text: 'Test arrival text' }],
    getEpilogueStats: () => ({
      daysElapsed: 100,
      systemsVisited: 5,
      creditsEarned: 10000,
      missionsCompleted: 3,
      trustedNPCs: 1,
      cargoHauled: 200,
      jumpsCompleted: 50,
    }),
  }),
}));

vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getShip: () => ({ name: 'Test Ship' }),
  }),
}));

beforeAll(() => {
  Element.prototype.animate = vi.fn(() => ({
    onfinish: null,
    cancel: vi.fn(),
  }));
});

describe('Epilogue credits phase', () => {
  it('renders EndCredits component when navigating to credits phase', () => {
    const onReturnToTitle = vi.fn();
    render(<Epilogue onReturnToTitle={onReturnToTitle} />);

    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));

    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('EndCredits passes onReturnToTitle through', () => {
    const onReturnToTitle = vi.fn();
    render(<Epilogue onReturnToTitle={onReturnToTitle} />);

    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));

    fireEvent.click(screen.getByLabelText('Skip credits'));
    fireEvent.click(screen.getByText('Return to Title'));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });
});
