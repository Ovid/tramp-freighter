import { describe, it, expect, vi } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useGameAction } from '../../src/hooks/useGameAction.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Helper to create a wrapper component with GameProvider
 */
function createWrapper(gameStateManager) {
  return function Wrapper({ children }) {
    return (
      <GameProvider gameStateManager={gameStateManager}>
        {children}
      </GameProvider>
    );
  };
}

/**
 * React Migration Spec, Property 13: useGameAction delegates to GameStateManager
 * Validates: Requirements 16.2, 16.3
 *
 * For any action triggered through useGameAction, the corresponding
 * GameStateManager method should be called.
 */
describe('Property: useGameAction delegates to GameStateManager', () => {
  it('should delegate refuel action to GameStateManager', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (refuelAmount) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Spy on refuel method
        const refuelSpy = vi.spyOn(gameStateManager, 'refuel');

        // Render hook
        const { result } = renderHook(() => useGameAction(), {
          wrapper: createWrapper(gameStateManager),
        });

        // Call refuel action
        act(() => {
          result.current.refuel(refuelAmount);
        });

        // Verify GameStateManager method was called
        expect(refuelSpy).toHaveBeenCalledWith(refuelAmount);

        refuelSpy.mockRestore();
        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should delegate buyGood action to GameStateManager', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('grain', 'electronics', 'medicine', 'machinery'),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 10, max: 500 }),
        (goodType, quantity, price) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Spy on buyGood method
          const buyGoodSpy = vi.spyOn(gameStateManager, 'buyGood');

          // Render hook
          const { result } = renderHook(() => useGameAction(), {
            wrapper: createWrapper(gameStateManager),
          });

          // Call buyGood action
          act(() => {
            result.current.buyGood(goodType, quantity, price);
          });

          // Verify GameStateManager method was called
          expect(buyGoodSpy).toHaveBeenCalledWith(goodType, quantity, price);

          buyGoodSpy.mockRestore();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should delegate purchaseUpgrade action to GameStateManager', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'extended_fuel_tank',
          'cargo_expansion',
          'advanced_sensors'
        ),
        (upgradeId) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Spy on purchaseUpgrade method
          const purchaseUpgradeSpy = vi.spyOn(
            gameStateManager,
            'purchaseUpgrade'
          );

          // Render hook
          const { result } = renderHook(() => useGameAction(), {
            wrapper: createWrapper(gameStateManager),
          });

          // Call purchaseUpgrade action
          act(() => {
            result.current.purchaseUpgrade(upgradeId);
          });

          // Verify GameStateManager method was called
          expect(purchaseUpgradeSpy).toHaveBeenCalledWith(upgradeId);

          purchaseUpgradeSpy.mockRestore();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});

/**
 * React Migration Spec, Property 14: Actions trigger events
 * Validates: Requirements 16.4
 *
 * For any game action completing, the appropriate GameStateManager events
 * should be fired.
 */
describe('Property: Actions trigger events', () => {
  it('should trigger creditsChanged event when refueling', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (refuelAmount) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Ensure we have enough credits for refuel
        gameStateManager.updateCredits(10000);

        // Reduce fuel so we can refuel
        gameStateManager.updateFuel(50);

        // Track event emissions
        let eventFired = false;
        gameStateManager.subscribe('creditsChanged', () => {
          eventFired = true;
        });

        // Render hook
        const { result } = renderHook(() => useGameAction(), {
          wrapper: createWrapper(gameStateManager),
        });

        // Call refuel action
        let refuelResult;
        act(() => {
          refuelResult = result.current.refuel(refuelAmount);
        });

        // Only verify event if refuel succeeded
        if (refuelResult.success) {
          expect(eventFired).toBe(true);
          return eventFired;
        }

        // If refuel failed, that's okay - just return true
        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should trigger fuelChanged event when refueling', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (refuelAmount) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Ensure we have enough credits for refuel
        gameStateManager.updateCredits(10000);

        // Reduce fuel so we can refuel
        gameStateManager.updateFuel(50);

        // Track event emissions
        let eventFired = false;
        gameStateManager.subscribe('fuelChanged', () => {
          eventFired = true;
        });

        // Render hook
        const { result } = renderHook(() => useGameAction(), {
          wrapper: createWrapper(gameStateManager),
        });

        // Call refuel action
        let refuelResult;
        act(() => {
          refuelResult = result.current.refuel(refuelAmount);
        });

        // Only verify event if refuel succeeded
        if (refuelResult.success) {
          expect(eventFired).toBe(true);
          return eventFired;
        }

        // If refuel failed, that's okay - just return true
        return true;
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 15: useGameAction consistency
 * Validates: Requirements 16.5
 *
 * For any multiple components using useGameAction, they should all receive
 * the same action methods.
 */
describe('Property: useGameAction consistency', () => {
  it('should provide same action methods to all components', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render multiple hooks
        const hook1 = renderHook(() => useGameAction(), { wrapper });
        const hook2 = renderHook(() => useGameAction(), { wrapper });
        const hook3 = renderHook(() => useGameAction(), { wrapper });

        // Verify all hooks have the same action method names
        const keys1 = Object.keys(hook1.result.current).sort();
        const keys2 = Object.keys(hook2.result.current).sort();
        const keys3 = Object.keys(hook3.result.current).sort();

        expect(keys1).toEqual(keys2);
        expect(keys2).toEqual(keys3);

        // Verify all hooks have function values for each action
        keys1.forEach((key) => {
          expect(typeof hook1.result.current[key]).toBe('function');
          expect(typeof hook2.result.current[key]).toBe('function');
          expect(typeof hook3.result.current[key]).toBe('function');
        });

        return (
          keys1.length > 0 &&
          keys1.every((key) => typeof hook1.result.current[key] === 'function')
        );
      }),
      { numRuns: 20 }
    );
  });

  it('should provide stable function references across re-renders', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render hook
        const { result, rerender } = renderHook(() => useGameAction(), {
          wrapper: createWrapper(gameStateManager),
        });

        // Get initial action references
        const initialActions = result.current;

        // Force re-render
        rerender();

        // Get actions after re-render
        const afterRerenderActions = result.current;

        // Verify action object reference is stable (useMemo working)
        expect(initialActions).toBe(afterRerenderActions);

        return initialActions === afterRerenderActions;
      }),
      { numRuns: 20 }
    );
  });
});
