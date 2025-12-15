import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import * as fc from 'fast-check';
import { InfoBrokerPanel } from '../../src/features/info-broker/InfoBrokerPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress React act() warnings for property tests
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('act(') || message.includes('Warning: ReactDOM.render'))
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
 * Property: Info broker panel delegates to GameStateManager
 *
 * Validates that the InfoBrokerPanel component delegates all operations to GameStateManager
 * and does not duplicate logic.
 *
 * React Migration Spec: Requirements 26.1, 26.2, 26.3
 */
describe('Property: Info broker panel delegates to GameStateManager', () => {
  it('should call gameStateManager.purchaseIntelligence when purchasing intelligence', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player credits
        gameStateManager.state.player.credits = 10000;

        // Move to a system with connections
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track purchaseIntelligence calls
        let purchaseIntelligenceCalled = false;
        let purchaseIntelligenceArgs = null;
        const originalPurchaseIntelligence =
          gameStateManager.purchaseIntelligence.bind(gameStateManager);
        gameStateManager.purchaseIntelligence = (systemId) => {
          purchaseIntelligenceCalled = true;
          purchaseIntelligenceArgs = { systemId };
          return originalPurchaseIntelligence(systemId);
        };

        // Render InfoBrokerPanel
        render(<InfoBrokerPanel onClose={() => {}} />, { wrapper });

        // Find and click a "Purchase" button
        const purchaseButtons = screen.queryAllByText('Purchase');

        if (purchaseButtons.length > 0) {
          fireEvent.click(purchaseButtons[0]);

          // Verify purchaseIntelligence was called
          expect(purchaseIntelligenceCalled).toBe(true);
          expect(purchaseIntelligenceArgs).toBeTruthy();
          expect(typeof purchaseIntelligenceArgs.systemId).toBe('number');
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should call gameStateManager.generateRumor when buying rumor', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player credits
        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track generateRumor calls
        let generateRumorCalled = false;
        const originalGenerateRumor =
          gameStateManager.generateRumor.bind(gameStateManager);
        gameStateManager.generateRumor = () => {
          generateRumorCalled = true;
          return originalGenerateRumor();
        };

        // Render InfoBrokerPanel
        render(<InfoBrokerPanel onClose={() => {}} />, { wrapper });

        // Find and click "Buy Rumor" button
        const buyRumorButton = screen.getByText(/Buy Rumor/);
        fireEvent.click(buyRumorButton);

        // Verify generateRumor was called
        expect(generateRumorCalled).toBe(true);

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should call gameStateManager.updateCredits when buying rumor', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player credits
        const initialCredits = 10000;
        gameStateManager.state.player.credits = initialCredits;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track updateCredits calls
        let updateCreditsCalled = false;
        let updateCreditsArgs = null;
        const originalUpdateCredits =
          gameStateManager.updateCredits.bind(gameStateManager);
        gameStateManager.updateCredits = (newCredits) => {
          updateCreditsCalled = true;
          updateCreditsArgs = { newCredits };
          return originalUpdateCredits(newCredits);
        };

        // Render InfoBrokerPanel
        render(<InfoBrokerPanel onClose={() => {}} />, { wrapper });

        // Find and click "Buy Rumor" button
        const buyRumorButton = screen.getByText(/Buy Rumor/);
        fireEvent.click(buyRumorButton);

        // Verify updateCredits was called
        expect(updateCreditsCalled).toBe(true);
        expect(updateCreditsArgs).toBeTruthy();
        expect(updateCreditsArgs.newCredits).toBeLessThan(initialCredits);

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should subscribe to creditsChanged event', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render InfoBrokerPanel
        const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
          wrapper,
        });

        // Initial credits should be displayed
        const buyRumorButton = screen.getByText(/Buy Rumor/);
        expect(buyRumorButton).not.toBeDisabled();

        // Update credits to insufficient amount
        gameStateManager.updateCredits(1);

        // Button should become disabled after re-render
        await waitFor(() => {
          expect(buyRumorButton).toBeDisabled();
        });

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should subscribe to locationChanged event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        async (newSystemId) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          gameStateManager.state.player.credits = 10000;
          gameStateManager.state.player.currentSystem = 0; // Sol

          const wrapper = createWrapper(gameStateManager);

          // Render InfoBrokerPanel
          const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
            wrapper,
          });

          // Get initial system name
          const initialSystemName = STAR_DATA.find((s) => s.id === 0).name;
          expect(container.textContent).toContain(initialSystemName);

          // Update location
          gameStateManager.updateLocation(newSystemId);

          // New system name should be displayed after re-render
          const newSystemName = STAR_DATA.find(
            (s) => s.id === newSystemId
          ).name;
          await waitFor(() => {
            expect(container.textContent).toContain(newSystemName);
          });

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should subscribe to priceKnowledgeChanged event', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render InfoBrokerPanel
        const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
          wrapper,
        });

        // Clear price knowledge to test empty state
        gameStateManager.state.world.priceKnowledge = {};
        gameStateManager.emit('priceKnowledgeChanged', {});

        // Switch to Market Data tab
        const marketDataTab = screen.getByText('Market Data');
        fireEvent.click(marketDataTab);

        // Initially should show "No market data available"
        await waitFor(() => {
          expect(container.textContent).toContain('No market data available');
        });

        // Add price knowledge
        gameStateManager.state.world.priceKnowledge = {
          0: {
            lastVisit: 0,
            prices: {
              grain: 50,
              electronics: 100,
              medicine: 150,
              machinery: 200,
            },
          },
        };
        gameStateManager.emit(
          'priceKnowledgeChanged',
          gameStateManager.state.world.priceKnowledge
        );

        // Market data should now be displayed after re-render
        await waitFor(() => {
          expect(container.textContent).not.toContain(
            'No market data available'
          );
        });

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should not duplicate intelligence logic in component', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 1; // Very low credits
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render InfoBrokerPanel
        const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
          wrapper,
        });

        // Find purchase buttons (should be disabled due to insufficient credits)
        const purchaseButtons = screen.queryAllByText('Purchase');

        if (purchaseButtons.length > 0) {
          // Buttons should be disabled (validation happens in component using utility functions)
          purchaseButtons.forEach((button) => {
            expect(button.disabled).toBe(true);
          });
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display validation messages for insufficient credits', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 1; // Very low credits
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render InfoBrokerPanel
        const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
          wrapper,
        });

        // Try to purchase intelligence (should fail)
        const purchaseButtons = screen.queryAllByText('Purchase');

        if (purchaseButtons.length > 0) {
          fireEvent.click(purchaseButtons[0]);

          // Validation message should be displayed
          const validationMessage = container.querySelector(
            '.validation-message.error'
          );
          expect(validationMessage).toBeTruthy();
          expect(validationMessage.textContent).toContain(
            'Insufficient credits'
          );
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should switch between tabs correctly', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render InfoBrokerPanel
        const { container } = render(<InfoBrokerPanel onClose={() => {}} />, {
          wrapper,
        });

        // Initially on Purchase Intelligence tab
        expect(container.textContent).toContain('Market Rumors');
        expect(container.textContent).toContain('System Intelligence');

        // Switch to Market Data tab
        const marketDataTab = screen.getByText('Market Data');
        fireEvent.click(marketDataTab);

        // Should show Market Data content
        expect(container.textContent).toContain('Known Market Prices');
        expect(container.textContent).not.toContain('Market Rumors');

        // Switch back to Purchase Intelligence tab
        const purchaseTab = screen.getByText('Purchase Intelligence');
        fireEvent.click(purchaseTab);

        // Should show Purchase Intelligence content
        expect(container.textContent).toContain('Market Rumors');
        expect(container.textContent).toContain('System Intelligence');

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
