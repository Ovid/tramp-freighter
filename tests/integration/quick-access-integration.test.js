'use strict';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../js/ui/ui-manager.js';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Quick Access Buttons Integration', () => {
  let uiManager;
  let gameStateManager;

  beforeEach(() => {
    // Create complete DOM structure
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
        <button id="quick-station-btn">Trade</button>
        <button id="quick-system-info-btn">Travel</button>
      </div>
      <div id="hud">
        <h2 id="hud-name">System Name</h2>
        <span id="hud-coords">0, 0, 0</span>
        <span id="hud-spectral">G2</span>
        <span id="hud-wormholes">0</span>
        <span id="hud-reachable">Reachable</span>
        <div id="jump-info"></div>
        <div id="connected-systems">
          <div id="connected-list"></div>
        </div>
        <button id="jump-btn">Jump</button>
        <button id="dock-btn">Dock</button>
      </div>
      <div id="station-interface">
        <h2 id="station-name">Station Name</h2>
        <span id="station-system-name">Sol</span>
        <span id="station-distance">0.0 LY</span>
        <button id="station-close-btn">×</button>
        <button id="trade-btn">Trade</button>
        <button id="refuel-btn">Refuel</button>
        <button id="info-broker-btn">Info Broker</button>
        <button id="undock-btn">Undock</button>
      </div>
      <div id="notification-area"></div>
    `;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    uiManager = new UIManager(gameStateManager);
  });

  describe('Complete User Workflow', () => {
    it('should allow reopening system info panel after closing it', () => {
      window.selectStarById = vi.fn();

      // User closes system info panel (simulated)
      const systemInfoPanel = document.getElementById('hud');
      systemInfoPanel.style.display = 'none';

      // User clicks Travel button to reopen
      const travelBtn = document.getElementById('quick-system-info-btn');
      travelBtn.click();

      // Should call selectStarById with current system (Sol) and openStation=false
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      expect(window.selectStarById).toHaveBeenCalledWith(sol.id, false);
    });

    it('should allow reopening station interface after closing it', () => {
      // User is at Sol (has station)
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      // User closes station interface
      const stationInterface = document.getElementById('station-interface');
      stationInterface.classList.remove('visible');

      // User clicks Trade button to reopen
      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      // Station interface should be visible
      expect(stationInterface.classList.contains('visible')).toBe(true);
    });

    it('should handle clicking Travel button multiple times', () => {
      window.selectStarById = vi.fn();

      const travelBtn = document.getElementById('quick-system-info-btn');

      travelBtn.click();
      travelBtn.click();
      travelBtn.click();

      expect(window.selectStarById).toHaveBeenCalledTimes(3);
    });

    it('should handle clicking Trade button multiple times', () => {
      const stationInterface = document.getElementById('station-interface');

      const tradeBtn = document.getElementById('quick-station-btn');

      tradeBtn.click();
      expect(stationInterface.classList.contains('visible')).toBe(true);

      tradeBtn.click();
      expect(stationInterface.classList.contains('visible')).toBe(true);
    });
  });

  describe('Button State Synchronization', () => {
    it('should keep buttons enabled across system changes', () => {
      // Start at Sol (has station)
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      const travelBtn = document.getElementById('quick-system-info-btn');
      expect(tradeBtn.disabled).toBe(false);
      expect(travelBtn.disabled).toBe(false);

      // Jump to a mock system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      uiManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);

      // Button references are still valid, no need to re-query
      expect(tradeBtn.disabled).toBe(false);
      expect(travelBtn.disabled).toBe(false);
    });

    it('should keep Travel button enabled across all systems', () => {
      const travelBtn = document.getElementById('quick-system-info-btn');

      // Check at Sol
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);
      expect(travelBtn.disabled).toBe(false);

      // Check at Alpha Centauri A
      const alphaCentauri = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      gameStateManager.updateLocation(alphaCentauri.id);
      expect(travelBtn.disabled).toBe(false);

      // Check at a mock system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      gameStateManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);
      expect(travelBtn.disabled).toBe(false);
    });
  });

  describe('Panel Independence', () => {
    it('should open system info panel without opening station interface', () => {
      window.selectStarById = vi.fn();

      const stationInterface = document.getElementById('station-interface');
      stationInterface.classList.remove('visible');

      // Click Travel button
      const travelBtn = document.getElementById('quick-system-info-btn');
      travelBtn.click();

      // System info should be requested with openStation=false
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      expect(window.selectStarById).toHaveBeenCalledWith(sol.id, false);

      // Station interface should remain closed
      expect(stationInterface.classList.contains('visible')).toBe(false);
    });

    it('should open station interface without affecting system info panel', () => {
      const systemInfoPanel = document.getElementById('hud');
      const stationInterface = document.getElementById('station-interface');

      // Close both panels
      systemInfoPanel.style.display = 'none';
      stationInterface.classList.remove('visible');

      // Click Trade button
      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      // Station interface should open
      expect(stationInterface.classList.contains('visible')).toBe(true);

      // System info panel state should not change
      expect(systemInfoPanel.style.display).toBe('none');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Remove quick access buttons
      document.getElementById('quick-system-info-btn').remove();
      document.getElementById('quick-station-btn').remove();

      // Create new UI manager
      const newUiManager = new UIManager(gameStateManager);

      expect(() => {
        newUiManager.updateQuickAccessButtons();
      }).not.toThrow();
    });

    // Test removed: With our new fail-fast approach, invalid state should throw errors
    // rather than being handled "gracefully". This exposes bugs during development
    // instead of hiding them with defensive programming.
  });

  describe('User Feedback', () => {
    it('should show error notification when clicking Trade at system without station', () => {
      const showErrorSpy = vi.spyOn(uiManager, 'showError');

      // Move to system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      uiManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      expect(showErrorSpy).toHaveBeenCalledWith('No station at current system');
    });

    it('should not show error when clicking Trade at system with station', () => {
      const showErrorSpy = vi.spyOn(uiManager, 'showError');

      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      expect(showErrorSpy).not.toHaveBeenCalled();
    });

    it('should never show error when clicking Travel button', () => {
      const showErrorSpy = vi.spyOn(uiManager, 'showError');
      window.selectStarById = vi.fn();

      // Try at various systems
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const travelBtn = document.getElementById('quick-system-info-btn');
      travelBtn.click();

      expect(showErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      const travelBtn = document.getElementById('quick-system-info-btn');
      const tradeBtn = document.getElementById('quick-station-btn');

      expect(travelBtn.textContent.trim()).toBe('Travel');
      expect(tradeBtn.textContent.trim()).toBe('Trade');
    });

    it('should keep Trade button enabled even without station', () => {
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      gameStateManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);
      uiManager.updateQuickAccessButtons();

      const tradeBtn = document.getElementById('quick-station-btn');
      expect(tradeBtn.disabled).toBe(false);
    });

    it('should enable buttons with proper enabled state', () => {
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);
      uiManager.updateQuickAccessButtons();

      const travelBtn = document.getElementById('quick-system-info-btn');
      const tradeBtn = document.getElementById('quick-station-btn');

      expect(travelBtn.disabled).toBe(false);
      expect(tradeBtn.disabled).toBe(false);
    });
  });
});
