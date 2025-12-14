'use strict';

// Import Three.js and OrbitControls as ES modules
import * as THREE from 'three';
import {
  GameStateManager,
  sanitizeShipName,
} from '../state/game-state-manager.js';
import { NavigationSystem } from '../game-navigation.js';
import { UIManager } from '../ui/ui-manager.js';
import { JumpAnimationSystem } from '../game-animation.js';
import { STAR_DATA } from '../data/star-data.js';
import { WORMHOLE_DATA } from '../data/wormhole-data.js';
import { initDevMode } from '../game-constants.js';
import { showConfirmModal } from '../ui/modal-manager.js';

// Import starmap modules
import {
  initScene,
  onWindowResize,
  setupSectorBoundary,
  createStarfield,
} from './starmap/scene.js';
import {
  createStarSystems,
  updateLabelScale,
  updateStarPulse,
  updateSelectionRingPulse,
} from './starmap/stars.js';
import {
  createWormholeLines,
  updateConnectionColors,
  getWormholeConnections,
} from './starmap/wormholes.js';
import {
  setupRaycaster,
  selectStar,
  deselectStar,
  getSelectedStar,
  updateCurrentSystemIndicator,
  zoomIn,
  zoomOut,
  updateAutoRotation,
} from './starmap/interaction.js';

// Make THREE available globally for debugging
window.THREE = THREE;

// Scene components
let scene, camera, renderer, controls;

// Runtime star objects storage
let stars = [];

// Sector boundary
let sectorBoundary = null;

// Starfield background
let starfield = null;

// Game systems
let gameStateManager = null;
let navigationSystem = null;
let uiManager = null;
let jumpAnimationSystem = null;

// Rotation state (default: enabled)
let autoRotationEnabled = true;

// Current system indicator
let currentSystemIndicator = null;

// Frame counter for throttling expensive operations
let _frameCount = 0;
const LABEL_UPDATE_INTERVAL = 3; // Update labels every 3 frames (~20fps)

/**
 * Toggle sector boundary visibility
 */
function toggleBoundary() {
  if (sectorBoundary) {
    sectorBoundary.visible = !sectorBoundary.visible;
    console.log(`Sector boundary visibility: ${sectorBoundary.visible}`);
  }
}

/**
 * Toggle rotation
 */
function toggleRotation() {
  // Toggle rotation state
  autoRotationEnabled = !autoRotationEnabled;

  // Update button visual state
  const rotationBtn = document.getElementById('rotation-btn');
  if (autoRotationEnabled) {
    rotationBtn.classList.add('active');
  } else {
    rotationBtn.classList.remove('active');
  }

  console.log(`Auto-rotation ${autoRotationEnabled ? 'enabled' : 'disabled'}`);
}

/**
 * Handle star selection
 */
function handleStarSelected(star) {
  const selectedStar = selectStar(
    star,
    scene,
    camera,
    toggleRotation,
    autoRotationEnabled,
    navigationSystem
  );

  updateHUD(star);
  showHUD();

  // Check if this is the current system and show station interface
  if (uiManager && gameStateManager) {
    uiManager.handleSystemClick(star.data.id);
  }

  return selectedStar;
}

/**
 * Handle star deselection
 */
function handleStarDeselected() {
  deselectStar();
  hideHUD();
}

/**
 * Update the connected systems list in the HUD
 */
function updateConnectedSystemsList(currentSystemId, currentFuel) {
  const connectedList = document.getElementById('connected-list');
  if (!connectedList || !navigationSystem) return;

  // Clear existing list
  connectedList.innerHTML = '';

  // Get connected system IDs
  const connectedIds = navigationSystem.getConnectedSystems(currentSystemId);

  if (connectedIds.length === 0) {
    connectedList.innerHTML =
      '<div style="color: rgba(255,255,255,0.5); font-size: 12px; padding: 8px;">No connected systems</div>';
    return;
  }

  // Sort by distance
  const connectedSystems = connectedIds
    .map((id) => {
      const star = STAR_DATA.find((s) => s.id === id);
      const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
      const distance = navigationSystem.calculateDistanceBetween(
        currentStar,
        star
      );
      const fuelCost = navigationSystem.calculateFuelCost(distance);
      const jumpTime = navigationSystem.calculateJumpTime(distance);
      const canJump = currentFuel >= fuelCost;

      return { id, star, distance, fuelCost, jumpTime, canJump };
    })
    .sort((a, b) => a.distance - b.distance);

  // Create list items
  connectedSystems.forEach((system) => {
    const item = document.createElement('div');
    item.className = 'connected-system-item';
    if (!system.canJump) {
      item.className += ' insufficient-fuel';
    }

    const name = document.createElement('div');
    name.className = 'connected-system-name';
    name.textContent = system.star.name;

    const info = document.createElement('div');
    info.className = 'connected-system-info';
    info.textContent = `${system.distance.toFixed(1)} LY • ${Math.round(system.fuelCost)}% fuel • ${system.jumpTime}d`;

    item.appendChild(name);
    item.appendChild(info);

    // Click handler to select that system
    item.addEventListener('click', () => {
      const targetStar = stars.find((s) => s.data.id === system.id);
      if (targetStar) {
        handleStarSelected(targetStar);
      }
    });

    connectedList.appendChild(item);
  });
}

/**
 * Update system event information display
 *
 * Shows economic events for the selected system if Advanced Sensors upgrade is installed.
 * This allows players to see events before jumping to a system.
 *
 * @param {number} systemId - System to check for events
 */
function updateSystemEventInfo(systemId) {
  const eventInfoElement = document.getElementById('system-event-info');
  const eventNameElement = document.getElementById('system-event-name');
  const eventDescriptionElement = document.getElementById(
    'system-event-description'
  );

  if (!eventInfoElement || !gameStateManager) {
    return;
  }

  // Check if player has Advanced Sensors upgrade
  const state = gameStateManager.getState();
  if (!state) {
    eventInfoElement.style.display = 'none';
    return;
  }

  const hasAdvancedSensors = state.ship.upgrades.includes('advanced_sensors');
  if (!hasAdvancedSensors) {
    eventInfoElement.style.display = 'none';
    return;
  }

  // Check for active event at this system
  const activeEvent = gameStateManager.getActiveEventForSystem(systemId);
  if (!activeEvent) {
    eventInfoElement.style.display = 'none';
    return;
  }

  // Get event type definition
  const eventType = gameStateManager.getEventType(activeEvent.type);
  if (!eventType) {
    eventInfoElement.style.display = 'none';
    return;
  }

  // Show event information
  eventNameElement.textContent = eventType.name;
  eventDescriptionElement.textContent = eventType.description;
  eventInfoElement.style.display = 'block';
}

/**
 * Select a star by its system ID
 */
function selectStarById(systemId, openStation = true) {
  const star = stars.find((s) => s.data.id === systemId);
  if (star) {
    handleStarSelected(star);
  }
}

/**
 * Update HUD with star information
 */
function updateHUD(star) {
  document.getElementById('hud-name').textContent = star.data.name;
  document.getElementById('hud-coords').textContent =
    `${star.data.x}, ${star.data.y}, ${star.data.z}`;
  document.getElementById('hud-spectral').textContent = star.data.type;
  document.getElementById('hud-wormholes').textContent = star.data.wh;
  document.getElementById('hud-reachable').textContent =
    star.data.r === 1 ? 'Reachable' : 'Unreachable';

  // Show event information if Advanced Sensors installed
  updateSystemEventInfo(star.data.id);

  // Update jump information if game is active
  if (gameStateManager && navigationSystem) {
    const state = gameStateManager.getState();
    if (state) {
      const currentSystemId = state.player.currentSystem;
      const targetSystemId = star.data.id;

      // Check if this is the current system
      const isCurrentSystem = currentSystemId === targetSystemId;

      // Get jump info elements
      const jumpInfo = document.getElementById('jump-info');
      const jumpBtn = document.getElementById('jump-btn');
      const dockBtn = document.getElementById('dock-btn');
      const connectedSystems = document.getElementById('connected-systems');

      if (isCurrentSystem) {
        // Hide jump info, show dock button and connected systems
        jumpInfo.style.display = 'none';
        jumpBtn.style.display = 'none';
        dockBtn.style.display = 'block';
        connectedSystems.style.display = 'block';

        // Populate connected systems list
        updateConnectedSystemsList(currentSystemId, state.ship.fuel);
      } else {
        // Show jump info
        jumpInfo.style.display = 'block';
        jumpBtn.style.display = 'block';
        dockBtn.style.display = 'none';
        connectedSystems.style.display = 'none';

        // Validate jump and display info
        const validation = navigationSystem.validateJump(
          currentSystemId,
          targetSystemId,
          state.ship.fuel
        );

        document.getElementById('jump-distance').textContent =
          `${validation.distance.toFixed(1)} LY`;
        document.getElementById('jump-fuel-cost').textContent =
          `${Math.round(validation.fuelCost)}%`;
        document.getElementById('jump-time').textContent =
          `${validation.jumpTime} day${validation.jumpTime !== 1 ? 's' : ''}`;

        // Enable/disable jump button based on validation
        jumpBtn.disabled = !validation.valid;

        // Keep button text consistent, show error in validation message
        jumpBtn.textContent = 'Jump to System';

        // Show validation message if jump not possible
        const jumpValidationMessage = document.getElementById(
          'jump-validation-message'
        );
        if (jumpValidationMessage) {
          if (!validation.valid) {
            jumpValidationMessage.textContent = validation.error;
            jumpValidationMessage.className = 'validation-message error';
          } else {
            jumpValidationMessage.textContent = '';
            jumpValidationMessage.className = 'validation-message';
          }
        }
      }
    }
  }
}

/**
 * Show HUD
 */
function showHUD() {
  document.getElementById('hud').style.display = 'block';
}

/**
 * Hide HUD
 */
function hideHUD() {
  document.getElementById('hud').style.display = 'none';
}

/**
 * Show ship naming dialog
 */
function showShipNamingDialog() {
  return new Promise((resolve) => {
    const overlay = document.getElementById('ship-naming-overlay');
    const input = document.getElementById('ship-name-input');
    const confirmBtn = document.getElementById('ship-name-confirm');
    const suggestionsList = document.getElementById(
      'ship-name-suggestions-list'
    );

    if (!overlay || !input || !confirmBtn || !suggestionsList) {
      console.error('Ship naming dialog elements not found');
      resolve('Serendipity');
      return;
    }

    // Import constants dynamically
    import('../game-constants.js').then((constants) => {
      const { SHIP_CONFIG } = constants;

      // Clear and populate suggestions
      suggestionsList.innerHTML = '';
      SHIP_CONFIG.NAME_SUGGESTIONS.forEach((name) => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = name;
        btn.addEventListener('click', () => {
          input.value = name;
          input.focus();
        });
        suggestionsList.appendChild(btn);
      });

      // Clear input
      input.value = '';

      // Show dialog
      overlay.classList.remove('hidden');

      // Focus input
      input.focus();

      // Handle confirm
      const handleConfirm = () => {
        const inputValue = input.value;
        console.log('Ship name input value:', inputValue);
        const sanitizedName = sanitizeShipName(inputValue);
        console.log('Sanitized ship name:', sanitizedName);
        cleanup();
        resolve(sanitizedName);
      };

      // Handle enter key in input
      const handleEnter = (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
        }
      };

      // Cleanup function
      const cleanup = () => {
        overlay.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        input.removeEventListener('keydown', handleEnter);
      };

      // Add event listeners
      confirmBtn.addEventListener('click', handleConfirm);
      input.addEventListener('keydown', handleEnter);
    });
  });
}

/**
 * Update starfield rotation to match sphere
 */
function updateStarfieldRotation() {
  if (starfield && sectorBoundary) {
    // Match starfield rotation to sector boundary rotation
    starfield.rotation.copy(sectorBoundary.rotation);
  }
}

/**
 * Animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now() * 0.001;
  _frameCount++;

  updateAutoRotation(camera, controls, autoRotationEnabled);

  if (controls) {
    controls.update();
  }

  updateStarPulse(stars, currentTime);

  const selectedStar = getSelectedStar();
  updateSelectionRingPulse(selectedStar, currentSystemIndicator, currentTime);

  if (selectedStar && selectedStar.selectionRing) {
    selectedStar.selectionRing.lookAt(camera.position);
  }

  // Update current system indicator to face camera
  if (currentSystemIndicator) {
    currentSystemIndicator.lookAt(camera.position);
  }

  // Throttle label updates to reduce distanceTo() calls
  if (_frameCount % LABEL_UPDATE_INTERVAL === 0) {
    updateLabelScale(stars, camera);
  }

  updateStarfieldRotation();

  renderer.render(scene, camera);
}

/**
 * Initialize the game after menu selection
 */
async function startGame(isNewGame) {
  // Initialize game state manager
  gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

  // Initialize navigation system
  navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
  gameStateManager.navigationSystem = navigationSystem;

  // Initialize UI manager
  uiManager = new UIManager(gameStateManager);

  // Initialize jump animation system
  jumpAnimationSystem = new JumpAnimationSystem(
    scene,
    camera,
    controls,
    STAR_DATA
  );

  // Load or create game state
  if (isNewGame) {
    // Initialize new game (assigns quirks)
    gameStateManager.initNewGame();

    // Show ship naming dialog after quirk assignment
    const shipName = await showShipNamingDialog();
    console.log('Ship name from dialog:', shipName);

    // Update ship name using proper method (emits shipNameChanged event)
    gameStateManager.updateShipName(shipName);
    console.log('Ship name set in state:', gameStateManager.state.ship.name);

    // Save immediately to persist the ship name
    gameStateManager.saveGame();
    console.log('Game saved with ship name:', gameStateManager.state.ship.name);
  } else {
    const loadedState = gameStateManager.loadGame();
    if (!loadedState) {
      // Load failed, show error and offer new game
      uiManager.showError(
        'Failed to load saved game. Starting new game instead.'
      );
      gameStateManager.initNewGame();

      // Show ship naming dialog for the new game
      const shipName = await showShipNamingDialog();
      gameStateManager.updateShipName(shipName);
      gameStateManager.saveGame();
    }
  }

  // Subscribe to fuel and location changes to update connection colors
  gameStateManager.subscribe('fuelChanged', () => {
    if (gameStateManager && gameStateManager.state) {
      updateConnectionColors(gameStateManager);
    }
  });

  gameStateManager.subscribe('locationChanged', () => {
    if (gameStateManager && gameStateManager.state) {
      updateConnectionColors(gameStateManager);
      currentSystemIndicator = updateCurrentSystemIndicator(
        scene,
        camera,
        stars,
        gameStateManager
      );
    }
  });

  // Initial update of connection colors and current system indicator
  if (gameStateManager && gameStateManager.state) {
    updateConnectionColors(gameStateManager);
    currentSystemIndicator = updateCurrentSystemIndicator(
      scene,
      camera,
      stars,
      gameStateManager
    );
  }

  // Show the game HUD and update it with current state
  uiManager.showHUD();
  uiManager.updateHUD();

  // Make game state manager and UI manager available globally for debugging
  window.gameStateManager = gameStateManager;
  window.uiManager = uiManager;
  window.jumpAnimationSystem = jumpAnimationSystem;

  console.log(
    'Game state manager, UI manager, and animation system initialized'
  );

  // Select current system on initialization
  const currentSystemId = gameStateManager.getPlayer().currentSystem;
  const currentStar = stars.find((star) => star.data.id === currentSystemId);
  if (currentStar) {
    handleStarSelected(currentStar);
    console.log(
      `Current system (${currentStar.data.name}) pre-selected on initialization`
    );

    // Re-enable rotation after initial selection (selectStar disables it)
    // User expects rotation to be on by default
    if (!autoRotationEnabled) {
      toggleRotation();
    }
  } else {
    console.warn(
      `Current system (id: ${currentSystemId}) not found in star data`
    );
  }

  // Hide menu
  const gameMenu = document.getElementById('game-menu');
  if (gameMenu) {
    gameMenu.classList.add('hidden');
  }

  // Setup jump and dock button handlers
  setupJumpAndDockHandlers(navigationSystem);
}

/**
 * Setup event handlers for jump and dock buttons
 */
function setupJumpAndDockHandlers(navigationSystem) {
  const jumpBtn = document.getElementById('jump-btn');
  const dockBtn = document.getElementById('dock-btn');

  if (jumpBtn) {
    jumpBtn.addEventListener('click', async () => {
      const selectedStar = getSelectedStar();
      if (!selectedStar || !gameStateManager) return;

      const targetSystemId = selectedStar.data.id;
      const targetSystemName = selectedStar.data.name;

      // Execute jump with animation system and UI manager
      const result = await navigationSystem.executeJump(
        gameStateManager,
        targetSystemId,
        jumpAnimationSystem,
        uiManager
      );

      if (result.success) {
        // Jump successful - show success message after animation completes
        uiManager.showError(`Jumped to ${targetSystemName}`, 2000);

        // Deselect star and update UI
        handleStarDeselected();

        // Update connection colors and current system indicator
        updateConnectionColors(gameStateManager);
        currentSystemIndicator = updateCurrentSystemIndicator(
          scene,
          camera,
          stars,
          gameStateManager
        );
      } else {
        // Jump failed - show error
        uiManager.showError(result.error);
      }
    });
  }

  if (dockBtn) {
    dockBtn.addEventListener('click', () => {
      if (!gameStateManager) return;

      // Close the system info panel and show station interface
      hideHUD();
      handleStarDeselected();
      uiManager.showStationInterface();
    });
  }
}

/**
 * Initialize the menu and check for saved game
 */
function initMenu() {
  const gameMenu = document.getElementById('game-menu');
  const continueBtn = document.getElementById('continue-btn');
  const newGameBtn = document.getElementById('new-game-btn');

  if (!gameMenu || !continueBtn || !newGameBtn) {
    console.error('Menu elements not found');
    return;
  }

  // Create temporary state manager to check for saved game
  const tempStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
  const hasSave = tempStateManager.hasSavedGame();

  // Show/hide Continue button based on save existence
  if (hasSave) {
    continueBtn.style.display = 'block';
    continueBtn.disabled = false;
  } else {
    continueBtn.style.display = 'none';
    continueBtn.disabled = true;
  }

  // Set up Continue button handler
  continueBtn.addEventListener('click', async () => {
    console.log('Continue game selected');
    await startGame(false);
  });

  // Set up New Game button handler
  newGameBtn.addEventListener('click', async () => {
    // Show confirmation if save exists
    if (hasSave) {
      const confirmed = await showConfirmModal(
        'Starting a new game will overwrite your existing save. Continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    console.log('New game selected');
    await startGame(true);
  });

  // Show menu
  gameMenu.classList.remove('hidden');
}

// Expose functions to global scope for onclick handlers
window.zoomIn = () => zoomIn(camera, controls);
window.zoomOut = () => zoomOut(camera, controls);
window.toggleRotation = toggleRotation;
window.deselectStar = handleStarDeselected;
window.toggleBoundary = toggleBoundary;
window.selectStarById = selectStarById;

// Initialize the application
window.addEventListener('DOMContentLoaded', async () => {
  // Check for dev mode first (looks for .dev file)
  await initDevMode();

  const sceneComponents = initScene();
  scene = sceneComponents.scene;
  camera = sceneComponents.camera;
  renderer = sceneComponents.renderer;
  controls = sceneComponents.controls;

  // Set up window resize handler
  window.addEventListener(
    'resize',
    () => onWindowResize(camera, renderer),
    false
  );

  // Create star systems after scene is initialized
  if (scene) {
    // Create starfield background first (renders behind everything)
    starfield = createStarfield(scene);

    stars = createStarSystems(scene, STAR_DATA);

    // Create wormhole connections after stars are created
    createWormholeLines(scene, WORMHOLE_DATA, stars);

    // Create sector boundary
    sectorBoundary = setupSectorBoundary(scene);

    // Set up raycaster for selection
    setupRaycaster(
      renderer,
      camera,
      stars,
      handleStarSelected,
      handleStarDeselected,
      gameStateManager,
      navigationSystem,
      getWormholeConnections()
    );

    // Initialize menu
    initMenu();

    // Attach event listeners for control buttons
    const hudCloseBtn = document.getElementById('hud-close-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const rotationBtn = document.getElementById('rotation-btn');
    const boundaryBtn = document.getElementById('boundary-btn');

    if (hudCloseBtn)
      hudCloseBtn.addEventListener('click', handleStarDeselected);
    if (zoomInBtn)
      zoomInBtn.addEventListener('click', () => zoomIn(camera, controls));
    if (zoomOutBtn)
      zoomOutBtn.addEventListener('click', () => zoomOut(camera, controls));
    if (rotationBtn) {
      rotationBtn.addEventListener('click', toggleRotation);
      // Initialize button state to match autoRotationEnabled (default: true)
      if (autoRotationEnabled) {
        rotationBtn.classList.add('active');
      }
    }
    if (boundaryBtn) boundaryBtn.addEventListener('click', toggleBoundary);

    // Start animation loop
    animate();
  } else {
    console.error('Failed to initialize scene');
  }
});
