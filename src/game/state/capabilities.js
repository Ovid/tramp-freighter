// src/game/state/capabilities.js
/**
 * Capability Interface Definitions for Manager Injection
 *
 * This file defines the JSDoc typedefs for the capability objects that each
 * manager receives when migrated from the old `this.gameStateManager` pattern
 * to injected capabilities. Each typedef specifies exactly which cross-domain
 * reads, writes, and infrastructure a manager needs.
 *
 * STATE OWNERSHIP MODEL:
 * The coordinator owns the single `this.state` object. Managers receive getter
 * functions that return VIEWS (references) into their owned slice — not copies.
 * Managers mutate through these references. Cross-domain mutations go through
 * injected callbacks.
 *
 * STATE SLICE OWNERSHIP:
 *
 * | Manager            | Owned State Paths                                                    |
 * |--------------------|----------------------------------------------------------------------|
 * | ShipManager        | ship.hull, ship.engine, ship.lifeSupport, ship.quirks, ship.upgrades |
 * |                    | ship.cargoCapacity, ship.hiddenCargo, ship.name                      |
 * | StateManager       | ship.fuel, ship.cargo, player.credits (mutation primitives)          |
 * | NPCManager         | npcs.*                                                               |
 * | TradingManager     | world.priceKnowledge, world.marketConditions,                        |
 * |                    | world.currentSystemPrices                                            |
 * | DangerManager      | player.karma, player.factions, world.dangerFlags                     |
 * | NavigationManager  | player.currentSystem, world.visitedSystems                           |
 * | MissionManager     | missions.*                                                           |
 * | QuestManager       | quests.*                                                             |
 * | DebtManager        | player.debt, player.finance                                          |
 * | AchievementsManager| achievements.*                                                       |
 * | EventsManager      | world.activeEvents, player.daysElapsed                               |
 * | EventEngineManager | world.narrativeEvents.* (flags, fired, cooldowns)                    |
 * | DialogueManager    | dialogue.*                                                           |
 * | Coordinator        | meta.*, preferences.*, stats.*                                       |
 *
 * SHARED TOP-LEVEL KEYS:
 * - state.player is fragmented: credits (StateManager), karma/factions
 *   (DangerManager), currentSystem (NavigationManager), daysElapsed
 *   (EventsManager), debt/finance (DebtManager)
 * - state.world is fragmented: priceKnowledge/marketConditions/currentSystemPrices
 *   (TradingManager), activeEvents (EventsManager), narrativeEvents
 *   (EventEngineManager), visitedSystems (NavigationManager), dangerFlags
 *   (DangerManager)
 * - state.ship is split: fuel/cargo (StateManager), everything else (ShipManager)
 *
 * Each manager's getter returns ONLY its specific paths, not the entire
 * player/world/ship object.
 */

// ========================================================================
// BATCH 1: Pure Calculation Managers
// ========================================================================

/**
 * @typedef {Object} CombatCapabilities
 *
 * @property {function(): CombatState} getOwnState
 *   Returns: (no owned state — Combat is stateless, computes from inputs)
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipQuirks
 * @property {function(): Array} getShipUpgrades
 * @property {function(): number} getKarma
 *
 * @property {function(string): void} incrementDangerFlag
 *
 * @property {function(string, *): void} emit
 * @property {function(): void} markDirty
 */

/**
 * @typedef {Object} NegotiationCapabilities
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getKarma
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getCredits
 * @property {function(): Array|undefined} getActiveMissions
 * @property {function(): boolean} getHasPriorIntel
 *
 * @property {function(string): void} incrementDangerFlag
 *
 * @property {function(string, *): void} emit
 * @property {function(): void} markDirty
 */

/**
 * @typedef {Object} InspectionCapabilities
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipHiddenCargo
 * @property {function(number): Object} getDangerZone
 * @property {function(Array, Object, number): number} countRestrictedGoods
 *
 * @property {function(string): void} incrementDangerFlag
 *
 * @property {function(string, *): void} emit
 * @property {function(): void} markDirty
 */

/**
 * @typedef {Object} DistressCapabilities
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 *
 * @property {function(string): void} incrementDangerFlag
 *
 * @property {function(string, *): void} emit
 * @property {function(): void} markDirty
 */

/**
 * @typedef {Object} MechanicalFailureCapabilities
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): Object} getShipCondition
 *   Returns: { hull: number, engine: number, lifeSupport: number }
 *
 * @property {function(string, *): void} emit
 * @property {function(): void} markDirty
 */

// ========================================================================
// BATCH 2: Clean Slice Owners
// ========================================================================

/**
 * @typedef {Object} AchievementsCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.achievements
 *
 * @property {function(): Object} getNpcs
 *   Returns: state.npcs (read-only, for counting trusted NPCs)
 * @property {function(): Object|undefined} getDangerFlags
 *   Returns: state.world.dangerFlags
 * @property {function(): number|undefined} getKarma
 *   Returns: state.player.karma
 * @property {function(): number} getDaysElapsed
 * @property {function(): Object|undefined} getStats
 *   Returns: state.stats
 * @property {function(): Array|undefined} getVisitedSystems
 *   Returns: state.world.visitedSystems
 *
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} QuestCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.quests
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getShipHull
 * @property {function(): number} getShipEngine
 * @property {function(): Array} getShipUpgrades
 * @property {function(): Object} getNpcs
 *   Returns: state.npcs (read-only, for quest stage requirement checks)
 * @property {function(): number|undefined} getDebt
 *   Returns: state.player.debt
 * @property {function(): Object|undefined} getNarrativeFlags
 *   Returns: state.world.narrativeEvents.flags
 *
 * @property {function(number): void} updateCredits
 *   Sets player credits to exact value
 * @property {function(string, number, string): void} modifyRepRaw
 *   Modifies NPC reputation (bypasses trust modifier)
 * @property {function(number, string): void} modifyKarma
 * @property {function(string, number): void} removeCargoForMission
 * @property {function(number): void} setShipEngine
 *   Sets ship engine condition to exact value (for engine restore rewards)
 * @property {function(string): void} addShipUpgrade
 *   Adds upgrade to ship if not already present
 * @property {function(string, number): void} updateStats
 *   Increments a stats key by delta
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {function(string, function): void} subscribe
 *   Subscribe to game events (for JUMP_COMPLETED, DOCKED)
 * @property {Array} starData
 */

/**
 * @typedef {Object} DialogueCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.dialogue
 *
 * @property {function(string, *): void} emit
 *
 * @property {Object} coordinatorRef
 *   The coordinator instance, passed through to dialogue engine functions
 *   (showDialogue, selectChoice). Those functions use it to build dialogue
 *   context (karma, credits, NPC state, etc.). This is a documented coupling
 *   that will be addressed if the dialogue engine is refactored separately.
 */

// ========================================================================
// BATCH 3: Moderate Complexity
// ========================================================================

/**
 * @typedef {Object} ShipCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.ship (mutable reference)
 *   ShipManager owns: hull, engine, lifeSupport, quirks, upgrades,
 *   cargoCapacity, hiddenCargo, hiddenCargoCapacity, name
 *   StateManager owns: fuel, cargo (do NOT mutate directly)
 *
 * @property {function(): number} getCredits
 * @property {function(): number} getCargoRemaining
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} NPCCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.npcs (mutable reference)
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipQuirks
 *   Needed for smooth_talker quirk check in modifyRep
 * @property {function(): number} getCargoRemaining
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(Array, Object, number): void} addToCargoArray
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} DangerCapabilities
 *
 * @property {function(): number} getKarma
 *   Returns: state.player.karma (read only — use setKarma to write)
 * @property {function(number): void} setKarma
 *   Sets state.player.karma to exact value
 * @property {function(): Object} getPlayerFactions
 *   Returns: state.player.factions (mutable reference)
 * @property {function(): Object} getDangerFlags
 *   Returns: state.world.dangerFlags (mutable reference)
 *
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipUpgrades
 * @property {function(): Object|undefined} getStats
 *
 * @property {function(Array): void} updateCargo
 *   For removeRestrictedCargo
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */

/**
 * @typedef {Object} RefuelCapabilities
 *
 * @property {function(): RefuelState} getOwnState
 *   Returns: (no owned state — Refuel computes from ship.fuel and player)
 *
 * @property {function(): number} getShipFuel
 * @property {function(): number} getCredits
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getFuelCapacity
 *
 * @property {function(number): void} updateCredits
 * @property {function(number): void} updateFuel
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */

/**
 * @typedef {Object} RepairCapabilities
 *
 * @property {function(): RepairState} getOwnState
 *   Returns: (no owned state — Repair computes from ship condition and player)
 *
 * @property {function(): Object} getShipCondition
 *   Returns: { hull, engine, lifeSupport }
 * @property {function(): number} getCredits
 * @property {function(): number} getDaysElapsed
 * @property {function(string): Object} getNPCState
 *   Returns: state.npcs[npcId] for free repair checks
 * @property {function(string): Object} validateAndGetNPCData
 *   Returns NPC static data (from ALL_NPCS)
 * @property {function(number): Object} getRepTier
 *   Returns reputation tier object for given rep value
 *
 * @property {function(number): void} updateCredits
 * @property {function(number, number, number): void} updateShipCondition
 * @property {function(number): void} advanceTime
 *   For emergency patch time penalty
 * @property {function(): void} markDirty
 */

/**
 * @typedef {Object} InfoBrokerCapabilities
 *
 * @property {function(): Object} getPriceKnowledge
 *   Returns: state.world.priceKnowledge
 * @property {function(): Array} getActiveEvents
 *   Returns: state.world.activeEvents
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipUpgrades
 *
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {Object} navigationSystem
 * @property {Object} coordinatorRef
 *   The coordinator instance, passed through to InformationBroker static methods
 *   (purchaseIntelligence, generateRumor). Those methods directly mutate
 *   state.player.credits and state.world.priceKnowledge. This is a documented
 *   coupling that will be addressed if InformationBroker is refactored separately.
 */

// ========================================================================
// BATCH 4: Heavy Cross-Domain
// ========================================================================

/**
 * @typedef {Object} TradingCapabilities
 *
 * @property {function(): TradingState} getOwnState
 *   Returns: { priceKnowledge: state.world.priceKnowledge,
 *              marketConditions: state.world.marketConditions,
 *              currentSystemPrices: state.world.currentSystemPrices }
 *
 * @property {function(): number} getCredits
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getCargoRemaining
 * @property {function(): number} getDaysElapsed
 * @property {function(): Object|undefined} getStats
 * @property {function(number): Object} getDangerZone
 * @property {function(): Array} getActiveEvents
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(number): void} applyTradeWithholding
 * @property {function(): void} checkAchievements
 * @property {function(string, number): void} updateStats
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {boolean} [isTestEnvironment]
 */

/**
 * @typedef {Object} MissionCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.missions
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getCargoRemaining
 * @property {function(): Object|undefined} getStats
 * @property {function(): Array} getVisitedSystems
 * @property {function(number): Object} getDangerZone
 * @property {function(string): number} getFactionRep
 *
 * @property {function(number): void} updateCredits
 * @property {function(number): void} applyTradeWithholding
 * @property {function(string, number, string): void} modifyFactionRep
 * @property {function(string, number, string): void} modifyRep
 *   NPC reputation (trust-modified)
 * @property {function(number, string): void} modifyKarma
 * @property {function(number): void} modifyColeRep
 *   Direct Cole reputation delta (bypasses trust modifier)
 * @property {function(string, number): void} removeCargoForMission
 * @property {function(string, number): void} updateStats
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {Array} wormholeData
 * @property {boolean} [isTestEnvironment]
 */

/**
 * @typedef {Object} EventsCapabilities
 *
 * @property {function(): EventsState} getOwnState
 *   Returns: { activeEvents: state.world.activeEvents,
 *              daysElapsed: state.player.daysElapsed }
 *   (EventsManager owns both the events list and the day counter)
 *
 * @property {function(number): void} setDaysElapsed
 *   Sets state.player.daysElapsed to a new value
 * @property {function(Array): void} setActiveEvents
 *   Replaces state.world.activeEvents with a new array
 * @property {function(): Object} getPriceKnowledge
 *   Returns: state.world.priceKnowledge (read-only for staleness check)
 * @property {function(): Object} getMarketConditions
 *   Returns: state.world.marketConditions (read-only for event processing)
 *
 * @property {function(number): void} incrementPriceKnowledgeStaleness
 *   Delegates to TradingManager
 * @property {function(number): void} applyMarketRecovery
 *   Delegates to TradingManager
 * @property {function(): void} recalculatePricesForKnownSystems
 *   Delegates to TradingManager
 * @property {function(): void} checkLoanDefaults
 *   Delegates to NPCManager
 * @property {function(): void} processDebtTick
 *   Delegates to DebtManager (applies interest + checks checkpoint)
 * @property {function(): void} checkMissionDeadlines
 *   Delegates to MissionManager
 * @property {function(): void} cleanupOldIntelligence
 *   Delegates to InformationBroker
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {boolean} [isTestEnvironment]
 */

/**
 * @typedef {Object} DebtCapabilities
 *
 * @property {function(): DebtState} getOwnState
 *   Returns: { debt: state.player.debt, finance: state.player.finance }
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getCurrentSystem
 *
 * @property {function(Object): void} initFinance
 *   Initializes state.player.finance when not yet set
 * @property {function(number): void} updateDebt
 * @property {function(number): void} updateCredits
 * @property {function(string, number, string): void} modifyRepRaw
 *   For Cole reputation changes
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {boolean} [isTestEnvironment]
 */

// ========================================================================
// REMAINING DOMAIN MANAGERS
// ========================================================================

/**
 * @typedef {Object} NavigationCapabilities
 *
 * @property {function(): NavigationState} getOwnState
 *   Returns: { currentSystem: state.player.currentSystem,
 *              visitedSystems: state.world.visitedSystems }
 *
 * @property {function(number): void} setCurrentSystem
 *   Sets state.player.currentSystem
 * @property {function(Object): void} setCurrentSystemPrices
 *   Sets state.world.currentSystemPrices
 * @property {function(): number} getDaysElapsed
 * @property {function(): Array} getActiveEvents
 * @property {function(): Object} getMarketConditions
 * @property {function(): Object|undefined} getStats
 * @property {function(): Object|undefined} getDockedSystems
 *   Returns: state.world.narrativeEvents.dockedSystems
 * @property {function(number, Object, number, string): void} updatePriceKnowledge
 *   Delegates to TradingManager
 *
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */

/**
 * @typedef {Object} EventEngineCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.world.narrativeEvents (flags, fired, cooldowns)
 *
 * @property {function(): Object} getGameState
 *   Returns: full state (for evaluateCondition)
 *
 * @property {function(string, *): void} emit
 */

// ========================================================================
// BATCH 5: Infrastructure Managers
// ========================================================================

/**
 * @typedef {Object} StateManagerCapabilities
 *
 * @property {function(): number} getPlayerCredits
 * @property {function(number): void} setPlayerCredits
 * @property {function(): number} getPlayerDebt
 * @property {function(number): void} setPlayerDebt
 * @property {function(): number} getShipFuel
 * @property {function(number): void} setShipFuel
 * @property {function(): Array} getShipCargo
 * @property {function(Array): void} setShipCargo
 * @property {function(): number} getShipCargoCapacity
 * @property {function(): Object} getPlayer
 * @property {function(): Object} getShip
 * @property {function(): Array|undefined} getActiveMissions
 * @property {function(): Object} getFullState
 *   Returns: full state for coordinator delegation
 * @property {function(): number} getFuelCapacity
 *   Delegates to ShipManager
 *
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} SaveLoadManagerCapabilities
 *
 * @property {function(): Object} getFullState
 *   Returns: full state for serialization
 * @property {function(Object): Object} restoreState
 *   Delegates to coordinator
 *
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} InitializationCapabilities
 *
 * @property {function(function): Array} assignShipQuirks
 *   Delegates to ShipManager
 * @property {Array} starData
 * @property {boolean} isTestEnvironment
 */
