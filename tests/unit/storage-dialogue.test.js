import { describe, it, expect } from 'vitest';
import { buildStorageDialogue } from '../../src/game/data/dialogue/storage-dialogue.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;
const STORAGE_NPCS = [
  'whisper_sirius',
  'vasquez_epsilon',
  'kim_tau_ceti',
  'rodriguez_procyon',
  'osman_luyten',
  'kowalski_alpha_centauri',
  'liu_wolf359',
];

const lines = {
  requestText: `Up to ${LIMIT} units.`,
  requestFlag: 'test_storage_discussed',
  storeConfirmText: 'Yes please.',
  storeDeclineText: 'No thanks.',
  retrieveText: 'Here it is.',
  retrieveFlag: 'test_cargo_retrieved',
  retrieveDeclineText: 'Later.',
};

const ctx = ({ available = true, stored = [] } = {}) => ({
  canRequestStorage: { available },
  npcState: { storedCargo: stored },
});

describe('buildStorageDialogue', () => {
  const storage = buildStorageDialogue(lines);

  it('gates the store greeting choice on canRequestStorage', () => {
    const choice = storage.storeGreetingChoice;
    expect(choice.next).toBe('request_storage');
    expect(choice.condition(0, ctx({ available: true }))).toBe(true);
    expect(choice.condition(0, ctx({ available: false }))).toBe(false);
  });

  it('gates the retrieve greeting choice on stored cargo', () => {
    const choice = storage.retrieveGreetingChoice;
    expect(choice.next).toBe('retrieve_cargo');
    expect(choice.condition(0, ctx())).toBe(false);
    expect(
      choice.condition(
        0,
        ctx({ stored: [{ good: 'ore', qty: 1, buyPrice: 1 }] })
      )
    ).toBe(true);
  });

  it('builds request_storage with a store picker and repGain 2', () => {
    const node = storage.nodes.request_storage;
    expect(node.text).toBe(lines.requestText);
    expect(node.flags).toEqual(['test_storage_discussed']);
    expect(node.choices[0]).toEqual({
      text: 'Yes please.',
      next: 'greeting',
      repGain: 2,
      picker: 'store',
    });
    expect(node.choices[1].next).toBe('greeting');
  });

  it('builds retrieve_cargo with the shared text and no repGain', () => {
    const node = storage.nodes.retrieve_cargo;
    expect(node.flags).toEqual(['test_cargo_retrieved']);
    expect(node.choices[0]).toEqual({
      text: 'Let me choose what to take.',
      next: 'greeting',
      picker: 'retrieve',
    });
    expect(node.choices[1]).toEqual({ text: 'Later.', next: 'greeting' });
  });
});

describe.each(STORAGE_NPCS)('%s storage dialogue', (npcId) => {
  const tree = ALL_DIALOGUE_TREES[npcId];

  it('uses picker choices, never actions', () => {
    const nodes = [tree.request_storage, tree.retrieve_cargo];
    expect(tree.request_storage.choices[0].picker).toBe('store');
    expect(tree.retrieve_cargo.choices[0].picker).toBe('retrieve');
    for (const node of nodes) {
      for (const choice of node.choices) {
        expect(choice.action).toBeUndefined();
      }
    }
  });

  it('uses the helper confirm choices, not edited old ones', () => {
    // A converted file that kept its old retrieve confirm would show stale
    // text and grant farmable repGain on every retrieve
    expect(tree.request_storage.choices[0].repGain).toBe(2);
    expect(tree.retrieve_cargo.choices[0]).toEqual({
      text: 'Let me choose what to take.',
      next: 'greeting',
      picker: 'retrieve',
    });
  });

  it('states the limit from CARGO_STORAGE_LIMIT', () => {
    expect(tree.request_storage.text).toContain(String(LIMIT));
    expect(tree.request_storage.text).not.toMatch(/\bten\b/i);
  });

  it('has both greeting choices from the helper', () => {
    const store = tree.greeting.choices.find(
      (c) => c.next === 'request_storage'
    );
    const retrieve = tree.greeting.choices.find(
      (c) => c.next === 'retrieve_cargo'
    );
    expect(store.condition(0, ctx({ available: false }))).toBe(false);
    expect(store.condition(0, ctx({ available: true }))).toBe(true);
    expect(retrieve.condition(0, ctx())).toBe(false);
  });
});
