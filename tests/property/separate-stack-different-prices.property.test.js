/**
 * Property-Based Tests for Separate Stack for Different Prices
 * Feature: tramp-freighter-core-loop, Property 19: Separate Stack for Different Prices
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 19: Separate Stack for Different Prices', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameState.initNewGame();
  });

  /**
   * Property: For any purchase of a good at price P1 when existing cargo
   * contains the same good at price P2 where P1 ≠ P2, a separate cargo stack
   * should be created rather than merging with the existing stack.
   */
  it('should create separate stacks for same good at different prices', () => {
    fc.assert(
      fc.property(
        // Generate random good type
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        // Generate two different prices
        fc.integer({ min: 5, max: 50 }),
        fc.integer({ min: 51, max: 100 }),
        // Generate quantities
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (goodType, price1, price2, qty1, qty2) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // First purchase at price1
          const result1 = gameState.buyGood(goodType, qty1, price1);
          expect(result1.success).toBe(true);

          // Verify we have 1 stack
          let cargo = gameState.getShip().cargo;
          expect(cargo.length).toBe(1);
          expect(cargo[0].good).toBe(goodType);
          expect(cargo[0].qty).toBe(qty1);
          expect(cargo[0].buyPrice).toBe(price1);

          // Second purchase of SAME good at price2 (different price)
          const result2 = gameState.buyGood(goodType, qty2, price2);
          expect(result2.success).toBe(true);

          // Verify we now have 2 SEPARATE stacks
          cargo = gameState.getShip().cargo;
          expect(cargo.length).toBe(2);

          // Verify first stack unchanged
          expect(cargo[0].good).toBe(goodType);
          expect(cargo[0].qty).toBe(qty1);
          expect(cargo[0].buyPrice).toBe(price1);

          // Verify second stack is separate
          expect(cargo[1].good).toBe(goodType);
          expect(cargo[1].qty).toBe(qty2);
          expect(cargo[1].buyPrice).toBe(price2);

          // Verify prices are different
          expect(cargo[0].buyPrice).not.toBe(cargo[1].buyPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple purchases of same good at different prices
   * should create multiple separate stacks
   */
  it('should create multiple separate stacks for same good at varying prices', () => {
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
        // Generate array of 3-5 different prices
        fc.array(
          fc.record({
            price: fc.integer({ min: 5, max: 100 }),
            qty: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 3, maxLength: 5 }
        ),
        (goodType, purchases) => {
          // Ensure all prices are unique
          const uniquePrices = new Set(purchases.map((p) => p.price));
          if (uniquePrices.size < purchases.length) {
            // Skip if we don't have unique prices
            return;
          }

          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          let successfulPurchases = 0;

          // Execute all purchases of the SAME good at different prices
          for (const purchase of purchases) {
            const totalCost = purchase.qty * purchase.price;

            if (
              totalCost <= gameState.getPlayer().credits &&
              gameState.getCargoRemaining() >= purchase.qty
            ) {
              const result = gameState.buyGood(
                goodType,
                purchase.qty,
                purchase.price
              );

              if (result.success) {
                successfulPurchases++;
              }
            }
          }

          // Verify we have separate stacks for each purchase
          const cargo = gameState.getShip().cargo;
          expect(cargo.length).toBe(successfulPurchases);

          // Verify all stacks are for the same good
          for (const stack of cargo) {
            expect(stack.good).toBe(goodType);
          }

          // Verify all stacks have different prices
          const prices = cargo.map((stack) => stack.buyPrice);
          const uniqueStackPrices = new Set(prices);
          expect(uniqueStackPrices.size).toBe(cargo.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Stacks should remain separate even with same good type
   * Total quantity should be sum of all stacks
   */
  it('should maintain separate stacks and correctly sum quantities', () => {
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
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 5, max: 30 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 31, max: 60 }),
        (goodType, qty1, price1, qty2, price2) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Purchase same good twice at different prices
          const result1 = gameState.buyGood(goodType, qty1, price1);
          const result2 = gameState.buyGood(goodType, qty2, price2);

          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          const cargo = gameState.getShip().cargo;

          // Verify 2 separate stacks
          expect(cargo.length).toBe(2);

          // Verify total cargo used is sum of both quantities
          const totalCargoUsed = gameState.getCargoUsed();
          expect(totalCargoUsed).toBe(qty1 + qty2);

          // Verify each stack maintains its own quantity
          expect(cargo[0].qty).toBe(qty1);
          expect(cargo[1].qty).toBe(qty2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Same good at same price consolidates into one stack
   * (This tests the consolidation behavior)
   */
  it('should consolidate stacks for same good at same price', () => {
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
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 5, max: 50 }),
        (goodType, qty1, qty2, price) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Purchase same good twice at SAME price
          const result1 = gameState.buyGood(goodType, qty1, price);
          const result2 = gameState.buyGood(goodType, qty2, price);

          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          const cargo = gameState.getShip().cargo;

          // Verify consolidated into 1 stack
          expect(cargo.length).toBe(1);

          // Verify stack has correct good and price
          expect(cargo[0].good).toBe(goodType);
          expect(cargo[0].buyPrice).toBe(price);

          // Verify quantities are combined
          expect(cargo[0].qty).toBe(qty1 + qty2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
