import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';

describe('Cargo confiscation – mission failure', () => {
  let mockGSM;
  let state;

  beforeEach(() => {
    state = {
      player: { credits: 500, daysElapsed: 10, factions: {} },
      ship: {
        fuel: 80,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargo: [
          { good: 'ore', qty: 10, buyPrice: 15 },
          {
            good: 'unmarked_crates',
            qty: 5,
            buyPrice: 0,
            missionId: 'cargo_run_99',
          },
        ],
        hiddenCargo: [],
      },
      missions: {
        active: [
          {
            id: 'cargo_run_99',
            type: 'delivery',
            missionCargo: {
              good: 'unmarked_crates',
              quantity: 5,
              isIllegal: true,
            },
            penalties: { failure: { faction: { traders: -2, outlaws: -2 } } },
          },
        ],
        completed: [],
        failed: [],
      },
    };

    mockGSM = {
      state,
      getState: () => state,
      updateFuel: vi.fn(),
      updateShipCondition: vi.fn(),
      updateCredits: vi.fn(),
      updateCargo: vi.fn((newCargo) => {
        state.ship.cargo = newCargo;
      }),
      updateTime: vi.fn(),
      saveGame: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
      modifyFactionRep: vi.fn(),
      modifyKarma: vi.fn(),
      abandonMission: vi.fn(),
      failMissionsDueToCargoLoss: vi.fn(),
    };
  });

  it('should call failMissionsDueToCargoLoss after cargo loss', () => {
    const outcome = {
      costs: { cargoLoss: true, restrictedGoodsConfiscated: true },
      rewards: {},
    };

    applyEncounterOutcome(mockGSM, outcome);

    expect(mockGSM.failMissionsDueToCargoLoss).toHaveBeenCalled();
  });

  it('should call failMissionsDueToCargoLoss after partial cargo loss', () => {
    const outcome = {
      costs: { cargoPercent: 50 },
      rewards: {},
    };

    applyEncounterOutcome(mockGSM, outcome);

    expect(mockGSM.failMissionsDueToCargoLoss).toHaveBeenCalled();
  });
});
