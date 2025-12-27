import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Property-based tests for favor tier requirements
 *
 * Feature: npc-benefits, Property 5: Favor Tier Requirements
 * Validates: Requirements 3.1, 3.2, 3.9, 3.10
 */

describe('Favor Tier Requirements Property Tests', () => {
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

  // Helper function to reset GameStateManager for each property test iteration
  const resetGameState = () => {
    const testGameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    testGameStateManager.initNewGame();
    return testGameStateManager;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for reputation values
  const arbReputation = () => fc.integer({ min: -100, max: 100 });

  // Generator for favor types
  const arbFavorType = () => fc.constantFrom('loan', 'storage');

  it('should require Trusted tier (rep >= 60) for loan requests', () => {
    fc.assert(
      fc.property(arbNPCId(), arbReputation(), (npcId, reputation) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Get NPC state and set reputation
        const npcState = testGameStateManager.getNPCState(npcId);
        npcState.rep = reputation;

        // Test loan request
        const result = testGameStateManager.canRequestFavor(npcId, 'loan');

        // Should be available only if reputation >= TRUSTED_MIN (60)
        const expectedAvailable = reputation >= REPUTATION_BOUNDS.TRUSTED_MIN;

        expect(result.available).toBe(expectedAvailable);

        if (!expectedAvailable) {
          expect(result.reason).toBeTruthy();
          expect(typeof result.reason).toBe('string');
          expect(result.reason).toContain('Trusted relationship');
        } else {
          // When available, reason should be null or empty
          expect(result.reason === null || result.reason === '').toBe(true);
        }

        // Verify result structure
        expect(typeof result.available).toBe('boolean');
        expect(
          result.reason === null || typeof result.reason === 'string'
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should require Friendly tier (rep >= 30) for storage requests', () => {
    fc.assert(
      fc.property(arbNPCId(), arbReputation(), (npcId, reputation) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Get NPC state and set reputation
        const npcState = testGameStateManager.getNPCState(npcId);
        npcState.rep = reputation;

        // Test storage request
        const result = testGameStateManager.canRequestFavor(npcId, 'storage');

        // Should be available only if reputation >= FRIENDLY_MIN (30)
        const expectedAvailable = reputation >= REPUTATION_BOUNDS.FRIENDLY_MIN;

        expect(result.available).toBe(expectedAvailable);

        if (!expectedAvailable) {
          expect(result.reason).toBeTruthy();
          expect(typeof result.reason).toBe('string');
          expect(result.reason).toContain('Friendly relationship');
        } else {
          // When available, reason should be null or empty
          expect(result.reason === null || result.reason === '').toBe(true);
        }

        // Verify result structure
        expect(typeof result.available).toBe('boolean');
        expect(
          result.reason === null || typeof result.reason === 'string'
        ).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should return unavailable with reason when tier is too low', () => {
    fc.assert(
      fc.property(arbNPCId(), arbFavorType(), (npcId, favorType) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Get NPC state
        const npcState = testGameStateManager.getNPCState(npcId);

        // Test with reputation below required tier
        const requiredRep =
          favorType === 'loan'
            ? REPUTATION_BOUNDS.TRUSTED_MIN
            : REPUTATION_BOUNDS.FRIENDLY_MIN;

        const lowReputation = requiredRep - 1;
        npcState.rep = lowReputation;

        const result = testGameStateManager.canRequestFavor(npcId, favorType);

        // Should not be available
        expect(result.available).toBe(false);
        expect(result.reason).toBeTruthy();
        expect(typeof result.reason).toBe('string');

        // Should contain appropriate tier requirement message
        if (favorType === 'loan') {
          expect(result.reason).toContain('Trusted relationship');
        } else {
          expect(result.reason).toContain('Friendly relationship');
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should handle boundary reputation values correctly', () => {
    fc.assert(
      fc.property(arbNPCId(), (npcId) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Get NPC state
        const npcState = testGameStateManager.getNPCState(npcId);

        // Test boundary cases for loan (Trusted tier)
        const loanBoundaryTests = [
          { rep: REPUTATION_BOUNDS.TRUSTED_MIN - 1, expectedAvailable: false },
          { rep: REPUTATION_BOUNDS.TRUSTED_MIN, expectedAvailable: true },
          { rep: REPUTATION_BOUNDS.TRUSTED_MAX, expectedAvailable: true },
          { rep: REPUTATION_BOUNDS.FAMILY_MIN, expectedAvailable: true },
        ];

        for (const test of loanBoundaryTests) {
          npcState.rep = test.rep;
          const result = testGameStateManager.canRequestFavor(npcId, 'loan');
          expect(result.available).toBe(test.expectedAvailable);
        }

        // Test boundary cases for storage (Friendly tier)
        const storageBoundaryTests = [
          { rep: REPUTATION_BOUNDS.FRIENDLY_MIN - 1, expectedAvailable: false },
          { rep: REPUTATION_BOUNDS.FRIENDLY_MIN, expectedAvailable: true },
          { rep: REPUTATION_BOUNDS.FRIENDLY_MAX, expectedAvailable: true },
          { rep: REPUTATION_BOUNDS.TRUSTED_MIN, expectedAvailable: true },
          { rep: REPUTATION_BOUNDS.FAMILY_MIN, expectedAvailable: true },
        ];

        for (const test of storageBoundaryTests) {
          npcState.rep = test.rep;
          const result = testGameStateManager.canRequestFavor(npcId, 'storage');
          expect(result.available).toBe(test.expectedAvailable);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should handle invalid favor types gracefully', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbReputation(),
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => s !== 'loan' && s !== 'storage'),
        (npcId, reputation, invalidFavorType) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Get NPC state and set reputation
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Test with invalid favor type - should throw or return unavailable
          expect(() => {
            const result = testGameStateManager.canRequestFavor(
              npcId,
              invalidFavorType
            );
            // If it doesn't throw, it should return unavailable
            expect(result.available).toBe(false);
            expect(result.reason).toBeTruthy();
          }).not.toThrow(); // We expect graceful handling, not throwing
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle unknown NPC IDs gracefully', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((id) => !ALL_NPCS.some((npc) => npc.id === id)),
        arbFavorType(),
        (unknownNpcId, favorType) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Test with unknown NPC ID - should throw (fail fast for data integrity)
          expect(() => {
            testGameStateManager.canRequestFavor(unknownNpcId, favorType);
          }).toThrow('Unknown NPC ID');
        }
      ),
      { numRuns: 20 }
    );
  });
});
