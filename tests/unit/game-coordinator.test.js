import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
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

  it('exposes expected public API', () => {
    // Verify key manager references are accessible
    expect(coordinator.tradingManager).toBeDefined();
    expect(coordinator.shipManager).toBeDefined();
    expect(coordinator.npcManager).toBeDefined();

    // Verify key methods exist
    expect(typeof coordinator.getState).toBe('function');
    expect(typeof coordinator.updateCredits).toBe('function');
    expect(typeof coordinator.subscribe).toBe('function');
    expect(typeof coordinator.markDirty).toBe('function');
  });

  it('mutations affect state', () => {
    coordinator.updateCredits(1234);
    expect(coordinator.state.player.credits).toBe(1234);
  });
});
