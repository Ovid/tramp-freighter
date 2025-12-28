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
import { DangerManager } from './managers/danger.js';

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
    .substring(0, SHIP_CONFIG.MAX_NAME_LENGTH)
    .trim();

  return sanitized || SHIP_CONFIG.DEFAULT_NAME;
}

/**
 * GameStateManager - Manages all game state with event-driven reactivity
 *
 * This class uses a delegation pattern with focused managers for different game domains.
 * Most methods delegate to specialized managers (TradingManager, ShipManager, etc.) to
 * maintain separation of concerns while providing a unified API.
 *
 * DOCUMENTATION: Method documentation is maintained in the individual manager classes
 * to avoid duplication. See the respective manager files for detailed parameter and
 * return value documentation.
 *
 * Responsibilities:
 * - Initialize new game with default values
 * - Maintain single source of truth for game state
 * - Provide unified API through delegation to specialized managers
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
    this.dangerManager = new DangerManager(this);
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

  assignShipQuirks(rng = Math.random) {
    return this.shipManager.assignShipQuirks(rng);
  }

  applyQuirkModifiers(baseValue, attribute, quirks) {
    return this.shipManager.applyQuirkModifiers(baseValue, attribute, quirks);
  }

  getQuirkDefinition(quirkId) {
    return this.shipManager.getQuirkDefinition(quirkId);
  }

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

  subscribe(eventType, callback) {
    return this.eventSystemManager.subscribe(eventType, callback);
  }

  unsubscribe(eventType, callback) {
    return this.eventSystemManager.unsubscribe(eventType, callback);
  }

  emit(eventType, data) {
    return this.eventSystemManager.emit(eventType, data);
  }

  get subscribers() {
    return this.eventSystemManager.getSubscribers();
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  getState() {
    return this.stateManager.getState();
  }

  getPlayer() {
    return this.stateManager.getPlayer();
  }

  getShip() {
    return this.stateManager.getShip();
  }

  getCurrentSystem() {
    return this.navigationManager.getCurrentSystem();
  }

  getCargoUsed() {
    return this.stateManager.getCargoUsed();
  }

  getCargoRemaining() {
    return this.stateManager.getCargoRemaining();
  }

  getFuelCapacity() {
    return this.shipManager.getFuelCapacity();
  }

  isSystemVisited(systemId) {
    return this.navigationManager.isSystemVisited(systemId);
  }

  getShipCondition() {
    return this.shipManager.getShipCondition();
  }

  checkConditionWarnings() {
    return this.shipManager.checkConditionWarnings();
  }

  getPriceKnowledge() {
    return this.tradingManager.getPriceKnowledge();
  }

  getCurrentSystemPrices() {
    return this.tradingManager.getCurrentSystemPrices();
  }

  getKnownPrices(systemId) {
    return this.tradingManager.getKnownPrices(systemId);
  }

  hasVisitedSystem(systemId) {
    return this.tradingManager.hasVisitedSystem(systemId);
  }

  // ========================================================================
  // STATE MUTATIONS
  // ========================================================================

  updateCredits(newCredits) {
    return this.stateManager.updateCredits(newCredits);
  }

  updateDebt(newDebt) {
    return this.stateManager.updateDebt(newDebt);
  }

  updateFuel(newFuel) {
    return this.stateManager.updateFuel(newFuel);
  }

  updateCargo(newCargo) {
    return this.stateManager.updateCargo(newCargo);
  }

  updateLocation(newSystemId) {
    return this.navigationManager.updateLocation(newSystemId);
  }

  setCredits(amount) {
    return this.stateManager.setCredits(amount);
  }

  setDebt(amount) {
    return this.stateManager.setDebt(amount);
  }

  setFuel(amount) {
    return this.stateManager.setFuel(amount);
  }

  updateTime(newDays) {
    return this.eventsManager.updateTime(newDays);
  }

  updateShipName(newName) {
    this.shipManager.updateShipName(newName);
  }

  updateShipCondition(hull, engine, lifeSupport) {
    this.shipManager.updateShipCondition(hull, engine, lifeSupport);
  }

  updateMarketConditions(systemId, goodType, quantityDelta) {
    return this.tradingManager.updateMarketConditions(
      systemId,
      goodType,
      quantityDelta
    );
  }

  applyMarketRecovery(daysPassed) {
    return this.tradingManager.applyMarketRecovery(daysPassed);
  }

  updatePriceKnowledge(systemId, prices, lastVisit = 0, source = 'visited') {
    return this.tradingManager.updatePriceKnowledge(
      systemId,
      prices,
      lastVisit,
      source
    );
  }

  incrementPriceKnowledgeStaleness(days = 1) {
    return this.tradingManager.incrementPriceKnowledgeStaleness(days);
  }

  recalculatePricesForKnownSystems() {
    return this.tradingManager.recalculatePricesForKnownSystems();
  }

  // ========================================================================
  // ECONOMIC EVENTS SYSTEM
  // ========================================================================

  getActiveEvents() {
    return this.eventsManager.getActiveEvents();
  }

  updateActiveEvents(newEvents) {
    return this.eventsManager.updateActiveEvents(newEvents);
  }

  getActiveEventForSystem(systemId) {
    return this.eventsManager.getActiveEventForSystem(systemId);
  }

  getEventType(eventTypeKey) {
    return this.eventsManager.getEventType(eventTypeKey);
  }

  // ========================================================================
  // INFORMATION BROKER SYSTEM
  // ========================================================================

  getIntelligenceCost(systemId) {
    return this.infoBrokerManager.getIntelligenceCost(systemId);
  }

  purchaseIntelligence(systemId) {
    return this.infoBrokerManager.purchaseIntelligence(systemId);
  }

  generateRumor() {
    return this.infoBrokerManager.generateRumor();
  }

  listAvailableIntelligence() {
    return this.infoBrokerManager.listAvailableIntelligence();
  }

  // ========================================================================
  // NPC REPUTATION SYSTEM
  // ========================================================================

  _validateAndGetNPCData(npcId) {
    return this.npcManager.validateAndGetNPCData(npcId);
  }

  getRepTier(rep) {
    return this.npcManager.getRepTier(rep);
  }

  getNPCState(npcId) {
    return this.npcManager.getNPCState(npcId);
  }

  modifyRep(npcId, amount, reason) {
    this.npcManager.modifyRep(npcId, amount, reason);
    this.saveGame();
  }

  // ========================================================================
  // DIALOGUE STATE MANAGEMENT
  // ========================================================================

  setDialogueState(npcId, nodeId) {
    return this.dialogueManager.setDialogueState(npcId, nodeId);
  }

  getDialogueState() {
    return this.dialogueManager.getDialogueState();
  }

  clearDialogueState() {
    return this.dialogueManager.clearDialogueState();
  }

  async startDialogue(npcId, nodeId = 'greeting') {
    return await this.dialogueManager.startDialogue(npcId, nodeId);
  }

  async selectDialogueChoice(npcId, choiceIndex) {
    return await this.dialogueManager.selectDialogueChoice(npcId, choiceIndex);
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - TIP SYSTEM
  // ========================================================================

  canGetTip(npcId) {
    return this.npcManager.canGetTip(npcId);
  }

  getTip(npcId) {
    const result = this.npcManager.getTip(npcId);
    if (result) {
      this.saveGame();
    }
    return result;
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - DISCOUNT SYSTEM
  // ========================================================================

  getServiceDiscount(npcId, serviceType) {
    return this.npcManager.getServiceDiscount(npcId, serviceType);
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - FAVOR SYSTEM
  // ========================================================================

  canRequestFavor(npcId, favorType) {
    return this.npcManager.canRequestFavor(npcId, favorType);
  }

  requestLoan(npcId) {
    const result = this.npcManager.requestLoan(npcId);
    if (result.success) {
      this.saveGame();
    }
    return result;
  }

  repayLoan(npcId) {
    const result = this.npcManager.repayLoan(npcId);
    if (result.success) {
      this.saveGame();
    }
    return result;
  }

  checkLoanDefaults() {
    this.npcManager.checkLoanDefaults();
    this.saveGame();
  }

  storeCargo(npcId) {
    const result = this.npcManager.storeCargo(npcId);
    if (result.success) {
      this.saveGame();
    }
    return result;
  }

  retrieveCargo(npcId) {
    const result = this.npcManager.retrieveCargo(npcId);
    if (result.success && result.retrieved.length > 0) {
      this.saveGame();
    }
    return result;
  }

  // ========================================================================
  // TRADING OPERATIONS
  // ========================================================================

  buyGood(goodType, quantity, price) {
    return this.tradingManager.buyGood(goodType, quantity, price);
  }

  sellGood(stackIndex, quantity, salePrice) {
    return this.tradingManager.sellGood(stackIndex, quantity, salePrice);
  }

  // ========================================================================
  // REFUEL SYSTEM
  // ========================================================================

  getFuelPrice(systemId) {
    return this.refuelManager.getFuelPrice(systemId);
  }

  validateRefuel(currentFuel, amount, credits, pricePerPercent) {
    return this.refuelManager.validateRefuel(
      currentFuel,
      amount,
      credits,
      pricePerPercent
    );
  }

  refuel(amount) {
    return this.refuelManager.refuel(amount);
  }

  // ========================================================================
  // SHIP REPAIR SYSTEM
  // ========================================================================

  getRepairCost(systemType, amount, currentCondition) {
    return this.repairManager.getRepairCost(
      systemType,
      amount,
      currentCondition
    );
  }

  repairShipSystem(systemType, amount) {
    return this.repairManager.repairShipSystem(systemType, amount);
  }

  // ========================================================================
  // UPGRADE SYSTEM
  // ========================================================================

  validateUpgradePurchase(upgradeId) {
    return this.shipManager.validateUpgradePurchase(upgradeId);
  }

  purchaseUpgrade(upgradeId) {
    return this.shipManager.purchaseUpgrade(upgradeId);
  }

  calculateShipCapabilities() {
    return this.shipManager.calculateShipCapabilities();
  }

  // ========================================================================
  // HIDDEN CARGO SYSTEM
  // ========================================================================

  moveToHiddenCargo(good, qty) {
    return this.shipManager.moveToHiddenCargo(good, qty);
  }

  moveToRegularCargo(good, qty) {
    return this.shipManager.moveToRegularCargo(good, qty);
  }

  // ========================================================================
  // DOCK/UNDOCK OPERATIONS
  // ========================================================================

  recordVisitedPrices() {
    return this.tradingManager.recordVisitedPrices();
  }

  dock() {
    return this.navigationManager.dock();
  }

  undock() {
    return this.navigationManager.undock();
  }

  // ========================================================================
  // SAVE/LOAD SYSTEM
  // ========================================================================

  saveGame() {
    return this.saveLoadManager.saveGame();
  }

  loadGame() {
    return this.saveLoadManager.loadGame();
  }

  hasSavedGame() {
    return this.saveLoadManager.hasSavedGame();
  }

  clearSave() {
    return this.saveLoadManager.clearSave();
  }

  get lastSaveTime() {
    return this.saveLoadManager.getLastSaveTime();
  }

  set lastSaveTime(timestamp) {
    this.saveLoadManager.setLastSaveTime(timestamp);
  }

  // ========================================================================
  // NPC BENEFITS SYSTEM - FREE REPAIR SYSTEM
  // ========================================================================

  canGetFreeRepair(npcId) {
    return this.npcManager.canGetFreeRepair(npcId);
  }

  getFreeRepair(npcId, hullDamagePercent) {
    return this.npcManager.getFreeRepair(npcId, hullDamagePercent);
  }

  // ========================================================================
  // DANGER SYSTEM
  // ========================================================================

  getDangerZone(systemId) {
    return this.dangerManager.getDangerZone(systemId);
  }

  calculatePirateEncounterChance(systemId, gameState) {
    return this.dangerManager.calculatePirateEncounterChance(
      systemId,
      gameState
    );
  }

  calculateInspectionChance(systemId, gameState) {
    return this.dangerManager.calculateInspectionChance(systemId, gameState);
  }

  getKarma() {
    return this.dangerManager.getKarma();
  }

  modifyKarma(amount, reason) {
    this.dangerManager.modifyKarma(amount, reason);
    this.saveGame();
  }

  getFactionRep(faction) {
    return this.dangerManager.getFactionRep(faction);
  }

  modifyFactionRep(faction, amount, reason) {
    this.dangerManager.modifyFactionRep(faction, amount, reason);
    this.saveGame();
  }

  resolveCombatChoice(encounter, choice) {
    return this.dangerManager.resolveCombatChoice(encounter, choice);
  }
}
