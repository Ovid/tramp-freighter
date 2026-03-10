import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getCompletableMissions – new cargo runs', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { currentSystem: 5, daysElapsed: 10 },
      ship: { cargo: [] },
      missions: { active: [], board: [], completed: [], failed: [] },
      world: { visitedSystems: [] },
    };

    const capabilities = {
      getOwnState: () => state.missions,
      getDaysElapsed: () => state.player.daysElapsed,
      getCurrentSystem: () => state.player.currentSystem,
      getCredits: () => 0,
      getShipCargo: () => state.ship.cargo,
      getCargoRemaining: vi.fn(() => 100),
      getStats: () => ({}),
      getVisitedSystems: () => state.world.visitedSystems,
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

  it('should include delivery mission when mission cargo is in hold at destination', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('cargo_run_123');
  });

  it('should not include delivery mission when mission cargo was lost', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = []; // cargo lost
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should not include delivery mission when not at destination', () => {
    state.player.currentSystem = 3; // wrong system
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });
});
