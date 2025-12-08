'use strict';

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_CONDITION_BOUNDS } from '../../js/game-constants.js';

/**
 * Feature: dynamic-economy, Property 21: Ship Condition Clamping
 * Validates: Requirements 6.2, 6.3
 *
 * For any ship condition value, the value should be clamped to the range [0, 100]
 * and never go negative or above maximum.
 */
describe('Property 21: Ship Condition Clamping', () => {
  it('should clamp all condition values to [0, 100] range in applyJumpDegradation', () => {
    fc.assert(
      fc.property(
        // Generate ship condition with values that may be outside valid range
        fc.record({
          hull: fc.integer({ min: -50, max: 150 }),
          engine: fc.integer({ min: -50, max: 150 }),
          lifeSupport: fc.integer({ min: -50, max: 150 }),
        }),
        fc.integer({ min: 1, max: 10 }),
        (ship, jumpDays) => {
          const degradedShip = NavigationSystem.applyJumpDegradation(ship, jumpDays);

          // Verify all values are clamped to [0, 100]
          expect(degradedShip.hull).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(degradedShip.hull).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);
          expect(degradedShip.engine).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(degradedShip.engine).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);
          expect(degradedShip.lifeSupport).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(degradedShip.lifeSupport).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp all condition values to [0, 100] range in updateShipCondition', () => {
    // Create a minimal game state manager for testing
    const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
    const wormholeData = [];
    const gameStateManager = new GameStateManager(starData, wormholeData);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        // Generate condition values that may be outside valid range
        fc.integer({ min: -100, max: 200 }),
        fc.integer({ min: -100, max: 200 }),
        fc.integer({ min: -100, max: 200 }),
        (hull, engine, lifeSupport) => {
          // Update ship condition with potentially invalid values
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Get the updated condition
          const condition = gameStateManager.getShipCondition();

          // Verify all values are clamped to [0, 100]
          expect(condition.hull).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(condition.hull).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);
          expect(condition.engine).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(condition.engine).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);
          expect(condition.lifeSupport).toBeGreaterThanOrEqual(SHIP_CONDITION_BOUNDS.MIN);
          expect(condition.lifeSupport).toBeLessThanOrEqual(SHIP_CONDITION_BOUNDS.MAX);

          // Verify clamping behavior
          if (hull < SHIP_CONDITION_BOUNDS.MIN) {
            expect(condition.hull).toBe(SHIP_CONDITION_BOUNDS.MIN);
          } else if (hull > SHIP_CONDITION_BOUNDS.MAX) {
            expect(condition.hull).toBe(SHIP_CONDITION_BOUNDS.MAX);
          } else {
            expect(condition.hull).toBe(hull);
          }

          if (engine < SHIP_CONDITION_BOUNDS.MIN) {
            expect(condition.engine).toBe(SHIP_CONDITION_BOUNDS.MIN);
          } else if (engine > SHIP_CONDITION_BOUNDS.MAX) {
            expect(condition.engine).toBe(SHIP_CONDITION_BOUNDS.MAX);
          } else {
            expect(condition.engine).toBe(engine);
          }

          if (lifeSupport < SHIP_CONDITION_BOUNDS.MIN) {
            expect(condition.lifeSupport).toBe(SHIP_CONDITION_BOUNDS.MIN);
          } else if (lifeSupport > SHIP_CONDITION_BOUNDS.MAX) {
            expect(condition.lifeSupport).toBe(SHIP_CONDITION_BOUNDS.MAX);
          } else {
            expect(condition.lifeSupport).toBe(lifeSupport);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never allow negative condition values', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({ min: 0, max: 5 }), // Low values that will go negative
          engine: fc.integer({ min: 0, max: 5 }),
          lifeSupport: fc.integer({ min: 0, max: 5 }),
        }),
        fc.integer({ min: 5, max: 20 }), // Large jump duration
        (ship, jumpDays) => {
          const degradedShip = NavigationSystem.applyJumpDegradation(ship, jumpDays);

          // Verify no negative values
          expect(degradedShip.hull).toBeGreaterThanOrEqual(0);
          expect(degradedShip.engine).toBeGreaterThanOrEqual(0);
          expect(degradedShip.lifeSupport).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never allow condition values above 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({ min: 95, max: 100 }), // High values
          engine: fc.integer({ min: 95, max: 100 }),
          lifeSupport: fc.integer({ min: 95, max: 100 }),
        }),
        fc.integer({ min: 1, max: 3 }), // Small degradation
        (ship, jumpDays) => {
          const degradedShip = NavigationSystem.applyJumpDegradation(ship, jumpDays);

          // Verify no values above 100
          expect(degradedShip.hull).toBeLessThanOrEqual(100);
          expect(degradedShip.engine).toBeLessThanOrEqual(100);
          expect(degradedShip.lifeSupport).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
