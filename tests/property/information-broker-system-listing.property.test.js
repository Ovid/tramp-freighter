/**
 * Property-Based Tests for Information Broker System Listing
 * Feature: dynamic-economy, Property 15: Information Broker System Listing
 * Validates: Requirements 5.2
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker } from '../../js/game-information-broker.js';

describe('Property: Information Broker System Listing', () => {
    
    it('should list all systems with their intelligence costs and last visit information', () => {
        fc.assert(
            fc.property(
                // Generate random star data with unique IDs
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 20 }),
                        type: fc.constantFrom('G2V', 'K5V', 'M3V', 'A1V', 'F7V'),
                        x: fc.float({ min: -300, max: 300 }),
                        y: fc.float({ min: -300, max: 300 }),
                        z: fc.float({ min: -300, max: 300 }),
                        st: fc.integer({ min: 0, max: 5 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ).map((systems, idx) => systems.map((s, i) => ({ ...s, id: i }))),
                // Generate random price knowledge
                fc.dictionary(
                    fc.integer({ min: 0, max: 116 }).map(String),
                    fc.record({
                        lastVisit: fc.integer({ min: 0, max: 100 }),
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
                (starData, priceKnowledge) => {
                    const listing = InformationBroker.listAvailableIntelligence(priceKnowledge, starData);
                    
                    // Should return an entry for every system
                    expect(listing.length).toBe(starData.length);
                    
                    // Each entry should have required fields
                    for (const entry of listing) {
                        expect(entry).toHaveProperty('systemId');
                        expect(entry).toHaveProperty('systemName');
                        expect(entry).toHaveProperty('cost');
                        expect(entry).toHaveProperty('lastVisit');
                        
                        // Verify the entry corresponds to a system in starData
                        const system = starData.find(s => s.id === entry.systemId);
                        expect(system).toBeDefined();
                        expect(entry.systemName).toBe(system.name);
                        
                        // Cost should be a positive number
                        expect(entry.cost).toBeGreaterThan(0);
                        expect(typeof entry.cost).toBe('number');
                        
                        // lastVisit should be null or a non-negative number
                        if (entry.lastVisit !== null) {
                            expect(typeof entry.lastVisit).toBe('number');
                            expect(entry.lastVisit).toBeGreaterThanOrEqual(0);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should include cost information based on visit history', () => {
        fc.assert(
            fc.property(
                // Generate a single system
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 1, maxLength: 20 }),
                    type: fc.constantFrom('G2V', 'K5V', 'M3V'),
                    x: fc.float({ min: -300, max: 300 }),
                    y: fc.float({ min: -300, max: 300 }),
                    z: fc.float({ min: -300, max: 300 }),
                    st: fc.integer({ min: 0, max: 5 })
                }),
                // Generate price knowledge with lastVisit
                fc.integer({ min: 0, max: 100 }),
                (system, lastVisit) => {
                    const starData = [system];
                    const priceKnowledge = {
                        [system.id]: {
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
                    
                    const listing = InformationBroker.listAvailableIntelligence(priceKnowledge, starData);
                    
                    expect(listing.length).toBe(1);
                    const entry = listing[0];
                    
                    // Cost should match what getIntelligenceCost returns
                    const expectedCost = InformationBroker.getIntelligenceCost(system.id, priceKnowledge);
                    expect(entry.cost).toBe(expectedCost);
                    
                    // lastVisit should match the price knowledge
                    expect(entry.lastVisit).toBe(lastVisit);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle systems with no price knowledge', () => {
        fc.assert(
            fc.property(
                // Generate systems
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 0, max: 116 }),
                        name: fc.string({ minLength: 1, maxLength: 20 }),
                        type: fc.constantFrom('G2V', 'K5V', 'M3V'),
                        x: fc.float({ min: -300, max: 300 }),
                        y: fc.float({ min: -300, max: 300 }),
                        z: fc.float({ min: -300, max: 300 }),
                        st: fc.integer({ min: 0, max: 5 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (starData) => {
                    // Empty price knowledge
                    const priceKnowledge = {};
                    
                    const listing = InformationBroker.listAvailableIntelligence(priceKnowledge, starData);
                    
                    // Should still list all systems
                    expect(listing.length).toBe(starData.length);
                    
                    // All systems should have null lastVisit
                    for (const entry of listing) {
                        expect(entry.lastVisit).toBeNull();
                        
                        // Cost should be for never visited system
                        expect(entry.cost).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
