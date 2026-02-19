import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/game/event-conditions.js';

describe('evaluateCondition', () => {
  const baseState = {
    player: {
      currentSystem: 0,
      debt: 10000,
      karma: 0,
      daysElapsed: 15,
      factions: { authorities: 0, outlaws: 0, traders: 0, civilians: 0 },
    },
    ship: {
      fuel: 50,
      hull: 80,
      cargo: [{ good: 'ore', qty: 5, buyPrice: 10 }],
    },
    world: {
      visitedSystems: [0, 1],
      narrativeEvents: { fired: [], cooldowns: {}, flags: { met_chen: true } },
    },
  };

  describe('first_visit', () => {
    it('should return true when system not in visitedSystems', () => {
      const context = { system: 4 };
      expect(
        evaluateCondition({ type: 'first_visit' }, baseState, context)
      ).toBe(true);
    });

    it('should return false when system already visited', () => {
      const context = { system: 0 };
      expect(
        evaluateCondition({ type: 'first_visit' }, baseState, context)
      ).toBe(false);
    });
  });

  describe('debt_above', () => {
    it('should return true when debt exceeds value', () => {
      expect(
        evaluateCondition({ type: 'debt_above', value: 8000 }, baseState)
      ).toBe(true);
    });

    it('should return false when debt is below value', () => {
      expect(
        evaluateCondition({ type: 'debt_above', value: 15000 }, baseState)
      ).toBe(false);
    });
  });

  describe('debt_below', () => {
    it('should return true when debt is below value', () => {
      expect(
        evaluateCondition({ type: 'debt_below', value: 15000 }, baseState)
      ).toBe(true);
    });

    it('should return false when debt exceeds value', () => {
      expect(
        evaluateCondition({ type: 'debt_below', value: 5000 }, baseState)
      ).toBe(false);
    });
  });

  describe('karma_above', () => {
    it('should return true when karma exceeds value', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, karma: 10 },
      };
      expect(evaluateCondition({ type: 'karma_above', value: 5 }, state)).toBe(
        true
      );
    });

    it('should return false when karma is below value', () => {
      expect(
        evaluateCondition({ type: 'karma_above', value: 5 }, baseState)
      ).toBe(false);
    });
  });

  describe('karma_below', () => {
    it('should return true when karma is below value', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, karma: -10 },
      };
      expect(evaluateCondition({ type: 'karma_below', value: -5 }, state)).toBe(
        true
      );
    });
  });

  describe('fuel_below', () => {
    it('should return true when fuel is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, fuel: 8 } };
      expect(evaluateCondition({ type: 'fuel_below', value: 10 }, state)).toBe(
        true
      );
    });

    it('should return false when fuel is above value', () => {
      expect(
        evaluateCondition({ type: 'fuel_below', value: 10 }, baseState)
      ).toBe(false);
    });
  });

  describe('hull_below', () => {
    it('should return true when hull is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, hull: 25 } };
      expect(evaluateCondition({ type: 'hull_below', value: 30 }, state)).toBe(
        true
      );
    });
  });

  describe('days_past', () => {
    it('should return true when daysElapsed >= value', () => {
      expect(
        evaluateCondition({ type: 'days_past', value: 15 }, baseState)
      ).toBe(true);
    });

    it('should return false when daysElapsed < value', () => {
      expect(
        evaluateCondition({ type: 'days_past', value: 30 }, baseState)
      ).toBe(false);
    });
  });

  describe('has_visited', () => {
    it('should return true when system is in visitedSystems', () => {
      expect(
        evaluateCondition({ type: 'has_visited', system: 1 }, baseState)
      ).toBe(true);
    });

    it('should return false when system not visited', () => {
      expect(
        evaluateCondition({ type: 'has_visited', system: 99 }, baseState)
      ).toBe(false);
    });
  });

  describe('has_cargo', () => {
    it('should return true when cargo contains the good', () => {
      expect(
        evaluateCondition({ type: 'has_cargo', good: 'ore' }, baseState)
      ).toBe(true);
    });

    it('should return false when cargo does not contain the good', () => {
      expect(
        evaluateCondition({ type: 'has_cargo', good: 'medicine' }, baseState)
      ).toBe(false);
    });
  });

  describe('flag_set', () => {
    it('should return true when flag exists in narrativeEvents.flags', () => {
      expect(
        evaluateCondition({ type: 'flag_set', flag: 'met_chen' }, baseState)
      ).toBe(true);
    });

    it('should return false when flag is not set', () => {
      expect(
        evaluateCondition({ type: 'flag_set', flag: 'unknown_flag' }, baseState)
      ).toBe(false);
    });
  });

  describe('array of conditions (AND logic)', () => {
    it('should return true when all conditions in array are met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 15 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(true);
    });

    it('should return false when any condition in array is not met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 30 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(evaluateCondition([], baseState)).toBe(true);
    });
  });

  describe('null condition', () => {
    it('should return true when condition is null', () => {
      expect(evaluateCondition(null, baseState)).toBe(true);
    });
  });

  describe('unknown condition type', () => {
    it('should return false for unknown condition types', () => {
      expect(evaluateCondition({ type: 'bogus' }, baseState)).toBe(false);
    });
  });
});
