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

describe('Quirk Effect Application - Property Tests', () => {
  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For any ship with quirks and any calculation that uses an attribute affected by those quirks, the result should equal the base value multiplied by all relevant quirk modifiers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 2
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 3
        fc.constantFrom(
          'fuelConsumption',
          'hullDegradation',
          'lifeSupportDrain',
          'loadingTime',
          'theftRisk',
          'salvageDetection',
          'falseAlarms',
          'negateEventChance',
          'npcRepGain'
        ), // Random attribute
        (baseValue, quirkId1, quirkId2, quirkId3, attribute) => {
          // Create unique quirk set (may have 1-3 quirks depending on duplicates)
          const quirks = [...new Set([quirkId1, quirkId2, quirkId3])];

          // Create game state manager
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
            quirks
          );

          // Calculate expected result by manually applying all modifiers
          let expected = baseValue;
          for (const quirkId of quirks) {
            const quirk = SHIP_QUIRKS[quirkId];
            if (quirk && quirk.effects[attribute]) {
              expected *= quirk.effects[attribute];
            }
          }

          // Verify result matches expected (with floating point tolerance)
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For any attribute not affected by any quirk, the result should equal the base value unchanged', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 2
        (baseValue, quirkId1, quirkId2) => {
          const quirks = [quirkId1, quirkId2];

          // Use an attribute that no quirk affects
          const attribute = 'nonExistentAttribute';

          // Create game state manager
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
            quirks
          );

          // Result should equal base value since no quirk affects this attribute
          expect(result).toBe(baseValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For an empty quirks array, the result should equal the base value unchanged', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(
          'fuelConsumption',
          'hullDegradation',
          'lifeSupportDrain'
        ), // Random attribute
        (baseValue, attribute) => {
          const quirks = [];

          // Create game state manager
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
            quirks
          );

          // Result should equal base value since no quirks are applied
          expect(result).toBe(baseValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
