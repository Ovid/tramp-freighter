'use strict';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  ECONOMY_CONFIG,
  COMMODITY_TYPES,
  EVENT_NAMES,
} from '../../src/game/constants.js';

/**
 * Unit Tests for TradingManager market recovery, price recalculation,
 * and price knowledge staleness methods.
 *
 * Tests three methods accessed via GameStateManager delegation:
 * - applyMarketRecovery(daysPassed)
 * - recalculatePricesForKnownSystems()
 * - incrementPriceKnowledgeStaleness(days)
 */

describe('TradingManager market recovery and price knowledge', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // applyMarketRecovery
  // ==========================================================================

  describe('applyMarketRecovery', () => {
    it('should decay surplus values by recovery factor for 1 day', () => {
      const state = gsm.getState();
      const systemId = state.player.currentSystem;
      state.world.marketConditions[systemId] = { grain: 50 };

      gsm.applyMarketRecovery(1);

      const expected = 50 * ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR;
      expect(state.world.marketConditions[systemId].grain).toBeCloseTo(
        expected,
        10
      );
    });

    it('should decay deficit (negative) values by recovery factor for 1 day', () => {
      const state = gsm.getState();
      const systemId = state.player.currentSystem;
      state.world.marketConditions[systemId] = { ore: -40 };

      gsm.applyMarketRecovery(1);

      const expected = -40 * ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR;
      expect(state.world.marketConditions[systemId].ore).toBeCloseTo(
        expected,
        10
      );
    });

    it('should prune entries below threshold after decay', () => {
      const state = gsm.getState();
      const systemId = state.player.currentSystem;
      // A value small enough that after 1 day of decay it falls below threshold
      // threshold = 1.0, so value * 0.9 < 1.0 means value < 1.0/0.9 ≈ 1.11
      // Use a value that after decay will be below 1.0
      state.world.marketConditions[systemId] = { grain: 0.5 };

      gsm.applyMarketRecovery(1);

      // 0.5 * 0.9 = 0.45 which is < 1.0 threshold, should be pruned
      expect(state.world.marketConditions[systemId]).toBeUndefined();
    });

    it('should remove empty system entries after all goods pruned', () => {
      const state = gsm.getState();
      state.world.marketConditions[999] = { grain: 0.5, ore: 0.8 };

      gsm.applyMarketRecovery(1);

      // Both values after decay (0.45 and 0.72) are below threshold 1.0
      expect(state.world.marketConditions[999]).toBeUndefined();
    });

    it('should apply compound decay for multi-day recovery', () => {
      const state = gsm.getState();
      const systemId = state.player.currentSystem;
      state.world.marketConditions[systemId] = { tritium: 100 };

      const days = 3;
      gsm.applyMarketRecovery(days);

      const expected = 100 * Math.pow(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR, days);
      expect(state.world.marketConditions[systemId].tritium).toBeCloseTo(
        expected,
        10
      );
    });

    it('should be a no-op when marketConditions is empty object', () => {
      const state = gsm.getState();
      state.world.marketConditions = {};

      gsm.applyMarketRecovery(1);

      expect(state.world.marketConditions).toEqual({});
    });

    it('should throw when marketConditions is missing', () => {
      const state = gsm.getState();
      state.world.marketConditions = undefined;

      expect(() => gsm.applyMarketRecovery(1)).toThrow(
        'Invalid state: marketConditions missing from world state'
      );
    });
  });

  // ==========================================================================
  // incrementPriceKnowledgeStaleness
  // ==========================================================================

  describe('incrementPriceKnowledgeStaleness', () => {
    it('should increment lastVisit for all systems by default 1 day', () => {
      const state = gsm.getState();
      // Set up price knowledge for two systems
      state.world.priceKnowledge = {
        0: { lastVisit: 0, prices: {}, source: 'visited' },
        1: { lastVisit: 5, prices: {}, source: 'intelligence_broker' },
      };

      gsm.incrementPriceKnowledgeStaleness();

      expect(state.world.priceKnowledge[0].lastVisit).toBe(1);
      expect(state.world.priceKnowledge[1].lastVisit).toBe(6);
    });

    it('should increment by custom number of days', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = {
        0: { lastVisit: 2, prices: {}, source: 'visited' },
        13: { lastVisit: 0, prices: {}, source: 'visited' },
      };

      gsm.incrementPriceKnowledgeStaleness(7);

      expect(state.world.priceKnowledge[0].lastVisit).toBe(9);
      expect(state.world.priceKnowledge[13].lastVisit).toBe(7);
    });

    it('should emit PRICE_KNOWLEDGE_CHANGED event', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = {
        0: { lastVisit: 0, prices: {}, source: 'visited' },
      };

      let emittedData = null;
      gsm.subscribe(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED, (data) => {
        emittedData = data;
      });

      gsm.incrementPriceKnowledgeStaleness();

      expect(emittedData).not.toBeNull();
      expect(emittedData[0].lastVisit).toBe(1);
    });

    it('should throw when priceKnowledge is missing', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = undefined;

      expect(() => gsm.incrementPriceKnowledgeStaleness()).toThrow(
        'Invalid state: priceKnowledge missing from world state'
      );
    });
  });

  // ==========================================================================
  // recalculatePricesForKnownSystems
  // ==========================================================================

  describe('recalculatePricesForKnownSystems', () => {
    it('should update prices for known systems using TradingSystem.calculatePrice', () => {
      const state = gsm.getState();
      // Record initial prices at Sol
      gsm.recordVisitedPrices();

      const solId = state.player.currentSystem;

      // Set stale placeholder prices that differ from any real calculation
      for (const goodType of COMMODITY_TYPES) {
        state.world.priceKnowledge[solId].prices[goodType] = 9999;
      }

      gsm.recalculatePricesForKnownSystems();

      const newPrices = state.world.priceKnowledge[solId].prices;

      // All prices should have been recalculated away from the placeholder
      for (const goodType of COMMODITY_TYPES) {
        expect(newPrices[goodType]).toBeDefined();
        expect(typeof newPrices[goodType]).toBe('number');
        expect(newPrices[goodType]).not.toBe(9999);
      }
    });

    it('should preserve lastVisit and source metadata', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = {
        0: {
          lastVisit: 10,
          prices: { grain: 5 },
          source: 'intelligence_broker',
        },
      };

      gsm.recalculatePricesForKnownSystems();

      expect(state.world.priceKnowledge[0].lastVisit).toBe(10);
      expect(state.world.priceKnowledge[0].source).toBe('intelligence_broker');
    });

    it('should emit PRICE_KNOWLEDGE_CHANGED event', () => {
      const state = gsm.getState();
      gsm.recordVisitedPrices();

      let emittedData = null;
      gsm.subscribe(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED, (data) => {
        emittedData = data;
      });

      gsm.recalculatePricesForKnownSystems();

      expect(emittedData).not.toBeNull();
      expect(typeof emittedData).toBe('object');
    });

    it('should return early (no-op) when priceKnowledge is null/undefined', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = null;

      // Should not throw
      expect(() => gsm.recalculatePricesForKnownSystems()).not.toThrow();
    });

    it('should throw when activeEvents is missing', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = {
        0: { lastVisit: 0, prices: {}, source: 'visited' },
      };
      state.world.activeEvents = undefined;

      expect(() => gsm.recalculatePricesForKnownSystems()).toThrow(
        'Invalid state: activeEvents missing from world state'
      );
    });

    it('should throw when marketConditions is missing', () => {
      const state = gsm.getState();
      state.world.priceKnowledge = {
        0: { lastVisit: 0, prices: {}, source: 'visited' },
      };
      state.world.marketConditions = undefined;

      expect(() => gsm.recalculatePricesForKnownSystems()).toThrow(
        'Invalid state: marketConditions missing from world state'
      );
    });

    it('should skip systems not found in starData (unknown system IDs)', () => {
      const state = gsm.getState();
      const unknownSystemId = 9999;
      state.world.priceKnowledge = {
        [unknownSystemId]: {
          lastVisit: 3,
          prices: { grain: 42 },
          source: 'intelligence_broker',
        },
      };

      gsm.recalculatePricesForKnownSystems();

      // Prices should remain unchanged for unknown system
      expect(state.world.priceKnowledge[unknownSystemId].prices.grain).toBe(42);
      expect(state.world.priceKnowledge[unknownSystemId].lastVisit).toBe(3);
    });
  });
});
