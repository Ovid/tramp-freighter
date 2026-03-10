import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';
import { createTestGame } from '../test-utils.js';

function makePassengerMission(id, satisfaction = 50) {
  return {
    id,
    type: 'passenger',
    title: `Passenger: Test ${id}`,
    requirements: { destination: 4, deadline: 10, cargoSpace: 2 },
    rewards: { credits: 800 },
    passenger: {
      name: `Test ${id}`,
      type: 'scientist',
      satisfaction,
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
      dialogue: 'Test dialogue.',
    },
  };
}

describe('Passenger Satisfaction Effect Resolution', () => {
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    manager = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('passengerSatisfaction as cost', () => {
    it('should decrease satisfaction for all active passenger missions', () => {
      const state = manager.getState();
      state.missions.active = [
        makePassengerMission('p1', 50),
        makePassengerMission('p2', 70),
      ];

      applyEncounterOutcome(manager, {
        costs: { passengerSatisfaction: 10 },
        rewards: {},
      });

      expect(state.missions.active[0].passenger.satisfaction).toBe(40);
      expect(state.missions.active[1].passenger.satisfaction).toBe(60);
    });

    it('should not go below 0', () => {
      const state = manager.getState();
      state.missions.active = [makePassengerMission('p1', 3)];

      applyEncounterOutcome(manager, {
        costs: { passengerSatisfaction: 10 },
        rewards: {},
      });

      expect(state.missions.active[0].passenger.satisfaction).toBe(0);
    });

    it('should not affect non-passenger missions', () => {
      const state = manager.getState();
      state.missions.active = [
        { id: 'cargo_1', type: 'delivery', requirements: {} },
        makePassengerMission('p1', 50),
      ];

      applyEncounterOutcome(manager, {
        costs: { passengerSatisfaction: 10 },
        rewards: {},
      });

      expect(state.missions.active[0]).not.toHaveProperty('passenger');
      expect(state.missions.active[1].passenger.satisfaction).toBe(40);
    });
  });

  describe('passengerSatisfaction as reward', () => {
    it('should increase satisfaction for all active passenger missions', () => {
      const state = manager.getState();
      state.missions.active = [
        makePassengerMission('p1', 50),
        makePassengerMission('p2', 30),
      ];

      applyEncounterOutcome(manager, {
        costs: {},
        rewards: { passengerSatisfaction: 15 },
      });

      expect(state.missions.active[0].passenger.satisfaction).toBe(65);
      expect(state.missions.active[1].passenger.satisfaction).toBe(45);
    });

    it('should not go above 100', () => {
      const state = manager.getState();
      state.missions.active = [makePassengerMission('p1', 95)];

      applyEncounterOutcome(manager, {
        costs: {},
        rewards: { passengerSatisfaction: 15 },
      });

      expect(state.missions.active[0].passenger.satisfaction).toBe(100);
    });
  });

  describe('combined effects', () => {
    it('should handle credits cost with satisfaction reward', () => {
      const state = manager.getState();
      const creditsBefore = state.player.credits;
      state.missions.active = [makePassengerMission('p1', 50)];

      applyEncounterOutcome(manager, {
        costs: { credits: 20 },
        rewards: { passengerSatisfaction: 5 },
      });

      expect(state.player.credits).toBe(creditsBefore - 20);
      expect(state.missions.active[0].passenger.satisfaction).toBe(55);
    });
  });

  describe('event emission', () => {
    it('should emit missionsChanged when satisfaction changes', () => {
      const state = manager.getState();
      state.missions.active = [makePassengerMission('p1', 50)];

      let emitted = null;
      manager.subscribe('missionsChanged', (data) => {
        emitted = data;
      });

      applyEncounterOutcome(manager, {
        costs: { passengerSatisfaction: 5 },
        rewards: {},
      });

      expect(emitted).not.toBeNull();
    });
  });
});
