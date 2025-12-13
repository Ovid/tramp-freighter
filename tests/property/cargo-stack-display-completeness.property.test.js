/**
 * Feature: tramp-freighter-core-loop, Cargo Stack Display Completeness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';

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

describe('Property 24: Cargo Stack Display Completeness', () => {
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
                <div id="hull-bar"></div>
                <div id="hud-hull-text"></div>
                <div id="engine-bar"></div>
                <div id="hud-engine-text"></div>
                <div id="life-support-bar"></div>
                <div id="hud-life-support-text"></div>
                <div id="hud-cargo"></div>
                <div id="hud-system"></div>
                <div id="hud-distance"></div>
                <button id="quick-system-info-btn"></button>
                <button id="quick-station-btn"></button>
                <div id="hud"></div>
                <div id="station-interface">
                  <span id="station-name"></span>
                  <span id="station-system-name"></span>
                  <span id="station-distance"></span>
                  <button id="station-close-btn"></button>
                  <button id="trade-btn"></button>
                  <button id="refuel-btn"></button>
                  <button id="undock-btn"></button>
                  <button id="info-broker-btn"></button>
                  <button id="repairs-btn"></button>
                  <button id="ship-status-btn"></button>
                  <button id="upgrades-btn"></button>
                  <button id="cargo-manifest-btn"></button>
                </div>
                <div id="trade-panel">
                  <span id="trade-system-name"></span>
                  <button id="trade-close-btn"></button>
                  <button id="trade-back-btn"></button>
                  <div id="market-goods"></div>
                  <div id="cargo-stacks"></div>
                  <span id="trade-cargo-used">0</span>
                  <span id="trade-cargo-capacity">100</span>
                  <span id="trade-cargo-remaining">100</span>
                  <div id="hidden-cargo-section" class="hidden">
                    <span id="hidden-cargo-used">0</span>
                    <span id="hidden-cargo-capacity">10</span>
                    <div id="hidden-cargo-stacks"></div>
                  </div>
                </div>
                <div id="refuel-panel">
                  <span id="refuel-system-name"></span>
                  <button id="refuel-close-btn"></button>
                  <button id="refuel-back-btn"></button>
                  <span id="refuel-current-fuel">100</span>
                  <span id="refuel-price-per-percent">2</span>
                  <input id="refuel-amount-input" type="number" value="0" />
                  <span id="refuel-total-cost">0</span>
                  <button id="refuel-confirm-btn"></button>
                  <button id="refuel-max-btn"></button>
                  <div id="refuel-validation-message"></div>
                </div>
                <div id="info-broker-panel">
                  <span id="info-broker-system-name"></span>
                  <button id="info-broker-close-btn"></button>
                  <button id="info-broker-back-btn"></button>
                  <button id="buy-rumor-btn"></button>
                  <div id="rumor-text"></div>
                  <div id="intelligence-list"></div>
                  <div id="info-broker-validation-message"></div>
                  <button id="purchase-tab"></button>
                  <button id="market-data-tab"></button>
                  <div id="purchase-intel-content"></div>
                  <div id="market-data-content"></div>
                  <div id="market-data-list"></div>
                </div>
                <div id="repair-panel">
                  <span id="repair-system-name"></span>
                  <button id="repair-close-btn"></button>
                  <button id="repair-back-btn"></button>
                  <span id="repair-hull-percent">100</span>
                  <div id="repair-hull-bar"></div>
                  <span id="repair-engine-percent">100</span>
                  <div id="repair-engine-bar"></div>
                  <span id="repair-life-support-percent">100</span>
                  <div id="repair-life-support-bar"></div>
                  <button id="repair-all-btn"></button>
                  <div id="repair-validation-message"></div>
                </div>
                <div id="upgrades-panel">
                  <button id="upgrades-close-btn"></button>
                  <button id="upgrades-back-btn"></button>
                  <span id="upgrades-credits-value">0</span>
                  <div id="available-upgrades-list"></div>
                  <div id="installed-upgrades-list"></div>
                </div>
                <div id="upgrade-confirmation-overlay" class="hidden">
                  <span id="upgrade-confirmation-title"></span>
                  <div id="upgrade-confirmation-effects"></div>
                  <span id="upgrade-current-credits">0</span>
                  <span id="upgrade-cost">0</span>
                  <span id="upgrade-credits-after">0</span>
                  <button id="upgrade-cancel-btn"></button>
                  <button id="upgrade-confirm-btn"></button>
                </div>
                <div id="cargo-manifest-panel">
                  <button id="cargo-manifest-close-btn"></button>
                  <button id="cargo-manifest-back-btn"></button>
                  <span id="cargo-manifest-ship-name"></span>
                  <span id="cargo-manifest-used">0</span>
                  <span id="cargo-manifest-capacity">100</span>
                  <div id="cargo-manifest-list"></div>
                  <span id="cargo-manifest-total-value">0</span>
                  <button id="toggle-hidden-cargo-btn"></button>
                  <div id="hidden-cargo-content"></div>
                </div>
                <div id="notification-area"></div>
                <div id="event-modal-overlay" class="hidden">
                  <span id="event-modal-title"></span>
                  <div id="event-modal-description"></div>
                  <span id="event-modal-duration"></span>
                  <button id="event-modal-dismiss"></button>
                </div>
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
  it('should display all cargo stacks separately with good type, quantity, and purchase price', () => {
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
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

          // Verify ALL cargo stacks are displayed (completeness)
          expect(renderedStacks.length).toBe(cargoStacks.length);

          // Verify each stack is displayed SEPARATELY with required information
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Verify good type is displayed
            const capitalizedGood =
              stack.good.charAt(0).toUpperCase() + stack.good.slice(1);
            expect(stackHTML).toContain(capitalizedGood);

            // Verify quantity is displayed
            expect(stackHTML).toContain(`Qty: ${stack.qty}`);

            // Verify purchase price is displayed
            expect(stackHTML).toContain(`Bought at: ${stack.buyPrice} cr/unit`);

            // Verify stack has its own separate element
            expect(stackElement.className).toContain('cargo-stack');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display multiple stacks of the same good separately', () => {
    fc.assert(
      fc.property(
        // Generate multiple stacks of the same good with different prices
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 2, max: 5 }),
        fc.constantFrom(0, 1, 2),
        (goodType, numStacks, systemId) => {
          // Create multiple stacks of the same good with different purchase prices
          const cargoStacks = Array.from({ length: numStacks }, (_, i) => ({
            good: goodType,
            qty: 10 + i,
            buyPrice: 10 + i * 5,
          }));

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

          // Verify all stacks are displayed separately (not merged)
          expect(renderedStacks.length).toBe(numStacks);

          // Verify each stack has its unique purchase price displayed
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            expect(stackHTML).toContain(`Bought at: ${stack.buyPrice} cr/unit`);
            expect(stackHTML).toContain(`Qty: ${stack.qty}`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display cargo stacks in the same order as the cargo array', () => {
    fc.assert(
      fc.property(
        // Generate random cargo stacks with distinct quantities for identification
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 2, maxLength: 8 }
        ),
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

          // Verify order matches by checking quantities in order
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Verify this stack's quantity appears in the correct position
            expect(stackHTML).toContain(`Qty: ${stack.qty}`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display sell buttons for each cargo stack', () => {
    fc.assert(
      fc.property(
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
            buyPrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
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

          // Verify each stack has sell buttons
          renderedStacks.forEach((stackElement) => {
            const sellButtons = stackElement.querySelectorAll('.sell-btn');

            // Should have at least 2 sell buttons (Sell 1, Sell All)
            expect(sellButtons.length).toBeGreaterThanOrEqual(2);

            // Verify buttons have appropriate text
            const buttonTexts = Array.from(sellButtons).map(
              (btn) => btn.textContent
            );
            expect(buttonTexts.some((text) => text.includes('Sell 1'))).toBe(
              true
            );
            expect(buttonTexts.some((text) => text.includes('Sell All'))).toBe(
              true
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
