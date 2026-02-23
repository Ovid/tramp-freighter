import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

/**
 * Property-based tests for NPC-specific discount application
 *
 * Feature: npc-benefits, Property 12: NPC-Specific Discount Application
 * Validates: Requirements 11.4
 */

describe('NPC-Specific Discount Application Property Tests', () => {
  let gameStateManager;

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

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to reset GameStateManager for each property test iteration
  const resetGameState = () => {
    gameStateManager.initNewGame();
    return gameStateManager;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

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

  // Generator for high reputation values (to ensure discount would be given if service matches)
  const arbHighReputation = () => fc.integer({ min: 60, max: 100 }); // Trusted to Family tier

  it('should only apply discounts from NPCs whose discountService matches the service type', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbServiceType(),
        arbHighReputation(),
        (npcId, serviceType, reputation) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameStateManager.getNPCState(npcId);

          // Set high reputation to ensure discount would be given if service matches
          npcState.rep = reputation;

          // Get the result
          const result = testGameStateManager.getServiceDiscount(
            npcId,
            serviceType
          );

          // The discount should only be non-zero if the NPC's discountService matches the serviceType
          if (npcData.discountService === serviceType) {
            // Should provide discount and NPC name
            expect(result.discount).toBeGreaterThan(0);
            expect(result.npcName).toBe(npcData.name);
          } else {
            // Should not provide discount
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not provide discounts from NPCs with non-matching discountService regardless of reputation', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbServiceType(),
        fc.integer({ min: -100, max: 100 }), // Any reputation
        (npcId, serviceType, reputation) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameStateManager.getNPCState(npcId);

          // Set reputation
          npcState.rep = reputation;

          // Only test when discountService doesn't match serviceType
          if (npcData.discountService !== serviceType) {
            const result = testGameStateManager.getServiceDiscount(
              npcId,
              serviceType
            );

            // Should never provide discount, regardless of reputation
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide correct NPC name only when discount is applied', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbServiceType(),
        fc.integer({ min: -100, max: 100 }), // Any reputation
        (npcId, serviceType, reputation) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const npcState = testGameStateManager.getNPCState(npcId);

          // Set reputation
          npcState.rep = reputation;

          // Get the result
          const result = testGameStateManager.getServiceDiscount(
            npcId,
            serviceType
          );

          // The NPC name should only be provided when a discount is actually applied
          if (result.discount > 0) {
            expect(result.npcName).toBe(npcData.name);
            expect(typeof result.npcName).toBe('string');
            expect(result.npcName.length).toBeGreaterThan(0);
          } else {
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain service type specificity across all NPCs', () => {
    fc.assert(
      fc.property(arbServiceType(), (serviceType) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Test all NPCs for this service type
        const npcsWithMatchingService = [];
        const npcsWithNonMatchingService = [];

        for (const npc of ALL_NPCS) {
          const npcState = testGameStateManager.getNPCState(npc.id);
          // Set high reputation to ensure discount would be given if service matches
          npcState.rep = 75; // Trusted tier

          const result = testGameStateManager.getServiceDiscount(
            npc.id,
            serviceType
          );

          if (npc.discountService === serviceType) {
            npcsWithMatchingService.push({ npc, result });
            // Should provide discount
            expect(result.discount).toBeGreaterThan(0);
            expect(result.npcName).toBe(npc.name);
          } else {
            npcsWithNonMatchingService.push({ npc, result });
            // Should not provide discount
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }

        // Verify that only NPCs with matching discountService provide discounts
        for (const { npc, result } of npcsWithMatchingService) {
          expect(npc.discountService).toBe(serviceType);
          expect(result.discount).toBeGreaterThan(0);
        }

        for (const { npc, result } of npcsWithNonMatchingService) {
          expect(npc.discountService).not.toBe(serviceType);
          expect(result.discount).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case where NPC has undefined discountService', () => {
    fc.assert(
      fc.property(
        arbServiceType(),
        arbHighReputation(),
        (serviceType, reputation) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Find NPCs with undefined or null discountService
          const npcsWithoutDiscountService = ALL_NPCS.filter(
            (npc) =>
              npc.discountService === null || npc.discountService === undefined
          );

          for (const npc of npcsWithoutDiscountService) {
            const npcState = testGameStateManager.getNPCState(npc.id);
            npcState.rep = reputation;

            const result = testGameStateManager.getServiceDiscount(
              npc.id,
              serviceType
            );

            // Should never provide discount
            expect(result.discount).toBe(0);
            expect(result.npcName).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
