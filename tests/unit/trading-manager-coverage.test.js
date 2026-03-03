import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  COMMODITY_TYPES,
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
  RESTRICTED_GOODS_CONFIG,
} from '../../src/game/constants.js';

describe('TradingManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentSystemPrices', () => {
    it('returns the locked price snapshot', () => {
      const prices = gsm.tradingManager.getCurrentSystemPrices();
      expect(prices).toBeDefined();
      for (const good of COMMODITY_TYPES) {
        expect(typeof prices[good]).toBe('number');
      }
    });

    it('throws when currentSystemPrices is missing', () => {
      gsm.state.world.currentSystemPrices = null;
      expect(() => gsm.tradingManager.getCurrentSystemPrices()).toThrow(
        'currentSystemPrices missing'
      );
    });
  });

  describe('getKnownPrices', () => {
    it('returns null for a system with no price knowledge', () => {
      expect(gsm.tradingManager.getKnownPrices(999)).toBeNull();
    });

    it('returns prices for a system with price knowledge', () => {
      gsm.state.world.priceKnowledge[42] = {
        lastVisit: 0,
        prices: { grain: 100, ore: 200 },
      };
      const prices = gsm.tradingManager.getKnownPrices(42);
      expect(prices).toEqual({ grain: 100, ore: 200 });
    });

    it('throws when priceKnowledge is missing', () => {
      gsm.state.world.priceKnowledge = undefined;
      expect(() => gsm.tradingManager.getKnownPrices(0)).toThrow(
        'priceKnowledge missing'
      );
    });
  });

  describe('hasVisitedSystem', () => {
    it('returns false for unvisited system', () => {
      expect(gsm.tradingManager.hasVisitedSystem(999)).toBe(false);
    });

    it('returns true for system with price knowledge', () => {
      gsm.state.world.priceKnowledge[42] = {
        lastVisit: 0,
        prices: {},
      };
      expect(gsm.tradingManager.hasVisitedSystem(42)).toBe(true);
    });

    it('throws when priceKnowledge is missing', () => {
      gsm.state.world.priceKnowledge = undefined;
      expect(() => gsm.tradingManager.hasVisitedSystem(0)).toThrow(
        'priceKnowledge missing'
      );
    });
  });

  describe('isGoodRestrictedAnywhere', () => {
    it('returns true for electronics (zone-restricted in safe zones)', () => {
      expect(gsm.tradingManager.isGoodRestrictedAnywhere('electronics')).toBe(
        true
      );
    });

    it('returns true for medicine (zone-restricted in contested zones)', () => {
      expect(gsm.tradingManager.isGoodRestrictedAnywhere('medicine')).toBe(
        true
      );
    });

    it('returns true for parts (core-system restricted)', () => {
      expect(gsm.tradingManager.isGoodRestrictedAnywhere('parts')).toBe(true);
    });

    it('returns false for grain (unrestricted everywhere)', () => {
      expect(gsm.tradingManager.isGoodRestrictedAnywhere('grain')).toBe(false);
    });
  });

  describe('recalculatePricesForKnownSystems', () => {
    it('updates prices in price knowledge for known systems', () => {
      const systemId = gsm.state.player.currentSystem;
      gsm.state.world.priceKnowledge[systemId] = {
        lastVisit: 5,
        prices: { grain: 999, ore: 999 },
      };

      gsm.tradingManager.recalculatePricesForKnownSystems();

      const updated = gsm.state.world.priceKnowledge[systemId].prices;
      for (const good of COMMODITY_TYPES) {
        expect(typeof updated[good]).toBe('number');
        expect(updated[good]).toBeGreaterThan(0);
      }
    });

    it('preserves lastVisit when recalculating', () => {
      const systemId = gsm.state.player.currentSystem;
      gsm.state.world.priceKnowledge[systemId] = {
        lastVisit: 42,
        prices: { grain: 100 },
      };

      gsm.tradingManager.recalculatePricesForKnownSystems();

      expect(gsm.state.world.priceKnowledge[systemId].lastVisit).toBe(42);
    });

    it('does nothing when priceKnowledge is empty', () => {
      gsm.state.world.priceKnowledge = {};
      gsm.tradingManager.recalculatePricesForKnownSystems();
      expect(gsm.state.world.priceKnowledge).toEqual({});
    });

    it('skips unknown system IDs gracefully', () => {
      gsm.state.world.priceKnowledge[9999] = {
        lastVisit: 0,
        prices: { grain: 100 },
      };

      gsm.tradingManager.recalculatePricesForKnownSystems();

      // Unknown system should still exist but prices unchanged
      expect(gsm.state.world.priceKnowledge[9999].prices).toEqual({
        grain: 100,
      });
    });

    it('emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const handler = vi.fn();
      gsm.subscribe('priceKnowledgeChanged', handler);
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 0,
        prices: { grain: 100 },
      };

      gsm.tradingManager.recalculatePricesForKnownSystems();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('throws when activeEvents is missing', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 0,
        prices: {},
      };
      gsm.state.world.activeEvents = undefined;
      expect(() =>
        gsm.tradingManager.recalculatePricesForKnownSystems()
      ).toThrow('activeEvents missing');
    });

    it('throws when marketConditions is missing', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 0,
        prices: {},
      };
      gsm.state.world.marketConditions = undefined;
      expect(() =>
        gsm.tradingManager.recalculatePricesForKnownSystems()
      ).toThrow('marketConditions missing');
    });
  });

  describe('incrementPriceKnowledgeStaleness', () => {
    it('increments lastVisit by 1 day by default', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 5,
        prices: { grain: 100 },
      };

      gsm.tradingManager.incrementPriceKnowledgeStaleness();

      expect(gsm.state.world.priceKnowledge[0].lastVisit).toBe(6);
    });

    it('increments lastVisit by specified days', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 5,
        prices: { grain: 100 },
      };

      gsm.tradingManager.incrementPriceKnowledgeStaleness(3);

      expect(gsm.state.world.priceKnowledge[0].lastVisit).toBe(8);
    });

    it('increments all systems in price knowledge', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 2,
        prices: {},
      };
      gsm.state.world.priceKnowledge[4] = {
        lastVisit: 10,
        prices: {},
      };

      gsm.tradingManager.incrementPriceKnowledgeStaleness(1);

      expect(gsm.state.world.priceKnowledge[0].lastVisit).toBe(3);
      expect(gsm.state.world.priceKnowledge[4].lastVisit).toBe(11);
    });

    it('emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const handler = vi.fn();
      gsm.subscribe('priceKnowledgeChanged', handler);

      gsm.tradingManager.incrementPriceKnowledgeStaleness();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('throws when priceKnowledge is missing', () => {
      gsm.state.world.priceKnowledge = undefined;
      expect(() =>
        gsm.tradingManager.incrementPriceKnowledgeStaleness()
      ).toThrow('priceKnowledge missing');
    });
  });

  describe('updatePriceKnowledge', () => {
    it('stores prices for a system', () => {
      const prices = { grain: 50, ore: 75 };
      gsm.tradingManager.updatePriceKnowledge(42, prices, 0, 'visited');

      expect(gsm.state.world.priceKnowledge[42]).toEqual({
        lastVisit: 0,
        prices: { grain: 50, ore: 75 },
        source: 'visited',
      });
    });

    it('makes a defensive copy of prices', () => {
      const prices = { grain: 50 };
      gsm.tradingManager.updatePriceKnowledge(42, prices);
      prices.grain = 999;
      expect(gsm.state.world.priceKnowledge[42].prices.grain).toBe(50);
    });

    it('emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const handler = vi.fn();
      gsm.subscribe('priceKnowledgeChanged', handler);

      gsm.tradingManager.updatePriceKnowledge(42, { grain: 50 });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordVisitedPrices', () => {
    it('records current system prices into price knowledge', () => {
      const systemId = gsm.state.player.currentSystem;
      gsm.tradingManager.recordVisitedPrices();

      const knowledge = gsm.state.world.priceKnowledge[systemId];
      expect(knowledge).toBeDefined();
      expect(knowledge.lastVisit).toBe(0);
      expect(knowledge.source).toBe('visited');
      for (const good of COMMODITY_TYPES) {
        expect(typeof knowledge.prices[good]).toBe('number');
      }
    });

    it('marks state dirty', () => {
      const spy = vi.spyOn(gsm, 'markDirty');
      gsm.tradingManager.recordVisitedPrices();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('buyGood', () => {
    it('returns failure when insufficient credits', () => {
      gsm.state.player.credits = 10;
      const result = gsm.tradingManager.buyGood('ore', 5, 100);
      expect(result).toEqual({
        success: false,
        reason: 'Insufficient credits',
      });
    });

    it('returns failure when insufficient cargo space', () => {
      gsm.state.player.credits = 100000;
      // Set cargo capacity to something small
      vi.spyOn(gsm, 'getCargoRemaining').mockReturnValue(2);
      const result = gsm.tradingManager.buyGood('ore', 5, 10);
      expect(result).toEqual({
        success: false,
        reason: 'Not enough cargo space',
      });
    });

    it('deducts credits and adds cargo on success', () => {
      gsm.state.player.credits = 1000;
      gsm.state.ship.cargo = [];
      vi.spyOn(gsm, 'getCargoRemaining').mockReturnValue(100);
      const result = gsm.tradingManager.buyGood('ore', 5, 100);
      expect(result).toEqual({ success: true });
      expect(gsm.state.player.credits).toBe(500);
    });

    it('updates market conditions with negative quantity (deficit)', () => {
      gsm.state.player.credits = 10000;
      gsm.state.ship.cargo = [];
      vi.spyOn(gsm, 'getCargoRemaining').mockReturnValue(100);
      const systemId = gsm.state.player.currentSystem;

      gsm.tradingManager.buyGood('ore', 5, 100);

      expect(gsm.state.world.marketConditions[systemId].ore).toBe(-5);
    });
  });

  describe('sellGood', () => {
    beforeEach(() => {
      gsm.state.player.credits = 1000;
      gsm.state.player.debt = 0;
      gsm.state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 50 }];
      gsm.state.world.currentSystemPrices = { ore: 80 };
      vi.spyOn(gsm, 'applyTradeWithholding').mockReturnValue({ withheld: 0 });
    });

    it('returns failure for invalid stack index', () => {
      expect(gsm.tradingManager.sellGood(-1, 5, 80)).toEqual({
        success: false,
        reason: 'Invalid cargo stack',
      });
      expect(gsm.tradingManager.sellGood(99, 5, 80)).toEqual({
        success: false,
        reason: 'Invalid cargo stack',
      });
    });

    it('returns failure for mission cargo', () => {
      gsm.state.ship.cargo[0].missionId = 'mission_123';
      expect(gsm.tradingManager.sellGood(0, 5, 80)).toEqual({
        success: false,
        reason: 'Mission cargo cannot be sold',
      });
    });

    it('returns failure for zero or negative quantity', () => {
      expect(gsm.tradingManager.sellGood(0, 0, 80)).toEqual({
        success: false,
        reason: 'Quantity must be positive',
      });
      expect(gsm.tradingManager.sellGood(0, -1, 80)).toEqual({
        success: false,
        reason: 'Quantity must be positive',
      });
    });

    it('returns failure when selling more than available', () => {
      expect(gsm.tradingManager.sellGood(0, 20, 80)).toEqual({
        success: false,
        reason: 'Not enough quantity in stack',
      });
    });

    it('adds revenue to credits on success', () => {
      const result = gsm.tradingManager.sellGood(0, 5, 80);
      expect(result.success).toBe(true);
      expect(result.totalRevenue).toBe(400);
      expect(result.profitMargin).toBe(30);
      expect(gsm.state.player.credits).toBe(1400);
    });

    it('removes stack when fully sold', () => {
      gsm.tradingManager.sellGood(0, 10, 80);
      expect(gsm.state.ship.cargo).toHaveLength(0);
    });

    it('reduces quantity when partially sold', () => {
      gsm.tradingManager.sellGood(0, 3, 80);
      expect(gsm.state.ship.cargo[0].qty).toBe(7);
    });

    it('updates stats on sale', () => {
      gsm.state.stats = { cargoHauled: 0, creditsEarned: 0 };
      gsm.tradingManager.sellGood(0, 5, 80);
      expect(gsm.state.stats.cargoHauled).toBe(5);
      expect(gsm.state.stats.creditsEarned).toBe(400);
    });

    it('updates market conditions with positive quantity (surplus)', () => {
      const systemId = gsm.state.player.currentSystem;
      gsm.tradingManager.sellGood(0, 5, 80);
      expect(gsm.state.world.marketConditions[systemId].ore).toBe(5);
    });
  });

  describe('applyMarketRecovery', () => {
    it('decays market conditions toward zero', () => {
      gsm.state.world.marketConditions = {
        0: { ore: 100, grain: -50 },
      };
      gsm.tradingManager.applyMarketRecovery(1);
      // After 1 day, values should be multiplied by 0.9
      expect(gsm.state.world.marketConditions[0].ore).toBeCloseTo(90, 0);
      expect(gsm.state.world.marketConditions[0].grain).toBeCloseTo(-45, 0);
    });

    it('prunes insignificant values and removes empty system entries', () => {
      gsm.state.world.marketConditions = {
        0: { ore: 0.5, grain: 100 },
      };
      gsm.tradingManager.applyMarketRecovery(1);
      // ore: 0.5 * 0.9 = 0.45, below threshold 1.0, pruned
      expect(gsm.state.world.marketConditions[0].ore).toBeUndefined();
      // grain: 100 * 0.9 = 90, still significant
      expect(gsm.state.world.marketConditions[0].grain).toBeCloseTo(90, 0);
    });

    it('removes system entry when all commodities pruned', () => {
      gsm.state.world.marketConditions = {
        0: { ore: 0.5 },
      };
      gsm.tradingManager.applyMarketRecovery(1);
      // System entry should be removed after all commodities pruned
      expect(gsm.state.world.marketConditions[0]).toBeUndefined();
    });

    it('handles multiple days of recovery', () => {
      gsm.state.world.marketConditions = {
        0: { ore: 100 },
      };
      gsm.tradingManager.applyMarketRecovery(10);
      // 100 * 0.9^10 ≈ 34.87
      expect(gsm.state.world.marketConditions[0].ore).toBeCloseTo(34.87, 0);
    });

    it('throws when marketConditions is missing', () => {
      gsm.state.world.marketConditions = undefined;
      expect(() => gsm.tradingManager.applyMarketRecovery(1)).toThrow(
        'marketConditions missing'
      );
    });
  });

  describe('updateMarketConditions', () => {
    it('creates system and commodity entries on first trade', () => {
      gsm.state.world.marketConditions = {};
      gsm.tradingManager.updateMarketConditions(42, 'ore', 10);
      expect(gsm.state.world.marketConditions[42].ore).toBe(10);
    });

    it('accumulates subsequent trades', () => {
      gsm.state.world.marketConditions = {};
      gsm.tradingManager.updateMarketConditions(42, 'ore', 10);
      gsm.tradingManager.updateMarketConditions(42, 'ore', -3);
      expect(gsm.state.world.marketConditions[42].ore).toBe(7);
    });
  });

  describe('getPriceKnowledge', () => {
    it('returns the price knowledge object', () => {
      gsm.state.world.priceKnowledge = { 0: { lastVisit: 0, prices: {} } };
      expect(gsm.tradingManager.getPriceKnowledge()).toEqual({
        0: { lastVisit: 0, prices: {} },
      });
    });

    it('returns empty object when priceKnowledge is falsy', () => {
      gsm.state.world.priceKnowledge = null;
      expect(gsm.tradingManager.getPriceKnowledge()).toEqual({});
    });
  });

  describe('isGoodRestricted', () => {
    it('returns true for electronics in a safe zone system', () => {
      // Mock getDangerZone to return 'safe'
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.isGoodRestricted('electronics', 5)).toBe(true);
    });

    it('returns false for electronics in a contested zone', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('contested');
      expect(gsm.tradingManager.isGoodRestricted('electronics', 5)).toBe(false);
    });

    it('returns true for medicine in a contested zone', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('contested');
      expect(gsm.tradingManager.isGoodRestricted('medicine', 5)).toBe(true);
    });

    it('returns true for tritium in a dangerous zone', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('dangerous');
      expect(gsm.tradingManager.isGoodRestricted('tritium', 5)).toBe(true);
    });

    it('returns true for parts at Sol (core system)', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.isGoodRestricted('parts', SOL_SYSTEM_ID)).toBe(
        true
      );
    });

    it('returns true for parts at Alpha Centauri (core system)', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(
        gsm.tradingManager.isGoodRestricted('parts', ALPHA_CENTAURI_SYSTEM_ID)
      ).toBe(true);
    });

    it('returns false for parts at non-core system', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.isGoodRestricted('parts', 50)).toBe(false);
    });

    it('returns false for unrestricted goods', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.isGoodRestricted('grain', 5)).toBe(false);
    });
  });

  describe('calculateSellPrice', () => {
    it('returns base price for restricted goods in restricted zone', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      // electronics is restricted in safe zones
      expect(gsm.tradingManager.calculateSellPrice('electronics', 5, 100)).toBe(
        100
      );
    });

    it('applies premium multiplier for goods restricted elsewhere', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('contested');
      // electronics is restricted in safe zones but not contested, so premium applies
      const price = gsm.tradingManager.calculateSellPrice(
        'electronics',
        5,
        100
      );
      expect(price).toBe(
        100 * RESTRICTED_GOODS_CONFIG.PRICE_MULTIPLIERS.PREMIUM_MULTIPLIER
      );
    });

    it('returns base price for completely unrestricted goods', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      // grain is unrestricted everywhere
      expect(gsm.tradingManager.calculateSellPrice('grain', 5, 100)).toBe(100);
    });
  });

  describe('canSellGood', () => {
    it('returns true for unrestricted goods without black market contact', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.canSellGood('grain', 5, false)).toBe(true);
    });

    it('returns false for restricted goods without black market contact', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.canSellGood('electronics', 5, false)).toBe(
        false
      );
    });

    it('returns true for restricted goods with black market contact', () => {
      vi.spyOn(gsm, 'getDangerZone').mockReturnValue('safe');
      expect(gsm.tradingManager.canSellGood('electronics', 5, true)).toBe(true);
    });
  });
});
