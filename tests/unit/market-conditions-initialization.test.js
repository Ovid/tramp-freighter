'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../js/game-state.js';

const TEST_STAR_DATA = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 2, st: 1, r: 1 },
];

const TEST_WORMHOLE_DATA = [];

describe('Market Conditions Initialization', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  it('should initialize marketConditions as empty object in new game', () => {
    const state = gameStateManager.initNewGame();

    // Verify marketConditions exists
    expect(state.world.marketConditions).toBeDefined();

    // Verify it's an object
    expect(typeof state.world.marketConditions).toBe('object');

    // Verify it's empty (sparse storage)
    expect(Object.keys(state.world.marketConditions)).toHaveLength(0);
  });

  it('should have correct structure for marketConditions', () => {
    const state = gameStateManager.initNewGame();

    // Verify structure: { [systemId]: { [goodType]: netQuantity } }
    expect(state.world.marketConditions).toEqual({});
  });

  it('should preserve marketConditions in state', () => {
    gameStateManager.initNewGame();
    const state = gameStateManager.getState();

    // Verify marketConditions is accessible via getState
    expect(state.world.marketConditions).toBeDefined();
    expect(state.world.marketConditions).toEqual({});
  });
});
