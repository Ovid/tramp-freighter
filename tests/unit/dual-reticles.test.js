import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  selectStar,
  deselectStar,
  getSelectedStar,
  updateCurrentSystemIndicator,
  getCurrentSystemIndicator,
  _resetState,
} from '../../src/game/engine/interaction.js';
import { VISUAL_CONFIG } from '../../src/game/constants.js';

describe('Dual Reticles (Current System + Selection)', () => {
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
  });

  afterEach(() => {
    deselectStar();
    _resetState();
    scene.clear();
  });

  it('should show both current system indicator and selection ring', () => {
    const currentStar = stars[0]; // Sol is current system
    const targetStar = stars[1]; // Alpha Centauri is target

    // Create current system indicator
    const currentIndicator = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      currentStar.data.id
    );

    // Select target star
    selectStar(targetStar, scene, camera);

    // Both should exist
    expect(currentIndicator).not.toBeNull();
    expect(getCurrentSystemIndicator()).not.toBeNull();
    expect(getSelectedStar()).toBe(targetStar);
    expect(targetStar.selectionRing).not.toBeNull();

    // Both should be in scene
    expect(scene.children).toContain(currentIndicator);
    expect(scene.children).toContain(targetStar.selectionRing);

    // Both should be visible
    expect(currentIndicator.visible).toBe(true);
    expect(targetStar.selectionRing.visible).toBe(true);
  });

  it('should have different colors for current system and selection', () => {
    const currentStar = stars[0];
    const targetStar = stars[1];

    // Create current system indicator
    const currentIndicator = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      currentStar.data.id
    );

    // Select target star
    selectStar(targetStar, scene, camera);

    // Colors should be different
    const currentColor = currentIndicator.material.color.getHex();
    const selectionColor = targetStar.selectionRing.material.color.getHex();

    expect(currentColor).toBe(VISUAL_CONFIG.currentSystemColor); // Green
    expect(selectionColor).not.toBe(currentColor); // Should be different
  });

  it('should maintain current system indicator when selecting different stars', () => {
    const currentStar = stars[0];
    const targetStar = stars[1];

    // Create current system indicator
    const currentIndicator = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      currentStar.data.id
    );

    // Select first target
    selectStar(targetStar, scene, camera);

    // Current indicator should still exist
    expect(getCurrentSystemIndicator()).toBe(currentIndicator);
    expect(currentIndicator.visible).toBe(true);
    expect(scene.children).toContain(currentIndicator);

    // Deselect
    deselectStar();

    // Current indicator should STILL exist
    expect(getCurrentSystemIndicator()).toBe(currentIndicator);
    expect(currentIndicator.visible).toBe(true);
    expect(scene.children).toContain(currentIndicator);
  });

  it('should update current system indicator when system changes', () => {
    const star1 = stars[0];
    const star2 = stars[1];

    // Create indicator at first system
    const indicator1 = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      star1.data.id
    );

    expect(indicator1.position.x).toBe(star1.position.x);
    expect(indicator1.position.y).toBe(star1.position.y);
    expect(indicator1.position.z).toBe(star1.position.z);

    // Update to second system (simulating jump)
    const indicator2 = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      star2.data.id
    );

    // Should be a new indicator at new position
    expect(indicator2).not.toBe(indicator1);
    expect(indicator2.position.x).toBe(star2.position.x);
    expect(indicator2.position.y).toBe(star2.position.y);
    expect(indicator2.position.z).toBe(star2.position.z);

    // Old indicator should be removed from scene
    expect(scene.children).not.toContain(indicator1);
    expect(scene.children).toContain(indicator2);
  });

  it('should allow selecting current system (both reticles on same star)', () => {
    const currentStar = stars[0];

    // Create current system indicator
    const currentIndicator = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      currentStar.data.id
    );

    // Select the same star
    selectStar(currentStar, scene, camera);

    // Both reticles should exist on the same star
    expect(getCurrentSystemIndicator()).toBe(currentIndicator);
    expect(getSelectedStar()).toBe(currentStar);
    expect(currentStar.selectionRing).not.toBeNull();

    // Both should be visible
    expect(currentIndicator.visible).toBe(true);
    expect(currentStar.selectionRing.visible).toBe(true);

    // Both should be in scene
    expect(scene.children).toContain(currentIndicator);
    expect(scene.children).toContain(currentStar.selectionRing);
  });
});
