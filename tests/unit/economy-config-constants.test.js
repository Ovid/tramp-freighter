/**
 * Unit Tests for ECONOMY_CONFIG Constants
 * Feature: deterministic-economy, Properties 20-26: Economy configuration constants
 */

import { describe, it, expect } from 'vitest';
import { ECONOMY_CONFIG } from '../../src/game/constants.js';

describe('ECONOMY_CONFIG Constants', () => {
  /**
   * Property 20: MAX_COORD_DISTANCE constant is 21
   * Validates: Requirements 7.2
   */
  it('Property 20: MAX_COORD_DISTANCE should be 21', () => {
    expect(ECONOMY_CONFIG.MAX_COORD_DISTANCE).toBe(21);
  });

  /**
   * Property 21: MAX_TECH_LEVEL constant is 10.0
   * Validates: Requirements 7.3
   */
  it('Property 21: MAX_TECH_LEVEL should be 10.0', () => {
    expect(ECONOMY_CONFIG.MAX_TECH_LEVEL).toBe(10.0);
  });

  /**
   * Property 22: MIN_TECH_LEVEL constant is 1.0
   * Validates: Requirements 7.4
   */
  it('Property 22: MIN_TECH_LEVEL should be 1.0', () => {
    expect(ECONOMY_CONFIG.MIN_TECH_LEVEL).toBe(1.0);
  });

  /**
   * Property 23: MARKET_CAPACITY constant is 1000
   * Validates: Requirements 7.5
   */
  it('Property 23: MARKET_CAPACITY should be 1000', () => {
    expect(ECONOMY_CONFIG.MARKET_CAPACITY).toBe(1000);
  });

  /**
   * Property 24: DAILY_RECOVERY_FACTOR constant is 0.90
   * Validates: Requirements 7.6
   */
  it('Property 24: DAILY_RECOVERY_FACTOR should be 0.90', () => {
    expect(ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR).toBe(0.9);
  });

  /**
   * Property 25: TEMPORAL_WAVE_PERIOD constant is 30
   * Validates: Requirements 7.7
   */
  it('Property 25: TEMPORAL_WAVE_PERIOD should be 30', () => {
    expect(ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD).toBe(30);
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
