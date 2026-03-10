/**
 * Property-based tests for faction reputation clamping invariant
 *
 * Feature: danger-system, Property 13: Faction Reputation Clamping
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { FACTION_CONFIG } from '../../src/game/constants.js';

describe('Faction Reputation Clamping Properties', () => {
  it('should initialize all factions to 0 within valid bounds', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // All factions should be initialized to FACTION_CONFIG.INITIAL (0)
    const factions = game.state.player.factions;

    expect(factions).toBeDefined();

    for (const faction of FACTION_CONFIG.FACTIONS) {
      expect(factions[faction]).toBe(FACTION_CONFIG.INITIAL);
      expect(factions[faction]).toBeGreaterThanOrEqual(FACTION_CONFIG.MIN);
      expect(factions[faction]).toBeLessThanOrEqual(FACTION_CONFIG.MAX);
    }
  });

  it('should have all expected factions defined', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    const factions = game.state.player.factions;
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
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          game.modifyFactionRep(faction, amount, 'test');
          const rep = game.getFactionRep(faction);

          // Faction reputation must always be within bounds
          expect(rep).toBeGreaterThanOrEqual(FACTION_CONFIG.MIN);
          expect(rep).toBeLessThanOrEqual(FACTION_CONFIG.MAX);
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
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          for (const [faction, amount] of modifications) {
            game.modifyFactionRep(faction, amount, 'test');
          }

          // All factions must be within bounds after any sequence of modifications
          for (const faction of FACTION_CONFIG.FACTIONS) {
            const rep = game.getFactionRep(faction);
            expect(rep).toBeGreaterThanOrEqual(FACTION_CONFIG.MIN);
            expect(rep).toBeLessThanOrEqual(FACTION_CONFIG.MAX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
