/**
 * Property-based tests for dialogue choice filtering
 *
 * Feature: npc-foundation, Property 10: Dialogue choice filtering
 * Validates: Requirements 9.1, 9.2, 10.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Choice Filtering Properties', () => {
  it('should show only choices whose condition functions return true for the given reputation', () => {
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

        // Show dialogue and get filtered choices
        const dialogueResult = showDialogue(npcId, 'greeting', gameStateManager);
        const availableChoices = dialogueResult.choices;

        // Check each choice in the original dialogue node
        const originalChoices = dialogueTree.greeting.choices;
        for (let i = 0; i < originalChoices.length; i++) {
          const originalChoice = originalChoices[i];
          const isAvailable = availableChoices.some((choice) => choice.index === i);

          if (originalChoice.condition) {
            // Choice has condition function - check if visibility matches condition result
            let conditionResult;
            try {
              conditionResult = originalChoice.condition(reputation);
            } catch (error) {
              // If condition throws, choice should be hidden
              conditionResult = false;
            }

            if (isAvailable !== conditionResult) {
              return false; // Choice visibility doesn't match condition result
            }
          } else {
            // Choice has no condition - should always be available
            if (!isAvailable) {
              return false; // Choice without condition should be visible
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should hide choices when condition functions throw exceptions', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Mock console.error to capture expected error messages
    const originalConsoleError = console.error;
    const errorMessages = [];
    console.error = (...args) => {
      errorMessages.push(args);
    };

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
          const npcState = gameStateManager.getNPCState(mockNPCId);
          npcState.rep = reputation;

          // Show dialogue and get filtered choices
          const dialogueResult = showDialogue(mockNPCId, 'greeting', gameStateManager);
          const availableChoices = dialogueResult.choices;

          // The choice with throwing condition should not be in available choices
          const throwingChoiceIndex = modifiedGreeting.choices.length - 1;
          const throwingChoiceAvailable = availableChoices.some(
            (choice) => choice.index === throwingChoiceIndex
          );

          return !throwingChoiceAvailable; // Should be false (choice hidden)
        }),
        { numRuns: 100 }
      );

      // Verify that errors were logged as expected
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(errorMessages[0][0]).toContain('Error in condition function');
    } finally {
      // Restore original greeting node and console.error
      originalTree.greeting = originalGreeting;
      console.error = originalConsoleError;
    }
  });

  it('should include all choices without condition functions in available choices', () => {
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

        // Show dialogue and get filtered choices
        const dialogueResult = showDialogue(npcId, 'greeting', gameStateManager);
        const availableChoices = dialogueResult.choices;

        // Check that all choices without conditions are available
        const originalChoices = dialogueTree.greeting.choices;
        for (let i = 0; i < originalChoices.length; i++) {
          const originalChoice = originalChoices[i];
          
          if (!originalChoice.condition) {
            // Choice has no condition - should be available
            const isAvailable = availableChoices.some((choice) => choice.index === i);
            if (!isAvailable) {
              return false; // Choice without condition should be visible
            }
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});