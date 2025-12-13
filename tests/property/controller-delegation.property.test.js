/**
 * Property-Based Tests for Controller Delegation
 * Feature: architecture-refactor, Property 1: Controller Delegation
 * Validates: Requirements 1.4, 1.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { JSDOM } from 'jsdom';

describe('Property 1: Controller Delegation - architecture-refactor', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="game-hud" class="visible">
          <span id="hud-credits">0</span>
          <span id="hud-debt">0</span>
          <span id="hud-days">0</span>
          <div id="fuel-bar"></div>
          <span id="hud-fuel-text">100%</span>
          <div id="hull-bar"></div>
          <span id="hud-hull-text">100%</span>
          <div id="engine-bar"></div>
          <span id="hud-engine-text">100%</span>
          <div id="life-support-bar"></div>
          <span id="hud-life-support-text">100%</span>
          <span id="hud-cargo">0/100</span>
          <span id="hud-system">Sol</span>
          <span id="hud-distance">0.0 LY</span>
          <button id="quick-system-info-btn"></button>
          <button id="quick-station-btn"></button>
        </div>
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

    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    };

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.lastSaveTime = 0;
    gameStateManager.initNewGame();

    uiManager = new UIManager(gameStateManager);
  });

  afterEach(() => {
    global.localStorage.clear();
    delete global.document;
  });

  it('should delegate show() to TradePanelController when showTradePanel is called', () => {
    fc.assert(
      fc.property(fc.constantFrom(0, 1, 4, 5, 7, 13), (systemId) => {
        gameStateManager.updateLocation(systemId);

        const tradePanel = document.getElementById('trade-panel');
        tradePanel.classList.remove('visible');

        uiManager.showTradePanel();

        expect(tradePanel.classList.contains('visible')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should delegate hide() to TradePanelController when hideTradePanel is called', () => {
    fc.assert(
      fc.property(fc.constantFrom(0, 1, 4, 5, 7, 13), (systemId) => {
        gameStateManager.updateLocation(systemId);

        uiManager.showTradePanel();
        const tradePanel = document.getElementById('trade-panel');
        expect(tradePanel.classList.contains('visible')).toBe(true);

        uiManager.hideTradePanel();

        expect(tradePanel.classList.contains('visible')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should populate market goods when trade panel is shown', () => {
    fc.assert(
      fc.property(fc.constantFrom(0, 1, 4, 5, 7, 13), (systemId) => {
        gameStateManager.updateLocation(systemId);

        uiManager.showTradePanel();

        const marketGoods = document.getElementById('market-goods');
        const goodItems = marketGoods.querySelectorAll('.good-item');

        expect(goodItems.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should update cargo capacity display when trade panel is shown', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13),
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
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 5, max: 100 }),
            buySystem: fc.constantFrom(0, 1, 4, 5, 7, 13),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (systemId, cargo) => {
          gameStateManager.updateLocation(systemId);
          gameStateManager.updateCargo(cargo);

          uiManager.showTradePanel();

          const cargoUsed = cargo.reduce((sum, stack) => sum + stack.qty, 0);
          const cargoCapacity = gameStateManager.getShip().cargoCapacity;
          const cargoRemaining = cargoCapacity - cargoUsed;

          expect(document.getElementById('trade-cargo-used').textContent).toBe(
            String(cargoUsed)
          );
          expect(
            document.getElementById('trade-cargo-capacity').textContent
          ).toBe(String(cargoCapacity));
          expect(
            document.getElementById('trade-cargo-remaining').textContent
          ).toBe(String(cargoRemaining));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display cargo stacks when trade panel is shown', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13),
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
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 5, max: 100 }),
            buySystem: fc.constantFrom(0, 1, 4, 5, 7, 13),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (systemId, cargo) => {
          gameStateManager.updateLocation(systemId);
          gameStateManager.updateCargo(cargo);

          uiManager.showTradePanel();

          const cargoStacks = document.getElementById('cargo-stacks');
          const stackItems = cargoStacks.querySelectorAll('.cargo-stack');

          expect(stackItems.length).toBe(cargo.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
