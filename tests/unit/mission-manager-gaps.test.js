import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('MissionManager coverage gaps', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('completeMission delivery with missionCargo missing', () => {
    it('fails when missionCargo is no longer in hold', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = []; // Cargo is gone
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Mission cargo');
    });
  });

  describe('completeMission delivery with legacy cargo insufficient', () => {
    it('fails when legacy cargo quantity insufficient', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: {
            destination: currentSystem,
            cargo: 'ore',
            quantity: 10,
          },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 3, buyPrice: 10 }];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not enough ore');
    });
  });

  describe('completeMission removes missionCargo from hold', () => {
    it('removes mission-tagged cargo on delivery completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
        { good: 'grain', qty: 3, buyPrice: 10 },
      ];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].good).toBe('grain');
    });
  });

  describe('completeMission with legacy cargo removal', () => {
    it('removes legacy cargo on delivery completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: {
            destination: currentSystem,
            cargo: 'ore',
            quantity: 5,
          },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 10 }];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });
  });

  describe('completeMission cole source rep reward', () => {
    it('modifies cole rep when mission has coleRepReward', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const spy = vi.spyOn(gsm, 'modifyColeRep').mockImplementation(() => {});
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          source: 'cole',
          coleRepReward: 10,
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(spy).toHaveBeenCalledWith(10);
    });
  });

  describe('completeMission karma reward', () => {
    it('modifies karma when mission has karma reward', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const spy = vi.spyOn(gsm, 'modifyKarma').mockImplementation(() => {});
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 500, karma: 5 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(spy).toHaveBeenCalledWith(5, 'mission');
    });
  });

  describe('abandonMission with penalties', () => {
    it('applies rep penalties on abandon', () => {
      const repSpy = vi.spyOn(gsm, 'modifyRep').mockImplementation(() => {});
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          penalties: { failure: { rep: { vasquez: -5 } } },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.abandonMission('m1');
      expect(repSpy).toHaveBeenCalledWith('vasquez', -5, 'mission_abandon');
    });

    it('applies karma penalties on abandon', () => {
      const karmaSpy = vi
        .spyOn(gsm, 'modifyKarma')
        .mockImplementation(() => {});
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          penalties: { failure: { karma: -3 } },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.abandonMission('m1');
      expect(karmaSpy).toHaveBeenCalledWith(-3, 'mission_abandon');
    });

    it('removes mission cargo on abandon', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
        { good: 'grain', qty: 3, buyPrice: 10 },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.abandonMission('m1');
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].good).toBe('grain');
    });
  });

  describe('checkMissionDeadlines with penalties', () => {
    it('applies rep and karma penalties on deadline expiry', () => {
      const repSpy = vi.spyOn(gsm, 'modifyRep').mockImplementation(() => {});
      const karmaSpy = vi
        .spyOn(gsm, 'modifyKarma')
        .mockImplementation(() => {});
      gsm.state.player.daysElapsed = 50;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          title: 'Test Mission',
          deadlineDay: 30,
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          penalties: { failure: { rep: { vasquez: -5 }, karma: -3 } },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(repSpy).toHaveBeenCalledWith('vasquez', -5, 'mission_fail');
      expect(karmaSpy).toHaveBeenCalledWith(-3, 'mission_fail');
    });

    it('applies faction penalties on deadline expiry', () => {
      const factionSpy = vi
        .spyOn(gsm, 'modifyFactionRep')
        .mockImplementation(() => {});
      gsm.state.player.daysElapsed = 50;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          title: 'Test Mission',
          deadlineDay: 30,
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          penalties: { failure: { faction: { traders: -10 } } },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(factionSpy).toHaveBeenCalledWith('traders', -10, 'mission_fail');
    });

    it('removes mission cargo on deadline expiry', () => {
      gsm.state.player.daysElapsed = 50;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          title: 'Test Mission',
          deadlineDay: 30,
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(gsm.state.ship.cargo).toHaveLength(0);
    });

    it('creates pending failure notices', () => {
      gsm.state.player.daysElapsed = 50;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          title: 'Deliver Ore',
          deadlineDay: 30,
          destination: { name: 'Sol' },
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(gsm.state.missions.pendingFailureNotices).toBeDefined();
      expect(gsm.state.missions.pendingFailureNotices).toHaveLength(1);
      expect(gsm.state.missions.pendingFailureNotices[0].title).toBe(
        'Deliver Ore'
      );
    });
  });

  describe('refreshMissionBoard', () => {
    it('generates a new board when none exists', () => {
      gsm.state.missions.board = [];
      gsm.state.missions.boardLastRefresh = -1;
      const board = gsm.missionManager.refreshMissionBoard();
      expect(Array.isArray(board)).toBe(true);
    });

    it('returns cached board when already refreshed today', () => {
      const currentDay = gsm.state.player.daysElapsed;
      gsm.state.missions.board = [{ id: 'cached', type: 'delivery' }];
      gsm.state.missions.boardLastRefresh = currentDay;
      const board = gsm.missionManager.refreshMissionBoard();
      expect(board).toEqual([{ id: 'cached', type: 'delivery' }]);
    });

    it('initializes completionHistory if missing', () => {
      delete gsm.state.missions.completionHistory;
      gsm.state.missions.board = [];
      gsm.state.missions.boardLastRefresh = -1;
      gsm.missionManager.refreshMissionBoard();
      expect(gsm.state.missions.completionHistory).toBeDefined();
    });
  });

  describe('getCompletableMissions with missionCargo', () => {
    it('includes delivery with missionCargo when cargo present', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
      ];
      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(1);
    });

    it('excludes delivery with missionCargo when cargo missing', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [];
      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(0);
    });

    it('checks legacy cargo quantity for delivery missions', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: {
            destination: currentSystem,
            cargo: 'ore',
            quantity: 10,
          },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 15, buyPrice: 10 }];
      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(1);
    });
  });

  describe('failMissionsDueToCargoLoss', () => {
    it('fails missions whose missionCargo is missing from hold', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = []; // Cargo lost
      gsm.state.missions.failed = [];
      gsm.missionManager.failMissionsDueToCargoLoss();
      expect(gsm.state.missions.active).toHaveLength(0);
      expect(gsm.state.missions.failed).toContain('m1');
    });

    it('keeps missions whose missionCargo is still present', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.failMissionsDueToCargoLoss();
      expect(gsm.state.missions.active).toHaveLength(1);
    });
  });

  describe('updatePassengerSatisfaction', () => {
    it('drops satisfaction for delay event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 1.0, safety: 0.5, comfort: 0.3 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'delay');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(
        80
      );
    });

    it('drops satisfaction for combat event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 0.5, safety: 1.0, comfort: 0.3 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'combat');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(
        80
      );
    });

    it('drops satisfaction for low_life_support event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 0.5, safety: 0.5, comfort: 1.0 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'low_life_support');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(
        80
      );
    });

    it('does nothing for non-passenger mission', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 99 },
          rewards: { credits: 500 },
        },
      ];
      // Should not throw
      gsm.missionManager.updatePassengerSatisfaction('m1', 'delay');
    });
  });
});
