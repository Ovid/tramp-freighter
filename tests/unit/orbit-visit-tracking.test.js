import { describe, it, expect } from 'vitest';
import { INTELLIGENCE_CONFIG, COLE_DEBT_CONFIG } from '@game/constants.js';

describe('Orbit visit tracking constants', () => {
  it('should define ORBIT source identifier', () => {
    expect(INTELLIGENCE_CONFIG.SOURCES.ORBIT).toBe('orbit');
    expect(INTELLIGENCE_CONFIG.SOURCES.VISITED).toBe('visited');
    expect(INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER).toBe(
      'intelligence_broker'
    );
  });
});

describe('Cole early repayment constants', () => {
  it('should define early repayment fee rate', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE).toBe(0.1);
  });

  it('should define early repayment window in days', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS).toBe(20);
  });
});
