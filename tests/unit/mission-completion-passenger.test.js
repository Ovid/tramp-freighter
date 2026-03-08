import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';

describe('MissionManager completeMission passenger and edge cases', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('passenger mission completion', () => {
    it('completes passenger mission at correct destination', () => {
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
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('p1');
      expect(result.success).toBe(true);
      expect(gsm.state.missions.completed).toContain('p1');
    });

    it('uses calculatePassengerPayment for passenger credits', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.player.daysElapsed = 5;
      gsm.state.missions.active = [
        {
          id: 'p1',
          type: 'passenger',
          requirements: { destination: currentSystem },
          rewards: { credits: 1000 },
          passenger: {
            satisfaction:
              PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.VERY_SATISFIED,
          },
          deadlineDay: 999,
        },
      ];
      gsm.state.missions.completed = [];
      const initialCredits = gsm.state.player.credits;
      gsm.missionManager.completeMission('p1');
      expect(gsm.state.player.credits).toBeGreaterThan(initialCredits);
    });
  });

  describe('calculatePassengerPayment satisfaction tiers', () => {
    const makeMission = (satisfaction, deadlineDay = 999) => ({
      rewards: { credits: 1000 },
      passenger: { satisfaction },
      deadlineDay,
    });

    it('applies satisfied multiplier', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(
        PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.SATISFIED
      );
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 *
          (PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.SATISFIED +
            PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies neutral multiplier', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(
        PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.NEUTRAL
      );
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 *
          (PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.NEUTRAL +
            PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies dissatisfied multiplier', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(
        PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.DISSATISFIED
      );
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 *
          (PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.DISSATISFIED +
            PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies very dissatisfied multiplier for low satisfaction', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(0);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 *
          (PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.VERY_DISSATISFIED +
            PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('does not apply on-time bonus when past deadline', () => {
      gsm.state.player.daysElapsed = 20;
      const mission = makeMission(
        PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.NEUTRAL,
        10
      );
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 * PASSENGER_CONFIG.PAYMENT_MULTIPLIERS.NEUTRAL
      );
      expect(payment).toBe(expected);
    });
  });

  describe('completeMission delivery with no cargo requirement', () => {
    it('completes delivery with no cargo check when neither missionCargo nor requirements.cargo', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });
  });

  describe('completeMission fetch with no cargo requirement', () => {
    it('completes fetch mission with no cargo check', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: {},
          rewards: { credits: 200 },
        },
      ];
      gsm.state.missions.completed = [];
      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
    });
  });

  describe('completeMission withholding', () => {
    it('applies trade withholding to mission rewards', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 1000 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.state.player.debt = 5000;

      const result = gsm.missionManager.completeMission('m1');
      expect(result.success).toBe(true);
      expect(result.withheld).toBeDefined();
    });
  });

  describe('completeMission stat tracking', () => {
    it('increments creditsEarned stat', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.stats = { creditsEarned: 0, cargoHauled: 0 };
      gsm.state.missions.active = [
        {
          id: 'm1',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 500 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.missionManager.completeMission('m1');
      expect(gsm.state.stats.creditsEarned).toBe(500);
    });
  });
});
