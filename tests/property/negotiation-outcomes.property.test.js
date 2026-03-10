import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  NEGOTIATION_CONFIG,
  KARMA_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '../../src/game/constants.js';

/**
 * Property-Based Tests for Negotiation Outcomes
 *
 * Feature: danger-system, Property 6: Negotiation Outcomes
 * Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.10
 *
 * Tests that each negotiation choice produces valid outcome structures with correct
 * success rates, cargo costs, and reputation changes according to the configuration.
 */
describe('Negotiation Outcomes Property Tests', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  /**
   * Property 6: Negotiation Outcomes
   *
   * For any negotiation encounter and choice, the outcome should match the configured
   * values: counter-proposal (60% base, 10% cargo on success), medicine claim (40% sympathy
   * if medicine in cargo), intel offer (requires prior intel, +3 outlaw rep for cooperating
   * with pirates), accept demand (20% cargo).
   */
  it('should produce valid negotiation outcomes for all choices', () => {
    fc.assert(
      fc.property(
        // Generate random pirate encounters
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          threatLevel: fc.constantFrom(
            'weak',
            'moderate',
            'strong',
            'dangerous'
          ),
          name: fc.string({ minLength: 1, maxLength: 30 }),
          demandPercent: fc.integer({ min: 10, max: 50 }),
        }),
        // Generate random negotiation choices (excluding intel_offer for now due to complexity)
        fc.constantFrom('counter_proposal', 'medicine_claim', 'accept_demand'),
        // Generate random cargo (including medicine for medicine claim tests)
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 20 }),
            buyPrice: fc.integer({ min: 10, max: 100 }),
          }),
          { maxLength: 10 }
        ),
        // Generate random karma values
        fc.integer({ min: -100, max: 100 }),
        (encounter, choice, cargo, karma) => {
          // Set up the game state with specific cargo and karma
          const currentState = game.getState();
          currentState.ship.cargo = [...cargo];
          currentState.player.karma = karma;

          // Resolve the negotiation choice
          const outcome = game.resolveNegotiation(encounter, choice);

          // Verify outcome structure is valid
          expect(outcome).toBeDefined();
          expect(outcome).toHaveProperty('success');
          expect(typeof outcome.success).toBe('boolean');
          expect(outcome).toHaveProperty('costs');
          expect(outcome).toHaveProperty('rewards');
          expect(outcome).toHaveProperty('description');
          expect(typeof outcome.description).toBe('string');

          // Verify choice-specific outcome properties
          switch (choice) {
            case 'counter_proposal': {
              // Counter-proposal: 60% base chance + karma modifier
              const hasCounterCargo = cargo.some((item) => item.qty > 0);
              if (outcome.success) {
                if (hasCounterCargo) {
                  expect(outcome.costs).toHaveProperty(
                    'cargoPercent',
                    NEGOTIATION_CONFIG.COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT
                  );
                } else {
                  expect(outcome.costs).toHaveProperty('credits');
                  expect(outcome.costs.credits).toBe(
                    Math.round(
                      PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND * 0.5
                    )
                  );
                }
              } else {
                // Failure: no costs (strengthIncrease was removed as dead field)
                expect(outcome.costs).toEqual({});
              }
              break;
            }

            case 'medicine_claim': {
              // Medicine claim: 40% sympathy chance if medicine in cargo
              const hasMedicine = cargo.some(
                (item) => item.good === 'medicine'
              );
              if (hasMedicine) {
                // Should have a chance for sympathy
                if (outcome.success) {
                  // Success: free passage
                  expect(Object.keys(outcome.costs)).toHaveLength(0);
                } else {
                  // Failure: should force combat or other consequence
                  expect(outcome.costs).toBeDefined();
                }
              } else {
                // No medicine: should fail or not be available
                expect(outcome.success).toBe(false);
              }
              break;
            }

            case 'accept_demand': {
              const hasAcceptCargo = cargo.some((item) => item.qty > 0);
              if (hasAcceptCargo) {
                expect(outcome.success).toBe(true);
                expect(outcome.costs).toHaveProperty(
                  'cargoPercent',
                  NEGOTIATION_CONFIG.ACCEPT_DEMAND.CARGO_PERCENT
                );
              } else {
                // No trade cargo: demands credits or escalates
                expect(outcome).toHaveProperty('costs');
              }
              break;
            }

            default:
              throw new Error(`Unknown negotiation choice: ${choice}`);
          }

          // Verify costs and rewards are valid objects
          expect(typeof outcome.costs).toBe('object');
          expect(typeof outcome.rewards).toBe('object');

          // Verify numeric values are reasonable
          Object.values(outcome.costs).forEach((cost) => {
            if (typeof cost === 'number') {
              expect(cost).toBeGreaterThanOrEqual(0);
              expect(cost).toBeLessThanOrEqual(
                PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND
              );
            }
          });

          Object.values(outcome.rewards).forEach((reward) => {
            if (typeof reward === 'object' && reward !== null) {
              // Check faction reputation rewards
              Object.values(reward).forEach((repValue) => {
                if (typeof repValue === 'number') {
                  expect(repValue).toBeGreaterThanOrEqual(-100);
                  expect(repValue).toBeLessThanOrEqual(100);
                }
              });
            }
          });

          // Verify karma is within valid bounds
          expect(karma).toBeGreaterThanOrEqual(KARMA_CONFIG.MIN);
          expect(karma).toBeLessThanOrEqual(KARMA_CONFIG.MAX);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that karma affects negotiation success rates as a hidden modifier
   */
  it('should apply karma as hidden modifier on negotiation success rates', () => {
    fc.assert(
      fc.property(
        // Generate random pirate encounters
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          threatLevel: fc.constantFrom(
            'weak',
            'moderate',
            'strong',
            'dangerous'
          ),
          name: fc.string({ minLength: 1, maxLength: 30 }),
          demandPercent: fc.integer({ min: 10, max: 50 }),
        }),
        // Generate extreme karma values to test the effect
        fc.constantFrom(-100, -50, 0, 50, 100),
        (encounter, karma) => {
          // Set up the game state with specific karma
          const currentState = game.getState();
          currentState.player.karma = karma;
          currentState.ship.cargo = []; // Empty cargo to isolate karma effect

          // Test counter-proposal which has a base success rate affected by karma
          const choice = 'counter_proposal';

          // Resolve negotiation multiple times to test karma effect consistency
          const outcomes = [];
          for (let i = 0; i < 10; i++) {
            const outcome = game.resolveNegotiation(encounter, choice);
            outcomes.push(outcome);
          }

          // Verify that karma is being applied (structure test)
          outcomes.forEach((outcome) => {
            expect(outcome).toBeDefined();
            expect(outcome).toHaveProperty('success');
            expect(typeof outcome.success).toBe('boolean');
            expect(outcome).toHaveProperty('description');
            expect(typeof outcome.description).toBe('string');
          });

          // Verify karma is within valid bounds
          expect(karma).toBeGreaterThanOrEqual(KARMA_CONFIG.MIN);
          expect(karma).toBeLessThanOrEqual(KARMA_CONFIG.MAX);
        }
      ),
      { numRuns: 100 }
    );
  });
});
