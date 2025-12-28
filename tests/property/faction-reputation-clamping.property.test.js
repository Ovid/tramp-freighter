/**
 * Property-based tests for faction reputation clamping invariant
 *
 * Feature: danger-system, Property 13: Faction Reputation Clamping
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
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

  it('should clamp faction reputation within bounds after any modification', () => {
    const factionArb = fc.constantFrom(...FACTION_CONFIG.FACTIONS);

    fc.assert(
      fc.property(
        factionArb,
        fc.integer({ min: -500, max: 500 }),
        (faction, amount) => {
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          gameStateManager.modifyFactionRep(faction, amount, 'test');
          const rep = gameStateManager.getFactionRep(faction);

          // Faction reputation must always be within bounds
          return rep >= FACTION_CONFIG.MIN && rep <= FACTION_CONFIG.MAX;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp faction reputation within bounds after multiple modifications', () => {
    const factionArb = fc.constantFrom(...FACTION_CONFIG.FACTIONS);

    fc.assert(
      fc.property(
        fc.array(fc.tuple(factionArb, fc.integer({ min: -200, max: 200 })), {
          minLength: 1,
          maxLength: 10,
        }),
        (modifications) => {
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          for (const [faction, amount] of modifications) {
            gameStateManager.modifyFactionRep(faction, amount, 'test');
          }

          // All factions must be within bounds after any sequence of modifications
          for (const faction of FACTION_CONFIG.FACTIONS) {
            const rep = gameStateManager.getFactionRep(faction);
            if (rep < FACTION_CONFIG.MIN || rep > FACTION_CONFIG.MAX) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
