/**
 * Property-Based Tests for Refuel Price Display
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Refuel Price Display Properties', () => {
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Set up DOM elements required by UIManager
    document.body.innerHTML = `
            <div id="game-hud">
                <span id="hud-credits">0</span>
                <span id="hud-debt">0</span>
                <span id="hud-days">0</span>
                <div id="fuel-bar"></div>
                <span id="hud-fuel-text">100%</span>
                <span id="hud-cargo">0/50</span>
                <span id="hud-system">Sol</span>
                <span id="hud-distance">0.0 LY</span>
            </div>
            <div id="station-interface">
                <span id="station-name">Station</span>
                <span id="station-system-name">Sol</span>
                <span id="station-distance">0.0 LY</span>
                <button id="station-close-btn">×</button>
                <button id="trade-btn">Trade</button>
                <button id="refuel-btn">Refuel</button>
                <button id="undock-btn">Undock</button>
            </div>
            <div id="refuel-panel">
                <button id="refuel-close-btn">×</button>
                <button id="refuel-back-btn">Back</button>
                <span id="refuel-system-name">Sol</span>
                <span id="refuel-current-fuel">100%</span>
                <span id="refuel-price-per-percent">2 cr/%</span>
                <input id="refuel-amount-input" type="number" value="10" />
                <span id="refuel-total-cost">20 cr</span>
                <button id="refuel-confirm-btn">Refuel</button>
            </div>
        `;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
    uiManager = new UIManager(gameStateManager);
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 25: Refuel Price Display
   *
   * For any refuel interface at a given star system, the display should show
   * the fuel price per percentage point based on that system's distance from Sol.
   */
  describe('Property 25: Refuel Price Display', () => {
    it('should display correct fuel price per percentage point for any system', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEST_STAR_DATA), (system) => {
          gameStateManager.updateLocation(system.id);

          uiManager.showRefuelPanel();

          const expectedPrice = gameStateManager.getFuelPrice(system.id);

          const displayedPrice = document.getElementById(
            'refuel-price-per-percent'
          ).textContent;
          expect(displayedPrice).toBe(`${expectedPrice} cr/%`);

          // Boundary check: price must be positive integer
          expect(expectedPrice).toBeGreaterThan(0);
          expect(Number.isInteger(expectedPrice)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should display system name in refuel interface', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEST_STAR_DATA), (system) => {
          // Move player to the test system
          gameStateManager.updateLocation(system.id);

          // Show refuel panel
          uiManager.showRefuelPanel();

          // Check that the system name is displayed
          const displayedName =
            document.getElementById('refuel-system-name').textContent;
          expect(displayedName).toBe(system.name);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should display current fuel percentage', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (fuelLevel) => {
          // Set fuel level
          gameStateManager.updateFuel(fuelLevel);

          // Show refuel panel
          uiManager.showRefuelPanel();

          // Check that current fuel is displayed
          const displayedFuel = document.getElementById(
            'refuel-current-fuel'
          ).textContent;
          expect(displayedFuel).toBe(`${fuelLevel}%`);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should calculate and display total cost based on amount', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEST_STAR_DATA),
          fc.integer({ min: 1, max: 100 }),
          (system, amount) => {
            gameStateManager.updateLocation(system.id);

            uiManager.showRefuelPanel();

            const amountInput = document.getElementById('refuel-amount-input');
            amountInput.value = amount;

            uiManager.updateRefuelCost();

            const pricePerPercent = gameStateManager.getFuelPrice(system.id);
            const expectedCost = amount * pricePerPercent;

            const displayedCost =
              document.getElementById('refuel-total-cost').textContent;
            expect(displayedCost).toBe(`${expectedCost} cr`);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case fuel levels correctly', () => {
      const testCases = [
        { fuel: 0, description: 'empty tank' },
        { fuel: 100, description: 'full tank' },
        { fuel: 0.5, description: 'fractional fuel' },
        { fuel: 99.9, description: 'near full' },
      ];

      testCases.forEach(({ fuel, description }) => {
        gameStateManager.updateFuel(fuel);
        uiManager.showRefuelPanel();

        const displayedFuel = document.getElementById(
          'refuel-current-fuel'
        ).textContent;
        expect(displayedFuel).toBe(`${Math.round(fuel)}%`);
      });
    });
  });
});
