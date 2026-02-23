import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MissionManager.abandonMission – cargo run cargo removal', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { daysElapsed: 10 },
      ship: { cargo: [] },
      missions: { active: [], board: [], completed: [], failed: [] },
    };

    const mockGSM = {
      state,
      getState: () => state,
      saveGame: vi.fn(),
      markDirty: vi.fn(),
      modifyRep: vi.fn(),
      modifyKarma: vi.fn(),
      modifyFactionRep: vi.fn(),
      emit: vi.fn(),
    };

    const {
      MissionManager,
    } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
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
