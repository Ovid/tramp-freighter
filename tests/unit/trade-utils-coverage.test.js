import { describe, it, expect } from 'vitest';
import {
  validateBuy,
  validateSell,
  calculateMaxBuyQuantity,
  calculateProfit,
} from '../../src/features/trade/tradeUtils.js';

describe('tradeUtils coverage', () => {
  const makeState = (overrides = {}) => ({
    player: { credits: 10000, ...overrides.player },
    ship: {
      cargo: [],
      cargoCapacity: 100,
      ...overrides.ship,
    },
    missions: { active: [], ...overrides.missions },
  });

  describe('validateBuy error branches', () => {
    it('rejects null goodType', () => {
      const result = validateBuy(null, 5, 100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid good type');
    });

    it('rejects empty string goodType', () => {
      const result = validateBuy('', 5, 100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid good type');
    });

    it('rejects numeric goodType', () => {
      const result = validateBuy(42, 5, 100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid good type');
    });

    it('rejects zero quantity', () => {
      const result = validateBuy('ore', 0, 100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Quantity must be positive');
    });

    it('rejects negative quantity', () => {
      const result = validateBuy('ore', -5, 100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Quantity must be positive');
    });

    it('rejects zero price', () => {
      const result = validateBuy('ore', 5, 0, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Price must be positive');
    });

    it('rejects negative price', () => {
      const result = validateBuy('ore', 5, -100, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Price must be positive');
    });

    it('rejects null state', () => {
      const result = validateBuy('ore', 5, 100, null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects state without player', () => {
      const result = validateBuy('ore', 5, 100, { ship: { cargo: [] } });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects state without ship', () => {
      const result = validateBuy('ore', 5, 100, { player: { credits: 1000 } });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects insufficient credits', () => {
      const state = makeState({ player: { credits: 100 } });
      const result = validateBuy('ore', 5, 100, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient credits for purchase');
    });

    it('rejects insufficient cargo capacity', () => {
      const state = makeState({ ship: { cargo: [], cargoCapacity: 3 } });
      const result = validateBuy('ore', 5, 10, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient cargo capacity');
    });

    it('accounts for passenger cargo space', () => {
      const state = makeState({
        ship: { cargo: [], cargoCapacity: 10 },
        missions: {
          active: [{ type: 'passenger', requirements: { cargoSpace: 8 } }],
        },
      });
      const result = validateBuy('ore', 5, 10, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient cargo capacity');
    });

    it('returns valid for acceptable purchase', () => {
      const result = validateBuy('ore', 5, 100, makeState());
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('');
    });
  });

  describe('validateSell error branches', () => {
    it('rejects negative stack index', () => {
      const result = validateSell(-1, 5, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid stack index');
    });

    it('rejects zero quantity', () => {
      const result = validateSell(0, 0, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Quantity must be positive');
    });

    it('rejects negative quantity', () => {
      const result = validateSell(0, -1, makeState());
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Quantity must be positive');
    });

    it('rejects null state', () => {
      const result = validateSell(0, 5, null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects state without ship', () => {
      const result = validateSell(0, 5, { player: {} });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects state without cargo', () => {
      const result = validateSell(0, 5, { ship: {} });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid game state');
    });

    it('rejects out-of-bounds stack index', () => {
      const state = makeState({
        ship: { cargo: [{ qty: 10, good: 'ore' }], cargoCapacity: 100 },
      });
      const result = validateSell(5, 5, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Stack index out of bounds');
    });

    it('rejects quantity exceeding stack', () => {
      const state = makeState({
        ship: { cargo: [{ qty: 5, good: 'ore' }], cargoCapacity: 100 },
      });
      const result = validateSell(0, 10, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient quantity in stack');
    });

    it('returns valid for acceptable sale', () => {
      const state = makeState({
        ship: { cargo: [{ qty: 10, good: 'ore' }], cargoCapacity: 100 },
      });
      const result = validateSell(0, 5, state);
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateMaxBuyQuantity edge cases', () => {
    it('returns 0 for zero price', () => {
      expect(calculateMaxBuyQuantity(0, makeState())).toBe(0);
    });

    it('returns 0 for negative price', () => {
      expect(calculateMaxBuyQuantity(-100, makeState())).toBe(0);
    });

    it('returns 0 for null state', () => {
      expect(calculateMaxBuyQuantity(100, null)).toBe(0);
    });

    it('returns 0 for state without player', () => {
      expect(calculateMaxBuyQuantity(100, { ship: { cargo: [] } })).toBe(0);
    });

    it('returns 0 for state without ship', () => {
      expect(calculateMaxBuyQuantity(100, { player: { credits: 1000 } })).toBe(
        0
      );
    });

    it('is limited by credits', () => {
      const state = makeState({ player: { credits: 300 } });
      expect(calculateMaxBuyQuantity(100, state)).toBe(3);
    });

    it('is limited by cargo capacity', () => {
      const state = makeState({
        player: { credits: 100000 },
        ship: { cargo: [], cargoCapacity: 5 },
      });
      expect(calculateMaxBuyQuantity(10, state)).toBe(5);
    });

    it('accounts for existing cargo', () => {
      const state = makeState({
        player: { credits: 100000 },
        ship: { cargo: [{ qty: 8 }], cargoCapacity: 10 },
      });
      expect(calculateMaxBuyQuantity(10, state)).toBe(2);
    });

    it('accounts for passenger space', () => {
      const state = makeState({
        player: { credits: 100000 },
        ship: { cargo: [], cargoCapacity: 10 },
        missions: {
          active: [{ type: 'passenger', requirements: { cargoSpace: 3 } }],
        },
      });
      expect(calculateMaxBuyQuantity(10, state)).toBe(7);
    });

    it('returns 0 when cargo is completely full', () => {
      const state = makeState({
        ship: { cargo: [{ qty: 100 }], cargoCapacity: 100 },
      });
      expect(calculateMaxBuyQuantity(10, state)).toBe(0);
    });
  });

  describe('calculateProfit edge cases', () => {
    it('returns neutral for null stack', () => {
      const result = calculateProfit(null, 100);
      expect(result.direction).toBe('neutral');
      expect(result.margin).toBe(0);
    });

    it('returns neutral for stack without buyPrice', () => {
      const result = calculateProfit({ good: 'ore' }, 100);
      expect(result.direction).toBe('neutral');
    });

    it('returns neutral for zero currentPrice', () => {
      const result = calculateProfit({ buyPrice: 100 }, 0);
      expect(result.direction).toBe('neutral');
    });

    it('returns neutral for undefined currentPrice', () => {
      const result = calculateProfit({ buyPrice: 100 }, undefined);
      expect(result.direction).toBe('neutral');
    });

    it('returns positive for profitable sale', () => {
      const result = calculateProfit({ buyPrice: 100 }, 150);
      expect(result.direction).toBe('positive');
      expect(result.margin).toBe(50);
      expect(result.percentage).toBe(50);
    });

    it('returns negative for loss sale', () => {
      const result = calculateProfit({ buyPrice: 100 }, 80);
      expect(result.direction).toBe('negative');
      expect(result.margin).toBe(-20);
      expect(result.percentage).toBe(-20);
    });

    it('returns neutral for break-even', () => {
      const result = calculateProfit({ buyPrice: 100 }, 100);
      expect(result.direction).toBe('neutral');
      expect(result.margin).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });
});
