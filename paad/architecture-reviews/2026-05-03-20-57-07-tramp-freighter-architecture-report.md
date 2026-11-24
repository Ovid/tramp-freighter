# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 [working tree dirty]
**Languages:** JavaScript (ES Modules), JSX, React 18, Three.js; Vite, Vitest, fast-check
**Key directories:** `src/App.jsx`, `src/components/`, `src/context/`, `src/features/` (21 modules), `src/game/state/managers/` (25 managers), `src/game/engine/`, `src/game/data/`, `src/game/utils/`, `src/hooks/`, `tests/{unit,property,integration}/`
**Scope:** Full repository

## Repo Overview

Tramp Freighter Blues is a single-player browser SPA — a space trading survival game built on React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real star systems within 20 light-years of Sol, trade commodities, manage ship resources, and resolve danger encounters.

The codebase is medium-large: 171 source files in `src/` and 441 test files across three tiers (unit, property-based with `fast-check`, integration). The dominant architectural pattern is the **Bridge Pattern**: an imperative `GameCoordinator` singleton is connected to React's declarative model through `useGameEvent` (subscribe) and `useGameAction` (commands), with components forbidden from calling `getState()` directly. The coordinator delegates to 25 capability-injected domain managers (combat, danger, debt, dialogue, distress, events, info-broker, inspection, mission, navigation, negotiation, NPC, quest, refuel, repair, save-load, ship, state, trading, etc.), each owning a documented slice of game state.

Per the user's persistent memory, the GSM Refactor that established this layout was completed; `game-coordinator.js` (1642 lines, ~183 delegation methods) is intentional, and `constants.js` (2022 lines) is a mandated central registry. There is **no backend** — the only persistence is browser `localStorage` via a versioned save schema with a forward-only migration registry.

## Strengths

Ranked by impact (15 items):

### [S-1] Clear modular boundaries — capability-injection model with documented per-manager state ownership
- **Category:** S1 (Clear modular boundaries)
- **Impact:** Medium
- **Explanation:** `capabilities.js` enumerates a per-manager state-slice ownership table (e.g., `ShipManager` owns `ship.hull/engine/lifeSupport/quirks/upgrades/cargoCapacity/hiddenCargo/name`; `NPCManager` owns `npcs.*`; `TradingManager` owns `world.priceKnowledge/marketConditions/currentSystemPrices`). Cross-domain reads/writes are routed through explicit injected callbacks rather than direct property access.
- **Evidence:** `src/game/state/capabilities.js:14-49` (ownership table); `src/game/state/game-coordinator.js:124-490` (composition root wires each manager with only its declared capability surface).
- **Found by:** Structure & Boundaries

### [S-2] Acyclic module graph — capability seam strictly observed
- **Category:** S5 (Dependency management hygiene)
- **Impact:** Medium
- **Explanation:** `madge --circular src/` reports zero circular dependencies across 111 files. 0 of 25 managers contain a `this.state.` reference; all cross-domain access goes through capability callbacks. Features and components do not import managers directly.
- **Evidence:** Repository-wide. Verified by `npx madge --circular src/` (no cycles); `grep -c "this.state\." src/game/state/managers/*.js` returns 0 hits.
- **Found by:** Coupling & Dependencies

### [S-3] Pragmatic Bridge Pattern abstraction
- **Category:** S14 (Simple, pragmatic abstractions)
- **Impact:** Medium
- **Explanation:** The Bridge Pattern uses three small primitives (Context provider, `useGameEvent`, `useGameAction`) to bridge an imperative coordinator to React's declarative model — no Redux, no MobX, no observables. The coordinator exposes `subscribe`/`emit`; hooks subscribe and trigger re-render.
- **Evidence:** `src/context/GameContext.jsx:1-44` (44-line provider); `src/hooks/useGameEvent.js`; `src/hooks/useGameAction.js`. No `IGameCoordinator` shim or speculative state-management library.
- **Found by:** Structure & Boundaries

### [S-4] Loose coupling via typed capability seam
- **Category:** S3 (Loose coupling)
- **Impact:** Medium
- **Explanation:** 25 domain managers communicate through 14 distinct typedef shapes (`CombatCapabilities`, `NegotiationCapabilities`, `TradingCapabilities`, …). No manager imports another manager — verified by grep. Inter-manager calls go `manager → capability callback → coordinator → other manager`.
- **Evidence:** `src/game/state/capabilities.js` (typedef catalog); `src/game/state/game-coordinator.js:86-491` (composition root); `grep "from.*managers/" src/game/state/managers/` returns only data/util imports.
- **Found by:** Coupling & Dependencies

### [S-5] Stable dependency direction — features → hooks → context/coordinator → managers → utils/data
- **Category:** S4 (Dependency direction is stable)
- **Impact:** Medium
- **Explanation:** Layer flow is one-directional. Features consume `useGameAction`/`useGameEvent` only; managers import only `BaseManager`, constants, utils, and legacy `Systems` modules — never hooks or features. The 184-method coordinator facade gives callers a single stable surface.
- **Evidence:** `src/features/trade/TradePanel.jsx` (consumes hooks only); `src/game/state/managers/trading.js` (imports `BaseManager`, `constants.js`, `utils/calculators.js`, `game-trading.js`, nothing else).
- **Found by:** Coupling & Dependencies

### [S-6] Critical-path test coverage is dense and tiered
- **Category:** S11 (Testability & coverage)
- **Impact:** Medium
- **Explanation:** 441 test files for 171 source (≈2.6:1 ratio). Save/load, encounter resolution (combat/inspection/distress/negotiation/mechanical-failure), trade, navigation, debt, mission, and dialogue all have multiple dedicated unit, property, and integration tests.
- **Evidence:** `tests/unit/save-load*.test.js` (10+ files); `tests/integration/encounter-resolution.integration.test.jsx`; `tests/property/combat-resolution-outcomes.property.test.js` and 100+ peers under `tests/property/`.
- **Found by:** Security & Code Quality

### [S-7] Deterministic test seams for randomness
- **Category:** S11 (Testability & coverage)
- **Impact:** Medium
- **Explanation:** All gameplay encounter paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`); CLAUDE.md mandates "Do not use `Math.random()` in gameplay paths." This makes property tests reproducible and dramatically reduces flake risk.
- **Evidence:** `src/game/utils/seeded-random.js`; consumers in `combat.js`, `inspection.js`, `distress.js`, `negotiation.js`, `mechanical-failure.js`; 100+ `tests/property/*.property.test.js` files exercise it.
- **Found by:** Security & Code Quality

### [S-8] Centralized configuration registry
- **Category:** S9 (Configuration discipline)
- **Impact:** Medium
- **Explanation:** A single `constants.js` is the authoritative source for prices, thresholds, capacities, debounce timings, magic strings (`SAVE_KEY`), version (`GAME_VERSION`), and event names. CLAUDE.md formalizes the rule. `EVENT_NAMES` is frozen; `EVENT_STATE_MAP` keys it declaratively.
- **Evidence:** `src/game/constants.js` (2022 lines); 20+ feature files verified importing from it via `@game/constants.js` alias.
- **Found by:** Error Handling & Observability

### [S-9] Save schema migration discipline
- **Category:** S6 (Consistent API contracts)
- **Impact:** Medium
- **Explanation:** Versioned save format with a forward-only migration chain registered in one place. `validateStateStructure` accepts both old and new field names (e.g., `buyPrice` OR `purchasePrice`) for backward compatibility, and dedicated tests cover the registry and per-step migrations.
- **Evidence:** `src/game/state/state-validators.js:153-175` (compatibility check); `src/game/state/game-coordinator.js:627-635` (registered chain); `tests/unit/migration-registry.test.js`, `tests/unit/save-load-migration.test.js`.
- **Found by:** Integration & Data

### [S-10] Typed event-bus contract with subscriber isolation
- **Category:** S6 (Consistent API contracts)
- **Impact:** Medium
- **Explanation:** The Bridge Pattern's event surface is enumerated once as a frozen `EVENT_NAMES` object plus a declarative `EVENT_STATE_MAP`. `EventSystemManager` rejects unknown event names on subscribe and emit with explicit warnings, and per-subscriber `try/catch` prevents one buggy listener from poisoning the bus.
- **Evidence:** `src/game/constants.js:1858-1935` (EVENT_NAMES, frozen); `src/game/state/managers/event-system.js:55-58, 87-91, 94-99` (validation + isolation).
- **Found by:** Integration & Data

### [S-11] High cohesion — `ShipManager` as Ship aggregate
- **Category:** S2 (High cohesion)
- **Impact:** Low
- **Explanation:** All 22 methods of `ShipManager` operate on `state.ship.*` (quirks, upgrades, condition, cargo arrays, capabilities calculation). Cohesion vector is shared state + shared vocabulary + shared change-axis (cargo-capacity/upgrade-effect changes touch multiple methods together).
- **Evidence:** `src/game/state/managers/ship.js` (740 lines); commit `1d7cf79 fix: upgrade effects use delta values...` modifies `addUpgrade`/`removeUpgrade`/`calculateShipCapabilities` together.
- **Found by:** Structure & Boundaries

### [S-12] Domain-rich `NPCManager` invariants enforced at entity boundary
- **Category:** S13 (Domain modeling strength)
- **Impact:** Low
- **Explanation:** Reputation clamping, tip cooldowns (≥7 days), favor cooldowns (≥30 days), and "no second loan if outstanding" are enforced at the `NPCManager` entity boundary, not in callers. UI calls `canGetTip()`/`canRequestFavor()` rather than checking `npcState.lastTipDay` themselves.
- **Evidence:** `src/game/state/managers/npc.js:106-271` (`modifyRepRaw` clamps rep at line 141; `canRequestFavor` rejects loan when `npcState.loanAmount !== null` at line 382; `canGetTip` cooldown check at line 221).
- **Found by:** Structure & Boundaries

### [S-13] Save persistence resilience primitives wired at call sites
- **Category:** S12 (Resilience patterns)
- **Impact:** Low
- **Explanation:** Save persistence has bounded resilience: debounced trailing-edge save (`MARK_DIRTY_DEBOUNCE_MS`), explicit `flushSave()` for browser unload, and `SAVE_FAILED` event emission on storage exceptions so the UI can warn the player. Every state-mutating manager calls `markDirty()` after mutation.
- **Evidence:** `src/game/state/managers/save-load.js:34-93` (debounce, flush, event emit); `src/App.jsx:78` consumes the `SAVE_FAILED` event.
- **Found by:** Integration & Data

### [S-14] Boundary-translation error pattern with user recovery
- **Category:** S7 (Robust error handling, partial)
- **Impact:** Low
- **Explanation:** Three boundary translations exist with explicit recovery flows: React render failures bubble to `ErrorBoundary` with a fallback UI; init failures route to `renderErrorUI` with a "Clear Save and Restart" button; save failures emit `SAVE_FAILED` event for in-game notification. Falls short of full S7 because there is no typed exception hierarchy — errors are raw `Error` matched by `error.message.includes('NPC')`.
- **Evidence:** `src/components/ErrorBoundary.jsx:58-61`; `src/main.jsx:93-141`; `src/game/state/managers/save-load.js:87-92`.
- **Found by:** Error Handling & Observability

### [S-15] Coverage tooling wired (without enforcement)
- **Category:** S11 (Testability & coverage, partial)
- **Impact:** Low
- **Explanation:** `@vitest/coverage-v8` is wired with the `test:coverage` npm script, and `coverage/` snapshots exist. No CI threshold enforces it because the repo has no `.github/workflows/`.
- **Evidence:** `package.json` (`"test:coverage": "vitest --coverage"`, `@vitest/coverage-v8` devDep); absence of `.github/workflows/`.
- **Found by:** Security & Code Quality

## Flaws/Risks

Ranked by impact (28 items):

### [F-1] `executeJump` performs sequential cross-domain mutations with no rollback
- **Category:** 26 (Poor transactional boundaries)
- **Impact:** High
- **Explanation:** The player's primary action — jumping between systems — sequentially writes fuel, then time (which fans out to 8 dependent operations), then location, then ship-condition, then triggers a save. Any throw from a downstream step (e.g., `recalculatePricesForKnownSystems` will `throw new Error('Invalid state: marketConditions missing...')`) leaves the player **fuel-deducted but at the old system, with `daysElapsed` partially advanced**. There is no `try`/rollback.
- **Evidence:** `src/game/game-navigation.js:454-471` (`NavigationSystem.executeJump`): `gameStateManager.updateFuel(...)` → `updateTime(...)` → `updateLocation(...)` → `applyJumpDegradation(...)` → `saveGame()`. Throw site at `src/game/state/managers/trading.js:344` after fuel/time already mutated.
- **Found by:** Integration & Data

### [F-2] `updateTime` advances day before running fan-out work
- **Category:** 26 (Poor transactional boundaries)
- **Impact:** High
- **Explanation:** `EventsManager.updateTime` writes `state.player.daysElapsed` first, then runs eight dependent operations (`incrementPriceKnowledgeStaleness`, `cleanupOldIntelligence`, `applyMarketRecovery`, `calculateUpdatedEvents`, `recalculatePricesForKnownSystems`, `checkLoanDefaults`, `processDebtTick`, `checkMissionDeadlines`). Three may throw on missing world fields; when they do, the day counter has advanced permanently while dependent work is silently skipped, allowing missions to expire un-checked, debt to skip a tick, etc.
- **Evidence:** `src/game/state/managers/events.js:95-148` (`setDaysElapsed(newDays)` at line 98 followed by eight dependents). Throw sources at `src/game/state/managers/trading.js:204, 314, 344`.
- **Found by:** Integration & Data

### [F-3] Production-blind `loadGame` silently swallows save corruption
- **Category:** 20 (Weak error handling strategy)
- **Impact:** High
- **Explanation:** The bottom-layer `loadGame` catches all parse/IO exceptions and logs only via `devLog`, which is gated on `DEV_MODE` (false in production). In production, a `SyntaxError` from `JSON.parse` of a corrupted save produces zero console output and no event; `main.jsx` sees `null`, silently calls `initNewGame()`, and the corrupted save is overwritten on the next `markDirty()`.
- **Evidence:** `src/game/state/save-load.js:72-75` (`} catch (error) { devLog('Failed to load game:', error); return null; }`); `src/game/state/managers/save-load.js:166` (`this.log('Failed to load game:', error);` — also DEV-gated, not `this.error`).
- **Found by:** Error Handling & Observability

### [F-4] Asymmetric save-vs-load event surface — no `LOAD_FAILED` event
- **Category:** 21 (No observability plan)
- **Impact:** High
- **Explanation:** `SAVE_FAILED` is a documented event with a UI subscriber; the symmetric `LOAD_FAILED` does not exist. Load errors and the silent NPC-data auto-recovery (which discards reputation history) never reach the player. The Bridge Pattern's reactive UI cannot react because nothing is emitted.
- **Evidence:** `src/game/constants.js:1933-1935` shows only `SAVE_FAILED: 'saveFailed'` in the Errors section; `src/game/state/managers/save-load.js:170` log line "NPC data corrupted, continuing with fresh NPC relationships" is dev-only.
- **Found by:** Error Handling & Observability

### [F-5] Bridge-bypass — features and hooks call `game.getState()` directly
- **Category:** 3 (Tight coupling)
- **Impact:** Medium
- **Explanation:** CLAUDE.md states "Components must NEVER call `GameCoordinator.getState()` directly." Eleven call sites violate this: `applyEncounterOutcome.js` reads ship/player state to compute updates; `useEventTriggers.js` performs six `game.getState()` calls inside a Bridge-layer hook; `DevAdminPanel.jsx` reads state directly.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:16,133,139`; `src/hooks/useEventTriggers.js:128,150,174,198,243,261`; `src/features/dev-admin/DevAdminPanel.jsx:145`.
- **Found by:** Coupling & Dependencies

### [F-6] `applyEncounterOutcome` is a manager-shaped module living in the feature layer
- **Category:** 4 (High/unstable dependencies)
- **Impact:** Medium
- **Explanation:** This 213-line file (28 commits in 6 months) reads 12+ state paths and writes 14 different effects through coordinator methods. It functionally is an `EncounterResolutionManager` sitting in `src/features/danger/` rather than alongside `CombatManager`/`NegotiationManager`/`InspectionManager` with its own capability seam.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js`; reads `state.ship.fuel/hull/engine/lifeSupport/cargo/cargoCapacity`, `state.player.credits/debt/currentSystem/daysElapsed`; writes `failMissionsDueToCargoLoss`, `modifyKarma`, `modifyFactionRep`, `removeRestrictedCargo`, `clearHiddenCargo`, etc.
- **Found by:** Coupling & Dependencies

### [F-7] DI misuse — `coordinatorRef` and `getGameState` capability fields are service-locator escape hatches
- **Category:** 23 (Dependency injection misuse)
- **Impact:** Medium
- **Explanation:** Three capability typedefs expose unrestricted access: `DialogueCapabilities` and `InfoBrokerCapabilities` provide a `coordinatorRef`, and `EventEngineCapabilities` provides a `getGameState` returning the entire `state`. The capabilities file itself documents the leak as "documented coupling that will be addressed if [X] is refactored separately." Managers can then call any of the 184 facade methods and read any state path, defeating the typed seam.
- **Evidence:** `src/game/state/capabilities.js:202-208, 333-339, 498-506`; consumed at `src/game/state/managers/dialogue.js:92,125`, `info-broker.js:40,67`, `event-engine.js:66`.
- **Found by:** Coupling & Dependencies

### [F-8] `loadGame` mutates state on corruption (read-shape signature lying)
- **Category:** 12 (Hidden side effects)
- **Impact:** Medium
- **Explanation:** A method named `loadGame()` looks like a pure read. Its NPC-corruption path silently calls `attemptNPCRecovery()`, which zeroes `state.npcs = {}` and resets `state.dialogue` to defaults, then writes that back via `restoreState()`. The caller in `main.jsx` treats the return as binary "loaded vs new game" — no signal that "loaded" actually meant "loaded with NPC reputation discarded."
- **Evidence:** `src/game/state/managers/save-load.js:165-207` (`handleLoadError` matches `error.message.includes('NPC')` then `recoveredState.npcs = {}` at line 187).
- **Found by:** Error Handling & Observability

### [F-9] `handleLoadError` performs destructive auto-recovery via fragile string match
- **Category:** 19 (Lack of idempotency)
- **Impact:** Medium
- **Explanation:** Recovery is triggered by `error.message.includes('NPC')` — a substring match on whatever throws. On match, it wipes NPC reputation and dialogue history wholesale; there is no pre-recovery backup, and the next `markDirty` persists the wiped state under the same `SAVE_KEY`. Any future error message containing "NPC" will accidentally trigger this destructive recovery.
- **Evidence:** `src/game/state/managers/save-load.js:169` (string match), `:187` (`recoveredState.npcs = {}`), `:193` (`recoveredState.dialogue = {...defaults}`).
- **Found by:** Integration & Data

### [F-10] `selectChoice` over-general catch with partial application of side effects
- **Category:** 20 (Weak error handling strategy)
- **Impact:** Medium
- **Explanation:** A bare `catch (error)` wraps the dialogue action in `selectChoice`, logging via `console.error`/`console.warn` (the comment promises "user feedback" but it's operator-only). Execution continues — the subsequent `modifyRepRaw` block applies the configured `repGain` even though the action threw. Realistic scenario: a loan-request action throws because finance state is corrupt; the player's reputation still ticks up while the loan never executes.
- **Evidence:** `src/game/game-dialogue.js:310-352` (catch at line 327 with comment "In a full implementation, this would use the notification system"; `modifyRepRaw` at lines 346-352 unconditional).
- **Found by:** Error Handling & Observability

### [F-11] Format-drift across logging conventions — same failure mode logged three different ways
- **Category:** 34 (Inconsistent error/logging conventions)
- **Impact:** Medium
- **Explanation:** Three coexisting log shapes: `devLog` (DEV-only, no prefix), `BaseManager.log/warn/error` (class prefix, varying gating), raw `console.error` (always-on, no prefix). Within `save-load.js` alone, the same kind of failure (storage IO error) emits as always-on `console.error` on save and DEV-only `devLog` on load — a developer grepping production logs sees "Failed to save game" but never "Failed to load game" even though both fail identically.
- **Evidence:** `src/game/state/save-load.js:44` (`console.error('Failed to save game:', error)`); `src/game/state/save-load.js:73` (`devLog('Failed to load game:', error)`); `src/game/state/managers/event-system.js:56,88,98` (raw `console.warn`/`console.error` no prefix); `src/game/utils/dev-logger.js` source comment acknowledges intentional drift.
- **Found by:** Error Handling & Observability

### [F-12] Module-level mutable selection state in `interaction.js`
- **Category:** 1 (Global mutable state)
- **Impact:** Medium
- **Explanation:** Three module-level mutable bindings (`let selectedStar`, `let currentSystemIndicator`, `let currentSystemMaterial`) are written by `selectStar`/`deselectStar`/`updateCurrentSystemIndicator` and read by `getSelectedStar`/`updateSelectionRingAnimations`. The exported `_resetState()` testing-only escape hatch confirms tests must isolate state — i.e., test cases can observe each other's writes if not reset.
- **Evidence:** `src/game/engine/interaction.js:5-7` (declarations), `:20, 70, 109, 126` (writers), `:78, 160` (readers), `:148` (`_resetState`).
- **Found by:** Structure & Boundaries

### [F-13] Module-level wormhole render arrays mutated across call sites
- **Category:** 1 (Global mutable state)
- **Impact:** Medium
- **Explanation:** `const wormholeConnections = []; const wormholeLines = []` use `const` on the binding but mutate the array contents via `.push()` and `.length = 0`. Three call sites with no owner; the `clearWormholeConnections` testing escape hatch ("for testing") confirms test pollution risk.
- **Evidence:** `src/game/engine/wormholes.js:6-7` (declarations); `:101, 115` (push); `:175` (`clearWormholeConnections` resets `length = 0`); `:155` (reader iterates).
- **Found by:** Structure & Boundaries

### [F-14] Migration docstrings disagree with code
- **Category:** 24 (Inconsistent API contracts)
- **Impact:** Low
- **Explanation:** The save-version migration chain has internal drift between docstrings and code. `migrateFromV1ToV2` is documented as "Migrate save data from v1.0.0 to v4.1.0" but sets `state.meta.version = '2.0.0'`; the function name says V2. `migrateFromV2ToV2_1` is documented as targeting "v4.0.0" but actually steps to `'2.1.0'`. The registry itself works correctly; this is a maintenance hazard for future readers.
- **Evidence:** `src/game/state/state-validators.js:447` (docstring) vs `:574` (code); `:589-591` (docstring) vs `:616` (code).
- **Found by:** Integration & Data

### [F-15] `useAnimationLock` requires `StarMapCanvas` mount-order
- **Category:** 27 (Temporal coupling)
- **Impact:** Low
- **Explanation:** A sibling component using `useAnimationLock` before `StarMapCanvas`'s `useEffect` runs gets a thrown error. The ordering requirement is encoded only in the error-message string and JSDoc prose — a component author cannot tell statically from the hook signature that another component must be mounted.
- **Evidence:** `src/hooks/useAnimationLock.js:29-39, 45-53` (hook); `src/features/navigation/StarMapCanvas.jsx:211, 348` (`game.setAnimationSystem(...)` mount/unmount).
- **Found by:** Coupling & Dependencies

### [F-16] Coordinator capability getters assume `this.state` is non-null
- **Category:** 27 (Temporal coupling)
- **Impact:** Low
- **Explanation:** `this.state = null` in the coordinator constructor, then ~80 closures of the form `getCredits: () => this.state.player.credits` are wired into manager capabilities. Any read before `initNewGame()`/`restoreState()` runs throws `Cannot read properties of null (reading 'player')`. `BaseManager.validateState()` is documented as a no-op "retained for backward compatibility" — the API previously enforced ordering and the enforcement was deliberately weakened.
- **Evidence:** `src/game/state/game-coordinator.js:83` (`this.state = null`); 80+ closures at lines 88-491; `src/game/state/managers/base-manager.js:30-32` (no-op `validateState`).
- **Found by:** Coupling & Dependencies

### [F-17] `isTestEnvironment` plumbed through 22 manager constructors with zero consumers
- **Category:** 7 (Over-abstraction)
- **Impact:** Low
- **Explanation:** The `isTestEnvironment` flag is computed once on the coordinator (`process.env.NODE_ENV === 'test'`) and threaded through every manager constructor's capabilities object. `grep -rn "this.isTestEnvironment\b" src/game/state/managers/` returns only the two assignment sites; no manager method branches on it. Pure speculative test-mode plumbing that increases the surface area of every typedef.
- **Evidence:** `src/game/state/game-coordinator.js` (22 constructor sites at lines 111, 116, 122, 151, 161, 177, 207, 219, 238, 244, 278, 290, 308, 320, 334, 348, 357, 369, 404, 410, 440, 463, 478); `src/game/state/managers/base-manager.js:21`; `src/game/state/managers/initialization.js:30`.
- **Found by:** Coupling & Dependencies

### [F-18] DialogueManager uses dynamic `await import('../../game-dialogue.js')` to avoid a non-existent cycle
- **Category:** 8 (Premature optimization)
- **Impact:** Low
- **Explanation:** `dialogue.js` uses `const { showDialogue } = await import('../../game-dialogue.js')` with JSDoc citing "circular dependencies." `madge` confirms no cycle exists; `game-dialogue.js` has no runtime imports of `GameCoordinator`. The dynamic import forces `startDialogue` and `selectDialogueChoice` to be `async` for callers, with no benefit because the cycle the comment guards against does not exist.
- **Evidence:** `src/game/state/managers/dialogue.js:87, 120`; `madge --circular src/` returns "No circular dependency found"; ESLint has no `import/no-cycle` rule active.
- **Found by:** Coupling & Dependencies

### [F-19] Module-level lazy caches in `wormhole-graph.js`
- **Category:** 1 (Global mutable state)
- **Impact:** Low
- **Explanation:** Four module-level mutable bindings (`adjacencyMap`, `shortestPaths`, `starNameMap`, `starByIdMap`) initialized lazily by `ensureInitialized()`. Once initialized the cache is read-only at runtime, but tests that load the module before mocking `STAR_DATA` freeze the cache against unmocked data; the exported `_resetCacheForTesting()` confirms the test-isolation issue.
- **Evidence:** `src/game/utils/wormhole-graph.js:6-9` (declarations); `:116-119` (writes via `ensureInitialized`); `:202` (`_resetCacheForTesting`).
- **Found by:** Structure & Boundaries

### [F-20] Boundary-drift between legacy `game-*.js` Systems and new `state/managers/` Managers
- **Category:** 13 (Inconsistent boundaries)
- **Impact:** Low
- **Explanation:** The codebase has two parallel boundaries owning the same domains: older `class TradingSystem`/`NavigationSystem`/`EconomicEventsSystem`/`InformationBroker`/etc. coexist with newer Managers that wrap them. The implicit split is "stateless math in Systems, stateful mutation in Managers", but the rule is undocumented in CLAUDE.md/AGENTS.md, and both file sets continue to receive bug-fix commits.
- **Evidence:** `src/game/game-trading.js`, `game-navigation.js`, `game-events.js`, `game-information-broker.js`, `game-dialogue.js`, `game-npcs.js`, `mission-generator.js` vs `src/game/state/managers/trading.js`, `navigation.js`, etc. `src/game/state/managers/initialization.js` imports `TradingSystem` to compute starting prices.
- **Found by:** Structure & Boundaries

### [F-21] `useDangerZone` and `useEncounterProbabilities` reach manager internals
- **Category:** 3 (Tight coupling)
- **Impact:** Low
- **Explanation:** Two hooks call `game.dangerManager.X()` rather than the coordinator facade. The coordinator already exposes `getDangerZone(systemId)`, `calculatePirateEncounterChance(...)`, and `calculateInspectionChance(...)` at the facade — these hooks bypass it.
- **Evidence:** `src/hooks/useDangerZone.js:15` (`game.dangerManager.getDangerZone(systemId)`); `src/hooks/useEncounterProbabilities.js:20, 25` (`game.dangerManager.calculatePirateEncounterChance/calculateInspectionChance`); facade in `src/game/state/game-coordinator.js:1370, 1374, 1381`.
- **Found by:** Coupling & Dependencies

### [F-22] `useAnimationLock` exposes 3-level reach into imperative animation system
- **Category:** 6 (Leaky abstractions)
- **Impact:** Low
- **Explanation:** The hook reaches three levels deep (`game.animationSystem.inputLockManager.isInputLocked()`) and surfaces internal field names in error messages ("inputLockManager missing"). If any level renames or relocates, the hook breaks; the React-bridge layer should expose a binary `isLocked()` that does not name internal subsystems.
- **Evidence:** `src/hooks/useAnimationLock.js:35-38` (chain reach); error string referencing `inputLockManager` by name.
- **Found by:** Coupling & Dependencies

### [F-23] Risk-band thresholds disagree across UI surfaces
- **Category:** 28 (Magic numbers/strings everywhere)
- **Impact:** Low
- **Explanation:** `JumpDialog.jsx` classifies a jump as "high risk" when `pirateChance > 0.25`. `DangerWarningDialog.jsx` classifies the same conceptual band as `>= 0.3`/`0.15`/`0.05` for high/moderate/low. Two UI surfaces give the player non-aligned signals about the same destination, and CLAUDE.md mandates risk thresholds live in `constants.js`.
- **Evidence:** `src/features/navigation/JumpDialog.jsx:71`; `src/features/danger/DangerWarningDialog.jsx:309-311`.
- **Found by:** Error Handling & Observability

### [F-24] `RumorAlert` setTimeout ignores notification-config convention
- **Category:** 28 (Magic numbers/strings everywhere)
- **Impact:** Low
- **Explanation:** `setTimeout(() => setVisible(false), 3000)` hard-codes a 3-second display window for a faction-reputation-critical alert. Other notification durations route through `ACHIEVEMENTS_CONFIG.TOAST_DURATION` and `NOTIFICATION_CONFIG.FADE_DURATION`; this single feature ignores the convention. CLAUDE.md mandates lifting all timeouts to `constants.js`.
- **Evidence:** `src/features/hud/RumorAlert.jsx:22`; compare to `src/features/achievements/AchievementToast.jsx:37-50` which uses constants correctly.
- **Found by:** Error Handling & Observability

### [F-25] `calculators.js` is a small utility grab-bag
- **Category:** 29 ("Utility" dumping ground)
- **Impact:** Low
- **Explanation:** A 115-line `calculators.js` contains four functions with no shared cohesion vector beyond "extracted from various managers": `calculateSystemPrices` (TradingManager), `partitionExpiredMissions` (MissionManager), `calculateUpdatedEvents` (EventsManager), `determineThreatLevel`/`determineInspectionSeverity` (DangerManager). Disjoint state, vocabulary, and change-axis.
- **Evidence:** `src/game/utils/calculators.js:1-115`; "extracted from X" comments preserve grab-bag origin.
- **Found by:** Structure & Boundaries

### [F-26] `capabilities.js` has zero runtime importers
- **Category:** 31 (Dead code / unused dependencies)
- **Impact:** Low
- **Explanation:** `capabilities.js` is 165+ lines of JSDoc typedefs with no `export` statements; `knip` reports it under "Unused files (1)." The file served as design-time reference for the GSM Refactor (now COMPLETED per `MEMORY.md`); it is either a permanent typedef catalog that belongs under `docs/` or `developer_docs/`, or it is post-migration dead.
- **Evidence:** `src/game/state/capabilities.js`; `npx knip` output flags as unused; `grep -rn "from.*capabilities" --include="*.js" --include="*.jsx" src/` returns zero `import` matches against the module path.
- **Found by:** Security & Code Quality

### [F-27] Stale named re-export `YUMI_TANAKA_POSTCREDITS_DIALOGUE`
- **Category:** 31 (Dead code / unused dependencies)
- **Impact:** Low
- **Explanation:** The named re-export at `dialogue-trees.js:70` has zero external importers. Tests import the symbol directly from `./dialogue/yumi-tanaka.js`. The aggregator file exposes it via the `ALL_DIALOGUE_TREES` map at line 89, but the named re-export itself is unused.
- **Evidence:** `src/game/data/dialogue-trees.js:70`; consumed only via local binding at `:89`; `npx knip` reports the export as unused.
- **Found by:** Security & Code Quality

### [F-28] Jump action lacks an idempotency boundary
- **Category:** 19 (Lack of idempotency)
- **Impact:** Low
- **Explanation:** `useNavigationActions.executeJump` returns a promise but does not consult `useAnimationLock` and has no `pending` guard. A user double-tap on the Jump button before the first promise resolves could fire two pipelines, each deducting fuel and advancing time. The animation-lock primitive exists per CLAUDE.md but is not wired into this action hook.
- **Evidence:** `src/hooks/useNavigationActions.js:14`; `src/hooks/useAnimationLock.js` exists but is not consulted.
- **Found by:** Integration & Data

## Coverage Checklist

### Flaw/Risk Types 1–34
| #  | Type                                                | Status        | Finding |
|----|-----------------------------------------------------|---------------|---------|
| 1  | Global mutable state                                | Observed      | F-12, F-13, F-19 |
| 2  | God object                                          | Not observed  | — |
| 3  | Tight coupling                                      | Observed      | F-5, F-21 |
| 4  | High/unstable dependencies                          | Observed      | F-6 |
| 5  | Circular dependencies                               | Not observed  | — |
| 6  | Leaky abstractions                                  | Observed      | F-22 |
| 7  | Over-abstraction                                    | Observed      | F-17 |
| 8  | Premature optimization                              | Observed      | F-18 |
| 9  | Shotgun surgery                                     | Not observed  | — |
| 10 | Feature envy / anemic domain model                  | Not observed  | — |
| 11 | Low cohesion                                        | Not observed  | — |
| 12 | Hidden side effects                                 | Observed      | F-8 |
| 13 | Inconsistent boundaries                             | Observed      | F-20 |
| 14 | Distributed monolith                                | Not applicable | — |
| 15 | Chatty service calls                                | Not applicable | — |
| 16 | Synchronous-only integration                        | Not applicable | — |
| 17 | No clear ownership of data                          | Not applicable | — |
| 18 | Shared database across services                     | Not applicable | — |
| 19 | Lack of idempotency                                 | Observed      | F-9, F-28 |
| 20 | Weak error handling strategy                        | Observed      | F-3, F-10 |
| 21 | No observability plan                               | Observed      | F-4 |
| 22 | Configuration sprawl                                | Not observed  | — |
| 23 | Dependency injection misuse                         | Observed      | F-7 |
| 24 | Inconsistent API contracts                          | Observed      | F-14 |
| 25 | Business logic in the UI                            | Not observed  | — |
| 26 | Poor transactional boundaries                       | Observed      | F-1, F-2 |
| 27 | Temporal coupling                                   | Observed      | F-15, F-16 |
| 28 | Magic numbers/strings everywhere                    | Observed      | F-23, F-24 |
| 29 | "Utility" dumping ground                            | Observed      | F-25 |
| 30 | Security as an afterthought                         | Not applicable | — |
| 31 | Dead code / unused dependencies                     | Observed      | F-26, F-27 |
| 32 | Missing/inadequate test coverage for critical paths | Not observed  | — |
| 33 | Hard-coded credentials or secrets in source         | Not applicable | — |
| 34 | Inconsistent error/logging conventions              | Observed      | F-11 |

### Strength Categories S1–S14
| #   | Category                                | Status        | Finding |
|-----|-----------------------------------------|---------------|---------|
| S1  | Clear modular boundaries                | Observed      | S-1 |
| S2  | High cohesion                           | Observed      | S-11 |
| S3  | Loose coupling                          | Observed      | S-4 |
| S4  | Dependency direction is stable          | Observed      | S-5 |
| S5  | Dependency management hygiene           | Observed      | S-2 |
| S6  | Consistent API contracts                | Observed      | S-9, S-10 |
| S7  | Robust error handling                   | Observed      | S-14 (partial) |
| S8  | Observability present                   | Not observed  | — |
| S9  | Configuration discipline                | Observed      | S-8 |
| S10 | Security built-in                       | Not applicable | — |
| S11 | Testability & coverage                  | Observed      | S-6, S-7, S-15 |
| S12 | Resilience patterns                     | Observed      | S-13 (partial) |
| S13 | Domain modeling strength                | Observed      | S-12 |
| S14 | Simple, pragmatic abstractions          | Observed      | S-3 |

## Hotspots

Top 3 areas to review:

1. **`src/game/state/save-load.js` and `src/game/state/managers/save-load.js`** — four distinct findings (F-3 silent-swallow, F-4 missing event, F-8 hidden effect, F-9 destructive recovery) cluster on the load/recovery path. The save side has resilience primitives (S-13); the load side does not. This is the single most concentrated hotspot in the report.

2. **The `executeJump` → `updateTime` pipeline** (`src/game/game-navigation.js:454-471` and `src/game/state/managers/events.js:95-148`) — F-1 and F-2 are the only two High-impact findings in the structural lens. The player's primary action and the day-tick fan-out both lack rollback or idempotency boundaries; throws in dependents (e.g., `recalculatePricesForKnownSystems`) leave user-visible partial state.

3. **`src/features/danger/applyEncounterOutcome.js`** — F-5 and F-6 show this 213-line, 28-commits-in-6-months file is functioning as a manager (reading 12+ state paths, writing 14 effects via the coordinator) while sitting in the feature layer. It is also one of the worst offenders for the Bridge-bypass pattern. Promotion to a proper `EncounterOutcomeManager` would close two findings simultaneously.

## Next Questions

1. Was the silent-swallow of load errors (F-3) and the destructive NPC auto-recovery (F-9) an intentional UX choice (avoid scaring the player), or a gap that predates the GSM refactor and was never revisited?
2. Were the in-process transaction-boundary findings (F-1, F-2) considered during the GSM refactor, or did the refactor focus on capability boundaries while leaving cross-domain mutation atomicity out of scope?
3. The legacy `src/game/game-*.js` "Systems" classes (F-20) coexist with new managers under an undocumented split rule. Is the long-term direction to absorb the System pure-math into the corresponding manager, or to keep both layers permanently?
4. The `coordinatorRef`/`getGameState` escape hatches (F-7) are self-documented as transitional. What blocks their removal from `DialogueCapabilities`, `InfoBrokerCapabilities`, and `EventEngineCapabilities`?
5. Two CI-shaped gaps (no `.github/workflows/`; coverage threshold not enforced) coexist with strong tooling (knip, vitest coverage, fast-check). Is CI enforcement deferred by design, or is this a gap waiting to be filled?

## Analysis Metadata

- **Agents dispatched:**
  - Structure & Boundaries (modules, cohesion, domain modeling)
  - Coupling & Dependencies (graph direction, cycles, DI, abstraction quality)
  - Integration & Data (contracts, transactions, persistence, idempotency — bail-out partially applied for distributed-only flaws)
  - Error Handling & Observability (errors, logging, config, side effects, business-in-UI)
  - Security & Code Quality (auth, secrets, dead code, dep hygiene, critical-path coverage)
- **Verifier:** single agent, all five lenses, ref token confirmed
- **Scope:** 171 source files in `src/`, 441 test files in `tests/`, full repository
- **Raw findings:** 44 (across all five specialists, before verification)
- **Verified findings:** 43 (15 strengths, 28 flaws)
- **Filtered out:** 1 (`applyEmergencyPatch` transaction-boundary subsumed by F-2 cluster)
- **By impact:** 4 High, 13 Medium, 26 Low
- **Specialist-marked Not Applicable (ratified):** Flaws 14, 15, 17, 18 (single deployment unit, no peer services); Flaws 30, 33 (no auth, no secrets); Strength S10 (no security surface to build in)
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT.md`, `developer_docs/bridge-pattern.md`, project memory `MEMORY.md` (GSM Refactor completion note)
