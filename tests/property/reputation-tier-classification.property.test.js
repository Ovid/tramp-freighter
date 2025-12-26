/**
 * Property-based tests for reputation tier classification
 *
 * Feature: npc-foundation, Property 4: Reputation tier classification
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { describe, it } from 'vitest';
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
        if (
          !tier ||
          typeof tier.name !== 'string' ||
          typeof tier.min !== 'number' ||
          typeof tier.max !== 'number'
        ) {
          return false;
        }

        // Reputation should be within tier bounds
        if (reputation < tier.min || reputation > tier.max) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should return tier bounds that contain the reputation value', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (reputation) => {
        const tier = gameStateManager.getRepTier(reputation);
        return reputation >= tier.min && reputation <= tier.max;
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

        return (
          tier1.name === tier2.name &&
          tier1.min === tier2.min &&
          tier1.max === tier2.max
        );
      }),
      { numRuns: 100 }
    );
  });
});
