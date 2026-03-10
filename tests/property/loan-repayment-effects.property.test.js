import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-based tests for loan repayment effects
 *
 * Feature: npc-benefits, Property 8: Loan Repayment Effects
 * Validates: Requirements 3.14, 3.15
 */

describe('Loan Repayment Effects Property Tests', () => {
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

  // Generator for initial player credits (must have at least 500 for repayment)
  const arbSufficientCredits = () =>
    fc.integer({ min: NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT, max: 10000 });

  // Generator for current game day
  const arbCurrentDay = () => fc.integer({ min: 0, max: 1000 });

  it('should deduct exactly 500 credits from player when loan is repaid', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbSufficientCredits(),
        arbCurrentDay(),
        (npcId, initialCredits, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateCredits(initialCredits);
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = Math.max(0, currentDay - 10); // Loan was granted 10 days ago

          // Record initial state
          const initialPlayerCredits =
            testGameCoordinator.getState().player.credits;

          // Repay loan
          const result = testGameCoordinator.repayLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Player credits should decrease by exactly 500
          const finalPlayerCredits =
            testGameCoordinator.getState().player.credits;
          const creditDecrease = initialPlayerCredits - finalPlayerCredits;
          expect(creditDecrease).toBe(
            NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
          expect(finalPlayerCredits).toBe(
            initialCredits - NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear loanAmount and loanDay when loan is repaid', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbSufficientCredits(),
        arbCurrentDay(),
        (npcId, initialCredits, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateCredits(initialCredits);
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          const loanDay = Math.max(0, currentDay - 10); // Loan was granted 10 days ago
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = loanDay;

          // Verify loan exists before repayment
          expect(npcState.loanAmount).toBe(
            NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
          expect(npcState.loanDay).toBe(loanDay);

          // Repay loan
          const result = testGameCoordinator.repayLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // NPC state should have loan information cleared
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);
          expect(updatedNpcState.loanAmount).toBe(null);
          expect(updatedNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply both repayment effects atomically', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbSufficientCredits(),
        arbCurrentDay(),
        (npcId, initialCredits, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateCredits(initialCredits);
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          const loanDay = Math.max(0, currentDay - 10); // Loan was granted 10 days ago
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = loanDay;

          // Repay loan
          const result = testGameCoordinator.repayLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Verify both effects applied together
          const finalState = testGameCoordinator.getState();
          const updatedNpcState = testGameCoordinator.getNPCState(npcId);

          // Both effects should be applied:
          // 1. Player credits decreased by 500
          expect(finalState.player.credits).toBe(
            initialCredits - NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );

          // 2. NPC loanAmount cleared
          expect(updatedNpcState.loanAmount).toBe(null);

          // 3. NPC loanDay cleared
          expect(updatedNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail when player has insufficient credits for repayment', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        fc.integer({
          min: 0,
          max: NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT - 1,
        }),
        arbCurrentDay(),
        (npcId, insufficientCredits, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state with insufficient credits
          testGameCoordinator.updateCredits(insufficientCredits);
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          const loanDay = Math.max(0, currentDay - 10); // Loan was granted 10 days ago
          npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
          npcState.loanDay = loanDay;

          // Record initial state
          const initialPlayerCredits =
            testGameCoordinator.getState().player.credits;

          // Attempt to repay loan should fail
          const result = testGameCoordinator.repayLoan(npcId);

          // Should fail
          expect(result.success).toBe(false);
          expect(result.message).toBeTruthy();
          expect(typeof result.message).toBe('string');

          // No state should be modified
          const finalState = testGameCoordinator.getState();
          const finalNpcState = testGameCoordinator.getNPCState(npcId);

          expect(finalState.player.credits).toBe(initialPlayerCredits);
          expect(finalNpcState.loanAmount).toBe(
            NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
          );
          expect(finalNpcState.loanDay).toBe(loanDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail when NPC has no outstanding loan', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbSufficientCredits(),
        arbCurrentDay(),
        (npcId, initialCredits, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateCredits(initialCredits);
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and ensure no outstanding loan
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.loanAmount = null;
          npcState.loanDay = null;

          // Record initial state
          const initialPlayerCredits =
            testGameCoordinator.getState().player.credits;

          // Attempt to repay non-existent loan should fail
          const result = testGameCoordinator.repayLoan(npcId);

          // Should fail
          expect(result.success).toBe(false);
          expect(result.message).toBeTruthy();
          expect(typeof result.message).toBe('string');

          // No state should be modified
          const finalState = testGameCoordinator.getState();
          const finalNpcState = testGameCoordinator.getNPCState(npcId);

          expect(finalState.player.credits).toBe(initialPlayerCredits);
          expect(finalNpcState.loanAmount).toBe(null);
          expect(finalNpcState.loanDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
