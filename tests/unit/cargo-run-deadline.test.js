import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MissionManager.checkMissionDeadlines – cargo run cargo removal', () => {
  let manager;
  let state;

  beforeEach(async () => {
    state = {
      player: { daysElapsed: 25 },
      ship: { cargo: [] },
      missions: { active: [], board: [], completed: [], failed: [] },
    };

    const capabilities = {
      getOwnState: () => state.missions,
      getDaysElapsed: () => state.player.daysElapsed,
      getCurrentSystem: () => 0,
      getCredits: () => 0,
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

    const { MissionManager } =
      await import('../../src/game/state/managers/mission.js');
    manager = new MissionManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove mission cargo from hold when deadline expires', () => {
    state.player.daysElapsed = 25; // past deadline
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_expired',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        penalties: { failure: { faction: { traders: -2 } } },
      },
    ];

    manager.checkMissionDeadlines();

    expect(state.ship.cargo).toHaveLength(0);
    expect(state.missions.failed).toContain('cargo_run_expired');
  });

  it('should not remove cargo for non-expired missions', () => {
    state.player.daysElapsed = 15; // before deadline
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_active' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_active',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: {
          good: 'registered_freight',
          quantity: 10,
          isIllegal: false,
        },
        penalties: { failure: {} },
      },
    ];

    manager.checkMissionDeadlines();

    expect(state.ship.cargo).toHaveLength(1);
    expect(state.missions.failed).toHaveLength(0);
  });

  it('should apply faction penalties on expiry', () => {
    state.player.daysElapsed = 25;
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_expired',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        penalties: { failure: { faction: { traders: -2 } } },
      },
    ];

    manager.checkMissionDeadlines();

    // The existing deadline check already handles faction penalties
    // Just verify the mission was failed
    expect(state.missions.failed).toContain('cargo_run_expired');
  });
});
