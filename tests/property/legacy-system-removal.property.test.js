'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { COMMODITY_TYPES } from '../../js/game-constants.js';

/**
 * Feature: deterministic-economy, Property 34: Station count does not affect prices
 * Feature: deterministic-economy, Property 35: Spectral class does not affect prices
 *
 * Validates: Requirements 11.2, 11.3
 *
 * These tests verify that the deterministic economy has successfully removed
 * the legacy random-based pricing system. Station count and spectral class
 * should no longer affect prices - only tech level (distance from Sol),
 * temporal drift, local market conditions, and economic events matter.
 */

describe('Feature: deterministic-economy - Legacy System Removal', () => {
  describe('Property 34: Station count does not affect prices', () => {
    it('should produce identical prices for systems with different station counts but same coordinates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 0, max: 116 }),
            x: fc.double({ min: -300, max: 300, noNaN: true }),
            y: fc.double({ min: -300, max: 300, noNaN: true }),
            z: fc.double({ min: -300, max: 300, noNaN: true }),
            type: fc.constantFrom('G', 'K', 'M', 'A', 'F'),
          }),
          fc.constantFrom(...COMMODITY_TYPES),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 0, max: 3 }),
          (system, goodType, currentDay, stationCount1, stationCount2) => {
            // Create two systems with identical properties except station count
            const system1 = { ...system, st: stationCount1 };
            const system2 = { ...system, st: stationCount2 };

            const price1 = TradingSystem.calculatePrice(
              goodType,
              system1,
              currentDay,
              [],
              {}
            );
            const price2 = TradingSystem.calculatePrice(
              goodType,
              system2,
              currentDay,
              [],
              {}
            );

            // Prices should be identical regardless of station count
            expect(price1).toBe(price2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use station count in price calculation', () => {
      // Test with specific examples to ensure station count is ignored
      const system = {
        id: 0,
        x: 0,
        y: 0,
        z: 0,
        type: 'G',
      };

      const priceNoStations = TradingSystem.calculatePrice(
        'grain',
        { ...system, st: 0 },
        0,
        [],
        {}
      );
      const priceThreeStations = TradingSystem.calculatePrice(
        'grain',
        { ...system, st: 3 },
        0,
        [],
        {}
      );

      expect(priceNoStations).toBe(priceThreeStations);
    });
  });

  describe('Property 35: Spectral class does not affect prices', () => {
    it('should produce identical prices for systems with different spectral classes but same coordinates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 0, max: 116 }),
            x: fc.double({ min: -300, max: 300, noNaN: true }),
            y: fc.double({ min: -300, max: 300, noNaN: true }),
            z: fc.double({ min: -300, max: 300, noNaN: true }),
            st: fc.integer({ min: 0, max: 3 }),
          }),
          fc.constantFrom('G', 'K', 'M', 'A', 'F', 'O', 'B', 'L', 'T', 'D'),
          fc.constantFrom('G', 'K', 'M', 'A', 'F', 'O', 'B', 'L', 'T', 'D'),
          fc.constantFrom(...COMMODITY_TYPES),
          fc.integer({ min: 0, max: 1000 }),
          (system, spectralClass1, spectralClass2, goodType, currentDay) => {
            // Create two systems with identical coordinates but different spectral classes
            const system1 = { ...system, type: spectralClass1 };
            const system2 = { ...system, type: spectralClass2 };

            const price1 = TradingSystem.calculatePrice(
              goodType,
              system1,
              currentDay,
              [],
              {}
            );
            const price2 = TradingSystem.calculatePrice(
              goodType,
              system2,
              currentDay,
              [],
              {}
            );

            // Prices should be identical regardless of spectral class
            // Only coordinates (distance from Sol) matter for tech level
            expect(price1).toBe(price2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use spectral class in price calculation', () => {
      // Test with specific examples to ensure spectral class is ignored
      const baseSystem = {
        id: 1,
        x: 50,
        y: 50,
        z: 50,
        st: 1,
      };

      const priceG = TradingSystem.calculatePrice(
        'electronics',
        { ...baseSystem, type: 'G' },
        0,
        [],
        {}
      );
      const priceM = TradingSystem.calculatePrice(
        'electronics',
        { ...baseSystem, type: 'M' },
        0,
        [],
        {}
      );
      const priceA = TradingSystem.calculatePrice(
        'electronics',
        { ...baseSystem, type: 'A' },
        0,
        [],
        {}
      );

      // All spectral classes at same coordinates should have same price
      expect(priceG).toBe(priceM);
      expect(priceM).toBe(priceA);
    });
  });
});
