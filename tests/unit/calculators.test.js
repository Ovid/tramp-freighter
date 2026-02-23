import { describe, it, expect } from 'vitest';
import { calculateSystemPrices } from '../../src/game/utils/calculators.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

describe('calculateSystemPrices', () => {
  const mockSystem = { id: 1, x: 0, y: 0, z: 0 };

  it('returns a price for every commodity type', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const type of COMMODITY_TYPES) {
      expect(prices).toHaveProperty(type);
    }
  });

  it('returns integer prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(Number.isInteger(price)).toBe(true);
    }
  });

  it('returns positive prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('prices vary by day (temporal modifier)', () => {
    const pricesDay1 = calculateSystemPrices(mockSystem, 1, [], {});
    const pricesDay15 = calculateSystemPrices(mockSystem, 15, [], {});
    const anyDifferent = COMMODITY_TYPES.some(
      (type) => pricesDay1[type] !== pricesDay15[type]
    );
    expect(anyDifferent).toBe(true);
  });
});
