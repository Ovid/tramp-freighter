import { SHIP_CONFIG } from '../constants.js';
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
import { StateManager } from './managers/state.js';
import { InitializationManager } from './managers/initialization.js';
import { SaveLoadManager } from './managers/save-load.js';

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

    // Animation system reference (set by StarMapCanvas after scene initialization)
    // Used by useAnimationLock hook to check animation state
    this.animationSystem = null;

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Initialize managers
    this.eventSystemManager = new EventSystemManager(this);
    this.stateManager = new StateManager(this);
    this.initializationManager = new InitializationManager(this);
    this.saveLoadManager = new SaveLoadManager(this);
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
   * Uses InitializationManager for state creation but maintains control over state assignment
   *
   * @returns {Object} Complete initial game state
   */
  initNewGame() {
    // Create initial state using InitializationManager
    const completeState = this.initializationManager.createInitialState();

    // GameStateManager maintains control over its own state
    this.state = completeState;

    if (!this.isTestEnvironment) {
      console.log('New game initialized:', completeState);
    }

    // Emit all initial state events for UI synchronization
    this.initializationManager.emitInitialEvents(completeState);

    return completeState;
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

  /**
   * Get complete game state
   * Delegates to StateManager
   * @returns {Object} Current game state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Get player state
   * Delegates to StateManager
   * @returns {Object} Player state object
   */
  getPlayer() {
    return this.stateManager.getPlayer();
  }

  /**
   * Get ship state
   * Delegates to StateManager
   * @returns {Object} Ship state object
   */
  getShip() {
    return this.stateManager.getShip();
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

  /**
   * Calculate total cargo space used
   * Delegates to StateManager
   * @returns {number} Total cargo units used
   */
  getCargoUsed() {
    return this.stateManager.getCargoUsed();
  }

  /**
   * Calculate remaining cargo space
   * Delegates to StateManager
   * @returns {number} Available cargo units
   */
  getCargoRemaining() {
    return this.stateManager.getCargoRemaining();
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

  /**
   * Update player credits
   * Delegates to StateManager
   * @param {number} newCredits - New credit amount
   */
  updateCredits(newCredits) {
    return this.stateManager.updateCredits(newCredits);
  }

  /**
   * Update player debt
   * Delegates to StateManager
   * @param {number} newDebt - New debt amount
   */
  updateDebt(newDebt) {
    return this.stateManager.updateDebt(newDebt);
  }

  /**
   * Update ship fuel with validation
   * Delegates to StateManager
   * @param {number} newFuel - New fuel percentage
   */
  updateFuel(newFuel) {
    return this.stateManager.updateFuel(newFuel);
  }

  /**
   * Update ship cargo
   * Delegates to StateManager
   * @param {Array} newCargo - New cargo array
   */
  updateCargo(newCargo) {
    return this.stateManager.updateCargo(newCargo);
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
   * Delegates to StateManager
   * @param {number} amount - New credit amount
   */
  setCredits(amount) {
    return this.stateManager.setCredits(amount);
  }

  /**
   * Set debt directly (dev mode only)
   * Delegates to StateManager
   * @param {number} amount - New debt amount
   */
  setDebt(amount) {
    return this.stateManager.setDebt(amount);
  }

  /**
   * Set fuel directly (dev mode only)
   * Delegates to StateManager
   * @param {number} amount - New fuel percentage (0-100)
   */
  setFuel(amount) {
    return this.stateManager.setFuel(amount);
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
   * Delegates to NPCManager
   *
   * @param {number} rep - Reputation value (-100 to 100)
   * @returns {Object} Tier object with name, min, max properties
   */
  getRepTier(rep) {
    return this.npcManager.getRepTier(rep);
  }

  /**
   * Get or initialize NPC state
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC state object
   */
  getNPCState(npcId) {
    return this.npcManager.getNPCState(npcId);
  }

  /**
   * Modify NPC reputation with trust modifier and quirk support
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @param {number} amount - Base reputation change amount
   * @param {string} reason - Reason for reputation change (for logging)
   */
  modifyRep(npcId, amount, reason) {
    this.npcManager.modifyRep(npcId, amount, reason);

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
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, reason: string | null }
   */
  canGetTip(npcId) {
    return this.npcManager.canGetTip(npcId);
  }

  /**
   * Get a random tip from NPC's tip pool
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {string | null} Tip text or null if unavailable
   */
  getTip(npcId) {
    const result = this.npcManager.getTip(npcId);

    if (result) {
      // Persist immediately - tip state should be saved
      this.saveGame();
    }

    return result;
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - DISCOUNT SYSTEM
  // ========================================================================

  /**
   * Get service discount based on NPC relationship
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @param {string} serviceType - Service type (e.g., 'repair', 'refuel', 'intel', 'docking', 'trade', 'debt', 'medical')
   * @returns {Object} { discount: number, npcName: string | null }
   */
  getServiceDiscount(npcId, serviceType) {
    return this.npcManager.getServiceDiscount(npcId, serviceType);
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - FAVOR SYSTEM
  // ========================================================================

  /**
   * Check if NPC can grant a specific favor
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @param {string} favorType - 'loan' or 'storage'
   * @returns {Object} { available: boolean, reason: string, daysRemaining?: number }
   */
  canRequestFavor(npcId, favorType) {
    return this.npcManager.canRequestFavor(npcId, favorType);
  }

  /**
   * Request emergency loan from NPC
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  requestLoan(npcId) {
    const result = this.npcManager.requestLoan(npcId);

    if (result.success) {
      // Persist immediately - loan transaction modifies credits and NPC state
      this.saveGame();
    }

    return result;
  }

  /**
   * Repay outstanding loan to NPC
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  repayLoan(npcId) {
    const result = this.npcManager.repayLoan(npcId);

    if (result.success) {
      // Persist immediately - loan repayment modifies credits and NPC state
      this.saveGame();
    }

    return result;
  }

  /**
   * Check for loan defaults and apply penalties
   * Delegates to NPCManager
   *
   * Called automatically on day advance in updateTime().
   */
  checkLoanDefaults() {
    this.npcManager.checkLoanDefaults();

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
   * Delegates to SaveLoadManager
   *
   * @returns {boolean} True if save succeeded or was debounced, false if failed
   */
  saveGame() {
    return this.saveLoadManager.saveGame();
  }

  /**
   * Load game state from localStorage
   * Delegates to SaveLoadManager
   *
   * @returns {Object|null} Loaded and validated game state, or null if load failed
   */
  loadGame() {
    return this.saveLoadManager.loadGame();
  }

  /**
   * Check if saved game exists
   * Delegates to SaveLoadManager
   *
   * @returns {boolean} True if save data exists in localStorage
   */
  hasSavedGame() {
    return this.saveLoadManager.hasSavedGame();
  }

  /**
   * Clear saved game from localStorage
   * Delegates to SaveLoadManager
   *
   * @returns {boolean} True if clear succeeded
   */
  clearSave() {
    return this.saveLoadManager.clearSave();
  }

  /**
   * Get last save time for debouncing (for testing purposes)
   * Delegates to SaveLoadManager
   *
   * @returns {number} Timestamp of last save
   */
  get lastSaveTime() {
    return this.saveLoadManager.getLastSaveTime();
  }

  /**
   * Set last save time (for testing purposes)
   * Delegates to SaveLoadManager
   *
   * @param {number} timestamp - New last save time
   */
  set lastSaveTime(timestamp) {
    this.saveLoadManager.setLastSaveTime(timestamp);
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - FREE REPAIR SYSTEM
  // ========================================================================

  /**
   * Check if NPC can provide free repair
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    return this.npcManager.canGetFreeRepair(npcId);
  }

  /**
   * Apply free repair from NPC
   * Delegates to NPCManager
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  getFreeRepair(npcId, hullDamagePercent) {
    return this.npcManager.getFreeRepair(npcId, hullDamagePercent);
  }
}
