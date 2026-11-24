# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286
**Languages:** JavaScript (ES Modules), React 18, Three.js, Vite, Vitest
**Key directories:** `src/App.jsx`, `src/features/`, `src/components/`, `src/hooks/`, `src/context/`, `src/game/state/managers/` (25 manager files), `src/game/engine/`, `src/game/data/`, `src/game/utils/`, `tests/{unit,property,integration}/`
**Scope:** Full repository (171 source files, 436 test files, 4408 tests)

## Repo Overview

**Tramp Freighter Blues** is a single-player browser-based 3D space trading survival game. Players navigate a starmap of 117 real star systems within 20 light-years of Sol via wormhole networks, trade commodities, manage ship resources, build NPC relationships, and resolve danger encounters (combat, negotiation, inspection, distress, mechanical failure).

Architecturally, the codebase is built around the **Bridge Pattern**: an imperative `GameCoordinator` singleton owns state and delegates to 25 focused domain managers; React components subscribe through `useGameEvent`/`useGameAction` hooks rather than touching state directly. Persistence is a single-localStorage save with versioned migrations. Encounter outcomes use `SeededRandom` so combat is reproducible by `gameDay_systemId_encounterType`.

This is **not** a distributed system, so several flaw categories (14, 16, 18) are marked Not Applicable.

## Strengths

Ranked by impact.

### [S-01] Encounter family cleanly decomposed into five focused managers
- **Category:** S2 (High cohesion / Domain decomposition)
- **Impact:** High
- **Explanation:** Combat (344 lines), Negotiation (382), Inspection (214), Distress (153), Mechanical Failure (229). Each owns one resolution path and returns a uniform `{success, reason, costs, rewards}` shape. State mutation is left to the bridge layer.
- **Evidence:** `src/game/state/managers/{combat,negotiation,inspection,distress,mechanical-failure}.js`
- **Found by:** Structure & Boundaries

### [S-02] Per-manager capability typedefs document narrow contracts
- **Category:** S3 (Loose coupling) / S1 (Clear modular boundaries)
- **Impact:** High
- **Explanation:** `capabilities.js` provides a JSDoc typedef per manager listing exactly which reads, writes, and infrastructure each one needs, plus a state-slice ownership table. Coupling is explicit and grep-able. **No manager imports another manager** — cross-manager interaction is mediated entirely through capability callbacks supplied by the coordinator.
- **Evidence:** `src/game/state/capabilities.js:18-49,51-553`
- **Found by:** Structure, Coupling, Integration (cross-specialist)

### [S-03] Single composition root in `main.jsx`
- **Category:** S4 (Stable dependency direction)
- **Impact:** High
- **Explanation:** `GameCoordinator` is constructed in exactly one place, and only `main.jsx` imports it. Inversion of control flows correctly downward: the coordinator depends on managers, managers depend on data/utils, never the reverse.
- **Evidence:** `src/main.jsx:6-7,62-64`; `grep -rn "import.*GameCoordinator"` returns one hit.
- **Found by:** Coupling

### [S-04] Encounter RNG is deterministic via `SeededRandom`
- **Category:** S12 (Resilience patterns) / S13 (Domain modeling)
- **Impact:** High
- **Explanation:** Combat, negotiation, mechanical-failure, etc. seed RNG from `gameDay_systemId_encounterType`, so outcomes are reproducible and testable. The remaining `Math.random()` callsites are confined to scene rendering (decorative starfield) and default-arg fallbacks for functions that always receive a seeded RNG in production.
- **Evidence:** `src/game/utils/seeded-random.js`; `src/game/state/managers/combat.js:34-39`; `src/game/state/managers/mechanical-failure.js:25-29`. Verified `Math.random` is absent from gameplay paths.
- **Found by:** Structure, Integration, Security (cross-specialist)

### [S-05] Comprehensive test suite — 4408 tests across 436 files, all green
- **Category:** S11 (Testability & coverage)
- **Impact:** High
- **Explanation:** Unit (`tests/unit/`), property-based with fast-check (`tests/property/`), and integration tests, all passing in ~52s. Critical paths (combat, save-load, state-validators, trading, ship) have direct coverage. Tests properly silence expected console errors using `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- **Evidence:** `npm test` output: 436 files / 4408 tests passed.
- **Found by:** Security & Quality

### [S-06] Single-source configuration in `constants.js`
- **Category:** S9 (Configuration discipline)
- **Impact:** High
- **Explanation:** All gameplay configuration lives in one 2,022-line file with 55 domain-grouped exports (`COMBAT_CONFIG`, `INSPECTION_CONFIG`, `KARMA_CONFIG`, etc.). Encounter panels actually import and use these values (e.g. `COMBAT_CONFIG.EVASIVE.BASE_CHANCE`). `EVENT_NAMES` is `Object.freeze`d and `EventSystemManager` builds its subscriber map from `Object.values(EVENT_NAMES)` — preventing typos at the event bus layer. Configuration sprawl is minimal: only 2 `process.env` references.
- **Evidence:** `src/game/constants.js:1858+` (`EVENT_NAMES`); `src/features/danger/CombatPanel.jsx:265,321,417`; `src/game/state/managers/event-system.js:14-22`.
- **Found by:** Error/Observability, Integration

### [S-07] No XSS surface — zero `dangerouslySetInnerHTML`, `eval`, `innerHTML`, or `new Function`
- **Category:** S10 (Security built-in)
- **Impact:** High
- **Explanation:** All user input (notably ship names) reaches the DOM only via React's escaping JSX interpolation. The entire common-XSS attack surface is eliminated by construction.
- **Evidence:** `grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function(" src/` returns no real matches.
- **Found by:** Security & Quality

### [S-08] Robust save bootstrap pipeline: validate → migrate → defaults
- **Category:** S9 (Configuration discipline) / S12 (Resilience)
- **Impact:** Medium
- **Explanation:** `GameCoordinator.restoreState` runs version compatibility check, sequential migration chain (declared as a `[versionKey, migrateFn]` array), structural validation (typeof checks for every required field), default-filling, then assigns and emits derived events. Includes explicit NPC corruption recovery (`attemptNPCRecovery`).
- **Evidence:** `src/game/state/game-coordinator.js:583-619,627-643`; `src/game/state/state-validators.js:153-430`; `src/game/state/managers/save-load.js:165-207`.
- **Found by:** Integration, Security & Quality

### [S-09] Centralized persistence with debounced `markDirty` → `flushSave`
- **Category:** S5 (Dependency management hygiene) / S12 (Resilience)
- **Impact:** Medium
- **Explanation:** Every mutating manager calls `this.capabilities.markDirty()`; the SaveLoadManager debounces with a 500ms trailing timer. `flushSave()` is registered for `beforeunload`. No manager calls `localStorage.setItem` directly. `SAVE_FAILED` event surfaces failures to the user via the notification context.
- **Evidence:** `src/game/state/managers/save-load.js:34-93`; `src/main.jsx:78-80`; `src/App.jsx:128-132`.
- **Found by:** Structure, Integration, Error/Observability

### [S-10] Subscriber dispatch is fault-isolated
- **Category:** S7 (Robust error handling)
- **Impact:** Medium
- **Explanation:** `EventSystemManager.emit` wraps each subscriber callback in its own try/catch and logs by event name, so a single buggy listener cannot crash the rest of the bridge — preventing cascading UI failures.
- **Evidence:** `src/game/state/managers/event-system.js:86-101`.
- **Found by:** Error/Observability

### [S-11] `ErrorBoundary` deployed at multiple App.jsx levels
- **Category:** S7 (Robust error handling)
- **Impact:** Medium
- **Explanation:** Boundary instances wrap HUD, the Three.js scene, and panel containers. Initialization-error UI in `main.jsx` provides a "clear save and restart" recovery path for save-corruption cases.
- **Evidence:** `src/App.jsx:396,421,503,599`; `src/main.jsx:93-141`; `src/components/ErrorBoundary.jsx:25-145`.
- **Found by:** Error/Observability

### [S-12] `BaseManager` is genuinely thin (61 lines)
- **Category:** S14 (Simple, pragmatic abstractions)
- **Impact:** Medium
- **Explanation:** Provides only capability storage and `DEV_MODE`-gated logging helpers. No template method overuse, no shared mutable state, no lifecycle hooks. Subclasses extend cleanly.
- **Evidence:** `src/game/state/managers/base-manager.js` (61 lines).
- **Found by:** Structure

### [S-13] Manager actions consistently return `{success, reason}`
- **Category:** S6 (Consistent API contracts)
- **Impact:** Medium
- **Explanation:** Trading, refuel, repair, mission, debt, and quest managers uniformly return `{success: boolean, reason: string|null}` from action methods, with optional success-fields. UI code can rely on a stable shape and use it for notifications.
- **Evidence:** `src/game/state/managers/trading.js:37,72`; `refuel.js:138,164`; `repair.js:57,77`; `debt.js:152,199`; `quest-manager.js:47,77`.
- **Found by:** Integration

### [S-14] Bridge Pattern hooks compose cleanly for React
- **Category:** S14 (Simple, pragmatic abstractions)
- **Impact:** Medium
- **Explanation:** `useGameAction` composes 7 domain action hooks (useTradeActions, useNavigationActions, etc.) into a single flat object via `useMemo`. Components can opt into narrower per-domain hooks; the unified API stays compatible. `useEncounterOrchestration` (301 lines) successfully extracts the encounter state machine out of `App.jsx`.
- **Evidence:** `src/hooks/useGameAction.js:34-71`; `src/hooks/useEncounterOrchestration.js:27-301`.
- **Found by:** Structure

## Flaws/Risks

Ranked by impact.

### [F-01] `applyEncounterOutcome` bypasses the Bridge Pattern with no atomicity
- **Category:** 6 (Leaky abstractions)
- **Impact:** High
- **Explanation:** A free function in `src/features/danger/` reads `game.getState()` then performs ~20 cascading mutations through coordinator-delegated methods (`updateFuel`, `updateShipCondition`, `updateCredits`, `updateDebt`, `updateCargo`, `modifyFactionRep`, `modifyKarma`, `markDirty`). If any step throws (e.g., `setFactionRep` rejecting an invalid faction name), some costs are applied and others aren't — and downstream side effects like `failMissionsDueToCargoLoss` may not run. The outcome shape (`costs`/`rewards` keys) is the de-facto schema all encounter managers must produce, but it lives outside any manager.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:15-210`. Excerpt: `const state = game.getState(); ... game.updateFuel(newFuel); ... game.updateShipCondition(...); ... game.modifyFactionRep(...); ... game.markDirty();`
- **Found by:** Coupling, Integration

### [F-02] `NavigationSystem.executeJump` is a parallel god-method outside the manager system
- **Category:** 6 (Leaky abstractions)
- **Impact:** High
- **Explanation:** `game-navigation.js` is a top-level module (not a manager) that orchestrates a full jump (validate → updateFuel → updateTime → updateLocation → updateShipCondition → saveGame → animate) by reaching into `gameStateManager`. This duplicates and short-circuits `NavigationManager`. Components and hooks call it via `game.navigationSystem.*`, leaking the parallel system into the UI. There is no documented rule for which to edit when navigation logic changes.
- **Evidence:** `src/game/game-navigation.js:412-528` (`executeJump`); `src/main.jsx:62` (separately instantiated); `src/hooks/useNavigationActions.js:15` (`game.navigationSystem.executeJump`); `src/features/navigation/SystemPanel.jsx:235,241,245,252`; `src/features/missions/MissionBoardPanel.jsx:29,41,46`.
- **Found by:** Structure, Coupling

### [F-03] Single seeded RNG value reused for multiple independent decisions
- **Category:** 19 (Lack of idempotency / determinism)
- **Impact:** High
- **Explanation:** `CombatManager.resolveCombat` calls `new SeededRandom(seed).next()` once and threads that single number to every resolve* method, where it gates orthogonal outcomes. `MechanicalFailureManager.checkForFailure` does the same: one `seededRng` is compared against three different failure thresholds (hull, engine, life-support), so failures are perfectly correlated rather than independent. The seeding design promises determinism with property-test independence; this implementation weakens that property.
- **Evidence:** `src/game/state/managers/combat.js:39` `const rng = new SeededRandom(seed).next();`; `src/game/state/managers/mechanical-failure.js:29-52` (single `seededRng` compared at lines 34, 43, 52).
- **Found by:** Integration

### [F-04] Fragmented state ownership inside `state.player` / `state.world` / `state.ship`
- **Category:** 13 (Inconsistent boundaries) / 10 (Anemic domain model)
- **Impact:** High
- **Explanation:** Sub-keys of `state.player` are owned by different managers: `credits` → StateManager, `karma`/`factions` → DangerManager, `daysElapsed` → EventsManager, `debt`/`finance` → DebtManager, `currentSystem` → NavigationManager. The codebase self-documents this in `capabilities.js`. Consequence: ~15 managers receive `getDaysElapsed` as a capability; cross-cutting operations (jump, encounter resolution) must thread through 5+ managers. State is a passive nested object record with no class, no invariants, no methods — the textbook anemic-domain shape.
- **Evidence:** `src/game/state/capabilities.js:16-49` (state-slice ownership table); `src/game/state/game-coordinator.js` (`getDaysElapsed:` appears 15× in capability literals).
- **Found by:** Structure, Coupling

### [F-05] UI panels reimplement encounter probability math
- **Category:** 25 (Business logic in the UI)
- **Impact:** High
- **Explanation:** `CombatPanel.calculateCombatProbabilities` and `NegotiationPanel.calculateNegotiationProbabilities` re-derive success rates from base config + karma + quirks + upgrades, mirroring the resolution logic in `CombatManager`/`NegotiationManager`. Two sources of truth for the same math — they will drift and the displayed probability will diverge from the actual roll.
- **Evidence:** `src/features/danger/CombatPanel.jsx:501-611` (mirrors `combat.js:75-89`); `src/features/danger/NegotiationPanel.jsx:405-456`.
- **Found by:** Error/Observability

### [F-06] Outcome descriptions hardcoded in JSX instead of derived from `*_CONFIG`
- **Category:** 28 (Magic numbers/strings everywhere)
- **Impact:** Medium
- **Explanation:** Combat outcome strings like `"Take hull damage (-20%), combat continues"`, `"Heavy damage (-30% hull), lose cargo and ₡500"`, `"+10 authority reputation"`, `"-10% morale"` are typed by hand in JSX. Constants exist for these values; if a designer tunes `COMBAT_CONFIG`, the UI lies. This is the cleanest violation of CLAUDE.md's "ALL magic numbers must go in `src/game/constants.js`" rule.
- **Evidence:** `src/features/danger/CombatPanel.jsx:292,298,348,354,449,455`.
- **Found by:** Error/Observability

### [F-07] Severity-color tables and reputation-tier mappings duplicated 5× across panels
- **Category:** 28 (Magic numbers/strings everywhere)
- **Impact:** Medium
- **Explanation:** Identical green/orange/red lookups recur in `getCombatIntensityColor`, `getInspectionSeverityColor`, `getFailureSeverityColor`, plus reputation-tier mappings re-implemented in `getReputationClass` across InspectionPanel/NegotiationPanel/DistressCallPanel. The `THREAT_ESCALATION` map (`weak→moderate→strong→dangerous`) is hardcoded inside `useEncounterOrchestration.js`. `InspectionPanel` security thresholds (2.0/1.5/1.0/0.5) are typed inline. None of these tables exist in `constants.js`.
- **Evidence:** `src/features/danger/CombatPanel.jsx:620-633`; `MechanicalFailurePanel.jsx:450-465`; `InspectionPanel.jsx:397-408,417-422,430-437`; `src/hooks/useEncounterOrchestration.js:156-161`.
- **Found by:** Error/Observability

### [F-08] `getNPCState` mutates state on first read
- **Category:** 12 (Hidden side effects)
- **Impact:** Medium
- **Explanation:** A method named like a getter writes the default NPC state and calls `markDirty()` whenever it's called for an unseen NPC. UI surfaces include workaround comments (DevAdminPanel notes "avoid `getNPCState` which creates entries and sets `lastInteraction` as a side effect"). `App.jsx` then mutates the returned reference (`yumiState.interactions = 0`) to bypass the API entirely — directly contradicting CLAUDE.md's rule that components must never call `getState()` directly or mutate game state from React.
- **Evidence:** `src/game/state/managers/npc.js:69-93`; `src/App.jsx:229-231,369-371` (`game.getNPCState('yumi_delta_pavonis').interactions = 0; game.markDirty();`); `src/features/dev-admin/DevAdminPanel.jsx:142-152`.
- **Found by:** Structure, Error/Observability

### [F-09] `coordinatorRef` escape hatch defeats capability isolation
- **Category:** 6 (Leaky abstractions)
- **Impact:** Medium
- **Explanation:** `DialogueManager` and `InfoBrokerManager` receive a full `coordinatorRef` capability so legacy modules (`game-dialogue.js`, `game-information-broker.js`) can pull whatever they need. Inside those legacy modules, `buildDialogueContext` reaches ~30 different methods on the coordinator. The capabilities.js typedef explicitly admits this is "documented coupling that will be addressed if the dialogue engine is refactored" — making the supposedly-narrow capability bag a service locator for two managers.
- **Evidence:** `src/game/state/game-coordinator.js:243,289` (`coordinatorRef: this`); `src/game/state/managers/dialogue.js:92`; `src/game/state/managers/info-broker.js:40,67`; `src/game/state/capabilities.js:202-208`; `src/game/game-dialogue.js:46-95`.
- **Found by:** Structure, Coupling

### [F-10] Multi-step jump leaves state half-updated on failure
- **Category:** 26 (Poor transactional boundaries)
- **Impact:** Medium
- **Explanation:** `NavigationSystem.executeJump` performs four sequential coordinator calls (`updateFuel` → `updateTime` → `updateLocation` → `updateShipCondition`) plus `saveGame()` with no rollback. If any throws (or the tab closes mid-sequence), the save reflects a partial jump — fuel deducted but location unchanged, etc.
- **Evidence:** `src/game/game-navigation.js:454-474`.
- **Found by:** Integration

### [F-11] `GameCoordinator` (1642 lines) holds ad-hoc logic alongside delegation
- **Category:** 13 (Inconsistent boundaries) / 11 (Low cohesion)
- **Impact:** Medium
- **Explanation:** While the ~180 delegation methods are an intentional facade per the GSM-refactor plan, real logic still leaks into the coordinator: `getTanakaMissionDisplay` (lines 1008-1043) walks quest definitions and formats progress strings; `setShipEngine` is implemented inline in MissionManager construction (lines 431-438) instead of going through `shipManager`. The composition root keeps acquiring domain logic.
- **Evidence:** `src/game/state/game-coordinator.js:1008-1043,431-438`.
- **Found by:** Structure, Coupling

### [F-12] `EventsManager.updateTime` orchestrates seven sibling-manager side effects
- **Category:** 9 (Shotgun surgery)
- **Impact:** Medium
- **Explanation:** A single time advance pulls in: `incrementPriceKnowledgeStaleness`, `cleanupOldIntelligence`, `applyMarketRecovery`, `recalculatePricesForKnownSystems`, `checkLoanDefaults`, `processDebtTick`, `checkMissionDeadlines`. The invariant — "advancing time must update all of these in this order" — is invisible from any single call site and lives entirely in capability wiring at the coordinator. Adding a new tick-driven subsystem (e.g., faction decay) requires editing capability literals, the manager, and the orchestration sequence.
- **Evidence:** `src/game/state/managers/events.js:95-148`; `src/game/state/game-coordinator.js:259-274`.
- **Found by:** Structure

### [F-13] `MissionManager` and similar capability bags approach service-locator scale
- **Category:** 23 (Dependency injection misuse)
- **Impact:** Medium
- **Explanation:** `MissionCapabilities` exposes ~25 functions covering credits, cargo, faction rep, NPC rep, karma, debt, ship cargo removal, stats, quest queries, and more. The bag is wide enough that any new mission feature can find what it needs, which removes the design pressure that motivated capability injection in the first place. Inside MissionManager, ~73 `this.capabilities.X` references in 619 lines.
- **Evidence:** `src/game/state/game-coordinator.js:371-405`; `src/game/state/managers/mission.js`.
- **Found by:** Coupling

### [F-14] `state-validators.js` (1019 lines) contains business logic, not just validation
- **Category:** 13 (Inconsistent boundaries)
- **Impact:** Medium
- **Explanation:** Save migrations call `TradingSystem.calculatePrice(...)` to seed initial price knowledge, mutating the state object in place across hundreds of lines. Migrations can throw partway through (`migrateFromV1ToV2:524` throws if a current system ID isn't found in star data) AFTER 70+ lines of in-place mutations to ship condition, ship personality, danger fields, and player state — leaving the input ref in an inconsistent intermediate version. The "validators" name lies about what the file does.
- **Evidence:** `src/game/state/state-validators.js:533,782,836` (`TradingSystem.calculatePrice` calls); `:448-579` (`migrateFromV1ToV2` mutates input).
- **Found by:** Structure, Integration

### [F-15] Two save-load modules duplicate serialization
- **Category:** 22 (Configuration sprawl)
- **Impact:** Medium
- **Explanation:** `src/game/state/save-load.js` (free functions) and `src/game/state/managers/save-load.js` (manager) both implement save/load with `JSON.stringify` + `localStorage.setItem`. They use different logging strategies (`console.error` vs `this.log`/`devLog`) and partly diverge in error handling. Easy source of bugs when one is updated and the other isn't.
- **Evidence:** `src/game/state/save-load.js:16-47,57-75`; `src/game/state/managers/save-load.js:69-93,137-156`.
- **Found by:** Error/Observability

### [F-16] Inconsistent error/logging strategy; production load failures are silent
- **Category:** 20 (Weak error handling) / 21 (No observability) / 34 (Inconsistent logging)
- **Impact:** Medium
- **Explanation:** Three logging policies coexist without enforced layering: `devLog`/`devWarn` (suppressed in production), `BaseManager.log/warn/error` (class-prefixed), and raw `console.error` (used in non-manager modules and hooks). `src/game/state/save-load.js:73` logs production load failures only via `devLog` — silent in production — while save failures use raw `console.error`. `ErrorBoundary` only writes to console; there is no production error reporting (Sentry-equivalent). For a published browser game, this means crashes in the wild leave no breadcrumb.
- **Evidence:** `src/game/state/save-load.js:18,44,73,88,104` (mixed strategies in same module); `src/components/ErrorBoundary.jsx:58-61` (`console.error` only); 26 catch blocks across the codebase use varied strategies (silent / log / rethrow / recover).
- **Found by:** Error/Observability

### [F-17] Stale dependencies — Three.js 34 minor versions behind, 15 npm-audit findings
- **Category:** 31 (Dead code / unused dependencies)
- **Impact:** Medium
- **Explanation:** `three: ^0.150.0` vs current 0.184.0 (Three.js does not follow strict semver — minor bumps add features and patch security/perf). Vitest 1→4 (3 majors behind), Vite 5→8, jsdom 23→29, fast-check 3→4, react-dom 18→19. `npm audit` reports 15 vulnerabilities (11 moderate, 4 high) — most in dev tooling chain (esbuild dev-server queryable from any site, brace-expansion ReDoS, ajv ReDoS). Production runtime impact is small, but contributor laptops are exposed.
- **Evidence:** `npm outdated` and `npm audit` output (verified during this analysis).
- **Found by:** Security & Quality

### [F-18] `sanitizeShipName` regex relies on JSX escaping for actual safety
- **Category:** 30 (Security as afterthought)
- **Impact:** Low
- **Explanation:** `replace(/<[^>]*>/g, '')` only strips fully-closed tag sequences. Inputs like `<script` (no closing `>`), `< script>`, or `javascript:` URLs pass through unchanged. The actual XSS defense is React's JSX text-interpolation escaping at every render site. The function comment says "Removes HTML tags … to prevent display issues" — it gives a false sense of security and would fail open if anyone later renders ship name into a tooltip via `innerHTML` or a Three.js text overlay.
- **Evidence:** `src/game/utils/string-utils.js:19-31`.
- **Found by:** Security & Quality

### [F-19] No prototype-pollution guard on save load + unguarded `for...in`
- **Category:** 30 (Defense in depth) / 32 (Coverage gaps)
- **Impact:** Low
- **Explanation:** `loadGame` does `JSON.parse(saveData)` with no `__proto__`-stripping reviver. `state-validators.js` then iterates with bare `for (const key in obj)` six times (lines 216, 333, 347, 381, 800, 959). A maliciously crafted save could pollute the loaded state object's prototype. The single-player threat model bounds blast radius to the player attacking themselves, but the codebase has zero tests covering proto-polluted save loads despite 4408 tests overall — the highest-leverage missing coverage given the threat model.
- **Evidence:** `src/game/state/save-load.js:67`; `src/game/state/state-validators.js:216,333,347,381,800,959`.
- **Found by:** Security & Quality

### [F-20] Magic 1.05 `smooth_talker` multiplier hardcoded in `NPCManager`
- **Category:** 28 (Magic numbers everywhere)
- **Impact:** Low
- **Explanation:** The `smooth_talker` quirk applies a hardcoded `* 1.05` literal in `NPCManager.modifyRep`, with no constant referenced. This violates CLAUDE.md's stated rule.
- **Evidence:** `src/game/state/managers/npc.js:118`.
- **Found by:** Error/Observability

### [F-21] Result-shape inconsistency: `executeJump` returns `{success, error}` while managers return `{success, reason}`
- **Category:** 24 (Inconsistent API contracts)
- **Impact:** Low
- **Explanation:** Hooks/components that handle both must remember which key to read. Plus `migrateFromV1ToV2` JSDoc claims it returns "v4.1.0 state" but the function actually writes `meta.version = '2.0.0'` (the chain continues elsewhere). Misleading docstring.
- **Evidence:** `src/game/game-navigation.js:421,449,527` (`{success: false, error}`); manager methods (e.g. `combat.js:106`) use `{success, reason}`. `src/game/state/state-validators.js:446,449,574` for the JSDoc-vs-version mismatch.
- **Found by:** Integration

### [F-22] Module-level mutable `DEV_MODE`, fetch-detected
- **Category:** 1 (Global mutable state) / 30 (Security as afterthought)
- **Impact:** Low
- **Explanation:** `export let DEV_MODE = false` is mutated asynchronously by `initDevMode()` which performs a `fetch('.dev?t=...')` and enables dev features when the response isn't an HTML fallback. Any importer reading `DEV_MODE` before `initDevMode` resolves sees `false` (race on module load). The HTML-fallback detection branch is fragile — many static hosts and proxies serve dotfiles, gzip-encode them differently, or rewrite content-types, any of which flips the gate. There is no defense-in-depth (no `import.meta.env.PROD` build-time check, no Vite `define`).
- **Evidence:** `src/game/constants.js:570,581-607`; `src/game/state/managers/base-manager.js:1,39,49`.
- **Found by:** Structure, Security & Quality

### [F-23] DevAdminPanel statically imported into production bundle
- **Category:** 30 (Security as afterthought) / 31 (Dead-on-load code)
- **Impact:** Low
- **Explanation:** `App.jsx:9` unconditionally imports DevAdminPanel; only render is gated by `DEV_MODE` (which itself depends on F-22). The full 880 lines of credit/karma/faction/quirk/upgrade/cargo/encounter mutators ship in every production bundle. Single-player threat model bounds the harm to the player's own save, but it's wasted bytes and an unnecessary surface — combined with F-22, one server misconfiguration exposes the entire admin panel.
- **Evidence:** `src/App.jsx:9`; `src/features/dev-admin/DevAdminPanel.jsx` (880 lines).
- **Found by:** Security & Quality

### [F-24] Documentation drift — CLAUDE.md says "15+ managers"; the codebase has 25
- **Category:** 13 (Inconsistent boundaries)
- **Impact:** Low
- **Explanation:** CLAUDE.md (lines 62, 97) describes "15+" managers and lists ~18 by name. The actual `src/game/state/managers/` directory contains 25 files (including DebtManager, AchievementsManager, QuestManager, EventEngineManager not in the list). AGENTS.md has the same drift. Onboarding signal is wrong; agents reading the doc have an incomplete map of the manager layer.
- **Evidence:** `CLAUDE.md:62-71`; `AGENTS.md:97-115`; `ls src/game/state/managers/*.js` shows 25 files.
- **Found by:** Structure, Coupling

## Coverage Checklist

### Flaw/Risk Types 1–34

| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Observed | F-22 |
| 2 | God object | Observed | F-11 |
| 3 | Tight coupling | Observed | F-09 (InformationBroker static methods mutate gameState) |
| 4 | High/unstable dependencies | Observed | F-12 |
| 5 | Circular dependencies | Not observed | — |
| 6 | Leaky abstractions | Observed | F-01, F-02, F-09 |
| 7 | Over-abstraction | Not observed | — |
| 8 | Premature optimization | Not observed | — |
| 9 | Shotgun surgery | Observed | F-12 |
| 10 | Feature envy / anemic domain model | Observed | F-04 |
| 11 | Low cohesion | Observed | F-11 |
| 12 | Hidden side effects | Observed | F-08 |
| 13 | Inconsistent boundaries | Observed | F-04, F-11, F-14, F-24 |
| 14 | Distributed monolith | Not applicable | Single-player browser game |
| 15 | Chatty service calls | Not assessed | No concrete evidence |
| 16 | Synchronous-only integration | Not applicable | No network in gameplay path |
| 17 | No clear ownership of data | Observed (partial) | F-04 |
| 18 | Shared database across services | Not applicable | Single-process |
| 19 | Lack of idempotency | Observed | F-03, F-14 |
| 20 | Weak error handling strategy | Observed | F-16 |
| 21 | No observability plan | Observed | F-16 |
| 22 | Configuration sprawl | Observed | F-15 |
| 23 | Dependency injection misuse | Observed | F-13 |
| 24 | Inconsistent API contracts | Observed | F-21 |
| 25 | Business logic in the UI | Observed | F-05 |
| 26 | Poor transactional boundaries | Observed | F-01, F-10 |
| 27 | Temporal coupling | Not assessed | useAnimationLock claim weak |
| 28 | Magic numbers/strings everywhere | Observed | F-06, F-07, F-20 |
| 29 | "Utility" dumping ground | Not observed | — |
| 30 | Security as an afterthought | Observed | F-18, F-19, F-22, F-23 |
| 31 | Dead code / unused dependencies | Observed | F-17 |
| 32 | Missing test coverage for critical paths | Observed | F-19 (proto-pollution) |
| 33 | Hard-coded credentials or secrets | Not observed | Clean |
| 34 | Inconsistent error/logging conventions | Observed | F-16 |

### Strength Categories S1–S14

| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | S-02 |
| S2 | High cohesion | Observed | S-01 |
| S3 | Loose coupling | Observed | S-02 |
| S4 | Dependency direction is stable | Observed | S-03 |
| S5 | Dependency management hygiene | Observed | S-09 |
| S6 | Consistent API contracts | Observed | S-06, S-13 |
| S7 | Robust error handling | Observed | S-10, S-11 |
| S8 | Observability present | Observed (dev-mode) | S-10 |
| S9 | Configuration discipline | Observed | S-06, S-08 |
| S10 | Security built-in | Observed | S-07 |
| S11 | Testability & coverage | Observed | S-05 |
| S12 | Resilience patterns | Observed | S-04, S-08, S-09 |
| S13 | Domain modeling strength | Observed | S-04 |
| S14 | Simple, pragmatic abstractions | Observed | S-12, S-14 |

## Hotspots

Top 3 areas to review:

1. **`src/features/danger/applyEncounterOutcome.js` and the encounter outcome contract.** This is the cluster where the cleanest abstraction (capability-injected managers) leaks hardest — outcome shape is implicit, mutations are non-atomic, and the function lives in a UI feature folder. F-01 + F-05 + F-06 + F-07 all radiate from this area.

2. **`src/game/game-navigation.js` + `src/game/state/managers/navigation.js` (and the other top-level `game-*.js` siblings).** Two parallel modules cover navigation; `executeJump` short-circuits the manager API. The same pattern recurs less severely with `game-trading.js`, `game-information-broker.js`, `game-dialogue.js`, `game-events.js`, `game-npcs.js`. F-02 + F-09 + F-10 cluster here, and the doc drift in F-24 makes the split invisible to new contributors.

3. **`src/game/state/state-validators.js` + `src/game/state/save-load.js` + `src/game/state/managers/save-load.js`.** 1019 lines of save-format migration with in-place mutation, duplicate save modules, silent production-load failures, and zero adversarial-input tests. The pipeline is well-designed (S-08) but the implementation has F-14 + F-15 + F-16 + F-19 stacked on it.

## Next Questions

1. The legacy `src/game/game-*.js` files (game-trading, game-navigation, game-dialogue, game-information-broker, game-events, game-npcs) coexist with same-named managers in `src/game/state/managers/`. What's the intended relationship — are these "engine" classes the manager-level managers should call, are they slated for absorption into managers, or is the duplication intentional? Where should new code go?

2. The encounter outcome shape (`{success, costs, rewards, description}` with ad-hoc keys nested inside `costs`/`rewards`) is the de-facto contract enforced by `applyEncounterOutcome.js`'s if-branches. Is there an intended canonical schema, and should outcome application live in a manager rather than a feature folder?

3. Is the GSM Refactor considered complete, or is there a deliberate next phase that addresses the documented `coordinatorRef` escape hatches in DialogueManager and InfoBrokerManager?

4. What's the policy for `Math.random` vs `SeededRandom`? Some encounter resolvers extract a single `next()` value and reuse it for multiple independent decisions — was that intentional (e.g., for cinematic correlation) or accidental?

5. Is the lack of production error reporting (no Sentry-equivalent) a deliberate choice, or has it just not been prioritized? The single-player threat model is forgiving but a save-corrupting edge case in the wild is currently undiagnosable.

## Analysis Metadata

- **Agents dispatched:** 5 specialists (Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error/Observability, Security & Code Quality) + 1 Verifier
- **Scope:** Full repository, 171 source files, 436 test files
- **Raw findings:** 95 (across all specialists, including overlaps)
- **Verified findings:** 38 (24 flaws + 14 strengths)
- **Filtered out:** 57 (duplicates, weak evidence, low-impact stylistic claims, false positives)
- **By impact:** 5 high flaws + 7 high strengths; 12 medium flaws + 7 medium strengths; 7 low flaws
- **Steering files consulted:** CLAUDE.md, AGENTS.md (both confirmed to drift on manager count and have outdated lists)
