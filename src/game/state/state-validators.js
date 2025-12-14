'use strict';

import { GAME_VERSION, SHIP_CONFIG, COMMODITY_TYPES } from '../constants.js';
import { TradingSystem } from '../game-trading.js';

/**
 * State Validators Module
 *
 * Handles validation and migration of game save data.
 * Ensures save files are compatible with current game version and have valid structure.
 */

/**
 * Validate and filter ship configuration IDs (quirks or upgrades).
 * Removes unknown IDs and warns about them.
 *
 * @param {Array} configIds - Array of configuration IDs to validate
 * @param {Object} validConfigs - Map of valid IDs (e.g., SHIP_CONFIG.QUIRKS)
 * @param {string} configType - Type of config for warning messages ('quirk' or 'upgrade')
 * @returns {Array} Filtered array containing only valid IDs
 */
function validateShipConfigIds(configIds, validConfigs, configType) {
  const validatedIds = [];
  for (const configId of configIds) {
    if (validConfigs[configId]) {
      validatedIds.push(configId);
    } else {
      console.warn(
        `Unknown ${configType} ID: ${configId}, removing from save data`
      );
    }
  }
  return validatedIds;
}

/**
 * Validate and repair cargo stack structure, ensuring all required fields are present.
 * Used during state loading to handle corrupted or incomplete save data.
 *
 * @param {Array} cargoStacks - Array of cargo stacks to validate
 * @param {number} currentSystemId - System ID to use for missing buySystem
 * @param {Array} systemData - Star system data for system name lookups
 * @param {string} compartmentType - Type of cargo for warning messages ('cargo' or 'hidden cargo')
 */
function validateAndRepairCargoStacks(
  cargoStacks,
  currentSystemId,
  systemData,
  compartmentType
) {
  for (const cargoStack of cargoStacks) {
    // Ensure all required fields are present
    if (!cargoStack.good || typeof cargoStack.qty !== 'number') {
      console.warn(
        `Invalid ${compartmentType} stack found, skipping:`,
        cargoStack
      );
      continue;
    }
    if (typeof cargoStack.buyPrice !== 'number') {
      console.warn(
        `${compartmentType} stack missing buyPrice, using 0:`,
        cargoStack.good
      );
      cargoStack.buyPrice = 0;
    }
    if (typeof cargoStack.buySystem !== 'number') {
      console.warn(
        `${compartmentType} stack missing buySystem, using current system:`,
        cargoStack.good
      );
      cargoStack.buySystem = currentSystemId;
    }
    if (typeof cargoStack.buySystemName !== 'string') {
      const system = systemData.find((s) => s.id === cargoStack.buySystem);
      cargoStack.buySystemName = system ? system.name : 'Unknown';
    }
    if (typeof cargoStack.buyDate !== 'number') {
      cargoStack.buyDate = 0;
    }
  }
}

/**
 * Normalize cargo stack field names from old versions to current schema.
 * Migrates purchasePrice → buyPrice, purchaseSystem → buySystem, purchaseDay → buyDate.
 * Adds defaults for missing metadata fields.
 *
 * @param {Object} cargoStack - Cargo stack to normalize
 * @param {number} currentSystemId - System ID to use if buySystem is missing
 * @param {Array} systemData - Star system data for system name lookups
 */
function normalizeCargoStack(cargoStack, currentSystemId, systemData) {
  // Migrate old field names to new ones
  if (
    cargoStack.purchasePrice !== undefined &&
    cargoStack.buyPrice === undefined
  ) {
    cargoStack.buyPrice = cargoStack.purchasePrice;
    delete cargoStack.purchasePrice;
  }
  if (
    cargoStack.purchaseSystem !== undefined &&
    cargoStack.buySystem === undefined
  ) {
    cargoStack.buySystem = cargoStack.purchaseSystem;
    delete cargoStack.purchaseSystem;
  }
  if (
    cargoStack.purchaseDay !== undefined &&
    cargoStack.buyDate === undefined
  ) {
    cargoStack.buyDate = cargoStack.purchaseDay;
    delete cargoStack.purchaseDay;
  }

  // Add defaults for missing fields
  if (cargoStack.buySystem === undefined) {
    cargoStack.buySystem = currentSystemId;
  }
  if (cargoStack.buySystemName === undefined) {
    const system = systemData.find((s) => s.id === cargoStack.buySystem);
    cargoStack.buySystemName = system ? system.name : 'Unknown';
  }
  if (cargoStack.buyDate === undefined) {
    cargoStack.buyDate = 0;
  }
}

/**
 * Check if save version is compatible with current game version
 *
 * Supports migration from v1.0.0 to v2.1.0 and v2.0.0 to v2.1.0.
 * Returns true if the save version matches exactly or can be migrated.
 *
 * @param {string} saveVersion - Version from save file
 * @returns {boolean} True if compatible
 */
export function isVersionCompatible(saveVersion) {
  if (!saveVersion) return false;

  // Exact version match
  if (saveVersion === GAME_VERSION) return true;

  // Support migration from v1.0.0 to v2.1.0
  if (saveVersion === '1.0.0' && GAME_VERSION === '2.1.0') return true;

  // Support migration from v2.0.0 to v2.1.0
  if (saveVersion === '2.0.0' && GAME_VERSION === '2.1.0') return true;

  return false;
}

/**
 * Validate that loaded state has required structure
 *
 * Checks that all required fields exist and have correct types.
 * Optional fields (like ship condition, price knowledge) are allowed to be missing
 * and will be initialized by addStateDefaults if needed.
 *
 * @param {Object} state - State to validate
 * @returns {boolean} True if valid
 */
export function validateStateStructure(state) {
  if (!state) return false;

  // Check player structure
  if (
    !state.player ||
    typeof state.player.credits !== 'number' ||
    typeof state.player.debt !== 'number' ||
    typeof state.player.currentSystem !== 'number' ||
    typeof state.player.daysElapsed !== 'number'
  ) {
    return false;
  }

  // Check ship structure
  if (
    !state.ship ||
    typeof state.ship.name !== 'string' ||
    typeof state.ship.fuel !== 'number' ||
    typeof state.ship.cargoCapacity !== 'number' ||
    !Array.isArray(state.ship.cargo)
  ) {
    return false;
  }

  // Check ship personality fields (optional - will be initialized if missing)
  if (state.ship.quirks !== undefined && !Array.isArray(state.ship.quirks)) {
    return false;
  }
  if (
    state.ship.upgrades !== undefined &&
    !Array.isArray(state.ship.upgrades)
  ) {
    return false;
  }
  if (
    state.ship.hiddenCargo !== undefined &&
    !Array.isArray(state.ship.hiddenCargo)
  ) {
    return false;
  }
  if (
    state.ship.hiddenCargoCapacity !== undefined &&
    typeof state.ship.hiddenCargoCapacity !== 'number'
  ) {
    return false;
  }

  // Check ship condition fields (optional - will be initialized if missing)
  if (state.ship.hull !== undefined && typeof state.ship.hull !== 'number') {
    return false;
  }
  if (
    state.ship.engine !== undefined &&
    typeof state.ship.engine !== 'number'
  ) {
    return false;
  }
  if (
    state.ship.lifeSupport !== undefined &&
    typeof state.ship.lifeSupport !== 'number'
  ) {
    return false;
  }

  // Check cargo stacks
  for (const stack of state.ship.cargo) {
    if (!stack.good || typeof stack.qty !== 'number') {
      return false;
    }

    // Accept both old and new field names for price
    const hasPrice =
      typeof stack.buyPrice === 'number' ||
      typeof stack.purchasePrice === 'number';
    if (!hasPrice) {
      return false;
    }

    // Purchase metadata is optional - will be initialized if missing
    // Accept both old and new field names
    if (stack.buySystem !== undefined && typeof stack.buySystem !== 'number') {
      return false;
    }
    if (
      stack.purchaseSystem !== undefined &&
      typeof stack.purchaseSystem !== 'number'
    ) {
      return false;
    }
    if (
      stack.buySystemName !== undefined &&
      typeof stack.buySystemName !== 'string'
    ) {
      return false;
    }
    if (stack.buyDate !== undefined && typeof stack.buyDate !== 'number') {
      return false;
    }
    if (
      stack.purchaseDay !== undefined &&
      typeof stack.purchaseDay !== 'number'
    ) {
      return false;
    }
  }

  // Check world structure
  if (!state.world || !Array.isArray(state.world.visitedSystems)) {
    return false;
  }

  // priceKnowledge and activeEvents are optional - will be initialized if missing
  if (state.world.priceKnowledge !== undefined) {
    if (typeof state.world.priceKnowledge !== 'object') {
      return false;
    }

    // Validate each price knowledge entry
    for (const systemId in state.world.priceKnowledge) {
      const knowledge = state.world.priceKnowledge[systemId];
      if (
        !knowledge ||
        typeof knowledge.lastVisit !== 'number' ||
        typeof knowledge.prices !== 'object'
      ) {
        return false;
      }
    }
  }

  if (state.world.activeEvents !== undefined) {
    if (!Array.isArray(state.world.activeEvents)) {
      return false;
    }
  }

  // Check meta structure
  if (
    !state.meta ||
    typeof state.meta.version !== 'string' ||
    typeof state.meta.timestamp !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Migrate save data from v1.0.0 to v2.1.0
 *
 * Adds Phase 2 features:
 * - Ship condition (hull, engine, lifeSupport)
 * - Cargo purchase metadata (purchaseSystem, purchaseDay)
 * - Price knowledge database
 * - Active events array
 * - Market conditions (deterministic economy)
 *
 * @param {Object} state - v1.0.0 state
 * @param {Array} systemData - Star system data for lookups
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v2.1.0 state
 */
export function migrateFromV1ToV2(state, systemData, isTestEnvironment) {
  if (!isTestEnvironment) {
    console.log('Migrating save from v1.0.0 to v2.1.0');
  }

  // Add ship condition fields (default to maximum)
  if (state.ship.hull === undefined) {
    state.ship.hull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }
  if (state.ship.engine === undefined) {
    state.ship.engine = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }
  if (state.ship.lifeSupport === undefined) {
    state.ship.lifeSupport = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }

  // Add cargo purchase metadata and migrate field names
  if (state.ship.cargo && Array.isArray(state.ship.cargo)) {
    state.ship.cargo.forEach((cargoStack) => {
      normalizeCargoStack(cargoStack, state.player.currentSystem, systemData);
    });
  }

  // Add ship personality fields
  if (!state.ship.quirks) {
    state.ship.quirks = [];
  }
  if (!state.ship.upgrades) {
    state.ship.upgrades = [];
  }
  if (!state.ship.hiddenCargo) {
    state.ship.hiddenCargo = [];
  }
  if (state.ship.hiddenCargoCapacity === undefined) {
    state.ship.hiddenCargoCapacity = 0;
  }

  // Validate quirk IDs and remove unknown ones
  if (Array.isArray(state.ship.quirks)) {
    state.ship.quirks = validateShipConfigIds(
      state.ship.quirks,
      SHIP_CONFIG.QUIRKS,
      'quirk'
    );
  }

  // Validate upgrade IDs and remove unknown ones
  if (Array.isArray(state.ship.upgrades)) {
    state.ship.upgrades = validateShipConfigIds(
      state.ship.upgrades,
      SHIP_CONFIG.UPGRADES,
      'upgrade'
    );
  }

  // Add price knowledge database
  if (!state.world.priceKnowledge) {
    state.world.priceKnowledge = {};

    // Initialize with current system's prices
    const currentSystemId = state.player.currentSystem;
    const currentSystem = systemData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Migration failed: current system ID ${currentSystemId} not found in star data`
      );
    }

    const currentDay = state.player.daysElapsed;
    const marketConditions = {}; // No market conditions in v1.0.0
    const currentPrices = {};

    for (const goodType of COMMODITY_TYPES) {
      currentPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        currentSystem,
        currentDay,
        [], // No events in v1.0.0
        marketConditions
      );
    }

    state.world.priceKnowledge[currentSystemId] = {
      lastVisit: 0,
      prices: currentPrices,
    };
  }

  // Add active events array
  if (!state.world.activeEvents) {
    state.world.activeEvents = [];
  }

  // Add market conditions (deterministic economy)
  if (!state.world.marketConditions) {
    state.world.marketConditions = {};
  }

  // Update version
  state.meta.version = GAME_VERSION;

  if (!isTestEnvironment) {
    console.log('Migration complete');
  }

  return state;
}

/**
 * Migrate save data from v2.0.0 to v2.1.0
 *
 * Adds deterministic economy features:
 * - Market conditions tracking for local supply/demand effects
 *
 * @param {Object} state - v2.0.0 state
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v2.1.0 state
 */
export function migrateFromV2ToV2_1(state, isTestEnvironment) {
  if (!isTestEnvironment) {
    console.log('Migrating save from v2.0.0 to v2.1.0');
  }

  // Add market conditions (empty object for backward compatibility)
  if (!state.world.marketConditions) {
    state.world.marketConditions = {};
  }

  // Update version
  state.meta.version = GAME_VERSION;

  if (!isTestEnvironment) {
    console.log('Migration complete');
  }

  return state;
}

/**
 * Add defaults for missing fields in loaded state
 *
 * Handles partial v2.0.0 saves that pass validation but lack some optional fields.
 * Normalizes field names from old versions and adds missing metadata.
 *
 * @param {Object} state - State to normalize
 * @param {Array} systemData - Star system data for lookups
 * @returns {Object} Normalized state
 */
export function addStateDefaults(state, systemData) {
  // Add defaults for missing Phase 2 fields
  if (state.ship.hull === undefined) {
    state.ship.hull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }
  if (state.ship.engine === undefined) {
    state.ship.engine = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }
  if (state.ship.lifeSupport === undefined) {
    state.ship.lifeSupport = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  }

  // Normalize cargo stacks
  if (state.ship.cargo && Array.isArray(state.ship.cargo)) {
    state.ship.cargo.forEach((cargoStack) => {
      normalizeCargoStack(cargoStack, state.player.currentSystem, systemData);
    });
  }

  // Add ship personality fields if missing
  if (!state.ship.quirks) {
    state.ship.quirks = [];
  }
  if (!state.ship.upgrades) {
    state.ship.upgrades = [];
  }
  if (!state.ship.hiddenCargo) {
    state.ship.hiddenCargo = [];
  }
  if (state.ship.hiddenCargoCapacity === undefined) {
    state.ship.hiddenCargoCapacity = 0;
  }

  // Validate quirk IDs and remove unknown ones
  if (Array.isArray(state.ship.quirks)) {
    state.ship.quirks = validateShipConfigIds(
      state.ship.quirks,
      SHIP_CONFIG.QUIRKS,
      'quirk'
    );
  }

  // Validate upgrade IDs and remove unknown ones
  if (Array.isArray(state.ship.upgrades)) {
    state.ship.upgrades = validateShipConfigIds(
      state.ship.upgrades,
      SHIP_CONFIG.UPGRADES,
      'upgrade'
    );
  }

  // Validate cargo structure completeness
  if (Array.isArray(state.ship.cargo)) {
    validateAndRepairCargoStacks(
      state.ship.cargo,
      state.player.currentSystem,
      systemData,
      'Cargo'
    );
  }

  // Validate hidden cargo structure completeness
  if (Array.isArray(state.ship.hiddenCargo)) {
    validateAndRepairCargoStacks(
      state.ship.hiddenCargo,
      state.player.currentSystem,
      systemData,
      'Hidden cargo'
    );
  }

  // Initialize price knowledge if missing
  if (!state.world.priceKnowledge) {
    state.world.priceKnowledge = {};

    // Initialize with current system's prices
    const currentSystemId = state.player.currentSystem;
    const currentSystem = systemData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Load failed: current system ID ${currentSystemId} not found in star data`
      );
    }

    const currentDay = state.player.daysElapsed;
    const marketConditions = {}; // No market conditions if missing
    const currentPrices = {};

    for (const goodType of COMMODITY_TYPES) {
      currentPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        currentSystem,
        currentDay,
        [], // No events if missing
        marketConditions
      );
    }

    state.world.priceKnowledge[currentSystemId] = {
      lastVisit: 0,
      prices: currentPrices,
    };
  }

  // Initialize active events if missing
  if (!state.world.activeEvents) {
    state.world.activeEvents = [];
  }

  // Initialize market conditions if missing
  if (!state.world.marketConditions) {
    state.world.marketConditions = {};
  }

  return state;
}
