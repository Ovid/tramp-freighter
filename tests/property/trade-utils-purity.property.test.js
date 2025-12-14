import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateBuy,
  validateSell,
  calculateMaxBuyQuantity,
  calculateProfit,
  formatCargoAge,
} from '../../src/features/trade/tradeUtils.js';

/**
 * Property 36: Utility functions are pure
 *
 * Validates that trade utility functions are pure (no side effects, same inputs produce same outputs).
 *
 * React Migration Spec: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
describe('Property 36: Trade utility functions are pure', () => {
  it('validateBuy should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantity, price, credits, cargoUsed, cargoCapacity) => {
          const state = {
            player: { credits },
            ship: {
              cargo: Array(cargoUsed).fill({ qty: 1 }),
              cargoCapacity,
            },
          };

          // Call function twice with same inputs
          const result1 = validateBuy(goodType, quantity, price, state);
          const result2 = validateBuy(goodType, quantity, price, state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.player.credits).toBe(credits);
          expect(state.ship.cargo.length).toBe(cargoUsed);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateSell should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (stackIndex, quantity, stackQty) => {
          const state = {
            ship: {
              cargo: Array(stackIndex + 1)
                .fill(null)
                .map(() => ({ qty: stackQty, good: 'electronics' })),
            },
          };

          // Call function twice with same inputs
          const result1 = validateSell(stackIndex, quantity, state);
          const result2 = validateSell(stackIndex, quantity, state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.ship.cargo.length).toBe(stackIndex + 1);
          expect(state.ship.cargo[stackIndex].qty).toBe(stackQty);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateMaxBuyQuantity should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 10, max: 100 }),
        (price, credits, cargoUsed, cargoCapacity) => {
          const state = {
            player: { credits },
            ship: {
              cargo: Array(cargoUsed).fill({ qty: 1 }),
              cargoCapacity,
            },
          };

          // Call function twice with same inputs
          const result1 = calculateMaxBuyQuantity(price, state);
          const result2 = calculateMaxBuyQuantity(price, state);

          // Results should be identical
          expect(result1).toBe(result2);

          // State should not be modified
          expect(state.player.credits).toBe(credits);
          expect(state.ship.cargo.length).toBe(cargoUsed);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateProfit should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (buyPrice, currentPrice) => {
          const stack = {
            good: 'electronics',
            qty: 10,
            buyPrice,
          };

          // Call function twice with same inputs
          const result1 = calculateProfit(stack, currentPrice);
          const result2 = calculateProfit(stack, currentPrice);

          // Results should be identical
          expect(result1).toEqual(result2);

          // Stack should not be modified
          expect(stack.buyPrice).toBe(buyPrice);
          expect(stack.qty).toBe(10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatCargoAge should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (currentDay, buyDate) => {
          // Call function twice with same inputs
          const result1 = formatCargoAge(currentDay, buyDate);
          const result2 = formatCargoAge(currentDay, buyDate);

          // Results should be identical
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateBuy should not modify input state object', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantity, price, credits, cargoUsed, cargoCapacity) => {
          const state = {
            player: { credits },
            ship: {
              cargo: Array(cargoUsed).fill({ qty: 1 }),
              cargoCapacity,
            },
          };

          // Create deep copy of state
          const stateCopy = JSON.parse(JSON.stringify(state));

          // Call function
          validateBuy(goodType, quantity, price, state);

          // State should be unchanged
          expect(state).toEqual(stateCopy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateProfit should return correct direction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (buyPrice, currentPrice) => {
          const stack = { buyPrice };
          const result = calculateProfit(stack, currentPrice);

          if (currentPrice > buyPrice) {
            expect(result.direction).toBe('positive');
            expect(result.margin).toBeGreaterThan(0);
          } else if (currentPrice < buyPrice) {
            expect(result.direction).toBe('negative');
            expect(result.margin).toBeLessThan(0);
          } else {
            expect(result.direction).toBe('neutral');
            expect(result.margin).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatCargoAge should return correct format', () => {
    expect(formatCargoAge(10, 10)).toBe('today');
    expect(formatCargoAge(11, 10)).toBe('1 day ago');
    expect(formatCargoAge(15, 10)).toBe('5 days ago');
    expect(formatCargoAge(10, undefined)).toBe('');
    expect(formatCargoAge(undefined, 10)).toBe('');
  });
});
