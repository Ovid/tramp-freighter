/**
 * Property-based tests for dialogue trees export equivalence
 *
 * Feature: dialogue-trees-refactor, Property 1: Export Equivalence
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 5.1, 5.2, 5.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as DialogueTrees from '../../src/game/data/dialogue-trees.js';

describe('Dialogue Export Equivalence Properties', () => {
  it('should export all required validation functions', () => {
    // Verify all validation functions are exported and callable
    expect(typeof DialogueTrees.validateRequiredConstants).toBe('function');
    expect(typeof DialogueTrees.validateDialogueTree).toBe('function');
    expect(typeof DialogueTrees.validateDialogueNode).toBe('function');
    expect(typeof DialogueTrees.validateDialogueChoice).toBe('function');
    expect(typeof DialogueTrees.validateAllDialogueTrees).toBe('function');
  });

  it('should export all 11 NPC dialogue constants with correct names', () => {
    const expectedNPCDialogues = [
      'WEI_CHEN_DIALOGUE',
      'MARCUS_COLE_DIALOGUE',
      'FATHER_OKONKWO_DIALOGUE',
      'WHISPER_DIALOGUE',
      'CAPTAIN_VASQUEZ_DIALOGUE',
      'DR_SARAH_KIM_DIALOGUE',
      'RUSTY_RODRIGUEZ_DIALOGUE',
      'ZARA_OSMAN_DIALOGUE',
      'STATION_MASTER_KOWALSKI_DIALOGUE',
      'LUCKY_LIU_DIALOGUE',
      'YUKI_TANAKA_DIALOGUE',
    ];

    expectedNPCDialogues.forEach((dialogueName) => {
      expect(DialogueTrees[dialogueName]).toBeDefined();
      expect(typeof DialogueTrees[dialogueName]).toBe('object');
      expect(DialogueTrees[dialogueName]).not.toBeNull();
    });
  });

  it('should export ALL_DIALOGUE_TREES with all NPC mappings', () => {
    const expectedNPCIds = [
      'chen_barnards',
      'cole_sol',
      'okonkwo_ross154',
      'whisper_sirius',
      'vasquez_epsilon',
      'kim_tau_ceti',
      'rodriguez_procyon',
      'osman_luyten',
      'kowalski_alpha_centauri',
      'liu_wolf359',
      'tanaka_barnards',
      'yumi_delta_pavonis',
    ];

    expect(DialogueTrees.ALL_DIALOGUE_TREES).toBeDefined();
    expect(typeof DialogueTrees.ALL_DIALOGUE_TREES).toBe('object');
    expect(DialogueTrees.ALL_DIALOGUE_TREES).not.toBeNull();

    // Verify all expected NPC IDs are present
    expectedNPCIds.forEach((npcId) => {
      expect(DialogueTrees.ALL_DIALOGUE_TREES[npcId]).toBeDefined();
      expect(typeof DialogueTrees.ALL_DIALOGUE_TREES[npcId]).toBe('object');
      expect(DialogueTrees.ALL_DIALOGUE_TREES[npcId]).not.toBeNull();
    });

    // Verify no extra NPC IDs are present
    const actualNPCIds = Object.keys(DialogueTrees.ALL_DIALOGUE_TREES);
    expect(actualNPCIds).toHaveLength(expectedNPCIds.length);
    actualNPCIds.forEach((npcId) => {
      expect(expectedNPCIds).toContain(npcId);
    });
  });

  it('should maintain dialogue tree structure consistency across all NPCs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(DialogueTrees.ALL_DIALOGUE_TREES)),
        (npcId) => {
          const dialogueTree = DialogueTrees.ALL_DIALOGUE_TREES[npcId];

          // Every dialogue tree must have a greeting node
          expect(dialogueTree.greeting).toBeDefined();
          expect(typeof dialogueTree.greeting).toBe('object');

          // Every greeting node must have text and choices
          expect(dialogueTree.greeting.text).toBeDefined();
          expect(Array.isArray(dialogueTree.greeting.choices)).toBe(true);

          // Every choice must have text property
          dialogueTree.greeting.choices.forEach((choice) => {
            expect(choice.text).toBeDefined();
            expect(typeof choice.text).toBe('string');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure ALL_DIALOGUE_TREES references match individual exports', () => {
    // Verify that ALL_DIALOGUE_TREES contains the same objects as individual exports
    expect(DialogueTrees.ALL_DIALOGUE_TREES.chen_barnards).toBe(
      DialogueTrees.WEI_CHEN_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.cole_sol).toBe(
      DialogueTrees.MARCUS_COLE_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.okonkwo_ross154).toBe(
      DialogueTrees.FATHER_OKONKWO_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.whisper_sirius).toBe(
      DialogueTrees.WHISPER_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.vasquez_epsilon).toBe(
      DialogueTrees.CAPTAIN_VASQUEZ_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.kim_tau_ceti).toBe(
      DialogueTrees.DR_SARAH_KIM_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.rodriguez_procyon).toBe(
      DialogueTrees.RUSTY_RODRIGUEZ_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.osman_luyten).toBe(
      DialogueTrees.ZARA_OSMAN_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.kowalski_alpha_centauri).toBe(
      DialogueTrees.STATION_MASTER_KOWALSKI_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.liu_wolf359).toBe(
      DialogueTrees.LUCKY_LIU_DIALOGUE
    );
    expect(DialogueTrees.ALL_DIALOGUE_TREES.tanaka_barnards).toBe(
      DialogueTrees.YUKI_TANAKA_DIALOGUE
    );
  });

  it('should allow validation functions to execute without errors on valid data', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(DialogueTrees.ALL_DIALOGUE_TREES)),
        (npcId) => {
          const dialogueTree = DialogueTrees.ALL_DIALOGUE_TREES[npcId];

          // Validation functions should not throw for valid dialogue trees
          expect(() => {
            DialogueTrees.validateDialogueTree(dialogueTree);
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );

    // validateAllDialogueTrees should not throw
    expect(() => {
      DialogueTrees.validateAllDialogueTrees();
    }).not.toThrow();

    // validateRequiredConstants should not throw
    expect(() => {
      DialogueTrees.validateRequiredConstants();
    }).not.toThrow();
  });
});
