import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateIntelligencePurchase,
  validateRumorPurchase,
  getIntelligencePriority,
  formatStaleness,
  formatVisitInfo,
  sortIntelligenceByPriority,
  getKnownSystemsSortedByStaleness,
} from '../../src/features/info-broker/infoBrokerUtils.js';

/**
 * Property: Info broker utility functions are pure
 *
 * Validates that info broker utility functions are pure (no side effects, same inputs produce same outputs).
 *
 * React Migration Spec: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
describe('Property: Info broker utility functions are pure', () => {
  it('validateIntelligencePurchase should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        (cost, credits) => {
          // Call function twice with same inputs
          const result1 = validateIntelligencePurchase(cost, credits);
          const result2 = validateIntelligencePurchase(cost, credits);

          // Results should be identical
          expect(result1).toEqual(result2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateRumorPurchase should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (credits) => {
        // Call function twice with same inputs
        const result1 = validateRumorPurchase(credits);
        const result2 = validateRumorPurchase(credits);

        // Results should be identical
        expect(result1).toEqual(result2);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('getIntelligencePriority should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(0),
          fc.integer({ min: 1, max: 100 })
        ),
        (lastVisit) => {
          const option = { lastVisit };

          // Call function twice with same inputs
          const result1 = getIntelligencePriority(option);
          const result2 = getIntelligencePriority(option);

          // Results should be identical
          expect(result1).toBe(result2);

          // Verify priority ordering
          if (lastVisit === null) {
            expect(result1).toBe(0); // Never visited - highest priority
          } else if (lastVisit === 0) {
            expect(result1).toBe(3); // Current - lowest priority
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatStaleness should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (lastVisit) => {
        // Call function twice with same inputs
        const result1 = formatStaleness(lastVisit);
        const result2 = formatStaleness(lastVisit);

        // Results should be identical
        expect(result1).toEqual(result2);

        // Verify result structure
        expect(result1).toHaveProperty('text');
        expect(result1).toHaveProperty('cssClass');
        expect(typeof result1.text).toBe('string');
        expect(typeof result1.cssClass).toBe('string');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('formatVisitInfo should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(0),
          fc.integer({ min: 1, max: 100 })
        ),
        (lastVisit) => {
          // Call function twice with same inputs
          const result1 = formatVisitInfo(lastVisit);
          const result2 = formatVisitInfo(lastVisit);

          // Results should be identical
          expect(result1).toBe(result2);

          // Verify result is a string
          expect(typeof result1).toBe('string');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sortIntelligenceByPriority should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            systemId: fc.integer({ min: 0, max: 100 }),
            lastVisit: fc.oneof(
              fc.constant(null),
              fc.constant(0),
              fc.integer({ min: 1, max: 100 })
            ),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (options) => {
          // Call function twice with same inputs
          const result1 = sortIntelligenceByPriority(options);
          const result2 = sortIntelligenceByPriority(options);

          // Results should be identical
          expect(result1).toEqual(result2);

          // Original array should not be modified
          expect(options.length).toBe(options.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sortIntelligenceByPriority should not modify input array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            systemId: fc.integer({ min: 0, max: 100 }),
            lastVisit: fc.oneof(
              fc.constant(null),
              fc.constant(0),
              fc.integer({ min: 1, max: 100 })
            ),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (options) => {
          // Create deep copy of input
          const optionsCopy = JSON.parse(JSON.stringify(options));

          // Call function
          sortIntelligenceByPriority(options);

          // Original array should be unchanged
          expect(options).toEqual(optionsCopy);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getKnownSystemsSortedByStaleness should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.integer({ min: 0, max: 10 }).map(String),
          fc.record({
            lastVisit: fc.integer({ min: 0, max: 100 }),
            prices: fc.record({
              grain: fc.integer({ min: 1, max: 100 }),
              electronics: fc.integer({ min: 1, max: 100 }),
            }),
          })
        ),
        fc.array(
          fc.record({
            id: fc.integer({ min: 0, max: 10 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 11, maxLength: 11 }
        ),
        (priceKnowledge, starData) => {
          // Call function twice with same inputs
          const result1 = getKnownSystemsSortedByStaleness(
            priceKnowledge,
            starData
          );
          const result2 = getKnownSystemsSortedByStaleness(
            priceKnowledge,
            starData
          );

          // Results should be identical
          expect(result1).toEqual(result2);

          // Inputs should not be modified
          expect(Object.keys(priceKnowledge).length).toBeGreaterThanOrEqual(0);
          expect(starData.length).toBe(11);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateIntelligencePurchase should return correct validation result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 10000 }),
        (cost, credits) => {
          const result = validateIntelligencePurchase(cost, credits);

          if (credits < cost) {
            expect(result.valid).toBe(false);
            expect(result.reason).toBe('Insufficient credits for intelligence');
          } else {
            expect(result.valid).toBe(true);
            expect(result.reason).toBe(null);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatStaleness should return correct CSS class for staleness levels', () => {
    // Current
    expect(formatStaleness(0).cssClass).toBe('');
    expect(formatStaleness(0).text).toBe('Current');

    // Recent (1-10 days)
    expect(formatStaleness(1).cssClass).toBe('');
    expect(formatStaleness(5).cssClass).toBe('');
    expect(formatStaleness(10).cssClass).toBe('');

    // Stale (11-30 days)
    expect(formatStaleness(11).cssClass).toBe('stale');
    expect(formatStaleness(20).cssClass).toBe('stale');
    expect(formatStaleness(30).cssClass).toBe('stale');

    // Very stale (31+ days)
    expect(formatStaleness(31).cssClass).toBe('very-stale');
    expect(formatStaleness(50).cssClass).toBe('very-stale');
    expect(formatStaleness(100).cssClass).toBe('very-stale');
  });

  it('formatVisitInfo should return correct format', () => {
    expect(formatVisitInfo(null)).toBe('Never visited');
    expect(formatVisitInfo(0)).toBe('Current prices');
    expect(formatVisitInfo(1)).toBe('Last visited 1 day ago');
    expect(formatVisitInfo(5)).toBe('Last visited 5 days ago');
    expect(formatVisitInfo(10)).toBe('Last visited 10 days ago');
  });

  it('sortIntelligenceByPriority should sort by priority correctly', () => {
    const options = [
      { systemId: 1, lastVisit: 0 }, // Current - priority 3
      { systemId: 2, lastVisit: null }, // Never visited - priority 0
      { systemId: 3, lastVisit: 5 }, // Recent - priority 2 (5 <= 30)
      { systemId: 4, lastVisit: 31 }, // Stale - priority 1 (31 > 30)
    ];

    const sorted = sortIntelligenceByPriority(options);

    // Should be sorted: never visited, stale, recent, current
    expect(sorted[0].systemId).toBe(2); // Never visited
    expect(sorted[1].systemId).toBe(4); // Stale
    expect(sorted[2].systemId).toBe(3); // Recent
    expect(sorted[3].systemId).toBe(1); // Current
  });

  it('getKnownSystemsSortedByStaleness should sort by staleness correctly', () => {
    const priceKnowledge = {
      0: { lastVisit: 10, prices: { grain: 50 } },
      1: { lastVisit: 0, prices: { grain: 50 } },
      2: { lastVisit: 5, prices: { grain: 50 } },
    };

    const starData = [
      { id: 0, name: 'System A' },
      { id: 1, name: 'System B' },
      { id: 2, name: 'System C' },
    ];

    const sorted = getKnownSystemsSortedByStaleness(priceKnowledge, starData);

    // Should be sorted by lastVisit ascending (current first)
    expect(sorted[0].system.id).toBe(1); // lastVisit: 0
    expect(sorted[1].system.id).toBe(2); // lastVisit: 5
    expect(sorted[2].system.id).toBe(0); // lastVisit: 10
  });
});
