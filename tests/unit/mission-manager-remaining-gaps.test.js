import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { PASSENGER_CONFIG, MISSION_CONFIG } from '../../src/game/constants.js';

describe('MissionManager remaining coverage gaps', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('acceptMission cargo space check for missionCargo', () => {
    it('rejects cargo run mission when insufficient cargo space', () => {
      // Fill cargo hold so there is no remaining space
      gsm.state.ship.cargo = [
        { good: 'grain', qty: gsm.state.ship.cargoCapacity, buyPrice: 10 },
      ];
      gsm.state.missions.active = [];
      gsm.state.missions.board = [{ id: 'cargo-run-1' }];

      const mission = {
        id: 'cargo-run-1',
        type: 'delivery',
        missionCargo: { good: 'ore', quantity: 5 },
        requirements: { destination: 1, deadline: 20 },
        rewards: { credits: 500 },
      };

      const result = gsm.missionManager.acceptMission(mission);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough cargo space for mission cargo.');
    });

    it('accepts cargo run mission when sufficient cargo space and places cargo in hold', () => {
      gsm.state.ship.cargo = [];
      gsm.state.missions.active = [];
      gsm.state.missions.board = [{ id: 'cargo-run-2' }];

      const mission = {
        id: 'cargo-run-2',
        type: 'delivery',
        missionCargo: { good: 'ore', quantity: 3 },
        requirements: { destination: 1, deadline: 20 },
        rewards: { credits: 500 },
      };

      const result = gsm.missionManager.acceptMission(mission);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0]).toEqual({
        good: 'ore',
        qty: 3,
        buyPrice: 0,
        missionId: 'cargo-run-2',
      });
    });
  });

  describe('completeMission delivery with no missionCargo and no legacy cargo', () => {
    it('completes simple delivery at destination with no cargo requirements', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'simple-delivery',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.missions.completed = [];
      gsm.state.ship.cargo = [];

      const result = gsm.missionManager.completeMission('simple-delivery');
      expect(result.success).toBe(true);
      expect(result.rewards).toEqual({ credits: 200 });
      expect(gsm.state.missions.completed).toContain('simple-delivery');
    });
  });

  describe('completeMission fetch with no cargo requirements', () => {
    it('completes fetch mission at giverSystem with no cargo needed', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'simple-fetch',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: {},
          rewards: { credits: 150 },
        },
      ];
      gsm.state.missions.completed = [];

      const result = gsm.missionManager.completeMission('simple-fetch');
      expect(result.success).toBe(true);
      expect(gsm.state.missions.completed).toContain('simple-fetch');
    });
  });

  describe('completeMission intel with giverSystem undefined', () => {
    it('completes intel mission when giverSystem is undefined (no location check)', () => {
      gsm.state.missions.active = [
        {
          id: 'intel-no-giver',
          type: 'intel',
          giverSystem: undefined,
          requirements: { targets: [0, 1] },
          rewards: { credits: 300 },
        },
      ];
      gsm.state.world.visitedSystems = [0, 1];
      gsm.state.missions.completed = [];

      const result = gsm.missionManager.completeMission('intel-no-giver');
      expect(result.success).toBe(true);
      expect(gsm.state.missions.completed).toContain('intel-no-giver');
    });
  });

  describe('calculatePassengerPayment satisfaction thresholds', () => {
    const thresholds = PASSENGER_CONFIG.SATISFACTION_THRESHOLDS;
    const multipliers = PASSENGER_CONFIG.PAYMENT_MULTIPLIERS;

    const makeMission = (satisfaction, deadlineDay = 999) => ({
      rewards: { credits: 1000 },
      passenger: { satisfaction },
      deadlineDay,
    });

    it('applies SATISFIED multiplier when satisfaction is at SATISFIED threshold', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(thresholds.SATISFIED);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      // On time bonus applies since daysElapsed (10) <= deadlineDay (999)
      const expected = Math.round(
        1000 * (multipliers.SATISFIED + multipliers.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies NEUTRAL multiplier when satisfaction is at NEUTRAL threshold', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(thresholds.NEUTRAL);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 * (multipliers.NEUTRAL + multipliers.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies DISSATISFIED multiplier when satisfaction is at DISSATISFIED threshold', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(thresholds.DISSATISFIED);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 * (multipliers.DISSATISFIED + multipliers.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('applies VERY_DISSATISFIED multiplier when satisfaction is below DISSATISFIED threshold', () => {
      gsm.state.player.daysElapsed = 10;
      const mission = makeMission(thresholds.DISSATISFIED - 1);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(
        1000 * (multipliers.VERY_DISSATISFIED + multipliers.ON_TIME_BONUS)
      );
      expect(payment).toBe(expected);
    });

    it('does not apply on-time bonus when past deadline', () => {
      gsm.state.player.daysElapsed = 100;
      const mission = makeMission(thresholds.SATISFIED, 50);
      const payment = gsm.missionManager.calculatePassengerPayment(mission);
      const expected = Math.round(1000 * multipliers.SATISFIED);
      expect(payment).toBe(expected);
    });
  });

  describe('refreshMissionBoard generates fresh board with pruned history', () => {
    it('prunes stale completion history entries outside saturation window', () => {
      gsm.state.player.daysElapsed = 100;
      gsm.state.missions.board = [];
      gsm.state.missions.boardLastRefresh = -1;
      gsm.state.missions.completionHistory = [
        { from: 0, to: 1, day: 10 }, // stale: day 10 < 100 - SATURATION_WINDOW_DAYS
        { from: 0, to: 1, day: 20 }, // stale
        { from: 0, to: 1, day: 95 }, // fresh: within window
      ];

      gsm.missionManager.refreshMissionBoard();

      // Only the entry within the saturation window should remain
      const kept = gsm.state.missions.completionHistory.filter(
        (e) => e.day > 100 - MISSION_CONFIG.SATURATION_WINDOW_DAYS
      );
      expect(gsm.state.missions.completionHistory).toHaveLength(kept.length);
      expect(
        gsm.state.missions.completionHistory.every(
          (e) => e.day > 100 - MISSION_CONFIG.SATURATION_WINDOW_DAYS
        )
      ).toBe(true);
    });

    it('caps completion history at SATURATION_MAX_HISTORY', () => {
      gsm.state.player.daysElapsed = 100;
      gsm.state.missions.board = [];
      gsm.state.missions.boardLastRefresh = -1;

      // Create more entries than the max, all within the window
      const entries = [];
      for (let i = 0; i < MISSION_CONFIG.SATURATION_MAX_HISTORY + 20; i++) {
        entries.push({ from: 0, to: 1, day: 95 });
      }
      gsm.state.missions.completionHistory = entries;

      gsm.missionManager.refreshMissionBoard();

      expect(gsm.state.missions.completionHistory.length).toBeLessThanOrEqual(
        MISSION_CONFIG.SATURATION_MAX_HISTORY
      );
    });

    it('sets boardLastRefresh and emits MISSIONS_CHANGED', () => {
      gsm.state.player.daysElapsed = 42;
      gsm.state.missions.board = [];
      gsm.state.missions.boardLastRefresh = -1;

      const board = gsm.missionManager.refreshMissionBoard();

      expect(Array.isArray(board)).toBe(true);
      expect(gsm.state.missions.boardLastRefresh).toBe(42);
      expect(gsm.state.missions.board).toBe(board);
    });
  });

  describe('getCompletableMissions delivery with no missionCargo and no legacy cargo', () => {
    it('includes simple delivery at destination with no cargo requirements', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'simple-del',
          type: 'delivery',
          requirements: { destination: currentSystem },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.ship.cargo = [];

      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(1);
      expect(completable[0].id).toBe('simple-del');
      expect(completable[0].grossCredits).toBe(200);
    });
  });

  describe('getCompletableMissions fetch with no cargo requirements', () => {
    it('includes fetch mission at giverSystem with no cargo needed', () => {
      const currentSystem = gsm.state.player.currentSystem;
      gsm.state.missions.active = [
        {
          id: 'simple-fetch',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: {},
          rewards: { credits: 150 },
        },
      ];
      gsm.state.ship.cargo = [];

      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(1);
      expect(completable[0].id).toBe('simple-fetch');
      expect(completable[0].grossCredits).toBe(150);
    });

    it('excludes fetch mission at wrong system', () => {
      gsm.state.missions.active = [
        {
          id: 'fetch-wrong',
          type: 'fetch',
          giverSystem: 999,
          requirements: {},
          rewards: { credits: 150 },
        },
      ];

      const completable = gsm.missionManager.getCompletableMissions();
      expect(completable).toHaveLength(0);
    });
  });

  describe('completeMission fetch with giverSystem undefined', () => {
    it('completes fetch mission when giverSystem is undefined (no location gate)', () => {
      gsm.state.missions.active = [
        {
          id: 'fetch-no-giver',
          type: 'fetch',
          giverSystem: undefined,
          requirements: { cargo: 'ore', quantity: 5 },
          rewards: { credits: 200 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 50 }];
      gsm.state.missions.completed = [];

      const result = gsm.missionManager.completeMission('fetch-no-giver');
      expect(result.success).toBe(true);
    });
  });

  describe('completeMission removes legacy cargo for fetch missions', () => {
    it('removes legacy cargo on fetch completion via removeCargoForMission', () => {
      const currentSystem = gsm.state.player.currentSystem;
      const removeSpy = vi
        .spyOn(gsm.shipManager, 'removeCargoForMission')
        .mockImplementation(() => {});
      gsm.state.missions.active = [
        {
          id: 'fetch-legacy',
          type: 'fetch',
          giverSystem: currentSystem,
          requirements: { cargo: 'ore', quantity: 5 },
          rewards: { credits: 300 },
        },
      ];
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 50 }];
      gsm.state.missions.completed = [];

      const result = gsm.missionManager.completeMission('fetch-legacy');
      expect(result.success).toBe(true);
      expect(removeSpy).toHaveBeenCalledWith('ore', 5);
    });
  });
});
