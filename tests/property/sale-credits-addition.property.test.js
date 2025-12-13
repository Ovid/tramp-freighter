/**
 * Property-Based Tests for Sale Credits Addition
 * Feature: tramp-freighter-core-loop, Property 21: Sale Credits Addition
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 21: Sale Credits Addition', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameState.initNewGame();
  });

  /**
   * Property: For any valid sale of quantity Q at price P,
   * the player's credits should increase by Q × P.
   */
  it('should increase credits by quantity × price for all valid sales', () => {
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
        // Generate random quantity to buy (1-30)
        fc.integer({ min: 1, max: 30 }),
        // Generate random purchase price (5-100 credits per unit)
        fc.integer({ min: 5, max: 100 }),
        // Generate random sale price (5-100 credits per unit)
        fc.integer({ min: 5, max: 100 }),
        // Generate random quantity to sell (will be constrained by purchase qty)
        fc.integer({ min: 1, max: 30 }),
        (goodType, purchaseQty, buyPrice, salePrice, sellQty) => {
          // Reset to known state with enough credits and cargo space
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // First, buy some goods to have something to sell
          const buyResult = gameState.buyGood(goodType, purchaseQty, buyPrice);
          expect(buyResult.success).toBe(true);

          // Constrain sell quantity to what we actually have
          const actualSellQty = Math.min(sellQty, purchaseQty);

          // Record credits before sale
          const creditsBeforeSale = gameState.getPlayer().credits;

          // Execute sale
          const sellResult = gameState.sellGood(0, actualSellQty, salePrice);

          // Verify sale succeeded
          expect(sellResult.success).toBe(true);

          // Verify credits increased by exactly Q × P
          const creditsAfterSale = gameState.getPlayer().credits;
          const expectedRevenue = actualSellQty * salePrice;
          const expectedCredits = creditsBeforeSale + expectedRevenue;

          expect(creditsAfterSale).toBe(expectedCredits);

          // Additional invariant: credits should never go negative
          expect(creditsAfterSale).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Credits addition should be atomic
   * If sale fails, credits should remain unchanged
   */
  it('should not change credits if sale fails validation', () => {
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
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 5, max: 100 }),
        fc.integer({ min: 5, max: 100 }),
        (goodType, purchaseQty, buyPrice, salePrice) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Buy some goods
          const buyResult = gameState.buyGood(goodType, purchaseQty, buyPrice);
          expect(buyResult.success).toBe(true);

          const creditsBeforeSale = gameState.getPlayer().credits;

          // Attempt to sell more than we have
          const invalidQty = purchaseQty + 10;
          const sellResult = gameState.sellGood(0, invalidQty, salePrice);

          // Verify sale failed
          expect(sellResult.success).toBe(false);
          expect(sellResult.reason).toBe('Not enough quantity in stack');

          // Verify credits unchanged
          const creditsAfterSale = gameState.getPlayer().credits;
          expect(creditsAfterSale).toBe(creditsBeforeSale);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple sales should accumulate correctly
   */
  it('should correctly accumulate credit additions across multiple sales', () => {
    fc.assert(
      fc.property(
        // Generate array of 2-4 initial purchases
        fc.array(
          fc.record({
            goodType: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            quantity: fc.integer({ min: 5, max: 10 }),
            buyPrice: fc.integer({ min: 5, max: 20 }),
          }),
          { minLength: 2, maxLength: 4 }
        ),
        // Generate sale price
        fc.integer({ min: 10, max: 50 }),
        (purchases, salePrice) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Execute all purchases
          for (const purchase of purchases) {
            gameState.buyGood(
              purchase.goodType,
              purchase.quantity,
              purchase.buyPrice
            );
          }

          const creditsBeforeSales = gameState.getPlayer().credits;
          let expectedRevenue = 0;

          // Sell from each stack (sell half of each)
          const cargo = gameState.getShip().cargo;
          const stackCount = cargo.length;

          for (let i = stackCount - 1; i >= 0; i--) {
            const stack = cargo[i];
            const sellQty = Math.floor(stack.qty / 2);

            if (sellQty > 0) {
              const result = gameState.sellGood(i, sellQty, salePrice);

              if (result.success) {
                expectedRevenue += sellQty * salePrice;
              }
            }
          }

          // Verify final credits match expected
          const creditsAfterSales = gameState.getPlayer().credits;
          const expectedCredits = creditsBeforeSales + expectedRevenue;
          expect(creditsAfterSales).toBe(expectedCredits);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Profit calculation should be correct
   * Sale should return correct profit margin
   */
  it('should return correct profit margin (sale price - purchase price)', () => {
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
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 5, max: 100 }),
        fc.integer({ min: 5, max: 100 }),
        (goodType, quantity, buyPrice, salePrice) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Buy goods
          gameState.buyGood(goodType, quantity, buyPrice);

          // Sell goods
          const sellResult = gameState.sellGood(0, quantity, salePrice);

          // Verify profit margin is correct
          expect(sellResult.success).toBe(true);
          expect(sellResult.profitMargin).toBe(salePrice - buyPrice);
        }
      ),
      { numRuns: 100 }
    );
  });
});
