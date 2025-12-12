/**
 * Property-Based Tests for Intelligence Purchase Validation
 * Feature: dynamic-economy, Property 19: Intelligence Purchase Validation
 * Validates: Requirements 5.9
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { InformationBroker } from '../../js/game-information-broker.js';
import { INTELLIGENCE_CONFIG } from '../../js/game-constants.js';

const PRICES = INTELLIGENCE_CONFIG.PRICES;

describe('Property: Intelligence Purchase Validation', () => {
  it('should prevent purchase when player has insufficient credits', () => {
    fc.assert(
      fc.property(
        // Generate cost that exceeds credits
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 999 }),
        (cost, credits) => {
          // Ensure cost > credits
          const actualCost = credits + cost;

          const validation = InformationBroker.validatePurchase(
            actualCost,
            credits
          );

          // Should be invalid
          expect(validation.valid).toBe(false);
          expect(validation.reason).toBe(
            'Insufficient credits for intelligence'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow purchase when player has sufficient credits', () => {
    fc.assert(
      fc.property(
        // Generate cost and credits where credits >= cost
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (cost, extraCredits) => {
          const credits = cost + extraCredits;

          const validation = InformationBroker.validatePurchase(cost, credits);

          // Should be valid
          expect(validation.valid).toBe(true);
          expect(validation.reason).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow purchase when credits exactly equal cost', () => {
    fc.assert(
      fc.property(
        // Generate cost
        fc.integer({ min: 1, max: 1000 }),
        (cost) => {
          const credits = cost;

          const validation = InformationBroker.validatePurchase(cost, credits);

          // Should be valid (edge case)
          expect(validation.valid).toBe(true);
          expect(validation.reason).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate correctly for all intelligence price tiers', () => {
    fc.assert(
      fc.property(
        // Generate credits
        fc.integer({ min: 0, max: 500 }),
        // Pick a price tier
        fc.constantFrom(
          PRICES.RECENT_VISIT,
          PRICES.NEVER_VISITED,
          PRICES.STALE_VISIT
        ),
        (credits, cost) => {
          const validation = InformationBroker.validatePurchase(cost, credits);

          if (credits >= cost) {
            expect(validation.valid).toBe(true);
            expect(validation.reason).toBeNull();
          } else {
            expect(validation.valid).toBe(false);
            expect(validation.reason).toBe(
              'Insufficient credits for intelligence'
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero credits correctly', () => {
    fc.assert(
      fc.property(
        // Generate positive cost
        fc.integer({ min: 1, max: 1000 }),
        (cost) => {
          const credits = 0;

          const validation = InformationBroker.validatePurchase(cost, credits);

          // Should be invalid
          expect(validation.valid).toBe(false);
          expect(validation.reason).toBe(
            'Insufficient credits for intelligence'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent validation for the same inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (cost, credits) => {
          const validation1 = InformationBroker.validatePurchase(cost, credits);
          const validation2 = InformationBroker.validatePurchase(cost, credits);

          // Should return same result
          expect(validation1.valid).toBe(validation2.valid);
          expect(validation1.reason).toBe(validation2.reason);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should integrate with purchaseIntelligence to prevent invalid purchases', () => {
    fc.assert(
      fc.property(
        // Generate game state with insufficient credits
        fc.record({
          player: fc.record({
            credits: fc.integer({ min: 0, max: 50 }), // Less than any intelligence cost
            currentSystem: fc.integer({ min: 0, max: 116 }),
            daysElapsed: fc.integer({ min: 0, max: 1000 }),
          }),
          world: fc.record({
            priceKnowledge: fc.constant({}), // Never visited
            activeEvents: fc.constant([]),
          }),
        }),
        // Generate star data
        fc
          .array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('G2V', 'K5V', 'M3V'),
              x: fc.float({ min: -300, max: 300 }),
              y: fc.float({ min: -300, max: 300 }),
              z: fc.float({ min: -300, max: 300 }),
              st: fc.integer({ min: 0, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          )
          .map((systems) => systems.map((s, i) => ({ ...s, id: i }))),
        (gameState, starData) => {
          const targetSystemId = 0;
          const initialCredits = gameState.player.credits;

          // Attempt purchase
          const result = InformationBroker.purchaseIntelligence(
            gameState,
            targetSystemId,
            starData
          );

          // Should fail due to validation
          expect(result.success).toBe(false);
          expect(result.reason).toBe('Insufficient credits for intelligence');

          // Credits should not change
          expect(gameState.player.credits).toBe(initialCredits);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display validation message when purchase fails', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 999 }),
        (cost, credits) => {
          const actualCost = credits + cost;

          const validation = InformationBroker.validatePurchase(
            actualCost,
            credits
          );

          // Should have a reason when invalid
          if (!validation.valid) {
            expect(validation.reason).toBeDefined();
            expect(typeof validation.reason).toBe('string');
            expect(validation.reason.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
