import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('NavigationSystem - Jump Calculations (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 6: Jump Time Calculation
  // Feature: tramp-freighter-core-loop, Property 6: Jump Time Calculation
  // ========================================================================

  it('Property 6: For any distance in light years, jump time should equal max(1, ceil(distance × 0.5)) days', () => {
    const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Generator for distances (reasonable range for star systems)
    const distanceGenerator = fc.float({
      min: 0,
      max: 50, // Max distance in our sector is ~20 LY, but test up to 50
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(distanceGenerator, (distance) => {
        // Calculate jump time using NavigationSystem
        const calculatedJumpTime = navSystem.calculateJumpTime(distance);

        // Calculate expected jump time using the formula
        const expectedJumpTime = Math.max(1, Math.ceil(distance * 0.5));

        // Verify they match exactly
        expect(calculatedJumpTime).toBe(expectedJumpTime);

        // Additional invariants:
        // 1. Jump time is always at least 1 day
        expect(calculatedJumpTime).toBeGreaterThanOrEqual(1);

        // 2. Jump time is always an integer
        expect(Number.isInteger(calculatedJumpTime)).toBe(true);

        // 3. Jump time increases monotonically with distance
        if (distance > 0) {
          const longerDistance = distance + 1;
          const longerJumpTime = navSystem.calculateJumpTime(longerDistance);
          expect(longerJumpTime).toBeGreaterThanOrEqual(calculatedJumpTime);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 7: Fuel Cost Calculation
  // Feature: tramp-freighter-core-loop, Property 7: Fuel Cost Calculation
  // ========================================================================

  it('Property 7: For any distance in light years, fuel cost should equal 10 + (distance × 2) percent', () => {
    const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Generator for distances (reasonable range for star systems)
    const distanceGenerator = fc.float({
      min: 0,
      max: 50, // Max distance in our sector is ~20 LY, but test up to 50
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(distanceGenerator, (distance) => {
        // Calculate fuel cost using NavigationSystem
        const calculatedFuelCost = navSystem.calculateFuelCost(distance);

        // Calculate expected fuel cost using the formula
        const expectedFuelCost = 10 + distance * 2;

        // Verify they match (with small tolerance for floating point)
        expect(calculatedFuelCost).toBeCloseTo(expectedFuelCost, 10);

        // Additional invariants:
        // 1. Fuel cost is always at least 10% (base cost)
        expect(calculatedFuelCost).toBeGreaterThanOrEqual(10);

        // 2. Fuel cost increases linearly with distance
        if (distance > 0) {
          const longerDistance = distance + 1;
          const longerFuelCost = navSystem.calculateFuelCost(longerDistance);
          expect(longerFuelCost).toBeGreaterThan(calculatedFuelCost);
        }

        // 3. The relationship is linear: doubling distance doubles the variable cost
        if (distance > 0) {
          const doubleDistance = distance * 2;
          const doubleFuelCost = navSystem.calculateFuelCost(doubleDistance);
          const variableCost1 = calculatedFuelCost - 10;
          const variableCost2 = doubleFuelCost - 10;
          expect(variableCost2).toBeCloseTo(variableCost1 * 2, 10);
        }
      }),
      { numRuns: 100 }
    );
  });
});
