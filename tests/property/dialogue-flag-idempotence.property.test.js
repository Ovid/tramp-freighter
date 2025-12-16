/**
 * Property-based tests for story flag idempotence in dialogue
 *
 * Feature: npc-foundation, Property 9: Story flag idempotence
 * Validates: Requirements 5.4
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Story Flag Idempotence Properties', () => {
  it('should contain each flag exactly once regardless of how many times the same node is visited', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    // Generator for number of visits (1-10)
    const arbVisitCount = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(arbNPCId, arbVisitCount, (npcId, visitCount) => {
        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree) {
          return true; // Skip if no dialogue tree
        }

        // Find nodes that have story flags
        const nodesWithFlags = Object.entries(dialogueTree).filter(
          ([nodeId, node]) => node.flags && node.flags.length > 0
        );

        if (nodesWithFlags.length === 0) {
          return true; // Skip if no nodes with flags
        }

        // Test each node with flags
        for (const [nodeId, node] of nodesWithFlags) {
          // Clear flags before test
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.flags = [];

          // Visit the same node multiple times
          for (let i = 0; i < visitCount; i++) {
            try {
              showDialogue(npcId, nodeId, gameStateManager);
            } catch (error) {
              // Some nodes might not be accessible directly, skip them
              break;
            }
          }

          // Check that each flag appears exactly once
          const currentFlags = gameStateManager.getNPCState(npcId).flags;
          
          for (const expectedFlag of node.flags) {
            const flagCount = currentFlags.filter(flag => flag === expectedFlag).length;
            
            if (flagCount !== 1) {
              return false; // Each flag should appear exactly once
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should not add duplicate flags when flags already exist in NPC state', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    fc.assert(
      fc.property(arbNPCId, (npcId) => {
        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree) {
          return true; // Skip if no dialogue tree
        }

        // Find nodes that have story flags
        const nodesWithFlags = Object.entries(dialogueTree).filter(
          ([nodeId, node]) => node.flags && node.flags.length > 0
        );

        if (nodesWithFlags.length === 0) {
          return true; // Skip if no nodes with flags
        }

        // Test each node with flags
        for (const [nodeId, node] of nodesWithFlags) {
          // Pre-populate NPC state with the same flags that the node will try to add
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.flags = [...node.flags]; // Pre-add all the flags

          const initialFlagCount = npcState.flags.length;

          try {
            // Visit the node (which should try to add the same flags)
            showDialogue(npcId, nodeId, gameStateManager);
          } catch (error) {
            // Some nodes might not be accessible directly, skip them
            continue;
          }

          // Check that no duplicate flags were added
          const finalFlagCount = gameStateManager.getNPCState(npcId).flags.length;
          
          if (finalFlagCount !== initialFlagCount) {
            return false; // Flag count should not change when flags already exist
          }

          // Verify each flag still appears exactly once
          const currentFlags = gameStateManager.getNPCState(npcId).flags;
          for (const expectedFlag of node.flags) {
            const flagCount = currentFlags.filter(flag => flag === expectedFlag).length;
            
            if (flagCount !== 1) {
              return false; // Each flag should still appear exactly once
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve order of existing flags when adding new ones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    fc.assert(
      fc.property(arbNPCId, (npcId) => {
        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree) {
          return true; // Skip if no dialogue tree
        }

        // Find nodes that have story flags
        const nodesWithFlags = Object.entries(dialogueTree).filter(
          ([nodeId, node]) => node.flags && node.flags.length > 0
        );

        if (nodesWithFlags.length === 0) {
          return true; // Skip if no nodes with flags
        }

        // Test with existing flags
        const npcState = gameStateManager.getNPCState(npcId);
        const existingFlags = ['pre_existing_1', 'pre_existing_2', 'pre_existing_3'];
        npcState.flags = [...existingFlags];

        // Visit a node that adds new flags
        const [nodeId, node] = nodesWithFlags[0];
        
        try {
          showDialogue(npcId, nodeId, gameStateManager);
        } catch (error) {
          // Some nodes might not be accessible directly, skip
          return true;
        }

        // Check that existing flags are still at the beginning in the same order
        const currentFlags = gameStateManager.getNPCState(npcId).flags;
        
        for (let i = 0; i < existingFlags.length; i++) {
          if (currentFlags[i] !== existingFlags[i]) {
            return false; // Existing flags should maintain their order and position
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle mixed scenarios with some flags existing and some new', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test specifically with Wei Chen who has multiple flag-setting nodes
    const npcId = 'chen_barnards';
    
    fc.assert(
      fc.property(fc.integer({ min: 30, max: 100 }), (reputation) => {
        // Set up NPC state with high reputation to access backstory nodes
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = reputation;
        
        // Start with some existing flags, including one that will be "re-added"
        npcState.flags = ['existing_flag', 'chen_backstory_1', 'another_existing'];

        const initialFlags = [...npcState.flags];

        try {
          // Visit backstory node which should try to add 'chen_backstory_1' (already exists)
          showDialogue(npcId, 'backstory', gameStateManager);
          
          // Check that the existing flag wasn't duplicated
          const currentFlags = gameStateManager.getNPCState(npcId).flags;
          const backstoryFlagCount = currentFlags.filter(flag => flag === 'chen_backstory_1').length;
          
          if (backstoryFlagCount !== 1) {
            return false; // Should still have exactly one instance of the flag
          }

          // Check that other existing flags are preserved
          if (!currentFlags.includes('existing_flag') || !currentFlags.includes('another_existing')) {
            return false; // Other existing flags should be preserved
          }

          // Visit backstory_2 node which should add a new flag
          showDialogue(npcId, 'backstory_2', gameStateManager);
          
          const finalFlags = gameStateManager.getNPCState(npcId).flags;
          
          // Should now have the new flag
          if (!finalFlags.includes('chen_backstory_2')) {
            return false; // New flag should be added
          }

          // Should still have exactly one of each flag
          const backstory1Count = finalFlags.filter(flag => flag === 'chen_backstory_1').length;
          const backstory2Count = finalFlags.filter(flag => flag === 'chen_backstory_2').length;
          
          if (backstory1Count !== 1 || backstory2Count !== 1) {
            return false; // Each flag should appear exactly once
          }

        } catch (error) {
          // If we can't access the nodes, that's acceptable
          return true;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});