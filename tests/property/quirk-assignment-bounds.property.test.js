import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_QUIRKS } from '../../js/game-constants.js';

// Mock star data for testing
const mockStarData = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 1, st: 1, r: 1 },
];

// Mock wormhole data
const mockWormholeData = [];

describe('Quirk Assignment - Property Tests', () => {
  it('**Feature: ship-personality, Property 1: Quirk Assignment Bounds** - For any new game initialization, the ship should be assigned exactly 2 or 3 quirks, with no duplicates', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1 }), (seed) => {
        // Create deterministic RNG from fast-check's generated seed
        // This allows test failures to be reproduced with the same seed
        let counter = 0;
        const random = () => {
          // Simple LCG (Linear Congruential Generator) for deterministic randomness
          counter = (counter * 1103515245 + 12345 + seed * 1000) % 2147483648;
          return counter / 2147483648;
        };

        // Create a new game state manager
        const gameStateManager = new GameStateManager(
          mockStarData,
          mockWormholeData
        );

        // Assign quirks with seeded RNG
        const quirks = gameStateManager.assignShipQuirks(random);

        // Verify quirk count is 2 or 3
        expect(quirks.length).toBeGreaterThanOrEqual(2);
        expect(quirks.length).toBeLessThanOrEqual(3);

        // Verify no duplicates
        const uniqueQuirks = new Set(quirks);
        expect(uniqueQuirks.size).toBe(quirks.length);

        // Verify all quirks exist in SHIP_QUIRKS
        for (const quirkId of quirks) {
          expect(SHIP_QUIRKS[quirkId]).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});
