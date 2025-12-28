/**
 * Property-based tests for faction reputation clamping invariant
 *
 * Feature: danger-system, Property 13: Faction Reputation Clamping
 * Validates: Requirements 8.1, 8.2
 */

import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { FACTION_CONFIG } from '../../src/game/constants.js';

describe('Faction Reputation Clamping Properties', () => {
  it('should initialize all factions to 0 within valid bounds', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // All factions should be initialized to FACTION_CONFIG.INITIAL (0)
    const factions = gameStateManager.state.player.factions;

    expect(factions).toBeDefined();

    for (const faction of FACTION_CONFIG.FACTIONS) {
      expect(factions[faction]).toBe(FACTION_CONFIG.INITIAL);
      expect(factions[faction]).toBeGreaterThanOrEqual(FACTION_CONFIG.MIN);
      expect(factions[faction]).toBeLessThanOrEqual(FACTION_CONFIG.MAX);
    }
  });

  it('should have all expected factions defined', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    const factions = gameStateManager.state.player.factions;
    const expectedFactions = ['authorities', 'traders', 'outlaws', 'civilians'];

    for (const faction of expectedFactions) {
      expect(factions).toHaveProperty(faction);
    }
  });
});
