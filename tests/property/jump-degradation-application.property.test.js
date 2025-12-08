'use strict';

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { SHIP_DEGRADATION } from '../../js/game-constants.js';

/**
 * Feature: dynamic-economy, Property 20: Jump Degradation Application
 * Validates: Requirements 6.1
 *
 * For any jump with duration D days, the ship condition should degrade by:
 * hull -2%, engine -1%, life support -(0.5% × D).
 */
describe('Property 20: Jump Degradation Application', () => {
  it('should apply correct degradation rates for any jump duration', () => {
    fc.assert(
      fc.property(
        // Generate ship condition with all values in valid range
        fc.record({
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        // Generate jump duration (1-10 days is realistic range)
        fc.integer({ min: 1, max: 10 }),
        (ship, jumpDays) => {
          // Apply degradation
          const degradedShip = NavigationSystem.applyJumpDegradation(ship, jumpDays);

          // Calculate expected degradation amounts
          const expectedHullDegradation = SHIP_DEGRADATION.HULL_PER_JUMP;
          const expectedEngineDegradation = SHIP_DEGRADATION.ENGINE_PER_JUMP;
          const expectedLifeSupportDegradation = SHIP_DEGRADATION.LIFE_SUPPORT_PER_DAY * jumpDays;

          // Calculate expected values (before clamping)
          const expectedHull = ship.hull - expectedHullDegradation;
          const expectedEngine = ship.engine - expectedEngineDegradation;
          const expectedLifeSupport = ship.lifeSupport - expectedLifeSupportDegradation;

          // Verify degradation was applied correctly (accounting for clamping)
          // If expected value is within bounds, it should match exactly
          // If expected value is out of bounds, it should be clamped
          if (expectedHull >= 0 && expectedHull <= 100) {
            expect(degradedShip.hull).toBe(expectedHull);
          } else if (expectedHull < 0) {
            expect(degradedShip.hull).toBe(0);
          } else {
            expect(degradedShip.hull).toBe(100);
          }

          if (expectedEngine >= 0 && expectedEngine <= 100) {
            expect(degradedShip.engine).toBe(expectedEngine);
          } else if (expectedEngine < 0) {
            expect(degradedShip.engine).toBe(0);
          } else {
            expect(degradedShip.engine).toBe(100);
          }

          if (expectedLifeSupport >= 0 && expectedLifeSupport <= 100) {
            expect(degradedShip.lifeSupport).toBe(expectedLifeSupport);
          } else if (expectedLifeSupport < 0) {
            expect(degradedShip.lifeSupport).toBe(0);
          } else {
            expect(degradedShip.lifeSupport).toBe(100);
          }

          // Verify all values are within valid range
          expect(degradedShip.hull).toBeGreaterThanOrEqual(0);
          expect(degradedShip.hull).toBeLessThanOrEqual(100);
          expect(degradedShip.engine).toBeGreaterThanOrEqual(0);
          expect(degradedShip.engine).toBeLessThanOrEqual(100);
          expect(degradedShip.lifeSupport).toBeGreaterThanOrEqual(0);
          expect(degradedShip.lifeSupport).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve other ship properties', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          fuel: fc.integer({ min: 0, max: 100 }),
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
          cargoCapacity: fc.integer({ min: 10, max: 100 }),
        }),
        fc.integer({ min: 1, max: 10 }),
        (ship, jumpDays) => {
          const degradedShip = NavigationSystem.applyJumpDegradation(ship, jumpDays);

          // Verify other properties are preserved
          expect(degradedShip.name).toBe(ship.name);
          expect(degradedShip.fuel).toBe(ship.fuel);
          expect(degradedShip.cargoCapacity).toBe(ship.cargoCapacity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
