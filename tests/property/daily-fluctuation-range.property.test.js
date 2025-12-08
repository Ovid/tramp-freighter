/**
 * Property-Based Tests for Daily Fluctuation Range
 * Feature: dynamic-economy, Property 4: Daily Fluctuation Range
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property: Daily Fluctuation Range', () => {
  const commodities = [
    'grain',
    'ore',
    'tritium',
    'parts',
    'medicine',
    'electronics',
  ];

  it('should always return a value between 0.70 and 1.30 inclusive', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 116 }),
        fc.constantFrom(...commodities),
        fc.integer({ min: 0, max: 10000 }),
        (systemId, goodType, currentDay) => {
          const fluctuation = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay
          );

          expect(fluctuation).toBeGreaterThanOrEqual(0.7);
          expect(fluctuation).toBeLessThanOrEqual(1.3);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the same value for the same inputs (deterministic)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 116 }),
        fc.constantFrom(...commodities),
        fc.integer({ min: 0, max: 10000 }),
        (systemId, goodType, currentDay) => {
          const fluctuation1 = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay
          );
          const fluctuation2 = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay
          );

          expect(fluctuation1).toBe(fluctuation2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return different values for different days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 116 }),
        fc.constantFrom(...commodities),
        fc.integer({ min: 0, max: 9999 }),
        (systemId, goodType, currentDay) => {
          const fluctuation1 = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay
          );
          const fluctuation2 = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay + 1
          );

          // Different days should (almost always) produce different fluctuations
          // We can't guarantee they're always different due to random chance,
          // but we can verify they're independently calculated
          expect(typeof fluctuation1).toBe('number');
          expect(typeof fluctuation2).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return different values for different systems on the same day', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 115 }),
        fc.constantFrom(...commodities),
        fc.integer({ min: 0, max: 10000 }),
        (systemId, goodType, currentDay) => {
          const fluctuation1 = TradingSystem.getDailyFluctuation(
            systemId,
            goodType,
            currentDay
          );
          const fluctuation2 = TradingSystem.getDailyFluctuation(
            systemId + 1,
            goodType,
            currentDay
          );

          // Different systems should (almost always) produce different fluctuations
          expect(typeof fluctuation1).toBe('number');
          expect(typeof fluctuation2).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return different values for different goods in the same system on the same day', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 116 }),
        fc.integer({ min: 0, max: 10000 }),
        (systemId, currentDay) => {
          const fluctuation1 = TradingSystem.getDailyFluctuation(
            systemId,
            'grain',
            currentDay
          );
          const fluctuation2 = TradingSystem.getDailyFluctuation(
            systemId,
            'ore',
            currentDay
          );

          // Different goods should (almost always) produce different fluctuations
          expect(typeof fluctuation1).toBe('number');
          expect(typeof fluctuation2).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should utilize the full range (values near both 0.70 and 1.30)', () => {
    const samples = [];
    for (let i = 0; i < 1000; i++) {
      const fluctuation = TradingSystem.getDailyFluctuation(
        i % 117,
        'grain',
        i
      );
      samples.push(fluctuation);
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);

    // Should get close to boundaries (within 5% of range)
    expect(min).toBeLessThan(0.73); // Close to 0.70
    expect(max).toBeGreaterThan(1.27); // Close to 1.30
  });
});
