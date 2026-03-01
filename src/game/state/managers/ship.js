import { BaseManager } from './base-manager.js';
import {
  SHIP_CONFIG,
  NEW_GAME_DEFAULTS,
  EVENT_NAMES,
} from '../../constants.js';
import { pickRandomFrom } from '../../utils/seeded-random.js';
import { sanitizeShipName } from '../../utils/string-utils.js';

/**
 * Ship Manager - Handles all ship-related operations
 *
 * Responsibilities:
 * - Ship quirks assignment and modifier application
 * - Ship condition management (hull, engine, life support)
 * - Ship upgrades validation and purchase
 * - Ship capabilities calculation
 * - Cargo management (regular and hidden)
 * - Ship name management
 */
export class ShipManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Assign random quirks to a ship
   *
   * Randomly selects 2-3 quirks from available quirks. Each quirk provides
   * both benefits and drawbacks to create interesting tradeoffs.
   *
   * Feature: ship-personality, Property 1: Quirk Assignment
   * Validates: Requirements 1.1, 1.2, 1.3
   *
   * @param {Function} rng - Random number generator function (default Math.random)
   * @returns {string[]} Array of quirk IDs
   */
  assignShipQuirks(rng = Math.random) {
    const quirkIds = Object.keys(SHIP_CONFIG.QUIRKS);
    const count = rng() < 0.5 ? 2 : 3;
    const assigned = new Set();

    while (assigned.size < count) {
      const randomId = pickRandomFrom(quirkIds, rng);
      assigned.add(randomId);
    }

    return Array.from(assigned);
  }

  /**
   * Apply quirk modifiers to a base value
   *
   * Iterates through all quirks and applies relevant modifiers multiplicatively.
   * Quirks that don't affect the specified attribute are ignored.
   *
   * Example: If two quirks both affect fuelConsumption with modifiers 0.85 and 1.05,
   * the result is baseValue × 0.85 × 1.05 = baseValue × 0.8925
   *
   * Feature: ship-personality, Property 2: Quirk Effect Application
   * Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4, 6.5
   *
   * @param {number} baseValue - Starting value before modifiers
   * @param {string} attribute - Attribute name (e.g., 'fuelConsumption', 'hullDegradation')
   * @param {string[]} quirks - Array of quirk IDs
   * @returns {number} Modified value after applying all relevant quirk modifiers
   */
  applyQuirkModifiers(baseValue, attribute, quirks) {
    let modified = baseValue;

    for (const quirkId of quirks) {
      const quirk = SHIP_CONFIG.QUIRKS[quirkId];

      // If quirk doesn't exist, this is a critical bug - fail loudly
      if (!quirk) {
        throw new Error(
          `Invalid quirk ID: ${quirkId} not found in SHIP_CONFIG.QUIRKS`
        );
      }

      // Only apply modifier if this quirk affects the specified attribute
      if (quirk.effects[attribute]) {
        modified *= quirk.effects[attribute];
      }
    }

    return modified;
  }

  /**
   * Get quirk definition by ID
   *
   * Returns the quirk definition object from SHIP_CONFIG.QUIRKS constant.
   * Used by UI to display quirk information.
   *
   * @param {string} quirkId - Quirk identifier
   * @returns {Object|null} Quirk definition or null if not found
   */
  getQuirkDefinition(quirkId) {
    return SHIP_CONFIG.QUIRKS[quirkId] || null;
  }

  /**
   * Add a quirk to the ship (dev admin only)
   *
   * Used by dev admin panel for testing. Does not add duplicate quirks.
   *
   * @param {string} quirkId - Quirk identifier
   * @returns {Object} { success: boolean, reason: string }
   */
  addQuirk(quirkId) {
    this.validateState();

    const quirk = SHIP_CONFIG.QUIRKS[quirkId];
    if (!quirk) {
      return { success: false, reason: 'Unknown quirk' };
    }

    const state = this.getState();
    if (state.ship.quirks.includes(quirkId)) {
      return { success: false, reason: 'Quirk already installed' };
    }

    state.ship.quirks.push(quirkId);
    this.emit(EVENT_NAMES.QUIRKS_CHANGED, state.ship.quirks);
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Remove a quirk from the ship (dev admin only)
   *
   * Used by dev admin panel for testing.
   *
   * @param {string} quirkId - Quirk identifier
   * @returns {Object} { success: boolean, reason: string }
   */
  removeQuirk(quirkId) {
    this.validateState();

    const state = this.getState();
    const index = state.ship.quirks.indexOf(quirkId);
    if (index === -1) {
      return { success: false, reason: 'Quirk not installed' };
    }

    state.ship.quirks.splice(index, 1);
    this.emit(EVENT_NAMES.QUIRKS_CHANGED, state.ship.quirks);
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Get upgrade definition by ID
   *
   * Returns the upgrade definition object from SHIP_CONFIG.UPGRADES constant.
   * Used by UI to display upgrade information.
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object|null} Upgrade definition or null if not found
   */
  getUpgradeDefinition(upgradeId) {
    return SHIP_CONFIG.UPGRADES[upgradeId] || null;
  }

  /**
   * Add an upgrade to the ship (dev admin only)
   *
   * Used by dev admin panel for testing. Does not charge credits.
   * Does not add duplicate upgrades.
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object} { success: boolean, reason: string }
   */
  addUpgrade(upgradeId) {
    this.validateState();

    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
    if (!upgrade) {
      return { success: false, reason: 'Unknown upgrade' };
    }

    const state = this.getState();
    if (state.ship.upgrades.includes(upgradeId)) {
      return { success: false, reason: 'Upgrade already installed' };
    }

    state.ship.upgrades.push(upgradeId);

    // Apply upgrade effects to ship capabilities
    const capabilities = this.calculateShipCapabilities();

    // Update ship state with new capabilities
    if (capabilities.cargoCapacity !== state.ship.cargoCapacity) {
      state.ship.cargoCapacity = capabilities.cargoCapacity;
      this.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, capabilities.cargoCapacity);
    }
    if (capabilities.hiddenCargoCapacity !== state.ship.hiddenCargoCapacity) {
      state.ship.hiddenCargoCapacity = capabilities.hiddenCargoCapacity;
    }

    this.emit(EVENT_NAMES.UPGRADES_CHANGED, state.ship.upgrades);
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Remove an upgrade from the ship (dev admin only)
   *
   * Used by dev admin panel for testing.
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object} { success: boolean, reason: string }
   */
  removeUpgrade(upgradeId) {
    this.validateState();

    const state = this.getState();
    const index = state.ship.upgrades.indexOf(upgradeId);
    if (index === -1) {
      return { success: false, reason: 'Upgrade not installed' };
    }

    state.ship.upgrades.splice(index, 1);

    // Recalculate ship capabilities
    const capabilities = this.calculateShipCapabilities();

    // Update ship state with new capabilities
    if (capabilities.cargoCapacity !== state.ship.cargoCapacity) {
      state.ship.cargoCapacity = capabilities.cargoCapacity;
      this.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, capabilities.cargoCapacity);
    }
    if (capabilities.hiddenCargoCapacity !== state.ship.hiddenCargoCapacity) {
      state.ship.hiddenCargoCapacity = capabilities.hiddenCargoCapacity;
    }

    this.emit(EVENT_NAMES.UPGRADES_CHANGED, state.ship.upgrades);
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Update ship name
   *
   * @param {string} newName - New ship name (will be sanitized)
   */
  updateShipName(newName) {
    this.validateState();

    const sanitized = sanitizeShipName(newName);
    const state = this.getState();
    state.ship.name = sanitized;
    this.emit(EVENT_NAMES.SHIP_NAME_CHANGED, sanitized);
  }

  /**
   * Update ship condition values
   *
   * All values are clamped to valid range to prevent invalid states.
   * Checks for condition warnings and emits them if thresholds are crossed.
   *
   * @param {number} hull - Hull integrity percentage
   * @param {number} engine - Engine condition percentage
   * @param {number} lifeSupport - Life support condition percentage
   */
  updateShipCondition(hull, engine, lifeSupport) {
    this.validateState();

    const state = this.getState();

    // Clamp all values to valid range
    state.ship.hull = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, hull)
    );
    state.ship.engine = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, engine)
    );
    state.ship.lifeSupport = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, lifeSupport)
    );

    this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport,
    });

    // Check for warnings and emit them
    const warnings = this.checkConditionWarnings();
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.emit(EVENT_NAMES.CONDITION_WARNING, warning);
      });
    }
  }

  /**
   * Get ship condition values
   * @returns {Object} { hull, engine, lifeSupport }
   */
  getShipCondition() {
    this.validateState();

    const state = this.getState();
    return {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport,
    };
  }

  /**
   * Check ship condition and return warnings for systems below thresholds
   *
   * Evaluates current ship condition against warning thresholds and returns
   * an array of warning objects for systems that need attention.
   *
   * @returns {Array} Array of warning objects: { system: string, message: string, severity: string }
   */
  checkConditionWarnings() {
    const condition = this.getShipCondition();
    if (!condition) return [];

    const warnings = [];

    // Hull integrity affects cargo safety during jumps
    if (condition.hull < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.HULL) {
      warnings.push({
        system: 'hull',
        message: 'Risk of cargo loss during jumps',
        severity: 'warning',
      });
    }

    // Engine degradation increases fuel consumption and travel time
    if (condition.engine < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.ENGINE) {
      warnings.push({
        system: 'engine',
        message: 'Jump failure risk - immediate repairs recommended',
        severity: 'warning',
      });
    }

    // Life support failure is catastrophic
    if (
      condition.lifeSupport <
      SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT
    ) {
      warnings.push({
        system: 'lifeSupport',
        message: 'Critical condition - urgent repairs required',
        severity: 'critical',
      });
    }

    return warnings;
  }

  /**
   * Validate upgrade purchase
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object} { valid: boolean, reason: string }
   */
  validateUpgradePurchase(upgradeId) {
    this.validateState();

    const state = this.getState();
    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

    if (!upgrade) {
      return { valid: false, reason: 'Unknown upgrade' };
    }

    // Check if already installed
    if (state.ship.upgrades.includes(upgradeId)) {
      return { valid: false, reason: 'Already installed' };
    }

    // Check credits
    if (state.player.credits < upgrade.cost) {
      return { valid: false, reason: 'Insufficient credits' };
    }

    return { valid: true, reason: '' };
  }

  /**
   * Purchase and install an upgrade
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseUpgrade(upgradeId) {
    this.validateState();

    // Validate purchase
    const validation = this.validateUpgradePurchase(upgradeId);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const state = this.getState();
    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

    // Deduct credits through GameStateManager
    this.gameStateManager.updateCredits(state.player.credits - upgrade.cost);

    // Add upgrade to ship
    state.ship.upgrades.push(upgradeId);

    // Apply upgrade effects to ship capabilities
    const capabilities = this.calculateShipCapabilities();

    // Update ship state with new capabilities
    if (capabilities.cargoCapacity !== state.ship.cargoCapacity) {
      state.ship.cargoCapacity = capabilities.cargoCapacity;
      this.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, capabilities.cargoCapacity);
    }
    if (capabilities.hiddenCargoCapacity !== state.ship.hiddenCargoCapacity) {
      state.ship.hiddenCargoCapacity = capabilities.hiddenCargoCapacity;
    }

    // Note: Fuel capacity is calculated on-demand via getFuelCapacity()
    // Note: Rate modifiers (fuelConsumption, hullDegradation, lifeSupportDrain)
    // are applied during calculations via calculateShipCapabilities(), not stored

    // Emit upgrade change event
    this.emit(EVENT_NAMES.UPGRADES_CHANGED, state.ship.upgrades);

    // Persist immediately - upgrade purchases modify credits and ship state
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Calculate ship capabilities with all upgrades applied
   *
   * Computes effective ship capabilities by applying all installed upgrades
   * to base ship configuration. Used for fuel capacity, cargo capacity,
   * and operational efficiency modifiers.
   *
   * @returns {Object} Ship capabilities with all upgrades applied
   */
  calculateShipCapabilities() {
    this.validateState();

    const state = this.getState();
    const baseCapabilities = {
      fuelCapacity: SHIP_CONFIG.FUEL_CAPACITY,
      cargoCapacity: NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY,
      fuelConsumption: 1.0, // Multiplier for fuel consumption
      hullDegradation: 1.0, // Multiplier for hull degradation
      lifeSupportDrain: 1.0, // Multiplier for life support drain
      hiddenCargoCapacity: 0, // Base ship has no hidden cargo
    };

    // Apply each installed upgrade
    for (const upgradeId of state.ship.upgrades) {
      const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
      if (!upgrade) {
        this.warn(`Unknown upgrade installed: ${upgradeId}`);
        continue;
      }

      // Apply upgrade effects
      if (upgrade.effects.fuelCapacity) {
        baseCapabilities.fuelCapacity += upgrade.effects.fuelCapacity;
      }
      if (upgrade.effects.cargoCapacity) {
        baseCapabilities.cargoCapacity += upgrade.effects.cargoCapacity;
      }
      if (upgrade.effects.fuelConsumption) {
        baseCapabilities.fuelConsumption *= upgrade.effects.fuelConsumption;
      }
      if (upgrade.effects.hullDegradation) {
        baseCapabilities.hullDegradation *= upgrade.effects.hullDegradation;
      }
      if (upgrade.effects.lifeSupportDrain) {
        baseCapabilities.lifeSupportDrain *= upgrade.effects.lifeSupportDrain;
      }
      if (upgrade.effects.hiddenCargoCapacity) {
        baseCapabilities.hiddenCargoCapacity +=
          upgrade.effects.hiddenCargoCapacity;
      }
    }

    return baseCapabilities;
  }

  /**
   * Get current fuel capacity based on installed upgrades
   *
   * Fuel capacity is calculated on-demand rather than stored in state
   * because it's derived from upgrades. Base capacity is 100, Extended
   * Fuel Tank upgrade increases it to 150.
   *
   * @returns {number} Maximum fuel capacity in percentage points
   */
  getFuelCapacity() {
    this.validateState();

    const capabilities = this.calculateShipCapabilities();
    return capabilities.fuelCapacity;
  }

  /**
   * Get hidden cargo array
   *
   * Returns the ship's hidden cargo compartment contents.
   * Hidden cargo is separate from regular cargo and not visible
   * during customs inspections unless discovered.
   *
   * @returns {Array} Array of hidden cargo stacks
   */
  getHiddenCargo() {
    this.validateState();

    const state = this.getState();
    return state.ship.hiddenCargo;
  }

  /**
   * Move cargo from regular cargo to hidden cargo
   *
   * @param {string} good - Good type to move
   * @param {number} qty - Quantity to move
   * @returns {Object} { success: boolean, reason: string }
   */
  moveToHiddenCargo(good, qty) {
    this.validateState();

    const state = this.getState();
    const ship = state.ship;

    // Find cargo stack with matching good
    const cargoIndex = ship.cargo.findIndex((stack) => stack.good === good);
    if (cargoIndex === -1) {
      return { success: false, reason: 'Good not found in cargo' };
    }

    const cargoStack = ship.cargo[cargoIndex];
    if (qty > cargoStack.qty) {
      return { success: false, reason: 'Not enough quantity in cargo' };
    }

    // Check hidden cargo capacity
    const capabilities = this.calculateShipCapabilities();
    const hiddenCargoUsed = ship.hiddenCargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );
    const hiddenCargoRemaining =
      capabilities.hiddenCargoCapacity - hiddenCargoUsed;

    if (qty > hiddenCargoRemaining) {
      return { success: false, reason: 'Not enough hidden cargo space' };
    }

    // Remove from regular cargo
    cargoStack.qty -= qty;
    if (cargoStack.qty <= 0) {
      ship.cargo.splice(cargoIndex, 1);
    }

    // Add to hidden cargo (stacks with matching good and buyPrice)
    this._addToCargoArray(ship.hiddenCargo, cargoStack, qty);

    // Emit cargo change events
    this.gameStateManager.updateCargo(ship.cargo);
    this.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, ship.hiddenCargo);

    // Persist immediately - cargo changes should be saved
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Move cargo from hidden cargo to regular cargo
   *
   * @param {string} good - Good type to move
   * @param {number} qty - Quantity to move
   * @returns {Object} { success: boolean, reason: string }
   */
  moveToRegularCargo(good, qty) {
    this.validateState();

    const state = this.getState();
    const ship = state.ship;

    // Find hidden cargo stack with matching good
    const hiddenIndex = ship.hiddenCargo.findIndex(
      (stack) => stack.good === good
    );
    if (hiddenIndex === -1) {
      return { success: false, reason: 'Good not found in hidden cargo' };
    }

    const hiddenStack = ship.hiddenCargo[hiddenIndex];
    if (qty > hiddenStack.qty) {
      return { success: false, reason: 'Not enough quantity in hidden cargo' };
    }

    // Check regular cargo capacity
    const cargoUsed = ship.cargo.reduce((total, stack) => total + stack.qty, 0);
    const cargoRemaining = ship.cargoCapacity - cargoUsed;

    if (qty > cargoRemaining) {
      return { success: false, reason: 'Not enough regular cargo space' };
    }

    // Remove from hidden cargo
    hiddenStack.qty -= qty;
    if (hiddenStack.qty <= 0) {
      ship.hiddenCargo.splice(hiddenIndex, 1);
    }

    // Add to regular cargo (stacks with matching good and buyPrice)
    this._addToCargoArray(ship.cargo, hiddenStack, qty);

    // Emit cargo change events
    this.gameStateManager.updateCargo(ship.cargo);
    this.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, ship.hiddenCargo);

    // Persist immediately - cargo changes should be saved
    this.gameStateManager.markDirty();

    return { success: true, reason: '' };
  }

  /**
   * Add cargo to a cargo array with proper stacking
   *
   * @param {Array} cargoArray - Target cargo array
   * @param {Object} sourceStack - Source cargo stack
   * @param {number} qty - Quantity to add
   * @private
   */
  _addToCargoArray(cargoArray, sourceStack, qty) {
    // Find existing stack with matching good and buyPrice
    const existingIndex = cargoArray.findIndex(
      (stack) =>
        stack.good === sourceStack.good &&
        stack.buyPrice === sourceStack.buyPrice
    );

    if (existingIndex !== -1) {
      // Add to existing stack
      cargoArray[existingIndex].qty += qty;
    } else {
      // Create new stack
      cargoArray.push({
        good: sourceStack.good,
        qty: qty,
        buyPrice: sourceStack.buyPrice,
        buySystem: sourceStack.buySystem,
        buySystemName: sourceStack.buySystemName,
        buyDate: sourceStack.buyDate,
      });
    }
  }

  removeCargoForMission(goodType, quantity) {
    this.validateState();
    const state = this.getState();
    const relevantStacks = state.ship.cargo.filter((c) => c.good === goodType);
    const totalAvailable = relevantStacks.reduce((sum, c) => sum + c.qty, 0);

    if (totalAvailable < quantity) {
      return { success: false, reason: `Not enough ${goodType}.` };
    }

    let remaining = quantity;
    for (let i = state.ship.cargo.length - 1; i >= 0 && remaining > 0; i--) {
      if (state.ship.cargo[i].good === goodType) {
        const removeFromStack = Math.min(state.ship.cargo[i].qty, remaining);
        state.ship.cargo[i].qty -= removeFromStack;
        remaining -= removeFromStack;
        if (state.ship.cargo[i].qty <= 0) {
          state.ship.cargo.splice(i, 1);
        }
      }
    }

    this.emit(EVENT_NAMES.CARGO_CHANGED, state.ship.cargo);
    return { success: true };
  }
}
