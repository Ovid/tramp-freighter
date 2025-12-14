import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { ResourceBar } from '../../src/features/hud/ResourceBar';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

// Suppress React act() warnings in property-based tests
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
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
});

afterAll(() => {
  console.error = originalConsoleError;
});

/**
 * Property 20: HUD updates on fuel changes
 *
 * For any change to ship fuel, the HUD fuel display should update
 * to reflect the new value.
 *
 * React Migration Spec: Requirements 7.2
 */
describe('Property 20: HUD fuel updates', () => {
  it('should update fuel display when fuel changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 100, noNaN: true }),
        async (newFuel) => {
          cleanup();

          // Create game state manager
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render ResourceBar
          render(
            <GameProvider gameStateManager={gameStateManager}>
              <ResourceBar />
            </GameProvider>
          );

          // Verify initial fuel display (new game starts with 100%)
          await waitFor(() => {
            expect(screen.getByText('100.0%')).toBeInTheDocument();
          });

          // Update fuel
          gameStateManager.updateFuel(newFuel);

          // Verify fuel display updated
          await waitFor(() => {
            expect(
              screen.getByText(`${newFuel.toFixed(1)}%`)
            ).toBeInTheDocument();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
