# Architecture Review Responses

Response to external architectural review conducted against the Tramp Freighter Blues codebase. Each of the 12 concerns is evaluated against what the code actually does, with a verdict of **Agree**, **Partially Agree**, or **Disagree**, followed by recommended action (if any).

---

## 1. Global singleton, imperative GameStateManager

**Verdict: Partially Agree**

The reviewer describes "a single GameStateManager instance (singleton) that many modules and UI components call via getState() and direct methods." This is half-right.

**What the code actually does:** GameStateManager is instantiated once in `main.jsx` (lines 56-86) and provided to the React tree via `GameContext` — a standard React Context provider. Components access it through the Bridge Pattern hooks (`useGameEvent`, `useGameAction`), not by importing a global. There is no `getInstance()` static method or module-level export that arbitrary code reaches for.

**Where it's accurate:** It IS a single mutable object. The 15+ managers all hold a reference to it and mutate its internals. Within the game engine layer, this creates a hub of implicit dependencies.

**Where it's wrong:** Calling this "tight coupling" at the component level mischaracterizes the architecture. A grep for direct `getState()` calls in `src/features/` finds exactly 2 violations: one utility function (`applyEncounterOutcome.js:15`) and one dev-only panel (`DevAdminPanel.jsx`). The other 158+ usages of game state in feature components go through the Bridge Pattern hooks. The reviewer appears to have missed this mediation layer entirely.

**Action:** Low priority. The singleton-via-context pattern is working. The two `getState()` violations are minor — `applyEncounterOutcome` is a non-React utility doing a one-time state read, which is reasonable. No architectural change needed; documenting the Bridge Pattern constraint more explicitly would help future contributors.

---

## 2. Direct in-place mutation of nested state

**Verdict: Agree**

The codebase mutates nested state extensively and unapologetically:
- `state.player.credits = newCredits` (state.js:101)
- `state.missions.active.push(activeMission)` (mission.js:58)
- `stack.qty -= quantity` (trading.js:109)
- `state.world.marketConditions[systemId][goodType] += quantityDelta` (trading.js:170-180)

Every manager does this. There is no immutable update discipline, no Immer, no reducer pattern. The inconsistency shows up in emission: `missionsChanged` requires a spread (`{ ...state.missions }`) to trigger React re-renders because of reference equality, while scalar values like credits emit fine without it. This is a known footgun documented in project memory.

**Action:** Medium priority. The current approach works but creates a class of bugs where a mutation happens without an emit, or an emit fires the same reference. Two practical mitigations:
1. Freeze state in dev mode (`Object.freeze` on state tree after each emit cycle) to catch mutations outside the manager layer.
2. Standardize the emit-after-mutate pattern — every state-changing method should always emit with a new reference.

Full immutability (Immer or reducer pattern) would be a large refactor for marginal benefit in a single-player game. Not recommended unless the mutation-without-emit bug class becomes frequent.

---

## 3. Tight coupling between imperative managers and React UI

**Verdict: Disagree**

The reviewer claims "React components and hooks call GameStateManager methods directly" and that "UI code frequently relies on the internal shape of state." This does not match the codebase.

**Evidence:**
- `useGameEvent(eventName)` abstracts subscription/unsubscription/state extraction (useGameEvent.js:28-52). Components receive derived values, not raw state references.
- `useGameAction()` returns a stable `useMemo`-wrapped object of action methods (useGameAction.js:27-266). Components call `buyGood()`, not `gameStateManager.tradingManager.executeTrade()`.
- Auto-cleanup on unmount is built into the hook (useGameEvent.js:42-49).
- 158+ hook usages across features vs. 2 direct `getState()` calls.

The Bridge Pattern is exactly the "adapter that exposes selectors + action APIs" the reviewer recommends in their mitigations section. It already exists.

**Action:** None. The architecture already implements the reviewer's own recommendation.

---

## 4. Event-bus / event-emitter anti-patterns and "stringly-typed" events

**Verdict: Partially Agree**

**Where it's accurate:** Events are string-typed. The 27 event names are plain strings in an object literal (event-system.js:17-45). A typo in an event name produces a runtime warning, not a compile-time error.

**Where it's wrong:** The reviewer claims "little visible lifecycle management for subscriptions" and raises "risk of leaks, duplicate handlers." This is incorrect:
- `useGameEvent` auto-unsubscribes on unmount (useGameEvent.js:46-48).
- `unsubscribe` uses `indexOf` + `splice` to remove exact callback references (event-system.js:93-102).
- Emit errors are caught per-subscriber to prevent cascade failures (event-system.js:119).

There is no evidence of memory leaks or duplicate handler registration in the codebase. The lifecycle management exists and works.

**Action:** Low priority. Creating an `EVENTS` constant object (e.g., `EVENTS.CREDITS_CHANGED = 'creditsChanged'`) would give autocomplete and catch typos at the call site. This is a small quality-of-life improvement, not an architectural fix.

---

## 5. Mixed responsibilities and duplicated logic

**Verdict: Partially Agree**

**Where it's accurate:** `useEventTriggers.js` (267 lines) contains business logic that arguably belongs in a manager — `determineThreatLevel()`, `determineInspectionSeverity()`, and `buildJumpContext()` are game logic functions living inside a React hook.

**Where it's wrong:** The reviewer claims "event eligibility and encounter generation logic are split between EventEngine, DangerManager, and hooks, duplicating responsibilities and risking divergence." Verification shows these are complementary, not duplicated:
- `EventEngine` (event-engine.js:145 lines) handles narrative event eligibility and priority.
- `DangerManager` (danger.js:1839 lines) handles encounter probability calculation and combat resolution.
- `useEventTriggers` hooks them together at the React subscription level.

No duplicated calculations were found — each layer does different work.

**Action:** Low priority. `useEventTriggers` could be cleaned up by extracting `determineThreatLevel()` and `determineInspectionSeverity()` into a utility or the DangerManager. But this is code organization, not an architectural flaw.

---

## 6. Side effects mixed into core logic (saving, emitting, I/O)

**Verdict: Agree**

This is real and pervasive. 22 `saveGame()` calls are scattered across 9 manager files:
- trading.js: 3 calls
- ship.js: 7 calls
- repair.js: 4 calls
- mission.js: 3 calls
- navigation.js: 2 calls
- refuel.js, info-broker.js, events.js: 1 each

Every transactional method follows the same pattern: mutate state, emit event, call `saveGame()`. This makes it impossible to test business logic without triggering persistence and event emission.

One concrete bug risk: in navigation.js (dock), a mutation to `dockedSystems` happens *after* `saveGame()` (lines 118-128), meaning that mutation could be lost if the game reloads before the next save.

**Action:** Medium priority. Two practical improvements:
1. **Batch saves:** Replace per-method `saveGame()` calls with a debounced auto-save (e.g., save on a 500ms trailing timer after the last state change). This also improves performance.
2. **Extract pure logic:** For the most critical managers (trading, missions), extract pure calculation functions that return "what should change" as data, separate from the methods that apply those changes + emit + save. This enables unit testing the logic without mocking persistence.

**Status:** Implemented 2026-02-23. Replaced scattered saveGame() calls with markDirty() trailing debounce (500ms).

---

## 7. Inconsistent randomness and ID generation

**Verdict: Agree**

**Randomness:** The codebase has `SeededRandom` (seeded-random.js) with a proper LCG implementation, and it's used correctly in mission generation, NPC tips, and economic events. But combat-critical paths use raw `Math.random()`:
- App.jsx:240 — negotiation resolution
- useEventTriggers.js:39,44 — mechanical failure and distress checks
- game-state-manager.js:734 — encounter resolution
- danger.js:416 — combat choice resolution

This means encounter outcomes are NOT reproducible across save/load, while mission boards ARE. Inconsistent.

**ID Generation:** `Date.now()` is the primary ID generator for encounters (useEventTriggers.js:77,88,99; danger.js:1459). Millisecond-resolution timestamps have theoretical collision risk. Mission generator mitigates this with an RNG suffix (`${Date.now()}_${Math.floor(rng() * 10000)}`), but encounter IDs don't.

**Action:** Medium priority. Replace `Math.random()` in combat/encounter paths with the existing `SeededRandom`, seeded from game day + system + encounter type. This makes testing deterministic and save/load consistent. For IDs, adopt the mission generator's hybrid pattern (`Date.now()_random`) everywhere, or use a simple incrementing counter on the game state.

**Status:** Implemented 2026-02-23. Math.random() replaced with SeededRandom in all gameplay paths. Seeds: gameDay_systemId_encounterType.

---

## 8. Large "god" managers with low cohesion

**Verdict: Partially Agree**

Manager sizes (lines):
| Manager | Lines | Assessment |
|---------|-------|------------|
| danger.js | 1,839 | God object — 8 distinct responsibilities |
| npc.js | 972 | Large but cohesive (all NPC interactions) |
| ship.js | 719 | Reasonable — ship state management |
| mission.js | 562 | Reasonable |
| trading.js | 504 | Reasonable |
| repair.js | 418 | Reasonable |
| All others | <280 | Fine |

**DangerManager is the real problem.** It handles: danger zone classification, karma system, pirate encounter probability, combat resolution (~400 lines), negotiation system (~250 lines), inspection system (~180 lines), distress calls (~120 lines), and mechanical failures (~250 lines). That's 8 responsibilities in one file.

**The other managers are fine.** NPCManager at 972 lines is large but cohesive — it's all NPC interaction logic. The reviewer's blanket statement about "large god managers" (plural) overstates the problem. It's really one manager.

**Action:** Medium priority. Split DangerManager into focused modules: `CombatResolver`, `NegotiationSystem`, `InspectionSystem`, `MechanicalFailureSystem`, with DangerManager as a thin coordinator. The other managers don't need splitting.

**Status:** Implemented 2026-02-23. DangerManager split into CombatManager, NegotiationManager, InspectionManager, DistressManager, MechanicalFailureManager. Slimmed DangerManager retains zones, karma, faction rep (~280 lines). Shared calculateKarmaModifier extracted to danger-utils.js.

---

## 9. Data-with-behavior anti-pattern (dialogue trees)

**Verdict: Disagree**

The reviewer claims embedding functions in dialogue trees "makes serialization, validation, localization, and testing harder." This misunderstands the design intent.

**What the code does:** Dialogue trees use functions for two things:
1. **Dynamic text** — `text: (rep, gameStateManager) => { ... }` generates reputation-responsive dialogue (e.g., wei-chen.js:32-63). A friendly NPC greets you differently at rep 5 vs. rep -3, with karma-based first impressions.
2. **Conditional choices** — `condition: (rep, gameStateManager, npcId) => { ... }` gates reputation-locked options (wei-chen.js:72-77).

**Why functions are the right choice here:**
- These functions are **pure** — they read state and return strings/booleans. No side effects.
- Dialogue trees are **never serialized** — they're static data loaded at module import time. Save/load persists NPC reputation, not dialogue state.
- A declarative alternative (e.g., `{ minRep: 5, text: "Hello friend" }`) would require a custom expression language for the karma-based text composition logic, which would be more complex and less readable than plain JavaScript functions.
- Localization is not a current or planned requirement for this game.

The reviewer applied a general-purpose heuristic ("don't embed functions in data") without checking whether the concerns (serialization, localization) actually apply here. They don't.

**Action:** None.

---

## 10. Imperative Three.js integration risk

**Verdict: Disagree**

The reviewer warns of "lifecycle and synchronization issues if scene mutation is mixed with React renders without a clear adapter layer." The codebase handles this well.

**Evidence:**
- All Three.js code is isolated in `src/game/engine/` (5 files: scene.js, stars.js, wormholes.js, interaction.js, game-animation.js).
- `StarMapCanvas.jsx` is the **sole integration point** between React and Three.js.
- Scene initialization happens once in a `useEffect` with empty deps (StarMapCanvas.jsx:382), guarded against double-init (line 108).
- Three.js objects are stored in refs, not state — mutations to the scene never trigger React re-renders.
- Synchronization is event-driven: `useGameEvent('fuelChanged')` triggers `updateConnectionColors()` (StarMapCanvas.jsx:88-92).
- Resource cleanup is thorough: animation frames cancelled, event listeners removed, Three.js scene traversed and disposed on unmount (lines 338-375).
- Performance is optimized: material caching (stars.js:8), shared textures, pre-allocated Vector3 objects to prevent GC during 60fps animation (game-animation.js:317-330).

The reviewer recommends react-three-fiber. For this project — a single starmap scene that initializes once — react-three-fiber would add a dependency and abstraction layer for no practical benefit. The current approach is appropriate.

**Action:** None.

---

## 11. Transactionality / concurrency concerns

**Verdict: Partially Agree (low severity)**

The reviewer warns about "concurrent or interleaved calls" producing inconsistent state.

**In practice:** This is a single-player browser game. JavaScript is single-threaded. There are no concurrent state modifications — user actions are sequential, and the event loop guarantees atomic execution of synchronous code blocks.

**The real risk** is narrower: a mutation + save sequence where the save happens before all related mutations complete. One concrete example exists in navigation.js (dock), where `dockedSystems.push()` happens after `saveGame()` (lines 118-128). If the game reloads between those two operations, the dock is saved but the visited-system tracking is lost.

**Action:** Low priority. The dock-after-save ordering bug should be fixed (move the mutation before the save call). General transactional concerns are not a real risk for this architecture.

---

## 12. Testability obstacles

**Verdict: Partially Agree**

**Where it's accurate:** The interleaving of mutations, emits, and saves in manager methods means testing business logic requires either:
- Full integration with GameStateManager (heavy, slow), or
- Mocking saveGame/emit (brittle, couples tests to implementation).

The `Math.random()` usage in combat paths makes tests nondeterministic.

**Where it's wrong:** The reviewer claims the global singleton pattern is the core testability problem. But the Bridge Pattern actually *improves* component testability — components can be tested by wrapping them in a `GameProvider` with a mock manager. The hooks abstract away subscription mechanics.

**Action:** Addressed by items #6 (extract pure logic) and #7 (inject randomness). No separate architectural change needed.

---

## Summary

| # | Concern | Verdict | Priority |
|---|---------|---------|----------|
| 1 | Global singleton | Partially Agree | Low |
| 2 | In-place mutation | **Agree** | Medium |
| 3 | Tight React-manager coupling | **Disagree** | None |
| 4 | Stringly-typed events | Partially Agree | Low |
| 5 | Mixed responsibilities | Partially Agree | Low |
| 6 | Side effects in core logic | **Agree** | Medium |
| 7 | Inconsistent randomness/IDs | **Agree** | Medium |
| 8 | God managers | Partially Agree | Medium |
| 9 | Functions in dialogue data | **Disagree** | None |
| 10 | Three.js integration risk | **Disagree** | None |
| 11 | Transactionality | Partially Agree | Low |
| 12 | Testability | Partially Agree | Low (covered by #6, #7) |

### Recommended priorities

**Do first (medium priority, high value):**
1. Split DangerManager into focused modules (#8)
2. Replace `Math.random()` in combat paths with SeededRandom (#7)
3. Batch saves with debounced auto-save instead of per-method saveGame() calls (#6)

**Do when convenient (low priority):**
4. Create an `EVENTS` constant for event name autocomplete (#4)
5. Add dev-mode `Object.freeze` on state to catch out-of-band mutations (#2)
6. Extract `determineThreatLevel`/`determineInspectionSeverity` from useEventTriggers (#5)

**Skip:**
- React-Three.js adapter layer / react-three-fiber migration (#10)
- Declarative dialogue trees (#9)
- Immutable state library (#2 — overkill for single-player game)
- Full reducer/action pattern (#1 — Bridge Pattern already handles this)
