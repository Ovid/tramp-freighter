import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { TEST_WORMHOLE_DATA } from '../test-data.js';
import {
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
  RESTRICTED_GOODS_CONFIG,
} from '../../src/game/constants.js';

/**
 * Tests for restricted goods trading methods in TradingManager:
 * - isGoodRestricted(goodType, systemId)
 * - calculateSellPrice(goodType, systemId, basePrice)
 * - canSellGood(goodType, systemId, hasBlackMarketContact)
 */

// System IDs from TEST_STAR_DATA:
// Safe zone (explicit): Sol (0), Alpha Centauri (1)
// Safe zone (non-core): Barnard's Star (4)
// Contested zone (explicit): Sirius A (7)
// Contested zone (fallthrough default): Wolf 359 (5)
const SAFE_SYSTEM_SOL = SOL_SYSTEM_ID; // 0
const SAFE_SYSTEM_BARNARD = 4;
const CONTESTED_SYSTEM_SIRIUS = 7;

// Far-away system placed beyond the 15 LY dangerous threshold
const DANGEROUS_SYSTEM_ID = 99;
const DANGEROUS_STAR_DATA = [
  { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2', wh: 8, st: 6, r: 1 },
  {
    id: 1,
    x: -23.1,
    y: -19.18,
    z: -53.76,
    name: 'Alpha Centauri A',
    type: 'G2',
    wh: 6,
    st: 9,
    r: 1,
  },
  {
    id: DANGEROUS_SYSTEM_ID,
    x: 400,
    y: 0,
    z: 0,
    name: 'Far Outpost',
    type: 'M8',
    wh: 1,
    st: 1,
    r: 1,
  },
];

describe('Restricted goods trading', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // isGoodRestricted
  // ==========================================================================

  describe('isGoodRestricted', () => {
    describe('zone-based restrictions', () => {
      it('returns true for electronics in a safe zone', () => {
        // safe zone restricts 'electronics'
        expect(
          gsm.tradingManager.isGoodRestricted('electronics', SAFE_SYSTEM_SOL)
        ).toBe(true);
      });

      it('returns true for medicine in a contested zone', () => {
        // contested zone restricts 'medicine'
        expect(
          gsm.tradingManager.isGoodRestricted(
            'medicine',
            CONTESTED_SYSTEM_SIRIUS
          )
        ).toBe(true);
      });

      it('returns true for tritium in a dangerous zone', () => {
        // dangerous zone restricts 'tritium' — need a far-away system
        const dangerGsm = new GameCoordinator(
          DANGEROUS_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        dangerGsm.initNewGame();

        expect(
          dangerGsm.tradingManager.isGoodRestricted(
            'tritium',
            DANGEROUS_SYSTEM_ID
          )
        ).toBe(true);
      });

      it('returns false for electronics in a contested zone', () => {
        // electronics is only restricted in safe zones, not contested
        expect(
          gsm.tradingManager.isGoodRestricted(
            'electronics',
            CONTESTED_SYSTEM_SIRIUS
          )
        ).toBe(false);
      });

      it('returns false for medicine in a safe zone', () => {
        // medicine is only restricted in contested zones, not safe
        expect(
          gsm.tradingManager.isGoodRestricted('medicine', SAFE_SYSTEM_SOL)
        ).toBe(false);
      });
    });

    describe('core system restrictions', () => {
      it('returns true for parts at Sol', () => {
        expect(
          gsm.tradingManager.isGoodRestricted('parts', SOL_SYSTEM_ID)
        ).toBe(true);
      });

      it('returns true for parts at Alpha Centauri', () => {
        expect(
          gsm.tradingManager.isGoodRestricted('parts', ALPHA_CENTAURI_SYSTEM_ID)
        ).toBe(true);
      });

      it('returns false for parts at a non-core system', () => {
        // Barnard's Star is safe zone but not a core system (Sol/AC only)
        expect(
          gsm.tradingManager.isGoodRestricted('parts', SAFE_SYSTEM_BARNARD)
        ).toBe(false);
      });

      it('returns false for parts at a contested system', () => {
        // Wolf 359 (5) — resolves to contested via fallthrough default
        expect(gsm.tradingManager.isGoodRestricted('parts', 5)).toBe(false);
      });
    });

    describe('unrestricted goods', () => {
      it('returns false for food in any zone', () => {
        expect(
          gsm.tradingManager.isGoodRestricted('food', SAFE_SYSTEM_SOL)
        ).toBe(false);
        expect(
          gsm.tradingManager.isGoodRestricted('food', CONTESTED_SYSTEM_SIRIUS)
        ).toBe(false);
      });

      it('returns false for a good with no restrictions anywhere', () => {
        expect(
          gsm.tradingManager.isGoodRestricted('tritium', SAFE_SYSTEM_SOL)
        ).toBe(false);
      });
    });

    describe('combined zone and core restrictions', () => {
      it('returns true at Sol for both zone-restricted and core-restricted goods', () => {
        // Sol is safe zone: electronics restricted. Also core: parts restricted.
        expect(
          gsm.tradingManager.isGoodRestricted('electronics', SOL_SYSTEM_ID)
        ).toBe(true);
        expect(
          gsm.tradingManager.isGoodRestricted('parts', SOL_SYSTEM_ID)
        ).toBe(true);
      });
    });
  });

  // ==========================================================================
  // calculateSellPrice
  // ==========================================================================

  describe('calculateSellPrice', () => {
    const BASE_PRICE = 100;
    const PREMIUM =
      RESTRICTED_GOODS_CONFIG.PRICE_MULTIPLIERS.PREMIUM_MULTIPLIER;

    it('returns base price when the good is restricted in this system', () => {
      // electronics restricted in safe zone (Sol) — price stays at base
      const price = gsm.tradingManager.calculateSellPrice(
        'electronics',
        SAFE_SYSTEM_SOL,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE);
    });

    it('applies premium multiplier when the good is restricted elsewhere but legal here', () => {
      // electronics is restricted in safe zones, so selling in contested zone gets premium
      const price = gsm.tradingManager.calculateSellPrice(
        'electronics',
        CONTESTED_SYSTEM_SIRIUS,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE * PREMIUM);
    });

    it('returns base price for a good that is not restricted anywhere', () => {
      // food is not restricted in any zone or core system
      const price = gsm.tradingManager.calculateSellPrice(
        'food',
        SAFE_SYSTEM_SOL,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE);
    });

    it('applies premium for parts sold outside core systems', () => {
      // parts restricted at Sol/AC (core) — selling at Barnard's gets premium
      const price = gsm.tradingManager.calculateSellPrice(
        'parts',
        SAFE_SYSTEM_BARNARD,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE * PREMIUM);
    });

    it('returns base price for parts sold at a core system', () => {
      // parts restricted at Sol — price stays at base
      const price = gsm.tradingManager.calculateSellPrice(
        'parts',
        SOL_SYSTEM_ID,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE);
    });

    it('applies premium for medicine sold in a safe zone', () => {
      // medicine restricted in contested zones — selling in safe zone gets premium
      const price = gsm.tradingManager.calculateSellPrice(
        'medicine',
        SAFE_SYSTEM_SOL,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE * PREMIUM);
    });

    it('returns base price for medicine sold in a contested zone', () => {
      // medicine is restricted in contested zones — blocked from trade, base price
      const price = gsm.tradingManager.calculateSellPrice(
        'medicine',
        CONTESTED_SYSTEM_SIRIUS,
        BASE_PRICE
      );
      expect(price).toBe(BASE_PRICE);
    });
  });

  // ==========================================================================
  // canSellGood
  // ==========================================================================

  describe('canSellGood', () => {
    it('blocks sale of restricted good without black market contact', () => {
      // electronics restricted in safe zone (Sol)
      const canSell = gsm.tradingManager.canSellGood(
        'electronics',
        SAFE_SYSTEM_SOL,
        false
      );
      expect(canSell).toBe(false);
    });

    it('allows sale of restricted good with black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'electronics',
        SAFE_SYSTEM_SOL,
        true
      );
      expect(canSell).toBe(true);
    });

    it('allows sale of unrestricted good without black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'food',
        SAFE_SYSTEM_SOL,
        false
      );
      expect(canSell).toBe(true);
    });

    it('allows sale of unrestricted good with black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'food',
        SAFE_SYSTEM_SOL,
        true
      );
      expect(canSell).toBe(true);
    });

    it('blocks core-restricted parts at Sol without black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'parts',
        SOL_SYSTEM_ID,
        false
      );
      expect(canSell).toBe(false);
    });

    it('allows core-restricted parts at Sol with black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'parts',
        SOL_SYSTEM_ID,
        true
      );
      expect(canSell).toBe(true);
    });

    it('allows parts at non-core system regardless of black market', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'parts',
        SAFE_SYSTEM_BARNARD,
        false
      );
      expect(canSell).toBe(true);
    });

    it('blocks medicine in contested zone without black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'medicine',
        CONTESTED_SYSTEM_SIRIUS,
        false
      );
      expect(canSell).toBe(false);
    });

    it('allows medicine in contested zone with black market contact', () => {
      const canSell = gsm.tradingManager.canSellGood(
        'medicine',
        CONTESTED_SYSTEM_SIRIUS,
        true
      );
      expect(canSell).toBe(true);
    });
  });
});
