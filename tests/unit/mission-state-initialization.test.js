import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission State Initialization', () => {
  it('should initialize missions state in new game', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    const state = manager.initNewGame();

    expect(state.missions).toBeDefined();
    expect(state.missions.active).toEqual([]);
    expect(state.missions.completed).toEqual([]);
    expect(state.missions.failed).toEqual([]);
    expect(state.missions.board).toEqual([]);
    expect(state.missions.boardLastRefresh).toBe(0);
  });
});
