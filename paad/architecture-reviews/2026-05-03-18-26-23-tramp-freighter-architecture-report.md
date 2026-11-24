# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 [working tree dirty]
**Languages:** JavaScript (ES Modules), React 18, Three.js, Vite
**Key directories:** `src/App.jsx`, `src/components/`, `src/context/`, `src/features/` (23 dirs), `src/hooks/` (20 hooks), `src/game/` (engine, state, data, utils), `src/game/state/managers/` (25 managers), `tests/` (unit + property + integration)
**Scope:** full repository

## Repo Overview

Tramp Freighter Blues is a single-player browser space-trading game (React 18 + Three.js + Vite). The architecture is built around a `GameCoordinator` composition root (`src/game/state/game-coordinator.js`, 1642 LOC) that wires 25 capability-injected managers; React subscribes via the Bridge Pattern (`useGameEvent`, `useGameAction`). All gameplay configuration lives in a single `src/game/constants.js` (2022 LOC). Persistence is debounced localStorage with versioned migrations. ~171 source files; tests: 289 unit + 106 property (fast-check) + 41 integration. Per `MEMORY.md`, the post-GSM-refactor manager facade is intentional and complete.

---

## Strengths

Ranked by impact (16 verified):

### [S-1] Trust-boundary translated at the localStorage chokepoint
- **Category:** S10 — Security built-in
- **Impact:** High
- **Explanation:** All persisted state passes through one chokepoint that sequences version-check → migration → structural validation → defaults before assignment. Player input (ship name) is sanitized at both UI and manager boundaries.
- **Evidence:** `src/game/state/game-coordinator.js:583-619` (`restoreState`); `src/game/state/state-validators.js:187+` (`validateStateStructure`); `src/game/utils/string-utils.js:19` (`sanitizeShipName`) called at `src/features/title-screen/ShipNamingDialog.jsx:24` and `src/game/state/managers/ship.js:280`.
- **Found by:** Security & Code Quality

### [S-2] Test seams: injectable RNG everywhere it matters
- **Category:** S11 — Testability & coverage
- **Impact:** High
- **Explanation:** Every gameplay-RNG call site accepts an injectable `rng` defaulting to `Math.random`, enabling deterministic property tests; combat/danger paths use `SeededRandom` keyed on `gameDay_systemId_encounterType`.
- **Evidence:** `src/game/state/managers/event-engine.js:62`, `src/game/state/managers/quest-manager.js:320`, `src/game/state/managers/ship.js:34`, `src/game/mission-generator.js:111,231,322`; `src/game/utils/seeded-random.js`.
- **Found by:** Security & Code Quality

### [S-3] Critical-path coverage with three test types
- **Category:** S11 — Testability & coverage
- **Impact:** High
- **Explanation:** 289 unit + 106 property (fast-check) + 41 integration tests. Save/load + migration: 8 dedicated files. Combat/encounters: 6. Trading: 5. Coverage tooling wired (v8).
- **Evidence:** `tests/unit/`, `tests/property/`, `tests/integration/`; `vitest.config.js:20-31`.
- **Found by:** Security & Code Quality

### [S-4] Manager peer isolation via capability injection
- **Category:** S3 — Loose coupling
- **Impact:** High
- **Explanation:** No manager imports another manager — verified by grep. Cross-manager calls flow exclusively through capability closures wired in `GameCoordinator`, so each manager's "outside world" is a small, named, greppable surface.
- **Evidence:** `src/game/state/managers/*` (no peer imports); `src/game/state/game-coordinator.js:136` (`getDangerZone: (id) => this.dangerManager.getDangerZone(id)`); ownership table at `src/game/state/capabilities.js:18-49`.
- **Found by:** Coupling & Dependencies

### [S-5] Composition root inverts dependencies cleanly
- **Category:** S4 — Dependency direction is stable
- **Impact:** High
- **Explanation:** Single DAG: `main.jsx` → `GameCoordinator` → managers → (legacy `game-*` + utils + data + constants). High-churn managers depend on low-churn calculators (e.g., `game-trading.js` has 5 commits ever). One file shows the entire wiring graph.
- **Evidence:** `src/main.jsx:61-83`; `src/game/state/game-coordinator.js:86-491`; e.g., `RefuelManager` capability set at lines 209-220 (exactly 7 named closures).
- **Found by:** Coupling & Dependencies

### [S-6] Result-object error taxonomy: consistent failure shape
- **Category:** S7 — Robust error handling
- **Impact:** High
- **Explanation:** `{ success: false, reason: '…' }` is used uniformly for player-facing operation failures across trading, repair, refuel, debt, mission, and quest managers. Throws are reserved for invariant violations. UI translates uniformly.
- **Evidence:** `src/game/state/managers/trading.js:36-72`, `src/game/state/managers/repair.js`, `src/game/state/managers/refuel.js`, `src/game/state/managers/debt.js`, `src/game/state/managers/mission.js`, `src/game/state/managers/quest-manager.js`; UI translation at `src/features/repair/RepairPanel.jsx:106`.
- **Found by:** Error Handling & Observability
- **Caveat:** *Success* shape varies — see flaw F-7.

### [S-7] DEV_MODE-gated structured logging
- **Category:** S8 — Observability present
- **Impact:** High
- **Explanation:** `BaseManager.log/warn` are DEV_MODE-gated; `error` is unconditional. All manager log call sites use `[ManagerName] message` prefix; module-level helpers in `dev-logger.js` follow the same gate.
- **Evidence:** `src/game/state/managers/base-manager.js:38-60`; `src/game/utils/dev-logger.js:1-32`; consistent `this.log/warn/error` usage in 16 manager call sites.
- **Found by:** Error Handling & Observability

### [S-8] Save-failure event closes the loop to the player
- **Category:** S8 — Observability present (also S12 resilience)
- **Impact:** High
- **Explanation:** localStorage write failures emit `EVENT_NAMES.SAVE_FAILED`, which `App.jsx` subscribes to and surfaces as a user notification; `flushSave()` runs on `beforeunload`. Persistence failures aren't silent.
- **Evidence:** `src/game/state/managers/save-load.js:75-92`; `src/App.jsx:78,129-132`; `src/main.jsx:78-80`.
- **Found by:** Error Handling & Observability, Integration & Data

### [S-9] Single canonical config file with stated precedence
- **Category:** S9 — Configuration discipline
- **Impact:** High
- **Explanation:** All gameplay configuration lives in one file, organized by domain with section headers; the only runtime override is the `.dev` flag (DEV_MODE). The intent is documented at the top of the file and codified in CLAUDE.md.
- **Evidence:** `src/game/constants.js:1-10` (header) and `:1858+` (`Object.freeze`'d `EVENT_NAMES`); CLAUDE.md "all magic numbers" rule.
- **Found by:** Error Handling & Observability

### [S-10] Multi-layer last-line-of-defense for runtime errors
- **Category:** S7 — Robust error handling
- **Impact:** Medium
- **Explanation:** React render errors are caught by `<ErrorBoundary>`; bootstrap errors are caught around `initializeGame()` with a "Clear Save and Restart" UI; event-system subscribers are wrapped to prevent cross-subscriber failure; save-load has a dedicated NPC-corruption recovery path.
- **Evidence:** `src/components/ErrorBoundary.jsx`; `src/main.jsx:155-161`; `src/game/state/managers/event-system.js:94-101`; `src/game/state/managers/save-load.js:165-175` (`attemptNPCRecovery`).
- **Found by:** Error Handling & Observability

### [S-11] Code-level state-slice ownership table
- **Category:** S1 — Clear modular boundaries
- **Impact:** Medium
- **Explanation:** The capability-injection contract is a typedef + ownership table that names, per manager, exactly which `state.*` paths it owns and which cross-domain reads/writes are allowed. Boundaries are written down, not implied.
- **Evidence:** `src/game/state/capabilities.js:10-49` (ownership table).
- **Found by:** Structure & Boundaries

### [S-12] Pragmatic split: pure calculation vs. stateful manager
- **Category:** S14 — Simple, pragmatic abstractions
- **Impact:** Medium
- **Explanation:** Pricing, intelligence, navigation, and RNG are split into pure calculator classes used by stateful managers. Pure halves are unit-testable in isolation; stateful halves stay narrow. No `IRepository`/`Strategy`/abstract bases — just static class + manager.
- **Evidence:** `src/game/game-trading.js:26-72` (`TradingSystem.calculatePrice`) consumed by `src/game/state/managers/trading.js`; analogous split for `InformationBroker`, `NavigationSystem`, `SeededRandom`.
- **Found by:** Structure & Boundaries

### [S-13] High cohesion in manager modules
- **Category:** S2 — High cohesion
- **Impact:** Medium
- **Explanation:** Each manager binds on one state slice AND one domain vocabulary. ShipManager's 22 methods all touch `state.ship`; NPCManager's 15 public methods all take `npcId` first; DangerManager methods all touch karma/factions/dangerFlags.
- **Evidence:** `src/game/state/managers/ship.js`, `src/game/state/managers/npc.js`, `src/game/state/managers/danger.js`.
- **Found by:** Structure & Boundaries

### [S-14] Secrets-managed by architecture (no runtime secrets)
- **Category:** S10 — Security built-in
- **Impact:** Medium
- **Explanation:** Static SPA, no backend, no API keys; `.env`/`.dev` carry no secrets; `process.env.VITE_BASE_PATH` is build-only. No `dangerouslySetInnerHTML`, no `eval`, no `new Function`. The blast-radius is bounded by deployment shape.
- **Evidence:** `package.json` (no auth deps), `vite.config.js:7`, full-tree grep of `eval`/`Function`/`dangerouslySetInnerHTML` returns no production matches.
- **Found by:** Security & Code Quality

### [S-15] `constants.js` is configuration, not a grab-bag
- **Category:** S1 — Clear modular boundaries
- **Impact:** Medium
- **Explanation:** Despite 2022 LOC, the file has one cohesion vector (immutable game configuration), every export is `const` or `Object.freeze`, and section headers organize the surface. The single-file design is documented and intentional.
- **Evidence:** `src/game/constants.js:1-10` (header) and exports list (`BASE_PRICES`, `INTELLIGENCE_CONFIG`, `FUEL_PRICING_CONFIG`, …).
- **Found by:** Structure & Boundaries

### [S-16] Single-source event registry with declarative payload extractor
- **Category:** S6 — Consistent API contracts
- **Impact:** Medium (half-credit)
- **Explanation:** `EVENT_NAMES` is `Object.freeze`'d; `EventSystemManager` builds the subscriber map dynamically and warns on unknown events; `EVENT_STATE_MAP` is a declarative payload→state extractor. The contract surface is one place.
- **Evidence:** `src/game/constants.js:1858` (`EVENT_NAMES`), `:1948+` (`EVENT_STATE_MAP`); `src/game/state/managers/event-system.js:19,54-101`.
- **Caveat:** No test enforces emit-site/registry sync; JSDoc lists ~22 of ~40 events.
- **Found by:** Integration & Data

---

## Flaws / Risks

Ranked by impact (23 verified):

### [F-1] Silent-swallow of save-load parse failures
- **Category:** F20 — Weak error handling strategy
- **Impact:** High
- **Explanation:** The standalone `loadGame` returns `null` for both "no save exists" and "save exists but failed to parse," logging only via DEV-gated `devLog`. A corrupted localStorage entry silently starts a new game.
- **Evidence:** `src/game/state/save-load.js:57-75` (`loadGame`), excerpt: `} catch (error) { devLog('Failed to load game:', error); return null; }`.
- **Found by:** Error Handling & Observability

### [F-2] `isVersionCompatible` will reject all saves on next version bump
- **Category:** F24 — Inconsistent API contracts
- **Impact:** High
- **Explanation:** Migration routes are gated by hard-coded `&& GAME_VERSION === '5.0.0'` clauses on every branch. When `GAME_VERSION` is bumped to 5.0.1 / 6.0.0, every existing save is reported "incompatible" until the literal is hand-edited in five places — a sharp player-data-loss footgun. JSDoc also lies (claims "v1.0.0 to v4.0.0", body migrates to v5.0.0).
- **Evidence:** `src/game/state/state-validators.js:144-175` (`isVersionCompatible`), excerpt: `if (saveVersion === '1.0.0' && GAME_VERSION === '5.0.0') return true;`.
- **Found by:** Integration & Data

### [F-3] Encounter probability formulas duplicated across 3 sites
- **Category:** F9 — Shotgun surgery (subsumes F25 business-in-ui)
- **Impact:** Medium
- **Explanation:** The success-rate formula for evasive maneuvers / return fire / negotiation is implemented three times — twice for player-display panels and once in the resolver. A single conceptual change (e.g., engine-condition penalty) requires synchronized edits in all three; the team has already paid this cost (commit `8b835df fix: align evasive probability calculation between encounter panels`).
- **Evidence:** `src/features/danger/CombatPanel.jsx:501-611` (`calculateCombatProbabilities`); `src/features/danger/PirateEncounterPanel.jsx:395-452` (`calculateTacticalProbabilities`); `src/game/state/managers/combat.js:75-132,146-175` (`resolveEvasiveManeuvers`, `resolveReturnFire`).
- **Found by:** Structure & Boundaries, Error Handling & Observability

### [F-4] Combat outcome strings hard-coded alongside `COMBAT_CONFIG`-driven resolution
- **Category:** F28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** Player-facing outcome blurbs (`-15% fuel, -5% engine condition`, `-20% hull`, `+5 outlaw reputation`, `-30% hull, ₡500`) are inline JSX, while the resolver computes the actual penalty from `COMBAT_CONFIG`. Tuning the config silently desyncs the displayed text.
- **Evidence:** `src/features/danger/CombatPanel.jsx:292,298,348,354,449,455`; resolver constants in `src/game/constants.js` (`COMBAT_CONFIG`).
- **Found by:** Error Handling & Observability

### [F-5] Subsystem-name list `['hull','engine','lifeSupport']` repeated in 9 sites
- **Category:** F28 — Magic numbers/strings
- **Impact:** Medium
- **Explanation:** The canonical ship-subsystem set has no shared export. Adding a fourth subsystem requires nine synchronized edits across managers, utils, and panels — and missing one creates a silent gap.
- **Evidence:** `src/game/state/managers/repair.js:55,123,178`; `src/game/state/managers/negotiation.js:369`; `src/features/repair/repairUtils.js:87`; `src/features/repair/RepairPanel.jsx:407,421,441,449,454`.
- **Found by:** Error Handling & Observability

### [F-6] Two managers bypass the capability boundary via `coordinatorRef`
- **Category:** F23 — DI misuse / F13 — Inconsistent boundaries
- **Impact:** Medium
- **Explanation:** `InfoBrokerManager` and `DialogueManager` receive the entire `GameCoordinator` as a "capability" and call `coordinatorRef.getState()`, then mutate state owned by *other* slices (e.g., `state.stats.rumorsPurchased`). This defeats the ownership table the rest of the codebase enforces.
- **Evidence:** `src/game/state/managers/info-broker.js:40,67,74` (writes `state.stats`); `src/game/state/managers/dialogue.js:92,125`; self-described drift at `src/game/state/capabilities.js:203-208,336-339`.
- **Found by:** Coupling & Dependencies, Structure & Boundaries

### [F-7] Manager `success: true` payload shape is inconsistent
- **Category:** F24 — Inconsistent API contracts
- **Impact:** Medium
- **Explanation:** Five different success shapes coexist: `{ success: true }`, `{ success: true, reason: '' }`, `{ success: true, reason: null }`, `{ success: true, ...payload }`, and per-manager extensions. Currently safe because UI mostly reads `success`, but any future code that branches on `reason` will diverge by manager.
- **Evidence:** e.g., `{ success: true }` at `src/game/state/managers/trading.js:72`; `{ success: true, reason: '' }` at `src/game/state/managers/ship.js:128`; `{ success: true, reason: null }` at `src/game/state/managers/repair.js:107`; `{ success: true, amount }` at `src/game/state/managers/debt.js:191`.
- **Found by:** Integration & Data

### [F-8] Save write has no atomicity, backup, or quota-aware retry
- **Category:** F26 — Poor transactional boundaries
- **Impact:** Medium
- **Explanation:** `_forceSave` writes a single localStorage key; recovery only branches on the literal substring `'NPC'` in error messages. There's no checksum, no backup of the prior good save, no `QuotaExceededError`-specific handling, and no backoff — failed saves retry indefinitely on every `markDirty`.
- **Evidence:** `src/game/state/managers/save-load.js:75-92` (`_forceSave`), `:165-175` (NPC-only recovery branch).
- **Found by:** Integration & Data

### [F-9] `CargoManifestPanel` reaches around the manager facade
- **Category:** F6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** A React component imports `TradingSystem` directly from the legacy `game-trading.js` and calls its calculators, bypassing both `TradingManager` and `useGameAction`. The methods are pure, so behavior is fine — but the abstraction surface becomes porous and a reader can't tell which calculator methods are intended to be component-callable.
- **Evidence:** `src/features/cargo/CargoManifestPanel.jsx:54,65` (`TradingSystem.calculateCargoTotals`, `TradingSystem.calculateCargoValue`); methods at `src/game/game-trading.js:329-369`.
- **Found by:** Coupling & Dependencies

### [F-10] Hooks reach into engine-subsystem fields on the coordinator
- **Category:** F3 — Tight coupling
- **Impact:** Medium
- **Explanation:** `useNavigationActions` reads `game.navigationSystem` and `game.animationSystem` as direct fields and threads them through `navigationSystem.executeJump(game, …)`; `useAnimationLock` reads `game.animationSystem` similarly. The Bridge Pattern intent — React calls coordinator methods, not coordinator fields — is bypassed.
- **Evidence:** `src/hooks/useNavigationActions.js:14-19`; `src/hooks/useAnimationLock.js:22`.
- **Found by:** Coupling & Dependencies

### [F-11] Direct `game.getState()` calls violate the Bridge Pattern rule
- **Category:** F3 — Tight coupling
- **Impact:** Medium
- **Explanation:** CLAUDE.md states components must NEVER call `GameCoordinator.getState()` directly. The rule is violated in feature utilities, the dev panel, and several event-trigger hooks — including deep field access.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:16,133,139`; `src/features/dev-admin/DevAdminPanel.jsx:145`; `src/hooks/useEventTriggers.js:128,150,174,198,243,261`. Recent commit `8ce6f03 Fix code review findings ... Bridge Pattern violation` shows the rule is actively litigated.
- **Found by:** Coupling & Dependencies

### [F-12] Encounter/dialogue failures are invisible to the player
- **Category:** F21 — No observability plan
- **Impact:** Medium
- **Explanation:** Catch blocks in encounter and dialogue hooks `console.error` and silently transition state — the player sees the panel close with no indication that combat resolution / dialogue start failed. `notificationCtx` is wired in the same hook for success-path messages but not used here.
- **Evidence:** `src/hooks/useEncounterOrchestration.js:102-108,191-197`; `src/hooks/useDialogue.js:57-59,82-84`.
- **Found by:** Error Handling & Observability

### [F-13] Module-level mutable state in the Three.js engine layer
- **Category:** F1 — Global mutable state
- **Impact:** Medium
- **Explanation:** Three module-level `let` bindings hold the currently-selected star, system indicator, and shared material. The exported `_resetState()` and the `afterEach` cleanup discipline in tests are direct evidence the state can pollute across observers — and a future second starmap (e.g., minimap) would silently cross-contaminate.
- **Evidence:** `src/game/engine/interaction.js:5-7`; `tests/unit/star-selection-reticles.test.js:52-57` (`_resetState()` in `afterEach`); same pattern at `src/game/utils/wormhole-graph.js:202-207`, `src/game/engine/stars.js:7-12`.
- **Found by:** Structure & Boundaries

### [F-14] Anemic-domain: invariants live outside the entities
- **Category:** F10 — Feature envy / anemic domain model
- **Impact:** Medium
- **Explanation:** Player, ship, NPC, mission, and quest entities are JSON-clean POJOs constructed by literal initializers; invariants (credit bounds, fuel min/max, rep clamp, cargo capacity) live in managers. Save-serialization is the documented justification — methods on prototypes don't survive `JSON.stringify` — but the invariant logic still has to be repeated everywhere a manager mutates the slice.
- **Evidence:** `src/game/state/managers/initialization.js:82-109` (player), `:116+` (ship); `src/game/state/managers/npc.js:75-89`; invariants at `src/game/state/managers/state.js:92-95,110-122`.
- **Found by:** Structure & Boundaries

### [F-15] `BaseManager.validateState()` is a no-op kept for backward compatibility
- **Category:** F7 — Over-abstraction
- **Impact:** Low
- **Explanation:** Documented "for managers not yet migrated to capability injection," but per `MEMORY.md` the GSM refactor is complete and `grep "this.gameStateManager" src/` returns only a JSDoc reference. The method is still called from many manager methods, doing nothing.
- **Evidence:** `src/game/state/managers/base-manager.js:30-32`; call sites e.g., `src/game/state/managers/dialogue.js:30,49,62,85,118`.
- **Found by:** Coupling & Dependencies

### [F-16] Lifecycle gap: `state` is null until `initNewGame` / `loadGame`
- **Category:** F27 — Temporal coupling
- **Impact:** Low
- **Explanation:** `GameCoordinator` constructs all 25 managers with capability getters that immediately dereference `this.state.X`, but `this.state = null` until init. Order is correct in current call sites and there's a defensive null-check at the bridge boundary; the failure (if violated) would be a loud TypeError, not silent.
- **Evidence:** `src/game/state/game-coordinator.js:83`; defensive guard at `src/hooks/useGameEvent.js:71`.
- **Found by:** Coupling & Dependencies

### [F-17] DEV_MODE precedence is time-dependent across boot
- **Category:** F22 — Configuration sprawl
- **Impact:** Low
- **Explanation:** `DEV_MODE` is a module-level `let` initialized to `false`, set later by an async `initDevMode()` that fetches `.dev`. Module-load reads (e.g., `BaseManager` instantiated in `main.jsx:64` before `await initDevMode()` at `:152`) see `false`. Early-startup logs are unconditionally suppressed regardless of `.dev`.
- **Evidence:** `src/game/constants.js:570` (`export let DEV_MODE = false`), `:581-607` (`initDevMode`); `src/main.jsx:64` vs `:152`.
- **Found by:** Error Handling & Observability

### [F-18] Console-log format drift between managers and hooks/engine
- **Category:** F34 — Inconsistent error/logging conventions
- **Impact:** Low
- **Explanation:** Manager logs use the `[ManagerName]` prefix via `BaseManager`. Hook, panel, and engine logs use ad-hoc `console.error('Jump failed:', error)` with no source prefix. A developer scanning the console can't quickly identify the owning subsystem.
- **Evidence:** ad-hoc sites: `src/hooks/useEncounterOrchestration.js:103,192`; `src/hooks/useDialogue.js:58,83`; `src/features/navigation/JumpDialog.jsx:88`; `src/features/navigation/SystemPanel.jsx:106`; `src/features/dialogue/DialoguePanel.jsx:33,57`; `src/game/engine/game-animation.js:647,660,676,687`.
- **Found by:** Error Handling & Observability

### [F-19] Bare core-system IDs `0`/`1` despite named exports
- **Category:** F28 — Magic numbers/strings
- **Impact:** Low
- **Explanation:** `inspectionUtils` checks `(systemId === 0 || systemId === 1)` while `SOL_SYSTEM_ID`, `ALPHA_CENTAURI_SYSTEM_ID`, and `FUEL_PRICING_CONFIG.CORE_SYSTEMS.IDS` already exist and are used elsewhere. Two sites in one short file.
- **Evidence:** `src/features/danger/inspectionUtils.js:33,73`.
- **Found by:** Error Handling & Observability

### [F-20] DevAdminPanel hard-codes condition thresholds
- **Category:** F28 — Magic numbers/strings
- **Impact:** Low
- **Explanation:** Raw `100` (max), `50` (hull breach), `30` (life support), `[-100, 100]` karma bounds appear inline in a dev tool while `SHIP_CONFIG.CONDITION_BOUNDS.MAX` exists. Dev-only surface, but per project rule "ALL magic numbers must go in `constants.js`".
- **Evidence:** `src/features/dev-admin/DevAdminPanel.jsx:374-375,173,181,189,197,204,211`.
- **Found by:** Error Handling & Observability

### [F-21] Migration function names and JSDoc disagree with bodies
- **Category:** F24 — Inconsistent API contracts (subtype: documentation drift)
- **Impact:** Low
- **Explanation:** `migrateFromV1ToV2` (line 448) is JSDoc-described as "Migrates v1.0.0 to v4.1.0" but its final assignment sets version to `2.0.0`. Same shape on `migrateFromV2_1ToV4`. Behavior is correct; the next maintainer adding a migration is set up to make the same mistake.
- **Evidence:** `src/game/state/state-validators.js:432-579,633+`.
- **Found by:** Integration & Data

### [F-22] Coverage tool wired but no thresholds enforced
- **Category:** F32 — Missing or inadequate test coverage (subtype: enforcement-absent)
- **Impact:** Low
- **Explanation:** `vitest.config.js` configures v8 coverage with text/json/html reporters but no `coverage.thresholds`. There is no `.github/workflows/` directory and no pre-commit hook that fails on regression — `npm run all` is enforced only by developer discipline.
- **Evidence:** `vitest.config.js:20-31`; absence of `.github/workflows/`.
- **Found by:** Security & Code Quality

### [F-23] No automated supply-chain monitoring
- **Category:** F30 — Security as an afterthought (subtype: supply-chain-discipline)
- **Impact:** Low
- **Explanation:** No `dependabot.yml`, no `renovate.json`, no `audit` script. Lockfile is present and prod deps are minimal (3), so the blast-radius is small — but `three@^0.150.0` floats on patch.
- **Evidence:** repo top-level (no `.github/`, `dependabot.yml`, `renovate.json`); `package.json` scripts.
- **Found by:** Security & Code Quality

---

## Coverage Checklist

### Flaw/Risk Types 1–34

| #  | Type | Status | Finding |
|----|------|--------|---------|
| 1  | Global mutable state | Observed | F-13 |
| 2  | God object | Not observed | — (manager facade is intentional per MEMORY.md; no leak past delegation found) |
| 3  | Tight coupling | Observed | F-10, F-11 |
| 4  | High/unstable dependencies | Not observed | — (claim dropped: direction is correct today) |
| 5  | Circular dependencies | Not observed | — (verified absent) |
| 6  | Leaky abstractions | Observed | F-9 |
| 7  | Over-abstraction | Observed | F-15 |
| 8  | Premature optimization | Not observed | — |
| 9  | Shotgun surgery | Observed | F-3 |
| 10 | Feature envy / anemic domain | Observed | F-14 |
| 11 | Low cohesion | Not observed | — (S-13 documents the opposite) |
| 12 | Hidden side effects | Not observed | — (utility files spot-checked pure) |
| 13 | Inconsistent boundaries | Observed | F-6 |
| 14 | Distributed monolith | Not applicable | — single deployment unit |
| 15 | Chatty service calls | Not applicable | — no inter-unit network |
| 16 | Synchronous-only integration | Not applicable | — no request/response surface |
| 17 | No clear ownership of data | Not applicable | — single localStorage writer |
| 18 | Shared database across services | Not applicable | — |
| 19 | Lack of idempotency | Not applicable | — (re-classed as F-21 contract drift) |
| 20 | Weak error handling strategy | Observed | F-1 |
| 21 | No observability plan | Observed | F-12 |
| 22 | Configuration sprawl | Observed | F-17 |
| 23 | DI misuse | Observed | F-6 |
| 24 | Inconsistent API contracts | Observed | F-2, F-7, F-21 |
| 25 | Business logic in UI | Observed | (subsumed in F-3) |
| 26 | Poor transactional boundaries | Observed | F-8 |
| 27 | Temporal coupling | Observed | F-16 |
| 28 | Magic numbers/strings everywhere | Observed | F-4, F-5, F-19, F-20 |
| 29 | "Utility" dumping ground | Not observed | — (S-15 documents `constants.js` is configuration, not grab-bag) |
| 30 | Security as an afterthought | Observed (supply-chain only) | F-23 |
| 31 | Dead code / unused dependencies | Not observed | — (both candidates dropped on verification) |
| 32 | Missing test coverage for critical paths | Observed (enforcement gap only) | F-22 |
| 33 | Hard-coded credentials/secrets | Not applicable | — no secrets in repo |
| 34 | Inconsistent error/logging conventions | Observed | F-18 |

### Strength Categories S1–S14

| #   | Category | Status | Finding |
|-----|----------|--------|---------|
| S1  | Clear modular boundaries | Observed | S-11, S-15 |
| S2  | High cohesion | Observed | S-13 |
| S3  | Loose coupling | Observed | S-4 |
| S4  | Dependency direction is stable | Observed | S-5 |
| S5  | Dependency management hygiene | Not observed | — (lockfile + knip present, but no automated scanner) |
| S6  | Consistent API contracts | Observed (half-credit) | S-16 |
| S7  | Robust error handling | Observed | S-6, S-10 |
| S8  | Observability present | Observed | S-7, S-8 |
| S9  | Configuration discipline | Observed | S-9 |
| S10 | Security built-in | Observed | S-1, S-14 |
| S11 | Testability & coverage | Observed | S-2, S-3 |
| S12 | Resilience patterns | Observed (cross-listed) | S-8 (SAVE_FAILED), S-10 (ErrorBoundary) |
| S13 | Domain modeling strength | Not observed | — (F-14 anemic-domain documents the opposite) |
| S14 | Simple, pragmatic abstractions | Observed | S-12 |

---

## Hotspots

1. **`src/game/state/state-validators.js` + `src/game/state/managers/save-load.js`** — Save/load is the only persistence boundary and the only route for player data loss. F-1 (silent-swallow on parse failure), F-2 (version-bump footgun), F-8 (no atomicity / quota-aware retry), and F-21 (migration documentation drift) all converge here. High signal-to-noise area for review and hardening.
2. **`src/features/danger/CombatPanel.jsx` + `src/features/danger/PirateEncounterPanel.jsx` + `src/game/state/managers/combat.js`** — Encounter probability is computed three times (F-3) and outcome strings are typed by hand against `COMBAT_CONFIG` (F-4). Drift here misleads players about success odds; commit `8b835df` is precedent. The hottest *risk* hotspot.
3. **`src/game/state/game-coordinator.js` + `src/game/state/capabilities.js` + `src/game/state/managers/`** — Strong-core hotspot. Read this triplet to internalize the architectural pattern that enables S-4 / S-5 / S-11 / S-13. Worth protecting; new managers should keep capability surfaces narrow and avoid the `coordinatorRef` shape (F-6).

---

## Next Questions

1. Why does `isVersionCompatible` keep `GAME_VERSION === '5.0.0'` as a literal in five places instead of accepting any version `>= 5.0.0` — is there a release-process step that's supposed to rewrite these, or is this a known gap?
2. Is the `coordinatorRef` capability a deliberate stop-gap with a planned deprecation point, or has the "documented coupling that will be addressed" comment passed its expiration date?
3. What's the rationale for keeping the legacy `src/game/game-*.js` modules (`game-trading.js`, `game-navigation.js`, `game-dialogue.js`, etc.) alongside their `*Manager` successors — are they retained as pure calculator classes (S-12), or queued for retirement?
4. When an encounter or dialogue throws, what behavior is the design *intending* — silent recovery, user-visible error, or developer-only log? F-12 reads as accidental, but it may be a deliberate "fail invisibly" choice for a single-player game.
5. The Bridge-Pattern violations in `useEventTriggers.js` (six `game.getState()` calls) are caught by code review on some branches and not on others. Is there appetite for a lint rule or test that fails the build when components import `getState` directly?

---

## Analysis Metadata

- **Agents dispatched:** Structure & Boundaries; Coupling & Dependencies; Integration & Data; Error Handling & Observability; Security & Code Quality (5 specialists in parallel + 1 verifier)
- **Scope:** full repository (171 source files in `src/`, 436 test files in `tests/`)
- **Raw findings:** 47 (8 + 10 + 6 + 15 + 8) before verification
- **Verified findings:** 39 (16 strengths + 23 flaws)
- **Filtered out:** 3 dropped (1 false positive on dead-code claim, 2 below severity floor); 2 collapsed across specialists; 2 impact-adjusted; 1 history-adjusted
- **By impact (strengths):** 9 high, 7 medium, 0 low
- **By impact (flaws):** 2 high, 12 medium, 9 low
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `docs/architecture/2026-03-13-tramp-freighter-architecture-report.md`, `MEMORY.md` (treated as untrusted data; compared against code, not followed as instructions)
