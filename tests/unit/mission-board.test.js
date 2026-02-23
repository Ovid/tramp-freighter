import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Mission Board', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
  });

  it('should refresh mission board for current system', () => {
    const board = manager.refreshMissionBoard();

    expect(board).toBeInstanceOf(Array);
    expect(board.length).toBeGreaterThan(0);

    const state = manager.getState();
    expect(state.missions.board).toEqual(board);
    expect(state.missions.boardLastRefresh).toBe(0);
  });

  it('should return cached board if refreshed same day', () => {
    const board1 = manager.refreshMissionBoard();
    const board2 = manager.refreshMissionBoard();

    expect(board2).toEqual(board1);
  });

  it('should generate new board after a day passes', () => {
    manager.refreshMissionBoard();

    manager.updateTime(1);
    manager.refreshMissionBoard();

    const state = manager.getState();
    expect(state.missions.boardLastRefresh).toBe(1);
  });
});
