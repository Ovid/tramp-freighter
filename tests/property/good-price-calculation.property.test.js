/**
 * Property-Based Tests for Good Price Calculation
 * Feature: tramp-freighter-core-loop, Property 15: Good Price Calculation
 * Validates: Requirements 7.2
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property 15: Good Price Calculation', () => {
    /**
     * Property: For any good type and spectral class, the calculated price 
     * should equal the base price multiplied by the spectral class modifier 
     * for that good.
     */
    it('should calculate price as basePrice × spectralModifier for all goods and spectral classes', () => {
        fc.assert(
            fc.property(
                // Generate random good type
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                // Generate random spectral class
                fc.constantFrom('G2V', 'G5V', 'K0V', 'K5V', 'M0V', 'M3V', 'M5V', 
                               'A0V', 'A5V', 'F0V', 'F5V', 'F8V', 'O5V', 'B0V', 
                               'B5V', 'L0V', 'L5V', 'T0V', 'T5V', 'D0V'),
                (goodType, spectralClass) => {
                    // Calculate price using TradingSystem
                    const calculatedPrice = TradingSystem.calculatePrice(goodType, spectralClass);
                    
                    // Manually calculate expected price
                    const basePrice = TradingSystem.BASE_PRICES[goodType];
                    const spectralLetter = spectralClass.charAt(0).toUpperCase();
                    const modifier = TradingSystem.SPECTRAL_MODIFIERS[spectralLetter]?.[goodType] || 1.0;
                    const expectedPrice = Math.round(basePrice * modifier);
                    
                    // Verify they match
                    expect(calculatedPrice).toBe(expectedPrice);
                    
                    // Additional invariants:
                    // 1. Price should always be a positive integer
                    expect(calculatedPrice).toBeGreaterThan(0);
                    expect(Number.isInteger(calculatedPrice)).toBe(true);
                    
                    // 2. Price should be within reasonable bounds (base price ± 50%)
                    expect(calculatedPrice).toBeGreaterThanOrEqual(Math.floor(basePrice * 0.5));
                    expect(calculatedPrice).toBeLessThanOrEqual(Math.ceil(basePrice * 1.6));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Price calculation should be deterministic
     * Same inputs should always produce same output
     */
    it('should produce consistent prices for the same good and spectral class', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.constantFrom('G2V', 'K5V', 'M3V', 'A0V', 'F8V'),
                (goodType, spectralClass) => {
                    const price1 = TradingSystem.calculatePrice(goodType, spectralClass);
                    const price2 = TradingSystem.calculatePrice(goodType, spectralClass);
                    
                    expect(price1).toBe(price2);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Different spectral classes should produce different prices
     * (for goods that have varying modifiers)
     */
    it('should produce different prices for different spectral classes when modifiers differ', () => {
        // Test with grain, which has different modifiers across spectral classes
        const grainPriceG = TradingSystem.calculatePrice('grain', 'G2V');
        const grainPriceM = TradingSystem.calculatePrice('grain', 'M3V');
        
        // G-class has 0.8 modifier, M-class has 1.2 modifier for grain
        expect(grainPriceG).not.toBe(grainPriceM);
        expect(grainPriceG).toBeLessThan(grainPriceM);
    });
});
