import { BaseManager } from './base-manager.js';
import { SHIP_CONFIG, EVENT_NAMES } from '../../constants.js';
import { devWarn } from '../../utils/dev-logger.js';

/**
 * StateManager - Core state access and mutation operations
 *
 * Handles basic state queries and updates for player, ship, and cargo.
 * Provides the fundamental state operations that other managers build upon.
 */
export class StateManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  /**
   * Get complete game state
   * @returns {Object} Current game state
   */
  getState() {
    return this.capabilities.getFullState();
  }

  /**
   * Get player state
   * @returns {Object} Player state object
   */
  getPlayer() {
    return this.capabilities.getPlayer();
  }

  /**
   * Get ship state
   * @returns {Object} Ship state object
   */
  getShip() {
    return this.capabilities.getShip();
  }

  /**
   * Calculate total cargo space used (trade cargo + passenger space)
   * @returns {number} Total cargo units used
   */
  getCargoUsed() {
    const tradeCargo = this.getTradeCargoUsed();
    const passengerSpace = this.getPassengerCargoUsed();
    return tradeCargo + passengerSpace;
  }

  /**
   * Calculate cargo space used by trade goods only (for pirate tribute calculations)
   * @returns {number} Trade cargo units used
   */
  getTradeCargoUsed() {
    return this.capabilities
      .getShipCargo()
      .reduce((total, stack) => total + stack.qty, 0);
  }

  /**
   * Calculate cargo space consumed by active passenger missions
   * @returns {number} Passenger cargo units used
   */
  getPassengerCargoUsed() {
    const active = this.capabilities.getActiveMissions();
    if (!active) return 0;
    return active
      .filter((m) => m.type === 'passenger' && m.requirements?.cargoSpace)
      .reduce((total, m) => total + m.requirements.cargoSpace, 0);
  }

  /**
   * Calculate remaining cargo space
   * @returns {number} Available cargo units
   */
  getCargoRemaining() {
    return this.capabilities.getShipCargoCapacity() - this.getCargoUsed();
  }

  // ========================================================================
  // STATE MUTATIONS
  // ========================================================================

  /**
   * Update player credits and emit event
   * @param {number} newCredits - New credit amount
   */
  updateCredits(newCredits) {
    this.capabilities.setPlayerCredits(newCredits);
    this.capabilities.emit(EVENT_NAMES.CREDITS_CHANGED, newCredits);
  }

  /**
   * Update player debt and emit event
   * @param {number} newDebt - New debt amount
   */
  updateDebt(newDebt) {
    this.capabilities.setPlayerDebt(newDebt);
    this.capabilities.emit(EVENT_NAMES.DEBT_CHANGED, newDebt);
  }

  /**
   * Update ship fuel with validation and emit event
   * @param {number} newFuel - New fuel percentage
   */
  updateFuel(newFuel) {
    // Get fuel capacity from ship manager
    const maxFuel = this.capabilities.getFuelCapacity();

    if (newFuel < SHIP_CONFIG.CONDITION_BOUNDS.MIN || newFuel > maxFuel) {
      throw new Error(
        `Invalid fuel value: ${newFuel}. Fuel must be between ${SHIP_CONFIG.CONDITION_BOUNDS.MIN} and ${maxFuel}.`
      );
    }

    this.capabilities.setShipFuel(newFuel);
    this.capabilities.emit(EVENT_NAMES.FUEL_CHANGED, newFuel);
  }

  /**
   * Update ship cargo and emit event
   * @param {Array} newCargo - New cargo array
   */
  updateCargo(newCargo) {
    const requiredFields = ['good', 'qty', 'buyPrice'];
    newCargo.forEach((item, i) => {
      const missing = requiredFields.filter((f) => item[f] === undefined);
      if (missing.length > 0) {
        devWarn(
          `Cargo item ${i} missing required fields:`,
          missing.join(', '),
          item
        );
      }
    });
    this.capabilities.setShipCargo(newCargo);
    this.capabilities.emit(EVENT_NAMES.CARGO_CHANGED, newCargo);
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
