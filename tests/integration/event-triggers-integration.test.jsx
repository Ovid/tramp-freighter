import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

const SOL = 0;
const NEIGHBOUR = WORMHOLE_DATA.find(([a, b]) => a === SOL || b === SOL).find(
  (id) => id !== SOL
);

describe('Encounter trigger integration', () => {
  let game;
  let emitSpy;

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

    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
    );
    game.initNewGame();
    game.getState().ship.fuel = 100;

    // Spy on emit to track what events are dispatched
    emitSpy = vi.spyOn(game, 'emit');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not trigger encounters when a new game starts', () => {
    game.initNewGame();

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    expect(encounterEmissions).toHaveLength(0);
  });

  it('should process jump events when a jump completes', async () => {
    const result = await game.executeJump(NEIGHBOUR);

    // Whether an encounter fires depends on the seeded roll and event data;
    // the jump must complete without the trigger checks throwing.
    expect(result.success).toBe(true);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should trigger dock event checks when docked event fires', () => {
    emitSpy.mockClear();

    // Simulate docking at Sol (system 0)
    game.emit('docked', { systemId: 0 });

    // dock triggers are checked on docking. dock_sol_first has chance 1.0
    // and first_dock condition, so if Sol isn't in dockedSystems yet it
    // should emit narrativeEventTriggered.
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    expect(narrativeEmissions.length).toBeGreaterThanOrEqual(1);
    expect(narrativeEmissions[0][1]).toHaveProperty('id', 'dock_sol_first');
  });

  it('should route narrative events to narrativeEventTriggered, not encounterTriggered', () => {
    emitSpy.mockClear();

    // dock_sol_first is a narrative event
    game.emit('docked', { systemId: 0 });

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    // Narrative events must NOT go to encounterTriggered
    expect(encounterEmissions).toHaveLength(0);
    // They must go to narrativeEventTriggered
    expect(narrativeEmissions.length).toBeGreaterThanOrEqual(1);
  });

  it('should route danger events to encounterTriggered', async () => {
    // Register a test danger event that always fires on jump
    game.eventEngineManager.registerEvent({
      id: 'test_danger_jump',
      type: 'jump',
      category: 'danger',
      trigger: { system: null, condition: null, chance: 1.0 },
      once: false,
      cooldown: 0,
      priority: 999, // Highest priority so it wins over other events
      encounter: { generator: 'pirate' },
    });

    emitSpy.mockClear();

    await game.executeJump(NEIGHBOUR);

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );

    expect(encounterEmissions.length).toBeGreaterThanOrEqual(1);
    expect(encounterEmissions[0][1]).toHaveProperty('type', 'pirate');
  });

  it('should not trigger an encounter when markVictory moves the player to Delta Pavonis', () => {
    game.eventEngineManager.registerEvent({
      id: 'test_danger_jump_victory',
      type: 'jump',
      category: 'danger',
      trigger: { system: null, condition: null, chance: 1.0 },
      once: false,
      cooldown: 0,
      priority: 999,
      encounter: { generator: 'pirate' },
    });

    emitSpy.mockClear();

    // The Pavonis Run's "Arrive at Delta Pavonis" calls markVictory, which
    // relocates the player. The ending must not be hijacked by an encounter.
    game.markVictory();

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    expect(encounterEmissions).toHaveLength(0);
  });

  it('should ignore docked events with no systemId', () => {
    emitSpy.mockClear();

    game.emit('docked', {});

    game.emit('docked', null);

    // No emissions should occur for malformed dock events
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );
    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );

    expect(narrativeEmissions).toHaveLength(0);
    expect(encounterEmissions).toHaveLength(0);
  });
});
