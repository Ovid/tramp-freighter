# GameStateManager Refactor: Slice Ownership + Injected Capabilities

**Date:** 2026-03-08
**Status:** Implementation in progress (phased)
**Branch:** Create from `main` when starting implementation

## Implementation Notes

**Phased execution:** Each phase has its own implementation plan in
`docs/plans/`. After completing a phase, mark it done below and use
`superpowers:writing-plans` to create the next phase's implementation plan.

| Phase | Plan file | Status |
|---|---|---|
| Phase 0 | `2026-03-08-gsm-phase0-implementation.md` | Complete |
| Phase 1 | `2026-03-08-gsm-phase1-implementation.md` | Complete |
| Phase 2 | `2026-03-08-gsm-phase2-implementation.md` | Not started |
| Phase 3 | (create when Phase 2 is complete) | — |
| Phase 4 | (create when Phase 3 is complete) | — |
| Phase 5 | (create when Phase 4 is complete) | — |

## Problem Statement

`GameStateManager` (GSM) is a ~1240-line facade over 25 domain managers. It
provides a unified API (~180 methods) but has three architectural problems:

1. **Global mutable state.** Every manager receives the full GSM reference via
   `this` and can access `this.getState()` which returns a raw mutable
   reference to the entire game state object (`base-manager.js:39`). A bug in
   one manager can corrupt any state slice.

2. **Inconsistent mutation contract.** Some facade methods call `markDirty()`
   (e.g., `modifyRep` at GSM:547), some delegate to managers that call it
   internally (e.g., `buyGood` at GSM:822), and some do neither (e.g.,
   `modifyColeRep` at GSM:659). Same inconsistency exists for `emit()`. Both
   external reviewers flagged this as the highest practical bug risk.

3. **No access control.** Any code importing GSM can call any of its ~180
   methods. There is no structural enforcement of domain boundaries.

## Target Architecture

Replace the God Facade with:

### 1. Thin Coordinator (replaces GSM)

Owns the full state object (for serialization/persistence), the event bus,
and the save system. Wires managers together at startup. Is NOT the primary
public API — managers are.

```js
// Coordinator responsibility:
// - Instantiate managers with capability objects
// - Own full state for save/load/migration
// - Provide event bus and persistence
// - Own state.meta, state.preferences, state.stats (shared slices)
```

### 2. State Ownership Model: Views, Not Copies

The coordinator owns the single `this.state` object. Managers receive **getter
functions** that return references to their own slice of that object — not
copies, not separate objects.

```js
// Getter returns a VIEW into the coordinator's state
getTradeState: () => ({
  priceKnowledge: this.state.world.priceKnowledge,
  marketConditions: this.state.world.marketConditions,
  currentSystemPrices: this.state.world.currentSystemPrices,
})
```

This means:
- **Save/load requires no reassembly.** The coordinator serializes `this.state`
  directly, same as today.
- **Managers can mutate their own slice** through the getter's returned
  reference. This is fine — the goal is preventing cross-domain mutation, not
  making state immutable.
- **Stale references are avoided** because getters re-evaluate on each call.
  Managers must call `this.getOwnState()` rather than caching the reference.
- **Managers cannot access other slices** because the getter only exposes their
  owned paths.

### 3. Managers Own Their State Slices

Each manager receives a capability object containing:
- A getter for its own state slice (view into coordinator's state)
- Read-only query callbacks for cross-domain data it needs
- Write callbacks for cross-domain mutations it needs
- Infrastructure (emit, markDirty, starData, etc.)

```js
// Example: TradingManager receives only what it needs
new TradingManager({
  // Own state slice (specific paths, NOT all of state.world)
  getTradeState: () => ({
    priceKnowledge: this.state.world.priceKnowledge,
    marketConditions: this.state.world.marketConditions,
    currentSystemPrices: this.state.world.currentSystemPrices,
  }),

  // Cross-domain READ queries
  getCredits: () => this.state.player.credits,
  getCargoRemaining: () => this.stateManager.getCargoRemaining(),
  getCurrentSystem: () => this.state.player.currentSystem,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getShipCargo: () => this.state.ship.cargo,
  getActiveEvents: () => this.state.world.activeEvents,

  // Cross-domain WRITE callbacks
  deductCredits: (amount) => this.stateManager.deductCredits(amount),
  addCredits: (amount) => this.stateManager.addCredits(amount),
  updateCargo: (cargo) => this.stateManager.updateCargo(cargo),
  applyTradeWithholding: (amt) => this.debtManager.applyWithholding(amt),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  updateStats: (key, delta) => this.updateStats(key, delta),

  // Infrastructure
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  starData: this.starData,
});
```

### 4. React Layer Stays the Same

`useGameAction` and `useGameEvent` continue to work identically. Internally
they call the coordinator instead of GSM. ~350 lines of changes in hooks.

## Design Decisions

### Why injected callbacks (not events or shared services)?

Three options were evaluated for cross-domain writes:

1. **Injected mutation callbacks** — each manager gets specific functions like
   `deductCredits(amount)` injected at construction.
2. **Command/event pattern** — managers emit mutation requests, coordinator
   applies them.
3. **Shared services** — extract cross-cutting mutations into importable
   service classes.

**Decision: Option 1 (injected callbacks).**

- Best debuggability: stack traces show `TradingManager.buyGood() →
  deductCredits() → StateManager.setCredits()`. Events break the call stack.
- Most maintainable: adding a new cross-domain write = add callback to
  capability object. No new abstractions.
- Only ~18 distinct cross-domain write operations exist (see matrix below).
  The wiring is manageable.

### Why not just narrow the interface (Option B)?

If the capability object includes `getState()` returning the raw object, any
manager can still mutate anything. Option B only narrows the API surface, not
the mutation surface. It converges toward Option C (slice ownership) the
moment you take mutation safety seriously.

### What happens to BaseManager?

**Decision: Remove BaseManager.** Currently it provides `getState()`, `emit()`,
`getStarData()`, `getWormholeData()`, `getNavigationSystem()`, and logging
methods. With capability injection:

- `getState()` → replaced by `this.capabilities.getOwnState()` (own slice only)
- `emit()` → replaced by `this.capabilities.emit()`
- `getStarData()` etc. → replaced by `this.capabilities.starData` etc.
- Logging methods → import `devLog` directly (already available as utility)

Each manager stores its capability object in `this.capabilities` (or
destructures it) and accesses everything through that. No base class needed.

**Migration note:** During Phase 3, BaseManager must support both old-style
managers (that still use `this.gameStateManager`) and new-style managers (that
use capabilities). See Phase 3 for the dual-mode approach.

### What happens to StateManager?

**Decision: StateManager stays as a class, owned by the coordinator.** It
provides the implementation behind the core mutation callbacks (`updateCredits`,
`updateFuel`, `updateCargo`, `getCargoRemaining`). The coordinator wraps
StateManager methods as the injected callbacks that other managers receive.

StateManager is not a domain manager in the same sense as TradingManager or
ShipManager. It is infrastructure — it implements the shared mutation
primitives. It stays internal to the coordinator and is not exposed to
consumers.

## Current State Slice Ownership

Analysis confirmed these boundaries are already mostly clean, but two top-level
keys (`state.player` and `state.world`) are shared across multiple managers:

| Manager | Owns | State paths |
|---|---|---|
| ShipManager | Ship systems | `ship.hull`, `ship.engine`, `ship.lifeSupport`, `ship.quirks`, `ship.upgrades`, `ship.cargoCapacity`, `ship.hiddenCargo`, `ship.name` |
| StateManager | Core mutations (infra) | `ship.fuel`, `ship.cargo`, `player.credits` (mutation primitives, not domain ownership) |
| NPCManager | NPC relationships | `npcs.*` |
| TradingManager | Markets/prices | `world.priceKnowledge`, `world.marketConditions`, `world.currentSystemPrices` |
| DangerManager | Karma/factions/danger | `player.karma`, `player.factions`, `world.dangerFlags` |
| NavigationManager | Location/exploration | `player.currentSystem`, `world.visitedSystems` |
| MissionManager | Missions | `missions.*` |
| QuestManager | Quests | `quests.*` |
| DebtManager | Debt/finance | `player.debt`, `player.finance` |
| AchievementsManager | Achievements | `achievements.*` |
| EventsManager | Economic events / time | `world.activeEvents`, `player.daysElapsed` |
| EventEngineManager | Narrative engine state | `world.narrativeEvents.*` (flags, fired events, cooldowns) |
| DialogueManager | Dialogue state | `dialogue.*` |
| Coordinator (direct) | Metadata/prefs/stats | `meta.*`, `preferences.*`, `stats.*` |

### Shared top-level keys

**`state.player`** is fragmented across 5 managers:
- `player.credits` → StateManager (mutation primitive)
- `player.karma`, `player.factions` → DangerManager
- `player.currentSystem` → NavigationManager
- `player.daysElapsed` → EventsManager
- `player.debt`, `player.finance` → DebtManager

**`state.world`** is fragmented across 5 managers:
- `world.priceKnowledge`, `world.marketConditions`, `world.currentSystemPrices` → TradingManager
- `world.activeEvents` → EventsManager
- `world.narrativeEvents.*` → EventEngineManager
- `world.visitedSystems` → NavigationManager
- `world.dangerFlags` → DangerManager

**`state.ship`** is split between 2:
- `ship.fuel`, `ship.cargo` → StateManager (mutation primitives)
- Everything else → ShipManager

Each manager's getter function returns ONLY its specific paths from these
shared keys, not the entire `player`/`world`/`ship` object.

**`state.stats`** is written by 5+ managers (Trading, Navigation, NPC, Mission,
Quest) and read by AchievementsManager. It is **coordinator-owned** — managers
receive an `updateStats(key, delta)` callback to increment stat counters. The
coordinator applies the mutation to `state.stats` and calls `markDirty()`.

## Cross-Domain Dependency Matrix

### Cross-Domain Write Operations (~18 total)

These are the injected callbacks that managers need:

| Operation | Used by managers | Owner |
|---|---|---|
| `deductCredits(amount)` | Trading, Ship, Refuel, Repair, NPC, Mission, Quest, Debt | StateManager |
| `addCredits(amount)` | Trading, Ship, Refuel, Repair, NPC, Mission, Quest, Debt | StateManager |
| `updateCargo(cargo)` | Trading, NPC, Mission, Danger | StateManager |
| `updateFuel(amount)` | Refuel, Combat outcomes | StateManager |
| `updateDebt(amount)` | Debt | StateManager |
| `emit(event, data)` | All 14 mutating managers | EventSystemManager |
| `markDirty()` | All 13 persisting managers | SaveLoadManager |
| `modifyKarma(amount, reason)` | NPC, Mission, Quest | DangerManager |
| `modifyFactionRep(faction, amt, reason)` | Mission, Debt | DangerManager |
| `updateShipCondition(hull, engine, ls)` | Repair, Combat outcomes | ShipManager |
| `incrementDangerFlag(flag)` | Combat, Negotiation, Inspection, Distress, Danger | DangerManager |
| `checkAchievements()` | Trading, Navigation, NPC, Quest, Danger | AchievementsManager |
| `applyTradeWithholding(amount)` | Trading, Mission | DebtManager |
| `modifyRepRaw(npcId, amt, reason)` | Debt, Quest | NPCManager |
| `removeCargoForMission(goodType, qty)` | Mission, Quest | ShipManager |
| `addToCargoArray(cargoArray, src, qty)` | NPC (cargo retrieval) | ShipManager |
| `advanceTime(days)` | Repair (emergency patch penalty) | EventsManager |
| `updateStats(key, delta)` | Trading, Navigation, NPC, Mission, Quest | Coordinator |

### Cross-Domain Read Queries

| Query | Used by managers | Returns |
|---|---|---|
| `getCredits()` | Trading, Refuel, Repair, NPC, Debt, Quest | number |
| `getCargoRemaining()` | Trading, NPC, Mission | number |
| `getCurrentSystem()` | Trading, Navigation, many encounter managers | string |
| `getDaysElapsed()` | Nearly all managers | number |
| `getShipCargo()` | Trading, NPC, Mission, Danger, Combat, Inspection | array |
| `getShipHiddenCargo()` | Inspection | array |
| `getShipCondition()` | Combat, MechanicalFailure, Repair | object |
| `getShipQuirks()` | Combat, NPC, MechanicalFailure | array |
| `getShipUpgrades()` | Combat, Danger, InfoBroker, Ship | array |
| `getFuelCapacity()` | Refuel, StateManager | number |
| `getDangerZone(systemId)` | Inspection, Mission | object |
| `getFactionRep(faction)` | Mission | number |
| `getActiveEvents()` | InfoBroker | array |
| `getActiveMissions()` | Negotiation (kidnap logic) | array |
| `getNarrativeFlags()` | Quest (stage requirements) | object |

### Critical Orchestration: EventsManager.updateTime()

`events.js:79-116` — This method orchestrates time advancement across 6
managers. It is the single most complex cross-domain coordination point:

```
EventsManager.updateTime(newDays) calls:
  ├─ TradingManager.incrementPriceKnowledgeStaleness(daysPassed)  [line 89]
  ├─ InformationBroker.cleanupOldIntelligence()                   [line 92]
  ├─ TradingManager.applyMarketRecovery(daysPassed)               [line 95]
  ├─ Direct mutation: state.world.activeEvents = ...              [line 98]
  ├─ TradingManager.recalculatePricesForKnownSystems()            [line 101]
  ├─ NPCManager.checkLoanDefaults()                               [line 104]
  ├─ DebtManager.processDebtTick()                                 [line 107]
  └─ MissionManager.checkMissionDeadlines()                        [line 109]
```

This must be migrated carefully in Phase 3 Batch 4. The injected capability
object for EventsManager will need callbacks for each of these operations.

### Additional cross-domain call: RepairManager.applyEmergencyPatch()

`repair.js:175` — calls `this.gameStateManager.updateTime()` to apply a time
penalty. This means RepairManager needs an `advanceTime(days)` callback
injected. This is the only manager outside EventsManager that triggers time
advancement.

## Bugs Found During Analysis

### Bug 1: Missing markDirty() in npc.js getFreeRepair()

`npc.js:925-995` — The `getFreeRepair()` method mutates `state.ship.hull`
(line 981) and NPC state (lines 970, 973, 974) but never calls `markDirty()`.
Free repairs granted through the NPC path may not persist to save.

**Also:** It directly mutates `state.ship.hull = newHullCondition` instead of
using `updateShipCondition()`. This is a cross-domain mutation that bypasses
the ship state owner.

### Bug 2: Free repair code duplication

Free repair logic is duplicated between:
- `repair.js:301-428` (`canGetFreeRepair`, `applyFreeRepair`)
- `npc.js:857-995` (`canGetFreeRepair`, `getFreeRepair`)

The repair.js version calls `markDirty()`. The npc.js version does not.
Consolidate into RepairManager during Phase 0.

### Bug 3: Inconsistent markDirty/emit at facade level

GSM facade methods that add side effects after delegation (should be
resolved by making managers own their own side effects):

| Method | Line | markDirty? | emit? | Notes |
|---|---|---|---|---|
| `modifyRep()` | 547-550 | Yes | No | |
| `modifyRepRaw()` | 552-555 | Yes | No | |
| `setNpcRep()` | 557-561 | Yes | Yes (NPCS_CHANGED) | |
| `getTip()` | 745-751 | Conditional | No | |
| `requestLoan()` | 769-775 | Conditional | No | |
| `repayLoan()` | 777-783 | Conditional | No | |
| `checkLoanDefaults()` | 785-788 | Yes | No | |
| `storeCargo()` | 790-796 | Conditional | No | |
| `retrieveCargo()` | 798-804 | Conditional | No | |
| `setKarma()` | 986-989 | Yes | No | |
| `modifyKarma()` | 991-994 | Yes | No | |
| `setFactionRep()` | 1000-1003 | Yes | No | |
| `modifyFactionRep()` | 1005-1008 | Yes | No | |
| `setPreference()` | 704-711 | Yes | Yes (PREFERENCES_CHANGED) | Also directly mutates state |
| `markVictory()` | 1229-1235 | Yes | No | Also directly mutates state.meta.victory |
| `devTeleport()` | 1237-1240 | Yes | No | |

Pure pass-throughs where managers handle their own side effects:
`buyGood` (822), `sellGood` (826), `refuel` (847), `repairShipSystem` (863),
`acceptMission` (1121), `completeMission` (1125), `advanceQuest` (583).

## React Integration (Minimal Changes Required)

### Current Architecture

- `main.jsx` instantiates GSM with `new GameStateManager(starData, wormholeData, nav)`
- `GameContext.jsx` provides GSM to all components via React Context
- `useGameAction.js` returns ~75 GSM methods as a flat memoized object
- `useGameEvent.js` subscribes to GSM events, extracts state
- ~10 components also use `useGameState()` for direct GSM access
- 6 additional hooks access GSM: `useDialogue`, `useDangerZone`,
  `useEncounterProbabilities`, `useAnimationLock`, `useEventTriggers`,
  `useJumpValidation`, `useStarData`

### Migration Plan

1. `GameContext` swaps to provide the coordinator
2. `useGameAction` methods delegate to coordinator instead of GSM
3. Components with direct `useGameState()` access update to coordinator
4. No component-level changes needed — the hooks abstract the source

**Total estimated change: ~350 lines across hooks and context.**

The flat `useGameAction` structure stays. Splitting into domain-specific hooks
(useTradeActions, useShipActions, etc.) was evaluated and rejected — it would
fragment 40+ components without meaningful benefit at this scale.

## Implementation Phases

### Phase 0: Preparatory Cleanup ✅ COMPLETE

**Goal:** Remove landmines before restructuring. Zero architectural change.

**Tasks:**

0.1. **Fix the mutation contract.** Adopt "managers own their own side
effects" consistently. Move `markDirty()` and `emit()` calls from the GSM
facade into the managers that do the actual mutation. The facade becomes pure
pass-through for all methods. This affects the ~16 facade methods listed in
the bugs section above.

Concretely: for each method in the Bug 3 table, move the `markDirty()` and/or
`emit()` call into the underlying manager method. For example, `modifyRep()`
at GSM:547 currently calls `npcManager.modifyRep()` then `this.markDirty()`.
After this change, `NPCManager.modifyRep()` itself calls `markDirty()` at the
end, and the GSM facade becomes a pure pass-through.

**Exceptions:** `setPreference()` and `markVictory()` mutate coordinator-owned
state (`preferences`, `meta.victory`) — there is no domain manager to delegate
to. These stay as non-pass-through methods on the facade/coordinator. They
become coordinator-owned methods in Phase 2.

0.2. **Fix free repair bugs.** Consolidate free repair into RepairManager.
Remove duplicate from NPCManager. Add missing `markDirty()` call. Replace
direct `state.ship.hull = ...` with `updateShipCondition()`.

0.3. **Extract migration registry.** Replace the sequential `if` chain in
`_applyMigrations()` (GSM:251-271) with a table-driven registry:
```js
const MIGRATIONS = [
  ['1.0.0', migrateFromV1ToV2],
  ['2.0.0', migrateFromV2ToV2_1],
  ['2.1.0', migrateFromV2_1ToV4],
  ['4.0.0', migrateFromV4ToV4_1],
  ['4.1.0', migrateFromV4_1ToV5],
];
```

0.4. **Move `beforeunload` handler out of GSM constructor.** Move to
`main.jsx` where the GSM is instantiated. GSM should expose `flushSave()`
but not register browser events.

**Tests:** Full test suite must pass after each task. No new tests needed
beyond existing coverage.

### Phase 1: Define Capability Interfaces ✅ COMPLETE

**Goal:** Design the contracts before changing any manager code.

**Tasks:**

1.1. Create `src/game/state/capabilities.js` defining the capability
interfaces as JSDoc typedefs. One typedef per manager specifying exactly which
cross-domain reads, writes, and infrastructure it receives.

1.2. Document the state slice boundaries in the same file. Make explicit which
manager owns which state paths (matching the ownership table in this document).

**No runtime changes. Design-only phase.**

### Phase 2: Build the Coordinator

**Goal:** Create the new wiring layer alongside the existing GSM.

**Tasks:**

2.1. Create `src/game/state/game-coordinator.js`. It:
- Holds full state object (single source of truth for serialization)
- Holds event bus (EventSystemManager)
- Holds persistence (SaveLoadManager)
- Holds StateManager (core mutation primitives)
- Initially instantiates managers the old way (passing `this`), identical to
  how GSM does it today. Phase 3 switches managers to capability objects one
  at a time.
- Owns `state.meta`, `state.preferences`, `state.stats` directly
- Exposes the same public API as GSM (for backward compatibility)

2.2. Keep GSM as a thin wrapper around the coordinator during migration:
```js
// Temporary compatibility - GSM delegates to coordinator
export class GameStateManager {
  constructor(starData, wormholeData, nav) {
    this.coordinator = new GameCoordinator(starData, wormholeData, nav);
  }
  buyGood(...args) { return this.coordinator.buyGood(...args); }
  // ...etc
}
```

2.3. Both paths work simultaneously. Existing tests pass without changes.

**Key decision:** The coordinator still has a large public API surface. That's
intentional — the goal is slice ownership and mutation safety, not API
reduction. API grouping (game.ship.X, game.trading.Y) is a separate concern
that can be addressed later if desired.

### Phase 3: Migrate Managers (One at a Time)

**Goal:** Change each manager from receiving `this` (full GSM) to receiving a
capability object with only its dependencies.

#### Dual-mode migration strategy

During this phase, some managers will be migrated (new-style, capability
objects) while others remain unmigrated (old-style, receive `this`). To
support both simultaneously:

1. **Refactor BaseManager to support both modes.** Add a constructor check:
   if the argument is a capability object (plain object), store it as
   `this.capabilities`. If it's a GameStateManager/Coordinator instance,
   use the legacy path. This lets migrated and unmigrated managers coexist.

2. **Migrate one manager at a time.** After each migration, run the full test
   suite. If it fails, revert just that manager.

3. **Once all managers are migrated (end of Batch 5), remove the legacy path
   from BaseManager.** Then remove BaseManager entirely in Phase 5, since
   managers no longer need a shared base class.

#### Migration per manager:
1. Define its capability typedef in `capabilities.js` (if not already done)
2. Update the coordinator to pass a capability object instead of `this`
3. Change the manager constructor to accept and store capabilities
4. Replace `this.gameStateManager.X()` with `this.capabilities.X()`
5. Replace `this.getState()` with `this.capabilities.getOwnState()`
6. Replace cross-domain state reads with injected query callbacks
7. Run tests, ensure green

**Batch 1 — Pure calculation managers (lowest risk):**
- CombatManager — returns outcome objects, barely mutates
- NegotiationManager — returns outcome objects
- InspectionManager — returns outcome objects
- DistressManager — returns outcome objects
- MechanicalFailureManager — returns outcome objects

These managers primarily read state and return results. Their capability
objects will be mostly read queries + `incrementDangerFlag`.

**Batch 2 — Clean slice owners (moderate risk):**
- AchievementsManager — owns `state.achievements`, reads broadly but writes narrowly
- QuestManager — owns `state.quests`, has cross-domain writes (credits, karma, rep)
- DialogueManager — owns `state.dialogue`, touches NPC state

**Batch 3 — Moderate complexity:**
- ShipManager — owns `state.ship`, needs `deductCredits` callback
- NPCManager — owns `state.npcs`, needs credits/karma/cargo callbacks
- DangerManager — owns karma/factions/dangerFlags
- RefuelManager — needs credits/fuel callbacks
- RepairManager — needs credits/shipCondition callbacks, `advanceTime` callback
- InfoBrokerManager — needs credits/priceKnowledge callbacks

**Batch 4 — Heavy cross-domain (highest risk):**
- TradingManager — reads cargo/credits/system, writes market state, calls
  debt withholding
- MissionManager — most cross-domain dependencies of any manager (reads from
  danger, cargo, navigation; writes to credits, karma, faction rep, NPC rep,
  Cole rep, cargo)
- EventsManager — orchestrates updateTime() across 6 managers
- DebtManager — coupled to trading revenue and NPC reputation

**Batch 5 — Infrastructure:**
- StateManager — stays as coordinator-internal class, not a domain manager.
  Update its constructor to accept capabilities like other managers, but it
  remains owned by (and only accessible to) the coordinator.
- SaveLoadManager — stays as coordinator's persistence layer
- EventSystemManager — stays as coordinator's event bus
- InitializationManager — stays as coordinator's initialization logic
- BaseManager — remove the legacy code path, then delete the file

### Phase 4: Update React Layer

**Goal:** Swap context provider from GSM to coordinator.

**Tasks:**

4.1. Update `main.jsx` to instantiate coordinator directly
4.2. Update `GameContext.jsx` to provide coordinator
4.3. Update `useGameAction.js` method references
4.4. Update `useGameEvent.js` subscription calls
4.5. Update ~10 components with direct `useGameState()` access
4.6. Update 6 domain-specific hooks (`useDialogue`, `useDangerZone`,
     `useEncounterProbabilities`, `useEventTriggers`, `useJumpValidation`,
     `useStarData`)

### Phase 5: Remove GameStateManager

**Goal:** Delete the compatibility wrapper.

BaseManager was already deleted at the end of Phase 3 Batch 5.

**Tasks:**

5.1. Remove `src/game/state/game-state-manager.js`
5.2. Update any remaining test files that reference GSM directly
5.3. Final test pass

## Risk Assessment

### Highest Risk Areas

1. **EventsManager.updateTime() migration** (Phase 3, Batch 4) — Orchestrates
   6 cross-manager calls in sequence. All time-based state must stay
   consistent. Test thoroughly with integration tests covering time
   advancement.

2. **Stale slice references on load** — Managers must call getter functions
   on each access, not cache the returned reference. If a manager does
   `const state = this.capabilities.getOwnState()` at the top of a method
   and uses it throughout, that's fine (single call-site, fresh reference).
   But storing it as `this.myState = caps.getOwnState()` in the constructor
   would go stale on save/load. Code review should watch for this pattern.

3. **MissionManager's broad dependencies** — This manager reads from danger
   zones, cargo, navigation, and writes to credits, karma, faction rep, NPC
   rep, Cole rep, and cargo. Its capability object will be the largest. Accept
   this rather than trying to artificially shrink it.

4. **Dual-mode BaseManager during Phase 3** — While both old-style and
   new-style managers coexist, BaseManager must support both. This is
   temporary complexity removed at the end of Phase 3.

### Mitigations

- **Each phase is independently shippable.** Phase 0 alone improves the
  codebase. You can stop after any phase.
- **Each manager migration is independent.** If one migration causes
  problems, revert just that manager.
- **The compatibility wrapper (Phase 2)** means the old API continues to work
  during migration. No big-bang cutover.
- **Existing tests cover behavior.** The refactor changes structure, not
  behavior. Tests should pass at every step.
- **No save/load reassembly needed.** The coordinator owns the full state
  object. Manager getters are views into it, not copies. Save/load works
  exactly as before — serialize/deserialize `this.state`.

## What This Does NOT Address

- **API surface reduction** — The coordinator still exposes ~180 methods.
  Grouping into sub-APIs (game.ship.X, game.trading.Y) is a separate
  concern.
- **State immutability** — Managers still mutate their own slice directly.
  Making state immutable (copy-on-write, immer, etc.) is a separate concern
  that could be layered on after this refactor.
- **`_emitAllStateEvents()` brittleness** — This method remains but becomes
  a natural candidate for replacement with manager-specific `emitSnapshot()`
  methods once managers own their slices. Not in scope for this refactor.
- **`isTestEnvironment` flag** — Minor smell, not worth addressing in this
  refactor.

## Files Reference

### Core files to modify
- `src/game/state/game-state-manager.js` (1242 lines) — shrink then remove
- `src/game/state/managers/base-manager.js` — add dual-mode support then remove
- All 25 manager files in `src/game/state/managers/`
- `src/main.jsx` — instantiation + beforeunload handler
- `src/context/GameContext.jsx` — context provider
- `src/hooks/useGameAction.js` — action delegation
- `src/hooks/useGameEvent.js` — event subscription

### New files to create
- `src/game/state/game-coordinator.js` — new composition root
- `src/game/state/capabilities.js` — capability interface definitions (JSDoc)

### Files to delete
- `src/game/state/managers/base-manager.js` (end of Phase 3)
- `src/game/state/game-state-manager.js` (Phase 5)

### Test files
- `tests/unit/` — existing tests continue to validate behavior
- Add integration tests for save/load round-trip after Phase 3
