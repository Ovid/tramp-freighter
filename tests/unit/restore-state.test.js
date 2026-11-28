import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { SAVE_FORMAT_VERSION } from '../../src/game/constants.js';

describe('GameCoordinator.restoreState', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps the previous state when a post-install step throws', () => {
    manager.initNewGame();
    const previous = manager.getState();
    const incoming = JSON.parse(JSON.stringify(previous));
    incoming.player.credits = previous.player.credits + 1234;
    vi.spyOn(
      manager.achievementsManager,
      'checkAchievements'
    ).mockImplementation(() => {
      throw new Error('boom');
    });
    const credits = [];
    const days = [];
    manager.subscribe('creditsChanged', (c) => credits.push(c));
    manager.subscribe('timeChanged', (d) => days.push(d));

    expect(() => manager.restoreState(incoming)).toThrow('boom');
    expect(manager.getState()).toBe(previous);
    // Nothing was emitted, so no subscriber (including the time-based
    // encounter trigger) ever acted on the rejected save
    expect(credits).toEqual([]);
    expect(days).toEqual([]);
  });

  it('re-emits the previous state when emitting the incoming one throws', () => {
    manager.initNewGame();
    const previous = manager.getState();
    const incoming = JSON.parse(JSON.stringify(previous));
    incoming.player.credits = previous.player.credits + 1234;
    const realCapacity = manager.shipManager.getFuelCapacity.bind(
      manager.shipManager
    );
    let calls = 0;
    vi.spyOn(manager.shipManager, 'getFuelCapacity').mockImplementation(() => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
      return realCapacity();
    });
    const credits = [];
    manager.subscribe('creditsChanged', (c) => credits.push(c));

    expect(() => manager.restoreState(incoming)).toThrow('boom');
    expect(manager.getState()).toBe(previous);
    // Subscribers that saw the incoming values are told the previous ones again
    expect(credits).toEqual([incoming.player.credits, previous.player.credits]);
  });

  it('restores valid current-version state and returns success', () => {
    // Generate valid state from a separate manager to avoid direct .state mutation
    const sourceManager = new GameCoordinator(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );
    sourceManager.initNewGame();
    const validState = structuredClone(sourceManager.state);

    // manager starts with null state from constructor
    const result = manager.restoreState(validState);

    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(manager.state).not.toBeNull();
    expect(manager.state.player.credits).toBe(validState.player.credits);
    expect(manager.state.meta.version).toBe(SAVE_FORMAT_VERSION);
  });

  it('rejects null input', () => {
    const result = manager.restoreState(null);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('No state data');
  });

  it('rejects incompatible version', () => {
    const result = manager.restoreState({
      meta: { version: '99.0.0', timestamp: Date.now() },
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Incompatible save version');
  });

  it.each([[5], ['text'], [{}], [{ meta: {} }]])(
    'calls a save with no version corrupted, not incompatible: %j',
    (raw) => {
      const result = manager.restoreState(raw);
      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/corrupted/i);
    }
  );

  it('rejects state that fails structure validation', () => {
    const result = manager.restoreState({
      meta: { version: SAVE_FORMAT_VERSION, timestamp: Date.now() },
      player: { credits: 'not-a-number' },
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('structure validation');
  });

  // Regression (issue #57): credits once became NaN, which JSON persists as
  // null; such saves were rejected outright and the game was lost.
  it('repairs null credits (persisted NaN) instead of rejecting the save', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sourceManager = new GameCoordinator(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );
    sourceManager.initNewGame();
    sourceManager.state.player.credits = NaN;
    const corrupted = JSON.parse(JSON.stringify(sourceManager.state));

    const result = manager.restoreState(corrupted);

    expect(result.success).toBe(true);
    expect(manager.state.player.credits).toBe(0);
  });

  it('migrates v1.0.0 state to current version', () => {
    const v1State = {
      player: { credits: 500, debt: 5000, currentSystem: 0, daysElapsed: 5 },
      ship: {
        name: 'Old Ship',
        fuel: 80,
        cargoCapacity: 50,
        cargo: [{ good: 'grain', qty: 10, purchasePrice: 15 }],
      },
      world: { visitedSystems: [0] },
      meta: { version: '1.0.0', timestamp: Date.now() },
    };

    const result = manager.restoreState(v1State);

    expect(result.success).toBe(true);
    expect(result.state.meta.version).toBe(SAVE_FORMAT_VERSION);
    // v1 migration adds ship condition
    expect(result.state.ship.hull).toBeDefined();
    expect(result.state.ship.engine).toBeDefined();
    // v1 migration normalizes cargo field names
    expect(result.state.ship.cargo[0].buyPrice).toBe(15);
  });

  it('emits UI state events after restore', () => {
    const sourceManager = new GameCoordinator(
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA
    );
    sourceManager.initNewGame();
    const validState = structuredClone(sourceManager.state);

    const emittedEvents = [];
    const originalEmit = manager.emit.bind(manager);
    manager.emit = (eventType, data) => {
      emittedEvents.push(eventType);
      originalEmit(eventType, data);
    };

    // manager starts with null state from constructor
    manager.restoreState(validState);

    expect(emittedEvents).toContain('creditsChanged');
    expect(emittedEvents).toContain('fuelChanged');
    expect(emittedEvents).toContain('cargoChanged');
    expect(emittedEvents).toContain('locationChanged');
    expect(emittedEvents).toContain('shipConditionChanged');
  });
});
