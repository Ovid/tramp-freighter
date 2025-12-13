'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { GameStateManager } from '../../js/game-state.js';
import { DevAdminPanelController } from '../../js/controllers/dev-admin.js';
import { STAR_DATA } from '../../js/data/star-data.js';
import { WORMHOLE_DATA } from '../../js/data/wormhole-data.js';

describe('DevAdminPanelController', () => {
  let dom;
  let gameStateManager;
  let controller;
  let elements;

  beforeEach(() => {
    // Create minimal DOM for dev admin panel
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="dev-admin-panel">
            <button id="dev-admin-close-btn">×</button>
            <input type="number" id="dev-credits-input" value="0" />
            <button id="dev-set-credits-btn">Set</button>
            <input type="number" id="dev-debt-input" value="0" />
            <button id="dev-set-debt-btn">Set</button>
            <input type="number" id="dev-fuel-input" value="100" />
            <button id="dev-set-fuel-btn">Set</button>
            <button id="dev-repair-all-btn">Repair All</button>
            <button id="dev-clear-cargo-btn">Clear Cargo</button>
          </div>
        </body>
      </html>
    `);

    global.document = dom.window.document;
    global.window = dom.window;

    // Initialize game state
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Cache elements
    elements = {
      devAdminPanel: document.getElementById('dev-admin-panel'),
      devAdminCloseBtn: document.getElementById('dev-admin-close-btn'),
      devCreditsInput: document.getElementById('dev-credits-input'),
      devSetCreditsBtn: document.getElementById('dev-set-credits-btn'),
      devDebtInput: document.getElementById('dev-debt-input'),
      devSetDebtBtn: document.getElementById('dev-set-debt-btn'),
      devFuelInput: document.getElementById('dev-fuel-input'),
      devSetFuelBtn: document.getElementById('dev-set-fuel-btn'),
      devRepairAllBtn: document.getElementById('dev-repair-all-btn'),
      devClearCargoBtn: document.getElementById('dev-clear-cargo-btn'),
    };

    // Initialize controller
    controller = new DevAdminPanelController(elements, gameStateManager);
  });

  describe('Initialization', () => {
    it('should throw error if devAdminPanel element is missing', () => {
      expect(() => {
        new DevAdminPanelController({}, gameStateManager);
      }).toThrow('DevAdminPanelController: devAdminPanel element required');
    });

    it('should throw error if gameStateManager is missing', () => {
      expect(() => {
        new DevAdminPanelController(elements, null);
      }).toThrow('DevAdminPanelController: gameStateManager required');
    });
  });

  describe('Panel Visibility', () => {
    it('should show panel when show() is called', () => {
      controller.show();
      expect(elements.devAdminPanel.classList.contains('visible')).toBe(true);
    });

    it('should hide panel when hide() is called', () => {
      controller.show();
      controller.hide();
      expect(elements.devAdminPanel.classList.contains('visible')).toBe(false);
    });

    it('should hide panel when close button is clicked', () => {
      controller.show();
      elements.devAdminCloseBtn.click();
      expect(elements.devAdminPanel.classList.contains('visible')).toBe(false);
    });
  });

  describe('Credits Modification', () => {
    it('should set credits when Set button is clicked', () => {
      elements.devCreditsInput.value = '5000';
      elements.devSetCreditsBtn.click();

      const state = gameStateManager.getState();
      expect(state.player.credits).toBe(5000);
    });

    it('should update input field when panel is refreshed', () => {
      gameStateManager.setCredits(1234);
      controller.refresh();
      expect(elements.devCreditsInput.value).toBe('1234');
    });
  });

  describe('Debt Modification', () => {
    it('should set debt when Set button is clicked', () => {
      elements.devDebtInput.value = '2000';
      elements.devSetDebtBtn.click();

      const state = gameStateManager.getState();
      expect(state.player.debt).toBe(2000);
    });

    it('should update input field when panel is refreshed', () => {
      gameStateManager.setDebt(5678);
      controller.refresh();
      expect(elements.devDebtInput.value).toBe('5678');
    });
  });

  describe('Fuel Modification', () => {
    it('should set fuel when Set button is clicked', () => {
      elements.devFuelInput.value = '75';
      elements.devSetFuelBtn.click();

      const state = gameStateManager.getState();
      expect(state.ship.fuel).toBe(75);
    });

    it('should update input field when panel is refreshed', () => {
      gameStateManager.setFuel(42);
      controller.refresh();
      expect(elements.devFuelInput.value).toBe('42');
    });

    it('should not set fuel above 100', () => {
      const initialFuel = gameStateManager.getState().ship.fuel;
      elements.devFuelInput.value = '150';
      elements.devSetFuelBtn.click();

      // Should not change fuel if invalid
      const state = gameStateManager.getState();
      expect(state.ship.fuel).toBe(initialFuel);
    });
  });

  describe('Repair All', () => {
    it('should repair all systems to 100%', () => {
      // Damage ship systems
      gameStateManager.state.ship.hull = 50;
      gameStateManager.state.ship.engine = 60;
      gameStateManager.state.ship.lifeSupport = 70;

      elements.devRepairAllBtn.click();

      const condition = gameStateManager.getShipCondition();
      expect(condition.hull).toBe(100);
      expect(condition.engine).toBe(100);
      expect(condition.lifeSupport).toBe(100);
    });
  });

  describe('Clear Cargo', () => {
    it('should clear all cargo when button is clicked', () => {
      // Add some cargo
      const state = gameStateManager.getState();
      state.ship.cargo = [
        { type: 'grain', quantity: 10, buyPrice: 10, buySystemId: 0, buyDay: 0 },
        { type: 'ore', quantity: 5, buyPrice: 15, buySystemId: 0, buyDay: 0 },
      ];

      elements.devClearCargoBtn.click();

      expect(state.ship.cargo).toEqual([]);
    });

    it('should clear hidden cargo when button is clicked', () => {
      // Add some hidden cargo
      const state = gameStateManager.getState();
      state.ship.hiddenCargo = [
        { type: 'electronics', quantity: 3, buyPrice: 35, buySystemId: 0, buyDay: 0 },
      ];

      elements.devClearCargoBtn.click();

      expect(state.ship.hiddenCargo).toEqual([]);
    });
  });
});
