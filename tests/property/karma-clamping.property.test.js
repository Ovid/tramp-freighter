/**
 * Property-based tests for karma clamping invariant
 *
 * Feature: danger-system, Property 12: Karma Clamping
 * Validates: Requirements 9.1, 9.2, 9.3, 9.8
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { KARMA_CONFIG } from '../../src/game/constants.js';

describe('Karma Clamping Properties', () => {
  it('should initialize karma to 0 within valid bounds', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Karma should be initialized to KARMA_CONFIG.INITIAL (0)
    const karma = game.state.player.karma;

    expect(karma).toBe(KARMA_CONFIG.INITIAL);
    expect(karma).toBeGreaterThanOrEqual(KARMA_CONFIG.MIN);
    expect(karma).toBeLessThanOrEqual(KARMA_CONFIG.MAX);
  });

  it('should clamp karma within bounds after any modification', () => {
    fc.assert(
      fc.property(fc.integer({ min: -500, max: 500 }), (amount) => {
        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        game.modifyKarma(amount, 'test');
        const karma = game.getKarma();

        // Karma must always be within bounds
        return karma >= KARMA_CONFIG.MIN && karma <= KARMA_CONFIG.MAX;
      }),
      { numRuns: 100 }
    );
  });

  it('should clamp karma within bounds after multiple modifications', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -200, max: 200 }), {
          minLength: 1,
          maxLength: 10,
        }),
        (amounts) => {
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          for (const amount of amounts) {
            game.modifyKarma(amount, 'test');
          }

          const karma = game.getKarma();

          // Karma must always be within bounds after any sequence of modifications
          return karma >= KARMA_CONFIG.MIN && karma <= KARMA_CONFIG.MAX;
        }
      ),
      { numRuns: 100 }
    );
  });
});
