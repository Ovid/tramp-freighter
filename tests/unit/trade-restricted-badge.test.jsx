import { describe, it, expect } from 'vitest';
import { RESTRICTED_GOODS_CONFIG } from '../../src/game/constants.js';

describe('Restricted goods badge logic', () => {
  it('medicine is restricted in contested zones', () => {
    expect(RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.contested).toContain(
      'medicine'
    );
  });

  it('electronics is restricted in safe zones', () => {
    expect(RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.safe).toContain(
      'electronics'
    );
  });

  it('tritium is restricted in dangerous zones', () => {
    expect(RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.dangerous).toContain(
      'tritium'
    );
  });

  it('has a restricted tooltip text', () => {
    expect(RESTRICTED_GOODS_CONFIG.RESTRICTED_TOOLTIP).toBeTruthy();
  });

  describe('zone-based restriction check', () => {
    const isRestrictedInZone = (goodType, zone) => {
      const zoneRestrictions =
        RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
      return zoneRestrictions.includes(goodType);
    };

    it('medicine is not restricted in safe zones', () => {
      expect(isRestrictedInZone('medicine', 'safe')).toBe(false);
    });

    it('medicine is restricted in contested zones', () => {
      expect(isRestrictedInZone('medicine', 'contested')).toBe(true);
    });

    it('grain is not restricted anywhere', () => {
      expect(isRestrictedInZone('grain', 'safe')).toBe(false);
      expect(isRestrictedInZone('grain', 'contested')).toBe(false);
      expect(isRestrictedInZone('grain', 'dangerous')).toBe(false);
    });
  });
});
