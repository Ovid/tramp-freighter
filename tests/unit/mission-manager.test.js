import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('MissionManager', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
  });

  describe('acceptMission', () => {
    const testMission = {
      id: 'test_delivery_001',
      type: 'delivery',
      title: 'Test Delivery',
      description: 'Deliver goods.',
      giver: 'station_master',
      giverSystem: 0,
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 4,
        deadline: 7,
      },
      rewards: { credits: 500 },
      penalties: { failure: { credits: 0 } },
    };

    it('should accept a mission and add it to active missions', () => {
      const result = manager.acceptMission(testMission);

      expect(result.success).toBe(true);
      const state = manager.getState();
      expect(state.missions.active).toHaveLength(1);
      expect(state.missions.active[0].id).toBe('test_delivery_001');
      expect(state.missions.active[0].acceptedDay).toBe(0);
      expect(state.missions.active[0].deadlineDay).toBe(7);
    });

    it('should reject mission when max active missions reached', () => {
      for (let i = 0; i < 3; i++) {
        manager.acceptMission({ ...testMission, id: `mission_${i}` });
      }

      const result = manager.acceptMission({
        ...testMission,
        id: 'mission_overflow',
      });
      expect(result.success).toBe(false);
      expect(result.reason).toContain('maximum');
    });

    it('should reject duplicate mission', () => {
      manager.acceptMission(testMission);
      const result = manager.acceptMission(testMission);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('already');
    });

    it('should emit missionsChanged on acceptance', () => {
      let emitted = null;
      manager.subscribe('missionsChanged', (data) => {
        emitted = data;
      });

      manager.acceptMission(testMission);

      expect(emitted).not.toBeNull();
      expect(emitted.active).toHaveLength(1);
    });

    it('should return active missions list', () => {
      expect(manager.getActiveMissions()).toEqual([]);

      manager.acceptMission(testMission);
      expect(manager.getActiveMissions()).toHaveLength(1);
    });

    it('should remove accepted mission from the board', () => {
      const state = manager.getState();
      state.missions.board = [
        testMission,
        {
          ...testMission,
          id: 'other_mission',
          title: 'Other Mission',
        },
      ];

      manager.acceptMission(testMission);

      expect(state.missions.board).toHaveLength(1);
      expect(state.missions.board[0].id).toBe('other_mission');
    });
  });
});
