# Architecture Report — tramp-freighter

**Date:** 2026-05-03
**Commit:** 3c61f30a7bd576fe2d6912a25785338ce8914286
**Languages:** JavaScript (ES Modules), JSX
**Frameworks:** React 18, Three.js 0.150, Vite 5
**Build/Test:** Vite, Vitest, fast-check, ESLint, Prettier, knip
**Key directories:** `src/features/`, `src/game/state/managers/`, `src/game/data/`, `src/hooks/`, `src/components/`, `tests/{unit,property,integration}`
**Scope:** Full repository (171 source files in `src/`, 441 test files)

## Repo Overview

Tramp Freighter Blues is a single-player browser space-trading survival game. The architecture is a Bridge Pattern between an imperative game engine and React: a `GameCoordinator` singleton delegates to 25 capability-injected domain managers (`TradingManager`, `ShipManager`, `NavigationManager`, `CombatManager`, etc.), and React subscribes via `useGameEvent`/`useGameAction` hooks. Persistence is `localStorage` with versioned migrations. A recent multi-phase "GSM Refactor" replaced a god-object `GameStateManager` with the current capability-injection model. The codebase is mid-sized (~171 source files), heavily tested (2.5× test-to-source ratio with property-based fuzzing), and disciplined about constants (one 2022-line `constants.js` is the single source of truth).

## Strengths

### [S-1] Bridge Pattern compliance — single `useContext` call at the React boundary
- **Category:** S3 — Loose coupling / S4 — Stable dependency direction
- **Impact:** High
- **Explanation:** The Bridge Pattern is honored: `useContext(GameContext)` appears exactly once in the codebase, inside the `useGame()` hook itself. All components access game state through capability-injected hooks, never the raw coordinator.
- **Evidence:** `src/context/GameContext.jsx:36-44` (`useGame`): "const context = useContext(GameContext);"
- **Found by:** structure-specialist, coupling-specialist

### [S-2] No manager imports another manager — clean dependency direction
- **Category:** S4 — Stable dependency direction / S5 — Dependency hygiene
- **Impact:** High
- **Explanation:** Cross-manager calls flow exclusively through capabilities injected in the GameCoordinator constructor. No `import` statement in `src/game/state/managers/*.js` references a sibling manager class — the manager directory is acyclic at the import level.
- **Evidence:** `src/game/state/managers/*.js` (import sections): `grep -rn "import.*from.*managers/" src/game/state/managers/` returns no matches.
- **Found by:** coupling-specialist

### [S-3] Capability-injection contract is explicit and documented; BaseManager enforces it
- **Category:** S2 — Cohesion / S13 — Domain modeling / S14 — Pragmatic abstractions
- **Impact:** High
- **Explanation:** A 553-line `capabilities.js` documents per-manager state ownership and capability shapes via JSDoc typedefs and an explicit "STATE SLICE OWNERSHIP" table. `BaseManager` throws if a capabilities object is missing.
- **Evidence:**
  - `src/game/state/capabilities.js:16-49`: "STATE OWNERSHIP MODEL: ... | ShipManager | ship.hull, ship.engine, ship.lifeSupport, ship.quirks, ship.upgrades |"
  - `src/game/state/managers/base-manager.js:15-22`: "if (!capabilities) { throw new Error('BaseManager requires a capabilities object'); }"
- **Found by:** structure-specialist, coupling-specialist

### [S-4] GameCoordinator is the documented post-refactor facade — not a god object
- **Category:** S14 — Pragmatic abstractions
- **Impact:** High
- **Explanation:** The 1642-line, ~183-method coordinator is a thin delegating facade over 25 capability-injected managers. Recent commits on this file confirm migration from a god-object to capability injection (e.g., "Phase 5: delete GameStateManager wrapper class"). Each method is a one-liner.
- **Evidence:** `src/game/state/game-coordinator.js:510-546`: "addQuirk(quirkId) { return this.shipManager.addQuirk(quirkId); }"
- **Found by:** structure-specialist

### [S-5] Bridge Pattern actions decomposed into composable domain hooks
- **Category:** S3 — Loose coupling / S14 — Pragmatic abstractions
- **Impact:** Medium
- **Explanation:** `useGameAction` is a thin composer over 7 narrower hooks (`useTradeActions`, `useNavigationActions`, `useShipActions`, `useNPCActions`, `useMissionActions`, `useQuestActions`, `useDebtActions`); the file's docstring explicitly recommends importing the narrower hooks for new code, giving interface segregation without a churning rewrite.
- **Evidence:** `src/hooks/useGameAction.js:1-71`: "For new code, prefer importing the domain-specific hooks directly (useTradeActions, useNavigationActions, etc.) to get a narrower API."
- **Found by:** structure-specialist, coupling-specialist

### [S-6] Deterministic encounter RNG correctly seeded and isolated
- **Category:** S12 — Resilience patterns
- **Impact:** High
- **Explanation:** Combat, negotiation, distress, mechanical-failure, and inspection paths use `SeededRandom` keyed on `gameDay_systemId_encounterType`. No `Math.random()` calls in gameplay paths; the few `Math.random()` calls are confined to scene decoration and dev-admin paths.
- **Evidence:** `src/game/state/managers/combat.js:34-39` (`resolveCombatChoice`): "const seed = buildEncounterSeed(this.capabilities.getDaysElapsed(), this.capabilities.getCurrentSystem(), 'combat'); const rng = new SeededRandom(seed).next();"
- **Found by:** integration-specialist

### [S-7] Versioned save format with migration chain and graceful default backfill
- **Category:** S12 — Resilience / S10 — Defensive validation
- **Impact:** High
- **Explanation:** Save state carries `meta.version`, with a migration chain (V1→V2→V2.1→V4→V4.1→V5), structural validation, and `addStateDefaults()` that recomputes derived values and validates IDs against authoritative data. `loadGame` returns null cleanly on missing or malformed save.
- **Evidence:**
  - `src/game/state/state-validators.js:187-430, 665-944` (`validateStateStructure`, `addStateDefaults`)
  - `src/game/state/game-coordinator.js:627-643` (`_applyMigrations`): "for (const [version, migrateFn] of MIGRATIONS) { if (migrated.meta.version === version) { migrated = migrateFn(migrated); } }"
- **Found by:** integration-specialist, security-specialist

### [S-8] All thrown errors are real Error objects with descriptive messages
- **Category:** S7 — Robust error handling
- **Impact:** High
- **Explanation:** Across ~80 `throw` sites in `src/`, every one is `throw new Error(...)` (often with template literals naming the offending value). No `throw 'string'` or `throw {code:1}` forms exist.
- **Evidence:**
  - `src/game/state/managers/trading.js:151`: "throw new Error('Invalid state: currentSystemPrices missing from world state');"
  - `src/game/game-dialogue.js:110`: "throw new Error(\`Unknown NPC ID: ${npcId}\`);"
- **Found by:** errors-specialist

### [S-9] Centralized event names with dynamic subscriber registration
- **Category:** S9 — Configuration discipline
- **Impact:** High
- **Explanation:** All ~50 event names live in a single `EVENT_NAMES` frozen object in `constants.js`. `EventSystemManager` builds its subscriber buckets dynamically from `Object.values(EVENT_NAMES)`, so adding a new event only requires editing constants.js. Unknown event emits warn rather than silently fail.
- **Evidence:**
  - `src/game/state/managers/event-system.js:17-22, 86-92`: "for (const eventName of Object.values(EVENT_NAMES)) { this.subscribers[eventName] = []; }"
  - `src/game/constants.js:1858`: "export const EVENT_NAMES = Object.freeze({"
- **Found by:** errors-specialist

### [S-10] Save failures surface to UI as a first-class event
- **Category:** S7 — Robust error handling / S8 — Observability
- **Impact:** Medium
- **Explanation:** When `_forceSave()` fails (quota, serialization, I/O), `SaveLoadManager` logs through `BaseManager.error` and emits `EVENT_NAMES.SAVE_FAILED`. `App.jsx` consumes the event via `useGameEvent`, giving the player visibility into a silent-but-critical failure. This is the cleanest error-to-UI flow in the codebase.
- **Evidence:**
  - `src/game/state/managers/save-load.js:87-92`: "this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, { message: 'Save failed — game progress may be lost' });"
  - `src/App.jsx:78`: "const saveFailedEvent = useGameEvent(EVENT_NAMES.SAVE_FAILED);"
- **Found by:** errors-specialist

### [S-11] BaseManager provides class-prefixed, DEV_MODE-gated logging
- **Category:** S8 — Observability / S9 — Configuration discipline
- **Impact:** Medium
- **Explanation:** `BaseManager.log/warn/error` auto-prefix with `[ClassName]`; `log` and `warn` are DEV_MODE-gated, while `error` always logs. Tests run cleanly because noisy levels stay silent without DEV_MODE.
- **Evidence:** `src/game/state/managers/base-manager.js:38-60`: "log(...args) { if (DEV_MODE) { console.log(\`[${this.constructor.name}]\`, ...args); } }"
- **Found by:** errors-specialist

### [S-12] `constants.js` is well-namespaced into frozen domain config blocks
- **Category:** S9 — Configuration discipline
- **Impact:** Medium
- **Explanation:** Despite being 2022 lines, `constants.js` is organized into 50+ named, often `Object.freeze()`-wrapped blocks (`SHIP_CONFIG`, `COMBAT_CONFIG`, `NEGOTIATION_CONFIG`, `EVENT_NAMES`, `KARMA_CONFIG`, etc.) with section headers. The single-file design is documented as a deliberate trade-off — and the discipline that "ALL magic numbers go in constants.js" is enforceable because there is exactly one place to put them.
- **Evidence:** `src/game/constants.js:1-10, 1858, 2017`: "Single-file design: all constants live here deliberately. ... export const EVENT_NAMES = Object.freeze({ ..."
- **Found by:** errors-specialist (verifier disagreed with structure-specialist who flagged this as a flaw)

### [S-13] Ship-name input sanitization with HTML stripping and length cap
- **Category:** S10 — Security built-in
- **Impact:** Medium
- **Explanation:** `sanitizeShipName` strips HTML tags, length-caps, then trims, with a sane default fallback. Defense-in-depth: even raw ship names would be safe in JSX, but the sanitizer adds a belt-and-suspenders layer.
- **Evidence:** `src/game/utils/string-utils.js:19-31`: ".replace(/<[^>]*>/g, '').substring(0, SHIP_CONFIG.MAX_NAME_LENGTH).trim();"
- **Found by:** security-specialist

### [S-14] System ID validation against authoritative star data on every navigation transition
- **Category:** S10 — Security built-in
- **Impact:** Medium
- **Explanation:** `NavigationManager.dock()` and jump completion both look up the target system in `starData` and throw on miss, preventing silent corruption from tampered or stale save data.
- **Evidence:** `src/game/state/managers/navigation.js:50-55, 92-102`: "if (!system) { throw new Error(\`Invalid system ID: ${newSystemId} not found in star data\`); }"
- **Found by:** security-specialist

### [S-15] No dangerous DOM/JS primitives anywhere in source
- **Category:** S10 — Security built-in
- **Impact:** Medium
- **Explanation:** Zero occurrences of `eval(`, `new Function(`, `innerHTML =`, or `dangerouslySetInnerHTML` in `src/`. The only dynamic data path is `JSON.parse(localStorage)`, which is then validated structurally before use. No external URLs or API tokens in source.
- **Evidence:** `src/game/state/save-load.js:67`: "const loadedState = JSON.parse(saveData);" (only dynamic-data sink)
- **Found by:** security-specialist

### [S-16] Exceptionally strong test coverage with property-based fuzzing
- **Category:** S11 — Testability & coverage
- **Impact:** High
- **Explanation:** 441 test files for 171 source files (≈2.5× ratio). Critical paths are explicitly covered: save/load round-trip, every migration version, state validators, seeded RNG determinism, jump validation, ship-name sanitization fuzzing. Property tests use `fast-check` with random HTML/script-tag inputs to fuzz the sanitizer.
- **Evidence:** `tests/property/ship-name-sanitization-dialog.property.test.jsx:32-60`: "fc.string().map((s) => \`<script>${s}</script>\`)"
- **Found by:** security-specialist

## Flaws/Risks

### [F-1] `coordinatorRef` capability leaks the entire coordinator into two managers — bypasses capability discipline
- **Category:** 6 — Leaky abstraction / 13 — Inconsistent boundaries / 23 — DI misuse
- **Impact:** High
- **Explanation:** `InfoBrokerManager` and `DialogueManager` receive `coordinatorRef: this` and use it to call `getState()` directly (info-broker) or to pass the whole coordinator into a static engine (`showDialogue(npcId, nodeId, this.capabilities.coordinatorRef)`). This re-introduces exactly the unrestricted-state-access pattern the capability-injection refactor was designed to remove. `capabilities.js` itself flags both cases as "documented coupling that will be addressed if [the engine] is refactored separately."
- **Evidence:**
  - `src/game/state/managers/info-broker.js:40, 67` (`purchaseIntelligence`, `generateRumor`): "const state = this.capabilities.coordinatorRef.getState();"
  - `src/game/state/managers/dialogue.js:89-92, 122-125` (`startDialogue`, `selectDialogueChoice`): "showDialogue(npcId, nodeId, this.capabilities.coordinatorRef);"
- **Found by:** structure-specialist, coupling-specialist (×2)

### [F-2] Static legacy classes (`InformationBroker`, dialogue engine) directly mutate raw `gameState`
- **Category:** 6 — Leaky abstraction
- **Impact:** High
- **Explanation:** `InformationBroker.purchaseIntelligence` mutates `gameState.player.credits` and `gameState.world.priceKnowledge` directly from a class of static methods, bypassing every manager boundary defined in `capabilities.js`. The `InfoBrokerManager` "wrapper" hands it the raw state via `coordinatorRef.getState()`, then itself writes `state.stats.rumorsPurchased = purchaseCount + 1` outside any capability callback. This is the residue of the pre-refactor architecture.
- **Evidence:**
  - `src/game/game-information-broker.js:110-118` (`purchaseIntelligence`): "gameState.player.credits -= cost; ... gameState.world.priceKnowledge[systemId] = { ... };"
  - `src/game/state/managers/info-broker.js:67-74`: "state.stats.rumorsPurchased = purchaseCount + 1;"
- **Found by:** coupling-specialist

### [F-3] Game-rule probability logic duplicated in UI panels
- **Category:** 25 — Business logic in UI / 28 — Magic numbers
- **Impact:** High
- **Explanation:** `CombatPanel.calculateCombatProbabilities` and `NegotiationPanel.calculateNegotiationProbabilities` re-implement karma scaling, engine penalty, quirk/upgrade bonuses, and faction modifiers — logic that the corresponding managers also compute for actual encounter resolution. Drift risk: the UI display can disagree with the engine outcome. `NegotiationPanel` even drifts via a `?? 0.0005` literal fallback for `KARMA_CONFIG.SUCCESS_RATE_SCALE`.
- **Evidence:**
  - `src/features/danger/CombatPanel.jsx:501-611` (`calculateCombatProbabilities`): "const karmaModifier = karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;"
  - `src/features/danger/NegotiationPanel.jsx:405-454`: "const karmaModifier = karma * (KARMA_CONFIG.SUCCESS_RATE_SCALE ?? 0.0005);"
- **Found by:** errors-specialist

### [F-4] No transactional boundary across compound jump action
- **Category:** 26 — Poor transactional boundaries / 19 — State consistency
- **Impact:** High
- **Explanation:** `executeJump` performs three sequential mutations (`updateFuel`, `updateTime`, `updateLocation`) plus ship-condition degradation, then triggers a save. Each mutation emits its own event and runs cascading downstream effects (e.g., `updateTime` triggers market recovery, debt tick, mission deadlines). If any intermediate step throws (e.g., invalid system ID at `updateLocation`), fuel and time have already been deducted, no rollback exists, and the partial state is debounced to disk. The author's comment ("ensures progress is saved even if animation is interrupted") shows the forward-only semantics are intentional but acknowledges the partial-update window.
- **Evidence:** `src/game/game-navigation.js:452-474` (`executeJump`): "gameStateManager.updateFuel(currentFuel - validation.fuelCost); gameStateManager.updateTime(state.player.daysElapsed + validation.jumpTime); gameStateManager.updateLocation(targetSystemId);"
- **Found by:** integration-specialist

### [F-5] EventsManager.updateTime is a hidden 7-step orchestrator behind a setter-shaped name
- **Category:** 11 — Low cohesion / 13 — Inconsistent boundaries
- **Impact:** Medium
- **Explanation:** `updateTime(newDays)` orchestrates seven cross-domain mutations (price-knowledge staleness, intelligence cleanup, market recovery, event recalculation, price recalculation, loan defaults, mission deadlines, debt tick) behind a setter-shaped name. The complexity is invisible from the call site; this orchestrator role belongs above the domain managers, not inside one.
- **Evidence:** `src/game/state/managers/events.js:95-148` (`updateTime`): "this.capabilities.incrementPriceKnowledgeStaleness(daysPassed); this.capabilities.cleanupOldIntelligence(); this.capabilities.applyMarketRecovery(daysPassed); ... this.capabilities.checkLoanDefaults(); this.capabilities.processDebtTick(); this.capabilities.checkMissionDeadlines();"
- **Found by:** structure-specialist

### [F-6] NPCManager bundles 5 sub-domains (reputation, tips, loans, storage, discounts) — low cohesion
- **Category:** 11 — Low cohesion
- **Impact:** Medium
- **Explanation:** At 814 lines, `NPCManager` covers reputation tier classification, tip selection (with seeded RNG), service discounts, emergency loans (default detection, repayment), and cargo storage with NPCs. These are five distinct lifecycles sharing only "involves an NPC." For comparison, the encounter system was split into five managers (Combat, Negotiation, Inspection, Distress, MechanicalFailure) at similar cumulative size.
- **Evidence:** `src/game/state/managers/npc.js:49-58 (rep tiers), 246-271 (tips), 283-309 (discounts), 403-451 (loans), 600-700 (storage)`
- **Found by:** structure-specialist

### [F-7] Top-level `src/game/game-*.js` modules duplicate manager taxonomy (legacy parallel layer)
- **Category:** 13 — Inconsistent boundaries / 22 — Configuration sprawl
- **Impact:** Medium
- **Explanation:** Static legacy classes (`TradingSystem`, `InformationBroker`, `EconomicEventsSystem`, `NavigationSystem`, dialogue engine) live at `src/game/game-*.js` (often 500+ lines each) and are imported by both managers and feature components. This creates two parallel surface areas — managers wrap them, but feature components also reach in directly, making it unclear which file owns a given trading or navigation rule.
- **Evidence:**
  - `src/game/state/managers/trading.js:2`: "import { TradingSystem } from '../../game-trading.js';"
  - `src/features/cargo/CargoManifestPanel.jsx:4`: "import { TradingSystem } from '../../game/game-trading.js';"
- **Found by:** structure-specialist

### [F-8] Two co-existing save/load implementations with divergent semantics
- **Category:** 22 — Configuration sprawl / 24 — Inconsistent contracts / 34 — Inconsistent error conventions
- **Impact:** Medium
- **Explanation:** `src/game/state/save-load.js` (functional, debounced via 1-second floor, uses `console.error`/`devLog`) and `src/game/state/managers/save-load.js` (class-based, debounced via `markDirty` timer, uses `BaseManager.error` and emits `SAVE_FAILED`) coexist. `SaveLoadManager.saveGame()` delegates to the older path, while `_forceSave()` writes localStorage inline. The two paths have different error severity, return shapes, and UI surfacing.
- **Evidence:**
  - `src/game/state/save-load.js:22-46` (`saveGame`): "if (now - lastSaveTime < UI_CONFIG.SAVE_DEBOUNCE_MS) { devLog('Save debounced...'); return { success: false, ... }; }"
  - `src/game/state/managers/save-load.js:75-93` (`_forceSave`): "localStorage.setItem(SAVE_KEY, saveData); ... } catch (error) { this.error('Save failed — game progress may be lost', error); ..."
- **Found by:** integration-specialist, errors-specialist (×2)

### [F-9] localStorage write has no quota-specific recovery path
- **Category:** 19 — Lack of idempotency / 30 — Security as afterthought
- **Impact:** Medium
- **Explanation:** `_forceSave` catches all errors generically and emits a single `SAVE_FAILED` event. `QuotaExceededError` (the most likely real-world failure for a long-running save) is not distinguished from network/serialization errors, and no remediation (compress, prune, partial save) is offered. AGENTS.md explicitly lists "Handle localStorage quota exceeded errors" as a security consideration.
- **Evidence:** `src/game/state/managers/save-load.js:75-93` (`_forceSave`): "} catch (error) { this.error('Save failed — game progress may be lost', error); this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, ...);"
- **Found by:** integration-specialist, security-specialist

### [F-10] Diffuse ownership of `state.ship.*` — multiple writers bypass `ShipManager`
- **Category:** 17 — No clear ownership of data
- **Impact:** Medium
- **Explanation:** `DevAdminPanel.jsx` mutates `ship.hiddenCargo` directly from the React layer. `GameCoordinator.setShipEngine` writes `this.state.ship.engine = value` directly inside an injected callback rather than going through `ShipManager`. The capability-injection ownership table claims `ShipManager` owns ship.engine and quirks/upgrades, but at least 3-4 writers bypass it.
- **Evidence:**
  - `src/features/dev-admin/DevAdminPanel.jsx:297-298, 319-321`: "ship.hiddenCargo = updatedHidden;"
  - `src/game/state/game-coordinator.js:431-438`: "setShipEngine: (value) => { this.state.ship.engine = value; this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, ...); }"
- **Found by:** integration-specialist

### [F-11] Inconsistent return-shape contracts across manager API
- **Category:** 24 — Inconsistent API contracts
- **Impact:** Medium
- **Explanation:** Within a single manager, validation returns `{valid, reason}` while the corresponding mutation returns `{success, reason}` (e.g., `RefuelManager.validateRefuel` vs `refuel`). Across managers, shapes diverge further: `{success}`, `{success, error}`, `{success, repairedPercent, message}`, bare boolean for `saveGame`, plus `{success, newLastSaveTime}` for the legacy save path. Callers must memorize per-method conventions.
- **Evidence:** `src/game/state/managers/refuel.js:70-107, 138, 164`: "return { valid: true, reason: null, cost: totalCost }; ... return { success: true, reason: null };"
- **Found by:** integration-specialist, errors-specialist

### [F-12] Trade validation rules duplicated between `tradeUtils.js` and `TradingManager`
- **Category:** 25 — Business logic in UI / 34 — Inconsistent error conventions
- **Impact:** Medium
- **Explanation:** `tradeUtils.validateBuy` (UI layer) enforces credit, capacity, and quantity rules and is called from `TradePanel.jsx`; `TradingManager.buyGood` re-validates the same constraints. Beyond the duplication, the human-readable reasons differ ("Insufficient credits for purchase" vs "Insufficient credits"), so the same failure surfaces with different messages depending on whether the UI pre-checked.
- **Evidence:**
  - `src/features/trade/tradeUtils.js:21-56` (`validateBuy`): "{ valid: false, reason: 'Insufficient credits for purchase' }"
  - `src/game/state/managers/trading.js:30-42` (`buyGood`): "{ success: false, reason: 'Insufficient credits' }"
- **Found by:** errors-specialist

### [F-13] Magic-number game-rule decisions in UI components
- **Category:** 28 — Magic numbers / 25 — Business logic in UI / 22 — Configuration sprawl
- **Impact:** Medium
- **Explanation:** Despite `constants.js` being 2022 lines and the explicit "ALL magic numbers must go in `constants.js`" rule, several UI files embed unnamed numeric thresholds that drive game-rule classifications: a `0.25` pirate-chance cutoff for "high risk" styling in `JumpDialog`; security-level breakpoints `2.0/1.5/1.0/0.5` in `InspectionPanel`; a `0.001` "is karma significant" threshold repeated in `CombatPanel` and `NegotiationPanel`; the `?? 0.0005` fallback already noted under F-3.
- **Evidence:**
  - `src/features/navigation/JumpDialog.jsx:71`: "const isHighRisk = dangerZone === 'dangerous' || pirateChance > 0.25;"
  - `src/features/danger/InspectionPanel.jsx:416-422`: "if (securityLevel >= 2.0) return 'Maximum'; if (securityLevel >= 1.5) return 'High';"
- **Found by:** errors-specialist

### [F-14] Save migration chain has no validation between steps
- **Category:** 24 — Contract robustness
- **Impact:** Medium
- **Explanation:** `_applyMigrations` runs migrations sequentially keyed on `meta.version`, but does not call `validateStateStructure` between steps. A buggy migration produces silently corrupt input to the next migration; final structural validation happens once after the full chain.
- **Evidence:** `src/game/state/game-coordinator.js:627-643` (`_applyMigrations`): "let migrated = state; for (const [version, migrateFn] of MIGRATIONS) { if (migrated.meta.version === version) { migrated = migrateFn(migrated); } }"
- **Found by:** integration-specialist

### [F-15] Cross-feature imports inside `src/features/` — feature directories are not leak-free
- **Category:** 3 — Tight coupling / 13 — Inconsistent boundaries
- **Impact:** Medium
- **Explanation:** Feature modules reach into sibling features rather than going through `components/` or a shared submodule: `trade/TradePanel.jsx` imports from `danger/inspectionUtils.js`; `narrative/NarrativeEventPanel.jsx` imports from `danger/applyEncounterOutcome.js`; `navigation/SystemPanel.jsx` imports from `danger/DangerWarningDialog`; `dev-admin/DevPanelPreview.jsx` imports 7+ panels from `danger/`; `station/PanelContainer.jsx` imports from 7 sibling features. The `station/PanelContainer` case is composition-root-acceptable; the `trade→danger` and `narrative→danger` cases are real leaks.
- **Evidence:**
  - `src/features/trade/TradePanel.jsx:25`: "import { isGoodRestrictedInZone } from '../danger/inspectionUtils.js';"
  - `src/features/narrative/NarrativeEventPanel.jsx:4`: "import { applyEncounterOutcome } from '../danger/applyEncounterOutcome.js';"
- **Found by:** verifier (specialist 1's claim of zero cross-feature imports was directly falsified)

### [F-16] Boundary error handlers swallow exceptions without recovery or notification
- **Category:** 20 — Weak error handling / 21 — No observability
- **Impact:** Medium
- **Explanation:** Several user-facing async paths log to console and silently abandon the operation. `JumpDialog.handleJump` and `useEncounterOrchestration` both `console.error(...)` and revert UI state without telling the user what happened. Unlike the `SAVE_FAILED` path (S-10), there is no event-emission or notification channel for these failures. The `ErrorBoundary` catches render errors but not async/event-handler failures.
- **Evidence:**
  - `src/features/navigation/JumpDialog.jsx:87-89`: "} catch (error) { console.error('Jump failed:', error); }"
  - `src/hooks/useEncounterOrchestration.js:102-108, 191-198`: "} catch (error) { console.error('Flee resolution failed:', error); setCurrentEncounter(null); ... setViewMode(VIEW_MODES.ORBIT); }"
- **Found by:** errors-specialist

### [F-17] Module-level mutable singletons in graph utility and Three.js engine modules
- **Category:** 1 — Global mutable state
- **Impact:** Medium
- **Explanation:** `wormhole-graph.js` keeps `adjacencyMap`, `shortestPaths`, `starNameMap`, `starByIdMap` as module-level mutable lets, with a `_resetCacheForTesting` exported to undo them. `interaction.js` keeps `selectedStar`, `currentSystemIndicator`, `currentSystemMaterial` similarly. This is documented as a deliberate cache, but ties tests to module reset and prevents instancing.
- **Evidence:**
  - `src/game/utils/wormhole-graph.js:6-9, 198-207`: "let adjacencyMap = null; let shortestPaths = null; ... export function _resetCacheForTesting() { adjacencyMap = null; ... }"
  - `src/game/engine/interaction.js:4-7`: "let selectedStar = null; let currentSystemIndicator = null; let currentSystemMaterial = null;"
- **Found by:** structure-specialist

### [F-18] Hidden side effects in `modify`/`record`-shaped methods
- **Category:** 12 — Hidden side effects
- **Impact:** Low
- **Explanation:** `DangerManager.modifyKarma` (sounds like a setter) also increments `stats.charitableActs`, calls `checkAchievements()`, emits `KARMA_CHANGED`, and `markDirty()`s state — five side effects in a "modify" call. `TradingManager.recordVisitedPrices` reads as passive but writes price knowledge, emits events, and `markDirty()`s. The achievement check chained inside `modifyKarma` is invisible from the call site.
- **Evidence:** `src/game/state/managers/danger.js:101-119` (`modifyKarma`): "this.capabilities.setKarma(newKarma); ... this.capabilities.checkAchievements(); this.capabilities.markDirty();"
- **Found by:** errors-specialist

### [F-19] Order-dependent forward references in coordinator constructor
- **Category:** 27 — Temporal coupling
- **Impact:** Low
- **Explanation:** Capability arrows reference `this.shipManager.x` (line 109), `this.dangerManager.x` (line 136), etc., from inside `StateManager`/`TradingManager` constructors that run BEFORE those managers are assigned. This works because the arrows are lazy (called later), but is fragile to constructor reordering — an accidental eager call during construction would silently throw.
- **Evidence:** `src/game/state/game-coordinator.js:109, 124, 136, 153`: "getFuelCapacity: () => this.shipManager.getFuelCapacity()" (at L109; shipManager assigned at L153)
- **Found by:** coupling-specialist

### [F-20] Dynamic `import()` of dialogue engine on hot path
- **Category:** 5 — Circular deps (alleged) / 8 — Premature optimization
- **Impact:** Low
- **Explanation:** `DialogueManager.startDialogue` and `selectDialogueChoice` use `await import('../../game-dialogue.js')` on every call. The comment claims this avoids circular dependencies, but `game-dialogue.js` doesn't actually import `dialogue.js` — there is no static cycle. Each dialogue interaction pays a module-resolution cost for no real reason, and the same call already passes `coordinatorRef`, weakening the cycle excuse further.
- **Evidence:** `src/game/state/managers/dialogue.js:87, 120`: "const { showDialogue } = await import('../../game-dialogue.js');"
- **Found by:** coupling-specialist

### [F-21] `useGameEvent` reads `game.getState()` — Bridge rule violated by the bridge itself
- **Category:** 6 — Leaky abstraction
- **Impact:** Low
- **Explanation:** CLAUDE.md states components must never call `GameCoordinator.getState()` directly. The bridge hook itself does so to compute the initial value via `extractStateForEvent`. Pragmatic for initial render, but the rule is stated absolutely and any new event requires updating `EVENT_STATE_MAP` in `constants.js` — coupling the event registry to React-side extraction logic.
- **Evidence:** `src/hooks/useGameEvent.js:33-35, 70-82`: "const currentState = game.getState(); return extractStateForEvent(eventName, currentState);"
- **Found by:** coupling-specialist

### [F-22] Cross-cutting `checkAchievements()` + `markDirty()` repetition (shotgun-surgery seam)
- **Category:** 9 — Shotgun surgery
- **Impact:** Low
- **Explanation:** Most state-changing manager methods end with the trio `updateStats(...)` (where applicable) + `checkAchievements()` + `markDirty()` + `emit(...)`. This is repeated across 10+ managers; the pattern is a typical aspect-oriented seam being implemented as cross-call duplication. Adding a new achievement category or mutation path requires remembering to wire the calls into every relevant manager.
- **Evidence:**
  - `src/game/state/managers/danger.js:117-118`: "this.capabilities.checkAchievements(); this.capabilities.markDirty();"
  - `src/game/state/managers/navigation.js:78-79`: "this.capabilities.checkAchievements(); this.capabilities.markDirty();"
- **Found by:** structure-specialist

## Coverage Checklist

### Flaw/Risk Types 1–34

| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Observed | F-17 |
| 2 | God object | Not observed | — (S-4 confirms intentional facade) |
| 3 | Tight coupling | Observed | F-15 |
| 4 | High/unstable dependencies | Not observed | — |
| 5 | Circular dependencies | Not observed | — (F-20 is dynamic import, not actual cycle) |
| 6 | Leaky abstractions | Observed | F-1, F-2, F-21 |
| 7 | Over-abstraction | Not observed | — |
| 8 | Premature optimization | Observed (minor) | F-20 |
| 9 | Shotgun surgery | Observed | F-22 |
| 10 | Feature envy / anemic domain model | Not assessed | (specialist finding dropped at 65% confidence) |
| 11 | Low cohesion | Observed | F-5, F-6 |
| 12 | Hidden side effects | Observed | F-18 |
| 13 | Inconsistent boundaries | Observed | F-1, F-7, F-15 |
| 14 | Distributed monolith | Not applicable | (single-process browser app) |
| 15 | Chatty service calls | Not applicable | (no networked services) |
| 16 | Sync-only integration | Not applicable | (no networked services) |
| 17 | No clear ownership of data | Observed | F-10 |
| 18 | Shared database across services | Not applicable | (single localStorage key) |
| 19 | Lack of idempotency | Observed | F-9 |
| 20 | Weak error handling | Observed | F-16 |
| 21 | No observability plan | Observed (partial) | F-16 |
| 22 | Configuration sprawl | Observed | F-7, F-8, F-13 |
| 23 | Dependency injection misuse | Observed | F-1 |
| 24 | Inconsistent API contracts | Observed | F-8, F-11, F-14 |
| 25 | Business logic in the UI | Observed | F-3, F-12, F-13 |
| 26 | Poor transactional boundaries | Observed | F-4 |
| 27 | Temporal coupling | Observed (minor) | F-19 |
| 28 | Magic numbers/strings everywhere | Observed | F-3, F-13 |
| 29 | "Utility" dumping ground | Not observed | — (S-12) |
| 30 | Security as an afterthought | Observed (minor) | F-9 |
| 31 | Dead code / unused dependencies | Not observed | — (knip-clean per S-16) |
| 32 | Missing or inadequate test coverage | Not observed | — (S-16) |
| 33 | Hard-coded credentials/secrets | Not observed | — (S-15) |
| 34 | Inconsistent error/logging conventions | Observed | F-8 |

### Strength Categories S1–S14

| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed (with caveat) | S-3 (capability boundaries documented); F-15 partially undermines |
| S2 | High cohesion | Observed (with caveat) | S-3; F-5, F-6 are exceptions |
| S3 | Loose coupling | Observed | S-1, S-5 |
| S4 | Dependency direction is stable | Observed | S-1, S-2 |
| S5 | Dependency management hygiene | Observed | S-2, S-3 |
| S6 | Consistent API contracts | Not observed | — (F-11) |
| S7 | Robust error handling | Observed | S-8, S-10 |
| S8 | Observability present | Observed | S-10, S-11 |
| S9 | Configuration discipline | Observed | S-9, S-11, S-12 |
| S10 | Security built-in | Observed | S-13, S-14, S-15 |
| S11 | Testability & coverage | Observed | S-16 |
| S12 | Resilience patterns | Observed | S-6, S-7 |
| S13 | Domain modeling strength | Observed | S-3, S-4 |
| S14 | Simple, pragmatic abstractions | Observed | S-4, S-5, S-12 |

## Hotspots

Top 3 files/directories to focus attention on:

1. **`src/game/game-information-broker.js` and `src/game/game-dialogue.js`** — risk hotspots. Both are pre-refactor static modules that mutate raw `gameState` and are exposed to managers via `coordinatorRef`. They are the primary residue of the GSM Refactor and the source of F-1 and F-2 (both High impact).
2. **`src/features/danger/CombatPanel.jsx` and `NegotiationPanel.jsx`** — risk hotspots. Re-implementations of encounter probability math living in JSX, with at least one drift point (`?? 0.0005`). Source of F-3 (High) and F-13 (Medium).
3. **`src/game/state/managers/save-load.js` + `src/game/state/save-load.js` + `src/game/state/game-coordinator.js` save/load surface** — mixed hotspot. Strengths S-7 (versioned migrations) and S-10 (failure-event surfacing) coexist with F-8 (dual implementations), F-9 (no quota path), and F-14 (no inter-step validation). The single largest concentration of both architectural strength and architectural debt in the codebase.

Honourable mention strong-core hotspot: **`src/game/state/capabilities.js`** — a JSDoc-only file that is effectively the contract for the entire engine. Worth protecting from accidental knip removal (it has no runtime exports).

## Next Questions

1. The `coordinatorRef` capability is acknowledged in `capabilities.js` as a deliberate temporary leak for `InfoBrokerManager` and `DialogueManager` — what was the scope/cost estimate that kept those two engines outside the refactor? What concretely is needed to drop the leak, and is the work bounded enough to schedule?
2. The legacy `src/game/game-*.js` parallel layer is imported by both managers AND feature components — was the GSM Refactor's exit criteria "managers exist" rather than "managers are the only callers"? Which feature-side imports of `TradingSystem`/`NavigationSystem` are intentional vs. residual?
3. `executeJump` deliberately commits fuel/time/location forward-only ("ensures progress is saved even if animation is interrupted") — is the current willingness to leave fuel/time deducted on a failed location update the right trade-off, or should the validation move earlier so any failure happens before any mutation?
4. `CombatPanel`/`NegotiationPanel` re-implement the manager's probability math for display — is this intentional duplication (different numbers shown vs applied) or unintentional drift? If intentional, where is the contract that says "display = engine"?
5. `useGameEvent` (the bridge hook) and `EVENT_STATE_MAP` (in `constants.js`) together know how to slice game state by event-name — does it make sense for the React extraction logic to live in `constants.js`, or would moving it next to the hook better reflect ownership?

## Analysis Metadata

- **Agents dispatched:** 5 specialists (structure & boundaries, coupling & dependencies, integration & data, errors & observability, security & code quality) + 1 verifier
- **Scope:** Full repository (`src/` 171 source files; `tests/` 441 test files)
- **Raw findings:** 62 (before verification)
- **Verified findings:** 38 (16 strengths + 22 flaws)
- **Filtered out:** 12 (false positives, low confidence, incorrect category, or contradicted by evidence)
- **Verifier-discovered finding:** 1 (F-15 — cross-feature imports; specialist 1's "zero cross-feature imports" claim was falsified)
- **Cross-specialist agreement (high-confidence merges):** F-1 (`coordinatorRef` leak — 3 findings merged), F-8 (dual save/load — 3 findings merged), F-11 (return-shape inconsistency — 2 findings merged), S-3 (capability contract — 2 findings merged), S-7 (versioned save format — 2 findings merged)
- **By impact:** 4 High strengths, 7 High-impact flaws; 9 Medium strengths/flaws each side; 0 Low strengths, 6 Low flaws
- **Steering files consulted:** `CLAUDE.md`, `AGENTS.md`, `src/game/state/capabilities.js` (in-source contract documentation)
