import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GAME_VERSION } from '../../src/game/constants.js';

describe('GameStateManager.restoreState', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores valid current-version state and returns success', () => {
    manager.initNewGame();
    const validState = structuredClone(manager.state);
    manager.state = null;

    const result = manager.restoreState(validState);

    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(manager.state).not.toBeNull();
    expect(manager.state.player.credits).toBe(validState.player.credits);
    expect(manager.state.meta.version).toBe(GAME_VERSION);
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

  it('rejects state that fails structure validation', () => {
    const result = manager.restoreState({
      meta: { version: GAME_VERSION, timestamp: Date.now() },
      player: { credits: 'not-a-number' },
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('structure validation');
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
    expect(result.state.meta.version).toBe(GAME_VERSION);
    // v1 migration adds ship condition
    expect(result.state.ship.hull).toBeDefined();
    expect(result.state.ship.engine).toBeDefined();
    // v1 migration normalizes cargo field names
    expect(result.state.ship.cargo[0].buyPrice).toBe(15);
  });

  it('emits UI state events after restore', () => {
    manager.initNewGame();
    const validState = structuredClone(manager.state);
    manager.state = null;

    const emittedEvents = [];
    const originalEmit = manager.emit.bind(manager);
    manager.emit = (eventType, data) => {
      emittedEvents.push(eventType);
      originalEmit(eventType, data);
    };

    manager.restoreState(validState);

    expect(emittedEvents).toContain('creditsChanged');
    expect(emittedEvents).toContain('fuelChanged');
    expect(emittedEvents).toContain('cargoChanged');
    expect(emittedEvents).toContain('locationChanged');
    expect(emittedEvents).toContain('shipConditionChanged');
  });
});
