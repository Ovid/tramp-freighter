'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property tests for market conditions data structure
 *
 * Feature: deterministic-economy
 * Properties:
 * - Property 29: First trade creates market condition entry
 * - Property 30: Market conditions data structure
 * - Property 31: Empty system entries are removed
 *
 * Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.7
 */

describe('Market Conditions Data Structure Properties', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  /**
   * Property 29: First trade creates market condition entry
   *
   * For any system where the player has never traded, the first trade should
   * create a market conditions entry for that system and commodity.
   *
   * Validates: Requirements 9.2
   */
  it('Property 29: First trade creates market condition entry', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TEST_STAR_DATA.length - 1 }), // System index
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ), // Commodity
        fc.integer({ min: 1, max: 100 }), // Quantity
        (systemIndex, goodType, quantity) => {
          // Reset game state for each test
          gameStateManager.initNewGame();

          const systemId = TEST_STAR_DATA[systemIndex].id;

          // Verify no market conditions exist initially
          const initialConditions =
            gameStateManager.state.world.marketConditions;
          expect(initialConditions[systemId]).toBeUndefined();

          // Execute first trade at this system
          gameStateManager.updateMarketConditions(systemId, goodType, quantity);

          // Verify market condition entry was created
          const updatedConditions =
            gameStateManager.state.world.marketConditions;
          expect(updatedConditions[systemId]).toBeDefined();
          expect(updatedConditions[systemId][goodType]).toBe(quantity);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 30: Market conditions data structure
   *
   * For any market conditions object, it should use system ID as first-level key,
   * commodity name as second-level key, and numeric net quantity as value.
   *
   * Validates: Requirements 9.3, 9.4, 9.5
   */
  it('Property 30: Market conditions data structure', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            systemIndex: fc.integer({ min: 0, max: TEST_STAR_DATA.length - 1 }),
            goodType: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            quantity: fc.integer({ min: -1000, max: 1000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (trades) => {
          // Reset game state for each test
          gameStateManager.initNewGame();

          // Execute all trades
          trades.forEach(({ systemIndex, goodType, quantity }) => {
            const systemId = TEST_STAR_DATA[systemIndex].id;
            gameStateManager.updateMarketConditions(
              systemId,
              goodType,
              quantity
            );
          });

          const marketConditions =
            gameStateManager.state.world.marketConditions;

          // Verify structure: { [systemId]: { [goodType]: netQuantity } }
          for (const systemIdStr in marketConditions) {
            // First-level key should be numeric system ID
            const systemId = parseInt(systemIdStr);
            expect(typeof systemId).toBe('number');
            expect(isNaN(systemId)).toBe(false);

            const systemConditions = marketConditions[systemIdStr];
            expect(typeof systemConditions).toBe('object');
            expect(systemConditions).not.toBeNull();

            // Second-level keys should be commodity names
            for (const goodType in systemConditions) {
              expect(typeof goodType).toBe('string');
              expect([
                'grain',
                'ore',
                'tritium',
                'parts',
                'medicine',
                'electronics',
              ]).toContain(goodType);

              // Values should be numeric net quantities
              const netQuantity = systemConditions[goodType];
              expect(typeof netQuantity).toBe('number');
              expect(isNaN(netQuantity)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 31: Empty system entries are removed
   *
   * For any system with all commodity entries pruned, the system entry itself
   * should be removed from market conditions.
   *
   * Validates: Requirements 9.7
   */
  it('Property 31: Empty system entries are removed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: TEST_STAR_DATA.length - 1 }), // System index
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ), // Commodity
        fc.integer({ min: 1, max: 100 }), // Initial quantity
        fc.integer({ min: 1, max: 30 }), // Days to pass
        (systemIndex, goodType, initialQuantity, daysPassed) => {
          // Reset game state for each test
          gameStateManager.initNewGame();

          const systemId = TEST_STAR_DATA[systemIndex].id;

          // Create a market condition entry
          gameStateManager.updateMarketConditions(
            systemId,
            goodType,
            initialQuantity
          );

          // Verify entry exists
          expect(
            gameStateManager.state.world.marketConditions[systemId]
          ).toBeDefined();
          expect(
            gameStateManager.state.world.marketConditions[systemId][goodType]
          ).toBe(initialQuantity);

          // Apply market recovery until the entry is pruned
          // Recovery factor is 0.90 per day, so after enough days, abs(value) < 1.0
          gameStateManager.applyMarketRecovery(daysPassed);

          const marketConditions =
            gameStateManager.state.world.marketConditions;

          // If the commodity entry was pruned (abs < 1.0), check if system entry was removed
          if (marketConditions[systemId]) {
            // System entry still exists - verify it has at least one commodity
            const systemConditions = marketConditions[systemId];
            const commodityCount = Object.keys(systemConditions).length;
            expect(commodityCount).toBeGreaterThan(0);
          } else {
            // System entry was removed - this is correct behavior when all commodities are pruned
            expect(marketConditions[systemId]).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
