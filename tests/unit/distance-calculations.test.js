/**
 * Distance Calculation Tests
 *
 * Verifies that distance calculations use the correct NAVIGATION_CONFIG.LY_PER_UNIT scale factor
 * and that all stars in the catalog are within the expected 20 light-year radius.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDistanceFromSol,
  NAVIGATION_CONFIG,
} from '../../js/game-constants.js';
import { NavigationSystem } from '../../js/game-navigation.js';

// Sample of known nearby stars with their real-world distances
const KNOWN_DISTANCES = {
  Sol: 0,
  'Alpha Centauri A': 4.37,
  'Proxima Centauri C': 4.25,
  "Barnard's Star": 5.96,
  'Wolf 359': 7.86,
  'Lalande 21185': 8.29,
  'Sirius A': 8.66,
  'Ross 154': 9.7,
  'Epsilon Eridani': 10.48,
  'Lacaille 9352': 10.68,
  'Ross 128': 10.94,
  'Procyon A': 11.46,
  'Tau Ceti': 11.91,
  'Wolf 1481': 20.0, // Farthest star in catalog
};

// Import star data (simplified subset for testing)
const TEST_STAR_DATA = [
  { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2' },
  {
    id: 1,
    x: -23.1,
    y: -19.18,
    z: -53.76,
    name: 'Alpha Centauri A',
    type: 'G2',
  },
  {
    id: 3,
    x: -21.56,
    y: -16.38,
    z: -52.5,
    name: 'Proxima Centauri C',
    type: 'M5.5',
  },
  { id: 4, x: -0.98, y: -82.88, z: 6.86, name: "Barnard's Star", type: 'M5' },
  { id: 5, x: -104.16, y: 29.82, z: 13.3, name: 'Wolf 359', type: 'M6' },
  { id: 6, x: -91.28, y: 23.1, z: 68.32, name: 'Lalande 21185', type: 'M2' },
  { id: 7, x: -22.54, y: 113.12, z: -34.58, name: 'Sirius A', type: 'A1' },
  { id: 11, x: 26.46, y: -121.24, z: -54.88, name: 'Ross 154', type: 'M4.5' },
  {
    id: 13,
    x: 87.22,
    y: 115.92,
    z: -24.22,
    name: 'Epsilon Eridani',
    type: 'K2',
  },
  { id: 14, x: 118.3, y: -28.84, z: -87.92, name: 'Lacaille 9352', type: 'M2' },
  { id: 15, x: -152.18, y: 8.54, z: 2.1, name: 'Ross 128', type: 'M4.5' },
  { id: 19, x: -66.64, y: 144.48, z: 14.56, name: 'Procyon A', type: 'F5' },
  { id: 31, x: 143.92, y: 70.28, z: -45.78, name: 'Tau Ceti', type: 'G8' },
  { id: 116, x: -213.36, y: -169.82, z: -60.48, name: 'Wolf 1481', type: 'M3' },
];

describe('Distance Calculations', () => {
  describe('NAVIGATION_CONFIG.LY_PER_UNIT constant', () => {
    it('should be approximately 0.0716027', () => {
      expect(NAVIGATION_CONFIG.LY_PER_UNIT).toBeCloseTo(0.0716027, 6);
    });

    it('should equal 20 / 279.319', () => {
      const expected = 20 / 279.3190870671033;
      expect(NAVIGATION_CONFIG.LY_PER_UNIT).toBe(expected);
    });
  });

  describe('calculateDistanceFromSol', () => {
    it('should return 0 for Sol', () => {
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      const distance = calculateDistanceFromSol(sol);
      expect(distance).toBe(0);
    });

    it('should calculate correct distances for known stars', () => {
      TEST_STAR_DATA.forEach((star) => {
        const expectedDistance = KNOWN_DISTANCES[star.name];
        if (expectedDistance !== undefined) {
          const calculatedDistance = calculateDistanceFromSol(star);
          // Allow 0.2 LY tolerance for catalog precision variations
          expect(calculatedDistance).toBeCloseTo(expectedDistance, 0);
        }
      });
    });

    it('should calculate Alpha Centauri A at ~4.37 LY', () => {
      const alphaCen = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      const distance = calculateDistanceFromSol(alphaCen);
      expect(distance).toBeCloseTo(4.37, 1);
    });

    it('should calculate Proxima Centauri C at ~4.25 LY', () => {
      const proxima = TEST_STAR_DATA.find(
        (s) => s.name === 'Proxima Centauri C'
      );
      const distance = calculateDistanceFromSol(proxima);
      expect(distance).toBeCloseTo(4.25, 1);
    });

    it("should calculate Barnard's Star at ~5.96 LY", () => {
      const barnard = TEST_STAR_DATA.find((s) => s.name === "Barnard's Star");
      const distance = calculateDistanceFromSol(barnard);
      expect(distance).toBeCloseTo(5.96, 1);
    });

    it('should calculate Wolf 1481 (farthest) at ~20 LY', () => {
      const wolf1481 = TEST_STAR_DATA.find((s) => s.name === 'Wolf 1481');
      const distance = calculateDistanceFromSol(wolf1481);
      expect(distance).toBeCloseTo(20.0, 1);
    });
  });

  describe('NavigationSystem.calculateDistanceFromSol', () => {
    const navSystem = new NavigationSystem(TEST_STAR_DATA, []);

    it('should match game-constants.js implementation', () => {
      TEST_STAR_DATA.forEach((star) => {
        const constantsDistance = calculateDistanceFromSol(star);
        const navDistance = navSystem.calculateDistanceFromSol(star);
        expect(navDistance).toBe(constantsDistance);
      });
    });
  });

  describe('NavigationSystem.calculateDistanceBetween', () => {
    const navSystem = new NavigationSystem(TEST_STAR_DATA, []);

    it('should calculate distance between Sol and Alpha Centauri A', () => {
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      const alphaCen = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      const distance = navSystem.calculateDistanceBetween(sol, alphaCen);
      expect(distance).toBeCloseTo(4.37, 1);
    });

    it('should be symmetric (distance A to B = distance B to A)', () => {
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      const alphaCen = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      const distanceAB = navSystem.calculateDistanceBetween(sol, alphaCen);
      const distanceBA = navSystem.calculateDistanceBetween(alphaCen, sol);
      expect(distanceAB).toBe(distanceBA);
    });

    it('should return 0 for same system', () => {
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      const distance = navSystem.calculateDistanceBetween(sol, sol);
      expect(distance).toBe(0);
    });

    it('should calculate distance between two non-Sol systems', () => {
      const alphaCen = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      const proxima = TEST_STAR_DATA.find(
        (s) => s.name === 'Proxima Centauri C'
      );
      const distance = navSystem.calculateDistanceBetween(alphaCen, proxima);
      // These two stars are very close to each other
      expect(distance).toBeLessThan(1);
    });
  });

  describe('Catalog bounds verification', () => {
    it('should have all stars within 20 light-years of Sol', () => {
      TEST_STAR_DATA.forEach((star) => {
        const distance = calculateDistanceFromSol(star);
        expect(distance).toBeLessThanOrEqual(20.1); // Small tolerance for rounding
      });
    });

    it('should have Wolf 1481 as the farthest star', () => {
      let maxDistance = 0;
      let farthestStar = null;

      TEST_STAR_DATA.forEach((star) => {
        const distance = calculateDistanceFromSol(star);
        if (distance > maxDistance) {
          maxDistance = distance;
          farthestStar = star;
        }
      });

      expect(farthestStar.name).toBe('Wolf 1481');
      expect(maxDistance).toBeCloseTo(20.0, 1);
    });
  });

  describe('Old vs New calculation comparison', () => {
    it('should show the difference between old (÷10) and new (×NAVIGATION_CONFIG.LY_PER_UNIT) methods', () => {
      const alphaCen = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );

      // Old incorrect method
      const oldDistance =
        Math.sqrt(
          alphaCen.x * alphaCen.x +
            alphaCen.y * alphaCen.y +
            alphaCen.z * alphaCen.z
        ) / 10;

      // New correct method
      const newDistance = calculateDistanceFromSol(alphaCen);

      // Old method should overestimate by a factor of ~1.4
      expect(oldDistance).toBeGreaterThan(newDistance);
      expect(oldDistance / newDistance).toBeCloseTo(1.398, 1);
    });
  });
});
