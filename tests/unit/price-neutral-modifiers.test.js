'use strict';

import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../js/game-trading.js';
import { BASE_PRICES, NAVIGATION_CONFIG } from '../../js/game-constants.js';

/**
 * Feature: deterministic-economy, Property 28: Price with all modifiers at 1.0 equals base price
 * Validates: Requirements 8.6
 *
 * When all modifiers (tech, temporal, local, event) equal 1.0, the final price
 * should equal the base price rounded to the nearest integer.
 */
describe('Price calculation with neutral modifiers', () => {
  it('should equal base price when all modifiers are 1.0', () => {
    // Create a system at the tech level midpoint (5.0) where tech modifier = 1.0
    // Distance from Sol that produces TL 5.0: 10.0 - (9.0 × d / 21) = 5.0
    // Solving: 9.0 × d / 21 = 5.0 → d = 11.67 LY
    // Convert to map units: 11.67 / NAVIGATION_CONFIG.LY_PER_UNIT ≈ 163 units
    const distanceInMapUnits = 11.67 / NAVIGATION_CONFIG.LY_PER_UNIT;
    const system = {
      id: 0,
      x: distanceInMapUnits, // 11.67 LY from Sol
      y: 0,
      z: 0,
      type: 'G',
      st: 1,
    };

    // Choose a day where temporal modifier for system 0 is 1.0
    // M_temporal = 1.0 + (0.15 × sin(2π × (day / 30) + (0 × 0.15)))
    // For system 0, phase offset = 0, so we need sin(2π × day / 30) = 0
    // This occurs at day 0, 15, 30, etc.
    const currentDay = 0;

    // Empty market conditions (no trading history) → local modifier = 1.0
    const marketConditions = {};

    // No active events → event modifier = 1.0
    const activeEvents = [];

    // Test all commodities
    const commodities = [
      'grain',
      'ore',
      'tritium',
      'parts',
      'medicine',
      'electronics',
    ];

    commodities.forEach((goodType) => {
      const price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );

      const basePrice = BASE_PRICES[goodType];
      const expectedPrice = Math.round(basePrice);

      expect(price).toBe(expectedPrice);
    });
  });

  it('should equal base price for grain at neutral conditions', () => {
    // Specific test for grain with explicit neutral conditions
    const distanceInMapUnits = 11.67 / NAVIGATION_CONFIG.LY_PER_UNIT;
    const system = {
      id: 0,
      x: distanceInMapUnits,
      y: 0,
      z: 0,
      type: 'G',
      st: 1,
    };

    const price = TradingSystem.calculatePrice(
      'grain',
      system,
      0, // day 0 → temporal modifier = 1.0 for system 0
      [], // no events
      {} // no market conditions
    );

    expect(price).toBe(Math.round(BASE_PRICES.grain));
  });

  it('should equal base price for electronics at neutral conditions', () => {
    // Specific test for electronics with explicit neutral conditions
    const distanceInMapUnits = 11.67 / NAVIGATION_CONFIG.LY_PER_UNIT;
    const system = {
      id: 0,
      x: distanceInMapUnits,
      y: 0,
      z: 0,
      type: 'G',
      st: 1,
    };

    const price = TradingSystem.calculatePrice(
      'electronics',
      system,
      0, // day 0 → temporal modifier = 1.0 for system 0
      [], // no events
      {} // no market conditions
    );

    expect(price).toBe(Math.round(BASE_PRICES.electronics));
  });
});
