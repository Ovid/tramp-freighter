import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Deadline Checking', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should fail missions past their deadline when time advances', () => {
    const mission = {
      id: 'test_timed',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 5 },
      rewards: { credits: 500 },
      penalties: { failure: { rep: { cole_sol: -2 } } },
    };
    manager.acceptMission(mission);

    manager.updateTime(6);

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('test_timed');
  });

  it('should apply failure penalties when deadline expires', () => {
    const mission = {
      id: 'test_penalty',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 3 },
      rewards: { credits: 500 },
      penalties: { failure: { karma: -1 } },
    };
    manager.acceptMission(mission);

    manager.updateTime(4);

    expect(manager.getKarma()).toBe(-1);
  });

  it('should not fail missions before their deadline', () => {
    const mission = {
      id: 'test_safe',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 10 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    manager.updateTime(5);

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(1);
  });

  it('should emit missionsChanged when missions fail', () => {
    const mission = {
      id: 'test_emit',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 2 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    let emitted = null;
    manager.subscribe('missionsChanged', (data) => {
      emitted = data;
    });

    manager.updateTime(3);

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
  });
});
