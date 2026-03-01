import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

function makeGSM() {
  const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
  gsm.initNewGame();
  return gsm;
}

describe('Mission board determinism', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshMissionBoard produces the same board for the same day and system', () => {
    const gsm1 = makeGSM();
    const gsm2 = makeGSM();

    const board1 = gsm1.refreshMissionBoard();
    const board2 = gsm2.refreshMissionBoard();

    expect(board1.length).toBe(board2.length);
    board1.forEach((m, i) => {
      expect(m.type).toBe(board2[i].type);
      expect(m.destination?.id).toBe(board2[i].destination?.id);
      expect(m.good).toBe(board2[i].good);
    });
  });
});
