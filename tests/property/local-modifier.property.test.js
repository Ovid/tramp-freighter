'use strict';

/**
 * Property Tests for Local Modifier
 * Feature: deterministic-economy, Property 12, 13, 14: Local modifier formula, clamping, and direction
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { ECONOMY_CONFIG, COMMODITY_TYPES } from '../../js/game-constants.js';

describe('Local Modifier (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 12: Local modifier formula correctness
  // Feature: deterministic-economy, Property 12: Local modifier formula correctness
  // Validates: Requirements 4.3
  // ========================================================================

  it('Property 12: For any surplus value, local modifier should equal 1.0 - (surplus / 1000) before clamping', () => {
    // Generator for surplus values within reasonable range (before clamping)
    // Test values that won't trigger clamping to verify formula correctness
    const surplusGenerator = fc.integer({ min: -750, max: 750 });
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        surplusGenerator,
        (systemId, goodType, surplus) => {
          // Create market conditions with the surplus value
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const calculatedModifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          const expectedModifier =
            1.0 - surplus / ECONOMY_CONFIG.MARKET_CAPACITY;

          // Since we're testing within non-clamping range, the calculated modifier
          // should match the formula exactly
          expect(calculatedModifier).toBeCloseTo(expectedModifier, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 13: Local modifier clamping
  // Feature: deterministic-economy, Property 13: Local modifier clamping
  // Validates: Requirements 4.4
  // ========================================================================

  it('Property 13: For any surplus value, local modifier should be clamped between 0.25 and 2.0', () => {
    // Generator for extreme surplus values that will trigger clamping
    const surplusGenerator = fc.integer({ min: -5000, max: 5000 });
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        surplusGenerator,
        (systemId, goodType, surplus) => {
          // Create market conditions with the surplus value
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const calculatedModifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Modifier must be within bounds
          expect(calculatedModifier).toBeGreaterThanOrEqual(
            ECONOMY_CONFIG.LOCAL_MODIFIER_MIN
          );
          expect(calculatedModifier).toBeLessThanOrEqual(
            ECONOMY_CONFIG.LOCAL_MODIFIER_MAX
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 14: Local modifier direction matches surplus sign
  // Feature: deterministic-economy, Property 14: Local modifier direction matches surplus sign
  // Validates: Requirements 4.6, 4.7
  // ========================================================================

  it('Property 14: For positive surplus, modifier < 1.0 (reducing prices); for negative surplus (deficit), modifier > 1.0 (increasing prices)', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    // Test positive surplus (should reduce prices)
    const positiveSurplusGenerator = fc.integer({ min: 1, max: 1000 });

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        positiveSurplusGenerator,
        (systemId, goodType, surplus) => {
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Positive surplus should reduce prices (modifier < 1.0)
          expect(modifier).toBeLessThan(1.0);
        }
      ),
      { numRuns: 100 }
    );

    // Test negative surplus (deficit - should increase prices)
    const negativeSurplusGenerator = fc.integer({ min: -1000, max: -1 });

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        negativeSurplusGenerator,
        (systemId, goodType, surplus) => {
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Negative surplus (deficit) should increase prices (modifier > 1.0)
          expect(modifier).toBeGreaterThan(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: No trading history should produce neutral modifier
  // When there's no market condition entry, modifier should be 1.0
  // ========================================================================

  it('Additional: No trading history should produce neutral modifier of 1.0', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        (systemId, goodType) => {
          // Empty market conditions (no trading history)
          const marketConditions = {};

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // No trading history should produce neutral modifier
          expect(modifier).toBeCloseTo(1.0, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Missing system entry should produce neutral modifier
  // When system exists but commodity doesn't, modifier should be 1.0
  // ========================================================================

  it('Additional: Missing commodity entry should produce neutral modifier of 1.0', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        (systemId, goodType) => {
          // Market conditions exist for system but not for this commodity
          // Use a different commodity that we know exists
          const otherGoodType = goodType === 'grain' ? 'ore' : 'grain';
          const marketConditions = {
            [systemId]: {
              [otherGoodType]: 100, // Different commodity has data
            },
          };

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Missing commodity entry should produce neutral modifier
          expect(modifier).toBeCloseTo(1.0, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Extreme surplus triggers minimum clamp
  // Large surplus should clamp to LOCAL_MODIFIER_MIN (0.25)
  // ========================================================================

  it('Additional: Extreme surplus should clamp to minimum modifier of 0.25', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);
    // Generate surplus large enough to trigger minimum clamp
    const extremeSurplusGenerator = fc.integer({ min: 1000, max: 10000 });

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        extremeSurplusGenerator,
        (systemId, goodType, surplus) => {
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Extreme surplus should clamp to minimum
          expect(modifier).toBeCloseTo(ECONOMY_CONFIG.LOCAL_MODIFIER_MIN, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Extreme deficit triggers maximum clamp
  // Large deficit should clamp to LOCAL_MODIFIER_MAX (2.0)
  // ========================================================================

  it('Additional: Extreme deficit should clamp to maximum modifier of 2.0', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 100 });
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);
    // Generate deficit large enough to trigger maximum clamp
    const extremeDeficitGenerator = fc.integer({ min: -10000, max: -1000 });

    fc.assert(
      fc.property(
        systemIdGenerator,
        commodityGenerator,
        extremeDeficitGenerator,
        (systemId, goodType, surplus) => {
          const marketConditions = {
            [systemId]: {
              [goodType]: surplus,
            },
          };

          const modifier = TradingSystem.getLocalModifier(
            systemId,
            goodType,
            marketConditions
          );

          // Extreme deficit should clamp to maximum
          expect(modifier).toBeCloseTo(ECONOMY_CONFIG.LOCAL_MODIFIER_MAX, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
