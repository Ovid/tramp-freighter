import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EconomicEventsSystem } from '../../js/game-events.js';

/**
 * Feature: dynamic-economy, Property 13: Event Expiration Cleanup
 * Validates: Requirements 4.5
 * 
 * For any expired economic event (currentDay > endDay), the event should be removed
 * from the active events list.
 */
describe('Property: Event Expiration Cleanup', () => {
    it('should remove expired events from active events list', () => {
        fc.assert(
            fc.property(
                // Generate array of events with random end days
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 30 }),
                        type: fc.constantFrom('mining_strike', 'medical_emergency', 'festival', 'supply_glut'),
                        systemId: fc.integer({ min: 0, max: 116 }),
                        startDay: fc.integer({ min: 0, max: 1000 }),
                        endDay: fc.integer({ min: 0, max: 1000 }),
                        modifiers: fc.dictionary(
                            fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                            fc.float({ min: 0.5, max: 2.0 })
                        )
                    }),
                    { minLength: 0, maxLength: 20 }
                ),
                // Generate current day
                fc.integer({ min: 0, max: 1000 }),
                (activeEvents, currentDay) => {
                    // Remove expired events
                    const filteredEvents = EconomicEventsSystem.removeExpiredEvents(activeEvents, currentDay);
                    
                    // Property: All remaining events should have endDay >= currentDay
                    for (const event of filteredEvents) {
                        expect(event.endDay).toBeGreaterThanOrEqual(currentDay);
                    }
                    
                    // Property: All expired events should be removed
                    const expiredCount = activeEvents.filter(e => e.endDay < currentDay).length;
                    const removedCount = activeEvents.length - filteredEvents.length;
                    expect(removedCount).toBe(expiredCount);
                    
                    // Property: All non-expired events should remain
                    const nonExpiredCount = activeEvents.filter(e => e.endDay >= currentDay).length;
                    expect(filteredEvents.length).toBe(nonExpiredCount);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle empty active events array', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1000 }),
                (currentDay) => {
                    const result = EconomicEventsSystem.removeExpiredEvents([], currentDay);
                    
                    // Property: Empty array should remain empty
                    expect(result).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle all events expired', () => {
        fc.assert(
            fc.property(
                // Generate events that all end before current day
                fc.integer({ min: 100, max: 1000 }),
                (currentDay) => {
                    const activeEvents = [
                        {
                            id: 'event1',
                            type: 'mining_strike',
                            systemId: 0,
                            startDay: currentDay - 50,
                            endDay: currentDay - 10,
                            modifiers: { ore: 1.5 }
                        },
                        {
                            id: 'event2',
                            type: 'festival',
                            systemId: 1,
                            startDay: currentDay - 30,
                            endDay: currentDay - 5,
                            modifiers: { electronics: 1.75 }
                        }
                    ];
                    
                    const result = EconomicEventsSystem.removeExpiredEvents(activeEvents, currentDay);
                    
                    // Property: All events should be removed
                    expect(result).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle all events active', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 900 }),
                (currentDay) => {
                    const activeEvents = [
                        {
                            id: 'event1',
                            type: 'mining_strike',
                            systemId: 0,
                            startDay: currentDay,
                            endDay: currentDay + 10,
                            modifiers: { ore: 1.5 }
                        },
                        {
                            id: 'event2',
                            type: 'festival',
                            systemId: 1,
                            startDay: currentDay,
                            endDay: currentDay + 5,
                            modifiers: { electronics: 1.75 }
                        }
                    ];
                    
                    const result = EconomicEventsSystem.removeExpiredEvents(activeEvents, currentDay);
                    
                    // Property: All events should remain
                    expect(result.length).toBe(2);
                    expect(result).toEqual(activeEvents);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle events ending exactly on current day', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1000 }),
                (currentDay) => {
                    const activeEvents = [
                        {
                            id: 'event1',
                            type: 'mining_strike',
                            systemId: 0,
                            startDay: currentDay - 5,
                            endDay: currentDay,  // Ends exactly on current day
                            modifiers: { ore: 1.5 }
                        },
                        {
                            id: 'event2',
                            type: 'festival',
                            systemId: 1,
                            startDay: currentDay - 10,
                            endDay: currentDay - 1,  // Already expired
                            modifiers: { electronics: 1.75 }
                        }
                    ];
                    
                    const result = EconomicEventsSystem.removeExpiredEvents(activeEvents, currentDay);
                    
                    // Property: Event ending on current day should remain (endDay >= currentDay)
                    expect(result.length).toBe(1);
                    expect(result[0].id).toBe('event1');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should preserve event structure when filtering', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 30 }),
                        type: fc.constantFrom('mining_strike', 'medical_emergency', 'festival', 'supply_glut'),
                        systemId: fc.integer({ min: 0, max: 116 }),
                        startDay: fc.integer({ min: 0, max: 1000 }),
                        endDay: fc.integer({ min: 0, max: 1000 }),
                        modifiers: fc.dictionary(
                            fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                            fc.float({ min: 0.5, max: 2.0 })
                        )
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 0, max: 1000 }),
                (activeEvents, currentDay) => {
                    const result = EconomicEventsSystem.removeExpiredEvents(activeEvents, currentDay);
                    
                    // Property: All remaining events should have complete structure
                    for (const event of result) {
                        expect(event).toHaveProperty('id');
                        expect(event).toHaveProperty('type');
                        expect(event).toHaveProperty('systemId');
                        expect(event).toHaveProperty('startDay');
                        expect(event).toHaveProperty('endDay');
                        expect(event).toHaveProperty('modifiers');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
