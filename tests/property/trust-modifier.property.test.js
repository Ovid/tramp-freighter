/**
 * Property-based tests for trust modifier application
 *
 * Feature: npc-foundation, Property 6: Trust modifier application
 * Validates: Requirements 3.2
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Trust Modifier Properties', () => {
  it('should apply trust modifier to positive reputation gains', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 1, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Get NPC data to check trust value
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const trustValue = npcData.personality.trust;

          // Set up NPC state with known initial reputation
          const initialRep = 0;
          const npcState = game.getNPCState(npcId);
          npcState.rep = initialRep;
          npcState.lastInteraction = 0;

          // Remove smooth_talker quirk to isolate trust modifier effect
          game.state.ship.quirks =
            game.state.ship.quirks.filter(
              (quirk) => quirk !== 'smooth_talker'
            );

          // Apply reputation change
          game.modifyRep(npcId, reputationGain, 'test');

          // Calculate expected reputation after trust modifier and rounding
          const expectedGain = reputationGain * trustValue;
          const expectedFinalRep = initialRep + expectedGain;
          const actualFinalRep = game.state.npcs[npcId].rep;

          // Expected value should be rounded and clamped
          const clampedExpected = Math.max(
            -100,
            Math.min(100, Math.round(expectedFinalRep))
          );
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply trust modifier to negative reputation changes', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: -50, max: -1 }), // Negative reputation change
        (npcId, reputationChange) => {
          // Set up NPC state with known initial reputation
          const initialRep = 0;
          const npcState = game.getNPCState(npcId);
          npcState.rep = initialRep;
          npcState.lastInteraction = 0;

          // Apply reputation change
          game.modifyRep(npcId, reputationChange, 'test');

          // For negative changes, no trust modifier should be applied
          const expectedFinalRep = initialRep + reputationChange;
          const actualFinalRep = game.state.npcs[npcId].rep;

          // Allow for clamping
          const clampedExpected = Math.max(
            -100,
            Math.min(100, expectedFinalRep)
          );
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply different trust modifiers for different NPCs', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Use Wei Chen (trust: 0.3) and Marcus Cole (trust: 0.1) for comparison
    const weiChenId = 'chen_barnards';
    const marcusColeId = 'cole_sol';

    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Positive reputation gain
        (reputationGain) => {
          // Set up both NPCs with same initial reputation
          const initialRep = 0;
          const weiChenState = game.getNPCState(weiChenId);
          weiChenState.rep = initialRep;
          weiChenState.lastInteraction = 0;

          const marcusState = game.getNPCState(marcusColeId);
          marcusState.rep = initialRep;
          marcusState.lastInteraction = 0;

          // Remove smooth_talker quirk to isolate trust modifier effect
          game.state.ship.quirks =
            game.state.ship.quirks.filter(
              (quirk) => quirk !== 'smooth_talker'
            );

          // Apply same reputation change to both NPCs
          game.modifyRep(weiChenId, reputationGain, 'test');
          game.modifyRep(marcusColeId, reputationGain, 'test');

          // Get final reputations
          const weiChenFinalRep = game.state.npcs[weiChenId].rep;
          const marcusFinalRep = game.state.npcs[marcusColeId].rep;

          // Wei Chen (trust: 0.3) should have higher reputation gain than Marcus (trust: 0.1)
          return weiChenFinalRep > marcusFinalRep;
        }
      ),
      { numRuns: 100 }
    );
  });
});
