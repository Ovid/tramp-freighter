import { describe, it, expect } from 'vitest';
import {
  calculateCannibalizeRequired,
  calculateMaxDonation,
  isSystemCritical,
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
      // 79.3 - 21 = 58.3 → floor to 58 (never overstate capacity)
      expect(calculateMaxDonation(79.3)).toBe(58);
      expect(Number.isInteger(calculateMaxDonation(79.3))).toBe(true);
    });

    it('floors at .5 boundary to avoid overstating capacity', () => {
      // 79.5 - 21 = 58.5 → floor to 58 (donating 59 would drop donor below floor)
      expect(calculateMaxDonation(79.5)).toBe(58);
    });
  });
});
