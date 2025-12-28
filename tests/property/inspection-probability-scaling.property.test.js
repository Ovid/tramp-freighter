/**
 * Property-based tests for inspection probability scaling
 *
 * Feature: danger-system, Property 8: Inspection Probability Scaling
 * Validates: Requirements 5.2, 5.12, 8.8
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DANGER_CONFIG, COMMODITY_TYPES } from '../../src/game/constants.js';

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
      ...overrides.ship,
    },
    player: {
      ...baseState.player,
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

describe('Inspection Probability Scaling Properties', () => {
  it('should apply zone-specific base rates for inspection probability', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (systemId) => {
          const zone = gameStateManager.getDangerZone(systemId);
          const gameState = gameStateManager.getState();

          // Calculate inspection chance with no modifiers (empty cargo, neutral reputation)
          const baseGameState = createTestGameState(gameState);

          const inspectionChance = gameStateManager.calculateInspectionChance(
            systemId,
            baseGameState
          );

          // Should match zone-specific base rates (Requirement 5.2)
          const expectedBaseRate = DANGER_CONFIG.ZONES[zone].inspectionChance;

          // For non-core systems, should match base rate exactly
          if (systemId !== 0 && systemId !== 1) {
            expect(inspectionChance).toBeCloseTo(expectedBaseRate, 5);
          } else {
            // For core systems (0, 1), should be doubled (Requirement 5.12)
            expect(inspectionChance).toBeCloseTo(
              expectedBaseRate *
                DANGER_CONFIG.CORE_SYSTEMS_INSPECTION_MULTIPLIER,
              5
            );
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply restricted goods modifier correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 0, max: 5 }), // Number of restricted goods (0-5)
        (systemId, restrictedGoodsCount) => {
          const zone = gameStateManager.getDangerZone(systemId);
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
            ship: {
              cargo: cargo,
            },
          });

          const inspectionChance = gameStateManager.calculateInspectionChance(
            systemId,
            testGameState
          );

          // Calculate expected probability with restricted goods modifier (Requirement 5.2)
          const baseRate = DANGER_CONFIG.ZONES[zone].inspectionChance;
          const coreMultiplier =
            systemId === 0 || systemId === 1
              ? DANGER_CONFIG.CORE_SYSTEMS_INSPECTION_MULTIPLIER
              : 1.0;
          const restrictedModifier =
            1 +
            restrictedGoodsCount *
              DANGER_CONFIG.RESTRICTED_GOODS_INSPECTION_INCREASE;

          const expectedRate = baseRate * coreMultiplier * restrictedModifier;

          expect(inspectionChance).toBeCloseTo(expectedRate, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply core systems multiplier correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test core systems (Sol = 0, Alpha Centauri = 1)
    const coreSystems = [0, 1];

    for (const systemId of coreSystems) {
      const zone = gameStateManager.getDangerZone(systemId);
      const gameState = gameStateManager.getState();

      const baseGameState = createTestGameState(gameState);

      const inspectionChance = gameStateManager.calculateInspectionChance(
        systemId,
        baseGameState
      );

      // Should be doubled for core systems (Requirement 5.12)
      const expectedRate =
        DANGER_CONFIG.ZONES[zone].inspectionChance *
        DANGER_CONFIG.CORE_SYSTEMS_INSPECTION_MULTIPLIER;

      expect(inspectionChance).toBeCloseTo(expectedRate, 5);
    }
  });

  it('should apply faction reputation modifier correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: -100, max: 100 }), // Authority reputation
        (systemId, authorityRep) => {
          const zone = gameStateManager.getDangerZone(systemId);
          const gameState = gameStateManager.getState();

          const testGameState = createTestGameState(gameState, {
            player: {
              factions: {
                authorities: authorityRep,
              },
            },
          });

          const inspectionChance = gameStateManager.calculateInspectionChance(
            systemId,
            testGameState
          );

          // Calculate expected probability with faction modifier (Requirement 8.8)
          const baseRate = DANGER_CONFIG.ZONES[zone].inspectionChance;
          const coreMultiplier =
            systemId === 0 || systemId === 1
              ? DANGER_CONFIG.CORE_SYSTEMS_INSPECTION_MULTIPLIER
              : 1.0;
          const factionModifier =
            1 +
            (authorityRep / 100) *
              DANGER_CONFIG.FACTION_REPUTATION_SCALES
                .AUTHORITY_INSPECTION_REDUCTION_SCALE;

          const expectedRate = baseRate * coreMultiplier * factionModifier;

          // Final probability should be clamped to [0, 1]
          const clampedExpectedRate = Math.max(0, Math.min(1, expectedRate));

          expect(inspectionChance).toBeCloseTo(clampedExpectedRate, 5);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp final probability to [0, 1] range', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 0, max: 10 }), // Large number of restricted goods
        fc.integer({ min: -100, max: 100 }), // Authority reputation
        (systemId, restrictedGoodsCount, authorityRep) => {
          const gameState = gameStateManager.getState();

          // Create cargo with many restricted goods to potentially exceed 1.0
          const cargo = [];
          for (let i = 0; i < restrictedGoodsCount; i++) {
            cargo.push({
              type: COMMODITY_TYPES[i % COMMODITY_TYPES.length],
              quantity: 1,
              purchasePrice: 10,
            });
          }

          const testGameState = createTestGameState(gameState, {
            ship: {
              cargo: cargo,
            },
            player: {
              factions: {
                authorities: authorityRep,
              },
            },
          });

          const inspectionChance = gameStateManager.calculateInspectionChance(
            systemId,
            testGameState
          );

          // Probability should always be within [0, 1] range
          expect(inspectionChance).toBeGreaterThanOrEqual(0);
          expect(inspectionChance).toBeLessThanOrEqual(1);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
