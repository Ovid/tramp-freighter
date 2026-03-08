import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Migration Registry', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('migrates v1.0.0 state to current version', () => {
    const v1State = {
      meta: { version: '1.0.0', timestamp: Date.now() },
      player: { credits: 1000, currentSystem: 0, daysElapsed: 5 },
      ship: {
        fuel: 100,
        cargo: [],
        cargoCapacity: 100,
        name: 'Test',
        hull: 100,
        engine: 100,
        lifeSupport: 100,
      },
      world: {
        visitedSystems: [0],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };

    const result = gsm._applyMigrations(v1State);
    expect(result.meta.version).toBe('5.0.0');
  });

  it('returns v5.0.0 state unchanged', () => {
    const v5State = {
      meta: { version: '5.0.0', timestamp: Date.now() },
      player: { credits: 1000 },
    };

    const result = gsm._applyMigrations(v5State);
    expect(result.meta.version).toBe('5.0.0');
    expect(result.player.credits).toBe(1000);
  });
});
