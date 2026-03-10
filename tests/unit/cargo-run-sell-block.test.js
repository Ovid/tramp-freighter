import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Trading – mission cargo sell block', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { credits: 500, currentSystem: 0 },
      ship: {
        cargo: [
          { good: 'ore', qty: 10, buyPrice: 15 },
          {
            good: 'registered_freight',
            qty: 8,
            buyPrice: 0,
            missionId: 'cargo_run_123',
          },
        ],
      },
      world: { marketConditions: {} },
    };

    const capabilities = {
      getOwnState: () => ({
        marketConditions: state.world.marketConditions,
      }),
      getCredits: () => state.player.credits,
      getCurrentSystem: () => state.player.currentSystem,
      getShipCargo: () => state.ship.cargo,
      getCargoRemaining: () => 30,
      getDaysElapsed: () => 0,
      getStats: () => ({}),
      getActiveEvents: () => [],
      updateCredits: vi.fn(),
      updateCargo: vi.fn(),
      applyTradeWithholding: vi.fn(() => ({ withheld: 0 })),
      checkAchievements: vi.fn(),
      updateStats: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
      starData: [{ id: 0, name: 'Sol' }],
      isTestEnvironment: true,
    };

    const {
      TradingManager,
    } = require('../../src/game/state/managers/trading.js');
    manager = new TradingManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should block selling cargo with a missionId', () => {
    const result = manager.sellGood(1, 5, 100); // stack index 1 = mission cargo

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/mission/i);
  });

  it('should allow selling regular cargo', () => {
    const result = manager.sellGood(0, 5, 20); // stack index 0 = regular ore

    expect(result.success).toBe(true);
  });
});
