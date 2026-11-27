import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';
import { SAVE_KEY } from '@game/constants.js';

describe('saveGame writes immediately', () => {
  let game;
  let storage;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k) => storage[k] ?? null),
      setItem: vi.fn((k, v) => {
        storage[k] = v;
      }),
      removeItem: vi.fn((k) => delete storage[k]),
      clear: vi.fn(() => (storage = {})),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('writes and returns true even straight after another write', () => {
    expect(game.saveGame()).toBe(true);

    game.updateShipName('Second Write');
    expect(game.saveGame()).toBe(true);

    expect(JSON.parse(storage[SAVE_KEY]).ship.name).toBe('Second Write');
  });
});
