import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

/**
 * The encounter trigger rules live in the game layer, so they run with no
 * React tree mounted and see the ship as it is after a jump completes.
 *
 * Feature: event-engine, danger encounters
 */

const SOL = 0;
const NEIGHBOUR = WORMHOLE_DATA.find(([a, b]) => a === SOL || b === SOL).find(
  (id) => id !== SOL
);

function newGame() {
  const game = new GameCoordinator(
    STAR_DATA,
    WORMHOLE_DATA,
    new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
  );
  game.initNewGame();
  game.getState().ship.fuel = 100;
  return game;
}

function onlyEvents(game, events) {
  game.eventEngineManager.clearEvents();
  game.eventEngineManager.registerEvents(events);
}

function emissionsOf(spy, name) {
  return spy.mock.calls.filter(([e]) => e === name).map(([, data]) => data);
}

function event(id, type, overrides = {}) {
  return {
    id,
    type,
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 1,
    content: { text: [id] },
    ...overrides,
  };
}

async function jump(game, target) {
  const result = await game.navigationSystem.executeJump(game, target);
  expect(result.success).toBe(true);
}

describe('EncounterTriggerManager', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
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

  it('a jump triggers an encounter with no UI mounted', async () => {
    const game = newGame();
    onlyEvents(game, [
      event('test_pirate', 'jump', {
        category: 'danger',
        encounter: { generator: 'pirate' },
      }),
    ]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const encounters = emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED);
    expect(encounters).toHaveLength(1);
    expect(encounters[0].encounter.systemId).toBe(NEIGHBOUR);
  });

  it('a jump checks time events for the destination, not the origin', async () => {
    const game = newGame();
    onlyEvents(game, [
      event('time_at_origin', 'time', {
        trigger: { system: SOL, condition: null, chance: 1.0 },
      }),
      event('time_at_destination', 'time', {
        trigger: { system: NEIGHBOUR, condition: null, chance: 1.0 },
      }),
    ]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const ids = emissionsOf(emitSpy, EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED).map(
      (n) => n.id
    );
    expect(ids).toEqual(['time_at_destination']);
  });

  it('when a jump fires both a time and a jump narrative, the jump narrative is emitted last', async () => {
    const game = newGame();
    onlyEvents(game, [event('a_time', 'time'), event('a_jump', 'jump')]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const ids = emissionsOf(emitSpy, EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED).map(
      (n) => n.id
    );
    expect(ids).toEqual(['a_time', 'a_jump']);
  });

  it('a jump with no time or jump event falls back to one condition event', async () => {
    const game = newGame();
    onlyEvents(game, [event('a_condition', 'condition')]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const ids = emissionsOf(emitSpy, EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED).map(
      (n) => n.id
    );
    expect(ids).toEqual(['a_condition']);
  });

  it('jump checks see the ship after jump wear', async () => {
    const game = newGame();
    const seen = [];
    vi.spyOn(
      game.mechanicalFailureManager,
      'checkMechanicalFailure'
    ).mockImplementation(() => {
      seen.push(game.getState().ship.hull);
      return null;
    });
    const hullBefore = game.getState().ship.hull;

    await jump(game, NEIGHBOUR);

    expect(seen).toEqual([game.getState().ship.hull]);
    expect(seen[0]).toBeLessThan(hullBefore);
  });

  it('a failing trigger check is logged and does not fail the jump', async () => {
    const game = newGame();
    vi.spyOn(game.eventEngineManager, 'checkEvents').mockImplementation(() => {
      throw new Error('boom');
    });

    await jump(game, NEIGHBOUR);

    expect(game.getState().player.currentSystem).toBe(NEIGHBOUR);
    expect(console.error).toHaveBeenCalled();
  });

  it('starting a new game after reaching another system runs no jump checks', async () => {
    const game = newGame();
    await jump(game, NEIGHBOUR);
    onlyEvents(game, [
      event('test_pirate', 'jump', {
        category: 'danger',
        encounter: { generator: 'pirate' },
      }),
    ]);
    const emitSpy = vi.spyOn(game, 'emit');

    game.initNewGame();

    expect(emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED)).toHaveLength(
      0
    );
  });
});
