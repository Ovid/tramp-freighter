'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";

/**
 * Unit Tests for Market Conditions Initialization
 * Feature: deterministic-economy, Task 5: Add marketConditions to game state
 *
 * Verifies that marketConditions is initialized as an empty object (sparse storage)
 * when a new game is created, as required by the deterministic economy system.
 */

const TEST_STAR_DATA = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 2, st: 1, r: 1 },
];

const TEST_WORMHOLE_DATA = [];

describe('Market Conditions Initialization', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  it('should initialize marketConditions as empty object in new game', () => {
    const state = game.initNewGame();

    // Verify marketConditions exists
    expect(state.world.marketConditions).toBeDefined();

    // Verify it's an object
    expect(typeof state.world.marketConditions).toBe('object');

    // Verify it's empty (sparse storage)
    expect(Object.keys(state.world.marketConditions)).toHaveLength(0);
  });

  it('should have correct structure for marketConditions', () => {
    const state = game.initNewGame();

    // Verify structure: { [systemId]: { [goodType]: netQuantity } }
    expect(state.world.marketConditions).toEqual({});
  });

  it('should preserve marketConditions in state', () => {
    game.initNewGame();
    const state = game.getState();

    // Verify marketConditions is accessible via getState
    expect(state.world.marketConditions).toBeDefined();
    expect(state.world.marketConditions).toEqual({});
  });
});
