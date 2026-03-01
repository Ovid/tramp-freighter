import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

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

  it('re-checks completable missions when MISSIONS_CHANGED fires', () => {
    const { rerender } = render(<MissionCompleteNotifier />);

    // Called once on mount
    const callsAfterMount = getCompletableMissions.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Simulate MISSIONS_CHANGED by returning a new missions reference
    useGameEvent.mockReturnValue({ active: [{ id: 'mission-1' }], completed: [] });

    act(() => {
      rerender(<MissionCompleteNotifier />);
    });

    // Should have been called again after the missions reference changed
    expect(getCompletableMissions.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });
});
