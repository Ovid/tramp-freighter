/**
 * Property-based tests for encounter probability modifiers
 *
 * Feature: danger-system, Property 3: Encounter Probability Modifiers
 * Validates: Requirements 2.7, 2.8, 2.9, 2.10, 8.8
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DANGER_CONFIG } from '../../src/game/constants.js';

describe('Encounter Probability Modifiers Properties', () => {
  it('should apply cargo value modifiers correctly', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 0, max: 20000 }), // Cargo value range
        (systemId, cargoValue) => {
          // Set up game state with specific cargo value
          const gameState = game.getState();

          // Create cargo that totals to the specified value
          gameState.ship.cargo = [];
          if (cargoValue > 0) {
            // Add cargo worth the specified value (using grain at base price 10)
            const quantity = Math.floor(cargoValue / 10);
            if (quantity > 0) {
              gameState.ship.cargo.push({
                good: 'grain',
                qty: quantity,
                buyPrice: 10,
                buySystem: 0,
              });
            }
          }

          const actualCargoValue = gameState.ship.cargo.reduce(
            (sum, item) => sum + (item.qty || 0) * (item.buyPrice || 0),
            0
          );
          const baseRate = game.calculatePirateEncounterChance(
            systemId,
            gameState
          );
          const zone = game.getDangerZone(systemId);
          const expectedBaseRate = DANGER_CONFIG.ZONES[zone].pirateChance;

          // Test cargo value modifiers (Requirements 2.7, 2.8)
          if (
            actualCargoValue >=
            DANGER_CONFIG.CARGO_VALUE_MODIFIERS.HIGH_VALUE_THRESHOLD
          ) {
            // Should be multiplied by 1.5x for cargo > ₡10,000
            expect(baseRate).toBeCloseTo(
              expectedBaseRate *
                DANGER_CONFIG.CARGO_VALUE_MODIFIERS.HIGH_VALUE_MULTIPLIER,
              5
            );
          } else if (
            actualCargoValue >=
            DANGER_CONFIG.CARGO_VALUE_MODIFIERS.LOW_VALUE_THRESHOLD
          ) {
            // Should be multiplied by 1.2x for cargo > ₡5,000
            expect(baseRate).toBeCloseTo(
              expectedBaseRate *
                DANGER_CONFIG.CARGO_VALUE_MODIFIERS.LOW_VALUE_MULTIPLIER,
              5
            );
          } else {
            // Should be base rate for cargo < ₡5,000
            expect(baseRate).toBeCloseTo(expectedBaseRate, 5);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply engine condition modifier correctly', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 0, max: 100 }), // Engine condition percentage
        (systemId, engineCondition) => {
          // Set up game state with specific engine condition
          const gameState = game.getState();
          gameState.ship.engine = engineCondition;
          gameState.ship.cargo = []; // No cargo to isolate engine modifier

          const baseRate = game.calculatePirateEncounterChance(
            systemId,
            gameState
          );
          const zone = game.getDangerZone(systemId);
          const expectedBaseRate = DANGER_CONFIG.ZONES[zone].pirateChance;

          // Test engine condition modifier (Requirement 2.9)
          if (
            engineCondition <
            DANGER_CONFIG.ENGINE_CONDITION_MODIFIER.POOR_CONDITION_THRESHOLD
          ) {
            // Should be multiplied by 1.1x for engine < 50%
            expect(baseRate).toBeCloseTo(
              expectedBaseRate *
                DANGER_CONFIG.ENGINE_CONDITION_MODIFIER
                  .POOR_CONDITION_MULTIPLIER,
              5
            );
          } else {
            // Should be base rate for engine >= 50%
            expect(baseRate).toBeCloseTo(expectedBaseRate, 5);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply advanced sensors modifier correctly', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.boolean(), // Has advanced sensors or not
        (systemId, hasAdvancedSensors) => {
          // Set up game state with or without advanced sensors
          const gameState = game.getState();
          gameState.ship.cargo = []; // No cargo to isolate sensors modifier
          gameState.ship.engine = 100; // Perfect engine to isolate sensors modifier

          if (hasAdvancedSensors) {
            gameState.ship.upgrades = ['advanced_sensors'];
          } else {
            gameState.ship.upgrades = [];
          }

          const baseRate = game.calculatePirateEncounterChance(
            systemId,
            gameState
          );
          const zone = game.getDangerZone(systemId);
          const expectedBaseRate = DANGER_CONFIG.ZONES[zone].pirateChance;

          // Test advanced sensors modifier (Requirement 2.10)
          if (hasAdvancedSensors) {
            // Should be multiplied by 0.8x with advanced sensors
            expect(baseRate).toBeCloseTo(
              expectedBaseRate *
                DANGER_CONFIG.ADVANCED_SENSORS_PIRATE_REDUCTION,
              5
            );
          } else {
            // Should be base rate without advanced sensors
            expect(baseRate).toBeCloseTo(expectedBaseRate, 5);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply faction reputation modifiers correctly', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: -100, max: 100 }), // Outlaw reputation
        fc.integer({ min: -100, max: 100 }), // Authority reputation
        (systemId, outlawRep, authorityRep) => {
          // Set up game state with specific faction reputations
          const gameState = game.getState();
          gameState.player.factions.outlaws = outlawRep;
          gameState.player.factions.authorities = authorityRep;
          gameState.ship.cargo = []; // No cargo to isolate faction modifiers
          gameState.ship.engine = 100; // Perfect engine to isolate faction modifiers
          gameState.ship.upgrades = []; // No upgrades to isolate faction modifiers

          const baseRate = game.calculatePirateEncounterChance(
            systemId,
            gameState
          );
          const zone = game.getDangerZone(systemId);
          const expectedBaseRate = DANGER_CONFIG.ZONES[zone].pirateChance;

          // Calculate expected modifiers (Requirement 8.8)
          const outlawModifier =
            1 +
            (outlawRep / 100) *
              DANGER_CONFIG.FACTION_REPUTATION_SCALES
                .OUTLAW_PIRATE_REDUCTION_SCALE;
          const authorityModifier =
            1 +
            (authorityRep / 100) *
              DANGER_CONFIG.FACTION_REPUTATION_SCALES
                .AUTHORITY_PIRATE_INCREASE_SCALE;

          const expectedRate = Math.max(
            0,
            Math.min(1, expectedBaseRate * outlawModifier * authorityModifier)
          );

          expect(baseRate).toBeCloseTo(expectedRate, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp final probability to [0, 1] range', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 0, max: 50000 }), // Large cargo value
        fc.integer({ min: 0, max: 100 }), // Engine condition
        fc.integer({ min: -100, max: 100 }), // Outlaw reputation
        fc.integer({ min: -100, max: 100 }), // Authority reputation
        (systemId, cargoValue, engineCondition, outlawRep, authorityRep) => {
          // Set up game state with extreme values that might push probability outside [0,1]
          const gameState = game.getState();
          gameState.player.factions.outlaws = outlawRep;
          gameState.player.factions.authorities = authorityRep;
          gameState.ship.engine = engineCondition;

          // Create high-value cargo
          gameState.ship.cargo = [];
          if (cargoValue > 0) {
            const quantity = Math.floor(cargoValue / 10);
            if (quantity > 0) {
              gameState.ship.cargo.push({
                good: 'grain',
                qty: quantity,
                buyPrice: 10,
                buySystem: 0,
              });
            }
          }

          const probability = game.calculatePirateEncounterChance(
            systemId,
            gameState
          );

          // Probability must always be clamped to [0, 1]
          expect(probability).toBeGreaterThanOrEqual(0);
          expect(probability).toBeLessThanOrEqual(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
