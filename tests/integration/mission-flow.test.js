import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Flow Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete full mission lifecycle: board → accept → travel → complete', () => {
    // 1. Generate mission board at Sol
    const board = manager.refreshMissionBoard();
    expect(board.length).toBeGreaterThan(0);

    // 2. Accept first non-passenger mission (passenger missions use satisfaction-based payment)
    const mission = board.find((m) => m.type !== 'passenger') || board[0];
    const acceptResult = manager.acceptMission(mission);
    expect(acceptResult.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(1);

    // 3. Move to destination and ensure cargo
    const activeMission = manager.getActiveMissions()[0];
    manager.updateLocation(activeMission.requirements.destination);

    const state = manager.getState();
    const existingCargo = state.ship.cargo
      .filter((c) => c.good === activeMission.requirements.cargo)
      .reduce((sum, c) => sum + c.qty, 0);

    if (existingCargo < activeMission.requirements.quantity) {
      state.ship.cargo.push({
        good: activeMission.requirements.cargo,
        qty: activeMission.requirements.quantity,
        buyPrice: 10,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      });
    }

    // 4. Complete mission
    const creditsBefore = state.player.credits;
    const completeResult = manager.completeMission(activeMission.id);
    expect(completeResult.success).toBe(true);

    // 5. Verify rewards applied
    expect(state.player.credits).toBe(
      creditsBefore + activeMission.rewards.credits
    );
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(state.missions.completed).toContain(activeMission.id);
  });

  it('should handle mission abandonment flow', () => {
    const board = manager.refreshMissionBoard();
    manager.acceptMission(board[0]);
    expect(manager.getActiveMissions()).toHaveLength(1);

    const result = manager.abandonMission(board[0].id);
    expect(result.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain(board[0].id);
  });

  it('should handle mission deadline expiry flow', () => {
    const board = manager.refreshMissionBoard();
    manager.acceptMission(board[0]);

    const activeMission = manager.getActiveMissions()[0];
    manager.updateTime(activeMission.deadlineDay + 1);

    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain(activeMission.id);
  });
});
