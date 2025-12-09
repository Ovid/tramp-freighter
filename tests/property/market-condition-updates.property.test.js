'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { COMMODITY_TYPES } from '../../js/game-constants.js';

/**
 * Feature: deterministic-economy, Property 11: Trading updates market conditions bidirectionally
 * Validates: Requirements 4.1, 4.2
 *
 * Property: For any commodity and quantity, selling should increase surplus by that quantity,
 * and buying should decrease surplus by that quantity (creating deficit)
 */
describe('Property: Trading updates market conditions bidirectionally', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should increase surplus when selling goods', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantity, price) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Clear initial cargo to start with clean market conditions
          gameStateManager.updateCargo([]);
          gameStateManager.updateCredits(10000); // Give enough credits

          // Get initial market condition (should be 0 after clearing cargo)
          const initialCondition =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ] || 0;

          // Buy goods first so we have something to sell
          const buyResult = gameStateManager.buyGood(goodType, quantity, price);
          if (!buyResult.success) {
            // Skip if we can't afford or don't have space
            return true;
          }

          // Get market condition after buying (should be negative)
          const afterBuyCondition =
            gameStateManager.state.world.marketConditions[systemId][goodType];

          // Verify buying created deficit
          expect(afterBuyCondition).toBe(initialCondition - quantity);

          // Now sell the goods
          const sellResult = gameStateManager.sellGood(0, quantity, price);
          expect(sellResult.success).toBe(true);

          // Get market condition after selling
          const afterSellCondition =
            gameStateManager.state.world.marketConditions[systemId][goodType];

          // Verify selling increased surplus by quantity
          // After buy: -quantity, after sell: -quantity + quantity = 0
          expect(afterSellCondition).toBe(afterBuyCondition + quantity);
          expect(afterSellCondition).toBe(initialCondition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should decrease surplus (create deficit) when buying goods', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantity, price) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Get initial market condition (should be 0 or undefined)
          const initialCondition =
            gameStateManager.state.world.marketConditions[systemId]?.[
              goodType
            ] || 0;

          // Buy goods
          const buyResult = gameStateManager.buyGood(goodType, quantity, price);
          if (!buyResult.success) {
            // Skip if we can't afford or don't have space
            return true;
          }

          // Get market condition after buying
          const afterBuyCondition =
            gameStateManager.state.world.marketConditions[systemId][goodType];

          // Verify buying decreased surplus (created deficit)
          expect(afterBuyCondition).toBe(initialCondition - quantity);
          expect(afterBuyCondition).toBeLessThan(initialCondition);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accumulate market conditions across multiple trades', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.array(fc.integer({ min: 1, max: 10 }), {
          minLength: 2,
          maxLength: 5,
        }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantities, price) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          let expectedCondition = 0;

          // Perform multiple buy operations
          for (const quantity of quantities) {
            const buyResult = gameStateManager.buyGood(
              goodType,
              quantity,
              price
            );
            if (!buyResult.success) {
              // Stop if we run out of credits or space
              break;
            }

            expectedCondition -= quantity;

            const actualCondition =
              gameStateManager.state.world.marketConditions[systemId][goodType];

            expect(actualCondition).toBe(expectedCondition);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track market conditions independently per system', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 10, max: 100 }),
        (goodType, quantity, price) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const system1Id = gameStateManager.state.player.currentSystem;

          // Buy at system 1
          const buyResult = gameStateManager.buyGood(goodType, quantity, price);
          if (!buyResult.success) {
            return true;
          }

          const system1Condition =
            gameStateManager.state.world.marketConditions[system1Id][goodType];

          // Move to a different system (simulate by changing location)
          const system2Id = system1Id + 1;
          gameStateManager.updateLocation(system2Id);

          // Check that system 2 has no market condition for this good
          const system2Condition =
            gameStateManager.state.world.marketConditions[system2Id]?.[
              goodType
            ] || 0;

          // Verify systems have independent market conditions
          expect(system1Condition).toBe(-quantity);
          expect(system2Condition).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track market conditions independently per commodity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 10, max: 100 }),
        (quantity, price) => {
          // Reset to fresh state
          gameStateManager.initNewGame();

          const systemId = gameStateManager.state.player.currentSystem;

          // Buy two different commodities
          const good1 = 'grain';
          const good2 = 'ore';

          const buy1Result = gameStateManager.buyGood(good1, quantity, price);
          if (!buy1Result.success) {
            return true;
          }

          const buy2Result = gameStateManager.buyGood(good2, quantity, price);
          if (!buy2Result.success) {
            return true;
          }

          const good1Condition =
            gameStateManager.state.world.marketConditions[systemId][good1];
          const good2Condition =
            gameStateManager.state.world.marketConditions[systemId][good2];

          // Verify commodities have independent market conditions
          expect(good1Condition).toBe(-quantity);
          expect(good2Condition).toBe(-quantity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
