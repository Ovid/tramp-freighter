/**
 * Unit Tests for Trade Panel Cargo Capacity Display
 *
 * Tests that the trade panel displays cargo capacity information
 * and updates it when cargo changes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { TradingSystem } from '../../js/game-trading.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Trade Panel Cargo Capacity Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Create a minimal DOM for testing
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud">
                    <div id="hud-credits">500</div>
                    <div id="hud-debt">10000</div>
                    <div id="hud-days">0</div>
                    <div id="fuel-bar"></div>
                    <div id="hud-fuel-text">100%</div>
                    <div id="hud-cargo">20/50</div>
                    <div id="hud-system">Sol</div>
                    <div id="hud-distance">0.0</div>
                </div>
                <div id="station-interface">
                    <div id="station-name"></div>
                    <div id="station-system-name"></div>
                    <div id="station-distance"></div>
                    <button id="station-close-btn"></button>
                    <button id="trade-btn"></button>
                    <button id="refuel-btn"></button>
                    <button id="undock-btn"></button>
                </div>
                <div id="trade-panel">
                    <div id="trade-system-name"></div>
                    <button id="trade-close-btn"></button>
                    <button id="trade-back-btn"></button>
                    <div id="market-goods"></div>
                    <div id="cargo-stacks"></div>
                    <span id="trade-cargo-used">0</span>
                    <span id="trade-cargo-capacity">50</span>
                    <span id="trade-cargo-remaining">50</span>
                </div>
                <div id="refuel-panel">
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
                </div>
                <div id="notification-area"></div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    uiManager = new UIManager(gameStateManager);
    gameStateManager.initNewGame();
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  it('should display cargo capacity when trade panel opens', () => {
    uiManager.showTradePanel();

    const cargoUsed = document.getElementById('trade-cargo-used');
    const cargoCapacity = document.getElementById('trade-cargo-capacity');
    const cargoRemaining = document.getElementById('trade-cargo-remaining');

    // Initial state has 20 grain
    expect(cargoUsed.textContent).toBe('20');
    expect(cargoCapacity.textContent).toBe('50');
    expect(cargoRemaining.textContent).toBe('30');
  });

  it('should update cargo capacity after buying goods', () => {
    uiManager.showTradePanel();

    // Buy 10 grain
    const currentSystem = TEST_STAR_DATA.find((s) => s.id === 0);
    const currentDay = gameStateManager.state.player.daysElapsed;
    const activeEvents = gameStateManager.state.world.activeEvents || [];
    const grainPrice = TradingSystem.calculatePrice(
      'grain',
      currentSystem,
      currentDay,
      activeEvents
    );
    gameStateManager.buyGood('grain', 10, grainPrice);

    // Manually trigger UI update (simulating what handleBuy does)
    uiManager.updateTradeCargoCapacity();

    const cargoUsed = document.getElementById('trade-cargo-used');
    const cargoRemaining = document.getElementById('trade-cargo-remaining');

    expect(cargoUsed.textContent).toBe('30');
    expect(cargoRemaining.textContent).toBe('20');
  });

  it('should update cargo capacity after selling goods', () => {
    uiManager.showTradePanel();

    // Sell 10 units from first stack
    const currentSystem = TEST_STAR_DATA.find((s) => s.id === 0);
    const currentDay = gameStateManager.state.player.daysElapsed;
    const activeEvents = gameStateManager.state.world.activeEvents || [];
    const grainPrice = TradingSystem.calculatePrice(
      'grain',
      currentSystem,
      currentDay,
      activeEvents
    );
    gameStateManager.sellGood(0, 10, grainPrice);

    // Manually trigger UI update (simulating what handleSell does)
    uiManager.updateTradeCargoCapacity();

    const cargoUsed = document.getElementById('trade-cargo-used');
    const cargoRemaining = document.getElementById('trade-cargo-remaining');

    expect(cargoUsed.textContent).toBe('10');
    expect(cargoRemaining.textContent).toBe('40');
  });

  it('should show zero used when all cargo is sold', () => {
    uiManager.showTradePanel();

    // Sell all cargo
    const currentSystem = TEST_STAR_DATA.find((s) => s.id === 0);
    const currentDay = gameStateManager.state.player.daysElapsed;
    const activeEvents = gameStateManager.state.world.activeEvents || [];
    const grainPrice = TradingSystem.calculatePrice(
      'grain',
      currentSystem,
      currentDay,
      activeEvents
    );
    gameStateManager.sellGood(0, 20, grainPrice);

    uiManager.updateTradeCargoCapacity();

    const cargoUsed = document.getElementById('trade-cargo-used');
    const cargoRemaining = document.getElementById('trade-cargo-remaining');

    expect(cargoUsed.textContent).toBe('0');
    expect(cargoRemaining.textContent).toBe('50');
  });

  it('should show full capacity when cargo is full', () => {
    uiManager.showTradePanel();

    // Fill cargo to capacity (already have 20, buy 30 more)
    const currentSystem = TEST_STAR_DATA.find((s) => s.id === 0);
    const currentDay = gameStateManager.state.player.daysElapsed;
    const activeEvents = gameStateManager.state.world.activeEvents || [];
    const grainPrice = TradingSystem.calculatePrice(
      'grain',
      currentSystem,
      currentDay,
      activeEvents
    );
    gameStateManager.buyGood('grain', 30, grainPrice);

    uiManager.updateTradeCargoCapacity();

    const cargoUsed = document.getElementById('trade-cargo-used');
    const cargoRemaining = document.getElementById('trade-cargo-remaining');

    expect(cargoUsed.textContent).toBe('50');
    expect(cargoRemaining.textContent).toBe('0');
  });
});
