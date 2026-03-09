import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

function makeGSM() {
  return new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
}

describe('Ship quirk seeding', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('same ship seed always produces the same quirks', () => {
    const gsm1 = makeGSM();
    const gsm2 = makeGSM();

    gsm1.initNewGame('test-seed-abc');
    gsm2.initNewGame('test-seed-abc');

    expect(gsm1.getState().ship.quirks).toEqual(gsm2.getState().ship.quirks);
  });

  // SeededRandom is deterministic: seed-alpha → 3 quirks, seed-beta → 2 quirks
  it('different seeds produce different quirks', () => {
    const gsm1 = makeGSM();
    const gsm2 = makeGSM();

    gsm1.initNewGame('seed-alpha');
    gsm2.initNewGame('seed-beta');

    const q1 = [...gsm1.getState().ship.quirks].sort().join(',');
    const q2 = [...gsm2.getState().ship.quirks].sort().join(',');
    expect(q1).not.toBe(q2);
  });
});
