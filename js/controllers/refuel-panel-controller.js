'use strict';

import { SHIP_CONFIG } from '../game-constants.js';

// Reasonable default refuel amount for quick refueling without overwhelming new players
const DEFAULT_REFUEL_AMOUNT = 10;

/**
 * RefuelPanelController - Manages refuel panel UI and interactions
 *
 * Part of the architecture-refactor pattern where UIManager delegates panel-specific
 * logic to focused controllers. This controller owns all refuel panel behavior including
 * display updates, cost calculations, validation, and transaction execution.
 *
 * Responsibilities:
 * - Display current fuel and refuel pricing based on system location
 * - Calculate refuel costs dynamically as user adjusts amount
 * - Validate refuel transactions against credits and fuel capacity
 * - Display real-time validation messages per UX patterns
 * - Execute refuel transactions through GameStateManager
 *
 * Dependencies:
 * - Receives DOM elements, GameStateManager, and starData via constructor
 * - Never queries DOM directly - uses only provided element references
 * - Delegates all state changes to GameStateManager
 *
 * Architecture: architecture-refactor
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4
 *
 * @class
 */
export class RefuelPanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!gameStateManager) {
      throw new Error(
        'RefuelPanelController: gameStateManager parameter required'
      );
    }
    if (!starData) {
      throw new Error('RefuelPanelController: starData parameter required');
    }

    // Validate elements object has required properties
    // If any are missing, UIManager initialization is broken
    const requiredElements = [
      'refuelPanel',
      'refuelSystemName',
      'refuelCurrentFuel',
      'refuelPricePerPercent',
      'refuelAmountInput',
      'refuelTotalCost',
      'refuelConfirmBtn',
      'refuelValidationMessage',
    ];

    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      throw new Error(
        `RefuelPanelController: Missing required DOM elements: ${missingElements.join(', ')}`
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;
  }

  show() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in show');
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.elements.refuelSystemName.textContent = system.name;

    const currentFuel = state.ship.fuel;
    this.elements.refuelCurrentFuel.textContent = `${Math.round(currentFuel)}%`;

    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);
    this.elements.refuelPricePerPercent.textContent = `${fuelPrice} cr/%`;

    const defaultAmount = Math.min(
      DEFAULT_REFUEL_AMOUNT,
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - Math.round(currentFuel)
    );
    this.elements.refuelAmountInput.value =
      defaultAmount > 0 ? defaultAmount : 0;
    this.elements.refuelAmountInput.max =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - Math.round(currentFuel);

    this.updateRefuelCost();

    this.elements.refuelPanel.classList.add('visible');
  }

  hide() {
    this.elements.refuelPanel.classList.remove('visible');
  }

  updateRefuelCost() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in updateRefuelCost');
    }

    const amount = parseInt(this.elements.refuelAmountInput.value) || 0;
    const currentSystemId = state.player.currentSystem;
    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);

    const totalCost = amount * fuelPrice;
    this.elements.refuelTotalCost.textContent = `${totalCost} cr`;

    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;

    const validation = this.gameStateManager.validateRefuel(
      currentFuel,
      amount,
      credits,
      fuelPrice
    );

    // Update button state
    this.elements.refuelConfirmBtn.disabled = !validation.valid || amount <= 0;

    // Show validation message if there's an issue
    if (amount <= 0) {
      this.elements.refuelValidationMessage.textContent =
        'Enter an amount to refuel';
      this.elements.refuelValidationMessage.className =
        'validation-message info';
    } else if (!validation.valid) {
      this.elements.refuelValidationMessage.textContent = validation.reason;
      this.elements.refuelValidationMessage.className =
        'validation-message error';
    } else {
      // Valid - hide message
      this.elements.refuelValidationMessage.textContent = '';
      this.elements.refuelValidationMessage.className = 'validation-message';
    }
  }

  handleRefuelMax() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in handleRefuelMax');
    }

    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const currentSystemId = state.player.currentSystem;
    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);

    // Calculate max affordable amount
    const maxAffordable = Math.floor(credits / fuelPrice);

    // Calculate max capacity amount
    const maxCapacity = Math.floor(
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentFuel
    );

    // Use the smaller of the two
    const maxAmount = Math.min(maxAffordable, maxCapacity);

    // Set the amount
    const actualAmount = Math.max(0, maxAmount);
    this.elements.refuelAmountInput.value = actualAmount;
    this.updateRefuelCost();
  }

  handleRefuelConfirm() {
    const amount = parseInt(this.elements.refuelAmountInput.value) || 0;

    if (amount <= 0) {
      throw new Error('Refuel failed: Invalid amount');
    }

    const refuelOutcome = this.gameStateManager.refuel(amount);

    if (!refuelOutcome.success) {
      throw new Error(`Refuel failed: ${refuelOutcome.reason}`);
    }

    // Refresh the refuel panel to show updated state
    this.show();
  }
}
