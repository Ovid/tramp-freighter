import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('MissionManager.abandonMission – cargo run cargo removal', () => {
  let game;
  let manager;
  let state;

  beforeEach(() => {
    game = createTestGame();
    state = game.state;
    manager = game.missionManager;
    state.player.daysElapsed = 10;
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];
    state.missions.active = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove mission cargo from hold when abandoning a cargo run', () => {
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
      { good: 'ore', qty: 5, buyPrice: 15 },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        missionCargo: { good: 'registered_freight', quantity: 10 },
        penalties: { failure: {} },
      },
    ];

    manager.abandonMission('cargo_run_123');

    expect(state.ship.cargo).toHaveLength(1);
    expect(state.ship.cargo[0].good).toBe('ore');
  });

  // Issue #50: otherwise abandoned cargo sits in the hidden hold forever
  it('should remove mission cargo from the hidden compartment when abandoning', () => {
    state.ship.hiddenCargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        missionCargo: { good: 'registered_freight', quantity: 10 },
        penalties: { failure: {} },
      },
    ];

    manager.abandonMission('cargo_run_123');

    expect(state.ship.hiddenCargo).toEqual([]);
  });

  it('should not affect cargo when abandoning non-cargo-run missions', () => {
    state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 15 }];
    state.missions.active = [
      {
        id: 'intel_456',
        type: 'intel',
        requirements: { targets: [5] },
        penalties: { failure: {} },
      },
    ];

    manager.abandonMission('intel_456');

    expect(state.ship.cargo).toHaveLength(1);
    expect(state.ship.cargo[0].good).toBe('ore');
  });
});
