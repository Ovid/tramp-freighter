import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress console warnings during tests
// React Testing Library warnings that are expected in property-based tests:
// - "Warning: An update to" - React state updates outside act() are expected in fast-check
// - "act()" - Property tests intentionally trigger updates without act() wrapper
// - "Not implemented: HTMLFormElement.prototype.submit" - jsdom limitation, not a real error
let originalConsoleError;
let originalConsoleWarn;

beforeAll(() => {
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;

  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
        message.includes('act()') ||
        message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return; // Suppress expected warnings listed above
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Not implemented')) {
      return; // Suppress jsdom "Not implemented" warnings (browser API limitations)
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

/**
 * React Migration Spec, Property 56: Ship naming dialog displays
 * Validates: Requirements 48.1
 *
 * For any new game initialization, the ship naming dialog should be displayed.
 * This ensures players can name their ship when starting a new game.
 */
describe('Property: Ship naming dialog displays', () => {
  it('should display ship naming dialog with all required elements', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify modal overlay is displayed
        const modalOverlay = container.querySelector('.modal-overlay');
        if (!modalOverlay) {
          console.error('Modal overlay not found');
          return false;
        }

        // Verify modal dialog is displayed
        const modalDialog = container.querySelector('.modal-dialog');
        if (!modalDialog) {
          console.error('Modal dialog not found');
          return false;
        }

        // Verify modal content is displayed
        const modalContent = container.querySelector('.modal-content');
        if (!modalContent) {
          console.error('Modal content not found');
          return false;
        }

        // Verify title is displayed
        const title = container.querySelector('.modal-title');
        if (!title || title.textContent !== 'Name Your Ship') {
          console.error('Title not found or incorrect');
          return false;
        }

        // Verify description is displayed
        const description = container.querySelector('.modal-description');
        if (
          !description ||
          description.textContent !== 'What will you call your vessel?'
        ) {
          console.error('Description not found or incorrect');
          return false;
        }

        // Verify input field is displayed
        const input = container.querySelector('.ship-name-input');
        if (!input) {
          console.error('Ship name input not found');
          return false;
        }

        // Verify input has correct attributes
        if (input.type !== 'text') {
          console.error('Input type is not text');
          return false;
        }

        if (input.placeholder !== 'Enter ship name...') {
          console.error('Input placeholder is incorrect');
          return false;
        }

        // Verify suggestions section is displayed
        const suggestionsSection = container.querySelector(
          '.ship-name-suggestions'
        );
        if (!suggestionsSection) {
          console.error('Suggestions section not found');
          return false;
        }

        // Verify suggestions label is displayed
        const suggestionsLabel = container.querySelector('.suggestions-label');
        if (
          !suggestionsLabel ||
          suggestionsLabel.textContent !== 'Suggestions:'
        ) {
          console.error('Suggestions label not found or incorrect');
          return false;
        }

        // Verify suggestions list is displayed
        const suggestionsList = container.querySelector('.suggestions-list');
        if (!suggestionsList) {
          console.error('Suggestions list not found');
          return false;
        }

        // Verify suggestion buttons are displayed
        const suggestionButtons = container.querySelectorAll('.suggestion-btn');
        if (suggestionButtons.length === 0) {
          console.error('No suggestion buttons found');
          return false;
        }

        // Verify confirm button is displayed
        const confirmButton = container.querySelector('.modal-confirm');
        if (!confirmButton || confirmButton.textContent !== 'Confirm') {
          console.error('Confirm button not found or incorrect');
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should display ship naming dialog with correct structure', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify the dialog structure is correct
        // modal-overlay > modal-dialog > modal-content
        const modalOverlay = container.querySelector('.modal-overlay');
        if (!modalOverlay) {
          console.error('Modal overlay not found');
          return false;
        }

        const modalDialog = modalOverlay.querySelector('.modal-dialog');
        if (!modalDialog) {
          console.error('Modal dialog not found inside overlay');
          return false;
        }

        const modalContent = modalDialog.querySelector('.modal-content');
        if (!modalContent) {
          console.error('Modal content not found inside dialog');
          return false;
        }

        // Verify modal content contains all required sections
        const title = modalContent.querySelector('.modal-title');
        const description = modalContent.querySelector('.modal-description');
        const inputGroup = modalContent.querySelector(
          '.ship-naming-input-group'
        );
        const suggestions = modalContent.querySelector(
          '.ship-name-suggestions'
        );
        const actions = modalContent.querySelector('.modal-actions');

        if (!title) {
          console.error('Title not found in modal content');
          return false;
        }

        if (!description) {
          console.error('Description not found in modal content');
          return false;
        }

        if (!inputGroup) {
          console.error('Input group not found in modal content');
          return false;
        }

        if (!suggestions) {
          console.error('Suggestions not found in modal content');
          return false;
        }

        if (!actions) {
          console.error('Actions not found in modal content');
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should display ship naming dialog immediately when rendered', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify the dialog is immediately visible (no loading state)
        const modalOverlay = container.querySelector('.modal-overlay');
        if (!modalOverlay) {
          console.error('Modal overlay not displayed immediately');
          return false;
        }

        // Verify the input field is present and ready for input
        const input = container.querySelector('.ship-name-input');
        if (!input) {
          console.error('Input field not displayed immediately');
          return false;
        }

        // Verify the confirm button is present and ready for interaction
        const confirmButton = container.querySelector('.modal-confirm');
        if (!confirmButton) {
          console.error('Confirm button not displayed immediately');
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
