import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { PASSENGER_CONFIG, COLE_DEBT_CONFIG } from '../../src/game/constants.js';

describe('MissionManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('completeMission', () => {
    it('returns failure when mission not found', () => {
      const result = gsm.missionManager.completeMission('nonexistent');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('returns failure for delivery mission at wrong destination', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 999 },
          rewards: { credits: 100 },
        },
      ];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not at the mission destination');
    });

    it('returns failure for delivery mission with missing cargo (new-style)', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          missionCargo: { good: 'ore', quantity: 10 },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.ship.cargo = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('cargo is no longer');
    });

    it('returns failure for delivery mission with insufficient legacy cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem, cargo: 'ore', quantity: 20 },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not enough ore');
    });

    it('completes delivery mission with sufficient legacy cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem, cargo: 'ore', quantity: 5 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 100 }];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });

    it('returns failure for fetch mission at wrong system', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: 999,
          requirements: { cargo: 'ore', quantity: 5 },
          rewards: { credits: 100 },
        },
      ];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not at the mission destination');
    });

    it('returns failure for fetch mission with insufficient cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: { cargo: 'ore', quantity: 20 },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not enough ore');
    });

    it('completes fetch mission at correct system with cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: { cargo: 'ore', quantity: 5 },
          rewards: { credits: 300 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 100 }];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });

    it('returns failure for intel mission at wrong system', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'intel',
          giverSystem: 999,
          requirements: { targets: [1, 2] },
          rewards: { credits: 100 },
        },
      ];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
    });

    it('returns failure for intel mission with unvisited targets', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'intel',
          giverSystem: currentSystem,
          requirements: { targets: [1, 2, 3] },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.world.visitedSystems = [1];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not all target systems');
    });

    it('completes intel mission with all targets visited', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'intel',
          giverSystem: currentSystem,
          requirements: { targets: [1, 2] },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.world.visitedSystems = [1, 2];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });

    it('returns failure for passenger mission at wrong destination', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'passenger',
          requirements: { destination: 999 },
          rewards: { credits: 100 },
          passenger: { satisfaction: 80 },
        },
      ];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not at the passenger destination');
    });

    it('applies faction rewards on completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const modifyFactionRepSpy = vi.spyOn(gsm, 'modifyFactionRep');
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 100, faction: { traders: 5 } },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(modifyFactionRepSpy).toHaveBeenCalledWith('traders', 5, 'mission');
    });

    it('applies rep rewards on completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const modifyRepSpy = vi.spyOn(gsm, 'modifyRep');
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 100, rep: { vasquez_epsilon: 3 } },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(modifyRepSpy).toHaveBeenCalledWith('vasquez_epsilon', 3, 'mission');
    });

    it('applies karma rewards on completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const modifyKarmaSpy = vi.spyOn(gsm, 'modifyKarma');
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 100, karma: 10 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(modifyKarmaSpy).toHaveBeenCalledWith(10, 'mission');
    });

    it('applies cole rep reward for cole missions', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const modifyColeRepSpy = vi.spyOn(gsm, 'modifyColeRep');
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          source: 'cole',
          coleRepReward: 15,
          requirements: { destination: currentSystem },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(modifyColeRepSpy).toHaveBeenCalledWith(15);
    });

    it('records completion history for missions with destination', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          giverSystem: 5,
          requirements: { destination: currentSystem },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.state.missions.completionHistory = undefined;
      gsm.missionManager.completeMission('m1');
      expect(gsm.state.missions.completionHistory).toHaveLength(1);
      expect(gsm.state.missions.completionHistory[0].from).toBe(5);
      expect(gsm.state.missions.completionHistory[0].to).toBe(currentSystem);
    });

    it('removes mission cargo (new-style) on delivery completion', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          missionCargo: { good: 'ore', quantity: 5 },
          rewards: { credits: 100 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 0, missionId: 'm1' },
        { good: 'grain', qty: 10, buyPrice: 50 },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].good).toBe('grain');
    });
  });

  describe('calculatePassengerPayment', () => {
    const makeMission = (satisfaction, deadlineDay = 999) => ({
      rewards: { credits: 1000 },
      passenger: { satisfaction },
      deadlineDay,
    });

    it('applies very satisfied multiplier', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.VERY_SATISFIED);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      expect(payment).toBeGreaterThan(1000);
    });

    it('applies very dissatisfied multiplier', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(0, 5);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      expect(payment).toBeLessThan(1000);
    });

    it('adds on-time bonus when completed before deadline', () => {
      gsm.state.player.daysElapsed = 10;
      const missionOnTime = makeMission(50, 20);
      const missionLate = makeMission(50, 5);
      const paymentOnTime = gsm.missionManager.calculatePassengerPayment(missionOnTime);
      const paymentLate = gsm.missionManager.calculatePassengerPayment(missionLate);
      expect(paymentOnTime).toBeGreaterThan(paymentLate);
    });
  });

  describe('updatePassengerSatisfaction', () => {
    it('reduces satisfaction for delay event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 1, safety: 0.5, comfort: 0.8 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'delay');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(80);
    });

    it('reduces satisfaction for combat event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 1, safety: 1, comfort: 0.5 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'combat');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(80);
    });

    it('reduces satisfaction for low_life_support event', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            satisfaction: 80,
            satisfactionWeights: { speed: 0, safety: 0, comfort: 1 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'low_life_support');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeLessThan(80);
    });

    it('does nothing for non-passenger mission', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 0 },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('m1', 'delay');
      // No crash, no passenger property to modify
    });

    it('does nothing for unknown mission', () => {
      gsm.state.missions.active = [];
      gsm.missionManager.updatePassengerSatisfaction('unknown', 'delay');
    });

    it('clamps satisfaction at 0', () => {
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            satisfaction: 1,
            satisfactionWeights: { speed: 10, safety: 10, comfort: 10 },
          },
        },
      ];
      gsm.missionManager.updatePassengerSatisfaction('p1', 'combat');
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('modifyAllPassengerSatisfaction', () => {
    it('modifies satisfaction for all passenger missions', () => {
      gsm.state.missions.active = [
        { id: 'p1', type: 'passenger', passenger: { satisfaction: 50 } },
        { id: 'p2', type: 'passenger', passenger: { satisfaction: 70 } },
        { id: 'm1', type: 'delivery', requirements: {} },
      ];
      gsm.missionManager.modifyAllPassengerSatisfaction(10);
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBe(60);
      expect(gsm.state.missions.active[1].passenger.satisfaction).toBe(80);
    });

    it('clamps satisfaction at 100', () => {
      gsm.state.missions.active = [
        { id: 'p1', type: 'passenger', passenger: { satisfaction: 95 } },
      ];
      gsm.missionManager.modifyAllPassengerSatisfaction(20);
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBe(100);
    });

    it('clamps satisfaction at 0', () => {
      gsm.state.missions.active = [
        { id: 'p1', type: 'passenger', passenger: { satisfaction: 5 } },
      ];
      gsm.missionManager.modifyAllPassengerSatisfaction(-20);
      expect(gsm.state.missions.active[0].passenger.satisfaction).toBe(0);
    });
  });

  describe('failMissionsDueToCargoLoss', () => {
    it('does nothing when no missions have lost cargo', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          penalties: { failure: { faction: { traders: -5 } } },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, missionId: 'm1' }];
      gsm.state.missions.failed = [];
      gsm.missionManager.failMissionsDueToCargoLoss();
      expect(gsm.state.missions.active).toHaveLength(1);
      expect(gsm.state.missions.failed).toHaveLength(0);
    });

    it('fails missions whose cargo is missing', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
          penalties: { failure: { faction: { traders: -5 } } },
        },
      ];
      gsm.state.ship.cargo = [];
      gsm.state.missions.failed = [];
      const spy = vi.spyOn(gsm, 'modifyFactionRep');
      gsm.missionManager.failMissionsDueToCargoLoss();
      expect(gsm.state.missions.active).toHaveLength(0);
      expect(gsm.state.missions.failed).toContain('m1');
      expect(spy).toHaveBeenCalledWith('traders', -5, 'mission_cargo_confiscated');
    });

    it('keeps non-cargo missions intact', () => {
      gsm.state.missions.active = [
        { id: 'm1', type: 'intel', giverSystem: 0, requirements: { targets: [1] } },
        {
          id: 'm2',
          type: 'delivery',
          missionCargo: { good: 'ore', quantity: 5 },
        },
      ];
      gsm.state.ship.cargo = [];
      gsm.state.missions.failed = [];
      gsm.missionManager.failMissionsDueToCargoLoss();
      expect(gsm.state.missions.active).toHaveLength(1);
      expect(gsm.state.missions.active[0].id).toBe('m1');
    });
  });

  describe('checkMissionDeadlines', () => {
    it('fails expired missions and applies penalties', () => {
      gsm.state.player.daysElapsed = 200;
      gsm.state.missions.active = [
        {
          id: 'm1',
          title: 'Expired Mission',
          deadlineDay: 100,
          penalties: {
            failure: {
              rep: { vasquez_epsilon: -3 },
              karma: -5,
              faction: { traders: -2 },
            },
          },
        },
      ];
      gsm.state.missions.failed = [];
      const repSpy = vi.spyOn(gsm, 'modifyRep');
      const karmaSpy = vi.spyOn(gsm, 'modifyKarma');
      const factionSpy = vi.spyOn(gsm, 'modifyFactionRep');

      gsm.missionManager.checkMissionDeadlines();

      expect(gsm.state.missions.active).toHaveLength(0);
      expect(gsm.state.missions.failed).toContain('m1');
      expect(repSpy).toHaveBeenCalledWith('vasquez_epsilon', -3, 'mission_fail');
      expect(karmaSpy).toHaveBeenCalledWith(-5, 'mission_fail');
      expect(factionSpy).toHaveBeenCalledWith('traders', -2, 'mission_fail');
    });

    it('creates failure notices for expired missions', () => {
      gsm.state.player.daysElapsed = 200;
      gsm.state.missions.active = [
        {
          id: 'm1',
          title: 'Expired Mission',
          deadlineDay: 100,
          destination: { name: 'Sol' },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(gsm.state.missions.pendingFailureNotices).toHaveLength(1);
      expect(gsm.state.missions.pendingFailureNotices[0].title).toBe('Expired Mission');
    });

    it('removes mission cargo on deadline expiry', () => {
      gsm.state.player.daysElapsed = 200;
      gsm.state.missions.active = [
        {
          id: 'm1',
          title: 'Expired Cargo Mission',
          deadlineDay: 100,
          missionCargo: { good: 'ore', quantity: 5 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, missionId: 'm1' },
        { good: 'grain', qty: 10, buyPrice: 50 },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].good).toBe('grain');
    });

    it('applies cole rep penalty for expired cole missions', () => {
      gsm.state.player.daysElapsed = 200;
      const modifyColeRepSpy = vi.spyOn(gsm, 'modifyColeRep');
      gsm.state.missions.active = [
        {
          id: 'm1',
          title: 'Cole Mission',
          deadlineDay: 100,
          source: 'cole',
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(modifyColeRepSpy).toHaveBeenCalledWith(COLE_DEBT_CONFIG.REP_FAVOR_FAIL);
    });

    it('does nothing when no missions are expired', () => {
      gsm.state.player.daysElapsed = 50;
      gsm.state.missions.active = [
        { id: 'm1', deadlineDay: 100 },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.checkMissionDeadlines();
      expect(gsm.state.missions.active).toHaveLength(1);
    });
  });

  describe('getCompletableMissions', () => {
    it('returns empty array when no missions completable', () => {
      gsm.state.missions.active = [];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toEqual([]);
    });

    it('finds completable delivery missions with mission cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          missionCargo: { good: 'ore', quantity: 5 },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, missionId: 'm1' }];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('m1');
    });

    it('excludes delivery missions at wrong destination', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: 999 },
          rewards: { credits: 100 },
        },
      ];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(0);
    });

    it('finds completable fetch missions at giver system', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: { cargo: 'ore', quantity: 5 },
          rewards: { credits: 300 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 50 }];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(1);
    });

    it('excludes fetch missions with insufficient cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: { cargo: 'ore', quantity: 50 },
          rewards: { credits: 300 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 50 }];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(0);
    });

    it('finds completable intel missions with all targets visited', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'intel',
          giverSystem: currentSystem,
          requirements: { targets: [1, 2] },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.world.visitedSystems = [1, 2];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(1);
    });

    it('excludes intel missions with unvisited targets', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'intel',
          giverSystem: currentSystem,
          requirements: { targets: [1, 2, 3] },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.world.visitedSystems = [1];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(0);
    });

    it('finds completable passenger missions at destination', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          requirements: { destination: currentSystem },
          rewards: { credits: 1000 },
          passenger: { satisfaction: 80 },
          deadlineDay: 999,
        },
      ];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(1);
      expect(result[0].grossCredits).toBeDefined();
    });

    it('returns false for unknown mission type', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'unknown_type',
          requirements: { destination: currentSystem },
          rewards: { credits: 100 },
        },
      ];
      const result = gsm.missionManager.getCompletableMissions();
      expect(result).toHaveLength(0);
    });
  });

  describe('abandonMission', () => {
    it('returns failure for non-existent mission', () => {
      const result = gsm.missionManager.abandonMission('nonexistent');
      expect(result.success).toBe(false);
    });

    it('returns failure for non-abandonable mission', () => {
      gsm.state.missions.active = [
        { id: 'm1', abandonable: false },
      ];
      const result = gsm.missionManager.abandonMission('m1');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('cannot be abandoned');
    });

    it('removes mission cargo on abandon', () => {
      gsm.state.missions.active = [
        {
          id: 'm1',
          missionCargo: { good: 'ore', quantity: 5 },
        },
      ];
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, missionId: 'm1' },
        { good: 'grain', qty: 10, buyPrice: 50 },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.abandonMission('m1');
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].good).toBe('grain');
    });

    it('applies abandon penalties', () => {
      const repSpy = vi.spyOn(gsm, 'modifyRep');
      const karmaSpy = vi.spyOn(gsm, 'modifyKarma');
      gsm.state.missions.active = [
        {
          id: 'm1',
          penalties: {
            failure: {
              rep: { vasquez_epsilon: -2 },
              karma: -3,
            },
          },
        },
      ];
      gsm.state.missions.failed = [];
      gsm.missionManager.abandonMission('m1');
      expect(repSpy).toHaveBeenCalledWith('vasquez_epsilon', -2, 'mission_abandon');
      expect(karmaSpy).toHaveBeenCalledWith(-3, 'mission_abandon');
    });
  });

  describe('dismissMissionFailureNotice', () => {
    it('does nothing when no pending notices', () => {
      gsm.state.missions.pendingFailureNotices = undefined;
      gsm.missionManager.dismissMissionFailureNotice('m1');
      // No crash
    });

    it('does nothing when notice not found', () => {
      gsm.state.missions.pendingFailureNotices = [{ id: 'other' }];
      gsm.missionManager.dismissMissionFailureNotice('m1');
      expect(gsm.state.missions.pendingFailureNotices).toHaveLength(1);
    });

    it('removes the specified notice', () => {
      gsm.state.missions.pendingFailureNotices = [
        { id: 'm1', title: 'Failed' },
        { id: 'm2', title: 'Also Failed' },
      ];
      gsm.missionManager.dismissMissionFailureNotice('m1');
      expect(gsm.state.missions.pendingFailureNotices).toHaveLength(1);
      expect(gsm.state.missions.pendingFailureNotices[0].id).toBe('m2');
    });
  });

  describe('getActiveMissions', () => {
    it('returns active missions array', () => {
      gsm.state.missions.active = [{ id: 'm1' }, { id: 'm2' }];
      const result = gsm.missionManager.getActiveMissions();
      expect(result).toHaveLength(2);
    });
  });
});
