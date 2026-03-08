import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../src/game/game-trading.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

describe('TradingSystem.calculatePrice', () => {
  const mockSystem = { id: 5, x: 3, y: 4, z: 0 };

  it('returns a positive integer price for each commodity type', () => {
    for (const goodType of COMMODITY_TYPES) {
      const price = TradingSystem.calculatePrice(goodType, mockSystem, 10);
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });

  it('throws for unknown good type', () => {
    expect(() =>
      TradingSystem.calculatePrice('unobtainium', mockSystem, 10)
    ).toThrow('Unknown good type');
  });

  it('throws when system is null', () => {
    expect(() => TradingSystem.calculatePrice('ore', null, 10)).toThrow(
      'System object required'
    );
  });

  it('throws when system is undefined', () => {
    expect(() => TradingSystem.calculatePrice('ore', undefined, 10)).toThrow(
      'System object required'
    );
  });

  it('throws when system is a string', () => {
    expect(() => TradingSystem.calculatePrice('ore', 'Sol', 10)).toThrow(
      'System object required'
    );
  });

  it('throws when system is a number', () => {
    expect(() => TradingSystem.calculatePrice('ore', 42, 10)).toThrow(
      'System object required'
    );
  });

  it('uses default values for optional parameters', () => {
    const price = TradingSystem.calculatePrice('ore', mockSystem);
    expect(Number.isInteger(price)).toBe(true);
    expect(price).toBeGreaterThan(0);
  });

  it('applies event modifiers when active events affect the system', () => {
    const events = [
      {
        systemId: 5,
        modifiers: { ore: 2.0 },
      },
    ];
    const priceWithEvent = TradingSystem.calculatePrice(
      'ore',
      mockSystem,
      10,
      events
    );
    const priceWithoutEvent = TradingSystem.calculatePrice(
      'ore',
      mockSystem,
      10,
      []
    );
    expect(priceWithEvent).toBeGreaterThan(priceWithoutEvent);
  });

  it('applies market condition modifiers', () => {
    const marketConditions = { 5: { ore: 100 } }; // surplus
    const priceWithSurplus = TradingSystem.calculatePrice(
      'ore',
      mockSystem,
      10,
      [],
      marketConditions
    );
    const priceWithout = TradingSystem.calculatePrice(
      'ore',
      mockSystem,
      10,
      [],
      {}
    );
    expect(priceWithSurplus).toBeLessThan(priceWithout);
  });

  it('prices vary by day', () => {
    const price1 = TradingSystem.calculatePrice('ore', mockSystem, 1);
    const price15 = TradingSystem.calculatePrice('ore', mockSystem, 15);
    expect(price1).not.toBe(price15);
  });

  it('prices vary by system location', () => {
    const system1 = { id: 0, x: 0, y: 0, z: 0 }; // Sol
    const system2 = { id: 50, x: 15, y: 10, z: 5 }; // Frontier
    const price1 = TradingSystem.calculatePrice('electronics', system1, 10);
    const price2 = TradingSystem.calculatePrice('electronics', system2, 10);
    expect(price1).not.toBe(price2);
  });
});

describe('TradingSystem.calculateTechLevel', () => {
  it('returns 10.0 for Sol (origin)', () => {
    const system = { id: 0, x: 0, y: 0, z: 0 };
    const techLevel = TradingSystem.calculateTechLevel(system);
    expect(techLevel).toBeCloseTo(10.0, 1);
  });

  it('returns lower tech level for distant systems', () => {
    const nearSystem = { id: 1, x: 1, y: 0, z: 0 };
    const farSystem = { id: 2, x: 15, y: 10, z: 5 };
    const nearTech = TradingSystem.calculateTechLevel(nearSystem);
    const farTech = TradingSystem.calculateTechLevel(farSystem);
    expect(nearTech).toBeGreaterThan(farTech);
  });

  it('clamps to minimum tech level for very distant systems', () => {
    // LY_PER_UNIT ≈ 0.0716, so need ~293 units for 21 LY
    const veryFar = { id: 99, x: 500, y: 500, z: 500 };
    const techLevel = TradingSystem.calculateTechLevel(veryFar);
    expect(techLevel).toBeCloseTo(1.0, 1);
  });

  it('returns a value between 1.0 and 10.0', () => {
    const system = { id: 30, x: 8, y: 6, z: 3 };
    const techLevel = TradingSystem.calculateTechLevel(system);
    expect(techLevel).toBeGreaterThanOrEqual(1.0);
    expect(techLevel).toBeLessThanOrEqual(10.0);
  });
});

describe('TradingSystem.getEventModifier', () => {
  it('returns 1.0 when activeEvents is not an array', () => {
    expect(TradingSystem.getEventModifier(0, 'ore', null)).toBe(1.0);
    expect(TradingSystem.getEventModifier(0, 'ore', undefined)).toBe(1.0);
    expect(TradingSystem.getEventModifier(0, 'ore', 'not-array')).toBe(1.0);
  });

  it('returns 1.0 when no event matches the system', () => {
    const events = [{ systemId: 99, modifiers: { ore: 2.0 } }];
    expect(TradingSystem.getEventModifier(0, 'ore', events)).toBe(1.0);
  });

  it('returns 1.0 when matching event has no modifiers', () => {
    const events = [{ systemId: 0 }];
    expect(TradingSystem.getEventModifier(0, 'ore', events)).toBe(1.0);
  });

  it('returns 1.0 when matching event has no modifier for the good', () => {
    const events = [{ systemId: 0, modifiers: { grain: 1.5 } }];
    expect(TradingSystem.getEventModifier(0, 'ore', events)).toBe(1.0);
  });

  it('returns the modifier for matching event and good', () => {
    const events = [{ systemId: 0, modifiers: { ore: 1.5 } }];
    expect(TradingSystem.getEventModifier(0, 'ore', events)).toBe(1.5);
  });

  it('returns 1.0 for empty events array', () => {
    expect(TradingSystem.getEventModifier(0, 'ore', [])).toBe(1.0);
  });
});

describe('TradingSystem.recordCargoPurchase', () => {
  it('creates a new cargo stack with complete metadata', () => {
    const result = TradingSystem.recordCargoPurchase(
      [],
      'ore',
      5,
      100,
      3,
      'Sirius',
      42
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      good: 'ore',
      qty: 5,
      buyPrice: 100,
      buySystem: 3,
      buySystemName: 'Sirius',
      buyDate: 42,
    });
  });

  it('consolidates into existing stack with matching good and price', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sirius',
        buyDate: 10,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'ore',
      3,
      100,
      7,
      'Procyon',
      20
    );
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(8);
    // Preserves original metadata
    expect(result[0].buySystem).toBe(3);
    expect(result[0].buySystemName).toBe('Sirius');
    expect(result[0].buyDate).toBe(10);
  });

  it('creates new stack when price differs', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sirius',
        buyDate: 10,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'ore',
      3,
      200,
      7,
      'Procyon',
      20
    );
    expect(result).toHaveLength(2);
    expect(result[1].buyPrice).toBe(200);
  });

  it('creates new stack when good type differs', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sirius',
        buyDate: 10,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'grain',
      3,
      100,
      7,
      'Procyon',
      20
    );
    expect(result).toHaveLength(2);
    expect(result[1].good).toBe('grain');
  });

  it('does not mutate the original cargo array', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sirius',
        buyDate: 10,
      },
    ];
    TradingSystem.recordCargoPurchase(cargo, 'ore', 3, 100, 7, 'Procyon', 20);
    expect(cargo).toHaveLength(1);
    expect(cargo[0].qty).toBe(5);
  });
});

describe('TradingSystem.getTechModifier edge cases', () => {
  it('throws for empty string goodType', () => {
    expect(() => TradingSystem.getTechModifier('', 5.0)).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for NaN techLevel', () => {
    expect(() => TradingSystem.getTechModifier('ore', NaN)).toThrow(
      'Invalid techLevel'
    );
  });

  it('throws for unknown good type in tech bias lookup', () => {
    expect(() => TradingSystem.getTechModifier('unobtainium', 5.0)).toThrow(
      'Unknown good type'
    );
  });
});

describe('TradingSystem.getTemporalModifier edge cases', () => {
  it('throws for negative currentDay', () => {
    expect(() => TradingSystem.getTemporalModifier(0, -1)).toThrow(
      'Invalid currentDay'
    );
  });

  it('throws for NaN currentDay', () => {
    expect(() => TradingSystem.getTemporalModifier(0, NaN)).toThrow(
      'Invalid currentDay'
    );
  });

  it('throws for string systemId', () => {
    expect(() => TradingSystem.getTemporalModifier('0', 0)).toThrow(
      'Invalid systemId'
    );
  });
});

describe('TradingSystem.getLocalModifier edge cases', () => {
  it('throws for string systemId', () => {
    expect(() => TradingSystem.getLocalModifier('0', 'ore', {})).toThrow(
      'Invalid systemId'
    );
  });

  it('throws for empty string goodType', () => {
    expect(() => TradingSystem.getLocalModifier(0, '', {})).toThrow(
      'Invalid goodType'
    );
  });
});
