'use strict';

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { REPAIR_COST_PER_PERCENT } from '../../js/game-constants.js';

/**
 * Feature: dynamic-economy, Property 24: Repair Transaction Execution
 * Validates: Requirements 7.5
 *
 * For any valid repair transaction with amount A and cost C for system S,
 * the player's credits should decrease by C and the condition value for S
 * should increase by A.
 */
describe('Property 24: Repair Transaction Execution', () => {
  it('should deduct credits and increase condition for valid repair transactions', () => {
    fc.assert(
      fc.property(
        // Generate system type
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        // Generate current condition (not at max)
        fc.integer({ min: 10, max: 90 }),
        // Generate repair amount (valid range)
        fc.integer({ min: 1, max: 10 }),
        // Generate sufficient credits
        fc.integer({ min: 100, max: 1000 }),
        (systemType, currentCondition, repairAmount, initialCredits) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up initial state
          gameStateManager.updateCredits(initialCredits);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : 100,
            systemType === 'engine' ? currentCondition : 100,
            systemType === 'lifeSupport' ? currentCondition : 100
          );

          // Calculate expected cost
          const expectedCost = repairAmount * REPAIR_COST_PER_PERCENT;

          // Execute repair
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify transaction succeeded
          expect(result.success).toBe(true);

          // Verify credits decreased by cost
          const finalCredits = gameStateManager.getPlayer().credits;
          expect(finalCredits).toBe(initialCredits - expectedCost);

          // Verify condition increased by amount
          const finalCondition = gameStateManager.getShipCondition();
          expect(finalCondition[systemType]).toBe(currentCondition + repairAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle repairs that bring system to exactly 100%', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 50, max: 99 }),
        (systemType, currentCondition) => {
          // Create game state manager
          const starData = [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 }];
          const wormholeData = [];
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set up initial state with sufficient credits
          const repairAmount = 100 - currentCondition;
          const requiredCredits = repairAmount * REPAIR_COST_PER_PERCENT;
          gameStateManager.updateCredits(requiredCredits + 100);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : 100,
            systemType === 'engine' ? currentCondition : 100,
            systemType === 'lifeSupport' ? currentCondition : 100
          );

          const initialCredits = gameStateManager.getPlayer().credits;

          // Execute repair to full
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify transaction succeeded
          expect(result.success).toBe(true);

          // Verify condition is exactly 100
          const finalCondition = gameStateManager.getShipCondition();
          expect(finalCondition[systemType]).toBe(100);

          // Verify credits decreased correctly
          const finalCredits = gameStateManager.getPlayer().credits;
          expect(finalCredits).toBe(initialCredits - requiredCredits);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate cost at ₡5 per 1%', () => {
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

          // Set up initial state
          const currentCondition = 50;
          const expectedCost = repairAmount * REPAIR_COST_PER_PERCENT;
          gameStateManager.updateCredits(expectedCost + 100);
          gameStateManager.updateShipCondition(
            systemType === 'hull' ? currentCondition : 100,
            systemType === 'engine' ? currentCondition : 100,
            systemType === 'lifeSupport' ? currentCondition : 100
          );

          const initialCredits = gameStateManager.getPlayer().credits;

          // Execute repair
          const result = gameStateManager.repairShipSystem(systemType, repairAmount);

          // Verify transaction succeeded
          expect(result.success).toBe(true);

          // Verify exact cost deduction
          const finalCredits = gameStateManager.getPlayer().credits;
          const actualCost = initialCredits - finalCredits;
          expect(actualCost).toBe(expectedCost);
          expect(actualCost).toBe(repairAmount * 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
