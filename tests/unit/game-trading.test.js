import { describe, it, expect } from 'vitest';
import { calculateProfit } from '../../src/features/trade/tradeUtils.js';

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
