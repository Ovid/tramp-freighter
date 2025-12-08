/**
 * Unit Tests for Cargo Stack Consolidation
 *
 * Tests that buying the same good at the same price consolidates into existing stacks,
 * while buying at different prices creates separate stacks.
 */

import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../js/game-trading.js';

describe('Cargo Stack Consolidation', () => {
  it('should consolidate when buying same good at same price', () => {
    const cargo = [{ good: 'grain', qty: 10, purchasePrice: 8 }];

    const updatedCargo = TradingSystem.addCargoStack(cargo, 'grain', 5, 8);

    // Should have only one stack
    expect(updatedCargo.length).toBe(1);
    // Quantity should be combined
    expect(updatedCargo[0].qty).toBe(15);
    expect(updatedCargo[0].good).toBe('grain');
    expect(updatedCargo[0].purchasePrice).toBe(8);
  });

  it('should create separate stack when buying same good at different price', () => {
    const cargo = [{ good: 'grain', qty: 10, purchasePrice: 8 }];

    const updatedCargo = TradingSystem.addCargoStack(cargo, 'grain', 5, 10);

    // Should have two stacks
    expect(updatedCargo.length).toBe(2);
    // First stack unchanged
    expect(updatedCargo[0].qty).toBe(10);
    expect(updatedCargo[0].purchasePrice).toBe(8);
    // Second stack is new
    expect(updatedCargo[1].qty).toBe(5);
    expect(updatedCargo[1].purchasePrice).toBe(10);
  });

  it('should create new stack when buying different good', () => {
    const cargo = [{ good: 'grain', qty: 10, purchasePrice: 8 }];

    const updatedCargo = TradingSystem.addCargoStack(cargo, 'ore', 5, 15);

    // Should have two stacks
    expect(updatedCargo.length).toBe(2);
    // First stack unchanged
    expect(updatedCargo[0].good).toBe('grain');
    expect(updatedCargo[0].qty).toBe(10);
    // Second stack is new good
    expect(updatedCargo[1].good).toBe('ore');
    expect(updatedCargo[1].qty).toBe(5);
  });

  it('should consolidate with first matching stack when multiple matches exist', () => {
    const cargo = [
      { good: 'grain', qty: 10, purchasePrice: 8 },
      { good: 'ore', qty: 5, purchasePrice: 15 },
      { good: 'grain', qty: 20, purchasePrice: 8 },
    ];

    const updatedCargo = TradingSystem.addCargoStack(cargo, 'grain', 5, 8);

    // Should still have three stacks
    expect(updatedCargo.length).toBe(3);
    // First grain stack should be updated
    expect(updatedCargo[0].qty).toBe(15);
    // Second stack unchanged
    expect(updatedCargo[1].qty).toBe(5);
    // Third grain stack unchanged
    expect(updatedCargo[2].qty).toBe(20);
  });

  it('should create new stack when cargo is empty', () => {
    const cargo = [];

    const updatedCargo = TradingSystem.addCargoStack(cargo, 'grain', 10, 8);

    expect(updatedCargo.length).toBe(1);
    expect(updatedCargo[0].good).toBe('grain');
    expect(updatedCargo[0].qty).toBe(10);
    expect(updatedCargo[0].purchasePrice).toBe(8);
  });

  it('should handle multiple consolidations correctly', () => {
    let cargo = [{ good: 'grain', qty: 10, purchasePrice: 8 }];

    // First consolidation
    cargo = TradingSystem.addCargoStack(cargo, 'grain', 5, 8);
    expect(cargo.length).toBe(1);
    expect(cargo[0].qty).toBe(15);

    // Second consolidation
    cargo = TradingSystem.addCargoStack(cargo, 'grain', 10, 8);
    expect(cargo.length).toBe(1);
    expect(cargo[0].qty).toBe(25);

    // Add different price - should create new stack
    cargo = TradingSystem.addCargoStack(cargo, 'grain', 5, 10);
    expect(cargo.length).toBe(2);
    expect(cargo[0].qty).toBe(25);
    expect(cargo[1].qty).toBe(5);

    // Consolidate with second stack
    cargo = TradingSystem.addCargoStack(cargo, 'grain', 3, 10);
    expect(cargo.length).toBe(2);
    expect(cargo[0].qty).toBe(25);
    expect(cargo[1].qty).toBe(8);
  });
});
