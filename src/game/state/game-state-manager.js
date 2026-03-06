import {
  FACTION_CONFIG,
  EVENT_NAMES,
  DEFAULT_PREFERENCES,
} from '../constants.js';
import { devLog } from '../utils/dev-logger.js';
import { generateEpilogue, generateStats } from '../data/epilogue-data.js';
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
import { CombatManager } from './managers/combat.js';
import { NegotiationManager } from './managers/negotiation.js';
import { InspectionManager } from './managers/inspection.js';
import { DistressManager } from './managers/distress.js';
import { MechanicalFailureManager } from './managers/mechanical-failure.js';
import { MissionManager } from './managers/mission.js';
import { EventEngineManager } from './managers/event-engine.js';
import { QuestManager } from './managers/quest-manager.js';
import { DebtManager } from './managers/debt.js';
import { AchievementsManager } from './managers/achievements.js';
import {
  isVersionCompatible,
  validateStateStructure,
  migrateFromV1ToV2,
  migrateFromV2ToV2_1,
  migrateFromV2_1ToV4,
  migrateFromV4ToV4_1,
  migrateFromV4_1ToV5,
  addStateDefaults,
} from './state-validators.js';
import { NARRATIVE_EVENTS } from '../data/narrative-events.js';
import { DANGER_EVENTS } from '../data/danger-events.js';
import { ALL_QUESTS } from '../data/quest-definitions.js';

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
    this.combatManager = new CombatManager(this);
    this.negotiationManager = new NegotiationManager(this);
    this.inspectionManager = new InspectionManager(this);
    this.distressManager = new DistressManager(this);
    this.mechanicalFailureManager = new MechanicalFailureManager(this);
    this.missionManager = new MissionManager(this);
    this.eventEngineManager = new EventEngineManager(this);
    this.questManager = new QuestManager(this);
    this.debtManager = new DebtManager(this);
    this.achievementsManager = new AchievementsManager(this);

    // Flush pending saves when the browser tab closes
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSave();
      });
    }
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

  // ========================================================================
  // SHIP CONFIGURATION
  // ========================================================================

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

  addQuirk(quirkId) {
    return this.shipManager.addQuirk(quirkId);
  }

  removeQuirk(quirkId) {
    return this.shipManager.removeQuirk(quirkId);
  }

  addUpgrade(upgradeId) {
    return this.shipManager.addUpgrade(upgradeId);
  }

  removeUpgrade(upgradeId) {
    return this.shipManager.removeUpgrade(upgradeId);
  }

  addToCargoArray(cargoArray, sourceStack, qty) {
    return this.shipManager.addToCargoArray(cargoArray, sourceStack, qty);
  }

  // ========================================================================
  // GAME LIFECYCLE
  // ========================================================================

  /**
   * Initialize a new game with default values
   * Uses InitializationManager for state creation but maintains control over state assignment
   *
   * @returns {Object} Complete initial game state
   */
  initNewGame(gameSeed = Date.now().toString()) {
    const completeState =
      this.initializationManager.createInitialState(gameSeed);

    this.state = completeState;

    this._registerEventEngine();

    devLog('New game initialized:', completeState);

    this._emitAllStateEvents(completeState);

    return completeState;
  }

  /**
   * Restore game state from raw save data
   *
   * Single canonical path for state restoration. Validates, migrates,
   * adds defaults, assigns state, registers event engine, and emits
   * UI events.
   *
   * @param {Object} rawState - Raw state data (e.g., from localStorage parse)
   * @returns {{ success: boolean, state?: Object, reason?: string }}
   */
  restoreState(rawState) {
    if (!rawState) {
      return { success: false, reason: 'No state data provided' };
    }

    if (!isVersionCompatible(rawState.meta?.version)) {
      return {
        success: false,
        reason: `Incompatible save version: ${rawState.meta?.version}`,
      };
    }

    let migratedState = this._applyMigrations(rawState);

    if (!validateStateStructure(migratedState)) {
      return {
        success: false,
        reason: 'Save data failed structure validation',
      };
    }

    migratedState = addStateDefaults(migratedState, this.starData);

    this.state = migratedState;

    this._registerEventEngine();

    this._emitAllStateEvents(migratedState);

    // Catch up achievements that already meet thresholds (e.g. saves from
    // before the achievements system, or new achievements added in updates).
    this.achievementsManager.checkAchievements();

    devLog('State restored successfully');

    return { success: true, state: migratedState };
  }

  /**
   * Apply version migration chain to raw state
   * @param {Object} state - State to migrate
   * @returns {Object} Migrated state
   * @private
   */
  _applyMigrations(state) {
    let migrated = state;

    if (migrated.meta.version === '1.0.0') {
      migrated = migrateFromV1ToV2(migrated, this.starData);
    }
    if (migrated.meta.version === '2.0.0') {
      migrated = migrateFromV2ToV2_1(migrated);
    }
    if (migrated.meta.version === '2.1.0') {
      migrated = migrateFromV2_1ToV4(migrated);
    }
    if (migrated.meta.version === '4.0.0') {
      migrated = migrateFromV4ToV4_1(migrated);
    }
    if (migrated.meta.version === '4.1.0') {
      migrated = migrateFromV4_1ToV5(migrated);
    }

    return migrated;
  }

  /**
   * Register narrative events, danger events, and quests with the event engine.
   * Shared by initNewGame() and restoreState().
   * @private
   */
  _registerEventEngine() {
    this.eventEngineManager.clearEvents();
    this.eventEngineManager.registerEvents(NARRATIVE_EVENTS);
    this.eventEngineManager.registerEvents(DANGER_EVENTS);
    ALL_QUESTS.forEach((quest) => this.questManager.registerQuest(quest));
  }

  /**
   * Emit all state events for UI synchronization.
   * Shared by initNewGame() and restoreState().
   * @param {Object} state - Complete game state
   * @private
   */
  _emitAllStateEvents(state) {
    const { player, ship, world } = state;

    this.emit(EVENT_NAMES.CREDITS_CHANGED, player.credits);
    this.emit(EVENT_NAMES.DEBT_CHANGED, player.debt);
    this.emit(EVENT_NAMES.FUEL_CHANGED, ship.fuel);
    this.emit(EVENT_NAMES.CARGO_CHANGED, ship.cargo);
    this.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, ship.hiddenCargo);
    this.emit(EVENT_NAMES.LOCATION_CHANGED, player.currentSystem);
    this.emit(EVENT_NAMES.TIME_CHANGED, player.daysElapsed);
    this.emit(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED, world.priceKnowledge);
    this.emit(EVENT_NAMES.ACTIVE_EVENTS_CHANGED, world.activeEvents);
    this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, {
      hull: ship.hull,
      engine: ship.engine,
      lifeSupport: ship.lifeSupport,
    });
    this.emit(EVENT_NAMES.UPGRADES_CHANGED, ship.upgrades);
    this.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, ship.cargoCapacity);
    this.emit(EVENT_NAMES.QUIRKS_CHANGED, ship.quirks);
    this.emit(EVENT_NAMES.KARMA_CHANGED, player.karma || 0);
    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, player.factions || {});
    if (player.finance) {
      this.emit(EVENT_NAMES.FINANCE_CHANGED, player.finance);
    }
    if (state.missions) {
      this.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...state.missions });
    }
    if (state.quests) {
      this.emit(EVENT_NAMES.QUEST_CHANGED, { ...state.quests });
    }
    if (state.achievements) {
      this.emit(EVENT_NAMES.ACHIEVEMENTS_CHANGED, { ...state.achievements });
    }
    if (state.preferences) {
      this.emit(EVENT_NAMES.PREFERENCES_CHANGED, { ...state.preferences });
    }
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

  getTradeCargoUsed() {
    return this.stateManager.getTradeCargoUsed();
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

  purchaseIntelligence(systemId, discount = 0) {
    return this.infoBrokerManager.purchaseIntelligence(systemId, discount);
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
    this.markDirty();
  }

  modifyRepRaw(npcId, amount, reason) {
    this.npcManager.modifyRepRaw(npcId, amount, reason);
    this.markDirty();
  }

  setNpcRep(npcId, value) {
    this.npcManager.setNpcRep(npcId, value);
    this.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.state.npcs });
    this.markDirty();
  }

  // ========================================================================
  // QUEST MANAGEMENT
  // ========================================================================

  registerQuest(questDef) {
    this.questManager.registerQuest(questDef);
  }

  getQuestState(questId) {
    return this.questManager.getQuestState(questId);
  }

  getQuestDefinition(questId) {
    return this.questManager.getQuestDefinition(questId);
  }

  getQuestStage(questId) {
    return this.questManager.getQuestStage(questId);
  }

  advanceQuest(questId) {
    return this.questManager.advanceQuest(questId);
  }

  claimStageRewards(questId) {
    return this.questManager.claimStageRewards(questId);
  }

  hasClaimedStageRewards(questId) {
    return this.questManager.hasClaimedStageRewards(questId);
  }

  updateQuestData(questId, key, value) {
    this.questManager.updateQuestData(questId, key, value);
  }

  isQuestComplete(questId) {
    return this.questManager.isQuestComplete(questId);
  }

  getActiveQuests() {
    return this.questManager.getActiveQuests();
  }

  canStartQuestStage(questId, stage) {
    return this.questManager.canStartStage(questId, stage);
  }

  getUnmetRequirements(questId, stage) {
    return this.questManager.getUnmetRequirements(questId, stage);
  }

  checkQuestObjectives(questId) {
    return this.questManager.checkObjectivesComplete(questId);
  }

  canContributeSupply() {
    return this.questManager.canContributeSupply();
  }

  contributeSupply() {
    return this.questManager.contributeSupply();
  }

  startPavonisRun() {
    this.emit(EVENT_NAMES.PAVONIS_RUN_TRIGGERED, true);
  }

  // ========================================================================
  // COLE DEBT SYSTEM
  // ========================================================================

  getDebtInfo() {
    return this.debtManager.getDebtInfo();
  }

  borrowFromCole(amount) {
    return this.debtManager.borrow(amount);
  }

  makeDebtPayment(amount) {
    return this.debtManager.makePayment(amount);
  }

  calculateTradeWithholding(totalRevenue) {
    return this.debtManager.calculateWithholding(totalRevenue);
  }

  applyTradeWithholding(totalRevenue) {
    return this.debtManager.applyWithholding(totalRevenue);
  }

  getHeatTier() {
    return this.debtManager.getHeatTier();
  }

  modifyColeRep(delta) {
    this.debtManager.modifyColeRep(delta);
  }

  processDebtTick() {
    this.debtManager.applyInterest();
    return this.debtManager.checkCheckpoint();
  }

  // ========================================================================
  // ACHIEVEMENTS SYSTEM
  // ========================================================================

  getAchievementProgress() {
    return this.achievementsManager.getProgress();
  }

  getStatsSnapshot() {
    const state = this.stateManager.getState();
    const stats = state?.stats ?? {};
    const player = state?.player ?? {};
    const world = state?.world ?? {};
    return {
      jumpsCompleted: stats.jumpsCompleted ?? 0,
      creditsEarned: stats.creditsEarned ?? 0,
      cargoHauled: stats.cargoHauled ?? 0,
      charitableActs: stats.charitableActs ?? 0,
      daysElapsed: Math.round(player.daysElapsed ?? 0),
      visitedCount: (world.visitedSystems ?? []).length,
      dangerFlags: world.dangerFlags ?? {},
    };
  }

  // ========================================================================
  // PREFERENCES
  // ========================================================================

  getPreference(key) {
    return this.state?.preferences?.[key] ?? DEFAULT_PREFERENCES[key];
  }

  setPreference(key, value) {
    if (!this.state.preferences) {
      this.state.preferences = { ...DEFAULT_PREFERENCES };
    }
    this.state.preferences[key] = value;
    this.emit(EVENT_NAMES.PREFERENCES_CHANGED, { ...this.state.preferences });
    this.markDirty();
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
      this.markDirty();
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
      this.markDirty();
    }
    return result;
  }

  repayLoan(npcId) {
    const result = this.npcManager.repayLoan(npcId);
    if (result.success) {
      this.markDirty();
    }
    return result;
  }

  checkLoanDefaults() {
    this.npcManager.checkLoanDefaults();
    this.markDirty();
  }

  storeCargo(npcId) {
    const result = this.npcManager.storeCargo(npcId);
    if (result.success) {
      this.markDirty();
    }
    return result;
  }

  retrieveCargo(npcId) {
    const result = this.npcManager.retrieveCargo(npcId);
    if (result.success && result.retrieved.length > 0) {
      this.markDirty();
    }
    return result;
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

  refuel(amount, discount = 0) {
    return this.refuelManager.refuel(amount, discount);
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

  repairShipSystem(systemType, amount, discount = 0) {
    return this.repairManager.repairShipSystem(systemType, amount, discount);
  }

  applyEmergencyPatch(systemType) {
    return this.repairManager.applyEmergencyPatch(systemType);
  }

  cannibalizeSystem(targetType, donations) {
    return this.repairManager.cannibalizeSystem(targetType, donations);
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

  getHiddenCargo() {
    return this.shipManager.getHiddenCargo();
  }

  clearHiddenCargo() {
    return this.shipManager.clearHiddenCargo();
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

  markDirty() {
    this.saveLoadManager.markDirty();
  }

  flushSave() {
    this.saveLoadManager.flushSave();
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
  // DANGER SYSTEM
  // ========================================================================

  getDangerZone(systemId) {
    return this.dangerManager.getDangerZone(systemId);
  }

  calculatePirateEncounterChance(systemId, gameState = this.state) {
    return this.dangerManager.calculatePirateEncounterChance(
      systemId,
      gameState
    );
  }

  calculateInspectionChance(systemId, gameState = this.state) {
    return this.dangerManager.calculateInspectionChance(systemId, gameState);
  }

  getKarma() {
    return this.dangerManager.getKarma();
  }

  setKarma(value) {
    this.dangerManager.setKarma(value);
    this.markDirty();
  }

  modifyKarma(amount, reason) {
    this.dangerManager.modifyKarma(amount, reason);
    this.markDirty();
  }

  getFactionRep(faction) {
    return this.dangerManager.getFactionRep(faction);
  }

  setFactionRep(faction, value) {
    this.dangerManager.setFactionRep(faction, value);
    this.markDirty();
  }

  modifyFactionRep(faction, amount, reason) {
    this.dangerManager.modifyFactionRep(faction, amount, reason);
    this.markDirty();
  }

  hasIllegalMissionCargo() {
    return this.dangerManager.hasIllegalMissionCargo();
  }

  countRestrictedGoods(cargo, zone, systemId) {
    return this.dangerManager.countRestrictedGoods(cargo, zone, systemId);
  }

  removeRestrictedCargo() {
    return this.dangerManager.removeRestrictedCargo();
  }

  incrementDangerFlag(flagName) {
    return this.dangerManager.incrementDangerFlag(flagName);
  }

  resolveCombatChoice(encounter, choice) {
    return this.combatManager.resolveCombatChoice(encounter, choice);
  }

  resolveNegotiation(encounter, choice) {
    return this.negotiationManager.resolveNegotiation(encounter, choice);
  }

  resolveInspection(choice, gameState) {
    return this.inspectionManager.resolveInspection(choice, gameState);
  }

  checkDistressCall() {
    return this.distressManager.checkDistressCall();
  }

  resolveDistressCall(distressCall, choice) {
    return this.distressManager.resolveDistressCallEncounter(
      distressCall,
      choice
    );
  }

  /**
   * Resolve encounter based on type and choice
   * Routes to appropriate specific resolution method
   *
   * @param {Object} encounterData - Full encounter data from event
   * @param {string} choice - Player's choice
   * @returns {Object} Resolution outcome
   */
  resolveEncounter(encounterData, choice) {
    const { type, encounter } = encounterData;

    switch (type) {
      case 'pirate':
        return this.resolvePirateEncounter(encounter, choice);
      case 'inspection':
        return this.resolveInspection(choice, this.getState());
      case 'mechanical_failure':
        return this.resolveMechanicalFailure(
          encounter.type,
          choice,
          this.getState()
        );
      case 'distress_call':
        return this.resolveDistressCall(encounter, choice);
      default:
        throw new Error(`Unknown encounter type: ${type}`);
    }
  }

  /**
   * Resolve pirate encounter based on choice
   * Maps UI choices to appropriate resolution methods
   *
   * @param {Object} encounter - Pirate encounter data
   * @param {string} choice - Player's choice (fight, flee, negotiate, surrender)
   * @returns {Object} Resolution outcome
   */
  resolvePirateEncounter(encounter, choice) {
    switch (choice) {
      case 'fight':
        // Fighting maps to return_fire combat choice
        return this.resolveCombatChoice(encounter, 'return_fire');
      case 'flee':
        // Fleeing maps to evasive combat choice
        return this.resolveCombatChoice(encounter, 'evasive');
      case 'negotiate':
        // Negotiating maps to counter_proposal negotiation choice
        return this.resolveNegotiation(encounter, 'counter_proposal');
      case 'surrender':
        // Surrendering maps to accept_demand negotiation choice
        return this.resolveNegotiation(encounter, 'accept_demand');
      default:
        throw new Error(`Unknown pirate encounter choice: ${choice}`);
    }
  }

  checkMechanicalFailure(gameState) {
    return this.mechanicalFailureManager.checkMechanicalFailure(gameState);
  }

  resolveMechanicalFailure(failureType, choice, gameState) {
    return this.mechanicalFailureManager.resolveMechanicalFailure(
      failureType,
      choice,
      gameState
    );
  }

  // ========================================================================
  // MISSION SYSTEM
  // ========================================================================

  acceptMission(mission) {
    return this.missionManager.acceptMission(mission);
  }

  completeMission(missionId) {
    return this.missionManager.completeMission(missionId);
  }

  abandonMission(missionId) {
    return this.missionManager.abandonMission(missionId);
  }

  checkMissionDeadlines() {
    return this.missionManager.checkMissionDeadlines();
  }

  removeCargoForMission(goodType, quantity) {
    return this.shipManager.removeCargoForMission(goodType, quantity);
  }

  refreshMissionBoard() {
    return this.missionManager.refreshMissionBoard();
  }

  getCompletableMissions() {
    return this.missionManager.getCompletableMissions();
  }

  getActiveMissions() {
    return this.missionManager.getActiveMissions();
  }

  failMissionsDueToCargoLoss() {
    return this.missionManager.failMissionsDueToCargoLoss();
  }

  updatePassengerSatisfaction(missionId, event) {
    return this.missionManager.updatePassengerSatisfaction(missionId, event);
  }

  modifyAllPassengerSatisfaction(delta) {
    return this.missionManager.modifyAllPassengerSatisfaction(delta);
  }

  dismissMissionFailureNotice(missionId) {
    return this.missionManager.dismissMissionFailureNotice(missionId);
  }

  // ========================================================================
  // EVENT ENGINE
  // ========================================================================

  registerEvent(event) {
    return this.eventEngineManager.registerEvent(event);
  }

  registerEvents(events) {
    return this.eventEngineManager.registerEvents(events);
  }

  checkEvents(eventType, context, rng) {
    return this.eventEngineManager.checkEvents(eventType, context, rng);
  }

  getEventById(id) {
    return this.eventEngineManager.getEventById(id);
  }

  markEventFired(eventId) {
    return this.eventEngineManager.markFired(eventId);
  }

  setEventCooldown(eventId, cooldownDays) {
    return this.eventEngineManager.setCooldown(eventId, cooldownDays);
  }

  setNarrativeFlag(flagName) {
    return this.eventEngineManager.setFlag(flagName);
  }

  getNarrativeFlags() {
    return this.eventEngineManager.getFlags();
  }

  getDaysElapsed() {
    return this.state?.player?.daysElapsed ?? 0;
  }

  getFactionReps() {
    const reps = {};
    for (const faction of FACTION_CONFIG.FACTIONS) {
      reps[faction] = this.getFactionRep(faction);
    }
    return reps;
  }

  getDangerFlags() {
    return this.state?.world?.dangerFlags ?? {};
  }

  getEpilogueData() {
    return generateEpilogue(this.state);
  }

  getEpilogueStats() {
    return generateStats(this.state);
  }

  markVictory() {
    if (this.state.meta) {
      this.state.meta.victory = true;
      this.markDirty();
    }
  }
}
