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
 *   Returns: state.npcs (read-only, for quest stage checks)
 * @property {function(): Object|undefined} getStats
 * @property {function(): Object|undefined} getNarrativeFlags
 *   Returns: state.world.narrativeEvents.flags
 * @property {function(): Array|undefined} getActiveMissions
 *   Returns: state.missions.active
 *
 * @property {function(number): void} updateCredits
 * @property {function(string, number, string): void} modifyRepRaw
 * @property {function(number, string): void} modifyKarma
 * @property {function(string, number): void} removeCargoForMission
 * @property {function(): void} markDirty
 * @property {function(): void} checkAchievements
 * @property {function(string, number): void} updateShipCondition
 *   For quest rewards that repair/damage ship
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */

/**
 * @typedef {Object} DialogueCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.dialogue
 *
 * @property {function(string, *): void} emit
 */

// ========================================================================
// BATCH 3: Moderate Complexity
// ========================================================================

/**
 * @typedef {Object} ShipCapabilities
 *
 * @property {function(): ShipState} getOwnState
 *   Returns: { hull, engine, lifeSupport, quirks, upgrades, cargoCapacity,
 *              hiddenCargo, name }
 *   (Note: fuel and cargo are owned by StateManager, not ShipManager)
 *
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 *   Needed for cargo capacity checks and hidden cargo operations
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
 *   Returns: state.npcs
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
 * @property {Array} npcData
 *   ALL_NPCS reference for NPC validation
 */

/**
 * @typedef {Object} DangerCapabilities
 *
 * @property {function(): DangerState} getOwnState
 *   Returns: { karma: state.player.karma, factions: state.player.factions,
 *              dangerFlags: state.world.dangerFlags }
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
 * @property {function(string, *): void} emit
 */

/**
 * @typedef {Object} InfoBrokerCapabilities
 *
 * @property {function(): InfoBrokerState} getOwnState
 *   Returns: (no owned state — InfoBroker reads world.priceKnowledge and stats)
 *
 * @property {function(): Object} getPriceKnowledge
 *   Returns: state.world.priceKnowledge
 * @property {function(): Array} getActiveEvents
 *   Returns: state.world.activeEvents
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipUpgrades
 * @property {function(): number|undefined} getRumorsPurchased
 *   Returns: state.stats.rumorsPurchased
 *
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {Object} navigationSystem
 */
