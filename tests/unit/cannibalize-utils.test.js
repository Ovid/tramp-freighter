import { describe, it, expect } from 'vitest';
import {
  calculateCannibalizeRequired,
  calculateMaxDonation,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateRepairCost,
  calculateDiscountedRepairCost,
  calculateDiscountedRepairAllCost,
} from '../../src/features/repair/repairUtils.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Cannibalization Utility Functions', () => {
  describe('isSystemCritical', () => {
    it('returns true at threshold', () => {
      expect(isSystemCritical(REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD)).toBe(
        true
      );
    });

    it('returns true below threshold', () => {
      expect(isSystemCritical(0)).toBe(true);
    });

    it('returns false above threshold', () => {
      expect(
        isSystemCritical(REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1)
      ).toBe(false);
    });
  });

  describe('calculateCannibalizeRequired', () => {
    it('calculates required donation with waste multiplier', () => {
      // Hull at 5%, needs 16% to reach 21%. At 1.5x = 24
      expect(calculateCannibalizeRequired(5)).toBe(24);
    });

    it('returns 0 when already at target', () => {
      expect(
        calculateCannibalizeRequired(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET)
      ).toBe(0);
    });
  });

  describe('calculateMaxDonation', () => {
    it('returns available amount above donor floor', () => {
      // Engine at 80%, floor at 21% = 59% available
      expect(calculateMaxDonation(80)).toBe(59);
    });

    it('returns 0 when at donor floor', () => {
      expect(calculateMaxDonation(REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN)).toBe(0);
    });

    it('returns 0 when below donor floor', () => {
      expect(calculateMaxDonation(10)).toBe(0);
    });

    it('returns an integer when donor condition is fractional', () => {
      // 79.3 - 21 = 58.3 → should round to 58
      expect(calculateMaxDonation(79.3)).toBe(58);
      expect(Number.isInteger(calculateMaxDonation(79.3))).toBe(true);
    });

    it('rounds correctly at .5 boundary', () => {
      // 79.5 - 21 = 58.5 → should round to 59
      expect(calculateMaxDonation(79.5)).toBe(59);
    });
  });

  describe('canAffordRepairAboveThreshold', () => {
    it('returns true when credits cover repair to target', () => {
      // Hull at 5%, needs 16% at COST_PER_PERCENT/% = total cost
      const needed = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - 5;
      const cost = needed * REPAIR_CONFIG.COST_PER_PERCENT;
      expect(canAffordRepairAboveThreshold(5, cost)).toBe(true);
    });

    it('returns false when credits are insufficient', () => {
      const needed = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - 5;
      const cost = needed * REPAIR_CONFIG.COST_PER_PERCENT;
      expect(canAffordRepairAboveThreshold(5, cost - 1)).toBe(false);
    });
  });
});

describe('calculateRepairCost rounding', () => {
  it('returns an integer when amount is fractional', () => {
    // 20.7 * 5 = 103.5 → should ceil to 104
    const result = calculateRepairCost(20.7, 0);
    expect(result).toBe(104);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns an integer for whole-number amounts', () => {
    const result = calculateRepairCost(10, 0);
    expect(result).toBe(50);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('rounds up fractional costs (ceil)', () => {
    // 10.1 * 5 = 50.5 → should ceil to 51
    const result = calculateRepairCost(10.1, 0);
    expect(result).toBe(51);
  });
});

describe('Discounted repair cost rounding', () => {
  it('calculateDiscountedRepairCost uses ceil not round', () => {
    // 13 * 5 = 65, discount 0.12 → 65 * 0.88 = 57.2 → round would be 57, ceil = 58
    const result = calculateDiscountedRepairCost(13, 0, 0.12);
    expect(result).toBe(58);
  });

  it('calculateDiscountedRepairAllCost uses ceil not round', () => {
    // hull needs 7%, engine needs 7%, LS at 100%
    // hull cost: ceil(7*5)=35, engine: ceil(7*5)=35, total=70
    // discount 0.15 → 70 * 0.85 = 59.5 → ceil = 60
    const condition = { hull: 93, engine: 93, lifeSupport: 100 };
    const result = calculateDiscountedRepairAllCost(condition, 0.15);
    expect(result).toBe(60);
  });
});
