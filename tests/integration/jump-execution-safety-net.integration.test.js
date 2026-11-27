import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { SAVE_KEY } from '../../src/game/constants';

// Pins what a jump does to a real game, independent of where the jump code
// lives: what it charges, where it leaves the player, what it persists, and
// that the route panel's numbers match the jump's.
const SOL = 0;
const UNCONNECTED = 50;

describe('Jump execution safety net', () => {
  let game;
  let navigationSystem;
  let storage;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k) => storage[k] ?? null),
      setItem: vi.fn((k, v) => {
        storage[k] = v;
      }),
      removeItem: vi.fn((k) => delete storage[k]),
      clear: vi.fn(() => (storage = {})),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.isTestEnvironment = true;
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const target = () => navigationSystem.getConnectedSystems(SOL)[0];

  const validationFor = (targetId) => {
    const s = game.getState();
    return navigationSystem.validateJump(
      s.player.currentSystem,
      targetId,
      s.ship.fuel,
      s.ship.engine,
      game.applyQuirkModifiers.bind(game),
      s.ship.quirks || [],
      game.calculateShipCapabilities().fuelConsumption,
      {
        hull: s.ship.hull,
        engine: s.ship.engine,
        lifeSupport: s.ship.lifeSupport,
      }
    );
  };

  it('a jump charges the validated fuel and time, moves the player, and wears the ship', async () => {
    const dest = target();
    const before = structuredClone(game.getState());
    const validation = validationFor(dest);

    const result = await navigationSystem.executeJump(game, dest);

    const after = game.getState();
    expect(result).toEqual({ success: true, error: null });
    expect(after.ship.fuel).toBeCloseTo(before.ship.fuel - validation.fuelCost);
    expect(after.player.daysElapsed).toBe(
      before.player.daysElapsed + validation.jumpTime
    );
    expect(after.player.currentSystem).toBe(dest);
    expect(after.world.visitedSystems).toContain(dest);
    expect(after.ship.hull).toBeLessThan(before.ship.hull);
    expect(after.ship.lifeSupport).toBeLessThan(before.ship.lifeSupport);
    expect(after.stats.jumpsCompleted).toBe(before.stats.jumpsCompleted + 1);
  });

  it('a completed jump is persisted once pending saves are flushed', async () => {
    const dest = target();

    await navigationSystem.executeJump(game, dest);
    game.flushSave();

    const saved = JSON.parse(storage[SAVE_KEY]);
    expect(saved.player.currentSystem).toBe(dest);
  });

  it('a jump to an unconnected system fails and changes nothing', async () => {
    const before = structuredClone(game.getState());

    const result = await navigationSystem.executeJump(game, UNCONNECTED);

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
    const after = game.getState();
    expect(after.ship.fuel).toBe(before.ship.fuel);
    expect(after.player.currentSystem).toBe(SOL);
    expect(after.player.daysElapsed).toBe(before.player.daysElapsed);
  });

  it('a jump with too little fuel fails and changes nothing', async () => {
    game.updateFuel(0);

    const result = await navigationSystem.executeJump(game, target());

    expect(result.success).toBe(false);
    expect(game.getState().player.currentSystem).toBe(SOL);
    expect(game.getState().ship.fuel).toBe(0);
  });

  it('plays the animation from origin to destination after state is committed', async () => {
    const dest = target();
    const seen = [];
    const animationSystem = {
      playJumpAnimation: vi.fn(async (from, to) => {
        seen.push({ from, to, at: game.getState().player.currentSystem });
      }),
    };

    await navigationSystem.executeJump(game, dest, animationSystem);

    expect(seen).toEqual([{ from: SOL, to: dest, at: dest }]);
  });

  it('a failing animation still leaves the jump committed and allows the next jump', async () => {
    const dest = target();
    const animationSystem = {
      playJumpAnimation: vi.fn(async () => {
        throw new Error('animation failure');
      }),
    };

    await expect(
      navigationSystem.executeJump(game, dest, animationSystem)
    ).rejects.toThrow('animation failure');
    expect(game.getState().player.currentSystem).toBe(dest);

    const back = await navigationSystem.executeJump(game, SOL);
    expect(back.success).toBe(true);
    expect(game.getState().player.currentSystem).toBe(SOL);
  });

  it("the route panel's fuel and time figures match what the jump charges", async () => {
    const dest = target();
    const s = game.getState();
    const from = STAR_DATA.find((x) => x.id === SOL);
    const to = STAR_DATA.find((x) => x.id === dest);
    const distance = navigationSystem.calculateDistanceBetween(from, to);
    const panelFuel = navigationSystem.calculateFuelCostWithCondition(
      distance,
      s.ship.engine,
      game.applyQuirkModifiers.bind(game),
      s.ship.quirks || [],
      game.calculateShipCapabilities().fuelConsumption
    );
    const panelDays = navigationSystem.calculateJumpTimeWithCondition(
      distance,
      s.ship.engine
    );
    const fuelBefore = s.ship.fuel;
    const dayBefore = s.player.daysElapsed;

    await navigationSystem.executeJump(game, dest);

    expect(game.getState().ship.fuel).toBeCloseTo(fuelBefore - panelFuel);
    expect(game.getState().player.daysElapsed).toBe(dayBefore + panelDays);
  });
});
