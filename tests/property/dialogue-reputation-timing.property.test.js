/**
 * Property-based tests for reputation update timing in dialogue
 *
 * Feature: npc-foundation, Property 12: Reputation update before navigation
 * Validates: Requirements 10.2
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Reputation Update Timing Properties', () => {
  it('should apply reputation changes before advancing to the next dialogue node', () => {
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
        const initialDialogue = showDialogue(
          npcId,
          'greeting',
          gameStateManager
        );
        const availableChoices = initialDialogue.choices;

        // Find choices that have reputation gains and next nodes
        const choicesWithRepGain = availableChoices.filter(
          (choice) => choice.repGain && choice.repGain !== 0 && choice.next
        );

        if (choicesWithRepGain.length === 0) {
          return true; // Skip if no choices with reputation gains
        }

        // Test each choice with reputation gain
        for (const choice of choicesWithRepGain) {
          // Reset dialogue state
          showDialogue(npcId, 'greeting', gameStateManager);

          // Record initial reputation
          const initialRep = gameStateManager.getNPCState(npcId).rep;

          // Select the choice
          const nextDialogue = selectChoice(
            npcId,
            choice.index,
            gameStateManager
          );

          if (!nextDialogue) {
            return false; // Should have returned next dialogue
          }

          // Check that reputation was updated
          const finalRep = gameStateManager.getNPCState(npcId).rep;

          // Calculate expected reputation change (accounting for trust modifier and quirks)
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          let expectedChange = choice.repGain;

          if (expectedChange > 0) {
            // Apply trust modifier for positive gains
            expectedChange *= npcData.personality.trust;

            // Apply smooth_talker quirk if present
            if (
              gameStateManager.getState().ship.quirks.includes('smooth_talker')
            ) {
              expectedChange *= 1.05;
            }
          }

          // Calculate expected final reputation (with clamping)
          const expectedFinalRep = Math.max(
            -100,
            Math.min(100, initialRep + expectedChange)
          );

          // Allow for small floating point differences
          const repDifference = Math.abs(finalRep - expectedFinalRep);
          if (repDifference > 0.01) {
            return false; // Reputation should have been updated correctly
          }

          // The key test: verify that the next dialogue node reflects the updated reputation
          // If the next node has reputation-dependent text, it should use the new reputation
          const nextNodeId = choice.next;
          const nextNode = dialogueTree[nextNodeId];

          if (nextNode && typeof nextNode.text === 'function') {
            // Generate text with the new reputation
            const expectedText = nextNode.text(finalRep);

            if (nextDialogue.text !== expectedText) {
              return false; // Next dialogue should use updated reputation
            }
          }

          // Verify reputation tier in next dialogue reflects updated reputation
          const expectedTier = gameStateManager.getRepTier(finalRep);
          if (nextDialogue.reputationTier.name !== expectedTier.name) {
            return false; // Reputation tier should reflect updated reputation
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should update reputation before evaluating choice conditions in the next node', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test specifically with Wei Chen who has a reputation-gated choice
    const npcId = 'chen_barnards';

    fc.assert(
      fc.property(fc.integer({ min: 25, max: 29 }), (initialRep) => {
        // Set up NPC state with reputation just below the backstory threshold (30)
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = initialRep;

        // Show initial dialogue
        const initialDialogue = showDialogue(
          npcId,
          'greeting',
          gameStateManager
        );

        // Find a choice that gives enough reputation to unlock the backstory choice
        const choicesWithRepGain = initialDialogue.choices.filter(
          (choice) => choice.repGain && choice.repGain > 0 && choice.next
        );

        if (choicesWithRepGain.length === 0) {
          return true; // Skip if no positive reputation choices
        }

        // Select a choice that should increase reputation
        const choice = choicesWithRepGain[0];
        const nextDialogue = selectChoice(
          npcId,
          choice.index,
          gameStateManager
        );

        if (!nextDialogue) {
          return false; // Should have returned next dialogue
        }

        // Check if reputation increased enough to potentially unlock backstory
        const finalRep = gameStateManager.getNPCState(npcId).rep;

        if (finalRep >= 30) {
          // If we now have enough reputation, go back to greeting and check if backstory is available
          const greetingDialogue = showDialogue(
            npcId,
            'greeting',
            gameStateManager
          );
          const backstoryChoice = greetingDialogue.choices.find((c) =>
            c.text.includes('Tell me about yourself')
          );

          if (!backstoryChoice) {
            return false; // Backstory choice should be available with rep >= 30
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
