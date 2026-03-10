import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Danger Flags Increment Properties', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const encounter = {
    id: 'test',
    type: 'pirate',
    threatLevel: 'moderate',
    demandPercent: 20,
  };

  it('should increment piratesFought for any combat resolution', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'evasive',
          'return_fire',
          'dump_cargo',
          'distress_call'
        ),
        (choice) => {
          game.initNewGame();
          const before = game.getState().world.dangerFlags.piratesFought;

          game.resolveCombatChoice(encounter, choice);

          const after = game.getState().world.dangerFlags.piratesFought;
          return after === before + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment piratesNegotiated for any negotiation resolution', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('counter_proposal', 'accept_demand'),
        (choice) => {
          game.initNewGame();
          const before = game.getState().world.dangerFlags.piratesNegotiated;

          game.resolveNegotiation(encounter, choice);

          const after = game.getState().world.dangerFlags.piratesNegotiated;
          return after === before + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment civiliansSaved on distress respond', () => {
    const before = game.getState().world.dangerFlags.civiliansSaved;

    game.resolveDistressCall({}, 'respond');

    const after = game.getState().world.dangerFlags.civiliansSaved;
    expect(after).toBe(before + 1);
  });

  it('should increment civiliansLooted on distress loot', () => {
    const before = game.getState().world.dangerFlags.civiliansLooted;

    game.resolveDistressCall({}, 'loot');

    const after = game.getState().world.dangerFlags.civiliansLooted;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsBribed on bribe attempt', () => {
    const before = game.getState().world.dangerFlags.inspectionsBribed;

    game.resolveInspection('bribe', game.getState());

    const after = game.getState().world.dangerFlags.inspectionsBribed;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsFled on flee inspection', () => {
    const before = game.getState().world.dangerFlags.inspectionsFled;

    game.resolveInspection('flee', game.getState());

    const after = game.getState().world.dangerFlags.inspectionsFled;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsPassed on clean cooperate', () => {
    const state = game.getState();
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];

    const before = state.world.dangerFlags.inspectionsPassed;

    game.resolveInspection('cooperate', state);

    const after = game.getState().world.dangerFlags.inspectionsPassed;
    expect(after).toBe(before + 1);
  });
});
