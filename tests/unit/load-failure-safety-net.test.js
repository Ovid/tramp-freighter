import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SAVE_KEY } from '../../src/game/constants.js';

/**
 * Pins the load-path behaviour that must survive any rework of how load
 * failures are surfaced: a rejected save is never written over by the load
 * itself, and a good save still loads intact.
 *
 * Feature: save-load
 */
describe('Load failure safety net', () => {
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
      clear: vi.fn(() => {
        store = {};
      }),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function validSaveJson() {
    const temp = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    temp.initNewGame();
    const state = temp.getState();
    state.player.credits = 4321;
    state.player.daysElapsed = 17;
    return JSON.stringify(state);
  }

  const rejectedSaves = {
    'unparseable JSON': () => '{not json',
    'incompatible version': () => {
      const state = JSON.parse(validSaveJson());
      state.meta.version = '0.0.1';
      return JSON.stringify(state);
    },
    'failed structure validation': () => {
      const state = JSON.parse(validSaveJson());
      delete state.player;
      return JSON.stringify(state);
    },
  };

  for (const [label, makeSave] of Object.entries(rejectedSaves)) {
    it(`loadGame returns null and leaves the stored save untouched for ${label}`, () => {
      const raw = makeSave();
      store[SAVE_KEY] = raw;
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);

      const result = game.loadGame();

      expect(result).toBeNull();
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(store[SAVE_KEY]).toBe(raw);
    });
  }

  it('loadGame restores a valid save with its values intact', () => {
    store[SAVE_KEY] = validSaveJson();
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);

    const result = game.loadGame();

    expect(result).not.toBeNull();
    expect(game.getState().player.credits).toBe(4321);
    expect(game.getState().player.daysElapsed).toBe(17);
  });

  it('hasSavedGame is true for a valid save and false with no save', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    expect(game.hasSavedGame()).toBe(false);

    store[SAVE_KEY] = validSaveJson();
    expect(game.hasSavedGame()).toBe(true);
  });
});
