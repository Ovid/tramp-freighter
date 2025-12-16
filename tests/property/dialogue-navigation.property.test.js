/**
 * Property-based tests for dialogue navigation
 *
 * Feature: npc-foundation, Property 11: Dialogue navigation
 * Validates: Requirements 2.4, 10.4
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Navigation Properties', () => {
  it('should advance to the next node specified by a choice when that choice is selected', () => {
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
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);
        const availableChoices = initialDialogue.choices;

        if (availableChoices.length === 0) {
          return true; // Skip if no choices available
        }

        // Test each available choice separately (need fresh dialogue state for each test)
        for (const choice of availableChoices) {
          // Reset dialogue state by showing dialogue again
          showDialogue(npcId, 'greeting', gameStateManager);
          
          if (choice.next) {
            // Choice has a next node - should navigate there
            const nextDialogue = selectChoice(npcId, choice.index, gameStateManager);
            
            if (!nextDialogue) {
              return false; // Should have returned dialogue for next node
            }

            // Verify we're now at the expected node by checking if the dialogue tree has that node
            const expectedNode = dialogueTree[choice.next];
            if (!expectedNode) {
              return false; // Next node should exist in dialogue tree
            }

            // Verify the dialogue text is valid (string)
            if (typeof nextDialogue.text !== 'string' || nextDialogue.text.length === 0) {
              return false; // Should have valid text
            }

            // Verify the choices are properly formatted
            if (!Array.isArray(nextDialogue.choices)) {
              return false; // Should have choices array
            }
          } else {
            // Choice has no next node - should end dialogue
            const result = selectChoice(npcId, choice.index, gameStateManager);
            if (result !== null) {
              return false; // Should return null to end dialogue
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should end dialogue when a choice with no next node is selected', () => {
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
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);
        const availableChoices = initialDialogue.choices;

        // Find choices that end dialogue (next: null)
        const endingChoices = availableChoices.filter((choice) => choice.next === null);

        if (endingChoices.length === 0) {
          return true; // Skip if no ending choices available
        }

        // Test each ending choice
        for (const choice of endingChoices) {
          const result = selectChoice(npcId, choice.index, gameStateManager);
          if (result !== null) {
            return false; // Should return null to end dialogue
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain dialogue state consistency across navigation', () => {
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
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);
        
        // Verify dialogue state consistency
        if (initialDialogue.npcId !== npcId) {
          return false; // NPC ID should match
        }

        const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
        if (!npcData) {
          return false; // NPC data should exist
        }

        if (initialDialogue.npcName !== npcData.name) {
          return false; // NPC name should match
        }

        if (initialDialogue.npcRole !== npcData.role) {
          return false; // NPC role should match
        }

        if (initialDialogue.npcStation !== npcData.station) {
          return false; // NPC station should match
        }

        // Reputation tier should be consistent with current reputation
        const expectedTier = gameStateManager.getRepTier(reputation);
        if (initialDialogue.reputationTier.name !== expectedTier.name) {
          return false; // Reputation tier should match
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});