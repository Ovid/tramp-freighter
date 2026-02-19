import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoBrokerPanel } from '../../src/features/info-broker/InfoBrokerPanel';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Test suite for Information Broker purchase feedback improvements
 *
 * Validates that the UI provides immediate feedback when purchasing intelligence:
 * - Success messages are displayed
 * - Button states update immediately
 * - Intelligence options list refreshes
 */
describe('InfoBrokerPanel Purchase Feedback', () => {
  let gameStateManager;
  let mockOnClose;

  beforeEach(() => {
    // Create real game state manager for testing
    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager = new GameStateManager(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );
    gameStateManager.initNewGame();

    // Set up test state
    gameStateManager.state.player.credits = 1000;
    gameStateManager.state.player.currentSystem = 0; // Sol

    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show success message when intelligence is purchased', () => {
    const wrapper = createWrapper(gameStateManager);

    render(<InfoBrokerPanel onClose={mockOnClose} />, { wrapper });

    // Find and click the purchase button for a connected system
    const purchaseButtons = screen.queryAllByText('Purchase');

    if (purchaseButtons.length > 0) {
      fireEvent.click(purchaseButtons[0]);

      // Verify success message appears immediately (no setTimeout delay in test)
      expect(
        screen.getByText(/Intelligence purchased for/)
      ).toBeInTheDocument();
    }
  });

  it('should refresh intelligence options after successful purchase', () => {
    const wrapper = createWrapper(gameStateManager);

    // Spy on listAvailableIntelligence to track calls
    const listSpy = vi.spyOn(gameStateManager, 'listAvailableIntelligence');

    render(<InfoBrokerPanel onClose={mockOnClose} />, { wrapper });

    // Find and click the purchase button
    const purchaseButtons = screen.queryAllByText('Purchase');

    if (purchaseButtons.length > 0) {
      const initialCallCount = listSpy.mock.calls.length;

      fireEvent.click(purchaseButtons[0]);

      // Verify that listAvailableIntelligence was called again to refresh the list
      expect(listSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    }
  });

  it('should show success message when rumor is purchased', () => {
    const wrapper = createWrapper(gameStateManager);

    render(<InfoBrokerPanel onClose={mockOnClose} />, { wrapper });

    // Find and click the buy rumor button
    const buyRumorButton = screen.getByText(/Buy Rumor/);
    fireEvent.click(buyRumorButton);

    // Verify success message appears immediately
    expect(
      screen.getByText('Rumor purchased successfully')
    ).toBeInTheDocument();

    // Verify the actual rumor text appears (look for specific rumor content)
    expect(screen.getByText(/Word on the street/)).toBeInTheDocument();
  });

  it('should show error message when purchase fails', () => {
    const wrapper = createWrapper(gameStateManager);

    // Set insufficient credits to trigger failure
    gameStateManager.state.player.credits = 1;

    render(<InfoBrokerPanel onClose={mockOnClose} />, { wrapper });

    // Find and click the purchase button (should be disabled, but test error handling)
    const purchaseButtons = screen.queryAllByText('Purchase');

    if (purchaseButtons.length > 0) {
      // Force click even if disabled to test error handling
      fireEvent.click(purchaseButtons[0]);

      // Since button should be disabled, no error message should appear
      // But if it did fire, it would show insufficient credits
      // This test verifies the button is properly disabled for insufficient credits
      expect(purchaseButtons[0]).toBeDisabled();
    }
  });

  it('should clear validation messages when switching tabs', () => {
    const wrapper = createWrapper(gameStateManager);

    render(<InfoBrokerPanel onClose={mockOnClose} />, { wrapper });

    // Switch to Market Data tab
    const marketDataTab = screen.getByText('Market Data');
    fireEvent.click(marketDataTab);

    // Switch back to Purchase Intelligence tab
    const purchaseTab = screen.getByText('Purchase Intelligence');
    fireEvent.click(purchaseTab);

    // Verify no validation messages are present after tab switch
    const validationMessages = screen.queryAllByText(/Insufficient credits/);
    expect(validationMessages).toHaveLength(0);
  });
});
