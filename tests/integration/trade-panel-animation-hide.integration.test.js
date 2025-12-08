'use strict';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';
import { JumpAnimationSystem } from '../../js/game-animation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { setupThreeMock } from '../setup-three-mock.js';

/**
 * Integration tests for panel hiding during jump animation
 *
 * Verifies that all visible panels (station interface, trade, refuel, info broker)
 * are automatically hidden when a jump animation starts and restored when complete.
 */
describe('Panel Animation Hide Integration', () => {
  let gameStateManager;
  let uiManager;
  let navigationSystem;
  let animationSystem;
  let mockScene;
  let mockCamera;
  let mockControls;

  beforeEach(() => {
    // Set up Three.js mock
    setupThreeMock();

    // Mock requestAnimationFrame to execute immediately
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback(performance.now());
      return 0;
    });

    // Mock performance.now() to return consistent values
    let mockTime = 0;
    vi.stubGlobal('performance', {
      now: () => {
        mockTime += 100; // Advance time by 100ms each call
        return mockTime;
      },
    });

    // Set up DOM elements
    document.body.innerHTML = `
      <div id="game-hud" class="game-hud">
        <div id="hud-credits">0</div>
        <div id="hud-debt">0</div>
        <div id="hud-days">0</div>
        <div id="fuel-bar"></div>
        <div id="hud-fuel-text">100%</div>
        <div id="hud-cargo">0/100</div>
        <div id="hud-system">Sol</div>
        <div id="hud-distance">0.0 LY</div>
        <button id="quick-system-info-btn"></button>
        <button id="quick-station-btn"></button>
      </div>
      <div id="trade-panel" class="trade-panel">
        <div id="trade-system-name"></div>
        <button id="trade-close-btn"></button>
        <button id="trade-back-btn"></button>
        <div id="market-goods"></div>
        <div id="cargo-stacks"></div>
        <div id="trade-cargo-used">0</div>
        <div id="trade-cargo-capacity">100</div>
        <div id="trade-cargo-remaining">100</div>
      </div>
      <div id="station-interface">
        <div id="station-name"></div>
        <div id="station-system-name"></div>
        <div id="station-distance"></div>
        <button id="station-close-btn"></button>
        <button id="trade-btn"></button>
        <button id="refuel-btn"></button>
        <button id="undock-btn"></button>
        <button id="info-broker-btn"></button>
      </div>
      <div id="refuel-panel">
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
      </div>
      <div id="info-broker-panel">
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
        <div id="market-data-content">
          <div id="market-data-list"></div>
        </div>
      </div>
      <div id="notification-area"></div>
      <div id="event-modal-overlay" class="hidden">
        <div id="event-modal-title"></div>
        <div id="event-modal-description"></div>
        <div id="event-modal-duration"></div>
        <button id="event-modal-dismiss"></button>
      </div>
      <div id="hud">
        <div id="system-info-panel"></div>
      </div>
    `;

    // Initialize game state
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Initialize UI manager
    uiManager = new UIManager(gameStateManager);

    // Initialize navigation system
    navigationSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Mock Three.js objects
    mockScene = {
      add: vi.fn(),
      remove: vi.fn(),
    };

    mockCamera = {
      position: { x: 0, y: 0, z: 0, copy: vi.fn() },
    };

    mockControls = {
      enabled: true,
      target: { x: 0, y: 0, z: 0, copy: vi.fn() },
      update: vi.fn(),
    };

    // Initialize animation system
    animationSystem = new JumpAnimationSystem(
      mockScene,
      mockCamera,
      mockControls,
      TEST_STAR_DATA
    );
  });

  it('should hide station interface when jump animation starts and restore it when animation completes', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show station interface
    uiManager.showStationInterface();
    expect(uiManager.isStationVisible()).toBe(true);

    // Execute jump with animation (Sol to Alpha Centauri)
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify station interface is visible again after animation
    expect(uiManager.isStationVisible()).toBe(true);
  });

  it('should not show station interface after animation if it was not visible before', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Ensure station interface is hidden
    uiManager.hideStationInterface();
    expect(uiManager.isStationVisible()).toBe(false);

    // Execute jump with animation (Sol to Alpha Centauri)
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify station interface is still hidden after animation
    expect(uiManager.isStationVisible()).toBe(false);
  });

  it('should restore station interface even if animation fails', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show station interface
    uiManager.showStationInterface();
    expect(uiManager.isStationVisible()).toBe(true);

    // Execute jump with invalid system ID to trigger error
    const result = await navigationSystem.executeJump(
      gameStateManager,
      999, // Invalid system ID
      animationSystem,
      uiManager
    );

    // Verify jump failed
    expect(result.success).toBe(false);

    // Station interface should still be visible (not affected by failed jump)
    expect(uiManager.isStationVisible()).toBe(true);
  });

  it('should work correctly when no uiManager is provided', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Execute jump without uiManager (should not throw error)
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      null // No UI manager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);
  });

  it('should work correctly when no animationSystem is provided', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show station interface
    uiManager.showStationInterface();
    expect(uiManager.isStationVisible()).toBe(true);

    // Execute jump without animation system
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      null, // No animation system
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Station interface should still be visible (no animation to hide it)
    expect(uiManager.isStationVisible()).toBe(true);
  });

  it('should hide and restore trade panel during animation', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show trade panel
    uiManager.showTradePanel();
    expect(uiManager.isTradeVisible()).toBe(true);

    // Execute jump with animation
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify trade panel is visible again after animation
    expect(uiManager.isTradeVisible()).toBe(true);
  });

  it('should hide and restore refuel panel during animation', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show refuel panel
    uiManager.showRefuelPanel();
    expect(uiManager.isRefuelVisible()).toBe(true);

    // Execute jump with animation
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify refuel panel is visible again after animation
    expect(uiManager.isRefuelVisible()).toBe(true);
  });

  it('should hide and restore info broker panel during animation', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show info broker panel
    uiManager.showInfoBrokerPanel();
    expect(uiManager.isInfoBrokerVisible()).toBe(true);

    // Execute jump with animation
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify info broker panel is visible again after animation
    expect(uiManager.isInfoBrokerVisible()).toBe(true);
  });

  it('should hide and restore trade panel even when opened from station', async () => {
    // Ensure player has enough fuel for jump
    gameStateManager.updateFuel(100);

    // Show trade panel (which hides station interface in normal flow)
    uiManager.showTradePanel();
    expect(uiManager.isTradeVisible()).toBe(true);
    expect(uiManager.isStationVisible()).toBe(false); // Station is hidden when trade is shown

    // Execute jump with animation
    const result = await navigationSystem.executeJump(
      gameStateManager,
      1, // Alpha Centauri
      animationSystem,
      uiManager
    );

    // Verify jump was successful
    expect(result.success).toBe(true);

    // Verify trade panel is visible again after animation
    expect(uiManager.isTradeVisible()).toBe(true);
    // Station should still be hidden (maintains the state before jump)
    expect(uiManager.isStationVisible()).toBe(false);
  });
});
