import { describe, it, expect, vi, beforeEach } from 'vitest';

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

    const mockGSM = {
      state,
      getState: () => state,
      starData: [
        { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
        { id: 1, x: -23, y: -19, z: -53, name: 'Alpha Centauri A' },
      ],
      wormholeData: [[0, 1]],
      getDangerZone: vi.fn(() => 'safe'),
      saveGame: vi.fn(),
      emit: vi.fn(),
    };

    const { MissionManager } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
  });

  it('should generate a mission board without errors', () => {
    const board = manager.refreshMissionBoard();
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBe(true);
  });
});
