/**
 * Unit tests for InspectionPanel utility functions
 *
 * Tests isGoodRestrictedInZone and calculateInspectionAnalysis to ensure
 * illegal mission cargo is properly detected, matching backend behavior
 * in DangerManager.countRestrictedGoods().
 */

import { describe, it, expect } from 'vitest';
import {
  isGoodRestrictedInZone,
  calculateInspectionAnalysis,
} from '../../src/features/danger/inspectionUtils.js';
import { MISSION_CARGO_TYPES } from '@game/constants.js';

describe('isGoodRestrictedInZone', () => {
  describe('zone-based restrictions (existing behavior)', () => {
    it('flags goods restricted in their zone', () => {
      // 'electronics' is restricted in 'safe' zone per ZONE_RESTRICTIONS
      const item = { good: 'electronics', qty: 5 };
      expect(isGoodRestrictedInZone('electronics', 'safe', 5, item)).toBe(true);
    });

    it('allows goods not restricted in their zone', () => {
      const item = { good: 'food', qty: 10 };
      expect(isGoodRestrictedInZone('food', 'safe', 5, item)).toBe(false);
    });

    it('flags core system restricted goods at Sol (systemId 0)', () => {
      // 'parts' is in CORE_SYSTEM_RESTRICTED
      const item = { good: 'parts', qty: 3 };
      expect(isGoodRestrictedInZone('parts', 'safe', 0, item)).toBe(true);
    });

    it('flags core system restricted goods at Alpha Centauri (systemId 1)', () => {
      const item = { good: 'parts', qty: 3 };
      expect(isGoodRestrictedInZone('parts', 'safe', 1, item)).toBe(true);
    });

    it('does not flag core-restricted goods outside core systems', () => {
      const item = { good: 'parts', qty: 3 };
      expect(isGoodRestrictedInZone('parts', 'dangerous', 15, item)).toBe(
        false
      );
    });
  });

  describe('illegal mission cargo detection', () => {
    it('flags cargo with missionId and illegal good type as restricted', () => {
      for (const illegalGood of MISSION_CARGO_TYPES.illegal) {
        const item = { good: illegalGood, qty: 1, missionId: 'mission_123' };
        expect(isGoodRestrictedInZone(illegalGood, 'safe', 5, item)).toBe(true);
      }
    });

    it('does not flag legal mission cargo as restricted', () => {
      for (const legalGood of MISSION_CARGO_TYPES.legal) {
        const item = { good: legalGood, qty: 1, missionId: 'mission_456' };
        expect(isGoodRestrictedInZone(legalGood, 'safe', 5, item)).toBe(false);
      }
    });

    it('does not flag illegal good types without a missionId', () => {
      // Illegal mission cargo types without missionId are treated as normal cargo
      for (const illegalGood of MISSION_CARGO_TYPES.illegal) {
        const item = { good: illegalGood, qty: 1 };
        // These goods are not in any zone restriction list, so should be false
        expect(isGoodRestrictedInZone(illegalGood, 'safe', 5, item)).toBe(
          false
        );
      }
    });

    it('flags illegal mission cargo even in zones with no zone restrictions', () => {
      const item = {
        good: 'unmarked_crates',
        qty: 2,
        missionId: 'mission_789',
      };
      expect(
        isGoodRestrictedInZone('unmarked_crates', 'dangerous', 20, item)
      ).toBe(true);
    });
  });

  describe('backward compatibility without cargo item', () => {
    it('works without cargo item parameter (zone restriction)', () => {
      expect(isGoodRestrictedInZone('electronics', 'safe', 5)).toBe(true);
    });

    it('works without cargo item parameter (no restriction)', () => {
      expect(isGoodRestrictedInZone('food', 'safe', 5)).toBe(false);
    });
  });
});

describe('calculateInspectionAnalysis', () => {
  it('includes illegal mission cargo in restrictedItems', () => {
    const cargo = [
      { good: 'food', qty: 10 },
      { good: 'unmarked_crates', qty: 5, missionId: 'mission_001' },
    ];
    const inspection = { severity: 'routine' };

    const analysis = calculateInspectionAnalysis(
      inspection,
      cargo,
      [],
      5, // non-core system
      1000
    );

    expect(analysis.restrictedItems).toContain('unmarked_crates');
  });

  it('does not include legal mission cargo in restrictedItems', () => {
    const cargo = [
      { good: 'registered_freight', qty: 5, missionId: 'mission_002' },
    ];
    const inspection = { severity: 'routine' };

    const analysis = calculateInspectionAnalysis(
      inspection,
      cargo,
      [],
      5,
      1000
    );

    expect(analysis.restrictedItems).not.toContain('registered_freight');
  });

  it('detects both zone-restricted and illegal mission cargo', () => {
    const cargo = [
      { good: 'electronics', qty: 3 }, // zone-restricted in 'safe'
      { good: 'prohibited_tech', qty: 2, missionId: 'mission_003' }, // illegal mission cargo
      { good: 'food', qty: 10 }, // legal
    ];
    const inspection = { severity: 'routine' };

    // System 0 is 'safe' zone
    const analysis = calculateInspectionAnalysis(
      inspection,
      cargo,
      [],
      0,
      1000
    );

    expect(analysis.restrictedItems).toContain('electronics');
    expect(analysis.restrictedItems).toContain('prohibited_tech');
    expect(analysis.restrictedItems).not.toContain('food');
  });
});
