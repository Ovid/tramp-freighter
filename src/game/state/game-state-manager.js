import {
  COMMODITY_TYPES,
  FUEL_PRICING_CONFIG,
  NAVIGATION_CONFIG,
  REPAIR_CONFIG,
  SHIP_CONFIG,
  calculateDistanceFromSol,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  NEW_GAME_DEFAULTS,
  ECONOMY_CONFIG,
} from '../constants.js';
import { TradingSystem } from '../game-trading.js';
import { EconomicEventsSystem } from '../game-events.js';
import { InformationBroker } from '../game-information-broker.js';
import {
  saveGame as saveGameToStorage,
  loadGame as loadGameFromStorage,
  hasSavedGame as checkSavedGame,
  clearSave as clearSaveFromStorage,
} from './save-load.js';
import {
  isVersionCompatible,
  validateStateStructure,
  migrateFromV1ToV2,
  migrateFromV2ToV2_1,
  addStateDefaults,
} from './state-validators.js';

/**
 * Sanitize ship name input
 *
 * Removes HTML tags, trims whitespace, and limits length to prevent display issues.
 * Returns default ship name if input is empty after sanitization.
 *
 * Feature: ship-personality, Property 10: Ship Name Sanitization
 * Validates: Requirements 4.2, 4.3, 10.3, 10.5
 *
 * @param {string} name - User input for ship name
 * @returns {string} Sanitized name or default
 */
export function sanitizeShipName(name) {
  if (!name || name.trim().length === 0) {
    return SHIP_CONFIG.DEFAULT_NAME;
  }

  // Remove HTML tags, limit length, then trim (order matters for edge cases)
  const sanitized = name
    .replace(/<[^>]*>/g, '')
    .substring(0, 50)
    .trim();

  return sanitized || SHIP_CONFIG.DEFAULT_NAME;
}

/**
 * GameStateManager - Manages all game state with event-driven reactivity
 *
 * Responsibilities:
 * - Initialize new game with default values
 * - Maintain single source of truth for game state
 * - Provide state query methods
 * - Emit events on state mutations for UI reactivity
 * - Support multiple subscribers per event type
 */
export class GameStateManager {
  constructor(starData, wormholeData, navigationSystem = null) {
    this.starData = starData;
    this.wormholeData = wormholeData;
    this.navigationSystem = navigationSystem;

    // Check once during initialization to suppress console noise during test runs
    this.isTestEnvironment =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    // Supports multiple UI components subscribing to same state changes
    this.subscribers = {
      creditsChanged: [],
      debtChanged: [],
      fuelChanged: [],
      cargoChanged: [],
      locationChanged: [],
      timeChanged: [],
      priceKnowledgeChanged: [],
      activeEventsChanged: [],
      shipConditionChanged: [],
      conditionWarning: [],
      shipNameChanged: [],
      upgradesChanged: [],
      quirksChanged: [],
    };

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Track last save time for debouncing
    this.lastSaveTime = 0;

    // Animation system reference (set by StarMapCanvas after scene initialization)
    // Used by useAnimationLock hook to check animation state
    this.animationSystem = null;
  }

  /**
   * Set the animation system reference
   *
   * Called by StarMapCanvas after scene initialization to make the animation
   * system accessible to React components via useAnimationLock hook.
   *
   * React Migration Spec: Requirements 43.2, 43.5
   *
   * @param {JumpAnimationSystem} animationSystem - The animation system instance
   */
  setAnimationSystem(animationSystem) {
    this.animationSystem = animationSystem;
  }

  /**
   * Assigns 2-3 random quirks to a new ship
   *
   * Quirks are permanent personality traits that provide both benefits and drawbacks.
   * Each ship receives a random number of quirks (50% chance for 2, 50% chance for 3).
   * No duplicate quirks are assigned.
   *
   * Feature: ship-personality, Property 1: Quirk Assignment Bounds
   * Validates: Requirements 1.1, 1.2
   *
   * @param {Function} rng - Random number generator (0-1), defaults to Math.random
   * @returns {string[]} Array of quirk IDs
   */
  assignShipQuirks(rng = Math.random) {
    const quirkIds = Object.keys(SHIP_CONFIG.QUIRKS);
    const count = rng() < 0.5 ? 2 : 3;
    const assigned = new Set();

    while (assigned.size < count) {
      const randomId = quirkIds[Math.floor(rng() * quirkIds.length)];
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
   * Initialize a new game with default values
   */
  initNewGame() {
    // Get Sol's grain price for initial cargo using dynamic pricing
    const solSystem = this.starData.find((s) => s.id === SOL_SYSTEM_ID);
    const currentDay = 0; // Game starts at day 0
    const activeEvents = []; // No events at game start
    const marketConditions = {}; // No market conditions at game start
    const solGrainPrice = TradingSystem.calculatePrice(
      'grain',
      solSystem,
      currentDay,
      activeEvents,
      marketConditions
    );

    // Calculate all Sol prices for price knowledge initialization
    const solPrices = {};
    for (const goodType of COMMODITY_TYPES) {
      solPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        solSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
    }

    // Assign random quirks to the ship
    const shipQuirks = this.assignShipQuirks();

    this.state = {
      player: {
        credits: NEW_GAME_DEFAULTS.STARTING_CREDITS,
        debt: NEW_GAME_DEFAULTS.STARTING_DEBT,
        currentSystem: SOL_SYSTEM_ID,
        daysElapsed: 0,
      },
      ship: {
        name: NEW_GAME_DEFAULTS.STARTING_SHIP_NAME,
        quirks: shipQuirks,
        upgrades: [],
        fuel: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        hull: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        engine: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        lifeSupport: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        cargoCapacity: NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY,
        cargo: [
          {
            good: 'grain',
            qty: NEW_GAME_DEFAULTS.STARTING_GRAIN_QUANTITY,
            buyPrice: solGrainPrice,
            buySystem: SOL_SYSTEM_ID,
            buySystemName: 'Sol',
            buyDate: 0,
          },
        ],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [SOL_SYSTEM_ID],
        priceKnowledge: {
          [SOL_SYSTEM_ID]: {
            lastVisit: 0,
            prices: solPrices,
          },
        },
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: solPrices,
      },
      meta: {
        version: GAME_VERSION,
        timestamp: Date.now(),
      },
    };

    if (!this.isTestEnvironment) {
      console.log('New game initialized:', this.state);
    }

    // Emit all initial state events
    this.emit('creditsChanged', this.state.player.credits);
    this.emit('debtChanged', this.state.player.debt);
    this.emit('fuelChanged', this.state.ship.fuel);
    this.emit('cargoChanged', this.state.ship.cargo);
    this.emit('locationChanged', this.state.player.currentSystem);
    this.emit('timeChanged', this.state.player.daysElapsed);
    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
    this.emit('shipConditionChanged', {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    });
    this.emit('upgradesChanged', this.state.ship.upgrades);
    this.emit('quirksChanged', this.state.ship.quirks);

    return this.state;
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  /**
   * Subscribe to state change events
   * @param {string} eventType - One of: creditsChanged, debtChanged, fuelChanged, cargoChanged, locationChanged, timeChanged, shipConditionChanged, conditionWarning, shipNameChanged, upgradesChanged, quirksChanged
   * @param {function} callback - Function to call when event occurs
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    this.subscribers[eventType].push(callback);
    if (!this.isTestEnvironment) {
      console.log(
        `Subscribed to ${eventType}, total subscribers: ${this.subscribers[eventType].length}`
      );
    }
  }

  unsubscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      return;
    }

    const index = this.subscribers[eventType].indexOf(callback);
    if (index > -1) {
      this.subscribers[eventType].splice(index, 1);
    }
  }

  emit(eventType, data) {
    if (!this.subscribers[eventType]) {
      return;
    }

    this.subscribers[eventType].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} subscriber:`, error);
      }
    });
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  getState() {
    return this.state;
  }

  getPlayer() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getPlayer called before game initialization'
      );
    }
    return this.state.player;
  }

  getShip() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getShip called before game initialization'
      );
    }
    return this.state.ship;
  }

  getCurrentSystem() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getCurrentSystem called before game initialization'
      );
    }

    const systemId = this.state.player.currentSystem;
    const system = this.starData.find((s) => s.id === systemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${systemId} not found in star data`
      );
    }

    return system;
  }

  getCargoUsed() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getCargoUsed called before game initialization'
      );
    }
    return this.state.ship.cargo.reduce((total, stack) => total + stack.qty, 0);
  }

  getCargoRemaining() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getCargoRemaining called before game initialization'
      );
    }
    return this.state.ship.cargoCapacity - this.getCargoUsed();
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
    if (!this.state) {
      throw new Error(
        'Invalid state: getFuelCapacity called before game initialization'
      );
    }

    const capabilities = this.calculateShipCapabilities();
    return capabilities.fuelCapacity;
  }

  isSystemVisited(systemId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: isSystemVisited called before game initialization'
      );
    }
    return this.state.world.visitedSystems.includes(systemId);
  }

  /**
   * Get ship condition values
   * @returns {Object} { hull, engine, lifeSupport }
   */
  getShipCondition() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getShipCondition called before game initialization'
      );
    }

    return {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
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
   * Get price knowledge database
   */
  getPriceKnowledge() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getPriceKnowledge called before game initialization'
      );
    }
    return this.state.world.priceKnowledge || {};
  }

  /**
   * Get locked prices for current system
   *
   * Returns the price snapshot taken when player arrived at current system.
   * These prices remain fixed until player leaves, preventing intra-system arbitrage.
   *
   * @returns {Object} Price object with all commodity prices
   */
  getCurrentSystemPrices() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getCurrentSystemPrices called before game initialization'
      );
    }
    if (!this.state.world.currentSystemPrices) {
      throw new Error(
        'Invalid state: currentSystemPrices missing from world state'
      );
    }
    return this.state.world.currentSystemPrices;
  }

  /**
   * Get known prices for a specific system
   */
  getKnownPrices(systemId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: getKnownPrices called before game initialization'
      );
    }
    if (!this.state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }
    return this.state.world.priceKnowledge[systemId]?.prices || null;
  }

  /**
   * Check if player has price knowledge for a system
   */
  hasVisitedSystem(systemId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: hasVisitedSystem called before game initialization'
      );
    }
    if (!this.state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }
    return this.state.world.priceKnowledge[systemId] !== undefined;
  }

  // ========================================================================
  // STATE MUTATIONS
  // ========================================================================

  updateCredits(newCredits) {
    this.state.player.credits = newCredits;
    this.emit('creditsChanged', newCredits);
  }

  updateDebt(newDebt) {
    this.state.player.debt = newDebt;
    this.emit('debtChanged', newDebt);
  }

  updateFuel(newFuel) {
    const maxFuel = this.getFuelCapacity();

    if (newFuel < SHIP_CONFIG.CONDITION_BOUNDS.MIN || newFuel > maxFuel) {
      throw new Error(
        `Invalid fuel value: ${newFuel}. Fuel must be between ${SHIP_CONFIG.CONDITION_BOUNDS.MIN} and ${maxFuel}.`
      );
    }

    this.state.ship.fuel = newFuel;
    this.emit('fuelChanged', newFuel);
  }

  updateCargo(newCargo) {
    this.state.ship.cargo = newCargo;
    this.emit('cargoChanged', newCargo);
  }

  updateLocation(newSystemId) {
    this.state.player.currentSystem = newSystemId;

    // Track exploration progress for future features (price discovery, missions)
    if (!this.state.world.visitedSystems.includes(newSystemId)) {
      this.state.world.visitedSystems.push(newSystemId);
    }

    // Snapshot prices at arrival to prevent intra-system arbitrage
    // Prices are locked until player leaves the system
    const system = this.starData.find((s) => s.id === newSystemId);
    if (!system) {
      throw new Error(
        `Invalid system ID: ${newSystemId} not found in star data`
      );
    }

    const currentDay = this.state.player.daysElapsed;
    const activeEvents = this.state.world.activeEvents || [];
    const marketConditions = this.state.world.marketConditions || {};

    const snapshotPrices = {};
    for (const goodType of COMMODITY_TYPES) {
      snapshotPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );
    }

    this.state.world.currentSystemPrices = snapshotPrices;

    this.emit('locationChanged', newSystemId);
  }

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

  updateTime(newDays) {
    const oldDays = this.state.player.daysElapsed;
    this.state.player.daysElapsed = newDays;

    // When days advance, update price knowledge and events
    if (newDays > oldDays) {
      const daysPassed = newDays - oldDays;

      // Increment staleness for all systems
      this.incrementPriceKnowledgeStaleness(daysPassed);

      // Clean up old intelligence data
      InformationBroker.cleanupOldIntelligence(this.state.world.priceKnowledge);

      // Apply market recovery (decay surplus/deficit over time)
      this.applyMarketRecovery(daysPassed);

      // Update economic events (trigger new events, remove expired ones)
      this.state.world.activeEvents = EconomicEventsSystem.updateEvents(
        this.state,
        this.starData
      );

      // Recalculate prices with new day number (for daily fluctuations)
      this.recalculatePricesForKnownSystems();

      // Emit event changes
      this.emit('activeEventsChanged', this.state.world.activeEvents);
    }

    this.emit('timeChanged', newDays);
  }

  /**
   * Update ship name
   *
   * @param {string} newName - New ship name (will be sanitized)
   */
  updateShipName(newName) {
    const sanitized = sanitizeShipName(newName);
    this.state.ship.name = sanitized;
    this.emit('shipNameChanged', sanitized);
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
    // Clamp all values to valid range
    this.state.ship.hull = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, hull)
    );
    this.state.ship.engine = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, engine)
    );
    this.state.ship.lifeSupport = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, lifeSupport)
    );

    this.emit('shipConditionChanged', {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    });

    // Check for warnings and emit them
    const warnings = this.checkConditionWarnings();
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.emit('conditionWarning', warning);
      });
    }
  }

  /**
   * Update market conditions for a system and commodity
   *
   * Tracks player trading activity to create local supply/demand effects.
   * Positive quantityDelta = surplus (player sold), negative = deficit (player bought).
   *
   * Uses sparse storage: system and commodity entries are created on-demand during first trade.
   * This keeps save files small by only tracking systems/commodities with active trading history.
   *
   * Feature: deterministic-economy, Requirements 4.1, 4.2, 9.2
   *
   * @param {number} systemId - System ID
   * @param {string} goodType - Commodity type
   * @param {number} quantityDelta - Quantity change (positive for sell, negative for buy)
   */
  updateMarketConditions(systemId, goodType, quantityDelta) {
    if (!this.state.world.marketConditions) {
      this.state.world.marketConditions = {};
    }

    // Create system entry if first trade at that system
    if (!this.state.world.marketConditions[systemId]) {
      this.state.world.marketConditions[systemId] = {};
    }

    // Create commodity entry if first trade of that commodity
    if (this.state.world.marketConditions[systemId][goodType] === undefined) {
      this.state.world.marketConditions[systemId][goodType] = 0;
    }

    // Add quantityDelta to existing value
    this.state.world.marketConditions[systemId][goodType] += quantityDelta;
  }

  /**
   * Apply market recovery to all market conditions
   *
   * Markets naturally recover toward equilibrium over time. Each day, surplus and deficit
   * values decay by 10% (multiply by 0.90). Insignificant values (abs < 1.0) are pruned
   * to keep save files small.
   *
   * Feature: deterministic-economy, Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   *
   * @param {number} daysPassed - Number of days elapsed
   */
  applyMarketRecovery(daysPassed) {
    if (!this.state) {
      throw new Error(
        'Invalid state: applyMarketRecovery called before game initialization'
      );
    }

    if (!this.state.world.marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }

    const recoveryFactor = Math.pow(
      ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR,
      daysPassed
    );

    // Iterate over all systems
    for (const systemId in this.state.world.marketConditions) {
      const systemConditions = this.state.world.marketConditions[systemId];

      // Iterate over all commodities in this system
      for (const goodType in systemConditions) {
        // Apply exponential decay
        systemConditions[goodType] *= recoveryFactor;

        // Prune insignificant entries
        if (
          Math.abs(systemConditions[goodType]) <
          ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD
        ) {
          delete systemConditions[goodType];
        }
      }

      // Remove empty system entries
      if (Object.keys(systemConditions).length === 0) {
        delete this.state.world.marketConditions[systemId];
      }
    }
  }

  /**
   * Update price knowledge for a system
   *
   * @param {number} systemId - System ID
   * @param {Object} prices - Price object with all commodity prices
   * @param {number} lastVisit - Days since last visit (0 = current)
   */
  updatePriceKnowledge(systemId, prices, lastVisit = 0) {
    if (!this.state.world.priceKnowledge) {
      this.state.world.priceKnowledge = {};
    }

    this.state.world.priceKnowledge[systemId] = {
      lastVisit: lastVisit,
      prices: { ...prices },
    };

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  /**
   * Increment lastVisit counter for all systems in price knowledge
   *
   * Called automatically when time advances
   *
   * @param {number} days - Number of days to increment (default 1)
   */
  incrementPriceKnowledgeStaleness(days = 1) {
    if (!this.state) {
      throw new Error(
        'Invalid state: incrementPriceKnowledgeStaleness called before game initialization'
      );
    }
    if (!this.state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }

    for (const systemId in this.state.world.priceKnowledge) {
      this.state.world.priceKnowledge[systemId].lastVisit += days;
    }

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  /**
   * Recalculate prices for all systems in price knowledge with current day's fluctuations
   *
   * Called automatically when day advances to update all known prices with new daily
   * fluctuations and active event modifiers.
   */
  recalculatePricesForKnownSystems() {
    if (!this.state) {
      throw new Error(
        'Invalid state: recalculatePricesForKnownSystems called before game initialization'
      );
    }
    if (!this.state.world.priceKnowledge) return;

    const currentDay = this.state.player.daysElapsed;
    const activeEvents = this.state.world.activeEvents;
    if (!activeEvents) {
      throw new Error('Invalid state: activeEvents missing from world state');
    }
    const marketConditions = this.state.world.marketConditions;
    if (!marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }

    // Recalculate prices for each system in price knowledge
    for (const systemIdStr in this.state.world.priceKnowledge) {
      const systemId = parseInt(systemIdStr);
      const system = this.starData.find((s) => s.id === systemId);

      if (system) {
        const newPrices = {};

        // Calculate new prices for all commodities
        for (const goodType of COMMODITY_TYPES) {
          newPrices[goodType] = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );
        }

        // Update prices while preserving lastVisit
        this.state.world.priceKnowledge[systemId].prices = newPrices;
      }
    }

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  // ========================================================================
  // ECONOMIC EVENTS SYSTEM
  // ========================================================================

  /**
   * Get active events array
   */
  getActiveEvents() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getActiveEvents called before game initialization'
      );
    }
    return this.state.world.activeEvents || [];
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    if (!this.state.world.activeEvents) {
      this.state.world.activeEvents = [];
    }

    this.state.world.activeEvents = newEvents;
    this.emit('activeEventsChanged', newEvents);
  }

  /**
   * Get active event for a specific system
   *
   * @param {number} systemId - System identifier
   * @returns {Object|null} Active event or null
   */
  getActiveEventForSystem(systemId) {
    const activeEvents = this.getActiveEvents();
    return activeEvents.find((event) => event.systemId === systemId) || null;
  }

  /**
   * Get event type definition by event type key
   * @param {string} eventTypeKey - Event type identifier
   * @returns {Object|null} Event type definition or null
   */
  getEventType(eventTypeKey) {
    return EconomicEventsSystem.EVENT_TYPES[eventTypeKey] || null;
  }

  // ========================================================================
  // INFORMATION BROKER SYSTEM
  // ========================================================================

  /**
   * Get intelligence cost for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {number} Cost in credits
   */
  getIntelligenceCost(systemId) {
    const priceKnowledge = this.getPriceKnowledge();
    return InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
  }

  /**
   * Purchase market intelligence for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseIntelligence(systemId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: purchaseIntelligence called before game initialization'
      );
    }

    const result = InformationBroker.purchaseIntelligence(
      this.state,
      systemId,
      this.starData
    );

    if (result.success) {
      // Emit state change events
      this.emit('creditsChanged', this.state.player.credits);
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);

      // Persist immediately - intelligence purchase modifies credits and price knowledge
      this.saveGame();
    }

    return result;
  }

  /**
   * Generate a market rumor
   *
   * @returns {string} Rumor text
   */
  generateRumor() {
    if (!this.state) {
      throw new Error(
        'Invalid state: generateRumor called before game initialization'
      );
    }

    return InformationBroker.generateRumor(this.state, this.starData);
  }

  /**
   * Get list of systems connected to current system with intelligence costs
   *
   * When Advanced Sensor Array upgrade is installed, includes active economic
   * events for connected systems.
   *
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit, event? }
   */
  listAvailableIntelligence() {
    const priceKnowledge = this.getPriceKnowledge();
    const currentSystemId = this.state.player.currentSystem;
    const activeEvents = this.getActiveEvents();
    const hasAdvancedSensors =
      this.state.ship.upgrades.includes('advanced_sensors');

    return InformationBroker.listAvailableIntelligence(
      priceKnowledge,
      this.starData,
      currentSystemId,
      this.navigationSystem,
      activeEvents,
      hasAdvancedSensors
    );
  }

  // ========================================================================
  // TRADING OPERATIONS
  // ========================================================================

  /**
   * Execute a purchase transaction
   */
  buyGood(goodType, quantity, price) {
    if (!this.state) {
      throw new Error(
        'Invalid state: buyGood called before game initialization'
      );
    }

    const credits = this.state.player.credits;
    const cargoSpace = this.getCargoRemaining();
    const totalCost = quantity * price;

    // Validate purchase constraints
    if (totalCost > credits) {
      return { success: false, reason: 'Insufficient credits' };
    }

    if (quantity > cargoSpace) {
      return { success: false, reason: 'Not enough cargo space' };
    }

    this.updateCredits(credits - totalCost);

    // Pass current system and day for purchase metadata
    const currentSystemId = this.state.player.currentSystem;
    const currentSystem = this.getCurrentSystem();
    const currentSystemName = currentSystem.name;
    const currentDay = this.state.player.daysElapsed;

    const newCargo = TradingSystem.recordCargoPurchase(
      this.state.ship.cargo,
      goodType,
      quantity,
      price,
      currentSystemId,
      currentSystemName,
      currentDay
    );
    this.updateCargo(newCargo);

    // Update market conditions: negative quantity creates deficit (raises prices)
    // Feature: deterministic-economy, Requirements 4.1, 4.2
    this.updateMarketConditions(currentSystemId, goodType, -quantity);

    // Persist immediately - trade transactions modify credits and cargo
    this.saveGame();

    return { success: true };
  }

  /**
   * Execute a sale transaction from a specific cargo stack
   */
  sellGood(stackIndex, quantity, salePrice) {
    if (!this.state) {
      throw new Error(
        'Invalid state: sellGood called before game initialization'
      );
    }

    const cargo = this.state.ship.cargo;

    // Validate sale constraints
    if (stackIndex < 0 || stackIndex >= cargo.length) {
      return { success: false, reason: 'Invalid cargo stack' };
    }

    const stack = cargo[stackIndex];

    if (quantity <= 0) {
      return { success: false, reason: 'Quantity must be positive' };
    }

    if (quantity > stack.qty) {
      return { success: false, reason: 'Not enough quantity in stack' };
    }
    const totalRevenue = quantity * salePrice;
    const profitMargin = salePrice - stack.buyPrice;

    this.updateCredits(this.state.player.credits + totalRevenue);

    // Remove quantity from stack; remove stack if empty
    stack.qty -= quantity;
    if (stack.qty <= 0) {
      cargo.splice(stackIndex, 1);
    }
    this.updateCargo(cargo);

    // Update market conditions: positive quantity creates surplus (lowers prices)
    // Feature: deterministic-economy, Requirements 4.1, 4.2
    const currentSystemId = this.state.player.currentSystem;
    this.updateMarketConditions(currentSystemId, stack.good, quantity);

    // Persist immediately - trade transactions modify credits and cargo
    this.saveGame();

    return {
      success: true,
      profitMargin: profitMargin,
    };
  }

  // ========================================================================
  // REFUEL SYSTEM
  // ========================================================================

  /**
   * Calculate fuel price based on system distance from Sol
   *
   * @param {number} systemId - System ID to check
   * @returns {number} Fuel price per percentage point
   */
  getFuelPrice(systemId) {
    if (FUEL_PRICING_CONFIG.CORE_SYSTEMS.IDS.includes(systemId)) {
      return FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT;
    }

    const system = this.starData.find((s) => s.id === systemId);
    if (!system) {
      return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
    }

    const distanceFromSol = calculateDistanceFromSol(system);

    if (
      distanceFromSol < FUEL_PRICING_CONFIG.INNER_SYSTEMS.DISTANCE_THRESHOLD
    ) {
      return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
    }

    if (
      distanceFromSol < FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.DISTANCE_THRESHOLD
    ) {
      return FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT;
    }

    return FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT;
  }

  /**
   * Validate refuel transaction
   *
   * @param {number} currentFuel - Current fuel percentage
   * @param {number} amount - Amount to refuel (percentage points)
   * @param {number} credits - Player's current credits
   * @param {number} pricePerPercent - Fuel price per percentage point
   * @returns {Object} { valid: boolean, reason: string, cost: number }
   */
  validateRefuel(currentFuel, amount, credits, pricePerPercent) {
    const totalCost = amount * pricePerPercent;
    const maxFuel = this.getFuelCapacity();

    if (amount <= 0) {
      return {
        valid: false,
        reason: 'Refuel amount must be positive',
        cost: totalCost,
      };
    }

    // Use epsilon for floating point comparison
    if (
      currentFuel + amount >
      maxFuel + NAVIGATION_CONFIG.FUEL_CAPACITY_EPSILON
    ) {
      return {
        valid: false,
        reason: `Cannot refuel beyond ${maxFuel}% capacity`,
        cost: totalCost,
      };
    }

    if (totalCost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits for refuel',
        cost: totalCost,
      };
    }

    return {
      valid: true,
      reason: null,
      cost: totalCost,
    };
  }

  /**
   * Execute refuel transaction
   *
   * @param {number} amount - Amount to refuel (percentage points)
   * @returns {Object} { success: boolean, reason: string }
   */
  refuel(amount) {
    if (!this.state) {
      throw new Error(
        'Invalid state: refuel called before game initialization'
      );
    }

    const currentFuel = this.state.ship.fuel;
    const credits = this.state.player.credits;
    const systemId = this.state.player.currentSystem;
    const pricePerPercent = this.getFuelPrice(systemId);

    const validation = this.validateRefuel(
      currentFuel,
      amount,
      credits,
      pricePerPercent
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    this.updateCredits(credits - validation.cost);
    this.updateFuel(currentFuel + amount);

    // Persist immediately - refuel modifies credits and fuel
    this.saveGame();

    return { success: true, reason: null };
  }

  // ========================================================================
  // SHIP REPAIR SYSTEM
  // ========================================================================

  /**
   * Calculate repair cost for a ship system
   *
   * Cost is ₡5 per 1% restored. If system is already at maximum condition, cost is 0.
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} currentCondition - Current condition percentage
   * @returns {number} Cost in credits
   */
  getRepairCost(systemType, amount, currentCondition) {
    // If already at max, no cost
    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return 0;
    }

    // Calculate cost at ₡5 per 1%
    return amount * REPAIR_CONFIG.COST_PER_PERCENT;
  }

  /**
   * Execute repair transaction for a ship system
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @returns {Object} { success: boolean, reason: string }
   */
  repairShipSystem(systemType, amount) {
    if (!this.state) {
      throw new Error(
        'Invalid state: repairShipSystem called before game initialization'
      );
    }

    // Validate system type
    const validSystems = ['hull', 'engine', 'lifeSupport'];
    if (!validSystems.includes(systemType)) {
      return { success: false, reason: 'Invalid system type' };
    }

    const currentCondition = this.state.ship[systemType];
    const credits = this.state.player.credits;
    const cost = this.getRepairCost(systemType, amount, currentCondition);

    // Validation order matters for user experience:
    // 1. Check for positive amount (basic input validation)
    // 2. Check if system already at max (no repair needed)
    // 3. Check credits (player can fix by earning money)
    // 4. Check if would exceed max (player can fix by reducing amount)

    if (amount <= 0) {
      return { success: false, reason: 'Repair amount must be positive' };
    }

    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return { success: false, reason: 'System already at maximum condition' };
    }

    if (cost > credits) {
      return { success: false, reason: 'Insufficient credits for repair' };
    }

    if (currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return {
        success: false,
        reason: 'Repair would exceed maximum condition',
      };
    }

    // Deduct credits
    this.updateCredits(credits - cost);

    // Increase condition (clamped by updateShipCondition)
    const newConditions = {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    };

    newConditions[systemType] = currentCondition + amount;

    this.updateShipCondition(
      newConditions.hull,
      newConditions.engine,
      newConditions.lifeSupport
    );

    // Persist immediately - repair modifies credits and ship condition
    this.saveGame();

    return { success: true, reason: null };
  }

  // ========================================================================
  // UPGRADE SYSTEM
  // ========================================================================

  /**
   * Validate upgrade purchase
   *
   * Checks if an upgrade can be purchased by verifying:
   * 1. Upgrade is not already installed
   * 2. Player has sufficient credits
   *
   * Feature: ship-personality, Property 11: Upgrade Purchase Validation
   * Validates: Requirements 2.5, 8.5
   *
   * @param {string} upgradeId - Upgrade identifier from SHIP_UPGRADES
   * @returns {Object} { valid: boolean, reason: string }
   */
  validateUpgradePurchase(upgradeId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: validateUpgradePurchase called before game initialization'
      );
    }

    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
    if (!upgrade) {
      return { valid: false, reason: 'Unknown upgrade' };
    }

    // Check if already purchased
    if (this.state.ship.upgrades.includes(upgradeId)) {
      return { valid: false, reason: 'Upgrade already installed' };
    }

    // Check credits
    if (this.state.player.credits < upgrade.cost) {
      return {
        valid: false,
        reason: `Insufficient credits (need ₡${upgrade.cost})`,
      };
    }

    return { valid: true, reason: '' };
  }

  /**
   * Purchase and install a ship upgrade
   *
   * Validates the purchase, deducts credits, adds upgrade to ship, and applies
   * upgrade effects to ship capabilities. All upgrades are permanent and cannot
   * be removed once purchased.
   *
   * Feature: ship-personality, Property 3: Upgrade Purchase Transaction
   * Validates: Requirements 2.4, 2.5
   *
   * @param {string} upgradeId - Upgrade identifier from SHIP_UPGRADES
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseUpgrade(upgradeId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: purchaseUpgrade called before game initialization'
      );
    }

    // Validate purchase
    const validation = this.validateUpgradePurchase(upgradeId);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

    // Deduct credits
    this.updateCredits(this.state.player.credits - upgrade.cost);

    // Add upgrade to ship
    this.state.ship.upgrades.push(upgradeId);

    // Apply upgrade effects to ship capabilities
    const capabilities = this.calculateShipCapabilities();

    // Update ship state with new capabilities
    this.state.ship.cargoCapacity = capabilities.cargoCapacity;
    this.state.ship.hiddenCargoCapacity = capabilities.hiddenCargoCapacity;

    // Note: Fuel capacity is calculated on-demand via getFuelCapacity()
    // Note: Rate modifiers (fuelConsumption, hullDegradation, lifeSupportDrain)
    // are applied during calculations via calculateShipCapabilities(), not stored

    // Emit upgrade change event
    this.emit('upgradesChanged', this.state.ship.upgrades);

    // Persist immediately - upgrade purchase modifies credits and ship state
    this.saveGame();

    return { success: true, reason: '' };
  }

  /**
   * Calculate ship capabilities based on installed upgrades
   *
   * Starts with base capabilities and applies all upgrade effects.
   * Capacities use absolute values, rates use multipliers.
   *
   * Feature: ship-personality, Property 4: Upgrade Effect Application
   * Validates: Requirements 2.6, 7.1-7.9
   *
   * @returns {Object} Ship capabilities with all upgrades applied
   */
  calculateShipCapabilities() {
    if (!this.state) {
      throw new Error(
        'Invalid state: calculateShipCapabilities called before game initialization'
      );
    }

    const capabilities = {
      fuelCapacity: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      cargoCapacity: NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY,
      fuelConsumption: 1.0,
      hullDegradation: 1.0,
      lifeSupportDrain: 1.0,
      hiddenCargoCapacity: 0,
      eventVisibility: 0,
    };

    // Apply upgrade effects
    for (const upgradeId of this.state.ship.upgrades) {
      const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

      // If upgrade doesn't exist, this is a critical bug - fail loudly
      if (!upgrade) {
        throw new Error(
          `Invalid upgrade ID: ${upgradeId} not found in SHIP_UPGRADES`
        );
      }

      for (const [attr, value] of Object.entries(upgrade.effects)) {
        if (attr.endsWith('Capacity')) {
          // Absolute values for capacities
          capabilities[attr] = value;
        } else {
          // Multipliers for rates
          capabilities[attr] *= value;
        }
      }
    }

    return capabilities;
  }

  // ========================================================================
  // HIDDEN CARGO SYSTEM
  // ========================================================================

  /**
   * Add cargo to a cargo array, stacking with existing cargo if possible
   *
   * Stacks cargo with matching good type and buyPrice. If no match is found,
   * creates a new stack. Preserves purchase metadata from the source stack.
   *
   * @param {Array} cargoArray - Target cargo array (regular or hidden)
   * @param {Object} sourceStack - Source cargo stack with metadata
   * @param {number} qty - Quantity to add
   * @private
   */
  _addToCargoArray(cargoArray, sourceStack, qty) {
    // Find existing stack with matching good and buyPrice
    const existingIndex = cargoArray.findIndex(
      (c) => c.good === sourceStack.good && c.buyPrice === sourceStack.buyPrice
    );

    if (existingIndex >= 0) {
      // Stack with existing cargo
      cargoArray[existingIndex].qty += qty;
    } else {
      // Create new stack with metadata from source
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

  /**
   * Move cargo from regular compartment to hidden compartment
   *
   * Validates that Smuggler's Panels is installed, cargo exists with sufficient
   * quantity, and hidden cargo capacity is available. Transfers cargo between
   * compartments while preserving purchase metadata.
   *
   * Feature: ship-personality, Property 12: Hidden Cargo Transfer Validation
   * Validates: Requirements 3.1, 3.3
   *
   * @param {string} good - Commodity type
   * @param {number} qty - Quantity to move
   * @returns {Object} { success: boolean, reason: string }
   */
  moveToHiddenCargo(good, qty) {
    if (!this.state) {
      throw new Error(
        'Invalid state: moveToHiddenCargo called before game initialization'
      );
    }

    const ship = this.state.ship;

    // Check if smuggler's panels installed
    if (!ship.upgrades.includes('smuggler_panels')) {
      return { success: false, reason: 'No hidden cargo compartment' };
    }

    // Find cargo stack
    const cargoIndex = ship.cargo.findIndex((c) => c.good === good);
    if (cargoIndex === -1) {
      return { success: false, reason: 'Cargo not found' };
    }

    const cargoStack = ship.cargo[cargoIndex];
    if (cargoStack.qty < qty) {
      return { success: false, reason: 'Insufficient quantity' };
    }

    // Check hidden cargo capacity
    const hiddenUsed = ship.hiddenCargo.reduce((sum, c) => sum + c.qty, 0);
    const hiddenAvailable = ship.hiddenCargoCapacity - hiddenUsed;
    if (qty > hiddenAvailable) {
      return {
        success: false,
        reason: `Hidden cargo full (${hiddenAvailable} units available)`,
      };
    }

    // Remove from regular cargo
    cargoStack.qty -= qty;
    if (cargoStack.qty === 0) {
      ship.cargo.splice(cargoIndex, 1);
    }

    // Add to hidden cargo (stacks with matching good and buyPrice)
    this._addToCargoArray(ship.hiddenCargo, cargoStack, qty);

    // Emit cargo change event
    this.updateCargo(ship.cargo);

    // Persist immediately - cargo transfer modifies ship state
    this.saveGame();

    return { success: true, reason: '' };
  }

  /**
   * Move cargo from hidden compartment to regular compartment
   *
   * Validates that cargo exists in hidden compartment and regular cargo
   * capacity is available. Transfers cargo between compartments while
   * preserving purchase metadata.
   *
   * Feature: ship-personality, Property 12: Hidden Cargo Transfer Validation
   * Validates: Requirements 3.4
   *
   * @param {string} good - Commodity type
   * @param {number} qty - Quantity to move
   * @returns {Object} { success: boolean, reason: string }
   */
  moveToRegularCargo(good, qty) {
    if (!this.state) {
      throw new Error(
        'Invalid state: moveToRegularCargo called before game initialization'
      );
    }

    const ship = this.state.ship;

    // Find hidden cargo stack
    const hiddenIndex = ship.hiddenCargo.findIndex((c) => c.good === good);
    if (hiddenIndex === -1) {
      return {
        success: false,
        reason: 'Cargo not found in hidden compartment',
      };
    }

    const hiddenStack = ship.hiddenCargo[hiddenIndex];
    if (hiddenStack.qty < qty) {
      return { success: false, reason: 'Insufficient quantity' };
    }

    // Check regular cargo capacity
    const cargoUsed = ship.cargo.reduce((sum, c) => sum + c.qty, 0);
    const cargoAvailable = ship.cargoCapacity - cargoUsed;
    if (qty > cargoAvailable) {
      return {
        success: false,
        reason: `Cargo hold full (${cargoAvailable} units available)`,
      };
    }

    // Remove from hidden cargo
    hiddenStack.qty -= qty;
    if (hiddenStack.qty === 0) {
      ship.hiddenCargo.splice(hiddenIndex, 1);
    }

    // Add to regular cargo (stacks with matching good and buyPrice)
    this._addToCargoArray(ship.cargo, hiddenStack, qty);

    // Emit cargo change event
    this.updateCargo(ship.cargo);

    // Persist immediately - cargo transfer modifies ship state
    this.saveGame();

    return { success: true, reason: '' };
  }

  // ========================================================================
  // DOCK/UNDOCK OPERATIONS
  // ========================================================================

  /**
   * Dock at current system's station to access trading and refueling
   *
   * Updates price knowledge on dock:
   * - First visit: Records current prices with lastVisit = daysElapsed
   * - Subsequent visits: Updates prices and resets lastVisit to 0
   */
  dock() {
    if (!this.state) {
      throw new Error('Invalid state: dock called before game initialization');
    }

    const currentSystemId = this.state.player.currentSystem;
    const currentSystem = this.starData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    // Calculate current prices for all commodities using dynamic pricing
    const currentDay = this.state.player.daysElapsed;
    const activeEvents = this.state.world.activeEvents;
    if (!activeEvents) {
      throw new Error('Invalid state: activeEvents missing from world state');
    }
    const marketConditions = this.state.world.marketConditions;
    if (!marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }
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

    // Update price knowledge (resets lastVisit to 0)
    this.updatePriceKnowledge(currentSystemId, currentPrices, 0);

    // Persist state transition - prevents loss if player closes browser while docked
    this.saveGame();

    return { success: true };
  }

  /**
   * Undock from current system's station to resume navigation
   *
   * Currently a state transition marker for auto-save
   * Future: Will close station UI, enable jumps, track undocked state.
   */
  undock() {
    if (!this.state) {
      throw new Error(
        'Invalid state: undock called before game initialization'
      );
    }

    // Persist state transition - prevents loss if player closes browser while undocked
    this.saveGame();

    return { success: true };
  }

  // ========================================================================
  // SAVE/LOAD SYSTEM
  // ========================================================================

  /**
   * Save game state to localStorage with debouncing
   *
   * Implements save debouncing to prevent excessive saves (max 1 save per second).
   * This protects against rapid state changes causing performance issues.
   */
  saveGame() {
    const result = saveGameToStorage(
      this.state,
      this.lastSaveTime,
      this.isTestEnvironment
    );

    if (result.success) {
      this.lastSaveTime = result.newLastSaveTime;
    }

    return result.success;
  }

  /**
   * Load game state from localStorage
   *
   * Supports migration from v1.0.0 to v2.0.0
   */
  loadGame() {
    try {
      // Load raw state from localStorage
      let loadedState = loadGameFromStorage(this.isTestEnvironment);

      if (!loadedState) {
        return null;
      }

      // Check version compatibility
      if (!isVersionCompatible(loadedState.meta?.version)) {
        if (!this.isTestEnvironment) {
          console.log('Save version incompatible, starting new game');
        }
        return null;
      }

      // Migrate from v1.0.0 to v2.1.0 if needed
      if (loadedState.meta?.version === '1.0.0' && GAME_VERSION === '2.1.0') {
        loadedState = migrateFromV1ToV2(
          loadedState,
          this.starData,
          this.isTestEnvironment
        );
      }

      // Migrate from v2.0.0 to v2.1.0 if needed
      if (loadedState.meta?.version === '2.0.0' && GAME_VERSION === '2.1.0') {
        loadedState = migrateFromV2ToV2_1(loadedState, this.isTestEnvironment);
      }

      // Validate state structure
      if (!validateStateStructure(loadedState)) {
        if (!this.isTestEnvironment) {
          console.log('Save data corrupted, starting new game');
        }
        return null;
      }

      // Add defaults for missing fields
      loadedState = addStateDefaults(loadedState, this.starData);

      this.state = loadedState;

      // Emit all state events to update UI
      this.emit('creditsChanged', this.state.player.credits);
      this.emit('debtChanged', this.state.player.debt);
      this.emit('fuelChanged', this.state.ship.fuel);
      this.emit('cargoChanged', this.state.ship.cargo);
      this.emit('locationChanged', this.state.player.currentSystem);
      this.emit('timeChanged', this.state.player.daysElapsed);
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
      this.emit('activeEventsChanged', this.state.world.activeEvents);
      this.emit('shipConditionChanged', {
        hull: this.state.ship.hull,
        engine: this.state.ship.engine,
        lifeSupport: this.state.ship.lifeSupport,
      });
      this.emit('upgradesChanged', this.state.ship.upgrades);
      this.emit('quirksChanged', this.state.ship.quirks);

      return this.state;
    } catch (error) {
      if (!this.isTestEnvironment) {
        console.log('Failed to load game:', error);
      }
      return null;
    }
  }

  /**
   * Check if saved game exists
   */
  hasSavedGame() {
    return checkSavedGame();
  }

  clearSave() {
    return clearSaveFromStorage(this.isTestEnvironment);
  }
}
