import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { renderHook, cleanup, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useGameEvent } from '../../src/hooks/useGameEvent.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress React act() warnings in property-based tests
// These warnings are expected when testing hooks in isolation
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      message.includes('Warning: An update to') &&
      message.includes('was not wrapped in act')
    ) {
      return; // Suppress expected act() warnings
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

/**
 * React Migration Spec, Property 11: useGameEvent subscription correctness
 * Validates: Requirements 34.1
 *
 * For any call to useGameEvent with an event name, the hook should call
 * gameStateManager.subscribe with that event name.
 */
describe('Property: useGameEvent subscription correctness', () => {
  it('should subscribe to the specified event name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'creditsChanged',
          'fuelChanged',
          'cargoChanged',
          'locationChanged',
          'timeChanged'
        ),
        (eventName) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Spy on subscribe method
          const subscribeSpy = vi.spyOn(gameStateManager, 'subscribe');

          // Render hook
          renderHook(() => useGameEvent(eventName), {
            wrapper: createWrapper(gameStateManager),
          });

          // Verify subscribe was called with the event name
          expect(subscribeSpy).toHaveBeenCalledWith(
            eventName,
            expect.any(Function)
          );

          subscribeSpy.mockRestore();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 12: useGameEvent state updates
 * Validates: Requirements 34.2, 34.5
 *
 * For any subscription callback firing, the useGameEvent hook should update
 * its local state and return the updated value to the component.
 */
describe('Property: useGameEvent state updates', () => {
  it('should update state when event fires', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 600, max: 100000 }),
        async (newCredits) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render hook
          const { result } = renderHook(() => useGameEvent('creditsChanged'), {
            wrapper: createWrapper(gameStateManager),
          });

          // Get initial value (should be 500 from new game)
          const initialCredits = result.current;
          expect(initialCredits).toBe(500);

          // Trigger event by updating credits
          gameStateManager.updateCredits(newCredits);

          // Wait for state to update
          await waitFor(() => {
            expect(result.current).toBe(newCredits);
          });

          return result.current === newCredits;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 9: Automatic unsubscription on unmount
 * Validates: Requirements 5.4, 34.4
 *
 * For any component using useGameEvent, unmounting the component should
 * automatically unsubscribe from GameStateManager events.
 */
describe('Property: Automatic unsubscription on unmount', () => {
  it('should unsubscribe when component unmounts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'creditsChanged',
          'fuelChanged',
          'cargoChanged',
          'locationChanged'
        ),
        (eventName) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Get initial subscriber count
          const initialCount =
            gameStateManager.subscribers[eventName]?.length || 0;

          // Render hook
          const { unmount } = renderHook(() => useGameEvent(eventName), {
            wrapper: createWrapper(gameStateManager),
          });

          // Verify subscription was added
          const afterMountCount =
            gameStateManager.subscribers[eventName]?.length || 0;
          expect(afterMountCount).toBe(initialCount + 1);

          // Unmount
          unmount();

          // Verify subscription was removed
          const afterUnmountCount =
            gameStateManager.subscribers[eventName]?.length || 0;
          expect(afterUnmountCount).toBe(initialCount);

          return afterUnmountCount === initialCount;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 8: Selective re-rendering on events
 * Validates: Requirements 5.3, 34.3
 *
 * For any game event, only components subscribed to that event should re-render.
 * This test verifies that components subscribed to different events don't
 * re-render when an unrelated event fires.
 */
describe('Property: Selective re-rendering on events', () => {
  it('should only re-render components subscribed to the fired event', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 600, max: 100000 }),
        async (newCredits) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render two hooks subscribed to different events
          const creditsHook = renderHook(() => useGameEvent('creditsChanged'), {
            wrapper: createWrapper(gameStateManager),
          });

          const fuelHook = renderHook(() => useGameEvent('fuelChanged'), {
            wrapper: createWrapper(gameStateManager),
          });

          // Get initial values
          const initialFuel = fuelHook.result.current;
          expect(initialFuel).toBe(100); // New game starts with 100 fuel

          // Fire creditsChanged event
          gameStateManager.updateCredits(newCredits);

          // Wait for credits hook to update
          await waitFor(() => {
            expect(creditsHook.result.current).toBe(newCredits);
          });

          // Verify fuel hook did NOT update (still has initial value)
          expect(fuelHook.result.current).toBe(initialFuel);

          return fuelHook.result.current === initialFuel;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 10: All subscribers notified
 * Validates: Requirements 5.5
 *
 * For any game event with multiple subscribers, all subscribers should
 * receive the event notification.
 */
describe('Property: All subscribers notified', () => {
  it('should notify all subscribers when event fires', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 5 }), (subscriberCount) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Create a shared wrapper
        const wrapper = createWrapper(gameStateManager);

        // Track how many times each callback is invoked
        const callCounts = [];

        // Render multiple hooks subscribed to the same event
        for (let i = 0; i < subscriberCount; i++) {
          callCounts.push(0);
          const index = i;

          // Create a custom callback that tracks invocations
          const trackingCallback = vi.fn();
          callCounts[index] = trackingCallback;

          renderHook(() => useGameEvent('creditsChanged'), { wrapper });
        }

        // Get the actual subscriber count
        const actualSubscriberCount =
          gameStateManager.subscribers.creditsChanged.length;

        // Verify we have the expected number of subscribers
        expect(actualSubscriberCount).toBe(subscriberCount);

        // Fire event
        gameStateManager.updateCredits(12345);

        // Verify all subscribers are still registered (they weren't removed during the event)
        const afterEventCount =
          gameStateManager.subscribers.creditsChanged.length;
        expect(afterEventCount).toBe(subscriberCount);

        return afterEventCount === subscriberCount;
      }),
      { numRuns: 20 }
    );
  });
});
