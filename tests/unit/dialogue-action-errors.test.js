import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { selectChoice, showDialogue } from '../../src/game/game-dialogue.js';
import { createTestGameStateManager } from '../test-utils.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';

describe('selectChoice action error handling', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles action returning {success: false} gracefully', () => {
    // Find a real NPC and node, then inject a failing action
    const npcId = 'chen_barnards';
    const dialogue = showDialogue(npcId, 'greeting', gsm);

    // Temporarily inject a failing action into the first choice
    const tree = ALL_DIALOGUE_TREES[npcId];
    const node = tree['greeting'];
    const originalAction = node.choices[0].action;
    node.choices[0].action = () => ({ success: false, message: 'test failure' });

    selectChoice(npcId, 0, gsm);

    // Verify console.warn was called with action failure message
    const warnCalls = console.warn.mock.calls;
    const hasFailureWarn = warnCalls.some(
      (call) => typeof call[0] === 'string' && call[0].includes('action failed')
    );
    expect(hasFailureWarn).toBe(true);

    // Restore
    node.choices[0].action = originalAction;
  });

  it('handles action throwing an error gracefully', () => {
    const npcId = 'chen_barnards';
    showDialogue(npcId, 'greeting', gsm);

    const tree = ALL_DIALOGUE_TREES[npcId];
    const node = tree['greeting'];
    const originalAction = node.choices[0].action;
    node.choices[0].action = () => {
      throw new Error('test action error');
    };

    // Should not throw - error is caught internally
    selectChoice(npcId, 0, gsm);

    const errorCalls = console.error.mock.calls;
    const hasErrorLog = errorCalls.some(
      (call) => typeof call[0] === 'string' && call[0].includes('Error executing dialogue action')
    );
    expect(hasErrorLog).toBe(true);

    // Restore
    node.choices[0].action = originalAction;
  });
});
