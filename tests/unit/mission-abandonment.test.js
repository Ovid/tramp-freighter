import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Abandonment', () => {
  let manager;

  const testMission = {
    id: 'test_delivery_001',
    type: 'delivery',
    title: 'Test Delivery',
    giver: 'station_master',
    giverSystem: 0,
    requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 7 },
    rewards: { credits: 500 },
    penalties: { failure: { rep: { cole_sol: -2 }, karma: -1 } },
  };

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should remove mission from active and add to failed', () => {
    manager.acceptMission(testMission);
    const result = manager.abandonMission('test_delivery_001');

    expect(result.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain('test_delivery_001');
  });

  it('should apply failure penalties (rep and karma)', () => {
    manager.acceptMission(testMission);
    const repBefore = manager.getNPCState('cole_sol').rep;
    manager.abandonMission(testMission.id);

    expect(manager.getNPCState('cole_sol').rep).toBeLessThan(repBefore);
    expect(manager.getKarma()).toBe(-1);
  });

  it('should fail if mission not found', () => {
    const result = manager.abandonMission('nonexistent');
    expect(result.success).toBe(false);
  });

  it('should emit missionsChanged event', () => {
    manager.acceptMission(testMission);
    let emitted = null;
    manager.subscribe('missionsChanged', (data) => {
      emitted = data;
    });
    manager.abandonMission(testMission.id);
    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
  });
});
