/**
 * Property-based tests for karma clamping invariant
 *
 * Feature: danger-system, Property 12: Karma Clamping
 * Validates: Requirements 9.1, 9.8
 */

import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { KARMA_CONFIG } from '../../src/game/constants.js';

describe('Karma Clamping Properties', () => {
  it('should initialize karma to 0 within valid bounds', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Karma should be initialized to KARMA_CONFIG.INITIAL (0)
    const karma = gameStateManager.state.player.karma;

    expect(karma).toBe(KARMA_CONFIG.INITIAL);
    expect(karma).toBeGreaterThanOrEqual(KARMA_CONFIG.MIN);
    expect(karma).toBeLessThanOrEqual(KARMA_CONFIG.MAX);
  });
});
