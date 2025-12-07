import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { EconomicEventsSystem } from '../../js/game-events.js';

/**
 * Feature: dynamic-economy, Property 10: Event Trigger Evaluation
 * Validates: Requirements 4.1, 4.2
 *
 * For any day advancement, each system should be evaluated for potential economic event
 * triggers based on event chance percentages and eligibility criteria.
 */
describe('Property: Event Trigger Evaluation', () => {
  it('should evaluate event triggers based on chance and eligibility', () => {
    fc.assert(
      fc.property(
        // Generate random game state with day number
        fc.record({
          player: fc.record({
            credits: fc.integer({ min: 0, max: 100000 }),
            debt: fc.integer({ min: 0, max: 50000 }),
            currentSystem: fc.integer({ min: 0, max: 116 }),
            daysElapsed: fc.integer({ min: 0, max: 1000 }),
          }),
          ship: fc.record({
            name: fc.constant('Serendipity'),
            fuel: fc.integer({ min: 0, max: 100 }),
            cargoCapacity: fc.constant(50),
            cargo: fc.constant([]),
          }),
          world: fc.record({
            visitedSystems: fc.array(fc.integer({ min: 0, max: 116 })),
            priceKnowledge: fc.constant({}),
            activeEvents: fc.constant([]),
          }),
        }),
        // Generate random star data with unique IDs
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 3, maxLength: 20 }),
              type: fc.constantFrom(
                'G5',
                'K2',
                'M3',
                'A1',
                'F7',
                'O9',
                'B5',
                'L4',
                'T6',
                'D1'
              ),
              x: fc.float({ min: -300, max: 300 }),
              y: fc.float({ min: -300, max: 300 }),
              z: fc.float({ min: -300, max: 300 }),
              st: fc.integer({ min: 0, max: 5 }),
              wh: fc.integer({ min: 0, max: 10 }),
              r: fc.constantFrom(0, 1),
            }),
            { minLength: 1, maxLength: 20 }
          )
          .map((systems, index) =>
            systems.map((system, i) => ({ ...system, id: i }))
          ),
        (gameState, starData) => {
          // Update events for the current day
          const updatedEvents = EconomicEventsSystem.updateEvents(
            gameState,
            starData
          );

          // Property: All triggered events should be for eligible systems
          for (const event of updatedEvents) {
            const system = starData.find((s) => s.id === event.systemId);
            const eventType = EconomicEventsSystem.EVENT_TYPES[event.type];

            // Verify system exists and is eligible for this event type
            if (system) {
              expect(
                EconomicEventsSystem.isSystemEligible(system, eventType)
              ).toBe(true);
            }
          }

          // Property: No system should have more than one active event
          const systemsWithEvents = new Set();
          for (const event of updatedEvents) {
            expect(systemsWithEvents.has(event.systemId)).toBe(false);
            systemsWithEvents.add(event.systemId);
          }

          // Property: All events should have valid structure
          for (const event of updatedEvents) {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('type');
            expect(event).toHaveProperty('systemId');
            expect(event).toHaveProperty('startDay');
            expect(event).toHaveProperty('endDay');
            expect(event).toHaveProperty('modifiers');
            expect(typeof event.id).toBe('string');
            expect(typeof event.type).toBe('string');
            expect(typeof event.systemId).toBe('number');
            expect(typeof event.startDay).toBe('number');
            expect(typeof event.endDay).toBe('number');
            expect(typeof event.modifiers).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect eligibility criteria for different event types', () => {
    fc.assert(
      fc.property(
        // Generate system with specific spectral class
        fc.record({
          id: fc.integer({ min: 0, max: 116 }),
          name: fc.string({ minLength: 3, maxLength: 20 }),
          type: fc.constantFrom(
            'G5',
            'K2',
            'M3',
            'A1',
            'F7',
            'O9',
            'B5',
            'L4',
            'T6',
            'D1'
          ),
          x: fc.float({ min: -300, max: 300 }),
          y: fc.float({ min: -300, max: 300 }),
          z: fc.float({ min: -300, max: 300 }),
          st: fc.integer({ min: 0, max: 5 }),
          wh: fc.integer({ min: 0, max: 10 }),
          r: fc.constantFrom(0, 1),
        }),
        (system) => {
          const spectralLetter = system.type.charAt(0).toUpperCase();

          // Test mining_strike eligibility
          const miningStrike = EconomicEventsSystem.EVENT_TYPES.mining_strike;
          const isMiningSystem = ['M', 'L', 'T'].includes(spectralLetter);
          expect(
            EconomicEventsSystem.isSystemEligible(system, miningStrike)
          ).toBe(isMiningSystem);

          // Test medical_emergency eligibility (any system)
          const medicalEmergency =
            EconomicEventsSystem.EVENT_TYPES.medical_emergency;
          expect(
            EconomicEventsSystem.isSystemEligible(system, medicalEmergency)
          ).toBe(true);

          // Test festival eligibility (core systems only)
          const festival = EconomicEventsSystem.EVENT_TYPES.festival;
          const isCoreSystem = [0, 1].includes(system.id);
          expect(EconomicEventsSystem.isSystemEligible(system, festival)).toBe(
            isCoreSystem
          );

          // Test supply_glut eligibility (any system)
          const supplyGlut = EconomicEventsSystem.EVENT_TYPES.supply_glut;
          expect(
            EconomicEventsSystem.isSystemEligible(system, supplyGlut)
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
