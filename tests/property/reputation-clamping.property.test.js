/**
 * Property-based tests for reputation clamping invariant
 *
 * Feature: npc-foundation, Property 5: Reputation clamping invariant
 * Validates: Requirements 3.4
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Reputation Clamping Properties', () => {
  it('should clamp final reputation to [-100, 100] range for extreme reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }), // Valid initial reputation
        fc.integer({ min: -500, max: 500 }), // Extreme reputation change amount
        (initialRep, changeAmount) => {
          // Set up NPC state using proper GameStateManager method
          const npcId = 'chen_barnards';
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = initialRep; // Set initial reputation directly on existing state

          // Apply reputation change
          gameStateManager.modifyRep(npcId, changeAmount, 'test');

          // Check that final reputation is within bounds
          const finalRep = gameStateManager.state.npcs[npcId].rep;
          return finalRep >= -100 && finalRep <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve reputation values that are already within bounds', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }), // Valid initial reputation
        fc.integer({ min: -50, max: 50 }), // Small change that won't exceed bounds
        (initialRep, changeAmount) => {
          // Only test cases where the result would be within bounds
          const expectedResult = initialRep + changeAmount;
          if (expectedResult < -100 || expectedResult > 100) {
            return true; // Skip this test case
          }

          // Set up NPC state using proper GameStateManager method
          const npcId = 'chen_barnards';
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = initialRep; // Set initial reputation directly on existing state

          // Apply reputation change
          gameStateManager.modifyRep(npcId, changeAmount, 'test');

          // Check that reputation changed by expected amount (accounting for trust modifier)
          const finalRep = gameStateManager.state.npcs[npcId].rep;

          // For positive changes, trust modifier (0.3) and smooth_talker quirk may apply
          // For negative changes, no modifiers apply
          if (changeAmount > 0) {
            // Trust modifier applies: 0.3 * changeAmount
            // Smooth_talker quirk may apply: 1.05 multiplier
            const hasSmooth =
              gameStateManager.state.ship.quirks.includes('smooth_talker');
            const expectedChange =
              changeAmount * 0.3 * (hasSmooth ? 1.05 : 1.0);
            const expectedFinal = initialRep + expectedChange;

            // Allow for floating point precision
            return Math.abs(finalRep - expectedFinal) < 0.1;
          } else {
            // Negative changes have no modifiers
            return finalRep === initialRep + changeAmount;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
