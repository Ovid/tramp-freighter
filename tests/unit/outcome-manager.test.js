import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Encounter and narrative outcomes are applied by the game layer, through
 * the coordinator.
 *
 * Feature: danger encounters, narrative events
 */
describe('GameCoordinator.applyEncounterOutcome', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies costs and rewards and returns salvage messages', () => {
    game.updateCredits(100);

    const result = game.applyEncounterOutcome({
      costs: { credits: 30 },
      rewards: { credits: 5 },
    });

    expect(game.getState().player.credits).toBe(75);
    expect(result).toEqual({ salvageMessages: [] });
  });

  it('salvage merged into a stack replaces it instead of mutating the stack in the hold', () => {
    game.updateCargo([
      {
        good: 'food',
        qty: 5,
        buyPrice: 50,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ]);
    const stackBefore = game.getState().ship.cargo[0];

    game.applyEncounterOutcome({
      rewards: { cargo: [{ good: 'food', qty: 3, buyPrice: 50 }] },
    });

    expect(stackBefore.qty).toBe(5);
    expect(game.getState().ship.cargo[0].qty).toBe(8);
  });

  it('salvage is added after the time cost, so cargo of a delivery that expires that tick stays gone', () => {
    const day = game.getState().player.daysElapsed;
    game.getState().missions.active.push({
      id: 'expiring_run',
      title: 'Expiring run',
      missionCargo: { good: 'medicine', qty: 4 },
      deadlineDay: day + 1,
    });
    game.updateCargo([
      {
        good: 'medicine',
        qty: 4,
        buyPrice: 0,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: day,
        missionId: 'expiring_run',
      },
    ]);

    game.applyEncounterOutcome({
      costs: { days: 2 },
      rewards: { cargo: [{ good: 'ore', qty: 2, buyPrice: 10 }] },
    });

    const cargo = game.getState().ship.cargo;
    expect(cargo.map((c) => c.good)).toEqual(['ore']);
    expect(game.getState().missions.failed).toContain('expiring_run');
  });
});
