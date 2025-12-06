/**
 * Property-Based Tests for Price Rounding
 * Feature: dynamic-economy, Property 5: Price Rounding
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { BASE_PRICES } from '../../js/game-constants.js';

describe('Property: Price Rounding', () => {
    const commodities = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'];
    const spectralClasses = ['G', 'K', 'M', 'A', 'F', 'O', 'B', 'L', 'T', 'D'];
    
    it('should always return an integer price', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (goodType, spectralClass, stationCount, systemId, currentDay) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    const price = TradingSystem.calculatePrice(goodType, system, currentDay, []);
                    
                    // Price should be an integer
                    expect(Number.isInteger(price)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should round to nearest integer (not floor or ceil)', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (goodType, spectralClass, stationCount, systemId, currentDay) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    const price = TradingSystem.calculatePrice(goodType, system, currentDay, []);
                    
                    // Calculate the unrounded price
                    const basePrice = BASE_PRICES[goodType];
                    const productionMod = TradingSystem.getProductionModifier(goodType, spectralClass);
                    const stationMod = TradingSystem.getStationCountModifier(stationCount);
                    const dailyMod = TradingSystem.getDailyFluctuation(systemId, goodType, currentDay);
                    const unroundedPrice = basePrice * productionMod * stationMod * dailyMod;
                    
                    // Price should be the result of Math.round()
                    expect(price).toBe(Math.round(unroundedPrice));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should never return a decimal value', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (goodType, spectralClass, stationCount, systemId, currentDay) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    const price = TradingSystem.calculatePrice(goodType, system, currentDay, []);
                    
                    // Price should equal itself when floored (no decimal part)
                    expect(price).toBe(Math.floor(price));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle event modifiers and still return integer', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                fc.float({ min: 0.5, max: 2.0 }),
                (goodType, spectralClass, stationCount, systemId, currentDay, eventMultiplier) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    const activeEvents = [{
                        id: 'test-event',
                        type: 'test',
                        systemId: systemId,
                        startDay: currentDay - 1,
                        endDay: currentDay + 5,
                        modifiers: {
                            [goodType]: eventMultiplier
                        }
                    }];
                    
                    const price = TradingSystem.calculatePrice(goodType, system, currentDay, activeEvents);
                    
                    // Price should still be an integer even with event modifiers
                    expect(Number.isInteger(price)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
