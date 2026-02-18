import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Danger Flags Increment Properties', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
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
        fc.constantFrom('evasive', 'return_fire', 'dump_cargo', 'distress_call'),
        (choice) => {
          gameStateManager.initNewGame();
          const before =
            gameStateManager.getState().world.dangerFlags.piratesFought;

          gameStateManager.resolveCombatChoice(encounter, choice);

          const after =
            gameStateManager.getState().world.dangerFlags.piratesFought;
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
          gameStateManager.initNewGame();
          const before =
            gameStateManager.getState().world.dangerFlags.piratesNegotiated;

          gameStateManager.resolveNegotiation(encounter, choice, 0.5);

          const after =
            gameStateManager.getState().world.dangerFlags.piratesNegotiated;
          return after === before + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment civiliansSaved on distress respond', () => {
    const before =
      gameStateManager.getState().world.dangerFlags.civiliansSaved;

    gameStateManager.resolveDistressCall({}, 'respond');

    const after = gameStateManager.getState().world.dangerFlags.civiliansSaved;
    expect(after).toBe(before + 1);
  });

  it('should increment civiliansLooted on distress loot', () => {
    const before =
      gameStateManager.getState().world.dangerFlags.civiliansLooted;

    gameStateManager.resolveDistressCall({}, 'loot');

    const after =
      gameStateManager.getState().world.dangerFlags.civiliansLooted;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsBribed on bribe attempt', () => {
    const before =
      gameStateManager.getState().world.dangerFlags.inspectionsBribed;

    gameStateManager.resolveInspection(
      'bribe',
      gameStateManager.getState(),
      0.5
    );

    const after =
      gameStateManager.getState().world.dangerFlags.inspectionsBribed;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsFled on flee inspection', () => {
    const before =
      gameStateManager.getState().world.dangerFlags.inspectionsFled;

    gameStateManager.resolveInspection(
      'flee',
      gameStateManager.getState(),
      0.5
    );

    const after =
      gameStateManager.getState().world.dangerFlags.inspectionsFled;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsPassed on clean cooperate', () => {
    const state = gameStateManager.getState();
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];

    const before = state.world.dangerFlags.inspectionsPassed;

    gameStateManager.resolveInspection('cooperate', state, 0.5);

    const after =
      gameStateManager.getState().world.dangerFlags.inspectionsPassed;
    expect(after).toBe(before + 1);
  });
});
