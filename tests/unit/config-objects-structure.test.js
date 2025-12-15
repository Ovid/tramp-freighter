'use strict';

import { describe, it, expect } from 'vitest';
import {
  SHIP_CONFIG,
  NAVIGATION_CONFIG,
  REPAIR_CONFIG,
  INTELLIGENCE_CONFIG,
  FUEL_PRICING_CONFIG,
  ECONOMY_CONFIG,
  VISUAL_CONFIG,
  LABEL_CONFIG,
  NOTIFICATION_CONFIG,
  ANIMATION_CONFIG,
} from '../../src/game/constants.js';

/**
 * Unit tests for configuration object structure
 * Feature: architecture-refactor
 *
 * **Example 2: Config Objects Exist**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**
 *
 * Verifies that all configuration objects exist with expected properties
 * after reorganizing constants into grouped configuration objects.
 */
describe('Configuration Object Structure', () => {
  describe('Existing Config Objects (Preserved)', () => {
    it('should have ECONOMY_CONFIG with expected properties', () => {
      expect(ECONOMY_CONFIG).toBeDefined();
      expect(ECONOMY_CONFIG.MAX_COORD_DISTANCE).toBeDefined();
      expect(ECONOMY_CONFIG.MAX_TECH_LEVEL).toBeDefined();
      expect(ECONOMY_CONFIG.MIN_TECH_LEVEL).toBeDefined();
      expect(ECONOMY_CONFIG.MARKET_CAPACITY).toBeDefined();
      expect(ECONOMY_CONFIG.TECH_BIASES).toBeDefined();
    });

    it('should have VISUAL_CONFIG with expected properties', () => {
      expect(VISUAL_CONFIG).toBeDefined();
      expect(VISUAL_CONFIG.starSize).toBeDefined();
      expect(VISUAL_CONFIG.connectionColors).toBeDefined();
      expect(VISUAL_CONFIG.sceneBackground).toBeDefined();
    });

    it('should have LABEL_CONFIG with expected properties', () => {
      expect(LABEL_CONFIG).toBeDefined();
      expect(LABEL_CONFIG.maxFontSize).toBeDefined();
      expect(LABEL_CONFIG.minFontSize).toBeDefined();
      expect(LABEL_CONFIG.nearDistance).toBeDefined();
    });

    it('should have NOTIFICATION_CONFIG with expected properties', () => {
      expect(NOTIFICATION_CONFIG).toBeDefined();
      expect(NOTIFICATION_CONFIG.FADE_DURATION).toBeDefined();
      expect(NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION).toBeDefined();
    });

    it('should have ANIMATION_CONFIG with expected properties', () => {
      expect(ANIMATION_CONFIG).toBeDefined();
      expect(ANIMATION_CONFIG.ZOOM_DURATION).toBeDefined();
      expect(ANIMATION_CONFIG.MIN_TRAVEL_DURATION).toBeDefined();
      expect(ANIMATION_CONFIG.SHIP_INDICATOR_SIZE).toBeDefined();
    });
  });

  describe('New Config Objects', () => {
    it('should have SHIP_CONFIG with expected properties', () => {
      expect(SHIP_CONFIG).toBeDefined();
      expect(SHIP_CONFIG.DEFAULT_NAME).toBe('Serendipity');
      expect(Array.isArray(SHIP_CONFIG.NAME_SUGGESTIONS)).toBe(true);
      expect(SHIP_CONFIG.FUEL_CAPACITY).toBe(100);
      expect(SHIP_CONFIG.CARGO_CAPACITY).toBe(100);

      expect(SHIP_CONFIG.DEGRADATION).toBeDefined();
      expect(SHIP_CONFIG.DEGRADATION.HULL_PER_JUMP).toBe(2);
      expect(SHIP_CONFIG.DEGRADATION.ENGINE_PER_JUMP).toBe(1);
      expect(SHIP_CONFIG.DEGRADATION.LIFE_SUPPORT_PER_DAY).toBe(0.5);

      expect(SHIP_CONFIG.CONDITION_BOUNDS).toBeDefined();
      expect(SHIP_CONFIG.CONDITION_BOUNDS.MIN).toBe(0);
      expect(SHIP_CONFIG.CONDITION_BOUNDS.MAX).toBe(100);

      expect(SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS).toBeDefined();
      expect(SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.HULL).toBe(50);
      expect(SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.ENGINE).toBe(30);
      expect(SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT).toBe(20);

      expect(SHIP_CONFIG.ENGINE_CONDITION_PENALTIES).toBeDefined();
      expect(SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD).toBe(60);
      expect(
        SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER
      ).toBe(1.2);
      expect(SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS).toBe(1);

      expect(SHIP_CONFIG.QUIRKS).toBeDefined();
      expect(typeof SHIP_CONFIG.QUIRKS).toBe('object');

      expect(SHIP_CONFIG.UPGRADES).toBeDefined();
      expect(typeof SHIP_CONFIG.UPGRADES).toBe('object');
    });

    it('should have NAVIGATION_CONFIG with expected properties', () => {
      expect(NAVIGATION_CONFIG).toBeDefined();
      expect(NAVIGATION_CONFIG.LY_PER_UNIT).toBeDefined();
      expect(typeof NAVIGATION_CONFIG.LY_PER_UNIT).toBe('number');
      expect(NAVIGATION_CONFIG.FUEL_CAPACITY_EPSILON).toBe(0.01);
    });

    it('should have REPAIR_CONFIG with expected properties', () => {
      expect(REPAIR_CONFIG).toBeDefined();
      expect(REPAIR_CONFIG.COST_PER_PERCENT).toBe(5);
    });

    it('should have INTELLIGENCE_CONFIG with expected properties', () => {
      expect(INTELLIGENCE_CONFIG).toBeDefined();

      expect(INTELLIGENCE_CONFIG.PRICES).toBeDefined();
      expect(INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT).toBe(50);
      expect(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED).toBe(100);
      expect(INTELLIGENCE_CONFIG.PRICES.STALE_VISIT).toBe(75);
      expect(INTELLIGENCE_CONFIG.PRICES.RUMOR).toBe(25);

      expect(INTELLIGENCE_CONFIG.RECENT_THRESHOLD).toBe(30);
      expect(INTELLIGENCE_CONFIG.MAX_AGE).toBe(100);

      expect(INTELLIGENCE_CONFIG.RELIABILITY).toBeDefined();
      expect(INTELLIGENCE_CONFIG.RELIABILITY.MANIPULATION_CHANCE).toBe(0.1);
      expect(INTELLIGENCE_CONFIG.RELIABILITY.MIN_MANIPULATION_MULTIPLIER).toBe(
        0.7
      );
      expect(INTELLIGENCE_CONFIG.RELIABILITY.MAX_MANIPULATION_MULTIPLIER).toBe(
        0.85
      );
    });

    it('should have FUEL_PRICING_CONFIG with expected properties', () => {
      expect(FUEL_PRICING_CONFIG).toBeDefined();

      expect(FUEL_PRICING_CONFIG.CORE_SYSTEMS).toBeDefined();
      expect(Array.isArray(FUEL_PRICING_CONFIG.CORE_SYSTEMS.IDS)).toBe(true);
      expect(FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT).toBe(2);

      expect(FUEL_PRICING_CONFIG.INNER_SYSTEMS).toBeDefined();
      expect(FUEL_PRICING_CONFIG.INNER_SYSTEMS.DISTANCE_THRESHOLD).toBe(4.5);
      expect(FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT).toBe(3);

      expect(FUEL_PRICING_CONFIG.OUTER_SYSTEMS).toBeDefined();
      expect(FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT).toBe(5);
    });
  });
});
