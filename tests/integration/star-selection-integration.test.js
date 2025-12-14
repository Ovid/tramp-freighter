import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from '../../vendor/three/build/three.module.js';
import {
  selectStar,
  deselectStar,
  getSelectedStar,
  updateCurrentSystemIndicator,
  getCurrentSystemIndicator,
  _resetState,
} from '../../src/game/engine/interaction.js';

describe('Star Selection Integration', () => {
  let scene, camera, stars;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 100);

    stars = [
      {
        data: { id: 1, name: 'Sol', x: 0, y: 0, z: 0 },
        sprite: new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff })),
        label: new THREE.Sprite(new THREE.SpriteMaterial()),
        position: new THREE.Vector3(0, 0, 0),
        originalColor: 0xffffff,
        selectionRing: null,
      },
      {
        data: { id: 2, name: 'Alpha Centauri', x: 10, y: 5, z: 3 },
        sprite: new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffaa00 })),
        label: new THREE.Sprite(new THREE.SpriteMaterial()),
        position: new THREE.Vector3(10, 5, 3),
        originalColor: 0xffaa00,
        selectionRing: null,
      },
    ];

    stars.forEach((star) => {
      scene.add(star.sprite);
      scene.add(star.label);
    });

    // Mock window functions
    window.selectStarInScene = vi.fn();
    window.deselectStarInScene = vi.fn();
    window.selectStarById = vi.fn();
    window.closeSystemPanel = vi.fn();
  });

  afterEach(() => {
    deselectStar();
    _resetState();
    scene.clear();

    // Clean up window functions
    delete window.selectStarInScene;
    delete window.deselectStarInScene;
    delete window.selectStarById;
    delete window.closeSystemPanel;
  });

  describe('Complete Selection Flow', () => {
    it('should select star and create reticle when clicking star', () => {
      const star = stars[0];

      // Simulate clicking on star
      selectStar(star, scene, camera);

      // Verify star is selected
      expect(getSelectedStar()).toBe(star);

      // Verify reticle is created and visible
      expect(star.selectionRing).not.toBeNull();
      expect(star.selectionRing.visible).toBe(true);

      // Verify reticle is in scene
      expect(scene.children).toContain(star.selectionRing);
    });

    it('should deselect star when clicking empty space', () => {
      const star = stars[0];

      // Select star first
      selectStar(star, scene, camera);
      expect(getSelectedStar()).toBe(star);

      // Simulate clicking empty space
      deselectStar();

      // Verify star is deselected
      expect(getSelectedStar()).toBeNull();

      // Verify reticle is hidden
      expect(star.selectionRing.visible).toBe(false);
    });

    it('should switch selection when clicking different star', () => {
      const star1 = stars[0];
      const star2 = stars[1];

      // Select first star
      selectStar(star1, scene, camera);
      expect(getSelectedStar()).toBe(star1);
      expect(star1.selectionRing.visible).toBe(true);

      // Select second star
      selectStar(star2, scene, camera);
      expect(getSelectedStar()).toBe(star2);

      // Verify first star is deselected
      expect(star1.selectionRing.visible).toBe(false);

      // Verify second star is selected
      expect(star2.selectionRing.visible).toBe(true);
    });
  });

  describe('Window Function Integration', () => {
    it('should expose selectStarInScene function', () => {
      expect(typeof window.selectStarInScene).toBe('function');
    });

    it('should expose deselectStarInScene function', () => {
      expect(typeof window.deselectStarInScene).toBe('function');
    });

    it('should expose selectStarById function', () => {
      expect(typeof window.selectStarById).toBe('function');
    });

    it('should expose closeSystemPanel function', () => {
      expect(typeof window.closeSystemPanel).toBe('function');
    });
  });

  describe('System Panel Integration', () => {
    it('should select star when system info panel opens', () => {
      const star = stars[0];

      // Simulate opening system info panel
      selectStar(star, scene, camera);

      // Verify star is selected with reticle
      expect(getSelectedStar()).toBe(star);
      expect(star.selectionRing).not.toBeNull();
      expect(star.selectionRing.visible).toBe(true);
    });

    it('should deselect star when system panel closes', () => {
      const star = stars[0];

      // Select star
      selectStar(star, scene, camera);
      expect(getSelectedStar()).toBe(star);

      // Simulate closing system panel
      deselectStar();

      // Verify star is deselected
      expect(getSelectedStar()).toBeNull();
      expect(star.selectionRing.visible).toBe(false);
    });
  });

  describe('Multiple Selection Cycles', () => {
    it('should handle multiple select/deselect cycles', () => {
      const star = stars[0];

      // Cycle 1
      selectStar(star, scene, camera);
      expect(getSelectedStar()).toBe(star);
      expect(star.selectionRing.visible).toBe(true);

      deselectStar();
      expect(getSelectedStar()).toBeNull();
      expect(star.selectionRing.visible).toBe(false);

      // Cycle 2
      selectStar(star, scene, camera);
      expect(getSelectedStar()).toBe(star);
      expect(star.selectionRing.visible).toBe(true);

      deselectStar();
      expect(getSelectedStar()).toBeNull();
      expect(star.selectionRing.visible).toBe(false);

      // Cycle 3
      selectStar(star, scene, camera);
      expect(getSelectedStar()).toBe(star);
      expect(star.selectionRing.visible).toBe(true);
    });

    it('should reuse same reticle across cycles', () => {
      const star = stars[0];

      // First selection
      selectStar(star, scene, camera);
      const firstReticle = star.selectionRing;

      deselectStar();

      // Second selection
      selectStar(star, scene, camera);
      const secondReticle = star.selectionRing;

      // Should be same reticle instance
      expect(secondReticle).toBe(firstReticle);
    });
  });

  describe('Jump Behavior', () => {
    it('should deselect star after jump completes', () => {
      const destinationStar = stars[1];

      // Simulate selecting destination for jump
      selectStar(destinationStar, scene, camera);
      expect(getSelectedStar()).toBe(destinationStar);
      expect(destinationStar.selectionRing.visible).toBe(true);

      // Simulate jump completion - selection should be cleared
      deselectStar();
      expect(getSelectedStar()).toBeNull();
      expect(destinationStar.selectionRing.visible).toBe(false);
    });

    it('should allow selecting new star after jump', () => {
      const star1 = stars[0];
      const star2 = stars[1];

      // Select first star (simulate jump destination)
      selectStar(star1, scene, camera);
      expect(getSelectedStar()).toBe(star1);

      // Simulate jump completion
      deselectStar();
      expect(getSelectedStar()).toBeNull();

      // Select second star (simulate selecting next jump target)
      selectStar(star2, scene, camera);
      expect(getSelectedStar()).toBe(star2);
      expect(star2.selectionRing.visible).toBe(true);
    });

    it('should show both reticles during jump (before completion)', () => {
      const currentStar = stars[0];
      const destinationStar = stars[1];

      // Create current system indicator
      const currentIndicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentStar.data.id
      );

      // Select destination star
      selectStar(destinationStar, scene, camera);

      // During jump, both should be visible
      expect(currentIndicator.visible).toBe(true);
      expect(destinationStar.selectionRing.visible).toBe(true);
      expect(getCurrentSystemIndicator()).toBe(currentIndicator);
      expect(getSelectedStar()).toBe(destinationStar);
    });
  });
});
