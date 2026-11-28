import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Salvage Cargo Cap (#55/56)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should cap salvage cargo to available space with partial-fit message', () => {
    const state = gsm.getState();
    // Fill cargo to 48/50
    state.ship.cargo = [
      { good: 'grain', qty: 48, buyPrice: 10, buySystemName: 'Sol' },
    ];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [
          { good: 'parts', qty: 5, buyPrice: 0, buySystemName: 'Salvage' },
        ],
      },
      description: 'Salvaged parts.',
    };

    const result = gsm.applyEncounterOutcome(outcome);

    const totalCargo = state.ship.cargo.reduce(
      (sum, item) => sum + item.qty,
      0
    );
    expect(totalCargo).toBeLessThanOrEqual(state.ship.cargoCapacity);
    // Should only fit 2 of 5
    const parts = state.ship.cargo.find((item) => item.good === 'parts');
    expect(parts.qty).toBe(2);
    expect(result.salvageMessages).toContain('Could only fit 2 of 5 units.');
  });

  it('keeps salvage apart from a mission stack of the same good and price', () => {
    gsm.updateCargo([
      { good: 'parts', qty: 4, buyPrice: 0, missionId: 'run_1' },
    ]);

    gsm.applyEncounterOutcome({
      success: true,
      costs: {},
      rewards: {
        cargo: [
          { good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvaged' },
        ],
      },
      description: 'Salvaged parts.',
    });

    expect(
      gsm.getShip().cargo.map(({ good, qty, missionId }) => ({
        good,
        qty,
        missionId,
      }))
    ).toEqual([
      { good: 'parts', qty: 4, missionId: 'run_1' },
      { good: 'parts', qty: 3, missionId: undefined },
    ]);
  });

  it('should show partial salvage message when only 1 of multiple fits', () => {
    const state = gsm.getState();
    state.ship.cargo = [
      { good: 'grain', qty: 49, buyPrice: 10, buySystemName: 'Sol' },
    ];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [
          { good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' },
        ],
      },
      description: 'Salvaged parts.',
    };

    const result = gsm.applyEncounterOutcome(outcome);

    const parts = state.ship.cargo.find((item) => item.good === 'parts');
    expect(parts.qty).toBe(1);
    expect(result.salvageMessages).toContain('Could only fit 1 of 3 units.');
  });

  it('should salvage nothing when hold is full with full-hold message', () => {
    const state = gsm.getState();
    state.ship.cargo = [
      { good: 'grain', qty: 50, buyPrice: 10, buySystemName: 'Sol' },
    ];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [
          { good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' },
        ],
      },
      description: 'Salvaged parts.',
    };

    const result = gsm.applyEncounterOutcome(outcome);

    const totalCargo = state.ship.cargo.reduce(
      (sum, item) => sum + item.qty,
      0
    );
    expect(totalCargo).toBe(50);
    const parts = state.ship.cargo.find((item) => item.good === 'parts');
    expect(parts).toBeUndefined();
    expect(result.salvageMessages).toContain(
      'Your hold is full \u2014 nothing salvaged.'
    );
  });

  it('should salvage full amount when space is sufficient (no extra message)', () => {
    const state = gsm.getState();
    state.ship.cargo = [
      { good: 'grain', qty: 20, buyPrice: 10, buySystemName: 'Sol' },
    ];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [
          { good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' },
        ],
      },
      description: 'Salvaged parts.',
    };

    const result = gsm.applyEncounterOutcome(outcome);

    const parts = state.ship.cargo.find((item) => item.good === 'parts');
    expect(parts.qty).toBe(3);
    expect(result.salvageMessages).toHaveLength(0);
  });
});
