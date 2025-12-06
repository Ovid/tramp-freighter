import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';
import { EconomicEventsSystem } from '../../js/game-events.js';

/**
 * Feature: dynamic-economy, Property 12: Event Modifier Application
 * Validates: Requirements 4.4, 4.7
 * 
 * For any active economic event, price modifiers should be applied to affected commodities
 * in the event's system for the event duration.
 */
describe('Property: Event Modifier Application', () => {
    it('should apply event modifiers to prices during event duration', () => {
        fc.assert(
            fc.property(
                // Generate random system
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 3, maxLength: 20 }),
                    type: fc.constantFrom('G5', 'K2', 'M3', 'A1', 'F7'),
                    st: fc.integer({ min: 0, max: 5 })
                }),
                // Generate random commodity
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                // Generate random current day
                fc.integer({ min: 0, max: 1000 }),
                (system, goodType, currentDay) => {
                    // Calculate price without event
                    const priceWithoutEvent = TradingSystem.calculatePrice(
                        goodType,
                        system,
                        currentDay,
                        []
                    );
                    
                    // Create an event that affects this commodity
                    const event = {
                        id: `test_event_${system.id}_${currentDay}`,
                        type: 'test_event',
                        systemId: system.id,
                        startDay: currentDay,
                        endDay: currentDay + 5,
                        modifiers: {
                            [goodType]: 1.5  // 50% increase
                        }
                    };
                    
                    // Calculate price with event
                    const priceWithEvent = TradingSystem.calculatePrice(
                        goodType,
                        system,
                        currentDay,
                        [event]
                    );
                    
                    // Property: Price with event should be greater than without event
                    // (exact value depends on rounding of intermediate calculations)
                    expect(priceWithEvent).toBeGreaterThan(priceWithoutEvent);
                    
                    // Property: Price with event should be approximately 1.5x (within rounding tolerance)
                    // Wider tolerance needed due to rounding effects on small prices
                    const ratio = priceWithEvent / priceWithoutEvent;
                    expect(ratio).toBeGreaterThanOrEqual(1.3);
                    expect(ratio).toBeLessThanOrEqual(1.7);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should not apply event modifiers to unaffected commodities', () => {
        fc.assert(
            fc.property(
                // Generate random system
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 3, maxLength: 20 }),
                    type: fc.constantFrom('G5', 'K2', 'M3', 'A1', 'F7'),
                    st: fc.integer({ min: 0, max: 5 })
                }),
                // Generate random current day
                fc.integer({ min: 0, max: 1000 }),
                (system, currentDay) => {
                    // Create an event that only affects ore
                    const event = {
                        id: `test_event_${system.id}_${currentDay}`,
                        type: 'test_event',
                        systemId: system.id,
                        startDay: currentDay,
                        endDay: currentDay + 5,
                        modifiers: {
                            ore: 2.0  // Only affects ore
                        }
                    };
                    
                    // Calculate prices for grain (unaffected)
                    const grainWithoutEvent = TradingSystem.calculatePrice(
                        'grain',
                        system,
                        currentDay,
                        []
                    );
                    
                    const grainWithEvent = TradingSystem.calculatePrice(
                        'grain',
                        system,
                        currentDay,
                        [event]
                    );
                    
                    // Property: Grain price should be unchanged
                    expect(grainWithEvent).toBe(grainWithoutEvent);
                    
                    // Calculate prices for ore (affected)
                    const oreWithoutEvent = TradingSystem.calculatePrice(
                        'ore',
                        system,
                        currentDay,
                        []
                    );
                    
                    const oreWithEvent = TradingSystem.calculatePrice(
                        'ore',
                        system,
                        currentDay,
                        [event]
                    );
                    
                    // Property: Ore price should be approximately doubled (within rounding tolerance)
                    expect(oreWithEvent).toBeGreaterThan(oreWithoutEvent);
                    const oreRatio = oreWithEvent / oreWithoutEvent;
                    expect(oreRatio).toBeGreaterThanOrEqual(1.9);
                    expect(oreRatio).toBeLessThanOrEqual(2.1);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should not apply event modifiers to different systems', () => {
        fc.assert(
            fc.property(
                // Generate two different systems
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 3, maxLength: 20 }),
                    type: fc.constantFrom('G5', 'K2', 'M3', 'A1', 'F7'),
                    st: fc.integer({ min: 0, max: 5 })
                }),
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 3, maxLength: 20 }),
                    type: fc.constantFrom('G5', 'K2', 'M3', 'A1', 'F7'),
                    st: fc.integer({ min: 0, max: 5 })
                }),
                fc.integer({ min: 0, max: 1000 }),
                (system1, system2, currentDay) => {
                    // Ensure systems have different IDs
                    if (system1.id === system2.id) {
                        system2.id = (system1.id + 1) % 117;
                    }
                    
                    // Create an event that only affects system1
                    const event = {
                        id: `test_event_${system1.id}_${currentDay}`,
                        type: 'test_event',
                        systemId: system1.id,
                        startDay: currentDay,
                        endDay: currentDay + 5,
                        modifiers: {
                            grain: 1.5
                        }
                    };
                    
                    // Calculate prices for system2 (unaffected)
                    const priceWithoutEvent = TradingSystem.calculatePrice(
                        'grain',
                        system2,
                        currentDay,
                        []
                    );
                    
                    const priceWithEvent = TradingSystem.calculatePrice(
                        'grain',
                        system2,
                        currentDay,
                        [event]
                    );
                    
                    // Property: System2 price should be unchanged
                    expect(priceWithEvent).toBe(priceWithoutEvent);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should apply correct modifiers for real event types', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 0, max: 116 }),
                    name: fc.string({ minLength: 3, maxLength: 20 }),
                    type: fc.constantFrom('M3', 'L4', 'T6'),  // Mining systems
                    st: fc.integer({ min: 0, max: 5 })
                }),
                fc.integer({ min: 0, max: 1000 }),
                (system, currentDay) => {
                    // Create a mining_strike event
                    const event = EconomicEventsSystem.createEvent('mining_strike', system.id, currentDay);
                    
                    // Calculate ore price without event
                    const oreWithoutEvent = TradingSystem.calculatePrice(
                        'ore',
                        system,
                        currentDay,
                        []
                    );
                    
                    // Calculate ore price with event
                    const oreWithEvent = TradingSystem.calculatePrice(
                        'ore',
                        system,
                        currentDay,
                        [event]
                    );
                    
                    // Property: Ore price should be approximately 1.5x (50% increase)
                    expect(oreWithEvent).toBeGreaterThan(oreWithoutEvent);
                    const oreRatio = oreWithEvent / oreWithoutEvent;
                    expect(oreRatio).toBeGreaterThanOrEqual(1.4);
                    expect(oreRatio).toBeLessThanOrEqual(1.7);
                    
                    // Calculate tritium price without event
                    const tritiumWithoutEvent = TradingSystem.calculatePrice(
                        'tritium',
                        system,
                        currentDay,
                        []
                    );
                    
                    // Calculate tritium price with event
                    const tritiumWithEvent = TradingSystem.calculatePrice(
                        'tritium',
                        system,
                        currentDay,
                        [event]
                    );
                    
                    // Property: Tritium price should be approximately 1.3x (30% increase)
                    expect(tritiumWithEvent).toBeGreaterThan(tritiumWithoutEvent);
                    const tritiumRatio = tritiumWithEvent / tritiumWithoutEvent;
                    expect(tritiumRatio).toBeGreaterThanOrEqual(1.2);
                    expect(tritiumRatio).toBeLessThanOrEqual(1.4);
                }
            ),
            { numRuns: 100 }
        );
    });
});
