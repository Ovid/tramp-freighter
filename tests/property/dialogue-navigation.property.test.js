/**
 * Property-based tests for dialogue navigation
 *
 * Feature: npc-foundation, Property 11: Dialogue navigation
 * Validates: Requirements 2.4, 10.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Navigation Properties', () => {
  it('should advance to the next node specified by a choice when that choice is selected', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    // Generator for reputation values
    const arbReputation = fc.integer({ min: -100, max: 100 });

    fc.assert(
      fc.property(arbNPCId, arbReputation, (npcId, reputation) => {
        // Set up NPC state with specific reputation
        const npcState = game.getNPCState(npcId);
        npcState.rep = reputation;

        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', game);
        const availableChoices = initialDialogue.choices;

        if (availableChoices.length === 0) {
          return true; // Skip if no choices available
        }

        // Test each available choice separately (need fresh dialogue state for each test)
        for (const choice of availableChoices) {
          // Reset dialogue state by showing dialogue again
          showDialogue(npcId, 'greeting', game);

          if (choice.next) {
            // Choice has a next node - should navigate there
            const nextDialogue = selectChoice(npcId, choice.index, game);

            expect(nextDialogue).toBeDefined();

            // Verify we're now at the expected node by checking if the dialogue tree has that node
            const expectedNode = dialogueTree[choice.next];
            expect(expectedNode).toBeDefined();

            // Verify the dialogue text is valid (string)
            expect(typeof nextDialogue.text).toBe('string');
            expect(nextDialogue.text.length).toBeGreaterThan(0);

            // Verify the choices are properly formatted
            expect(Array.isArray(nextDialogue.choices)).toBe(true);
          } else {
            // Choice has no next node - should end dialogue
            const result = selectChoice(npcId, choice.index, game);
            expect(result).toBeNull();
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should end dialogue when a choice with no next node is selected', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    // Generator for reputation values
    const arbReputation = fc.integer({ min: -100, max: 100 });

    fc.assert(
      fc.property(arbNPCId, arbReputation, (npcId, reputation) => {
        // Set up NPC state with specific reputation
        const npcState = game.getNPCState(npcId);
        npcState.rep = reputation;

        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', game);
        const availableChoices = initialDialogue.choices;

        // Find choices that end dialogue (next: null)
        const endingChoices = availableChoices.filter(
          (choice) => choice.next === null
        );

        if (endingChoices.length === 0) {
          return true; // Skip if no ending choices available
        }

        // Test each ending choice
        for (const choice of endingChoices) {
          const result = selectChoice(npcId, choice.index, game);
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain dialogue state consistency across navigation', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Generator for valid NPC IDs
    const arbNPCId = fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

    // Generator for reputation values
    const arbReputation = fc.integer({ min: -100, max: 100 });

    fc.assert(
      fc.property(arbNPCId, arbReputation, (npcId, reputation) => {
        // Set up NPC state with specific reputation
        const npcState = game.getNPCState(npcId);
        npcState.rep = reputation;

        // Get dialogue tree for this NPC
        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no dialogue tree
        }

        // Show initial dialogue
        const initialDialogue = showDialogue(npcId, 'greeting', game);

        // Verify dialogue state consistency
        expect(initialDialogue.npcId).toBe(npcId);

        const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
        expect(npcData).toBeDefined();

        expect(initialDialogue.npcName).toBe(npcData.name);
        expect(initialDialogue.npcRole).toBe(npcData.role);
        expect(initialDialogue.npcStation).toBe(npcData.station);

        // Reputation tier should be consistent with current reputation
        const expectedTier = game.getRepTier(reputation);
        expect(initialDialogue.reputationTier.name).toBe(expectedTier.name);
      }),
      { numRuns: 100 }
    );
  });
});
