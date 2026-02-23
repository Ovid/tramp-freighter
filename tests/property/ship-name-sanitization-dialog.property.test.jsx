import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import { sanitizeShipName } from '../../src/game/state/game-state-manager.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
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
 * React Migration Spec, Property 57: Ship name sanitization
 * Validates: Requirements 48.4
 *
 * For any ship name submission, the name should be sanitized using the existing
 * sanitizeShipName function. This ensures HTML tags are removed, length is limited
 * to 50 characters, and empty inputs default to the configured default name.
 */
describe('Property: Ship name sanitization', () => {
  it('should sanitize ship names using sanitizeShipName function when submitted', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty strings and whitespace-only strings
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n'),
          // Normal strings
          fc.string({ minLength: 1, maxLength: 100 }),
          // Strings with HTML tags
          fc.string().map((s) => `<div>${s}</div>`),
          fc.string().map((s) => `<script>${s}</script>`),
          fc.string().map((s) => `${s}<br/>`),
          // Very long strings
          fc.string({ minLength: 51, maxLength: 200 }),
          // Strings with mixed content
          fc
            .tuple(fc.string(), fc.string(), fc.string())
            .map(([a, b, c]) => `${a}<tag>${b}</tag>${c}`)
        ),
        (inputName) => {
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

          // Set the input value
          fireEvent.change(input, { target: { value: inputName } });

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the submitted name matches what sanitizeShipName would produce
          const expectedSanitized = sanitizeShipName(inputName);
          expect(submittedName).toBe(expectedSanitized);

          // Verify sanitization properties
          // Property 1: Empty or whitespace-only inputs result in default name
          if (!inputName || inputName.trim().length === 0) {
            expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
          }

          // Property 2: Result should not contain HTML tags
          expect(/<[^>]*>/.test(submittedName)).toBe(false);

          // Property 3: Result should be trimmed (no leading/trailing whitespace)
          expect(submittedName).toBe(submittedName.trim());

          // Property 4: Result should be at most 50 characters
          expect(submittedName.length).toBeLessThanOrEqual(50);

          // Property 5: If sanitization results in empty string, should use default
          const sanitizedWithoutTags = inputName.replace(/<[^>]*>/g, '').trim();
          if (sanitizedWithoutTags.length === 0) {
            expect(submittedName).toBe(SHIP_CONFIG.DEFAULT_NAME);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sanitize ship names when submitted via Enter key', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string().map((s) => `<div>${s}</div>`),
          fc.string({ minLength: 51, maxLength: 200 })
        ),
        (inputName) => {
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

          // Set the input value
          fireEvent.change(input, { target: { value: inputName } });

          // Press Enter key
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

          // Verify the submitted name matches what sanitizeShipName would produce
          const expectedSanitized = sanitizeShipName(inputName);
          expect(submittedName).toBe(expectedSanitized);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific edge cases correctly', () => {
    const testCases = [
      { input: '', expected: SHIP_CONFIG.DEFAULT_NAME },
      { input: '   ', expected: SHIP_CONFIG.DEFAULT_NAME },
      { input: '\t\n', expected: SHIP_CONFIG.DEFAULT_NAME },
      { input: '<div></div>', expected: SHIP_CONFIG.DEFAULT_NAME },
      { input: '<script>alert("xss")</script>', expected: 'alert("xss")' },
      { input: 'Millennium Falcon', expected: 'Millennium Falcon' },
      { input: '<b>Serenity</b>', expected: 'Serenity' },
      {
        input: 'Enterprise<script>bad()</script>',
        expected: 'Enterprisebad()',
      },
      { input: '  Rocinante  ', expected: 'Rocinante' },
      { input: 'a'.repeat(50), expected: 'a'.repeat(50) },
      { input: 'a'.repeat(60), expected: 'a'.repeat(50) },
      { input: '<div>' + 'a'.repeat(60) + '</div>', expected: 'a'.repeat(50) },
    ];

    testCases.forEach(({ input, expected }) => {
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

      expect(submittedName).toBe(expected);
    });
  });
});
