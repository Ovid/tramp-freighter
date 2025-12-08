'use strict';

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { REPAIR_COST_PER_PERCENT, SHIP_CONDITION_BOUNDS } from '../../js/game-constants.js';

/**
 * Feature: dynamic-economy, Property 25: Repair Validation
 * Validates: Requirements 7.6, 7.7, 7.8
 *
 * For any repair attempt, the system should prevent the repair and display
 * a validation message if: the player has insufficient credits, OR the system
 * is already at 100% condition, OR the repair would exceed 100%.
 */
describe('Property 25: Repair Validation', () => {
  it('should prevent repair when player has insufficient credits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 10, max: 90 }),
        fc.integer({ min: 1, max: 20 }),
        (systemType, currentCondition, repairAmount) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up state with insufficient credits
          const requiredCredits = repairAmount * REPAIR_COST_PER_PERCENT;
          const insufficientCredits = Math.max(0, requiredCredits - 1);
          gameStateManager.updateCredits(insufficientCredits);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'engine' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'lifeSupport' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX
          );

          // Attempt repair
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify repair was prevented
          expect(result.success).toBe(false);
          expect(result.reason).toBe('Insufficient credits for repair');

          // Verify state unchanged
          expect(gameStateManager.getPlayer().credits).toBe(insufficientCredits);
          expect(gameStateManager.getShipCondition()[systemType]).toBe(currentCondition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent repair when system is already at 100%', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 1, max: 20 }),
        (systemType, repairAmount) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up state with system at 100%
          const initialCredits = 1000;
          gameStateManager.updateCredits(initialCredits);
          gameStateManager.updateShipCondition(
            SHIP_CONDITION_BOUNDS.MAX,
            SHIP_CONDITION_BOUNDS.MAX,
            SHIP_CONDITION_BOUNDS.MAX
          );

          // Attempt repair
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify repair was prevented
          expect(result.success).toBe(false);
          expect(result.reason).toBe('System already at maximum condition');

          // Verify state unchanged
          expect(gameStateManager.getPlayer().credits).toBe(initialCredits);
          expect(gameStateManager.getShipCondition()[systemType]).toBe(
            SHIP_CONDITION_BOUNDS.MAX
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent repair when it would exceed 100%', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 80, max: SHIP_CONDITION_BOUNDS.MAX - 1 }),
        fc.integer({ min: 2, max: 50 }),
        (systemType, currentCondition, repairAmount) => {
          // Only test cases where repair would exceed max
          fc.pre(currentCondition + repairAmount > SHIP_CONDITION_BOUNDS.MAX);

          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up state with sufficient credits
          const initialCredits = 1000;
          gameStateManager.updateCredits(initialCredits);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'engine' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'lifeSupport' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX
          );

          // Attempt repair that would exceed max
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify repair was prevented
          expect(result.success).toBe(false);
          expect(result.reason).toBe('Repair would exceed maximum condition');

          // Verify state unchanged
          expect(gameStateManager.getPlayer().credits).toBe(initialCredits);
          expect(gameStateManager.getShipCondition()[systemType]).toBe(currentCondition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent repair with zero or negative amount', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: -10, max: 0 }),
        (systemType, repairAmount) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up state
          const currentCondition = 50;
          const initialCredits = 1000;
          gameStateManager.updateCredits(initialCredits);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'engine' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'lifeSupport' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX
          );

          // Attempt repair with invalid amount
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify repair was prevented
          expect(result.success).toBe(false);
          expect(result.reason).toBe('Repair amount must be positive');

          // Verify state unchanged
          expect(gameStateManager.getPlayer().credits).toBe(initialCredits);
          expect(gameStateManager.getShipCondition()[systemType]).toBe(currentCondition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return cost of 0 when system is at 100%', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 1, max: 50 }),
        (systemType, repairAmount) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set system to max
          gameStateManager.updateShipCondition(
            SHIP_CONDITION_BOUNDS.MAX,
            SHIP_CONDITION_BOUNDS.MAX,
            SHIP_CONDITION_BOUNDS.MAX
          );

          // Get repair cost
          const cost = gameStateManager.getRepairCost(systemType, repairAmount, 100);

          // Verify cost is 0
          expect(cost).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all three validation conditions independently', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.record({
          currentCondition: fc.integer({ min: 10, max: 99 }),
          repairAmount: fc.integer({ min: 1, max: 20 }),
          credits: fc.integer({ min: 0, max: 100 }),
        }),
        (systemType, { currentCondition, repairAmount, credits }) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up state
          gameStateManager.updateCredits(credits);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'engine' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX,
            systemType === 'lifeSupport' ? currentCondition : SHIP_CONDITION_BOUNDS.MAX
          );

          const requiredCredits = repairAmount * REPAIR_COST_PER_PERCENT;
          const wouldExceed = currentCondition + repairAmount > 100;
          const hasCredits = credits >= requiredCredits;

          // Attempt repair
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify validation logic
          if (!hasCredits) {
            expect(result.success).toBe(false);
            expect(result.reason).toBe('Insufficient credits for repair');
          } else if (wouldExceed) {
            expect(result.success).toBe(false);
            expect(result.reason).toBe('Repair would exceed maximum condition');
          } else {
            expect(result.success).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
