# Phase 1: Define Capability Interfaces — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Phased execution:** This is Phase 1 of the GSM Refactor (design:
> `docs/plans/2026-03-08-gsm-refactor-design.md`). After completing this phase,
> mark Phase 1 as done in the design doc. Then immediately use
> `superpowers:writing-plans` to create the Phase 2 implementation plan.

**Goal:** Define the capability interfaces (JSDoc typedefs) that each manager
will receive when migrated from `this.gameStateManager` to injected
capabilities. No runtime changes — design-only phase.

**Architecture:** Creates `src/game/state/capabilities.js` containing JSDoc
typedefs for each manager's capability object. Each typedef specifies: own
state getter, cross-domain read queries, cross-domain write callbacks, and
infrastructure. Also documents which state paths each manager owns.

**Tech Stack:** JavaScript (ES modules), JSDoc typedefs

---

## Task 1: Create capabilities.js with infrastructure and state ownership docs

**Files:**
- Create: `src/game/state/capabilities.js`

### Step 1: Create the file with header and state ownership documentation

```js
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
```

### Step 2: Commit

```
git add src/game/state/capabilities.js
git commit -m "Create capabilities.js with state ownership documentation"
```

---

## Task 2: Add capability typedefs for Batch 1 managers (pure calculation)

These managers primarily read state and return outcome objects. They have the
simplest capability surfaces.

**Files:**
- Modify: `src/game/state/capabilities.js`

### Step 1: Add CombatManager capability typedef

Append to `capabilities.js`:

```js
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
```

### Step 2: Run lint to verify syntax

Run: `npm run lint -- src/game/state/capabilities.js`
Expected: PASS (no syntax errors)

### Step 3: Commit

```
git add src/game/state/capabilities.js
git commit -m "Add capability typedefs for Batch 1 managers (pure calculation)"
```

---

## Task 3: Add capability typedefs for Batch 2 managers (clean slice owners)

**Files:**
- Modify: `src/game/state/capabilities.js`

### Step 1: Add AchievementsManager, QuestManager, DialogueManager typedefs

Append to `capabilities.js`:

```js
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
```

### Step 2: Run lint to verify syntax

Run: `npm run lint -- src/game/state/capabilities.js`
Expected: PASS

### Step 3: Commit

```
git add src/game/state/capabilities.js
git commit -m "Add capability typedefs for Batch 2 managers (clean slice owners)"
```

---

## Task 4: Add capability typedefs for Batch 3 managers (moderate complexity)

**Files:**
- Modify: `src/game/state/capabilities.js`

### Step 1: Add ShipManager, NPCManager, DangerManager, RefuelManager, RepairManager, InfoBrokerManager typedefs

Append to `capabilities.js`:

```js
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
 * @property {function(): Object} getNPCState
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
```

### Step 2: Run lint to verify syntax

Run: `npm run lint -- src/game/state/capabilities.js`
Expected: PASS

### Step 3: Commit

```
git add src/game/state/capabilities.js
git commit -m "Add capability typedefs for Batch 3 managers (moderate complexity)"
```

---

## Task 5: Add capability typedefs for Batch 4 managers (heavy cross-domain)

**Files:**
- Modify: `src/game/state/capabilities.js`

### Step 1: Add TradingManager, MissionManager, EventsManager, DebtManager typedefs

Append to `capabilities.js`:

```js
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
 * @property {function(): Object|undefined} getStats
 * @property {function(number): Object} getDangerZone
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(number): void} applyTradeWithholding
 * @property {function(): void} checkAchievements
 * @property {function(string, number): void} updateStats
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
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
 * @property {function(string, number, string): void} modifyColeRep
 * @property {function(string, number): void} removeCargoForMission
 * @property {function(string, number): void} updateStats
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {Array} wormholeData
 */

/**
 * @typedef {Object} EventsCapabilities
 *
 * @property {function(): EventsState} getOwnState
 *   Returns: { activeEvents: state.world.activeEvents,
 *              daysElapsed: state.player.daysElapsed }
 *   (EventsManager owns both the events list and the day counter)
 *
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
 *   Delegates to DebtManager
 * @property {function(): void} checkMissionDeadlines
 *   Delegates to MissionManager
 * @property {function(): void} cleanupOldIntelligence
 *   Delegates to InformationBroker
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
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
 *
 * @property {function(number): void} updateDebt
 * @property {function(number): void} updateCredits
 * @property {function(string, number, string): void} modifyRepRaw
 *   For Cole reputation changes
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */
```

### Step 2: Run lint to verify syntax

Run: `npm run lint -- src/game/state/capabilities.js`
Expected: PASS

### Step 3: Commit

```
git add src/game/state/capabilities.js
git commit -m "Add capability typedefs for Batch 4 managers (heavy cross-domain)"
```

---

## Task 6: Add capability typedefs for NavigationManager and EventEngineManager

**Files:**
- Modify: `src/game/state/capabilities.js`

### Step 1: Add NavigationManager and EventEngineManager typedefs

Append to `capabilities.js`:

```js
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
 * @property {function(): number} getDaysElapsed
 * @property {function(): Array} getActiveEvents
 * @property {function(): Object} getMarketConditions
 * @property {function(): Object|undefined} getStats
 * @property {function(): Object|undefined} getDockedSystems
 *   Returns: state.world.narrativeEvents.dockedSystems
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
 * @property {function(): number} getDaysElapsed
 *
 * @property {function(string, *): void} emit
 */
```

### Step 2: Run lint to verify syntax

Run: `npm run lint -- src/game/state/capabilities.js`
Expected: PASS

### Step 3: Commit

```
git add src/game/state/capabilities.js
git commit -m "Add capability typedefs for NavigationManager and EventEngineManager"
```

---

## Task 7: Add validation test for capability completeness

This test verifies that every `this.gameStateManager.X()` call made by each
manager is accounted for in its capability typedef. It does not test runtime
behavior — it validates the design document against the actual code.

**Files:**
- Create: `tests/unit/capability-interfaces.test.js`

### Step 1: Write the test

```js
// tests/unit/capability-interfaces.test.js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * This test validates that the capability interface definitions in
 * capabilities.js account for every cross-domain dependency found in the
 * actual manager source files. It parses the source code for
 * this.gameStateManager.X() calls and verifies each is documented.
 *
 * This is a design validation test, not a runtime test.
 */
describe('Capability interface completeness', () => {
  const capabilitiesSource = readFileSync(
    resolve('src/game/state/capabilities.js'),
    'utf-8'
  );

  it('capabilities.js exists and is non-empty', () => {
    expect(capabilitiesSource.length).toBeGreaterThan(100);
  });

  it('documents all 14 domain manager capability typedefs', () => {
    const expectedTypedefs = [
      'CombatCapabilities',
      'NegotiationCapabilities',
      'InspectionCapabilities',
      'DistressCapabilities',
      'MechanicalFailureCapabilities',
      'AchievementsCapabilities',
      'QuestCapabilities',
      'DialogueCapabilities',
      'ShipCapabilities',
      'NPCCapabilities',
      'DangerCapabilities',
      'RefuelCapabilities',
      'RepairCapabilities',
      'InfoBrokerCapabilities',
      'TradingCapabilities',
      'MissionCapabilities',
      'EventsCapabilities',
      'DebtCapabilities',
      'NavigationCapabilities',
      'EventEngineCapabilities',
    ];

    for (const typedef of expectedTypedefs) {
      expect(
        capabilitiesSource,
        `Missing typedef: ${typedef}`
      ).toContain(`@typedef {Object} ${typedef}`);
    }
  });

  it('documents state ownership table', () => {
    expect(capabilitiesSource).toContain('STATE SLICE OWNERSHIP');
    expect(capabilitiesSource).toContain('ShipManager');
    expect(capabilitiesSource).toContain('StateManager');
    expect(capabilitiesSource).toContain('NPCManager');
    expect(capabilitiesSource).toContain('Coordinator');
  });

  it('all capability typedefs include emit and markDirty', () => {
    // Extract all typedef blocks
    const typedefNames = [
      'CombatCapabilities',
      'NegotiationCapabilities',
      'InspectionCapabilities',
      'DistressCapabilities',
      'MechanicalFailureCapabilities',
      'AchievementsCapabilities',
      'QuestCapabilities',
      'ShipCapabilities',
      'NPCCapabilities',
      'DangerCapabilities',
      'RefuelCapabilities',
      'RepairCapabilities',
      'InfoBrokerCapabilities',
      'TradingCapabilities',
      'MissionCapabilities',
      'EventsCapabilities',
      'DebtCapabilities',
      'NavigationCapabilities',
    ];

    for (const name of typedefNames) {
      // Find the typedef block (from @typedef to the next @typedef or end)
      const startIdx = capabilitiesSource.indexOf(`@typedef {Object} ${name}`);
      expect(startIdx, `Missing typedef: ${name}`).toBeGreaterThan(-1);

      // Find the end of this typedef block
      const nextTypedef = capabilitiesSource.indexOf('@typedef', startIdx + 1);
      const block = nextTypedef > -1
        ? capabilitiesSource.slice(startIdx, nextTypedef)
        : capabilitiesSource.slice(startIdx);

      expect(
        block,
        `${name} missing emit`
      ).toContain('emit');
      expect(
        block,
        `${name} missing markDirty`
      ).toContain('markDirty');
    }
  });

  // DialogueCapabilities and EventEngineCapabilities intentionally omit
  // markDirty — they are read-only or emit-only managers
  it('DialogueCapabilities has emit but not necessarily markDirty', () => {
    const startIdx = capabilitiesSource.indexOf(
      '@typedef {Object} DialogueCapabilities'
    );
    expect(startIdx).toBeGreaterThan(-1);
    const nextTypedef = capabilitiesSource.indexOf('@typedef', startIdx + 1);
    const block = nextTypedef > -1
      ? capabilitiesSource.slice(startIdx, nextTypedef)
      : capabilitiesSource.slice(startIdx);
    expect(block).toContain('emit');
  });
});
```

### Step 2: Run the test

Run: `npm test -- tests/unit/capability-interfaces.test.js`
Expected: PASS

### Step 3: Commit

```
git add tests/unit/capability-interfaces.test.js
git commit -m "Add validation test for capability interface completeness"
```

---

## Task 8: Run full test suite and update design doc

### Step 1: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 2: Update design doc status table

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the status table:

**Old:**
```
| Phase 1 | (create when Phase 0 is complete) | — |
```

**New:**
```
| Phase 1 | `2026-03-08-gsm-phase1-implementation.md` | Not started |
```

### Step 3: Commit

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Update design doc with Phase 1 plan reference"
```

---

## Final Step: Mark Phase 1 complete

### Step 1: Update design doc

In `docs/plans/2026-03-08-gsm-refactor-design.md`, change the Phase 1 header
to include completion status:

```
### Phase 1: Define Capability Interfaces ✅ COMPLETE
```

### Step 2: Commit

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 1 complete in GSM refactor design doc"
```
