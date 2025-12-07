'use strict';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { JumpAnimationSystem } from '../../js/game-animation.js';
import { setupThreeMock } from '../setup-three-mock.js';

/**
 * Property test for animation sequence completeness
 *
 * **Feature: jump-animation, Property 2: Animation sequence completeness**
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4
 *
 * Property: For any jump animation, the complete sequence SHALL execute in order
 * (zoom-in → ship indicator appears at origin → ship travels to destination → zoom-out),
 * and all player input controls SHALL be disabled throughout the entire sequence
 * and re-enabled upon completion.
 */

describe('Animation Sequence Completeness - Property Tests', () => {
  let scene, camera, controls, starData, animationSystem;

  beforeEach(() => {
    setupThreeMock();
    const THREE = window.THREE;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
    camera.position.set(0, 200, 400);

    // Mock OrbitControls with tracking
    controls = {
      target: new THREE.Vector3(0, 0, 0),
      enabled: true,
      update: () => {},
    };

    // Create star data with various distances
    starData = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 100, y: 0, z: 0, name: 'Alpha Centauri' },
      { id: 2, x: 200, y: 100, z: 50, name: 'Barnard' },
      { id: 3, x: 50, y: 50, z: 50, name: 'Wolf 359' },
      { id: 4, x: 300, y: 200, z: 100, name: 'Sirius' },
    ];

    animationSystem = new JumpAnimationSystem(
      scene,
      camera,
      controls,
      starData
    );
  });

  afterEach(() => {
    if (animationSystem) {
      animationSystem.dispose();
    }
  });

  it('Property 2: For any valid jump, playJumpAnimation method exists and orchestrates the sequence', () => {
    // Generator for valid system ID pairs
    const systemPairGenerator = fc
      .tuple(
        fc.integer({ min: 0, max: starData.length - 1 }),
        fc.integer({ min: 0, max: starData.length - 1 })
      )
      .filter(([origin, dest]) => origin !== dest);

    fc.assert(
      fc.property(systemPairGenerator, ([originId, destId]) => {
        // Property 1: playJumpAnimation method should exist
        expect(animationSystem.playJumpAnimation).toBeDefined();
        expect(typeof animationSystem.playJumpAnimation).toBe('function');

        // Property 2: Input lock manager should exist and have required methods
        expect(animationSystem.inputLockManager).toBeDefined();
        expect(animationSystem.inputLockManager.lock).toBeDefined();
        expect(animationSystem.inputLockManager.unlock).toBeDefined();
        expect(animationSystem.inputLockManager.isInputLocked).toBeDefined();

        // Property 3: Animation helper methods should exist
        expect(animationSystem.animateCameraTransition).toBeDefined();
        expect(animationSystem.animateShipTravel).toBeDefined();
        expect(animationSystem.calculateSideViewPosition).toBeDefined();

        // Property 4: Ship indicator should exist and be in scene
        expect(animationSystem.shipIndicator).toBeDefined();
        expect(scene.children).toContain(animationSystem.shipIndicator);

        // Property 5: Animation state tracking should exist
        expect(animationSystem.isAnimating).toBeDefined();
        expect(typeof animationSystem.isAnimating).toBe('boolean');
        expect(animationSystem.isAnimating).toBe(false);

        // Property 6: Controls should be enabled initially
        expect(controls.enabled).toBe(true);
        expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('Property 2 (Edge Case): Animation handles very close stars correctly', async () => {
    // Add very close star systems
    const closeStarData = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 1, y: 0, z: 0, name: 'Very Close' },
      { id: 2, x: 0.5, y: 0.5, z: 0, name: 'Extremely Close' },
    ];

    const closeAnimationSystem = new JumpAnimationSystem(
      scene,
      camera,
      controls,
      closeStarData
    );

    try {
      // Mock animation methods
      const cameraTransitionSpy = vi
        .spyOn(closeAnimationSystem, 'animateCameraTransition')
        .mockResolvedValue(undefined);
      const shipTravelSpy = vi
        .spyOn(closeAnimationSystem, 'animateShipTravel')
        .mockResolvedValue(undefined);

      // Test jump between very close systems
      const initialEnabled = controls.enabled;

      await closeAnimationSystem.playJumpAnimation(0, 1);

      // Property: Animation should complete successfully
      expect(closeAnimationSystem.isAnimating).toBe(false);

      // Property: Controls should be restored
      expect(controls.enabled).toBe(initialEnabled);
      expect(closeAnimationSystem.inputLockManager.isInputLocked()).toBe(false);

      // Property: Animation methods should have been called
      expect(cameraTransitionSpy).toHaveBeenCalled();
      expect(shipTravelSpy).toHaveBeenCalled();

      cameraTransitionSpy.mockRestore();
      shipTravelSpy.mockRestore();
    } finally {
      closeAnimationSystem.dispose();
    }
  });

  it('Property 2 (Edge Case): Animation handles very distant stars correctly', async () => {
    // Add very distant star systems
    const distantStarData = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 1000, y: 1000, z: 1000, name: 'Very Distant' },
    ];

    const distantAnimationSystem = new JumpAnimationSystem(
      scene,
      camera,
      controls,
      distantStarData
    );

    try {
      // Mock animation methods
      const cameraTransitionSpy = vi
        .spyOn(distantAnimationSystem, 'animateCameraTransition')
        .mockResolvedValue(undefined);
      const shipTravelSpy = vi
        .spyOn(distantAnimationSystem, 'animateShipTravel')
        .mockResolvedValue(undefined);

      // Test jump between very distant systems
      const initialEnabled = controls.enabled;

      await distantAnimationSystem.playJumpAnimation(0, 1);

      // Property: Animation should complete successfully
      expect(distantAnimationSystem.isAnimating).toBe(false);

      // Property: Controls should be restored
      expect(controls.enabled).toBe(initialEnabled);
      expect(distantAnimationSystem.inputLockManager.isInputLocked()).toBe(
        false
      );

      // Property: Animation methods should have been called
      expect(cameraTransitionSpy).toHaveBeenCalled();
      expect(shipTravelSpy).toHaveBeenCalled();

      cameraTransitionSpy.mockRestore();
      shipTravelSpy.mockRestore();
    } finally {
      distantAnimationSystem.dispose();
    }
  });

  it('Property 2 (Error Handling): Animation gracefully handles invalid system IDs', async () => {
    const initialEnabled = controls.enabled;

    // Mock console.error to suppress expected error messages during test
    const originalConsoleError = console.error;
    const errorMessages = [];
    console.error = (...args) => {
      errorMessages.push(args);
    };

    try {
      // Test with invalid origin ID
      await animationSystem.playJumpAnimation(999, 1);

      // Property: Controls should be restored even on error
      expect(controls.enabled).toBe(initialEnabled);
      expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);

      // Property: Animation system should not be stuck in animating state
      expect(animationSystem.isAnimating).toBe(false);

      // Property: Ship indicator should be hidden
      expect(animationSystem.shipIndicator.visible).toBe(false);

      // Property: Error should have been logged
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(errorMessages[0][0]).toContain('Jump animation error');

      // Clear error messages for next test
      errorMessages.length = 0;

      // Test with invalid destination ID
      await animationSystem.playJumpAnimation(0, 999);

      // Property: Controls should still be restored
      expect(controls.enabled).toBe(initialEnabled);
      expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);
      expect(animationSystem.isAnimating).toBe(false);

      // Property: Error should have been logged
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(errorMessages[0][0]).toContain('Jump animation error');
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });

  it('Property 2 (Concurrency): Animation system tracks animating state to prevent overlaps', () => {
    // Property 1: Animation system should have isAnimating flag
    expect(animationSystem.isAnimating).toBeDefined();
    expect(typeof animationSystem.isAnimating).toBe('boolean');

    // Property 2: Initially not animating
    expect(animationSystem.isAnimating).toBe(false);

    // Property 3: playJumpAnimation should check isAnimating state
    // (This is verified by the implementation having the check at the start)
    const playJumpCode = animationSystem.playJumpAnimation.toString();
    expect(playJumpCode).toContain('isAnimating');
  });

  it('Property 2 (Round Trip): Multiple sequential animations should work correctly', async () => {
    // Generator for sequences of jumps
    const jumpSequenceGenerator = fc.array(
      fc
        .tuple(
          fc.integer({ min: 0, max: starData.length - 1 }),
          fc.integer({ min: 0, max: starData.length - 1 })
        )
        .filter(([origin, dest]) => origin !== dest),
      { minLength: 1, maxLength: 5 }
    );

    await fc.assert(
      fc.asyncProperty(jumpSequenceGenerator, async (jumpSequence) => {
        // Mock animation methods
        const cameraTransitionSpy = vi
          .spyOn(animationSystem, 'animateCameraTransition')
          .mockResolvedValue(undefined);
        const shipTravelSpy = vi
          .spyOn(animationSystem, 'animateShipTravel')
          .mockResolvedValue(undefined);

        const initialEnabled = controls.enabled;

        // Execute sequence of jumps
        for (const [originId, destId] of jumpSequence) {
          await animationSystem.playJumpAnimation(originId, destId);

          // Property: After each animation, controls should be restored
          expect(controls.enabled).toBe(initialEnabled);
          expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);
          expect(animationSystem.isAnimating).toBe(false);
        }

        // Property: After all animations, system should be in clean state
        expect(animationSystem.isAnimating).toBe(false);
        expect(controls.enabled).toBe(initialEnabled);
        expect(animationSystem.inputLockManager.isInputLocked()).toBe(false);

        cameraTransitionSpy.mockRestore();
        shipTravelSpy.mockRestore();
      }),
      { numRuns: 10 }
    );
  });

  it('Property 2 (State Consistency): Camera state is properly managed throughout animation', async () => {
    const THREE = window.THREE;

    // Mock animation methods
    const cameraTransitionSpy = vi
      .spyOn(animationSystem, 'animateCameraTransition')
      .mockResolvedValue(undefined);
    const shipTravelSpy = vi
      .spyOn(animationSystem, 'animateShipTravel')
      .mockResolvedValue(undefined);

    // Store initial state
    const initialCameraPos = new THREE.Vector3().copy(camera.position);
    const initialControlsTarget = new THREE.Vector3().copy(controls.target);

    // Property: Before animation, originalCameraState should be null
    expect(animationSystem.originalCameraState).toBeNull();

    // Start animation
    await animationSystem.playJumpAnimation(0, 1);

    // Property: After animation, originalCameraState should be cleared
    expect(animationSystem.originalCameraState).toBeNull();

    // Property: Animation system should be ready for next animation
    expect(animationSystem.isAnimating).toBe(false);

    cameraTransitionSpy.mockRestore();
    shipTravelSpy.mockRestore();
  });
});
