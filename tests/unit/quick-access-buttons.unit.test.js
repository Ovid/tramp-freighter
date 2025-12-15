'use strict';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../js/ui/ui-manager.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Quick Access Buttons', () => {
  let uiManager;
  let gameStateManager;

  beforeEach(() => {
    // Create mock DOM elements
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
      <div id="hud"></div>
      <div id="station-interface">
        <h2 id="station-name">Station Name</h2>
        <span id="station-system-name">Sol</span>
        <span id="station-distance">0.0 LY</span>
      </div>
      <div id="notification-area"></div>
    `;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    uiManager = new UIManager(gameStateManager);
  });

  describe('Quick Access Button Initialization', () => {
    it('should cache quick access button elements', () => {
      expect(uiManager.elements.quickSystemInfoBtn).toBeTruthy();
      expect(uiManager.elements.quickStationBtn).toBeTruthy();
    });

    it('should attach click handlers to quick access buttons', () => {
      const showSystemInfoSpy = vi.spyOn(uiManager, 'showSystemInfoPanel');
      const openStationSpy = vi.spyOn(uiManager, 'openStationOrShowError');

      const travelBtn = document.getElementById('quick-system-info-btn');
      const tradeBtn = document.getElementById('quick-station-btn');

      travelBtn.click();
      expect(showSystemInfoSpy).toHaveBeenCalledTimes(1);

      tradeBtn.click();
      expect(openStationSpy).toHaveBeenCalledTimes(1);

      showSystemInfoSpy.mockRestore();
      openStationSpy.mockRestore();
    });
  });

  describe('Travel Button State', () => {
    it('should enable Travel button when game is active', () => {
      uiManager.updateQuickAccessButtons();

      const travelBtn = document.getElementById('quick-system-info-btn');
      expect(travelBtn.disabled).toBe(false);
    });

    it('should keep Travel button enabled regardless of system', () => {
      // Move to a mock system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      gameStateManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);
      uiManager.updateQuickAccessButtons();

      const travelBtn = document.getElementById('quick-system-info-btn');
      expect(travelBtn.disabled).toBe(false);
    });
  });

  describe('Trade Button State', () => {
    it('should always enable Trade button (shows error on click if no station)', () => {
      // Sol has a station
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);
      uiManager.updateQuickAccessButtons();

      const tradeBtn = document.getElementById('quick-station-btn');
      expect(tradeBtn.disabled).toBe(false);
    });

    it('should keep Trade button enabled even at system without station', () => {
      // All systems in TEST_STAR_DATA have stations, so we'll mock a system without one
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      gameStateManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);
      uiManager.updateQuickAccessButtons();

      const tradeBtn = document.getElementById('quick-station-btn');
      expect(tradeBtn.disabled).toBe(false);
    });

    it('should keep Trade button enabled when location changes', () => {
      // Start at Sol (has station)
      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      expect(tradeBtn.disabled).toBe(false);

      // Move to a mock system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      uiManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);

      // Button reference is still valid, no need to re-query
      expect(tradeBtn.disabled).toBe(false);
    });
  });

  describe('Travel Button Functionality', () => {
    it('should call showSystemInfoPanel when Travel button is clicked', () => {
      const showSystemInfoPanelSpy = vi.spyOn(uiManager, 'showSystemInfoPanel');

      const travelBtn = document.getElementById('quick-system-info-btn');
      travelBtn.click();

      expect(showSystemInfoPanelSpy).toHaveBeenCalledTimes(1);
    });

    it('should call window.selectStarById with openStation=false', () => {
      window.selectStarById = vi.fn();

      uiManager.showSystemInfoPanel();

      const sol = TEST_STAR_DATA.find((s) => s.name === 'Sol');
      expect(window.selectStarById).toHaveBeenCalledWith(sol.id, false);
    });

    it('should not open station interface when Travel button is clicked', () => {
      window.selectStarById = vi.fn();
      const showStationSpy = vi.spyOn(uiManager, 'showStationInterface');

      uiManager.showSystemInfoPanel();

      expect(showStationSpy).not.toHaveBeenCalled();
    });
  });

  describe('Trade Button Functionality', () => {
    it('should call showStationInterface when Trade button is clicked at system with station', () => {
      const showStationSpy = vi.spyOn(uiManager, 'showStationInterface');

      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      expect(showStationSpy).toHaveBeenCalledTimes(1);
    });

    it('should show error message when Trade button is clicked at system without station', () => {
      const showErrorSpy = vi.spyOn(uiManager, 'showError');

      // Move to system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      uiManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      expect(showErrorSpy).toHaveBeenCalledWith('No station at current system');
    });

    it('should not open station interface when clicking at system without station', () => {
      const showStationSpy = vi.spyOn(uiManager, 'showStationInterface');

      // Move to system without station
      const mockSystemWithoutStation = { id: 999, name: 'Test System', st: 0 };
      uiManager.starData = [...TEST_STAR_DATA, mockSystemWithoutStation];
      gameStateManager.updateLocation(mockSystemWithoutStation.id);

      const tradeBtn = document.getElementById('quick-station-btn');
      tradeBtn.click();

      expect(showStationSpy).not.toHaveBeenCalled();
    });

    it('should open station interface at current system', () => {
      const alphaCentauri = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      gameStateManager.updateLocation(alphaCentauri.id);

      const stationInterface = document.getElementById('station-interface');
      uiManager.showStationInterface();

      expect(stationInterface.classList.contains('visible')).toBe(true);
    });
  });

  describe('Button State Updates', () => {
    it('should update button states when updateHUD is called', () => {
      const updateQuickAccessSpy = vi.spyOn(
        uiManager,
        'updateQuickAccessButtons'
      );

      uiManager.updateHUD();

      expect(updateQuickAccessSpy).toHaveBeenCalled();
    });

    it('should update button states when location changes', () => {
      const updateQuickAccessSpy = vi.spyOn(
        uiManager,
        'updateQuickAccessButtons'
      );

      const alphaCentauri = TEST_STAR_DATA.find(
        (s) => s.name === 'Alpha Centauri A'
      );
      gameStateManager.updateLocation(alphaCentauri.id);

      expect(updateQuickAccessSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing window.selectStarById gracefully', () => {
      window.selectStarById = undefined;

      expect(() => {
        uiManager.showSystemInfoPanel();
      }).not.toThrow();
    });

    it('should handle null game state gracefully', () => {
      gameStateManager.state = null;

      expect(() => {
        uiManager.updateQuickAccessButtons();
      }).not.toThrow();
    });

    it('should handle missing system data gracefully', () => {
      gameStateManager.updateLocation(999); // Non-existent system

      expect(() => {
        uiManager.updateQuickAccessButtons();
      }).not.toThrow();
    });
  });
});
