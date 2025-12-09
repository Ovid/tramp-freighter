'use strict';

/**
 * Property Tests for Tech Modifier Formula
 * Feature: deterministic-economy, Property 6: Tech modifier formula correctness
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { ECONOMY_CONFIG, COMMODITY_TYPES } from '../../js/game-constants.js';

describe('Tech Modifier Formula (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 6: Tech modifier formula correctness
  // Feature: deterministic-economy, Property 6: Tech modifier formula correctness
  // Validates: Requirements 2.7
  // ========================================================================

  it('Property 6: For any commodity and technology level, tech modifier should equal 1.0 + (bias × (5.0 - TL) × 0.08)', () => {
    // Generator for commodity types and tech levels
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);
    const techLevelGenerator = fc.float({
      min: ECONOMY_CONFIG.MIN_TECH_LEVEL,
      max: ECONOMY_CONFIG.MAX_TECH_LEVEL,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        commodityGenerator,
        techLevelGenerator,
        (goodType, techLevel) => {
          const calculatedModifier = TradingSystem.getTechModifier(
            goodType,
            techLevel
          );

          const bias = ECONOMY_CONFIG.TECH_BIASES[goodType];
          const expectedModifier =
            1.0 +
            bias *
              (ECONOMY_CONFIG.TECH_LEVEL_MIDPOINT - techLevel) *
              ECONOMY_CONFIG.TECH_MODIFIER_INTENSITY;

          // Floating point tolerance of 10 decimal places
          expect(calculatedModifier).toBeCloseTo(expectedModifier, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Tech modifier at TL 5.0 should be 1.0
  // At the midpoint tech level, the modifier should be neutral
  // ========================================================================

  it('Additional: Tech modifier at TL midpoint should be 1.0 for all commodities', () => {
    const commodityGenerator = fc.constantFrom(...COMMODITY_TYPES);

    fc.assert(
      fc.property(commodityGenerator, (goodType) => {
        const modifier = TradingSystem.getTechModifier(
          goodType,
          ECONOMY_CONFIG.TECH_LEVEL_MIDPOINT
        );

        // At midpoint, the formula becomes: 1.0 + (bias × (midpoint - midpoint) × intensity) = 1.0
        expect(modifier).toBeCloseTo(1.0, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Negative bias commodities cheaper at low tech
  // For commodities with negative bias, modifier should be < 1.0 at low tech
  // ========================================================================

  it('Additional: Negative bias commodities should have modifier < 1.0 at low tech levels', () => {
    const negativeBiasCommodities = COMMODITY_TYPES.filter(
      (commodity) => ECONOMY_CONFIG.TECH_BIASES[commodity] < 0
    );

    const commodityGenerator = fc.constantFrom(...negativeBiasCommodities);
    const lowTechGenerator = fc.float({
      min: ECONOMY_CONFIG.MIN_TECH_LEVEL,
      max: 3.0,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        commodityGenerator,
        lowTechGenerator,
        (goodType, techLevel) => {
          const modifier = TradingSystem.getTechModifier(goodType, techLevel);

          // Negative bias at low tech (TL < 5) should produce modifier < 1.0
          // This makes the commodity cheaper at low-tech systems
          expect(modifier).toBeLessThan(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Positive bias commodities cheaper at high tech
  // For commodities with positive bias, modifier should be < 1.0 at high tech
  // ========================================================================

  it('Additional: Positive bias commodities should have modifier < 1.0 at high tech levels', () => {
    const positiveBiasCommodities = COMMODITY_TYPES.filter(
      (commodity) => ECONOMY_CONFIG.TECH_BIASES[commodity] > 0
    );

    const commodityGenerator = fc.constantFrom(...positiveBiasCommodities);
    const highTechGenerator = fc.float({
      min: 7.0,
      max: ECONOMY_CONFIG.MAX_TECH_LEVEL,
      noNaN: true,
    });

    fc.assert(
      fc.property(
        commodityGenerator,
        highTechGenerator,
        (goodType, techLevel) => {
          const modifier = TradingSystem.getTechModifier(goodType, techLevel);

          // Positive bias at high tech (TL > 5) should produce modifier < 1.0
          // This makes the commodity cheaper at high-tech systems
          expect(modifier).toBeLessThan(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
