import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-based tests for tier discount calculation
 *
 * Feature: npc-benefits, Property 1: Tier Discount Calculation
 * Validates: Requirements 1.4, 1.5, 1.6, 1.7, 11.3
 */

describe('Tier Discount Calculation Property Tests', () => {
  let game;

  beforeEach(() => {
    // Mock localStorage with Vitest
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    vi.stubGlobal('localStorage', localStorageMock);

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to reset GameCoordinator for each property test iteration
  const resetGameState = () => {
    game.initNewGame();
    return game;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for reputation values
  const arbReputation = () => fc.integer({ min: -100, max: 100 });

  // Generator for service types
  const arbServiceType = () =>
    fc.constantFrom(
      'repair',
      'refuel',
      'intel',
      'docking',
      'trade',
      'debt',
      'medical'
    );

  it('should return correct discount percentage based on reputation tier', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbReputation(),
        arbServiceType(),
        (npcId, reputation, serviceType) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameCoordinator.getNPCState(npcId);

          // Set reputation
          npcState.rep = reputation;

          // Get the result
          const result = testGameCoordinator.getServiceDiscount(
            npcId,
            serviceType
          );

          // Determine expected discount
          let expectedDiscount = 0;
          let expectedNpcName = null;

          // Only apply discount if NPC's discountService matches serviceType
          if (npcData.discountService === serviceType) {
            // Get reputation tier
            const repTier = testGameCoordinator.getRepTier(reputation);
            const tierName = repTier.name.toLowerCase();

            // Get discount from configuration
            expectedDiscount =
              NPC_BENEFITS_CONFIG.TIER_DISCOUNTS[tierName] || 0;
            expectedNpcName = expectedDiscount > 0 ? npcData.name : null;
          }

          // Verify the result
          expect(result.discount).toBe(expectedDiscount);
          expect(result.npcName).toBe(expectedNpcName);

          // Verify discount is within valid range
          expect(result.discount).toBeGreaterThanOrEqual(0);
          expect(result.discount).toBeLessThanOrEqual(0.2); // Max 20% discount

          // Verify result structure
          expect(typeof result.discount).toBe('number');
          expect(
            result.npcName === null || typeof result.npcName === 'string'
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return zero discount when NPC discountService does not match serviceType', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbReputation(),
        arbServiceType(),
        (npcId, reputation, serviceType) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameCoordinator.getNPCState(npcId);

          // Set reputation to high value to ensure tier would give discount
          npcState.rep = reputation;

          // Only test when discountService doesn't match
          if (npcData.discountService !== serviceType) {
            const result = testGameCoordinator.getServiceDiscount(
              npcId,
              serviceType
            );

            // Should return zero discount and null NPC name
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct tier-based discounts for matching service types', () => {
    fc.assert(
      fc.property(arbNPCId(), (npcId) => {
        // Reset GameCoordinator for this test iteration
        const testGameCoordinator = resetGameState();

        // Get NPC data
        const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
        const npcState = testGameCoordinator.getNPCState(npcId);

        // Only test NPCs that have a discountService
        if (npcData.discountService) {
          // Test each reputation tier
          const tierTests = [
            { tier: 'hostile', rep: -75, expectedDiscount: 0 },
            { tier: 'cold', rep: -25, expectedDiscount: 0 },
            { tier: 'neutral', rep: 0, expectedDiscount: 0 },
            { tier: 'warm', rep: 20, expectedDiscount: 0.05 },
            { tier: 'friendly', rep: 45, expectedDiscount: 0.1 },
            { tier: 'trusted', rep: 75, expectedDiscount: 0.15 },
            { tier: 'family', rep: 95, expectedDiscount: 0.2 },
          ];

          for (const test of tierTests) {
            npcState.rep = test.rep;

            const result = testGameCoordinator.getServiceDiscount(
              npcId,
              npcData.discountService
            );

            expect(result.discount).toBe(test.expectedDiscount);

            if (test.expectedDiscount > 0) {
              expect(result.npcName).toBe(npcData.name);
            } else {
              expect(result.npcName).toBeNull();
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle NPCs with null discountService', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbReputation(),
        arbServiceType(),
        (npcId, reputation, serviceType) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameCoordinator.getNPCState(npcId);

          // Set reputation
          npcState.rep = reputation;

          // Only test NPCs with null discountService
          if (
            npcData.discountService === null ||
            npcData.discountService === undefined
          ) {
            const result = testGameCoordinator.getServiceDiscount(
              npcId,
              serviceType
            );

            // Should always return zero discount and null NPC name
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
