'use strict';

/**
 * Property Tests for Sol-Barnard Trade Route Profitability
 * Feature: deterministic-economy, Property 19: Sol-Barnard route baseline profitability
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { TEST_STAR_DATA } from '../test-data.js';

describe('Sol-Barnard Trade Route Profitability (Property Tests)', () => {
  // Find Sol and Barnard's Star from test data
  const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
  const barnards = TEST_STAR_DATA.find((s) => s.name === "Barnard's Star");

  if (!sol || !barnards) {
    throw new Error("Test data must include Sol and Barnard's Star");
  }

  // ========================================================================
  // PROPERTY 19: Sol-Barnard route baseline profitability
  // Feature: deterministic-economy, Property 19: Sol-Barnard route baseline profitability
  // Validates: Requirements 6.3, 6.4, 6.5
  // ========================================================================

  it("Property 19: For any temporal modifier combination, buying electronics at Sol and selling at Barnard's should produce profit when no local market saturation exists", () => {
    // Generator for game days (0-1000 days)
    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(dayGenerator, (currentDay) => {
        // No market saturation (empty market conditions)
        const marketConditions = {};
        const activeEvents = [];

        // Calculate buy price at Sol
        const buyPriceAtSol = TradingSystem.calculatePrice(
          'electronics',
          sol,
          currentDay,
          activeEvents,
          marketConditions
        );

        // Calculate sell price at Barnard's
        const sellPriceAtBarnards = TradingSystem.calculatePrice(
          'electronics',
          barnards,
          currentDay,
          activeEvents,
          marketConditions
        );

        // Profit per unit
        const profitPerUnit = sellPriceAtBarnards - buyPriceAtSol;

        // Should always be profitable due to tech level difference
        // Sol (TL 10.0) has cheaper electronics than Barnard's (TL ~7.4)
        expect(profitPerUnit).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("Property 19 (Ore): For any temporal modifier combination, buying ore at Barnard's and selling at Sol should produce profit when no local market saturation exists", () => {
    // Generator for game days (0-1000 days)
    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(dayGenerator, (currentDay) => {
        // No market saturation (empty market conditions)
        const marketConditions = {};
        const activeEvents = [];

        // Calculate buy price at Barnard's
        const buyPriceAtBarnards = TradingSystem.calculatePrice(
          'ore',
          barnards,
          currentDay,
          activeEvents,
          marketConditions
        );

        // Calculate sell price at Sol
        const sellPriceAtSol = TradingSystem.calculatePrice(
          'ore',
          sol,
          currentDay,
          activeEvents,
          marketConditions
        );

        // Profit per unit
        const profitPerUnit = sellPriceAtSol - buyPriceAtBarnards;

        // Should always be profitable due to tech level difference
        // Barnard's (TL ~7.4) has cheaper ore than Sol (TL 10.0)
        expect(profitPerUnit).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Worst-case temporal scenario still profitable
  // Even when temporal modifiers are maximally unfavorable, profit exists
  // ========================================================================

  it('Additional: Sol-Barnard electronics route remains profitable even in worst-case temporal scenario', () => {
    // Generator for game days
    const dayGenerator = fc.integer({ min: 0, max: 1000 });

    fc.assert(
      fc.property(dayGenerator, (currentDay) => {
        const marketConditions = {};
        const activeEvents = [];

        // Calculate prices
        const buyPriceAtSol = TradingSystem.calculatePrice(
          'electronics',
          sol,
          currentDay,
          activeEvents,
          marketConditions
        );

        const sellPriceAtBarnards = TradingSystem.calculatePrice(
          'electronics',
          barnards,
          currentDay,
          activeEvents,
          marketConditions
        );

        // Get temporal modifiers to understand the scenario
        const solTemporalMod = TradingSystem.getTemporalModifier(
          sol.id,
          currentDay
        );
        const barnardsTemporalMod = TradingSystem.getTemporalModifier(
          barnards.id,
          currentDay
        );

        // Even in worst case (Sol at peak temporal, Barnard's at trough),
        // the tech level difference should ensure profitability
        const profitPerUnit = sellPriceAtBarnards - buyPriceAtSol;

        // Verify temporal modifiers are within expected range
        expect(solTemporalMod).toBeGreaterThanOrEqual(0.85);
        expect(solTemporalMod).toBeLessThanOrEqual(1.15);
        expect(barnardsTemporalMod).toBeGreaterThanOrEqual(0.85);
        expect(barnardsTemporalMod).toBeLessThanOrEqual(1.15);

        // Profit should exist regardless of temporal phase
        expect(profitPerUnit).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Additional Property: Tech level difference drives profitability
  // Verify that the static tech level difference is the foundation
  // ========================================================================

  it("Additional: Tech level difference between Sol and Barnard's creates baseline price differential", () => {
    // Test with neutral temporal modifiers (day 0, both systems start at phase 0)
    const currentDay = 0;
    const marketConditions = {};
    const activeEvents = [];

    // Calculate tech levels
    const solTechLevel = TradingSystem.calculateTechLevel(sol);
    const barnardsTechLevel = TradingSystem.calculateTechLevel(barnards);

    // Verify tech level difference exists
    expect(solTechLevel).toBeGreaterThan(barnardsTechLevel);
    expect(solTechLevel).toBeCloseTo(10.0, 1);
    expect(barnardsTechLevel).toBeGreaterThan(7.0);
    expect(barnardsTechLevel).toBeLessThan(8.0);

    // Calculate tech modifiers for electronics (positive bias)
    const solElectronicsMod = TradingSystem.getTechModifier(
      'electronics',
      solTechLevel
    );
    const barnardsElectronicsMod = TradingSystem.getTechModifier(
      'electronics',
      barnardsTechLevel
    );

    // Electronics should be cheaper at Sol (higher tech)
    expect(solElectronicsMod).toBeLessThan(barnardsElectronicsMod);

    // Calculate tech modifiers for ore (negative bias)
    const solOreMod = TradingSystem.getTechModifier('ore', solTechLevel);
    const barnardsOreMod = TradingSystem.getTechModifier(
      'ore',
      barnardsTechLevel
    );

    // Ore should be cheaper at Barnard's (lower tech)
    expect(barnardsOreMod).toBeLessThan(solOreMod);

    // Verify actual prices reflect this
    const solElectronicsPrice = TradingSystem.calculatePrice(
      'electronics',
      sol,
      currentDay,
      activeEvents,
      marketConditions
    );
    const barnardsElectronicsPrice = TradingSystem.calculatePrice(
      'electronics',
      barnards,
      currentDay,
      activeEvents,
      marketConditions
    );

    expect(solElectronicsPrice).toBeLessThan(barnardsElectronicsPrice);

    const solOrePrice = TradingSystem.calculatePrice(
      'ore',
      sol,
      currentDay,
      activeEvents,
      marketConditions
    );
    const barnardsOrePrice = TradingSystem.calculatePrice(
      'ore',
      barnards,
      currentDay,
      activeEvents,
      marketConditions
    );

    expect(barnardsOrePrice).toBeLessThan(solOrePrice);
  });
});
