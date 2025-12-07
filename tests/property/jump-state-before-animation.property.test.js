'use strict';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';
import { JumpAnimationSystem } from '../../js/game-animation.js';
import { setupThreeMock } from '../setup-three-mock.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Property test for state-before-animation consistency
 *
 * **Feature: jump-animation, Property 1: State-before-animation consistency**
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 *
 * Property: For any valid jump, the game state (fuel, location, time) SHALL be updated
 * and auto-saved before the animation begins, and the HUD SHALL display the updated values
 * during animation, ensuring no progress is lost if the animation is interrupted.
 */

describe('State-Before-Animation Consistency - Property Tests', () => {
  let gameStateManager, navigationSystem, animationSystem;
  let scene, camera, controls;

  beforeEach(() => {
    setupThreeMock();
    const THREE = window.THREE;

    // Initialize game state manager
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Initialize navigation system
    navigationSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Initialize animation system
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
    camera.position.set(0, 200, 400);

    controls = {
      target: new THREE.Vector3(0, 0, 0),
      enabled: true,
      update: () => {},
    };

    animationSystem = new JumpAnimationSystem(
      scene,
      camera,
      controls,
      TEST_STAR_DATA
    );
  });

  afterEach(() => {
    if (animationSystem) {
      animationSystem.dispose();
    }
  });

  it('Property 1: For any valid jump, game state updates before animation begins', async () => {
    // Generator for valid connected jumps
    const validJumpGenerator = fc
      .integer({ min: 0, max: TEST_STAR_DATA.length - 1 })
      .chain((originId) => {
        const connectedSystems = navigationSystem.getConnectedSystems(originId);
        if (connectedSystems.length === 0) {
          return fc.constant(null);
        }
        return fc
          .constantFrom(...connectedSystems)
          .map((destId) => ({ originId, destId }));
      })
      .filter((jump) => jump !== null);

    await fc.assert(
      fc.asyncProperty(validJumpGenerator, async ({ originId, destId }) => {
        // Setup: Position player at origin system with sufficient fuel
        gameStateManager.updateLocation(originId);
        gameStateManager.updateFuel(100);
        gameStateManager.updateTime(0);

        // Get initial state
        const initialFuel = gameStateManager.getState().ship.fuel;
        const initialTime = gameStateManager.getState().player.daysElapsed;
        const initialLocation =
          gameStateManager.getState().player.currentSystem;

        // Calculate expected changes
        const originStar = TEST_STAR_DATA.find((s) => s.id === originId);
        const destStar = TEST_STAR_DATA.find((s) => s.id === destId);
        const distance = navigationSystem.calculateDistanceBetween(
          originStar,
          destStar
        );
        const expectedFuelCost = navigationSystem.calculateFuelCost(distance);
        const expectedJumpTime = navigationSystem.calculateJumpTime(distance);

        // Track when state changes occur relative to animation
        let stateUpdatedBeforeAnimation = false;
        let animationStarted = false;

        // Mock animation to track when it starts
        const originalPlayAnimation =
          animationSystem.playJumpAnimation.bind(animationSystem);
        animationSystem.playJumpAnimation = async (origin, dest) => {
          animationStarted = true;

          // Check if state was already updated when animation starts
          const currentFuel = gameStateManager.getState().ship.fuel;
          const currentTime = gameStateManager.getState().player.daysElapsed;
          const currentLocation =
            gameStateManager.getState().player.currentSystem;

          if (
            currentFuel === initialFuel - expectedFuelCost &&
            currentTime === initialTime + expectedJumpTime &&
            currentLocation === destId
          ) {
            stateUpdatedBeforeAnimation = true;
          }

          // Don't actually run the animation (would take time)
          return Promise.resolve();
        };

        // Execute jump
        const result = await navigationSystem.executeJump(
          gameStateManager,
          destId,
          animationSystem
        );

        // Property 1: Jump should succeed
        expect(result.success).toBe(true);

        // Property 2: Animation should have been triggered
        expect(animationStarted).toBe(true);

        // Property 3: State should have been updated BEFORE animation started
        expect(stateUpdatedBeforeAnimation).toBe(true);

        // Property 4: Final state should reflect the jump
        const finalState = gameStateManager.getState();
        expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
        expect(finalState.player.daysElapsed).toBe(
          initialTime + expectedJumpTime
        );
        expect(finalState.player.currentSystem).toBe(destId);

        // Restore original animation method
        animationSystem.playJumpAnimation = originalPlayAnimation;
      }),
      { numRuns: 20 }
    );
  });

  it('Property 1: For any valid jump, auto-save occurs before animation begins', async () => {
    // Generator for valid connected jumps
    const validJumpGenerator = fc
      .integer({ min: 0, max: TEST_STAR_DATA.length - 1 })
      .chain((originId) => {
        const connectedSystems = navigationSystem.getConnectedSystems(originId);
        if (connectedSystems.length === 0) {
          return fc.constant(null);
        }
        return fc
          .constantFrom(...connectedSystems)
          .map((destId) => ({ originId, destId }));
      })
      .filter((jump) => jump !== null);

    await fc.assert(
      fc.asyncProperty(validJumpGenerator, async ({ originId, destId }) => {
        // Setup: Position player at origin system with sufficient fuel
        gameStateManager.updateLocation(originId);
        gameStateManager.updateFuel(100);
        gameStateManager.updateTime(0);

        // Track when save occurs relative to animation
        let saveCalledBeforeAnimation = false;
        let animationStarted = false;

        // Spy on saveGame method
        const originalSaveGame =
          gameStateManager.saveGame.bind(gameStateManager);
        gameStateManager.saveGame = () => {
          if (!animationStarted) {
            saveCalledBeforeAnimation = true;
          }
          return originalSaveGame();
        };

        // Mock animation to track when it starts
        const originalPlayAnimation =
          animationSystem.playJumpAnimation.bind(animationSystem);
        animationSystem.playJumpAnimation = async (origin, dest) => {
          animationStarted = true;
          return Promise.resolve();
        };

        // Execute jump
        const result = await navigationSystem.executeJump(
          gameStateManager,
          destId,
          animationSystem
        );

        // Property 1: Jump should succeed
        expect(result.success).toBe(true);

        // Property 2: Save should have been called before animation started
        expect(saveCalledBeforeAnimation).toBe(true);

        // Restore original methods
        gameStateManager.saveGame = originalSaveGame;
        animationSystem.playJumpAnimation = originalPlayAnimation;
      }),
      { numRuns: 20 }
    );
  });

  it('Property 1: State remains valid even if animation is interrupted', async () => {
    // Setup: Position player at Sol with sufficient fuel
    gameStateManager.updateLocation(0);
    gameStateManager.updateFuel(100);
    gameStateManager.updateTime(0);

    const initialFuel = gameStateManager.getState().ship.fuel;
    const initialTime = gameStateManager.getState().player.daysElapsed;

    // Calculate expected changes for jump to Alpha Centauri (system 1)
    const originStar = TEST_STAR_DATA.find((s) => s.id === 0);
    const destStar = TEST_STAR_DATA.find((s) => s.id === 1);
    const distance = navigationSystem.calculateDistanceBetween(
      originStar,
      destStar
    );
    const expectedFuelCost = navigationSystem.calculateFuelCost(distance);
    const expectedJumpTime = navigationSystem.calculateJumpTime(distance);

    // Mock animation to simulate interruption (throw error)
    const originalPlayAnimation =
      animationSystem.playJumpAnimation.bind(animationSystem);
    animationSystem.playJumpAnimation = async (origin, dest) => {
      // Simulate animation error
      throw new Error('Animation interrupted');
    };

    // Mock console.error to suppress expected error messages
    const originalConsoleError = console.error;
    const errorMessages = [];
    console.error = (...args) => {
      errorMessages.push(args);
    };

    try {
      // Execute jump (animation will fail and throw error)
      try {
        await navigationSystem.executeJump(
          gameStateManager,
          1,
          animationSystem
        );
        // Should not reach here
        expect.fail('Expected animation to throw error');
      } catch (error) {
        // Property 1: Animation error should be thrown
        expect(error.message).toBe('Animation interrupted');
      }

      // Property 2: State should be updated despite animation failure
      // This is the key property - state updates happen BEFORE animation
      const finalState = gameStateManager.getState();
      expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
      expect(finalState.player.daysElapsed).toBe(
        initialTime + expectedJumpTime
      );
      expect(finalState.player.currentSystem).toBe(1);

      // Property 3: Game should be in valid state (can load from save)
      const savedState = gameStateManager.getState();
      expect(gameStateManager.validateStateStructure(savedState)).toBe(true);
    } finally {
      // Restore original methods
      animationSystem.playJumpAnimation = originalPlayAnimation;
      console.error = originalConsoleError;
    }
  });

  it('Property 1: Jump without animation system still updates state correctly', async () => {
    // Generator for valid connected jumps
    const validJumpGenerator = fc
      .integer({ min: 0, max: TEST_STAR_DATA.length - 1 })
      .chain((originId) => {
        const connectedSystems = navigationSystem.getConnectedSystems(originId);
        if (connectedSystems.length === 0) {
          return fc.constant(null);
        }
        return fc
          .constantFrom(...connectedSystems)
          .map((destId) => ({ originId, destId }));
      })
      .filter((jump) => jump !== null);

    await fc.assert(
      fc.asyncProperty(validJumpGenerator, async ({ originId, destId }) => {
        // Setup: Position player at origin system with sufficient fuel
        gameStateManager.updateLocation(originId);
        gameStateManager.updateFuel(100);
        gameStateManager.updateTime(0);

        const initialFuel = gameStateManager.getState().ship.fuel;
        const initialTime = gameStateManager.getState().player.daysElapsed;

        // Calculate expected changes
        const originStar = TEST_STAR_DATA.find((s) => s.id === originId);
        const destStar = TEST_STAR_DATA.find((s) => s.id === destId);
        const distance = navigationSystem.calculateDistanceBetween(
          originStar,
          destStar
        );
        const expectedFuelCost = navigationSystem.calculateFuelCost(distance);
        const expectedJumpTime = navigationSystem.calculateJumpTime(distance);

        // Execute jump WITHOUT animation system (null)
        const result = await navigationSystem.executeJump(
          gameStateManager,
          destId,
          null
        );

        // Property 1: Jump should succeed
        expect(result.success).toBe(true);

        // Property 2: State should be updated correctly
        const finalState = gameStateManager.getState();
        expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
        expect(finalState.player.daysElapsed).toBe(
          initialTime + expectedJumpTime
        );
        expect(finalState.player.currentSystem).toBe(destId);
      }),
      { numRuns: 20 }
    );
  });

  it('Property 1 (Edge Case): State updates correctly for very short jumps', async () => {
    // Find two very close connected systems
    const closeJump = { originId: 0, destId: 1 }; // Sol to Alpha Centauri

    // Setup
    gameStateManager.updateLocation(closeJump.originId);
    gameStateManager.updateFuel(100);
    gameStateManager.updateTime(0);

    const initialFuel = gameStateManager.getState().ship.fuel;
    const initialTime = gameStateManager.getState().player.daysElapsed;

    // Calculate expected changes
    const originStar = TEST_STAR_DATA.find((s) => s.id === closeJump.originId);
    const destStar = TEST_STAR_DATA.find((s) => s.id === closeJump.destId);
    const distance = navigationSystem.calculateDistanceBetween(
      originStar,
      destStar
    );
    const expectedFuelCost = navigationSystem.calculateFuelCost(distance);
    const expectedJumpTime = navigationSystem.calculateJumpTime(distance);

    // Mock animation
    const originalPlayAnimation =
      animationSystem.playJumpAnimation.bind(animationSystem);
    animationSystem.playJumpAnimation = async () => Promise.resolve();

    // Execute jump
    const result = await navigationSystem.executeJump(
      gameStateManager,
      closeJump.destId,
      animationSystem
    );

    // Property: State should be updated correctly even for short jumps
    expect(result.success).toBe(true);
    const finalState = gameStateManager.getState();
    expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
    expect(finalState.player.daysElapsed).toBe(initialTime + expectedJumpTime);
    expect(finalState.player.currentSystem).toBe(closeJump.destId);

    // Restore
    animationSystem.playJumpAnimation = originalPlayAnimation;
  });

  it('Property 1 (Edge Case): State updates correctly for very long jumps', async () => {
    // Find two distant connected systems
    // We'll use a jump that exists in the wormhole data
    const distantJump = { originId: 0, destId: 7 }; // Sol to Sirius (longer jump in test data)

    // Setup
    gameStateManager.updateLocation(distantJump.originId);
    gameStateManager.updateFuel(100);
    gameStateManager.updateTime(0);

    const initialFuel = gameStateManager.getState().ship.fuel;
    const initialTime = gameStateManager.getState().player.daysElapsed;

    // Calculate expected changes
    const originStar = TEST_STAR_DATA.find(
      (s) => s.id === distantJump.originId
    );
    const destStar = TEST_STAR_DATA.find((s) => s.id === distantJump.destId);
    const distance = navigationSystem.calculateDistanceBetween(
      originStar,
      destStar
    );
    const expectedFuelCost = navigationSystem.calculateFuelCost(distance);
    const expectedJumpTime = navigationSystem.calculateJumpTime(distance);

    // Mock animation
    const originalPlayAnimation =
      animationSystem.playJumpAnimation.bind(animationSystem);
    animationSystem.playJumpAnimation = async () => Promise.resolve();

    // Execute jump
    const result = await navigationSystem.executeJump(
      gameStateManager,
      distantJump.destId,
      animationSystem
    );

    // Property: State should be updated correctly even for long jumps
    expect(result.success).toBe(true);
    const finalState = gameStateManager.getState();
    expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
    expect(finalState.player.daysElapsed).toBe(initialTime + expectedJumpTime);
    expect(finalState.player.currentSystem).toBe(distantJump.destId);

    // Restore
    animationSystem.playJumpAnimation = originalPlayAnimation;
  });
});
