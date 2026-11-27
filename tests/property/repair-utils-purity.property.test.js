import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getSystemCondition } from '../../src/features/repair/repairUtils.js';

/**
 * Property: Repair utility functions are pure
 *
 * Validates that repair utility functions are pure (no side effects, same inputs produce same outputs).
 *
 * React Migration Spec: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
describe('Property: Repair utility functions are pure', () => {
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
      { numRuns: 100 }
    );
  });
});
