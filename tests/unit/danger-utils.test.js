import { describe, it, expect } from 'vitest';
import { calculateKarmaModifier } from '../../src/game/utils/danger-utils.js';
import { KARMA_CONFIG } from '../../src/game/constants.js';

describe('danger-utils', () => {
  describe('calculateKarmaModifier', () => {
    it('should return 0 for neutral karma', () => {
      expect(calculateKarmaModifier(0)).toBe(0);
    });

    it('should return positive modifier for positive karma', () => {
      const result = calculateKarmaModifier(100);
      expect(result).toBe(100 * KARMA_CONFIG.SUCCESS_RATE_SCALE);
      expect(result).toBeGreaterThan(0);
    });

    it('should return negative modifier for negative karma', () => {
      const result = calculateKarmaModifier(-100);
      expect(result).toBe(-100 * KARMA_CONFIG.SUCCESS_RATE_SCALE);
      expect(result).toBeLessThan(0);
    });
  });
});
