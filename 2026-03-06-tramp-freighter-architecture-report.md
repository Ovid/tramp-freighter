# Architecture Report — tramp-freighter

**Date:** 2026-03-06

## Repo Overview

- **Languages/Frameworks:** JavaScript (ES Modules), React 18, Three.js, Vite
- **Type:** Single-player browser-based space trading survival game
- **Key Directories:** `src/features/` (20 feature modules), `src/game/state/managers/` (25 domain managers), `src/game/engine/` (Three.js), `src/game/data/` (game data), `tests/` (329 test files)
- **Size:** ~491 source files, 1,208-line central facade, 1,888-line constants file, 117 star systems
- **Runtime deps:** react, react-dom, three (minimal dependency surface)

---

## Strengths

1. **[Impact: High] Excellent manager delegation (S1, S2, S14)** — GameStateManager (1,208 lines) is a deliberate facade, not a god object. ~95% of its 177 methods delegate to 25 focused domain managers, each extending BaseManager. Responsibilities are well-bounded.
   Evidence: `src/game/state/game-state-manager.js:82-105` (manager instantiation), `src/game/state/managers/base-manager.js:1-110` (shared base class)

2. **[Impact: High] Bridge Pattern cleanly connects imperative and declarative worlds (S3, S14)** — The event pub/sub system (`useGameEvent`, `useGameAction`) bridges GameStateManager to React without leaking imperative state. Components never own game state.
   Evidence: `src/hooks/useGameEvent.js:30-50` (subscribe/cleanup), `src/hooks/useGameAction.js` (action dispatch), `src/context/GameContext.jsx:24-39` (provider)

3. **[Impact: High] Comprehensive test suite with property-based testing (S11)** — 329 test files: 192 unit, 106 property-based (fast-check, 100+ iterations), 31 integration. Critical paths (trading, combat, navigation, save/load, NPC) all covered.
   Evidence: `tests/property/trade-utils-purity.property.test.js`, `tests/property/combat-resolution-outcomes.property.test.js`, `tests/unit/game-trading.test.js`

4. **[Impact: High] Zero cross-feature coupling (S1, S3)** — Feature modules in `src/features/` never import from each other. Each feature imports only from shared hooks, components, and game logic. Enforces clean boundaries.
   Evidence: All 20 feature directories import only from `@hooks`, `@components`, `@game`, `@context`

5. **[Impact: High] Centralized configuration eliminates magic numbers (S9)** — All game constants live in `src/game/constants.js` (1,888 lines), organized by domain: commodities, ship config, economy, combat, danger, UI. Well-documented with WHY comments.
   Evidence: `src/game/constants.js:162-357` (SHIP_CONFIG), `src/game/constants.js:409+` (DANGER/COMBAT configs)

6. **[Impact: Medium] Pure utility functions with no side effects (S13, S14)** — Feature utility files (`tradeUtils.js`, `refuelUtils.js`, `repairUtils.js`, `upgradesUtils.js`) contain pure calculation functions. Validated by property-based tests.
   Evidence: `src/features/trade/tradeUtils.js:21-56` (validateBuy), `src/features/repair/repairUtils.js:1-73` (calculateRepairCost)

7. **[Impact: Medium] Deterministic RNG via SeededRandom (S11, S13)** — Gameplay paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`), enabling reproducible testing and replays.
   Evidence: `src/game/utils/seeded-random.js`, manager rng injection parameters throughout `src/game/state/managers/`

8. **[Impact: Medium] Robust save validation with migration support (S7, S12)** — Three-layer validation on load: version compatibility check, structure validation (type-checking all fields), and data repair via `addStateDefaults()`. Supports migration from v1.0.0 through v5.0.0.
   Evidence: `src/game/state/state-validators.js:151-173` (version check), `src/game/state/state-validators.js:185-428` (structure validation), `src/game/state/state-validators.js:663-906` (data repair)

9. **[Impact: Medium] Error isolation in event system (S7)** — Event subscriber callbacks are wrapped in try/catch, preventing one failed subscriber from crashing others. No empty catch blocks found in the codebase.
   Evidence: `src/game/state/managers/event-system.js:96-102` (subscriber error isolation)

10. **[Impact: Medium] No circular dependencies (S5)** — Managers never import from each other. All imports flow one direction: components → hooks → managers → utils/data/constants. Clean dependency graph.
    Evidence: Import analysis of all 25 files in `src/game/state/managers/`

11. **[Impact: Medium] Focused utility modules, not dumping grounds (S2)** — `src/game/utils/` contains 8 small, focused files (12-180 lines each) with zero coupling between them. No "utils.js" grab-bag.
    Evidence: `src/game/utils/` — `calculators.js` (115 lines), `seeded-random.js` (101 lines), `wormhole-graph.js` (180 lines), `danger-utils.js` (12 lines)

12. **[Impact: Low] Minimal runtime dependencies (S5)** — Only 3 runtime dependencies (react, react-dom, three). Reduces supply chain risk and version conflicts.
    Evidence: `package.json` dependencies section

13. **[Impact: Low] No XSS vectors (S10)** — Zero uses of `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`. All dynamic content flows through React's safe JSX rendering.
    Evidence: Grep search across entire `src/` directory returned no results for any XSS vector pattern

---

## Flaws/Risks

1. **[Impact: ~~Medium~~ Resolved] Encapsulation violation fixed** — `_addToCargoArray` renamed to public `addToCargoArray` on ShipManager, exposed through GameStateManager facade. NPCManager now calls `this.gameStateManager.addToCargoArray()` instead of reaching into ShipManager directly.
   Evidence: `src/game/state/managers/ship.js` (public method), `src/game/state/game-state-manager.js` (facade delegation), `src/game/state/managers/npc.js` (uses facade)

2. **[Impact: ~~Medium~~ Resolved] Direct state mutation replaced with proper delegation** — `applyEncounterOutcome.js` now delegates to `gameStateManager.clearHiddenCargo()` and `gameStateManager.modifyAllPassengerSatisfaction(delta)` instead of mutating state directly. All three mutation sites (hiddenCargo, cost passengerSatisfaction, reward passengerSatisfaction) now use manager methods.
   Evidence: `src/features/danger/applyEncounterOutcome.js` (no longer imports EVENT_NAMES), `src/game/state/managers/ship.js` (clearHiddenCargo), `src/game/state/managers/mission.js` (modifyAllPassengerSatisfaction)

3. **[Impact: ~~Medium~~ None] ~~Bridge Pattern violations in hooks~~ Reclassified: not a flaw** — `useEventTriggers.js` calls `gameStateManager.getState()` inside event handler callbacks, not during React render. These are point-in-time snapshots needed when an event fires (e.g., computing encounter data). Converting to `useGameEvent()` subscriptions would be incorrect — `useGameEvent` triggers re-renders, but these handlers need the current state as input to a one-shot computation. The hook already subscribes reactively to `LOCATION_CHANGED` via `useGameEvent` (line 24) for the value it needs during render.
   Evidence: `src/hooks/useEventTriggers.js:129,154,180,204,255,274` (all `getState()` calls are inside event callbacks)

4. **[Impact: ~~Medium~~ Not a flaw] Dialogue variant selection is intentionally non-deterministic** — `tanaka-dialogue.js` uses `Math.random()` to pick between cosmetic dialogue lines when Tanaka acknowledges a supply delivery. This is flavoring text, not a gameplay path — it has no effect on outcomes, rewards, or state. The deterministic RNG requirement applies to combat, encounters, and pricing where reproducibility matters. Locking dialogue variants to a deterministic seed would eliminate the intended variation.
   Evidence: `src/game/data/dialogue/tanaka-dialogue.js:584` (cosmetic text selection only)

5. **[Impact: ~~Medium~~ Resolved] Save failure now surfaced to player** — SaveLoadManager emits `SAVE_FAILED` event on localStorage errors. App.jsx subscribes via Bridge Pattern and shows error notification through the existing notification system.
   Evidence: `src/game/state/managers/save-load.js` (emits EVENT_NAMES.SAVE_FAILED), `src/App.jsx` (useGameEvent + showError)

6. **[Impact: ~~Medium~~ Resolved] Components now use Bridge Pattern consistently** — RefuelPanel and RepairPanel no longer import `useGameState` or call `gameStateManager` directly. `getFuelPrice` and `getServiceDiscount` are now exposed through `useGameAction()`.
   Evidence: `src/hooks/useGameAction.js` (new methods), `src/features/refuel/RefuelPanel.jsx` (no useGameState import), `src/features/repair/RepairPanel.jsx` (no useGameState import)

7. **[Impact: Low] Constants file approaching size threshold** — At 1,888 lines, `constants.js` is well-organized but large. Continued growth risks making navigation difficult.
   Evidence: `src/game/constants.js` (1,888 lines, 51 exports)

8. **[Impact: Low] State validators file is large and complex** — `state-validators.js` at 981 lines handles version migration, structure validation, and data repair. Multiple responsibilities in one file.
   Evidence: `src/game/state/state-validators.js` (981 lines — validation, migration, repair combined)

9. **[Impact: ~~Low~~ Not a flaw] Three.js selection state correctly placed** — `selectedStar` and `currentSystemIndicator` in `interaction.js` are Three.js scene objects (meshes, materials, positions), not game state. They are mutated every animation frame (scale, opacity, rotation) by `updateSelectionRingAnimations`. Moving them into GameStateManager would conflate rendering state with game state; moving them into React state would cause 60fps re-renders. The module-level pattern is idiomatic for Three.js scene management and consistent with the engine's `scene.js`. `StarmapContext` already provides the correct abstraction layer for React components to call into the 3D scene.
   Evidence: `src/game/engine/interaction.js:4-7`, `src/features/navigation/StarMapCanvas.jsx:68-75` (StarmapContext bridge)

10. **[Impact: ~~Low~~ Resolved] GameStateManager facade now fully organized** — Added section headers for the two ungrouped method blocks (SHIP CONFIGURATION, GAME LIFECYCLE). Relocated the NPC BENEFITS - FREE REPAIR section to sit adjacent to the other NPC BENEFITS sub-sections for consistency. All 177+ delegation methods are now grouped under 26 section headers by domain.
    Evidence: `src/game/state/game-state-manager.js` (section headers throughout)

---

## Coverage Checklist

### Flaw/Risk Types 1–34

| # | Type | Status | Notes |
|---|------|--------|-------|
| 1 | Global mutable state | Not observed | Module-level `let` vars are performance caches (Three.js textures, wormhole graph), not game state |
| 2 | God object | Not observed | GameStateManager is a facade by design; largest managers (NPC 1000, Ship 702) have high cohesion |
| 3 | Tight coupling | Resolved | Finding: NPCManager → ShipManager private method call (flaw #1) — fixed via public API + facade |
| 4 | High/unstable dependencies | Not observed | Clean dependency direction: components → hooks → managers → utils/data |
| 5 | Circular dependencies | Not observed | No circular imports found across entire codebase |
| 6 | Leaky abstractions | Resolved | Flaw #2 (direct state mutation) and #6 (direct manager calls) both fixed. Flaw #3 reclassified as not a flaw. |
| 7 | Over-abstraction | Not observed | Abstractions match complexity; no unnecessary indirection layers |
| 8 | Premature optimization | Not observed | Performance patterns (texture caching, lazy graph init) are justified |
| 9 | Shotgun surgery | Not observed | Feature modules are self-contained; manager changes are localized |
| 10 | Feature envy / anemic domain | Not observed | Business logic lives in managers and util files, not components |
| 11 | Low cohesion | Not observed | Each manager and feature module has a clear single responsibility |
| 12 | Hidden side effects | Resolved | Finding: applyEncounterOutcome now delegates to manager methods (flaw #2 fixed) |
| 13 | Inconsistent boundaries | Resolved | RefuelPanel and RepairPanel now use Bridge Pattern consistently (flaw #6 fixed) |
| 14 | Distributed monolith | Not applicable | Single-page browser application, no services |
| 15 | Chatty service calls | Not applicable | No network services |
| 16 | Synchronous-only integration | Not applicable | No external service integration |
| 17 | No clear ownership of data | Not observed | GameStateManager is sole owner of game state |
| 18 | Shared database across services | Not applicable | Single localStorage store, one writer |
| 19 | Lack of idempotency | Not assessed | Save system uses debounce; no network retry scenarios |
| 20 | Weak error handling strategy | Not observed | Consistent try/catch with logging; no empty catch blocks; error isolation in event system |
| 21 | No observability plan | Not observed | Dev logging via `dev-logger.js`; appropriate for a client-side game |
| 22 | Configuration sprawl | Not observed | Single centralized constants file; no scattered configs |
| 23 | Dependency injection misuse | Not observed | DI is minimal and clear (GameStateManager via React Context) |
| 24 | Inconsistent API contracts | Not observed | Manager public APIs are consistent; event names centralized in constants |
| 25 | Business logic in the UI | Not observed | Calculations extracted to utility files; components delegate properly |
| 26 | Poor transactional boundaries | Not observed | `markDirty()` + debounced save provides consistent state persistence |
| 27 | Temporal coupling | Not observed | Manager initialization order is explicit in GameStateManager constructor |
| 28 | Magic numbers/strings everywhere | Not observed | All constants centralized in `constants.js` |
| 29 | "Utility" dumping ground | Not observed | Utils are small, focused files (12-180 lines each) |
| 30 | Security as an afterthought | Not observed | No backend; XSS vectors absent; localStorage data validated on load |
| 31 | Dead code / unused dependencies | Not observed | knip configured and used; no dead code detected |
| 32 | Missing test coverage for critical paths | Not observed | 329 tests covering trading, combat, navigation, NPC, save/load, dialogue |
| 33 | Hard-coded credentials or secrets | Not observed | No .env files, no API keys, no credentials in source |
| 34 | Inconsistent error/logging conventions | Not applicable | Single application, not cross-service |

### Strength Categories S1–S14

| # | Category | Status | Notes |
|---|----------|--------|-------|
| S1 | Clear modular boundaries | Observed | Finding: strengths #1, #4 — zero cross-feature coupling, well-bounded managers |
| S2 | High cohesion | Observed | Finding: strength #1, #11 — focused managers and utility modules |
| S3 | Loose coupling | Observed | Finding: strengths #2, #4 — Bridge Pattern, feature isolation |
| S4 | Dependency direction is stable | Observed | Finding: strength #10 — clean unidirectional import graph |
| S5 | Dependency management hygiene | Observed | Finding: strengths #10, #12 — no circular deps, minimal runtime deps |
| S6 | Consistent API contracts | Observed | Manager APIs follow consistent patterns; centralized event names |
| S7 | Robust error handling | Observed | Finding: strengths #8, #9 — validation, error isolation, no swallowed errors |
| S8 | Observability present | Not applicable | Client-side game; dev-logger appropriate for context |
| S9 | Configuration discipline | Observed | Finding: strength #5 — centralized constants with domain organization |
| S10 | Security built-in | Observed | Finding: strength #13 — no XSS vectors, validated save data |
| S11 | Testability & coverage | Observed | Finding: strengths #3, #7 — 329 tests with property-based validation |
| S12 | Resilience patterns | Observed | Finding: strength #8 — save validation, data repair, migration support |
| S13 | Domain modeling strength | Observed | Finding: strengths #6, #7 — pure utility functions, deterministic RNG |
| S14 | Simple, pragmatic abstractions | Observed | Finding: strengths #1, #2 — facade delegates without over-engineering |

---

## Hotspots

1. **`src/game/state/game-state-manager.js` (~1,230 lines)** — Central facade with 177+ methods. Well-designed as delegation hub. Now fully organized with 26 section headers grouping methods by domain. Encapsulation violation (NPCManager → ShipManager) previously resolved via public API + facade.

2. **`src/features/danger/applyEncounterOutcome.js`** — Contains the only direct state mutation found outside manager boundaries. Also the most complex encounter resolution logic. Worth reviewing for abstraction consistency.

3. **`src/game/state/state-validators.js` (981 lines)** — Strong core for save integrity, but combines three responsibilities (version migration, structure validation, data repair). If save format evolves further, this file will become harder to maintain.

---

## Next Questions

1. ~~Is the Bridge Pattern violation in `useEventTriggers.js` (direct `getState()` calls) intentional for performance, or should it be refactored to use event subscriptions?~~ **Decision: Not a flaw.** The `getState()` calls are inside event handler callbacks (not render), providing point-in-time snapshots for one-shot computations. Converting to `useGameEvent` subscriptions would be incorrect. See flaw #3 reclassification.

2. ~~Should `constants.js` (1,888 lines) be split into domain-specific files (e.g., `constants/ship.js`, `constants/trade.js`) before it grows further?~~ **Decision: No action.** Single-file is fine for a solo project — easy to search, simple imports. Revisit only if merge conflicts become a problem.

3. ~~What is the recovery path if `localStorage` becomes unavailable or corrupted mid-session — should the save failure TODO be prioritized?~~ **Resolved.** Added `SAVE_FAILED` event + notification. Both save paths (`_forceSave` and `saveGame`) now emit the event, and App.jsx shows the error to the player via the existing notification system.

4. ~~Should `state-validators.js` (981 lines) be split into separate validation, migration, and repair modules to improve maintainability?~~ **Decision: No action.** The three concerns are related (migrations call validators, defaults repair what validation flags). 981 lines across 11 functions is manageable. Revisit when the migration chain grows long enough to warrant extracting `state-migrations.js`.

5. ~~Is the `Math.random()` in `tanaka-dialogue.js:584` intentionally non-deterministic (cosmetic flavor text), or should it use SeededRandom for reproducibility?~~ **Decision: No action.** This selects between 2 cosmetic "thank you" lines with no gameplay impact. The deterministic RNG rule applies to gameplay paths, not flavor text.
