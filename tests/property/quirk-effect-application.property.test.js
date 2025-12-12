import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_CONFIG } from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Quirk Effect Application - Property Tests', () => {
  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For any ship with quirks and any calculation that uses a ship characteristic affected by those quirks, the result should equal the base value multiplied by all relevant quirk modifiers', () => {
    // Create once outside the property loop to avoid repeated allocation
    const gameStateManager = new GameStateManager(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );

    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), // Random quirk 2
        fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), // Random quirk 3
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
        ), // Random ship characteristic
        (baseValue, quirkId1, quirkId2, quirkId3, shipCharacteristic) => {
          // Create unique quirk set (may have 1-3 quirks depending on duplicates)
          const quirks = [...new Set([quirkId1, quirkId2, quirkId3])];

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            quirks
          );

          // Calculate expected result by manually applying all modifiers
          let expected = baseValue;
          for (const quirkId of quirks) {
            const quirk = SHIP_CONFIG.QUIRKS[quirkId];
            if (quirk && quirk.effects[shipCharacteristic]) {
              expected *= quirk.effects[shipCharacteristic];
            }
          }

          // Verify result matches expected (with floating point tolerance)
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For any ship characteristic not affected by any quirk, the result should equal the base value unchanged', () => {
    // Create once outside the property loop to avoid repeated allocation
    const gameStateManager = new GameStateManager(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );

    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), // Random quirk 2
        (baseValue, quirkId1, quirkId2) => {
          const quirks = [quirkId1, quirkId2];

          // Use a ship characteristic that no quirk affects
          const shipCharacteristic = 'nonExistentCharacteristic';

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            quirks
          );

          // Result should equal base value since no quirk affects this characteristic
          expect(result).toBe(baseValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 2: Quirk Effect Application** - For an empty quirks array, the result should equal the base value unchanged', () => {
    // Create once outside the property loop to avoid repeated allocation
    const gameStateManager = new GameStateManager(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );

    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(
          'fuelConsumption',
          'hullDegradation',
          'lifeSupportDrain'
        ), // Random ship characteristic
        (baseValue, shipCharacteristic) => {
          const quirks = [];

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
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
