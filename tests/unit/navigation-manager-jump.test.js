import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '@game/game-navigation.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';

const SOL = 0;

describe('Jump execution through the coordinator', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
    );
    game.isTestEnvironment = true;
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('game.executeJump moves the player to a connected system', async () => {
    const dest = game.navigationSystem.getConnectedSystems(SOL)[0];

    const result = await game.executeJump(dest);

    expect(result).toEqual({ success: true, error: null });
    expect(game.getState().player.currentSystem).toBe(dest);
  });

  it('updateLocation rejects an unknown system without changing location or exploration', () => {
    const before = structuredClone(game.getState());

    expect(() => game.updateLocation(99999)).toThrow('Invalid system ID');

    const after = game.getState();
    expect(after.player.currentSystem).toBe(before.player.currentSystem);
    expect(after.world.visitedSystems).toEqual(before.world.visitedSystems);
    expect(after.world.priceKnowledge[99999]).toBeUndefined();
  });

  it('game.previewJump reports the fuel and days the jump then charges', async () => {
    const dest = game.navigationSystem.getConnectedSystems(SOL)[0];
    const fuel0 = game.getState().ship.fuel;
    const day0 = game.getState().player.daysElapsed;

    const preview = game.previewJump(dest);
    await game.executeJump(dest);

    expect(preview.valid).toBe(true);
    expect(preview.distance).toBeGreaterThan(0);
    expect(game.getState().ship.fuel).toBeCloseTo(fuel0 - preview.fuelCost);
    expect(game.getState().player.daysElapsed).toBe(day0 + preview.jumpTime);
  });

  it('game.getRouteIndicator gives hops and summed jump days for a route', () => {
    const dest = game.navigationSystem.getConnectedSystems(SOL)[0];
    const nav = game.navigationSystem;
    const days = nav.calculateJumpTime(
      nav.calculateDistanceBetween(
        STAR_DATA.find((s) => s.id === SOL),
        STAR_DATA.find((s) => s.id === dest)
      )
    );

    expect(game.getRouteIndicator(SOL, dest)).toEqual({
      hops: 1,
      totalDays: days,
    });
    expect(game.getRouteIndicator(SOL, SOL)).toBeNull();
  });
});
