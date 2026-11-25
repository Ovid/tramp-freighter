import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { REPUTATION_BOUNDS, EVENT_NAMES } from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;
const STORE = 0;
const RETRIEVE = 1;

const PICKER_TREE = {
  greeting: {
    text: 'Hello.',
    choices: [{ text: 'Bye.', next: null }],
  },
  storage: {
    text: 'Storage?',
    choices: [
      { text: 'Store it.', next: 'greeting', repGain: 2, picker: 'store' },
      { text: 'Give it back.', next: 'greeting', picker: 'retrieve' },
    ],
  },
};

describe('Dialogue engine picker choices', () => {
  let game;
  let npcState;
  let originalTree;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    originalTree = ALL_DIALOGUE_TREES[NPC_ID];
    ALL_DIALOGUE_TREES[NPC_ID] = PICKER_TREE;
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    showDialogue(NPC_ID, 'storage', game);
  });

  afterEach(() => {
    ALL_DIALOGUE_TREES[NPC_ID] = originalTree;
    vi.restoreAllMocks();
  });

  it('passes picker through showDialogue', () => {
    const display = showDialogue(NPC_ID, 'storage', game);
    expect(display.choices[STORE].picker).toBe('store');
    expect(display.choices[RETRIEVE].picker).toBe('retrieve');
  });

  it('leaves picker off non-picker choices', () => {
    const display = showDialogue(NPC_ID, 'greeting', game);
    expect(display.choices[0]).not.toHaveProperty('picker');
  });

  it('without selections: fails, grants no rep, does not advance', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game);
    expect(result).toEqual({
      success: false,
      message: 'Nothing selected',
      display: null,
    });
    expect(npcState.rep).toBe(repBefore);
    expect(game.getDialogueState().currentNodeId).toBe('storage');
  });

  it('when the manager call fails: grants no rep, does not advance', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game, {
      selections: [{ stackIndex: 0, qty: 99 }],
    });
    expect(result.success).toBe(false);
    expect(npcState.rep).toBe(repBefore);
    expect(game.getDialogueState().currentNodeId).toBe('storage');
    expect(game.getState().ship.cargo[0].qty).toBe(5);
  });

  it('with valid selections: stores, applies repGain, advances', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game, {
      selections: [{ stackIndex: 0, qty: 2 }],
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Stored 2 units with ${NPC_NAME}`);
    expect(result.display.text).toBe('Hello.');
    expect(npcState.rep).toBe(repBefore + 2);
    expect(npcState.storedCargo).toEqual([
      { good: 'grain', qty: 2, buyPrice: 10 },
    ]);
  });

  it('retrieve picker retrieves and grants no rep', () => {
    npcState.storedCargo = [{ good: 'ore', qty: 3, buyPrice: 20 }];
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, RETRIEVE, game, {
      selections: [{ stackIndex: 0, qty: 3 }],
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Retrieved 3 units from ${NPC_NAME}`);
    expect(npcState.rep).toBe(repBefore);
    expect(game.getState().ship.cargo).toContainEqual(
      expect.objectContaining({ good: 'ore', qty: 3, buyPrice: 20 })
    );
    expect(npcState.storedCargo).toEqual([]);
  });

  it('throws on an unknown picker value', () => {
    ALL_DIALOGUE_TREES[NPC_ID] = {
      greeting: {
        text: 'Hello.',
        choices: [{ text: 'Odd.', next: null, picker: 'bogus' }],
      },
    };
    showDialogue(NPC_ID, 'greeting', game);
    expect(() =>
      selectChoice(NPC_ID, 0, game, {
        selections: [{ stackIndex: 0, qty: 1 }],
      })
    ).toThrow(/Unknown picker/);
  });

  it('DialogueManager: a failed picker choice changes nothing and emits nothing', async () => {
    await game.startDialogue(NPC_ID, 'storage');
    const before = structuredClone(game.getDialogueState());
    const emitted = vi.fn();
    game.subscribe(EVENT_NAMES.DIALOGUE_CHANGED, emitted);

    const result = await game.selectDialogueChoice(NPC_ID, STORE, {
      selections: [],
    });

    expect(result).toEqual({ success: false, message: 'Nothing selected' });
    expect(game.getDialogueState()).toEqual(before);
    expect(emitted).not.toHaveBeenCalled();
  });
});
