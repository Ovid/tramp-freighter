import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EconomicEventsSystem } from '../../js/game-events.js';

/**
 * Feature: dynamic-economy, Property 11: Event Creation Completeness
 * Validates: Requirements 4.3
 * 
 * For any triggered economic event, the created event should contain a unique identifier,
 * type, system identifier, start day, end day, and price modifiers.
 */
describe('Property: Event Creation Completeness', () => {
    it('should create events with all required fields', () => {
        fc.assert(
            fc.property(
                // Generate random event type
                fc.constantFrom('mining_strike', 'medical_emergency', 'festival', 'supply_glut'),
                // Generate random system ID
                fc.integer({ min: 0, max: 116 }),
                // Generate random current day
                fc.integer({ min: 0, max: 1000 }),
                (eventTypeKey, systemId, currentDay) => {
                    // Create event
                    const event = EconomicEventsSystem.createEvent(eventTypeKey, systemId, currentDay);
                    
                    // Property: Event has unique identifier
                    expect(event).toHaveProperty('id');
                    expect(typeof event.id).toBe('string');
                    expect(event.id.length).toBeGreaterThan(0);
                    expect(event.id).toContain(eventTypeKey);
                    expect(event.id).toContain(String(systemId));
                    expect(event.id).toContain(String(currentDay));
                    
                    // Property: Event has type
                    expect(event).toHaveProperty('type');
                    expect(event.type).toBe(eventTypeKey);
                    
                    // Property: Event has system identifier
                    expect(event).toHaveProperty('systemId');
                    expect(event.systemId).toBe(systemId);
                    
                    // Property: Event has start day
                    expect(event).toHaveProperty('startDay');
                    expect(event.startDay).toBe(currentDay);
                    
                    // Property: Event has end day
                    expect(event).toHaveProperty('endDay');
                    expect(typeof event.endDay).toBe('number');
                    expect(event.endDay).toBeGreaterThan(currentDay);
                    
                    // Property: Event has modifiers
                    expect(event).toHaveProperty('modifiers');
                    expect(typeof event.modifiers).toBe('object');
                    expect(Object.keys(event.modifiers).length).toBeGreaterThan(0);
                    
                    // Property: Duration is within expected range
                    const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];
                    const [minDuration, maxDuration] = eventType.duration;
                    const actualDuration = event.endDay - event.startDay;
                    expect(actualDuration).toBeGreaterThanOrEqual(minDuration);
                    expect(actualDuration).toBeLessThanOrEqual(maxDuration);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should create unique IDs for different events', () => {
        fc.assert(
            fc.property(
                // Generate two different event parameters
                fc.constantFrom('mining_strike', 'medical_emergency', 'festival', 'supply_glut'),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                fc.constantFrom('mining_strike', 'medical_emergency', 'festival', 'supply_glut'),
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (eventType1, systemId1, day1, eventType2, systemId2, day2) => {
                    const event1 = EconomicEventsSystem.createEvent(eventType1, systemId1, day1);
                    const event2 = EconomicEventsSystem.createEvent(eventType2, systemId2, day2);
                    
                    // Property: Different parameters should produce different IDs
                    if (eventType1 !== eventType2 || systemId1 !== systemId2 || day1 !== day2) {
                        expect(event1.id).not.toBe(event2.id);
                    } else {
                        // Same parameters should produce same ID (deterministic)
                        expect(event1.id).toBe(event2.id);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should create supply_glut events with random commodity modifier', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (systemId, currentDay) => {
                    const event = EconomicEventsSystem.createEvent('supply_glut', systemId, currentDay);
                    
                    // Property: supply_glut should have exactly one commodity modifier
                    expect(Object.keys(event.modifiers).length).toBe(1);
                    
                    // Property: The modifier should be 0.6 (40% reduction)
                    const commodityType = Object.keys(event.modifiers)[0];
                    expect(event.modifiers[commodityType]).toBe(0.6);
                    
                    // Property: The commodity should be one of the valid types
                    const validCommodities = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'];
                    expect(validCommodities).toContain(commodityType);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should create events with correct modifiers for each type', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 116 }),
                fc.integer({ min: 0, max: 1000 }),
                (systemId, currentDay) => {
                    // Test mining_strike
                    const miningStrike = EconomicEventsSystem.createEvent('mining_strike', systemId, currentDay);
                    expect(miningStrike.modifiers).toHaveProperty('ore');
                    expect(miningStrike.modifiers.ore).toBe(1.5);
                    expect(miningStrike.modifiers).toHaveProperty('tritium');
                    expect(miningStrike.modifiers.tritium).toBe(1.3);
                    
                    // Test medical_emergency
                    const medicalEmergency = EconomicEventsSystem.createEvent('medical_emergency', systemId, currentDay);
                    expect(medicalEmergency.modifiers).toHaveProperty('medicine');
                    expect(medicalEmergency.modifiers.medicine).toBe(2.0);
                    expect(medicalEmergency.modifiers).toHaveProperty('grain');
                    expect(medicalEmergency.modifiers.grain).toBe(0.9);
                    expect(medicalEmergency.modifiers).toHaveProperty('ore');
                    expect(medicalEmergency.modifiers.ore).toBe(0.9);
                    
                    // Test festival
                    const festival = EconomicEventsSystem.createEvent('festival', systemId, currentDay);
                    expect(festival.modifiers).toHaveProperty('electronics');
                    expect(festival.modifiers.electronics).toBe(1.75);
                    expect(festival.modifiers).toHaveProperty('grain');
                    expect(festival.modifiers.grain).toBe(1.2);
                }
            ),
            { numRuns: 100 }
        );
    });
});
