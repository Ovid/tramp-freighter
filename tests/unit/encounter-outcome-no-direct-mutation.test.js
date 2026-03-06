import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('applyEncounterOutcome delegates instead of mutating state directly', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('calls clearHiddenCargo instead of mutating state.ship.hiddenCargo', async () => {
    const { applyEncounterOutcome } = await import(
      '../../src/features/danger/applyEncounterOutcome.js'
    );

    const clearHiddenCargo = vi.fn();
    const mockGSM = {
      getState: () => ({
        ship: { cargo: [], hiddenCargo: [{ good: 'electronics', qty: 2 }] },
        player: { credits: 100, daysElapsed: 5 },
        missions: { active: [] },
      }),
      clearHiddenCargo,
      failMissionsDueToCargoLoss: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
    };

    applyEncounterOutcome(mockGSM, {
      costs: { hiddenCargoConfiscated: true },
    });

    expect(clearHiddenCargo).toHaveBeenCalled();
  });

  it('calls modifyAllPassengerSatisfaction for cost.passengerSatisfaction', async () => {
    const { applyEncounterOutcome } = await import(
      '../../src/features/danger/applyEncounterOutcome.js'
    );

    const modifyAllPassengerSatisfaction = vi.fn();
    const mockGSM = {
      getState: () => ({
        ship: { cargo: [] },
        player: { credits: 100, daysElapsed: 5 },
        missions: {
          active: [
            { type: 'passenger', passenger: { satisfaction: 80 } },
          ],
        },
      }),
      modifyAllPassengerSatisfaction,
      markDirty: vi.fn(),
      emit: vi.fn(),
    };

    applyEncounterOutcome(mockGSM, {
      costs: { passengerSatisfaction: 10 },
    });

    expect(modifyAllPassengerSatisfaction).toHaveBeenCalledWith(-10);
  });

  it('calls modifyAllPassengerSatisfaction for rewards.passengerSatisfaction', async () => {
    const { applyEncounterOutcome } = await import(
      '../../src/features/danger/applyEncounterOutcome.js'
    );

    const modifyAllPassengerSatisfaction = vi.fn();
    const mockGSM = {
      getState: () => ({
        ship: { cargo: [] },
        player: { credits: 100, daysElapsed: 5 },
        missions: {
          active: [
            { type: 'passenger', passenger: { satisfaction: 80 } },
          ],
        },
      }),
      modifyAllPassengerSatisfaction,
      markDirty: vi.fn(),
      emit: vi.fn(),
    };

    applyEncounterOutcome(mockGSM, {
      rewards: { passengerSatisfaction: 15 },
    });

    expect(modifyAllPassengerSatisfaction).toHaveBeenCalledWith(15);
  });
});
