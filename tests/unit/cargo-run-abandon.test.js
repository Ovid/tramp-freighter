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

    const capabilities = {
      getOwnState: () => state.missions,
      getDaysElapsed: () => state.player.daysElapsed,
      getCurrentSystem: () => state.player.currentSystem,
      getCredits: () => state.player.credits,
      getShipCargo: () => state.ship.cargo,
      getCargoRemaining: vi.fn(() => 100),
      getStats: () => ({}),
      getVisitedSystems: () => [],
      getDangerZone: vi.fn(() => 'safe'),
      getFactionRep: vi.fn(() => 0),
      updateCredits: vi.fn(),
      applyTradeWithholding: vi.fn(() => ({ withheld: 0 })),
      modifyFactionRep: vi.fn(),
      modifyRep: vi.fn(),
      modifyKarma: vi.fn(),
      modifyColeRep: vi.fn(),
      removeCargoForMission: vi.fn(),
      updateStats: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
      starData: [],
      wormholeData: [],
      isTestEnvironment: true,
    };

    const {
      MissionManager,
    } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(capabilities);
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
