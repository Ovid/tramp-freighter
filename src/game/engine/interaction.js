import { VISUAL_CONFIG } from '../constants.js';
import { createSelectionRing } from './stars.js';

// Selection state
let selectedStar = null;
let currentSystemIndicator = null;

/**
 * Select a star and show targeting reticle
 * @param {Object} star - The star to select
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 */
export function selectStar(star, scene, camera) {
  if (selectedStar) {
    deselectStar();
  }

  selectedStar = star;

  // Clone material to avoid affecting other stars that share the same material
  // Stars share materials by spectral class for performance, so we need unique materials for selection
  if (!star.originalMaterial) {
    star.originalMaterial = star.sprite.material;
  }
  star.sprite.material = star.originalMaterial.clone();
  star.sprite.material.color.setHex(VISUAL_CONFIG.selectionColor);

  // Create or show selection ring
  if (!star.selectionRing) {
    star.selectionRing = createSelectionRing();
    star.selectionRing.position.set(
      star.position.x,
      star.position.y,
      star.position.z
    );
    star.selectionRing.lookAt(camera.position);
    scene.add(star.selectionRing);
  } else {
    star.selectionRing.visible = true;
    star.selectionRing.position.set(
      star.position.x,
      star.position.y,
      star.position.z
    );
  }

  return selectedStar;
}

/**
 * Deselect the currently selected star
 */
export function deselectStar() {
  if (!selectedStar) {
    return;
  }

  // Restore original shared material
  if (selectedStar.originalMaterial) {
    selectedStar.sprite.material = selectedStar.originalMaterial;
  }

  // Hide selection ring
  if (selectedStar.selectionRing) {
    selectedStar.selectionRing.visible = false;
  }

  selectedStar = null;
}

/**
 * Get the currently selected star
 * @returns {Object|null} The selected star or null
 */
export function getSelectedStar() {
  return selectedStar;
}

/**
 * Update the current system indicator to show player's location
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {Array} stars - Array of star objects
 * @param {number} currentSystemId - The current system ID
 * @returns {Object|null} The current system indicator
 */
export function updateCurrentSystemIndicator(
  scene,
  camera,
  stars,
  currentSystemId
) {
  const currentStar = stars.find((star) => star.data.id === currentSystemId);

  if (!currentStar) {
    return null;
  }

  // Remove old indicator if it exists
  if (currentSystemIndicator) {
    scene.remove(currentSystemIndicator);
  }

  // Create new indicator at current system
  currentSystemIndicator = createSelectionRing();
  currentSystemIndicator.position.set(
    currentStar.position.x,
    currentStar.position.y,
    currentStar.position.z
  );
  currentSystemIndicator.lookAt(camera.position);

  // Make it slightly larger and different color to distinguish from selection
  currentSystemIndicator.scale.set(1.2, 1.2, 1);

  // Clone the material to avoid affecting other selection rings
  const clonedMaterial = currentSystemIndicator.material.clone();
  clonedMaterial.color.setHex(VISUAL_CONFIG.currentSystemColor);
  currentSystemIndicator.material = clonedMaterial;

  scene.add(currentSystemIndicator);

  return currentSystemIndicator;
}

/**
 * Get the current system indicator
 * @returns {Object|null} The current system indicator
 */
export function getCurrentSystemIndicator() {
  return currentSystemIndicator;
}

/**
 * Reset module state (for testing)
 * @private
 */
export function _resetState() {
  selectedStar = null;
  currentSystemIndicator = null;
}

/**
 * Update selection ring animations
 * @param {number} time - Current time in seconds
 */
export function updateSelectionRingAnimations(time) {
  if (selectedStar && selectedStar.selectionRing) {
    // Subtle pulsing scale for targeting lock effect
    const pulseScale =
      1.0 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) * 0.08;

    // Apply pulsing to reticle scale
    selectedStar.selectionRing.scale.set(pulseScale, pulseScale, 1);

    // Pulse the opacity for "scanning" effect
    const pulseOpacity =
      0.75 +
      Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed * 1.5) * 0.25;
    selectedStar.selectionRing.material.opacity = pulseOpacity;

    // Slow rotation for targeting system effect
    selectedStar.selectionRing.rotation.z = time * 0.2;
  }

  // Update current system indicator
  if (currentSystemIndicator) {
    // Pulsing for current system indicator
    const pulseScale =
      1.2 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed * 0.8) * 0.1;
    currentSystemIndicator.scale.set(pulseScale, pulseScale, 1);

    // Pulse opacity
    const pulseOpacity =
      0.7 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) * 0.3;
    currentSystemIndicator.material.opacity = pulseOpacity;

    // Rotate in opposite direction from selection ring
    currentSystemIndicator.rotation.z = -time * 0.15;
  }
}
