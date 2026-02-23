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

          // Validation should pass for all existing dialogue trees
          expect(() => validateDialogueTree(dialogueTree)).not.toThrow();
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
        // Should throw an Error with a non-empty message
        let thrownError;
        expect(() => {
          try {
            validateDialogueTree(invalidTree);
          } catch (e) {
            thrownError = e;
            throw e;
          }
        }).toThrow();
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message.length).toBeGreaterThan(0);
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
          // Should throw an Error whose message includes the nodeId
          let thrownError;
          expect(() => {
            try {
              validateDialogueNode(nodeId, invalidNode);
            } catch (e) {
              thrownError = e;
              throw e;
            }
          }).toThrow();
          expect(thrownError).toBeInstanceOf(Error);
          expect(thrownError.message.length).toBeGreaterThan(0);
          expect(thrownError.message).toContain(nodeId);
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
          // Should throw an Error whose message includes nodeId and choiceIndex
          let thrownError;
          expect(() => {
            try {
              validateDialogueChoice(nodeId, choiceIndex, invalidChoice);
            } catch (e) {
              thrownError = e;
              throw e;
            }
          }).toThrow();
          expect(thrownError).toBeInstanceOf(Error);
          expect(thrownError.message.length).toBeGreaterThan(0);
          expect(thrownError.message).toContain(nodeId);
          expect(thrownError.message).toContain(choiceIndex.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid dialogue choices with all optional properties', () => {
    // Generator for valid dialogue choices
    const arbValidChoice = fc.record({
      text: fc.string({ minLength: 1, maxLength: 100 }),
      next: fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 1, maxLength: 20 })
      ),
      repGain: fc.option(fc.integer({ min: -10, max: 10 }), { nil: undefined }),
      condition: fc.option(
        fc.constant(() => true),
        { nil: undefined }
      ), // Valid function
      action: fc.option(
        fc.constant(() => {}),
        { nil: undefined }
      ), // Valid function
    });

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // nodeId
        fc.integer({ min: 0, max: 10 }), // choiceIndex
        arbValidChoice,
        (nodeId, choiceIndex, validChoice) => {
          // Validation should pass for valid choices
          expect(() =>
            validateDialogueChoice(nodeId, choiceIndex, validChoice)
          ).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate required constants without throwing errors', () => {
    // Test that validateRequiredConstants works with current constants
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Required constants should validate without errors
        expect(() => validateRequiredConstants()).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
