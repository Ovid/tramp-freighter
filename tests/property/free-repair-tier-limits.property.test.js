import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';

describe('Free Repair Tier Limits Property Tests', () => {
  let game;

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: Free Repair Tier Limits
   * Feature: npc-benefits, Property: Free Repair Tier Limits
   * Validates: Requirements 1.6, 1.7
   */
  it('should enforce tier-based free repair limits and once-per-visit restriction', () => {
    fc.assert(
      fc.property(
        // Generate NPC ID from available NPCs
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)),
        // Generate reputation values across all tiers
        fc.integer({ min: REPUTATION_BOUNDS.MIN, max: REPUTATION_BOUNDS.MAX }),
        // Generate current day
        fc.integer({ min: 0, max: 100 }),
        // Generate last free repair day (null or some day)
        fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 100 })),
        (npcId, reputation, currentDay, lastFreeRepairDay) => {
          // Set up game state
          game.state.player.daysElapsed = currentDay;

          // Initialize NPC state with specific reputation
          const npcState = game.getNPCState(npcId);
          npcState.rep = reputation;
          npcState.lastFreeRepairDay = lastFreeRepairDay;

          // Test canGetFreeRepair
          const result = game.canGetFreeRepair(npcId);

          // Determine expected tier
          const isTrusted =
            reputation >= REPUTATION_BOUNDS.TRUSTED_MIN &&
            reputation <= REPUTATION_BOUNDS.TRUSTED_MAX;
          const isFamily = reputation >= REPUTATION_BOUNDS.FAMILY_MIN;
          const isEligibleTier = isTrusted || isFamily;

          // Check once-per-visit restriction
          const isOnCooldown =
            lastFreeRepairDay !== null && lastFreeRepairDay === currentDay;

          if (!isEligibleTier) {
            // Lower tiers should not have access
            expect(result.available).toBe(false);
            expect(result.reason).toContain('Requires Trusted');
          } else if (isOnCooldown) {
            // Should be unavailable if already used today
            expect(result.available).toBe(false);
            expect(result.reason).toContain('once per visit');
          } else {
            // Should be available for eligible tiers
            expect(result.available).toBe(true);
            expect(result.reason).toBeNull();

            // Check tier-specific limits
            if (isTrusted) {
              expect(result.maxHullPercent).toBe(
                NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted
              );
            } else if (isFamily) {
              expect(result.maxHullPercent).toBe(
                NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
