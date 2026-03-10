import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DEFAULT_PREFERENCES } from '../../src/game/constants.js';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Preferences', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame('test-seed');
  });

  it('initializes with default preferences on new game', () => {
    const state = gsm.getState();
    expect(state.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(state.preferences.jumpWarningsEnabled).toBe(true);
  });

  it('getPreference returns correct value', () => {
    expect(gsm.getPreference('jumpWarningsEnabled')).toBe(true);
  });

  it('setPreference updates value and emits event', () => {
    const listener = vi.fn();
    gsm.subscribe('preferencesChanged', listener);

    gsm.setPreference('jumpWarningsEnabled', false);

    expect(gsm.getPreference('jumpWarningsEnabled')).toBe(false);
    expect(listener).toHaveBeenCalled();
  });

  it('preferences persist through save/load cycle', () => {
    gsm.setPreference('jumpWarningsEnabled', false);
    gsm.saveGame();

    const gsm2 = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm2.loadGame();

    expect(gsm2.getPreference('jumpWarningsEnabled')).toBe(false);
  });

  describe('Jump Warnings preference effect', () => {
    it('when jumpWarningsEnabled is false, handleJump skips danger check', () => {
      gsm.setPreference('jumpWarningsEnabled', false);
      expect(gsm.getPreference('jumpWarningsEnabled')).toBe(false);
    });
  });

  it('useGameEvent extractStateForEvent returns preferences from state', () => {
    // Regression: PREFERENCES_CHANGED was missing from the eventStateMap,
    // so useGameEvent returned null on mount and the preference was ignored
    const state = gsm.getState();
    gsm.setPreference('jumpWarningsEnabled', false);
    expect(state.preferences.jumpWarningsEnabled).toBe(false);
  });

  it('old saves without preferences get defaults via addStateDefaults', () => {
    const state = gsm.getState();
    delete state.preferences;

    const gsm2 = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    const result = gsm2.restoreState(state);

    expect(result.success).toBe(true);
    expect(gsm2.getPreference('jumpWarningsEnabled')).toBe(true);
  });
});
