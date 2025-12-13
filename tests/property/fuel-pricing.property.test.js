/**
 * Property-Based Tests for Fuel Pricing
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import {
  FUEL_PRICING_CONFIG,
  calculateDistanceFromSol,
} from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Fuel Pricing Properties', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 25.5: Core System Fuel Pricing
   *
   * For any star system that is Sol (system ID 0) or Alpha Centauri (system ID 1),
   * the fuel price should be 2 credits per 1%.
   */
  describe('Property 25.5: Core System Fuel Pricing', () => {
    it('should price fuel at 2 credits per 1% for core systems', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(0, 1), // Sol or Alpha Centauri
          (systemId) => {
            const fuelPrice = gameStateManager.getFuelPrice(systemId);
            expect(fuelPrice).toBe(
              FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT
            );
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 26: Mid-Range System Fuel Pricing
   *
   * For any star system with distance from Sol between 4.5 and 10 light years
   * (excluding Sol and Alpha Centauri), the fuel price should be 3 credits per 1%.
   */
  describe('Property 26: Mid-Range System Fuel Pricing', () => {
    it('should price fuel at 3 credits per 1% for mid-range systems', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ...TEST_STAR_DATA.filter((s) => {
              if (s.id === 0 || s.id === 1) return false;
              const distance = calculateDistanceFromSol(s);
              return distance >= 4.5 && distance < 10;
            })
          ),
          (system) => {
            const fuelPrice = gameStateManager.getFuelPrice(system.id);
            expect(fuelPrice).toBe(
              FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT
            );
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 27: Outer System Fuel Pricing
   *
   * For any star system with distance from Sol ≥ 10 light years,
   * the fuel price should be 4 credits per 1%.
   */
  describe('Property 27: Outer System Fuel Pricing', () => {
    it('should price fuel at 4 credits per 1% for outer systems', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ...TEST_STAR_DATA.filter((s) => {
              const distance = calculateDistanceFromSol(s);
              return distance >= 10;
            })
          ),
          (system) => {
            const fuelPrice = gameStateManager.getFuelPrice(system.id);
            expect(fuelPrice).toBe(
              FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT
            );
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 28: Refuel Cost Calculation
   *
   * For any refuel amount A at fuel price P, the total cost should equal A × P.
   */
  describe('Property 28: Refuel Cost Calculation', () => {
    it('should calculate refuel cost as amount × price', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEST_STAR_DATA),
          fc.integer({ min: 1, max: 100 }), // refuel amount
          (system, amount) => {
            const pricePerPercent = gameStateManager.getFuelPrice(system.id);
            const expectedCost = amount * pricePerPercent;

            // Validate refuel to get the cost
            const validation = gameStateManager.validateRefuel(
              0, // current fuel (doesn't matter for cost calculation)
              amount,
              expectedCost, // credits (exactly enough)
              pricePerPercent
            );

            expect(validation.cost).toBe(expectedCost);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 29: Refuel Capacity Constraint
   *
   * For any refuel attempt, the system should prevent refueling beyond 100% fuel capacity.
   */
  describe('Property 29: Refuel Capacity Constraint', () => {
    it('should prevent refueling beyond 100% capacity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // current fuel
          fc.integer({ min: 1, max: 200 }), // refuel amount
          (currentFuel, amount) => {
            const pricePerPercent = FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE;
            const totalCost = amount * pricePerPercent;

            const validation = gameStateManager.validateRefuel(
              currentFuel,
              amount,
              totalCost, // credits (enough)
              pricePerPercent
            );

            if (currentFuel + amount > 100) {
              // Should fail with capacity constraint error
              expect(validation.valid).toBe(false);
              expect(validation.reason).toBe(
                'Cannot refuel beyond 100% capacity'
              );
            } else {
              // Should not fail due to capacity (might be valid or fail for other reasons)
              if (!validation.valid) {
                expect(validation.reason).not.toBe(
                  'Cannot refuel beyond 100% capacity'
                );
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow refueling to exactly 100%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }), // current fuel (not full)
          (currentFuel) => {
            const amount = 100 - currentFuel; // Refuel to exactly 100%
            const pricePerPercent = FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE;
            const totalCost = amount * pricePerPercent;

            const validation = gameStateManager.validateRefuel(
              currentFuel,
              amount,
              totalCost, // credits (enough)
              pricePerPercent
            );

            // Should be valid (not fail due to capacity)
            expect(validation.valid).toBe(true);
            expect(validation.reason).toBe(null);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 30: Refuel Credit Validation
   *
   * For any refuel attempt with cost C, the system should prevent the transaction
   * if player credits < C.
   */
  describe('Property 30: Refuel Credit Validation', () => {
    it('should prevent refueling with insufficient credits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // refuel amount
          fc.integer({ min: 0, max: 1000 }), // player credits
          (amount, credits) => {
            const pricePerPercent = FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE;
            const totalCost = amount * pricePerPercent;

            const validation = gameStateManager.validateRefuel(
              50, // current fuel (doesn't matter for credit check)
              amount,
              credits,
              pricePerPercent
            );

            if (totalCost > credits) {
              // Should fail with insufficient credits error
              expect(validation.valid).toBe(false);
              expect(validation.reason).toBe('Insufficient credits for refuel');
            } else {
              // Should not fail due to credits (might be valid or fail for other reasons)
              if (!validation.valid) {
                expect(validation.reason).not.toBe(
                  'Insufficient credits for refuel'
                );
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow refueling with exactly enough credits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // refuel amount
          (amount) => {
            const pricePerPercent = FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE;
            const totalCost = amount * pricePerPercent;

            const validation = gameStateManager.validateRefuel(
              50, // current fuel
              amount,
              totalCost, // credits (exactly enough)
              pricePerPercent
            );

            // Should be valid (not fail due to credits)
            expect(validation.valid).toBe(true);
            expect(validation.reason).toBe(null);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 31: Refuel State Mutation
   *
   * For any valid refuel transaction with amount A and cost C,
   * the player's credits should decrease by C and the ship's fuel should increase by A.
   */
  describe('Property 31: Refuel State Mutation', () => {
    it('should decrease credits and increase fuel on valid refuel', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // refuel amount
          fc.integer({ min: 0, max: 50 }), // starting fuel
          (amount, startingFuel) => {
            // Reset game state
            gameStateManager.initNewGame();

            // Set up initial state
            gameStateManager.updateFuel(startingFuel);
            const startingCredits = 1000; // Enough for any refuel
            gameStateManager.updateCredits(startingCredits);

            // Get fuel price for current system (Sol)
            const pricePerPercent = gameStateManager.getFuelPrice(0);
            const expectedCost = amount * pricePerPercent;

            // Execute refuel
            const result = gameStateManager.refuel(amount);

            // Should succeed
            expect(result.success).toBe(true);

            // Check state mutations
            const finalState = gameStateManager.getState();
            expect(finalState.player.credits).toBe(
              startingCredits - expectedCost
            );
            expect(finalState.ship.fuel).toBe(startingFuel + amount);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not mutate state on failed refuel', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 51, max: 100 }), // refuel amount (will exceed capacity)
          (amount) => {
            // Reset game state
            gameStateManager.initNewGame();

            // Set up initial state with high fuel
            const startingFuel = 60;
            gameStateManager.updateFuel(startingFuel);
            const startingCredits = 1000;
            gameStateManager.updateCredits(startingCredits);

            // Execute refuel (should fail due to capacity)
            const result = gameStateManager.refuel(amount);

            // Should fail
            expect(result.success).toBe(false);

            // State should be unchanged
            const finalState = gameStateManager.getState();
            expect(finalState.player.credits).toBe(startingCredits);
            expect(finalState.ship.fuel).toBe(startingFuel);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
