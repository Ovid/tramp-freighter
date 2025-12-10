'use strict';

/**
 * Property-Based Tests for Cargo Manifest Value Calculation
 * Feature: ship-personality, Property 7: Cargo Manifest Value Calculation
 * Validates: Requirements 5.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property 7: Cargo Manifest Value Calculation', () => {
  /**
   * Property: For any cargo entry, the displayed current value should equal
   * the quantity multiplied by the purchase price
   *
   * Value = qty × buyPrice
   */
  it('should calculate cargo value as quantity times purchase price', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        (goodType, quantity, buyPrice) => {
          const cargoEntry = {
            good: goodType,
            qty: quantity,
            buyPrice: buyPrice,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 0,
          };

          const value = TradingSystem.calculateCargoValue(cargoEntry);

          // Value should equal quantity × buyPrice
          expect(value).toBe(quantity * buyPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero quantity should result in zero value
   */
  it('should return zero value for zero quantity', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 1, max: 200 }),
        (goodType, buyPrice) => {
          const cargoEntry = {
            good: goodType,
            qty: 0,
            buyPrice: buyPrice,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 0,
          };

          const value = TradingSystem.calculateCargoValue(cargoEntry);

          expect(value).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero price should result in zero value
   */
  it('should return zero value for zero price', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 1, max: 100 }),
        (goodType, quantity) => {
          const cargoEntry = {
            good: goodType,
            qty: quantity,
            buyPrice: 0,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 0,
          };

          const value = TradingSystem.calculateCargoValue(cargoEntry);

          expect(value).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null or undefined cargo entry should return zero
   */
  it('should return zero for null or undefined cargo entry', () => {
    expect(TradingSystem.calculateCargoValue(null)).toBe(0);
    expect(TradingSystem.calculateCargoValue(undefined)).toBe(0);
    expect(TradingSystem.calculateCargoValue({})).toBe(0);
  });

  /**
   * Property: Value calculation should be independent of other fields
   *
   * The value should only depend on qty and buyPrice, not on
   * good type, system, or date.
   */
  it('should calculate value independent of other cargo fields', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 200 }),
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 100 }),
        (quantity, buyPrice, goodType, systemId, day) => {
          const cargoEntry1 = {
            good: goodType,
            qty: quantity,
            buyPrice: buyPrice,
            buySystem: systemId,
            buySystemName: 'System A',
            buyDate: day,
          };

          const cargoEntry2 = {
            good: 'grain', // Different good
            qty: quantity, // Same qty
            buyPrice: buyPrice, // Same price
            buySystem: 99, // Different system
            buySystemName: 'System B',
            buyDate: 999, // Different date
          };

          const value1 = TradingSystem.calculateCargoValue(cargoEntry1);
          const value2 = TradingSystem.calculateCargoValue(cargoEntry2);

          // Values should be equal since qty and buyPrice are the same
          expect(value1).toBe(value2);
          expect(value1).toBe(quantity * buyPrice);
        }
      ),
      { numRuns: 100 }
    );
  });
});
