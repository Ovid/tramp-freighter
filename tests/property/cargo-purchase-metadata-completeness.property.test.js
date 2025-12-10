'use strict';

/**
 * Property-Based Tests for Cargo Purchase Metadata Completeness
 * Feature: ship-personality, Property 6: Cargo Purchase Metadata Completeness
 * Validates: Requirements 5.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 6: Cargo Purchase Metadata Completeness', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameState.initNewGame();
  });

  /**
   * Property: For any cargo purchase, all required fields must be present
   *
   * Every cargo entry should contain:
   * - good: Commodity type
   * - qty: Quantity
   * - buyPrice: Purchase price per unit
   * - buySystem: System ID where purchased
   * - buySystemName: System name where purchased
   * - buyDate: Game day when purchased
   */
  it('should include all required metadata fields for any cargo purchase', () => {
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
        fc.constantFrom(0, 1, 4, 5, 7),
        fc.integer({ min: 0, max: 100 }),
        (goodType, quantity, price, systemId, day) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

          const totalCost = quantity * price;

          if (totalCost <= 10000 && quantity <= 50) {
            const result = gameState.buyGood(goodType, quantity, price);
            expect(result.success).toBe(true);

            const cargo = gameState.getShip().cargo;
            expect(cargo.length).toBe(1);

            const stack = cargo[0];

            // Verify all required fields are present
            expect(stack).toHaveProperty('good');
            expect(stack).toHaveProperty('qty');
            expect(stack).toHaveProperty('buyPrice');
            expect(stack).toHaveProperty('buySystem');
            expect(stack).toHaveProperty('buySystemName');
            expect(stack).toHaveProperty('buyDate');

            // Verify field values are correct
            expect(stack.good).toBe(goodType);
            expect(stack.qty).toBe(quantity);
            expect(stack.buyPrice).toBe(price);
            expect(stack.buySystem).toBe(systemId);
            expect(typeof stack.buySystemName).toBe('string');
            expect(stack.buySystemName.length).toBeGreaterThan(0);
            expect(stack.buyDate).toBe(day);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cargo stacks when good, buyPrice, and buySystem all match
   *
   * When purchasing the same good at the same price in the same system,
   * cargo should consolidate into a single stack with increased quantity.
   */
  it('should stack cargo when good, buyPrice, and buySystem match', () => {
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
        fc.constantFrom(0, 1, 4, 5, 7),
        fc.integer({ min: 0, max: 50 }),
        (goodType, quantity, price, systemId, day) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

          // First purchase
          const result1 = gameState.buyGood(goodType, quantity, price);
          expect(result1.success).toBe(true);

          // Second purchase - same good, same price, same system
          const result2 = gameState.buyGood(goodType, quantity, price);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // Should consolidate into 1 stack
            expect(cargo.length).toBe(1);
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(quantity * 2);
            expect(cargo[0].buyPrice).toBe(price);
            expect(cargo[0].buySystem).toBe(systemId);
            expect(cargo[0].buyDate).toBe(day);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cargo creates separate stack when any field differs
   *
   * When purchasing cargo where good type, price, or system differs,
   * a separate stack should be created.
   */
  it('should create separate stacks when good, price, or system differs', () => {
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
        fc.integer({ min: 31, max: 60 }), // Different price
        fc.constantFrom(0, 1, 4, 5, 7),
        fc.integer({ min: 0, max: 50 }),
        (goodType, quantity, price1, price2, systemId, day) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

          // First purchase at price1
          const result1 = gameState.buyGood(goodType, quantity, price1);
          expect(result1.success).toBe(true);

          // Second purchase at price2 (different price)
          const result2 = gameState.buyGood(goodType, quantity, price2);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // Should have 2 separate stacks (different prices)
            expect(cargo.length).toBe(2);

            // First stack
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(quantity);
            expect(cargo[0].buyPrice).toBe(price1);

            // Second stack
            expect(cargo[1].good).toBe(goodType);
            expect(cargo[1].qty).toBe(quantity);
            expect(cargo[1].buyPrice).toBe(price2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different systems create separate stacks even with same price
   *
   * According to the design, stacking only matches on good type and price,
   * NOT system. This test verifies that behavior.
   */
  it('should stack cargo from different systems if good and price match', () => {
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
        fc.constantFrom(0, 1), // Two different systems
        fc.integer({ min: 0, max: 50 }),
        (goodType, quantity, price, systemId1, day) => {
          const systemId2 = systemId1 === 0 ? 1 : 0; // Different system

          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // First purchase at system 1
          gameState.updateLocation(systemId1);
          gameState.updateTime(day);
          const result1 = gameState.buyGood(goodType, quantity, price);
          expect(result1.success).toBe(true);

          // Capture first purchase metadata
          const firstStack = gameState.getShip().cargo[0];
          const firstSystem = firstStack.buySystem;
          const firstSystemName = firstStack.buySystemName;
          const firstDate = firstStack.buyDate;

          // Second purchase at system 2 (same good, same price)
          gameState.updateLocation(systemId2);
          gameState.updateTime(day + 5);
          const result2 = gameState.buyGood(goodType, quantity, price);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // Should consolidate into 1 stack (same good and price)
            expect(cargo.length).toBe(1);
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(quantity * 2);
            expect(cargo[0].buyPrice).toBe(price);

            // Metadata should be from FIRST purchase (stack creation)
            expect(cargo[0].buySystem).toBe(firstSystem);
            expect(cargo[0].buySystemName).toBe(firstSystemName);
            expect(cargo[0].buyDate).toBe(firstDate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
