import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '@game/constants.js';

// Cargo has one owner. Writers hand it a new hold instead of editing the one
// in state, so an announced hold never changes after subscribers receive it.
describe('Cargo writes replace the hold instead of editing it', () => {
  let game;
  let announced;
  let hiddenAnnounced;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
    game.getShip().upgrades = ['smuggler_panels'];
    announced = [];
    hiddenAnnounced = 0;
    const keep = (hold) =>
      announced.push({ hold, copy: structuredClone(hold) });
    game.subscribe(EVENT_NAMES.CARGO_CHANGED, keep);
    game.subscribe(EVENT_NAMES.HIDDEN_CARGO_CHANGED, (hold) => {
      hiddenAnnounced++;
      keep(hold);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no announced hold is changed by any later cargo write', () => {
    const here = game.getState().player.currentSystem;
    const stack = (good, qty) => ({
      good,
      qty,
      buyPrice: 10,
      buySystem: 0,
      buySystemName: 'Sol',
      buyDate: 0,
    });
    game.updateCargo([stack('grain', 10), stack('ore', 5), stack('ore', 5)]);

    // Each step must succeed, or the writer it exercises is never reached
    expect(game.sellGood(0, 2, 20).success).toBe(true);
    expect(game.moveToHiddenCargo(0, 3).success).toBe(true);
    expect(game.moveToHiddenCargo(0, 1).success).toBe(true);
    expect(game.moveToRegularCargo(0, 2).success).toBe(true);
    expect(game.removeCargoForMission('ore', 6).success).toBe(true);
    const accepted = game.acceptMission({
      id: 'run',
      type: 'delivery',
      title: 'Run',
      giver: 'station_master',
      giverSystem: here,
      requirements: { destination: here, deadline: 10 },
      destination: { systemId: here, name: 'Here' },
      missionCargo: { good: 'registered_freight', quantity: 4 },
      rewards: { credits: 1 },
      penalties: { failure: {} },
    });
    expect(accepted.success).toBe(true);
    const freight = game
      .getShip()
      .cargo.findIndex((s) => s.missionId === 'run');
    expect(freight).toBeGreaterThanOrEqual(0);
    expect(game.moveToHiddenCargo(freight, 1).success).toBe(true);
    const hiddenBeforeCompletion = hiddenAnnounced;
    expect(game.completeMission('run').success).toBe(true);
    // Completion removed the freight from the hidden hold too
    expect(hiddenAnnounced).toBe(hiddenBeforeCompletion + 1);

    expect(announced.length).toBeGreaterThan(8);
    for (const { hold, copy } of announced) {
      expect(hold).toEqual(copy);
    }
  });
});
