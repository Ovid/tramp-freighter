/**
 * Property-Based Tests for Intelligence Purchase Transaction
 * Feature: dynamic-economy, Property 16: Intelligence Purchase Transaction
 * Validates: Requirements 5.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker, PRICES } from '../../js/game-information-broker.js';
import { BASE_PRICES } from '../../js/game-constants.js';

describe('Property: Intelligence Purchase Transaction', () => {
    
    it('should deduct credits and update price knowledge for valid purchase', () => {
        fc.assert(
            fc.property(
                // Generate game state with sufficient credits
                fc.record({
                    player: fc.record({
                        credits: fc.integer({ min: 200, max: 10000 }),
                        currentSystem: fc.integer({ min: 0, max: 116 }),
                        daysElapsed: fc.integer({ min: 0, max: 1000 })
                    }),
                    world: fc.record({
                        priceKnowledge: fc.dictionary(
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
                        activeEvents: fc.constant([])
                    })
                }),
                // Generate star data
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
                ).map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
                // Pick a system to purchase intelligence for
                fc.integer({ min: 0, max: 19 }),
                (gameState, starData, systemIndex) => {
                    // Ensure systemIndex is valid
                    const targetSystemId = systemIndex % starData.length;
                    const targetSystem = starData[targetSystemId];
                    
                    // Calculate expected cost
                    const initialCredits = gameState.player.credits;
                    const expectedCost = InformationBroker.getIntelligenceCost(
                        targetSystemId,
                        gameState.world.priceKnowledge
                    );
                    
                    // Purchase intelligence
                    const result = InformationBroker.purchaseIntelligence(
                        gameState,
                        targetSystemId,
                        starData
                    );
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Credits should be deducted
                    expect(gameState.player.credits).toBe(initialCredits - expectedCost);
                    
                    // Price knowledge should be updated
                    expect(gameState.world.priceKnowledge[targetSystemId]).toBeDefined();
                    expect(gameState.world.priceKnowledge[targetSystemId].lastVisit).toBe(0);
                    expect(gameState.world.priceKnowledge[targetSystemId].prices).toBeDefined();
                    
                    // All commodity prices should be present
                    for (const goodType of Object.keys(BASE_PRICES)) {
                        expect(gameState.world.priceKnowledge[targetSystemId].prices[goodType]).toBeDefined();
                        expect(typeof gameState.world.priceKnowledge[targetSystemId].prices[goodType]).toBe('number');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should fail when player has insufficient credits', () => {
        fc.assert(
            fc.property(
                // Generate game state with insufficient credits
                fc.record({
                    player: fc.record({
                        credits: fc.integer({ min: 0, max: 50 }),  // Less than any intelligence cost
                        currentSystem: fc.integer({ min: 0, max: 116 }),
                        daysElapsed: fc.integer({ min: 0, max: 1000 })
                    }),
                    world: fc.record({
                        priceKnowledge: fc.constant({}),  // Never visited any system
                        activeEvents: fc.constant([])
                    })
                }),
                // Generate star data
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 20 }),
                        type: fc.constantFrom('G2V', 'K5V', 'M3V'),
                        x: fc.float({ min: -300, max: 300 }),
                        y: fc.float({ min: -300, max: 300 }),
                        z: fc.float({ min: -300, max: 300 }),
                        st: fc.integer({ min: 0, max: 5 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ).map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
                // Pick a system to purchase intelligence for
                fc.integer({ min: 0, max: 9 }),
                (gameState, starData, systemIndex) => {
                    const targetSystemId = systemIndex % starData.length;
                    const initialCredits = gameState.player.credits;
                    const initialPriceKnowledge = { ...gameState.world.priceKnowledge };
                    
                    // Purchase intelligence
                    const result = InformationBroker.purchaseIntelligence(
                        gameState,
                        targetSystemId,
                        starData
                    );
                    
                    // Should fail
                    expect(result.success).toBe(false);
                    expect(result.reason).toBe('Insufficient credits for intelligence');
                    
                    // Credits should not change
                    expect(gameState.player.credits).toBe(initialCredits);
                    
                    // Price knowledge should not be updated
                    expect(gameState.world.priceKnowledge).toEqual(initialPriceKnowledge);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should set lastVisit to 0 (current) when purchasing intelligence', () => {
        fc.assert(
            fc.property(
                // Generate game state
                fc.record({
                    player: fc.record({
                        credits: fc.integer({ min: 200, max: 10000 }),
                        currentSystem: fc.integer({ min: 0, max: 116 }),
                        daysElapsed: fc.integer({ min: 0, max: 1000 })
                    }),
                    world: fc.record({
                        priceKnowledge: fc.dictionary(
                            fc.integer({ min: 0, max: 10 }).map(String),
                            fc.record({
                                lastVisit: fc.integer({ min: 50, max: 100 }),  // Stale data
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
                        activeEvents: fc.constant([])
                    })
                }),
                // Generate star data
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 20 }),
                        type: fc.constantFrom('G2V', 'K5V', 'M3V'),
                        x: fc.float({ min: -300, max: 300 }),
                        y: fc.float({ min: -300, max: 300 }),
                        z: fc.float({ min: -300, max: 300 }),
                        st: fc.integer({ min: 0, max: 5 })
                    }),
                    { minLength: 5, maxLength: 10 }
                ).map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
                (gameState, starData) => {
                    // Pick a system that has stale price knowledge
                    const systemsWithKnowledge = Object.keys(gameState.world.priceKnowledge).map(Number);
                    if (systemsWithKnowledge.length === 0) return; // Skip if no knowledge
                    
                    const targetSystemId = systemsWithKnowledge[0];
                    
                    // Purchase intelligence
                    const result = InformationBroker.purchaseIntelligence(
                        gameState,
                        targetSystemId,
                        starData
                    );
                    
                    if (result.success) {
                        // lastVisit should be reset to 0 (current)
                        expect(gameState.world.priceKnowledge[targetSystemId].lastVisit).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
