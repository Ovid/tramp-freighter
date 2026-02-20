import { describe, it, expect } from 'vitest';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';

describe('Passenger Constants', () => {
  it('should define all five passenger types', () => {
    const types = Object.keys(PASSENGER_CONFIG.TYPES);
    expect(types).toEqual([
      'refugee',
      'business',
      'wealthy',
      'scientist',
      'family',
    ]);
  });

  it('should have satisfaction weights that sum to 1.0 for each type', () => {
    for (const [typeName, config] of Object.entries(PASSENGER_CONFIG.TYPES)) {
      const weights = config.satisfactionWeights;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('should have cargoSpace between 1 and 3 for each type', () => {
    for (const config of Object.values(PASSENGER_CONFIG.TYPES)) {
      expect(config.cargoSpace).toBeGreaterThanOrEqual(1);
      expect(config.cargoSpace).toBeLessThanOrEqual(3);
    }
  });

  it('should define satisfaction thresholds', () => {
    expect(PASSENGER_CONFIG.SATISFACTION_THRESHOLDS).toBeDefined();
    const t = PASSENGER_CONFIG.SATISFACTION_THRESHOLDS;
    expect(t.VERY_SATISFIED).toBe(80);
    expect(t.SATISFIED).toBe(60);
    expect(t.NEUTRAL).toBe(40);
    expect(t.DISSATISFIED).toBe(20);
  });

  it('should define payment multipliers', () => {
    expect(PASSENGER_CONFIG.PAYMENT_MULTIPLIERS).toBeDefined();
    const m = PASSENGER_CONFIG.PAYMENT_MULTIPLIERS;
    expect(m.VERY_SATISFIED).toBe(1.3);
    expect(m.SATISFIED).toBe(1.15);
    expect(m.NEUTRAL).toBe(1.0);
    expect(m.DISSATISFIED).toBe(0.7);
    expect(m.VERY_DISSATISFIED).toBe(0.5);
    expect(m.ON_TIME_BONUS).toBe(0.1);
  });

  it('should define satisfaction impacts', () => {
    expect(PASSENGER_CONFIG.SATISFACTION_IMPACTS).toBeDefined();
    const i = PASSENGER_CONFIG.SATISFACTION_IMPACTS;
    expect(i.DELAY).toBe(10);
    expect(i.COMBAT).toBe(15);
    expect(i.LOW_LIFE_SUPPORT).toBe(5);
    expect(i.LIFE_SUPPORT_THRESHOLD).toBe(50);
  });

  it('should define initial satisfaction value', () => {
    expect(PASSENGER_CONFIG.INITIAL_SATISFACTION).toBe(50);
  });

  it('should have dialogue arrays with at least one entry per type', () => {
    for (const config of Object.values(PASSENGER_CONFIG.TYPES)) {
      expect(config.dialogue.length).toBeGreaterThanOrEqual(1);
    }
  });
});
