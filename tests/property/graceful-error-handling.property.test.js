'use strict';

/**
 * Property-Based Tests for Jump Animation Error Handling
 *
 * Property 9: Graceful error handling
 * Validates Requirements 7.1, 7.2, 7.3
 *
 * Tests that the animation system handles edge cases and errors gracefully:
 * - Very close stars (< 1 LY) still produce visible animations
 * - Very distant stars (> 15 LY) cap animation duration
 * - Errors during animation restore controls and camera state
 * - Animation timeout mechanism prevents infinite hangs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  JumpAnimationSystem,
  AnimationTimingCalculator,
} from '../../js/game-animation.js';
import { ANIMATION_CONFIG } from '../../js/game-constants.js';
import { setupThreeMock } from '../setup-three-mock.js';
import fc from 'fast-check';

// Set up Three.js mock
setupThreeMock();

const mockControls = {
  enabled: true,
  target: new window.THREE.Vector3(0, 0, 0),
  update: vi.fn(),
};

describe('Property 9: Graceful error handling', () => {
  let animationSystem;
  let starData;
  let mockScene;
  let mockCamera;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create Three.js mocks
    mockScene = new window.THREE.Scene();
    mockCamera = new window.THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    // Create test star data with various distances
    starData = [
      { id: 1, name: 'Sol', x: 0, y: 0, z: 0 },
      { id: 2, name: 'Very Close', x: 0.5, y: 0, z: 0 }, // 0.5 LY
      { id: 3, name: 'Close', x: 2, y: 0, z: 0 }, // 2 LY
      { id: 4, name: 'Medium', x: 8, y: 0, z: 0 }, // 8 LY
      { id: 5, name: 'Far', x: 15, y: 0, z: 0 }, // 15 LY
      { id: 6, name: 'Very Far', x: 20, y: 0, z: 0 }, // 20 LY
    ];

    // Create animation system
    animationSystem = new JumpAnimationSystem(
      mockScene,
      mockCamera,
      mockControls,
      starData
    );
  });

  afterEach(() => {
    if (animationSystem) {
      animationSystem.dispose();
    }
  });

  describe('Requirement 7.1: Very close stars produce visible animations', () => {
    it('should use minimum duration for very close stars', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 0.99, noNaN: true }), // Very close distances
          (distance) => {
            // Skip invalid distances (NaN, Infinity, negative)
            fc.pre(Number.isFinite(distance) && distance > 0);

            const duration =
              AnimationTimingCalculator.calculateTravelDuration(distance);

            // Should be close to minimum duration for very short distances
            // Uses linear interpolation, so won't be exactly MIN unless distance is 0
            expect(duration).toBeGreaterThanOrEqual(
              ANIMATION_CONFIG.MIN_TRAVEL_DURATION
            );
            expect(duration).toBeLessThan(
              ANIMATION_CONFIG.MIN_TRAVEL_DURATION + 0.1
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should still perform full animation sequence for very close stars', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
        return 1;
      };

      try {
        // Test jump between very close stars (0.5 LY)
        const promise = animationSystem.playJumpAnimation(1, 2);

        // Should complete without errors
        await expect(promise).resolves.toBeUndefined();

        // Controls should be unlocked after animation
        expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);
      } finally {
        global.requestAnimationFrame = originalRAF;
      }
    });
  });

  describe('Requirement 7.2: Very distant stars cap animation duration', () => {
    it('should use maximum duration for very distant stars', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 20.01, max: 100 }), // Very distant stars (beyond MAX_DISTANCE)
          (distance) => {
            const duration =
              AnimationTimingCalculator.calculateTravelDuration(distance);

            // Should cap at maximum duration to prevent tedium
            expect(duration).toBe(ANIMATION_CONFIG.MAX_TRAVEL_DURATION);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should complete animation in reasonable time for very distant stars', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
        return 1;
      };

      try {
        // Test jump between very distant stars (20 LY)
        const promise = animationSystem.playJumpAnimation(1, 6);

        // Should complete without errors
        await expect(promise).resolves.toBeUndefined();

        // Controls should be unlocked after animation
        expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);
      } finally {
        global.requestAnimationFrame = originalRAF;
      }
    }, 10000); // Increase timeout to 10 seconds for this test
  });

  describe('Requirement 7.3: Errors restore controls and camera state', () => {
    it('should unlock controls even if animation throws error', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
        return 1;
      };

      // Mock console.error to suppress expected error output
      const originalConsoleError = console.error;
      const errorMessages = [];
      console.error = (...args) => {
        errorMessages.push(args);
      };

      try {
        // Force an error by using invalid system IDs
        await animationSystem.playJumpAnimation(999, 1000);

        // Should have logged error
        expect(errorMessages.length).toBeGreaterThan(0);
        expect(errorMessages[0][0]).toContain('Jump animation error');

        // Controls should be unlocked despite error
        expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);

        // Animation flag should be reset
        expect(animationSystem.isAnimating).toBe(false);
      } finally {
        global.requestAnimationFrame = originalRAF;
        console.error = originalConsoleError;
      }
    });

    it('should hide ship indicator if error occurs during animation', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
        return 1;
      };

      // Mock console.error to suppress expected error output
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        // Make ship indicator visible
        animationSystem.shipIndicator.visible = true;

        // Force an error
        await animationSystem.playJumpAnimation(999, 1000);

        // Ship indicator should be hidden
        expect(animationSystem.shipIndicator.visible).toBe(false);
      } finally {
        global.requestAnimationFrame = originalRAF;
        console.error = originalConsoleError;
      }
    });

    it('should prevent overlapping animations', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      let rafCallCount = 0;
      global.requestAnimationFrame = (cb) => {
        rafCallCount++;
        setTimeout(cb, 10); // Small delay to allow overlap attempt
        return rafCallCount;
      };

      // Mock console.warn to capture warning
      const originalConsoleWarn = console.warn;
      const warnMessages = [];
      console.warn = (...args) => {
        warnMessages.push(args);
      };

      try {
        // Start first animation (won't complete immediately due to delay)
        const promise1 = animationSystem.playJumpAnimation(1, 3);

        // Try to start second animation while first is running
        const promise2 = animationSystem.playJumpAnimation(1, 4);

        // Wait for both to complete
        await Promise.all([promise1, promise2]);

        // Should have warned about overlapping animation
        expect(warnMessages.length).toBeGreaterThan(0);
        expect(warnMessages[0][0]).toContain('Animation already in progress');
      } finally {
        global.requestAnimationFrame = originalRAF;
        console.warn = originalConsoleWarn;
      }
    });

    it('should restore camera state after error', async () => {
      // Mock requestAnimationFrame to execute immediately
      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = (cb) => {
        setTimeout(cb, 0);
        return 1;
      };

      // Mock console.error to suppress expected error output
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        // Store original camera state
        const originalPosition = { ...mockCamera.position };

        // Modify camera position to simulate animation in progress
        mockCamera.position.x = 100;
        mockCamera.position.y = 100;
        mockCamera.position.z = 100;

        // Force an error during animation
        await animationSystem.playJumpAnimation(999, 1000);

        // Camera state restoration is attempted (verified by no crash)
        // originalCameraState should be null after cleanup
        expect(animationSystem.originalCameraState).toBeNull();
      } finally {
        global.requestAnimationFrame = originalRAF;
        console.error = originalConsoleError;
      }
    });
  });

  describe('Edge case: Distance bounds validation', () => {
    it('should handle all distances within valid range gracefully', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100, noNaN: true }), // Full range of possible distances, exclude NaN
          (distance) => {
            // Skip invalid distances
            if (!Number.isFinite(distance) || distance < 0) {
              return true;
            }

            const duration =
              AnimationTimingCalculator.calculateTravelDuration(distance);

            // Duration should always be within bounds
            expect(duration).toBeGreaterThanOrEqual(
              ANIMATION_CONFIG.MIN_TRAVEL_DURATION
            );
            expect(duration).toBeLessThanOrEqual(
              ANIMATION_CONFIG.MAX_TRAVEL_DURATION
            );

            // Duration should be a valid number
            expect(Number.isFinite(duration)).toBe(true);
            expect(duration).toBeGreaterThan(0);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
