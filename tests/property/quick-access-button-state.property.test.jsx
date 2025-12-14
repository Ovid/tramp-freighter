import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

// Suppress React act() warnings in property-based tests
let originalConsoleError;
let originalConsoleLog;

beforeAll(() => {
  originalConsoleError = console.error;
  originalConsoleLog = console.log;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
        message.includes('was not wrapped in act'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  // Suppress "System info clicked" logs
  console.log = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      message.includes('System info clicked')
    ) {
      return;
    }
    originalConsoleLog(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
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
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // First move to a system without a station to ensure we're not at the target
          const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
          if (systemWithoutStation) {
            gameStateManager.updateLocation(systemWithoutStation.id);
          }

          // Render QuickAccessButtons
          render(
            <GameProvider gameStateManager={gameStateManager}>
              <QuickAccessButtons onDock={() => {}} />
            </GameProvider>
          );

          // Move to system with station
          gameStateManager.updateLocation(systemIdWithStation);

          // Verify dock button is enabled
          await waitFor(() => {
            const dockButton = screen.getByText('Dock');
            expect(dockButton).not.toBeDisabled();
          });

          return true;
        }
      ),
      { numRuns: 50 }
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
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render QuickAccessButtons
          render(
            <GameProvider gameStateManager={gameStateManager}>
              <QuickAccessButtons onDock={() => {}} />
            </GameProvider>
          );

          // Move to system without station
          gameStateManager.updateLocation(systemIdWithoutStation);

          // Verify dock button is disabled
          await waitFor(() => {
            const dockButton = screen.getByText('Dock');
            expect(dockButton).toBeDisabled();
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
