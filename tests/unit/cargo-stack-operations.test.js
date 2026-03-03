import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../src/game/game-trading.js';

describe('TradingSystem.addCargoStack', () => {
  describe('consolidation (same good + price)', () => {
    it('merges quantity into existing stack with matching good and price', () => {
      const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = TradingSystem.addCargoStack(cargo, 'ore', 3, 100);

      expect(result).toHaveLength(1);
      expect(result[0].qty).toBe(8);
      expect(result[0].good).toBe('ore');
      expect(result[0].buyPrice).toBe(100);
    });

    it('preserves original metadata on the existing stack during consolidation', () => {
      const cargo = [
        {
          good: 'ore',
          qty: 5,
          buyPrice: 100,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];
      const result = TradingSystem.addCargoStack(
        cargo,
        'ore',
        3,
        100,
        7,
        'Sirius',
        10
      );

      expect(result).toHaveLength(1);
      expect(result[0].qty).toBe(8);
      // Metadata from the original stack is preserved, not overwritten
      expect(result[0].buySystem).toBe(0);
      expect(result[0].buySystemName).toBe('Sol');
      expect(result[0].buyDate).toBe(1);
    });
  });

  describe('new stack creation', () => {
    it('creates new stack when same good but different price', () => {
      const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = TradingSystem.addCargoStack(cargo, 'ore', 3, 200);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ good: 'ore', qty: 5, buyPrice: 100 });
      expect(result[1]).toEqual({ good: 'ore', qty: 3, buyPrice: 200 });
    });

    it('creates new stack when different good', () => {
      const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = TradingSystem.addCargoStack(cargo, 'fuel', 2, 50);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ good: 'ore', qty: 5, buyPrice: 100 });
      expect(result[1]).toEqual({ good: 'fuel', qty: 2, buyPrice: 50 });
    });

    it('creates first stack on empty cargo array', () => {
      const result = TradingSystem.addCargoStack([], 'ore', 10, 75);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ good: 'ore', qty: 10, buyPrice: 75 });
    });
  });

  describe('metadata attachment', () => {
    it('attaches all metadata when all optional args are provided', () => {
      const result = TradingSystem.addCargoStack(
        [],
        'ore',
        5,
        100,
        7,
        'Sirius',
        42
      );

      expect(result[0]).toEqual({
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 7,
        buySystemName: 'Sirius',
        buyDate: 42,
      });
    });

    it('omits all metadata when optional args default to null', () => {
      const result = TradingSystem.addCargoStack([], 'ore', 5, 100);

      expect(result[0]).toEqual({
        good: 'ore',
        qty: 5,
        buyPrice: 100,
      });
      expect(result[0]).not.toHaveProperty('buySystem');
      expect(result[0]).not.toHaveProperty('buySystemName');
      expect(result[0]).not.toHaveProperty('buyDate');
    });

    it('attaches only non-null metadata selectively', () => {
      const result = TradingSystem.addCargoStack(
        [],
        'ore',
        5,
        100,
        3,
        null,
        null
      );

      expect(result[0].buySystem).toBe(3);
      expect(result[0]).not.toHaveProperty('buySystemName');
      expect(result[0]).not.toHaveProperty('buyDate');
    });
  });

  describe('immutability', () => {
    it('does not mutate the original cargo array when consolidating', () => {
      const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const originalLength = cargo.length;
      const originalQty = cargo[0].qty;

      TradingSystem.addCargoStack(cargo, 'ore', 3, 100);

      expect(cargo).toHaveLength(originalLength);
      expect(cargo[0].qty).toBe(originalQty);
    });

    it('does not mutate the original cargo array when adding new stack', () => {
      const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const originalLength = cargo.length;

      TradingSystem.addCargoStack(cargo, 'fuel', 2, 50);

      expect(cargo).toHaveLength(originalLength);
    });
  });
});

describe('TradingSystem.removeFromCargoStack', () => {
  describe('partial decrement', () => {
    it('decrements quantity from the targeted stack', () => {
      const cargo = [{ good: 'ore', qty: 10, buyPrice: 100 }];
      const result = TradingSystem.removeFromCargoStack(cargo, 0, 3);

      expect(result).toHaveLength(1);
      expect(result[0].qty).toBe(7);
    });

    it('targets the correct stack by index', () => {
      const cargo = [
        { good: 'ore', qty: 10, buyPrice: 100 },
        { good: 'fuel', qty: 8, buyPrice: 50 },
        { good: 'food', qty: 6, buyPrice: 30 },
      ];
      const result = TradingSystem.removeFromCargoStack(cargo, 1, 2);

      expect(result).toHaveLength(3);
      expect(result[0].qty).toBe(10); // untouched
      expect(result[1].qty).toBe(6); // decremented
      expect(result[2].qty).toBe(6); // untouched
    });
  });

  describe('full removal (qty reaches zero)', () => {
    it('removes stack entirely when quantity hits exactly zero', () => {
      const cargo = [
        { good: 'ore', qty: 5, buyPrice: 100 },
        { good: 'fuel', qty: 3, buyPrice: 50 },
      ];
      const result = TradingSystem.removeFromCargoStack(cargo, 0, 5);

      expect(result).toHaveLength(1);
      expect(result[0].good).toBe('fuel');
    });

    it('removes stack when quantity goes below zero (over-removal)', () => {
      const cargo = [
        { good: 'ore', qty: 2, buyPrice: 100 },
        { good: 'fuel', qty: 3, buyPrice: 50 },
      ];
      const result = TradingSystem.removeFromCargoStack(cargo, 0, 10);

      expect(result).toHaveLength(1);
      expect(result[0].good).toBe('fuel');
    });
  });

  describe('immutability', () => {
    it('does not mutate the original cargo array', () => {
      const cargo = [
        { good: 'ore', qty: 10, buyPrice: 100 },
        { good: 'fuel', qty: 5, buyPrice: 50 },
      ];
      const originalLength = cargo.length;

      TradingSystem.removeFromCargoStack(cargo, 0, 10);

      expect(cargo).toHaveLength(originalLength);
    });
  });
});
