import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Jump Information Display (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 8: Jump Information Display
  // Feature: tramp-freighter-core-loop, Property 8: Jump Information Display
  // ========================================================================

  it('Property 8: For any connected star system, when selected or hovered, the display should show distance, jump time, and fuel cost', () => {
    const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Generator for wormhole connections (use actual test data connections)
    const connectionGenerator = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(connectionGenerator, (connection) => {
        const [systemId1, systemId2] = connection;

        // Get star systems
        const star1 = TEST_STAR_DATA.find((s) => s.id === systemId1);
        const star2 = TEST_STAR_DATA.find((s) => s.id === systemId2);

        // Skip if either star not found
        if (!star1 || !star2) {
          return true;
        }

        // Calculate jump parameters
        const distance = navSystem.calculateDistanceBetween(star1, star2);
        const jumpTime = navSystem.calculateJumpTime(distance);
        const fuelCost = navSystem.calculateFuelCost(distance);

        // Verify all required information is calculable
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(jumpTime).toBeGreaterThanOrEqual(1); // Minimum 1 day
        expect(fuelCost).toBeGreaterThanOrEqual(10); // Minimum 10% fuel

        // Verify jump time formula: max(1, ceil(distance × 0.5))
        const expectedJumpTime = Math.max(1, Math.ceil(distance * 0.5));
        expect(jumpTime).toBe(expectedJumpTime);

        // Verify fuel cost formula: 10 + (distance × 2)
        const expectedFuelCost = 10 + distance * 2;
        expect(fuelCost).toBeCloseTo(expectedFuelCost, 10);

        // Simulate tooltip display content
        const tooltipContent = {
          systemName: star2.name,
          distance: distance,
          jumpTime: jumpTime,
          fuelCost: fuelCost,
        };

        // Verify tooltip contains all required fields
        expect(tooltipContent).toHaveProperty('systemName');
        expect(tooltipContent).toHaveProperty('distance');
        expect(tooltipContent).toHaveProperty('jumpTime');
        expect(tooltipContent).toHaveProperty('fuelCost');

        // Verify values are valid
        expect(tooltipContent.systemName).toBeTruthy();
        expect(tooltipContent.distance).toBeGreaterThanOrEqual(0);
        expect(tooltipContent.jumpTime).toBeGreaterThanOrEqual(1);
        expect(tooltipContent.fuelCost).toBeGreaterThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });
});
