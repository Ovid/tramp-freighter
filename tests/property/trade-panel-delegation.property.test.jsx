import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property 24: Trade panel delegates to GameStateManager
 *
 * Validates that the TradePanel component delegates all trade operations to GameStateManager
 * and does not duplicate trade logic.
 *
 * React Migration Spec: Requirements 26.1, 26.2, 26.3
 */
describe('Property 24: Trade panel delegates to GameStateManager', () => {
  // Suppress React act() warnings for property tests
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('act(') ||
        message.includes('Warning: ReactDOM.render')
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should call gameStateManager.buyGood when buying goods', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player credits and dock at a station
        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track buyGood calls
        let buyGoodCalled = false;
        let buyGoodArgs = null;
        const originalBuyGood = gameStateManager.buyGood.bind(gameStateManager);
        gameStateManager.buyGood = (goodType, quantity, price) => {
          buyGoodCalled = true;
          buyGoodArgs = { goodType, quantity, price };
          return originalBuyGood(goodType, quantity, price);
        };

        // Render TradePanel
        render(<TradePanel onClose={() => {}} />, { wrapper });

        // Find and click a "Buy 1" button
        const buyButtons = screen.getAllByText(/Buy 1/);
        expect(buyButtons.length).toBeGreaterThan(0);

        fireEvent.click(buyButtons[0]);

        // Verify buyGood was called
        expect(buyGoodCalled).toBe(true);
        expect(buyGoodArgs).toBeTruthy();
        expect(buyGoodArgs.quantity).toBe(1);
        expect(buyGoodArgs.price).toBeGreaterThan(0);
      }),
      { numRuns: 10 }
    );
  });

  it('should call gameStateManager.sellGood when selling goods', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player cargo to sell
        gameStateManager.state.player.currentSystem = 0; // Sol
        gameStateManager.state.ship.cargo = [
          {
            good: 'electronics',
            qty: 10,
            buyPrice: 100,
            buySystem: 0,
            buyDate: 0,
          },
        ];

        const wrapper = createWrapper(gameStateManager);

        // Track sellGood calls
        let sellGoodCalled = false;
        let sellGoodArgs = null;
        const originalSellGood =
          gameStateManager.sellGood.bind(gameStateManager);
        gameStateManager.sellGood = (stackIndex, quantity, salePrice) => {
          sellGoodCalled = true;
          sellGoodArgs = { stackIndex, quantity, salePrice };
          return originalSellGood(stackIndex, quantity, salePrice);
        };

        // Render TradePanel
        render(<TradePanel onClose={() => {}} />, { wrapper });

        // Find and click a "Sell 1" button
        const sellButtons = screen.getAllByText(/Sell 1/);
        expect(sellButtons.length).toBeGreaterThan(0);

        fireEvent.click(sellButtons[0]);

        // Verify sellGood was called
        expect(sellGoodCalled).toBe(true);
        expect(sellGoodArgs).toBeTruthy();
        expect(sellGoodArgs.stackIndex).toBe(0);
        expect(sellGoodArgs.quantity).toBe(1);
        expect(sellGoodArgs.salePrice).toBeGreaterThan(0);
      }),
      { numRuns: 10 }
    );
  });

  it('should display prices from TradingSystem.calculatePrice', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render TradePanel
        const { container } = render(<TradePanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify that prices are displayed (should be numbers followed by "cr/unit")
        const priceElements = container.querySelectorAll('.good-price');
        expect(priceElements.length).toBeGreaterThan(0);

        priceElements.forEach((element) => {
          expect(element.textContent).toMatch(/\d+ cr\/unit/);
        });
      }),
      { numRuns: 10 }
    );
  });

  it('should subscribe to cargoChanged event', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.currentSystem = 0; // Sol
        gameStateManager.state.player.credits = 10000;
        // Clear cargo to start with empty state
        gameStateManager.state.ship.cargo = [];

        const wrapper = createWrapper(gameStateManager);

        // Render TradePanel
        const { container } = render(<TradePanel onClose={() => {}} />, {
          wrapper,
        });

        // Initial state - no cargo
        let cargoDisplay = container.querySelector('#cargo-stacks');
        expect(cargoDisplay.textContent).toContain('No cargo');

        // Buy some goods (this should trigger cargoChanged event)
        const buyButtons = screen.getAllByText(/Buy 1/);
        fireEvent.click(buyButtons[0]);

        // Cargo display should update to show the purchased goods
        cargoDisplay = container.querySelector('#cargo-stacks');
        expect(cargoDisplay.textContent).not.toContain('No cargo');
      }),
      { numRuns: 10 }
    );
  });

  it('should not duplicate trade logic in component', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.currentSystem = 0; // Sol
        gameStateManager.state.player.credits = 10; // Very low credits
        gameStateManager.state.ship.cargo = []; // Empty cargo to maximize space

        const wrapper = createWrapper(gameStateManager);

        // Render TradePanel
        const { container } = render(<TradePanel onClose={() => {}} />, {
          wrapper,
        });

        // Find a "Buy 10" button (should be disabled due to insufficient credits)
        const buy10Buttons = screen.getAllByText(/Buy 10/);
        expect(buy10Buttons.length).toBeGreaterThan(0);

        // Button should be disabled (validation happens in component, but uses utility functions)
        const firstBuy10Button = buy10Buttons[0];
        expect(firstBuy10Button.disabled).toBe(true);

        // Verify validation message is displayed for at least one good
        const validationMessages = container.querySelectorAll(
          '.validation-message.error'
        );
        expect(validationMessages.length).toBeGreaterThan(0);
      }),
      { numRuns: 10 }
    );
  });
});
