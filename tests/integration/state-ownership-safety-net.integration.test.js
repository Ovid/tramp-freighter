import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

// Pins what cargo writes, the dialogue engine and encounter outcomes do to a
// real game, independent of which object owns the cargo array, what the
// dialogue engine is handed, and whether getState() returns the live root.

const FIXED_NOW = 1_800_000_000_000;

// Twin games must start identical, and new games roll ship quirks with
// Math.random; a fixed sequence per game makes two games the same game.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function newGame() {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(42));
  const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  game.isTestEnvironment = true;
  game.initNewGame();
  return game;
}

const stack = (good, qty, extra = {}) => ({
  good,
  qty,
  buyPrice: 10,
  buySystem: 0,
  buySystemName: 'Sol',
  buyDate: 0,
  ...extra,
});

const strip = ({ qty, good, missionId }) => ({ good, qty, missionId });

describe('State ownership safety net', () => {
  let game;
  let cargoEvents;
  let hiddenEvents;

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    game = newGame();
    cargoEvents = [];
    hiddenEvents = [];
    game.subscribe(EVENT_NAMES.CARGO_CHANGED, (c) => cargoEvents.push(c));
    game.subscribe(EVENT_NAMES.HIDDEN_CARGO_CHANGED, (c) =>
      hiddenEvents.push(c)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const hold = () => game.getShip().cargo.map(strip);
  const hidden = () => game.getShip().hiddenCargo.map(strip);
  const lastCargoEvent = () => cargoEvents.at(-1).map(strip);
  const lastHiddenEvent = () => hiddenEvents.at(-1).map(strip);

  describe('cargo writes', () => {
    it('selling part of a stack lowers it, selling the rest removes it, and the hold is announced each time', () => {
      game.updateCargo([stack('grain', 10), stack('ore', 4)]);

      expect(game.sellGood(0, 3, 20).success).toBe(true);
      expect(hold()).toEqual([
        { good: 'grain', qty: 7, missionId: undefined },
        { good: 'ore', qty: 4, missionId: undefined },
      ]);
      expect(lastCargoEvent()).toEqual(hold());

      expect(game.sellGood(0, 7, 20).success).toBe(true);
      expect(hold()).toEqual([{ good: 'ore', qty: 4, missionId: undefined }]);
      expect(lastCargoEvent()).toEqual(hold());
    });

    it('moving cargo into the hidden hold and back keeps both holds and their announcements in step', () => {
      game.getShip().upgrades = ['smuggler_panels'];
      game.updateCargo([stack('grain', 10)]);

      expect(game.moveToHiddenCargo(0, 4).success).toBe(true);
      expect(hold()).toEqual([{ good: 'grain', qty: 6, missionId: undefined }]);
      expect(hidden()).toEqual([
        { good: 'grain', qty: 4, missionId: undefined },
      ]);
      expect(lastCargoEvent()).toEqual(hold());
      expect(lastHiddenEvent()).toEqual(hidden());

      expect(game.moveToHiddenCargo(0, 6).success).toBe(true);
      expect(hold()).toEqual([]);
      expect(hidden()).toEqual([
        { good: 'grain', qty: 10, missionId: undefined },
      ]);
      expect(lastCargoEvent()).toEqual([]);

      expect(game.moveToRegularCargo(0, 10).success).toBe(true);
      expect(hold()).toEqual([
        { good: 'grain', qty: 10, missionId: undefined },
      ]);
      expect(hidden()).toEqual([]);
      expect(lastCargoEvent()).toEqual(hold());
      expect(lastHiddenEvent()).toEqual([]);
    });

    it('removing cargo for a mission takes from the last matching stacks first and announces the hold', () => {
      game.updateCargo([stack('grain', 5), stack('ore', 2), stack('grain', 3)]);

      expect(game.removeCargoForMission('grain', 4)).toEqual({
        success: true,
      });
      expect(hold()).toEqual([
        { good: 'grain', qty: 4, missionId: undefined },
        { good: 'ore', qty: 2, missionId: undefined },
      ]);
      expect(lastCargoEvent()).toEqual(hold());

      expect(game.removeCargoForMission('ore', 3).success).toBe(false);
      expect(hold()).toEqual([
        { good: 'grain', qty: 4, missionId: undefined },
        { good: 'ore', qty: 2, missionId: undefined },
      ]);
    });

    it('accepting a cargo run loads its cargo and completing it removes that cargo from both holds', () => {
      game.getShip().upgrades = ['smuggler_panels'];
      game.updateCargo([stack('ore', 2)]);
      const here = game.getState().player.currentSystem;
      const mission = {
        id: 'cargo_run_test',
        type: 'delivery',
        title: 'Cargo Run',
        giver: 'station_master',
        giverSystem: here,
        requirements: { destination: here, deadline: 10 },
        destination: { systemId: here, name: 'Here' },
        missionCargo: { good: 'registered_freight', quantity: 6 },
        rewards: { credits: 100 },
        penalties: { failure: {} },
      };

      expect(game.acceptMission(mission).success).toBe(true);
      expect(hold()).toEqual([
        { good: 'ore', qty: 2, missionId: undefined },
        { good: 'registered_freight', qty: 6, missionId: 'cargo_run_test' },
      ]);
      expect(lastCargoEvent()).toEqual(hold());

      expect(game.moveToHiddenCargo(1, 2).success).toBe(true);

      expect(game.completeMission('cargo_run_test').success).toBe(true);
      expect(hold()).toEqual([{ good: 'ore', qty: 2, missionId: undefined }]);
      expect(hidden()).toEqual([]);
      expect(lastCargoEvent()).toEqual(hold());
      expect(lastHiddenEvent()).toEqual([]);
    });
  });

  describe('outcomes read what earlier writes in the same outcome left', () => {
    it('salvage after a percentage cargo loss is added to what survived the loss', () => {
      game.updateCargo([stack('grain', 10)]);

      game.applyEncounterOutcome({
        costs: { cargoPercent: 50 },
        rewards: { cargo: [{ good: 'ore', qty: 2, buyPrice: 0 }] },
      });

      expect(hold()).toEqual([
        { good: 'grain', qty: 5, missionId: undefined },
        { good: 'ore', qty: 2, missionId: undefined },
      ]);
    });

    it('a fuel floor reward is measured against the fuel left after the fuel cost', () => {
      game.updateFuel(50);

      game.applyEncounterOutcome({
        costs: { fuel: 40 },
        rewards: { fuelMinimum: 20 },
      });

      expect(game.getShip().fuel).toBe(20);
    });
  });

  describe('dialogue through the game matches the engine driven by the game itself', () => {
    const profiles = {
      'a new game': () => {},
      'a well-liked, wealthy captain': (g) => {
        g.updateCredits(100000);
        for (const npcId of Object.keys(ALL_DIALOGUE_TREES)) {
          g.modifyRepRaw(npcId, 100, 'test');
        }
      },
    };

    const comparable = (g) => {
      const {
        dialogue: _dialogue,
        meta: _meta,
        ...rest
      } = structuredClone(g.getState());
      return rest;
    };

    const attempt = async (fn) => {
      try {
        return { value: await fn() };
      } catch (error) {
        return { error: String(error) };
      }
    };

    for (const [profileName, setup] of Object.entries(profiles)) {
      it(`every node shows the same for ${profileName}`, async () => {
        for (const [npcId, tree] of Object.entries(ALL_DIALOGUE_TREES)) {
          for (const nodeId of Object.keys(tree)) {
            const viaGame = newGame();
            const direct = newGame();
            setup(viaGame);
            setup(direct);

            const a = await attempt(() => viaGame.startDialogue(npcId, nodeId));
            const b = await attempt(() => showDialogue(npcId, nodeId, direct));

            expect(a, `${npcId}:${nodeId}`).toEqual(b);
            expect(comparable(viaGame), `${npcId}:${nodeId}`).toEqual(
              comparable(direct)
            );
          }
        }
      });

      it(`every choice does the same for ${profileName}`, async () => {
        const errorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        for (const [npcId, tree] of Object.entries(ALL_DIALOGUE_TREES)) {
          for (const [nodeId, node] of Object.entries(tree)) {
            for (let i = 0; i < (node.choices || []).length; i++) {
              const label = `${npcId}:${nodeId}:${i}`;
              const viaGame = newGame();
              const direct = newGame();
              setup(viaGame);
              setup(direct);

              const shownA = await attempt(() =>
                viaGame.startDialogue(npcId, nodeId)
              );
              const shownB = await attempt(() =>
                showDialogue(npcId, nodeId, direct)
              );
              expect(shownA, label).toEqual(shownB);
              if (shownA.error) continue;

              errorSpy.mockClear();
              const a = await attempt(() =>
                viaGame.selectDialogueChoice(npcId, i)
              );
              const errorsA = errorSpy.mock.calls.map(String);
              errorSpy.mockClear();
              const b = await attempt(() => selectChoice(npcId, i, direct));
              const errorsB = errorSpy.mock.calls.map(String);

              // The manager returns a narrower shape than the engine; compare
              // what both report rather than the wrapper.
              const view = (r) =>
                r.error
                  ? r
                  : {
                      success: r.value.success,
                      message: r.value.message,
                      warning: r.value.warning,
                    };
              expect(view(a), label).toEqual(view(b));
              expect(errorsA, label).toEqual(errorsB);
              expect(comparable(viaGame), label).toEqual(comparable(direct));
            }
          }
        }
      }, 60000);
    }
  });
});
