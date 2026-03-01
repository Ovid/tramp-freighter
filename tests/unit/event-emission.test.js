import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES } from '../../src/game/constants.js';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

function makeGSM() {
  const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
  gsm.initNewGame();
  return gsm;
}

describe('Event emission reference equality', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FACTION_REP_CHANGED emits a new object reference each time', () => {
    const gsm = makeGSM();
    const received = [];
    gsm.subscribe(EVENT_NAMES.FACTION_REP_CHANGED, (data) => received.push(data));

    gsm.modifyFactionRep('authorities', 5, 'test');
    gsm.modifyFactionRep('authorities', 5, 'test');

    expect(received.length).toBe(2);
    expect(received[0]).not.toBe(received[1]); // Must be distinct references
  });

  it('MISSIONS_CHANGED emits a new object reference from _emitAllStateEvents', () => {
    const gsm = makeGSM();
    const received = [];
    gsm.subscribe(EVENT_NAMES.MISSIONS_CHANGED, (data) => received.push(data));

    gsm._emitAllStateEvents(gsm.getState());
    gsm._emitAllStateEvents(gsm.getState());

    expect(received.length).toBe(2);
    expect(received[0]).not.toBe(received[1]);
  });
});
