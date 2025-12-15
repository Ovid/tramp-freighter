import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { GameProvider, useGameState } from '../../src/context/GameContext.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

// Suppress expected React error messages when testing error cases
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress expected error boundary messages
      if (
        message.includes('useGameState must be used within GameProvider') ||
        message.includes('The above error occurred in the') ||
        message.includes('Consider adding an error boundary')
      ) {
        return;
      }
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

/**
 * React Migration Spec, Property 7: GameContext provides valid instance
 * Validates: Requirements 5.1, 13.5
 *
 * For any component accessing GameContext, the context should provide
 * a non-null GameStateManager instance.
 */
describe('Property: GameContext provides valid instance', () => {
  // Test component that uses useGameState hook
  function TestComponent() {
    const gameStateManager = useGameState();
    return (
      <div data-testid="test-component">
        {gameStateManager ? 'valid' : 'invalid'}
      </div>
    );
  }

  it('should provide non-null GameStateManager instance to all components', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Clean up any previous renders
        cleanup();

        // Create a new GameStateManager instance
        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render component wrapped in GameProvider
        render(
          <GameProvider gameStateManager={gameStateManager}>
            <TestComponent />
          </GameProvider>
        );

        // Verify component received valid instance
        const element = screen.getByTestId('test-component');
        expect(element.textContent).toBe('valid');

        // Verify the instance is actually a GameStateManager
        return gameStateManager instanceof GameStateManager;
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error when useGameState is used outside GameProvider', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Attempt to render component without GameProvider should throw
        expect(() => {
          render(<TestComponent />);
        }).toThrow('useGameState must be used within GameProvider');

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should show loading state when gameStateManager is null', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Clean up any previous renders
        cleanup();

        // Render GameProvider with null gameStateManager
        render(
          <GameProvider gameStateManager={null}>
            <TestComponent />
          </GameProvider>
        );

        // Verify loading state is displayed
        const loadingElement = screen.getByText('Loading game...');
        expect(loadingElement).toBeTruthy();

        // Verify TestComponent is not rendered
        const testElement = screen.queryByTestId('test-component');
        expect(testElement).toBeNull();

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
