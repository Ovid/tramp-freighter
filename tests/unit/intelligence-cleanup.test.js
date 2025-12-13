'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import { InformationBroker } from '../../js/game-information-broker.js';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { NavigationSystem } from '../../js/game-navigation.js';
import { INTELLIGENCE_CONFIG } from '../../js/game-constants.js';

const INTELLIGENCE_MAX_AGE = INTELLIGENCE_CONFIG.MAX_AGE;

/**
 * Unit tests for intelligence data cleanup
 *
 * Market data older than INTELLIGENCE_MAX_AGE days should be
 * automatically deleted to prevent stale information from cluttering
 * the player's knowledge base.
 */
describe('Intelligence Cleanup', () => {
  const starData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
    { id: 3, name: 'Wolf 359', x: 0, y: 0, z: 10, type: 'M6V', st: 0 },
  ];

  const wormholeData = [
    [0, 1],
    [0, 2],
    [0, 3],
  ];

  describe('cleanupOldIntelligence', () => {
    it('should remove data older than INTELLIGENCE_MAX_AGE days', () => {
      const priceKnowledge = {
        1: {
          lastVisit: 0, // Current
          prices: { grain: 10, ore: 15 },
        },
        2: {
          lastVisit: 50, // 50 days old
          prices: { grain: 12, ore: 18 },
        },
        3: {
          lastVisit: 150, // 150 days old - too old
          prices: { grain: 11, ore: 16 },
        },
      };

      const cleanedCount =
        InformationBroker.cleanupOldIntelligence(priceKnowledge);

      // System 3 should be removed (lastVisit = 150 > 100)
      expect(cleanedCount).toBe(1);
      expect(priceKnowledge).toHaveProperty('1');
      expect(priceKnowledge).toHaveProperty('2');
      expect(priceKnowledge).not.toHaveProperty('3');
    });

    it('should not remove data within INTELLIGENCE_MAX_AGE days', () => {
      const priceKnowledge = {
        1: {
          lastVisit: 0,
          prices: { grain: 10 },
        },
        2: {
          lastVisit: 50,
          prices: { grain: 12 },
        },
        3: {
          lastVisit: 99,
          prices: { grain: 11 },
        },
      };

      const cleanedCount =
        InformationBroker.cleanupOldIntelligence(priceKnowledge);

      // All data is within 100 days
      expect(cleanedCount).toBe(0);
      expect(Object.keys(priceKnowledge).length).toBe(3);
    });

    it('should remove data exactly at INTELLIGENCE_MAX_AGE + 1 days', () => {
      const priceKnowledge = {
        1: {
          lastVisit: INTELLIGENCE_MAX_AGE,
          prices: { grain: 10 },
        },
        2: {
          lastVisit: INTELLIGENCE_MAX_AGE + 1,
          prices: { grain: 12 },
        },
      };

      const cleanedCount =
        InformationBroker.cleanupOldIntelligence(priceKnowledge);

      // System 2 should be removed (lastVisit = 101 > 100)
      // System 1 should NOT be removed (lastVisit = 100, not > 100)
      expect(cleanedCount).toBe(1);
      expect(priceKnowledge).toHaveProperty('1');
      expect(priceKnowledge).not.toHaveProperty('2');
    });

    it('should handle empty price knowledge', () => {
      const priceKnowledge = {};

      const cleanedCount =
        InformationBroker.cleanupOldIntelligence(priceKnowledge);

      expect(cleanedCount).toBe(0);
      expect(Object.keys(priceKnowledge).length).toBe(0);
    });

    it('should return correct count of cleaned systems', () => {
      const priceKnowledge = {
        1: { lastVisit: 150, prices: {} }, // Too old
        2: { lastVisit: 120, prices: {} }, // Too old
        3: { lastVisit: 110, prices: {} }, // Too old
        4: { lastVisit: 50, prices: {} }, // OK
      };

      const cleanedCount =
        InformationBroker.cleanupOldIntelligence(priceKnowledge);

      // Systems 1, 2, 3 should be removed (lastVisit > 100)
      expect(cleanedCount).toBe(3);
      expect(priceKnowledge).not.toHaveProperty('1');
      expect(priceKnowledge).not.toHaveProperty('2');
      expect(priceKnowledge).not.toHaveProperty('3');
      expect(priceKnowledge).toHaveProperty('4');
    });
  });

  describe('Integration with GameStateManager', () => {
    let gameStateManager;
    let navigationSystem;

    beforeEach(() => {
      navigationSystem = new NavigationSystem(starData, wormholeData);
      gameStateManager = new GameStateManager(
        starData,
        wormholeData,
        navigationSystem
      );
      gameStateManager.initNewGame();
    });

    it('should automatically clean up old data when time advances', () => {
      const state = gameStateManager.getState();

      // Add some price knowledge with different ages
      state.world.priceKnowledge = {
        1: {
          lastVisit: 0,
          prices: { grain: 10 },
        },
        2: {
          lastVisit: 50,
          prices: { grain: 12 },
        },
      };

      // Advance time by 120 days
      // This will increment lastVisit by 120 for all systems
      // System 1: lastVisit becomes 0 + 120 = 120 (should be removed)
      // System 2: lastVisit becomes 50 + 120 = 170 (should be removed)
      gameStateManager.updateTime(120);

      const priceKnowledge = gameStateManager.getPriceKnowledge();
      expect(priceKnowledge).not.toHaveProperty('1');
      expect(priceKnowledge).not.toHaveProperty('2');
    });

    it('should not clean up data when time does not advance', () => {
      const state = gameStateManager.getState();

      state.world.priceKnowledge = {
        1: {
          lastVisit: 150,
          prices: { grain: 10 },
        },
      };

      const currentDay = state.player.daysElapsed;

      // Update to same day (no advancement)
      gameStateManager.updateTime(currentDay);

      // Data should still be there
      const priceKnowledge = gameStateManager.getPriceKnowledge();
      expect(priceKnowledge).toHaveProperty('1');
    });

    it('should clean up multiple old systems at once', () => {
      const state = gameStateManager.getState();

      // Add price knowledge for all systems
      state.world.priceKnowledge = {
        1: { lastVisit: 0, prices: { grain: 10 } },
        2: { lastVisit: 0, prices: { grain: 11 } },
        3: { lastVisit: 0, prices: { grain: 12 } },
      };

      // Advance time past cleanup threshold
      gameStateManager.updateTime(INTELLIGENCE_MAX_AGE + 10);

      // All systems should be cleaned up
      const priceKnowledge = gameStateManager.getPriceKnowledge();
      expect(Object.keys(priceKnowledge).length).toBe(0);
    });

    it('should preserve recently visited systems during cleanup', () => {
      const state = gameStateManager.getState();

      // Add price knowledge with different ages
      state.world.priceKnowledge = {
        1: { lastVisit: 90, prices: { grain: 10 } }, // Will become 110 after 20 days
        2: { lastVisit: 80, prices: { grain: 12 } }, // Will become 100 after 20 days
      };

      // Advance time by 20 days
      // System 1: lastVisit becomes 90 + 20 = 110 (should be removed)
      // System 2: lastVisit becomes 80 + 20 = 100 (should NOT be removed, exactly at threshold)
      gameStateManager.updateTime(20);

      const priceKnowledge = gameStateManager.getPriceKnowledge();
      expect(priceKnowledge).not.toHaveProperty('1');
      expect(priceKnowledge).toHaveProperty('2');
      expect(priceKnowledge[2].lastVisit).toBe(100);
    });
  });
});
