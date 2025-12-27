import { BaseManager } from './base-manager.js';
import { SHIP_CONFIG } from '../../constants.js';

/**
 * StateManager - Core state access and mutation operations
 *
 * Handles basic state queries and updates for player, ship, and cargo.
 * Provides the fundamental state operations that other managers build upon.
 */
export class StateManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  /**
   * Get complete game state
   * @returns {Object} Current game state
   */
  getState() {
    return this.gameStateManager.state;
  }

  /**
   * Get player state
   * @returns {Object} Player state object
   */
  getPlayer() {
    this.validateState();
    return this.gameStateManager.state.player;
  }

  /**
   * Get ship state
   * @returns {Object} Ship state object
   */
  getShip() {
    this.validateState();
    return this.gameStateManager.state.ship;
  }

  /**
   * Calculate total cargo space used
   * @returns {number} Total cargo units used
   */
  getCargoUsed() {
    this.validateState();
    return this.gameStateManager.state.ship.cargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );
  }

  /**
   * Calculate remaining cargo space
   * @returns {number} Available cargo units
   */
  getCargoRemaining() {
    this.validateState();
    return this.gameStateManager.state.ship.cargoCapacity - this.getCargoUsed();
  }

  // ========================================================================
  // STATE MUTATIONS
  // ========================================================================

  /**
   * Update player credits and emit event
   * @param {number} newCredits - New credit amount
   */
  updateCredits(newCredits) {
    this.validateState();
    this.gameStateManager.state.player.credits = newCredits;
    this.emit('creditsChanged', newCredits);
  }

  /**
   * Update player debt and emit event
   * @param {number} newDebt - New debt amount
   */
  updateDebt(newDebt) {
    this.validateState();
    this.gameStateManager.state.player.debt = newDebt;
    this.emit('debtChanged', newDebt);
  }

  /**
   * Update ship fuel with validation and emit event
   * @param {number} newFuel - New fuel percentage
   */
  updateFuel(newFuel) {
    this.validateState();

    // Get fuel capacity from ship manager
    const maxFuel = this.gameStateManager.getFuelCapacity();

    if (newFuel < SHIP_CONFIG.CONDITION_BOUNDS.MIN || newFuel > maxFuel) {
      throw new Error(
        `Invalid fuel value: ${newFuel}. Fuel must be between ${SHIP_CONFIG.CONDITION_BOUNDS.MIN} and ${maxFuel}.`
      );
    }

    this.gameStateManager.state.ship.fuel = newFuel;
    this.emit('fuelChanged', newFuel);
  }

  /**
   * Update ship cargo and emit event
   * @param {Array} newCargo - New cargo array
   */
  updateCargo(newCargo) {
    this.validateState();
    this.gameStateManager.state.ship.cargo = newCargo;
    this.emit('cargoChanged', newCargo);
  }

  // ========================================================================
  // DIRECT SETTERS (DEV MODE)
  // ========================================================================

  /**
   * Set credits directly (dev mode only)
   * @param {number} amount - New credit amount
   */
  setCredits(amount) {
    this.updateCredits(amount);
  }

  /**
   * Set debt directly (dev mode only)
   * @param {number} amount - New debt amount
   */
  setDebt(amount) {
    this.updateDebt(amount);
  }

  /**
   * Set fuel directly (dev mode only)
   * @param {number} amount - New fuel percentage (0-100)
   */
  setFuel(amount) {
    this.updateFuel(amount);
  }
}
