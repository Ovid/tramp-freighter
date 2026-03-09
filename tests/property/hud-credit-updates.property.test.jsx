import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { ResourceBar } from '../../src/features/hud/ResourceBar';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

// Suppress React act() warnings in property-based tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Property 19: HUD updates on credit changes
 *
 * For any change to player credits, the HUD credits display should update
 * to reflect the new value.
 *
 * React Migration Spec: Requirements 7.1
 */
describe('Property 19: HUD credit updates', () => {
  it('should update credits display when credits change', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 600, max: 100000 }),
        async (newCredits) => {
          cleanup();

          // Create game state manager
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          // Render ResourceBar
          render(
            <GameProvider game={game}>
              <ResourceBar />
            </GameProvider>
          );

          // Verify initial credits display (new game starts with 500)
          await waitFor(() => {
            expect(screen.getByText('₡500')).toBeInTheDocument();
          });

          // Update credits
          game.updateCredits(newCredits);

          // Verify credits display updated
          await waitFor(() => {
            expect(
              screen.getByText(`₡${newCredits.toLocaleString()}`)
            ).toBeInTheDocument();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
