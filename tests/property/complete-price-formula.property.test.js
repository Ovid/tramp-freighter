'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { BASE_PRICES, LY_PER_UNIT } from '../../js/game-constants.js';

/**
 * Feature: deterministic-economy, Property 27: Complete price formula
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 *
 * For any commodity, system, day, and market conditions, the final price should equal
 * basePrice × techMod × temporalMod × localMod × eventMod, rounded to nearest integer.
 */
describe('Complete price formula property', () => {
  it('should calculate price as basePrice × techMod × temporalMod × localMod × eventMod', () => {
    fc.assert(
      fc.property(
        // Generate random commodity
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        // Generate random system within 30 LY sphere
        fc.record({
          id: fc.integer({ min: 0, max: 200 }),
          x: fc.float({ min: -30, max: 30, noNaN: true }),
          y: fc.float({ min: -30, max: 30, noNaN: true }),
          z: fc.float({ min: -30, max: 30, noNaN: true }),
          type: fc.constantFrom('G', 'K', 'M', 'F', 'A'),
          st: fc.integer({ min: 0, max: 3 }),
        }),
        // Generate random day
        fc.integer({ min: 0, max: 1000 }),
        // Generate random market conditions (surplus/deficit)
        fc.integer({ min: -2000, max: 2000 }),
        // Generate random event modifier
        fc.float({ min: 0.5, max: 2.0, noNaN: true }),
        (goodType, system, currentDay, surplus, eventModifier) => {
          // Build market conditions
          const marketConditions = {};
          if (surplus !== 0) {
            marketConditions[system.id] = {
              [goodType]: surplus,
            };
          }

          // Build active events
          const activeEvents =
            eventModifier !== 1.0
              ? [
                  {
                    systemId: system.id,
                    modifiers: {
                      [goodType]: eventModifier,
                    },
                  },
                ]
              : [];

          // Calculate price using the system
          const actualPrice = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );

          // Calculate expected price manually
          const basePrice = BASE_PRICES[goodType];
          const techLevel = TradingSystem.calculateTechLevel(system);
          const techMod = TradingSystem.getTechModifier(goodType, techLevel);
          const temporalMod = TradingSystem.getTemporalModifier(
            system.id,
            currentDay
          );
          const localMod = TradingSystem.getLocalModifier(
            system.id,
            goodType,
            marketConditions
          );
          const eventMod = TradingSystem.getEventModifier(
            system.id,
            goodType,
            activeEvents
          );

          const expectedPrice = Math.round(
            basePrice * techMod * temporalMod * localMod * eventMod
          );

          // Verify the formula
          expect(actualPrice).toBe(expectedPrice);

          // Verify price is positive
          expect(actualPrice).toBeGreaterThan(0);

          // Verify price is an integer
          expect(Number.isInteger(actualPrice)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply tech modifier correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.record({
          id: fc.integer({ min: 0, max: 200 }),
          x: fc.float({ min: -30, max: 30, noNaN: true }),
          y: fc.float({ min: -30, max: 30, noNaN: true }),
          z: fc.float({ min: -30, max: 30, noNaN: true }),
          type: fc.constantFrom('G', 'K', 'M'),
          st: fc.integer({ min: 0, max: 3 }),
        }),
        (goodType, system) => {
          // Use neutral conditions for other modifiers
          const currentDay = 0; // System 0 has temporal = 1.0 at day 0
          const marketConditions = {}; // No trading → local = 1.0
          const activeEvents = []; // No events → event = 1.0

          // For system 0, temporal modifier should be 1.0 at day 0
          // So price should be basePrice × techMod × 1.0 × 1.0 × 1.0
          const systemZero = { ...system, id: 0 };

          const price = TradingSystem.calculatePrice(
            goodType,
            systemZero,
            currentDay,
            activeEvents,
            marketConditions
          );

          const basePrice = BASE_PRICES[goodType];
          const techLevel = TradingSystem.calculateTechLevel(systemZero);
          const techMod = TradingSystem.getTechModifier(goodType, techLevel);
          const expectedPrice = Math.round(basePrice * techMod);

          // Allow small rounding differences
          expect(Math.abs(price - expectedPrice)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply temporal modifier correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 0, max: 200 }),
        fc.integer({ min: 0, max: 1000 }),
        (goodType, systemId, currentDay) => {
          // Create system at tech level midpoint (11.67 LY from Sol)
          // This makes tech modifier = 1.0
          const distanceInMapUnits = 11.67 / LY_PER_UNIT;
          const system = {
            id: systemId,
            x: distanceInMapUnits,
            y: 0,
            z: 0,
            type: 'G',
            st: 1,
          };

          const marketConditions = {}; // No trading → local = 1.0
          const activeEvents = []; // No events → event = 1.0

          const price = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );

          const basePrice = BASE_PRICES[goodType];
          const temporalMod = TradingSystem.getTemporalModifier(
            systemId,
            currentDay
          );
          const expectedPrice = Math.round(basePrice * temporalMod);

          // Allow small rounding differences
          expect(Math.abs(price - expectedPrice)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply local modifier correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: -2000, max: 2000 }),
        (goodType, surplus) => {
          // Create system at tech level midpoint (11.67 LY from Sol)
          // This makes tech modifier = 1.0
          const distanceInMapUnits = 11.67 / LY_PER_UNIT;
          const system = {
            id: 0, // System 0 at day 0 has temporal = 1.0
            x: distanceInMapUnits,
            y: 0,
            z: 0,
            type: 'G',
            st: 1,
          };

          const marketConditions =
            surplus !== 0
              ? {
                  [system.id]: {
                    [goodType]: surplus,
                  },
                }
              : {};

          const currentDay = 0; // System 0 has temporal = 1.0 at day 0
          const activeEvents = []; // No events → event = 1.0

          const price = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );

          const basePrice = BASE_PRICES[goodType];
          const localMod = TradingSystem.getLocalModifier(
            system.id,
            goodType,
            marketConditions
          );
          const expectedPrice = Math.round(basePrice * localMod);

          // Allow small rounding differences
          expect(Math.abs(price - expectedPrice)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply event modifier correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.float({ min: 0.5, max: 2.0, noNaN: true }),
        (goodType, eventModifier) => {
          // Create system at tech level midpoint (11.67 LY from Sol)
          // This makes tech modifier = 1.0
          const distanceInMapUnits = 11.67 / LY_PER_UNIT;
          const system = {
            id: 0, // System 0 at day 0 has temporal = 1.0
            x: distanceInMapUnits,
            y: 0,
            z: 0,
            type: 'G',
            st: 1,
          };

          const marketConditions = {}; // No trading → local = 1.0
          const currentDay = 0; // System 0 has temporal = 1.0 at day 0
          const activeEvents = [
            {
              systemId: system.id,
              modifiers: {
                [goodType]: eventModifier,
              },
            },
          ];

          const price = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );

          const basePrice = BASE_PRICES[goodType];
          const expectedPrice = Math.round(basePrice * eventModifier);

          // Allow small rounding differences
          expect(Math.abs(price - expectedPrice)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
