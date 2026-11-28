import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import {
  addStateDefaults,
  applyMigrations,
  isVersionCompatible,
  migrateFromV4_1ToV5,
  MIGRATABLE_VERSIONS,
} from '@game/state/state-validators.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';
import {
  EVENT_NAMES,
  EVENT_STATE_MAP,
  SAVE_FORMAT_VERSION,
} from '@game/constants.js';

// New games, defaulted saves and migrated saves must agree on the state
// shape, so a field added to one source cannot be forgotten in the others.

describe('default state sources agree', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function newGameMissions() {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    return game.getState().missions;
  }

  it('addStateDefaults gives a save without missions the new-game shape', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    const saved = JSON.parse(JSON.stringify(game.getState()));
    delete saved.missions;

    expect(addStateDefaults(saved, STAR_DATA).missions).toEqual(
      newGameMissions()
    );
  });

  it('a load re-emits every synced event except the ones nothing emits yet', () => {
    // Nothing in the game emits these two at all (see docs/backlog.md), so
    // re-emitting them on load would make a stale value look live.
    const NEVER_EMITTED = [
      EVENT_NAMES.CURRENT_SYSTEM_CHANGED,
      EVENT_NAMES.INTELLIGENCE_CHANGED,
    ];
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    const emitted = new Set();
    vi.spyOn(game, 'emit').mockImplementation((name) => emitted.add(name));

    game._emitAllStateEvents(game.getState());

    const missing = Object.keys(EVENT_STATE_MAP).filter(
      (name) => !emitted.has(name) && !NEVER_EMITTED.includes(name)
    );
    expect(missing).toEqual([]);
  });

  it('re-emitted dialogue and NPC payloads are copies, not live state', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    const received = {};
    game.subscribe(EVENT_NAMES.DIALOGUE_CHANGED, (d) => {
      received.dialogue = d;
    });
    game.subscribe(EVENT_NAMES.NPCS_CHANGED, (n) => {
      received.npcs = n;
    });

    game._emitAllStateEvents(game.getState());

    expect(received.dialogue).toEqual(game.getState().dialogue);
    expect(received.dialogue).not.toBe(game.getState().dialogue);
    expect(received.npcs).toEqual(game.getState().npcs);
    expect(received.npcs).not.toBe(game.getState().npcs);
  });

  it('the v4.1 to v5 migration gives the new-game missions shape', () => {
    const result = migrateFromV4_1ToV5({ meta: { version: '4.1.0' } });

    expect(result.missions).toEqual(newGameMissions());
  });

  it('accepts exactly the current version and the versions the chain migrates', () => {
    for (const version of MIGRATABLE_VERSIONS) {
      expect(isVersionCompatible(version), version).toBe(true);
    }
    expect(MIGRATABLE_VERSIONS).toEqual([
      '1.0.0',
      '2.0.0',
      '2.1.0',
      '4.0.0',
      '4.1.0',
    ]);
    expect(isVersionCompatible('toString')).toBe(false);
  });

  it('applyMigrations brings a v4.1 save to the current version', () => {
    const result = applyMigrations({ meta: { version: '4.1.0' } }, STAR_DATA);

    expect(result.meta.version).toBe(SAVE_FORMAT_VERSION);
  });
});
