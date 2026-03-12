import {
  GAME_VERSION,
  SHIP_CONFIG,
  COMMODITY_TYPES,
  DEFAULT_PREFERENCES,
} from '../constants.js';
import { TradingSystem } from '../game-trading.js';
import { devLog, devWarn } from '../utils/dev-logger.js';

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
      devWarn(`Unknown ${configType} ID: ${configId}, removing from save data`);
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
      devWarn(`Invalid ${compartmentType} stack found, skipping:`, cargoStack);
      continue;
    }
    if (typeof cargoStack.buyPrice !== 'number') {
      devWarn(
        `${compartmentType} stack missing buyPrice, using 0:`,
        cargoStack.good
      );
      cargoStack.buyPrice = 0;
    }
    if (typeof cargoStack.buySystem !== 'number') {
      devWarn(
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

    // missionId is optional — present on mission cargo, absent on trade cargo
    // No validation needed beyond type check
    if (
      cargoStack.missionId !== undefined &&
      typeof cargoStack.missionId !== 'string'
    ) {
      devWarn(
        `${compartmentType} stack has invalid missionId, removing:`,
        cargoStack.missionId
      );
      delete cargoStack.missionId;
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
 * Supports migration from v1.0.0 to v4.0.0, v2.0.0 to v4.0.0, and v2.1.0 to v4.0.0.
 * Returns true if the save version matches exactly or can be migrated.
 *
 * @param {string} saveVersion - Version from save file
 * @returns {boolean} True if compatible
 */
export function isVersionCompatible(saveVersion) {
  if (!saveVersion) return false;

  // Exact version match
  if (saveVersion === GAME_VERSION) return true;

  // Support migration from v1.0.0 to v5.0.0
  if (saveVersion === '1.0.0' && GAME_VERSION === '5.0.0') return true;

  // Support migration from v2.0.0 to v5.0.0
  if (saveVersion === '2.0.0' && GAME_VERSION === '5.0.0') return true;

  // Support migration from v2.1.0 to v5.0.0
  if (saveVersion === '2.1.0' && GAME_VERSION === '5.0.0') return true;

  // Support migration from v4.0.0 to v5.0.0
  if (saveVersion === '4.0.0' && GAME_VERSION === '5.0.0') return true;

  // Support migration from v4.1.0 to v5.0.0
  if (saveVersion === '4.1.0' && GAME_VERSION === '5.0.0') return true;

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

  // Check danger system fields (optional - will be initialized if missing)
  if (
    state.player.karma !== undefined &&
    typeof state.player.karma !== 'number'
  ) {
    return false;
  }
  if (state.player.factions !== undefined) {
    if (
      typeof state.player.factions !== 'object' ||
      state.player.factions === null
    ) {
      return false;
    }
    // Validate faction reputation values
    for (const faction in state.player.factions) {
      if (typeof state.player.factions[faction] !== 'number') {
        return false;
      }
    }
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
    if (stack.missionId !== undefined && typeof stack.missionId !== 'string') {
      return false;
    }
  }

  // Check world structure
  if (!state.world || !Array.isArray(state.world.visitedSystems)) {
    return false;
  }

  // Check danger flags (optional - will be initialized if missing)
  if (state.world.dangerFlags !== undefined) {
    if (
      typeof state.world.dangerFlags !== 'object' ||
      state.world.dangerFlags === null
    ) {
      return false;
    }
    // Validate danger flag values
    for (const flag in state.world.dangerFlags) {
      if (typeof state.world.dangerFlags[flag] !== 'number') {
        return false;
      }
    }
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

  // Check NPC state structure (optional - will be initialized if missing)
  if (state.npcs !== undefined) {
    if (typeof state.npcs !== 'object' || state.npcs === null) {
      return false;
    }

    // Validate each NPC state entry
    for (const npcId in state.npcs) {
      const npcState = state.npcs[npcId];
      if (
        !npcState ||
        typeof npcState.rep !== 'number' ||
        typeof npcState.lastInteraction !== 'number' ||
        !Array.isArray(npcState.flags) ||
        typeof npcState.interactions !== 'number'
      ) {
        return false;
      }
    }
  }

  // Check dialogue state structure (optional - will be initialized if missing)
  if (state.dialogue !== undefined) {
    if (typeof state.dialogue !== 'object' || state.dialogue === null) {
      return false;
    }

    // currentNpcId and currentNodeId can be null
    if (
      state.dialogue.currentNpcId !== null &&
      typeof state.dialogue.currentNpcId !== 'string'
    ) {
      return false;
    }

    if (
      state.dialogue.currentNodeId !== null &&
      typeof state.dialogue.currentNodeId !== 'string'
    ) {
      return false;
    }

    if (typeof state.dialogue.isActive !== 'boolean') {
      return false;
    }

    // display can be null or an object
    if (
      state.dialogue.display !== null &&
      typeof state.dialogue.display !== 'object'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Migrate save data from v1.0.0 to v4.1.0
 *
 * Adds Phase 2 features:
 * - Ship condition (hull, engine, lifeSupport)
 * - Cargo purchase metadata (purchaseSystem, purchaseDay)
 * - Price knowledge database
 * - Active events array
 * - Market conditions (deterministic economy)
 * - NPC state tracking (reputation, flags, interactions)
 * - Dialogue state management
 *
 * @param {Object} state - v1.0.0 state
 * @param {Array} systemData - Star system data for lookups
 * @returns {Object} Migrated v4.1.0 state
 */
export function migrateFromV1ToV2(state, systemData) {
  devLog('Migrating save from v1.0.0 to v4.1.0');

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

  // Add danger system fields
  if (state.player.karma === undefined) {
    state.player.karma = 0;
  }
  if (!state.player.factions) {
    state.player.factions = {
      authorities: 0,
      traders: 0,
      outlaws: 0,
      civilians: 0,
    };
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

  // Add NPC state tracking (empty object for backward compatibility)
  if (!state.npcs) {
    state.npcs = {};
  }

  // Add dialogue state management
  if (!state.dialogue) {
    state.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
  }

  // Step to v2.0.0 (chain continues through subsequent migrations)
  state.meta.version = '2.0.0';

  devLog('Migration to v2.0.0 complete');

  return state;
}

/**
 * Migrate save data from v2.0.0 to v2.1.0
 *
 * Adds deterministic economy features:
 * - Market conditions tracking for local supply/demand effects
 * - NPC state tracking (reputation, flags, interactions)
 * - Dialogue state management
 *
 * @param {Object} state - v2.0.0 state
 * @returns {Object} Migrated v4.0.0 state
 */
export function migrateFromV2ToV2_1(state) {
  devLog('Migrating save from v2.0.0 to v2.1.0');

  // Add market conditions (empty object for backward compatibility)
  if (!state.world.marketConditions) {
    state.world.marketConditions = {};
  }

  // Add NPC state tracking (empty object for backward compatibility)
  if (!state.npcs) {
    state.npcs = {};
  }

  // Add dialogue state management
  if (!state.dialogue) {
    state.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
  }

  // Step to v2.1.0 (chain continues through subsequent migrations)
  state.meta.version = '2.1.0';

  devLog('Migration to v2.1.0 complete');

  return state;
}

/**
 * Migrate save data from v2.1.0 to v4.0.0
 *
 * Adds NPC foundation features:
 * - NPC state tracking (reputation, flags, interactions)
 * - Dialogue state management
 *
 * @param {Object} state - v2.1.0 state
 * @returns {Object} Migrated v4.0.0 state
 */
export function migrateFromV2_1ToV4(state) {
  devLog('Migrating save from v2.1.0 to v4.0.0');

  // Add NPC state tracking (empty object for backward compatibility)
  if (!state.npcs) {
    state.npcs = {};
  }

  // Add dialogue state management
  if (!state.dialogue) {
    state.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
  }

  // Step to v4.0.0 (chain continues through subsequent migrations)
  state.meta.version = '4.0.0';

  devLog('Migration to v4.0.0 complete');

  return state;
}

/**
 * Add defaults for missing fields in loaded state
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
      source: 'visited',
    };
  }

  // Add source field to existing price knowledge entries if missing (backward compatibility)
  if (state.world.priceKnowledge) {
    for (const systemId in state.world.priceKnowledge) {
      if (!state.world.priceKnowledge[systemId].source) {
        // Default to 'visited' for old saves
        state.world.priceKnowledge[systemId].source = 'visited';
      }
    }
  }

  // Initialize active events if missing
  if (!state.world.activeEvents) {
    state.world.activeEvents = [];
  }

  // Initialize market conditions if missing
  if (!state.world.marketConditions) {
    state.world.marketConditions = {};
  }

  // Initialize current system prices if missing (snapshot prices at current location)
  if (!state.world.currentSystemPrices) {
    const currentSystemId = state.player.currentSystem;
    const currentSystem = systemData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Load failed: current system ID ${currentSystemId} not found in star data`
      );
    }

    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents || [];
    const marketConditions = state.world.marketConditions || {};
    const currentPrices = {};

    for (const goodType of COMMODITY_TYPES) {
      currentPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
    }

    state.world.currentSystemPrices = currentPrices;
  }

  // Initialize NPC state if missing
  if (!state.npcs) {
    state.npcs = {};
  }

  // Initialize dialogue state if missing
  if (!state.dialogue) {
    state.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
  }

  // Initialize danger system fields if missing
  if (state.player.karma === undefined) {
    state.player.karma = 0;
  }
  if (!state.player.factions) {
    state.player.factions = {
      authorities: 0,
      traders: 0,
      outlaws: 0,
      civilians: 0,
    };
  }
  if (!state.world.dangerFlags) {
    state.world.dangerFlags = {
      piratesFought: 0,
      piratesNegotiated: 0,
      civiliansSaved: 0,
      civiliansLooted: 0,
      inspectionsPassed: 0,
      inspectionsBribed: 0,
      inspectionsFled: 0,
    };
  }

  if (!state.missions) {
    state.missions = {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    };
  }

  if (!state.missions.pendingFailureNotices) {
    state.missions.pendingFailureNotices = [];
  }

  // Initialize stats tracking if missing (pre-endgame saves)
  if (!state.stats) {
    state.stats = {
      creditsEarned: 0,
      jumpsCompleted: 0,
      cargoHauled: 0,
      charitableActs: 0,
    };
  }

  // Initialize quest state if missing (pre-endgame saves)
  if (!state.quests) {
    state.quests = {};
  }

  // Initialize achievements tracking if missing (pre-achievements saves)
  if (!state.achievements) {
    state.achievements = {};
  }

  // Initialize narrative events tracking if missing (pre-narrative-events saves)
  if (!state.world.narrativeEvents) {
    state.world.narrativeEvents = {
      fired: [],
      cooldowns: {},
      flags: {},
      dockedSystems: [],
    };
  }

  if (!state.preferences) {
    state.preferences = { ...DEFAULT_PREFERENCES };
  }

  // Add lastBorrowDay to finance if missing (pre-early-repayment-fee saves)
  if (state.player.finance && state.player.finance.lastBorrowDay === undefined) {
    state.player.finance.lastBorrowDay = null;
  }

  return state;
}
/**
 * Migrate save data from v4.0.0 to v4.1.0
 *
 * Adds NPC benefits system features:
 * - NPC benefits tracking (lastTipDay, lastFavorDay, loanAmount, loanDay, storedCargo, lastFreeRepairDay)
 *
 * @param {Object} state - v4.0.0 state
 * @returns {Object} Migrated v4.1.0 state
 */
export function migrateFromV4ToV4_1(state) {
  devLog('Migrating save from v4.0.0 to v4.1.0');

  // Add NPC benefits fields to existing NPC state entries
  if (state.npcs && typeof state.npcs === 'object') {
    for (const npcId in state.npcs) {
      const npcState = state.npcs[npcId];

      // Add default values for new NPC benefits fields if they don't exist
      if (npcState.lastTipDay === undefined) {
        npcState.lastTipDay = null;
      }
      if (npcState.lastFavorDay === undefined) {
        npcState.lastFavorDay = null;
      }
      if (npcState.loanAmount === undefined) {
        npcState.loanAmount = null;
      }
      if (npcState.loanDay === undefined) {
        npcState.loanDay = null;
      }
      if (npcState.storedCargo === undefined) {
        npcState.storedCargo = [];
      }
      if (npcState.lastFreeRepairDay === undefined) {
        npcState.lastFreeRepairDay = null;
      }
    }
  }

  // Step to v4.1.0 (next migration will bring to v5.0.0)
  state.meta.version = '4.1.0';

  devLog('Migration to v4.1.0 complete');

  return state;
}

/**
 * Migrate save data from v4.1.0 to v5.0.0
 *
 * Adds mission system:
 * - missions state (active, completed, failed, board, boardLastRefresh)
 *
 * @param {Object} state - v4.1.0 state
 * @returns {Object} Migrated v5.0.0 state
 */
export function migrateFromV4_1ToV5(state) {
  devLog('Migrating save from v4.1.0 to v5.0.0');

  if (!state.missions) {
    state.missions = {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    };
  }

  state.meta.version = GAME_VERSION;

  devLog('Migration complete');

  return state;
}
