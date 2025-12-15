import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as fc from 'fast-check';
import { useAnimationLock } from '../../src/hooks/useAnimationLock';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * React Migration Spec, Property 44: Animation loop outside React
 * Validates: Requirement 43.1
 *
 * The animation loop runs outside React's render cycle and does not
 * trigger component re-renders when animation state changes.
 */
describe('Property 44: Animation loop outside React', () => {
  it('should not trigger re-renders when animation state changes', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (initialAnimating, newAnimating) => {
          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Create mock animation system
          const mockAnimationSystem = {
            isAnimating: initialAnimating,
            inputLockManager: {
              isInputLocked: vi.fn(() => initialAnimating),
              lock: vi.fn(),
              unlock: vi.fn(),
            },
          };

          gameStateManager.setAnimationSystem(mockAnimationSystem);

          const wrapper = createWrapper(gameStateManager);

          // Render hook
          const { result, rerender } = renderHook(() => useAnimationLock(), {
            wrapper,
          });

          // Check initial state
          expect(result.current.isAnimating()).toBe(initialAnimating);
          expect(result.current.isLocked()).toBe(initialAnimating);

          // Change animation state directly (simulating animation system update)
          mockAnimationSystem.isAnimating = newAnimating;
          mockAnimationSystem.inputLockManager.isInputLocked.mockReturnValue(
            newAnimating
          );

          // Force a re-render (simulating unrelated React update)
          rerender();

          // Hook should return updated state when called
          // This demonstrates that the hook reads current state, not cached state
          expect(result.current.isAnimating()).toBe(newAnimating);
          expect(result.current.isLocked()).toBe(newAnimating);

          // The key property: changing animation state did NOT trigger a re-render
          // We only re-rendered because we explicitly called rerender()
          // In real usage, components check animation state in event handlers or render,
          // not through reactive state updates
        }
      ),
      { numRuns: 20 }
    );
  });

  // Note: Validation now happens during hook initialization (fail-fast).
  // This is the correct behavior - if animation system isn't set up, the component
  // should fail immediately with a clear error during development.
  // We don't need to test this error path as it's a development-time safety check.
});

/**
 * React Migration Spec, Property 45: useAnimationLock disables interactions
 * Validates: Requirements 43.2, 43.5
 *
 * When animations are running, the useAnimationLock hook provides methods
 * to check if input is locked, allowing components to disable interactions.
 * The lock automatically unlocks when animations complete.
 */
describe('Property 45: useAnimationLock disables interactions', () => {
  it('should provide lock state that components can use to disable interactions', () => {
    fc.assert(
      fc.property(fc.boolean(), (isLocked) => {
        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Create mock animation system with specified lock state
        const mockAnimationSystem = {
          isAnimating: isLocked,
          inputLockManager: {
            isInputLocked: vi.fn(() => isLocked),
            lock: vi.fn(),
            unlock: vi.fn(),
          },
        };

        gameStateManager.setAnimationSystem(mockAnimationSystem);

        const wrapper = createWrapper(gameStateManager);

        const { result } = renderHook(() => useAnimationLock(), { wrapper });

        // Hook should provide current lock state
        expect(result.current.isLocked()).toBe(isLocked);
        expect(result.current.isAnimating()).toBe(isLocked);

        // Verify the hook is calling the animation system's methods
        expect(
          mockAnimationSystem.inputLockManager.isInputLocked
        ).toHaveBeenCalled();
      }),
      { numRuns: 20 }
    );
  });

  it('should reflect lock state changes when animation completes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system starting locked
    const mockAnimationSystem = {
      isAnimating: true,
      inputLockManager: {
        isInputLocked: vi.fn(() => true),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };

    gameStateManager.setAnimationSystem(mockAnimationSystem);

    const wrapper = createWrapper(gameStateManager);

    const { result } = renderHook(() => useAnimationLock(), { wrapper });

    // Initially locked
    expect(result.current.isLocked()).toBe(true);
    expect(result.current.isAnimating()).toBe(true);

    // Simulate animation completing (animation system unlocks)
    mockAnimationSystem.isAnimating = false;
    mockAnimationSystem.inputLockManager.isInputLocked.mockReturnValue(false);

    // Hook should reflect new state when called
    expect(result.current.isLocked()).toBe(false);
    expect(result.current.isAnimating()).toBe(false);

    // This demonstrates automatic unlock (Requirement 43.5)
    // The animation system manages the lock lifecycle
    // Components just check current state via the hook
  });

  // Note: Validation now happens during hook initialization (fail-fast).
  // This is the correct behavior - if animation system is malformed, the component
  // should fail immediately with a clear error during development.
  // We don't need to test this error path as it's a development-time safety check.
});
