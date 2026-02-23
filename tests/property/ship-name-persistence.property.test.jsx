import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { sanitizeShipName } from '../../src/game/state/game-state-manager.js';
import { saveGame, loadGame } from '../../src/game/state/save-load.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress console warnings and logs during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
});

/**
 * React Migration Spec, Property 60: Ship name persists after submission
 * Validates: Requirements 48.7
 *
 * For any ship name submission, the game state should be updated and saved
 * with the new ship name. This ensures the ship name persists across sessions.
 */
describe('Property: Ship name persists after submission', () => {
  it('should update game state with submitted ship name', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipNameInput) => {
          cleanup();
          localStorage.clear();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          const onSubmit = (name) => {
            // Simulate what App.jsx should do: update game state
            gameStateManager.updateShipName(name);
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

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the game state was updated with the sanitized name
          const expectedName = sanitizeShipName(shipNameInput);
          const actualName = gameStateManager.getState().ship.name;

          expect(actualName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist ship name to localStorage after submission', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipNameInput) => {
          cleanup();
          localStorage.clear();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          const onSubmit = (name) => {
            // Simulate what App.jsx should do: update game state and save
            gameStateManager.updateShipName(name);
            saveGame(gameStateManager.getState());
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

          // Find and click the confirm button
          const confirmButton = container.querySelector('.modal-confirm');
          expect(confirmButton).toBeTruthy();

          fireEvent.click(confirmButton);

          // Verify the ship name was saved to localStorage
          const savedState = loadGame();
          expect(savedState).toBeTruthy();

          const expectedName = sanitizeShipName(shipNameInput);
          const savedName = savedState.ship.name;

          expect(savedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist ship name via Enter key submission', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipNameInput) => {
          cleanup();
          localStorage.clear();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          const onSubmit = (name) => {
            // Simulate what App.jsx should do: update game state and save
            gameStateManager.updateShipName(name);
            saveGame(gameStateManager.getState());
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

          // Verify the ship name was saved to localStorage
          const savedState = loadGame();
          expect(savedState).toBeTruthy();

          const expectedName = sanitizeShipName(shipNameInput);
          const savedName = savedState.ship.name;

          expect(savedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist default ship name when submitting empty input', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
        (emptyInput) => {
          cleanup();
          localStorage.clear();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          const onSubmit = (name) => {
            // Simulate what App.jsx should do: update game state and save
            gameStateManager.updateShipName(name);
            saveGame(gameStateManager.getState());
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

          // Verify the default ship name was saved to localStorage
          const savedState = loadGame();
          expect(savedState).toBeTruthy();

          const expectedName = sanitizeShipName(emptyInput);
          const savedName = savedState.ship.name;

          expect(savedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow loading saved game with persisted ship name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
          // Filter out strings that would become empty after sanitization
          const sanitized = sanitizeShipName(s);
          return sanitized.trim().length > 0;
        }),
        (shipNameInput) => {
          cleanup();
          localStorage.clear();

          // Create first game state manager and set ship name
          const gameStateManager1 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager1.initNewGame();

          const wrapper1 = createWrapper(gameStateManager1);

          const onSubmit = (name) => {
            gameStateManager1.updateShipName(name);
            saveGame(gameStateManager1.getState());
          };

          const { container } = render(
            <ShipNamingDialog onSubmit={onSubmit} />,
            {
              wrapper: wrapper1,
            }
          );

          const input = container.querySelector('.ship-name-input');
          fireEvent.change(input, { target: { value: shipNameInput } });

          const confirmButton = container.querySelector('.modal-confirm');
          fireEvent.click(confirmButton);

          cleanup();

          // Create second game state manager and load saved game
          const gameStateManager2 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );

          const loadedState = gameStateManager2.loadGame();
          expect(loadedState).toBeTruthy();

          const expectedName = sanitizeShipName(shipNameInput);
          const loadedName = loadedState.ship.name;

          expect(loadedName).toBe(expectedName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific edge cases for ship name persistence', () => {
    const testCases = [
      { input: 'Simple Name', description: 'simple name' },
      { input: 'Name With Spaces', description: 'name with spaces' },
      {
        input: '  Trimmed  ',
        expected: 'Trimmed',
        description: 'name with leading/trailing spaces',
      },
      { input: 'Name123', description: 'name with numbers' },
      { input: 'Name-With-Dashes', description: 'name with dashes' },
      { input: 'Name_With_Underscores', description: 'name with underscores' },
      { input: 'Name.With.Dots', description: 'name with dots' },
      { input: 'A', description: 'single character' },
      { input: 'A'.repeat(50), description: 'maximum length name' },
    ];

    testCases.forEach(({ input, expected }) => {
      cleanup();
      localStorage.clear();

      const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
      gameStateManager.initNewGame();

      const wrapper = createWrapper(gameStateManager);

      const onSubmit = (name) => {
        gameStateManager.updateShipName(name);
        saveGame(gameStateManager.getState());
      };

      const { container } = render(<ShipNamingDialog onSubmit={onSubmit} />, {
        wrapper,
      });

      const inputElement = container.querySelector('.ship-name-input');
      fireEvent.change(inputElement, { target: { value: input } });

      const confirmButton = container.querySelector('.modal-confirm');
      fireEvent.click(confirmButton);

      // Verify persistence
      const savedState = loadGame();
      const expectedName = expected || sanitizeShipName(input);
      expect(savedState.ship.name).toBe(expectedName);
    });
  });
});
