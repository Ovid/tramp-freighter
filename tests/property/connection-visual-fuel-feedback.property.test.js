import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { determineConnectionColor } from '../../js/views/starmap-wormholes.js';

describe('Connection Visual Fuel Feedback (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 13: Connection Visual Fuel Feedback
  // Feature: tramp-freighter-core-loop, Property 13: Connection Visual Fuel Feedback
  // ========================================================================

  it('Property 13: Connection color determination based on fuel availability', () => {
    const fuelGenerator = fc.float({ min: 0, max: 100, noNaN: true });
    const fuelCostGenerator = fc.float({ min: 10, max: 50, noNaN: true });

    fc.assert(
      fc.property(fuelGenerator, fuelCostGenerator, (currentFuel, fuelCost) => {
        const color = determineConnectionColor(currentFuel, fuelCost);

        // Invariant 1: Result is always one of three valid states
        expect(['insufficient', 'warning', 'sufficient']).toContain(color);

        // Invariant 2: Insufficient fuel always returns 'insufficient'
        if (currentFuel < fuelCost) {
          expect(color).toBe('insufficient');
        }

        // Invariant 3: Warning range is exactly 10-20% remaining
        const fuelRemaining = currentFuel - fuelCost;
        if (
          currentFuel >= fuelCost &&
          fuelRemaining >= 10 &&
          fuelRemaining <= 20
        ) {
          expect(color).toBe('warning');
        }

        // Invariant 4: Sufficient fuel outside warning range
        if (
          currentFuel >= fuelCost &&
          (fuelRemaining < 10 || fuelRemaining > 20)
        ) {
          expect(color).toBe('sufficient');
        }
      }),
      { numRuns: 1000 }
    );
  });

  it('Property 13: Boundary conditions for warning threshold', () => {
    // Test exact boundaries of warning range (10-20% remaining)
    expect(determineConnectionColor(30, 20)).toBe('warning'); // Exactly 10% remaining
    expect(determineConnectionColor(40, 20)).toBe('warning'); // Exactly 20% remaining
    expect(determineConnectionColor(29, 20)).toBe('sufficient'); // 9% remaining (below warning)
    expect(determineConnectionColor(41, 20)).toBe('sufficient'); // 21% remaining (above warning)
    expect(determineConnectionColor(19, 20)).toBe('insufficient'); // Insufficient fuel
  });
});
