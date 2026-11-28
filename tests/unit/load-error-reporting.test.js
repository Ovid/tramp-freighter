import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SAVE_KEY } from '../../src/game/constants.js';

/**
 * A rejected save must leave a reason the title screen can show, so the
 * player is told before anything replaces it.
 *
 * Feature: save-load, load failure reporting
 */
describe('Load error reporting', () => {
  let store;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function validState() {
    const temp = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    temp.initNewGame();
    return JSON.parse(JSON.stringify(temp.getState()));
  }

  it('has no load error when there is no save', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    expect(game.getLoadError()).toBeNull();
  });

  it('reports unreadable save data', () => {
    store[SAVE_KEY] = '{not json';
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    expect(game.getLoadError()).toMatch(/could not be read/i);
  });

  it('reports an incompatible save version', () => {
    const state = validState();
    state.meta.version = '0.0.1';
    store[SAVE_KEY] = JSON.stringify(state);
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    expect(game.getLoadError()).toMatch(/0\.0\.1/);
  });

  it('reports a save that fails validation', () => {
    const state = validState();
    delete state.player;
    store[SAVE_KEY] = JSON.stringify(state);
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    expect(game.getLoadError()).toMatch(/validation/i);
  });

  it('reports a restore that throws without exposing the engine error', () => {
    store[SAVE_KEY] = JSON.stringify(validState());
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    vi.spyOn(game, 'restoreState').mockImplementation(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'x').");
    });
    game.loadGame();
    expect(game.getLoadError()).toBe('Save data could not be loaded');
  });

  it('reports a restore that throws with "NPC" in its message like any other', () => {
    store[SAVE_KEY] = JSON.stringify(validState());
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    vi.spyOn(game, 'restoreState').mockImplementationOnce(() => {
      throw new Error('Cannot read NPC portrait');
    });
    expect(game.loadGame()).toBeNull();
    expect(game.getLoadError()).toBe('Save data could not be loaded');
  });

  it('returns no state when restore throws', () => {
    store[SAVE_KEY] = JSON.stringify(validState());
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    vi.spyOn(game, 'restoreState').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(game.loadGame()).toBeNull();
  });

  it('clears the load error after a successful load', () => {
    store[SAVE_KEY] = '{not json';
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    store[SAVE_KEY] = JSON.stringify(validState());
    game.loadGame();
    expect(game.getLoadError()).toBeNull();
  });

  it('clears the load error once a new game is written over the bad save', () => {
    store[SAVE_KEY] = '{not json';
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.loadGame();
    game.initNewGame();
    game.saveGame();
    expect(game.getLoadError()).toBeNull();
  });

  it('clears the load error after a debounced write', () => {
    vi.useFakeTimers();
    try {
      store[SAVE_KEY] = '{not json';
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.loadGame();
      game.initNewGame();
      game.markDirty();
      game.flushSave();
      expect(game.getLoadError()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
