import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

function makePassengerMission(overrides = {}) {
  return {
    id: 'test_passenger_001',
    type: 'passenger',
    title: 'Passenger: Test Person',
    description: 'Transport Test Person.',
    giver: 'passenger',
    giverSystem: 0,
    requirements: {
      destination: 4,
      deadline: 10,
      cargoSpace: 2,
    },
    rewards: { credits: 800, faction: { civilians: 5 } },
    penalties: { failure: { faction: { civilians: -3 } } },
    passenger: {
      name: 'Test Person',
      type: 'scientist',
      satisfaction: 50,
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
      dialogue: 'Fascinating ship you have.',
    },
    ...overrides,
  };
}

describe('Passenger Satisfaction & Payment', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('acceptMission cargo space check', () => {
    it('should reject passenger mission when insufficient cargo space', () => {
      const state = manager.getState();
      state.ship.cargo = [{ good: 'grain', qty: 49, purchasePrice: 10 }];

      const mission = makePassengerMission({
        requirements: { destination: 4, deadline: 10, cargoSpace: 2 },
      });
      const result = manager.acceptMission(mission);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('cargo space');
    });

    it('should accept passenger mission when enough cargo space', () => {
      const mission = makePassengerMission();
      const result = manager.acceptMission(mission);
      expect(result.success).toBe(true);
    });
  });

  describe('updatePassengerSatisfaction', () => {
    it('should reduce satisfaction on delay weighted by speed', () => {
      manager.acceptMission(makePassengerMission());
      const before = manager.getState().missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction('test_passenger_001', 'delay');

      const after = manager.getState().missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.DELAY * 0.5
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should reduce satisfaction on combat weighted by safety', () => {
      manager.acceptMission(makePassengerMission());
      const before = manager.getState().missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction('test_passenger_001', 'combat');

      const after = manager.getState().missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.COMBAT * 0.2
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should reduce satisfaction when life support is low', () => {
      const state = manager.getState();
      state.ship.lifeSupport = 30;

      manager.acceptMission(makePassengerMission());
      const before = state.missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction(
        'test_passenger_001',
        'low_life_support'
      );

      const after = state.missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.LOW_LIFE_SUPPORT * 0.3
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should clamp satisfaction to 0-100', () => {
      manager.acceptMission(makePassengerMission());
      const passenger = manager.getState().missions.active[0].passenger;
      passenger.satisfaction = 2;

      manager.updatePassengerSatisfaction('test_passenger_001', 'combat');

      expect(passenger.satisfaction).toBe(0);
    });

    it('should emit missionsChanged after updating satisfaction', () => {
      manager.acceptMission(makePassengerMission());
      let emitted = null;
      manager.subscribe('missionsChanged', (data) => {
        emitted = data;
      });

      manager.updatePassengerSatisfaction('test_passenger_001', 'delay');

      expect(emitted).not.toBeNull();
    });
  });

  describe('completeMission with passenger payment', () => {
    it('should apply very satisfied multiplier when satisfaction >= 80', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 85;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 1.4));
    });

    it('should apply satisfied multiplier when satisfaction >= 60', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 65;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 1.25));
    });

    it('should apply dissatisfied multiplier when satisfaction < 40', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 25;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 0.8));
    });

    it('should not apply on-time bonus when past deadline', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.player.daysElapsed = 20;
      state.missions.active[0].passenger.satisfaction = 85;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 1.3));
    });
  });
});
