/**
 * Property-Based Tests for Purchase Cargo Stack Creation
 * Feature: tramp-freighter-core-loop, Property 18: Purchase Cargo Stack Creation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 18: Purchase Cargo Stack Creation', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameState.initNewGame();
  });

  /**
   * Property: For any valid purchase of good type G with quantity Q at price P,
   * a new cargo stack should be created containing good type G, quantity Q,
   * and purchase price P.
   */
  it('should create new cargo stack with correct good type, quantity, and purchase price', () => {
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
        // Generate random quantity (1-30 to ensure we have space)
        fc.integer({ min: 1, max: 30 }),
        // Generate random price (5-100 credits per unit)
        fc.integer({ min: 5, max: 100 }),
        (goodType, quantity, price) => {
          // Reset to known state with enough credits and cargo space
          gameState.initNewGame();
          const initialCredits = 10000;
          gameState.updateCredits(initialCredits);

          // Clear cargo to start fresh
          gameState.updateCargo([]);

          const totalCost = quantity * price;

          // Only test if we can afford it and have space
          if (totalCost <= initialCredits && quantity <= 50) {
            // Execute purchase
            const result = gameState.buyGood(goodType, quantity, price);

            // Verify purchase succeeded
            expect(result.success).toBe(true);

            // Get the cargo after purchase
            const cargo = gameState.getShip().cargo;

            // Verify a new stack was created
            expect(cargo.length).toBe(1);

            // Verify the stack has correct properties
            const newStack = cargo[0];
            expect(newStack.good).toBe(goodType);
            expect(newStack.qty).toBe(quantity);
            expect(newStack.buyPrice).toBe(price);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Purchases consolidate when good and price match
   * Multiple purchases of same good at same price should consolidate into one stack
   */
  it('should consolidate stacks when buying same good at same price', () => {
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
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 2, max: 4 }), // Number of purchases
        (goodType, quantity, price, numPurchases) => {
          // Reset to known state with empty cargo
          gameState.initNewGame();
          const initialCredits = 10000;
          gameState.updateCredits(initialCredits);
          gameState.updateCargo([]); // Clear initial cargo

          let totalQuantity = 0;
          let successfulPurchases = 0;

          // Execute multiple purchases of same good at same price
          for (let i = 0; i < numPurchases; i++) {
            const totalCost = quantity * price;

            // Only proceed if we can afford it and have space
            if (
              totalCost <= gameState.getPlayer().credits &&
              gameState.getCargoRemaining() >= quantity
            ) {
              const result = gameState.buyGood(goodType, quantity, price);

              if (result.success) {
                totalQuantity += quantity;
                successfulPurchases++;
              }
            }
          }

          // Verify only one stack was created (consolidation)
          const cargo = gameState.getShip().cargo;
          if (successfulPurchases > 0) {
            // All purchases of same good at same price should consolidate into 1 stack
            expect(cargo.length).toBe(1);
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(totalQuantity);
            expect(cargo[0].buyPrice).toBe(price);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Stack creation should consolidate or create new based on good and price match
   */
  it('should consolidate matching stacks or create new ones appropriately', () => {
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
        fc.integer({ min: 5, max: 50 }),
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 5, max: 50 }),
        (goodType1, qty1, price1, goodType2, qty2, price2) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // First purchase
          const result1 = gameState.buyGood(goodType1, qty1, price1);
          expect(result1.success).toBe(true);

          // Capture first stack
          const firstStack = { ...gameState.getShip().cargo[0] };

          // Second purchase
          const result2 = gameState.buyGood(goodType2, qty2, price2);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // If same good and same price, should consolidate into 1 stack
            if (goodType1 === goodType2 && price1 === price2) {
              expect(cargo.length).toBe(1);
              expect(cargo[0].good).toBe(goodType1);
              expect(cargo[0].qty).toBe(qty1 + qty2);
              expect(cargo[0].buyPrice).toBe(price1);
            } else {
              // Different good or different price, should have 2 stacks
              expect(cargo.length).toBe(2);

              // Verify first stack unchanged
              expect(cargo[0].good).toBe(firstStack.good);
              expect(cargo[0].qty).toBe(firstStack.qty);
              expect(cargo[0].buyPrice).toBe(firstStack.buyPrice);

              // Verify second stack is new
              expect(cargo[1].good).toBe(goodType2);
              expect(cargo[1].qty).toBe(qty2);
              expect(cargo[1].buyPrice).toBe(price2);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
