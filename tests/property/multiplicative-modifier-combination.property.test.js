import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_QUIRKS } from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Multiplicative Modifier Combination - Property Tests', () => {
  it('**Feature: ship-personality, Property 13: Multiplicative Modifier Combination** - For any set of modifiers affecting the same ship characteristic, applying all modifiers should be equivalent to multiplying the base value by the product of all individual modifiers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 2
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 3
        fc.constantFrom(
          'fuelConsumption',
          'hullDegradation',
          'lifeSupportDrain'
        ), // Random ship characteristic
        (baseValue, quirkId1, quirkId2, quirkId3, shipCharacteristic) => {
          // Create unique quirk set
          const quirks = [...new Set([quirkId1, quirkId2, quirkId3])];

          // Create game state manager
          const gameStateManager = new GameStateManager(
            TEST_STAR_DATA,
            TEST_WORMHOLE_DATA
          );

          // Apply quirk modifiers using the function
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            quirks
          );

          // Calculate product of all individual modifiers
          let product = 1.0;
          for (const quirkId of quirks) {
            const quirk = SHIP_QUIRKS[quirkId];
            if (quirk && quirk.effects[shipCharacteristic]) {
              product *= quirk.effects[shipCharacteristic];
            }
          }

          // Calculate expected result: base × product
          const expected = baseValue * product;

          // Verify result matches expected (with floating point tolerance)
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 13: Multiplicative Modifier Combination** - For multiple quirks with the same ship characteristic modifier, the combined effect should be the product of individual modifiers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        (baseValue) => {
          // Use specific quirks that affect fuelConsumption
          // hot_thruster: 1.05 (+5%)
          // fuel_sipper: 0.85 (-15%)
          const quirks = ['hot_thruster', 'fuel_sipper'];
          const shipCharacteristic = 'fuelConsumption';

          // Create game state manager
          const gameStateManager = new GameStateManager(
            TEST_STAR_DATA,
            TEST_WORMHOLE_DATA
          );

          // Apply quirk modifiers
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            quirks
          );

          // Expected: baseValue × 1.05 × 0.85 = baseValue × 0.8925
          const expected = baseValue * 1.05 * 0.85;

          // Verify result matches expected (with floating point tolerance)
          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('**Feature: ship-personality, Property 13: Multiplicative Modifier Combination** - Order of modifier application should not affect the result (commutative property)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 1
        fc.constantFrom(...Object.keys(SHIP_QUIRKS)), // Random quirk 2
        fc.constantFrom(
          'fuelConsumption',
          'hullDegradation',
          'lifeSupportDrain'
        ), // Random ship characteristic
        (baseValue, quirkId1, quirkId2, shipCharacteristic) => {
          // Create game state manager
          const gameStateManager = new GameStateManager(
            TEST_STAR_DATA,
            TEST_WORMHOLE_DATA
          );

          // Apply quirks in order 1, 2
          const result1 = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            [quirkId1, quirkId2]
          );

          // Apply quirks in order 2, 1
          const result2 = gameStateManager.applyQuirkModifiers(
            baseValue,
            shipCharacteristic,
            [quirkId2, quirkId1]
          );

          // Results should be identical regardless of order
          expect(Math.abs(result1 - result2)).toBeLessThan(0.0001);
        }
      ),
      { numRuns: 100 }
    );
  });
});
