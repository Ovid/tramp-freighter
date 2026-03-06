/**
 * Unit Tests for ECONOMY_CONFIG Constants
 * Feature: deterministic-economy, Properties 20-26: Economy configuration constants
 */

import { describe, it, expect } from 'vitest';
import { ECONOMY_CONFIG } from '../../src/game/constants.js';

describe('ECONOMY_CONFIG Constants', () => {
  /**
   * Properties 20-25: Core economy configuration constants
   * Validates: Requirements 7.2-7.7
   */
  it.each([
    ['MAX_COORD_DISTANCE', 21],
    ['MAX_TECH_LEVEL', 10.0],
    ['MIN_TECH_LEVEL', 1.0],
    ['MARKET_CAPACITY', 200],
    ['DAILY_RECOVERY_FACTOR', 0.95],
    ['TEMPORAL_WAVE_PERIOD', 30],
  ])('%s should be %s', (property, expectedValue) => {
    expect(ECONOMY_CONFIG[property]).toBe(expectedValue);
  });

  /**
   * Property 26: TECH_BIASES constants are correct
   * Validates: Requirements 7.8
   */
  it('Property 26: TECH_BIASES should have correct values for all commodities', () => {
    expect(ECONOMY_CONFIG.TECH_BIASES).toBeDefined();
    expect(ECONOMY_CONFIG.TECH_BIASES.grain).toBe(-0.6);
    expect(ECONOMY_CONFIG.TECH_BIASES.ore).toBe(-0.8);
    expect(ECONOMY_CONFIG.TECH_BIASES.tritium).toBe(-0.3);
    expect(ECONOMY_CONFIG.TECH_BIASES.parts).toBe(0.5);
    expect(ECONOMY_CONFIG.TECH_BIASES.medicine).toBe(0.7);
    expect(ECONOMY_CONFIG.TECH_BIASES.electronics).toBe(1.0);
  });

  /**
   * Additional validation: Ensure all required ECONOMY_CONFIG properties exist
   */
  it('should have all required configuration properties', () => {
    expect(ECONOMY_CONFIG.MAX_COORD_DISTANCE).toBeDefined();
    expect(ECONOMY_CONFIG.MAX_TECH_LEVEL).toBeDefined();
    expect(ECONOMY_CONFIG.MIN_TECH_LEVEL).toBeDefined();
    expect(ECONOMY_CONFIG.MARKET_CAPACITY).toBeDefined();
    expect(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR).toBeDefined();
    expect(ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD).toBeDefined();
    expect(ECONOMY_CONFIG.TEMPORAL_AMPLITUDE).toBeDefined();
    expect(ECONOMY_CONFIG.TECH_MODIFIER_INTENSITY).toBeDefined();
    expect(ECONOMY_CONFIG.LOCAL_MODIFIER_MIN).toBeDefined();
    expect(ECONOMY_CONFIG.LOCAL_MODIFIER_MAX).toBeDefined();
    expect(ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD).toBeDefined();
    expect(ECONOMY_CONFIG.TECH_BIASES).toBeDefined();
  });

  /**
   * Additional validation: Ensure TECH_BIASES has all commodity types
   */
  it('should have TECH_BIASES for all six commodity types', () => {
    const commodities = [
      'grain',
      'ore',
      'tritium',
      'parts',
      'medicine',
      'electronics',
    ];

    commodities.forEach((commodity) => {
      expect(ECONOMY_CONFIG.TECH_BIASES[commodity]).toBeDefined();
      expect(typeof ECONOMY_CONFIG.TECH_BIASES[commodity]).toBe('number');
    });
  });
});
