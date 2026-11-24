# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 [working tree dirty]
**Languages:** JavaScript (ES Modules), React 18, Three.js, Vite, Vitest
**Key directories:** `src/App.jsx`, `src/components/`, `src/context/`, `src/features/` (24 feature modules), `src/game/state/managers/` (25 managers), `src/game/engine/`, `src/game/data/`, `src/game/utils/`, `src/hooks/` (20 hooks)
**Scope:** Full repo

## Repo Overview

Tramp Freighter Blues is a single-player space trading survival game built as a single Vite-bundled SPA — no backend, no networked services, persistence via `localStorage` only. The architecture centers on a Bridge Pattern that connects an imperative `GameCoordinator` singleton to React's declarative model: `useGameEvent` hooks subscribe to state-change events and `useGameAction` hooks invoke domain actions, with components forbidden from reading `GameCoordinator` state directly. The 1642-line `GameCoordinator` is the intentional post-refactor facade produced by a recently completed refactor (the "GSM Refactor"), delegating work to 25 capability-injected domain managers (Trading, Ship, NPC, Mission, Danger, Combat, Negotiation, Inspection, Distress, MechanicalFailure, etc.). Approximate size: 171 source files, 441 test files (unit/integration/property layers, with `fast-check` property-based tests).

## Strengths

### [S-1] Manager state ownership table (capabilities)
- **Category:** S1 Clear modular boundaries
- **Impact:** High
- **Explanation:** A central JSDoc ownership table maps every manager to the exact state slice it may write, and every cross-domain access flows through narrowly typed capability bags wired at the composition root.
- **Evidence:** `src/game/state/capabilities.js:17-49` (`<file-scope>` STATE SLICE OWNERSHIP table), excerpt: `"| ShipManager | ship.hull, ship.engine, ship.lifeSupport, ship.quirks, ship.upgrades, ship.cargoCapacity, ship.hiddenCargo, ship.name |"`
- **Found by:** structure-boundaries

### [S-2] Acyclic dependency graph; uniformly inward layer direction
- **Category:** S4 Dependency direction is stable
- **Impact:** High
- **Explanation:** `madge --circular` over 111 files reports no cycles; data and utils are sinks, managers depend only on `BaseManager` + constants, and features depend only on hooks/components. The static graph confirms layered intent.
- **Evidence:** `src/` (`<file-scope>` graph), excerpt: madge output `"Processed 111 files (593ms) (2 warnings) ✔ No circular dependency found!"`
- **Found by:** coupling-dependencies

### [S-3] Bridge Pattern enforced — UI never imports managers/coordinator
- **Category:** S3 Loose coupling
- **Impact:** High
- **Explanation:** Grep across `src/components/`, `src/features/`, `src/hooks/`, and `src/App.jsx` for `import.*managers/` or `import.*game-coordinator` returns no matches. The 24 feature modules and 7 shared components see only `useGame()`/`useGameAction()`/`useGameEvent()`.
- **Evidence:** `src/context/GameContext.jsx`, `src/hooks/useGameEvent.js`, `src/hooks/useGameAction.js` (Bridge hooks), excerpt: hooks return memoised composition of seven domain action bundles; components receive only this narrowed surface.
- **Found by:** coupling-dependencies

### [S-4] Direct test coverage on every architectural critical path
- **Category:** S11 Testability & coverage
- **Impact:** High
- **Explanation:** Save/load + migration, encounter RNG determinism, money math, ship-name sanitization, cargo flow, and mission completion each have dedicated, named test files — not just incidental coverage from broader tests.
- **Evidence:** `tests/unit/save-load.test.js`, `save-load-migration.test.js`, `state-validators.test.js`, `seeded-random-seeds.test.js`, `debt-manager.test.js`, `currency-standardization.test.js`, `ship-manager.test.js`, `cargo-stack-operations.test.js`, `mission-completion.test.js` (`<file-scope>` test inventory).
- **Found by:** security-code-quality

### [S-5] Three-tier ErrorBoundary with init-phase recovery affordance
- **Category:** S7 Robust error handling
- **Impact:** High
- **Explanation:** `ErrorBoundary` wraps the app at three nested levels (top-level, around the Three.js canvas, around the panel container), and `main.jsx` provides an init-phase static fallback with a "Clear Save and Restart" button — the right safety net for the most likely failure cause (corrupt `localStorage` save).
- **Evidence:** `src/components/ErrorBoundary.jsx`; mounts at `src/App.jsx:396, 421, 503`; init fallback at `src/main.jsx:158-161`. Excerpt: separate `PanelErrorBoundary` at `src/features/dev-admin/DevPanelPreview.jsx:31, 126`.
- **Found by:** error-handling-observability

### [S-6] Single-source-of-truth `constants.js` config namespace
- **Category:** S9 Configuration discipline
- **Impact:** High
- **Explanation:** All operationally significant values (timeouts, thresholds, prices, debounce intervals, `SAVE_KEY`, `GAME_VERSION`, `EVENT_NAMES`) live in a deeply-grouped 2022-line `constants.js`. Validators, save-load, managers, and engine code all import from this module.
- **Evidence:** `src/game/constants.js` (`<file-scope>`), excerpt: named groups including `MISSION_CONFIG`, `DANGER_CONFIG`, `COMBAT_CONFIG`, `NPC_BENEFITS_CONFIG`, `REPUTATION_BOUNDS`, `UI_CONFIG`, `NOTIFICATION_CONFIG`.
- **Found by:** error-handling-observability

### [S-7] Clean test seams — capability injection + RNG parameterization
- **Category:** S11 Testability & coverage
- **Impact:** High
- **Explanation:** Managers extend `BaseManager(capabilities)` and consume cross-domain reads/writes via injected callbacks; tests construct managers with hand-rolled capability objects. Gameplay-significant RNG is parameterized at every site so seeded determinism can be injected.
- **Evidence:** `src/game/state/managers/base-manager.js:9-22` (`BaseManager` constructor), `src/game/state/managers/ship.js:34` (`assignShipQuirks(rng = Math.random)`), `src/game/state/managers/event-engine.js:62` (`checkEvents(... rngFn = Math.random)`); test seam usage at `tests/unit/combat-lucky-negation.test.js:28-39`, `mechanical-failure.test.js:8-32`.
- **Found by:** security-code-quality

### [S-8] Versioned save schema with explicit migration chain
- **Category:** S6 Consistent API contracts
- **Impact:** High
- **Explanation:** `state-validators.js` is a single source of truth for the persisted save shape: a structural validator, a supported-version table (1.0.0 → 2.0.0 → 2.1.0 → 4.0.0 → 4.1.0 → 5.0.0), explicit forward migrations, and additive backward compatibility for renamed fields.
- **Evidence:** `src/game/state/state-validators.js:153-1019` (`validateStateStructure`, `isVersionCompatible`, `addStateDefaults`, `migrateFromV1ToV2` … `migrateFromV4_1ToV5`); `normalizeCargoStack:107-142` (renamed-field migration in place).
- **Found by:** integration-data

### [S-9] Capability injection chosen over inheritance / DI container
- **Category:** S14 Simple, pragmatic abstractions
- **Impact:** Medium
- **Explanation:** `BaseManager` is a 61-line shared logger + capability-storage shim — no DI container, no `Service` base class, no auto-wiring magic. Each manager gets a hand-tailored capability bag with exactly the reads/writes it needs.
- **Evidence:** `src/game/state/managers/base-manager.js:1-61`; wiring exemplar at `src/game/state/game-coordinator.js:209-220` (`RefuelManager` gets exactly `{ getShipFuel, getCredits, getCurrentSystem, getFuelCapacity, updateCredits, updateFuel, markDirty, emit, starData, isTestEnvironment }`).
- **Found by:** structure-boundaries

### [S-10] Domain managers cohere on shared state slice + shared vocabulary
- **Category:** S2 High cohesion
- **Impact:** Medium
- **Explanation:** Every method in `NPCManager` (814 lines) operates on the `npcs.*` state slice and a single domain vocabulary (rep, tier, tip, favor, loan, storage). Same pattern in `ShipManager` (740 lines, all methods bind on `state.ship`).
- **Evidence:** `src/game/state/managers/npc.js` (whole file); `src/game/state/managers/ship.js` (whole file); git log shows commits touching multiple methods of one manager when single requirements change.
- **Found by:** structure-boundaries

### [S-11] Consistent `{ success, reason }` action-result envelope across managers
- **Category:** S6 Consistent API contracts (also informs S7)
- **Impact:** Medium
- **Explanation:** Twelve-plus managers return the same shape from action methods; UI panels consume `result.reason` directly without per-method special-casing. The shape is the React-component-facing API contract via `useGameAction`.
- **Evidence:** `src/game/state/managers/refuel.js:138, 164`; `repair.js:57, 77, 81, 85, 107, 143, 161, 193, 212, 228, 242, 262`; `trading.js:36, 40, 72, 89, 93, 97, 131`; `debt.js:152, 156, 191, 199, 205, 233, 279`. Consumers: `src/features/repair/RepairPanel.jsx:140, 158`, `src/features/missions/MissionBoardPanel.jsx:84`, `src/features/trade/TradePanel.jsx:165, 173`.
- **Found by:** error-handling-observability, integration-data

## Flaws/Risks

### [F-2] `attemptNPCRecovery` swallows save-recovery errors with parameter-less catch
- **Category:** 20 Weak error handling strategy
- **Impact:** High
- **Explanation:** A catch on a save-loss-adjacent path drops the exception object entirely (no parameter), then logs only when `DEV_MODE` is set, then returns `null` — indistinguishable from "no save existed." The outer `loadGame` then falls through to `initNewGame()`, silently destroying any partial recovery diagnostic.
- **Evidence:** `src/game/state/managers/save-load.js:202-204`, excerpt: `"} catch { this.log('Recovery failed, starting new game'); }"`
- **Found by:** error-handling-observability

### [F-1] `executeJump` returns `{success, error}` while every other manager returns `{success, reason}`
- **Category:** 34 Inconsistent error/logging conventions across services
- **Impact:** Medium
- **Explanation:** The single most-frequent player action uses a different result envelope key than the dozen-plus other manager actions. Maintainers wiring the wrong key fail silently — `result.reason` reads as `undefined`, surfacing an empty error to the player.
- **Evidence:** `src/game/game-navigation.js:421, 449, 527` (`NavigationSystem.executeJump`), excerpt: `"return { success: true, error: null };"` vs. every other manager's `{ success, reason }` shape. Caller divergence: `src/features/navigation/JumpDialog.jsx:85` reads `result.error`; `MissionBoardPanel.jsx:84`, `FinancePanel.jsx:38, 54`, `RepairPanel.jsx:140, 158`, `TradePanel.jsx:165, 173` read `result.reason`.
- **Found by:** error-handling-observability

### [F-3] Encounter outcome stale-snapshot pattern can revert ship-system damage
- **Category:** 26 Poor transactional boundaries (in-process)
- **Impact:** Medium
- **Explanation:** `applyEncounterOutcome` reads `game.getState()` once and uses that single snapshot as the baseline for every cost branch. Each branch calls `updateShipCondition(hull, engine, lifeSupport)` which overwrites all three fields — applying both hull and engine costs in the same outcome silently restores hull damage. Latent today (current outcomes are single-system) but the contract is broken for any future multi-system outcome.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:16-54`, excerpt: `"const state = game.getState();"` at line 16, then `"game.updateShipCondition(state.ship.hull, newEngine, state.ship.lifeSupport);"` at line 41 — passing the *original* hull value.
- **Found by:** integration-data

### [F-4] `InformationBroker` uses `coordinatorRef.getState()` to mutate full state tree
- **Category:** 6 Leaky abstractions
- **Impact:** Medium
- **Explanation:** `InfoBrokerManager` bypasses the capability surface by passing `coordinatorRef` to a static engine method that directly writes `gameState.player.credits` and `gameState.world.priceKnowledge[systemId]`. The capability typedef explicitly admits this is a known leak.
- **Evidence:** `src/game/state/managers/info-broker.js:39-47, 67-74`, excerpt: `"const state = this.capabilities.coordinatorRef.getState();"` at line 40. `src/game/state/capabilities.js:334-339` JSDoc: "documented coupling that will be addressed if InformationBroker is refactored separately."
- **Found by:** coupling-dependencies

### [F-5] `DialogueManager` hands `coordinatorRef` to dialogue engine; engine reaches into ~30 coordinator methods
- **Category:** 6 Leaky abstractions
- **Impact:** Medium
- **Explanation:** A runtime `await import('../../game-dialogue.js')` resolves a runtime cycle and the engine then calls roughly 30 distinct coordinator methods (`getKarma`, `getNPCState`, `getNarrativeFlags`, `requestLoan`, `storeCargo`, `advanceQuest`, `modifyColeRep`, …). Static cycle detection misses this because the import is lazy.
- **Evidence:** `src/game/state/managers/dialogue.js:87-93, 120-126` (`DialogueManager.startDialogue`/`selectDialogueChoice`), excerpt: `"const { showDialogue } = await import('../../game-dialogue.js'); const dialogueDisplay = showDialogue(npcId, nodeId, this.capabilities.coordinatorRef);"`. `src/game/state/capabilities.js:204-208` documents this as a bypass.
- **Found by:** coupling-dependencies

### [F-6] `executeJump` four-step mutation has no rollback path
- **Category:** 26 Poor transactional boundaries (in-process)
- **Impact:** Medium
- **Explanation:** Jump performs `updateFuel → updateTime → updateLocation → updateShipCondition` in sequence with no compensation. `updateTime` cascades through eight per-day dependents (loan defaults, mission deadlines, market recovery, etc.). If `updateLocation` throws after fuel and days have already mutated, the player has burned fuel and absorbed N days of consequences while still located at origin.
- **Evidence:** `src/game/game-navigation.js:454-471` (`NavigationSystem.executeJump`); throw site at `src/game/state/managers/navigation.js:51-55`. Excerpt: `"gameStateManager.updateFuel(...); gameStateManager.updateTime(...); gameStateManager.updateLocation(targetSystemId);"`
- **Found by:** integration-data

### [F-7] `EventsManager.updateTime` requires fixed eight-step cross-manager sequence
- **Category:** 27 Temporal coupling
- **Impact:** Medium
- **Explanation:** Eight sequential capability calls — staleness increment → intelligence cleanup → market recovery → event recompute → price recalc → loan defaults → debt tick → mission deadlines — must run in this exact order for correct game-tick semantics. The contract is documented in JSDoc prose only; reordering produces plausible-shaped wrong state with no exception.
- **Evidence:** `src/game/state/managers/events.js:95-148` (`EventsManager.updateTime`); ordering documented at `src/game/state/capabilities.js:407-441`. Excerpt: re-reads `getPriceKnowledge`/`getMarketConditions` after staleness/cleanup steps; out-of-order reader sees partially mutated state.
- **Found by:** coupling-dependencies

### [F-8] `GameCoordinator` constructor wires forward-references resolved only by lazy arrow capture
- **Category:** 23 Dependency injection misuse
- **Impact:** Medium
- **Explanation:** Capability lambdas reference `this.dangerManager`, `this.achievementsManager`, `this.questManager`, `this.debtManager` at composition sites that precede those managers' construction. The pattern works today because all manager constructors are inert; a future manager that calls a capability synchronously in its constructor will silently break ordering.
- **Evidence:** `src/game/state/game-coordinator.js:86-491`. Excerpts: line 124 wires `getDangerZone` before `this.dangerManager` is constructed at line 292; lines 142, 174, 203, 304 wire `checkAchievements` before `this.achievementsManager` at line 480; line 399 wires `isTanakaQuestActive` before construction at line 412.
- **Found by:** coupling-dependencies

### [F-9] Three.js engine modules hold module-level mutable selection/connection state
- **Category:** 1 Global mutable state
- **Impact:** Medium
- **Explanation:** Module-level `let selectedStar`, `currentSystemIndicator`, `currentSystemMaterial` (and parallel state in `wormholes.js`) are written by handler functions and read by separate query functions. The presence and active use of `_resetState()` and `clearWormholeConnections()` test hooks across multiple test files is direct evidence of cross-test pollution risk.
- **Evidence:** `src/game/engine/interaction.js:5-7` (`<file-scope>` mutable bindings); `src/game/engine/wormholes.js:6-7`. Excerpt: `"let selectedStar = null; let currentSystemIndicator = null; let currentSystemMaterial = null;"`
- **Found by:** structure-boundaries

### [F-11] `JumpDialog` and `SystemPanel` swallow jump errors with `console.error` only
- **Category:** 20 Weak error handling strategy
- **Impact:** Medium
- **Explanation:** When `executeJump` returns `{success: false, error}` or throws, the UI logs to console but does not surface the failure to the player — no notification, no inline error, no dialog. Validation errors (insufficient fuel, no wormhole, ship-condition gate) become invisible to non-developer players.
- **Evidence:** `src/features/navigation/JumpDialog.jsx:84-89`, excerpt: `"if (result.success) { onJumpComplete(...); onClose(); } else { console.error('Jump failed:', result.error); }"`. `src/features/navigation/SystemPanel.jsx:104-107` same pattern.
- **Found by:** error-handling-observability

### [F-10] Reputation clamp literals `-100, 100` repeated alongside named `REPUTATION_BOUNDS`
- **Category:** 28 Magic numbers/strings everywhere
- **Impact:** Low
- **Explanation:** Two clamp sites in the same file use raw `-100, 100` literals while elsewhere in the same file `REPUTATION_BOUNDS.MIN` / `.HOSTILE_MAX` are imported and used correctly — a one-file-internal inconsistency that violates the project's own constants discipline.
- **Evidence:** `src/game/state/managers/npc.js:141, 427-431`. Excerpt line 141: `"const newRep = Math.max(-100, Math.min(100, Math.round(oldRep + amount)));"`. Correct usage in same file at lines 541-563.
- **Found by:** error-handling-observability

### [F-12] `pirateChance > 0.25` inline threshold for "high risk" jump warning
- **Category:** 28 Magic numbers/strings everywhere
- **Impact:** Low
- **Explanation:** A UI-behavior threshold for the pirate-encounter risk badge is hard-coded at the call site. Per CLAUDE.md, all percentages, multipliers, and thresholds belong in `constants.js`.
- **Evidence:** `src/features/navigation/JumpDialog.jsx:71`, excerpt: `"const isHighRisk = dangerZone === 'dangerous' || pirateChance > 0.25;"`
- **Found by:** error-handling-observability

### [F-13] Inline 3000 ms display duration in `RumorAlert`
- **Category:** 28 Magic numbers/strings everywhere
- **Impact:** Low
- **Explanation:** A HUD overlay's auto-dismiss timeout is hard-coded inline, while sibling files (`AchievementToast.jsx`, notification config) source equivalent durations from `NOTIFICATION_CONFIG` / `ACHIEVEMENTS_CONFIG`. Single-file convention lapse.
- **Evidence:** `src/features/hud/RumorAlert.jsx:22`, excerpt: `"const timer = setTimeout(() => setVisible(false), 3000);"`
- **Found by:** error-handling-observability

## Coverage Checklist

### Flaw/Risk Types 1–34

| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Observed | F-9 |
| 2 | God object | Not observed | — |
| 3 | Tight coupling | Not observed | — |
| 4 | High/unstable dependencies | Not observed | — |
| 5 | Circular dependencies | Not observed | — |
| 6 | Leaky abstractions | Observed | F-4, F-5 |
| 7 | Over-abstraction | Not observed | — |
| 8 | Premature optimization | Not observed | — |
| 9 | Shotgun surgery | Not observed | — |
| 10 | Feature envy / anemic domain model | Not observed | — |
| 11 | Low cohesion | Not observed | — |
| 12 | Hidden side effects | Not observed | — |
| 13 | Inconsistent boundaries | Not observed | — |
| 14 | Distributed monolith | Not applicable | — |
| 15 | Chatty service calls | Not applicable | — |
| 16 | Synchronous-only integration | Not applicable | — |
| 17 | No clear ownership of data | Not observed | — |
| 18 | Shared database across services | Not applicable | — |
| 19 | Lack of idempotency | Not observed | — |
| 20 | Weak error handling strategy | Observed | F-2, F-11 |
| 21 | No observability plan | Not assessed | — |
| 22 | Configuration sprawl | Not observed | — |
| 23 | Dependency injection misuse | Observed | F-8 |
| 24 | Inconsistent API contracts | Not observed | — |
| 25 | Business logic in the UI | Not observed | — |
| 26 | Poor transactional boundaries | Observed | F-3, F-6 |
| 27 | Temporal coupling | Observed | F-7 |
| 28 | Magic numbers/strings everywhere | Observed | F-10, F-12, F-13 |
| 29 | "Utility" dumping ground | Not observed | — |
| 30 | Security as an afterthought | Not applicable | — |
| 31 | Dead code / unused dependencies | Not observed | — |
| 32 | Missing or inadequate test coverage for critical paths | Not observed | — |
| 33 | Hard-coded credentials or secrets in source | Not applicable | — |
| 34 | Inconsistent error/logging conventions across services | Observed | F-1 |

### Strength Categories S1–S14

| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | S-1 |
| S2 | High cohesion | Observed | S-10 |
| S3 | Loose coupling | Observed | S-3 |
| S4 | Dependency direction is stable | Observed | S-2 |
| S5 | Dependency management hygiene | Not observed | — |
| S6 | Consistent API contracts | Observed | S-8, S-11 |
| S7 | Robust error handling | Observed | S-5, S-11 |
| S8 | Observability present | Not applicable | — |
| S9 | Configuration discipline | Observed | S-6 |
| S10 | Security built-in | Not applicable | — |
| S11 | Testability & coverage | Observed | S-4, S-7 |
| S12 | Resilience patterns | Not applicable | — |
| S13 | Domain modeling strength | Not observed | — |
| S14 | Simple, pragmatic abstractions | Observed | S-9 |

## Hotspots

1. `src/game/game-navigation.js` + `src/features/danger/applyEncounterOutcome.js` — concentration of in-process transaction-boundary risks (F-3, F-6) plus the `{success, error}` vs. `{success, reason}` envelope drift (F-1) and the silent-swallow UX path (F-11). These are the most user-visible architectural risks because jumps and encounter outcomes are the central gameplay loop.
2. `src/game/state/managers/save-load.js` and `src/game/state/state-validators.js` — strong-core hotspot. The migration chain (S-8) is the most disciplined contract surface in the codebase, but it sits right next to the High-impact `attemptNPCRecovery` silent-swallow (F-2). Worth co-reviewing because the recovery path is what protects the discipline above it.
3. `src/game/state/game-coordinator.js` and `src/game/state/capabilities.js` — strong-core hotspot. The 1642-line facade is genuinely a delegation layer, and the capability typedefs are the architectural spine (S-1, S-9). However, two leaky-abstraction admissions (F-4, F-5) and the forward-reference wiring pattern (F-8) all live here. This is the place to look when assessing whether the GSM Refactor's invariants are still holding.

## Next Questions

1. The capability typedefs at `capabilities.js:334-339` and `:204-208` self-document the `coordinatorRef` leaks for `InformationBroker` and `DialogueManager` as deferred work — what's the trigger for closing those, and is there a regression risk in deferring further?
2. `applyEncounterOutcome` reuses a stale state snapshot across cost branches (F-3); is there a planned outcome shape (e.g., a "broadside" or "system overload" event) that would damage two systems in the same outcome and trip the latent bug?
3. The `executeJump` mutation order (F-6) precedes any compensating-action path; how is partial-jump corruption currently caught — is it only by player-visible inconsistency, or is there an integrity check on the next save load?
4. `EventsManager.updateTime` documents its eight-step ordering in JSDoc only (F-7); have any past bugs traced back to step reordering, and what's the test strategy for detecting an out-of-order regression?
5. `JumpDialog`/`SystemPanel` swallow jump errors to console (F-11) while `useNotificationContext` is available and used elsewhere; was the omission deliberate (e.g., validation should pre-empt all error paths) or an oversight?

## Analysis Metadata

- **Agents dispatched:** Structure & Boundaries; Coupling & Dependencies; Integration & Data; Error Handling & Observability; Security & Code Quality (5 specialists in parallel) + Verifier
- **Scope:** Full repo — 171 source files in `src/`, 441 test files in `tests/`
- **Raw findings:** 29 (5 specialists)
- **Verified findings:** 24 (11 strengths, 13 flaws)
- **Filtered out:** 5 (anemic-domain claim-not-supported; tight-coupling stats lambdas below evidence floor; dead-code re-export at floor confidence; secondary navigation-validation transaction-boundary subsumed by F-6; tertiary updateTime transaction-boundary subsumed by F-7)
- **By impact:** 9 high (8 strengths + 1 flaw), 12 medium (3 strengths + 9 flaws), 3 low (3 flaws)
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `README.md`, `DEVELOPMENT.md`, `docs/architecture/2026-03-13-tramp-freighter-architecture-report.md`
