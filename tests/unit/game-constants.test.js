import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PIRATE_CREDIT_DEMAND_CONFIG,
  DISTRESS_CONFIG,
} from '../../src/game/constants.js';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

describe('Magic constants are named in constants.js', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PIRATE_CREDIT_DEMAND_CONFIG.COUNTER_PROPOSAL_DISCOUNT is 0.5', () => {
    expect(PIRATE_CREDIT_DEMAND_CONFIG.COUNTER_PROPOSAL_DISCOUNT).toBe(0.5);
  });

  it('counter-proposal reduced credit cost equals MIN_CREDIT_DEMAND * COUNTER_PROPOSAL_DISCOUNT', () => {
    const { MIN_CREDIT_DEMAND, COUNTER_PROPOSAL_DISCOUNT } =
      PIRATE_CREDIT_DEMAND_CONFIG;
    const expectedCost = Math.round(
      MIN_CREDIT_DEMAND * COUNTER_PROPOSAL_DISCOUNT
    );
    expect(expectedCost).toBe(75); // 150 * 0.5 = 75
  });

  it('DISTRESS_CONFIG.LOOT.SALVAGE_PARTS_QTY is 2', () => {
    expect(DISTRESS_CONFIG.LOOT.SALVAGE_PARTS_QTY).toBe(2);
  });
});
