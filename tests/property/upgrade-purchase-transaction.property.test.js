'use strict';

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_UPGRADES } from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property Test: Upgrade Purchase Transaction
 *
 * Feature: ship-personality, Property 3: Upgrade Purchase Transaction
 * Validates: Requirements 2.4, 2.5
 *
 * For any valid upgrade purchase (sufficient credits, not already owned),
 * completing the transaction should decrease player credits by the upgrade
 * cost and add the upgrade to the ship's upgrades list.
 */
describe('Property Test: Upgrade Purchase Transaction', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should deduct credits and add upgrade for valid purchases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        (upgradeId, extraCredits) => {
          const upgrade = SHIP_UPGRADES[upgradeId];

          // Set credits to exactly enough or more
          const initialCredits = upgrade.cost + extraCredits;
          gameStateManager.state.player.credits = initialCredits;

          // Ensure upgrade not already installed
          gameStateManager.state.ship.upgrades =
            gameStateManager.state.ship.upgrades.filter(
              (id) => id !== upgradeId
            );

          // Purchase upgrade
          const result = gameStateManager.purchaseUpgrade(upgradeId);

          // Verify transaction
          const creditsDeducted =
            initialCredits - gameStateManager.state.player.credits ===
            upgrade.cost;
          const upgradeAdded =
            gameStateManager.state.ship.upgrades.includes(upgradeId);

          return result.success && creditsDeducted && upgradeAdded;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail for already installed upgrades', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_UPGRADES[upgradeId];

          // Set sufficient credits
          gameStateManager.state.player.credits = upgrade.cost * 2;

          // Install upgrade first
          gameStateManager.state.ship.upgrades.push(upgradeId);
          const initialCredits = gameStateManager.state.player.credits;

          // Try to purchase again
          const result = gameStateManager.purchaseUpgrade(upgradeId);

          // Should fail without deducting credits
          const creditsUnchanged =
            gameStateManager.state.player.credits === initialCredits;

          return !result.success && creditsUnchanged;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail for insufficient credits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_UPGRADES[upgradeId];

          // Set credits below cost
          gameStateManager.state.player.credits = upgrade.cost - 1;
          const initialCredits = gameStateManager.state.player.credits;

          // Ensure upgrade not already installed
          gameStateManager.state.ship.upgrades =
            gameStateManager.state.ship.upgrades.filter(
              (id) => id !== upgradeId
            );

          // Try to purchase
          const result = gameStateManager.purchaseUpgrade(upgradeId);

          // Should fail without deducting credits or adding upgrade
          const creditsUnchanged =
            gameStateManager.state.player.credits === initialCredits;
          const upgradeNotAdded =
            !gameStateManager.state.ship.upgrades.includes(upgradeId);

          return !result.success && creditsUnchanged && upgradeNotAdded;
        }
      ),
      { numRuns: 100 }
    );
  });
});
