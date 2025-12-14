'use strict';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { NavigationSystem } from '../../js/game-navigation.js';
import { UIManager } from '../../js/game-ui.js';
import { JumpAnimationSystem } from '../../js/game-animation.js';
import { setupThreeMock } from '../setup-three-mock.js';

/**
 * Integration test for HUD updates during jump animation
 *
 * Validates Requirement 8.5: WHEN the animation is playing THEN the HUD SHALL
 * display the updated location, fuel, and time values
 *
 * This test verifies that:
 * 1. State change events fire before animation begins
 * 2. HUD displays updated values during animation playback
 * 3. UI updates are visible throughout the animation sequence
 */
describe('HUD Animation State Integration', () => {
  let gameStateManager;
  let navigationSystem;
  let uiManager;
  let animationSystem;
  let mockScene;
  let mockCamera;
  let mockControls;
  let starData;
  let wormholeData;

  beforeEach(() => {
    // Setup Three.js mocks
    setupThreeMock();

    // Create mock objects
    mockScene = new window.THREE.Scene();
    mockCamera = new window.THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    mockCamera.position.set(0, 0, 100);

    mockControls = {
      enabled: true,
      target: new window.THREE.Vector3(0, 0, 0),
      update: vi.fn(),
    };

    // Setup test star data (Sol and Alpha Centauri)
    starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2', wh: 1, st: 1, r: 1 },
      {
        id: 1,
        name: 'Alpha Centauri',
        x: 43.5,
        y: 0,
        z: 0,
        type: 'G2',
        wh: 1,
        st: 1,
        r: 1,
      },
    ];

    wormholeData = [[0, 1]];

    // Create DOM elements for HUD
    document.body.innerHTML = `
      <div id="game-hud">
        <span id="hud-credits">0</span>
        <span id="hud-debt">0</span>
        <span id="hud-days">0</span>
        <div id="fuel-bar"></div>
        <span id="hud-fuel-text">100%</span>
        <span id="hud-cargo">0/50</span>
        <span id="hud-system">Sol</span>
        <span id="hud-distance">0.0 LY</span>
      </div>
      <div id="station-interface"></div>
      <div id="station-name"></div>
      <div id="station-system-name"></div>
      <div id="station-distance"></div>
      <button id="station-close-btn"></button>
      <button id="trade-btn"></button>
      <button id="refuel-btn"></button>
      <button id="undock-btn"></button>
      <div id="trade-panel"></div>
      <div id="trade-system-name"></div>
      <button id="trade-close-btn"></button>
      <button id="trade-back-btn"></button>
      <div id="market-goods"></div>
      <div id="cargo-stacks"></div>
      <span id="trade-cargo-used">0</span>
      <span id="trade-cargo-capacity">50</span>
      <span id="trade-cargo-remaining">50</span>
      <div id="refuel-panel"></div>
      <div id="refuel-system-name"></div>
      <div id="refuel-current-fuel"></div>
      <div id="refuel-price-per-percent"></div>
      <input id="refuel-amount-input" type="number" />
      <div id="refuel-total-cost"></div>
      <button id="refuel-confirm-btn"></button>
      <button id="refuel-close-btn"></button>
      <button id="refuel-back-btn"></button>
      <button id="refuel-max-btn"></button>
      <div id="refuel-validation-message"></div>
      <button id="info-broker-btn"></button>
      <div id="info-broker-panel"></div>
      <div id="info-broker-system-name"></div>
      <button id="info-broker-close-btn"></button>
      <button id="info-broker-back-btn"></button>
      <button id="buy-rumor-btn"></button>
      <div id="rumor-text"></div>
      <div id="intelligence-list"></div>
      <div id="info-broker-validation-message"></div>
      <button id="purchase-tab"></button>
      <button id="market-data-tab"></button>
      <div id="purchase-intel-content"></div>
      <div id="market-data-content"></div>
      <div id="market-data-list"></div>
      <div id="notification-area"></div>
      <div id="event-modal-overlay"></div>
      <div id="event-modal-title"></div>
      <div id="event-modal-description"></div>
      <div id="event-modal-duration"></div>
      <button id="event-modal-dismiss"></button>
    `;

    // Initialize game systems
    gameStateManager = new GameStateManager(starData, wormholeData);
    navigationSystem = new NavigationSystem(starData, wormholeData);
    uiManager = new UIManager(gameStateManager);
    animationSystem = new JumpAnimationSystem(
      mockScene,
      mockCamera,
      mockControls,
      starData
    );

    // Initialize game state
    gameStateManager.initNewGame();

    // Mock animation methods to resolve immediately
    // This allows us to test state updates without waiting for actual animations
    vi.spyOn(animationSystem, 'animateCameraTransition').mockResolvedValue(
      undefined
    );
    vi.spyOn(animationSystem, 'animateShipTravel').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should update HUD before animation begins', async () => {
    // Record initial HUD values
    const initialSystem = document.getElementById('hud-system').textContent;
    const initialFuel = document.getElementById('hud-fuel-text').textContent;
    const initialDays = document.getElementById('hud-days').textContent;

    expect(initialSystem).toBe('Sol');
    expect(initialFuel).toBe('100%');
    expect(initialDays).toBe('0');

    // Track when state changes occur relative to animation
    let stateChangedBeforeAnimation = false;
    let hudUpdatedDuringAnimation = false;

    // Spy on animation system to detect when animation starts
    const originalPlayAnimation =
      animationSystem.playJumpAnimation.bind(animationSystem);
    animationSystem.playJumpAnimation = async function (originId, destId) {
      // Check if HUD was already updated before animation starts
      const systemDuringAnimation =
        document.getElementById('hud-system').textContent;
      const fuelDuringAnimation =
        document.getElementById('hud-fuel-text').textContent;
      const daysDuringAnimation =
        document.getElementById('hud-days').textContent;

      if (
        systemDuringAnimation === 'Alpha Centauri' &&
        fuelDuringAnimation !== '100%' &&
        daysDuringAnimation !== '0'
      ) {
        hudUpdatedDuringAnimation = true;
      }

      return originalPlayAnimation(originId, destId);
    };

    // Subscribe to state changes to verify they fire before animation
    gameStateManager.subscribe('locationChanged', () => {
      if (!animationSystem.isAnimating) {
        stateChangedBeforeAnimation = true;
      }
    });

    // Execute jump
    await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Verify state changes occurred before animation
    expect(stateChangedBeforeAnimation).toBe(true);

    // Verify HUD was updated during animation
    expect(hudUpdatedDuringAnimation).toBe(true);

    // Verify final HUD values
    const finalSystem = document.getElementById('hud-system').textContent;
    const finalFuel = document.getElementById('hud-fuel-text').textContent;
    const finalDays = document.getElementById('hud-days').textContent;

    expect(finalSystem).toBe('Alpha Centauri');
    expect(finalFuel).not.toBe('100%'); // Fuel consumed
    expect(finalDays).not.toBe('0'); // Time advanced
  });

  it('should display updated location during animation', async () => {
    // Execute jump
    const jumpPromise = navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Check HUD immediately (should be updated before animation starts)
    // Use a small delay to ensure state updates have propagated
    await new Promise((resolve) => setTimeout(resolve, 10));

    const systemDuringAnimation =
      document.getElementById('hud-system').textContent;
    expect(systemDuringAnimation).toBe('Alpha Centauri');

    // Wait for animation to complete
    await jumpPromise;

    // Verify location is still correct after animation
    const systemAfterAnimation =
      document.getElementById('hud-system').textContent;
    expect(systemAfterAnimation).toBe('Alpha Centauri');
  });

  it('should display updated fuel during animation', async () => {
    const initialFuel = gameStateManager.getState().ship.fuel;

    // Execute jump
    const jumpPromise = navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Check HUD immediately (should be updated before animation starts)
    await new Promise((resolve) => setTimeout(resolve, 10));

    const fuelTextDuringAnimation =
      document.getElementById('hud-fuel-text').textContent;
    const fuelValueDuringAnimation = parseFloat(fuelTextDuringAnimation);

    expect(fuelValueDuringAnimation).toBeLessThan(initialFuel);

    // Wait for animation to complete
    await jumpPromise;

    // Verify fuel is still correct after animation
    const fuelTextAfterAnimation =
      document.getElementById('hud-fuel-text').textContent;
    const fuelValueAfterAnimation = parseFloat(fuelTextAfterAnimation);

    expect(fuelValueAfterAnimation).toBeLessThan(initialFuel);
    expect(fuelValueAfterAnimation).toBe(fuelValueDuringAnimation);
  });

  it('should display updated time during animation', async () => {
    const initialDays = gameStateManager.getState().player.daysElapsed;

    // Execute jump
    const jumpPromise = navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Check HUD immediately (should be updated before animation starts)
    await new Promise((resolve) => setTimeout(resolve, 10));

    const daysDuringAnimation = parseInt(
      document.getElementById('hud-days').textContent
    );

    expect(daysDuringAnimation).toBeGreaterThan(initialDays);

    // Wait for animation to complete
    await jumpPromise;

    // Verify time is still correct after animation
    const daysAfterAnimation = parseInt(
      document.getElementById('hud-days').textContent
    );

    expect(daysAfterAnimation).toBeGreaterThan(initialDays);
    expect(daysAfterAnimation).toBe(daysDuringAnimation);
  });

  it('should update all HUD elements reactively via event system', async () => {
    // Track which HUD elements were updated
    // Record initial HUD values
    const initialLocation = document.getElementById('hud-system').textContent;
    const initialFuel = document.getElementById('hud-fuel-text').textContent;
    const initialDays = document.getElementById('hud-days').textContent;

    // Execute jump
    await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Verify HUD elements were updated via reactive event system
    const finalLocation = document.getElementById('hud-system').textContent;
    const finalFuel = document.getElementById('hud-fuel-text').textContent;
    const finalDays = document.getElementById('hud-days').textContent;

    expect(finalLocation).not.toBe(initialLocation);
    expect(finalLocation).toBe('Alpha Centauri');
    expect(finalFuel).not.toBe(initialFuel); // Fuel consumed
    expect(finalDays).not.toBe(initialDays); // Time advanced
  });

  it('should maintain HUD visibility during animation', async () => {
    const hudElement = document.getElementById('game-hud');

    // Ensure HUD is visible before jump
    uiManager.showHUD();
    expect(hudElement.classList.contains('visible')).toBe(true);

    // Execute jump
    const jumpPromise = navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem
    );

    // Check HUD visibility during animation
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(hudElement.classList.contains('visible')).toBe(true);

    // Wait for animation to complete
    await jumpPromise;

    // Verify HUD is still visible after animation
    expect(hudElement.classList.contains('visible')).toBe(true);
  });
});
