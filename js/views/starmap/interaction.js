'use strict';

import * as THREE from 'three';
import { VISUAL_CONFIG } from '../../game-constants.js';
import { createSelectionRing } from './stars.js';

// Cached array of clickable objects to avoid allocation on every click
let _clickableObjects = [];

// Selection state
let selectedStar = null;
let raycaster = null;
const mouse = { x: 0, y: 0 };

// Hover tooltip cache to avoid recalculating on every mousemove
let _lastHoveredStarId = null;

// Track highlighted systems for cleanup
let highlightedStars = [];

// Current system indicator (pulsing ring)
let currentSystemIndicator = null;

// Module-level stars reference to avoid window pollution
let _stars = [];

// Reusable temp vectors to avoid object allocation in hot paths
const _tempOffset = new THREE.Vector3();
const _tempZoomDirection = new THREE.Vector3();
const _tempZoomPosition = new THREE.Vector3();

/**
 * Set up raycaster for click detection and hover
 * @param {THREE.WebGLRenderer} renderer - The renderer
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {Array} stars - Array of star objects
 * @param {Function} onStarSelected - Callback when star is selected
 * @param {Function} onStarDeselected - Callback when star is deselected
 * @param {Object} gameStateManager - The game state manager
 * @param {Object} navigationSystem - The navigation system
 * @param {Array} wormholeConnections - Array of wormhole connections
 */
export function setupRaycaster(
  renderer,
  camera,
  stars,
  onStarSelected,
  onStarDeselected,
  gameStateManager,
  navigationSystem,
  wormholeConnections
) {
  raycaster = new THREE.Raycaster();

  // Store stars reference at module level
  _stars = stars;

  // Rebuild clickable objects cache
  rebuildClickableObjectsCache(stars);

  // Add click event listener to canvas
  renderer.domElement.addEventListener(
    'click',
    (event) =>
      onCanvasClick(event, camera, stars, onStarSelected, onStarDeselected),
    false
  );

  // Add mousemove event listener for hover tooltip
  renderer.domElement.addEventListener(
    'mousemove',
    (event) =>
      onCanvasHover(
        event,
        camera,
        stars,
        gameStateManager,
        navigationSystem,
        wormholeConnections
      ),
    false
  );

  console.log('Raycaster initialized for selection and hover');
}

/**
 * Rebuild clickable objects cache after stars are created or modified
 * @param {Array} stars - Array of star objects
 */
function rebuildClickableObjectsCache(stars) {
  _clickableObjects = [];
  stars.forEach((star) => {
    _clickableObjects.push(star.sprite);
    _clickableObjects.push(star.label);
  });
}

/**
 * Handle canvas click events
 */
function onCanvasClick(event, camera, stars, onStarSelected, onStarDeselected) {
  // Convert to NDC for raycaster (required by THREE.js raycasting API)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(_clickableObjects, false);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

    const clickedStar = stars.find(
      (star) => star.sprite === clickedObject || star.label === clickedObject
    );

    if (clickedStar) {
      onStarSelected(clickedStar);
    }
  } else {
    if (selectedStar) {
      onStarDeselected();
    }
  }
}

/**
 * Handle canvas hover events for tooltip display
 */
function onCanvasHover(
  event,
  camera,
  stars,
  gameStateManager,
  navigationSystem,
  wormholeConnections
) {
  if (!gameStateManager || !gameStateManager.state) {
    hideJumpTooltip();
    return;
  }

  // Convert to NDC for raycaster
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(_clickableObjects, false);

  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object;

    const hoveredStar = stars.find(
      (star) => star.sprite === hoveredObject || star.label === hoveredObject
    );

    if (hoveredStar) {
      const currentSystemId = gameStateManager.state.player.currentSystem;

      // Only show tooltip for connected systems (not current system)
      if (hoveredStar.data.id !== currentSystemId) {
        const isConnected =
          gameStateManager.navigationSystem.areSystemsConnected(
            currentSystemId,
            hoveredStar.data.id
          );

        if (isConnected) {
          showJumpTooltip(
            hoveredStar,
            event.clientX,
            event.clientY,
            gameStateManager,
            wormholeConnections
          );
          return;
        }
      }
    }
  }

  hideJumpTooltip();
}

/**
 * Show jump information tooltip for a connected system
 */
function showJumpTooltip(
  targetStar,
  mouseX,
  mouseY,
  gameStateManager,
  wormholeConnections
) {
  if (!gameStateManager || !gameStateManager.state) {
    return;
  }

  const currentSystemId = gameStateManager.state.player.currentSystem;
  const currentFuel = gameStateManager.state.ship.fuel;

  // Get or create tooltip element
  let tooltip = document.getElementById('jump-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'jump-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.color = '#00FF88';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.border = '1px solid #00FF88';
    tooltip.style.fontFamily = '"Courier New", monospace';
    tooltip.style.fontSize = '14px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '10000';
    tooltip.style.whiteSpace = 'nowrap';
    document.body.appendChild(tooltip);
  }

  // Only recalculate content if hovering a different star
  if (_lastHoveredStarId !== targetStar.data.id) {
    // Find the connection to get pre-calculated values
    const connection = wormholeConnections.find(
      (conn) =>
        (conn.systemId1 === currentSystemId &&
          conn.systemId2 === targetStar.data.id) ||
        (conn.systemId2 === currentSystemId &&
          conn.systemId1 === targetStar.data.id)
    );

    if (connection) {
      const distance = connection.distance;
      const fuelCost = connection.fuelCost;
      const jumpTime =
        gameStateManager.navigationSystem.calculateJumpTime(distance);

      // Format tooltip content
      const fuelStatus = currentFuel >= fuelCost ? '✓' : '✗';
      const fuelColor = currentFuel >= fuelCost ? '#00FF88' : '#FF0000';

      tooltip.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">${targetStar.data.name}</div>
                <div>Distance: ${distance.toFixed(2)} LY</div>
                <div>Jump Time: ${jumpTime} days</div>
                <div style="color: ${fuelColor};">Fuel Cost: ${fuelCost.toFixed(1)}% ${fuelStatus}</div>
            `;

      _lastHoveredStarId = targetStar.data.id;
    }
  }

  // Always update position (cheap operation)
  tooltip.style.left = mouseX + 15 + 'px';
  tooltip.style.top = mouseY + 15 + 'px';
  tooltip.style.display = 'block';
}

/**
 * Hide jump information tooltip
 */
function hideJumpTooltip() {
  const tooltip = document.getElementById('jump-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
  _lastHoveredStarId = null;
}

/**
 * Select a star
 * @param {Object} star - The star to select
 * @param {THREE.Scene} scene - The scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {Function} toggleRotation - Function to toggle rotation
 * @param {Object} navigationSystem - The navigation system
 */
export function selectStar(
  star,
  scene,
  camera,
  toggleRotation,
  autoRotationEnabled,
  navigationSystem
) {
  if (selectedStar) {
    deselectStar();
  }

  selectedStar = star;

  console.log(`Selected star: ${star.data.name}`);

  star.sprite.material.color.setHex(VISUAL_CONFIG.selectionColor);

  if (!star.selectionRing) {
    star.selectionRing = createSelectionRing();
    star.selectionRing.position.copy(star.position);
    star.selectionRing.lookAt(camera.position);
    scene.add(star.selectionRing);
  } else {
    star.selectionRing.visible = true;
  }

  // Pause auto-rotation when a star is selected
  if (autoRotationEnabled) {
    toggleRotation();
  }

  // Highlight connected systems
  highlightConnectedSystems(star.data.id, navigationSystem);

  return selectedStar;
}

/**
 * Deselect the currently selected star
 */
export function deselectStar() {
  if (!selectedStar) {
    return;
  }

  console.log(`Deselected star: ${selectedStar.data.name}`);

  selectedStar.sprite.material.color.setHex(selectedStar.originalColor);

  if (selectedStar.selectionRing) {
    selectedStar.selectionRing.visible = false;
  }

  // Clear highlighted connected systems
  clearHighlightedSystems();

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
 * @param {Object} gameStateManager - The game state manager
 * @returns {Object|null} The current system indicator
 */
export function updateCurrentSystemIndicator(
  scene,
  camera,
  stars,
  gameStateManager
) {
  if (!gameStateManager || !gameStateManager.state) {
    return null;
  }

  const currentSystemId = gameStateManager.state.player.currentSystem;
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
  currentSystemIndicator.position.copy(currentStar.position);
  currentSystemIndicator.lookAt(camera.position);

  // Make it slightly larger and different color to distinguish from selection
  currentSystemIndicator.scale.set(1.2, 1.2, 1);
  currentSystemIndicator.material.color.setHex(
    VISUAL_CONFIG.currentSystemColor
  );

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
 * Highlight systems connected to the selected system
 * @param {number} systemId - The system ID
 * @param {Object} navigationSystem - The navigation system
 */
function highlightConnectedSystems(systemId, navigationSystem) {
  // Clear any previous highlights
  clearHighlightedSystems();

  if (!navigationSystem) return;

  // Get connected system IDs
  const connectedIds = navigationSystem.getConnectedSystems(systemId);

  // Highlight each connected star
  connectedIds.forEach((connectedId) => {
    const connectedStar = _stars.find((s) => s.data.id === connectedId);
    if (connectedStar) {
      // Store original color if not already stored
      if (!connectedStar.highlightedOriginalColor) {
        connectedStar.highlightedOriginalColor =
          connectedStar.sprite.material.color.getHex();
      }

      // Set highlight color (bright cyan)
      connectedStar.sprite.material.color.setHex(0x00ffff);

      // Increase size slightly
      connectedStar.sprite.scale.set(
        VISUAL_CONFIG.starSize * 1.5,
        VISUAL_CONFIG.starSize * 1.5,
        1
      );

      highlightedStars.push(connectedStar);
    }
  });
}

/**
 * Clear all highlighted systems
 */
function clearHighlightedSystems() {
  highlightedStars.forEach((star) => {
    // Restore original color
    if (star.highlightedOriginalColor !== undefined) {
      star.sprite.material.color.setHex(star.highlightedOriginalColor);
      star.highlightedOriginalColor = undefined;
    }

    // Restore original size
    star.sprite.scale.set(VISUAL_CONFIG.starSize, VISUAL_CONFIG.starSize, 1);
  });

  highlightedStars = [];
}

/**
 * Zoom In button handler - decreases camera distance
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The controls
 */
export function zoomIn(camera, controls) {
  if (controls) {
    // Reuse temp vector to avoid allocation during user interaction
    _tempZoomDirection.subVectors(controls.target, camera.position).normalize();

    // Calculate current distance
    const currentDistance = camera.position.distanceTo(controls.target);

    // Calculate zoom amount (10% of current distance, minimum 10 units)
    const zoomAmount = Math.max(currentDistance * 0.1, 10);

    // Calculate new position using temp vector to avoid allocation
    _tempZoomPosition
      .copy(camera.position)
      .add(_tempZoomDirection.multiplyScalar(zoomAmount));

    // Check if new distance would be below minimum
    const newDistance = _tempZoomPosition.distanceTo(controls.target);
    if (newDistance > controls.minDistance) {
      camera.position.copy(_tempZoomPosition);
      controls.update();
    }

    console.log(`Zoom In - Distance: ${newDistance.toFixed(2)}`);
  }
}

/**
 * Zoom Out button handler - increases camera distance
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The controls
 */
export function zoomOut(camera, controls) {
  if (controls) {
    // Reuse temp vector to avoid allocation during user interaction
    _tempZoomDirection.subVectors(camera.position, controls.target).normalize();

    // Calculate current distance
    const currentDistance = camera.position.distanceTo(controls.target);

    // Calculate zoom amount (10% of current distance, minimum 10 units)
    const zoomAmount = Math.max(currentDistance * 0.1, 10);

    // Calculate new position using temp vector to avoid allocation
    _tempZoomPosition
      .copy(camera.position)
      .add(_tempZoomDirection.multiplyScalar(zoomAmount));

    // Check if new distance would be above maximum
    const newDistance = _tempZoomPosition.distanceTo(controls.target);
    if (newDistance < controls.maxDistance) {
      camera.position.copy(_tempZoomPosition);
      controls.update();
    }

    console.log(`Zoom Out - Distance: ${newDistance.toFixed(2)}`);
  }
}

/**
 * Update automatic rotation
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The controls
 * @param {boolean} autoRotationEnabled - Whether auto-rotation is enabled
 */
export function updateAutoRotation(camera, controls, autoRotationEnabled) {
  if (autoRotationEnabled && controls) {
    // Rotation speed chosen for smooth, noticeable orbit without inducing motion sickness
    const rotationSpeed = 0.2 * (Math.PI / 180);

    // Get current camera position relative to target
    _tempOffset.copy(camera.position).sub(controls.target);

    // Apply rotation around Y-axis (vertical axis)
    const cosAngle = Math.cos(rotationSpeed);
    const sinAngle = Math.sin(rotationSpeed);

    const newX = _tempOffset.x * cosAngle - _tempOffset.z * sinAngle;
    const newZ = _tempOffset.x * sinAngle + _tempOffset.z * cosAngle;

    _tempOffset.x = newX;
    _tempOffset.z = newZ;

    // Update camera position
    camera.position.copy(controls.target).add(_tempOffset);
  }
}
