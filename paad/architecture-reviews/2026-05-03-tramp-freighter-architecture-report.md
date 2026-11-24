# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 (`main`)
**Languages:** JavaScript, JSX (React 18), Three.js
**Key directories:** `src/features/`, `src/components/`, `src/hooks/`, `src/context/`, `src/game/state/managers/`, `src/game/engine/`, `src/game/data/`, `src/game/utils/`
**Scope:** full repository (`src/` and `tests/`)

## Repo Overview

Tramp Freighter Blues is a single-player space-trading survival game implemented as a single-process React 18 + Three.js SPA built with Vite. The game presents a 3D starmap of 117 real star systems within 20 light-years of Sol, with gameplay around commodity trading, ship resource management, NPC relationships, and danger encounters. Persistence is `localStorage` only — there is no backend, no auth, no network calls, no PII handling, and consequently most distributed-system concerns are out of scope.

The architecture's central pattern is a **Bridge Pattern**: an imperative `GameCoordinator` (composition root) owning 25 capability-injected domain managers, exposed to React via two hooks (`useGameEvent` for state subscription, `useGameAction` for triggering actions). A recently-completed "GSM Refactor" replaced an older monolithic `GameStateManager` with this composition root + capability typedefs (`src/game/state/capabilities.js`) defining each manager's narrow read/write/infrastructure contract. The ~183 delegation methods on `GameCoordinator` are the intentional post-refactor facade.

Codebase size: ~171 source files in `src/` (medium). Tests in `tests/{unit,property,integration}` (~150+ test files). Three runtime dependencies: `react`, `react-dom`, `three`. `knip` is configured for dead-code detection.

## Strengths

Ranked by impact, mix of high-confidence positive findings:

### [S-01] Manager facade is genuinely thin
- **Category:** S14 — Simple, pragmatic abstractions
- **Impact:** High
- **Explanation:** `game-coordinator.js` (1642 lines) is overwhelmingly one-line delegation. The few methods doing work (e.g., `resolveEncounter` dispatcher, `_emitAllStateEvents`, `_applyMigrations`) are routing/fan-out logic by their nature. Real domain decisions live in managers, not the coordinator — the discipline of the post-GSM-refactor has held.
- **Evidence:** `src/game/state/game-coordinator.js:85-340, 1100-1160, 1455-1475` — sampled blocks confirm forwarding methods.
- **Found by:** Structure & Boundaries

### [S-02] Capability injection is explicit, narrow, and uniformly applied
- **Category:** S1 / S3 / S13 — Modular boundaries / loose coupling / domain modeling
- **Impact:** High
- **Explanation:** Each manager receives an explicit lambda-bag at construction (e.g., `TradingManager` gets exactly 17 lambdas covering its needed reads, writes, and infra). No manager imports `game-coordinator.js`; no manager uses `this.gameStateManager`. Each manager's full dependency surface is auditable from one constructor call site — much stronger than typical "pass `this`" patterns.
- **Evidence:** `src/game/state/game-coordinator.js:86-340` (per-manager capability bags); `grep "this.gameStateManager"` and `grep "from.*game-coordinator"` in `src/game/state/managers/` both return zero hits.
- **Found by:** Structure & Boundaries, Coupling & Dependencies

### [S-03] Engine layer is cleanly independent of game state
- **Category:** S4 — Stable dependency direction
- **Impact:** High
- **Explanation:** Three.js scene code in `src/game/engine/*.js` imports only `three`, constants, utils, and data — zero state imports. The state→engine boundary is one-way (GameCoordinator holds an `animationSystem` reference set externally via `setAnimationSystem`). Exactly the right direction.
- **Evidence:** `src/game/engine/scene.js`, `stars.js`, `wormholes.js`, `interaction.js`, `game-animation.js` — verified import sets contain no `state/` imports.
- **Found by:** Coupling & Dependencies

### [S-04] Centralized event names; zero string-literal pub/sub at call sites
- **Category:** S6 — Consistent API contracts
- **Impact:** High
- **Explanation:** All `emit`/`subscribe` calls reference `EVENT_NAMES.X` (an `Object.freeze`'d map at the top of constants). `EventSystemManager` builds its subscriber map dynamically from `Object.values(EVENT_NAMES)`. Refactor-safe pub/sub: rename one constant and every site updates.
- **Evidence:** `src/game/constants.js:1858-1935` (frozen `EVENT_NAMES`); `src/game/state/managers/event-system.js:14-22` (dynamic init); recursive grep for `emit('` / `subscribe('` outside tests returns no string literals.
- **Found by:** Integration & Data

### [S-05] Constants file is sectioned config, not a dumping ground
- **Category:** S2 / S9 — Cohesion / configuration discipline
- **Impact:** Medium
- **Explanation:** `constants.js` (2022 lines) consists of ~50 named, sectioned `Object.freeze` config objects (`SHIP_CONFIG`, `ECONOMY_CONFIG`, `DANGER_CONFIG`, `COMBAT_CONFIG`, `NEGOTIATION_CONFIG`, `EVENT_NAMES`, etc.). The single-file design is documented as deliberate for a single-developer project. Size reflects content density, not loss of cohesion.
- **Evidence:** `src/game/constants.js` — sectioned exports at lines 195, 398, 449, 1182, 1265, 1354, 1858, etc.
- **Found by:** Structure & Boundaries

### [S-06] Linear, additive save migration chain with defensive backfill
- **Category:** S12 — Resilience patterns
- **Impact:** Medium
- **Explanation:** Migrations chain v1 → v2 → v2.1 → v4 → v4.1 → v5, each step gated by exact version-string match in `_applyMigrations`. After migration, `addStateDefaults` defensively backfills missing fields with `if (state.x === undefined)` checks, so newer-version saves predating new features remain compatible.
- **Evidence:** `src/game/state/game-coordinator.js:583-643`; `src/game/state/state-validators.js:153-175` (version gating), 665+ (backfill).
- **Found by:** Integration & Data

### [S-07] Multi-layer error boundaries plus global initialization fallback
- **Category:** S8 — Observability present
- **Impact:** Medium
- **Explanation:** `ErrorBoundary` wraps the App, the StarMap, and panel containers — three granularity levels. Separately, `main.jsx` provides a "Failed to Load Game" UI with a Clear-Save-and-Restart button if `initializeGame()` throws before React mounts. Failures localize rather than crash the SPA.
- **Evidence:** `src/App.jsx:396, 421, 503, 599`; `src/main.jsx:93-141`.
- **Found by:** Error Handling & Observability

### [S-08] Determinism in gameplay paths
- **Category:** S11 — Testability & coverage
- **Impact:** Medium
- **Explanation:** `Math.random` appears in gameplay code only as a default-argument fallback (`(rng = Math.random)`); real call sites pass a `SeededRandom` instance with a deterministic seed (e.g., `new SeededRandom('event-${eventType}-${day}-${system}')`). Cosmetic-only `Math.random` in `engine/scene.js` for background star positioning is acceptable.
- **Evidence:** `src/game/state/managers/event-engine.js:62`; `src/game/mission-generator.js:111,231,322`; `src/game/state/managers/ship.js:34`; `src/game/state/managers/quest-manager.js:320`. Cosmetic at `src/game/engine/scene.js:226-254`.
- **Found by:** Security & Code Quality

### [S-09] Notably clean codebase: zero TODO/FIXME/HACK/XXX, no unsafe APIs
- **Category:** S10 / S11 — Security built-in / hygiene
- **Impact:** Medium
- **Explanation:** `grep -rn "TODO\|FIXME\|HACK\|XXX" src/` returns zero hits. No `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`, or `document.write`. For 171 source files this is unusual discipline.
- **Evidence:** Repository-wide grep across `src/`.
- **Found by:** Security & Code Quality

### [S-10] Save failures fail closed and surface to UI
- **Category:** S10 — Security/safety built-in
- **Impact:** Medium
- **Explanation:** `_forceSave` wraps `localStorage.setItem` in try/catch and emits `EVENT_NAMES.SAVE_FAILED`; `App.jsx` subscribes via `useGameEvent` to surface a notification. Quota-exceeded paths are covered by `tests/unit/save-load-error-recovery.test.js`. (Note: load failures are not symmetric — see F-12.)
- **Evidence:** `src/game/state/managers/save-load.js:69-93, 137-156`; tests in `save-load-error-recovery.test.js`.
- **Found by:** Security & Code Quality

## Flaws/Risks

Ranked by impact, deduplicated across specialists.

### [F-01] `applyEncounterOutcome.js` is a misplaced cross-domain orchestrator
- **Category:** Flaws 6, 10, 13, 26 (leaky abstraction + feature envy + inconsistent boundary + non-transactional)
- **Impact:** High
- **Explanation:** This 213-line file sits in `src/features/danger/` (a UI feature folder) but reads `game.getState()` directly — bypassing the Bridge Pattern's documented invariant — then sequentially calls 14+ coordinator mutators across 12 state slices (fuel, hull, engine, lifeSupport, credits, debt, cargo, hiddenCargo, restrictedCargo, days, missions, karma, faction, passengerSatisfaction). There is no transaction wrapper and no rollback; if any mid-sequence call throws, state is half-applied with React events already fired for the partial mutations, and the trailing `markDirty()` at line 210 is never reached. The single most-cited issue in this review (4 specialists, different angles).
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:15-213` — `const state = game.getState()` (line 16), 14+ `game.update*`/`game.modify*`/`game.clear*` calls, single trailing `game.markDirty()` (line 210). Additional `game.getState()` calls at lines 133, 139.
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error Handling & Observability

### [F-02] Encounter state machine and game-rule logic live in React hooks/JSX
- **Category:** Flaws 13, 25 (inconsistent boundary + business logic in UI)
- **Impact:** High
- **Explanation:** Multi-phase encounter routing (initial → combat/negotiation → escalated_combat → outcome), the `THREAT_ESCALATION` table mapping weak→moderate→strong→dangerous, UI-choice → combat-sub-choice mapping, and direct mutation of `currentEncounter.encounter.threatLevel` all live in `useEncounterOrchestration.js`. Separately, `CombatPanel.jsx` contains a 110-line `calculateCombatProbabilities` function that applies engine-condition penalties, quirk/upgrade modifiers, and karma scaling — pure game-rule arithmetic embedded in a JSX file. These rules will silently drift from the canonical resolver implementations in `CombatManager` / `NegotiationManager`.
- **Evidence:** `src/hooks/useEncounterOrchestration.js:113-176` (THREAT_ESCALATION + threatLevel mutation at 162-165); `src/features/danger/CombatPanel.jsx:501-611` (calculateCombatProbabilities).
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Error Handling & Observability

### [F-03] Save/load error swallowing in production builds
- **Category:** Flaw 20 — Weak error handling strategy
- **Impact:** High
- **Explanation:** A failed *save* emits `SAVE_FAILED` (good — see S-10). A failed *load* is asymmetric: `loadGame` logs via `this.log` which is gated on `DEV_MODE`, so production users see nothing. `attemptNPCRecovery` has `} catch { ... }` discarding the error object entirely. NPC corruption is detected only via brittle string-match `error.message.includes('NPC')`. A player whose save is corrupted past the narrow NPC-recovery heuristic gets a fresh game silently — no event, no notification, no log in production.
- **Evidence:** `src/game/state/managers/save-load.js:137-156` (load failure path); 165-175 (NPC string-match); 183-207 (catch{}); DEV-mode gating at `src/game/state/managers/base-manager.js:38-42`.
- **Found by:** Error Handling & Observability, Integration & Data

### [F-04] Bridge Pattern `getState()` escapes outside the documented exception
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** CLAUDE.md prohibits direct `getState()` outside `useGameEvent.js:34` (the bootstrap exception). Verified violations across `useEventTriggers.js` (lines 128, 150, 174, 198, 243, 261), `applyEncounterOutcome.js` (lines 16, 133, 139), `DevAdminPanel.jsx:145`, `game-dialogue.js:47`, `game-navigation.js:418`. These collectively erode the Bridge invariant the project explicitly defines.
- **Evidence:** `grep -rn "getState()" src/features/ src/hooks/` returns 11 hits outside the documented exception.
- **Found by:** Coupling & Dependencies

### [F-05] `coordinatorRef` capability is a self-documented backdoor
- **Category:** Flaw 23 — DI misuse
- **Impact:** Medium
- **Explanation:** `InfoBrokerCapabilities` and `DialogueCapabilities` typedefs explicitly include `coordinatorRef` and the typedef itself acknowledges: "This is a documented coupling that will be addressed if [X] is refactored separately." `info-broker.js` does `this.capabilities.coordinatorRef.getState()` and mutates returned state directly; `dialogue.js` dynamic-imports `game-dialogue.js` and passes `coordinatorRef` so the engine can call any coordinator method — bypassing the capability discipline used elsewhere.
- **Evidence:** `src/game/state/capabilities.js:203-208, 333-339` (typedef admits coupling); `src/game/state/managers/info-broker.js:40,67`; `src/game/state/managers/dialogue.js:87,120,125`.
- **Found by:** Coupling & Dependencies, Structure & Boundaries

### [F-06] `buildDialogueContext` is a circular-dependency island
- **Category:** Flaws 4, 6 — High dependencies / leaky abstraction
- **Impact:** Medium
- **Explanation:** `game-dialogue.js`'s `buildDialogueContext` calls 14+ distinct coordinator methods on the passed-in `gameStateManager`, plus reads `state` directly. The dialogue manager avoids static circular import by **dynamic-importing** `game-dialogue.js` in async methods (`startDialogue`, `selectDialogueChoice`). The dynamic-import is functioning code, but it's a smell signaling a true module-graph cycle that has been worked around rather than resolved. This is a vestige of the "two parallel structures" pattern (`src/game/game-*.js` stateless libraries vs. `src/game/state/managers/*.js` stateful managers) where the boundary has frayed.
- **Evidence:** `src/game/game-dialogue.js:46-95` (large coordinator surface); `src/game/state/managers/dialogue.js:87,120` (`await import('../../game-dialogue.js')`).
- **Found by:** Structure & Boundaries, Coupling & Dependencies

### [F-07] `DangerManager` probability methods take raw `gameState`, forcing `getState()` upstream
- **Category:** Flaws 23, 6 — DI misuse / leaky abstraction
- **Impact:** Medium
- **Explanation:** `DangerCapabilities` typedef declares getters for `getShipCargo`, `getShipUpgrades`, etc., but `calculatePirateEncounterChance(systemId, gameState)` and `calculateInspectionChance(systemId, gameState)` ignore those capabilities and read `gameState.ship.cargo`, `gameState.ship.engine`, `gameState.player.factions` from the parameter instead. This forces `useEventTriggers.js:32-44` to call `game.getState()` first to feed these methods — propagating the Bridge violation outward (see F-04).
- **Evidence:** `src/game/state/managers/danger.js:132,214` (signatures + `gameState.ship.cargo` usage); `src/hooks/useEventTriggers.js:32-44` (forced `getState()`).
- **Found by:** Coupling & Dependencies

### [F-08] `EventsManager.updateTime` is non-transactional with throwing dependents
- **Category:** Flaw 26 — Poor transactional boundaries
- **Impact:** Medium
- **Explanation:** `updateTime(newDays)` increments `daysElapsed` first (line 98), then runs 7 dependent operations (price-staleness, intelligence cleanup, market recovery, active-event recalculation, price recalc for known systems, loan defaults, debt tick, mission deadlines). `recalculatePricesForKnownSystems` *throws* `Error('Invalid state: activeEvents missing...')` and `Error('Invalid state: marketConditions missing...')`. If thrown, days have already advanced but events/prices/loan-checks/debt-tick/mission-deadlines may be partially or wholly unprocessed. On the next time-advance, the missed checks are not re-run for the skipped day.
- **Evidence:** `src/game/state/managers/events.js:95-148`; throwing dependent at `src/game/state/managers/trading.js:340, 344-346`.
- **Found by:** Integration & Data

### [F-09] `NPCManager` owns ship cargo manipulation
- **Category:** Flaw 11 — Low cohesion
- **Impact:** Medium
- **Explanation:** The 814-line `NPCManager` mixes (a) reputation/tier mechanics, (b) dialogue benefits queries, (c) financial loans, **and** (d) physical cargo storage manipulation. `storeCargo` and `retrieveCargo` walk `state.ship.cargo`, split stacks, and call `updateCargo` — structurally a `ShipManager` (or new `StorageManager`) concern, not an NPC-relationship concern. Loans similarly touch `updateCredits` and overlap with `DebtManager`.
- **Evidence:** `src/game/state/managers/npc.js:600-699` (storeCargo), `:711+` (retrieveCargo) — uses `getShipCargo`/`updateCargo` capabilities to rewrite ship inventory.
- **Found by:** Structure & Boundaries

### [F-10] Duplicated repair/trade validation between `features/*Utils` and managers
- **Category:** Flaw 9 — Shotgun surgery / duplication
- **Impact:** Medium
- **Explanation:** `repairUtils.calculateRepairCost` and `RepairManager.getRepairCost` use the same formula (`amount * REPAIR_CONFIG.COST_PER_PERCENT`, `Math.ceil`, `CONDITION_BOUNDS.MAX` short-circuit). `repairUtils.validateRepair` and `RepairManager.repairShipSystem` duplicate validation with the same ordering and error messages. `tradeUtils.validateBuy` duplicates the credit/cargo checks done by `TradingManager.buyGood`. Two sources of truth invite drift; changing repair pricing or buy-validation requires editing in two places with no enforced sync.
- **Evidence:** `src/features/repair/repairUtils.js:12-40, 105-133` vs. `src/game/state/managers/repair.js:30-41, 51-93`; `src/features/trade/tradeUtils.js:21-56` vs. `src/game/state/managers/trading.js:30-72`.
- **Found by:** Structure & Boundaries

### [F-11] Inconsistent return shapes across manager methods
- **Category:** Flaw 24 — Inconsistent API contracts
- **Impact:** Medium
- **Explanation:** No convention for synchronous transaction outcomes. `trading.buyGood` returns `{success, reason}`; `refuel.validateRefuel` returns `{valid, reason, cost}`; `refuel.refuel` returns `{success, reason}`; `repair.applyFreeRepair` returns `{success, repairedPercent, message}`; `combat.resolveCombatChoice` and `inspection.resolveInspection` *throw* on unknown choice. Validation and execution variants of the same workflow disagree (`validateRefuel` returns `valid`, but `refuel` returns `success`). Callers must guess.
- **Evidence:** `src/game/state/managers/trading.js:30-138`; `refuel.js:70-107, 120-165`; `repair.js:338-400`; `combat.js:23-61`; `inspection.js:21-50`.
- **Found by:** Integration & Data

### [F-12] Migration JSDoc contradicts implementation
- **Category:** Flaw 24 — Inconsistent API contracts (factual doc drift)
- **Impact:** Medium
- **Explanation:** `migrateFromV1ToV2`'s docstring says "Migrate save data from v1.0.0 to v4.1.0" with `@returns {Object} Migrated v4.1.0 state`, and devLogs "Migrating save from v1.0.0 to v4.1.0" — but the function only steps the version to `'2.0.0'`. `migrateFromV2ToV2_1` has the same problem (claims "v4.0.0" but steps to `'2.1.0'`). The chain works at runtime because `_applyMigrations` iterates each rule, but the JSDoc on individual migration functions is wrong and a developer reading them will misunderstand the contract.
- **Evidence:** `src/game/state/state-validators.js:432-578` (docstring vs. actual `state.meta.version = '2.0.0'` at line 574); 583-616 for the v2→v2.1 case.
- **Found by:** Integration & Data

### [F-13] `DEV_MODE` is a mutable export with async timing
- **Category:** Flaw 1 — Global mutable state
- **Impact:** Medium
- **Explanation:** `export let DEV_MODE = false` then async `initDevMode()` mutates it via `fetch('.dev')`. Consumers (`base-manager.js:39,49`, `dev-logger.js:16,29`) read the binding at call time, so the observed value depends on whether the fetch resolved before the call. An initialization race exists, even if it's rarely user-visible. Notably, this lives in a file whose docstring claims to hold "all static game data."
- **Evidence:** `src/game/constants.js:570` (`export let DEV_MODE`), `:581-607` (`initDevMode` mutates); consumers at `src/game/state/managers/base-manager.js:39,49`, `src/game/utils/dev-logger.js:16,29`.
- **Found by:** Structure & Boundaries

### [F-14] Magic numbers and rounding inconsistency in display layer
- **Category:** Flaws 25, 28 — Business logic in UI / magic numbers
- **Impact:** Medium
- **Explanation:** Two related issues. (a) Magic numbers in JSX despite CLAUDE.md mandating constants extraction: `JumpDialog.jsx:71` (`pirateChance > 0.25`), `RepairPanel.jsx:557, 622-628` (literal `=== 25` and "10%"/"25%" tier strings), `CombatPanel.jsx:292,298,348,354` (outcome strings like `"-15% fuel, -5% engine condition"` that the manager-side resolution can drift away from silently). (b) Rounding inconsistency: `refuelUtils.calculateRefuelCost` returns an un-rounded float (violates CLAUDE.md "round at calculation layer"), while `repairUtils.js` correctly uses `Math.ceil`; `ShipStatusPanel.jsx:40` uses `.toFixed(0)` (rounding at the display layer).
- **Evidence:** `src/features/navigation/JumpDialog.jsx:71`; `src/features/repair/RepairPanel.jsx:557, 622-628`; `src/features/danger/CombatPanel.jsx:292,298,348,354,449,455,622-630`; `src/features/refuel/refuelUtils.js:19-21`; `src/features/ship-status/ShipStatusPanel.jsx:40`.
- **Found by:** Error Handling & Observability

### [F-15] ~22 direct `console.error/warn` sites bypass the logger convention
- **Category:** Flaw 34 — Inconsistent error/logging conventions
- **Impact:** Medium
- **Explanation:** Despite a documented three-tier logger (`BaseManager.log/warn`, DEV-gated; `BaseManager.error`, always-on; `devLog`/`devWarn`), 20+ raw `console.error/warn` calls appear in features/hooks/free-helpers (`SystemPanel.jsx`, `JumpDialog.jsx`, `StarMapCanvas.jsx`, `DialoguePanel.jsx`, `useDialogue.js`, `useEncounterOrchestration.js`, `state/save-load.js` free functions, `game-dialogue.js`, `engine/game-animation.js`). React-side error handling has no convention — reading these gives the developer no taxonomy to apply.
- **Evidence:** `grep -rEn "console\.(error|warn)" src --include="*.js" --include="*.jsx" | grep -v test` returns ~22 hits outside the dev-logger module itself.
- **Found by:** Error Handling & Observability

### [F-16] No telemetry or runtime error reporting
- **Category:** Flaw 21 — No observability plan
- **Impact:** Medium
- **Explanation:** `ErrorBoundary.componentDidCatch` only `console.error`s. No Sentry/Bugsnag, no `window.onerror` handler, no `unhandledrejection` listener. For a single-player web game this is "Low" by itself; combined with F-03 (silent load failures) and F-15 (logging inconsistency), the project has no signal that real users are hitting errors.
- **Evidence:** `src/components/ErrorBoundary.jsx`; absence verified by `grep -rn "telemetry\|sentry\|analytics\|trackEvent\|reportError" src/` returning zero matches in production code.
- **Found by:** Error Handling & Observability

### [F-17] No general save→load→equal property test
- **Category:** Flaw 32 — Inadequate test coverage for a critical path
- **Impact:** Medium
- **Explanation:** Property-test directory has 100+ files, but `tests/property/npc-save-load-preservation.property.test.js` is the only round-trip property test for save/load — and it covers only the NPC slice. Migration paths have unit coverage and structural validation has unit tests, but there is no fast-check property like "for any valid game state, JSON.stringify → JSON.parse → migrate → addStateDefaults → assign → emit is equivalent to a no-op (or stable on second pass)". Save corruption on round-trip is among the highest-impact bug classes possible for this game.
- **Evidence:** `ls tests/property/ | grep -i save` returns one file; full corpus reviewed.
- **Found by:** Security & Code Quality

### [F-18] Save validation is type-only; no `Number.isFinite` or range checks
- **Category:** Flaw 30 — Security/safety as an afterthought (low severity given context)
- **Impact:** Low
- **Explanation:** `validateStateStructure` checks `typeof === 'number'` for credits, debt, daysElapsed, ship condition, faction reputations, etc. `NaN`, `Infinity`, `-Infinity`, negative credits, and 9e99 fuel all pass — `typeof NaN === 'number'`. `JSON.parse` at `save-load.js:67` uses no reviver. For a single-player offline-only game with no leaderboard this is genuinely low impact (the user can only cheat their own save), but a tampered or corrupted save can produce invalid game states that propagate `NaN` through computations.
- **Evidence:** `src/game/state/state-validators.js:187-430` (validateStateStructure); `src/game/state/save-load.js:67` (JSON.parse without reviver).
- **Found by:** Security & Code Quality

### [F-19] Steering drift: `isTanakaQuestActive` not in `MissionCapabilities` typedef
- **Category:** Flaw 5 — Dependency hygiene (steering vs. code)
- **Impact:** Low
- **Explanation:** `MissionCapabilities` JSDoc typedef does not declare `isTanakaQuestActive`, but `mission.js:20` uses `this.capabilities.isTanakaQuestActive?.()` and `game-coordinator.js:399` wires it. The capabilities file is the documented contract for cross-domain reads — letting it drift undermines its purpose as the auditable surface.
- **Evidence:** `src/game/state/capabilities.js:374-404` (no `isTanakaQuestActive`); `src/game/state/managers/mission.js:20` (uses it); `src/game/state/game-coordinator.js:399` (wires it).
- **Found by:** Coupling & Dependencies

### [F-20] `capabilities.js` is documentation-only and flagged unused by knip
- **Category:** Flaw 31 — Dead code / unused dependencies
- **Impact:** Low
- **Explanation:** `capabilities.js` (553 lines) contains only JSDoc typedefs — no runtime imports anywhere in `src/`. Knip flags it as unused. The file is intentional documentation (anchor for the post-GSM-refactor design), but a maintainer running `knip` cleanup may attempt to delete it. Either add a knip-ignore annotation or move typedefs into a `.d.ts`/manager-local docstrings.
- **Evidence:** `npx knip` output: `Unused files (1) src/game/state/capabilities.js`; `grep -rn "import.*capabilities" src/ tests/` returns zero hits.
- **Found by:** Security & Code Quality

## Coverage Checklist

### Flaw/Risk Types 1–34

| #  | Type                                                    | Status         | Finding |
|----|---------------------------------------------------------|----------------|---------|
| 1  | Global mutable state                                    | Observed       | F-13    |
| 2  | God object                                              | Not observed   | —       |
| 3  | Tight coupling                                          | Not observed   | —       |
| 4  | High/unstable dependencies                              | Observed       | F-06    |
| 5  | Circular dependencies                                   | Observed       | F-06, F-19 |
| 6  | Leaky abstractions                                      | Observed       | F-01, F-04, F-06, F-07 |
| 7  | Over-abstraction                                        | Not observed   | —       |
| 8  | Premature optimization                                  | Not observed   | —       |
| 9  | Shotgun surgery                                         | Observed       | F-10    |
| 10 | Feature envy / anemic domain model                      | Observed       | F-01    |
| 11 | Low cohesion                                            | Observed       | F-09    |
| 12 | Hidden side effects                                     | Not assessed   | —       |
| 13 | Inconsistent boundaries                                 | Observed       | F-01, F-02 |
| 14 | Distributed monolith                                    | Not applicable | —       |
| 15 | Chatty service calls                                    | Not applicable | —       |
| 16 | Synchronous-only integration                            | Not applicable | —       |
| 17 | No clear ownership of data                              | Not applicable | —       |
| 18 | Shared database across services                         | Not applicable | —       |
| 19 | Lack of idempotency                                     | Not observed   | —       |
| 20 | Weak error handling strategy                            | Observed       | F-03    |
| 21 | No observability plan                                   | Observed       | F-16    |
| 22 | Configuration sprawl                                    | Not observed   | —       |
| 23 | Dependency injection misuse                             | Observed       | F-05, F-07 |
| 24 | Inconsistent API contracts                              | Observed       | F-11, F-12 |
| 25 | Business logic in the UI                                | Observed       | F-02, F-14 |
| 26 | Poor transactional boundaries                           | Observed       | F-01, F-08 |
| 27 | Temporal coupling                                       | Observed       | F-01    |
| 28 | Magic numbers/strings everywhere                        | Observed       | F-14    |
| 29 | "Utility" dumping ground                                | Not observed   | —       |
| 30 | Security as an afterthought                             | Observed       | F-18    |
| 31 | Dead code / unused dependencies                         | Observed       | F-20    |
| 32 | Missing or inadequate test coverage for critical paths  | Observed       | F-17    |
| 33 | Hard-coded credentials or secrets in source             | Not applicable | —       |
| 34 | Inconsistent error/logging conventions across services  | Observed       | F-15    |

### Strength Categories S1–S14

| #   | Category                              | Status        | Finding |
|-----|---------------------------------------|---------------|---------|
| S1  | Clear modular boundaries              | Observed      | S-02    |
| S2  | High cohesion                         | Observed      | S-05    |
| S3  | Loose coupling                        | Observed      | S-02    |
| S4  | Dependency direction is stable        | Observed      | S-03    |
| S5  | Dependency management hygiene         | Not assessed  | —       |
| S6  | Consistent API contracts              | Observed      | S-04    |
| S7  | Robust error handling                 | Not observed  | —       |
| S8  | Observability present                 | Observed      | S-07    |
| S9  | Configuration discipline              | Observed      | S-05    |
| S10 | Security built-in                     | Observed      | S-09, S-10 |
| S11 | Testability & coverage                | Observed      | S-08, S-09 |
| S12 | Resilience patterns                   | Observed      | S-06    |
| S13 | Domain modeling strength              | Observed      | S-02    |
| S14 | Simple, pragmatic abstractions        | Observed      | S-01    |

> S5 is not assessed in detail because the production dependency surface is trivially clean (only `react`, `react-dom`, `three`); S7 is marked "Not observed" because robust error handling is uneven — strong on the save-write path (S-10) but weak on the load path (F-03) and the encounter pipeline (F-01).

## Hotspots

The three places to look first — risk and strong-core combined:

1. **`src/features/danger/applyEncounterOutcome.js` + `src/hooks/useEncounterOrchestration.js` + `src/features/danger/CombatPanel.jsx`** — The encounter pipeline is the largest concentration of remaining architectural debt: cross-domain mutation in a UI feature folder (F-01), state machine and game-rule logic in React hooks/JSX (F-02), and direct `getState()` calls bypassing the Bridge Pattern (F-04). All four specialists independently flagged this area.

2. **`src/game/state/game-coordinator.js` + `src/game/state/capabilities.js` + `src/game/state/managers/`** — The strong core hotspot worth protecting. The post-GSM-refactor architecture is genuinely clean (S-01, S-02). Watch for `coordinatorRef` capability (F-05) leaking into more managers, and for capability typedef drift (F-19).

3. **`src/game/state/managers/save-load.js` + `src/game/state/state-validators.js`** — Mixed: strong migration chain (S-06) and write-path resilience (S-10), but weak load-path observability (F-03), JSDoc/impl drift on migrations (F-12), validation-only-by-type (F-18), and missing round-trip property test (F-17). Save/load is the highest-stakes path in a game with no cloud backup.

## Next Questions

1. Is the encounter pipeline (F-01, F-02) on the roadmap? It's the single largest concentration of unresolved architectural debt and is independently flagged by four specialists. Is there appetite for an `EncounterOutcomeManager` to absorb `applyEncounterOutcome`'s responsibilities?
2. Should `coordinatorRef` (F-05) be replaced by capability bags for `InfoBrokerManager` and `DialogueManager`, or is the documented backdoor permanent? The typedefs say "will be addressed" — has that work been scoped?
3. Are `src/features/*/*Utils.js` files intended to be canonical (with managers wrapping them) or are they UI-side wrappers (with managers canonical)? F-10 cannot be resolved without that decision.
4. Is silent fresh-game-on-corruption (F-03) intentional UX, or an accident of asymmetric error handling between save and load? A `LOAD_FAILED` event symmetric to `SAVE_FAILED` would close the gap with one event constant.
5. Is the `src/game/game-*.js` cluster (game-trading, game-events, game-navigation, game-dialogue, game-information-broker, game-npcs, event-conditions, mission-generator) on a path to be folded into `src/game/state/managers/` or to a documented stateless-libraries directory? F-06 and the dynamic-import workaround in `DialogueManager` are symptoms of this boundary not being settled.

## Analysis Metadata

- **Agents dispatched:** 5 specialists (Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error Handling & Observability, Security & Code Quality) + 1 verifier
- **Scope:** full repository — `src/` (171 source files) and `tests/` (~150+ test files)
- **Raw findings:** 46 (before verification)
- **Verified findings:** 30 (after verification)
- **Filtered out / merged:** 16 (1 dropped as false positive; 15 merged via cross-specialist deduplication into the 30 verified)
- **By impact:** 3 high (F-01, F-02, F-03) + 4 high-positive (S-01, S-02, S-03, S-04); 14 medium flaws + 6 medium positives; 3 low flaws
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `developer_docs/bridge-pattern.md`, `MEMORY.md`
