'use strict';

import {
  GAME_VERSION,
  SHIP_CONFIG,
  COMMODITY_TYPES,
} from '../game-constants.js';
import { TradingSystem } from '../game-trading.js';

/**
 * State Validators Module
 *
 * Handles validation and migration of game save data.
 * Ensures save files are compatible with current game version and have valid structure.
 */

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
 * @param {Array} starData - Star system data for lookups
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v2.1.0 state
 */
export function migrateFromV1ToV2(state, starData, isTestEnvironment) {
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
    state.ship.cargo.forEach((stack) => {
      // Migrate old field names to new ones
      if (stack.purchasePrice !== undefined && stack.buyPrice === undefined) {
        stack.buyPrice = stack.purchasePrice;
        delete stack.purchasePrice;
      }
      if (stack.purchaseSystem !== undefined && stack.buySystem === undefined) {
        stack.buySystem = stack.purchaseSystem;
        delete stack.purchaseSystem;
      }
      if (stack.purchaseDay !== undefined && stack.buyDate === undefined) {
        stack.buyDate = stack.purchaseDay;
        delete stack.purchaseDay;
      }

      // Add defaults for missing fields
      if (stack.buySystem === undefined) {
        stack.buySystem = state.player.currentSystem;
      }
      if (stack.buySystemName === undefined) {
        const system = starData.find((s) => s.id === stack.buySystem);
        stack.buySystemName = system ? system.name : 'Unknown';
      }
      if (stack.buyDate === undefined) {
        stack.buyDate = 0;
      }
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
    const validQuirks = [];
    for (const quirkId of state.ship.quirks) {
      if (SHIP_CONFIG.QUIRKS[quirkId]) {
        validQuirks.push(quirkId);
      } else {
        console.warn(`Unknown quirk ID: ${quirkId}, removing from save data`);
      }
    }
    state.ship.quirks = validQuirks;
  }

  // Validate upgrade IDs and remove unknown ones
  if (Array.isArray(state.ship.upgrades)) {
    const validUpgrades = [];
    for (const upgradeId of state.ship.upgrades) {
      if (SHIP_CONFIG.UPGRADES[upgradeId]) {
        validUpgrades.push(upgradeId);
      } else {
        console.warn(
          `Unknown upgrade ID: ${upgradeId}, removing from save data`
        );
      }
    }
    state.ship.upgrades = validUpgrades;
  }

  // Add price knowledge database
  if (!state.world.priceKnowledge) {
    state.world.priceKnowledge = {};

    // Initialize with current system's prices
    const currentSystemId = state.player.currentSystem;
    const currentSystem = starData.find((s) => s.id === currentSystemId);

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
 * @param {Array} starData - Star system data for lookups
 * @returns {Object} Normalized state
 */
export function addStateDefaults(state, starData) {
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
    state.ship.cargo.forEach((stack) => {
      // Migrate old field names to new ones
      if (stack.purchasePrice !== undefined && stack.buyPrice === undefined) {
        stack.buyPrice = stack.purchasePrice;
        delete stack.purchasePrice;
      }
      if (stack.purchaseSystem !== undefined && stack.buySystem === undefined) {
        stack.buySystem = stack.purchaseSystem;
        delete stack.purchaseSystem;
      }
      if (stack.purchaseDay !== undefined && stack.buyDate === undefined) {
        stack.buyDate = stack.purchaseDay;
        delete stack.purchaseDay;
      }

      // Add defaults for missing fields
      if (stack.buySystem === undefined) {
        stack.buySystem = state.player.currentSystem;
      }
      if (stack.buySystemName === undefined) {
        const system = starData.find((s) => s.id === stack.buySystem);
        stack.buySystemName = system ? system.name : 'Unknown';
      }
      if (stack.buyDate === undefined) {
        stack.buyDate = 0;
      }
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
    const validQuirks = [];
    for (const quirkId of state.ship.quirks) {
      if (SHIP_CONFIG.QUIRKS[quirkId]) {
        validQuirks.push(quirkId);
      } else {
        console.warn(`Unknown quirk ID: ${quirkId}, removing from save data`);
      }
    }
    state.ship.quirks = validQuirks;
  }

  // Validate upgrade IDs and remove unknown ones
  if (Array.isArray(state.ship.upgrades)) {
    const validUpgrades = [];
    for (const upgradeId of state.ship.upgrades) {
      if (SHIP_CONFIG.UPGRADES[upgradeId]) {
        validUpgrades.push(upgradeId);
      } else {
        console.warn(
          `Unknown upgrade ID: ${upgradeId}, removing from save data`
        );
      }
    }
    state.ship.upgrades = validUpgrades;
  }

  // Validate cargo structure completeness
  if (Array.isArray(state.ship.cargo)) {
    for (const stack of state.ship.cargo) {
      // Ensure all required fields are present
      if (!stack.good || typeof stack.qty !== 'number') {
        console.warn('Invalid cargo stack found, skipping:', stack);
        continue;
      }
      if (typeof stack.buyPrice !== 'number') {
        console.warn(`Cargo stack missing buyPrice, using 0:`, stack.good);
        stack.buyPrice = 0;
      }
      if (typeof stack.buySystem !== 'number') {
        console.warn(
          `Cargo stack missing buySystem, using current system:`,
          stack.good
        );
        stack.buySystem = state.player.currentSystem;
      }
      if (typeof stack.buySystemName !== 'string') {
        const system = starData.find((s) => s.id === stack.buySystem);
        stack.buySystemName = system ? system.name : 'Unknown';
      }
      if (typeof stack.buyDate !== 'number') {
        stack.buyDate = 0;
      }
    }
  }

  // Validate hidden cargo structure completeness
  if (Array.isArray(state.ship.hiddenCargo)) {
    for (const stack of state.ship.hiddenCargo) {
      // Ensure all required fields are present
      if (!stack.good || typeof stack.qty !== 'number') {
        console.warn('Invalid hidden cargo stack found, skipping:', stack);
        continue;
      }
      if (typeof stack.buyPrice !== 'number') {
        console.warn(
          `Hidden cargo stack missing buyPrice, using 0:`,
          stack.good
        );
        stack.buyPrice = 0;
      }
      if (typeof stack.buySystem !== 'number') {
        console.warn(
          `Hidden cargo stack missing buySystem, using current system:`,
          stack.good
        );
        stack.buySystem = state.player.currentSystem;
      }
      if (typeof stack.buySystemName !== 'string') {
        const system = starData.find((s) => s.id === stack.buySystem);
        stack.buySystemName = system ? system.name : 'Unknown';
      }
      if (typeof stack.buyDate !== 'number') {
        stack.buyDate = 0;
      }
    }
  }

  // Initialize price knowledge if missing
  if (!state.world.priceKnowledge) {
    state.world.priceKnowledge = {};

    // Initialize with current system's prices
    const currentSystemId = state.player.currentSystem;
    const currentSystem = starData.find((s) => s.id === currentSystemId);

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
