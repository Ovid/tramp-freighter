import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';

const NPC_ID = 'chen_barnards';

describe('selectChoice result shape', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success with the next display for a continuing choice', () => {
    const greeting = showDialogue(NPC_ID, 'greeting', game);
    const choice = greeting.choices.find((c) => c.next);
    const result = selectChoice(NPC_ID, choice.index, game);
    expect(result.success).toBe(true);
    expect(result.display.npcId).toBe(NPC_ID);
    expect(result).not.toHaveProperty('message');
  });

  it('returns success with display null when the dialogue ends', () => {
    const greeting = showDialogue(NPC_ID, 'greeting', game);
    const choice = greeting.choices.find((c) => c.next === null);
    expect(selectChoice(NPC_ID, choice.index, game)).toEqual({
      success: true,
      display: null,
    });
  });

  it('selectDialogueChoice returns { success } and stores the display', async () => {
    await game.startDialogue(NPC_ID, 'greeting');
    const choice = game.getDialogueState().display.choices.find((c) => c.next);
    const result = await game.selectDialogueChoice(NPC_ID, choice.index);
    expect(result.success).toBe(true);
    expect(game.getDialogueState().display.npcId).toBe(NPC_ID);
  });
});
