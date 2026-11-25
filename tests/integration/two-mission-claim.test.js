import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

// Issue #57: claiming two diplomatic-pouch deliveries to the same system
// left NaN credits and unremoved pouches in the hold.
describe('Claiming two delivery missions to the same destination', () => {
  let game;
  let destination;

  const pouchRun = (id, qty, credits) => ({
    id,
    type: 'delivery',
    title: `Pouch run ${id}`,
    giverSystem: 0,
    requirements: { destination, deadline: 30 },
    missionCargo: {
      good: 'diplomatic_pouches',
      quantity: qty,
      isIllegal: false,
    },
    rewards: { credits },
    penalties: { failure: {} },
  });

  beforeEach(() => {
    game = createTestGame();
    const state = game.getState();
    state.player.credits = 1000;
    destination = game.starData.find(
      (s) => s.id !== state.player.currentSystem
    ).id;

    expect(game.acceptMission(pouchRun('pouch_a', 4, 300)).success).toBe(true);
    expect(game.acceptMission(pouchRun('pouch_b', 3, 250)).success).toBe(true);
  });

  const claimBothAndCheck = () => {
    game.updateLocation(destination);
    const state = game.getState();
    const before = state.player.credits;

    const a = game.completeMission('pouch_a');
    const b = game.completeMission('pouch_b');
    // A fast double-click on the same button must not pay twice
    const again = game.completeMission('pouch_b');

    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(again.success).toBe(false);

    expect(Number.isFinite(state.player.credits)).toBe(true);
    expect(state.player.credits).toBe(
      before + 300 - a.withheld + 250 - b.withheld
    );

    const pouches = [...state.ship.cargo, ...state.ship.hiddenCargo].filter(
      (c) => c.good === 'diplomatic_pouches'
    );
    expect(pouches).toEqual([]);
    expect(game.getActiveMissions()).toHaveLength(0);
  };

  it('pays both rewards and removes all pouches', () => {
    claimBothAndCheck();
  });

  it('still does after the pouches round-trip through the hidden compartment', () => {
    game.addUpgrade('smuggler_panels');
    const { ship } = game.getState();

    // Hide both stacks, then bring them back out: the path that used to
    // merge them into one stack with no missionId.
    while (ship.cargo.some((c) => c.good === 'diplomatic_pouches')) {
      const i = ship.cargo.findIndex((c) => c.good === 'diplomatic_pouches');
      expect(game.moveToHiddenCargo(i, ship.cargo[i].qty).success).toBe(true);
    }
    while (ship.hiddenCargo.length > 0) {
      expect(game.moveToRegularCargo(0, ship.hiddenCargo[0].qty).success).toBe(
        true
      );
    }

    claimBothAndCheck();
  });
});
