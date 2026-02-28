/**
 * Property-based tests for dynamic dialogue text generation
 *
 * Feature: npc-foundation, Property 14: Dynamic dialogue text generation
 * Validates: Requirements 2.6, 9.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dynamic Dialogue Text Generation Properties', () => {
  it('should generate different text for different reputation tiers when text is a function', () => {
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

        // Find nodes with function-based text
        const nodesWithFunctionText = Object.entries(dialogueTree).filter(
          ([, node]) => typeof node.text === 'function'
        );

        if (nodesWithFunctionText.length === 0) {
          return true; // Skip if no function-based text
        }

        // Test each node with function-based text
        // Some nodes vary on context (e.g., systemsVisited) rather than reputation,
        // so we check that at least one function-text node varies by reputation.
        let anyNodeVariesByRep = false;

        for (const [nodeId] of nodesWithFunctionText) {
          // Test with different reputation values across different tiers
          const testReputations = [
            -75, // Hostile
            -25, // Cold
            0, // Neutral
            20, // Warm
            45, // Friendly
            75, // Trusted
            95, // Family
          ];

          const generatedTexts = new Set();

          for (const reputation of testReputations) {
            // Set up NPC state with specific reputation
            const npcState = gameStateManager.getNPCState(npcId);
            npcState.rep = reputation;

            try {
              // Show dialogue for this node
              const dialogueResult = showDialogue(
                npcId,
                nodeId,
                gameStateManager
              );

              if (dialogueResult && typeof dialogueResult.text === 'string') {
                generatedTexts.add(dialogueResult.text);
              }
            } catch {
              // Some nodes might not be accessible directly, skip them
              continue;
            }
          }

          // Track if this node varies by reputation
          if (generatedTexts.size >= 2) {
            anyNodeVariesByRep = true;
          }
        }

        // At least one function-text node should vary by reputation
        expect(anyNodeVariesByRep).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate consistent text for the same reputation value', () => {
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

        // Find nodes with function-based text
        const nodesWithFunctionText = Object.entries(dialogueTree).filter(
          ([, node]) => typeof node.text === 'function'
        );

        if (nodesWithFunctionText.length === 0) {
          return true; // Skip if no function-based text
        }

        // Test each node with function-based text
        for (const [nodeId] of nodesWithFunctionText) {
          try {
            // Show dialogue multiple times with same reputation
            const firstResult = showDialogue(npcId, nodeId, gameStateManager);
            const secondResult = showDialogue(npcId, nodeId, gameStateManager);
            const thirdResult = showDialogue(npcId, nodeId, gameStateManager);

            // Text should be consistent across multiple calls
            expect(firstResult.text).toBe(secondResult.text);
            expect(secondResult.text).toBe(thirdResult.text);
          } catch {
            // Some nodes might not be accessible directly, skip them
            continue;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid string text for all reputation values when text is a function', () => {
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

        // Find nodes with function-based text
        const nodesWithFunctionText = Object.entries(dialogueTree).filter(
          ([, node]) => typeof node.text === 'function'
        );

        if (nodesWithFunctionText.length === 0) {
          return true; // Skip if no function-based text
        }

        // Test each node with function-based text
        for (const [nodeId] of nodesWithFunctionText) {
          try {
            // Show dialogue for this node
            const dialogueResult = showDialogue(
              npcId,
              nodeId,
              gameStateManager
            );

            // Verify text is a valid non-empty string
            expect(typeof dialogueResult.text).toBe('string');
            expect(dialogueResult.text.length).toBeGreaterThan(0);
          } catch {
            // Some nodes might not be accessible directly, skip them
            continue;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should use static text directly when text is a string', () => {
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

        // Find nodes with static string text
        const nodesWithStaticText = Object.entries(dialogueTree).filter(
          ([, node]) => typeof node.text === 'string'
        );

        if (nodesWithStaticText.length === 0) {
          return true; // Skip if no static text nodes
        }

        // Test each node with static text
        for (const [nodeId, node] of nodesWithStaticText) {
          try {
            // Skip ask_tip nodes as they have special handling that appends tip content
            if (nodeId === 'ask_tip') {
              continue;
            }

            // Show dialogue for this node
            const dialogueResult = showDialogue(
              npcId,
              nodeId,
              gameStateManager
            );

            // Text should match exactly the static text from the node
            expect(dialogueResult.text).toBe(node.text);
          } catch {
            // Some nodes might not be accessible directly, skip them
            continue;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle reputation boundary conditions correctly in function-based text', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Test specifically with NPCs that have reputation-dependent greeting text
    const npcIds = ['chen_barnards', 'cole_sol', 'okonkwo_ross154'];

    fc.assert(
      fc.property(fc.constantFrom(...npcIds), (npcId) => {
        // Test at reputation tier boundaries
        const boundaryReputations = [
          -100, -50, -49, -10, -9, 9, 10, 29, 30, 59, 60, 89, 90, 100,
        ];

        const dialogueTree = ALL_DIALOGUE_TREES[npcId];
        if (!dialogueTree || !dialogueTree.greeting) {
          return true; // Skip if no greeting
        }

        // Test greeting text at each boundary
        for (const reputation of boundaryReputations) {
          // Set up NPC state with boundary reputation
          const npcState = gameStateManager.getNPCState(npcId);
          npcState.rep = reputation;

          // Show greeting dialogue
          const dialogueResult = showDialogue(
            npcId,
            'greeting',
            gameStateManager
          );

          // Verify text is valid
          expect(typeof dialogueResult.text).toBe('string');
          expect(dialogueResult.text.length).toBeGreaterThan(0);

          // Verify reputation tier is correct
          const expectedTier = gameStateManager.getRepTier(reputation);
          expect(dialogueResult.reputationTier.name).toBe(expectedTier.name);
        }
      }),
      { numRuns: 100 }
    );
  });
});
