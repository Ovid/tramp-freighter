import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

// Suppress React act() warnings and "System info clicked" logs in property-based tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Property 48: Quick access button state updates
 *
 * For any player location change, quick access button enabled/disabled state
 * should update accordingly.
 *
 * React Migration Spec: Requirements 46.2
 */
describe('Property 48: Quick access button state updates', () => {
  it('should enable dock button when at system with station', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }).filter((id) => {
          const system = STAR_DATA.find((s) => s.id === id);
          return system && system.st > 0;
        }),
        async (systemIdWithStation) => {
          cleanup();

          // Create game state manager
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          // Set up mock animation system (required for useAnimationLock)
          const mockAnimationSystem = {
            isAnimating: false,
            inputLockManager: {
              isInputLocked: () => false,
            },
          };
          game.setAnimationSystem(mockAnimationSystem);

          // First move to a system without a station to ensure we're not at the target
          const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
          if (systemWithoutStation) {
            game.updateLocation(systemWithoutStation.id);
          }

          // Render QuickAccessButtons
          render(
            <GameProvider game={game}>
              <QuickAccessButtons onDock={() => {}} />
            </GameProvider>
          );

          // Move to system with station
          game.updateLocation(systemIdWithStation);

          // Verify dock button is enabled
          await waitFor(() => {
            const dockButton = screen.getByText('Dock');
            expect(dockButton).not.toBeDisabled();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should disable dock button when at system without station', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }).filter((id) => {
          const system = STAR_DATA.find((s) => s.id === id);
          return system && system.st === 0;
        }),
        async (systemIdWithoutStation) => {
          cleanup();

          // Create game state manager
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.initNewGame();

          // Set up mock animation system (required for useAnimationLock)
          const mockAnimationSystem = {
            isAnimating: false,
            inputLockManager: {
              isInputLocked: () => false,
            },
          };
          game.setAnimationSystem(mockAnimationSystem);

          // Render QuickAccessButtons
          render(
            <GameProvider game={game}>
              <QuickAccessButtons onDock={() => {}} />
            </GameProvider>
          );

          // Move to system without station
          game.updateLocation(systemIdWithoutStation);

          // Verify dock button is disabled
          await waitFor(() => {
            const dockButton = screen.getByText('Dock');
            expect(dockButton).toBeDisabled();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
