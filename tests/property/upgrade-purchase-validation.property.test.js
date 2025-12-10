'use strict';

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_UPGRADES } from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property Test: Upgrade Purchase Validation
 *
 * Feature: ship-personality, Property 11: Upgrade Purchase Validation
 * Validates: Requirements 2.5, 8.5
 *
 * For any upgrade and game state, the validation should return invalid if:
 * - The upgrade is already purchased
 * - The player has insufficient credits
 */
describe('Property Test: Upgrade Purchase Validation', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should reject already purchased upgrades', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        (upgradeId) => {
          // Add upgrade to ship
          gameStateManager.state.ship.upgrades.push(upgradeId);

          // Validation should fail
          const result = gameStateManager.validateUpgradePurchase(upgradeId);

          return (
            result.valid === false &&
            result.reason === 'Upgrade already installed'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject purchases with insufficient credits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_UPGRADES[upgradeId];

          // Set credits below upgrade cost
          gameStateManager.state.player.credits = upgrade.cost - 1;

          // Ensure upgrade not already installed
          gameStateManager.state.ship.upgrades =
            gameStateManager.state.ship.upgrades.filter(
              (id) => id !== upgradeId
            );

          // Validation should fail
          const result = gameStateManager.validateUpgradePurchase(upgradeId);

          return (
            result.valid === false &&
            result.reason === `Insufficient credits (need ₡${upgrade.cost})`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid purchases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        (upgradeId, extraCredits) => {
          const upgrade = SHIP_UPGRADES[upgradeId];

          // Set credits to exactly enough or more
          gameStateManager.state.player.credits = upgrade.cost + extraCredits;

          // Ensure upgrade not already installed
          gameStateManager.state.ship.upgrades =
            gameStateManager.state.ship.upgrades.filter(
              (id) => id !== upgradeId
            );

          // Validation should succeed
          const result = gameStateManager.validateUpgradePurchase(upgradeId);

          return result.valid === true && result.reason === '';
        }
      ),
      { numRuns: 100 }
    );
  });
});
