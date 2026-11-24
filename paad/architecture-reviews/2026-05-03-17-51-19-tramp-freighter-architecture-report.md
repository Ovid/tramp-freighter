# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 [working tree dirty]
**Languages:** JavaScript (ES Modules), JSX; React 18, Three.js (~0.150), Vite 5, Vitest 1, fast-check
**Key directories:** `src/App.jsx`, `src/main.jsx`, `src/components/`, `src/context/`, `src/features/` (22 feature modules), `src/game/` (constants, data, engine, state, utils), `src/game/state/managers/` (25 capability-injected managers), `src/hooks/` (19 custom hooks), `tests/` (441 files: unit, property, integration)
**Scope:** full repo (171 source files, ~42,627 LOC; 441 test files)

## Repo Overview

Tramp Freighter Blues is a single-player browser-based space trading survival game. The architecture is unusually disciplined for a 42K-LOC SPA: an imperative `GameCoordinator` singleton owns mutable game state and delegates to 25 domain managers (combat, navigation, trading, ship, npc, mission, save-load, etc.), each receiving a JSDoc-typed capability object via constructor injection. A Bridge Pattern (`useGameEvent` / `useGameAction`) keeps React components from touching state directly. Persistence is `localStorage` with a versioned migration chain (v1 → v5). There is no backend, no auth, no telemetry — and none would be appropriate for this product. The dominant recent activity is the just-completed "GSM Refactor" that introduced the capability-injection seam across all managers.

## Strengths

Ranked by impact, 16 items:

### [S-1] Capability-injection state-slice ownership
- **Category:** S1 — Clear modular boundaries
- **Impact:** High
- **Explanation:** `capabilities.js` documents which manager owns which slice of `state` via a typedef table; manager files honor those declarations.
- **Evidence:** `src/game/state/capabilities.js:16-49` (typedef block), with content matching `src/game/state/managers/ship.js`, `trading.js`, `dialogue.js`.
- **Found by:** Structure & Boundaries

### [S-2] Capability-injection narrows manager APIs
- **Category:** S3 — Loose coupling
- **Impact:** High
- **Explanation:** Each of 25 managers receives a JSDoc-typed capability object instead of a coordinator handle; `BaseManager` validates capabilities at construction; zero cross-manager imports.
- **Evidence:** `src/game/state/capabilities.js:1-553`, `src/game/state/managers/base-manager.js:15`. Test doubles use `class TestManager extends BaseManager {}` with synthesized capabilities.
- **Found by:** Coupling & Dependencies

### [S-3] DI is manual constructor injection at one composition root
- **Category:** S3 — Loose coupling
- **Impact:** High
- **Explanation:** Resolution trace for any capability is two file reads: `main.jsx` → `GameCoordinator` constructor. No container, no lazy proxies, no string keys.
- **Evidence:** `src/game/state/game-coordinator.js:75-491` (constructor wiring); `src/main.jsx:6` (sole `new GameCoordinator(...)` site).
- **Found by:** Coupling & Dependencies

### [S-4] UI-to-domain dependency direction is enforced
- **Category:** S4 — Stable dependency direction
- **Impact:** High
- **Explanation:** `src/game/` never imports from `src/features/`, `src/hooks/`, or `src/components/`. UI consumes domain through `GameContext`. Fan-in: GameCoordinator=1, GameContext=19, constants.js=121.
- **Evidence:** Repository-wide grep returns zero reverse imports; `src/main.jsx`, `src/context/GameContext.jsx:9`.
- **Found by:** Coupling & Dependencies

### [S-5] Zero secret-bearing surface, by architecture
- **Category:** S10 — Security built-in
- **Impact:** High
- **Explanation:** Single-player offline game with no auth, no API keys, no tokens. The only `fetch()` is the dev-mode probe. No `eval()` or `new Function()`. No `.env*`/`.pem`/`.key` files.
- **Evidence:** Repository-wide grep on common secret patterns returns zero hits in `src/`. `src/game/constants.js:586` is the only `fetch` site.
- **Found by:** Security & Code Quality

### [S-6] Single input-sanitization chokepoint per untrusted-input boundary
- **Category:** S10 — Security built-in
- **Impact:** High
- **Explanation:** Ship-name input routes through `sanitizeShipName` (HTML-tag strip + length cap); save data routes through `validateStateStructure` plus the migration chain. Each untrusted boundary has exactly one translation primitive at the boundary.
- **Evidence:** `src/game/utils/string-utils.js:19-31`, `src/game/state/state-validators.js:187` (`validateStateStructure`).
- **Found by:** Security & Code Quality

### [S-7] Critical-path test coverage is named and present
- **Category:** S11 — Testability & coverage
- **Impact:** High
- **Explanation:** Save/load (6 files), migrations (4 files), state validators (3 files), encounter resolution (5+ files), jump validation (2 files) — every critical path has at least one named test file.
- **Evidence:** `tests/unit/save-load*.test.js`, `tests/unit/*-migration.test.js`, `tests/unit/state-validators*.test.js`, `tests/unit/combat-manager-coverage.test.js`, etc. (441 tests total).
- **Found by:** Security & Code Quality

### [S-8] Centralized configuration with strong project rule
- **Category:** S9 — Configuration discipline
- **Impact:** High
- **Explanation:** All gameplay tuning values live in one 2022-line file partitioned into named config objects (`COMBAT_CONFIG`, `KARMA_CONFIG`, `INSPECTION_CONFIG`, `SHIP_CONFIG`, etc.); CLAUDE.md elevates this to a binding rule.
- **Evidence:** `src/game/constants.js`. Most managers and panels source from named configs (verified by grep).
- **Found by:** Error Handling & Observability

### [S-9] Two-tier React error-boundary pattern
- **Category:** S7 — Robust error handling
- **Impact:** Medium
- **Explanation:** `ErrorBoundary` catches React-tree errors with a recoverable fallback; `renderErrorUI` in `main.jsx` catches hard initialization errors with a "Clear Save and Restart" escape hatch; SAVE_FAILED additionally surfaces via `NotificationContainer`.
- **Evidence:** `src/components/ErrorBoundary.jsx:25-145`, `src/main.jsx:93-141`, `src/App.jsx:127-132`.
- **Found by:** Error Handling & Observability

### [S-10] Save failures translated to user-visible event
- **Category:** S7 — Robust error handling
- **Impact:** Medium
- **Explanation:** `SaveLoadManager._forceSave` catches `localStorage.setItem` errors and emits `EVENT_NAMES.SAVE_FAILED`, which is piped through `notificationCtx.showError`. The named operation is preserved across the boundary.
- **Evidence:** `src/game/state/managers/save-load.js:75-127`; `src/context/NotificationContext.jsx`.
- **Found by:** Error Handling & Observability

### [S-11] Stateless calculation classes alongside stateful managers
- **Category:** S13/S14 — Domain modeling / pragmatic abstractions
- **Impact:** Medium
- **Explanation:** Pure calculation classes (`TradingSystem`, `NavigationSystem`, `EconomicEventsSystem`, `InformationBroker`) are static-method-only and callable from validators, migrations, and UI without instantiating state.
- **Evidence:** `src/game/game-trading.js:10` (`TradingSystem` static), `src/game/game-navigation.js:20`, `src/game/game-events.js:10`, `src/game/game-information-broker.js:16`. Imported from `src/game/state/state-validators.js:9` and `src/game/utils/calculators.js:7`.
- **Found by:** Structure & Boundaries

### [S-12] High cohesion in wormhole-graph utility
- **Category:** S2 — Cohesion
- **Impact:** Medium
- **Explanation:** 207 lines, 4 lazy caches, 3 public functions all bound on adjacency-graph vocabulary; cache and traversal evolve together (commit `9539beb`).
- **Evidence:** `src/game/utils/wormhole-graph.js` (full file).
- **Found by:** Structure & Boundaries

### [S-13] Cross-domain operations routed through coordinator-injected callbacks
- **Category:** S4 — Stable dependency direction
- **Impact:** Medium
- **Explanation:** Manager-to-manager calls (e.g., `tradingManager.applyTradeWithholding` → `debtManager.applyWithholding`) materialize at the composition root as injected callbacks; zero static inter-manager edges across 25 manager nodes.
- **Evidence:** `src/game/state/game-coordinator.js:140-145, 196-202, 259-274, 384-391`.
- **Found by:** Coupling & Dependencies

### [S-14] Class-prefixed structured logging across all managers
- **Category:** S8 — Observability present
- **Impact:** Medium
- **Explanation:** `BaseManager.log/warn/error` prefix every line with `[ManagerName]`; DEV_MODE policy gates `log` and `warn`, `error` always emits. Documented in `dev-logger.js:6-12`.
- **Evidence:** `src/game/state/managers/base-manager.js:38-60`; consistent usage in 25 manager files.
- **Found by:** Error Handling & Observability

### [S-15] Deterministic test seams for stochastic logic
- **Category:** S11 — Testability & coverage
- **Impact:** Medium
- **Explanation:** `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`); fast-check property tests; Three.js mocked for tests; bridge-pattern hook seams in `tests/react-test-utils.jsx`.
- **Evidence:** `src/game/utils/seeded-random.js`, `tests/setup-three-mock.js`, `tests/react-test-utils.jsx`, 106 property test files.
- **Found by:** Security & Code Quality

### [S-16] Dead-code detector wired into the standard task
- **Category:** S10/S11 — Security & quality hygiene
- **Impact:** Medium
- **Explanation:** `knip` is configured with project-aware path aliases and runs as part of `npm run all`. Authoritative output finds 1 unused file in 171.
- **Evidence:** `knip.json`, `package.json:scripts.all`.
- **Found by:** Security & Code Quality

## Flaws/Risks

Ranked by impact, 27 items:

### [F-1] Save-load failures silently swallow non-NPC errors
- **Category:** Flaw 20 — Weak error handling strategy
- **Impact:** High
- **Explanation:** `handleLoadError` returns `null` for any error whose message doesn't contain "NPC" with only a DEV-only `this.log(...)`. `attemptNPCRecovery`'s catch is empty save for a DEV log. A corrupted save (SyntaxError, JSON.parse error, validation error with non-NPC keyword) silently gives the player a fresh game with no production-visible signal that their save was abandoned.
- **Evidence:** `src/game/state/managers/save-load.js:165-175,202-207` (`handleLoadError`, `attemptNPCRecovery`).
- **Found by:** Error Handling & Observability

### [F-2] NPCManager bundles four distinct subsystems
- **Category:** Flaw 2 — God object
- **Impact:** Medium
- **Explanation:** 814 lines spanning reputation tier classification, tip dispensing with daily cooldowns, service-discount lookup, loan lifecycle (~80 lines incl. tier-decay default penalties), and cargo storage/retrieval (~200 lines reaching into ship cargo via capabilities). Co-change history shows independent change axes for these subsystems. `RepairManager` was already carved out in commit `4a3d9a5`, suggesting the team has accepted decomposing NPCManager when bugs surface.
- **Evidence:** `src/game/state/managers/npc.js:21-814`.
- **Found by:** Structure & Boundaries

### [F-3] applyEncounterOutcome is feature-envious and mixed-cohesion
- **Category:** Flaw 10 — Feature envy / Flaw 11 — Low cohesion (merged)
- **Impact:** Medium
- **Explanation:** A 200-line function in a feature folder reads 10 distinct fields across `state.ship`/`state.player` and dispatches ~15 cross-domain coordinator mutations (fuel, hull, engine, lifeSupport, credits, debt, cargo, missions, factions, passengers). Vocabulary spans every state slice; no single noun. `git log` shows it has been touched 8+ times for unrelated reasons.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:15-213` (`applyEncounterOutcome`).
- **Found by:** Structure & Boundaries (two lenses merged)

### [F-4] Encounter probability math duplicated across three panels
- **Category:** Flaw 9 — Shotgun surgery / Flaw 25 — Business logic in UI (merged)
- **Impact:** Medium
- **Explanation:** Three near-duplicate probability calculators in `CombatPanel`, `PirateEncounterPanel`, and `NegotiationPanel` each apply `KARMA_CONFIG.SUCCESS_RATE_SCALE`, engine penalties, and quirk/upgrade modifiers. Commit `8b835df fix: align evasive probability calculation between encounter panels` is direct evidence: `calculateTacticalProbabilities` was missing the engine penalty that `calculateCombatProbabilities` applied. The CombatManager / NegotiationManager already own the source-of-truth resolution version.
- **Evidence:** `src/features/danger/CombatPanel.jsx:501-611` (`calculateCombatProbabilities`), `src/features/danger/PirateEncounterPanel.jsx:390-452` (`calculateTacticalProbabilities`), `src/features/danger/NegotiationPanel.jsx:405-456` (`calculateNegotiationProbabilities`).
- **Found by:** Structure & Boundaries; Error Handling & Observability

### [F-5] FinancePanel computes pay-all and fee math
- **Category:** Flaw 25 — Business logic in UI
- **Impact:** Medium
- **Explanation:** `payAllAmount = Math.min(Math.floor(credits / (1 + debtInfo.earlyRepaymentFeeRate)), debtInfo.debt)` is a fee-aware affordability calculation that should live with `getDebtInfo` in `DebtManager`. Per-tier fee `Math.ceil(payAmount * earlyRepaymentFeeRate)` is also recomputed in the panel. If `DebtManager.makeDebtPayment` ever changes fee rounding, displayed fee diverges from charged fee.
- **Evidence:** `src/features/finance/FinancePanel.jsx:58-65,116-137`.
- **Found by:** Error Handling & Observability

### [F-6] Satisfaction tier thresholds hardcoded with constants already defined
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** `getSatisfactionLabel` uses `>= 80, >= 60, >= 40, >= 20`. The same thresholds exist in `constants.js:758-763` as `PASSENGER_CONFIG.SATISFACTION_THRESHOLDS.{VERY_SATISFIED:80, SATISFIED:60, NEUTRAL:40, DISSATISFIED:20}`. Two divergent config sources for the same constants.
- **Evidence:** `src/features/missions/MissionCompleteNotifier.jsx:7-13`.
- **Found by:** Error Handling & Observability

### [F-7] Encounter risk thresholds (0.3/0.15/0.05) hardcoded
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** Risk-tier cutoffs that drive the player's primary jump-decision UI ("high/moderate/low/minimal") are inline in the panel and not present in `constants.js`. Tuning these requires editing the panel.
- **Evidence:** `src/features/danger/DangerWarningDialog.jsx:308-313` (`getRiskLevel`).
- **Found by:** Error Handling & Observability

### [F-8] Threat-escalation table inline in event handler
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** A 4-entry pirate threat-escalation map (`weak→moderate, moderate→strong, strong→dangerous, dangerous→dangerous`) is allocated on every encounter resolution and not present in `constants.js`. Exactly the "control-flow strings" shape the rule targets.
- **Evidence:** `src/hooks/useEncounterOrchestration.js:155-166` (`THREAT_ESCALATION`).
- **Found by:** Error Handling & Observability

### [F-9] Hard-coded core-system IDs and security-level cutoffs
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** `currentSystem === 0 || currentSystem === 1` (Sol/Alpha-Centauri "core systems") appears inline; security-level display ladder (`>= 2.0 / 1.5 / 1.0 / 0.5`) is inline in the panel without `CORE_SYSTEM_IDS` or display-tier constants.
- **Evidence:** `src/features/danger/inspectionUtils.js:73`; `src/features/danger/InspectionPanel.jsx:417-421` (`getSecurityLevelName`).
- **Found by:** Error Handling & Observability

### [F-10] Repair tier thresholds and multipliers inline
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** "1.5x cost" / "21%" / `=== 25 ? 'Family' : 'Trusted'` / "10%/25%" hardcoded across cannibalize, free-repair, and tier-requirements rendering.
- **Evidence:** `src/features/repair/RepairPanel.jsx:447,476,557,623-628`.
- **Found by:** Error Handling & Observability

### [F-11] Three logging shapes for the same save/load operation
- **Category:** Flaw 34 — Inconsistent error/logging conventions
- **Impact:** Medium
- **Explanation:** `src/game/state/save-load.js:18,44,88,104` uses bare `console.error`. `src/game/state/managers/save-load.js:88,119` uses `this.error(...)` for save failures. `src/game/state/managers/save-load.js:151,166,170,203` uses `this.log(...)` (DEV-only) for load failures. Same critical operation emits at three different severities; a production load failure is silent.
- **Evidence:** the two `save-load` files cited above.
- **Found by:** Error Handling & Observability

### [F-12] JumpDialog logs jump failures but doesn't notify the player
- **Category:** Flaw 20 — Weak error handling strategy
- **Impact:** Medium
- **Explanation:** When `result.success === false`, the dialog `console.error`s and falls through with no UI feedback. `notificationCtx.showError` is wired throughout the app but isn't called here. Player sees: button click, nothing happens.
- **Evidence:** `src/features/navigation/JumpDialog.jsx:84-89`.
- **Found by:** Error Handling & Observability

### [F-13] No supply-chain scanning surface
- **Category:** Flaw 30 — Security as an afterthought
- **Impact:** Medium
- **Explanation:** No `.github/workflows/`, no Dependabot/Renovate, no `npm audit` invocation in scripts. `three@^0.150.0` resolves to a 3-year-stale version. The next time a runtime dep ships a security advisory, this codebase has no mechanism to surface it. The architectural finding is the absent scanning surface, not the version.
- **Evidence:** `package.json` scripts (no `audit`); `.github/` has only `copilot-instructions.md`.
- **Found by:** Security & Code Quality

### [F-14] coordinatorRef leaks the full coordinator surface to dialogue/info-broker engines
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Low
- **Explanation:** Two capability typedefs include `coordinatorRef: this`, handing the consumer the full coordinator. `game-dialogue.js` makes 38 distinct `gameStateManager.X(...)` calls; `info-broker.js` calls `coordinatorRef.getState()`. The capability itself acknowledges this as deferred work. Other 23 managers were migrated cleanly — the existence of the migration is evidence the back-reference is not necessary, only deferred. (Severity adjusted Medium → Low: paused intermediate state from the still-recent GSM refactor.)
- **Evidence:** `src/game/state/capabilities.js:203-208` (DialogueCapabilities), `:333-339` (InfoBrokerCapabilities); `src/game/game-dialogue.js:46-95` (38 call sites).
- **Found by:** Coupling & Dependencies

### [F-15] engine/wormholes.js reaches into private state shape
- **Category:** Flaw 3 — Tight coupling
- **Impact:** Low
- **Explanation:** `updateConnectionColors` reads `gameStateManager.state.player.currentSystem` and `state.ship.fuel` directly instead of `getCurrentSystem()` / `getFuel()`. State-shape changes during migrations would break the engine silently.
- **Evidence:** `src/game/engine/wormholes.js:148-153`.
- **Found by:** Coupling & Dependencies

### [F-16] Two hooks bypass the Bridge facade into manager internals
- **Category:** Flaw 3 — Tight coupling
- **Impact:** Low
- **Explanation:** `useDangerZone` and `useEncounterProbabilities` call `game.dangerManager.getDangerZone()` / `.calculatePirateEncounterChance()` / `.calculateInspectionChance()` directly even though equivalent coordinator methods exist (`game-coordinator.js:1370,1374,1381`). 3 anomalous sites in 19 hooks; the bypass survived the GSM refactor.
- **Evidence:** `src/hooks/useDangerZone.js:15`, `src/hooks/useEncounterProbabilities.js:20,25`.
- **Found by:** Coupling & Dependencies

### [F-17] GameCoordinator constructor leaves state=null with lazy capability getters
- **Category:** Flaw 27 — Temporal coupling
- **Impact:** Low
- **Explanation:** `new GameCoordinator(...)` succeeds; calling any state-reading method before `initNewGame()` or `restoreState()` throws `TypeError: Cannot read properties of null`. `main.jsx` enforces order at the production composition root, but no construction-time guard exists. Loud but opaque failure mode for tests and future entry points.
- **Evidence:** `src/game/state/game-coordinator.js:83` (`this.state = null`), 25 manager capability arrows that lazily dereference `this.state.X`.
- **Found by:** Coupling & Dependencies

### [F-18] No automated dependency-cycle detection
- **Category:** Flaw 4 — High/unstable dependencies (visibility gap)
- **Impact:** Low
- **Explanation:** `eslint.config.mjs` does not enable `eslint-plugin-import`'s `no-cycle`; no `madge` or `dependency-cruiser` in scripts. The current graph is acyclic; nothing in CI would catch a regression that introduced a cycle.
- **Evidence:** `eslint.config.mjs:1-174`; absence of cycle tools from `package.json`.
- **Found by:** Coupling & Dependencies

### [F-19] DevAdminPanel writes ship.hiddenCargo directly
- **Category:** Flaw 13 — Inconsistent boundaries
- **Impact:** Low
- **Explanation:** `ship.hiddenCargo = updatedHidden; game.emit(...)` writes state directly via the reference returned by `game.getShip()`, with the file self-acknowledging the violation in a comment. Sibling pattern (`setCredits`, `setDebt`, `setNpcRep`) shows the intended seam — `setHiddenCargo` was never added. (Severity adjusted Medium → Low: dev-only escape hatch, author flagged the convention violation in-line.)
- **Evidence:** `src/features/dev-admin/DevAdminPanel.jsx:289-321`, with self-acknowledgement at lines 70-71.
- **Found by:** Structure & Boundaries

### [F-20] wormhole-graph module-level mutable cache
- **Category:** Flaw 1 — Global mutable state
- **Impact:** Low
- **Explanation:** Four `let` bindings at module scope, populated lazily, with `_resetCacheForTesting` as the test-only escape. The presence of the reset is itself the evidence that interleavings are observable; tests that mutate `STAR_DATA`/`WORMHOLE_DATA` may see prior-test state if the reset is missed.
- **Evidence:** `src/game/utils/wormhole-graph.js:6-9`, `:202` (`_resetCacheForTesting`).
- **Found by:** Structure & Boundaries

### [F-21] Defensive-fallback duplicates of declared constants
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Low
- **Explanation:** `KARMA_CONFIG.SUCCESS_RATE_SCALE ?? 0.0005` re-encodes the constant at `constants.js:1607`. `BASE_PRICES[good] || 20` masks missing-commodity bugs by quietly returning a magic price-of-last-resort.
- **Evidence:** `src/features/danger/NegotiationPanel.jsx:412,480`.
- **Found by:** Error Handling & Observability

### [F-22] capabilities.js is dead JSDoc-only documentation
- **Category:** Flaw 31 — Dead code / unused dependencies
- **Impact:** Low
- **Explanation:** 553 lines of `@typedef` declarations with no runtime exports; `knip` confirms the file has no importers. Last touched during the GSM refactor (now complete). Pure documentation overhead — no runtime risk, but it will silently rot if managers' real capability shapes drift.
- **Evidence:** `src/game/state/capabilities.js` (full file); `npm run knip` output.
- **Found by:** Security & Code Quality

### [F-23] state-validators.js mixes validation, normalization, migrations, and defaults
- **Category:** Flaw 2 — God object
- **Impact:** Low
- **Explanation:** 1019 lines mixing `isVersionCompatible`, cargo-stack repair, field-name normalization, five sequential migration functions, top-level structure validation, and default injection. Imports `TradingSystem` to recompute prices during migrations — pulls trading logic into the validator boundary. Append-only migrations are an idiomatic shape; the validation/defaults split is the part that drifts.
- **Evidence:** `src/game/state/state-validators.js` (full file).
- **Found by:** Structure & Boundaries

### [F-24] No coverage threshold enforced in CI/scripts
- **Category:** Flaw 32 — Missing or inadequate test coverage
- **Impact:** Low
- **Explanation:** `vitest.config.js` configures coverage `provider`/`reporter`/`include`/`exclude` but no `thresholds` block. With no CI workflow, coverage is purely informational. Critical paths are covered today (see S-7); the risk is silent regression, not a present hole.
- **Evidence:** `vitest.config.js:20-31`.
- **Found by:** Security & Code Quality

### [F-25] Dead/over-general catch in DialoguePanel
- **Category:** Flaw 20 — Weak error handling / Flaw 34 — Inconsistent error conventions
- **Impact:** Low
- **Explanation:** Outer try/catch wraps `useDialogue.selectChoice`, which already swallows internally and resolves to `false`. Same condition handled twice (`if (!success)` clears state; `catch` clears state); on the `await game.startDialogue` path, the same error is logged twice.
- **Evidence:** `src/features/dialogue/DialoguePanel.jsx:42-62`; `src/hooks/useDialogue.js:76-88`.
- **Found by:** Error Handling & Observability

### [F-26] Achievements silently fail on unknown stat paths in production
- **Category:** Flaw 21 — No observability plan
- **Impact:** Low
- **Explanation:** When an achievement references a misspelled `computed.<unknown>` stat path, `_resolveComputed` returns 0 and emits a DEV-only `this.warn()`. In production the achievement silently always evaluates false; no operator-visible signal.
- **Evidence:** `src/game/state/managers/achievements.js:40-42`.
- **Found by:** Error Handling & Observability

### [F-27] Steering drift: AGENTS.md claims unimplemented quota handling
- **Category:** Steering drift (cross-cutting; closest to Flaw 30)
- **Impact:** Low
- **Explanation:** AGENTS.md "Security Considerations" lists "Handle localStorage quota exceeded errors", but no code path detects `QuotaExceededError` specifically — only generic catches at `save-load.js:43-46` and `managers/save-load.js:87-92`. Quota-exhaustion crashes are caught generically with a "Save failed" message; no quota-specific UX (e.g., "Your browser storage is full; please clear old saves").
- **Evidence:** `AGENTS.md` "Security Considerations"; `src/game/state/save-load.js:43-46`, `src/game/state/managers/save-load.js:87-92`.
- **Found by:** Security & Code Quality

## Coverage Checklist

### Flaw/Risk Types 1–34
| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Observed | F-20 |
| 2 | God object | Observed | F-2, F-23 |
| 3 | Tight coupling | Observed | F-15, F-16 |
| 4 | High/unstable dependencies | Observed | F-18 |
| 5 | Circular dependencies | Not observed | — |
| 6 | Leaky abstractions | Observed | F-14 |
| 7 | Over-abstraction | Not observed | — |
| 8 | Premature optimization | Not observed | — |
| 9 | Shotgun surgery | Observed | F-4 |
| 10 | Feature envy / anemic domain | Observed | F-3 |
| 11 | Low cohesion | Observed | F-3 |
| 12 | Hidden side effects | Not observed | — |
| 13 | Inconsistent boundaries | Observed | F-19 |
| 14 | Distributed monolith | Not applicable | — |
| 15 | Chatty service calls | Not applicable | — |
| 16 | Synchronous-only integration | Not applicable | — |
| 17 | No clear ownership of data | Not applicable | — |
| 18 | Shared database across services | Not applicable | — |
| 19 | Lack of idempotency | Not applicable | — |
| 20 | Weak error handling strategy | Observed | F-1, F-12, F-25 |
| 21 | No observability plan | Observed | F-26 |
| 22 | Configuration sprawl | Not observed | — |
| 23 | Dependency injection misuse | Not observed | — |
| 24 | Inconsistent API contracts | Not applicable | — |
| 25 | Business logic in the UI | Observed | F-4, F-5 |
| 26 | Poor transactional boundaries | Not applicable | — |
| 27 | Temporal coupling | Observed | F-17 |
| 28 | Magic numbers/strings everywhere | Observed | F-6, F-7, F-8, F-9, F-10, F-21 |
| 29 | "Utility" dumping ground | Not observed | — |
| 30 | Security as an afterthought | Observed | F-13, F-27 |
| 31 | Dead code / unused dependencies | Observed | F-22 |
| 32 | Missing or inadequate test coverage | Observed | F-24 |
| 33 | Hard-coded credentials in source | Not observed | — |
| 34 | Inconsistent error/logging conventions | Observed | F-11, F-25 |

### Strength Categories S1–S14
| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | S-1 |
| S2 | High cohesion | Observed | S-12 |
| S3 | Loose coupling | Observed | S-2, S-3 |
| S4 | Stable dependency direction | Observed | S-4, S-13 |
| S5 | Dependency management hygiene | Not observed | — |
| S6 | Consistent API contracts | Not applicable | — |
| S7 | Robust error handling | Observed | S-9, S-10 |
| S8 | Observability present | Observed | S-14 |
| S9 | Configuration discipline | Observed | S-8 |
| S10 | Security built-in | Observed | S-5, S-6, S-16 |
| S11 | Testability & coverage | Observed | S-7, S-15, S-16 |
| S12 | Resilience patterns | Not applicable | — |
| S13 | Domain modeling strength | Observed | S-11 |
| S14 | Simple, pragmatic abstractions | Observed | S-11 |

## Hotspots

Top 3 files/directories to review:

1. **`src/game/state/managers/save-load.js`** (and its underlying `src/game/state/save-load.js`) — the only **High** flaw (F-1) is here, plus F-11 (three logging shapes) and adjacent steering drift F-27. This is the persistence path; load failures silently produce a fresh game in production. This file deserves both a logging-convention pass and a load-failure UX decision.

2. **`src/features/danger/`** — five distinct findings (F-3 applyEncounterOutcome feature-envy/mixed-cohesion; F-4 probability math duplicated across CombatPanel/PirateEncounterPanel/NegotiationPanel; F-7 risk thresholds inline in DangerWarningDialog; F-9 inspection magic numbers; F-21 negotiation fallback duplicates). The encounter system is the largest concentration of business-logic-in-UI and shotgun-surgery surface in the repo. This is also the area with the most recent firefighting commits (`8b835df`, multiple applyEncounterOutcome touches).

3. **`src/game/state/managers/npc.js`** — F-2 god-class. 814 lines, four subsystems sharing only the `npcs.*` slice. Loan and cargo-storage subsystems are plausible carve-out candidates next time bugs surface (`RepairManager` is the precedent extraction).

**Strong-core hotspots to protect:** `src/game/state/capabilities.js` + `src/game/state/game-coordinator.js` constructor + `src/game/state/managers/base-manager.js` form the load-bearing capability-injection seam (S-1, S-2, S-3, S-4, S-13). Changes here should be reviewed with the GSM refactor in mind.

## Next Questions

1. What is the intended user-visible behavior when a save fails to load (corrupted JSON, version mismatch, validator failure)? Is silently starting a fresh game ever the desired outcome, or is that an oversight?
2. Should encounter probability calculations be a single function exported from `CombatManager` / `NegotiationManager` and consumed by panels, or is the panel-side duplication intentional (e.g., displaying "predicted" odds that diverge from "actual" resolution)?
3. Is `src/game/state/capabilities.js` meant as living documentation (kept in sync as managers evolve) or a frozen artifact from the GSM refactor (deleted now that the refactor is complete)?
4. Is the absence of CI infrastructure (`.github/workflows/`, supply-chain scanning, coverage thresholds) a deliberate choice for this project's scope, or a TODO awaiting attention?
5. The `coordinatorRef` escape hatch in `DialogueCapabilities` and `InfoBrokerCapabilities` is self-marked as deferred work — does the team have a concrete plan to migrate `game-dialogue.js` and `game-information-broker.js` off the back-reference, and what is blocking it?

## Analysis Metadata

- **Agents dispatched:** 5 specialists in parallel — Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error Handling & Observability, Security & Code Quality. Plus 1 Verifier.
- **Scope:** Full repo. 171 source files (~42,627 LOC), 441 test files. Steering files: `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT.md`, `developer_docs/bridge-pattern.md`.
- **Raw findings:** 46 (16 strengths + 30 flaws across 4 reporting specialists; Integration & Data bailed out cleanly).
- **Verified findings:** 43 (16 strengths + 27 flaws after dedup).
- **Filtered out:** 3 (deduped: applyEncounterOutcome feature-envy + mixed-cohesion → F-3; combat shotgun-surgery + two business-in-ui → F-4).
- **By impact (flaws):** 1 High, 12 Medium, 14 Low.
- **By impact (strengths):** 8 High, 8 Medium.
- **Bail-outs:** Integration & Data lens — `not-distributed`. Categories 14, 15, 16, 17, 18, 19, 24, 26, S6, S12 marked Not applicable.
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT.md`, `developer_docs/bridge-pattern.md`. One steering-drift finding emitted (F-27, AGENTS.md vs code).
