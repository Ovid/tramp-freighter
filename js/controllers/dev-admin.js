'use strict';

/**
 * DevAdminPanelController - Development admin panel for testing
 *
 * Provides controls to modify game state for testing purposes.
 * Only available in development mode (localhost).
 */
export class DevAdminPanelController {
  constructor(elements, gameStateManager) {
    if (!elements.devAdminPanel) {
      throw new Error('DevAdminPanelController: devAdminPanel element required');
    }
    if (!gameStateManager) {
      throw new Error('DevAdminPanelController: gameStateManager required');
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (this.elements.devAdminCloseBtn) {
      this.elements.devAdminCloseBtn.addEventListener('click', () => this.hide());
    }

    if (this.elements.devSetCreditsBtn) {
      this.elements.devSetCreditsBtn.addEventListener('click', () => {
        const amount = parseInt(this.elements.devCreditsInput.value);
        if (!isNaN(amount) && amount >= 0) {
          this.gameStateManager.setCredits(amount);
        }
      });
    }

    if (this.elements.devSetDebtBtn) {
      this.elements.devSetDebtBtn.addEventListener('click', () => {
        const amount = parseInt(this.elements.devDebtInput.value);
        if (!isNaN(amount) && amount >= 0) {
          this.gameStateManager.setDebt(amount);
        }
      });
    }

    if (this.elements.devSetFuelBtn) {
      this.elements.devSetFuelBtn.addEventListener('click', () => {
        const amount = parseInt(this.elements.devFuelInput.value);
        if (!isNaN(amount) && amount >= 0 && amount <= 100) {
          this.gameStateManager.setFuel(amount);
        }
      });
    }

    if (this.elements.devRepairAllBtn) {
      this.elements.devRepairAllBtn.addEventListener('click', () => {
        const state = this.gameStateManager.getState();
        state.ship.hull = 100;
        state.ship.engine = 100;
        state.ship.lifeSupport = 100;
        this.gameStateManager.emit('shipConditionChanged', this.gameStateManager.getShipCondition());
        this.refresh();
      });
    }

    if (this.elements.devClearCargoBtn) {
      this.elements.devClearCargoBtn.addEventListener('click', () => {
        const state = this.gameStateManager.getState();
        state.ship.cargo = [];
        state.ship.hiddenCargo = [];
        this.gameStateManager.emit('cargoChanged');
      });
    }
  }

  show() {
    this.elements.devAdminPanel.classList.add('visible');
    this.refresh();
  }

  hide() {
    this.elements.devAdminPanel.classList.remove('visible');
  }

  refresh() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    this.elements.devCreditsInput.value = state.player.credits;
    this.elements.devDebtInput.value = state.player.debt;
    this.elements.devFuelInput.value = Math.round(state.ship.fuel);
  }
}
