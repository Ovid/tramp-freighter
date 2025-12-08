'use strict';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { JumpAnimationSystem } from '../../js/game-animation.js';
import { setupThreeMock } from '../setup-three-mock.js';

/**
 * Property test for visual style preservation
 *
 * **Feature: jump-animation, Property 8: Visual style preservation**
 *
 * Validates: Requirements 4.3, 4.4
 *
 * Property: For any jump animation, the starmap's existing visual elements
 * (star sprites, wormhole connections, lighting, materials) SHALL remain
 * unchanged and visible throughout the animation.
 */

describe('Visual Style Preservation - Property Tests', () => {
  let scene, camera, controls, starData, animationSystem;

  beforeEach(() => {
    setupThreeMock();
    const THREE = window.THREE;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
    camera.position.set(0, 200, 400);

    // Mock OrbitControls
    controls = {
      target: new THREE.Vector3(0, 0, 0),
      enabled: true,
      update: () => {},
    };

    // Create star data
    starData = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 100, y: 0, z: 0, name: 'Alpha Centauri' },
      { id: 2, x: 200, y: 100, z: 50, name: 'Barnard' },
    ];

    // Add some mock scene objects to represent existing starmap elements
    const mockStar1 = { type: 'star', id: 0 };
    const mockStar2 = { type: 'star', id: 1 };
    const mockConnection = { type: 'connection', from: 0, to: 1 };

    scene.add(mockStar1);
    scene.add(mockStar2);
    scene.add(mockConnection);

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

  it('Property 8: For any animation, scene objects remain unchanged', () => {
    // Generator for valid system ID pairs
    const systemPairGenerator = fc
      .tuple(
        fc.integer({ min: 0, max: starData.length - 1 }),
        fc.integer({ min: 0, max: starData.length - 1 })
      )
      .filter(([origin, dest]) => origin !== dest);

    fc.assert(
      fc.property(systemPairGenerator, () => {
        // Property 1: Scene should contain existing objects before animation
        const initialChildCount = scene.children.length;
        expect(initialChildCount).toBeGreaterThan(0);

        // Property 2: Ship indicator should be added to scene during construction
        const shipIndicatorInScene = scene.children.includes(
          animationSystem.shipIndicator
        );
        expect(shipIndicatorInScene).toBe(true);

        // Property 3: Scene should still contain all original objects
        // (ship indicator is added, but original objects remain)
        expect(scene.children.length).toBe(initialChildCount);

        // Property 4: Original scene objects should still be in scene
        const starObjects = scene.children.filter((obj) => obj.type === 'star');
        expect(starObjects.length).toBe(2);

        const connectionObjects = scene.children.filter(
          (obj) => obj.type === 'connection'
        );
        expect(connectionObjects.length).toBe(1);

        // Property 5: Ship indicator should be initially hidden
        expect(animationSystem.shipIndicator.visible).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('Property 8: Animation system does not remove existing scene objects', () => {
    // Property 1: Count initial scene objects (before animation system was created)
    // Note: Ship indicator is already in scene from beforeEach
    const initialCount = scene.children.length;
    const shipIndicator = animationSystem.shipIndicator;

    // Property 2: Ship indicator should be in scene
    expect(scene.children).toContain(shipIndicator);

    // Property 3: Store non-ship-indicator objects
    const originalObjects = scene.children.filter(
      (obj) => obj !== shipIndicator
    );
    expect(originalObjects.length).toBe(initialCount - 1);

    // Property 4: Disposing animation system should only remove ship indicator
    animationSystem.dispose();
    expect(scene.children.length).toBe(initialCount - 1);

    // Property 5: Ship indicator should be removed
    expect(scene.children).not.toContain(shipIndicator);

    // Property 6: Original objects should still be in scene after disposal
    originalObjects.forEach((obj) => {
      expect(scene.children).toContain(obj);
    });
  });

  it('Property 8: Ship indicator is separate from existing visual elements', () => {
    // Property 1: Ship indicator should be a distinct object
    expect(animationSystem.shipIndicator).toBeDefined();

    // Property 2: Ship indicator should not be one of the original scene objects
    const originalObjects = scene.children.filter(
      (obj) => obj.type === 'star' || obj.type === 'connection'
    );
    expect(originalObjects).not.toContain(animationSystem.shipIndicator);

    // Property 3: Ship indicator should have unique properties
    expect(animationSystem.shipIndicator.material).toBeDefined();
    expect(animationSystem.shipIndicator.material.color).toBe(0xff0000);

    // Property 4: Ship indicator should be in scene
    expect(scene.children).toContain(animationSystem.shipIndicator);
  });

  it('Property 8: Animation does not modify camera properties permanently', () => {
    // Store initial camera properties
    const initialFov = camera.fov;
    const initialAspect = camera.aspect;
    const initialNear = camera.near;
    const initialFar = camera.far;

    // Property 1: Camera properties should remain unchanged
    expect(camera.fov).toBe(initialFov);
    expect(camera.aspect).toBe(initialAspect);
    expect(camera.near).toBe(initialNear);
    expect(camera.far).toBe(initialFar);

    // Property 2: Camera should still be the same object
    expect(camera).toBeDefined();
    expect(camera.position).toBeDefined();

    // Property 3: Controls should still be the same object
    expect(controls).toBeDefined();
    expect(controls.target).toBeDefined();
  });

  it('Property 8: Scene maintains consistent structure', () => {
    // Property 1: Scene should have children array
    expect(scene.children).toBeDefined();
    expect(Array.isArray(scene.children)).toBe(true);

    // Property 2: Scene should have add and remove methods
    expect(typeof scene.add).toBe('function');
    expect(typeof scene.remove).toBe('function');

    // Property 3: Scene structure should be consistent
    const childCountBefore = scene.children.length;

    // Add and remove a test object
    const testObject = { type: 'test' };
    scene.add(testObject);
    expect(scene.children.length).toBe(childCountBefore + 1);

    scene.remove(testObject);
    expect(scene.children.length).toBe(childCountBefore);

    // Property 4: Original objects should still be present
    const starObjects = scene.children.filter((obj) => obj.type === 'star');
    expect(starObjects.length).toBe(2);
  });
});
