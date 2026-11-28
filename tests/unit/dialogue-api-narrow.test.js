import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { DIALOGUE_API } from '@game/state/managers/dialogue.js';

// The dialogue engine gets the calls it makes, not the whole game: it has no
// route to the coordinator or the state root. getPlayer, getShip and
// getNPCState still return live records, so this does not stop a write to them.
describe('DialogueManager hands the dialogue engine a narrow API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives no route to the whole game or its state', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const caps = createTestGame().dialogueManager.capabilities;

    expect(caps.coordinatorRef).toBeUndefined();
    expect(caps.dialogueApi.getState).toBeUndefined();
    expect(caps.dialogueApi.updateCredits).toBeUndefined();
    expect(caps.dialogueApi.requestLoan).toEqual(expect.any(Function));
  });

  it('calls the game method current at call time, so later spies are seen', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const game = createTestGame();
    vi.spyOn(game, 'getKarma').mockReturnValue(99);

    expect(game.dialogueManager.capabilities.dialogueApi.getKarma()).toBe(99);
  });

  it('fails when the game is built if the API names a method the game lacks', () => {
    DIALOGUE_API.push('noSuchMethod');
    try {
      expect(() => createTestGame()).toThrow(/noSuchMethod/);
    } finally {
      DIALOGUE_API.pop();
    }
  });
});
