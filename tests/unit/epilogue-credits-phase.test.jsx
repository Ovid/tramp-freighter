import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Epilogue } from '../../src/features/endgame/Epilogue.jsx';
import { CREDITS_CONFIG } from '../../src/game/constants.js';

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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Epilogue credits phase', () => {
  it('renders EndCredits component when navigating to credits phase', () => {
    const onCreditsComplete = vi.fn();
    render(<Epilogue onCreditsComplete={onCreditsComplete} />);

    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));
    act(() => {
      vi.advanceTimersByTime(
        CREDITS_CONFIG.FADE_OUT_MS + CREDITS_CONFIG.FADE_HOLD_MS
      );
    });

    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('disables Credits button during fade transition', () => {
    const onCreditsComplete = vi.fn();
    render(<Epilogue onCreditsComplete={onCreditsComplete} />);

    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));

    expect(screen.getByText('Credits').disabled).toBe(true);
  });

  it('EndCredits calls onCreditsComplete when skipped', () => {
    const onCreditsComplete = vi.fn();
    render(<Epilogue onCreditsComplete={onCreditsComplete} />);

    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));
    act(() => {
      vi.advanceTimersByTime(
        CREDITS_CONFIG.FADE_OUT_MS + CREDITS_CONFIG.FADE_HOLD_MS
      );
    });

    fireEvent.click(screen.getByLabelText('Skip credits'));
    expect(onCreditsComplete).toHaveBeenCalledOnce();
  });
});
