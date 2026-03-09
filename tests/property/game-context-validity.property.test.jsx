import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { GameProvider, useGame } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

// Suppress expected React error messages when testing error cases
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * React Migration Spec, Property 7: GameContext provides valid instance
 * Validates: Requirements 5.1, 13.5
 *
 * For any component accessing GameContext, the context should provide
 * a non-null GameCoordinator instance.
 */
describe('Property: GameContext provides valid instance', () => {
  // Test component that uses useGame hook
  function TestComponent() {
    const game = useGame();
    return <div data-testid="test-component">{game ? 'valid' : 'invalid'}</div>;
  }

  it('should provide non-null GameCoordinator instance to all components', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Clean up any previous renders
        cleanup();

        // Create a new GameCoordinator instance
        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Render component wrapped in GameProvider
        render(
          <GameProvider game={game}>
            <TestComponent />
          </GameProvider>
        );

        // Verify component received valid instance
        const element = screen.getByTestId('test-component');
        expect(element.textContent).toBe('valid');

        // Verify the instance is actually a GameCoordinator
        return game instanceof GameCoordinator;
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error when useGame is used outside GameProvider', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Attempt to render component without GameProvider should throw
        expect(() => {
          render(<TestComponent />);
        }).toThrow('useGame must be used within GameProvider');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should show loading state when game is null', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Clean up any previous renders
        cleanup();

        // Render GameProvider with null game
        render(
          <GameProvider game={null}>
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
      { numRuns: 100 }
    );
  });
});
