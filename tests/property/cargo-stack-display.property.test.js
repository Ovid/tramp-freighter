/**
 * Feature: tramp-freighter-core-loop, Property 16: Cargo Stack Display
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';
import { TradingSystem } from '../../js/game-trading.js';

// Mock star data for testing
const mockStarData = [
  { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2V', wh: 3, st: 1, r: 1 },
  {
    id: 1,
    x: 43,
    y: 0,
    z: 0,
    name: 'Alpha Centauri',
    type: 'G2V',
    wh: 2,
    st: 1,
    r: 1,
  },
  {
    id: 2,
    x: 60,
    y: 30,
    z: 20,
    name: "Barnard's Star",
    type: 'M3V',
    wh: 1,
    st: 1,
    r: 1,
  },
];

const mockWormholeData = [
  [0, 1],
  [1, 2],
];

describe('Property 16: Cargo Stack Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud"></div>
                <div id="hud-credits"></div>
                <div id="hud-debt"></div>
                <div id="hud-days"></div>
                <div id="fuel-bar"></div>
                <div id="hud-fuel-text"></div>
                <div id="hud-cargo"></div>
                <div id="hud-system"></div>
                <div id="hud-distance"></div>
                <div id="station-interface"></div>
                <div id="trade-panel"></div>
                <div id="trade-system-name"></div>
                <div id="market-goods"></div>
                <div id="cargo-stacks"></div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Initialize game state manager
    gameStateManager = new GameStateManager(mockStarData, mockWormholeData);
    gameStateManager.initNewGame();

    // Initialize UI manager
    uiManager = new UIManager(gameStateManager);
  });
  it('should display station price, purchase price, and profit margin for all cargo stacks', () => {
    fc.assert(
      fc.property(
        // Generate random cargo stacks
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 50 }),
            purchasePrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate random system for current location
        fc.constantFrom(0, 1, 2),
        (cargoStacks, systemId) => {
          // Set up game state with cargo
          const state = gameStateManager.getState();
          state.ship.cargo = cargoStacks;
          state.player.currentSystem = systemId;

          const system = mockStarData.find((s) => s.id === systemId);

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack elements
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const renderedStacks =
            cargoStacksContainer.querySelectorAll('.cargo-stack');

          // Verify correct number of stacks rendered
          expect(renderedStacks.length).toBe(cargoStacks.length);

          // Verify each stack displays required information
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Calculate expected values (using Phase 2 API with currentDay)
            const currentDay = state.player.daysElapsed;
            const activeEvents = state.world.activeEvents || [];
            const currentPrice = TradingSystem.calculatePrice(
              stack.good,
              system,
              currentDay,
              activeEvents
            );
            const profitMargin = currentPrice - stack.purchasePrice;

            // Verify station price is displayed
            expect(stackHTML).toContain(`${currentPrice} cr/unit`);

            // Verify purchase price is displayed
            expect(stackHTML).toContain(
              `Bought at: ${stack.purchasePrice} cr/unit`
            );

            // Verify profit margin is displayed
            if (profitMargin > 0) {
              expect(stackHTML).toContain(`Profit: +${profitMargin} cr/unit`);
            } else if (profitMargin < 0) {
              expect(stackHTML).toContain(`Loss: ${profitMargin} cr/unit`);
            } else {
              expect(stackHTML).toContain('Break even');
            }

            // Verify quantity is displayed
            expect(stackHTML).toContain(`Qty: ${stack.qty}`);

            // Verify good name is displayed
            const capitalizedGood =
              stack.good.charAt(0).toUpperCase() + stack.good.slice(1);
            expect(stackHTML).toContain(capitalizedGood);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  it('should display empty message when cargo is empty', () => {
    fc.assert(
      fc.property(fc.constantFrom(0, 1, 2), (systemId) => {
        // Set up game state with empty cargo
        const state = gameStateManager.getState();
        state.ship.cargo = [];
        state.player.currentSystem = systemId;

        const system = mockStarData.find((s) => s.id === systemId);

        // Render cargo stacks
        uiManager.renderCargoStacks(system);

        // Get rendered cargo stack elements
        const cargoStacksContainer = document.getElementById('cargo-stacks');
        const emptyMessage = cargoStacksContainer.querySelector('.cargo-empty');

        // Verify empty message is displayed
        expect(emptyMessage).not.toBeNull();
        expect(emptyMessage.textContent).toContain('No cargo');
      }),
      { numRuns: 100 }
    );
  });
  it('should calculate profit margin correctly as (station price - purchase price)', () => {
    fc.assert(
      fc.property(
        fc.record({
          good: fc.constantFrom(
            'grain',
            'ore',
            'tritium',
            'parts',
            'medicine',
            'electronics'
          ),
          qty: fc.integer({ min: 1, max: 50 }),
          purchasePrice: fc.integer({ min: 5, max: 100 }),
        }),
        fc.constantFrom(0, 1, 2),
        (stack, systemId) => {
          // Set up game state with single cargo stack
          const state = gameStateManager.getState();
          state.ship.cargo = [stack];
          state.player.currentSystem = systemId;

          const system = mockStarData.find((s) => s.id === systemId);

          // Calculate expected profit margin (using Phase 2 API with currentDay)
          const currentDay = state.player.daysElapsed;
          const activeEvents = state.world.activeEvents || [];
          const currentPrice = TradingSystem.calculatePrice(
            stack.good,
            system,
            currentDay,
            activeEvents
          );
          const expectedProfitMargin = currentPrice - stack.purchasePrice;

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack element
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const stackElement =
            cargoStacksContainer.querySelector('.cargo-stack');
          const stackHTML = stackElement.innerHTML;

          // Verify profit margin matches expected value
          if (expectedProfitMargin > 0) {
            expect(stackHTML).toContain(`+${expectedProfitMargin} cr/unit`);
          } else if (expectedProfitMargin < 0) {
            expect(stackHTML).toContain(`${expectedProfitMargin} cr/unit`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
