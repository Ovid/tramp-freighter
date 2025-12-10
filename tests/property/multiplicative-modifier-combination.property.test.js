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

describe('Multiplicative Modifier Combination - Property Tests', () => {
  it('**Feature: ship-personality, Property 13: Multiplicative Modifier Combination** - For any set of modifiers affecting the same attribute, applying all modifiers should be equivalent to multiplying the base value by the product of all individual modifiers', () => {
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
        ), // Random attribute
        (baseValue, quirkId1, quirkId2, quirkId3, attribute) => {
          // Create unique quirk set
          const quirks = [...new Set([quirkId1, quirkId2, quirkId3])];

          // Create game state manager
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );

          // Apply quirk modifiers using the function
          const result = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
            quirks
          );

          // Calculate product of all individual modifiers
          let product = 1.0;
          for (const quirkId of quirks) {
            const quirk = SHIP_QUIRKS[quirkId];
            if (quirk && quirk.effects[attribute]) {
              product *= quirk.effects[attribute];
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

  it('**Feature: ship-personality, Property 13: Multiplicative Modifier Combination** - For multiple quirks with the same attribute modifier, the combined effect should be the product of individual modifiers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // Base value
        (baseValue) => {
          // Use specific quirks that affect fuelConsumption
          // hot_thruster: 1.05 (+5%)
          // fuel_sipper: 0.85 (-15%)
          const quirks = ['hot_thruster', 'fuel_sipper'];
          const attribute = 'fuelConsumption';

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
        ), // Random attribute
        (baseValue, quirkId1, quirkId2, attribute) => {
          // Create game state manager
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );

          // Apply quirks in order 1, 2
          const result1 = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
            [quirkId1, quirkId2]
          );

          // Apply quirks in order 2, 1
          const result2 = gameStateManager.applyQuirkModifiers(
            baseValue,
            attribute,
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
