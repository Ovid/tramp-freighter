import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TradingSystem } from '../../src/game/game-trading.js';

describe('TradingSystem static validators', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validatePurchase', () => {
    it('returns valid when credits and cargo space are sufficient', () => {
      const result = TradingSystem.validatePurchase(1000, 10, 5, 100);
      expect(result).toEqual({ valid: true });
    });

    it('returns invalid with reason when totalCost exceeds credits', () => {
      const result = TradingSystem.validatePurchase(400, 10, 5, 100);
      expect(result).toEqual({ valid: false, reason: 'Insufficient credits' });
    });

    it('returns invalid with reason when quantity exceeds cargo space', () => {
      const result = TradingSystem.validatePurchase(10000, 3, 5, 100);
      expect(result).toEqual({
        valid: false,
        reason: 'Not enough cargo space',
      });
    });

    it('is valid at exact credit boundary (totalCost === credits)', () => {
      const result = TradingSystem.validatePurchase(500, 10, 5, 100);
      expect(result).toEqual({ valid: true });
    });

    it('is valid at exact cargo space boundary (quantity === cargoSpace)', () => {
      const result = TradingSystem.validatePurchase(10000, 5, 5, 100);
      expect(result).toEqual({ valid: true });
    });
  });

  describe('validateSale', () => {
    it('returns valid for valid stack index and sufficient quantity', () => {
      const cargo = [{ qty: 10, good: 'metals' }];
      const result = TradingSystem.validateSale(cargo, 0, 5);
      expect(result).toEqual({ valid: true });
    });

    it('returns invalid for negative stackIndex', () => {
      const cargo = [{ qty: 10, good: 'metals' }];
      const result = TradingSystem.validateSale(cargo, -1, 5);
      expect(result).toEqual({ valid: false, reason: 'Invalid cargo stack' });
    });

    it('returns invalid for stackIndex >= cargo.length', () => {
      const cargo = [{ qty: 10, good: 'metals' }];
      const result = TradingSystem.validateSale(cargo, 1, 5);
      expect(result).toEqual({ valid: false, reason: 'Invalid cargo stack' });
    });

    it('returns invalid for non-array cargo', () => {
      const result = TradingSystem.validateSale(null, 0, 5);
      expect(result).toEqual({ valid: false, reason: 'Invalid cargo stack' });
    });

    it('returns invalid when quantity exceeds stack quantity', () => {
      const cargo = [{ qty: 3, good: 'metals' }];
      const result = TradingSystem.validateSale(cargo, 0, 5);
      expect(result).toEqual({
        valid: false,
        reason: 'Not enough quantity in stack',
      });
    });

    it('is valid at exact quantity boundary (quantity === stack.qty)', () => {
      const cargo = [{ qty: 5, good: 'metals' }];
      const result = TradingSystem.validateSale(cargo, 0, 5);
      expect(result).toEqual({ valid: true });
    });
  });

  describe('calculateCargoValue', () => {
    it('returns qty * buyPrice for a valid entry', () => {
      const result = TradingSystem.calculateCargoValue({
        qty: 5,
        buyPrice: 200,
      });
      expect(result).toBe(1000);
    });

    it('throws for null input', () => {
      expect(() => TradingSystem.calculateCargoValue(null)).toThrow(
        'Invalid cargo entry: expected object'
      );
    });

    it('throws for undefined input', () => {
      expect(() => TradingSystem.calculateCargoValue(undefined)).toThrow(
        'Invalid cargo entry: expected object'
      );
    });

    it('throws when qty is not a number', () => {
      expect(() =>
        TradingSystem.calculateCargoValue({ qty: '5', buyPrice: 200 })
      ).toThrow('Invalid cargo entry: qty must be a number');
    });

    it('throws when buyPrice is not a number', () => {
      expect(() =>
        TradingSystem.calculateCargoValue({ qty: 5, buyPrice: '200' })
      ).toThrow('Invalid cargo entry: buyPrice must be a number');
    });

    it('handles zero qty correctly', () => {
      const result = TradingSystem.calculateCargoValue({
        qty: 0,
        buyPrice: 200,
      });
      expect(result).toBe(0);
    });

    it('handles zero buyPrice correctly', () => {
      const result = TradingSystem.calculateCargoValue({ qty: 5, buyPrice: 0 });
      expect(result).toBe(0);
    });
  });

  describe('calculateCargoTotals', () => {
    it('returns correct totals for multiple cargo stacks', () => {
      const cargo = [
        { qty: 5, buyPrice: 100 },
        { qty: 3, buyPrice: 200 },
        { qty: 2, buyPrice: 50 },
      ];
      const result = TradingSystem.calculateCargoTotals(cargo);
      expect(result).toEqual({ totalCapacityUsed: 10, totalValue: 1200 });
    });

    it('returns zeros for empty array', () => {
      const result = TradingSystem.calculateCargoTotals([]);
      expect(result).toEqual({ totalCapacityUsed: 0, totalValue: 0 });
    });

    it('throws for non-array input', () => {
      expect(() => TradingSystem.calculateCargoTotals('not an array')).toThrow(
        'Invalid cargo: expected array'
      );
    });

    it('throws when any stack has non-numeric qty', () => {
      const cargo = [
        { qty: 5, buyPrice: 100 },
        { qty: '3', buyPrice: 200 },
      ];
      expect(() => TradingSystem.calculateCargoTotals(cargo)).toThrow(
        'Invalid cargo stack: qty must be a number'
      );
    });

    it('handles single-item array', () => {
      const cargo = [{ qty: 7, buyPrice: 150 }];
      const result = TradingSystem.calculateCargoTotals(cargo);
      expect(result).toEqual({ totalCapacityUsed: 7, totalValue: 1050 });
    });
  });
});
