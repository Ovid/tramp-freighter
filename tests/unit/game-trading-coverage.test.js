import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../src/game/game-trading.js';

describe('TradingSystem.getTechModifier computation', () => {
  it('returns 1.0 at tech level midpoint for any good', () => {
    const modifier = TradingSystem.getTechModifier('ore', 5.0);
    expect(modifier).toBe(1.0);
  });

  it('returns modifier < 1.0 for positive-bias good at high tech level', () => {
    // Electronics has positive bias, high tech should make it cheaper
    const modifier = TradingSystem.getTechModifier('electronics', 10.0);
    expect(modifier).toBeLessThan(1.0);
  });

  it('returns modifier > 1.0 for positive-bias good at low tech level', () => {
    const modifier = TradingSystem.getTechModifier('electronics', 1.0);
    expect(modifier).toBeGreaterThan(1.0);
  });

  it('returns modifier > 1.0 for negative-bias good at high tech level', () => {
    // Ore has negative bias, high tech should make it more expensive
    const modifier = TradingSystem.getTechModifier('ore', 10.0);
    expect(modifier).toBeGreaterThan(1.0);
  });

  it('returns modifier < 1.0 for negative-bias good at low tech level', () => {
    const modifier = TradingSystem.getTechModifier('ore', 1.0);
    expect(modifier).toBeLessThan(1.0);
  });

  it('throws for numeric goodType', () => {
    expect(() => TradingSystem.getTechModifier(42, 5.0)).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for undefined goodType', () => {
    expect(() => TradingSystem.getTechModifier(undefined, 5.0)).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for boolean techLevel', () => {
    expect(() => TradingSystem.getTechModifier('ore', true)).toThrow(
      'Invalid techLevel'
    );
  });
});

describe('TradingSystem.getTemporalModifier computation', () => {
  it('returns a value near 1.0 for system 0, day 0', () => {
    const modifier = TradingSystem.getTemporalModifier(0, 0);
    // sin(0) = 0, so modifier = 1.0
    expect(modifier).toBeCloseTo(1.0, 5);
  });

  it('returns value within expected range', () => {
    // Temporal modifier oscillates between ~0.85 and ~1.15
    for (let day = 0; day < 60; day++) {
      const modifier = TradingSystem.getTemporalModifier(1, day);
      expect(modifier).toBeGreaterThanOrEqual(0.84);
      expect(modifier).toBeLessThanOrEqual(1.16);
    }
  });

  it('different systems have different modifiers on the same day', () => {
    const mod1 = TradingSystem.getTemporalModifier(0, 5);
    const mod2 = TradingSystem.getTemporalModifier(10, 5);
    expect(mod1).not.toBeCloseTo(mod2, 3);
  });

  it('throws for string currentDay', () => {
    expect(() => TradingSystem.getTemporalModifier(0, '5')).toThrow(
      'Invalid currentDay'
    );
  });

  it('throws for null systemId', () => {
    expect(() => TradingSystem.getTemporalModifier(null, 0)).toThrow(
      'Invalid systemId'
    );
  });

  it('throws for undefined systemId', () => {
    expect(() => TradingSystem.getTemporalModifier(undefined, 0)).toThrow(
      'Invalid systemId'
    );
  });

  it('accepts day 0 without error', () => {
    expect(() => TradingSystem.getTemporalModifier(0, 0)).not.toThrow();
  });
});

describe('TradingSystem.getLocalModifier computation', () => {
  it('returns 1.0 when no market conditions exist', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'ore', {});
    expect(modifier).toBe(1.0);
  });

  it('returns 1.0 when system has no entry in market conditions', () => {
    const modifier = TradingSystem.getLocalModifier(5, 'ore', {
      0: { ore: 100 },
    });
    expect(modifier).toBe(1.0);
  });

  it('returns 1.0 when good has no entry for the system', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'grain', {
      0: { ore: 100 },
    });
    expect(modifier).toBe(1.0);
  });

  it('returns < 1.0 for surplus (player sold goods)', () => {
    // MARKET_CAPACITY is 200, so surplus of 40 gives 1.0 - 40/200 = 0.8
    const modifier = TradingSystem.getLocalModifier(0, 'ore', {
      0: { ore: 40 },
    });
    expect(modifier).toBeLessThan(1.0);
    expect(modifier).toBeCloseTo(0.8, 2);
  });

  it('returns > 1.0 for deficit (player bought goods)', () => {
    // MARKET_CAPACITY is 200, so deficit of -40 gives 1.0 - (-40/200) = 1.2
    const modifier = TradingSystem.getLocalModifier(0, 'ore', {
      0: { ore: -40 },
    });
    expect(modifier).toBeGreaterThan(1.0);
    expect(modifier).toBeCloseTo(1.2, 2);
  });

  it('clamps to minimum for extreme surplus', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'ore', {
      0: { ore: 10000 },
    });
    expect(modifier).toBe(0.25);
  });

  it('clamps to maximum for extreme deficit', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'ore', {
      0: { ore: -10000 },
    });
    expect(modifier).toBe(2.0);
  });

  it('handles null marketConditions gracefully', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'ore', null);
    expect(modifier).toBe(1.0);
  });

  it('handles undefined marketConditions gracefully', () => {
    const modifier = TradingSystem.getLocalModifier(0, 'ore', undefined);
    expect(modifier).toBe(1.0);
  });

  it('throws for null goodType', () => {
    expect(() => TradingSystem.getLocalModifier(0, null, {})).toThrow(
      'Invalid goodType'
    );
  });
});

describe('TradingSystem.calculateCargoUsed edge cases', () => {
  it('returns 0 for string input', () => {
    expect(TradingSystem.calculateCargoUsed('not-an-array')).toBe(0);
  });

  it('returns 0 for number input', () => {
    expect(TradingSystem.calculateCargoUsed(42)).toBe(0);
  });

  it('returns 0 for object input', () => {
    expect(TradingSystem.calculateCargoUsed({ qty: 5 })).toBe(0);
  });
});

describe('TradingSystem.calculateCargoValue', () => {
  it('returns correct value for valid entry', () => {
    expect(TradingSystem.calculateCargoValue({ qty: 5, buyPrice: 100 })).toBe(
      500
    );
  });

  it('returns 0 when qty is 0', () => {
    expect(TradingSystem.calculateCargoValue({ qty: 0, buyPrice: 100 })).toBe(
      0
    );
  });

  it('throws for null entry', () => {
    expect(() => TradingSystem.calculateCargoValue(null)).toThrow(
      'Invalid cargo entry: expected object'
    );
  });

  it('throws for undefined entry', () => {
    expect(() => TradingSystem.calculateCargoValue(undefined)).toThrow(
      'Invalid cargo entry: expected object'
    );
  });

  it('throws for string entry', () => {
    expect(() => TradingSystem.calculateCargoValue('ore')).toThrow(
      'Invalid cargo entry: expected object'
    );
  });

  it('throws for number entry', () => {
    expect(() => TradingSystem.calculateCargoValue(42)).toThrow(
      'Invalid cargo entry: expected object'
    );
  });

  it('throws when qty is not a number', () => {
    expect(() =>
      TradingSystem.calculateCargoValue({ qty: '5', buyPrice: 100 })
    ).toThrow('qty must be a number');
  });

  it('throws when qty is missing', () => {
    expect(() => TradingSystem.calculateCargoValue({ buyPrice: 100 })).toThrow(
      'qty must be a number'
    );
  });

  it('throws when buyPrice is not a number', () => {
    expect(() =>
      TradingSystem.calculateCargoValue({ qty: 5, buyPrice: '100' })
    ).toThrow('buyPrice must be a number');
  });

  it('throws when buyPrice is missing', () => {
    expect(() => TradingSystem.calculateCargoValue({ qty: 5 })).toThrow(
      'buyPrice must be a number'
    );
  });
});

describe('TradingSystem.calculateCargoTotals', () => {
  it('returns correct totals for valid cargo', () => {
    const cargo = [
      { good: 'ore', qty: 5, buyPrice: 100 },
      { good: 'grain', qty: 10, buyPrice: 50 },
    ];
    const result = TradingSystem.calculateCargoTotals(cargo);
    expect(result.totalCapacityUsed).toBe(15);
    expect(result.totalValue).toBe(1000);
  });

  it('returns zeros for empty cargo array', () => {
    const result = TradingSystem.calculateCargoTotals([]);
    expect(result.totalCapacityUsed).toBe(0);
    expect(result.totalValue).toBe(0);
  });

  it('throws for non-array input', () => {
    expect(() => TradingSystem.calculateCargoTotals(null)).toThrow(
      'Invalid cargo: expected array'
    );
  });

  it('throws for undefined input', () => {
    expect(() => TradingSystem.calculateCargoTotals(undefined)).toThrow(
      'Invalid cargo: expected array'
    );
  });

  it('throws for string input', () => {
    expect(() => TradingSystem.calculateCargoTotals('cargo')).toThrow(
      'Invalid cargo: expected array'
    );
  });

  it('throws for object input', () => {
    expect(() => TradingSystem.calculateCargoTotals({ qty: 5 })).toThrow(
      'Invalid cargo: expected array'
    );
  });

  it('throws when a stack has non-number qty', () => {
    const cargo = [{ good: 'ore', qty: '5', buyPrice: 100 }];
    expect(() => TradingSystem.calculateCargoTotals(cargo)).toThrow(
      'qty must be a number'
    );
  });

  it('throws when a stack is missing qty', () => {
    const cargo = [{ good: 'ore', buyPrice: 100 }];
    expect(() => TradingSystem.calculateCargoTotals(cargo)).toThrow(
      'qty must be a number'
    );
  });

  it('handles single-item cargo', () => {
    const cargo = [{ good: 'ore', qty: 3, buyPrice: 200 }];
    const result = TradingSystem.calculateCargoTotals(cargo);
    expect(result.totalCapacityUsed).toBe(3);
    expect(result.totalValue).toBe(600);
  });
});

describe('TradingSystem.validatePurchase', () => {
  it('returns valid for affordable purchase with space', () => {
    const result = TradingSystem.validatePurchase(1000, 50, 5, 100);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns invalid for insufficient credits', () => {
    const result = TradingSystem.validatePurchase(100, 50, 5, 100);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Insufficient credits');
  });

  it('returns invalid for insufficient cargo space', () => {
    const result = TradingSystem.validatePurchase(10000, 3, 5, 100);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Not enough cargo space');
  });

  it('returns valid when cost exactly equals credits', () => {
    const result = TradingSystem.validatePurchase(500, 50, 5, 100);
    expect(result.valid).toBe(true);
  });

  it('returns valid when quantity exactly equals cargo space', () => {
    const result = TradingSystem.validatePurchase(10000, 5, 5, 100);
    expect(result.valid).toBe(true);
  });

  it('checks credits before cargo space', () => {
    // Both insufficient - should report credits first
    const result = TradingSystem.validatePurchase(10, 1, 5, 100);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Insufficient credits');
  });
});

describe('TradingSystem.validateSale', () => {
  const cargo = [
    { good: 'ore', qty: 10, buyPrice: 100 },
    { good: 'grain', qty: 5, buyPrice: 50 },
  ];

  it('returns valid for sale within available quantity', () => {
    const result = TradingSystem.validateSale(cargo, 0, 5);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns valid for selling entire stack', () => {
    const result = TradingSystem.validateSale(cargo, 0, 10);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for non-array cargo', () => {
    const result = TradingSystem.validateSale(null, 0, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid cargo stack');
  });

  it('returns invalid for string cargo', () => {
    const result = TradingSystem.validateSale('not-array', 0, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid cargo stack');
  });

  it('returns invalid for negative stack index', () => {
    const result = TradingSystem.validateSale(cargo, -1, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid cargo stack');
  });

  it('returns invalid for out-of-bounds stack index', () => {
    const result = TradingSystem.validateSale(cargo, 5, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Invalid cargo stack');
  });

  it('returns invalid when quantity exceeds stack', () => {
    const result = TradingSystem.validateSale(cargo, 0, 15);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Not enough quantity in stack');
  });
});

describe('TradingSystem.addCargoStack (deprecated)', () => {
  it('creates new stack with no metadata when none provided', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 5, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      good: 'ore',
      qty: 5,
      buyPrice: 100,
    });
    expect(result[0]).not.toHaveProperty('buySystem');
    expect(result[0]).not.toHaveProperty('buySystemName');
    expect(result[0]).not.toHaveProperty('buyDate');
  });

  it('creates new stack with full metadata when provided', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(
      cargo,
      'ore',
      5,
      100,
      3,
      'Alpha Centauri',
      10
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      good: 'ore',
      qty: 5,
      buyPrice: 100,
      buySystem: 3,
      buySystemName: 'Alpha Centauri',
      buyDate: 10,
    });
  });

  it('creates new stack with partial metadata (only systemId)', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 5, 100, 3);
    expect(result[0].buySystem).toBe(3);
    expect(result[0]).not.toHaveProperty('buySystemName');
    expect(result[0]).not.toHaveProperty('buyDate');
  });

  it('creates new stack with systemId and systemName but no day', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 5, 100, 3, 'Sol');
    expect(result[0].buySystem).toBe(3);
    expect(result[0].buySystemName).toBe('Sol');
    expect(result[0]).not.toHaveProperty('buyDate');
  });

  it('omits null systemId from stack', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(
      cargo,
      'ore',
      5,
      100,
      null,
      'Sol',
      10
    );
    expect(result[0]).not.toHaveProperty('buySystem');
    expect(result[0].buySystemName).toBe('Sol');
    expect(result[0].buyDate).toBe(10);
  });

  it('omits null systemName from stack', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(
      cargo,
      'ore',
      5,
      100,
      3,
      null,
      10
    );
    expect(result[0].buySystem).toBe(3);
    expect(result[0]).not.toHaveProperty('buySystemName');
    expect(result[0].buyDate).toBe(10);
  });

  it('omits null day from stack', () => {
    const cargo = [];
    const result = TradingSystem.addCargoStack(
      cargo,
      'ore',
      5,
      100,
      3,
      'Sol',
      null
    );
    expect(result[0].buySystem).toBe(3);
    expect(result[0].buySystemName).toBe('Sol');
    expect(result[0]).not.toHaveProperty('buyDate');
  });

  it('consolidates into existing stack with matching good and price', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 100, buySystem: 3 }];
    const result = TradingSystem.addCargoStack(
      cargo,
      'ore',
      3,
      100,
      7,
      'Other',
      20
    );
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(8);
    // Preserves original metadata
    expect(result[0].buySystem).toBe(3);
  });

  it('creates separate stack when price differs', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 3, 200);
    expect(result).toHaveLength(2);
  });

  it('does not mutate the original cargo array', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
    TradingSystem.addCargoStack(cargo, 'ore', 3, 100);
    expect(cargo).toHaveLength(1);
    expect(cargo[0].qty).toBe(5);
  });
});

describe('TradingSystem.removeFromCargoStack', () => {
  it('partially removes from a stack', () => {
    const cargo = [
      { good: 'ore', qty: 10, buyPrice: 100 },
      { good: 'grain', qty: 5, buyPrice: 50 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 3);
    expect(result).toHaveLength(2);
    expect(result[0].qty).toBe(7);
    expect(result[0].good).toBe('ore');
    expect(result[1].qty).toBe(5);
  });

  it('removes stack entirely when quantity equals stack qty', () => {
    const cargo = [
      { good: 'ore', qty: 10, buyPrice: 100 },
      { good: 'grain', qty: 5, buyPrice: 50 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 10);
    expect(result).toHaveLength(1);
    expect(result[0].good).toBe('grain');
  });

  it('removes stack when quantity exceeds stack qty', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 10);
    expect(result).toHaveLength(0);
  });

  it('removes from the last stack', () => {
    const cargo = [
      { good: 'ore', qty: 10, buyPrice: 100 },
      { good: 'grain', qty: 5, buyPrice: 50 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 1, 3);
    expect(result).toHaveLength(2);
    expect(result[1].qty).toBe(2);
  });

  it('removes the last stack entirely', () => {
    const cargo = [
      { good: 'ore', qty: 10, buyPrice: 100 },
      { good: 'grain', qty: 5, buyPrice: 50 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 1, 5);
    expect(result).toHaveLength(1);
    expect(result[0].good).toBe('ore');
  });

  it('handles single-item cargo removal completely', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 5);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original cargo array length', () => {
    const cargo = [
      { good: 'ore', qty: 10, buyPrice: 100 },
      { good: 'grain', qty: 5, buyPrice: 50 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 10);
    // The original array still has 2 entries (splice operates on the copy)
    expect(cargo).toHaveLength(2);
    expect(result).toHaveLength(1);
  });
});
