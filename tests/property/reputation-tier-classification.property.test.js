/**
 * Property-based tests for reputation tier classification
 *
 * Feature: npc-foundation, Property 4: Reputation tier classification
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Reputation Tier Classification Properties', () => {
  it('should classify any reputation value between -100 and 100 into exactly one tier', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (reputation) => {
        const tier = gameStateManager.getRepTier(reputation);

        // Tier should exist and have required properties
        expect(tier).toBeDefined();
        expect(typeof tier.name).toBe('string');
        expect(typeof tier.min).toBe('number');
        expect(typeof tier.max).toBe('number');

        // Reputation should be within tier bounds
        expect(reputation).toBeGreaterThanOrEqual(tier.min);
        expect(reputation).toBeLessThanOrEqual(tier.max);
      }),
      { numRuns: 100 }
    );
  });

  it('should return tier bounds that contain the reputation value', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (reputation) => {
        const tier = gameStateManager.getRepTier(reputation);
        expect(reputation).toBeGreaterThanOrEqual(tier.min);
        expect(reputation).toBeLessThanOrEqual(tier.max);
      }),
      { numRuns: 100 }
    );
  });

  it('should return consistent tier for the same reputation value', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (reputation) => {
        const tier1 = gameStateManager.getRepTier(reputation);
        const tier2 = gameStateManager.getRepTier(reputation);

        expect(tier1.name).toBe(tier2.name);
        expect(tier1.min).toBe(tier2.min);
        expect(tier1.max).toBe(tier2.max);
      }),
      { numRuns: 100 }
    );
  });
});
