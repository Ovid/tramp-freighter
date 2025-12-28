/**
 * Property-based tests for dialogue validation function consistency
 *
 * Feature: dialogue-trees-refactor, Property 3: Validation Function Consistency
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 5.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateRequiredConstants,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
} from '../../src/game/data/dialogue/validation.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';

describe('Dialogue Validation Consistency Properties', () => {
  it('should validate all existing dialogue trees without throwing errors', () => {
    // Test that all existing dialogue trees pass validation
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(ALL_DIALOGUE_TREES)),
        (npcId) => {
          const dialogueTree = ALL_DIALOGUE_TREES[npcId];
          
          try {
            validateDialogueTree(dialogueTree);
            return true; // Validation passed
          } catch (error) {
            // If validation fails, it indicates a problem with existing data
            console.error(`Validation failed for NPC ${npcId}:`, error.message);
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently reject invalid dialogue trees', () => {
    // Generator for invalid dialogue trees
    const arbInvalidTree = fc.oneof(
      fc.constant(null), // null tree
      fc.constant(undefined), // undefined tree
      fc.constant('not an object'), // string instead of object
      fc.constant(42), // number instead of object
      fc.constant({}), // empty object (missing greeting)
      fc.constant({ notGreeting: {} }) // object without greeting node
    );

    fc.assert(
      fc.property(arbInvalidTree, (invalidTree) => {
        try {
          validateDialogueTree(invalidTree);
          return false; // Should have thrown an error
        } catch (error) {
          // Expected behavior - validation should reject invalid trees
          return error instanceof Error && error.message.length > 0;
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should consistently reject invalid dialogue nodes', () => {
    // Generator for invalid dialogue nodes
    const arbInvalidNode = fc.oneof(
      fc.constant(null), // null node
      fc.constant(undefined), // undefined node
      fc.constant('not an object'), // string instead of object
      fc.constant({}), // empty object (missing text and choices)
      fc.constant({ text: 'valid text' }), // missing choices
      fc.constant({ choices: [] }), // missing text
      fc.constant({ text: 42, choices: [] }), // invalid text type
      fc.constant({ text: 'valid', choices: 'not array' }) // invalid choices type
    );

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // nodeId
        arbInvalidNode,
        (nodeId, invalidNode) => {
          try {
            validateDialogueNode(nodeId, invalidNode);
            return false; // Should have thrown an error
          } catch (error) {
            // Expected behavior - validation should reject invalid nodes
            return error instanceof Error && 
                   error.message.length > 0 && 
                   error.message.includes(nodeId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should consistently reject invalid dialogue choices', () => {
    // Generator for invalid dialogue choices
    const arbInvalidChoice = fc.oneof(
      fc.constant(null), // null choice
      fc.constant(undefined), // undefined choice
      fc.constant('not an object'), // string instead of object
      fc.constant({}), // empty object (missing text)
      fc.constant({ text: 42 }), // invalid text type
      fc.constant({ text: 'valid', next: 42 }), // invalid next type
      fc.constant({ text: 'valid', repGain: 'not number' }), // invalid repGain type
      fc.constant({ text: 'valid', condition: 'not function' }), // invalid condition type
      fc.constant({ text: 'valid', action: 'not function' }) // invalid action type
    );

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // nodeId
        fc.integer({ min: 0, max: 10 }), // choiceIndex
        arbInvalidChoice,
        (nodeId, choiceIndex, invalidChoice) => {
          try {
            validateDialogueChoice(nodeId, choiceIndex, invalidChoice);
            return false; // Should have thrown an error
          } catch (error) {
            // Expected behavior - validation should reject invalid choices
            return error instanceof Error && 
                   error.message.length > 0 && 
                   error.message.includes(nodeId) &&
                   error.message.includes(choiceIndex.toString());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid dialogue choices with all optional properties', () => {
    // Generator for valid dialogue choices
    const arbValidChoice = fc.record({
      text: fc.string({ minLength: 1, maxLength: 100 }),
      next: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
      repGain: fc.option(fc.integer({ min: -10, max: 10 }), { nil: undefined }),
      condition: fc.option(fc.constant(() => true), { nil: undefined }), // Valid function
      action: fc.option(fc.constant(() => {}), { nil: undefined }) // Valid function
    });

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // nodeId
        fc.integer({ min: 0, max: 10 }), // choiceIndex
        arbValidChoice,
        (nodeId, choiceIndex, validChoice) => {
          try {
            validateDialogueChoice(nodeId, choiceIndex, validChoice);
            return true; // Validation should pass
          } catch (error) {
            // Unexpected - valid choice should not throw
            console.error(`Unexpected validation error for valid choice:`, error.message);
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate required constants without throwing errors', () => {
    // Test that validateRequiredConstants works with current constants
    fc.assert(
      fc.property(fc.constant(true), () => {
        try {
          validateRequiredConstants();
          return true; // Validation passed
        } catch (error) {
          // If this fails, there's a problem with the constants configuration
          console.error('Required constants validation failed:', error.message);
          return false;
        }
      }),
      { numRuns: 10 } // Only need to run this a few times since constants don't change
    );
  });
});