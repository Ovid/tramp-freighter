'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { ENGINE_CONDITION_PENALTIES } from '../../js/game-constants.js';

/**
 * Property-Based Tests for Engine Condition Time Penalty
 *
 * Feature: dynamic-economy, Property 23: Engine Condition Time Penalty
 * Validates: Requirements 6.5
 *
 * Property: For any jump when engine condition is below 60%, the jump time
 * should be increased by one additional day.
 */

describe('Engine Condition Time Penalty - Property Tests', () => {
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

  it('should add 1 day to jump time when engine condition is below 60%', () => {
    fc.assert(
      fc.property(
        // Generate random distance (0-20 light years)
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        // Generate engine condition below threshold
        fc.integer({ min: 0, max: 59 }),
        (distance, engineCondition) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          // Calculate base jump time (without condition penalty)
          const baseTime = navSystem.calculateJumpTime(distance);

          // Calculate jump time with condition penalty
          const timeWithPenalty = navSystem.calculateJumpTimeWithCondition(
            distance,
            engineCondition
          );

          // Expected time with +1 day penalty
          const expectedTime = baseTime + ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS;

          // Verify penalty is applied
          expect(timeWithPenalty).toBe(expectedTime);
          expect(timeWithPenalty).toBeGreaterThan(baseTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT add time penalty when engine condition is 60% or above', () => {
    fc.assert(
      fc.property(
        // Generate random distance (0-20 light years)
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        // Generate engine condition at or above threshold
        fc.integer({ min: 60, max: 100 }),
        (distance, engineCondition) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          // Calculate base jump time (without condition penalty)
          const baseTime = navSystem.calculateJumpTime(distance);

          // Calculate jump time with condition (should be same as base)
          const timeWithCondition = navSystem.calculateJumpTimeWithCondition(
            distance,
            engineCondition
          );

          // Verify no penalty is applied
          expect(timeWithCondition).toBe(baseTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should add exactly 1 day at threshold boundary (59%)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        (distance) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          const baseTime = navSystem.calculateJumpTime(distance);
          const timeAt59 = navSystem.calculateJumpTimeWithCondition(distance, 59);
          const expectedTime = baseTime + ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS;

          expect(timeAt59).toBe(expectedTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT add time penalty at threshold boundary (60%)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(20), noNaN: true }),
        (distance) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          const baseTime = navSystem.calculateJumpTime(distance);
          const timeAt60 = navSystem.calculateJumpTimeWithCondition(distance, 60);

          expect(timeAt60).toBe(baseTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain minimum jump time of 1 day even with penalty', () => {
    fc.assert(
      fc.property(
        // Generate very short distances that would normally result in 1 day
        fc.float({ min: Math.fround(0.1), max: Math.fround(1), noNaN: true }),
        fc.integer({ min: 0, max: 59 }),
        (distance, engineCondition) => {
          const navSystem = new NavigationSystem(mockStarData, mockWormholeData);

          const timeWithPenalty = navSystem.calculateJumpTimeWithCondition(
            distance,
            engineCondition
          );

          // Even with penalty, time should be at least 1 day (base) + 1 day (penalty) = 2 days
          expect(timeWithPenalty).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
