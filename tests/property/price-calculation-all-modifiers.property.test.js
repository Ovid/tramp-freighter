/**
 * Property-Based Tests for Price Calculation with All Modifiers
 * Feature: dynamic-economy, Property 2: Price Calculation with All Modifiers
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { BASE_PRICES } from '../../js/game-constants.js';

describe('Property: Price Calculation with All Modifiers', () => {
    // Commodity types
    const commodities = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'];
    
    // Spectral classes
    const spectralClasses = ['G', 'K', 'M', 'A', 'F', 'O', 'B', 'L', 'T', 'D'];
    
    it('should calculate price as basePrice × production × stationCount × daily × event', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                fc.array(fc.record({
                    id: fc.string(),
                    type: fc.string(),
                    systemId: fc.integer({ min: 0, max: 116 }),
                    startDay: fc.integer({ min: 0, max: 1000 }),
                    endDay: fc.integer({ min: 0, max: 1000 }),
                    modifiers: fc.dictionary(
                        fc.constantFrom(...commodities),
                        fc.float({ min: 0.5, max: 2.0 })
                    )
                }), { maxLength: 5 }),
                (goodType, spectralClass, stationCount, systemId, currentDay, activeEvents) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    const price = TradingSystem.calculatePrice(goodType, system, currentDay, activeEvents);
                    
                    // Calculate expected price manually
                    const basePrice = BASE_PRICES[goodType];
                    const productionMod = TradingSystem.getProductionModifier(goodType, spectralClass);
                    const stationMod = TradingSystem.getStationCountModifier(stationCount);
                    const dailyMod = TradingSystem.getDailyFluctuation(systemId, goodType, currentDay);
                    const eventMod = TradingSystem.getEventModifier(systemId, goodType, activeEvents);
                    
                    const expectedPrice = Math.round(basePrice * productionMod * stationMod * dailyMod * eventMod);
                    
                    // Price should match the formula
                    expect(price).toBe(expectedPrice);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should produce consistent prices for the same inputs', () => {
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
                    
                    const price1 = TradingSystem.calculatePrice(goodType, system, currentDay, []);
                    const price2 = TradingSystem.calculatePrice(goodType, system, currentDay, []);
                    
                    // Same inputs should produce same price
                    expect(price1).toBe(price2);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should apply event modifiers when active event exists for system', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...commodities),
                fc.constantFrom(...spectralClasses).map(letter => `${letter}2V`),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                fc.float({ min: 0.5, max: 2.0, noNaN: true }),
                (goodType, spectralClass, stationCount, systemId, currentDay, eventMultiplier) => {
                    const system = {
                        id: systemId,
                        type: spectralClass,
                        st: stationCount
                    };
                    
                    // Create an active event for this system and good
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
                    
                    const priceWithEvent = TradingSystem.calculatePrice(goodType, system, currentDay, activeEvents);
                    
                    // Calculate what the event modifier should be
                    const actualEventMod = TradingSystem.getEventModifier(systemId, goodType, activeEvents);
                    expect(actualEventMod).toBe(eventMultiplier);
                    
                    // Verify the price calculation includes the event modifier
                    const basePrice = BASE_PRICES[goodType];
                    const productionMod = TradingSystem.getProductionModifier(goodType, spectralClass);
                    const stationMod = TradingSystem.getStationCountModifier(stationCount);
                    const dailyMod = TradingSystem.getDailyFluctuation(systemId, goodType, currentDay);
                    
                    const expectedPriceWithEvent = Math.round(basePrice * productionMod * stationMod * dailyMod * eventMultiplier);
                    expect(priceWithEvent).toBe(expectedPriceWithEvent);
                }
            ),
            { numRuns: 100 }
        );
    });
});
