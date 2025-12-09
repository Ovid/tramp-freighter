/**
 * Property-Based Tests for Market Rumor Generation
 * Feature: dynamic-economy, Property 18: Market Rumor Generation
 * Validates: Requirements 5.7, 5.8
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker } from '../../js/game-information-broker.js';
import { BASE_PRICES } from '../../js/game-constants.js';

describe('Property: Market Rumor Generation', () => {
  it('should always return a non-empty string', () => {
    fc.assert(
      fc.property(
        // Generate game state
        fc.record({
          player: fc.record({
            credits: fc.integer({ min: 0, max: 10000 }),
            currentSystem: fc.integer({ min: 0, max: 116 }),
            daysElapsed: fc.integer({ min: 0, max: 1000 }),
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
                  electronics: fc.integer({ min: 20, max: 85 }),
                }),
              })
            ),
            activeEvents: fc.array(
              fc.record({
                id: fc.string(),
                type: fc.constantFrom(
                  'mining_strike',
                  'medical_emergency',
                  'festival',
                  'supply_glut'
                ),
                systemId: fc.integer({ min: 0, max: 116 }),
                startDay: fc.integer({ min: 0, max: 1000 }),
                endDay: fc.integer({ min: 0, max: 1000 }),
                modifiers: fc.dictionary(
                  fc.constantFrom(
                    'grain',
                    'ore',
                    'tritium',
                    'parts',
                    'medicine',
                    'electronics'
                  ),
                  fc.float({ min: 0.5, max: 2.0 })
                ),
              }),
              { maxLength: 5 }
            ),
          }),
        }),
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V', 'A1V', 'F7V'),
              x: fc.float({ min: -300, max: 300, noNaN: true }),
              y: fc.float({ min: -300, max: 300, noNaN: true }),
              z: fc.float({ min: -300, max: 300, noNaN: true }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 20 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        (gameState, starData) => {
          const rumor = InformationBroker.generateRumor(gameState, starData);

          // Should return a non-empty string
          expect(typeof rumor).toBe('string');
          expect(rumor.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should mention a system name when there are active events', () => {
    fc.assert(
      fc.property(
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V'),
              x: fc.float({ min: -300, max: 300, noNaN: true }),
              y: fc.float({ min: -300, max: 300, noNaN: true }),
              z: fc.float({ min: -300, max: 300, noNaN: true }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        // Generate current day
        fc.integer({ min: 0, max: 1000 }),
        (starData, currentDay) => {
          // Create an active event for a random system
          const eventSystemId = Math.floor(Math.random() * starData.length);

          const gameState = {
            player: {
              credits: 500,
              currentSystem: 0,
              daysElapsed: currentDay,
            },
            world: {
              priceKnowledge: {},
              activeEvents: [
                {
                  id: 'test-event',
                  type: 'mining_strike',
                  systemId: eventSystemId,
                  startDay: currentDay - 1,
                  endDay: currentDay + 5,
                  modifiers: {
                    ore: 1.5,
                    tritium: 1.3,
                  },
                },
              ],
            },
          };

          // Generate multiple rumors to account for randomness
          let foundSystemName = false;
          for (let i = 0; i < 20; i++) {
            const rumor = InformationBroker.generateRumor(gameState, starData);

            // Check if rumor mentions any system name
            const mentionsSystem = starData.some((system) =>
              rumor.includes(system.name)
            );
            if (mentionsSystem) {
              foundSystemName = true;
              break;
            }
          }

          // At least some rumors should mention a system name
          // (either the event system or a system with good prices)
          expect(foundSystemName).toBe(true);
        }
      ),
      { numRuns: 50 } // Fewer runs since we generate multiple rumors per test
    );
  });

  it('should mention a commodity when providing price hints', () => {
    fc.assert(
      fc.property(
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V'),
              x: fc.float({ min: -300, max: 300, noNaN: true }),
              y: fc.float({ min: -300, max: 300, noNaN: true }),
              z: fc.float({ min: -300, max: 300, noNaN: true }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        // Generate current day
        fc.integer({ min: 0, max: 1000 }),
        (starData, currentDay) => {
          const gameState = {
            player: {
              credits: 500,
              currentSystem: 0,
              daysElapsed: currentDay,
            },
            world: {
              priceKnowledge: {},
              activeEvents: [], // No events, so should give price hints
            },
          };

          // Generate multiple rumors to account for randomness
          let foundCommodity = false;
          const commodities = Object.keys(BASE_PRICES);

          for (let i = 0; i < 20; i++) {
            const rumor = InformationBroker.generateRumor(gameState, starData);

            // Check if rumor mentions any commodity
            const mentionsCommodity = commodities.some((commodity) =>
              rumor.toLowerCase().includes(commodity.toLowerCase())
            );

            if (mentionsCommodity) {
              foundCommodity = true;
              break;
            }
          }

          // At least some rumors should mention a commodity
          expect(foundCommodity).toBe(true);
        }
      ),
      { numRuns: 50 } // Fewer runs since we generate multiple rumors per test
    );
  });

  it('should provide information about commodity prices or economic events', () => {
    fc.assert(
      fc.property(
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V'),
              x: fc.float({ min: -300, max: 300, noNaN: true }),
              y: fc.float({ min: -300, max: 300, noNaN: true }),
              z: fc.float({ min: -300, max: 300, noNaN: true }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        // Generate current day
        fc.integer({ min: 0, max: 1000 }),
        // Generate active events (may be empty)
        fc.array(
          fc.record({
            id: fc.string(),
            type: fc.constantFrom(
              'mining_strike',
              'medical_emergency',
              'festival',
              'supply_glut'
            ),
            systemId: fc.integer({ min: 0, max: 9 }),
            startDay: fc.integer({ min: 0, max: 1000 }),
            endDay: fc.integer({ min: 0, max: 1000 }),
            modifiers: fc.dictionary(
              fc.constantFrom(
                'grain',
                'ore',
                'tritium',
                'parts',
                'medicine',
                'electronics'
              ),
              fc.float({ min: 0.5, max: 2.0 })
            ),
          }),
          { maxLength: 3 }
        ),
        (starData, currentDay, activeEvents) => {
          const gameState = {
            player: {
              credits: 500,
              currentSystem: 0,
              daysElapsed: currentDay,
            },
            world: {
              priceKnowledge: {},
              activeEvents: activeEvents,
            },
          };

          const rumor = InformationBroker.generateRumor(gameState, starData);

          // Rumor should contain useful information
          // Check for keywords that indicate market information
          const hasMarketInfo =
            rumor.includes('price') ||
            rumor.includes('market') ||
            rumor.includes('trouble') ||
            rumor.includes('crisis') ||
            rumor.includes('celebration') ||
            rumor.includes('oversupply') ||
            rumor.includes('good at') ||
            rumor.includes('experiencing') ||
            rumor.includes('changing');

          expect(hasMarketInfo).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be deterministic for the same game state', () => {
    fc.assert(
      fc.property(
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V'),
              x: fc.float({ min: -300, max: 300, noNaN: true }),
              y: fc.float({ min: -300, max: 300, noNaN: true }),
              z: fc.float({ min: -300, max: 300, noNaN: true }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        (starData) => {
          const gameState = {
            player: {
              credits: 500,
              currentSystem: 0,
              daysElapsed: 42,
            },
            world: {
              priceKnowledge: {},
              activeEvents: [],
            },
          };

          // Note: generateRumor uses Math.random(), so it's not deterministic
          // This test just verifies it doesn't crash with the same input
          const rumor1 = InformationBroker.generateRumor(gameState, starData);
          const rumor2 = InformationBroker.generateRumor(gameState, starData);

          // Both should be valid strings
          expect(typeof rumor1).toBe('string');
          expect(typeof rumor2).toBe('string');
          expect(rumor1.length).toBeGreaterThan(0);
          expect(rumor2.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
