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
