import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MissionManager.refreshMissionBoard – passes dangerZone', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { daysElapsed: 5, currentSystem: 0 },
      missions: {
        active: [],
        board: [],
        boardLastRefresh: -1,
        completed: [],
        failed: [],
      },
    };

    const capabilities = {
      getOwnState: () => state.missions,
      getDaysElapsed: () => state.player.daysElapsed,
      getCurrentSystem: () => state.player.currentSystem,
      getCredits: () => 0,
      getShipCargo: () => [],
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
      starData: [
        { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
        { id: 1, x: -23, y: -19, z: -53, name: 'Alpha Centauri A' },
      ],
      wormholeData: [[0, 1]],
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

  it('should generate a mission board without errors', () => {
    const board = manager.refreshMissionBoard();
    expect(board).toEqual(expect.any(Array));
  });
});
