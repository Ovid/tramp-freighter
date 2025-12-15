'use strict';

/**
 * Unit Tests for Technology Level Edge Cases
 * Feature: deterministic-economy, Properties 2-3: Tech level edge cases
 */

import { describe, it, expect } from 'vitest';
import { TradingSystem } from '../../src/game/game-trading.js';
import { ECONOMY_CONFIG, NAVIGATION_CONFIG } from '../../src/game/constants.js';

const LY_PER_UNIT = NAVIGATION_CONFIG.LY_PER_UNIT;

describe('Technology Level Edge Cases', () => {
  /**
   * Property 2: Sol has maximum technology level
   * Validates: Requirements 1.3
   */
  it('Property 2: Sol (distance 0) should have maximum technology level 10.0', () => {
    const sol = { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2' };
    const techLevel = TradingSystem.calculateTechLevel(sol);
    expect(techLevel).toBe(ECONOMY_CONFIG.MAX_TECH_LEVEL);
    expect(techLevel).toBe(10.0);
  });

  /**
   * Property 3: Systems at 21+ LY have minimum technology level
   * Validates: Requirements 1.4
   */
  it('Property 3: Systems at 21+ light years should have minimum technology level 1.0', () => {
    // Create a system at exactly 21 LY from Sol
    // We need: distance_in_map_units = 21 / LY_PER_UNIT
    const distance21LY = 21 / LY_PER_UNIT;
    const system21 = {
      id: 999,
      x: distance21LY,
      y: 0,
      z: 0,
      name: 'Frontier System',
      type: 'M5',
    };
    const techLevel21 = TradingSystem.calculateTechLevel(system21);
    expect(techLevel21).toBeCloseTo(ECONOMY_CONFIG.MIN_TECH_LEVEL, 5);
    expect(techLevel21).toBeCloseTo(1.0, 5);

    // Create a system beyond 21 LY (should also be 1.0 due to clamping)
    const distance30LY = 30 / LY_PER_UNIT;
    const system30 = {
      id: 1000,
      x: distance30LY,
      y: 0,
      z: 0,
      name: 'Far Frontier',
      type: 'M6',
    };
    const techLevel30 = TradingSystem.calculateTechLevel(system30);
    expect(techLevel30).toBeCloseTo(ECONOMY_CONFIG.MIN_TECH_LEVEL, 5);
    expect(techLevel30).toBeCloseTo(1.0, 5);
  });

  /**
   * Additional edge case: Verify clamping works for extreme distances
   */
  it('should clamp technology level to minimum for systems beyond 21 LY', () => {
    const extremeDistance = 1000000; // Extremely far system
    const extremeSystem = {
      id: 9999,
      x: extremeDistance,
      y: 0,
      z: 0,
      name: 'Extreme Distance',
      type: 'M9',
    };
    const techLevel = TradingSystem.calculateTechLevel(extremeSystem);
    expect(techLevel).toBe(ECONOMY_CONFIG.MIN_TECH_LEVEL);
    expect(techLevel).toBe(1.0);
  });
});
