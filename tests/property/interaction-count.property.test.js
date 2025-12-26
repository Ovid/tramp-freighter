/**
 * Property-based tests for interaction count monotonicity
 *
 * Feature: npc-foundation, Property 8: Interaction count monotonicity
 * Validates: Requirements 5.3
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Interaction Count Properties', () => {
  it('should increment interaction count by exactly one for each reputation modification', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 1, max: 10 }), // Number of modifications
        (npcId, numModifications) => {
          // Set up NPC state with known initial interaction count
          const initialCount = 0;
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = 0;
          npcState.interactions = initialCount;

          // Apply multiple reputation modifications
          for (let i = 0; i < numModifications; i++) {
            gameStateManager.modifyRep(npcId, 1, 'test');
          }

          // Check that interaction count increased by exactly the number of modifications
          const finalCount = gameStateManager.state.npcs[npcId].interactions;
          return finalCount === initialCount + numModifications;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment interaction count for both positive and negative reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.array(fc.integer({ min: -10, max: 10 }), {
          minLength: 1,
          maxLength: 5,
        }), // Array of reputation changes
        (npcId, reputationChanges) => {
          // Set up NPC state with known initial interaction count
          const initialCount = 0;
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = 0;
          npcState.interactions = initialCount;

          // Apply all reputation changes
          for (const change of reputationChanges) {
            gameStateManager.modifyRep(npcId, change, 'test');
          }

          // Check that interaction count increased by exactly the number of changes
          const finalCount = gameStateManager.state.npcs[npcId].interactions;
          return finalCount === initialCount + reputationChanges.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain separate interaction counts for different NPCs', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Use first two NPCs for testing
    const npc1Id = ALL_NPCS[0].id;
    const npc2Id = ALL_NPCS[1].id;

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Modifications for NPC 1
        fc.integer({ min: 1, max: 5 }), // Modifications for NPC 2
        (npc1Mods, npc2Mods) => {
          // Set up both NPCs with initial interaction counts
          const npc1State = gameStateManager.getNPCState(npc1Id);
          npc1State.rep = 0;
          npc1State.lastInteraction = 0;
          npc1State.interactions = 0;

          const npc2State = gameStateManager.getNPCState(npc2Id);
          npc2State.rep = 0;
          npc2State.lastInteraction = 0;
          npc2State.interactions = 0;

          // Apply modifications to NPC 1
          for (let i = 0; i < npc1Mods; i++) {
            gameStateManager.modifyRep(npc1Id, 1, 'test');
          }

          // Apply modifications to NPC 2
          for (let i = 0; i < npc2Mods; i++) {
            gameStateManager.modifyRep(npc2Id, 1, 'test');
          }

          // Check that each NPC has the correct interaction count
          const npc1Count = gameStateManager.state.npcs[npc1Id].interactions;
          const npc2Count = gameStateManager.state.npcs[npc2Id].interactions;

          return npc1Count === npc1Mods && npc2Count === npc2Mods;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never decrease interaction count', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 0, max: 10 }), // Initial interaction count
        fc.array(fc.integer({ min: -20, max: 20 }), {
          minLength: 1,
          maxLength: 10,
        }), // Reputation changes
        (npcId, initialCount, reputationChanges) => {
          // Set up NPC state with initial interaction count
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = 0;
          npcState.interactions = initialCount;

          let previousCount = initialCount;

          // Apply reputation changes one by one and check monotonicity
          for (const change of reputationChanges) {
            gameStateManager.modifyRep(npcId, change, 'test');
            const currentCount =
              gameStateManager.state.npcs[npcId].interactions;

            // Count should never decrease and should increase by exactly 1
            if (
              currentCount < previousCount ||
              currentCount !== previousCount + 1
            ) {
              return false;
            }

            previousCount = currentCount;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
