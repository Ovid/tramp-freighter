/**
 * Property-based tests for inspection resolution outcomes
 *
 * Feature: danger-system, Property 7: Inspection Outcomes
 * Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11, 11.8
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  INSPECTION_CONFIG,
  COMMODITY_TYPES,
} from '../../src/game/constants.js';

/**
 * Create test game state with specified overrides
 *
 * @param {Object} baseState - Base game state from GameStateManager
 * @param {Object} overrides - Properties to override
 * @returns {Object} Modified game state for testing
 */
function createTestGameState(baseState, overrides = {}) {
  return {
    ...baseState,
    ship: {
      ...baseState.ship,
      cargo: [], // Default to empty cargo
      hiddenCargo: [], // Default to empty hidden cargo
      ...overrides.ship,
    },
    player: {
      ...baseState.player,
      credits: 10000, // Default to sufficient credits
      factions: {
        authorities: 0, // Default to neutral reputation
        traders: 0,
        outlaws: 0,
        civilians: 0,
        ...overrides.player?.factions,
      },
      ...overrides.player,
    },
    ...overrides,
  };
}

describe('Inspection Resolution Outcomes Properties', () => {
  it('should handle cooperate choice correctly with restricted goods', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Number of restricted goods
        fc.float({ min: 0, max: 1 }), // Random number for outcome
        (restrictedGoodsCount, rng) => {
          const gameState = gameStateManager.getState();

          // Create cargo with restricted goods
          const cargo = [];
          for (let i = 0; i < restrictedGoodsCount; i++) {
            cargo.push({
              type: COMMODITY_TYPES[i % COMMODITY_TYPES.length],
              quantity: 1,
              purchasePrice: 10,
            });
          }

          const testGameState = createTestGameState(gameState, {
            ship: { cargo },
          });

          const outcome = gameStateManager.resolveInspection(
            'cooperate',
            testGameState,
            rng
          );

          // Should confiscate restricted goods and impose fine (Requirement 5.4)
          expect(outcome).toHaveProperty('success', true);
          expect(outcome.costs).toHaveProperty(
            'credits',
            INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE
          );
          expect(outcome.costs).toHaveProperty(
            'restrictedGoodsConfiscated',
            true
          );

          // Authority rep should be cooperation bonus + restricted goods penalty
          const expectedAuthorityRep =
            INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN +
            INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
          expect(outcome.rewards.factionRep).toHaveProperty(
            'authorities',
            expectedAuthorityRep
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle hidden cargo discovery correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }), // System ID
        fc.integer({ min: 1, max: 3 }), // Number of hidden cargo items
        fc.float({ min: 0, max: 1 }), // Random number for discovery
        (systemId, hiddenCargoCount, rng) => {
          const gameState = gameStateManager.getState();
          const zone = gameStateManager.getDangerZone(systemId);

          // Create hidden cargo
          const hiddenCargo = [];
          for (let i = 0; i < hiddenCargoCount; i++) {
            hiddenCargo.push({
              type: COMMODITY_TYPES[i % COMMODITY_TYPES.length],
              quantity: 1,
              purchasePrice: 10,
            });
          }

          const testGameState = createTestGameState(gameState, {
            ship: { hiddenCargo },
            player: { currentSystem: systemId }, // Set current system for security level calculation
          });

          const outcome = gameStateManager.resolveInspection(
            'cooperate',
            testGameState,
            rng
          );

          // Calculate expected discovery chance based on security level (same logic as implementation)
          let securityMultiplier;
          if (systemId === 0 || systemId === 1) {
            // Core systems (0, 1) should use core multiplier regardless of zone
            securityMultiplier =
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
          } else {
            // Other systems use zone-based multiplier
            securityMultiplier =
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
          }

          const discoveryChance =
            INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE *
            securityMultiplier;

          if (rng < discoveryChance) {
            // Hidden cargo should be discovered (Requirement 5.5, 11.8)
            expect(outcome.costs).toHaveProperty(
              'credits',
              INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE
            );
            expect(outcome.costs).toHaveProperty(
              'hiddenCargoConfiscated',
              true
            );
            expect(outcome.rewards.factionRep).toHaveProperty(
              'authorities',
              INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO
            );
            expect(outcome.rewards.factionRep).toHaveProperty(
              'outlaws',
              INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS
            );
          } else {
            // Hidden cargo should remain undiscovered
            expect(outcome.costs).not.toHaveProperty('hiddenCargoConfiscated');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle bribery choice correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }), // Random number for bribery success
        (rng) => {
          const gameState = gameStateManager.getState();
          const testGameState = createTestGameState(gameState);

          const outcome = gameStateManager.resolveInspection(
            'bribe',
            testGameState,
            rng
          );

          // Should always cost bribery attempt amount (Requirement 5.6)
          expect(outcome.costs).toHaveProperty('credits', expect.any(Number));
          expect(outcome.costs.credits).toBeGreaterThanOrEqual(
            INSPECTION_CONFIG.BRIBE.COST
          );

          // Should apply authority reputation penalty for attempting bribe (Requirement 5.6)
          expect(outcome.rewards.factionRep).toHaveProperty(
            'authorities',
            INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY
          );

          if (rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE) {
            // Bribery succeeds (Requirement 5.7)
            expect(outcome).toHaveProperty('success', true);
            expect(outcome.costs.credits).toBe(INSPECTION_CONFIG.BRIBE.COST);
          } else {
            // Bribery fails (Requirement 5.8)
            expect(outcome).toHaveProperty('success', false);
            expect(outcome.costs.credits).toBe(
              INSPECTION_CONFIG.BRIBE.COST +
                INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle flee choice correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }), // Random number (not used for flee outcome)
        (rng) => {
          const gameState = gameStateManager.getState();
          const testGameState = createTestGameState(gameState);

          const outcome = gameStateManager.resolveInspection(
            'flee',
            testGameState,
            rng
          );

          // Should trigger patrol combat encounter (Requirement 5.9)
          expect(outcome).toHaveProperty('triggerPatrolCombat', true);

          // Should apply authority reputation penalty for fleeing (Requirement 5.9)
          expect(outcome.rewards.factionRep).toHaveProperty(
            'authorities',
            INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply security level scaling for hidden cargo discovery', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }), // System ID
        fc.float({ min: 0, max: 1 }), // Random number for discovery
        (systemId, rng) => {
          const gameState = gameStateManager.getState();
          const zone = gameStateManager.getDangerZone(systemId);

          // Create hidden cargo
          const hiddenCargo = [
            {
              type: COMMODITY_TYPES[0],
              quantity: 1,
              purchasePrice: 10,
            },
          ];

          const testGameState = createTestGameState(gameState, {
            ship: { hiddenCargo },
            player: { currentSystem: systemId }, // Set current system for security level calculation
          });

          const outcome = gameStateManager.resolveInspection(
            'cooperate',
            testGameState,
            rng
          );

          // Calculate expected discovery chance based on security level (Requirement 11.8)
          let securityMultiplier;
          if (systemId === 0 || systemId === 1) {
            // Core systems should use core multiplier (2x) regardless of zone
            securityMultiplier =
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
          } else {
            // Other systems use zone-based multiplier
            securityMultiplier =
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
          }

          const discoveryChance =
            INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE *
            securityMultiplier;

          // Verify security level scaling is applied correctly
          if (systemId === 0 || systemId === 1) {
            // Core systems should use core multiplier (2x)
            expect(securityMultiplier).toBe(
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core
            );
          } else if (zone === 'safe') {
            // Other safe systems should use safe multiplier (1.5x)
            expect(securityMultiplier).toBe(
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.safe
            );
          } else if (zone === 'contested') {
            // Contested systems should use contested multiplier (1x)
            expect(securityMultiplier).toBe(
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.contested
            );
          } else if (zone === 'dangerous') {
            // Dangerous systems should use dangerous multiplier (0.5x)
            expect(securityMultiplier).toBe(
              INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.dangerous
            );
          }

          // Discovery should match expected probability
          const shouldDiscover = rng < discoveryChance;
          const wasDiscovered = outcome.costs?.hiddenCargoConfiscated === true;
          expect(wasDiscovered).toBe(shouldDiscover);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply reputation penalties correctly for violations', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.boolean(), // Has restricted goods
        fc.boolean(), // Has hidden cargo
        fc.float({ min: 0, max: 1 }), // Random number
        (hasRestrictedGoods, hasHiddenCargo, rng) => {
          const gameState = gameStateManager.getState();

          const cargo = hasRestrictedGoods
            ? [{ type: COMMODITY_TYPES[0], quantity: 1, purchasePrice: 10 }]
            : [];
          const hiddenCargo = hasHiddenCargo
            ? [{ type: COMMODITY_TYPES[1], quantity: 1, purchasePrice: 10 }]
            : [];

          const testGameState = createTestGameState(gameState, {
            ship: { cargo, hiddenCargo },
          });

          const outcome = gameStateManager.resolveInspection(
            'cooperate',
            testGameState,
            rng
          );

          // Check reputation penalties are applied correctly
          if (hasRestrictedGoods) {
            // Should apply restricted goods penalty (Requirement 5.11)
            expect(outcome.rewards.factionRep.authorities).toBeLessThanOrEqual(
              INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN +
                INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS
            );
          }

          // Hidden cargo discovery depends on RNG and security level
          const zone = gameStateManager.getDangerZone(0); // Use system 0 for consistency
          const securityMultiplier =
            INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
          const discoveryChance =
            INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE *
            securityMultiplier;

          if (hasHiddenCargo && rng < discoveryChance) {
            // Should apply hidden cargo penalty and outlaw bonus (Requirement 5.11)
            expect(outcome.rewards.factionRep.authorities).toBe(
              INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO
            );
            expect(outcome.rewards.factionRep.outlaws).toBe(
              INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
