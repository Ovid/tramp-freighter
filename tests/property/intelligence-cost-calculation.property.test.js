/**
 * Property-Based Tests for Intelligence Cost Calculation
 * Feature: dynamic-economy, Property 17: Intelligence Cost Calculation
 * Validates: Requirements 5.4, 5.5, 5.6
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker, PRICES, RECENT_THRESHOLD } from '../../js/game-information-broker.js';

describe('Property: Intelligence Cost Calculation', () => {
    
    it('should charge RECENT_VISIT price for systems visited within 30 days', () => {
        fc.assert(
            fc.property(
                // Generate system ID
                fc.integer({ min: 0, max: 116 }),
                // Generate lastVisit within recent threshold
                fc.integer({ min: 0, max: RECENT_THRESHOLD }),
                (systemId, lastVisit) => {
                    const priceKnowledge = {
                        [systemId]: {
                            lastVisit: lastVisit,
                            prices: {
                                grain: 10,
                                ore: 15,
                                tritium: 50,
                                parts: 30,
                                medicine: 40,
                                electronics: 35
                            }
                        }
                    };
                    
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // Should charge RECENT_VISIT price
                    expect(cost).toBe(PRICES.RECENT_VISIT);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should charge NEVER_VISITED price for systems never visited', () => {
        fc.assert(
            fc.property(
                // Generate system ID
                fc.integer({ min: 0, max: 116 }),
                (systemId) => {
                    // Empty price knowledge (never visited)
                    const priceKnowledge = {};
                    
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // Should charge NEVER_VISITED price
                    expect(cost).toBe(PRICES.NEVER_VISITED);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should charge STALE_VISIT price for systems visited more than 30 days ago', () => {
        fc.assert(
            fc.property(
                // Generate system ID
                fc.integer({ min: 0, max: 116 }),
                // Generate lastVisit beyond recent threshold
                fc.integer({ min: RECENT_THRESHOLD + 1, max: 1000 }),
                (systemId, lastVisit) => {
                    const priceKnowledge = {
                        [systemId]: {
                            lastVisit: lastVisit,
                            prices: {
                                grain: 10,
                                ore: 15,
                                tritium: 50,
                                parts: 30,
                                medicine: 40,
                                electronics: 35
                            }
                        }
                    };
                    
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // Should charge STALE_VISIT price
                    expect(cost).toBe(PRICES.STALE_VISIT);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should return consistent cost for the same visit state', () => {
        fc.assert(
            fc.property(
                // Generate system ID
                fc.integer({ min: 0, max: 116 }),
                // Generate lastVisit
                fc.integer({ min: 0, max: 1000 }),
                (systemId, lastVisit) => {
                    const priceKnowledge = {
                        [systemId]: {
                            lastVisit: lastVisit,
                            prices: {
                                grain: 10,
                                ore: 15,
                                tritium: 50,
                                parts: 30,
                                medicine: 40,
                                electronics: 35
                            }
                        }
                    };
                    
                    const cost1 = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    const cost2 = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // Should return same cost for same input
                    expect(cost1).toBe(cost2);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should always return one of the three valid prices', () => {
        fc.assert(
            fc.property(
                // Generate system ID
                fc.integer({ min: 0, max: 116 }),
                // Generate price knowledge (may or may not include system)
                fc.dictionary(
                    fc.integer({ min: 0, max: 116 }).map(String),
                    fc.record({
                        lastVisit: fc.integer({ min: 0, max: 1000 }),
                        prices: fc.record({
                            grain: fc.integer({ min: 5, max: 50 }),
                            ore: fc.integer({ min: 10, max: 60 }),
                            tritium: fc.integer({ min: 30, max: 100 }),
                            parts: fc.integer({ min: 20, max: 80 }),
                            medicine: fc.integer({ min: 25, max: 90 }),
                            electronics: fc.integer({ min: 20, max: 85 })
                        })
                    })
                ),
                (systemId, priceKnowledge) => {
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // Cost should be one of the three valid prices
                    const validPrices = [PRICES.RECENT_VISIT, PRICES.NEVER_VISITED, PRICES.STALE_VISIT];
                    expect(validPrices).toContain(cost);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should charge more for never visited than recently visited', () => {
        // This verifies the pricing structure makes sense
        expect(PRICES.NEVER_VISITED).toBeGreaterThan(PRICES.RECENT_VISIT);
    });
    
    it('should charge more for stale visit than recent visit', () => {
        // This verifies the pricing structure makes sense
        expect(PRICES.STALE_VISIT).toBeGreaterThan(PRICES.RECENT_VISIT);
    });
    
    it('should handle edge case at exactly RECENT_THRESHOLD days', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 116 }),
                (systemId) => {
                    // Test at exactly the threshold
                    const priceKnowledge = {
                        [systemId]: {
                            lastVisit: RECENT_THRESHOLD,
                            prices: {
                                grain: 10,
                                ore: 15,
                                tritium: 50,
                                parts: 30,
                                medicine: 40,
                                electronics: 35
                            }
                        }
                    };
                    
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // At exactly threshold, should still be RECENT_VISIT (<=)
                    expect(cost).toBe(PRICES.RECENT_VISIT);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle edge case at RECENT_THRESHOLD + 1 days', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 116 }),
                (systemId) => {
                    // Test at threshold + 1
                    const priceKnowledge = {
                        [systemId]: {
                            lastVisit: RECENT_THRESHOLD + 1,
                            prices: {
                                grain: 10,
                                ore: 15,
                                tritium: 50,
                                parts: 30,
                                medicine: 40,
                                electronics: 35
                            }
                        }
                    };
                    
                    const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
                    
                    // At threshold + 1, should be STALE_VISIT
                    expect(cost).toBe(PRICES.STALE_VISIT);
                }
            ),
            { numRuns: 100 }
        );
    });
});
