import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import {
  GameStateManager,
  sanitizeShipName,
} from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';
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
 * React Migration Spec, Property 58: Default ship name on empty input
 * Validates: Requirements 48.5
 *
 * For any empty ship name submission, the default ship name from SHIP_CONFIG
 * should be used. This ensures players always have a valid ship name even if
 * they don't provide one.
 */
describe('Property: Default ship name on empty input', () => {
  it('should use default ship name when submitting empty string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '',
          '   ',
          '\t',
          '\n',
          '\r\n',
          '  \t  ',
          '\t\n\r',
          '     \n     '
        ),
        (emptyInput) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Track what name was submitted
          let submittedName = null;
          const onSubmit = (name) => {
            submittedName = name;
          };

          // Render ShipNamingDialog component
          const { container } = render(
            <ShipNamingDialog onSubmit={onSubmit} />,
            {
              wrapper,
            }
          );

          // Find the input field
          const input = container.querySelector('.ship-name-input');
          expect(input).toBeTruthy();

          // Set the input value to empty/whitespace
          fireEvent.change(input, { target: { value: emptyInput } });

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the submitted name is the default ship name
          expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default ship name when submitting via Enter key with empty input', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t\n', '  \t  '),
        (emptyInput) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Track what name was submitted
          let submittedName = null;
          const onSubmit = (name) => {
            submittedName = name;
          };

          // Render ShipNamingDialog component
          const { container } = render(
            <ShipNamingDialog onSubmit={onSubmit} />,
            {
              wrapper,
            }
          );

          // Find the input field
          const input = container.querySelector('.ship-name-input');
          expect(input).toBeTruthy();

          // Set the input value to empty/whitespace
          fireEvent.change(input, { target: { value: emptyInput } });

          // Press Enter key
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

          // Verify the submitted name is the default ship name
          expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use default ship name when input contains only HTML tags', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '<div></div>',
          '<span></span>',
          '<p></p>',
          '<b></b>',
          '<i></i>',
          '<script></script>',
          '<div><span></span></div>',
          '  <div></div>  '
        ),
        (htmlOnlyInput) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Track what name was submitted
          let submittedName = null;
          const onSubmit = (name) => {
            submittedName = name;
          };

          // Render ShipNamingDialog component
          const { container } = render(
            <ShipNamingDialog onSubmit={onSubmit} />,
            {
              wrapper,
            }
          );

          // Find the input field
          const input = container.querySelector('.ship-name-input');
          expect(input).toBeTruthy();

          // Set the input value to HTML-only content
          fireEvent.change(input, { target: { value: htmlOnlyInput } });

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the submitted name is the default ship name
          // (HTML tags are removed, leaving empty string, which defaults)
          expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific edge cases for default name', () => {
    const testCases = [
      { input: '', description: 'empty string' },
      { input: '   ', description: 'spaces only' },
      { input: '\t', description: 'tab only' },
      { input: '\n', description: 'newline only' },
      { input: '\r\n', description: 'carriage return + newline' },
      { input: '  \t\n  ', description: 'mixed whitespace' },
      { input: '<div></div>', description: 'empty HTML tags' },
      { input: '<script></script>', description: 'empty script tags' },
      { input: '  <div></div>  ', description: 'empty HTML with whitespace' },
    ];

    testCases.forEach(({ input }) => {
      cleanup();

      const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
      gameStateManager.initNewGame();

      const wrapper = createWrapper(gameStateManager);

      let submittedName = null;
      const onSubmit = (name) => {
        submittedName = name;
      };

      const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
        wrapper,
      });

      const inputElement = container.querySelector('.ship-name-input');
      fireEvent.change(inputElement, { target: { value: input } });

      const confirmButton = container.querySelector('.modal-confirm');
      fireEvent.click(confirmButton);

      expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
    });
  });

  it('should not use default name when input has valid content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
          // Filter out strings that would become empty after sanitization
          const sanitized = sanitizeShipName(s);
          return sanitized !== SHIP_CONFIG.DEFAULT_NAME;
        }),
        (validInput) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Track what name was submitted
          let submittedName = null;
          const onSubmit = (name) => {
            submittedName = name;
          };

          // Render ShipNamingDialog component
          const { container } = render(
            <ShipNamingDialog onSubmit={onSubmit} />,
            {
              wrapper,
            }
          );

          // Find the input field
          const input = container.querySelector('.ship-name-input');
          expect(input).toBeTruthy();

          // Set the input value to valid content
          fireEvent.change(input, { target: { value: validInput } });

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the submitted name is NOT the default
          // The submitted name should be the sanitized input
          const expectedName = sanitizeShipName(validInput);
          expect(submittedName).toBe(expectedName);

          // Verify it's not the default name (filter should have excluded those)
          expect(submittedName).not.toBe(SHIP_CONFIG.DEFAULT_NAME);
        }
      ),
      { numRuns: 100 }
    );
  });
});
