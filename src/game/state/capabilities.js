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
