import { VISUAL_CONFIG, STARMAP_CONFIG } from '../constants.js';
import { createSelectionRing } from './stars.js';

// Selection state
let selectedStar = null;
let currentSystemIndicator = null;
let currentSystemMaterial = null;

/**
 * Select a star and show targeting reticle
 * @param {Object} star - The star to select
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.PerspectiveCamera} _camera - Unused: the reticle is a sprite, so it always faces the camera
 */
export function selectStar(star, scene, _camera) {
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
    // Sprites share one geometry and the material is shared, so nothing to dispose
    scene.remove(currentSystemIndicator);
  }

  // Create new indicator at current system
  currentSystemIndicator = createSelectionRing();
  currentSystemIndicator.position.set(
    currentStar.position.x,
    currentStar.position.y,
    currentStar.position.z
  );

  // Create shared material once to avoid repeated cloning
  if (!currentSystemMaterial) {
    currentSystemMaterial = currentSystemIndicator.material.clone();
    currentSystemMaterial.color.setHex(VISUAL_CONFIG.currentSystemColor);
  }
  currentSystemIndicator.material = currentSystemMaterial;

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
  currentSystemMaterial = null;
}

/**
 * Update selection ring animations.
 * Sizes are fixed in screen px, so scale comes from unitsPerPx; rotation is
 * the sprite material's screen-space rotation.
 * @param {number} time - Current time in seconds
 * @param {boolean} reducedMotion - When true, use static values instead of pulsing
 * @param {number} unitsPerPx - Sprite scale per CSS px (see pxToSpriteScale)
 */
export function updateSelectionRingAnimations(
  time,
  reducedMotion = false,
  unitsPerPx
) {
  const ringBase = STARMAP_CONFIG.RETICLE_SIZE_PX * unitsPerPx;
  const markerBase = STARMAP_CONFIG.CURRENT_SYSTEM_SIZE_PX * unitsPerPx;

  if (selectedStar && selectedStar.selectionRing) {
    const ring = selectedStar.selectionRing;
    if (reducedMotion) {
      ring.scale.set(ringBase, ringBase, 1);
      ring.material.opacity = VISUAL_CONFIG.selectionRingBaseOpacity;
      ring.material.rotation = 0;
    } else {
      // Subtle pulsing scale for targeting lock effect
      const pulse =
        1 +
        Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) *
          VISUAL_CONFIG.selectionRingScaleAmplitude;
      ring.scale.set(ringBase * pulse, ringBase * pulse, 1);

      // Pulse the opacity for "scanning" effect
      ring.material.opacity =
        VISUAL_CONFIG.selectionRingBaseOpacity +
        Math.sin(
          time *
            VISUAL_CONFIG.selectionRingPulseSpeed *
            VISUAL_CONFIG.selectionRingOpacityFrequency
        ) *
          VISUAL_CONFIG.selectionRingOpacityAmplitude;

      // Slow rotation for targeting system effect
      ring.material.rotation = time * VISUAL_CONFIG.selectionRingRotationSpeed;
    }
  }

  if (currentSystemIndicator) {
    const marker = currentSystemIndicator;
    if (reducedMotion) {
      marker.scale.set(markerBase, markerBase, 1);
      marker.material.opacity = VISUAL_CONFIG.currentSystemBaseOpacity;
      marker.material.rotation = 0;
    } else {
      const pulse =
        1 +
        Math.sin(
          time *
            VISUAL_CONFIG.selectionRingPulseSpeed *
            VISUAL_CONFIG.currentSystemScaleFrequency
        ) *
          VISUAL_CONFIG.currentSystemScaleAmplitude;
      marker.scale.set(markerBase * pulse, markerBase * pulse, 1);

      marker.material.opacity =
        VISUAL_CONFIG.currentSystemBaseOpacity +
        Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) *
          VISUAL_CONFIG.currentSystemOpacityAmplitude;

      // Its material is its own clone, so it spins opposite the selection ring
      marker.material.rotation =
        -time * VISUAL_CONFIG.currentSystemRotationSpeed;
    }
  }
}
