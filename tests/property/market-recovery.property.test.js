'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { COMMODITY_TYPES, ECONOMY_CONFIG } from '../../js/game-constants.js';

/**
 * Feature: deterministic-economy, Properties 15-18: Market recovery
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * Property 15: Market recovery decay
 * Property 16: Market condition pruning
 * Property 17: Recovery preserves sign
 * Property 18: Multi-day recovery is exponential
 */
describe('Property: Market recovery', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  /**
   * Property 15: Market recovery decay
   * For any market condition value and number of days passed,
   * the new value should equal oldValue × (0.90 ^ daysPassed)
   */
  it('Property 15: should apply exponential decay to market conditions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: -2000, max: 2000 }).filter((value) => value !== 0),
        fc.integer({ min: 1, max: 10 }),
        (goodType, initialValue, daysPassed) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set initial market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          // Apply market recovery
          gameStateManager.applyMarketRecovery(daysPassed);

          // Calculate expected value
          const expectedValue =
            initialValue *
            Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, daysPassed);

          // Get actual value (may be pruned if below threshold)
          const actualValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // If value was pruned, verify it was below threshold
          if (actualValue === undefined) {
            expect(Math.abs(expectedValue)).toBeLessThan(
              ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD
            );
          } else {
            // Otherwise, verify decay formula
            expect(actualValue).toBeCloseTo(expectedValue, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Market condition pruning
   * For any market condition value with absolute value less than 1.0,
   * that entry should be removed from market conditions
   */
  it('Property 16: should prune insignificant market conditions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc
          .float({ min: Math.fround(-0.99), max: Math.fround(0.99) })
          .filter((value) => value !== 0 && !Number.isNaN(value)),
        (goodType, smallValue) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set small market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: smallValue,
          };

          // Apply market recovery (even with 0 days, pruning should occur)
          gameStateManager.applyMarketRecovery(1);

          // Verify entry was pruned
          const actualValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          expect(actualValue).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Inverse of Property 16: Values above pruning threshold should be kept
   * 
   * This test verifies that market conditions with absolute value >= MARKET_CONDITION_PRUNE_THRESHOLD
   * are NOT pruned during recovery. It complements Property 16 which tests that values below
   * the threshold ARE pruned.
   */
  it('should keep significant market conditions (inverse of Property 16)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc
          .integer({ min: -2000, max: 2000 })
          .filter((value) => Math.abs(value) >= 10), // Large enough to survive decay
        fc.integer({ min: 1, max: 3 }), // Few days so value stays significant
        (goodType, largeValue, daysPassed) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set large market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: largeValue,
          };

          // Apply market recovery
          gameStateManager.applyMarketRecovery(daysPassed);

          // Calculate expected value after decay
          const expectedValue =
            largeValue *
            Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, daysPassed);

          // If expected value is still above pruning threshold, verify it wasn't pruned
          if (
            Math.abs(expectedValue) >=
            ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD
          ) {
            const actualValue =
              gameStateManager.state.world.marketConditions[systemId][goodType];

            // Value should still exist (not pruned)
            expect(actualValue).toBeDefined();
            // Value should match decay formula (Property 15 already tests this, but verify here too)
            expect(actualValue).toBeCloseTo(expectedValue, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Recovery preserves sign
   * For any market condition value after recovery,
   * the sign (positive/negative) should remain the same as before recovery
   */
  it('Property 17: should preserve sign during recovery', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: -2000, max: 2000 }).filter((value) => value !== 0),
        fc.integer({ min: 1, max: 5 }),
        (goodType, initialValue, daysPassed) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set initial market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          const initialSign = Math.sign(initialValue);

          // Apply market recovery
          gameStateManager.applyMarketRecovery(daysPassed);

          // Get actual value (may be pruned)
          const actualValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // If not pruned, verify sign is preserved
          if (actualValue !== undefined) {
            const actualSign = Math.sign(actualValue);
            expect(actualSign).toBe(initialSign);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18: Multi-day recovery is exponential
   * For any market condition and multiple days,
   * applying recovery for N days should equal applying the factor raised to the Nth power
   */
  it('Property 18: should apply exponential recovery for multiple days', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: -2000, max: 2000 }).filter((value) => value !== 0),
        fc.integer({ min: 2, max: 10 }),
        (goodType, initialValue, totalDays) => {
          // Reset to fresh state for multi-day test
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set initial market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          // Apply recovery for N days at once
          gameStateManager.applyMarketRecovery(totalDays);

          const multiDayValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // Reset and apply recovery one day at a time
          gameStateManager.initNewGame();
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          for (let i = 0; i < totalDays; i++) {
            gameStateManager.applyMarketRecovery(1);
          }

          const singleDayValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // Both approaches should yield the same result
          if (multiDayValue === undefined && singleDayValue === undefined) {
            // Both pruned - this is correct
            expect(true).toBe(true);
          } else if (multiDayValue !== undefined && singleDayValue !== undefined) {
            // Both exist - should be equal
            expect(multiDayValue).toBeCloseTo(singleDayValue, 5);
          } else {
            // One pruned, one not - this shouldn't happen with same initial value
            // Allow small floating point differences near threshold
            const expectedValue =
              initialValue *
              Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, totalDays);
            const threshold = ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD;

            // If expected value is very close to threshold, either outcome is acceptable
            expect(Math.abs(Math.abs(expectedValue) - threshold)).toBeLessThan(
              0.1
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 18: should match exponential formula for multi-day recovery', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 100, max: 2000 }), // Large enough to not be pruned
        fc.integer({ min: 1, max: 10 }),
        (goodType, initialValue, daysPassed) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set initial market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          // Apply recovery
          gameStateManager.applyMarketRecovery(daysPassed);

          // Calculate expected value using exponential formula
          const expectedValue =
            initialValue *
            Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, daysPassed);

          // Get actual value
          const actualValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // Verify exponential formula
          if (actualValue !== undefined) {
            expect(actualValue).toBeCloseTo(expectedValue, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove empty system entries after pruning all commodities', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...COMMODITY_TYPES), {
          minLength: 1,
          maxLength: 6,
        }),
        (goodTypes) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set small market conditions for multiple commodities
          gameStateManager.state.world.marketConditions[systemId] = {};
          for (const goodType of goodTypes) {
            gameStateManager.state.world.marketConditions[systemId][goodType] =
              0.5; // Below threshold
          }

          // Apply market recovery (will prune all entries)
          gameStateManager.applyMarketRecovery(1);

          // Verify system entry was removed
          const systemEntry =
            gameStateManager.state.world.marketConditions[systemId];

          expect(systemEntry).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple systems independently during recovery', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: -500, max: -100 }),
        fc.integer({ min: 1, max: 5 }),
        (goodType, value1, value2, daysPassed) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const system1Id = 0;
          const system2Id = 1;

          // Set market conditions for two systems
          gameStateManager.state.world.marketConditions = {
            [system1Id]: { [goodType]: value1 },
            [system2Id]: { [goodType]: value2 },
          };

          // Apply recovery
          gameStateManager.applyMarketRecovery(daysPassed);

          // Calculate expected values
          const expected1 =
            value1 * Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, daysPassed);
          const expected2 =
            value2 * Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, daysPassed);

          // Get actual values
          const actual1 =
            gameStateManager.state.world.marketConditions[system1Id]?.[
              goodType
            ];
          const actual2 =
            gameStateManager.state.world.marketConditions[system2Id]?.[
              goodType
            ];

          // Verify both systems recovered independently
          if (actual1 !== undefined) {
            expect(actual1).toBeCloseTo(expected1, 5);
          }
          if (actual2 !== undefined) {
            expect(actual2).toBeCloseTo(expected2, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero days passed (no change)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: -2000, max: 2000 }).filter((v) => v !== 0),
        (goodType, initialValue) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Set initial market condition
          gameStateManager.state.world.marketConditions[systemId] = {
            [goodType]: initialValue,
          };

          // Apply recovery with 0 days
          gameStateManager.applyMarketRecovery(0);

          // Get actual value
          const actualValue =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ];

          // Value should be unchanged (0.90^0 = 1.0)
          // Unless it was below threshold and got pruned
          if (Math.abs(initialValue) >= ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD) {
            expect(actualValue).toBeCloseTo(initialValue, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
