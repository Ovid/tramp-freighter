import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateRepairCost,
  calculateRepairAllCost,
  validateRepair,
  validateRepairAll,
  getSystemCondition,
} from '../../src/features/repair/repairUtils.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

/**
 * Property: Repair utility functions are pure
 *
 * Validates that repair utility functions are pure (no side effects, same inputs produce same outputs).
 *
 * React Migration Spec: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
describe('Property: Repair utility functions are pure', () => {
  it('calculateRepairCost should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (amount, currentCondition) => {
          // Call function twice with same inputs
          const result1 = calculateRepairCost(amount, currentCondition);
          const result2 = calculateRepairCost(amount, currentCondition);

          // Results should be identical
          expect(result1).toBe(result2);

          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateRepairCost should return 0 when at max condition', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (amount) => {
        const result = calculateRepairCost(
          amount,
          SHIP_CONFIG.CONDITION_BOUNDS.MAX
        );
        expect(result).toBe(0);
        return result === 0;
      }),
      { numRuns: 50 }
    );
  });

  it('calculateRepairAllCost should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const condition = { hull, engine, lifeSupport };

          // Call function twice with same inputs
          const result1 = calculateRepairAllCost(condition);
          const result2 = calculateRepairAllCost(condition);

          // Results should be identical
          expect(result1).toBe(result2);

          // Condition object should not be modified
          expect(condition.hull).toBe(hull);
          expect(condition.engine).toBe(engine);
          expect(condition.lifeSupport).toBe(lifeSupport);

          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateRepairAllCost should not modify input condition object', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const condition = { hull, engine, lifeSupport };

          // Create deep copy
          const conditionCopy = JSON.parse(JSON.stringify(condition));

          // Call function
          calculateRepairAllCost(condition);

          // Condition should be unchanged
          expect(condition).toEqual(conditionCopy);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateRepair should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 1, max: 100 }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.integer({ min: 0, max: 10000 }),
        (systemType, amount, currentCondition, credits) => {
          const state = {
            ship: {
              hull: currentCondition,
              engine: currentCondition,
              lifeSupport: currentCondition,
              [systemType]: currentCondition,
            },
            player: { credits },
          };

          // Call function twice with same inputs
          const result1 = validateRepair(systemType, amount, state);
          const result2 = validateRepair(systemType, amount, state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.player.credits).toBe(credits);
          expect(state.ship[systemType]).toBe(currentCondition);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateRepairAll should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.integer({ min: 0, max: 10000 }),
        (hull, engine, lifeSupport, credits) => {
          const condition = { hull, engine, lifeSupport };

          // Call function twice with same inputs
          const result1 = validateRepairAll(condition, credits);
          const result2 = validateRepairAll(condition, credits);

          // Results should be identical
          expect(result1).toEqual(result2);

          // Condition should not be modified
          expect(condition.hull).toBe(hull);
          expect(condition.engine).toBe(engine);
          expect(condition.lifeSupport).toBe(lifeSupport);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getSystemCondition should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        (hull, engine, lifeSupport, systemType) => {
          const condition = { hull, engine, lifeSupport };

          // Call function twice with same inputs
          const result1 = getSystemCondition(condition, systemType);
          const result2 = getSystemCondition(condition, systemType);

          // Results should be identical
          expect(result1).toBe(result2);

          // Condition should not be modified
          expect(condition.hull).toBe(hull);
          expect(condition.engine).toBe(engine);
          expect(condition.lifeSupport).toBe(lifeSupport);

          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getSystemCondition should return correct value for each system', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const condition = { hull, engine, lifeSupport };

          expect(getSystemCondition(condition, 'hull')).toBe(hull);
          expect(getSystemCondition(condition, 'engine')).toBe(engine);
          expect(getSystemCondition(condition, 'lifeSupport')).toBe(
            lifeSupport
          );

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateRepair should reject negative amounts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: -100, max: 0 }),
        (systemType, amount) => {
          const state = {
            ship: { hull: 50, engine: 50, lifeSupport: 50 },
            player: { credits: 10000 },
          };

          const result = validateRepair(systemType, amount, state);

          expect(result.valid).toBe(false);
          expect(result.reason).toContain('positive');

          return !result.valid;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateRepair should reject repairs when at max condition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 1, max: 100 }),
        (systemType, amount) => {
          const state = {
            ship: {
              hull: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
              engine: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
              lifeSupport: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
            },
            player: { credits: 10000 },
          };

          const result = validateRepair(systemType, amount, state);

          expect(result.valid).toBe(false);
          expect(result.reason).toContain('maximum');

          return !result.valid;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateRepairAll should reject when all systems at max', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (credits) => {
        const condition = {
          hull: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          engine: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          lifeSupport: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        };

        const result = validateRepairAll(condition, credits);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('maximum');

        return !result.valid;
      }),
      { numRuns: 50 }
    );
  });
});
