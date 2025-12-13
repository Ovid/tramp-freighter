'use strict';

/**
 * Property Tests for Technology Level Formula
 * Feature: deterministic-economy, Properties 1 & 4: Tech level formula and interpolation
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { ECONOMY_CONFIG, NAVIGATION_CONFIG } from '../../js/game-constants.js';

describe('Technology Level Formula (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 1: Technology level formula correctness
  // Feature: deterministic-economy, Property 1: Technology level formula correctness
  // Validates: Requirements 1.2
  // ========================================================================

  it('Property 1: For any system with distance d from Sol, tech level should equal 10.0 - (9.0 × min(d, 21) / 21)', () => {
    // Generator for star systems with random coordinates
    // Limit to reasonable range to avoid extreme floating point issues
    const starGenerator = fc.record({
      id: fc.integer({ min: 0, max: 200 }),
      x: fc.float({ min: -500, max: 500, noNaN: true }),
      y: fc.float({ min: -500, max: 500, noNaN: true }),
      z: fc.float({ min: -500, max: 500, noNaN: true }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      type: fc.constantFrom('G2', 'K5', 'M3', 'F8', 'A1'),
    });

    fc.assert(
      fc.property(starGenerator, (system) => {
        const calculatedTechLevel = TradingSystem.calculateTechLevel(system);

        const distance =
          Math.hypot(system.x, system.y, system.z) *
          NAVIGATION_CONFIG.LY_PER_UNIT;
        const clampedDistance = Math.min(
          distance,
          ECONOMY_CONFIG.MAX_COORD_DISTANCE
        );
        const expectedTechLevel =
          ECONOMY_CONFIG.MAX_TECH_LEVEL -
          ((ECONOMY_CONFIG.MAX_TECH_LEVEL - ECONOMY_CONFIG.MIN_TECH_LEVEL) *
            clampedDistance) /
            ECONOMY_CONFIG.MAX_COORD_DISTANCE;

        // Floating point tolerance of 10 decimal places
        expect(calculatedTechLevel).toBeCloseTo(expectedTechLevel, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 4: Technology level interpolation
  // Feature: deterministic-economy, Property 4: Technology level interpolation
  // Validates: Requirements 1.5
  // ========================================================================

  it('Property 4: For any system between 0 and 21 light years from Sol, tech level should be strictly between 1.0 and 10.0', () => {
    // Use 0.1-20.9 LY range to ensure strict inequality (not at boundaries)
    const minUnits = Math.fround(0.1 / NAVIGATION_CONFIG.LY_PER_UNIT);
    const maxUnitsForTest = Math.fround(20.9 / NAVIGATION_CONFIG.LY_PER_UNIT);

    const starGenerator = fc
      .record({
        id: fc.integer({ min: 0, max: 200 }),
        // Generate spherical coordinates to ensure we can control distance
        radius: fc.float({
          min: minUnits,
          max: maxUnitsForTest,
          noNaN: true,
        }),
        theta: fc.float({
          min: 0,
          max: Math.fround(Math.PI),
          noNaN: true,
        }), // polar angle
        phi: fc.float({
          min: 0,
          max: Math.fround(2 * Math.PI),
          noNaN: true,
        }), // azimuthal angle
        name: fc.string({ minLength: 1, maxLength: 20 }),
        type: fc.constantFrom('G2', 'K5', 'M3', 'F8', 'A1'),
      })
      .map((data) => {
        // Convert spherical to Cartesian coordinates
        const x = data.radius * Math.sin(data.theta) * Math.cos(data.phi);
        const y = data.radius * Math.sin(data.theta) * Math.sin(data.phi);
        const z = data.radius * Math.cos(data.theta);

        return {
          id: data.id,
          x,
          y,
          z,
          name: data.name,
          type: data.type,
        };
      });

    fc.assert(
      fc.property(starGenerator, (system) => {
        const techLevel = TradingSystem.calculateTechLevel(system);

        expect(techLevel).toBeGreaterThan(ECONOMY_CONFIG.MIN_TECH_LEVEL);
        expect(techLevel).toBeLessThan(ECONOMY_CONFIG.MAX_TECH_LEVEL);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Monotonicity
  // Tech level should decrease monotonically with distance from Sol
  // ========================================================================

  it('Additional: Tech level should decrease monotonically with distance from Sol (within 21 LY)', () => {
    // Generate pairs of systems where system2 is farther than system1
    const systemPairGenerator = fc
      .tuple(
        fc.float({ min: 0, max: 20, noNaN: true }), // distance1 in LY
        fc.float({ min: 0, max: 20, noNaN: true }) // distance2 in LY
      )
      .filter(([d1, d2]) => d1 < d2) // Ensure d1 < d2
      .map(([d1, d2]) => {
        // Convert distances to map units
        const r1 = d1 / NAVIGATION_CONFIG.LY_PER_UNIT;
        const r2 = d2 / NAVIGATION_CONFIG.LY_PER_UNIT;

        // Create systems at these distances (along x-axis for simplicity)
        return [
          { id: 1, x: r1, y: 0, z: 0, name: 'Closer', type: 'G2' },
          { id: 2, x: r2, y: 0, z: 0, name: 'Farther', type: 'G2' },
        ];
      });

    fc.assert(
      fc.property(systemPairGenerator, ([system1, system2]) => {
        const techLevel1 = TradingSystem.calculateTechLevel(system1);
        const techLevel2 = TradingSystem.calculateTechLevel(system2);

        // Closer system should have higher or equal tech level
        expect(techLevel1).toBeGreaterThanOrEqual(techLevel2);
      }),
      { numRuns: 100 }
    );
  });
});
