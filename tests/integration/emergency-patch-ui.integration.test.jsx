import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockApplyEmergencyPatch = vi.fn(() => ({ success: true, reason: null }));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'shipConditionChanged')
      return { hull: 10, engine: 80, lifeSupport: 90 };
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
    applyEmergencyPatch: mockApplyEmergencyPatch,
    cannibalizeSystem: vi.fn(() => ({ success: true, reason: null })),
    getNarrativeFlags: vi.fn(() => ({})),
  }),
}));

describe('Emergency Patch UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show emergency patch option when hull is critical and player is broke', () => {
    render(<RepairPanel onClose={vi.fn()} />);
    const matches = screen.getAllByText(/Emergency Patch/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should call applyEmergencyPatch when emergency patch button is clicked', () => {
    render(<RepairPanel onClose={vi.fn()} />);
    const patchButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent.includes('Emergency Patch') &&
          btn.textContent.includes('Hull')
      );
    expect(patchButtons.length).toBeGreaterThan(0);
    fireEvent.click(patchButtons[0]);
    expect(mockApplyEmergencyPatch).toHaveBeenCalledWith('hull');
  });
});
