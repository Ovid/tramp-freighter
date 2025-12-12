'use strict';

import { SHIP_CONFIG } from '../game-constants.js';
import { capitalizeFirst } from '../utils/string-utils.js';

/**
 * RepairPanelController - Manages repair panel UI and interactions
 *
 * Part of the architecture-refactor pattern where UIManager delegates panel-specific
 * logic to focused controllers. This controller owns all repair panel behavior including
 * display updates, cost calculations, validation, and transaction execution.
 *
 * Responsibilities:
 * - Display ship condition for all systems (hull, engine, life support)
 * - Calculate repair costs for individual systems and "Repair All"
 * - Validate repair transactions against credits and condition bounds
 * - Display real-time validation messages per UX patterns
 * - Execute repair transactions through GameStateManager
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
export class RepairPanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!gameStateManager) {
      throw new Error(
        'RepairPanelController: gameStateManager parameter required'
      );
    }
    if (!starData) {
      throw new Error('RepairPanelController: starData parameter required');
    }

    // Validate elements object has required properties
    const requiredElements = [
      'repairPanel',
      'repairSystemName',
      'repairHullPercent',
      'repairHullBar',
      'repairEnginePercent',
      'repairEngineBar',
      'repairLifeSupportPercent',
      'repairLifeSupportBar',
      'repairAllBtn',
      'repairValidationMessage',
    ];

    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      throw new Error(
        `RepairPanelController: Missing required DOM elements: ${missingElements.join(', ')}`
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;

    // Cache repair buttons to avoid repeated DOM queries
    this.cachedRepairButtons = elements.cachedRepairButtons || null;
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

    this.elements.repairSystemName.textContent = system.name;

    // Update condition displays
    this.updateRepairConditionDisplay();

    // Update repair button states and costs
    this.updateRepairButtons();

    // Clear validation message
    this.elements.repairValidationMessage.textContent = '';
    this.elements.repairValidationMessage.className = 'validation-message';

    this.elements.repairPanel.classList.add('visible');
  }

  hide() {
    this.elements.repairPanel.classList.remove('visible');
  }

  /**
   * Update a condition bar and text display
   *
   * Centralizes condition display logic to avoid duplication.
   *
   * @param {string} systemType - One of: 'Hull', 'Engine', 'LifeSupport'
   * @param {number} conditionValue - Condition percentage (0-100)
   */
  updateConditionDisplay(systemType, conditionValue) {
    const barElement = this.elements[`repair${systemType}Bar`];
    const textElement = this.elements[`repair${systemType}Percent`];

    if (barElement) {
      barElement.style.width = `${conditionValue}%`;
    }
    if (textElement) {
      textElement.textContent = `${Math.round(conditionValue)}%`;
    }
  }

  /**
   * Update all ship condition displays in repair panel
   *
   * Refreshes the visual representation of hull, engine, and life support
   * condition in the repair interface. Called when panel opens or after repairs.
   */
  updateRepairConditionDisplay() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in updateRepairConditionDisplay'
      );
    }

    this.updateConditionDisplay('Hull', condition.hull);
    this.updateConditionDisplay('Engine', condition.engine);
    this.updateConditionDisplay('LifeSupport', condition.lifeSupport);
  }

  /**
   * Get current condition value for a specific ship system
   * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @returns {number} Current condition percentage
   */
  getSystemCondition(condition, systemType) {
    switch (systemType) {
      case 'hull':
        return condition.hull;
      case 'engine':
        return condition.engine;
      case 'lifeSupport':
        return condition.lifeSupport;
      default:
        return 0;
    }
  }

  /**
   * Update repair button states and costs based on current ship condition
   *
   * Recalculates repair costs for all buttons and updates their text/disabled state.
   * Buttons are disabled when system is at max, player lacks credits, or repair
   * would exceed maximum condition. Called when repair panel opens or after repairs.
   */
  updateRepairButtons() {
    const state = this.gameStateManager.getState();
    const condition = this.gameStateManager.getShipCondition();
    const credits = state.player.credits;

    // Update repair buttons if they exist (may not exist in test environment)
    if (!this.cachedRepairButtons || this.cachedRepairButtons.length === 0) {
      return;
    }

    this.cachedRepairButtons.forEach((btn) => {
      const systemType = btn.getAttribute('data-system');
      const amountStr = btn.getAttribute('data-amount');
      const currentCondition = this.getSystemCondition(condition, systemType);

      let amount = 0;
      let cost = 0;

      if (amountStr === 'full') {
        // Full repair
        amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
        cost = this.gameStateManager.getRepairCost(
          systemType,
          amount,
          currentCondition
        );
        btn.textContent = `Full (₡${cost})`;
      } else {
        // Fixed amount repair
        amount = parseInt(amountStr);
        cost = this.gameStateManager.getRepairCost(
          systemType,
          amount,
          currentCondition
        );
        btn.textContent = `+${amount}% (₡${cost})`;
      }

      // Disable button if:
      // - Already at max condition
      // - Not enough credits
      // - Would exceed max condition
      const wouldExceedMax =
        currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const atMax = currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const notEnoughCredits = credits < cost;

      btn.disabled = atMax || notEnoughCredits || wouldExceedMax || amount <= 0;
    });

    // Update repair all button
    const totalCost = this.calculateRepairAllCost();
    this.elements.repairAllBtn.textContent = `Repair All to Full (₡${totalCost})`;

    const allAtMax =
      condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
      condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
      condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    this.elements.repairAllBtn.disabled =
      allAtMax || credits < totalCost || totalCost === 0;
  }

  /**
   * Calculate total cost to repair all ship systems to maximum condition
   *
   * Sums the repair costs for hull, engine, and life support to reach 100%.
   * Used to display cost on "Repair All" button and validate transaction.
   *
   * @returns {number} Total repair cost in credits
   */
  calculateRepairAllCost() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in calculateRepairAllCost'
      );
    }

    let totalCost = 0;

    // Hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'hull',
        hullAmount,
        condition.hull
      );
    }

    // Engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'engine',
        engineAmount,
        condition.engine
      );
    }

    // Life Support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'lifeSupport',
        lifeSupportAmount,
        condition.lifeSupport
      );
    }

    return totalCost;
  }

  handleRepairSystem(systemType, amountStr) {
    const state = this.gameStateManager.getState();
    const condition = this.gameStateManager.getShipCondition();
    const currentCondition = this.getSystemCondition(condition, systemType);

    let amount = 0;
    if (amountStr === 'full') {
      amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
    } else {
      amount = parseInt(amountStr);
    }

    // Execute repair
    const repairOutcome = this.gameStateManager.repairShipSystem(
      systemType,
      amount
    );

    if (!repairOutcome.success) {
      this.elements.repairValidationMessage.textContent = `Repair failed: ${repairOutcome.reason}`;
      this.elements.repairValidationMessage.className =
        'validation-message error';
      return { success: false, systemName: this.getSystemName(systemType) };
    }

    // Clear validation message
    this.elements.repairValidationMessage.textContent = '';
    this.elements.repairValidationMessage.className = 'validation-message';

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();

    return { success: true, systemName: this.getSystemName(systemType) };
  }

  handleRepairAll() {
    const condition = this.gameStateManager.getShipCondition();
    const state = this.gameStateManager.getState();
    const totalCost = this.calculateRepairAllCost();

    // Pre-validate total cost before executing any repairs
    if (state.player.credits < totalCost) {
      this.elements.repairValidationMessage.textContent =
        'Insufficient credits for full repair';
      this.elements.repairValidationMessage.className =
        'validation-message error';
      return { success: false, repairCount: 0 };
    }

    let repairCount = 0;
    let failedRepairs = [];

    // Repair hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'hull',
        hullAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Hull: ${repairOutcome.reason}`);
      }
    }

    // Repair engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'engine',
        engineAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Engine: ${repairOutcome.reason}`);
      }
    }

    // Repair life support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'lifeSupport',
        lifeSupportAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Life Support: ${repairOutcome.reason}`);
      }
    }

    // Show results
    if (failedRepairs.length > 0) {
      this.elements.repairValidationMessage.textContent = `Some repairs failed: ${failedRepairs.join(', ')}`;
      this.elements.repairValidationMessage.className =
        'validation-message error';
    } else if (repairCount > 0) {
      this.elements.repairValidationMessage.textContent = '';
      this.elements.repairValidationMessage.className = 'validation-message';
    } else {
      this.elements.repairValidationMessage.textContent =
        'All systems already at maximum condition';
      this.elements.repairValidationMessage.className =
        'validation-message info';
    }

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();

    return {
      success: failedRepairs.length === 0,
      repairCount,
      failedRepairs,
    };
  }

  /**
   * Get display name for a system type
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @returns {string} Display name
   */
  getSystemName(systemType) {
    switch (systemType) {
      case 'hull':
        return 'Hull';
      case 'engine':
        return 'Engine';
      case 'lifeSupport':
        return 'Life Support';
      default:
        return capitalizeFirst(systemType);
    }
  }
}
