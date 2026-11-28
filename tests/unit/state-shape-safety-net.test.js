import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import {
  isVersionCompatible,
  addStateDefaults,
  migrateFromV4_1ToV5,
} from '@game/state/state-validators.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';
import {
  EVENT_NAMES,
  EVENT_STATE_MAP,
  SAVE_FORMAT_VERSION,
} from '@game/constants.js';

// Pins the behaviour that the default state shape, the load-time re-emit and
// the save-version chain must keep while their hand-maintained copies are
// consolidated.

const EMPTY_MISSIONS = {
  active: [],
  completed: [],
  failed: [],
  board: [],
  boardLastRefresh: 0,
  pendingFailureNotices: [],
};

// The events every new game and every load currently re-emits.
const REEMITTED_EVENTS = [
  EVENT_NAMES.CREDITS_CHANGED,
  EVENT_NAMES.DEBT_CHANGED,
  EVENT_NAMES.FUEL_CHANGED,
  EVENT_NAMES.CARGO_CHANGED,
  EVENT_NAMES.HIDDEN_CARGO_CHANGED,
  EVENT_NAMES.LOCATION_CHANGED,
  EVENT_NAMES.TIME_CHANGED,
  EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
  EVENT_NAMES.ACTIVE_EVENTS_CHANGED,
  EVENT_NAMES.SHIP_CONDITION_CHANGED,
  EVENT_NAMES.UPGRADES_CHANGED,
  EVENT_NAMES.CARGO_CAPACITY_CHANGED,
  EVENT_NAMES.FUEL_CAPACITY_CHANGED,
  EVENT_NAMES.QUIRKS_CHANGED,
  EVENT_NAMES.KARMA_CHANGED,
  EVENT_NAMES.FACTION_REP_CHANGED,
  EVENT_NAMES.FINANCE_CHANGED,
  EVENT_NAMES.MISSIONS_CHANGED,
  EVENT_NAMES.QUEST_CHANGED,
  EVENT_NAMES.ACHIEVEMENTS_CHANGED,
  EVENT_NAMES.PREFERENCES_CHANGED,
];

function recordEmits(game) {
  const received = {};
  for (const name of REEMITTED_EVENTS) {
    game.subscribe(name, (data) => {
      received[name] = data;
    });
  }
  return received;
}

describe('state shape safety net', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('save version compatibility', () => {
    it.each(['1.0.0', '2.0.0', '2.1.0', '4.0.0', '4.1.0', SAVE_FORMAT_VERSION])(
      'accepts %s',
      (version) => {
        expect(isVersionCompatible(version)).toBe(true);
      }
    );

    it.each(['0.9.0', '3.0.0', '4.2.0', '5.0.1', '6.0.0', '', undefined])(
      'rejects %s',
      (version) => {
        expect(isVersionCompatible(version)).toBe(false);
      }
    );
  });

  describe('default missions shape', () => {
    it('addStateDefaults gives a save without missions empty mission lists', () => {
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.initNewGame();
      const saved = JSON.parse(JSON.stringify(game.getState()));
      delete saved.missions;

      const result = addStateDefaults(saved, STAR_DATA);

      expect(result.missions).toMatchObject(EMPTY_MISSIONS);
    });

    it('the v4.1 to v5 migration gives a save without missions empty mission lists', () => {
      const result = migrateFromV4_1ToV5({ meta: { version: '4.1.0' } });

      expect(result.meta.version).toBe(SAVE_FORMAT_VERSION);
      expect(result.missions).toMatchObject({
        active: [],
        completed: [],
        failed: [],
        board: [],
        boardLastRefresh: 0,
      });
    });

    it('a new game starts with empty mission lists', () => {
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.initNewGame();

      expect(game.getState().missions).toMatchObject({
        ...EMPTY_MISSIONS,
        completionHistory: [],
      });
    });
  });

  describe('state re-emit', () => {
    it('a new game emits every synced event with the installed state value', () => {
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      const received = recordEmits(game);

      game.initNewGame();

      const state = game.getState();
      for (const name of REEMITTED_EVENTS) {
        expect(received, name).toHaveProperty([name]);
        expect(received[name], name).toEqual(EVENT_STATE_MAP[name](state));
      }
    });

    it('a load emits every synced event with the loaded state value', () => {
      const source = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      source.initNewGame();
      const saved = JSON.parse(JSON.stringify(source.getState()));
      saved.player.credits = 1234;
      saved.player.daysElapsed = 42;
      saved.ship.fuel = 37;

      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.initNewGame();
      const received = recordEmits(game);

      const result = game.restoreState(saved);

      expect(result.success).toBe(true);
      const state = game.getState();
      for (const name of REEMITTED_EVENTS) {
        expect(received, name).toHaveProperty([name]);
        expect(received[name], name).toEqual(EVENT_STATE_MAP[name](state));
      }
      expect(received[EVENT_NAMES.CREDITS_CHANGED]).toBe(1234);
      expect(received[EVENT_NAMES.TIME_CHANGED]).toBe(42);
      expect(received[EVENT_NAMES.FUEL_CHANGED]).toBe(37);
    });
  });
});
