import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property 23: Panels rendered as React components
 *
 * Validates that UI panels are rendered as React components using declarative rendering
 * instead of manual DOM manipulation.
 *
 * React Migration Spec: Requirements 8.1
 */
describe('Property 23: Panels rendered as React components', () => {
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

  it('TradePanel should render as a React component', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render TradePanel as a React component
        const { container } = render(<TradePanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify the component renders
        expect(container.querySelector('#trade-panel')).toBeTruthy();

        // Verify it has React-rendered content (not manually created DOM)
        const tradePanel = container.querySelector('#trade-panel');
        expect(tradePanel.querySelector('h2')).toBeTruthy();
        expect(tradePanel.querySelector('.trade-content')).toBeTruthy();
        expect(tradePanel.querySelector('#market-goods')).toBeTruthy();
        expect(tradePanel.querySelector('#cargo-stacks')).toBeTruthy();
      }),
      { numRuns: 10 }
    );
  });

  it('TradePanel should use declarative rendering for market goods', () => {
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

        // Verify market goods are rendered declaratively
        const marketGoods = container.querySelector('#market-goods');
        expect(marketGoods).toBeTruthy();

        // Should have multiple good items (one for each commodity)
        const goodItems = marketGoods.querySelectorAll('.good-item');
        expect(goodItems.length).toBeGreaterThan(0);

        // Each good item should have React-rendered structure
        goodItems.forEach((item) => {
          expect(item.querySelector('.good-info')).toBeTruthy();
          expect(item.querySelector('.good-name')).toBeTruthy();
          expect(item.querySelector('.good-price')).toBeTruthy();
          expect(item.querySelector('.good-actions')).toBeTruthy();
        });
      }),
      { numRuns: 10 }
    );
  });

  it('TradePanel should use declarative rendering for cargo stacks', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.currentSystem = 0; // Sol
        gameStateManager.state.ship.cargo = [
          {
            good: 'electronics',
            qty: 10,
            buyPrice: 100,
            buySystem: 0,
            buyDate: 0,
          },
          {
            good: 'grain',
            qty: 5,
            buyPrice: 50,
            buySystem: 0,
            buyDate: 0,
          },
        ];

        const wrapper = createWrapper(gameStateManager);

        // Render TradePanel
        const { container } = render(<TradePanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify cargo stacks are rendered declaratively
        const cargoStacks = container.querySelector('#cargo-stacks');
        expect(cargoStacks).toBeTruthy();

        // Should have cargo stack items
        const stackItems = cargoStacks.querySelectorAll('.cargo-stack');
        expect(stackItems.length).toBe(2);

        // Each stack item should have React-rendered structure
        stackItems.forEach((item) => {
          expect(item.querySelector('.stack-info')).toBeTruthy();
          expect(item.querySelector('.stack-name')).toBeTruthy();
          expect(item.querySelector('.stack-details')).toBeTruthy();
          expect(item.querySelector('.stack-profit')).toBeTruthy();
          expect(item.querySelector('.stack-actions')).toBeTruthy();
        });
      }),
      { numRuns: 10 }
    );
  });

  it('TradePanel should re-render when game state changes', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
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
        let cargoStacks = container.querySelector('#cargo-stacks');
        expect(cargoStacks.textContent).toContain('No cargo');

        // Manually add cargo to state and emit event
        gameStateManager.state.ship.cargo = [
          {
            good: 'electronics',
            qty: 10,
            buyPrice: 100,
            buySystem: 0,
            buyDate: 0,
          },
        ];
        gameStateManager.emit(
          'cargoChanged',
          gameStateManager.state.ship.cargo
        );

        // Wait for component to re-render
        await waitFor(() => {
          cargoStacks = container.querySelector('#cargo-stacks');
          expect(cargoStacks.textContent).not.toContain('No cargo');
          expect(cargoStacks.textContent).toContain('Electronics');
        });
      }),
      { numRuns: 10 }
    );
  });
});
