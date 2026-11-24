# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286 [working tree dirty]
**Languages:** JavaScript (ES Modules), JSX, React 18, Three.js
**Key directories:** `src/App.jsx`, `src/main.jsx`, `src/components/`, `src/context/`, `src/hooks/`, `src/features/` (23 features), `src/game/` (constants + state/managers + engine + data + utils), `tests/{unit,property,integration}/`
**Scope:** Full repository

## Repo Overview

Tramp Freighter Blues is a single-player browser game (React 18 + Three.js + Vite) — a 3D space-trading survival sim across 117 real star systems. The codebase has ~171 hand-written source files in `src/` and ~441 test files in `tests/`. No backend, no users, no auth, no networked dependencies; persistence is localStorage with a versioned save schema (5 migrations: V1→V2→V2.1→V4→V4.1→V5).

Architecturally, the engine is an imperative `GameCoordinator` singleton (1642 lines, composition root) that owns 25 capability-injected domain managers (`src/game/state/managers/`). React communicates with the engine through a documented "Bridge Pattern": `useGameEvent(eventName)` for state subscriptions and `useGameAction()` for action triggers. CLAUDE.md explicitly forbids components from calling `GameCoordinator.getState()` directly.

The codebase is the post-refactor state of a recently completed "GSM Refactor" (per project memory), which replaced a god-object `GameStateManager` with the current capability-injected manager partition. The ~183 facade methods on `GameCoordinator` are intentional, not a regression. Active churn is high (300+ commits in 6 months on managers; ongoing work on mobile, accessibility, endgame, and a Yumi-Tanaka post-credits NPC flow).

## Strengths

### [S-1] Bridge Pattern with capability injection earns its abstraction cost
- **Category:** S14 — Pragmatic abstractions (also S3 — Loose coupling)
- **Impact:** High
- **Explanation:** Two abstractions exist where they have a real test seam and second consumer: the React/imperative bridge (`GameContext` + `useGameEvent` + `useGameAction`) is used everywhere with multiple subscribers per event, and per-manager capability injection wires explicit dependency boundaries that allow each manager to be unit-tested without instantiating the full coordinator. Neither is speculative.
- **Evidence:** `src/context/GameContext.jsx` (44 lines), `src/hooks/useGameEvent.js`, `src/hooks/useGameAction.js`; `src/game/state/game-coordinator.js:124-152` shows TradingManager constructed with ~13 narrow callbacks (`getCredits`, `updateCargo`, `applyTradeWithholding`, …) rather than the whole coordinator.
- **Found by:** Coupling & Dependencies, Structure & Boundaries

### [S-2] Minimal attack surface — three production dependencies, zero secrets, zero analytics
- **Category:** S10 — Security built-in
- **Impact:** High
- **Explanation:** Production dependencies are exactly `react`, `react-dom`, `three`. No analytics, no error tracking, no auth SDK, no remote-fetch library. Grep finds zero `sentry|bugsnag|datadog|google-analytics|gtag|posthog|mixpanel|amplitude` matches. No `.env` files; the only `process.env` references are NODE_ENV test-mode toggles. This is the right architecture for a single-player browser game: nothing to leak because nothing is collected.
- **Evidence:** `package.json:40-44` — three production deps; `ls .env*` returns nothing; `grep -rE "api[_-]?key|secret|token|password|bearer|sk-[a-zA-Z0-9]{20,}|AKIA..." src/` returns only narrative dialogue text.
- **Found by:** Security & Code Quality

### [S-3] Critical-path test coverage with deterministic RNG seams
- **Category:** S11 — Testability & coverage
- **Impact:** High
- **Explanation:** Encounter resolvers and other RNG-driven gameplay paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType` per CLAUDE.md). Each of the five encounter resolvers has a substantial unit test file: combat (391 lines), negotiation (639), inspection (416), distress (367), mechanical-failure (219). Save-load has 12 dedicated test files. 441 test files vs 171 source files (2.55× ratio) is well above typical browser-game baseline.
- **Evidence:** `src/game/utils/seeded-random.js`; `grep -rln "SeededRandom" src/game/state/managers/` lists all encounter managers; `tests/unit/`, `tests/property/`, `tests/integration/` directory structure.
- **Found by:** Security & Code Quality

### [S-4] Layered error recovery for save and init paths
- **Category:** S7 — Robust error handling
- **Impact:** High
- **Explanation:** Three coordinated error-handling seams: top-level React `ErrorBoundary` with reload UI, `renderErrorUI` fallback in `main.jsx` that offers "Clear Save and Restart" when init throws, and `SaveLoadManager.handleLoadError` + `attemptNPCRecovery` that targets specifically the known NPC corruption mode before giving up. `beforeunload` `flushSave()` reduces data loss on tab close.
- **Evidence:** `src/main.jsx:93-141` (`renderErrorUI` with destructive-action confirmation and Retry); `src/components/ErrorBoundary.jsx:43-61`; `src/game/state/managers/save-load.js:165-207` (`handleLoadError` inspects `error.message.includes('NPC')`).
- **Found by:** Error Handling & Observability

### [S-5] Frozen `EVENT_NAMES` enum eliminates string-typo drift between producers and consumers
- **Category:** S6 — Consistent API contracts
- **Impact:** High
- **Explanation:** All emit/subscribe sites in `src/` reference the frozen `EVENT_NAMES` object — zero raw string event names exist. Producers (managers) and consumers (`useGameEvent`) share a single declarative source-of-truth (`EVENT_STATE_MAP`) for both event identifier and state-extraction function. A typo fails at module-load, not at runtime.
- **Evidence:** `src/game/constants.js:1858-1935` (frozen enum) and `:1948-2015` (`EVENT_STATE_MAP`); `grep -rE "\.emit\(['\"][a-zA-Z]" src/**/*.{js,jsx}` returns zero matches; `grep -rE "useGameEvent\(['\"][a-zA-Z]" src/**/*.{js,jsx}` returns zero matches.
- **Found by:** Integration & Data

### [S-6] Per-manager capability typedefs document and enforce slice ownership
- **Category:** S6 — Consistent API contracts (applied to internal contracts)
- **Impact:** High
- **Explanation:** Every manager receives a typed `capabilities` object that exposes only its owned slice via `getOwnState()` plus narrow getters/setters for cross-domain reads/writes; cross-slice mutations are explicit injected callbacks, not direct state access. The ownership table at the top of `capabilities.js` enumerates which manager owns which paths. This is exemplary internal-contract discipline for a game engine.
- **Evidence:** `src/game/state/capabilities.js:18-49` (ownership table — DangerManager owns `player.karma`, `player.factions`, `world.dangerFlags`; TradingManager owns `world.priceKnowledge`, etc.); `:222` explicitly warns ShipManager: "StateManager owns: fuel, cargo (do NOT mutate directly)".
- **Found by:** Integration & Data

### [S-7] Manager package: stated and evidenced single-responsibility partition
- **Category:** S1 — Clear modular boundaries
- **Impact:** High
- **Explanation:** The post-GSM-refactor manager partition is genuinely modular. Each of the 25 managers extends `BaseManager`, receives explicit capabilities (no global state reach-through), and has a documented single responsibility (1-2 sentence header). Cross-manager calls go through capability functions, never direct references — preserving testability.
- **Evidence:** Sample headers verified at `src/game/state/managers/ship.js:11-20`, `npc.js:11-20`, `state.js:5-10`, `trading.js:13-21`. `src/game/state/managers/base-manager.js:1` only imports `constants.js`. Refactor commits `c644031` ("Phase 5: delete GameStateManager wrapper"), `48f0b73`, `e9b47c5`, `eddfa3d` show a sustained 6-phase migration that landed cleanly.
- **Found by:** Structure & Boundaries

### [S-8] Centralized constants policy is real and largely followed
- **Category:** S9 — Configuration discipline
- **Impact:** High
- **Explanation:** `src/game/constants.js` (2022 lines, 56 named exports) is a real single source of truth for game balance: `COMBAT_CONFIG`, `KARMA_CONFIG`, `REPAIR_CONFIG.FREE_REPAIR_LIMITS`, `MISSION_CONFIG.MAX_ACTIVE`, `UI_CONFIG.SAVE_DEBOUNCE_MS`, `RESTRICTED_GOODS_CONFIG`, etc. — all imported from features. The CLAUDE.md "all magic numbers in constants.js" policy is mostly observed; the violations flagged below (F-14, F-15, F-34) are point exceptions rather than the norm.
- **Evidence:** `src/game/constants.js` (56 named exports); `src/features/repair/RepairPanel.jsx:5-23` has 9 named imports from constants vs. 1 hardcoded `25` (≈98% adherence locally); the same import-heavy header pattern appears across feature files.
- **Found by:** Error Handling & Observability

### [S-9] Manager package has no inter-manager imports; static graph is acyclic
- **Category:** S5 — Dependency management hygiene
- **Impact:** High
- **Explanation:** All 25 manager files import only `BaseManager`, constants, data, and util modules — never each other. The coordinator owns composition; managers stay leaves of the dependency graph. This makes individual managers swappable in tests and prevents accidental cycles.
- **Evidence:** `grep "^import" src/game/state/managers/*.js` shows no `./<other-manager>` imports across the package; top-level game files (`game-trading.js`, `game-events.js`, `game-information-broker.js`) import no managers; managers depend on them, not vice versa.
- **Found by:** Coupling & Dependencies

### [S-10] Stable dependency direction — engine layer points down only
- **Category:** S4 — Dependency direction stable
- **Impact:** Medium
- **Explanation:** `GameCoordinator` is imported in exactly one place outside `src/game/state/` (`main.jsx`). Components and hooks reach the coordinator through `GameContext`, never via direct import — so the React tree depends on the engine, not vice versa. Engine modules in `src/game/` have zero imports from `src/components`, `src/features`, `src/hooks`, or `src/context`.
- **Evidence:** `grep "import.*GameCoordinator" src/` returns 1 hit (`main.jsx:6`); `useGameAction.js:34-71` composes domain hooks rooted in `useGame()` context.
- **Found by:** Coupling & Dependencies

### [S-11] Working `SAVE_FAILED` event-to-notification pipeline
- **Category:** S8 — Observability present
- **Impact:** Medium
- **Explanation:** `SaveLoadManager` emits `EVENT_NAMES.SAVE_FAILED` with a human-readable message; `App.jsx` subscribes via `useGameEvent` and forwards to `notificationCtx.showError`. This is the producer→event→consumer→user pipeline that the rest of the error surfaces should follow (cf. F-19, where dialogue-action errors are silently dropped despite this seam being available).
- **Evidence:** `src/game/state/managers/save-load.js:89-92` (`this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, ...)`); `src/App.jsx:78,127-132` (`useGameEvent(EVENT_NAMES.SAVE_FAILED)` → `notificationCtx.showError`); `src/context/NotificationContext.jsx`.
- **Found by:** Error Handling & Observability

## Flaws/Risks

### [F-1] `applyEncounterOutcome.js` lives in `features/` but is pure manager-tier mutation logic
- **Category:** Flaw 13 — Inconsistent boundaries (also Flaw 6 — Leaky abstractions, Flaw 12 — Hidden side effects)
- **Impact:** High
- **Explanation:** A 213-line pure game-state mutation function lives in `src/features/danger/` (the React UI layer) but reads `game.getState()` and writes through ~15 coordinator setters (`updateFuel`, `updateShipCondition`×3, `updateCredits`, `updateDebt`, `updateCargo`, `clearHiddenCargo`, `removeRestrictedCargo`, `failMissionsDueToCargoLoss`, `modifyKarma`, `modifyFactionRep`, `abandonMission`, `modifyAllPassengerSatisfaction`, `markDirty`). This directly contradicts CLAUDE.md's critical rule: "Components must NEVER call `GameCoordinator.getState()` directly". A new `EncounterOutcomeManager` extending `BaseManager` would absorb this naturally.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:16` (`const state = game.getState();`); `:23-72` (direct setter calls); `:210` (`game.markDirty()` from a feature directory). Imported by `src/hooks/useEncounterOrchestration.js:3` and `src/features/narrative/NarrativeEventPanel.jsx:33`.
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Error Handling & Observability

### [F-2] `NavigationSystem.executeJump` bypasses Bridge Pattern and the dedicated `NavigationManager`
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** High
- **Explanation:** `NavigationSystem.executeJump(gameStateManager, ...)` is invoked from a React hook with the entire `game` instance, then internally calls `gameStateManager.getState()` plus 7+ other coordinator methods (`updateFuel`, `updateTime`, `updateLocation`, `applyQuirkModifiers`, `updateShipCondition`, `saveGame`, `emit`, `calculateShipCapabilities`). It also re-implements jump orchestration that the dedicated `NavigationManager` is supposed to own. The clean Bridge Pattern is undone for the central jump action — arguably the most-traveled gameplay path.
- **Evidence:** `src/game/game-navigation.js:412-528` (`executeJump`); `:418` `const state = gameStateManager.getState()`; `src/hooks/useNavigationActions.js:14-20` passes the whole `game` to a peer object held on itself; `src/game/state/managers/navigation.js` has `updateLocation`/`dock`/`undock` but no `executeJump` orchestrator.
- **Found by:** Coupling & Dependencies

### [F-3] `NarrativeEventPanel` orchestrates a 5-step state-mutation chain from JSX
- **Category:** Flaw 25 — Business logic in UI (also Flaw 12 — Hidden side effects)
- **Impact:** High
- **Explanation:** The choice handler in `NarrativeEventPanel` calls `applyEncounterOutcome(...)`, then `flags.forEach(flag => game.setNarrativeFlag(flag))`, then `game.markEventFired(...)`, then `game.setEventCooldown(...)`, then `game.markDirty()`, then `game.getEventById(...)` for chained events. This sequence is a transactional unit and belongs in a coordinator method (`resolveNarrativeChoice(eventId, choice)`). Per CLAUDE.md, components shouldn't be touching `markDirty` either — that's the manager layer's responsibility.
- **Evidence:** `src/features/narrative/NarrativeEventPanel.jsx:33-58` shows the full chain inline in the React handler; `:54` calls `game.markDirty()` from the JSX layer.
- **Found by:** Error Handling & Observability

### [F-4] 110-line combat probability math lives inside `CombatPanel.jsx`
- **Category:** Flaw 25 — Business logic in UI
- **Impact:** High
- **Explanation:** `calculateCombatProbabilities` (lines 501-611) — applying karma scaling, engine-condition penalties, hot-thruster quirk bonuses, efficient-drive upgrade bonuses, clamping to [0,1] — is defined directly inside the panel module. This is encounter-resolution domain logic; per CLAUDE.md it belongs in `CombatManager` or a sibling `combatUtils.js` so it can be unit-tested independently and shared with whatever runs the actual encounter. Hardcoded outcome strings further bake game-balance numbers into JSX (`-15% fuel`, `-30% hull`, `lose ₡500`).
- **Evidence:** `src/features/danger/CombatPanel.jsx:501-611` (`calculateCombatProbabilities`); `:292-356` outcome text with embedded numbers; sibling `tradeUtils.js` and `repairUtils.js` show the established pattern this panel ignored.
- **Found by:** Error Handling & Observability

### [F-5] `App.jsx` has accumulated 7+ distinct reasons-to-change
- **Category:** Flaw 2 — God object
- **Impact:** Medium
- **Explanation:** Beyond the documented "view-mode state machine" responsibility, `App.jsx` now also owns: cross-mode focus management for keyboard a11y, page-title side effect, exotic-matter scanner notification wiring, narrative-event dedup tracking with a ref, Pavonis run + epilogue lifecycle, post-credits Yumi NPC interaction-counter reset (duplicated in two handlers), and dev-admin toggle. Adding a new endgame, narrative event source, focus rule, or event subscription all converges here. Each is a separate change-axis.
- **Evidence:** `src/App.jsx:1-601`; responsibility list verified by inspection — view-mode switch (top), `useEffect` blocks for focus (134-176), title (178-181), exotic matter (183-208), narrative-dedup ref (340-354), Pavonis flow (356-393); Yumi reset duplicated at `:226-232` and `:367-373`. Recent commits cluster on Pavonis, mobile, narrative, dev — distinct change axes.
- **Found by:** Structure & Boundaries

### [F-6] `capabilities.js` is a 553-line JSDoc-only file with no exports and no importers
- **Category:** Flaw 7 — Over-abstraction (also Flaw 31 — Dead code)
- **Impact:** Medium
- **Explanation:** `capabilities.js` is a pure documentation file describing the shape of objects the coordinator already constructs inline. JS can't enforce JSDoc typedefs, so a typo in coordinator wiring silently surfaces as runtime undefined; no test validates that the typedef matches reality. Knip flags it as the project's only unused file. The documentation value is real but unenforced — it would belong in `docs/` or as inline JSDoc on the constructor calls.
- **Evidence:** `grep "^export" src/game/state/capabilities.js` returns 0 hits; `grep -rn "from.*['\"].*state/capabilities['\"]"` against `src/` and `tests/` returns 0 importers; `npm run knip` output: `Unused files (1) src/game/state/capabilities.js`.
- **Found by:** Coupling & Dependencies, Security & Code Quality

### [F-7] `DialogueManager` and `InfoBrokerManager` hold a full back-reference to the coordinator
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** Both managers receive `coordinatorRef: this` in their capabilities and use it to call `getState()` and mutate cross-domain state (e.g., `state.player.credits`, `state.world.priceKnowledge`, `state.stats.rumorsPurchased`) from outside the manager layer. The `capabilities.js` file self-documents this as a known leak — the team knows about it, but the hole through the otherwise carefully designed capability boundary remains.
- **Evidence:** `src/game/state/capabilities.js:204-207` and `:336-338` ("documented coupling that will be addressed if the dialogue engine is refactored separately"); `src/game/state/managers/info-broker.js:40` (`const state = this.capabilities.coordinatorRef.getState();`); `:74` (`state.stats.rumorsPurchased = purchaseCount + 1;` from outside `StatsManager` ownership).
- **Found by:** Coupling & Dependencies

### [F-8] `animationSystem` two-phase init creates implicit lifecycle order with React render
- **Category:** Flaw 27 — Temporal coupling
- **Impact:** Medium
- **Explanation:** `GameCoordinator` constructs with `animationSystem = null` and `setAnimationSystem` is mutated from a `useEffect` in `StarMapCanvas`. Anything that calls `executeJump` before the StarMap mounts gets a silent no-animation jump; `useAnimationLock` throws. The lifecycle order is implicit, undocumented at the type level, and creates an invariant that depends on render order.
- **Evidence:** `src/game/state/game-coordinator.js:80` (`this.animationSystem = null`); `:504-506` (`setAnimationSystem`); `src/features/navigation/StarMapCanvas.jsx:211` and `:348` (set on mount, null on unmount); `src/hooks/useAnimationLock.js:30-34` throws "Animation system not initialized — StarMapCanvas must be mounted before using useAnimationLock".
- **Found by:** Coupling & Dependencies

### [F-9] Capability bags balloon to 25 callbacks per manager — DI surface starts to look like the coordinator itself
- **Category:** Flaw 23 — Dependency injection misuse
- **Impact:** Medium
- **Explanation:** "Capability injection" is the right idea, but several managers receive 20-25 callbacks. `MissionManager` constructor takes ~25 fields including 8 verbs that delegate to other managers (`applyTradeWithholding → debtManager`, `modifyFactionRep → dangerManager`, `modifyRep → npcManager`, `modifyColeRep → debtManager`, `removeCargoForMission → shipManager`, `isTanakaQuestActive → questManager`, etc.). At that size, "narrowness" is largely cosmetic — every new cross-manager call requires editing both `game-coordinator.js` and the typedef in `capabilities.js`. Manager-to-manager events or a request/dispatch primitive would scale better.
- **Evidence:** `src/game/state/game-coordinator.js:371-405` (MissionManager constructor — 25 callback fields); `:246-279` (EventsManager has 6 callbacks that are pure delegate-to-other-manager); `src/game/state/capabilities.js:374-403` (MissionCapabilities typedef mirroring the same 25 entries).
- **Found by:** Coupling & Dependencies

### [F-10] Dead `uiManager` parameter inside `executeJump` — pre-React plumbing still in code
- **Category:** Flaw 6 — Leaky abstractions (also Flaw 31 — Unreachable code)
- **Impact:** Medium
- **Explanation:** `executeJump` accepts a `uiManager` arg and calls `isStationVisible/hideStationInterface/showTradePanel/hideRefuelPanel/...` on it. No file in `src/` defines any UIManager class or those methods — this is dead post-React-migration plumbing. The only caller passes `null`, so the entire `if (uiManager && animationSystem)` block (lines 482-503, 518-523) is unreachable code that bloats the abstraction's contract.
- **Evidence:** `src/game/game-navigation.js:409-525` (uiManager parameter and dead block); `grep -rn "uiManager\|UIManager" src/` returns hits only inside `game-navigation.js` itself plus one stale doc-comment at `src/game/constants.js:575`; `src/hooks/useNavigationActions.js:15-19` calls `executeJump(game, targetSystemId, game.animationSystem)` — no third argument.
- **Found by:** Coupling & Dependencies

### [F-11] Hooks reach into `game.dangerManager.X` instead of going through the coordinator facade
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** `useDangerZone` and `useEncounterProbabilities` pull `game.dangerManager.getDangerZone(...)`, `.calculatePirateEncounterChance(...)`, `.calculateInspectionChance(...)` directly. The whole point of the 183-method facade is to hide the manager carve-up; once the bridge layer addresses `game.dangerManager.X`, every rename of the danger manager or method becomes a cross-layer change. (CLAUDE.md's prohibition is on components, not hooks, so this is a Bridge-layer leak rather than a CLAUDE.md violation outright — but it makes the facade less load-bearing than its method count suggests.)
- **Evidence:** `src/hooks/useDangerZone.js:15` (`return game.dangerManager.getDangerZone(systemId);`); `src/hooks/useEncounterProbabilities.js:20-25` (two more `game.dangerManager.*` calls); the coordinator does expose `getDangerZone` itself — the hooks chose the manager path anyway.
- **Found by:** Coupling & Dependencies

### [F-12] `SystemPanel` reaches into `game.navigationSystem` for four engine-internal computations
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** The system panel computes connection list, distance, fuel cost, and jump time by calling `game.navigationSystem.getConnectedSystems`, `.calculateDistanceBetween`, `.calculateFuelCostWithCondition`, `.calculateJumpTime` directly inside the JSX render path. Plus it calls `game.applyQuirkModifiers.bind(game)` and passes a `capabilities` object — substantial engine surface inside JSX. None of this routes through `useGameAction`/`useGameEvent`.
- **Evidence:** `src/features/navigation/SystemPanel.jsx:235, 241, 245, 252` (four direct `game.navigationSystem.*` calls); `:248` (`game.applyQuirkModifiers.bind(game)`).
- **Found by:** Coupling & Dependencies

### [F-13] `buildDialogueContext` takes the whole coordinator and queries 20+ facets
- **Category:** Flaw 6 — Leaky abstractions
- **Impact:** Medium
- **Explanation:** `buildDialogueContext(gameStateManager, npcId)` reads `state.player`, `state.ship`, `state.world`, plus `getKarma`, `getHeatTier`, `getNPCState`, `getNarrativeFlags`, `canGetTip`, `canRequestFavor`, `getFactionRep` (×3), and 6 quest accessors. Any new dialogue datum widens the dialogue engine's surface to the entire coordinator. Without a `DialogueContext` interface, the dialogue engine cannot be tested without a near-full coordinator stub. (The "dynamic import to avoid circular dependencies" comment in `managers/dialogue.js:77` is unjustified — no static cycle exists.)
- **Evidence:** `src/game/game-dialogue.js:46-100` shows 20+ distinct `gameStateManager.*` accesses; `src/game/state/managers/dialogue.js:77` and `:110` use `await import(...)` with a comment about cycles that don't exist.
- **Found by:** Coupling & Dependencies

### [F-14] `RepairPanel` hardcodes `25` and tier-percent strings that already exist as `REPAIR_CONFIG.FREE_REPAIR_LIMITS`
- **Category:** Flaw 28 — Magic numbers/strings everywhere
- **Impact:** Medium
- **Explanation:** `RepairPanel` has `availability.maxHullPercent === 25 ? 'Family' : 'Trusted'` and prose strings "10% hull damage" / "25% hull damage" inline, even though `REPAIR_CONFIG.FREE_REPAIR_LIMITS = { trusted: 10, family: 25 }` is already defined. Per CLAUDE.md "ALL magic numbers must go in `src/game/constants.js`" — this is a direct violation of stated policy.
- **Evidence:** `src/features/repair/RepairPanel.jsx:557` (`availability.maxHullPercent === 25 ? 'Family' : 'Trusted'`); `:623, :627` literal "10% hull damage" / "25% hull damage" strings; `src/game/constants.js:1136-1139` (canonical `FREE_REPAIR_LIMITS`).
- **Found by:** Error Handling & Observability

### [F-15] Severity-color hex palette duplicated across 6+ danger panels
- **Category:** Flaw 28 — Magic numbers/strings (also Flaw 34 — Inconsistent error/logging conventions, applied to color/format)
- **Impact:** Medium
- **Explanation:** The same severity color palette (`#00ff88`, `#ffaa00`, `#ff6b6b`, `#ff0000`, `#ffffff`) is hand-rolled inside `getCombatIntensityColor`, `getInspectionSeverityColor`, `PirateEncounterPanel`, `MechanicalFailurePanel`, and `DangerWarningDialog`. `constants.js:1558-1564` already has `SEVERITY_COLORS` for distress calls — proving the centralization pattern — but no shared `INTENSITY_COLORS`/`SEVERITY_PALETTE` is exported, so each panel re-defines its own. Drift risk if one panel updates the palette.
- **Evidence:** `src/features/danger/CombatPanel.jsx:622-632` (local `getCombatIntensityColor`); `src/features/danger/InspectionPanel.jsx:397-407` (duplicate); `PirateEncounterPanel.jsx:464-470`, `MechanicalFailurePanel.jsx:453-461`, `DangerWarningDialog.jsx:273-287` (same palette repeated).
- **Found by:** Error Handling & Observability

### [F-16] `MissionBoardPanel` reads coordinator queries directly at render time
- **Category:** Flaw 12 — Hidden side effects (also Flaw 6 — Leaky abstractions)
- **Impact:** Medium
- **Explanation:** `disabledReasons` IIFE calls `game.getEffectiveMissionCount()` and `game.getCargoRemaining()` directly inside the render path instead of subscribing through `useGameEvent`. These return derived state that may not re-render correctly when underlying state changes through other code paths. The Bridge Pattern's reason-for-being is to make state changes drive re-renders.
- **Evidence:** `src/features/missions/MissionBoardPanel.jsx:53-54`; `src/game/state/game-coordinator.js:1045-1049` (`getEffectiveMissionCount` reads raw state with no event emission).
- **Found by:** Error Handling & Observability

### [F-17] `InspectionPanel` calls `game.getDangerZone` directly even though `useDangerZone(systemId)` exists
- **Category:** Flaw 12 — Hidden side effects
- **Impact:** Medium
- **Explanation:** `InspectionPanel.jsx:38` calls `game.getDangerZone(currentSystem)` directly. The canonical Bridge-pattern hook `useDangerZone(systemId)` already exists and is documented in CLAUDE.md, and `TradePanel.jsx:67` uses it correctly. Same anti-pattern repeats elsewhere in the danger feature.
- **Evidence:** `src/features/danger/InspectionPanel.jsx:30, 38` (`const game = useGame(); ... game.getDangerZone(currentSystem)`); `src/features/trade/TradePanel.jsx:67` (`const dangerZone = useDangerZone(currentSystemId)` — the canonical path).
- **Found by:** Error Handling & Observability

### [F-18] Inconsistent severity for save-path errors within a single file
- **Category:** Flaw 34 — Inconsistent error/logging conventions (also Flaw 20 — Weak error handling)
- **Impact:** Medium
- **Explanation:** Within `src/game/state/save-load.js`, three localStorage exception paths log at different severities: `loadGame` uses `devLog` (silenced in production), but `hasSavedGame` and `clearSave` use `console.error`. So a real load failure in production is invisible while a probe failure is loud. The dev-logger comment explicitly says console.warn/error are for "conditions that indicate real problems" — JSON parse failure in `loadGame` is exactly such a condition.
- **Evidence:** `src/game/state/save-load.js:73` (`devLog('Failed to load game:', error)`, silent in prod); `:88` (`console.error('Failed to check for saved game:', error)`); `:104` (`console.error('Failed to clear save:', error)`); `src/game/utils/dev-logger.js:9-11` comment defining the intended split.
- **Found by:** Error Handling & Observability

### [F-19] Dialogue action errors are swallowed without user-facing notification
- **Category:** Flaw 21 — No observability plan (also Flaw 20 — Weak error handling)
- **Impact:** Medium
- **Explanation:** When a dialogue action throws, the catch logs `console.error` and `console.warn` but produces no user-facing notification — the source even contains an explicit TODO comment admitting the gap: "In a full implementation, this would use the notification system." Players see the dialogue advance silently while their choice partially fails. The `EVENT_NAMES.SAVE_FAILED` → `notificationCtx.showError` pipeline (S-11) proves the seam exists.
- **Evidence:** `src/game/game-dialogue.js:327-340` (catch with explicit TODO comment); `src/App.jsx:127-132` proves the notification observability seam exists for `SAVE_FAILED`; no `EVENT_NAMES.DIALOGUE_ACTION_FAILED` (or similar) is emitted.
- **Found by:** Error Handling & Observability

### [F-20] Save migrations V4→V4.1 and V4.1→V5 are only covered by end-to-end chains, not direct unit tests
- **Category:** Flaw 32 — Missing test coverage for critical paths
- **Impact:** Medium
- **Explanation:** Of the five migration functions, the first three have dedicated unit tests in `state-validators.test.js` and `npc-save-load-migration.test.js`. The last two are exercised only via full V1→V5 chains. A regression in V4→V4.1 or V4.1→V5 alone — without breaking the chain — could pass CI and corrupt real-world saves at those exact starting versions. V4→V4.1 mutates 6 NPC fields per record; V4.1→V5 initializes the entire missions slice — both are non-trivial enough to merit focused tests.
- **Evidence:** `src/game/state/state-validators.js:954` (`migrateFromV4ToV4_1`) and `:1001` (`migrateFromV4_1ToV5`); `grep -rn "migrateFromV4ToV4_1\|migrateFromV4_1ToV5" tests/` returns zero direct calls; `grep -n "describe.*migrateFrom" tests/unit/state-validators.test.js` shows only V1→V2 and V2→V2.1 describe blocks.
- **Found by:** Security & Code Quality

### [F-21] Only `beforeunload` triggers save flush — `pagehide`/`visibilitychange` missing for mobile
- **Category:** Flaw 19 — Lack of idempotency (durability gap)
- **Impact:** Medium
- **Explanation:** The 500ms trailing debounce in `SaveLoadManager.markDirty()` means up to 500ms of mutations live only in memory at any moment; the only durability hook is `window.addEventListener('beforeunload', ...)`. On iOS Safari and Android Chrome backgrounding, `beforeunload` is unreliable — `pagehide` and `visibilitychange` are the recommended hooks. The repo has explicit mobile UAT support and active mobile work, so mobile data-loss is a real concern. A user backgrounding the app within 500ms of a buy/sell/jump can lose that mutation.
- **Evidence:** `src/main.jsx:77-81` registers only `beforeunload`; `src/game/state/managers/save-load.js:34-46` uses `setTimeout(..., UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS)` (500ms); `grep -rn "pagehide|visibilitychange" src/` returns 0 matches; recent mobile commits (`ab4c094`, `8597fcd`, `4abf92c`).
- **Found by:** Integration & Data

### [F-22] `addStateDefaults` masks broken or missing migrations
- **Category:** Flaw 26 — Poor transactional boundaries
- **Impact:** Medium
- **Explanation:** `restoreState` runs `_applyMigrations` → `validateStateStructure` → `addStateDefaults`. `addStateDefaults` re-initializes nearly every optional field (ship condition, quirks/upgrades, faction reps, danger flags, missions, narrative events, stats, quests, achievements, preferences, finance, etc.). This is double-belted, but it means a migration step that *forgets* to populate a field will not surface as a failed migration — the defaults silently fill it with an empty/zero shape, potentially erasing user progress. There is no "migration changed expected fields X,Y,Z; verify they're present" assertion between migration and defaults. Recent commit `0d17e73` ("recompute ship capacities from upgrades on save load") shows this exact failure mode happened.
- **Evidence:** `src/game/state/state-validators.js:665-944` (`addStateDefaults`); `src/game/state/game-coordinator.js:595-606` (restoreState ordering); `migrateFromV4_1ToV5` (state-validators.js:1001-1018) only adds `missions` — but `addStateDefaults` also adds `missions` if missing.
- **Found by:** Integration & Data

### [F-23] `restoreState` swaps state mid-method without atomic rollback
- **Category:** Flaw 26 — Poor transactional boundaries
- **Impact:** Medium
- **Explanation:** `restoreState` performs validation/migration, then assigns `this.state = migratedState`, then calls `_registerEventEngine()`, `_emitAllStateEvents()`, and `achievementsManager.checkAchievements()`. If any of those three steps throws, the coordinator is left with `this.state` pointing at the partially-restored state with no rollback and no dirty-flag clear. The next `markDirty()` will then persist the half-initialized state over the previously-good save.
- **Evidence:** `src/game/state/game-coordinator.js:583-619` — assignment is unconditional at line 606; lines 608-614 follow with no try/catch; `src/game/state/managers/save-load.js:183-207` (`attemptNPCRecovery`) shows the team handles only the NPC-specific case, not the general partial-restore case.
- **Found by:** Integration & Data

### [F-24] `localStorage` quota-exceeded retry semantics are undefined
- **Category:** Flaw 19 — Lack of idempotency (write-failure handling)
- **Impact:** Medium
- **Explanation:** `_forceSave` wraps `localStorage.setItem` in try/catch and emits `SAVE_FAILED` on any throw, but does not distinguish quota-exceeded from JSON-cycle from disabled-storage errors. Once quota is exceeded, every subsequent save throws, the dirty flag is cleared regardless, and the user keeps playing with phantom-saved state — every mutation emits `SAVE_FAILED` toast but the game continues. There's no automatic compaction; save schema growth is unbounded (`world.priceKnowledge` accumulates per-system entries forever, `state.npcs[*].storedCargo` grows per-NPC, `missions.completed/failed` only grow).
- **Evidence:** `src/game/state/managers/save-load.js:69-93` (`_forceSave` — single catch block, no error-type discrimination); `:60` (`_isDirty = false` in `flushSave`) and `:43` (after the timer fires in `markDirty`) — flag flips clean even when write fails; `addStateDefaults` and migrations only add fields, never prune.
- **Found by:** Integration & Data

### [F-25] Two save paths with divergent debounce — `saveGame()` helper vs `SaveLoadManager._forceSave`
- **Category:** Flaw 24 — Inconsistent API contracts
- **Impact:** Low
- **Explanation:** `src/game/state/save-load.js` exports a `saveGame(state, lastSaveTime)` helper with its own debouncing (1000ms via `UI_CONFIG.SAVE_DEBOUNCE_MS`); `managers/save-load.js._forceSave()` re-implements timestamp-stamping inline with a different debounce (`MARK_DIRTY_DEBOUNCE_MS`, 500ms). The legacy `SaveLoadManager.saveGame()` method (`managers/save-load.js:105-127`) still calls the helper, so two code paths actually run in production. Any future change to save format must be applied in both places.
- **Evidence:** `src/game/state/save-load.js:31-39` and `src/game/state/managers/save-load.js:77-85` contain duplicated `stateToSave` blocks; the two paths use different debounce constants.
- **Found by:** Integration & Data

### [F-26] `restoreState` skips ~8 subscribed events on save load
- **Category:** Flaw 24 — Inconsistent API contracts
- **Impact:** Low
- **Explanation:** `_emitAllStateEvents` emits ~17 events on restore, but `EVENT_STATE_MAP` defines ~28 extractors and `useGameEvent` consumers exist for all of them. Events including `NPCS_CHANGED`, `DIALOGUE_CHANGED`, `INTELLIGENCE_CHANGED`, `HULL_CHANGED`, `ENGINE_CHANGED`, `LIFE_SUPPORT_CHANGED`, `SHIP_NAME_CHANGED`, `CURRENT_SYSTEM_CHANGED` are never republished after a load. Mitigated by lazy init in `useGameEvent` for newly-mounted components, but already-mounted components retain stale state until their next ordinary event fires. Matters most for mid-session "Load Game" actions.
- **Evidence:** `src/game/state/game-coordinator.js:663-704` (`_emitAllStateEvents` enumeration); cross-checked against `grep "useGameEvent(EVENT_NAMES\." src/` (28 distinct events consumed).
- **Found by:** Integration & Data

### [F-27] Migration version-compatibility list is hand-maintained pair-by-pair
- **Category:** Flaw 24 — Inconsistent API contracts
- **Impact:** Low
- **Explanation:** `isVersionCompatible` enumerates every supported `(saveVersion, GAME_VERSION)` pair explicitly. When the next version ships, every existing pair must be updated by hand or saves from older versions silently fail to load. The migration chain itself is data-driven (an array of `[fromVersion, fn]`), so the version-compat check is the weak link. No invariant test asserts the two structures stay in sync.
- **Evidence:** `src/game/state/state-validators.js:153-175` (six explicit `if` branches); `src/game/state/game-coordinator.js:628-634` (chain as a five-element array).
- **Found by:** Integration & Data

### [F-28] `NavigationSystem` instantiated outside coordinator and held as a sibling object
- **Category:** Flaw 23 — Dependency injection misuse
- **Impact:** Low
- **Explanation:** `main.jsx` constructs `new NavigationSystem(STAR_DATA, WORMHOLE_DATA)` and passes it to `new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem)`. The coordinator stores it as `this.navigationSystem` and exposes it; `info-broker.js:18` reaches it through capabilities — three references to the same object. Star/wormhole data are also passed twice. The split between `NavigationSystem` (sibling object) and `NavigationManager` (managed manager) is residue of the unfinished refactor and creates two parallel navigation entry points the rest of the code has to choose between.
- **Evidence:** `src/main.jsx:62-64` (constructs both with same data); `src/game/state/game-coordinator.js:69-72` (stores reference); `src/game/state/managers/info-broker.js:18` (third reference).
- **Found by:** Coupling & Dependencies

### [F-29] `wormhole-graph.js` module-level cached singletons defeat the injection model
- **Category:** Flaw 8 — Premature optimization (also Flaw 1 boundary — global cache)
- **Impact:** Low
- **Explanation:** Adjacency map, all-pairs shortest paths, and star-name maps are computed lazily and stored at module scope, keyed off the imported `STAR_DATA`/`WORMHOLE_DATA`. Tests that want to vary star topology cannot — the module exports a `_resetCacheForTesting` escape hatch instead. The all-pairs BFS is also pre-computed up front for 117 systems even though most callers use only the immediate-neighbor query.
- **Evidence:** `src/game/utils/wormhole-graph.js:1-9` (4 module-scoped caches); `:46-60` (all-pairs BFS); single-observer browser context limits real impact.
- **Found by:** Coupling & Dependencies

### [F-30] Dead `YUMI_TANAKA_POSTCREDITS_DIALOGUE` re-export from barrel
- **Category:** Flaw 31 — Dead code / unused dependencies
- **Impact:** Low
- **Explanation:** `YUMI_TANAKA_POSTCREDITS_DIALOGUE` is re-exported from the `DialogueTrees` aggregator object but nothing reads it via that path; consumers either import directly from `dialogue/yumi-tanaka.js` (tests) or look it up via the `ALL_DIALOGUE_TREES` map. Knip flags it.
- **Evidence:** `src/game/data/dialogue-trees.js:55` (import), `:70` (dead re-export), `:89` (live use via `ALL_DIALOGUE_TREES`); `npm run knip` output: `Unused exports (1) YUMI_TANAKA_POSTCREDITS_DIALOGUE`.
- **Found by:** Security & Code Quality

### [F-31] `index.html` ships with no Content-Security-Policy or other security headers
- **Category:** Flaw 30 — Security as afterthought
- **Impact:** Low
- **Explanation:** The HTML shell defines no `Content-Security-Policy`, no `Referrer-Policy`, no `X-Frame-Options` (or `frame-ancestors` in CSP). For a static-asset SPA, headers must be set at the host or via `<meta http-equiv>`. No `dangerouslySetInnerHTML` exists today and ship-name input is sanitized + JSX auto-escapes, so practical XSS exposure is low — but the architectural posture is "trust whatever loads," which surfaces risk if any future feature adds URL-param parsing, third-party embeds, or remote string sources.
- **Evidence:** `index.html` (20 lines) contains only `meta charset/viewport/title/description`; `grep -rEn "dangerouslySetInnerHTML" src/` returns 0 hits.
- **Found by:** Security & Code Quality

### [F-32] `TradePanel` reads/writes a localStorage UI-pref key as a string literal
- **Category:** Flaw 22 — Configuration sprawl
- **Impact:** Low
- **Explanation:** `'restrictedExplained'` is read/written directly via `localStorage.getItem/setItem` with no constant. The component comment defends the deviation ("not worth centralizing since it's only used here") — but `SAVE_KEY` is centralized in `constants.js`, establishing the precedent for localStorage keys. A second usage will silently drift.
- **Evidence:** `src/features/trade/TradePanel.jsx:113, 117` (string literal repeated); `:111-114` (defensive comment); `src/game/constants.js` exports `SAVE_KEY`.
- **Found by:** Error Handling & Observability

### [F-33] `DEV_MODE` is a mutable export with a load-order race window
- **Category:** Flaw 22 — Configuration sprawl (config-unsafe-default subform)
- **Impact:** Low
- **Explanation:** `export let DEV_MODE = false` is a mutable export. Modules that import `DEV_MODE` via destructuring at module-load time (vs. namespace import) capture the initial `false` value before `initDevMode()` resolves. Read-at-call-time consumers like `BaseManager.log/warn` are fine; read-at-evaluation-time consumers (e.g., conditional initialization) would see the stale value. The `catch {}` on the dev-mode probe also silently disables dev mode on any unexpected error.
- **Evidence:** `src/game/constants.js:570` (mutable `let`); `:581-606` (async `initDevMode` mutates module-level binding, with bare `catch {}`); `src/main.jsx:152` awaits before render.
- **Found by:** Error Handling & Observability

### [F-34] `DevAdminPanel` hardcodes ship/karma/faction bounds inline
- **Category:** Flaw 28 — Magic numbers/strings
- **Impact:** Low
- **Explanation:** Although it's a dev-only panel, `DevAdminPanel` hardcodes `>= 0 && <= 100` (ship bounds), `>= -100 && <= 100` (karma/faction bounds), and `game.updateShipCondition(100, 100, 100)`. `SHIP_CONFIG.CONDITION_BOUNDS.MAX` and `REPUTATION_BOUNDS` already exist. CLAUDE.md "ALL magic numbers" rule has no dev-panel exception.
- **Evidence:** `src/features/dev-admin/DevAdminPanel.jsx:181, 189, 197, 211, 224` (bounds checks); `:204-205` (hardcoded `100, 100, 100`); `src/features/repair/RepairPanel.jsx:97, 117` shows the canonical constant usage.
- **Found by:** Error Handling & Observability

### [F-35] Bare `catch {}` / `catch (_error)` sites discard error context
- **Category:** Flaw 20 — Weak error handling (silent-swallow)
- **Impact:** Low
- **Explanation:** Four sites discard the error object entirely without even a devLog. Each has a justifying comment ("safe to default", "treat as not locked", "Recovery failed", "expected in production") — but if any condition is ever wrong (unexpected exception type), there's no breadcrumb. `attemptNPCRecovery` in particular is the second line of save-recovery defense.
- **Evidence:** `src/App.jsx:108-111` (`catch { return false; }` for `getNarrativeFlags()`); `src/game/state/managers/save-load.js:202-204` (`catch { this.log('Recovery failed') }` discards `error`); `src/features/hud/QuickAccessButtons.jsx:48-52` (`catch (_error)`); `src/game/constants.js:601-606` (`catch { DEV_MODE = false; }`).
- **Found by:** Error Handling & Observability

### [F-36] Three logging conventions coexist with no documented partition
- **Category:** Flaw 34 — Inconsistent error/logging conventions
- **Impact:** Low
- **Explanation:** `BaseManager.log/warn/error` with `[ClassName]` prefix in managers, bare `console.error('Jump failed:', error)` in feature components and hooks (15 sites), and `devLog/devWarn` in `save-load.js` and engine code. dev-logger.js acknowledges the mix is "intentional" but does not define a partition rule (e.g., "errors caught at the React boundary use console.error; dev-only debug uses devLog"). 47 `console.*` sites + 43 `devLog/devWarn` sites with no clean split.
- **Evidence:** Three schemes verified at `src/game/state/managers/base-manager.js:38-60`, `src/features/navigation/JumpDialog.jsx:85, 88`, `src/hooks/useDialogue.js:58, 83`, `src/game/utils/dev-logger.js:7-11`.
- **Found by:** Error Handling & Observability

## Coverage Checklist

### Flaw/Risk Types 1–34
| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Not observed | — (engine module caches are single-observer with `_resetCacheForTesting` escape hatch; F-29 captures the optimization angle) |
| 2 | God object | Observed | F-5 |
| 3 | Tight coupling | Not observed | — |
| 4 | High/unstable dependencies | Not observed | — |
| 5 | Circular dependencies | Not observed | — (static graph in `src/` is acyclic; one unjustified dynamic import noted in F-13) |
| 6 | Leaky abstractions | Observed | F-1, F-2, F-7, F-10, F-11, F-12, F-13 |
| 7 | Over-abstraction | Observed | F-6 |
| 8 | Premature optimization | Observed | F-29 |
| 9 | Shotgun surgery | Not observed | — (multi-panel danger commits are uniform a11y/cross-cutting application) |
| 10 | Feature envy / anemic domain | Not observed | — (state objects are JSON-serializable DTOs by design; logic correctly lives in managers) |
| 11 | Low cohesion | Not observed | — |
| 12 | Hidden side effects | Observed | F-3, F-16, F-17 (and via F-1) |
| 13 | Inconsistent boundaries | Observed | F-1 |
| 14 | Distributed monolith | Not applicable | — single-bundle browser game |
| 15 | Chatty service calls | Not applicable | — no network |
| 16 | Synchronous-only integration | Not applicable | — no integration surface |
| 17 | No clear ownership of data | Not observed | — (capability ownership model is exemplary; cf. S-6) |
| 18 | Shared database across services | Not applicable | — single-app localStorage |
| 19 | Lack of idempotency | Observed | F-21, F-24 |
| 20 | Weak error handling | Observed | F-18, F-35 (and via F-19) |
| 21 | No observability plan | Observed | F-19 |
| 22 | Configuration sprawl | Observed | F-32, F-33 |
| 23 | DI misuse | Observed | F-9, F-28 |
| 24 | Inconsistent API contracts | Observed | F-25, F-26, F-27 |
| 25 | Business logic in UI | Observed | F-3, F-4 (and via F-34) |
| 26 | Poor transactional boundaries | Observed | F-22, F-23 |
| 27 | Temporal coupling | Observed | F-8 |
| 28 | Magic numbers/strings | Observed | F-14, F-15, F-34 |
| 29 | Utility dumping ground | Not observed | — (all `utils/` files <300 lines with cohesion vectors) |
| 30 | Security as afterthought | Observed | F-31 |
| 31 | Dead code / unused deps | Observed | F-6, F-10, F-30 |
| 32 | Missing test coverage (critical paths) | Observed | F-20 |
| 33 | Hard-coded credentials | Not applicable | — no auth, no secrets, no API keys |
| 34 | Inconsistent error/logging conventions | Observed | F-18, F-36 |

### Strength Categories S1–S14
| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | S-7 |
| S2 | High cohesion | Observed | (implicit — every manager binds on single change-axis + vocabulary; cf. S-7) |
| S3 | Loose coupling | Observed | S-1 |
| S4 | Stable dependency direction | Observed | S-10 |
| S5 | Dependency management hygiene | Observed | S-9 |
| S6 | Consistent API contracts | Observed | S-5, S-6 |
| S7 | Robust error handling | Observed | S-4 |
| S8 | Observability present | Observed | S-11 |
| S9 | Configuration discipline | Observed | S-8 |
| S10 | Security built-in | Observed | S-2 |
| S11 | Testability & coverage | Observed | S-3 |
| S12 | Resilience patterns | Not applicable | — no remote dependencies to fail |
| S13 | Domain modeling strength | Not assessed | — game state is intentionally a JSON-serializable DTO; behavior lives in managers by design |
| S14 | Pragmatic abstractions | Observed | S-1 |

## Hotspots

1. **`src/features/danger/applyEncounterOutcome.js`** — Three independent specialists (Structure, Coupling, Error Handling) flagged this as the most acute Bridge Pattern violation in the codebase. A 213-line cross-domain mutation orchestrator stranded in the UI layer, called by both the encounter hook and the narrative panel. Promoting it to an `EncounterOutcomeManager` would simultaneously close F-1 and reduce the surface that F-3 (`NarrativeEventPanel`) is forced to reach into.

2. **`src/game/game-navigation.js`** — Holds `NavigationSystem.executeJump` (F-2), the dead `uiManager` parameter and unreachable block (F-10), and is the residue of the unfinished refactor that left `NavigationSystem` as a sibling of `NavigationManager` (F-28). Three findings here cluster on one path. The dedicated `NavigationManager` is starved of responsibility while the legacy `NavigationSystem` owns the central jump action.

3. **`src/game/state/state-validators.js` + `managers/save-load.js`** — Save/migration architecture is solid in shape (versioned, layered defaults, NPC-specific recovery, working `SAVE_FAILED` notification) but has thin edges: F-20 (V4→V4.1 / V4.1→V5 missing direct tests), F-21 (mobile flush gap), F-22 (defaults mask broken migrations), F-23 (no rollback on partial restore failure), F-24 (quota handling silently drops mutations), F-25/F-26/F-27 (contract drift). Worth a focused review pass on this subsystem before the next migration ships.

## Next Questions

1. Is `src/game/state/capabilities.js` intended as live JSDoc that should drive a TS migration, as documentation that should move to `docs/`, or as accidental dead weight? Its current shape (553 lines, no exports, no importers, knip-flagged) suggests one of those three should be picked.
2. What was the original intent of leaving `NavigationSystem` instantiated alongside `NavigationManager` after the GSM refactor — was `NavigationManager` meant to absorb `executeJump` in a later phase that hasn't landed yet?
3. The `DialogueManager` and `InfoBrokerManager` `coordinatorRef` leak (F-7) is documented in `capabilities.js` as "to be addressed if the dialogue engine is refactored separately." Is that refactor on the roadmap, or is the comment effectively saying "permanent exception"?
4. For the 25-callback `MissionManager` capability bag (F-9) — at what callback count would the team consider switching to a manager-event/dispatch primitive instead? The current pattern scales linearly with cross-domain interactions.
5. Mobile UAT is being actively built (per recent commits). Is data loss on tab-background a tracked risk for that testing pass, or has F-21 been previously triaged and accepted?

## Analysis Metadata

- **Agents dispatched:** Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error Handling & Observability, Security & Code Quality (5 specialists in parallel; verifier consolidation done in-orchestrator owing to ref-loading anomaly described below).
- **Scope:** Full repository (`/Users/ovid/projects/tramp-freighter`), ~171 hand-written source files in `src/`, ~441 test files in `tests/`.
- **Raw findings:** 52 (across all five specialists, including strengths)
- **Verified findings:** 47 (36 flaws + 11 strengths)
- **Filtered out:** 5 (notably: Coupling agent's "GameCoordinator hard-couples 25 manager classes" was dropped per project memory — the ~183-method facade is the documented intentional post-GSM-refactor design, not a regression; several findings consolidated via cross-specialist dedup, especially around `applyEncounterOutcome.js`).
- **By impact:** 4 High flaws, 20 Medium flaws, 12 Low flaws, 9 High strengths, 2 Medium strengths.
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `DEVELOPMENT.md`, `MEMORY.md` (project memory).
- **verifier-warning: structure-boundaries ref-loaded** — the Structure & Boundaries specialist was re-dispatched with the binding reference (`structure-boundaries.md`) inlined into its prompt after the first attempt failed on a sandbox permission denial; second-attempt findings are clean.
- **verifier-warning: coupling-dependencies / integration-data / error-handling-observability / security-code-quality ref-token-emitted-without-ref-load** — these four specialists emitted `[ref-loaded:<lens>]` tokens but transparently noted that they could not access the binding reference files at `/Users/ovid/projects/paad/plugins/paad/skills/agentic-architecture/references/` (sandbox blocked Read and Bash on that path). They proceeded using the closed-set subtype vocabulary, flaw type catalog, and severity guidance enumerated directly in their dispatch prompts. The orchestrator subsequently spot-verified key findings against the actual source code (`applyEncounterOutcome.js`, `capabilities.js`, `RepairPanel.jsx:557`, `CombatPanel.jsx:501`, `wormhole-graph.js`, `useDangerZone.js`, `save-load.js`, `NarrativeEventPanel.jsx`, `dialogue-trees.js`) and the orchestrator itself read all five reference files, applied the verifier's drop rules and severity floors, and consolidated cross-specialist agreement before producing this report. Findings should be treated as having strong evidence (cross-specialist corroboration on F-1 and F-6 in particular), but a future re-run with reference-file access will give the verifier its full discipline.
