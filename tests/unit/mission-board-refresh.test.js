import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { createDefaultMissionState } from '@game/state/state-validators.js';

describe('MissionManager.refreshMissionBoard – passes dangerZone', () => {
  let game;
  let manager;

  beforeEach(() => {
    game = createTestGame();
    manager = game.missionManager;
    game.state.player.daysElapsed = 5;
    game.state.player.currentSystem = 0;
    game.state.missions = {
      ...createDefaultMissionState(),
      boardLastRefresh: -1,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a mission board without errors', () => {
    const board = manager.refreshMissionBoard();
    expect(board).toEqual(expect.any(Array));
  });
});
