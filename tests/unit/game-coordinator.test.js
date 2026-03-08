import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { GameStateManager } from '@game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('GameCoordinator', () => {
  let coordinator;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    coordinator = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    coordinator.initNewGame();
  });

  it('initializes with valid game state', () => {
    const state = coordinator.getState();
    expect(state).toBeDefined();
    expect(state.player).toBeDefined();
    expect(state.ship).toBeDefined();
    expect(state.world).toBeDefined();
  });

  it('exposes same public methods as GameStateManager wrapper', () => {
    const gsm = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gsm.initNewGame();

    // Get all method names from GameCoordinator prototype (excluding constructor)
    const coordinatorProto = GameCoordinator.prototype;
    const coordinatorDescriptors =
      Object.getOwnPropertyDescriptors(coordinatorProto);
    const coordinatorMethodNames = Object.entries(coordinatorDescriptors)
      .filter(
        ([key, desc]) => key !== 'constructor' && typeof desc.value === 'function'
      )
      .map(([key]) => key);

    const missing = [];
    for (const methodName of coordinatorMethodNames) {
      if (typeof gsm[methodName] !== 'function') {
        missing.push(methodName);
      }
    }

    if (missing.length > 0) {
      console.error('Missing methods on GSM wrapper:', missing);
    }
    expect(missing).toEqual([]);
  });

  it('state is accessible and mutable', () => {
    coordinator.state.player.credits = 9999;
    expect(coordinator.getState().player.credits).toBe(9999);
  });

  it('event system works', () => {
    const handler = vi.fn();
    coordinator.subscribe('creditsChanged', handler);
    coordinator.updateCredits(500);
    expect(handler).toHaveBeenCalledWith(500);
  });

  it('markDirty does not throw', () => {
    expect(() => coordinator.markDirty()).not.toThrow();
  });
});

describe('GameStateManager delegates to GameCoordinator', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('gsm.state proxies to coordinator.state', () => {
    expect(gsm.state).toBe(gsm.coordinator.state);
  });

  it('gsm.starData proxies to coordinator.starData', () => {
    expect(gsm.starData).toBe(gsm.coordinator.starData);
  });

  it('gsm.getState() returns coordinator state', () => {
    expect(gsm.getState()).toBe(gsm.coordinator.getState());
  });

  it('manager references proxy correctly', () => {
    expect(gsm.tradingManager).toBe(gsm.coordinator.tradingManager);
    expect(gsm.shipManager).toBe(gsm.coordinator.shipManager);
    expect(gsm.npcManager).toBe(gsm.coordinator.npcManager);
  });

  it('mutations through gsm affect coordinator state', () => {
    gsm.updateCredits(1234);
    expect(gsm.coordinator.state.player.credits).toBe(1234);
  });
});
