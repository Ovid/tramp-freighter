/**
 * Property-based tests for zone-specific encounter rates
 *
 * Feature: danger-system, Property 2: Zone-Specific Encounter Rates
 * Validates: Requirements 1.4, 1.5, 1.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DANGER_CONFIG } from '../../src/game/constants.js';

describe('Zone-Specific Encounter Rates Properties', () => {
  it('should have higher base pirate rates in dangerous zones than safe zones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (systemId) => {
          const zone = gameStateManager.getDangerZone(systemId);
          const baseRate = gameStateManager.calculatePirateEncounterChance(systemId, gameStateManager.getState());

          // Test zone-specific base rates according to requirements
          if (zone === 'safe') {
            // Safe zones should have 5% base rate (Requirement 1.4)
            expect(baseRate).toBeCloseTo(DANGER_CONFIG.ZONES.safe.pirateChance, 5);
          } else if (zone === 'contested') {
            // Contested zones should have 20% base rate (Requirement 1.5)
            expect(baseRate).toBeCloseTo(DANGER_CONFIG.ZONES.contested.pirateChance, 5);
          } else if (zone === 'dangerous') {
            // Dangerous zones should have 35% base rate (Requirement 1.6)
            expect(baseRate).toBeCloseTo(DANGER_CONFIG.ZONES.dangerous.pirateChance, 5);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have dangerous zones with higher pirate rates than safe zones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    const safeRate = DANGER_CONFIG.ZONES.safe.pirateChance;
    const contestedRate = DANGER_CONFIG.ZONES.contested.pirateChance;
    const dangerousRate = DANGER_CONFIG.ZONES.dangerous.pirateChance;

    // Verify the ordering: dangerous > contested > safe
    expect(dangerousRate).toBeGreaterThan(contestedRate);
    expect(contestedRate).toBeGreaterThan(safeRate);
  });

  it('should have correct inspection rates for each zone type', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (systemId) => {
          const zone = gameStateManager.getDangerZone(systemId);

          // Test zone-specific inspection rates according to requirements
          if (zone === 'safe') {
            // Safe zones should have 10% inspection rate (Requirement 1.7)
            expect(DANGER_CONFIG.ZONES.safe.inspectionChance).toBe(0.10);
          } else if (zone === 'contested') {
            // Contested zones should have 15% inspection rate (Requirement 1.8)
            expect(DANGER_CONFIG.ZONES.contested.inspectionChance).toBe(0.15);
          } else if (zone === 'dangerous') {
            // Dangerous zones should have 5% inspection rate (Requirement 1.9)
            expect(DANGER_CONFIG.ZONES.dangerous.inspectionChance).toBe(0.05);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});