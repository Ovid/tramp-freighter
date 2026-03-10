import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';

vi.mock('../../src/context/GameContext', () => ({
  useGame: () => ({
    getServiceDiscount: () => ({ discount: 0, npcName: null }),
  }),
}));

vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [{ id: 0, name: 'Sol', st: 1 }],
}));

vi.mock('../../src/game/game-npcs', () => ({
  getNPCsAtSystem: () => [],
}));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'shipConditionChanged')
      return { hull: 5, engine: 80, lifeSupport: 90 };
    if (eventName === 'creditsChanged') return 0;
    if (eventName === 'locationChanged') return 0;
    return null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    repair: vi.fn(() => ({ success: true })),
    canGetFreeRepair: vi.fn(() => ({ available: false })),
    getFreeRepair: vi.fn(),
    applyEmergencyPatch: vi.fn(() => ({ success: true, reason: null })),
    cannibalizeSystem: vi.fn(() => ({ success: true, reason: null })),
    getNarrativeFlags: vi.fn(() => ({})),
  }),
}));

describe('Cannibalization UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show cannibalize section when a system is critical', () => {
    render(<RepairPanel onClose={vi.fn()} />);
    expect(screen.getByText('Cannibalize Systems')).toBeInTheDocument();
  });

  it('should show donor systems with available amounts', () => {
    render(<RepairPanel onClose={vi.fn()} />);
    // Should show donor info for Engine and Life Support
    expect(screen.getByText(/Engine.*80%.*max.*59%/)).toBeInTheDocument();
    expect(screen.getByText(/Life Support.*90%.*max.*69%/)).toBeInTheDocument();
  });
});
