import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: vi.fn(),
}));

vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn(),
}));

import { useGameAction } from '../../src/hooks/useGameAction';
import { useGameEvent } from '../../src/hooks/useGameEvent.js';
import { MissionCompleteNotifier } from '../../src/features/missions/MissionCompleteNotifier.jsx';

describe('MissionCompleteNotifier MISSIONS_CHANGED reactivity', () => {
  let getCompletableMissions;

  beforeEach(() => {
    getCompletableMissions = vi.fn().mockReturnValue([]);
    useGameAction.mockReturnValue({
      completeMission: vi.fn(),
      getCompletableMissions,
    });
    // Initial missions state
    useGameEvent.mockReturnValue({ active: [], completed: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses unambiguous button labels for Claim Reward vs Later', () => {
    getCompletableMissions.mockReturnValue([
      { id: 'm1', title: 'Deliver Ore', grossCredits: 500 },
    ]);
    useGameAction.mockReturnValue({
      completeMission: vi.fn(),
      getCompletableMissions,
      calculateTradeWithholding: (amount) => ({
        withheld: 0,
        playerReceives: amount,
      }),
    });

    render(<MissionCompleteNotifier />);

    expect(
      screen.getByRole('button', { name: /claim reward/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument();
    // Old ambiguous labels should not exist
    expect(
      screen.queryByRole('button', { name: /^dismiss$/i })
    ).not.toBeInTheDocument();
  });

  it('re-checks completable missions when MISSIONS_CHANGED fires', () => {
    const { rerender } = render(<MissionCompleteNotifier />);

    // Called once on mount
    const callsAfterMount = getCompletableMissions.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Simulate MISSIONS_CHANGED by returning a new missions reference
    useGameEvent.mockReturnValue({
      active: [{ id: 'mission-1' }],
      completed: [],
    });

    act(() => {
      rerender(<MissionCompleteNotifier />);
    });

    // Should have been called again after the missions reference changed
    expect(getCompletableMissions.mock.calls.length).toBeGreaterThan(
      callsAfterMount
    );
  });
});
