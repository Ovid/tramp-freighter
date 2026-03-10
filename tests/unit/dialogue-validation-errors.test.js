import { describe, it, expect } from 'vitest';
import {
  validateRequiredConstants,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
} from '../../src/game/data/dialogue/validation.js';

describe('validateRequiredConstants error paths', () => {
  it('does not throw with valid constants (smoke test)', () => {
    expect(() => validateRequiredConstants()).not.toThrow();
  });
});

describe('validateDialogueChoice error paths', () => {
  it('throws for null choice', () => {
    expect(() => validateDialogueChoice('node1', 0, null)).toThrow(
      'must be an object'
    );
  });

  it('throws for choice with missing text', () => {
    expect(() => validateDialogueChoice('node1', 0, { next: null })).toThrow(
      'must have text string'
    );
  });

  it('throws for choice with numeric text', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, { text: 123, next: null })
    ).toThrow('must have text string');
  });

  it('throws for choice with non-string, non-null next', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, { text: 'Hello', next: 123 })
    ).toThrow('next must be string or null');
  });

  it('throws for choice with non-number repGain', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, {
        text: 'Hello',
        next: null,
        repGain: 'five',
      })
    ).toThrow('repGain must be number');
  });

  it('throws for choice with non-function condition', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, {
        text: 'Hello',
        next: null,
        condition: 'not_a_function',
      })
    ).toThrow('condition must be function');
  });

  it('throws for choice with non-function action', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, {
        text: 'Hello',
        next: null,
        action: 'not_a_function',
      })
    ).toThrow('action must be function');
  });

  it('accepts valid choice with all optional fields', () => {
    expect(() =>
      validateDialogueChoice('node1', 0, {
        text: 'Hello',
        next: 'node2',
        repGain: 5,
        condition: () => true,
        action: () => {},
      })
    ).not.toThrow();
  });
});

describe('validateDialogueNode error paths', () => {
  it('throws for null node', () => {
    expect(() => validateDialogueNode('test', null)).toThrow(
      'must be an object'
    );
  });

  it('throws for node with missing text', () => {
    expect(() => validateDialogueNode('test', { choices: [] })).toThrow(
      'must have text property'
    );
  });

  it('throws for node with numeric text', () => {
    expect(() =>
      validateDialogueNode('test', { text: 123, choices: [] })
    ).toThrow('text must be string or function');
  });

  it('throws for node with missing choices', () => {
    expect(() => validateDialogueNode('test', { text: 'Hello' })).toThrow(
      'must have choices array'
    );
  });

  it('accepts node with function text', () => {
    expect(() =>
      validateDialogueNode('test', { text: () => 'Hello', choices: [] })
    ).not.toThrow();
  });
});

describe('validateDialogueTree error paths', () => {
  it('throws for null tree', () => {
    expect(() => validateDialogueTree(null)).toThrow('must be an object');
  });

  it('throws for tree missing greeting node', () => {
    expect(() =>
      validateDialogueTree({ other: { text: 'Hi', choices: [] } })
    ).toThrow('must have a greeting node');
  });

  it('accepts valid tree with greeting', () => {
    expect(() =>
      validateDialogueTree({
        greeting: {
          text: 'Hello!',
          choices: [{ text: 'Hi', next: null }],
        },
      })
    ).not.toThrow();
  });
});
