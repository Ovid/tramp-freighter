import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

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
        prices: { food: 100, ore: 200 },
      };
      const prices = gsm.tradingManager.getKnownPrices(42);
      expect(prices).toEqual({ food: 100, ore: 200 });
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

    it('returns false for food (unrestricted everywhere)', () => {
      expect(gsm.tradingManager.isGoodRestrictedAnywhere('food')).toBe(false);
    });
  });

  describe('recalculatePricesForKnownSystems', () => {
    it('updates prices in price knowledge for known systems', () => {
      const systemId = gsm.state.player.currentSystem;
      gsm.state.world.priceKnowledge[systemId] = {
        lastVisit: 5,
        prices: { food: 999, ore: 999 },
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
        prices: { food: 100 },
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
        prices: { food: 100 },
      };

      gsm.tradingManager.recalculatePricesForKnownSystems();

      // Unknown system should still exist but prices unchanged
      expect(gsm.state.world.priceKnowledge[9999].prices).toEqual({
        food: 100,
      });
    });

    it('emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const handler = vi.fn();
      gsm.subscribe('priceKnowledgeChanged', handler);
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 0,
        prices: { food: 100 },
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
        prices: { food: 100 },
      };

      gsm.tradingManager.incrementPriceKnowledgeStaleness();

      expect(gsm.state.world.priceKnowledge[0].lastVisit).toBe(6);
    });

    it('increments lastVisit by specified days', () => {
      gsm.state.world.priceKnowledge[0] = {
        lastVisit: 5,
        prices: { food: 100 },
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
      const prices = { food: 50, ore: 75 };
      gsm.tradingManager.updatePriceKnowledge(42, prices, 0, 'visited');

      expect(gsm.state.world.priceKnowledge[42]).toEqual({
        lastVisit: 0,
        prices: { food: 50, ore: 75 },
        source: 'visited',
      });
    });

    it('makes a defensive copy of prices', () => {
      const prices = { food: 50 };
      gsm.tradingManager.updatePriceKnowledge(42, prices);
      prices.food = 999;
      expect(gsm.state.world.priceKnowledge[42].prices.food).toBe(50);
    });

    it('emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const handler = vi.fn();
      gsm.subscribe('priceKnowledgeChanged', handler);

      gsm.tradingManager.updatePriceKnowledge(42, { food: 50 });

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
});
