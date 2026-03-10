/**
 * Property-based tests for dialogue choice filtering
 *
 * Feature: npc-foundation, Property 10: Dialogue choice filtering
 * Validates: Requirements 9.1, 9.2, 10.6
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import {
  showDialogue,
  buildDialogueContext,
} from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Choice Filtering Properties', () => {
  it('should show only choices whose condition functions return true for the given reputation', () => {
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

        // Build context the same way showDialogue does
        const context = buildDialogueContext(game, npcId);

        // Show dialogue and get filtered choices
        const dialogueResult = showDialogue(npcId, 'greeting', game);
        const availableChoices = dialogueResult.choices;

        // Check each choice in the original dialogue node
        const originalChoices = dialogueTree.greeting.choices;
        for (let i = 0; i < originalChoices.length; i++) {
          const originalChoice = originalChoices[i];
          const isAvailable = availableChoices.some(
            (choice) => choice.index === i
          );

          if (originalChoice.condition) {
            // Choice has condition function - check if visibility matches condition result
            let conditionResult;
            try {
              conditionResult = originalChoice.condition(reputation, context);
            } catch {
              // If condition throws, choice should be hidden
              conditionResult = false;
            }

            expect(isAvailable).toBe(conditionResult);
          } else {
            // Choice has no condition - should always be available
            expect(isAvailable).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should hide choices when condition functions throw exceptions', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Mock console.error to capture expected error messages
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Create a mock dialogue tree with a choice that has a throwing condition
    const mockNPCId = 'chen_barnards';
    const originalTree = ALL_DIALOGUE_TREES[mockNPCId];

    // Temporarily modify the dialogue tree to include a throwing condition
    const originalGreeting = originalTree.greeting;
    const modifiedGreeting = {
      ...originalGreeting,
      choices: [
        ...originalGreeting.choices,
        {
          text: 'Test choice with throwing condition',
          next: null,
          condition: () => {
            throw new Error('Test condition error');
          },
        },
      ],
    };

    // Temporarily replace the greeting node
    originalTree.greeting = modifiedGreeting;

    try {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 100 }), (reputation) => {
          // Set up NPC state with specific reputation
          const npcState = game.getNPCState(mockNPCId);
          npcState.rep = reputation;

          // Show dialogue and get filtered choices
          const dialogueResult = showDialogue(mockNPCId, 'greeting', game);
          const availableChoices = dialogueResult.choices;

          // The choice with throwing condition should not be in available choices
          const throwingChoiceIndex = modifiedGreeting.choices.length - 1;
          const throwingChoiceAvailable = availableChoices.some(
            (choice) => choice.index === throwingChoiceIndex
          );

          expect(throwingChoiceAvailable).toBe(false);
        }),
        { numRuns: 100 }
      );

      // Verify that errors were logged as expected
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(
        'Error in condition function'
      );
    } finally {
      // Restore original greeting node and console.error
      originalTree.greeting = originalGreeting;
      consoleErrorSpy.mockRestore();
    }
  });

  it('should include all choices without condition functions in available choices', () => {
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

        // Show dialogue and get filtered choices
        const dialogueResult = showDialogue(npcId, 'greeting', game);
        const availableChoices = dialogueResult.choices;

        // Check that all choices without conditions are available
        const originalChoices = dialogueTree.greeting.choices;
        for (let i = 0; i < originalChoices.length; i++) {
          const originalChoice = originalChoices[i];

          if (!originalChoice.condition) {
            // Choice has no condition - should be available
            const isAvailable = availableChoices.some(
              (choice) => choice.index === i
            );
            expect(isAvailable).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
