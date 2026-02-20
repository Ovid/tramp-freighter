import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Trading – mission cargo sell block', () => {
  let manager;
  let state;
  let mockGSM;

  beforeEach(() => {
    state = {
      player: { credits: 500, currentSystem: 0 },
      ship: {
        cargo: [
          { good: 'ore', qty: 10, buyPrice: 15 },
          { good: 'sealed_containers', qty: 8, buyPrice: 0, missionId: 'cargo_run_123' },
        ],
      },
      world: { marketConditions: {} },
    };

    mockGSM = {
      state,
      getState: () => state,
      updateCredits: vi.fn(),
      updateCargo: vi.fn(),
      getCurrentSystem: () => ({ name: 'Sol' }),
      getCargoRemaining: () => 30,
      saveGame: vi.fn(),
      emit: vi.fn(),
    };

    const { TradingManager } = require('../../src/game/state/managers/trading.js');
    manager = new TradingManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
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
