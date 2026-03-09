import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

function makeGSM() {
  const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  gsm.initNewGame();
  return gsm;
}

describe('NPCManager.modifyRep event emission', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('modifyRep emits NPCS_CHANGED event', () => {
    const gsm = makeGSM();
    const received = [];
    gsm.subscribe(EVENT_NAMES.NPCS_CHANGED, (data) => received.push(data));

    gsm.modifyRep('chen_barnards', 10, 'test');

    expect(received.length).toBe(1);
    expect(received[0]).toBeDefined();
  });

  it('modifyRep emits a new object reference each call', () => {
    const gsm = makeGSM();
    const received = [];
    gsm.subscribe(EVENT_NAMES.NPCS_CHANGED, (data) => received.push(data));

    gsm.modifyRep('chen_barnards', 5, 'test');
    gsm.modifyRep('chen_barnards', 5, 'test');

    expect(received.length).toBe(2);
    expect(received[0]).not.toBe(received[1]);
  });
});
