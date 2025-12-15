import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { UpgradesPanel } from '../../src/features/upgrades/UpgradesPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property: Upgrades panel delegates to GameStateManager
 *
 * Validates that the UpgradesPanel component delegates all upgrade operations to GameStateManager
 * and does not duplicate upgrade logic.
 *
 * React Migration Spec: Requirements 26.1, 26.2, 26.3
 */
describe('Property: Upgrades panel delegates to GameStateManager', () => {
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

  it('should display available upgrades', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player credits
        gameStateManager.state.player.credits = 50000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Verify panel renders
        expect(screen.getByText(/Ship Upgrades/)).toBeInTheDocument();

        // Verify available upgrades section exists
        expect(screen.getByText('Available Upgrades')).toBeInTheDocument();

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display installed upgrades', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Install an upgrade
        const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
        gameStateManager.state.ship.upgrades = [upgradeId];
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Verify installed upgrades section exists
        expect(screen.getByText('Installed Upgrades')).toBeInTheDocument();

        // Verify upgrade name is displayed
        const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
        expect(screen.getByText(upgrade.name)).toBeInTheDocument();

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should show validation message for insufficient credits', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player insufficient credits
        gameStateManager.state.player.credits = 10;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        const { container } = render(<UpgradesPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify validation message is displayed for at least one upgrade
        const validationMessages = container.querySelectorAll(
          '.validation-message.error'
        );
        expect(validationMessages.length).toBeGreaterThan(0);

        // Verify message contains "Insufficient credits"
        const hasInsufficientCreditsMessage = Array.from(
          validationMessages
        ).some((msg) => msg.textContent.includes('Insufficient credits'));
        expect(hasInsufficientCreditsMessage).toBe(true);

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should disable purchase button for insufficient credits', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player insufficient credits
        gameStateManager.state.player.credits = 10;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Find all purchase buttons
        const purchaseButtons = screen.getAllByText('Purchase');

        // All buttons should be disabled due to insufficient credits
        purchaseButtons.forEach((button) => {
          expect(button).toBeDisabled();
        });

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should enable purchase button for sufficient credits', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player sufficient credits
        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Find all purchase buttons
        const purchaseButtons = screen.getAllByText('Purchase');

        // At least one button should be enabled
        const enabledButtons = purchaseButtons.filter(
          (button) => !button.disabled
        );
        expect(enabledButtons.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should show confirmation dialog when purchase button clicked', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player sufficient credits
        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Find and click first enabled purchase button
        const purchaseButtons = screen.getAllByText('Purchase');
        const enabledButton = purchaseButtons.find((btn) => !btn.disabled);

        if (enabledButton) {
          fireEvent.click(enabledButton);

          // Verify confirmation dialog appears
          expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
          expect(screen.getByText('Cancel')).toBeInTheDocument();
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display credits in panel', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100000 }), (credits) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = credits;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        const { container } = render(<UpgradesPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify credits are displayed
        const creditsDisplay = container.querySelector(
          '#upgrades-credits-value'
        );
        expect(creditsDisplay).toBeTruthy();
        expect(creditsDisplay.textContent).toContain(credits.toLocaleString());

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should sort available upgrades by cost', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        const { container } = render(<UpgradesPanel onClose={() => {}} />, {
          wrapper,
        });

        // Get all upgrade cards in available section
        const availableSection = container.querySelector(
          '#available-upgrades-list'
        );
        const upgradeCards = availableSection.querySelectorAll('.upgrade-card');

        // Extract costs from cards
        const costs = Array.from(upgradeCards).map((card) => {
          const costText = card.querySelector('.upgrade-cost').textContent;
          // Remove currency symbol and commas, parse as number
          return parseInt(costText.replace(/[₡,]/g, ''), 10);
        });

        // Verify costs are in ascending order
        for (let i = 1; i < costs.length; i++) {
          expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]);
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display upgrade effects', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        const { container } = render(<UpgradesPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify effects are displayed
        const effectsLabels = container.querySelectorAll(
          '.upgrade-effects-label'
        );
        expect(effectsLabels.length).toBeGreaterThan(0);

        // Verify effects lists exist
        const effectsLists = container.querySelectorAll(
          '.upgrade-effects-list'
        );
        expect(effectsLists.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display tradeoff warning for upgrades with tradeoffs', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render UpgradesPanel
        const { container } = render(<UpgradesPanel onClose={() => {}} />, {
          wrapper,
        });

        // Find upgrades with tradeoffs
        const upgradesWithTradeoffs = Object.entries(SHIP_CONFIG.UPGRADES)
          .filter(
            ([_, upgrade]) => upgrade.tradeoff && upgrade.tradeoff !== 'None'
          )
          .map(([id, _]) => id);

        if (upgradesWithTradeoffs.length > 0) {
          // Verify warning symbols are displayed
          const warningSymbols = container.querySelectorAll(
            '.upgrade-warning-symbol'
          );
          expect(warningSymbols.length).toBeGreaterThan(0);
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should call gameStateManager.purchaseUpgrade when confirming purchase', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player sufficient credits
        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track purchaseUpgrade calls
        let purchaseUpgradeCalled = false;
        let purchaseUpgradeArgs = null;
        const originalPurchaseUpgrade =
          gameStateManager.purchaseUpgrade.bind(gameStateManager);
        gameStateManager.purchaseUpgrade = (upgradeId) => {
          purchaseUpgradeCalled = true;
          purchaseUpgradeArgs = { upgradeId };
          return originalPurchaseUpgrade(upgradeId);
        };

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Find and click first enabled purchase button
        const purchaseButtons = screen.getAllByText('Purchase');
        const enabledButton = purchaseButtons.find((btn) => !btn.disabled);

        if (enabledButton) {
          fireEvent.click(enabledButton);

          // Find and click confirm button
          const confirmButton = screen.getByText('Confirm Purchase');
          fireEvent.click(confirmButton);

          // Verify purchaseUpgrade was called
          expect(purchaseUpgradeCalled).toBe(true);
          expect(purchaseUpgradeArgs).toBeTruthy();
          expect(purchaseUpgradeArgs.upgradeId).toBeTruthy();
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should not call gameStateManager.purchaseUpgrade when canceling', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Give player sufficient credits
        gameStateManager.state.player.credits = 100000;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Track purchaseUpgrade calls
        let purchaseUpgradeCalled = false;
        const originalPurchaseUpgrade =
          gameStateManager.purchaseUpgrade.bind(gameStateManager);
        gameStateManager.purchaseUpgrade = (upgradeId) => {
          purchaseUpgradeCalled = true;
          return originalPurchaseUpgrade(upgradeId);
        };

        // Render UpgradesPanel
        render(<UpgradesPanel onClose={() => {}} />, { wrapper });

        // Find and click first enabled purchase button
        const purchaseButtons = screen.getAllByText('Purchase');
        const enabledButton = purchaseButtons.find((btn) => !btn.disabled);

        if (enabledButton) {
          fireEvent.click(enabledButton);

          // Find and click cancel button
          const cancelButton = screen.getByText('Cancel');
          fireEvent.click(cancelButton);

          // Verify purchaseUpgrade was NOT called
          expect(purchaseUpgradeCalled).toBe(false);
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
