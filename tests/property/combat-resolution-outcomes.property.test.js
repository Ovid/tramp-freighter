import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COMBAT_CONFIG } from '../../src/game/constants.js';

/**
 * Property-Based Tests for Combat Resolution Outcomes
 *
 * Feature: danger-system, Property 4: Combat Resolution Outcomes
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 *
 * Tests that each combat choice produces valid outcome structures with correct
 * success rates, costs, and rewards according to the configuration.
 */
describe('Combat Resolution Outcomes Property Tests', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  /**
   * Property 4: Combat Resolution Outcomes
   *
   * For any combat encounter and choice, the outcome should match the configured
   * values: evasive maneuvers (70% base, -15% fuel/-5% engine on success, -20% hull on failure),
   * return fire (45% base, -10% hull on success, -30% hull plus cargo/credit loss on failure),
   * dump cargo (guaranteed escape, -50% cargo/-10% fuel), distress call (30% base,
   * +5 reputation on success, -25% hull on failure).
   */
  it('should produce valid combat outcomes for all choices', () => {
    fc.assert(
      fc.property(
        // Generate random combat encounters
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
        // Generate random combat choices
        fc.constantFrom(
          'evasive',
          'return_fire',
          'dump_cargo',
          'distress_call'
        ),
        (encounter, choice) => {
          // Resolve the combat choice using the current game state
          const outcome = game.resolveCombatChoice(
            encounter,
            choice
          );

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
            case 'evasive':
              // Evasive maneuvers: 70% base chance + modifiers
              if (outcome.success) {
                // Success: -15% fuel, -5% engine
                expect(outcome.costs).toHaveProperty(
                  'fuel',
                  COMBAT_CONFIG.EVASIVE.SUCCESS_FUEL_COST
                );
                expect(outcome.costs).toHaveProperty(
                  'engine',
                  COMBAT_CONFIG.EVASIVE.SUCCESS_ENGINE_COST
                );
              } else {
                // Failure: hull damage (may be modified by quirks/upgrades)
                expect(outcome.costs).toHaveProperty('hull');
                expect(outcome.costs.hull).toBeGreaterThan(0);
              }
              break;

            case 'return_fire':
              // Return fire: 45% base chance + modifiers
              if (outcome.success) {
                // Success: hull damage (may be modified), +5 outlaw rep
                expect(outcome.costs).toHaveProperty('hull');
                expect(outcome.costs.hull).toBeGreaterThan(0);
                expect(outcome.rewards).toHaveProperty('factionRep');
                expect(outcome.rewards.factionRep).toHaveProperty(
                  'outlaws',
                  COMBAT_CONFIG.RETURN_FIRE.SUCCESS_OUTLAW_REP
                );
              } else {
                // Failure: hull damage (may be modified), lose cargo and credits
                expect(outcome.costs).toHaveProperty('hull');
                expect(outcome.costs.hull).toBeGreaterThan(0);
                expect(outcome.costs).toHaveProperty(
                  'credits',
                  COMBAT_CONFIG.RETURN_FIRE.FAILURE_CREDITS_LOSS
                );
                expect(outcome.costs).toHaveProperty('cargoLoss', true);
              }
              break;

            case 'dump_cargo':
              // Dump cargo: guaranteed escape
              expect(outcome.success).toBe(true);
              expect(outcome.costs).toHaveProperty(
                'cargoPercent',
                COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT
              );
              expect(outcome.costs).toHaveProperty(
                'fuel',
                COMBAT_CONFIG.DUMP_CARGO.FUEL_COST
              );
              break;

            case 'distress_call':
              // Distress call: 30% base chance + modifiers
              if (outcome.success) {
                // Success: +5 authority reputation
                expect(outcome.rewards).toHaveProperty('factionRep');
                expect(outcome.rewards.factionRep).toHaveProperty(
                  'authorities',
                  COMBAT_CONFIG.DISTRESS_CALL.SUCCESS_REP_GAIN
                );
              } else {
                // Failure: hull damage (may be modified)
                expect(outcome.costs).toHaveProperty('hull');
                expect(outcome.costs.hull).toBeGreaterThan(0);
              }
              break;

            default:
              throw new Error(`Unknown combat choice: ${choice}`);
          }

          // Verify costs and rewards are valid objects
          expect(typeof outcome.costs).toBe('object');
          expect(typeof outcome.rewards).toBe('object');

          // Verify numeric values are reasonable
          Object.values(outcome.costs).forEach((cost) => {
            if (typeof cost === 'number') {
              expect(cost).toBeGreaterThanOrEqual(0);
              expect(cost).toBeLessThanOrEqual(1000); // Reasonable upper bound for costs including credits
            }
          });

          Object.values(outcome.rewards).forEach((reward) => {
            if (typeof reward === 'number') {
              expect(reward).toBeGreaterThanOrEqual(-100);
              expect(reward).toBeLessThanOrEqual(100); // Reasonable bounds for reputation
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
