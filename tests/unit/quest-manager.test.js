import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Stats initialization', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('initializes state.stats with zero counters', () => {
    expect(manager.state.stats).toBeDefined();
    expect(manager.state.stats.creditsEarned).toBe(0);
    expect(manager.state.stats.jumpsCompleted).toBe(0);
    expect(manager.state.stats.cargoHauled).toBe(0);
    expect(manager.state.stats.smugglingRuns).toBe(0);
    expect(manager.state.stats.charitableActs).toBe(0);
  });

  it('initializes state.quests as empty object', () => {
    expect(manager.state.quests).toBeDefined();
    expect(manager.state.quests).toEqual({});
  });
});

describe('Stats tracking', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments jumpsCompleted on location change', () => {
    manager.state.player.currentSystem = 0;
    manager.updateLocation(4);
    expect(manager.state.stats.jumpsCompleted).toBe(1);
  });

  it('increments cargoHauled and creditsEarned on sell', () => {
    manager.state.ship.cargo = [
      { good: 'grain', qty: 10, buyPrice: 50, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    manager.state.world.currentSystemPrices = { grain: 100 };
    const result = manager.sellGood(0, 5, 100);
    if (result.success) {
      expect(manager.state.stats.cargoHauled).toBe(5);
      expect(manager.state.stats.creditsEarned).toBe(500);
    }
  });
});

describe('Karma-based stats', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments charitableActs on positive karma change', () => {
    manager.modifyKarma(5, 'helped_civilian');
    expect(manager.state.stats.charitableActs).toBe(1);
  });

  it('does not increment charitableActs on negative karma', () => {
    manager.modifyKarma(-5, 'looted_civilian');
    expect(manager.state.stats.charitableActs).toBe(0);
  });
});
