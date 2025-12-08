/**
 * Property-Based Tests for Cargo Purchase Metadata Storage
 * Feature: dynamic-economy, Property 32: Cargo Purchase Metadata Storage
 * Validates: Requirements 9.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 32: Cargo Purchase Metadata Storage', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameState.initNewGame();
  });

  /**
   * Property: For any cargo purchase, the cargo stack should store the purchase price,
   * purchase system identifier, and purchase day as flat fields in the cargo stack structure.
   *
   * This property validates that when a player purchases cargo, the system records:
   * - purchasePrice: The price paid per unit
   * - purchaseSystem: The system ID where the cargo was purchased
   * - purchaseDay: The game day when the cargo was purchased
   */
  it('should store purchase metadata (price, system, day) for all cargo purchases', () => {
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
        // Generate random system ID (0-10 for test data)
        fc.integer({ min: 0, max: 10 }),
        // Generate random day (0-100)
        fc.integer({ min: 0, max: 100 }),
        (goodType, quantity, price, systemId, day) => {
          // Reset to known state with enough credits and cargo space
          gameState.initNewGame();
          const initialCredits = 10000;
          gameState.updateCredits(initialCredits);

          // Clear cargo to start fresh
          gameState.updateCargo([]);

          // Set the current system and day to match our test values
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

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

            // Verify the stack has correct properties including metadata
            const newStack = cargo[0];
            expect(newStack.good).toBe(goodType);
            expect(newStack.qty).toBe(quantity);
            expect(newStack.purchasePrice).toBe(price);
            expect(newStack.purchaseSystem).toBe(systemId);
            expect(newStack.purchaseDay).toBe(day);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Purchase metadata should be preserved when consolidating stacks
   *
   * When multiple purchases of the same good at the same price are made,
   * they consolidate into a single stack. The metadata should reflect the
   * first purchase (since that's when the stack was created).
   */
  it('should preserve purchase metadata when consolidating stacks', () => {
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
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 50 }),
        (goodType, quantity, price, systemId, day) => {
          // Reset to known state with empty cargo
          gameState.initNewGame();
          const initialCredits = 10000;
          gameState.updateCredits(initialCredits);
          gameState.updateCargo([]);

          // Set location and time for first purchase
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

          // First purchase
          const result1 = gameState.buyGood(goodType, quantity, price);
          expect(result1.success).toBe(true);

          // Capture first stack metadata
          const firstStack = gameState.getShip().cargo[0];
          const firstPurchaseSystem = firstStack.purchaseSystem;
          const firstPurchaseDay = firstStack.purchaseDay;

          // Advance time and potentially change location
          const newDay = day + 5;
          const newSystemId = (systemId + 1) % 11; // Different system
          gameState.updateTime(newDay);
          gameState.updateLocation(newSystemId);

          // Second purchase of same good at same price
          const result2 = gameState.buyGood(goodType, quantity, price);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // Should consolidate into 1 stack
            expect(cargo.length).toBe(1);
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(quantity * 2);
            expect(cargo[0].purchasePrice).toBe(price);

            // Metadata should be from the FIRST purchase (stack creation)
            expect(cargo[0].purchaseSystem).toBe(firstPurchaseSystem);
            expect(cargo[0].purchaseDay).toBe(firstPurchaseDay);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different prices create separate stacks with distinct metadata
   *
   * When purchasing the same good at different prices, separate stacks should
   * be created, each with their own purchase metadata.
   */
  it('should create separate stacks with distinct metadata for different prices', () => {
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
        fc.integer({ min: 31, max: 50 }), // Ensure different price
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 50 }),
        (goodType, quantity, price1, price2, systemId, day) => {
          // Reset to known state
          gameState.initNewGame();
          gameState.updateCredits(10000);
          gameState.updateCargo([]);

          // Set location and time for first purchase
          gameState.updateLocation(systemId);
          gameState.updateTime(day);

          // First purchase at price1
          const result1 = gameState.buyGood(goodType, quantity, price1);
          expect(result1.success).toBe(true);

          // Advance time and change location
          const newDay = day + 3;
          const newSystemId = (systemId + 2) % 11;
          gameState.updateTime(newDay);
          gameState.updateLocation(newSystemId);

          // Second purchase at price2 (different price)
          const result2 = gameState.buyGood(goodType, quantity, price2);

          if (result2.success) {
            const cargo = gameState.getShip().cargo;

            // Should have 2 separate stacks (different prices)
            expect(cargo.length).toBe(2);

            // First stack should have first purchase metadata
            expect(cargo[0].good).toBe(goodType);
            expect(cargo[0].qty).toBe(quantity);
            expect(cargo[0].purchasePrice).toBe(price1);
            expect(cargo[0].purchaseSystem).toBe(systemId);
            expect(cargo[0].purchaseDay).toBe(day);

            // Second stack should have second purchase metadata
            expect(cargo[1].good).toBe(goodType);
            expect(cargo[1].qty).toBe(quantity);
            expect(cargo[1].purchasePrice).toBe(price2);
            expect(cargo[1].purchaseSystem).toBe(newSystemId);
            expect(cargo[1].purchaseDay).toBe(newDay);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Initial cargo should have purchase metadata
   *
   * The initial cargo (20 grain at Sol on day 0) should also have
   * purchase metadata fields populated.
   */
  it('should include purchase metadata in initial cargo', () => {
    // Initialize new game
    gameState.initNewGame();

    const cargo = gameState.getShip().cargo;

    // Should have initial cargo
    expect(cargo.length).toBeGreaterThan(0);

    // Check first stack (initial grain)
    const initialStack = cargo[0];
    expect(initialStack.good).toBe('grain');
    expect(initialStack.qty).toBe(20);
    expect(initialStack.purchasePrice).toBeGreaterThan(0);
    expect(initialStack.purchaseSystem).toBe(0); // Sol
    expect(initialStack.purchaseDay).toBe(0); // Day 0
  });
});
