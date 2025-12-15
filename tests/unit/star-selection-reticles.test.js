import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { createSelectionRing } from '../../src/game/engine/stars.js';
import {
  selectStar,
  deselectStar,
  getSelectedStar,
  updateCurrentSystemIndicator,
  getCurrentSystemIndicator,
  updateSelectionRingAnimations,
  _resetState,
} from '../../src/game/engine/interaction.js';
import { VISUAL_CONFIG } from '../../src/game/constants.js';

describe('Star Selection Reticles', () => {
  let scene, camera, stars;

  beforeEach(() => {
    // Create mock scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 100);

    // Create mock stars
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

    // Add sprites to scene
    stars.forEach((star) => {
      scene.add(star.sprite);
      scene.add(star.label);
    });
  });

  afterEach(() => {
    // Clean up
    deselectStar();
    _resetState();
    scene.clear();
  });

  describe('createSelectionRing', () => {
    it('should create a selection ring mesh', () => {
      const ring = createSelectionRing();

      expect(ring).toBeInstanceOf(THREE.Mesh);
      expect(ring.geometry).toBeInstanceOf(THREE.PlaneGeometry);
      expect(ring.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    });

    it('should create a ring with correct size', () => {
      const ring = createSelectionRing();
      const expectedSize = VISUAL_CONFIG.selectionRingSize * 3;

      expect(ring.geometry.parameters.width).toBe(expectedSize);
      expect(ring.geometry.parameters.height).toBe(expectedSize);
    });

    it('should create a ring with transparent material', () => {
      const ring = createSelectionRing();

      expect(ring.material.transparent).toBe(true);
      expect(ring.material.blending).toBe(THREE.AdditiveBlending);
      expect(ring.material.depthWrite).toBe(false);
    });

    it('should reuse shared texture and material', () => {
      const ring1 = createSelectionRing();
      const ring2 = createSelectionRing();

      // Materials should be the same instance (shared)
      expect(ring1.material).toBe(ring2.material);
    });
  });

  describe('selectStar', () => {
    it('should select a star and create selection ring', () => {
      const star = stars[0];
      const selectedStar = selectStar(star, scene, camera);

      expect(selectedStar).toBe(star);
      expect(getSelectedStar()).toBe(star);
      expect(star.selectionRing).not.toBeNull();
      expect(star.selectionRing).toBeInstanceOf(THREE.Mesh);
    });

    it('should change star color to selection color', () => {
      const star = stars[0];
      const originalColor = star.originalColor;

      selectStar(star, scene, camera);

      expect(star.sprite.material.color.getHex()).toBe(
        VISUAL_CONFIG.selectionColor
      );
      expect(star.sprite.material.color.getHex()).not.toBe(originalColor);
    });

    it('should add selection ring to scene', () => {
      const star = stars[0];
      const initialChildCount = scene.children.length;

      selectStar(star, scene, camera);

      expect(scene.children.length).toBe(initialChildCount + 1);
      expect(scene.children).toContain(star.selectionRing);
    });

    it('should position selection ring at star position', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      expect(star.selectionRing.position.x).toBe(star.position.x);
      expect(star.selectionRing.position.y).toBe(star.position.y);
      expect(star.selectionRing.position.z).toBe(star.position.z);
    });

    it('should deselect previous star when selecting new star', () => {
      const star1 = stars[0];
      const star2 = stars[1];

      selectStar(star1, scene, camera);
      expect(getSelectedStar()).toBe(star1);

      selectStar(star2, scene, camera);
      expect(getSelectedStar()).toBe(star2);
      expect(star1.selectionRing.visible).toBe(false);
      expect(star1.sprite.material.color.getHex()).toBe(star1.originalColor);
    });

    it('should reuse existing selection ring if already created', () => {
      const star = stars[0];

      selectStar(star, scene, camera);
      const firstRing = star.selectionRing;

      deselectStar();
      selectStar(star, scene, camera);
      const secondRing = star.selectionRing;

      expect(secondRing).toBe(firstRing);
    });

    it('should not affect other stars with shared material', () => {
      // Create two stars that share the same material (same spectral class)
      const sharedMaterial = new THREE.SpriteMaterial({ color: 0xff0000 });
      const star1 = {
        data: { id: 3, name: 'Star A', x: 0, y: 0, z: 0 },
        sprite: new THREE.Sprite(sharedMaterial),
        label: new THREE.Sprite(new THREE.SpriteMaterial()),
        position: new THREE.Vector3(0, 0, 0),
        originalColor: 0xff0000,
        selectionRing: null,
      };
      const star2 = {
        data: { id: 4, name: 'Star B', x: 20, y: 10, z: 5 },
        sprite: new THREE.Sprite(sharedMaterial),
        label: new THREE.Sprite(new THREE.SpriteMaterial()),
        position: new THREE.Vector3(20, 10, 5),
        originalColor: 0xff0000,
        selectionRing: null,
      };

      // Verify they share the same material initially
      expect(star1.sprite.material).toBe(star2.sprite.material);

      // Select star1
      selectStar(star1, scene, camera);

      // star1 should have selection color
      expect(star1.sprite.material.color.getHex()).toBe(
        VISUAL_CONFIG.selectionColor
      );

      // star2 should still have original color (not affected by star1's selection)
      expect(star2.sprite.material.color.getHex()).toBe(0xff0000);

      // star1 should now have a different material instance (cloned)
      expect(star1.sprite.material).not.toBe(star2.sprite.material);

      // star1 should have originalMaterial stored
      expect(star1.originalMaterial).toBe(sharedMaterial);
    });

    it('should restore shared material on deselect', () => {
      // Create star with a specific material
      const sharedMaterial = new THREE.SpriteMaterial({ color: 0x00ff00 });
      const star = {
        data: { id: 5, name: 'Star C', x: 0, y: 0, z: 0 },
        sprite: new THREE.Sprite(sharedMaterial),
        label: new THREE.Sprite(new THREE.SpriteMaterial()),
        position: new THREE.Vector3(0, 0, 0),
        originalColor: 0x00ff00,
        selectionRing: null,
      };

      // Select the star (should clone material)
      selectStar(star, scene, camera);
      const clonedMaterial = star.sprite.material;

      // Verify material was cloned
      expect(clonedMaterial).not.toBe(sharedMaterial);
      expect(star.originalMaterial).toBe(sharedMaterial);

      // Deselect the star (should restore shared material)
      deselectStar();

      // Verify shared material is restored
      expect(star.sprite.material).toBe(sharedMaterial);
      expect(star.sprite.material.color.getHex()).toBe(0x00ff00);
    });
  });

  describe('deselectStar', () => {
    it('should deselect the currently selected star', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      deselectStar();

      expect(getSelectedStar()).toBeNull();
    });

    it('should restore original star color', () => {
      const star = stars[0];
      const originalColor = star.originalColor;

      selectStar(star, scene, camera);
      deselectStar();

      expect(star.sprite.material.color.getHex()).toBe(originalColor);
    });

    it('should hide selection ring', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      deselectStar();

      expect(star.selectionRing.visible).toBe(false);
    });

    it('should do nothing if no star is selected', () => {
      expect(() => deselectStar()).not.toThrow();
      expect(getSelectedStar()).toBeNull();
    });
  });

  describe('updateCurrentSystemIndicator', () => {
    it('should create current system indicator at correct position', () => {
      const currentSystemId = 1;
      const indicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId
      );

      expect(indicator).not.toBeNull();
      expect(indicator).toBeInstanceOf(THREE.Mesh);
      expect(indicator.position.x).toBe(stars[0].position.x);
      expect(indicator.position.y).toBe(stars[0].position.y);
      expect(indicator.position.z).toBe(stars[0].position.z);
    });

    it('should add current system indicator to scene', () => {
      const currentSystemId = 1;
      const initialChildCount = scene.children.length;

      updateCurrentSystemIndicator(scene, camera, stars, currentSystemId);

      expect(scene.children.length).toBe(initialChildCount + 1);
    });

    it('should scale indicator larger than selection ring', () => {
      const currentSystemId = 1;
      const indicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId
      );

      expect(indicator.scale.x).toBe(1.2);
      expect(indicator.scale.y).toBe(1.2);
    });

    it('should use current system color', () => {
      const currentSystemId = 1;
      const indicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId
      );

      expect(indicator.material.color.getHex()).toBe(
        VISUAL_CONFIG.currentSystemColor
      );
    });

    it('should remove old indicator when updating', () => {
      const currentSystemId1 = 1;
      const currentSystemId2 = 2;

      const indicator1 = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId1
      );
      const childCountAfterFirst = scene.children.length;

      const indicator2 = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId2
      );

      expect(scene.children.length).toBe(childCountAfterFirst);
      expect(scene.children).not.toContain(indicator1);
      expect(scene.children).toContain(indicator2);
    });

    it('should return null if system not found', () => {
      const invalidSystemId = 999;
      const indicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        invalidSystemId
      );

      expect(indicator).toBeNull();
    });
  });

  describe('updateSelectionRingAnimations', () => {
    it('should animate selected star ring scale', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      const time1 = 0;
      const time2 = Math.PI / 2;

      updateSelectionRingAnimations(time1);
      const scale1 = star.selectionRing.scale.x;

      updateSelectionRingAnimations(time2);
      const scale2 = star.selectionRing.scale.x;

      expect(scale1).not.toBe(scale2);
    });

    it('should animate selected star ring opacity', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      const time1 = 0;
      const time2 = Math.PI / 2;

      updateSelectionRingAnimations(time1);
      const opacity1 = star.selectionRing.material.opacity;

      updateSelectionRingAnimations(time2);
      const opacity2 = star.selectionRing.material.opacity;

      expect(opacity1).not.toBe(opacity2);
    });

    it('should rotate selected star ring', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      const time1 = 0;
      const time2 = 1;

      updateSelectionRingAnimations(time1);
      const rotation1 = star.selectionRing.rotation.z;

      updateSelectionRingAnimations(time2);
      const rotation2 = star.selectionRing.rotation.z;

      expect(rotation2).toBeGreaterThan(rotation1);
    });

    it('should animate current system indicator', () => {
      const currentSystemId = 1;
      updateCurrentSystemIndicator(scene, camera, stars, currentSystemId);
      const indicator = getCurrentSystemIndicator();

      const time1 = 0;
      const time2 = Math.PI / 2;

      updateSelectionRingAnimations(time1);
      const scale1 = indicator.scale.x;
      const opacity1 = indicator.material.opacity;

      updateSelectionRingAnimations(time2);
      const scale2 = indicator.scale.x;
      const opacity2 = indicator.material.opacity;

      expect(scale1).not.toBe(scale2);
      expect(opacity1).not.toBe(opacity2);
    });

    it('should not throw if no star is selected', () => {
      expect(() => updateSelectionRingAnimations(0)).not.toThrow();
    });

    it('should not throw if no current system indicator exists', () => {
      expect(() => updateSelectionRingAnimations(0)).not.toThrow();
    });
  });

  describe('getSelectedStar', () => {
    it('should return null when no star is selected', () => {
      expect(getSelectedStar()).toBeNull();
    });

    it('should return the selected star', () => {
      const star = stars[0];
      selectStar(star, scene, camera);

      expect(getSelectedStar()).toBe(star);
    });
  });

  describe('getCurrentSystemIndicator', () => {
    it('should return null when no indicator exists', () => {
      expect(getCurrentSystemIndicator()).toBeNull();
    });

    it('should return the current system indicator', () => {
      const currentSystemId = 1;
      const indicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        currentSystemId
      );

      expect(getCurrentSystemIndicator()).toBe(indicator);
    });
  });
});
