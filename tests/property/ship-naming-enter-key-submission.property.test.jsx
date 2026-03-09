import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { sanitizeShipName } from '../../src/game/utils/string-utils.js';
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
 * React Migration Spec, Property 59: Enter key submits ship name
 * Validates: Requirements 48.6
 *
 * For any Enter key press in the ship name input field, the ship name should
 * be submitted. This provides a convenient keyboard shortcut for players.
 */
describe('Property: Enter key submits ship name', () => {
  it('should submit ship name when Enter key is pressed', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipNameInput) => {
          cleanup();

          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          const wrapper = createWrapper(game);

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
          fireEvent.change(input, { target: { value: shipNameInput } });

          // Press Enter key
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

          // Verify the submitted name matches the sanitized input
          const expectedName = sanitizeShipName(shipNameInput);
          expect(submittedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should submit ship name when Enter key is pressed with various key event properties', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc.constantFrom(
          { key: 'Enter', code: 'Enter' },
          { key: 'Enter', code: 'Enter', keyCode: 13 },
          { key: 'Enter', code: 'NumpadEnter' },
          { key: 'Enter', code: 'NumpadEnter', keyCode: 13 }
        ),
        (shipNameInput, keyEventProps) => {
          cleanup();

          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          const wrapper = createWrapper(game);

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
          fireEvent.change(input, { target: { value: shipNameInput } });

          // Press Enter key with various event properties
          fireEvent.keyDown(input, keyEventProps);

          // Verify the submitted name matches the sanitized input
          const expectedName = sanitizeShipName(shipNameInput);
          expect(submittedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not submit ship name when other keys are pressed', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc.constantFrom(
          { key: 'Escape', code: 'Escape' },
          { key: 'Tab', code: 'Tab' },
          { key: 'Space', code: 'Space' },
          { key: 'a', code: 'KeyA' },
          { key: 'ArrowDown', code: 'ArrowDown' },
          { key: 'ArrowUp', code: 'ArrowUp' }
        ),
        (shipNameInput, keyEventProps) => {
          cleanup();

          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          const wrapper = createWrapper(game);

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
          fireEvent.change(input, { target: { value: shipNameInput } });

          // Press a non-Enter key
          fireEvent.keyDown(input, keyEventProps);

          // Verify the name was NOT submitted
          expect(submittedName).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should submit ship name via Enter key and confirm button equivalently', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipNameInput) => {
          cleanup();

          const game1 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game1.initNewGame();

          const wrapper1 = createWrapper(game1);

          // Test Enter key submission
          let submittedNameViaEnter = null;
          const onSubmitEnter = (name) => {
            submittedNameViaEnter = name;
          };

          const { container: container1 } = render(
            <ShipNamingDialog onSubmit={onSubmitEnter} />,
            {
              wrapper: wrapper1,
            }
          );

          const input1 = container1.querySelector('.ship-name-input');
          fireEvent.change(input1, { target: { value: shipNameInput } });
          fireEvent.keyDown(input1, { key: 'Enter', code: 'Enter' });

          cleanup();

          // Test confirm button submission
          const game2 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game2.initNewGame();

          const wrapper2 = createWrapper(game2);

          let submittedNameViaButton = null;
          const onSubmitButton = (name) => {
            submittedNameViaButton = name;
          };

          const { container: container2 } = render(
            <ShipNamingDialog onSubmit={onSubmitButton} />,
            {
              wrapper: wrapper2,
            }
          );

          const input2 = container2.querySelector('.ship-name-input');
          fireEvent.change(input2, { target: { value: shipNameInput } });

          const confirmButton = container2.querySelector('.modal-confirm');
          fireEvent.click(confirmButton);

          // Verify both methods produce the same result
          expect(submittedNameViaEnter).toBe(submittedNameViaButton);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle Enter key submission with special characters', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Ship <Name>',
          'Ship & Co.',
          'Ship "Quotes"',
          "Ship's Name",
          'Ship   Name',
          '<script>alert("xss")</script>',
          'Ship™',
          'Ship®',
          'Ship©'
        ),
        (shipNameInput) => {
          cleanup();

          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          const wrapper = createWrapper(game);

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
          fireEvent.change(input, { target: { value: shipNameInput } });

          // Press Enter key
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

          // Verify the submitted name matches the sanitized input
          const expectedName = sanitizeShipName(shipNameInput);
          expect(submittedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific edge cases for Enter key submission', () => {
    const testCases = [
      { input: 'Simple Name', description: 'simple name' },
      { input: 'Name With Spaces', description: 'name with spaces' },
      {
        input: '  Trimmed  ',
        description: 'name with leading/trailing spaces',
      },
      { input: 'Name123', description: 'name with numbers' },
      { input: 'Name-With-Dashes', description: 'name with dashes' },
      { input: 'Name_With_Underscores', description: 'name with underscores' },
      { input: 'Name.With.Dots', description: 'name with dots' },
      { input: 'A', description: 'single character' },
      { input: 'A'.repeat(50), description: 'maximum length name' },
    ];

    testCases.forEach(({ input }) => {
      cleanup();

      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.initNewGame();

      const wrapper = createWrapper(game);

      let submittedName = null;
      const onSubmit = (name) => {
        submittedName = name;
      };

      const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
        wrapper,
      });

      const inputElement = container.querySelector('.ship-name-input');
      fireEvent.change(inputElement, { target: { value: input } });
      fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter' });

      const expectedName = sanitizeShipName(input);
      expect(submittedName).toBe(expectedName);
    });
  });
});
