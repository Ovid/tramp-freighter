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
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
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
  migrateFromV2_1ToV4,
  addStateDefaults,
} from './state-validators.js';
import { ALL_NPCS } from '../data/npc-data.js';
import { TradingManager } from './managers/trading.js';
import { ShipManager } from './managers/ship.js';
import { NPCManager } from './managers/npc.js';
import { NavigationManager } from './managers/navigation.js';

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
      dialogueChanged: [],
    };

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Track last save time for debouncing
    this.lastSaveTime = 0;

    // Animation system reference (set by StarMapCanvas after scene initialization)
    // Used by useAnimationLock hook to check animation state
    this.animationSystem = null;

    // Initialize managers
    this.tradingManager = new TradingManager(this);
    this.shipManager = new ShipManager(this);
    this.npcManager = new NPCManager(null, this.emit.bind(this));
    this.navigationManager = new NavigationManager(this, this.starData);
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
   * @param {Function} rng - Random number generator (0-1), defaults to Math.random
   * @returns {string[]} Array of quirk IDs
   */
  assignShipQuirks(rng = Math.random) {
    return this.shipManager.assignShipQuirks(rng);
  }

  /**
   * Apply quirk modifiers to a base value
   *
   * @param {number} baseValue - Starting value before modifiers
   * @param {string} attribute - Attribute name (e.g., 'fuelConsumption', 'hullDegradation')
   * @param {string[]} quirks - Array of quirk IDs
   * @returns {number} Modified value after applying all relevant quirk modifiers
   */
  applyQuirkModifiers(baseValue, attribute, quirks) {
    return this.shipManager.applyQuirkModifiers(baseValue, attribute, quirks);
  }

  /**
   * Get quirk definition by ID
   *
   * @param {string} quirkId - Quirk identifier
   * @returns {Object|null} Quirk definition or null if not found
   */
  getQuirkDefinition(quirkId) {
    return this.shipManager.getQuirkDefinition(quirkId);
  }

  /**
   * Get upgrade definition by ID
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {Object|null} Upgrade definition or null if not found
   */
  getUpgradeDefinition(upgradeId) {
    return this.shipManager.getUpgradeDefinition(upgradeId);
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
            source: 'visited',
          },
        },
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: solPrices,
      },
      npcs: {},
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
      meta: {
        version: GAME_VERSION,
        timestamp: Date.now(),
      },
    };

    // Update manager state references
    this.npcManager.state = this.state;

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

  /**
   * Get current system data
   * Delegates to NavigationManager
   *
   * @returns {Object} Current system object with id, name, coordinates, etc.
   */
  getCurrentSystem() {
    return this.navigationManager.getCurrentSystem();
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
   * @returns {number} Maximum fuel capacity in percentage points
   */
  getFuelCapacity() {
    return this.shipManager.getFuelCapacity();
  }

  /**
   * Check if a system has been visited by the player
   * Delegates to NavigationManager
   *
   * @param {number} systemId - System ID to check
   * @returns {boolean} True if system has been visited
   */
  isSystemVisited(systemId) {
    return this.navigationManager.isSystemVisited(systemId);
  }

  /**
   * Get ship condition values
   * @returns {Object} { hull, engine, lifeSupport }
   */
  getShipCondition() {
    return this.shipManager.getShipCondition();
  }

  /**
   * Check ship condition and return warnings for systems below thresholds
   *
   * @returns {Array} Array of warning objects: { system: string, message: string, severity: string }
   */
  checkConditionWarnings() {
    return this.shipManager.checkConditionWarnings();
  }

  /**
   * Get price knowledge database
   */
  getPriceKnowledge() {
    return this.tradingManager.getPriceKnowledge();
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
    return this.tradingManager.getCurrentSystemPrices();
  }

  /**
   * Get known prices for a specific system
   */
  getKnownPrices(systemId) {
    return this.tradingManager.getKnownPrices(systemId);
  }

  /**
   * Check if player has price knowledge for a system
   */
  hasVisitedSystem(systemId) {
    return this.tradingManager.hasVisitedSystem(systemId);
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

  /**
   * Update player location to a new system
   * Delegates to NavigationManager
   *
   * @param {number} newSystemId - ID of the destination system
   */
  updateLocation(newSystemId) {
    return this.navigationManager.updateLocation(newSystemId);
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

      // Check for loan defaults and apply penalties
      this.checkLoanDefaults();

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
    this.shipManager.updateShipName(newName);
  }

  /**
   * Update ship condition values
   *
   * @param {number} hull - Hull integrity percentage
   * @param {number} engine - Engine condition percentage
   * @param {number} lifeSupport - Life support condition percentage
   */
  updateShipCondition(hull, engine, lifeSupport) {
    this.shipManager.updateShipCondition(hull, engine, lifeSupport);
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
    return this.tradingManager.updateMarketConditions(systemId, goodType, quantityDelta);
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
    return this.tradingManager.applyMarketRecovery(daysPassed);
  }

  /**
   * Update price knowledge for a system
   *
   * @param {number} systemId - System ID
   * @param {Object} prices - Price object with all commodity prices
   * @param {number} lastVisit - Days since last visit (0 = current)
   * @param {string} source - Source of data: 'visited' or 'intelligence_broker'
   */
  updatePriceKnowledge(systemId, prices, lastVisit = 0, source = 'visited') {
    return this.tradingManager.updatePriceKnowledge(systemId, prices, lastVisit, source);
  }

  /**
   * Increment lastVisit counter for all systems in price knowledge
   *
   * Called automatically when time advances
   *
   * @param {number} days - Number of days to increment (default 1)
   */
  incrementPriceKnowledgeStaleness(days = 1) {
    return this.tradingManager.incrementPriceKnowledgeStaleness(days);
  }

  /**
   * Recalculate prices for all systems in price knowledge with current day's fluctuations
   *
   * Called automatically when day advances to update all known prices with new daily
   * fluctuations and active event modifiers.
   */
  recalculatePricesForKnownSystems() {
    return this.tradingManager.recalculatePricesForKnownSystems();
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
    return this.state.world.activeEvents;
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    // activeEvents is guaranteed to exist after initialization
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
  // NPC REPUTATION SYSTEM
  // ========================================================================

  /**
   * Validate NPC ID and return NPC data
   *
   * Private method to validate NPC ID exists in game data and return the NPC data object.
   * Used by all NPC-related methods to avoid redundant validation.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC data object
   * @throws {Error} If NPC ID is not found
   * @private
   */
  _validateAndGetNPCData(npcId) {
    const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
    if (!npcData) {
      throw new Error(`Unknown NPC ID: ${npcId}`);
    }
    return npcData;
  }

  /**
   * Get reputation tier classification for a reputation value
   *
   * Classifies reputation into named tiers based on numeric ranges.
   * Each tier has a name and min/max bounds for display purposes.
   *
   * @param {number} rep - Reputation value (-100 to 100)
   * @returns {Object} Tier object with name, min, max properties
   */
  getRepTier(rep) {
    for (const tier of Object.values(REPUTATION_TIERS)) {
      if (rep >= tier.min && rep <= tier.max) {
        return tier;
      }
    }

    // This should never happen with valid reputation values
    throw new Error(`Invalid reputation value: ${rep}`);
  }

  /**
   * Get or initialize NPC state
   *
   * Returns existing NPC state or creates default state with initial reputation.
   * NPC state includes reputation, last interaction day, story flags, and interaction count.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC state object
   */
  getNPCState(npcId) {
    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Return existing state or create default using NPC's initialRep
    if (!this.state.npcs[npcId]) {
      this.state.npcs[npcId] = {
        rep: npcData.initialRep,
        lastInteraction: this.state.player.daysElapsed,
        flags: [],
        interactions: 0,
        // NPC Benefits System fields
        lastTipDay: null,
        lastFavorDay: null,
        loanAmount: null,
        loanDay: null,
        storedCargo: [],
        lastFreeRepairDay: null,
      };
    }

    return this.state.npcs[npcId];
  }

  /**
   * Modify NPC reputation with trust modifier and quirk support
   *
   * Applies reputation change with NPC personality trust modifier and
   * smooth_talker quirk bonus. Clamps final value to [-100, 100] range.
   * Updates interaction count and timestamp.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} amount - Base reputation change amount
   * @param {string} reason - Reason for reputation change (for logging)
   */
  modifyRep(npcId, amount, reason) {
    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get or create NPC state
    const npcState = this.getNPCState(npcId);

    // Apply trust modifier for positive reputation gains
    let modifiedAmount = amount;
    if (amount > 0) {
      modifiedAmount *= npcData.personality.trust;
    }

    // Apply smooth_talker quirk bonus for positive reputation gains
    if (amount > 0 && this.state.ship.quirks.includes('smooth_talker')) {
      modifiedAmount *= 1.05;
    }

    // Calculate new reputation with clamping and rounding
    const oldRep = npcState.rep;
    const newRep = Math.max(
      -100,
      Math.min(100, Math.round(oldRep + modifiedAmount))
    );

    // Log warning if clamping occurred
    if (oldRep + modifiedAmount < -100 || oldRep + modifiedAmount > 100) {
      if (!this.isTestEnvironment) {
        console.warn(
          `Reputation clamped for ${npcId}: ${oldRep + modifiedAmount} -> ${newRep}`
        );
      }
    }

    // Update NPC state
    npcState.rep = newRep;
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Log reputation change for debugging (only in non-test environment)
    if (!this.isTestEnvironment) {
      console.log(
        `Reputation change for ${npcId}: ${amount} (${reason}) -> ${newRep}`
      );
    }

    // Persist immediately - reputation changes should be saved
    this.saveGame();
  }

  // ========================================================================
  // DIALOGUE STATE MANAGEMENT
  // ========================================================================

  /**
   * Set current dialogue state
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier
   */
  setDialogueState(npcId, nodeId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: setDialogueState called before game initialization'
      );
    }

    this.state.dialogue.currentNpcId = npcId;
    this.state.dialogue.currentNodeId = nodeId;
    this.state.dialogue.isActive = true;

    // Emit dialogue state change
    this.emit('dialogueChanged', { ...this.state.dialogue });
  }

  /**
   * Get current dialogue state
   *
   * @returns {Object} Current dialogue state
   */
  getDialogueState() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getDialogueState called before game initialization'
      );
    }

    return { ...this.state.dialogue };
  }

  /**
   * Clear dialogue state
   */
  clearDialogueState() {
    if (!this.state) {
      throw new Error(
        'Invalid state: clearDialogueState called before game initialization'
      );
    }

    this.state.dialogue.currentNpcId = null;
    this.state.dialogue.currentNodeId = null;
    this.state.dialogue.isActive = false;
    this.state.dialogue.display = null;

    // Emit dialogue state change
    this.emit('dialogueChanged', { ...this.state.dialogue });
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - TIP SYSTEM
  // ========================================================================

  /**
   * Check if NPC can provide a tip
   *
   * Validates that the NPC meets all requirements for providing a trading tip:
   * 1. Reputation tier is Warm or higher (rep >= WARM_MIN)
   * 2. NPC has a non-empty tips array
   * 3. Tip cooldown has passed (7 days since lastTipDay)
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, reason: string | null }
   */
  canGetTip(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: canGetTip called before game initialization'
      );
    }

    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check reputation tier >= Warm (rep >= WARM_MIN)
    const repTier = this.getRepTier(npcState.rep);
    if (npcState.rep < REPUTATION_BOUNDS.WARM_MIN) {
      return {
        available: false,
        reason: `Requires Warm relationship (currently ${repTier.name})`,
      };
    }

    // Check NPC has non-empty tips array
    if (!npcData.tips || npcData.tips.length === 0) {
      return {
        available: false,
        reason: 'NPC has no tips available',
      };
    }

    // Check tip cooldown (7 days since lastTipDay)
    if (npcState.lastTipDay !== null) {
      const daysSinceLastTip =
        this.state.player.daysElapsed - npcState.lastTipDay;
      if (daysSinceLastTip < NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS) {
        const daysRemaining =
          NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS - daysSinceLastTip;
        return {
          available: false,
          reason: `Tip cooldown active (${daysRemaining} days remaining)`,
        };
      }
    }

    return {
      available: true,
      reason: null,
    };
  }

  /**
   * Get a random tip from NPC's tip pool
   *
   * Returns null if canGetTip() returns false. Otherwise, selects a random tip
   * from the NPC's tips array and updates lastTipDay to current game day.
   *
   * @param {string} npcId - NPC identifier
   * @returns {string | null} Tip text or null if unavailable
   */
  getTip(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: getTip called before game initialization'
      );
    }

    // Check if tip is available
    const availability = this.canGetTip(npcId);
    if (!availability.available) {
      return null;
    }

    // Get NPC data and state (validation already done in canGetTip)
    const npcData = this._validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);

    // Select random tip from NPC's tips array
    const randomIndex = Math.floor(Math.random() * npcData.tips.length);
    const selectedTip = npcData.tips[randomIndex];

    // Update lastTipDay to current game day
    npcState.lastTipDay = this.state.player.daysElapsed;

    // Persist immediately - tip state should be saved
    this.saveGame();

    return selectedTip;
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - DISCOUNT SYSTEM
  // ========================================================================

  /**
   * Get service discount based on NPC relationship
   *
   * Checks if any NPC at the current system provides a discount for the specified
   * service type. Returns the discount percentage and source NPC name if available.
   * Only NPCs whose discountService matches the serviceType can provide discounts.
   *
   * @param {string} npcId - NPC identifier
   * @param {string} serviceType - Service type (e.g., 'repair', 'refuel', 'intel', 'docking', 'trade', 'debt', 'medical')
   * @returns {Object} { discount: number, npcName: string | null }
   */
  getServiceDiscount(npcId, serviceType) {
    if (!this.state) {
      throw new Error(
        'Invalid state: getServiceDiscount called before game initialization'
      );
    }

    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check if NPC's discountService matches serviceType
    if (!npcData.discountService || npcData.discountService !== serviceType) {
      return {
        discount: 0,
        npcName: null,
      };
    }

    // Get reputation tier
    const repTier = this.getRepTier(npcState.rep);

    // Get discount percentage based on tier
    const discountPercentage =
      NPC_BENEFITS_CONFIG.TIER_DISCOUNTS[repTier.name.toLowerCase()] || 0;

    return {
      discount: discountPercentage,
      npcName: discountPercentage > 0 ? npcData.name : null,
    };
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - FAVOR SYSTEM
  // ========================================================================

  /**
   * Check if NPC can grant a specific favor
   *
   * Validates that the NPC meets all requirements for granting a favor:
   * 1. NPC has been met (has state entry)
   * 2. Reputation tier meets requirement (Trusted for loan, Friendly for storage)
   * 3. Favor cooldown has passed (30 days since lastFavorDay)
   * 4. No outstanding loan for loan requests
   *
   * @param {string} npcId - NPC identifier
   * @param {string} favorType - 'loan' or 'storage'
   * @returns {Object} { available: boolean, reason: string, daysRemaining?: number }
   */
  canRequestFavor(npcId, favorType) {
    if (!this.state) {
      throw new Error(
        'Invalid state: canRequestFavor called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Check if NPC has been met (has state entry)
    if (!this.state.npcs[npcId]) {
      return {
        available: false,
        reason: 'NPC not met',
      };
    }

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Check reputation tier requirements
    if (favorType === 'loan') {
      // Loan requires Trusted tier (rep >= 60)
      if (npcState.rep < REPUTATION_BOUNDS.TRUSTED_MIN) {
        const repTier = this.getRepTier(npcState.rep);
        return {
          available: false,
          reason: `Requires Trusted relationship (currently ${repTier.name})`,
        };
      }
    } else if (favorType === 'storage') {
      // Storage requires Friendly tier (rep >= 30)
      if (npcState.rep < REPUTATION_BOUNDS.FRIENDLY_MIN) {
        const repTier = this.getRepTier(npcState.rep);
        return {
          available: false,
          reason: `Requires Friendly relationship (currently ${repTier.name})`,
        };
      }
    } else {
      return {
        available: false,
        reason: `Unknown favor type: ${favorType}`,
      };
    }

    // Check favor cooldown (30 days since lastFavorDay)
    if (npcState.lastFavorDay !== null) {
      const daysSinceLastFavor =
        this.state.player.daysElapsed - npcState.lastFavorDay;
      if (daysSinceLastFavor < NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS) {
        const daysRemaining =
          NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS - daysSinceLastFavor;
        return {
          available: false,
          reason: `Favor used recently (wait ${daysRemaining} days)`,
          daysRemaining: daysRemaining,
        };
      }
    }

    // Check no outstanding loan for loan requests
    if (favorType === 'loan' && npcState.loanAmount !== null) {
      return {
        available: false,
        reason: 'Outstanding loan must be repaid first',
      };
    }

    return {
      available: true,
      reason: '',
    };
  }

  /**
   * Request emergency loan from NPC
   *
   * Validates loan request with canRequestFavor, then grants 500 credits to player,
   * records loan details, increases NPC reputation by 5, and sets favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  requestLoan(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: requestLoan called before game initialization'
      );
    }

    // Validate with canRequestFavor
    const availability = this.canRequestFavor(npcId, 'loan');
    if (!availability.available) {
      return {
        success: false,
        message: availability.reason,
      };
    }

    // Get NPC state (validation already done in canRequestFavor)
    const npcState = this.getNPCState(npcId);

    // Add 500 credits to player
    this.updateCredits(
      this.state.player.credits + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Set loanAmount to 500, loanDay to current day
    npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
    npcState.loanDay = this.state.player.daysElapsed;

    // Increase NPC reputation by 5 (direct increase, no trust modifier for loan acceptance)
    npcState.rep = Math.max(
      -100,
      Math.min(
        100,
        npcState.rep + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS
      )
    );
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Log reputation change for debugging (only in non-test environment)
    if (!this.isTestEnvironment) {
      console.log(
        `Reputation change for ${npcId}: +${NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS} (emergency loan accepted) -> ${npcState.rep}`
      );
    }

    // Set lastFavorDay to current day
    npcState.lastFavorDay = this.state.player.daysElapsed;

    // Persist immediately - loan transaction modifies credits and NPC state
    this.saveGame();

    return {
      success: true,
      message: `Received ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} emergency loan`,
    };
  }

  /**
   * Repay outstanding loan to NPC
   *
   * Validates that player has sufficient credits and NPC has an outstanding loan,
   * then deducts 500 credits from player and clears the loan record.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  repayLoan(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: repayLoan called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Check if NPC has an outstanding loan
    if (npcState.loanAmount === null) {
      return {
        success: false,
        message: 'No outstanding loan',
      };
    }

    // Check player has sufficient credits
    if (this.state.player.credits < NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT) {
      return {
        success: false,
        message: 'Insufficient credits',
      };
    }

    // Deduct 500 credits from player
    this.updateCredits(
      this.state.player.credits - NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Clear loanAmount and loanDay
    npcState.loanAmount = null;
    npcState.loanDay = null;

    // Update interaction tracking
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Persist immediately - loan repayment modifies credits and NPC state
    this.saveGame();

    return {
      success: true,
      message: `Repaid ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} loan`,
    };
  }

  /**
   * Check for loan defaults and apply penalties
   *
   * Called automatically on day advance in updateTime(). For each NPC with an
   * outstanding loan where daysSinceLoan > 30, reduces reputation by one tier
   * (approximately 20-30 points depending on current tier) and clears the loan record.
   *
   * Requirements: 3.16, 3.17
   */
  checkLoanDefaults() {
    if (!this.state) {
      throw new Error(
        'Invalid state: checkLoanDefaults called before game initialization'
      );
    }

    const currentDay = this.state.player.daysElapsed;

    // Iterate through all NPCs with state
    for (const npcId in this.state.npcs) {
      const npcState = this.state.npcs[npcId];

      // Check if NPC has an outstanding loan
      if (npcState.loanAmount !== null && npcState.loanDay !== null) {
        const daysSinceLoan = currentDay - npcState.loanDay;

        // Check if loan is overdue (> 30 days)
        if (daysSinceLoan > NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE) {
          // Get current reputation tier
          const currentTier = this.getRepTier(npcState.rep);
          const oldRep = npcState.rep;

          // Calculate new reputation based on tier reduction
          let newReputation;

          // Reduce by one tier - set to maximum value of next lower tier
          if (currentTier.name === 'Family') {
            // Family (90-100) -> Trusted (60-89), set to Trusted max (89)
            newReputation = REPUTATION_BOUNDS.TRUSTED_MAX;
          } else if (currentTier.name === 'Trusted') {
            // Trusted (60-89) -> Friendly (30-59), set to Friendly max (59)
            newReputation = REPUTATION_BOUNDS.FRIENDLY_MAX;
          } else if (currentTier.name === 'Friendly') {
            // Friendly (30-59) -> Warm (10-29), set to Warm max (29)
            newReputation = REPUTATION_BOUNDS.WARM_MAX;
          } else if (currentTier.name === 'Warm') {
            // Warm (10-29) -> Neutral (-9-9), set to Neutral max (9)
            newReputation = REPUTATION_BOUNDS.NEUTRAL_MAX;
          } else if (currentTier.name === 'Neutral') {
            // Neutral (-9-9) -> Cold (-49--10), set to Cold max (-10)
            newReputation = REPUTATION_BOUNDS.COLD_MAX;
          } else if (currentTier.name === 'Cold') {
            // Cold (-49--10) -> Hostile (-100--50), set to Hostile max (-50)
            newReputation = REPUTATION_BOUNDS.HOSTILE_MAX;
          } else {
            // Already at Hostile tier, apply penalty but don't go below minimum
            newReputation = Math.max(
              oldRep - NPC_BENEFITS_CONFIG.LOAN_DEFAULT_TIER_PENALTY * 20,
              REPUTATION_BOUNDS.MIN
            );
          }

          // Apply reputation penalty with clamping
          npcState.rep = Math.max(
            REPUTATION_BOUNDS.MIN,
            Math.min(REPUTATION_BOUNDS.MAX, newReputation)
          );

          // Clear loan record
          npcState.loanAmount = null;
          npcState.loanDay = null;

          // Update interaction tracking
          npcState.lastInteraction = currentDay;
          npcState.interactions += 1;

          // Log reputation change for debugging (only in non-test environment)
          if (!this.isTestEnvironment) {
            console.log(
              `Loan default penalty for ${npcId}: ${oldRep} -> ${npcState.rep} (loan default, tier reduction)`
            );
          }
        }
      }
    }

    // Persist immediately if any defaults were processed
    this.saveGame();
  }

  /**
   * Store cargo with NPC
   *
   * Validates storage request with canRequestFavor, then removes up to 10 cargo units
   * from ship and adds them to NPC's storedCargo array. Sets favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, stored: number, message: string }
   */
  storeCargo(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: storeCargo called before game initialization'
      );
    }

    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: storeCargo requires a valid NPC identifier'
      );
    }

    // Validate with canRequestFavor
    const availability = this.canRequestFavor(npcId, 'storage');
    if (!availability.available) {
      return {
        success: false,
        stored: 0,
        message: availability.reason,
      };
    }

    // Get NPC state (validation already done in canRequestFavor)
    const npcState = this.getNPCState(npcId);

    // Get current ship cargo
    const currentShipCargo = [...this.state.ship.cargo];

    // Calculate total cargo units to store (up to limit)
    const totalCargoUnits = currentShipCargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );
    const unitsToStore = Math.min(
      totalCargoUnits,
      NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT
    );

    if (unitsToStore === 0) {
      return {
        success: false,
        stored: 0,
        message: 'No cargo to store',
      };
    }

    // Initialize storedCargo if it doesn't exist
    if (!npcState.storedCargo) {
      npcState.storedCargo = [];
    }

    // Remove cargo from ship and add to NPC storage
    let remainingToStore = unitsToStore;
    const newShipCargo = [];
    const cargoToAdd = [];

    for (const stack of currentShipCargo) {
      if (remainingToStore <= 0) {
        // No more to store, keep remaining cargo on ship
        newShipCargo.push(stack);
      } else if (stack.qty <= remainingToStore) {
        // Store entire stack
        cargoToAdd.push({ ...stack });
        remainingToStore -= stack.qty;
      } else {
        // Partial stack - store some, keep rest on ship
        const storeQty = remainingToStore;
        const keepQty = stack.qty - storeQty;

        cargoToAdd.push({
          ...stack,
          qty: storeQty,
        });

        newShipCargo.push({
          ...stack,
          qty: keepQty,
        });

        remainingToStore = 0;
      }
    }

    // Add stored cargo to NPC's storedCargo array
    npcState.storedCargo.push(...cargoToAdd);

    // Update ship cargo
    this.updateCargo(newShipCargo);

    // Set lastFavorDay to current day
    npcState.lastFavorDay = this.state.player.daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Persist immediately - cargo storage modifies ship cargo and NPC state
    this.saveGame();

    return {
      success: true,
      stored: unitsToStore,
      message: `Stored ${unitsToStore} cargo units with ${this._validateAndGetNPCData(npcId).name}`,
    };
  }

  /**
   * Retrieve stored cargo from NPC
   *
   * Calculates available ship capacity and transfers min(storedCargo, availableCapacity)
   * to ship. Leaves remainder in NPC storage if ship capacity is insufficient.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, retrieved: CargoStack[], remaining: CargoStack[] }
   */
  retrieveCargo(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: retrieveCargo called before game initialization'
      );
    }

    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: retrieveCargo requires a valid NPC identifier'
      );
    }

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Initialize storedCargo if it doesn't exist
    if (!npcState.storedCargo) {
      npcState.storedCargo = [];
    }

    // If no stored cargo, return empty result
    if (npcState.storedCargo.length === 0) {
      return {
        success: true,
        retrieved: [],
        remaining: [],
      };
    }

    // Calculate available ship capacity
    const availableCapacity = this.getCargoRemaining();

    // Calculate total stored cargo units
    const totalStoredUnits = npcState.storedCargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );

    // Determine how much to transfer
    const unitsToTransfer = Math.min(totalStoredUnits, availableCapacity);

    if (unitsToTransfer === 0) {
      // No capacity available, return current stored cargo as remaining
      return {
        success: true,
        retrieved: [],
        remaining: [...npcState.storedCargo],
      };
    }

    // Transfer cargo from NPC storage to ship
    let remainingToTransfer = unitsToTransfer;
    const currentShipCargo = [...this.state.ship.cargo];
    const retrievedCargo = [];
    const remainingStoredCargo = [];

    for (const stack of npcState.storedCargo) {
      if (remainingToTransfer <= 0) {
        // No more to transfer, keep remaining in storage
        remainingStoredCargo.push(stack);
      } else if (stack.qty <= remainingToTransfer) {
        // Transfer entire stack
        retrievedCargo.push({ ...stack });
        remainingToTransfer -= stack.qty;
      } else {
        // Partial stack - transfer some, keep rest in storage
        const transferQty = remainingToTransfer;
        const keepQty = stack.qty - transferQty;

        retrievedCargo.push({
          ...stack,
          qty: transferQty,
        });

        remainingStoredCargo.push({
          ...stack,
          qty: keepQty,
        });

        remainingToTransfer = 0;
      }
    }

    // Add retrieved cargo to ship using the same stacking logic as storeCargo
    for (const stack of retrievedCargo) {
      this.shipManager._addToCargoArray(currentShipCargo, stack, stack.qty);
    }

    // Update ship cargo
    this.updateCargo(currentShipCargo);

    // Update NPC's stored cargo
    npcState.storedCargo = remainingStoredCargo;

    // Update interaction tracking
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Persist immediately - cargo retrieval modifies ship cargo and NPC state
    this.saveGame();

    return {
      success: true,
      retrieved: retrievedCargo,
      remaining: remainingStoredCargo,
    };
  }

  // ========================================================================
  // DIALOGUE ACTIONS
  // ========================================================================

  /**
   * Start dialogue with an NPC
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier (defaults to 'greeting')
   * @returns {Object} Dialogue display object with text, choices, and NPC info
   */
  async startDialogue(npcId, nodeId = 'greeting') {
    if (!this.state) {
      throw new Error(
        'Invalid state: startDialogue called before game initialization'
      );
    }

    // Import dialogue functions dynamically to avoid circular dependency
    const { showDialogue } = await import('../game-dialogue.js');

    const dialogueDisplay = showDialogue(npcId, nodeId, this);

    // Update dialogue state with display
    this.state.dialogue.currentNpcId = npcId;
    this.state.dialogue.currentNodeId = nodeId;
    this.state.dialogue.isActive = true;
    this.state.dialogue.display = dialogueDisplay;

    // Emit dialogue state change
    this.emit('dialogueChanged', { ...this.state.dialogue });

    return dialogueDisplay;
  }

  /**
   * Select a dialogue choice and advance conversation
   *
   * @param {string} npcId - NPC identifier
   * @param {number} choiceIndex - Index of selected choice
   * @returns {Object|null} Next dialogue display object or null if dialogue ended
   */
  async selectDialogueChoice(npcId, choiceIndex) {
    if (!this.state) {
      throw new Error(
        'Invalid state: selectDialogueChoice called before game initialization'
      );
    }

    // Import dialogue functions dynamically to avoid circular dependency
    const { selectChoice } = await import('../game-dialogue.js');

    const nextDisplay = selectChoice(npcId, choiceIndex, this);

    if (nextDisplay) {
      // Continue dialogue - update state with new display
      this.state.dialogue.currentNpcId = npcId;
      this.state.dialogue.currentNodeId =
        nextDisplay.currentNodeId || this.state.dialogue.currentNodeId;
      this.state.dialogue.isActive = true;
      this.state.dialogue.display = nextDisplay;

      // Emit dialogue state change
      this.emit('dialogueChanged', { ...this.state.dialogue });

      return nextDisplay;
    } else {
      // Dialogue ended - clear state
      this.state.dialogue.currentNpcId = null;
      this.state.dialogue.currentNodeId = null;
      this.state.dialogue.isActive = false;
      this.state.dialogue.display = null;

      // Emit dialogue state change
      this.emit('dialogueChanged', { ...this.state.dialogue });

      return null;
    }
  }

  // ========================================================================
  // TRADING OPERATIONS
  // ========================================================================

  /**
   * Execute a purchase transaction
   */
  buyGood(goodType, quantity, price) {
    return this.tradingManager.buyGood(goodType, quantity, price);
  }

  /**
   * Execute a sale transaction from a specific cargo stack
   */
  sellGood(stackIndex, quantity, salePrice) {
    return this.tradingManager.sellGood(stackIndex, quantity, salePrice);
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

    // CRITICAL: Defensive programming - refuel must NEVER reduce fuel
    // Clamp fuel to max capacity to handle floating point rounding
    // (validation allows slight overage with epsilon, but actual fuel must not exceed max)
    const maxFuel = this.getFuelCapacity();
    const newFuel = Math.min(currentFuel + amount, maxFuel);
    
    // SAFETY CHECK: Ensure refuel never reduces fuel
    if (newFuel < currentFuel) {
      throw new Error(
        `CRITICAL BUG: Refuel would reduce fuel from ${currentFuel}% to ${newFuel}%. ` +
        `Amount: ${amount}, MaxFuel: ${maxFuel}. This should never happen.`
      );
    }
    
    this.updateFuel(newFuel);

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
    return this.shipManager.validateUpgradePurchase(upgradeId);
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
    return this.shipManager.purchaseUpgrade(upgradeId);
  }

  /**
   * Calculate ship capabilities based on installed upgrades
   *
   * @returns {Object} Ship capabilities with all upgrades applied
   */
  calculateShipCapabilities() {
    return this.shipManager.calculateShipCapabilities();
  }

  // ========================================================================
  // HIDDEN CARGO SYSTEM
  // ========================================================================



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
    return this.shipManager.moveToHiddenCargo(good, qty);
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
    return this.shipManager.moveToRegularCargo(good, qty);
  }

  // ========================================================================
  // DOCK/UNDOCK OPERATIONS
  // ========================================================================

  /**
   * Record visited prices for current system
   *
   * Called when Trade panel opens to update price knowledge with current,
   * accurate prices. This overwrites any existing information broker data
   * with "Visited" source data at the current day.
   *
   * The data ages naturally as time passes (lastVisit increments), so when
   * viewing this system later from another location, it will show how old
   * the visited data is.
   */
  recordVisitedPrices() {
    return this.tradingManager.recordVisitedPrices();
  }

  /**
   * Dock at current system's station to access trading and refueling
   * Delegates to NavigationManager
   *
   * @returns {Object} { success: boolean }
   */
  dock() {
    return this.navigationManager.dock();
  }

  /**
   * Undock from current system's station to resume navigation
   * Delegates to NavigationManager
   *
   * @returns {Object} { success: boolean }
   */
  undock() {
    return this.navigationManager.undock();
  }

  // ========================================================================
  // SAVE/LOAD SYSTEM
  // ========================================================================

  /**
   * Save game state to localStorage with debouncing
   *
   * Implements save debouncing to prevent excessive saves (max 1 save per second).
   * This protects against rapid state changes causing performance issues.
   *
   * Handles save failures gracefully by logging errors and notifying the user.
   */
  saveGame() {
    const result = saveGameToStorage(
      this.state,
      this.lastSaveTime,
      this.isTestEnvironment
    );

    if (result.success) {
      this.lastSaveTime = result.newLastSaveTime;
    } else {
      // Only show error notification if save actually failed (not just debounced)
      const now = Date.now();
      const timeSinceLastSave = now - this.lastSaveTime;

      if (timeSinceLastSave >= 1000) {
        // Not debounced, actual failure
        if (!this.isTestEnvironment) {
          console.error('Save failed - game progress may be lost');
        }
        // TODO: Show user notification about save failure
        // For now, just log the error - UI notification system would be added later
      }
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

      // Migrate from v1.0.0 to v4.0.0 if needed
      if (loadedState.meta?.version === '1.0.0' && GAME_VERSION === '4.0.0') {
        loadedState = migrateFromV1ToV2(
          loadedState,
          this.starData,
          this.isTestEnvironment
        );
      }

      // Migrate from v2.0.0 to v4.0.0 if needed
      if (loadedState.meta?.version === '2.0.0' && GAME_VERSION === '4.0.0') {
        loadedState = migrateFromV2ToV2_1(loadedState, this.isTestEnvironment);
      }

      // Migrate from v2.1.0 to v4.0.0 if needed
      if (loadedState.meta?.version === '2.1.0' && GAME_VERSION === '4.0.0') {
        loadedState = migrateFromV2_1ToV4(loadedState, this.isTestEnvironment);
      }

      // Validate state structure
      if (!validateStateStructure(loadedState)) {
        if (!this.isTestEnvironment) {
          console.log('Save data corrupted, starting new game');
        }
        return null;
      }

      // Add defaults for missing fields
      loadedState = addStateDefaults(
        loadedState,
        this.starData,
        this.isTestEnvironment
      );

      this.state = loadedState;

      // Update manager state references
      this.npcManager.state = this.state;

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

        // If NPC data is corrupted, try to recover by initializing empty NPC state
        if (error.message && error.message.includes('NPC')) {
          console.log(
            'NPC data corrupted, continuing with fresh NPC relationships'
          );
          try {
            // Try to load again with NPC data reset
            let recoveredState = loadGameFromStorage(this.isTestEnvironment);
            if (recoveredState && recoveredState.npcs) {
              recoveredState.npcs = {};
              if (recoveredState.dialogue) {
                recoveredState.dialogue = {
                  currentNpcId: null,
                  currentNodeId: null,
                  isActive: false,
                  display: null,
                };
              }

              // Validate and set recovered state
              if (validateStateStructure(recoveredState)) {
                recoveredState = addStateDefaults(
                  recoveredState,
                  this.starData,
                  this.isTestEnvironment
                );
                this.state = recoveredState;

                // Update manager state references
                this.npcManager.state = this.state;

                // Emit all state events
                this.emit('creditsChanged', this.state.player.credits);
                this.emit('debtChanged', this.state.player.debt);
                this.emit('fuelChanged', this.state.ship.fuel);
                this.emit('cargoChanged', this.state.ship.cargo);
                this.emit('locationChanged', this.state.player.currentSystem);
                this.emit('timeChanged', this.state.player.daysElapsed);
                this.emit(
                  'priceKnowledgeChanged',
                  this.state.world.priceKnowledge
                );
                this.emit('activeEventsChanged', this.state.world.activeEvents);
                this.emit('shipConditionChanged', {
                  hull: this.state.ship.hull,
                  engine: this.state.ship.engine,
                  lifeSupport: this.state.ship.lifeSupport,
                });
                this.emit('upgradesChanged', this.state.ship.upgrades);
                this.emit('quirksChanged', this.state.ship.quirks);

                return this.state;
              }
            }
          } catch {
            console.log('Recovery failed, starting new game');
          }
        }
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

  // ========================================================================
  // NPC BENEFITS SYSTEM - FREE REPAIR SYSTEM
  // ========================================================================

  /**
   * Check if NPC can provide free repair
   *
   * Checks if the NPC's reputation tier is Trusted or Family and if the
   * once-per-visit limitation is satisfied (lastFreeRepairDay is not current day).
   * Returns availability status and tier-based repair limits.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    if (!this.state) {
      throw new Error(
        'Invalid state: canGetFreeRepair called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check reputation tier is Trusted or Family
    const repTier = this.getRepTier(npcState.rep);
    const isTrusted = npcState.rep >= REPUTATION_BOUNDS.TRUSTED_MIN && npcState.rep <= REPUTATION_BOUNDS.TRUSTED_MAX;
    const isFamily = npcState.rep >= REPUTATION_BOUNDS.FAMILY_MIN;

    if (!isTrusted && !isFamily) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: `Requires Trusted relationship (currently ${repTier.name})`,
      };
    }

    // Check once-per-visit limitation (lastFreeRepairDay is not current day)
    const currentDay = this.state.player.daysElapsed;
    if (npcState.lastFreeRepairDay !== null && npcState.lastFreeRepairDay === currentDay) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: 'Free repair already used once per visit',
      };
    }

    // Determine max hull percent based on tier
    let maxHullPercent;
    if (isFamily) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;
    } else if (isTrusted) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;
    }

    return {
      available: true,
      maxHullPercent: maxHullPercent,
      reason: null,
    };
  }

  /**
   * Apply free repair from NPC
   *
   * Validates free repair availability, then repairs up to the tier-appropriate
   * hull damage limit. Sets lastFreeRepairDay to current day to enforce
   * once-per-visit limitation.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  applyFreeRepair(npcId, hullDamagePercent) {
    if (!this.state) {
      throw new Error(
        'Invalid state: applyFreeRepair called before game initialization'
      );
    }

    // Validate with canGetFreeRepair
    const availability = this.canGetFreeRepair(npcId);
    if (!availability.available) {
      return {
        success: false,
        repairedPercent: 0,
        message: availability.reason,
      };
    }

    // Validate hull damage parameter
    if (typeof hullDamagePercent !== 'number' || hullDamagePercent < 0 || hullDamagePercent > 100) {
      return {
        success: false,
        repairedPercent: 0,
        message: 'Invalid hull damage percentage',
      };
    }

    // Calculate repair amount (up to maxHullPercent of hull damage)
    const maxRepairPercent = availability.maxHullPercent;
    const actualRepairPercent = Math.min(hullDamagePercent, maxRepairPercent);

    // Apply repair to ship hull
    const currentHull = this.state.ship.hull;
    const newHull = Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, currentHull + actualRepairPercent);
    
    // Update ship condition
    this.updateShipCondition(newHull, this.state.ship.engine, this.state.ship.lifeSupport);

    // Get NPC state and set lastFreeRepairDay to current day
    const npcState = this.getNPCState(npcId);
    npcState.lastFreeRepairDay = this.state.player.daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = this.state.player.daysElapsed;
    npcState.interactions += 1;

    // Persist immediately - free repair modifies ship condition and NPC state
    this.saveGame();

    return {
      success: true,
      repairedPercent: actualRepairPercent,
      message: `Repaired ${actualRepairPercent}% hull damage`,
    };
  }
}
