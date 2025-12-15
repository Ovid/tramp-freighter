import { describe, it, expect } from 'vitest';
import {
  calculateMaxCapacity,
  calculateMaxRefuel,
  calculateMaxAffordable,
} from '../../src/features/refuel/refuelUtils.js';

describe('Refuel Capacity Calculations', () => {
  describe('calculateMaxCapacity', () => {
    it('should allow refueling to exactly 100% from integer fuel levels', () => {
      expect(calculateMaxCapacity(0, 100)).toBe(100);
      expect(calculateMaxCapacity(50, 100)).toBe(50);
      expect(calculateMaxCapacity(99, 100)).toBe(1);
    });

    it('should handle floating point fuel levels correctly', () => {
      // This is the key test - floating point values near 100%
      expect(calculateMaxCapacity(99.5, 100)).toBe(1);
      expect(calculateMaxCapacity(99.9, 100)).toBe(1);
      expect(calculateMaxCapacity(99.99, 100)).toBe(1);
      expect(calculateMaxCapacity(99.1, 100)).toBe(1);
    });

    it('should return 0 when already at max capacity', () => {
      expect(calculateMaxCapacity(100, 100)).toBe(0);
    });

    it('should handle fractional differences correctly', () => {
      expect(calculateMaxCapacity(50.5, 100)).toBe(50);
      expect(calculateMaxCapacity(75.3, 100)).toBe(25);
      expect(calculateMaxCapacity(25.7, 100)).toBe(75);
    });

    it('should work with custom max fuel values', () => {
      expect(calculateMaxCapacity(75, 150)).toBe(75);
      expect(calculateMaxCapacity(149.5, 150)).toBe(1);
    });
  });

  describe('calculateMaxAffordable', () => {
    it('should calculate affordable amount based on credits', () => {
      expect(calculateMaxAffordable(100, 2)).toBe(50);
      expect(calculateMaxAffordable(150, 3)).toBe(50);
      expect(calculateMaxAffordable(500, 5)).toBe(100);
    });

    it('should floor fractional results', () => {
      expect(calculateMaxAffordable(100, 3)).toBe(33); // 33.33... -> 33
      expect(calculateMaxAffordable(50, 7)).toBe(7); // 7.14... -> 7
    });

    it('should return 0 for insufficient credits', () => {
      expect(calculateMaxAffordable(1, 2)).toBe(0);
      expect(calculateMaxAffordable(0, 5)).toBe(0);
    });

    it('should return 0 for invalid price', () => {
      expect(calculateMaxAffordable(100, 0)).toBe(0);
      expect(calculateMaxAffordable(100, -1)).toBe(0);
    });
  });

  describe('calculateMaxRefuel', () => {
    it('should be limited by capacity when credits are abundant', () => {
      const result = calculateMaxRefuel(50, 10000, 2, 100);
      expect(result).toBe(50); // Limited by capacity, not credits
    });

    it('should be limited by credits when capacity is abundant', () => {
      const result = calculateMaxRefuel(10, 100, 5, 100);
      expect(result).toBe(20); // 100 credits / 5 per percent = 20
    });

    it('should handle the edge case of refueling to exactly 100%', () => {
      // Player has 99.5% fuel, plenty of credits
      const result = calculateMaxRefuel(99.5, 1000, 2, 100);
      expect(result).toBe(1); // Should allow refueling 1% to reach 100%
    });

    it('should return 0 when already at max capacity', () => {
      const result = calculateMaxRefuel(100, 1000, 2, 100);
      expect(result).toBe(0);
    });

    it('should return 0 when no credits available', () => {
      const result = calculateMaxRefuel(50, 0, 2, 100);
      expect(result).toBe(0);
    });

    it('should handle floating point fuel levels near 100%', () => {
      expect(calculateMaxRefuel(99.9, 1000, 2, 100)).toBe(1);
      expect(calculateMaxRefuel(99.1, 1000, 2, 100)).toBe(1);
      expect(calculateMaxRefuel(99.99, 1000, 2, 100)).toBe(1);
    });

    it('should work with custom max fuel capacity', () => {
      const result = calculateMaxRefuel(100, 1000, 2, 150);
      expect(result).toBe(50); // Can refuel 50% more with extended tank
    });
  });

  describe('Integration: Refueling to 100%', () => {
    it('should allow complete refuel from various starting points', () => {
      const testCases = [
        { fuel: 0, credits: 1000, price: 2, expected: 100 },
        { fuel: 50, credits: 1000, price: 2, expected: 50 },
        { fuel: 99, credits: 1000, price: 2, expected: 1 },
        { fuel: 99.5, credits: 1000, price: 2, expected: 1 },
        { fuel: 99.9, credits: 1000, price: 2, expected: 1 },
      ];

      testCases.forEach(({ fuel, credits, price, expected }) => {
        const maxRefuel = calculateMaxRefuel(fuel, credits, price, 100);
        expect(maxRefuel).toBe(expected);
        // Verify that refueling this amount would reach or approach 100%
        expect(fuel + maxRefuel).toBeGreaterThanOrEqual(99.99);
      });
    });
  });
});
