import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';

/**
 * Property-based tests for loan default penalty
 *
 * Feature: npc-benefits, Property 9: Loan Default Penalty
 * Validates: Requirements 3.16
 */

describe('Loan Default Penalty Property Tests', () => {
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
    const testGameCoordinator = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    testGameCoordinator.initNewGame();
    return testGameCoordinator;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for current game day (must be at least 31 to trigger default)
  const arbCurrentDay = () => fc.integer({ min: 31, max: 1000 });

  // Generator for initial reputation (various tiers to test tier reduction)
  const arbInitialReputation = () =>
    fc.integer({
      min: REPUTATION_BOUNDS.MIN,
      max: REPUTATION_BOUNDS.MAX,
    });

  // Helper function to calculate tier boundaries
  const getTierBoundaries = () => {
    return {
      HOSTILE_MIN: REPUTATION_BOUNDS.MIN,
      COLD_MIN: REPUTATION_BOUNDS.COLD_MIN,
      NEUTRAL_MIN: REPUTATION_BOUNDS.NEUTRAL_MIN,
      WARM_MIN: REPUTATION_BOUNDS.WARM_MIN,
      FRIENDLY_MIN: REPUTATION_BOUNDS.FRIENDLY_MIN,
      TRUSTED_MIN: REPUTATION_BOUNDS.TRUSTED_MIN,
      FAMILY_MIN: REPUTATION_BOUNDS.FAMILY_MIN,
      MAX: REPUTATION_BOUNDS.MAX,
    };
  };

  // Helper function to get current tier from reputation
  const getCurrentTier = (reputation) => {
    const bounds = getTierBoundaries();
    if (reputation >= bounds.FAMILY_MIN) return 'family';
    if (reputation >= bounds.TRUSTED_MIN) return 'trusted';
    if (reputation >= bounds.FRIENDLY_MIN) return 'friendly';
    if (reputation >= bounds.WARM_MIN) return 'warm';
    if (reputation >= bounds.NEUTRAL_MIN) return 'neutral';
    if (reputation >= bounds.COLD_MIN) return 'cold';
    return 'hostile';
  };

  // Helper function to get expected reputation after one tier reduction
  const getExpectedReputationAfterTierReduction = (initialReputation) => {
    const bounds = getTierBoundaries();
    const currentTier = getCurrentTier(initialReputation);

    // Calculate one tier reduction based on current tier
    switch (currentTier) {
      case 'family':
        // Family (90-100) -> Trusted (60-89), set to Trusted max (89)
        return (
          bounds.TRUSTED_MIN + (bounds.FAMILY_MIN - bounds.TRUSTED_MIN - 1)
        );
      case 'trusted':
        // Trusted (60-89) -> Friendly (30-59), set to Friendly max (59)
        return (
          bounds.FRIENDLY_MIN + (bounds.TRUSTED_MIN - bounds.FRIENDLY_MIN - 1)
        );
      case 'friendly':
        // Friendly (30-59) -> Warm (10-29), set to Warm max (29)
        return bounds.WARM_MIN + (bounds.FRIENDLY_MIN - bounds.WARM_MIN - 1);
      case 'warm':
        // Warm (10-29) -> Neutral (0-9), set to Neutral max (9)
        return bounds.NEUTRAL_MIN + (bounds.WARM_MIN - bounds.NEUTRAL_MIN - 1);
      case 'neutral':
        // Neutral (0-9) -> Cold (-30 to -1), set to Cold max (-1)
        return bounds.COLD_MIN + (bounds.NEUTRAL_MIN - bounds.COLD_MIN - 1);
      case 'cold':
        // Cold (-30 to -1) -> Hostile (-100 to -31), set to Hostile max (-31)
        return bounds.HOSTILE_MIN + (bounds.COLD_MIN - bounds.HOSTILE_MIN - 1);
      case 'hostile':
        // Already at lowest tier, reduce by tier penalty amount but don't go below minimum
        return Math.max(
          initialReputation -
            NPC_BENEFITS_CONFIG.LOAN_DEFAULT_TIER_PENALTY * 20,
          bounds.HOSTILE_MIN
        );
      default:
        return initialReputation;
    }
  };

  it('should reduce NPC reputation by one tier when loan is overdue by more than 30 days', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbInitialReputation(),
        (npcId, currentDay, initialReputation) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up overdue loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = initialReputation;
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = currentDay - 31; // Loan is 31 days overdue

          // Record initial state
          const initialNpcReputation = npcState.rep;

          // Trigger loan default check (this method should be called by updateTime)
          testGameCoordinator.checkLoanDefaults();

          // Verify reputation was reduced by one tier
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);
          const expectedReputation =
            getExpectedReputationAfterTierReduction(initialReputation);

          // The reputation should be reduced to the expected tier level
          // Only check "less than" if the expected reputation is actually different from initial
          if (expectedReputation < initialNpcReputation) {
            expect(updatedNpcState.rep).toBeLessThan(initialNpcReputation);
          }
          expect(updatedNpcState.rep).toBe(expectedReputation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear loan record when loan defaults', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbInitialReputation(),
        (npcId, currentDay, initialReputation) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up overdue loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = initialReputation;
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = currentDay - 31; // Loan is 31 days overdue

          // Verify loan exists before default
          expect(npcState.loanAmount).toBe(
            NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
          expect(npcState.loanDay).toBe(currentDay - 31);

          // Trigger loan default check
          testGameCoordinator.checkLoanDefaults();

          // Verify loan record is cleared
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);
          expect(updatedNpcState.loanAmount).toBe(null);
          expect(updatedNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply both default effects atomically (reputation reduction and loan clearing)', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbInitialReputation(),
        (npcId, currentDay, initialReputation) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up overdue loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = initialReputation;
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          const loanDay = currentDay - 31; // Loan is 31 days overdue
          npcState.loanDay = loanDay;

          // Record initial state
          const initialNpcReputation = npcState.rep;

          // Trigger loan default check
          testGameCoordinator.checkLoanDefaults();

          // Verify both effects applied together
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);
          const expectedReputation =
            getExpectedReputationAfterTierReduction(initialReputation);

          // Both effects should be applied:
          // 1. Reputation reduced by one tier
          // Only check "less than" if the expected reputation is actually different from initial
          if (expectedReputation < initialNpcReputation) {
            expect(updatedNpcState.rep).toBeLessThan(initialNpcReputation);
          }
          expect(updatedNpcState.rep).toBe(expectedReputation);

          // 2. Loan record cleared
          expect(updatedNpcState.loanAmount).toBe(null);
          expect(updatedNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not affect NPCs with loans that are not yet overdue', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbInitialReputation(),
        (npcId, currentDay, initialReputation) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up loan that is not yet overdue (within 30 days)
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = initialReputation;
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          const loanDay = Math.max(0, currentDay - 30); // Loan is exactly 30 days old (not overdue)
          npcState.loanDay = loanDay;

          // Record initial state
          const initialNpcReputation = npcState.rep;

          // Trigger loan default check
          testGameCoordinator.checkLoanDefaults();

          // Verify no changes were made
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);

          // Reputation should remain unchanged
          expect(updatedNpcState.rep).toBe(initialNpcReputation);

          // Loan record should remain unchanged
          expect(updatedNpcState.loanAmount).toBe(
            NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
          expect(updatedNpcState.loanDay).toBe(loanDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not affect NPCs with no outstanding loans', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbInitialReputation(),
        (npcId, currentDay, initialReputation) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and ensure no outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = initialReputation;
          npcState.loanAmount = null;
          npcState.loanDay = null;

          // Record initial state
          const initialNpcReputation = npcState.rep;

          // Trigger loan default check
          testGameCoordinator.checkLoanDefaults();

          // Verify no changes were made
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);

          // Reputation should remain unchanged
          expect(updatedNpcState.rep).toBe(initialNpcReputation);

          // Loan record should remain null
          expect(updatedNpcState.loanAmount).toBe(null);
          expect(updatedNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple NPCs with overdue loans correctly', () => {
    fc.assert(
      fc.property(
        fc.array(arbNPCId(), { minLength: 2, maxLength: 5 }),
        arbCurrentDay(),
        (npcIds, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up current day
          testGameCoordinator.updateTime(currentDay);

          // Remove duplicates to ensure each NPC is only processed once
          const uniqueNpcIds = [...new Set(npcIds)];

          // Skip test if we don't have at least 2 unique NPCs after deduplication
          if (uniqueNpcIds.length < 2) {
            return true; // Skip this test case
          }

          // Set up multiple NPCs with overdue loans
          const initialStates = [];
          for (const npcId of uniqueNpcIds) {
            const npcState = testGameCoordinator.getNPCState(npcId);
            const initialReputation = fc.sample(arbInitialReputation(), 1)[0];
            npcState.rep = initialReputation;
            npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
            npcState.loanDay = currentDay - 31; // All loans are 31 days overdue

            initialStates.push({
              npcId,
              initialReputation,
              expectedReputation:
                getExpectedReputationAfterTierReduction(initialReputation),
            });
          }

          // Trigger loan default check
          testGameCoordinator.checkLoanDefaults();

          // Verify all NPCs were processed correctly
          for (const {
            npcId,
            initialReputation,
            expectedReputation,
          } of initialStates) {
            const updatedNpcState = testGameCoordinator.getNPCState(npcId);

            // Reputation should be reduced by one tier
            // Only check "less than" if the expected reputation is actually different from initial
            if (expectedReputation < initialReputation) {
              expect(updatedNpcState.rep).toBeLessThan(initialReputation);
            }
            expect(updatedNpcState.rep).toBe(expectedReputation);

            // Loan record should be cleared
            expect(updatedNpcState.loanAmount).toBe(null);
            expect(updatedNpcState.loanDay).toBe(null);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect reputation bounds when reducing reputation', () => {
    fc.assert(
      fc.property(arbNPCId(), arbCurrentDay(), (npcId, currentDay) => {
        // Reset GameCoordinator for this test iteration
        const testGameCoordinator = resetGameState();

        // Set up current day
        testGameCoordinator.updateTime(currentDay);

        // Test with reputation at minimum bound (hostile tier)
        const npcState = testGameCoordinator.getNPCState(npcId);
        npcState.rep = REPUTATION_BOUNDS.MIN; // -100
        npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
        npcState.loanDay = currentDay - 31; // Loan is 31 days overdue

        // Trigger loan default check
        testGameCoordinator.checkLoanDefaults();

        // Verify reputation doesn't go below minimum bound
        const updatedNpcState = testGameCoordinator.getNPCState(npcId);
        expect(updatedNpcState.rep).toBeGreaterThanOrEqual(
          REPUTATION_BOUNDS.MIN
        );
        expect(updatedNpcState.rep).toBeLessThanOrEqual(REPUTATION_BOUNDS.MAX);

        // Loan should still be cleared
        expect(updatedNpcState.loanAmount).toBe(null);
        expect(updatedNpcState.loanDay).toBe(null);
      }),
      { numRuns: 100 }
    );
  });
});
