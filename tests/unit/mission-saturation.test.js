import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('Mission Route Saturation', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
  });

  it('should initialize completionHistory as empty array', () => {
    const state = gsm.getState();
    expect(state.missions.completionHistory).toEqual([]);
  });

  it('should record completion history entry when mission is completed', () => {
    const state = gsm.getState();
    state.player.currentSystem = 1;

    state.missions.active.push({
      id: 'test_mission_1',
      type: 'delivery',
      giverSystem: 0,
      hopCount: 1,
      requirements: { destination: 1, deadline: 10 },
      destination: { systemId: 1, name: 'Alpha Centauri A' },
      missionCargo: {
        good: 'registered_freight',
        quantity: 5,
        isIllegal: false,
      },
      rewards: { credits: 75, faction: { traders: 2 } },
      penalties: { failure: { faction: { traders: -2 } } },
    });

    state.ship.cargo.push({
      good: 'registered_freight',
      qty: 5,
      buyPrice: 0,
      missionId: 'test_mission_1',
    });

    gsm.completeMission('test_mission_1');

    expect(state.missions.completionHistory).toHaveLength(1);
    expect(state.missions.completionHistory[0]).toEqual({
      from: 0,
      to: 1,
      day: state.player.daysElapsed,
    });
  });

  it('should prune stale history entries during board refresh', () => {
    const state = gsm.getState();
    state.missions.completionHistory = [
      { from: 0, to: 1, day: 1 },
      { from: 0, to: 1, day: 50 },
    ];
    state.player.daysElapsed = 60;
    state.missions.board = [];
    state.missions.boardLastRefresh = -1;

    gsm.refreshMissionBoard();

    expect(state.missions.completionHistory).toHaveLength(1);
    expect(state.missions.completionHistory[0].day).toBe(50);
  });

  it('should cap completionHistory at SATURATION_MAX_HISTORY', () => {
    const state = gsm.getState();
    state.player.daysElapsed = 100;
    // All 55 entries on the current day so none are pruned by the window filter
    state.missions.completionHistory = Array.from({ length: 55 }, () => ({
      from: 0,
      to: 1,
      day: 100,
    }));
    state.missions.board = [];
    state.missions.boardLastRefresh = -1;

    gsm.refreshMissionBoard();

    expect(state.missions.completionHistory).toHaveLength(50);
  });
});
