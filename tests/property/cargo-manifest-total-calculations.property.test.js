'use strict';

/**
 * Property-Based Tests for Cargo Manifest Total Calculations
 * Feature: ship-personality, Property 8: Cargo Manifest Total Calculations
 * Validates: Requirements 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property 8: Cargo Manifest Total Calculations', () => {
  /**
   * Property: Total capacity usage should equal the sum of all cargo quantities
   */
  it('should calculate total capacity usage as sum of all quantities', () => {
    fc.assert(
      fc.property(
        // Generate array of cargo stacks
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 50 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 10 }),
            buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Barnard'),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (cargo) => {
          const totals = TradingSystem.calculateCargoTotals(cargo);

          // Calculate expected total capacity manually
          const expectedCapacity = cargo.reduce(
            (sum, stack) => sum + stack.qty,
            0
          );

          expect(totals.totalCapacityUsed).toBe(expectedCapacity);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total value should equal the sum of all individual cargo values
   */
  it('should calculate total value as sum of all cargo values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 50 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 10 }),
            buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Barnard'),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (cargo) => {
          const totals = TradingSystem.calculateCargoTotals(cargo);

          // Calculate expected total value manually
          const expectedValue = cargo.reduce(
            (sum, stack) => sum + stack.qty * stack.buyPrice,
            0
          );

          expect(totals.totalValue).toBe(expectedValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty cargo should return zero totals
   */
  it('should return zero totals for empty cargo', () => {
    const totals = TradingSystem.calculateCargoTotals([]);

    expect(totals.totalCapacityUsed).toBe(0);
    expect(totals.totalValue).toBe(0);
  });

  /**
   * Property: Null or undefined cargo should return zero totals
   */
  it('should return zero totals for null or undefined cargo', () => {
    const totalsNull = TradingSystem.calculateCargoTotals(null);
    const totalsUndefined = TradingSystem.calculateCargoTotals(undefined);

    expect(totalsNull.totalCapacityUsed).toBe(0);
    expect(totalsNull.totalValue).toBe(0);
    expect(totalsUndefined.totalCapacityUsed).toBe(0);
    expect(totalsUndefined.totalValue).toBe(0);
  });

  /**
   * Property: Single cargo stack should have correct totals
   */
  it('should calculate correct totals for single cargo stack', () => {
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
          const cargo = [
            {
              good: goodType,
              qty: quantity,
              buyPrice: buyPrice,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          const totals = TradingSystem.calculateCargoTotals(cargo);

          expect(totals.totalCapacityUsed).toBe(quantity);
          expect(totals.totalValue).toBe(quantity * buyPrice);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Totals should be additive across multiple stacks
   *
   * If we split cargo into two groups and calculate totals separately,
   * the sum should equal the total of all cargo together.
   */
  it('should have additive totals across cargo groups', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 50 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 10 }),
            buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Barnard'),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (cargo) => {
          // Split cargo into two groups
          const midpoint = Math.floor(cargo.length / 2);
          const group1 = cargo.slice(0, midpoint);
          const group2 = cargo.slice(midpoint);

          // Calculate totals for each group
          const totals1 = TradingSystem.calculateCargoTotals(group1);
          const totals2 = TradingSystem.calculateCargoTotals(group2);

          // Calculate totals for all cargo
          const totalsAll = TradingSystem.calculateCargoTotals(cargo);

          // Sum of group totals should equal total of all cargo
          expect(totals1.totalCapacityUsed + totals2.totalCapacityUsed).toBe(
            totalsAll.totalCapacityUsed
          );
          expect(totals1.totalValue + totals2.totalValue).toBe(
            totalsAll.totalValue
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero quantity stacks should not contribute to totals
   */
  it('should handle zero quantity stacks correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 50 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 10 }),
            buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Barnard'),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (cargo) => {
          // Add a zero quantity stack
          const cargoWithZero = [
            ...cargo,
            {
              good: 'grain',
              qty: 0,
              buyPrice: 100,
              buySystem: 0,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];

          const totalsOriginal = TradingSystem.calculateCargoTotals(cargo);
          const totalsWithZero =
            TradingSystem.calculateCargoTotals(cargoWithZero);

          // Totals should be the same (zero quantity doesn't contribute)
          expect(totalsWithZero.totalCapacityUsed).toBe(
            totalsOriginal.totalCapacityUsed
          );
          expect(totalsWithZero.totalValue).toBe(totalsOriginal.totalValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
