import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-based tests for loan grant effects
 *
 * Feature: npc-benefits, Property 7: Loan Grant Effects
 * Validates: Requirements 3.5
 */

describe('Loan Grant Effects Property Tests', () => {
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

  // Generator for initial player credits (reasonable range)
  const arbInitialCredits = () => fc.integer({ min: 0, max: 10000 });

  // Generator for initial NPC reputation (Trusted tier or higher for loan eligibility)
  const arbTrustedReputation = () => fc.integer({ 
    min: REPUTATION_BOUNDS.TRUSTED_MIN, 
    max: REPUTATION_BOUNDS.MAX 
  });

  // Generator for current game day
  const arbCurrentDay = () => fc.integer({ min: 0, max: 1000 });

  it('should increase player credits by exactly 500 when loan is granted', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbTrustedReputation(),
        arbCurrentDay(),
        (npcId, initialCredits, reputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation to Trusted tier or higher
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Record initial state
          const initialPlayerCredits = testGameStateManager.getState().player.credits;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Player credits should increase by exactly 500
          const finalPlayerCredits = testGameStateManager.getState().player.credits;
          const creditIncrease = finalPlayerCredits - initialPlayerCredits;
          expect(creditIncrease).toBe(NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT);
          expect(finalPlayerCredits).toBe(initialCredits + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set loanAmount and loanDay when loan is granted', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbTrustedReputation(),
        arbCurrentDay(),
        (npcId, initialCredits, reputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation to Trusted tier or higher
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // NPC state should have loan information set
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.loanAmount).toBe(NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT);
          expect(updatedNpcState.loanDay).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increase NPC reputation by 5 points when loan is granted', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbTrustedReputation(),
        arbCurrentDay(),
        (npcId, initialCredits, reputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation to Trusted tier or higher
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Record initial reputation
          const initialReputation = npcState.rep;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // NPC reputation should increase by 5 points, but capped at maximum
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          const expectedReputation = Math.min(REPUTATION_BOUNDS.MAX, reputation + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS);
          const actualIncrease = updatedNpcState.rep - initialReputation;
          const expectedIncrease = expectedReputation - initialReputation;
          
          expect(actualIncrease).toBe(expectedIncrease);
          expect(updatedNpcState.rep).toBe(expectedReputation);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set lastFavorDay to current day when loan is granted', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbTrustedReputation(),
        arbCurrentDay(),
        (npcId, initialCredits, reputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation to Trusted tier or higher
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // lastFavorDay should be set to current day
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.lastFavorDay).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply all loan grant effects atomically', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbTrustedReputation(),
        arbCurrentDay(),
        (npcId, initialCredits, reputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation to Trusted tier or higher
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Record initial state
          const initialPlayerCredits = testGameStateManager.getState().player.credits;
          const initialReputation = npcState.rep;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Verify all effects applied together
          const finalState = testGameStateManager.getState();
          const updatedNpcState = testGameStateManager.getNPCState(npcId);

          // All four effects should be applied:
          // 1. Player credits increased by 500
          expect(finalState.player.credits).toBe(initialCredits + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT);
          
          // 2. NPC loanAmount set to 500
          expect(updatedNpcState.loanAmount).toBe(NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT);
          
          // 3. NPC loanDay set to current day
          expect(updatedNpcState.loanDay).toBe(currentDay);
          
          // 4. NPC reputation increased by 5 (but capped at maximum)
          const expectedReputation = Math.min(REPUTATION_BOUNDS.MAX, reputation + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS);
          expect(updatedNpcState.rep).toBe(expectedReputation);
          
          // 5. lastFavorDay set to current day
          expect(updatedNpcState.lastFavorDay).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle reputation cap correctly when loan acceptance bonus would exceed maximum', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        arbCurrentDay(),
        (npcId, initialCredits, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation near maximum
          const npcState = testGameStateManager.getNPCState(npcId);
          const highReputation = REPUTATION_BOUNDS.MAX - 2; // 98, so +5 would exceed 100
          npcState.rep = highReputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Request loan
          const result = testGameStateManager.requestLoan(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Reputation should be capped at maximum (100)
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.rep).toBeLessThanOrEqual(REPUTATION_BOUNDS.MAX);
          
          // Should still increase by the bonus amount or cap at max, whichever is lower
          const expectedRep = Math.min(
            highReputation + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS,
            REPUTATION_BOUNDS.MAX
          );
          expect(updatedNpcState.rep).toBe(expectedRep);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should fail gracefully when requestLoan is called on NPC below Trusted tier', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbInitialCredits(),
        fc.integer({ min: REPUTATION_BOUNDS.MIN, max: REPUTATION_BOUNDS.TRUSTED_MIN - 1 }),
        arbCurrentDay(),
        (npcId, initialCredits, lowReputation, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateCredits(initialCredits);
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set reputation below Trusted tier
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = lowReputation;

          // Ensure no existing loan and no recent favor
          npcState.loanAmount = null;
          npcState.loanDay = null;
          npcState.lastFavorDay = null;

          // Record initial state
          const initialPlayerCredits = testGameStateManager.getState().player.credits;
          const initialReputation = npcState.rep;

          // Request loan should fail
          const result = testGameStateManager.requestLoan(npcId);

          // Should fail
          expect(result.success).toBe(false);
          expect(result.message).toBeTruthy();
          expect(typeof result.message).toBe('string');

          // No state should be modified
          const finalState = testGameStateManager.getState();
          const finalNpcState = testGameStateManager.getNPCState(npcId);

          expect(finalState.player.credits).toBe(initialPlayerCredits);
          expect(finalNpcState.rep).toBe(initialReputation);
          expect(finalNpcState.loanAmount).toBe(null);
          expect(finalNpcState.loanDay).toBe(null);
          expect(finalNpcState.lastFavorDay).toBe(null);
        }
      ),
      { numRuns: 50 }
    );
  });
});