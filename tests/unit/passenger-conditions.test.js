import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/game/event-conditions.js';
import { CONDITION_TYPES } from '../../src/game/constants.js';

function makeState(activeMissions = []) {
  return {
    missions: { active: activeMissions },
    player: { daysElapsed: 5, credits: 1000, debt: 0, karma: 0 },
    ship: { fuel: 100, hull: 100, cargo: [] },
    world: {
      visitedSystems: [],
      narrativeEvents: {
        fired: [],
        cooldowns: {},
        flags: {},
        dockedSystems: [],
      },
    },
  };
}

function makePassengerMission(passengerType) {
  return {
    id: `passenger_${passengerType}`,
    type: 'passenger',
    passenger: { type: passengerType, satisfaction: 50 },
  };
}

describe('Passenger Condition Evaluators', () => {
  it('should define HAS_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_PASSENGER).toBe('has_passenger');
  });

  it('should define HAS_WEALTHY_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_WEALTHY_PASSENGER).toBe('has_wealthy_passenger');
  });

  it('should define HAS_FAMILY_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_FAMILY_PASSENGER).toBe('has_family_passenger');
  });

  describe('has_passenger', () => {
    it('should return true when any passenger mission is active', () => {
      const state = makeState([makePassengerMission('scientist')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false when no passenger missions are active', () => {
      const state = makeState([{ id: 'cargo_1', type: 'delivery' }]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });

  describe('has_wealthy_passenger', () => {
    it('should return true when wealthy passenger is active', () => {
      const state = makeState([makePassengerMission('wealthy')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_WEALTHY_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false for non-wealthy passengers', () => {
      const state = makeState([makePassengerMission('scientist')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_WEALTHY_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });

  describe('has_family_passenger', () => {
    it('should return true when family passenger is active', () => {
      const state = makeState([makePassengerMission('family')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_FAMILY_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false for non-family passengers', () => {
      const state = makeState([makePassengerMission('business')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_FAMILY_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });
});
