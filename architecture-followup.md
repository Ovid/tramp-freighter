# Architecture Follow-Up Checklist

References the 12 issues identified in `architecture-notes.md`.
Check items off (`- [x]`) as they are completed across sessions.

---

## Done

- [x] **Issue #7 — Deterministic RNG.** Replaced `Math.random()` with `SeededRandom` throughout gameplay paths. Seeds follow `gameDay_systemId_encounterType` pattern. Cosmetic uses in `scene.js` intentionally kept as `Math.random()`.
- [x] **Issue #8 — DangerManager Split.** Split 1,843-line DangerManager into 5 focused managers (`CombatManager`, `NegotiationManager`, `InspectionManager`, `DistressManager`, `MechanicalFailureManager`). Slimmed DangerManager retains shared state (~280 lines).
- [x] **Issue #6 — Debounced Auto-Save.** Replaced 22 scattered `saveGame()` calls across 9 files with `markDirty()` pattern using 500ms trailing debounce. Added `beforeunload` handler.

---

## To Do

### Priority 1 — Quick Wins

- [x] **1A. Event Name Constants (Issue #4)**
  - **Effort:** Small — one file + find-replace
  - **Depends on:** nothing
  - **Problem:** All ~30 event names are string literals. One typo = silent failure. `EventSystemManager` subscriber keys are the implicit registry but emitters use raw strings.
  - **Work:**
    - [x] Create `EVENT_NAMES` constant object (in `constants.js` or dedicated `event-names.js`)
    - [x] Replace all string literal emits with constant references
    - [x] Replace all string literal subscribes with constant references
    - [x] Verify: `EventSystemManager` warns on unknown event names at runtime
  - **Files:** `event-system.js`, `useGameEvent.js`, all managers with `this.emit()`, `useEventTriggers.js`, `DevAdminPanel.jsx`

---

### Priority 2 — Medium Effort, High Value

- [x] **2A. Dialogue Data Decoupling (Issues #9, #1)**
  - **Effort:** Medium
  - **Depends on:** nothing
  - **Problem:** 7 NPC dialogue files embed functions calling `gameStateManager.getState()` and `getNPCState()` directly. Data files depend on the game singleton.
  - **Work:**
    - [x] Change `text`/`condition` signatures from `(rep, gameStateManager, npcId)` to `(rep, context)` where `context` is a plain object
    - [x] Build the `context` object in `DialogueManager` before passing to dialogue trees
    - [x] Remove all `gameStateManager` references from data files
    - [x] Verify: dialogue data files are testable without instantiating GameStateManager
  - **Files:** 7 NPC dialogue files in `src/game/data/dialogue/`, `dialogue.js` manager

- [x] **2B. Extract Pure Calculators (Issue #5)**
  - **Effort:** Medium
  - **Depends on:** nothing
  - **Problem:** Methods like `updateTime()` (9 responsibilities) and `dock()` mix pure calculation with mutation and emission in a single body.
  - **Work:**
    - [x] `events.js:updateTime()` — extract `calculateUpdatedEvents(state, starData)` into `calculators.js`
    - [x] `navigation.js:dock()` — extract price calculation into `calculateSystemPrices()` in `calculators.js`
    - [x] `navigation.js:updateLocation()` — uses same `calculateSystemPrices()` extraction
    - [x] `mission.js` — extract deadline checking into `partitionExpiredMissions()` in `calculators.js`
    - [x] Verify: pure functions are unit-testable without GameStateManager
  - **Files:** `events.js`, `navigation.js`, `mission.js`, new `src/game/utils/calculators.js`

- [ ] **2C. Batch Event Emissions (Issue #11)**
  - **Effort:** Medium
  - **Depends on:** 1A (uses event constants)
  - **Problem:** Single operations fire 4-12 separate events causing unnecessary intermediate React re-renders. `applyEncounterOutcome` fires 4-6 events; game load fires 12+.
  - **Work:**
    - [ ] Add `beginBatch()`/`endBatch()` mechanism to `EventSystemManager`
    - [ ] Wrap `applyEncounterOutcome` in batch block
    - [ ] Wrap game load path (`save-load.js`) in batch block
    - [ ] Wrap `updateTime()` in batch block
    - [ ] Verify: React re-renders reduced (check with React DevTools profiler)
  - **Files:** `event-system.js`, `applyEncounterOutcome.js`, `save-load.js`, `events.js`

---

### Priority 3 — Large Structural (Defer Until Needed)

- [ ] **3A. Immutable State Updates (Issue #2)**
  - **Effort:** Large — ~60+ mutation sites across 15+ files
  - **Depends on:** 2B (pure calculators reduce mutation surface)
  - **Problem:** Every manager gets a mutable reference via `getState()` and mutates nested properties in place. No snapshots, no undo, no change detection.
  - **Why defer:** Most pervasive pattern in the codebase. High refactor risk for a working game. Consider when a feature requires immutability (undo, state replay, multiplayer sync).
  - **Incremental approach if pursued:**
    - [ ] Proof of concept: wrap smallest manager (`RefuelManager`) with Immer `produce()` or `updateState()` helper
    - [ ] Migrate managers one at a time
    - [ ] Add freeze-in-dev guard to catch direct mutations

- [ ] **3B. Three.js Adapter Layer (Issue #10)**
  - **Effort:** Large
  - **Depends on:** nothing (independent, defer)
  - **Problem:** `StarMapCanvas.jsx` calls engine functions directly. `interaction.js` uses module-level mutable state (implicit singleton). `wormholes.js` takes `gameStateManager` as a parameter.
  - **Why defer:** Current integration works correctly — scene initializes once, cleans up on unmount, avoids per-frame allocations. Only matters if rendering layer needs replacement.
  - **If pursued:**
    - [ ] Create `StarmapAdapter` class owning scene lifecycle
    - [ ] Move module-level state from `interaction.js` into adapter instance
    - [ ] Remove `gameStateManager` param from `wormholes.js` — pass pre-computed data

---

### Monitor Only (No Action Unless Problems Arise)

- [ ] **4A. Hook State Shape Coupling (Issue #3)** — `extractStateForEvent` in `useGameEvent.js` and `useEventTriggers.js` hardcode internal state paths. Contained to 2 files. Fix if state shape refactors cause bugs.

- [ ] **4B. Testability (Issue #12)** — Tests are clean. Minor smell: 2 test files assign `manager.state =` directly. Fix opportunistically when touching those tests.

---

## Execution Order

```
1A (Event Constants) ──────────────────────┐
2A (Dialogue Decoupling) ──── independent  │
2B (Extract Pure Calculators) ── independent│
                                           ▼
                              2C (Batch Emissions)
                                           │
                                           ▼
                              3A (Immutable State) ── defer
3B (Three.js Adapter) ──────────────────────── defer
```

Items 1A, 2A, and 2B can proceed in parallel. 2C depends on 1A. 3A benefits from 2B being done first.
