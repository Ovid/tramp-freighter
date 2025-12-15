import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { ShipStatus } from '../../src/features/hud/ShipStatus';
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
 * Property 22: HUD updates on condition changes
 *
 * For any change to ship condition (hull, engine, life support), the HUD
 * condition bars should update to reflect the new values.
 *
 * React Migration Spec: Requirements 7.4
 */
describe('Property 22: HUD condition updates', () => {
  it('should update condition bars when ship condition changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        async (newHull, newEngine, newLifeSupport) => {
          cleanup();

          // Create game state manager
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render ShipStatus
          const { container } = render(
            <GameProvider gameStateManager={gameStateManager}>
              <ShipStatus />
            </GameProvider>
          );

          // Verify initial condition display (new game starts with 100% for all)
          await waitFor(() => {
            const texts = screen.getAllByText('100.0%');
            expect(texts.length).toBeGreaterThanOrEqual(3);
          });

          // Update ship condition
          gameStateManager.state.ship.hull = newHull;
          gameStateManager.state.ship.engine = newEngine;
          gameStateManager.state.ship.lifeSupport = newLifeSupport;
          gameStateManager.emit('shipConditionChanged', {
            hull: newHull,
            engine: newEngine,
            lifeSupport: newLifeSupport,
          });

          // Verify condition bars updated by checking the container has the new values
          await waitFor(
            () => {
              const text = container.textContent;
              expect(text).toContain(`${newHull.toFixed(1)}%`);
              expect(text).toContain(`${newEngine.toFixed(1)}%`);
              expect(text).toContain(`${newLifeSupport.toFixed(1)}%`);
            },
            { timeout: 1000 }
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
