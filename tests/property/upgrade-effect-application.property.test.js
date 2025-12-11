'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import {
  SHIP_UPGRADES,
  NEW_GAME_DEFAULTS,
  SHIP_CONDITION_BOUNDS,
} from '../../js/game-constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property Test: Upgrade Effect Application
 *
 * Feature: ship-personality, Property 4: Upgrade Effect Application
 * Validates: Requirements 2.6, 7.9
 *
 * For any ship with upgrades and any calculation that uses an attribute
 * affected by those upgrades, the result should reflect all upgrade effects
 * applied appropriately (absolute values for capacities, multipliers for rates).
 */
describe('Property Test: Upgrade Effect Application', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should apply capacity upgrades as absolute values', () => {
    fc.assert(
      fc.property(
        fc.subarray(Object.keys(SHIP_UPGRADES), { minLength: 1, maxLength: 7 }),
        (upgradeIds) => {
          // Install upgrades
          gameStateManager.state.ship.upgrades = upgradeIds;

          // Calculate capabilities
          const capabilities = gameStateManager.calculateShipCapabilities();

          // Verify capacity effects are absolute values
          let expectedFuelCapacity = SHIP_CONDITION_BOUNDS.MAX;
          let expectedCargoCapacity = NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY;
          let expectedHiddenCargoCapacity = 0;

          for (const upgradeId of upgradeIds) {
            const upgrade = SHIP_UPGRADES[upgradeId];
            if (upgrade.effects.fuelCapacity !== undefined) {
              expectedFuelCapacity = upgrade.effects.fuelCapacity;
            }
            if (upgrade.effects.cargoCapacity !== undefined) {
              expectedCargoCapacity = upgrade.effects.cargoCapacity;
            }
            if (upgrade.effects.hiddenCargoCapacity !== undefined) {
              expectedHiddenCargoCapacity = upgrade.effects.hiddenCargoCapacity;
            }
          }

          return (
            capabilities.fuelCapacity === expectedFuelCapacity &&
            capabilities.cargoCapacity === expectedCargoCapacity &&
            capabilities.hiddenCargoCapacity === expectedHiddenCargoCapacity
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply rate modifiers multiplicatively', () => {
    fc.assert(
      fc.property(
        fc.subarray(Object.keys(SHIP_UPGRADES), { minLength: 1, maxLength: 7 }),
        (upgradeIds) => {
          // Install upgrades
          gameStateManager.state.ship.upgrades = upgradeIds;

          // Calculate capabilities
          const capabilities = gameStateManager.calculateShipCapabilities();

          // Verify rate modifiers are multiplicative
          let expectedFuelConsumption = 1.0;
          let expectedHullDegradation = 1.0;
          let expectedLifeSupportDrain = 1.0;

          for (const upgradeId of upgradeIds) {
            const upgrade = SHIP_UPGRADES[upgradeId];
            if (upgrade.effects.fuelConsumption !== undefined) {
              expectedFuelConsumption *= upgrade.effects.fuelConsumption;
            }
            if (upgrade.effects.hullDegradation !== undefined) {
              expectedHullDegradation *= upgrade.effects.hullDegradation;
            }
            if (upgrade.effects.lifeSupportDrain !== undefined) {
              expectedLifeSupportDrain *= upgrade.effects.lifeSupportDrain;
            }
          }

          // Use small epsilon for floating point comparison
          const epsilon = 0.0001;
          return (
            Math.abs(capabilities.fuelConsumption - expectedFuelConsumption) <
              epsilon &&
            Math.abs(capabilities.hullDegradation - expectedHullDegradation) <
              epsilon &&
            Math.abs(capabilities.lifeSupportDrain - expectedLifeSupportDrain) <
              epsilon
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle no upgrades correctly', () => {
    // No upgrades installed
    gameStateManager.state.ship.upgrades = [];

    const capabilities = gameStateManager.calculateShipCapabilities();

    // Should return base values
    expect(capabilities.fuelCapacity).toBe(SHIP_CONDITION_BOUNDS.MAX);
    expect(capabilities.cargoCapacity).toBe(
      NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY
    );
    expect(capabilities.fuelConsumption).toBe(1.0);
    expect(capabilities.hullDegradation).toBe(1.0);
    expect(capabilities.lifeSupportDrain).toBe(1.0);
    expect(capabilities.hiddenCargoCapacity).toBe(0);
    expect(capabilities.eventVisibility).toBe(0);
  });

  it('should handle multiple upgrades affecting same attribute', () => {
    // Install both reinforced_hull and medical_bay (both reduce cargoCapacity)
    gameStateManager.state.ship.upgrades = ['reinforced_hull', 'medical_bay'];

    const capabilities = gameStateManager.calculateShipCapabilities();

    // Last upgrade wins for capacities (absolute values)
    // medical_bay sets cargoCapacity to 45
    expect(capabilities.cargoCapacity).toBe(45);

    // Both affect different rate modifiers
    expect(capabilities.hullDegradation).toBe(0.5); // reinforced_hull
    expect(capabilities.lifeSupportDrain).toBe(0.7); // medical_bay
  });
});
