import { describe, it, expect } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('Mission State Initialization', () => {
  it('should initialize missions state in new game', () => {
    const manager = createTestGame();
    const state = manager.getState();

    expect(state.missions).toBeDefined();
    expect(state.missions.active).toEqual([]);
    expect(state.missions.completed).toEqual([]);
    expect(state.missions.failed).toEqual([]);
    expect(state.missions.board).toEqual([]);
    expect(state.missions.boardLastRefresh).toBe(0);
    expect(state.missions.pendingFailureNotices).toEqual([]);
  });
});
