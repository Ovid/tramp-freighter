/**
 * Property-based tests for trust modifier application
 *
 * Feature: npc-foundation, Property 6: Trust modifier application
 * Validates: Requirements 3.2
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Trust Modifier Properties', () => {
  it('should apply trust modifier to positive reputation gains', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 1, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Get NPC data to check trust value
          const npcData = ALL_NPCS.find(npc => npc.id === npcId);
          const trustValue = npcData.personality.trust;

          // Set up NPC state with known initial reputation
          const initialRep = 0;
          gameStateManager.state.npcs[npcId] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };

          // Remove smooth_talker quirk to isolate trust modifier effect
          gameStateManager.state.ship.quirks = gameStateManager.state.ship.quirks.filter(
            quirk => quirk !== 'smooth_talker'
          );

          // Apply reputation change
          gameStateManager.modifyRep(npcId, reputationGain, 'test');

          // Calculate expected reputation after trust modifier
          const expectedGain = reputationGain * trustValue;
          const expectedFinalRep = initialRep + expectedGain;
          const actualFinalRep = gameStateManager.state.npcs[npcId].rep;

          // Allow for floating point precision and clamping
          const clampedExpected = Math.max(-100, Math.min(100, expectedFinalRep));
          return Math.abs(actualFinalRep - clampedExpected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply trust modifier to negative reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: -50, max: -1 }), // Negative reputation change
        (npcId, reputationChange) => {
          // Set up NPC state with known initial reputation
          const initialRep = 0;
          gameStateManager.state.npcs[npcId] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };

          // Apply reputation change
          gameStateManager.modifyRep(npcId, reputationChange, 'test');

          // For negative changes, no trust modifier should be applied
          const expectedFinalRep = initialRep + reputationChange;
          const actualFinalRep = gameStateManager.state.npcs[npcId].rep;

          // Allow for clamping
          const clampedExpected = Math.max(-100, Math.min(100, expectedFinalRep));
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply different trust modifiers for different NPCs', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test with two NPCs that have different trust values
    const npc1 = ALL_NPCS.find(npc => npc.personality.trust !== ALL_NPCS[0].personality.trust);
    const npc2 = ALL_NPCS[0];
    
    if (!npc1) {
      return true; // Skip if all NPCs have same trust value
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Positive reputation gain
        (reputationGain) => {
          // Set up both NPCs with same initial reputation
          const initialRep = 0;
          gameStateManager.state.npcs[npc1.id] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };
          gameStateManager.state.npcs[npc2.id] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };

          // Remove smooth_talker quirk to isolate trust modifier effect
          gameStateManager.state.ship.quirks = gameStateManager.state.ship.quirks.filter(
            quirk => quirk !== 'smooth_talker'
          );

          // Apply same reputation change to both NPCs
          gameStateManager.modifyRep(npc1.id, reputationGain, 'test');
          gameStateManager.modifyRep(npc2.id, reputationGain, 'test');

          // Get final reputations
          const finalRep1 = gameStateManager.state.npcs[npc1.id].rep;
          const finalRep2 = gameStateManager.state.npcs[npc2.id].rep;

          // If trust values are different, final reputations should be different
          if (npc1.personality.trust !== npc2.personality.trust) {
            return finalRep1 !== finalRep2;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});