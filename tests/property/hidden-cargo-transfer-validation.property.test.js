'use strict';

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { COMMODITY_TYPES } from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property Test: Hidden Cargo Transfer Validation
 *
 * Feature: ship-personality, Property 12: Hidden Cargo Transfer Validation
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * For any cargo transfer to hidden compartment, the operation should fail if:
 * - Smuggler's Panels is not installed
 * - The cargo doesn't exist
 * - Quantity is insufficient
 * - Hidden cargo capacity would be exceeded
 *
 * For any cargo transfer to regular compartment, the operation should fail if:
 * - The cargo doesn't exist in hidden compartment
 * - Quantity is insufficient
 * - Regular cargo capacity would be exceeded
 */
describe('Property Test: Hidden Cargo Transfer Validation', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it("should reject moveToHiddenCargo without Smuggler's Panels", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        (goodType, qty) => {
          // Ensure Smuggler's Panels is NOT installed
          gameStateManager.state.ship.upgrades =
            gameStateManager.state.ship.upgrades.filter(
              (id) => id !== 'smuggler_panels'
            );

          // Add some cargo
          gameStateManager.state.ship.cargo = [
            {
              good: goodType,
              qty: qty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Attempt to move to hidden cargo should fail
          const result = gameStateManager.moveToHiddenCargo(goodType, qty);

          return (
            result.success === false &&
            result.reason === 'No hidden cargo compartment'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToHiddenCargo when cargo not found', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        (goodType, qty) => {
          // Install Smuggler's Panels
          if (
            !gameStateManager.state.ship.upgrades.includes('smuggler_panels')
          ) {
            gameStateManager.state.ship.upgrades.push('smuggler_panels');
            gameStateManager.state.ship.hiddenCargoCapacity = 10;
          }

          // Ensure cargo is empty
          gameStateManager.state.ship.cargo = [];

          // Attempt to move non-existent cargo should fail
          const result = gameStateManager.moveToHiddenCargo(goodType, qty);

          return (
            result.success === false && result.reason === 'Cargo not found'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToHiddenCargo when quantity insufficient', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (goodType, availableQty, requestedQty) => {
          // Only test when requested > available
          if (requestedQty <= availableQty) return true;

          // Install Smuggler's Panels
          if (
            !gameStateManager.state.ship.upgrades.includes('smuggler_panels')
          ) {
            gameStateManager.state.ship.upgrades.push('smuggler_panels');
            gameStateManager.state.ship.hiddenCargoCapacity = 10;
          }

          // Add cargo with limited quantity
          gameStateManager.state.ship.cargo = [
            {
              good: goodType,
              qty: availableQty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Attempt to move more than available should fail
          const result = gameStateManager.moveToHiddenCargo(
            goodType,
            requestedQty
          );

          return (
            result.success === false &&
            result.reason === 'Insufficient quantity'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToHiddenCargo when hidden cargo full', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (goodType, hiddenUsed, requestedQty) => {
          const hiddenCapacity = 10;

          // Only test when transfer would exceed capacity
          if (hiddenUsed + requestedQty <= hiddenCapacity) return true;

          // Install Smuggler's Panels
          if (
            !gameStateManager.state.ship.upgrades.includes('smuggler_panels')
          ) {
            gameStateManager.state.ship.upgrades.push('smuggler_panels');
            gameStateManager.state.ship.hiddenCargoCapacity = hiddenCapacity;
          }

          // Fill hidden cargo to specified amount
          gameStateManager.state.ship.hiddenCargo = [
            {
              good: 'grain',
              qty: hiddenUsed,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Add cargo to transfer
          gameStateManager.state.ship.cargo = [
            {
              good: goodType,
              qty: requestedQty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Attempt to move should fail
          const result = gameStateManager.moveToHiddenCargo(
            goodType,
            requestedQty
          );

          const hiddenAvailable = hiddenCapacity - hiddenUsed;
          return (
            result.success === false &&
            result.reason ===
              `Hidden cargo full (${hiddenAvailable} units available)`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should successfully move cargo to hidden compartment when valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 10 }),
        (goodType, qty) => {
          // Install Smuggler's Panels
          if (
            !gameStateManager.state.ship.upgrades.includes('smuggler_panels')
          ) {
            gameStateManager.state.ship.upgrades.push('smuggler_panels');
            gameStateManager.state.ship.hiddenCargoCapacity = 10;
          }

          // Add cargo
          gameStateManager.state.ship.cargo = [
            {
              good: goodType,
              qty: qty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Clear hidden cargo
          gameStateManager.state.ship.hiddenCargo = [];

          // Move should succeed
          const result = gameStateManager.moveToHiddenCargo(goodType, qty);

          // Verify success
          if (!result.success) return false;

          // Verify cargo was moved
          const regularCargoQty = gameStateManager.state.ship.cargo.reduce(
            (sum, c) => (c.good === goodType ? sum + c.qty : sum),
            0
          );
          const hiddenCargoQty = gameStateManager.state.ship.hiddenCargo.reduce(
            (sum, c) => (c.good === goodType ? sum + c.qty : sum),
            0
          );

          return regularCargoQty === 0 && hiddenCargoQty === qty;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToRegularCargo when cargo not found in hidden compartment', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        (goodType, qty) => {
          // Ensure hidden cargo is empty
          gameStateManager.state.ship.hiddenCargo = [];

          // Attempt to move non-existent hidden cargo should fail
          const result = gameStateManager.moveToRegularCargo(goodType, qty);

          return (
            result.success === false &&
            result.reason === 'Cargo not found in hidden compartment'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToRegularCargo when quantity insufficient', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (goodType, availableQty, requestedQty) => {
          // Only test when requested > available
          if (requestedQty <= availableQty) return true;

          // Add hidden cargo with limited quantity
          gameStateManager.state.ship.hiddenCargo = [
            {
              good: goodType,
              qty: availableQty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Attempt to move more than available should fail
          const result = gameStateManager.moveToRegularCargo(
            goodType,
            requestedQty
          );

          return (
            result.success === false &&
            result.reason === 'Insufficient quantity'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject moveToRegularCargo when regular cargo full', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (goodType, cargoUsed, requestedQty) => {
          const cargoCapacity = 50;

          // Only test when transfer would exceed capacity
          if (cargoUsed + requestedQty <= cargoCapacity) return true;

          // Fill regular cargo to specified amount
          gameStateManager.state.ship.cargo = [
            {
              good: 'grain',
              qty: cargoUsed,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Add hidden cargo to transfer
          gameStateManager.state.ship.hiddenCargo = [
            {
              good: goodType,
              qty: requestedQty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Attempt to move should fail
          const result = gameStateManager.moveToRegularCargo(
            goodType,
            requestedQty
          );

          const cargoAvailable = cargoCapacity - cargoUsed;
          return (
            result.success === false &&
            result.reason ===
              `Cargo hold full (${cargoAvailable} units available)`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should successfully move cargo to regular compartment when valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 10 }),
        (goodType, qty) => {
          // Add hidden cargo
          gameStateManager.state.ship.hiddenCargo = [
            {
              good: goodType,
              qty: qty,
              buyPrice: 10,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          // Clear regular cargo
          gameStateManager.state.ship.cargo = [];

          // Move should succeed
          const result = gameStateManager.moveToRegularCargo(goodType, qty);

          // Verify success
          if (!result.success) return false;

          // Verify cargo was moved
          const regularCargoQty = gameStateManager.state.ship.cargo.reduce(
            (sum, c) => (c.good === goodType ? sum + c.qty : sum),
            0
          );
          const hiddenCargoQty = gameStateManager.state.ship.hiddenCargo.reduce(
            (sum, c) => (c.good === goodType ? sum + c.qty : sum),
            0
          );

          return regularCargoQty === qty && hiddenCargoQty === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve purchase metadata when moving cargo', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (goodType, qty, buyPrice, buyDate) => {
          // Install Smuggler's Panels
          if (
            !gameStateManager.state.ship.upgrades.includes('smuggler_panels')
          ) {
            gameStateManager.state.ship.upgrades.push('smuggler_panels');
            gameStateManager.state.ship.hiddenCargoCapacity = 10;
          }

          const originalMetadata = {
            good: goodType,
            qty: qty,
            buyPrice: buyPrice,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: buyDate,
          };

          // Add cargo with metadata
          gameStateManager.state.ship.cargo = [{ ...originalMetadata }];
          gameStateManager.state.ship.hiddenCargo = [];

          // Move to hidden
          const result1 = gameStateManager.moveToHiddenCargo(goodType, qty);
          if (!result1.success) return false;

          // Verify metadata preserved in hidden cargo
          const hiddenStack = gameStateManager.state.ship.hiddenCargo.find(
            (c) => c.good === goodType
          );
          if (!hiddenStack) return false;
          if (hiddenStack.buyPrice !== buyPrice) return false;
          if (hiddenStack.buySystem !== 0) return false;
          if (hiddenStack.buySystemName !== 'Sol') return false;
          if (hiddenStack.buyDate !== buyDate) return false;

          // Move back to regular
          const result2 = gameStateManager.moveToRegularCargo(goodType, qty);
          if (!result2.success) return false;

          // Verify metadata preserved in regular cargo
          const regularStack = gameStateManager.state.ship.cargo.find(
            (c) => c.good === goodType
          );
          if (!regularStack) return false;
          if (regularStack.buyPrice !== buyPrice) return false;
          if (regularStack.buySystem !== 0) return false;
          if (regularStack.buySystemName !== 'Sol') return false;
          if (regularStack.buyDate !== buyDate) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
