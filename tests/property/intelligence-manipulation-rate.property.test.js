'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker } from '../../js/game-information-broker.js';
import { TradingSystem } from '../../js/game-trading.js';

/**
 * Property-Based Tests for Intelligence Manipulation Rate
 *
 * Verifies that the information broker manipulates prices at the expected
 * rate and within the expected range across many random scenarios.
 */
// DEPRECATED: This test is for the old dynamic-economy system
// The deterministic-economy system has replaced the price calculation
// This test needs to be updated to work with the new calculatePrice() signature
describe.skip('Property: Intelligence Manipulation Rate', () => {
  it('should manipulate approximately 10% of prices across random systems and days', () => {
    fc.assert(
      fc.property(
        // Generate random star systems with unique IDs
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V', 'A1V', 'F7V'),
              x: fc.float({ min: -300, max: 300 }),
              y: fc.float({ min: -300, max: 300 }),
              z: fc.float({ min: -300, max: 300 }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 10, maxLength: 15 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        // Generate random days
        fc.array(fc.integer({ min: 0, max: 365 }), {
          minLength: 20,
          maxLength: 30,
        }),
        (starData, days) => {
          let totalPrices = 0;
          let manipulatedPrices = 0;

          // Test each system on each day
          for (const system of starData) {
            for (const day of days) {
              const gameState = {
                player: { credits: 10000, currentSystem: 0, daysElapsed: day },
                world: { priceKnowledge: {}, activeEvents: [] },
              };

              // Purchase intelligence
              InformationBroker.purchaseIntelligence(
                gameState,
                system.id,
                starData
              );
              const purchasedPrices =
                gameState.world.priceKnowledge[system.id].prices;

              // Compare with actual prices
              for (const goodType of Object.keys(purchasedPrices)) {
                totalPrices++;
                const actualPrice = TradingSystem.calculatePrice(
                  goodType,
                  system,
                  day,
                  []
                );
                if (purchasedPrices[goodType] !== actualPrice) {
                  manipulatedPrices++;
                }
              }
            }
          }

          // With large sample size (10-15 systems × 20-30 days × 6 goods = 1200-2700 prices),
          // manipulation rate should be close to 10%
          // Allow ±30% variance for statistical fluctuation (7-13% range)
          const manipulationRate = manipulatedPrices / totalPrices;
          const expectedRate = 0.1; // INTELLIGENCE_RELIABILITY.MANIPULATION_CHANCE
          const varianceTolerance = 0.3; // 30% variance
          expect(manipulationRate).toBeGreaterThan(
            expectedRate * (1 - varianceTolerance)
          );
          expect(manipulationRate).toBeLessThan(
            expectedRate * (1 + varianceTolerance)
          );
        }
      ),
      { numRuns: 10 } // Fewer runs since each run tests many combinations
    );
  });

  it('should always manipulate prices downward (false buying opportunity)', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 0, max: 116 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('G2V', 'K5V', 'M3V'),
          x: fc.float({ min: -300, max: 300 }),
          y: fc.float({ min: -300, max: 300 }),
          z: fc.float({ min: -300, max: 300 }),
          st: fc.integer({ min: 0, max: 5 }),
        }),
        fc.integer({ min: 0, max: 365 }),
        (system, day) => {
          const gameState = {
            player: { credits: 10000, currentSystem: 0, daysElapsed: day },
            world: { priceKnowledge: {}, activeEvents: [] },
          };

          InformationBroker.purchaseIntelligence(gameState, system.id, [
            system,
          ]);
          const purchasedPrices =
            gameState.world.priceKnowledge[system.id].prices;

          // Check each commodity
          for (const goodType of Object.keys(purchasedPrices)) {
            const actualPrice = TradingSystem.calculatePrice(
              goodType,
              system,
              day,
              []
            );
            const purchasedPrice = purchasedPrices[goodType];

            // If manipulated, must be lower
            if (purchasedPrice !== actualPrice) {
              expect(purchasedPrice).toBeLessThan(actualPrice);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent manipulation for same system and day', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 0, max: 116 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('G2V', 'K5V', 'M3V'),
          x: fc.float({ min: -300, max: 300 }),
          y: fc.float({ min: -300, max: 300 }),
          z: fc.float({ min: -300, max: 300 }),
          st: fc.integer({ min: 0, max: 5 }),
        }),
        fc.integer({ min: 0, max: 365 }),
        (system, day) => {
          // Purchase intelligence twice with same parameters
          const gameState1 = {
            player: { credits: 10000, currentSystem: 0, daysElapsed: day },
            world: { priceKnowledge: {}, activeEvents: [] },
          };

          const gameState2 = {
            player: { credits: 10000, currentSystem: 0, daysElapsed: day },
            world: { priceKnowledge: {}, activeEvents: [] },
          };

          InformationBroker.purchaseIntelligence(gameState1, system.id, [
            system,
          ]);
          InformationBroker.purchaseIntelligence(gameState2, system.id, [
            system,
          ]);

          const prices1 = gameState1.world.priceKnowledge[system.id].prices;
          const prices2 = gameState2.world.priceKnowledge[system.id].prices;

          // Prices should be identical (deterministic)
          expect(prices1).toEqual(prices2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should manipulate prices within expected multiplier range', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 0, max: 116 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('G2V', 'K5V', 'M3V'),
          x: fc.float({ min: -300, max: 300 }),
          y: fc.float({ min: -300, max: 300 }),
          z: fc.float({ min: -300, max: 300 }),
          st: fc.integer({ min: 0, max: 5 }),
        }),
        fc.array(fc.integer({ min: 0, max: 365 }), {
          minLength: 50,
          maxLength: 100,
        }),
        (system, days) => {
          const manipulationRatios = [];

          for (const day of days) {
            const gameState = {
              player: { credits: 10000, currentSystem: 0, daysElapsed: day },
              world: { priceKnowledge: {}, activeEvents: [] },
            };

            InformationBroker.purchaseIntelligence(gameState, system.id, [
              system,
            ]);
            const purchasedPrices =
              gameState.world.priceKnowledge[system.id].prices;

            for (const goodType of Object.keys(purchasedPrices)) {
              const actualPrice = TradingSystem.calculatePrice(
                goodType,
                system,
                day,
                []
              );
              const purchasedPrice = purchasedPrices[goodType];

              if (purchasedPrice < actualPrice) {
                const ratio = purchasedPrice / actualPrice;
                manipulationRatios.push(ratio);
              }
            }
          }

          // If we found manipulations, check they're in expected range
          if (manipulationRatios.length > 0) {
            const avgRatio =
              manipulationRatios.reduce((a, b) => a + b, 0) /
              manipulationRatios.length;

            // Average should be roughly in the middle of the range (0.7 to 0.85)
            // Allow some variance due to rounding (±15% from midpoint of 0.775)
            const expectedMidpoint = 0.775; // (0.7 + 0.85) / 2
            const rangeVariance = 0.15;
            expect(avgRatio).toBeGreaterThan(expectedMidpoint - rangeVariance);
            expect(avgRatio).toBeLessThan(expectedMidpoint + rangeVariance);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
