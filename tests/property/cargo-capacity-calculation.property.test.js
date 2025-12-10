/**
 * Property-Based Tests for Cargo Capacity Calculation
 * Feature: tramp-freighter-core-loop, Property 20: Cargo Capacity Calculation
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property 20: Cargo Capacity Calculation', () => {
  /**
   * Property: For any cargo configuration with multiple stacks, the total
   * cargo used should equal the sum of quantities across all stacks
   * regardless of good type.
   */
  it('should calculate total cargo as sum of all stack quantities regardless of good type', () => {
    fc.assert(
      fc.property(
        // Generate random array of cargo stacks
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (cargo) => {
          // Calculate using TradingSystem
          const calculatedCapacity = TradingSystem.calculateCargoUsed(cargo);

          // Manually calculate expected capacity
          const expectedCapacity = cargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Verify they match
          expect(calculatedCapacity).toBe(expectedCapacity);

          // Additional invariants:
          // 1. Capacity should never be negative
          expect(calculatedCapacity).toBeGreaterThanOrEqual(0);

          // 2. Capacity should be an integer
          expect(Number.isInteger(calculatedCapacity)).toBe(true);

          // 3. If cargo is empty, capacity should be 0
          if (cargo.length === 0) {
            expect(calculatedCapacity).toBe(0);
          }

          // 4. If cargo has items, capacity should be positive
          if (cargo.length > 0) {
            expect(calculatedCapacity).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cargo capacity should not depend on good types
   * Same quantities with different goods should give same total
   */
  it('should calculate same total for same quantities regardless of good types', () => {
    fc.assert(
      fc.property(
        // Generate array of quantities
        fc.array(fc.integer({ min: 1, max: 50 }), {
          minLength: 1,
          maxLength: 10,
        }),
        (quantities) => {
          // Create cargo with grain
          const cargoGrain = quantities.map((qty) => ({
            good: 'grain',
            qty: qty,
            buyPrice: 10,
          }));

          // Create cargo with mixed goods
          const cargoMixed = quantities.map((qty, index) => ({
            good: [
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics',
            ][index % 6],
            qty: qty,
            buyPrice: 10,
          }));

          const capacityGrain = TradingSystem.calculateCargoUsed(cargoGrain);
          const capacityMixed = TradingSystem.calculateCargoUsed(cargoMixed);

          // Should be equal since quantities are the same
          expect(capacityGrain).toBe(capacityMixed);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Adding a stack should increase capacity by that stack's quantity
   */
  it('should increase capacity by stack quantity when adding a stack', () => {
    fc.assert(
      fc.property(
        // Generate initial cargo
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        // Generate new stack to add
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
          buyPrice: fc.integer({ min: 5, max: 100 }),
        }),
        (initialCargo, newStack) => {
          const initialCapacity =
            TradingSystem.calculateCargoUsed(initialCargo);
          const updatedCargo = [...initialCargo, newStack];
          const updatedCapacity =
            TradingSystem.calculateCargoUsed(updatedCargo);

          // Capacity should increase by exactly the new stack's quantity
          expect(updatedCapacity).toBe(initialCapacity + newStack.qty);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Removing a stack should decrease capacity by that stack's quantity
   */
  it('should decrease capacity by stack quantity when removing a stack', () => {
    fc.assert(
      fc.property(
        // Generate cargo with at least one stack
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (cargo) => {
          const initialCapacity = TradingSystem.calculateCargoUsed(cargo);

          // Remove the first stack
          const removedStack = cargo[0];
          const updatedCargo = cargo.slice(1);
          const updatedCapacity =
            TradingSystem.calculateCargoUsed(updatedCargo);

          // Capacity should decrease by exactly the removed stack's quantity
          expect(updatedCapacity).toBe(initialCapacity - removedStack.qty);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty or invalid cargo should return 0
   */
  it('should return 0 for empty or invalid cargo', () => {
    expect(TradingSystem.calculateCargoUsed([])).toBe(0);
    expect(TradingSystem.calculateCargoUsed(null)).toBe(0);
    expect(TradingSystem.calculateCargoUsed(undefined)).toBe(0);
    expect(TradingSystem.calculateCargoUsed('not an array')).toBe(0);
  });
});
