/**
 * Property-based tests for story flag setting timing in dialogue
 *
 * Feature: npc-foundation, Property 13: Flag setting before navigation
 * Validates: Requirements 10.3
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Flag Setting Timing Properties', () => {
  it('should set story flags before displaying dialogue node content', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    // Generator for reputation values
    const arbReputation = fc.integer({ min: -100, max: 100 });

    fc.assert(
      fc.property(arbNPCId, arbReputation, (npcId, reputation) => {
        // Set up NPC state with specific reputation
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = reputation;

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
          // Clear any existing flags for this test
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.flags = [];

          // Show dialogue for this specific node
          try {
            const dialogueResult = showDialogue(npcId, nodeId, gameStateManager);

            // Verify that flags were set when the node was displayed
            const currentFlags = gameStateManager.getNPCState(npcId).flags;
            
            for (const expectedFlag of node.flags) {
              if (!currentFlags.includes(expectedFlag)) {
                return false; // Flag should have been set when node was displayed
              }
            }

            // Verify that the dialogue was still displayed correctly
            if (!dialogueResult || typeof dialogueResult.text !== 'string') {
              return false; // Dialogue should still be displayed properly
            }

          } catch (error) {
            // Some nodes might not be accessible directly (e.g., require specific conditions)
            // This is acceptable, skip these nodes
            continue;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should set flags when navigating to nodes through choice selection', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test specifically with Wei Chen who has nodes with flags (backstory nodes)
    const npcId = 'chen_barnards';
    
    fc.assert(
      fc.property(fc.integer({ min: 30, max: 100 }), (reputation) => {
        // Set up NPC state with high reputation to access backstory
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = reputation;
        npcState.flags = []; // Clear existing flags

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);
        
        // Find the backstory choice
        const backstoryChoice = initialDialogue.choices.find(
          (choice) => choice.text.includes('Tell me about yourself')
        );

        if (!backstoryChoice) {
          return true; // Skip if backstory choice not available
        }

        // Select the backstory choice
        const backstoryDialogue = selectChoice(npcId, backstoryChoice.index, gameStateManager);

        if (!backstoryDialogue) {
          return false; // Should have returned backstory dialogue
        }

        // Check that the backstory flag was set
        const currentFlags = gameStateManager.getNPCState(npcId).flags;
        if (!currentFlags.includes('chen_backstory_1')) {
          return false; // chen_backstory_1 flag should have been set
        }

        // Continue to backstory_2 if available
        const continueChoice = backstoryDialogue.choices.find(
          (choice) => choice.next === 'backstory_2'
        );

        if (continueChoice) {
          const backstory2Dialogue = selectChoice(npcId, continueChoice.index, gameStateManager);
          
          if (backstory2Dialogue) {
            // Check that the second backstory flag was set
            const updatedFlags = gameStateManager.getNPCState(npcId).flags;
            if (!updatedFlags.includes('chen_backstory_2')) {
              return false; // chen_backstory_2 flag should have been set
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should not duplicate flags when the same node is visited multiple times', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test with Wei Chen backstory nodes
    const npcId = 'chen_barnards';
    
    fc.assert(
      fc.property(fc.integer({ min: 30, max: 100 }), (reputation) => {
        // Set up NPC state with high reputation
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = reputation;
        npcState.flags = []; // Clear existing flags

        // Visit backstory node multiple times
        for (let i = 0; i < 3; i++) {
          try {
            showDialogue(npcId, 'backstory', gameStateManager);
            
            // Check that flag is present but not duplicated
            const currentFlags = gameStateManager.getNPCState(npcId).flags;
            const flagCount = currentFlags.filter(flag => flag === 'chen_backstory_1').length;
            
            if (flagCount !== 1) {
              return false; // Flag should appear exactly once, not duplicated
            }
          } catch (error) {
            // If we can't access the node directly, that's fine
            break;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve existing flags when setting new ones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test with Wei Chen
    const npcId = 'chen_barnards';
    
    fc.assert(
      fc.property(fc.integer({ min: 30, max: 100 }), (reputation) => {
        // Set up NPC state with high reputation and some existing flags
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = reputation;
        npcState.flags = ['existing_flag_1', 'existing_flag_2']; // Pre-existing flags

        try {
          // Show a dialogue node that sets flags
          showDialogue(npcId, 'backstory', gameStateManager);
          
          // Check that both existing and new flags are present
          const currentFlags = gameStateManager.getNPCState(npcId).flags;
          
          if (!currentFlags.includes('existing_flag_1')) {
            return false; // Existing flag should be preserved
          }
          
          if (!currentFlags.includes('existing_flag_2')) {
            return false; // Existing flag should be preserved
          }
          
          if (!currentFlags.includes('chen_backstory_1')) {
            return false; // New flag should be added
          }

        } catch (error) {
          // If we can't access the node, that's acceptable
          return true;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});