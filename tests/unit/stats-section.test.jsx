import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsSection } from '../../src/features/achievements/StatsSection';

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGameState: () => ({
    getStatsSnapshot: () => ({
      visitedCount: 0,
      jumpsCompleted: 0,
      daysElapsed: 0,
      creditsEarned: 0,
      cargoHauled: 0,
      charitableActs: 0,
      dangerFlags: {},
    }),
  }),
}));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));

describe('StatsSection headings', () => {
  it('labels the counters section "Ship\'s Log"', () => {
    render(<StatsSection />);
    expect(screen.getByText("Ship's Log")).toBeInTheDocument();
  });
});
