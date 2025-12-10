/**
 * Feature: dynamic-economy, Property 33: Cargo Display with Purchase Context
 * Validates: Requirements 9.2, 9.3, 9.4
 */

'use strict';

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
  {
    id: 3,
    x: 80,
    y: 10,
    z: 30,
    name: 'Wolf 359',
    type: 'M6V',
    wh: 1,
    st: 1,
    r: 1,
  },
];

const mockWormholeData = [
  [0, 1],
  [1, 2],
  [2, 3],
];

describe('Property 33: Cargo Display with Purchase Context', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Set up DOM environment with all required elements
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
                <div id="station-interface"></div>
                <div id="station-name"></div>
                <div id="station-system-name"></div>
                <div id="station-distance"></div>
                <button id="station-close-btn"></button>
                <button id="trade-btn"></button>
                <button id="refuel-btn"></button>
                <button id="undock-btn"></button>
                <button id="info-broker-btn"></button>
                <button id="repairs-btn"></button>
                <div id="trade-panel"></div>
                <div id="trade-system-name"></div>
                <button id="trade-close-btn"></button>
                <button id="trade-back-btn"></button>
                <div id="market-goods"></div>
                <div id="cargo-stacks"></div>
                <span id="trade-cargo-used">0</span>
                <span id="trade-cargo-capacity">50</span>
                <span id="trade-cargo-remaining">50</span>
                <div id="refuel-panel"></div>
                <div id="refuel-system-name"></div>
                <div id="refuel-current-fuel"></div>
                <div id="refuel-price-per-percent"></div>
                <input id="refuel-amount-input" type="number" />
                <div id="refuel-total-cost"></div>
                <button id="refuel-confirm-btn"></button>
                <button id="refuel-close-btn"></button>
                <button id="refuel-back-btn"></button>
                <button id="refuel-max-btn"></button>
                <div id="refuel-validation-message"></div>
                <div id="info-broker-panel"></div>
                <div id="info-broker-system-name"></div>
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
                <div id="repair-panel"></div>
                <div id="repair-system-name"></div>
                <button id="repair-close-btn"></button>
                <button id="repair-back-btn"></button>
                <div id="repair-hull-percent"></div>
                <div id="repair-hull-bar"></div>
                <div id="repair-engine-percent"></div>
                <div id="repair-engine-bar"></div>
                <div id="repair-life-support-percent"></div>
                <div id="repair-life-support-bar"></div>
                <button id="repair-all-btn"></button>
                <div id="repair-validation-message"></div>
                <div id="notification-area"></div>
                <div id="event-modal-overlay" class="hidden"></div>
                <div id="event-modal-title"></div>
                <div id="event-modal-description"></div>
                <div id="event-modal-duration"></div>
                <button id="event-modal-dismiss"></button>
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

  it('should display purchase price for each cargo stack', () => {
    fc.assert(
      fc.property(
        // Generate random cargo stacks with purchase metadata
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
            buySystem: fc.constantFrom(0, 1, 2, 3),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate random current system
        fc.constantFrom(0, 1, 2, 3),
        // Generate random current day
        fc.integer({ min: 0, max: 200 }),
        (cargoStacks, currentSystemId, currentDay) => {
          // Set up game state with cargo
          const state = gameStateManager.getState();
          state.ship.cargo = cargoStacks;
          state.player.currentSystem = currentSystemId;
          state.player.daysElapsed = currentDay;

          const system = mockStarData.find((s) => s.id === currentSystemId);

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack elements
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const renderedStacks =
            cargoStacksContainer.querySelectorAll('.cargo-stack');

          // Verify each stack displays purchase price
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Verify purchase price is displayed
            expect(stackHTML).toContain(`${stack.buyPrice} cr/unit`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display system name where cargo was purchased', () => {
    fc.assert(
      fc.property(
        // Generate random cargo stacks with purchase metadata
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
            buySystem: fc.constantFrom(0, 1, 2, 3),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate random current system
        fc.constantFrom(0, 1, 2, 3),
        // Generate random current day
        fc.integer({ min: 0, max: 200 }),
        (cargoStacks, currentSystemId, currentDay) => {
          // Set up game state with cargo
          const state = gameStateManager.getState();
          state.ship.cargo = cargoStacks;
          state.player.currentSystem = currentSystemId;
          state.player.daysElapsed = currentDay;

          const system = mockStarData.find((s) => s.id === currentSystemId);

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack elements
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const renderedStacks =
            cargoStacksContainer.querySelectorAll('.cargo-stack');

          // Verify each stack displays purchase system name
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Get expected system name
            const buySystem = mockStarData.find(
              (s) => s.id === stack.buySystem
            );
            expect(buySystem).toBeDefined();

            // Verify system name is displayed
            expect(stackHTML).toContain(buySystem.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display days since purchase (currentDay - buyDate)', () => {
    fc.assert(
      fc.property(
        // Generate random cargo stacks with purchase metadata
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
            buySystem: fc.constantFrom(0, 1, 2, 3),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        // Generate random current system
        fc.constantFrom(0, 1, 2, 3),
        // Generate random current day (must be >= max buyDate to avoid negative)
        fc.integer({ min: 100, max: 200 }),
        (cargoStacks, currentSystemId, currentDay) => {
          // Set up game state with cargo
          const state = gameStateManager.getState();
          state.ship.cargo = cargoStacks;
          state.player.currentSystem = currentSystemId;
          state.player.daysElapsed = currentDay;

          const system = mockStarData.find((s) => s.id === currentSystemId);

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack elements
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const renderedStacks =
            cargoStacksContainer.querySelectorAll('.cargo-stack');

          // Verify each stack displays days since purchase
          cargoStacks.forEach((stack, index) => {
            const stackElement = renderedStacks[index];
            const stackHTML = stackElement.innerHTML;

            // Calculate expected days since purchase
            const daysSincePurchase = currentDay - stack.buyDate;

            // Verify days since purchase is displayed
            if (daysSincePurchase === 0) {
              expect(stackHTML).toContain('today');
            } else if (daysSincePurchase === 1) {
              expect(stackHTML).toContain('1 day ago');
            } else {
              expect(stackHTML).toContain(`${daysSincePurchase} days ago`);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all purchase context together (price, system, days)', () => {
    fc.assert(
      fc.property(
        // Generate a single cargo stack for focused testing
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
          buySystem: fc.constantFrom(0, 1, 2, 3),
          buyDate: fc.integer({ min: 0, max: 100 }),
        }),
        // Generate random current system
        fc.constantFrom(0, 1, 2, 3),
        // Generate random current day (must be >= buyDate)
        fc.integer({ min: 100, max: 200 }),
        (stack, currentSystemId, currentDay) => {
          // Set up game state with single cargo stack
          const state = gameStateManager.getState();
          state.ship.cargo = [stack];
          state.player.currentSystem = currentSystemId;
          state.player.daysElapsed = currentDay;

          const system = mockStarData.find((s) => s.id === currentSystemId);

          // Render cargo stacks
          uiManager.renderCargoStacks(system);

          // Get rendered cargo stack element
          const cargoStacksContainer = document.getElementById('cargo-stacks');
          const stackElement =
            cargoStacksContainer.querySelector('.cargo-stack');
          const stackHTML = stackElement.innerHTML;

          // Get expected values
          const buySystem = mockStarData.find((s) => s.id === stack.buySystem);
          const daysSincePurchase = currentDay - stack.buyDate;

          // Verify all three pieces of purchase context are present
          expect(stackHTML).toContain(`${stack.buyPrice} cr/unit`);
          expect(stackHTML).toContain(buySystem.name);

          if (daysSincePurchase === 0) {
            expect(stackHTML).toContain('today');
          } else if (daysSincePurchase === 1) {
            expect(stackHTML).toContain('1 day ago');
          } else {
            expect(stackHTML).toContain(`${daysSincePurchase} days ago`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
