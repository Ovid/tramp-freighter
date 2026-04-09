# Architecture Report -- tramp-freighter

**Date:** 2026-03-15
**Commit:** 3d878b6ac45f20945eebf0ccf82781c82d00de87
**Languages:** JavaScript (React 18, Three.js, Vite)
**Key directories:** `src/features/` (20 feature dirs), `src/game/state/managers/` (25 managers), `src/game/engine/`, `src/game/data/`, `src/hooks/`, `src/components/`, `src/context/`, `tests/` (unit/property/integration)
**Scope:** Full repository

## Repo Overview

Tramp Freighter Blues is a single-player space trading survival game rendered in the browser with React 18 and Three.js. Players navigate a 3D starmap of 117 real star systems, trade commodities, manage ship resources, build NPC relationships, and survive encounters (pirates, inspections, distress calls, mechanical failures). The codebase is 168 source files organized around a GameCoordinator singleton that delegates to 25 capability-injected domain managers. React components connect to game state through a Bridge Pattern (event pub/sub hooks). The project has 407 test files with 4298 tests covering unit, property-based, and integration testing.

## Strengths

Ranked by impact (High first):

### [S-1] Capability injection isolates all 25 managers
- **Category:** S1 (Clear modular boundaries) / S14 (Simple, pragmatic abstractions)
- **Impact:** High
- **Explanation:** Every manager receives a focused capability object declaring exactly which state reads, writes, and infrastructure it needs. The `capabilities.js` file provides 554 lines of JSDoc interface definitions with a STATE OWNERSHIP MODEL table. This makes cross-domain dependencies explicit and auditable.
- **Evidence:** `src/game/state/game-coordinator.js:68-492` wires all 25 managers; `src/game/state/capabilities.js` documents contracts
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data

### [S-2] Zero cross-manager import statements
- **Category:** S5 (Dependency management hygiene)
- **Impact:** High
- **Explanation:** No manager imports another manager directly. All cross-manager communication goes through capability injection lambdas wired in the coordinator. Managers can be tested in isolation with mock capabilities.
- **Evidence:** `src/game/state/managers/` -- grep for `import.*from.*managers/` returns zero matches across all 25 manager files
- **Found by:** Coupling & Dependencies

### [S-3] Clean, stable dependency direction
- **Category:** S4 (Dependency direction is stable)
- **Impact:** High
- **Explanation:** Dependencies flow consistently leaf-to-core: data/constants <- utils <- managers <- coordinator <- hooks <- features. The game layer never imports from the feature layer. No circular dependencies detected.
- **Evidence:** Grep for `from.*features/` in `src/game/` returns zero results. Dynamic imports in `dialogue.js` break the one potential cycle.
- **Found by:** Coupling & Dependencies

### [S-4] Pure stateless domain logic classes
- **Category:** S13 (Domain modeling strength)
- **Impact:** High
- **Explanation:** Core game calculations (pricing, navigation, economics) are implemented as pure functions with static methods that take inputs and return outputs without side effects. Mathematical formulas are documented with JSDoc including examples and edge cases.
- **Evidence:** `src/game/game-trading.js` (`TradingSystem.calculatePrice`), `src/game/game-navigation.js` (`NavigationSystem.calculateFuelCost`), `src/game/game-events.js` (`EconomicEventsSystem`)
- **Found by:** Structure & Boundaries

### [S-5] Bridge Pattern hooks
- **Category:** S14 (Simple, pragmatic abstractions)
- **Impact:** High
- **Explanation:** Three primitives cleanly connect the imperative GameCoordinator to React: `GameContext` provides the coordinator, `useGameEvent(eventName)` subscribes to state changes, and `useGameAction()` returns action methods composed from 7 domain-specific hooks. Avoids the complexity of a full state management library.
- **Evidence:** `src/hooks/useGameEvent.js`, `src/hooks/useGameAction.js`, `src/context/GameContext.jsx`
- **Found by:** Structure & Boundaries

### [S-6] Save migration chain with validation and self-healing
- **Category:** S12 (Resilience patterns)
- **Impact:** High
- **Explanation:** Save/load implements a 5-version migration chain (v1.0.0 through v5.0.0), structural validation of all state fields, normalization of legacy data formats, and self-healing defaults for missing fields. Corrupted cargo stacks are repaired in-place.
- **Evidence:** `src/game/state/state-validators.js` (991 lines): `validateStateStructure()`, `addStateDefaults()`, `validateAndRepairCargoStacks()`, 5 migration functions
- **Found by:** Integration & Data, Security & Code Quality

### [S-7] Debounced save with flush-on-unload, error-isolated event subscribers
- **Category:** S12 (Resilience patterns)
- **Impact:** High
- **Explanation:** `markDirty()` uses a 500ms trailing debounce so rapid mutations batch into a single save. `flushSave()` bypasses debouncing for browser unload. `_forceSave()` emits `SAVE_FAILED` on error. The EventSystemManager wraps each subscriber callback in try/catch, preventing one crash from breaking the event chain.
- **Evidence:** `src/game/state/managers/save-load.js:34-62`, `src/game/state/managers/event-system.js:94-99`
- **Found by:** Integration & Data

### [S-8] Zero eval/innerHTML/dangerouslySetInnerHTML usage
- **Category:** S10 (Security built-in)
- **Impact:** High
- **Explanation:** No dangerous code execution patterns exist anywhere in 168 source files. All rendering uses React's JSX auto-escaping.
- **Evidence:** Grep confirms zero occurrences of `eval(`, `innerHTML`, or `dangerouslySetInnerHTML`
- **Found by:** Security & Code Quality

### [S-9] Deterministic gameplay RNG with SeededRandom
- **Category:** S10 (Security built-in)
- **Impact:** High
- **Explanation:** All gameplay RNG uses `SeededRandom` with deterministic seeds built via `buildEncounterSeed(gameDay, systemId, encounterType)`. `Math.random()` appears only in visual code (background starfield) and as default parameters overridden in tests.
- **Evidence:** `src/game/utils/seeded-random.js`, `src/game/engine/scene.js:226-254` (only visual Math.random)
- **Found by:** Security & Code Quality

### [S-10] Comprehensive test suite: 407 files, 4298 tests
- **Category:** S11 (Testability & coverage)
- **Impact:** High
- **Explanation:** Every critical game path has dedicated test coverage. Property tests enforce minimum 100 iterations. The capability injection architecture enables clean test doubles without constructing the full coordinator.
- **Evidence:** 261 unit tests, 106 property tests, 40 integration tests, all passing
- **Found by:** Security & Code Quality

### [S-11] Co-located feature modules
- **Category:** S1 (Clear modular boundaries) / S2 (High cohesion)
- **Impact:** High
- **Explanation:** 20 feature directories each co-locate React components with their utility functions. Understanding a gameplay system requires reading one directory.
- **Evidence:** `src/features/danger/` (8 files for encounter system), `src/features/trade/` (TradePanel + tradeUtils), etc.
- **Found by:** Structure & Boundaries

### [S-12] Centralized EVENT_NAMES with pre-registered subscriber map
- **Category:** S6 (Consistent API contracts)
- **Impact:** Medium
- **Explanation:** All 37 event types defined in a single `Object.freeze()` constant. EventSystemManager pre-registers all event types and warns on unknown events, preventing typo-based bugs.
- **Evidence:** `src/game/constants.js:1855-1931` (EVENT_NAMES), `src/game/state/managers/event-system.js:19` (initialization from `Object.values`)
- **Found by:** Integration & Data

### [S-13] Focused encounter manager decomposition
- **Category:** S2 (High cohesion)
- **Impact:** Medium
- **Explanation:** Five focused managers handle distinct encounter types (combat, negotiation, inspection, distress, mechanical failure). DangerManager retains shared state only. Each manager is under 400 lines with single responsibility.
- **Evidence:** `src/game/state/managers/combat.js` (344 lines), `negotiation.js` (382), `inspection.js` (214), `distress.js` (153), `mechanical-failure.js` (229)
- **Found by:** Structure & Boundaries

### [S-14] NPC data corruption recovery path
- **Category:** S12 (Resilience patterns)
- **Impact:** Medium
- **Explanation:** The save-load system detects NPC-related corruption, then attempts targeted recovery by resetting NPC and dialogue state while preserving all other game data.
- **Evidence:** `src/game/state/managers/save-load.js:165-207` (`handleLoadError`, `attemptNPCRecovery`)
- **Found by:** Integration & Data

### [S-15] Focused utility modules (no dumping ground)
- **Category:** S14 (Simple, pragmatic abstractions)
- **Impact:** Medium
- **Explanation:** 10 utility files in `src/game/utils/` each serve a narrow, domain-specific purpose. None have grown into grab-bags. The largest (`wormhole-graph.js`, 207 lines) provides graph algorithms over a single data structure.
- **Evidence:** `src/game/utils/` -- seeded-random.js (101 lines), calculators.js (115), star-visuals.js (100), string-utils.js (83), etc.
- **Found by:** Structure & Boundaries

## Flaws/Risks

Ranked by impact (High first):

### [F-1] `coordinatorRef` escape hatch leaks full coordinator through capability boundary
- **Category:** 6 (Leaky abstractions) / 13 (Inconsistent boundaries)
- **Impact:** High
- **Explanation:** InfoBrokerManager and DialogueManager receive `coordinatorRef` -- a direct reference to the entire GameCoordinator -- bypassing the capability injection system. InfoBrokerManager calls `getState()` on it and passes the full state to `InformationBroker.purchaseIntelligence()`, which directly mutates `gameState.player.credits` and `gameState.world.priceKnowledge`, sidestepping the event system. DialogueManager passes it to the dialogue engine which calls 25+ coordinator methods. Both are documented as intentional coupling, but they undermine the otherwise clean capability boundary.
- **Evidence:** `src/game/state/managers/info-broker.js:40` (`this.capabilities.coordinatorRef.getState()`), `src/game/game-information-broker.js:111` (`gameState.player.credits -= cost`), `src/game/state/managers/dialogue.js:92` (passes coordinator to `showDialogue`), `src/game/game-dialogue.js:46-94` (`buildDialogueContext` calls 25+ methods)
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data

### [F-2] `NavigationSystem.executeJump` takes full coordinator, leaks into React layer
- **Category:** 6 (Leaky abstractions)
- **Impact:** Medium
- **Explanation:** `NavigationSystem.executeJump()` accepts the full GameCoordinator and calls 10+ methods on it. This pre-refactor pattern leaks through hooks into React components, which must pass the coordinator directly and access `game.navigationSystem` to call methods like `getConnectedSystems()`, `calculateFuelCostWithCondition()`, and `calculateJumpTime()`.
- **Evidence:** `src/game/game-navigation.js:412` (`executeJump(gameStateManager, ...)`), `src/hooks/useNavigationActions.js:15` (`game.navigationSystem.executeJump(game, ...)`), `src/features/navigation/SystemPanel.jsx:235` (`game.navigationSystem.getConnectedSystems()`), `src/hooks/useJumpValidation.js:25`, `src/features/missions/MissionBoardPanel.jsx:41`
- **Found by:** Coupling & Dependencies

### [F-3] Combat/Negotiation probability calculations live in React components
- **Category:** 25 (Business logic in UI)
- **Impact:** Medium
- **Explanation:** `calculateCombatProbabilities` (110 lines) and `calculateNegotiationProbabilities` (50 lines) compute success rates with engine penalties, quirk bonuses, karma modifiers, and upgrade effects entirely inside panel components. This game balance logic cannot be unit-tested in isolation and risks drifting from the actual resolution logic in managers.
- **Evidence:** `src/features/danger/CombatPanel.jsx:502-612`, `src/features/danger/NegotiationPanel.jsx:405-456`
- **Found by:** Error Handling & Observability

### [F-4] Combat outcome text hard-codes numbers that duplicate constants
- **Category:** 28 (Magic numbers/strings)
- **Impact:** Medium
- **Explanation:** CombatPanel outcome descriptions contain literal values ("-15% fuel", "-5% engine", "-30% hull", "500 credits", "+5 outlaw reputation", "+10 authority reputation") that duplicate COMBAT_CONFIG constants. If constants change, UI text silently becomes wrong.
- **Evidence:** `src/features/danger/CombatPanel.jsx:293` (`"-15% fuel, -5% engine condition"`), line 355 (`"-30% hull, lose cargo and 500 credits"`), line 450 (`"+10 authority reputation"`)
- **Found by:** Error Handling & Observability

### [F-5] Redundant parallel constant hierarchies in encounter configs
- **Category:** 22 (Configuration sprawl)
- **Impact:** Medium
- **Explanation:** INSPECTION_CONFIG, COMBAT_CONFIG, and NEGOTIATION_CONFIG each define values in both canonical categories (e.g., `FINE_AMOUNTS`, `BASE_SUCCESS_RATES`) and shorthand groups (e.g., `COOPERATE`, `EVASIVE`) with identical literal values. Each numeric value exists twice as independent constants that can silently diverge.
- **Evidence:** `src/game/constants.js:1400-1468` (INSPECTION_CONFIG: `FINE_AMOUNTS.RESTRICTED_GOODS_FINE: 1000` duplicated as `COOPERATE.RESTRICTED_FINE: 1000`), lines 1269-1342 (COMBAT_CONFIG), lines 1351-1391 (NEGOTIATION_CONFIG)
- **Found by:** Error Handling & Observability

### [F-6] Numeric validators accept NaN and Infinity from save data
- **Category:** 30 (Security as afterthought)
- **Impact:** Medium
- **Explanation:** `validateStateStructure()` checks `typeof field !== 'number'` for all numeric fields (credits, fuel, hull, engine, karma, etc.), but `typeof NaN === 'number'` and `typeof Infinity === 'number'` in JavaScript. A tampered or corrupted save with NaN/Infinity values would pass validation and cause cascading arithmetic bugs.
- **Evidence:** `src/game/state/state-validators.js:186-428` -- zero occurrences of `isNaN`, `isFinite`, `Number.is`, or range checks. E.g., line 225: `typeof state.player.credits !== 'number'`
- **Found by:** Security & Code Quality

### [F-7] `loadGame()` silently swallows parse errors in production
- **Category:** 20 (Weak error handling)
- **Impact:** Medium
- **Explanation:** If `JSON.parse(saveData)` throws (corrupted localStorage), the catch block calls `devLog()` (a no-op in production) and returns `null`. Upstream code treats `null` as "no save exists", so a player with a corrupted save gets no feedback that their data was lost -- the game silently starts fresh.
- **Evidence:** `src/game/state/save-load.js:72-75` -- `catch (error) { devLog('Failed to load game:', error); return null; }`
- **Found by:** Error Handling & Observability

### [F-8] QuestManager gets raw state setters that bypass ShipManager
- **Category:** 17 (No clear ownership of data)
- **Impact:** Medium
- **Explanation:** QuestManager's capability object includes `setShipEngine` and `addShipUpgrade` as inline closures that directly mutate `state.ship.engine` and `state.ship.upgrades`. These bypass ShipManager's clamping, warning checks, and `calculateShipCapabilities()` recalculation. A quest reward granting an upgrade would not update cargo capacity until the next game load.
- **Evidence:** `src/game/state/game-coordinator.js:432` (`setShipEngine: (value) => { this.state.ship.engine = value; ... }` -- no clamping), line 439 (`addShipUpgrade` -- no `calculateShipCapabilities()` call)
- **Found by:** Integration & Data

### [F-9] No test coverage for adversarial/malformed save data
- **Category:** 32 (Missing test coverage for critical paths)
- **Impact:** Medium
- **Explanation:** Given that F-6 confirms NaN/Infinity pass validation, there are no tests exercising adversarial inputs (NaN, Infinity, negative credits, extremely long strings, `__proto__` keys). All save-load tests use well-formed state objects.
- **Evidence:** `tests/unit/state-validators.test.js`, `tests/unit/save-load*.test.js` -- no tests use NaN, Infinity, or boundary-violating values
- **Found by:** Security & Code Quality

### [F-10] `state.stats` mutated by 5+ code paths with no single owner
- **Category:** 17 (No clear ownership of data)
- **Impact:** Low
- **Explanation:** Stats are mutated through three `updateStats` capability lambdas (Trading, Mission, Quest), plus direct increments via `getStats()` in DangerManager (`stats.charitableActs++`) and NavigationManager (`stats.jumpsCompleted++`), and via `coordinatorRef.getState()` in InfoBrokerManager (`stats.rumorsPurchased`). The inconsistency means some stats go through capabilities and some bypass them.
- **Evidence:** `src/game/state/game-coordinator.js:143-147,394-398,447-451` (three identical lambdas), `src/game/state/managers/danger.js:111`, `src/game/state/managers/navigation.js:73`, `src/game/state/managers/info-broker.js:74`
- **Found by:** Structure & Boundaries, Integration & Data

### [F-11] `updateStats` lambda duplicated three times
- **Category:** 9 (Shotgun surgery)
- **Impact:** Low
- **Explanation:** The identical `updateStats` lambda `(key, delta) => { if (this.state.stats) { this.state.stats[key] = (this.state.stats[key] || 0) + delta; } }` is copy-pasted into three capability objects. If stats logic changes, all three must be updated in lockstep.
- **Evidence:** `src/game/state/game-coordinator.js:143-147` (TradingManager), `394-398` (MissionManager), `447-451` (QuestManager)
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data

### [F-12] Duplicated `getReputationClass` function in 4 panel files
- **Category:** 34 (Inconsistent conventions)
- **Impact:** Low
- **Explanation:** Identical `getReputationClass(reputation)` function copy-pasted across 4 danger panel files, despite `dangerDisplayUtils.js` already exporting shared helpers like `getKarmaClass`.
- **Evidence:** `src/features/danger/NegotiationPanel.jsx:489`, `InspectionPanel.jsx:430`, `DistressCallPanel.jsx:481`, `OutcomePanel.jsx:404`
- **Found by:** Error Handling & Observability

### [F-13] Temporal coupling -- `animationSystem` must be set by StarMapCanvas
- **Category:** 27 (Temporal coupling)
- **Impact:** Low
- **Explanation:** `GameCoordinator.animationSystem` is initialized to `null` and only set when StarMapCanvas mounts. `useAnimationLock` throws if it's null. This creates an invisible mount-order requirement with no compile-time enforcement.
- **Evidence:** `src/game/state/game-coordinator.js:80` (`this.animationSystem = null`), `src/hooks/useAnimationLock.js:31` (throws if null)
- **Found by:** Coupling & Dependencies

### [F-14] EventEngineManager receives entire game state via capability
- **Category:** 6 (Leaky abstractions)
- **Impact:** Low
- **Explanation:** EventEngineManager's capability includes `getGameState: () => this.state`, giving it access to the full state tree. Needed because `evaluateCondition()` reads arbitrary state paths, but it undermines the minimal-surface-area principle.
- **Evidence:** `src/game/state/game-coordinator.js:408`, `src/game/state/managers/event-engine.js:66`
- **Found by:** Coupling & Dependencies

### [F-15] Hard-coded epsilon `0.001` repeated 5 times for karma modifier display
- **Category:** 28 (Magic numbers/strings)
- **Impact:** Low
- **Explanation:** Both CombatPanel and NegotiationPanel use `Math.abs(karmaModifier) > 0.001` as a display threshold, repeated 5 times without a named constant.
- **Evidence:** `src/features/danger/CombatPanel.jsx:555,571,587`, `src/features/danger/NegotiationPanel.jsx:419,435`
- **Found by:** Error Handling & Observability

### [F-16] InspectionPanel hard-codes security level thresholds
- **Category:** 28 (Magic numbers/strings)
- **Impact:** Low
- **Explanation:** `getSecurityLevelName()` uses literal thresholds `2.0, 1.5, 1.0, 0.5` that duplicate `INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS` values.
- **Evidence:** `src/features/danger/InspectionPanel.jsx:416-422`
- **Found by:** Error Handling & Observability

### [F-17] `capabilities.js` is JSDoc-only, never imported at runtime
- **Category:** 31 (Dead code / unused dependencies)
- **Impact:** Low
- **Explanation:** 554 lines of JSDoc `@typedef` definitions that serve as documentation for the capability interfaces but are never imported by any source file. Could drift from reality without detection.
- **Evidence:** `src/game/state/capabilities.js` -- zero imports from `src/`, confirmed by both grep and knip
- **Found by:** Security & Code Quality

### [F-18] TradePanel localStorage access lacks try/catch
- **Category:** 30 (Security as afterthought)
- **Impact:** Low
- **Explanation:** Unlike all other localStorage calls in the codebase which are wrapped in try/catch, TradePanel accesses localStorage directly for a UI preference flag.
- **Evidence:** `src/features/trade/TradePanel.jsx:113,117` -- `localStorage.getItem('restrictedExplained')` and `localStorage.setItem(...)` without try/catch
- **Found by:** Security & Code Quality

### [F-19] `applyEncounterOutcome` reads game state directly via `game.getState()`
- **Category:** 13 (Inconsistent boundaries)
- **Impact:** Low
- **Explanation:** A feature-layer utility calls `game.getState()` to read current state, then applies mutations through individual coordinator methods. While this is a deliberate orchestration function, it couples the feature module to the raw state shape and operates outside the Bridge Pattern.
- **Evidence:** `src/features/danger/applyEncounterOutcome.js:16` (`const state = game.getState()`), lines 133, 139
- **Found by:** Structure & Boundaries, Integration & Data, Error Handling & Observability

### [F-20] CLAUDE.md says "15+ managers" but there are 25
- **Category:** Steering file staleness
- **Impact:** Low
- **Explanation:** CLAUDE.md states "The GameCoordinator delegates to 15+ focused domain managers" and lists 18 by name. The actual count is 25 (24 domain managers + BaseManager). Missing from the list: QuestManager, DebtManager, AchievementsManager, EventEngineManager, MechanicalFailureManager, DistressManager.
- **Evidence:** `CLAUDE.md` vs `ls src/game/state/managers/` (25 files)
- **Found by:** Structure & Boundaries, Coupling & Dependencies

### [F-21] `updateTime` orchestrates 8+ side effects without rollback
- **Category:** 26 (Poor transactional boundaries)
- **Impact:** Low
- **Explanation:** `EventsManager.updateTime()` calls `setDaysElapsed` first, then 8+ subsequent operations (market recovery, price recalculation, loan defaults, mission deadlines, etc.). If a mid-sequence operation throws, time has advanced but economic/mission systems have not updated. Practical risk is low since these operations rarely throw, and the debounced save pattern makes partial persistence unlikely.
- **Evidence:** `src/game/state/managers/events.js:95-148`
- **Found by:** Integration & Data

## Coverage Checklist

### Flaw/Risk Types 1-34
| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Not observed | Dropped -- module-level caches in wormhole-graph.js and Three.js engine are standard patterns for static data and GPU resources |
| 2 | God object | Not observed | GameCoordinator's ~183 delegation methods are intentional post-refactor facade |
| 3 | Tight coupling | Observed | Part of #F-1 (InformationBroker direct state mutation) |
| 4 | High/unstable dependencies | Not observed | -- |
| 5 | Circular dependencies | Not observed | S-3 confirms zero circular deps |
| 6 | Leaky abstractions | Observed | #F-1, #F-2, #F-3, #F-14 |
| 7 | Over-abstraction | Not observed | -- |
| 8 | Premature optimization | Not observed | -- |
| 9 | Shotgun surgery | Observed | #F-11 |
| 10 | Feature envy / anemic domain model | Not observed | S-4 confirms rich domain logic classes |
| 11 | Low cohesion | Not observed | S-11, S-13 confirm high cohesion |
| 12 | Hidden side effects | Not observed | Dropped -- applyEncounterOutcome is deliberate orchestration |
| 13 | Inconsistent boundaries | Observed | #F-1, #F-10, #F-19 |
| 14 | Distributed monolith | Not applicable | Single-player browser game |
| 15 | Chatty service calls | Not applicable | Single-player browser game |
| 16 | Synchronous-only integration | Not applicable | Single-player browser game |
| 17 | No clear ownership of data | Observed | #F-8, #F-10 |
| 18 | Shared database across services | Not applicable | Single-player browser game |
| 19 | Lack of idempotency | Not observed | -- |
| 20 | Weak error handling strategy | Observed | #F-7 |
| 21 | No observability plan | Not assessed | Logging infrastructure exists but is lightly used; appropriate for a single-player game |
| 22 | Configuration sprawl | Observed | #F-5 |
| 23 | Dependency injection misuse | Not observed | Capability injection is well-applied |
| 24 | Inconsistent API contracts | Not observed | S-12 confirms consistent event contracts |
| 25 | Business logic in UI | Observed | #F-3 |
| 26 | Poor transactional boundaries | Observed | #F-21 |
| 27 | Temporal coupling | Observed | #F-13 |
| 28 | Magic numbers/strings | Observed | #F-4, #F-15, #F-16 |
| 29 | Utility dumping ground | Not observed | S-15 confirms focused utility files |
| 30 | Security as an afterthought | Observed | #F-6, #F-18 |
| 31 | Dead code / unused dependencies | Observed | #F-17 |
| 32 | Missing test coverage for critical paths | Observed | #F-9 |
| 33 | Hard-coded credentials or secrets | Not observed | S-8 confirms zero secrets |
| 34 | Inconsistent error/logging conventions | Observed | #F-12 |

### Strength Categories S1-S14
| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | #S-1, #S-11 |
| S2 | High cohesion | Observed | #S-11, #S-13 |
| S3 | Loose coupling | Observed | #S-2, #S-3 |
| S4 | Dependency direction is stable | Observed | #S-3 |
| S5 | Dependency management hygiene | Observed | #S-2, #S-3 |
| S6 | Consistent API contracts | Observed | #S-12 |
| S7 | Robust error handling | Observed | #S-6, #S-7 |
| S8 | Observability present | Not assessed | Logging infrastructure exists, lightly used |
| S9 | Configuration discipline | Observed | #S-1, #S-6 (centralized constants) |
| S10 | Security built-in | Observed | #S-8, #S-9 |
| S11 | Testability & coverage | Observed | #S-10 |
| S12 | Resilience patterns | Observed | #S-6, #S-7, #S-14 |
| S13 | Domain modeling strength | Observed | #S-4 |
| S14 | Simple, pragmatic abstractions | Observed | #S-1, #S-5, #S-15 |

## Hotspots

Top 3 files/directories to review:

1. **`src/features/danger/CombatPanel.jsx`** (675 lines) -- Contains business logic that should be in the game layer (probability calculations, 110 lines), hard-coded outcome text duplicating constants, and repeated magic numbers. Also the largest encounter panel with the most formula duplication risk.

2. **`src/game/state/game-coordinator.js`** (1638 lines) -- The capability wiring hub. Contains the `coordinatorRef` escape hatches (F-1), duplicated `updateStats` lambdas (F-11), and the QuestManager raw setters that bypass ShipManager (F-8). All cross-cutting architectural decisions live here.

3. **`src/game/state/state-validators.js`** (991 lines) -- Strong resilience foundation (migration chain, structural validation, self-healing), but the numeric validation gap (NaN/Infinity pass `typeof` checks) could lead to cascading corruption if save data is tampered with.

## Next Questions

1. Should the `coordinatorRef` escape hatch in InfoBrokerManager and DialogueManager be resolved by refactoring `InformationBroker` and the dialogue engine to accept narrow capability objects, consistent with the other 23 managers?

2. Is the `NavigationSystem` class a candidate for refactoring into a capability-injected manager (like the GSM refactor did for other domains), or does its dual role (pure calculations + jump execution) justify keeping it as a pre-refactor module?

3. Should the combat/negotiation probability calculation functions be extracted from the panel components into game-layer utility modules (matching the pattern used by `inspectionUtils.js` and `dangerDisplayUtils.js`)?

4. What is the intended relationship between the "canonical" constant hierarchies (FINE_AMOUNTS, BASE_SUCCESS_RATES) and the "shorthand" groups (COOPERATE, EVASIVE) in the encounter configs -- should the shorthands reference the canonical values instead of duplicating literals?

5. Would it be worthwhile to add `Number.isFinite()` checks in `validateStateStructure()` for all numeric fields, and add adversarial save data tests to prevent NaN/Infinity propagation?

## Analysis Metadata

- **Agents dispatched:** Structure & Boundaries, Coupling & Dependencies, Integration & Data, Error Handling & Observability, Security & Code Quality, plus Verifier
- **Scope:** Full repository (168 source files, 407 test files)
- **Raw findings:** 47 (flaws) + 30 (strengths) = 77 total
- **Verified findings:** 21 flaws + 15 strengths = 36 total
- **Filtered out:** 41 (dropped: 6 false positives/low-value, 25 deduplicated, 10 subsumed)
- **By impact:** 1 high flaw, 8 medium flaws, 12 low flaws; 11 high strengths, 4 medium strengths
- **Steering files consulted:** CLAUDE.md, AGENTS.md, memory/MEMORY.md
