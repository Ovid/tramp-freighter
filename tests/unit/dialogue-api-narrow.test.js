import { describe, it, expect, vi, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

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
});
