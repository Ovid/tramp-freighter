'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { ENGINE_CONDITION_PENALTIES } from '../../js/game-constants.js';

/**
 * Property-Based Tests for Engine Condition Fuel Penalty
 *
 * Feature: dynamic-economy, Property 22: Engine Condition Fuel Penalty
 * Validates: Requirements 6.4
 *
 * Property: For any jump when engine condition is below 60%, the fuel consumption
 * should be increased by 20%.
 */

describe('Engine Condition Fuel Penalty - Property Tests', () => {
  // Mock star data for testing
  const mockStarData = [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
    { id: 1, x: 10, y: 0, z: 0, name: 'Alpha Centauri' },
    { id: 2, x: 20, y: 10, z: 5, name: 'Wolf 359' },
  ];

  // Mock wormhole data
  const mockWormholeData = [
    [0, 1],
    [1, 2],
  ];

  it('should apply 20% fuel penalty when engine condition is below 60%', () => {
    fc.assert(
      fc.property(
        // Generate random distance (0-20 light years)
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        // Generate engine condition below threshold
        fc.integer({ min: 0, max: 59 }),
        (distance, engineCondition) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          // Calculate base fuel cost (without condition penalty)
          const baseCost = navSystem.calculateFuelCost(distance);

          // Calculate fuel cost with condition penalty
          const costWithPenalty = navSystem.calculateFuelCostWithCondition(
            distance,
            engineCondition
          );

          // Expected cost with 20% penalty
          const expectedCost = baseCost * ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER;

          // Verify penalty is applied
          expect(costWithPenalty).toBeCloseTo(expectedCost, 5);
          expect(costWithPenalty).toBeGreaterThan(baseCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT apply fuel penalty when engine condition is 60% or above', () => {
    fc.assert(
      fc.property(
        // Generate random distance (0-20 light years)
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        // Generate engine condition at or above threshold
        fc.integer({ min: 60, max: 100 }),
        (distance, engineCondition) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          // Calculate base fuel cost (without condition penalty)
          const baseCost = navSystem.calculateFuelCost(distance);

          // Calculate fuel cost with condition (should be same as base)
          const costWithCondition = navSystem.calculateFuelCostWithCondition(
            distance,
            engineCondition
          );

          // Verify no penalty is applied
          expect(costWithCondition).toBeCloseTo(baseCost, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply exactly 20% penalty at threshold boundary (59%)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        (distance) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          const baseCost = navSystem.calculateFuelCost(distance);
          const costAt59 = navSystem.calculateFuelCostWithCondition(distance, 59);
          const expectedCost = baseCost * ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER;

          expect(costAt59).toBeCloseTo(expectedCost, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT apply penalty at threshold boundary (60%)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        (distance) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          const baseCost = navSystem.calculateFuelCost(distance);
          const costAt60 = navSystem.calculateFuelCostWithCondition(distance, 60);

          expect(costAt60).toBeCloseTo(baseCost, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
