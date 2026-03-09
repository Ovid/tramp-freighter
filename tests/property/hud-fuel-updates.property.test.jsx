import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { ShipStatus } from '../../src/features/hud/ShipStatus';
import { GameCoordinator } from "@game/state/game-coordinator.js";
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
          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          // Render ShipStatus (which contains fuel display)
          render(
            <GameProvider game={game}>
              <ShipStatus />
            </GameProvider>
          );

          // Verify initial fuel display (new game starts with 100%)
          await waitFor(() => {
            const fuelBar = document.querySelector('.fuel-bar-container');
            expect(fuelBar).toBeTruthy();
            expect(fuelBar.textContent).toContain('100%');
          });

          // Update fuel
          game.updateFuel(newFuel);

          // Verify fuel display updated
          await waitFor(() => {
            const fuelBar = document.querySelector('.fuel-bar-container');
            expect(fuelBar).toBeTruthy();
            expect(fuelBar.textContent).toContain(`${Math.round(newFuel)}%`);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
