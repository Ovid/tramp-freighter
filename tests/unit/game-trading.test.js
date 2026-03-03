import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateProfit } from '../../src/features/trade/tradeUtils.js';
import { TradingSystem } from '../../src/game/game-trading.js';
import { createTestGameStateManager } from '../test-utils.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('calculateProfit', () => {
  it('percentage is a number, not a string', () => {
    const { percentage } = calculateProfit({ buyPrice: 100 }, 120);
    expect(typeof percentage).toBe('number');
    expect(percentage).toBe(20);
  });

  it('percentage rounds to integer', () => {
    const { percentage } = calculateProfit({ buyPrice: 3 }, 4);
    // (4-3)/3 * 100 = 33.333... → rounds to 33
    expect(percentage).toBe(33);
  });
});

describe('sellGood emits new cargo array reference', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CARGO_CHANGED event carries a new array reference after sell', () => {
    const state = gsm.getState();
    state.player.credits = 1000;
    state.player.debt = 0;
    state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 15 }];

    // Capture the cargo reference before the sell
    const cargoBefore = state.ship.cargo;

    // Listen for CARGO_CHANGED
    let emittedCargo = null;
    gsm.subscribe(EVENT_NAMES.CARGO_CHANGED, (data) => {
      emittedCargo = data;
    });

    // Set up prices so we can sell
    state.world.currentSystemPrices = { ore: 20 };

    gsm.sellGood(0, 5, 20);

    // The emitted cargo must be a different reference so React re-renders
    expect(emittedCargo).not.toBe(cargoBefore);
  });
});

describe('TradingSystem.recordCargoPurchase', () => {
  it('creates a new stack with full metadata', () => {
    const cargo = [];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'ore',
      5,
      100,
      3,
      'Alpha Centauri',
      10
    );
    expect(result).toEqual([
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Alpha Centauri',
        buyDate: 10,
      },
    ]);
  });

  it('consolidates into existing stack with matching good and price', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Alpha Centauri',
        buyDate: 10,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'ore',
      3,
      100,
      7,
      'Barnards Star',
      20
    );
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(8);
    // Preserves original metadata
    expect(result[0].buySystem).toBe(3);
    expect(result[0].buySystemName).toBe('Alpha Centauri');
    expect(result[0].buyDate).toBe(10);
  });

  it('creates separate stack when price differs', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'ore',
      3,
      200,
      5,
      'Proxima',
      5
    );
    expect(result).toHaveLength(2);
    expect(result[0].buyPrice).toBe(100);
    expect(result[1].buyPrice).toBe(200);
  });

  it('creates separate stack when good type differs', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const result = TradingSystem.recordCargoPurchase(
      cargo,
      'food',
      3,
      100,
      5,
      'Proxima',
      5
    );
    expect(result).toHaveLength(2);
    expect(result[0].good).toBe('ore');
    expect(result[1].good).toBe('food');
  });

  it('does not mutate the original cargo array', () => {
    const cargo = [
      {
        good: 'ore',
        qty: 5,
        buyPrice: 100,
        buySystem: 3,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    TradingSystem.recordCargoPurchase(cargo, 'ore', 3, 100, 5, 'Proxima', 5);
    expect(cargo).toHaveLength(1);
    expect(cargo[0].qty).toBe(5);
  });
});

describe('TradingSystem.calculateCargoUsed', () => {
  it('sums quantities across all stacks', () => {
    const cargo = [
      { good: 'ore', qty: 5 },
      { good: 'food', qty: 10 },
      { good: 'parts', qty: 3 },
    ];
    expect(TradingSystem.calculateCargoUsed(cargo)).toBe(18);
  });

  it('returns 0 for empty cargo', () => {
    expect(TradingSystem.calculateCargoUsed([])).toBe(0);
  });

  it('returns 0 for non-array input', () => {
    expect(TradingSystem.calculateCargoUsed(null)).toBe(0);
    expect(TradingSystem.calculateCargoUsed(undefined)).toBe(0);
  });

  it('treats missing qty as 0', () => {
    const cargo = [{ good: 'ore' }, { good: 'food', qty: 5 }];
    expect(TradingSystem.calculateCargoUsed(cargo)).toBe(5);
  });
});

describe('TradingSystem.calculatePrice validation', () => {
  it('throws for unknown good type', () => {
    expect(() =>
      TradingSystem.calculatePrice('unobtainium', { id: 0, x: 0, y: 0, z: 0 })
    ).toThrow('Unknown good type');
  });

  it('throws when system is null', () => {
    expect(() => TradingSystem.calculatePrice('ore', null)).toThrow(
      'System object required'
    );
  });

  it('throws when system is not an object', () => {
    expect(() => TradingSystem.calculatePrice('ore', 'Sol')).toThrow(
      'System object required'
    );
  });
});

describe('TradingSystem.getTemporalModifier validation', () => {
  it('throws for non-number systemId', () => {
    expect(() => TradingSystem.getTemporalModifier('abc', 0)).toThrow(
      'Invalid systemId'
    );
  });

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
});

describe('TradingSystem.getLocalModifier validation', () => {
  it('throws for non-number systemId', () => {
    expect(() => TradingSystem.getLocalModifier('abc', 'ore', {})).toThrow(
      'Invalid systemId'
    );
  });

  it('throws for empty goodType', () => {
    expect(() => TradingSystem.getLocalModifier(0, '', {})).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for non-string goodType', () => {
    expect(() => TradingSystem.getLocalModifier(0, 42, {})).toThrow(
      'Invalid goodType'
    );
  });
});

describe('TradingSystem.getTechModifier validation', () => {
  it('throws for empty goodType', () => {
    expect(() => TradingSystem.getTechModifier('', 5.0)).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for non-string goodType', () => {
    expect(() => TradingSystem.getTechModifier(null, 5.0)).toThrow(
      'Invalid goodType'
    );
  });

  it('throws for NaN techLevel', () => {
    expect(() => TradingSystem.getTechModifier('ore', NaN)).toThrow(
      'Invalid techLevel'
    );
  });

  it('throws for non-number techLevel', () => {
    expect(() => TradingSystem.getTechModifier('ore', 'high')).toThrow(
      'Invalid techLevel'
    );
  });

  it('throws for unknown good type with valid techLevel', () => {
    expect(() => TradingSystem.getTechModifier('unobtainium', 5.0)).toThrow(
      'Unknown good type'
    );
  });
});
