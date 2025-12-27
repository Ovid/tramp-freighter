import {
  COMMODITY_TYPES,
  SHIP_CONFIG,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  NEW_GAME_DEFAULTS,
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../constants.js';
import { SeededRandom } from '../utils/seeded-random.js';
import { TradingSystem } from '../game-trading.js';
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
import { TradingManager } from './managers/trading.js';
import { ShipManager } from './managers/ship.js';
import { NPCManager } from './managers/npc.js';
import { NavigationManager } from './managers/navigation.js';
import { RefuelManager } from './managers/refuel.js';
import { RepairManager } from './managers/repair.js';
import { DialogueManager } from './managers/dialogue.js';
import { EventsManager } from './managers/events.js';
import { InfoBrokerManager } from './managers/info-broker.js';
import { EventSystemManager } from './managers/event-system.js';

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

    // Track last save time for debouncing
    this.lastSaveTime = 0;

    // Animation system reference (set by StarMapCanvas after scene initialization)
    // Used by useAnimationLock hook to check animation state
    this.animationSystem = null;

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Initialize managers
    this.eventSystemManager = new EventSystemManager(this);
    this.tradingManager = new TradingManager(this);
    this.shipManager = new ShipManager(this);
    this.npcManager = new NPCManager(this);
    this.navigationManager = new NavigationManager(this, this.starData);
    this.refuelManager = new RefuelManager(this);
    this.repairManager = new RepairManager(this);
    this.dialogueManager = new DialogueManager(this);
    this.eventsManager = new EventsManager(this);
    this.infoBrokerManager = new InfoBrokerManager(this);
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
    this.emit('cargoCapacityChanged', this.state.ship.cargoCapacity);
    this.emit('quirksChanged', this.state.ship.quirks);

    return this.state;
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  /**
   * Subscribe to state change events for Bridge Pattern integration
   * Delegates to EventSystemManager
   *
   * @param {string} eventType - Event type to subscribe to
   * @param {function} callback - Function to call when event occurs
   */
  subscribe(eventType, callback) {
    return this.eventSystemManager.subscribe(eventType, callback);
  }

  /**
   * Unsubscribe from state change events
   * Delegates to EventSystemManager
   *
   * @param {string} eventType - Event type to unsubscribe from
   * @param {function} callback - Callback function to remove
   */
  unsubscribe(eventType, callback) {
    return this.eventSystemManager.unsubscribe(eventType, callback);
  }

  /**
   * Emit event to all registered subscribers
   * Delegates to EventSystemManager
   *
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data to pass to subscribers
   */
  emit(eventType, data) {
    return this.eventSystemManager.emit(eventType, data);
  }

  /**
   * Get subscribers object for testing purposes
   * Delegates to EventSystemManager
   *
   * @returns {Object} The subscribers object
   */
  get subscribers() {
    return this.eventSystemManager.getSubscribers();
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
    return this.eventsManager.updateTime(newDays);
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
    return this.tradingManager.updateMarketConditions(
      systemId,
      goodType,
      quantityDelta
    );
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
    return this.tradingManager.updatePriceKnowledge(
      systemId,
      prices,
      lastVisit,
      source
    );
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
    return this.eventsManager.getActiveEvents();
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    return this.eventsManager.updateActiveEvents(newEvents);
  }

  /**
   * Get active event for a specific system
   *
   * @param {number} systemId - System identifier
   * @returns {Object|null} Active event or null
   */
  getActiveEventForSystem(systemId) {
    return this.eventsManager.getActiveEventForSystem(systemId);
  }

  /**
   * Get event type definition by event type key
   * @param {string} eventTypeKey - Event type identifier
   * @returns {Object|null} Event type definition or null
   */
  getEventType(eventTypeKey) {
    return this.eventsManager.getEventType(eventTypeKey);
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
    return this.infoBrokerManager.getIntelligenceCost(systemId);
  }

  /**
   * Purchase market intelligence for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseIntelligence(systemId) {
    return this.infoBrokerManager.purchaseIntelligence(systemId);
  }

  /**
   * Generate a market rumor
   *
   * @returns {string} Rumor text
   */
  generateRumor() {
    return this.infoBrokerManager.generateRumor();
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
    return this.infoBrokerManager.listAvailableIntelligence();
  }

  // ========================================================================
  // NPC REPUTATION SYSTEM
  // ========================================================================

  /**
   * Validate NPC ID and return NPC data
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC data object
   * @throws {Error} If NPC ID is not found
   * @private
   */
  _validateAndGetNPCData(npcId) {
    return this.npcManager.validateAndGetNPCData(npcId);
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
   * Delegates to DialogueManager
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier
   */
  setDialogueState(npcId, nodeId) {
    return this.dialogueManager.setDialogueState(npcId, nodeId);
  }

  /**
   * Get current dialogue state
   * Delegates to DialogueManager
   *
   * @returns {Object} Current dialogue state
   */
  getDialogueState() {
    return this.dialogueManager.getDialogueState();
  }

  /**
   * Clear dialogue state
   * Delegates to DialogueManager
   */
  clearDialogueState() {
    return this.dialogueManager.clearDialogueState();
  }

  /**
   * Start dialogue with an NPC
   * Delegates to DialogueManager
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier (defaults to 'greeting')
   * @returns {Promise<Object>} Dialogue display object with text, choices, and NPC info
   */
  async startDialogue(npcId, nodeId = 'greeting') {
    return await this.dialogueManager.startDialogue(npcId, nodeId);
  }

  /**
   * Select a dialogue choice and advance conversation
   * Delegates to DialogueManager
   *
   * @param {string} npcId - NPC identifier
   * @param {number} choiceIndex - Index of selected choice
   * @returns {Promise<Object|null>} Next dialogue display object or null if dialogue ended
   */
  async selectDialogueChoice(npcId, choiceIndex) {
    return await this.dialogueManager.selectDialogueChoice(npcId, choiceIndex);
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

    // Select random tip from NPC's tips array using deterministic RNG
    // Use game day + npcId as seed for consistent but varied tip selection
    const tipSeed = `tip-${npcId}-${this.state.player.daysElapsed}`;
    const rng = new SeededRandom(tipSeed);
    const randomIndex = rng.nextInt(0, npcData.tips.length - 1);
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
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, stored: number, message: string }
   */
  storeCargo(npcId) {
    const result = this.npcManager.storeCargo(npcId);

    if (result.success) {
      // Persist immediately - cargo storage modifies ship cargo and NPC state
      this.saveGame();
    }

    return result;
  }

  /**
   * Retrieve stored cargo from NPC
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, retrieved: CargoStack[], remaining: CargoStack[] }
   */
  retrieveCargo(npcId) {
    const result = this.npcManager.retrieveCargo(npcId);

    if (result.success && result.retrieved.length > 0) {
      // Persist immediately - cargo retrieval modifies ship cargo and NPC state
      this.saveGame();
    }

    return result;
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
   * Delegates to RefuelManager
   *
   * @param {number} systemId - System ID to check
   * @returns {number} Fuel price per percentage point
   */
  getFuelPrice(systemId) {
    return this.refuelManager.getFuelPrice(systemId);
  }

  /**
   * Validate refuel transaction
   * Delegates to RefuelManager
   *
   * @param {number} currentFuel - Current fuel percentage
   * @param {number} amount - Amount to refuel (percentage points)
   * @param {number} credits - Player's current credits
   * @param {number} pricePerPercent - Fuel price per percentage point
   * @returns {Object} { valid: boolean, reason: string, cost: number }
   */
  validateRefuel(currentFuel, amount, credits, pricePerPercent) {
    return this.refuelManager.validateRefuel(
      currentFuel,
      amount,
      credits,
      pricePerPercent
    );
  }

  /**
   * Execute refuel transaction
   * Delegates to RefuelManager
   *
   * @param {number} amount - Amount to refuel (percentage points)
   * @returns {Object} { success: boolean, reason: string }
   */
  refuel(amount) {
    return this.refuelManager.refuel(amount);
  }

  // ========================================================================
  // SHIP REPAIR SYSTEM
  // ========================================================================

  /**
   * Calculate repair cost for a ship system
   * Delegates to RepairManager
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} currentCondition - Current condition percentage
   * @returns {number} Cost in credits
   */
  getRepairCost(systemType, amount, currentCondition) {
    return this.repairManager.getRepairCost(
      systemType,
      amount,
      currentCondition
    );
  }

  /**
   * Execute repair transaction for a ship system
   * Delegates to RepairManager
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @returns {Object} { success: boolean, reason: string }
   */
  repairShipSystem(systemType, amount) {
    return this.repairManager.repairShipSystem(systemType, amount);
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
      this.emit('cargoCapacityChanged', this.state.ship.cargoCapacity);
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
                this.emit(
                  'cargoCapacityChanged',
                  this.state.ship.cargoCapacity
                );
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
   * Delegates to RepairManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    return this.repairManager.canGetFreeRepair(npcId);
  }

  /**
   * Apply free repair from NPC
   * Delegates to RepairManager
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  applyFreeRepair(npcId, hullDamagePercent) {
    return this.repairManager.applyFreeRepair(npcId, hullDamagePercent);
  }
}
