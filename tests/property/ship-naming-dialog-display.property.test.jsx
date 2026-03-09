import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress console warnings during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
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

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify modal overlay is displayed
        const modalOverlay = container.querySelector('.modal-overlay');
        expect(modalOverlay).toBeTruthy();

        // Verify modal dialog is displayed
        const modalDialog = container.querySelector('.modal-dialog');
        expect(modalDialog).toBeTruthy();

        // Verify modal content is displayed
        const modalContent = container.querySelector('.modal-content');
        expect(modalContent).toBeTruthy();

        // Verify title is displayed
        const title = container.querySelector('.modal-title');
        expect(title).toBeTruthy();
        expect(title.textContent).toBe('Name Your Ship');

        // Verify description is displayed
        const description = container.querySelector('.modal-description');
        expect(description).toBeTruthy();
        expect(description.textContent).toBe('What will you call your vessel?');

        // Verify input field is displayed
        const input = container.querySelector('.ship-name-input');
        expect(input).toBeTruthy();

        // Verify input has correct attributes
        expect(input.type).toBe('text');
        expect(input.placeholder).toBe('Enter ship name...');

        // Verify suggestions section is displayed
        const suggestionsSection = container.querySelector(
          '.ship-name-suggestions'
        );
        expect(suggestionsSection).toBeTruthy();

        // Verify suggestions label is displayed
        const suggestionsLabel = container.querySelector('.suggestions-label');
        expect(suggestionsLabel).toBeTruthy();
        expect(suggestionsLabel.textContent).toBe('Suggestions:');

        // Verify suggestions list is displayed
        const suggestionsList = container.querySelector('.suggestions-list');
        expect(suggestionsList).toBeTruthy();

        // Verify suggestion buttons are displayed
        const suggestionButtons = container.querySelectorAll('.suggestion-btn');
        expect(suggestionButtons.length).toBeGreaterThan(0);

        // Verify confirm button is displayed
        const confirmButton = container.querySelector('.modal-confirm');
        expect(confirmButton).toBeTruthy();
        expect(confirmButton.textContent).toBe('Confirm');
      }),
      { numRuns: 100 }
    );
  });

  it('should display ship naming dialog with correct structure', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify the dialog structure is correct
        // modal-overlay > modal-dialog > modal-content
        const modalOverlay = container.querySelector('.modal-overlay');
        expect(modalOverlay).toBeTruthy();

        const modalDialog = modalOverlay.querySelector('.modal-dialog');
        expect(modalDialog).toBeTruthy();

        const modalContent = modalDialog.querySelector('.modal-content');
        expect(modalContent).toBeTruthy();

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

        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        expect(inputGroup).toBeTruthy();
        expect(suggestions).toBeTruthy();
        expect(actions).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('should display ship naming dialog immediately when rendered', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onSubmit callback
        const onSubmit = () => {};

        // Render ShipNamingDialog component
        const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
          wrapper,
        });

        // Verify the dialog is immediately visible (no loading state)
        const modalOverlay = container.querySelector('.modal-overlay');
        expect(modalOverlay).toBeTruthy();

        // Verify the input field is present and ready for input
        const input = container.querySelector('.ship-name-input');
        expect(input).toBeTruthy();

        // Verify the confirm button is present and ready for interaction
        const confirmButton = container.querySelector('.modal-confirm');
        expect(confirmButton).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });
});
