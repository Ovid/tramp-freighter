import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GAME_VERSION } from '../../src/game/constants.js';

describe('GameStateManager.restoreState', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores valid current-version state and returns success', () => {
    manager.initNewGame();
    const validState = structuredClone(manager.state);
    manager.state = null;

    const result = manager.restoreState(validState);

    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(manager.state).not.toBeNull();
    expect(manager.state.player.credits).toBe(validState.player.credits);
    expect(manager.state.meta.version).toBe(GAME_VERSION);
  });
});
