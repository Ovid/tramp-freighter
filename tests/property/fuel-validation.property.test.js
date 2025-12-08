/**
 * Property-Based Tests for Fuel Validation
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 10: Insufficient Fuel Prevention', () => {
  let navSystem;

  beforeEach(() => {
    navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 10: Insufficient Fuel Prevention
   *
   * For any jump attempt where the ship's current fuel is less than the required fuel cost,
   * the system should prevent the jump and display an error message.
   */
  it('should prevent jumps when fuel is insufficient', () => {
    fc.assert(
      fc.property(
        // Generate a valid wormhole connection
        fc.constantFrom(...TEST_WORMHOLE_DATA),
        fc.integer({ min: 0, max: 100 }), // current fuel
        (connection, currentFuel) => {
          const [systemId1, systemId2] = connection;

          // Get the stars to calculate fuel cost
          const star1 = TEST_STAR_DATA.find((s) => s.id === systemId1);
          const star2 = TEST_STAR_DATA.find((s) => s.id === systemId2);

          const distance = navSystem.calculateDistanceBetween(star1, star2);
          const fuelCost = navSystem.calculateFuelCost(distance);

          // Validate jump
          const validation = navSystem.validateJump(
            systemId1,
            systemId2,
            currentFuel
          );

          if (currentFuel < fuelCost) {
            // Should fail with insufficient fuel error
            expect(validation.valid).toBe(false);
            expect(validation.error).toBe('Insufficient fuel for jump');
            expect(validation.fuelCost).toBe(fuelCost);
          } else {
            // Should not fail due to fuel (might be valid or fail for other reasons)
            if (!validation.valid) {
              expect(validation.error).not.toBe('Insufficient fuel for jump');
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow jumps when fuel is exactly sufficient', () => {
    fc.assert(
      fc.property(
        // Generate a valid wormhole connection
        fc.constantFrom(...TEST_WORMHOLE_DATA),
        (connection) => {
          const [systemId1, systemId2] = connection;

          // Get the stars to calculate fuel cost
          const star1 = TEST_STAR_DATA.find((s) => s.id === systemId1);
          const star2 = TEST_STAR_DATA.find((s) => s.id === systemId2);

          const distance = navSystem.calculateDistanceBetween(star1, star2);
          const fuelCost = navSystem.calculateFuelCost(distance);

          // Set fuel to exactly the cost
          const validation = navSystem.validateJump(
            systemId1,
            systemId2,
            fuelCost
          );

          // Should be valid (not fail due to fuel)
          expect(validation.valid).toBe(true);
          expect(validation.error).toBe(null);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
