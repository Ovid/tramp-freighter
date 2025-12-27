import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import {
  NPC_BENEFITS_CONFIG,
  REPUTATION_BOUNDS,
} from '../../src/game/constants.js';

/**
 * Property-based tests for favor cooldown enforcement
 *
 * Feature: npc-benefits, Property 6: Favor Cooldown Enforcement
 * Validates: Requirements 3.3, 3.7
 */

describe('Favor Cooldown Enforcement Property Tests', () => {
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

  // Generator for favor types
  const arbFavorType = () => fc.constantFrom('loan', 'storage');

  // Generator for days since last favor (0 to 60 days)
  const arbDaysSinceLastFavor = () => fc.integer({ min: 0, max: 60 });

  // Generator for current game day
  const arbCurrentDay = () => fc.integer({ min: 1, max: 1000 });

  it('should enforce 30-day cooldown between favors', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFavorType(),
        arbCurrentDay(),
        arbDaysSinceLastFavor(),
        (npcId, favorType, currentDay, daysSinceLastFavor) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set current game day
          testGameStateManager.state.player.daysElapsed = currentDay;

          // Get NPC state and set reputation to meet tier requirements
          const npcState = testGameStateManager.getNPCState(npcId);

          // Set reputation high enough for both loan and storage
          npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

          // Set lastFavorDay based on daysSinceLastFavor
          const lastFavorDay = currentDay - daysSinceLastFavor;
          npcState.lastFavorDay = lastFavorDay;

          // Test favor request
          const result = testGameStateManager.canRequestFavor(npcId, favorType);

          // Should be available only if daysSinceLastFavor >= FAVOR_COOLDOWN_DAYS (30)
          const expectedAvailable =
            daysSinceLastFavor >= NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS;

          expect(result.available).toBe(expectedAvailable);

          // Verify result structure
          expect(typeof result.available).toBe('boolean');
          expect(
            result.reason === null || typeof result.reason === 'string'
          ).toBe(true);

          if (!expectedAvailable) {
            // Should have a reason when unavailable due to cooldown
            expect(result.reason).toBeTruthy();
            expect(typeof result.reason).toBe('string');

            // Should include daysRemaining when on cooldown
            if (result.daysRemaining !== undefined) {
              expect(typeof result.daysRemaining).toBe('number');
              expect(result.daysRemaining).toBeGreaterThan(0);
              expect(result.daysRemaining).toBeLessThanOrEqual(
                NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS
              );

              // daysRemaining should equal the remaining cooldown period
              const expectedDaysRemaining =
                NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS - daysSinceLastFavor;
              expect(result.daysRemaining).toBe(expectedDaysRemaining);
            }
          } else {
            // When available, reason should be null or empty
            expect(result.reason === null || result.reason === '').toBe(true);
            // daysRemaining should not be present when available
            expect(result.daysRemaining).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return daysRemaining when on cooldown', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFavorType(),
        arbCurrentDay(),
        fc.integer({ min: 1, max: 29 }), // Days since last favor (within cooldown period)
        (npcId, favorType, currentDay, daysSinceLastFavor) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set current game day
          testGameStateManager.state.player.daysElapsed = currentDay;

          // Get NPC state and set reputation to meet tier requirements
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

          // Set lastFavorDay to be within cooldown period
          const lastFavorDay = currentDay - daysSinceLastFavor;
          npcState.lastFavorDay = lastFavorDay;

          // Test favor request
          const result = testGameStateManager.canRequestFavor(npcId, favorType);

          // Should not be available due to cooldown
          expect(result.available).toBe(false);
          expect(result.reason).toBeTruthy();

          // Should include daysRemaining
          expect(result.daysRemaining).toBeDefined();
          expect(typeof result.daysRemaining).toBe('number');
          expect(result.daysRemaining).toBeGreaterThan(0);

          // daysRemaining should equal the remaining cooldown period
          const expectedDaysRemaining =
            NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS - daysSinceLastFavor;
          expect(result.daysRemaining).toBe(expectedDaysRemaining);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle null lastFavorDay (never used favor before)', () => {
    fc.assert(
      fc.property(arbNPCId(), arbFavorType(), (npcId, favorType) => {
        // Reset GameStateManager for this test iteration
        const testGameStateManager = resetGameState();

        // Get NPC state and set reputation to meet tier requirements
        const npcState = testGameStateManager.getNPCState(npcId);
        npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

        // Ensure lastFavorDay is null (never used favor before)
        npcState.lastFavorDay = null;

        // Test favor request
        const result = testGameStateManager.canRequestFavor(npcId, favorType);

        // Should be available since no previous favor was used
        expect(result.available).toBe(true);
        expect(result.reason === null || result.reason === '').toBe(true);
        expect(result.daysRemaining).toBeUndefined();
      }),
      { numRuns: 50 }
    );
  });

  it('should handle boundary case at exactly 30 days', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFavorType(),
        arbCurrentDay(),
        (npcId, favorType, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set current game day
          testGameStateManager.state.player.daysElapsed = currentDay;

          // Get NPC state and set reputation to meet tier requirements
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

          // Set lastFavorDay to exactly 30 days ago
          const lastFavorDay =
            currentDay - NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS;
          npcState.lastFavorDay = lastFavorDay;

          // Test favor request
          const result = testGameStateManager.canRequestFavor(npcId, favorType);

          // Should be available at exactly 30 days
          expect(result.available).toBe(true);
          expect(result.reason === null || result.reason === '').toBe(true);
          expect(result.daysRemaining).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle boundary case at 29 days (still on cooldown)', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFavorType(),
        arbCurrentDay(),
        (npcId, favorType, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set current game day
          testGameStateManager.state.player.daysElapsed = currentDay;

          // Get NPC state and set reputation to meet tier requirements
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

          // Set lastFavorDay to exactly 29 days ago (still on cooldown)
          const daysSinceLastFavor =
            NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS - 1; // 29 days
          const lastFavorDay = currentDay - daysSinceLastFavor;
          npcState.lastFavorDay = lastFavorDay;

          // Test favor request
          const result = testGameStateManager.canRequestFavor(npcId, favorType);

          // Should not be available at 29 days
          expect(result.available).toBe(false);
          expect(result.reason).toBeTruthy();
          expect(result.daysRemaining).toBe(1); // 1 day remaining
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle cooldown independently for different favor types', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbDaysSinceLastFavor(),
        (npcId, currentDay, daysSinceLastFavor) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set current game day
          testGameStateManager.state.player.daysElapsed = currentDay;

          // Get NPC state and set reputation to meet tier requirements
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN + 10; // Above Trusted tier

          // Set lastFavorDay
          const lastFavorDay = currentDay - daysSinceLastFavor;
          npcState.lastFavorDay = lastFavorDay;

          // Test both favor types - they should have the same cooldown behavior
          // since cooldown is shared between favor types (per requirements)
          const loanResult = testGameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          const storageResult = testGameStateManager.canRequestFavor(
            npcId,
            'storage'
          );

          // Both should have the same availability due to shared cooldown
          expect(loanResult.available).toBe(storageResult.available);

          if (!loanResult.available) {
            expect(loanResult.daysRemaining).toBe(storageResult.daysRemaining);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
