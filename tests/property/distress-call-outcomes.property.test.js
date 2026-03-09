import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DISTRESS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-Based Tests for Distress Call Outcomes
 *
 * Feature: danger-system, Property 11: Distress Call Outcomes
 * Validates: Requirements 7.7, 7.8, 7.9, 7.10
 *
 * Tests that distress call choices (respond, ignore, loot) produce valid outcomes
 * with correct resource costs, karma changes, and reputation effects.
 */
describe('Distress Call Outcomes Property Tests', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  /**
   * Property 11: Distress Call Outcomes
   *
   * For any distress call choice, the outcomes should match: help costs 2 days,
   * 15% fuel, 5% life support and rewards ₡500, +10 reputation, +1 karma;
   * ignore costs -1 karma; loot costs 1 day, -3 karma, -15 reputation.
   */
  it('should produce valid distress call outcomes for all choices', () => {
    fc.assert(
      fc.property(
        // Generate random distress call choices
        fc.constantFrom('respond', 'ignore', 'loot'),
        (choice) => {
          // Create a simple distress call object (only used for method signature)
          const distressCall = {
            id: 'test_distress',
            type: 'civilian_distress',
            description: 'Test distress call',
          };

          // Resolve the distress call choice using the current game state
          const outcome = game.resolveDistressCall(
            distressCall,
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
            case 'respond':
              // Respond: 2 days, 15% fuel, 5% life support, +₡500, +10 civilian rep, +1 karma
              expect(outcome.success).toBe(true);
              expect(outcome.costs).toHaveProperty(
                'days',
                DISTRESS_CONFIG.RESPOND.DAYS_COST
              );
              expect(outcome.costs).toHaveProperty(
                'fuel',
                DISTRESS_CONFIG.RESPOND.FUEL_COST
              );
              expect(outcome.costs).toHaveProperty(
                'lifeSupport',
                DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
              );
              expect(outcome.rewards).toHaveProperty(
                'credits',
                DISTRESS_CONFIG.RESPOND.CREDITS_REWARD
              );
              expect(outcome.rewards).toHaveProperty('factionRep');
              expect(outcome.rewards.factionRep).toHaveProperty(
                'civilians',
                DISTRESS_CONFIG.RESPOND.REP_REWARD
              );
              expect(outcome.rewards).toHaveProperty(
                'karma',
                DISTRESS_CONFIG.RESPOND.KARMA_REWARD
              );
              break;

            case 'ignore':
              // Ignore: -1 karma
              expect(outcome.success).toBe(false);
              expect(outcome.rewards).toHaveProperty(
                'karma',
                DISTRESS_CONFIG.IGNORE.KARMA_PENALTY
              );
              break;

            case 'loot':
              // Loot: 1 day, -3 karma, -15 civilian rep, +5 outlaw rep, cargo reward
              expect(outcome.success).toBe(true);
              expect(outcome.costs).toHaveProperty(
                'days',
                DISTRESS_CONFIG.LOOT.DAYS_COST
              );
              expect(outcome.rewards).toHaveProperty(
                'karma',
                DISTRESS_CONFIG.LOOT.KARMA_PENALTY
              );
              expect(outcome.rewards).toHaveProperty('factionRep');
              expect(outcome.rewards.factionRep).toHaveProperty(
                'civilians',
                DISTRESS_CONFIG.LOOT.REP_PENALTY
              );
              expect(outcome.rewards.factionRep).toHaveProperty(
                'outlaws',
                DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN
              );
              // Should have some cargo reward
              expect(outcome.rewards).toHaveProperty('cargo');
              outcome.rewards.cargo.forEach((item) => {
                expect(item).toHaveProperty('good');
                expect(item).toHaveProperty('qty');
                expect(item).toHaveProperty('buyPrice');
                expect(item).toHaveProperty('buySystemName', 'Salvaged');
                expect(item).not.toHaveProperty('type');
                expect(item).not.toHaveProperty('quantity');
                expect(item).not.toHaveProperty('purchasePrice');
              });
              break;

            default:
              throw new Error(`Unknown distress call choice: ${choice}`);
          }

          // Verify costs and rewards are valid objects
          expect(typeof outcome.costs).toBe('object');
          expect(typeof outcome.rewards).toBe('object');

          // Verify numeric values are reasonable
          Object.values(outcome.costs).forEach((cost) => {
            if (typeof cost === 'number') {
              expect(cost).toBeGreaterThanOrEqual(0);
              expect(cost).toBeLessThanOrEqual(1000); // Reasonable upper bound
            }
          });

          // Verify karma values are within bounds
          if (outcome.rewards.karma !== undefined) {
            expect(outcome.rewards.karma).toBeGreaterThanOrEqual(-10);
            expect(outcome.rewards.karma).toBeLessThanOrEqual(10);
          }

          // Verify reputation values are within bounds
          if (outcome.rewards.factionRep) {
            Object.values(outcome.rewards.factionRep).forEach((rep) => {
              if (typeof rep === 'number') {
                expect(rep).toBeGreaterThanOrEqual(-100);
                expect(rep).toBeLessThanOrEqual(100);
              }
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
