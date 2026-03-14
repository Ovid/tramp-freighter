# Architecture Report — tramp-freighter

**Date:** 2026-03-13

## Repo Overview

- **Languages/Frameworks:** JavaScript (ES Modules), React 18, Three.js, Vite
- **164 source files** across `src/`, **403 test files** across `tests/`
- **Primary directories:** `src/features/` (20+ feature modules), `src/game/` (engine, state, data, utils), `src/hooks/`, `src/components/`, `src/context/`
- **Architecture:** GameCoordinator singleton → 25 capability-injected managers → Bridge Pattern to React via events
- **Game scope:** Single-player space trading survival game with 117 real star systems, commodity trading, NPC relationships, and danger encounters

---

## Strengths

### S-1. [Impact: High] Bridge Pattern — Clean React/Imperative Separation
The Bridge Pattern connecting the imperative GameCoordinator to React's declarative model is exemplary. `useGameEvent` auto-subscribes on mount, updates React state on event fire, and auto-unsubscribes on unmount. Components never poll.
Evidence: `src/hooks/useGameEvent.js:29-53` (`useGameEvent`), excerpt: `game.subscribe(eventName, callback); return () => { game.unsubscribe(eventName, callback); };`

### S-2. [Impact: High] Capability-Injected Managers — Composition Over Inheritance
All 25 domain managers extend `BaseManager` and receive explicit capability objects at construction. Managers never import each other — all inter-manager communication flows through GameCoordinator delegation. This eliminates circular dependencies and makes testing trivial (swap capabilities with mocks).
Evidence: `src/game/state/managers/base-manager.js:15-22`, excerpt: `constructor(capabilities) { if (!capabilities) { throw new Error('BaseManager requires a capabilities object'); } this.capabilities = capabilities; }`

### S-3. [Impact: High] Centralized Configuration — Single Source of Truth
All 53 exported config objects (2,010 lines) live in one file, organized by domain with clear section headers. Every magic number, threshold, multiplier, and pricing constant lives here.
Evidence: `src/game/constants.js` (entire file), excerpt: `COMBAT_CONFIG`, `ECONOMY_CONFIG`, `DANGER_CONFIG`, `COLE_DEBT_CONFIG`, etc.

### S-4. [Impact: High] Deterministic Gameplay via Seeded RNG
Encounter outcomes use `SeededRandom` with deterministic seeds built from `gameDay_systemId_encounterType`. Save/reload produces identical encounters. `Math.random()` is reserved for cosmetic-only code (background starfield).
Evidence: `src/game/utils/seeded-random.js:94-96` (`buildEncounterSeed`), excerpt: `return \`${gameDay}_${systemId}_${encounterType}\``

### S-5. [Impact: High] Comprehensive Test Suite — 4,277 Tests, Zero Dead Code
403 test files covering unit, property-based (64 files with fast-check, 100+ iterations), and integration tests. All 25 managers, all core game logic, all 8 utility files, and all feature utilities have dedicated test coverage. ESLint passes with `--max-warnings 0`.
Evidence: `tests/unit/`, `tests/property/`, `tests/integration/` directories

### S-6. [Impact: Medium] Consistent Manager API Contract
All managers follow the same pattern: validate → mutate → emit → `markDirty()`. Result objects consistently return `{ success, reason }` for operations that can fail.
Evidence: `src/game/state/managers/trading.js:36-72`, excerpt: `return { success: false, reason: 'Mission cargo cannot be sold' };` ... `this.capabilities.markDirty();`

### S-7. [Impact: Medium] Feature Module Co-location
Each of the 20+ feature directories bundles its component JSX and utility functions together. Business logic lives in `*Utils.js` files as pure functions; presentation lives in `*Panel.jsx` files.
Evidence: `src/features/trade/` contains `TradePanel.jsx` + `tradeUtils.js`; `src/features/danger/` contains encounter panels + `inspectionUtils.js` + `applyEncounterOutcome.js`

### S-8. [Impact: Medium] Debounced Persistence with Dirty Tracking
`SaveLoadManager.markDirty()` implements a 500ms trailing debounce. All managers call `this.capabilities.markDirty()` consistently after mutations. `flushSave()` handles browser unload edge case.
Evidence: `src/game/state/managers/save-load.js:34-46` (`markDirty`), excerpt: `this._dirtyTimer = setTimeout(() => { ... this._forceSave(); }, UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS);`

### S-9. [Impact: Medium] Proper Resource Cleanup in React
All `useEffect` hooks return cleanup functions. Event listeners, subscriptions, and timers are properly torn down on unmount. Three.js scenes initialize once with empty deps.
Evidence: `src/hooks/useGameEvent.js:43-50`, `src/hooks/useClickOutside.js:7-25`, `src/features/hud/RumorAlert.jsx:22-23`

### S-10. [Impact: Medium] Domain Rules Enforced at Manager Level
Business rules (mission cargo sale prevention, price snapshots on arrival, reputation clamping, debt mechanics) are enforced in managers, not scattered across UI components.
Evidence: `src/game/state/managers/trading.js:89` (mission cargo guard), `src/game/state/managers/navigation.js:48-69` (price snapshot), `src/game/state/managers/debt.js:38-94` (debt tiers)

### S-11. [Impact: Medium] No Circular Dependencies
Verified via import analysis: game engine never imports from features, contexts are leaf nodes, all managers depend only on `BaseManager` + constants + data + utils. Zero circular import chains detected.
Evidence: All 25 manager files import only from `./base-manager.js`, `../../constants.js`, `../../data/*`, `../../utils/*`

### S-12. [Impact: Low] Composed Action Hooks
`useGameAction` composes 7 domain-specific hooks (`useTradeActions`, `useNavigationActions`, etc.) via `useMemo`. New code can import narrow hooks directly for a smaller API surface.
Evidence: `src/hooks/useGameAction.js:34-71`

### S-13. [Impact: Low] Error Boundary at Application Root
`ErrorBoundary` component catches rendering errors, displays fallback UI with component stack, and offers a reload button for recovery.
Evidence: `src/components/ErrorBoundary.jsx`

---

## Flaws / Risks

### F-1. [Impact: High] Silent Error Swallowing in Critical Paths
Multiple catch blocks in encounter orchestration and dialogue hooks log errors to console then silently reset state, leaving the player with no explanation of what happened. Encounter failures dump the player to orbit without feedback.
Evidence: `src/hooks/useEncounterOrchestration.js:102-108`, excerpt: `console.error('Flee resolution failed:', error); setCurrentEncounter(null); ... setViewMode(VIEW_MODES.ORBIT);`
Evidence: `src/hooks/useDialogue.js:57-59`, excerpt: `console.error('Failed to start dialogue:', error); return false;`

### F-2. [Impact: High] Production Blindness — DEV_MODE-Gated Logging
`BaseManager.log()` and `BaseManager.warn()` are completely suppressed unless `DEV_MODE` is true. Recovery failures, reputation clamping warnings, and validation edge cases are invisible in production. Only `BaseManager.error()` always logs.
Evidence: `src/game/state/managers/base-manager.js:38-42`, excerpt: `log(...args) { if (DEV_MODE) { console.log(...); } }`
Evidence: `src/game/state/managers/save-load.js:202-204`, excerpt: `} catch { this.log('Recovery failed, starting new game'); }` — suppressed in production

### F-3. [Impact: High] No Centralized Error/Audit Trail
Errors are logged to `console` only — lost on page refresh. No structured error state object, no error history, no mechanism to answer "what went wrong in this session?" No correlation between related errors.
Evidence: Entire codebase — all error handling flows to `console.error()` or `this.error()` with no persistence or aggregation

### F-4. [Impact: Medium] Duplicated VIEW_MODES Constant
`VIEW_MODES` is defined identically in `App.jsx` and `useEncounterOrchestration.js` with a comment "Must match the VIEW_MODES values in App.jsx" — a textbook case of shotgun surgery waiting to happen.
Evidence: `src/App.jsx:42-50` and `src/hooks/useEncounterOrchestration.js:10-13`, excerpt: `const VIEW_MODES = { ORBIT: 'ORBIT', ENCOUNTER: 'ENCOUNTER' };`

### F-5. [Impact: Medium] Duplicated Cargo Calculation Logic
The cargo quantity summation `cargo.reduce((sum, stack) => sum + stack.qty, 0)` is duplicated across 3 components. Similarly, passenger cargo space calculation is duplicated in 3 places despite existing as a private function in `tradeUtils.js`.
Evidence: `src/features/trade/TradePanel.jsx:84`, `src/features/hud/ShipStatus.jsx:37`, `src/features/cargo/CargoManifestPanel.jsx:36`

### F-6. [Impact: Medium] Hardcoded Timeout Values in UI Components
Magic number timeouts (3000ms, 2000ms) in UI components bypass the centralized constants pattern. A `NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION` constant exists (line 916 of constants.js) but isn't used.
Evidence: `src/features/hud/RumorAlert.jsx:22`, excerpt: `setTimeout(() => setVisible(false), 3000)`
Evidence: `src/features/info-broker/InfoBrokerPanel.jsx:135,161`, excerpt: `setTimeout(..., 2000)`

### F-7. [Impact: Medium] Hooks Layer Importing from Features Layer
`useEncounterOrchestration.js` imports utility functions from `src/features/danger/`. This inverts the expected dependency direction (hooks should be "above" features in the import hierarchy).
Evidence: `src/hooks/useEncounterOrchestration.js:2-3`, excerpt: `import { transformOutcomeForDisplay } from '../features/danger/transformOutcome'; import { applyEncounterOutcome } from '../features/danger/applyEncounterOutcome';`

### F-8. [Impact: Medium] PanelContainer as Coupling Hub
`PanelContainer.jsx` imports 10 feature modules via a switch statement. Adding a new panel requires modifying this central file. This creates a fan-in coupling point.
Evidence: `src/features/station/PanelContainer.jsx:1-10`, excerpt: imports from `trade`, `refuel`, `repair`, `upgrades`, `info-broker`, `cargo`, `ship-status`, `dialogue`, `missions`, `finance`

### F-9. [Impact: Medium] Save Failure Silently Loses Progress
`_forceSave()` catches localStorage errors and emits `SAVE_FAILED`, but if no subscriber listens for that event, the player's progress is silently lost. No UI guarantee of save-failure notification.
Evidence: `src/game/state/managers/save-load.js:87-92`, excerpt: `this.error('Save failed — game progress may be lost', error); this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, { message: '...' });`

### F-10. [Impact: Medium] Cross-Feature Imports Create Implicit Dependencies
Several features import directly from other features: `trade → danger` (inspectionUtils), `navigation → danger` (DangerWarningDialog), `narrative → danger` (applyEncounterOutcome), `navigation → instructions,achievements` (modals).
Evidence: `src/features/trade/TradePanel.jsx:25`, `src/features/navigation/SystemPanel.jsx:9`, `src/features/narrative/NarrativeEventPanel.jsx:4`, `src/features/navigation/CameraControls.jsx:2-3`

### F-11. [Impact: Low] Inconsistent Error Handling Across Similar Operations
Same type of failure (localStorage save error) is handled three different ways in two files: `console.error()` directly, `this.error()` via BaseManager, and `devLog()` for loads.
Evidence: `src/game/state/save-load.js:43-46` uses `console.error()`, `src/game/state/managers/save-load.js:88` uses `this.error()`, `src/game/state/save-load.js:72-75` uses `devLog()`

### F-12. [Impact: Low] Hardcoded System IDs Instead of Constants
`inspectionUtils.js` uses literal `0` and `1` for Sol and Alpha Centauri system IDs instead of the existing `SOL_SYSTEM_ID` and `ALPHA_CENTAURI_SYSTEM_ID` constants.
Evidence: `src/features/danger/inspectionUtils.js:33,73` (via agent analysis)

### F-13. [Impact: Low] Module-Level Mutable State in Engine Layer
11 mutable `let` variables at module scope across 3 files in the Three.js engine layer (texture caches, selection state, graph cache). All have test-reset functions, but represent shared mutable state outside the GameCoordinator pattern.
Evidence: `src/game/utils/wormhole-graph.js:6-9` (4 variables), `src/game/engine/interaction.js:5-7` (3 variables), `src/game/engine/stars.js:7-12` (4 variables)

### F-14. [Impact: Low] Encounter Orchestration Error Paths Skip User Feedback
When encounter resolution or flee resolution fails, the catch block silently returns the player to orbit mode by clearing all encounter state. No notification or feedback mechanism exists.
Evidence: `src/hooks/useEncounterOrchestration.js:191-198`, excerpt: `console.error('Encounter resolution failed:', error); setCurrentEncounter(null); ... setViewMode(VIEW_MODES.ORBIT);`

### F-15. [Impact: Low] `getPassengerCargoSpace` Is Private but Needed Elsewhere
`tradeUtils.js` defines `getPassengerCargoSpace()` as a private function. Three components re-implement the same calculation inline rather than importing it.
Evidence: `src/features/trade/tradeUtils.js:146-151` (private), duplicated in `TradePanel.jsx:86-91`, `ShipStatus.jsx:39-44`, `CargoManifestPanel.jsx:44-47`

---

## Coverage Checklist

### Flaw/Risk Types 1–34

| # | Type | Status | Note |
|---|------|--------|------|
| 1 | Global mutable state | Observed | F-13: 11 mutable lets in engine layer (caches/selection state) |
| 2 | God object | Not observed | GameCoordinator's ~183 delegation methods are intentional facade (see S-2) |
| 3 | Tight coupling | Observed | F-10: Cross-feature imports; F-8: PanelContainer coupling hub |
| 4 | High/unstable dependencies | Not observed | Dependency direction is stable: managers → constants/data/utils |
| 5 | Circular dependencies | Not observed | See S-11 |
| 6 | Leaky abstractions | Not observed | Bridge Pattern cleanly hides GameCoordinator internals |
| 7 | Over-abstraction | Not observed | Abstraction level matches current complexity |
| 8 | Premature optimization | Not observed | Module-level caches in engine layer are justified for Three.js performance |
| 9 | Shotgun surgery | Observed | F-4: Duplicated VIEW_MODES; F-8: New panel requires PanelContainer edit |
| 10 | Feature envy / anemic model | Not observed | Business logic lives in managers near the data (see S-10) |
| 11 | Low cohesion | Not observed | Feature modules group related concerns well (see S-7) |
| 12 | Hidden side effects | Observed | F-1: catch blocks silently reset encounter state |
| 13 | Inconsistent boundaries | Observed | F-7: Hooks importing from features layer |
| 14 | Distributed monolith | Not applicable | Single-page application, no microservices |
| 15 | Chatty service calls | Not applicable | No networked services |
| 16 | Synchronous-only integration | Not applicable | No external service integration |
| 17 | No clear ownership of data | Not observed | State owned exclusively by GameCoordinator |
| 18 | Shared database across services | Not applicable | Single localStorage store, single owner |
| 19 | Lack of idempotency | Not applicable | No network retries; localStorage writes are idempotent |
| 20 | Weak error handling strategy | Observed | F-1, F-2, F-9, F-11: Inconsistent, often silent |
| 21 | No observability plan | Observed | F-2, F-3: DEV_MODE gating, no structured error tracking |
| 22 | Configuration sprawl | Not observed | Single constants.js file, intentional design (see S-3) |
| 23 | Dependency injection misuse | Not observed | Capability injection is clear and direct (see S-2) |
| 24 | Inconsistent API contracts | Not observed | Managers follow uniform validate → mutate → emit → markDirty (see S-6) |
| 25 | Business logic in the UI | Not observed | Logic is in utility files and managers (see S-7, S-10) |
| 26 | Poor transactional boundaries | Not assessed | Single-process, localStorage-only persistence |
| 27 | Temporal coupling | Not observed | Initialization functions are independently composable |
| 28 | Magic numbers/strings | Observed | F-6: Hardcoded timeouts; F-12: Hardcoded system IDs |
| 29 | "Utility" dumping ground | Not observed | All 8 utility files have clear, narrow scope |
| 30 | Security as an afterthought | Not observed | No secrets, no auth needed; input sanitized (sanitizeShipName) |
| 31 | Dead code / unused dependencies | Not observed | ESLint clean, no unused exports or dependencies |
| 32 | Missing test coverage for critical paths | Not observed | All managers, logic, and utilities tested (see S-5) |
| 33 | Hard-coded credentials or secrets | Not observed | No API keys, passwords, or secrets in source |
| 34 | Inconsistent error/logging conventions | Observed | F-11: Three different logging approaches for the same error type |

### Strength Categories S1–S14

| # | Category | Status | Note |
|---|----------|--------|------|
| S1 | Clear modular boundaries | Observed | See S-7: Feature co-location, manager isolation |
| S2 | High cohesion | Observed | See S-7, S-10: Features and managers group related concerns |
| S3 | Loose coupling | Observed | See S-2, S-11: Capability injection, no circular deps |
| S4 | Dependency direction is stable | Observed | See S-11: managers → constants/data/utils, features → hooks → context |
| S5 | Dependency management hygiene | Observed | Zero circular dependencies, consistent import conventions |
| S6 | Consistent API contracts | Observed | See S-6: Uniform manager pattern |
| S7 | Robust error handling | Partially observed | Error handling exists but has inconsistencies (F-1, F-11) |
| S8 | Observability present | Not observed | DEV_MODE gating hides production issues (F-2, F-3) |
| S9 | Configuration discipline | Observed | See S-3: Centralized constants.js |
| S10 | Security built-in | Not applicable | Offline single-player game; no auth/secrets needed |
| S11 | Testability & coverage | Observed | See S-5: 4,277 tests, property-based testing, all critical paths covered |
| S12 | Resilience patterns | Partially observed | Debounced saves (S-8), ErrorBoundary (S-13), but no retry/backpressure |
| S13 | Domain modeling strength | Observed | See S-10: Business rules enforced in managers |
| S14 | Simple, pragmatic abstractions | Observed | Bridge Pattern, BaseManager, feature co-location all match complexity level |

---

## Hotspots

1. **`src/hooks/useEncounterOrchestration.js`** — Risk hotspot. Silent error swallowing in 2 catch blocks, inverted layer dependency (imports from features), and duplicated VIEW_MODES constant. Most concentrated source of architectural debt.

2. **`src/game/state/managers/save-load.js` + `src/game/state/save-load.js`** — Risk hotspot. Three different error handling patterns for the same operation across two files. Save failures can be invisible to the player. The dual-file structure (manager vs. raw storage functions) adds indirection.

3. **`src/game/state/game-coordinator.js`** — Strong core hotspot. 1,629 lines, but intentionally designed as a composition facade after a completed refactor. The ~183 delegation methods are the public API — not a problem to fix, but the most impactful file to understand when onboarding.

---

## Next Questions

1. Should encounter resolution errors surface a player-visible notification (e.g., via the existing notification system) rather than silently returning to orbit?

2. Is the `SAVE_FAILED` event guaranteed to have a subscriber in all game states, or can a save failure go entirely unnoticed by the player?

3. Would extracting `VIEW_MODES` into `constants.js` (alongside `EVENT_NAMES`) prevent the current duplication and future drift?

4. Is the DEV_MODE-gated suppression of `BaseManager.log()/warn()` intentional for production, or should certain warning categories (e.g., "recovery failed") always surface?

5. Would consolidating the two save-load files (`src/game/state/save-load.js` and `src/game/state/managers/save-load.js`) reduce confusion about which error handling path applies?
