'use strict';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';

/**
 * Unit tests for HUD condition bar display updates
 *
 * Verifies that the UIManager correctly updates HUD condition bars
 * when ship condition changes, including:
 * - Bar width reflects condition percentage
 * - Text displays correct percentage value
 * - Works for hull, engine, and life support (not just fuel)
 */

describe('Unit: HUD Condition Display Update', () => {
  let gameStateManager;
  let uiManager;
  let container;

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement('div');
    container.innerHTML = `
      <div id="game-hud">
        <div class="hud-section">
          <div id="hud-credits">1000</div>
          <div id="hud-debt">0</div>
          <div id="hud-days">1</div>
          <div id="fuel-bar" style="width: 100%"></div>
          <div id="hud-fuel-text">100%</div>
          <div id="hull-bar" style="width: 100%"></div>
          <div id="hud-hull-text">100%</div>
          <div id="engine-bar" style="width: 100%"></div>
          <div id="hud-engine-text">100%</div>
          <div id="life-support-bar" style="width: 100%"></div>
          <div id="hud-life-support-text">100%</div>
          <div id="hud-cargo">0/50</div>
          <div id="hud-system">Sol</div>
          <div id="hud-distance">0.0 LY</div>
        </div>
      </div>
      <button id="quick-system-info-btn"></button>
      <button id="quick-station-btn"></button>
      <div id="hud"></div>
      <div id="station-interface"></div>
      <div id="trade-panel"></div>
      <div id="refuel-panel"></div>
      <div id="info-broker-panel"></div>
      <div id="repair-panel"></div>
      <div id="notification-area"></div>
      <div id="event-modal-overlay"></div>
    `;
    document.body.appendChild(container);

    // Initialize game state manager with minimal star data
    const starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 1, st: 1, r: 1 },
    ];
    gameStateManager = new GameStateManager(starData);

    // Mock the UIManager methods that aren't relevant to this test
    vi.spyOn(
      UIManager.prototype,
      'setupStationInterfaceHandlers'
    ).mockImplementation(() => {});
    vi.spyOn(UIManager.prototype, 'setupEventModalHandlers').mockImplementation(
      () => {}
    );
    vi.spyOn(
      UIManager.prototype,
      'setupQuickAccessHandlers'
    ).mockImplementation(() => {});

    uiManager = new UIManager(gameStateManager);
  });

  it('should update hull bar width and text when condition changes', () => {
    const hullBar = document.getElementById('hull-bar');
    const hullText = document.getElementById('hud-hull-text');

    // Initial state should be 100%
    expect(hullBar.style.width).toBe('100%');
    expect(hullText.textContent).toBe('100%');

    // Update hull condition to 90%
    uiManager.updateConditionDisplay('', 'hull', 90);

    // Verify bar width and text updated
    expect(hullBar.style.width).toBe('90%');
    expect(hullText.textContent).toBe('90%');
  });

  it('should update engine bar width and text when condition changes', () => {
    const engineBar = document.getElementById('engine-bar');
    const engineText = document.getElementById('hud-engine-text');

    // Initial state should be 100%
    expect(engineBar.style.width).toBe('100%');
    expect(engineText.textContent).toBe('100%');

    // Update engine condition to 95%
    uiManager.updateConditionDisplay('', 'engine', 95);

    // Verify bar width and text updated
    expect(engineBar.style.width).toBe('95%');
    expect(engineText.textContent).toBe('95%');
  });

  it('should update life support bar width and text when condition changes', () => {
    const lifeSupportBar = document.getElementById('life-support-bar');
    const lifeSupportText = document.getElementById('hud-life-support-text');

    // Initial state should be 100%
    expect(lifeSupportBar.style.width).toBe('100%');
    expect(lifeSupportText.textContent).toBe('100%');

    // Update life support condition to 89%
    uiManager.updateConditionDisplay('', 'lifeSupport', 89);

    // Verify bar width and text updated
    expect(lifeSupportBar.style.width).toBe('89%');
    expect(lifeSupportText.textContent).toBe('89%');
  });

  it('should update all condition bars when updateShipCondition is called', () => {
    const hullBar = document.getElementById('hull-bar');
    const hullText = document.getElementById('hud-hull-text');
    const engineBar = document.getElementById('engine-bar');
    const engineText = document.getElementById('hud-engine-text');
    const lifeSupportBar = document.getElementById('life-support-bar');
    const lifeSupportText = document.getElementById('hud-life-support-text');

    // Update all conditions at once
    uiManager.updateShipCondition({
      hull: 75,
      engine: 82,
      lifeSupport: 68,
    });

    // Verify all bars and text updated correctly
    expect(hullBar.style.width).toBe('75%');
    expect(hullText.textContent).toBe('75%');
    expect(engineBar.style.width).toBe('82%');
    expect(engineText.textContent).toBe('82%');
    expect(lifeSupportBar.style.width).toBe('68%');
    expect(lifeSupportText.textContent).toBe('68%');
  });

  it('should round fractional percentages when displaying text', () => {
    const hullBar = document.getElementById('hull-bar');
    const hullText = document.getElementById('hud-hull-text');

    // Update with fractional percentage
    uiManager.updateConditionDisplay('', 'hull', 87.6);

    // Bar width should preserve decimal
    expect(hullBar.style.width).toBe('87.6%');
    // Text should be rounded
    expect(hullText.textContent).toBe('88%');
  });

  it('should handle zero percent condition', () => {
    const engineBar = document.getElementById('engine-bar');
    const engineText = document.getElementById('hud-engine-text');

    // Update to 0%
    uiManager.updateConditionDisplay('', 'engine', 0);

    // Verify bar and text show 0%
    expect(engineBar.style.width).toBe('0%');
    expect(engineText.textContent).toBe('0%');
  });

  it('should handle 100 percent condition', () => {
    const lifeSupportBar = document.getElementById('life-support-bar');
    const lifeSupportText = document.getElementById('hud-life-support-text');

    // Update to 100%
    uiManager.updateConditionDisplay('', 'lifeSupport', 100);

    // Verify bar and text show 100%
    expect(lifeSupportBar.style.width).toBe('100%');
    expect(lifeSupportText.textContent).toBe('100%');
  });

  it('should throw error when condition object is null', () => {
    // Should throw when called with null to expose invalid state
    expect(() => {
      uiManager.updateShipCondition(null);
    }).toThrow(
      'Invalid game state: ship condition is null in updateShipCondition'
    );
  });

  it('should throw error when condition object is undefined', () => {
    // Should throw when called with undefined to expose invalid state
    expect(() => {
      uiManager.updateShipCondition(undefined);
    }).toThrow(
      'Invalid game state: ship condition is null in updateShipCondition'
    );
  });
});
