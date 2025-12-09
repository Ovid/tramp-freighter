'use strict';

/**
 * Property Tests for Temporal Modifier
 * Feature: deterministic-economy, Properties 7-10: Temporal modifier correctness
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { ECONOMY_CONFIG } from '../../js/game-constants.js';

describe('Temporal Modifier (Property Tests)', () => {
  // ========================================================================
  // PROPERTY 7: Temporal modifier formula correctness
  // Feature: deterministic-economy, Property 7: Temporal modifier formula correctness
  // Validates: Requirements 3.2
  // ========================================================================

  it('Property 7: For any system and game day, temporal modifier should equal 1.0 + (0.15 × sin(2π × (day / 30) + (systemId × 0.15)))', () => {
    // Generator for system IDs (0-116 for Sol Sector)
    const systemIdGenerator = fc.integer({ min: 0, max: 116 });
    // Generator for game days (0-1000 to cover multiple cycles)
    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(systemIdGenerator, dayGenerator, (systemId, currentDay) => {
        const calculatedModifier = TradingSystem.getTemporalModifier(
          systemId,
          currentDay
        );

        const phase =
          (2 * Math.PI * currentDay / ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD) + (systemId * ECONOMY_CONFIG.TEMPORAL_PHASE_OFFSET);
        const expectedModifier =
          1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE * Math.sin(phase);

        // Floating point tolerance of 10 decimal places
        expect(calculatedModifier).toBeCloseTo(expectedModifier, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 8: Temporal wave period is 30 days
  // Feature: deterministic-economy, Property 8: Temporal wave period is 30 days
  // Validates: Requirements 3.3
  // ========================================================================

  it('Property 8: For any system, temporal modifier at day N should equal temporal modifier at day N+30', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 116 });
    const dayGenerator = fc.integer({ min: 0, max: 970 }); // Max 970 so N+30 stays within 1000

    fc.assert(
      fc.property(systemIdGenerator, dayGenerator, (systemId, currentDay) => {
        const modifierAtDay = TradingSystem.getTemporalModifier(
          systemId,
          currentDay
        );
        const modifierAtDayPlus30 = TradingSystem.getTemporalModifier(
          systemId,
          currentDay + ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD
        );

        // Should be identical due to sine wave periodicity
        expect(modifierAtDay).toBeCloseTo(modifierAtDayPlus30, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 9: Temporal modifier range bounds
  // Feature: deterministic-economy, Property 9: Temporal modifier range bounds
  // Validates: Requirements 3.5
  // ========================================================================

  it('Property 9: For any system and game day, temporal modifier should be within [0.85, 1.15]', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 116 });
    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(systemIdGenerator, dayGenerator, (systemId, currentDay) => {
        const modifier = TradingSystem.getTemporalModifier(systemId, currentDay);

        // Sine wave with amplitude 0.15 produces range [1.0 - 0.15, 1.0 + 0.15] = [0.85, 1.15]
        const minModifier = 1.0 - ECONOMY_CONFIG.TEMPORAL_AMPLITUDE;
        const maxModifier = 1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE;

        expect(modifier).toBeGreaterThanOrEqual(minModifier - 1e-10); // Small tolerance for floating point
        expect(modifier).toBeLessThanOrEqual(maxModifier + 1e-10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // PROPERTY 10: Temporal phase differences between systems
  // Feature: deterministic-economy, Property 10: Temporal phase differences between systems
  // Validates: Requirements 3.4
  // ========================================================================

  it('Property 10: For any two different systems on the same day, their temporal modifiers should differ', () => {
    // Generate two different system IDs
    const systemPairGenerator = fc
      .tuple(fc.integer({ min: 0, max: 116 }), fc.integer({ min: 0, max: 116 }))
      .filter(([id1, id2]) => id1 !== id2);

    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(systemPairGenerator, dayGenerator, ([systemId1, systemId2], currentDay) => {
        const modifier1 = TradingSystem.getTemporalModifier(systemId1, currentDay);
        const modifier2 = TradingSystem.getTemporalModifier(systemId2, currentDay);

        // Different systems should have different modifiers due to phase offset
        // Use a small tolerance to account for floating point, but they should be noticeably different
        expect(Math.abs(modifier1 - modifier2)).toBeGreaterThan(1e-10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Temporal modifier at day 0 varies by system
  // Verifies that phase offset creates immediate differences
  // ========================================================================

  it('Additional: Temporal modifier at day 0 should vary by system ID', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 116 });

    fc.assert(
      fc.property(systemIdGenerator, (systemId) => {
        const modifier = TradingSystem.getTemporalModifier(systemId, 0);

        // At day 0, phase = 0 + (systemId × TEMPORAL_PHASE_OFFSET)
        // modifier = 1.0 + (TEMPORAL_AMPLITUDE × sin(systemId × TEMPORAL_PHASE_OFFSET))
        const expectedPhase = systemId * ECONOMY_CONFIG.TEMPORAL_PHASE_OFFSET;
        const expectedModifier = 1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE * Math.sin(expectedPhase);

        expect(modifier).toBeCloseTo(expectedModifier, 10);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Temporal modifier reaches extremes
  // Verifies that the sine wave actually reaches min and max values
  // ========================================================================

  it('Additional: Temporal modifier should reach values close to 0.85 and 1.15 over time', () => {
    const systemIdGenerator = fc.integer({ min: 0, max: 116 });

    fc.assert(
      fc.property(systemIdGenerator, (systemId) => {
        // Sample the modifier over a full period
        let minFound = Infinity;
        let maxFound = -Infinity;

        for (let day = 0; day < ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD; day++) {
          const modifier = TradingSystem.getTemporalModifier(systemId, day);
          minFound = Math.min(minFound, modifier);
          maxFound = Math.max(maxFound, modifier);
        }

        // Should get close to the theoretical bounds
        const minModifier = 1.0 - ECONOMY_CONFIG.TEMPORAL_AMPLITUDE;
        const maxModifier = 1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE;

        // Allow small tolerance since we're sampling discrete days
        expect(minFound).toBeLessThan(minModifier + 0.05);
        expect(maxFound).toBeGreaterThan(maxModifier - 0.05);
      }),
      { numRuns: 100 }
    );
  });
});
