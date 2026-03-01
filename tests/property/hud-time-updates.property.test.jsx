import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DateDisplay } from '../../src/features/hud/DateDisplay';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';
import { gameDayToDate } from '../../src/game/utils/date-utils.js';

// Suppress React act() warnings in property-based tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Property 21: HUD updates on time changes
 *
 * For any change to game time, the HUD date display should update
 * to reflect the new value.
 *
 * React Migration Spec: Requirements 7.3
 */
describe('Property 21: HUD time updates', () => {
  it('should update time display when time changes', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 1000 }), async (newDays) => {
        cleanup();

        // Create game state manager
        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render DateDisplay
        render(
          <GameProvider gameStateManager={gameStateManager}>
            <DateDisplay />
          </GameProvider>
        );

        // Verify initial time display (day 0)
        await waitFor(() => {
          expect(screen.getByText(gameDayToDate(0))).toBeInTheDocument();
        });

        // Update time
        gameStateManager.updateTime(newDays);

        // Verify time display updated to the correct calendar date
        await waitFor(() => {
          expect(screen.getByText(gameDayToDate(newDays))).toBeInTheDocument();
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
