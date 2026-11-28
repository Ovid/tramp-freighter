# Architecture Report — tramp-freighter

* **Date:** 2026-11-27
* **Model:** Claude Opus 5.5 (claude-opus-5-5)
* **PAAD version:** 2.1.0
* **Commit:** 8c4a8a1a4e12613fb671f61b2a943985a9275095
* **Languages:** JavaScript (ES modules), React 18, Three.js 0.150, Vite 5; Vitest + Testing Library + fast-check
* **Key directories:** `src/game/state/` (coordinator + 25 managers), `src/game/` (domain systems, constants, data, engine), `src/features/` (React panels + pure utils), `src/hooks/` (bridge hooks), `src/context/`, `src/components/`, `tests/` (unit, property, integration)
* **Scope:** full repository

## Repo Overview

Tramp Freighter Blues is a single-player, client-only browser game about trading and surviving in space. It has a 3D starmap of real nearby stars, connected by wormholes. There is no backend. Saves are written to `localStorage`.

Size: 179 source files (~43k lines), 475 test files and 4,671 tests, all passing.

How it is built:
- A `GameCoordinator` singleton (`src/game/state/game-coordinator.js`, 1,657 lines) is both the composition root and the facade.
- It builds 25 domain managers. Each one receives a narrow capability object of closures rather than the coordinator itself.
- React reaches the game through bridge hooks: `useGameEvent` subscribes to a frozen event-name registry, and feature action hooks perform writes.
- Domain logic is split between those managers and older static "System" classes in `src/game/game-*.js`.
- The rules for when encounters fire and what they do are partly spread across React hooks and feature modules.

## Strengths

### [S-1] Capability injection: managers receive narrow closures and never import each other
- **Category:** S1 Clear modular boundaries / S3 Loose coupling
- **Impact:** High
- **Explanation:** Each manager gets only the getters and mutators it needs. All cross-domain wiring is visible in one place, the composition root. No manager imports another manager, and tests can build any manager from a stub object.
- **Evidence:** `src/game/state/game-coordinator.js:113-160` (constructor wiring). Excerpt: "getOwnState: () => ({ priceKnowledge, marketConditions, currentSystemPrices })", "applyTradeWithholding: (totalRevenue) => this.debtManager.applyWithholding(totalRevenue)". SaveLoadManager receives only getFullState, restoreState and emit (117-122).
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Security & Code Quality, Integration & Data

### [S-2] Stable dependency direction: the game core never depends on the UI
- **Category:** S4 Dependency direction is stable
- **Impact:** High
- **Explanation:** Nothing under `src/game` imports React, `features/`, `hooks/` or `context/`. `three` is confined to `src/game/engine` plus the one canvas component.
- **Evidence:** A grep of `src/game/**` for `react`, `features/`, `hooks/` and `context/` returns 0 files. `src/features/navigation/StarMapCanvas.jsx` is the only `three` importer outside the engine.
- **Found by:** Coupling & Dependencies

### [S-3] Broad, deterministic test suite at three levels
- **Category:** S11 Testability & coverage
- **Impact:** High
- **Explanation:** There are unit, property and integration tests. They pass cleanly and have high coverage on the critical managers: debt, trading, combat, navigation, save/load and quests.
- **Evidence:** `tests/` holds 475 files and 4,671 tests, all passing. 108 files use `fc.assert` (mostly with `numRuns: 100`), and 46 are integration tests. Migration tests include `tests/unit/restore-state.test.js` and `save-load-migration.test.js`. A specialist measured coverage at 94% of lines; the verifier did not re-run it.
- **Found by:** Security & Code Quality

### [S-4] Versioned save validation and migration pipeline
- **Category:** S12 Resilience patterns / S7 Robust error handling
- **Impact:** Medium
- **Explanation:** Every save is restored through one path. It returns `{success, reason}` rather than throwing, checks the version, migrates the data through a chain, then validates it and fills defaults.
- **Evidence:** `src/game/state/game-coordinator.js:584-651` (`restoreState`, `_applyMigrations`). The chain runs isVersionCompatible → v1→v5 migrations → NaN-credits repair (598-601) → validateStateStructure → addStateDefaults. `src/game/state/save-load.js:57-75` wraps `JSON.parse` in try/catch.
- **Found by:** Error Handling & Observability, Security & Code Quality, Integration & Data

### [S-5] Trailing debounced save that surfaces failures and flushes on unload
- **Category:** S7 Robust error handling / S12 Resilience patterns
- **Impact:** Medium
- **Explanation:** Changes are written 500ms after they stop. A failed write (quota, private mode) reaches the player as a SAVE_FAILED toast, and any pending write is flushed on `beforeunload`.
- **Evidence:** `src/game/state/managers/save-load.js:34-46` (`markDirty`), `:69-93` (`_forceSave`, which emits `EVENT_NAMES.SAVE_FAILED`), `src/App.jsx:78`, `src/main.jsx:77-81` (`game.flushSave()`).
- **Found by:** Error Handling & Observability, Integration & Data

### [S-6] Seeded randomness in gameplay paths
- **Category:** S9 Configuration discipline / S11 Testability
- **Impact:** Medium
- **Explanation:** Gameplay randomness comes from `SeededRandom` with seeds built from domain values, and resolvers accept an injected rng so tests can force outcomes. `Math.random()` is called directly only for the cosmetic starfield.
- **Evidence:** `src/hooks/useEventTriggers.js:158`: "new SeededRandom(`event-${eventType}-${day}-${system}`)". `src/game/state/managers/mission.js:460` seeds the mission board. `src/game/engine/scene.js:226-254` uses Math.random for the starfield only.
- **Found by:** Error Handling & Observability, Security & Code Quality

### [S-7] Frozen event-name registry with runtime typo detection
- **Category:** S6 Consistent API contracts
- **Impact:** Medium
- **Explanation:** All bus events come from one frozen registry. The bus warns when code subscribes to or emits an unknown name. `useGameEvent` reads its initial value from the same declared state map, so the value a component sees on mount and the event payload refer to the same slice of state.
- **Evidence:** `src/game/constants.js:1911-1989` (`EVENT_NAMES`), `:2002-2069` (`EVENT_STATE_MAP`). `src/game/state/managers/event-system.js:15-22, 55-58, 87-92`. `src/hooks/useGameEvent.js:70-82`.
- **Found by:** Integration & Data, Coupling & Dependencies

### [S-8] Validate-before-mutate result contract, and idempotent reward paths
- **Category:** S6 Consistent API contracts
- **Impact:** Medium
- **Explanation:** Manager mutations finish all their validation before they write anything, and they return `{success, reason}`. The main reward paths cannot pay out twice.
- **Evidence:** `src/game/state/managers/mission.js:86-186` runs every check, then `missions.active.splice(missionIndex, 1)` before paying the reward. `src/game/state/managers/quest-manager.js:87-99` checks `_rewardsClaimedStage >= currentStage`. `debt.js` `borrow` and `makePayment` follow the same validate-first order.
- **Found by:** Integration & Data

### [S-9] Dialogue content reaches the game only through a flat context API
- **Category:** S14 Simple, pragmatic abstractions / S3 Loose coupling
- **Impact:** Medium
- **Explanation:** Dialogue tree data files see a flat object of values plus a whitelist of bound callbacks, never the coordinator, so content authors work against an explicit API. The values are not truly read-only: `npcState` and `cargo` are live references.
- **Evidence:** `src/game/game-dialogue.js:52-98` (`buildDialogueContext`). Excerpt: "advanceQuest: (questId) => gameStateManager.advanceQuest(questId)".
- **Found by:** Structure & Boundaries, Coupling & Dependencies

### [S-10] Declarative, data-driven event and condition model
- **Category:** S13 Domain modeling strength
- **Impact:** Medium
- **Explanation:** Narrative events, danger events and quests are plain data registered with one engine, and their triggers are condition objects rather than code. New content usually means new data, not new logic.
- **Evidence:** `src/game/event-conditions.js:14-60` (`evaluateCondition`, a switch on `CONDITION_TYPES`; an array of conditions means all must hold). `src/game/state/game-coordinator.js:657-662` (`_registerEventEngine` registers `NARRATIVE_EVENTS`, `DANGER_EVENTS`, `ALL_QUESTS`).
- **Found by:** Structure & Boundaries

### [S-11] Feature utility modules are pure
- **Category:** S2 High cohesion
- **Impact:** Medium
- **Explanation:** All ten `src/features/*/*Utils.js` files are pure calculation and validation helpers with no coordinator access, as the convention requires.
- **Evidence:** A grep of the 10 `*Utils.js` files (tradeUtils, refuelUtils, repairUtils, cargoUtils, inspectionUtils, missionRouteUtils, upgradesUtils, infoBrokerUtils, cargoStorageUtils, dangerDisplayUtils) for `getState|useGame|game\.` returns 0 hits.
- **Found by:** Structure & Boundaries

### [S-12] Dependency hygiene
- **Category:** S5 Dependency management hygiene
- **Impact:** Medium
- **Explanation:** There are three runtime dependencies and no static import cycles, and knip, which is wired into `npm run all`, comes back clean.
- **Evidence:** `package.json` runtime deps are `react`, `react-dom` and `three`. `npx knip` exits 0. A Tarjan strongly-connected-components pass over all 179 files found no cycles (specialist analysis). `vite.config.js` `manualChunks` splits the vendor and three.js chunks.
- **Found by:** Coupling & Dependencies, Security & Code Quality

### [S-13] Layered error containment in the UI and on the event bus
- **Category:** S7 Robust error handling
- **Impact:** Medium
- **Explanation:** Three nested ErrorBoundaries plus a fatal screen that renders without React catch render and initialisation failures. Each event-bus subscriber runs in its own try/catch, so one failing subscriber cannot break the others.
- **Evidence:** `src/App.jsx:405, 430, 512` (`<ErrorBoundary>`). `src/components/ErrorBoundary.jsx:58-61`. `src/main.jsx` `renderErrorUI`. `src/game/state/managers/event-system.js:94-100`: "forEach((callback) => { try { callback(data); } catch (error) { console.error(...) } })".
- **Found by:** Error Handling & Observability, Integration & Data

### [S-14] Prefixed, DEV-gated manager logging
- **Category:** S8 Observability present (partial)
- **Impact:** Low
- **Explanation:** Every manager inherits log, warn and error methods that prefix the class name and gate debug output on dev mode. This is a consistent baseline for a client-only game.
- **Evidence:** `src/game/state/managers/base-manager.js:38-60`: "console.log(`[${this.constructor.name}]`, ...)". `src/game/utils/dev-logger.js`.
- **Found by:** Error Handling & Observability

### [S-15] Pure math and graph modules, separate from scene and state
- **Category:** S1 Clear modular boundaries / S14 Simple, pragmatic abstractions
- **Impact:** Low
- **Explanation:** Picking, scaling and label-decluttering math, and the wormhole adjacency and shortest-path graph, are free functions over static data with small APIs.
- **Evidence:** `src/game/utils/wormhole-graph.js:6-129` (lazy `ensureInitialized()`, BFS paths). `src/game/engine/starmap-math.js` (123 lines; imports only THREE and constants).
- **Found by:** Structure & Boundaries

## Flaws/Risks

### [F-1] A failed or corrupt load silently becomes a new game, and the next write overwrites the old save
- **Category:** 20 Weak error handling strategy (also 26, 32)
- **Impact:** High
- **Explanation:** When a save is rejected (JSON parse failure, incompatible version, failed validation), the game starts a new one and logs only in dev mode. The title screen still offers Continue, because it checks only that the storage key exists. Continue ignores the failed load, skips ship naming and drops the player into the fresh state. The first `markDirty()` then overwrites the unreadable save. No test covers this path from the player's side.
- **Evidence:**
  - `src/main.jsx:67-74`: `loadGame()` falls back to `initNewGame()`.
  - `src/game/state/managers/save-load.js:151`: `this.log(result.reason)` is DEV-gated.
  - `src/features/title-screen/TitleScreen.jsx:29` and `src/game/state/save-load.js:83-87`: `hasSavedGame()` only checks that the key exists.
  - `src/App.jsx:229-242` (`handleStartGame`): "game.loadGame();" with the return value unused, followed by `setViewMode(VIEW_MODES.ORBIT)`.
- **Found by:** Error Handling & Observability, Security & Code Quality, Integration & Data
- **Status:** Fixed
- **Status reason:** SaveLoadManager now records why a save was rejected (`getLoadError()`, cleared on a successful load or write). The title screen shows that reason in place of Continue, so the player is never dropped into a fresh game that later overwrites the save; New Game still confirms before replacing it.
- **Status date:** 2026-11-27 11:47 UTC
- **Status commit:** 511f3fc

### [F-2] The encounter and event trigger pipeline lives in a React hook and depends on emit order
- **Category:** 13 Inconsistent boundaries (also 27 Temporal coupling)
- **Impact:** High
- **Explanation:** A hook decides when encounters fire and what they contain: seeds, pre-rolled failures and distress calls, threat level, credit demand, the victory guard and the fallback to condition events. Encounters therefore happen only while the hook is mounted, and these rules cannot be tested without React. `executeJump` emits fuel, then time, then location, then condition, so the hook's TIME_CHANGED handler runs while `currentSystem` is still the origin system and before jump wear is applied. A second hook holds the threat escalation table and mutates the encounter object stored in React state.
- **Evidence:**
  - `src/hooks/useEventTriggers.js:29-112, 146-213`, including the `lastSystemRef` skip-first heuristic. TIME_CHANGED handler at 237-241: "handleTrigger('time', { system: gameState.player.currentSystem })".
  - `src/game/game-navigation.js:455-470` (emit order).
  - `src/hooks/useEncounterOrchestration.js:153-166` (`THREAT_ESCALATION`, `currentEncounter.encounter.threatLevel = ...`).
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Error Handling & Observability
- **Status:** Fixed
- **Status reason:** New EncounterTriggerManager (game layer) owns all trigger rules; it subscribes to dock, time and debt-cleared events, and executeJump calls it explicitly after location and jump wear are applied, so jump checks (including the jump's time check) see the destination and the worn ship (developer-approved behaviour change). The LOCATION_CHANGED skip-first heuristic and useEventTriggers hook are gone; trigger errors are logged and cannot fail a jump. After a jump the condition fallback (low fuel, hull damage) runs only when neither the time nor the jump check fires, so it never hides a time narrative or covers an encounter (developer-approved behaviour change; pinned in encounter-trigger-manager.test.js). Dev teleport no longer rolls arrival encounters or narratives, since it is not a jump; the dev panel triggers each encounter directly (developer-approved). Threat escalation is a pure escalateEncounter() with its table in constants, and the hook stores the escalated copy instead of mutating React state.
- **Status date:** 2026-11-27 12:22 UTC
- **Status commit:** 790f521

### [F-3] The combat odds shown to the player differ from the odds the resolver uses
- **Category:** 25 Business logic in the UI (also 9 Shotgun surgery)
- **Impact:** High
- **Explanation:** Two panels each recompute the evasion chance themselves, and both disagree with the manager. They add an engine penalty the resolver never applies, and they leave out the encounter's `strengthModifier`, which the resolver subtracts. Displayed odds are too low when the engine is degraded and too high after an escalation.
- **Evidence:**
  - `src/features/danger/CombatPanel.jsx:517-560` and `src/features/danger/PirateEncounterPanel.jsx:395-458`: "if (engine < COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD) evasiveChance += COMBAT_CONFIG.ENGINE_PENALTY_VALUE". No manager references `ENGINE_PENALTY_*`.
  - `src/game/state/managers/combat.js:75-91` (`resolveEvasiveManeuvers`): "successChance -= encounter.strengthModifier || 0".
- **Found by:** Error Handling & Observability
- **Status:** Fixed
- **Status reason:** CombatManager.getCombatOdds and NegotiationManager.getNegotiationOdds compute every chance once; the resolvers roll against the same helpers and both panels display them through the facade. The resolver now applies the worn-engine evasion penalty (developer's design call); the display now includes escalation strength and the sensitive_sensors bonus. Both panel-side calculations were deleted, and NegotiationPanel's own karma calculation was replaced by getNegotiationOdds, which now returns each chance with its displayed modifiers.
- **Status date:** 2026-11-27 11:57 UTC
- **Status commit:** eea25c5

### [F-4] Encounter and narrative outcomes are applied from feature code, one call at a time, partly on live state
- **Category:** 13 Inconsistent boundaries (also 10, 26, 6)
- **Impact:** Medium
- **Explanation:**
  - A 213-line module in the features layer applies outcomes as about 15 separate facade calls, including domain rules such as rolling unpaid fines into debt and merging salvage into cargo.
  - It mutates a live cargo stack and re-reads hull values on the assumption that `getState()` returns a live reference.
  - If any step throws, the hook logs to the console and returns to ORBIT, so the outcome stays half-applied and the final `markDirty()` never runs.
  - `src/hooks` imports from `src/features`, which inverts the layering.
- **Evidence:**
  - `src/features/danger/applyEncounterOutcome.js`:
    - 66: "game.updateDebt(state.player.debt + unpaid)"
    - 157: shallow copy of the cargo array
    - 185: "existingStack.qty += qtyToAdd"
    - 26-53: hull re-reads
    - 104: vestigial `typeof game.failMissionsDueToCargoLoss === 'function'`
    - 210: `markDirty`
  - `src/hooks/useEncounterOrchestration.js:2-3` (the import), `:102-108, 191-198` (catch and return to ORBIT), `:124` (vestigial `if (game.resolveEncounter)`).
  - `src/features/narrative/NarrativeEventPanel.jsx:36-57` reuses the module without a try/catch and does its own persistence steps.
- **Found by:** Error Handling & Observability, Structure & Boundaries, Coupling & Dependencies, Integration & Data
- **Status:** Fixed
- **Status reason:** Outcome application moved from the features layer into OutcomeManager behind game.applyEncounterOutcome(), called by both the encounter hook and the narrative panel; capabilities route through the facade. Writes keep their existing order, now documented and tested (restricted/hidden cargo before mission failure, rewards after the time tick that can expire mission cargo). Salvage merges into new stack objects instead of mutating the live stack, ship condition costs are applied in one write, and the vestigial resolveEncounter/failMissionsDueToCargoLoss guards are gone. Not made atomic: rethink showed the realistic throw sites are inside the writes and several writers already mark the save dirty, so compute-first would not prevent half-application and would have resurrected expired mission cargo. The hook still imports the display-only transformOutcomeForDisplay from features (backlogged); the narrative panel keeps its own flag/fired/cooldown/save steps by developer choice.
- **Status date:** 2026-11-27 12:33 UTC
- **Status commit:** 879b995


### [F-5] The documented state-slice ownership is not enforced
- **Category:** 6 Leaky abstractions (also 17 No clear ownership of data, 23 DI misuse)
- **Impact:** Medium
- **Explanation:**
  - `getState()` returns the live, mutable state root.
  - Several slices have more than one writer: cargo, credits, stats, fuel and NPC state.
  - The UI writes to state directly.
  - Two managers are given the whole coordinator (`coordinatorRef: this`), which defeats the capability model. As a result, credits can change without going through `updateCredits`.
- **Evidence:**
  - `src/game/state/managers/state.js:24-26` returns `getFullState()` unchanged.
  - `src/game/state/capabilities.js:47-48` claims "Each manager's getter returns ONLY its specific paths". In practice `game-coordinator.js:154` gives ShipManager `getOwnState: () => this.state.ship`.
  - ShipManager writes slices it does not own: `ship.js:270-271` writes `ship.fuel` and emits FUEL_CHANGED; `ship.js:623, 736` splice `ship.cargo`.
  - Other writers of stats and cargo:
    - `mission.js:69-76`: `cargo.push(...)`.
    - `navigation.js:71-73`: `stats.jumpsCompleted++`.
    - The `updateStats` closure is copy-pasted 3 times, at `game-coordinator.js:143, 395, 448`.
  - The UI writes directly: `src/App.jsx:236-238` (again near 374-378) does "yumiState.interactions = 0; game.markDirty();".
  - Whole-coordinator injection:
    - `coordinatorRef: this` at `game-coordinator.js:243, 289`.
    - That gives `src/game/game-information-broker.js:112` the live state, and it runs "gameState.player.credits -= cost".
    - `info-broker.js:44` then emits CREDITS_CHANGED by hand.
- **Found by:** Coupling & Dependencies, Integration & Data, Structure & Boundaries
- **Status:** Skipped
- **Status reason:** Deferred after a premise check (rethink, 2026-11-27): every cited bypass re-does the emit and markDirty, and updateCredits adds no validation, so no observable defect was found; impact is structural only (effectively Low). The implied fix (copy or freeze getState) is mis-aimed, because writes leak through live getOwnState/getShipCargo/getStats capability getters. A future fix should route writes through setters instead.
- **Status date:** 2026-11-27 16:20 UTC

### [F-6] Repair, refuel and finance rules are duplicated between UI code and managers
- **Category:** 9 Shotgun surgery (also 25)
- **Impact:** Medium
- **Explanation:** The price the UI shows and the price the manager charges come from two separate copies of the formula, so a pricing change needs edits in both places or the two drift apart. The refuel utility also returns an unrounded float, against the "round at the calculation layer" rule.
- **Evidence:**
  - `src/features/repair/repairUtils.js:12-40` (`calculateRepairCost`, `calculateDiscountedRepairCost`) duplicates `src/game/state/managers/repair.js:30-41` (`getRepairCost`). `validateRepair` (repairUtils.js:105) has no caller outside tests.
  - `src/features/refuel/refuelUtils.js:19-21`: "return amount * pricePerPercent;".
  - `src/features/finance/FinancePanel.jsx:65-71, 149-170` re-derive the early-repayment fee that `src/game/state/managers/debt.js:214-240` computes.
- **Found by:** Structure & Boundaries, Error Handling & Observability
- **Status:** Fixed
- **Status reason:** Repair pricing (fceb628): RepairManager now owns all repair pricing (getRepairAllCost, single-charge repairAll, canAffordStandardRepair), the panel shows manager prices, and the duplicate helpers in repairUtils.js are deleted. This fixed a real defect: with an NPC discount, Repair All could charge more than it showed. The refuel evidence was wrong (costs are always integers). Finance (this commit): DebtManager.quotePayment computes what makePayment will pay and charge, including reduce-to-fit, and makePayment uses it. getPaymentFee and a single isEarlyRepayment replace the duplicated fee and window rules. FinancePanel labels its tier buttons with game.getDebtPaymentFee and Pay All with game.quoteDebtPayment, so it no longer computes fees. A 200-run property test confirmed Pay All matches the panel's old formula exactly. A float edge both copies shared (33/1.1) is logged in docs/backlog.md.
- **Status date:** 2026-11-27 16:39 UTC
- **Status commit:** fceb628, 0f295c0

### [F-7] Jump execution lives in NavigationSystem, outside the manager layer
- **Category:** 13 Inconsistent boundaries (also 3 Tight coupling, 26)
- **Impact:** Medium
- **Explanation:**
  - `executeJump` takes the whole coordinator, calls about 8 of its methods and commits fuel, time and location in separate steps with no rollback.
  - `NavigationManager.updateLocation` changes `currentSystem` before it validates the id.
  - The coordinator holds `navigationSystem` and the UI calls it through the coordinator, so each depends on the other at runtime.
  - A dead `uiManager` parameter and about 40 lines of panel show/hide code are left from before the React migration.
- **Evidence:**
  - `src/game/game-navigation.js:413-529` (`executeJump(gameStateManager, ...)`); `:475` "gameStateManager.saveGame()"; `:474-523` (`uiManager`).
  - `src/game/state/managers/navigation.js:28-55`: mutates, then throws at 51.
  - `src/main.jsx:62-64`.
  - `src/hooks/useNavigationActions.js:15`: `game.navigationSystem.executeJump`.
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data
- **Status:** Fixed
- **Status reason:** Jump execution moved into NavigationManager.executeJump. It validates through a narrow validateJump capability and commits fuel, time, location and wear through capabilities. GameCoordinator.executeJump calls the manager and then plays the attached animation. The hook now calls game.executeJump(id). NavigationSystem.executeJump is deleted, along with the dead uiManager panel code and the redundant saveGame() (updateLocation already calls markDirty). updateLocation now checks the id before mutating. This can't be reached in play, because validateJump rejects unknown ids first. NavigationSystem keeps only its pure calculations. Not changed: main.jsx still builds the NavigationSystem and injects it.
- **Status date:** 2026-11-27 16:23 UTC
- **Status commit:** 2e0019b

### [F-8] Player-facing failures are swallowed into console output, and load recovery branches on error text
- **Category:** 20 Weak error handling strategy (also 34)
- **Impact:** Medium
- **Explanation:**
  - When encounter or flee resolution fails, the error is logged to the console and the player is sent back to ORBIT with no message.
  - Dialogue errors are caught inside the hook, so the panel's own catch blocks can never run.
  - A message written for the player goes to `console.warn`.
  - NPC corruption recovery wipes every relationship whenever any error message happens to contain "NPC".
  - `restoreState` swaps in the new state before steps that can still throw, which can leave a half-restored coordinator while `loadGame` returns null.
- **Evidence:**
  - `src/hooks/useEncounterOrchestration.js:102-108, 191-198`.
  - `src/hooks/useDialogue.js:53-61, 79-86`.
  - `src/game/game-dialogue.js:381-392`: "console.warn('An unexpected error occurred…')", next to the comment "In a full implementation, this would use the notification system".
  - `src/game/state/managers/save-load.js:169`: "if (error.message && error.message.includes('NPC'))".
  - `src/game/state/game-coordinator.js:614`: `this.state` is assigned before `_registerEventEngine`, `_emitAllStateEvents` and `checkAchievements`.
- **Found by:** Error Handling & Observability, Integration & Data
- **Status:** Fixed
- **Status reason:** Encounter and dialogue failures now reach the player. A failed encounter resolution is dismissed with an error toast (one helper replaces the two catch blocks). A dialogue that fails to start closes with a message instead of hanging on "Loading dialogue...". A failed choice closes with a message. A dialogue action that throws now returns a warning through selectDialogueChoice, which the panel shows while the conversation continues, replacing the console.warn. The panel's unreachable catch blocks are gone. Not done, deliberately: the save-load "NPC" error-text branch and the half-restore in restoreState. A premise check found no reachable trigger for either, and F-1 already keeps the player on the title screen when a load fails. Completed 2026-11-28 at the developer's request: the "NPC" error-text recovery (handleLoadError, attemptNPCRecovery) is deleted, so any throw during load is reported on the title screen like every other rejected save, and relationships are never wiped because of an error message. restoreState now puts the previous state back and re-emits its events if a step after installing the new state throws, then rethrows so loadGame reports it. The 8 tests of the deleted branch went with it; new tests pin the rollback and the "NPC" message case. The two matching docs/backlog.md entries are removed and DEVELOPMENT.md is updated.
- **Status date:** 2026-11-28 10:40 UTC
- **Status commit:** 2df8c47, cca67a6

### [F-9] The coordinator facade is bypassed even where facade methods exist
- **Category:** 2 God object (facade variant; also 6)
- **Impact:** Medium
- **Explanation:** The project treats the size of the ~180-method facade as intentional. The flaw is that the facade is not the real boundary: hooks and panels reach into the coordinator's internal fields, even for operations the facade already exposes. That couples the UI to those field names.
- **Evidence:**
  - `src/hooks/useDangerZone.js:15`: "game.dangerManager.getDangerZone(systemId)".
  - `src/hooks/useEncounterProbabilities.js:20, 25`: `game.dangerManager.calculate…`. The facade already has these at `game-coordinator.js:1385-1397`.
  - `game.navigationSystem.*` from `src/features/navigation/SystemPanel.jsx:355-372`, `src/features/missions/MissionBoardPanel.jsx:41`, `src/hooks/useJumpValidation.js:25`, `src/hooks/useNavigationActions.js:15`.
- **Found by:** Structure & Boundaries, Coupling & Dependencies
- **Status:** Fixed
- **Status reason:** UI code no longer reads game.navigationSystem or game.dangerManager. The danger hooks use the existing facade methods. New NavigationManager.previewJump validates a jump against live state, and executeJump validates through it, so the numbers the SystemPanel shows (jump info and connections list, via useJumpValidation and game.previewJump) come from the same call that charges the jump. The UI no longer assembles fuel, quirk and condition inputs itself. Route indicators moved from features/missions into NavigationSystem.getRouteIndicator behind game.getRouteIndicator. The facade also gained getConnectedSystems. The useNavigationActions reference went with F-7.
- **Status date:** 2026-11-27 16:28 UTC
- **Status commit:** 4f5b794

### [F-10] Knowledge of the state shape is copied into several hand-maintained lists that have drifted
- **Category:** 9 Shotgun surgery (also 22, 24)
- **Impact:** Medium
- **Explanation:**
  - The default `missions` shape differs between new-game init, `addStateDefaults` and the v5 migration, and `mission.js` patches the gap lazily.
  - The events re-emitted on new game and load leave out several events that `EVENT_STATE_MAP` declares.
  - Save compatibility is a hand-written version chain kept separately from the migration table.
  - Adding one state field means touching around ten places.
- **Evidence:**
  - Default shape: `src/game/state/managers/initialization.js:241-249` (has `completionHistory`); `src/game/state/state-validators.js:918-930, 1035-1042` (does not).
  - Re-emitted events: `src/game/state/game-coordinator.js:678-727` (`_emitAllStateEvents`) leaves out SHIP_NAME_CHANGED, DIALOGUE_CHANGED, NPCS_CHANGED, INTELLIGENCE_CHANGED, CURRENT_SYSTEM_CHANGED and HULL/ENGINE/LIFE_SUPPORT_CHANGED.
  - Version chain: `state-validators.js:167-189` ("GAME_VERSION === '5.0.0'") against MIGRATIONS at `game-coordinator.js:635-641`.
- **Found by:** Structure & Boundaries, Coupling & Dependencies, Integration & Data
- **Status:** Fixed
- **Status reason:** New games, addStateDefaults and the v4.1→v5 migration build missions from one createDefaultMissionState() in state-validators.js, so defaulted and migrated saves now get completionHistory and pendingFailureNotices too (the EVENT_STATE_MAP fallback stays, since constants.js cannot import state-validators.js). The migration table moved to state-validators.js as applyMigrations(); isVersionCompatible is derived from it, so adding a step is the only edit a new save version needs. _emitAllStateEvents now also re-emits SHIP_NAME, DIALOGUE and NPCS (as copies), and a test fails when any EVENT_STATE_MAP event is not re-emitted. CURRENT_SYSTEM_CHANGED and INTELLIGENCE_CHANGED are named exceptions because nothing emits them at all (logged in docs/backlog.md). Previously Skipped 2026-11-27 after a premise check; fixed on the developer's request.
- **Status date:** 2026-11-28 13:10 UTC
- **Status commit:** 64e465b

### [F-11] Two save paths with different semantics, and a docstring that contradicts the code
- **Category:** 24 Inconsistent API contracts (also 22)
- **Impact:** Low
- **Explanation:** `markDirty()` writes 500ms after changes stop. `saveGame()` uses a separate 1s leading throttle that silently drops writes. It returns false both when it was throttled and when it failed, and its docstring says throttled returns true. Non-manager code still calls `saveGame()`, contrary to the steering files.
- **Evidence:** `src/game/state/managers/save-load.js:34-46` (`markDirty`) and `:103-127` (`saveGame`; doc at 103: "True if save succeeded or was debounced"). `src/game/state/save-load.js:22-27`. Callers: `src/game/game-navigation.js:475`, `src/App.jsx:250`, `src/hooks/useGameAction.js:61`.
- **Found by:** Error Handling & Observability, Integration & Data, Structure & Boundaries
- **Status:** Fixed
- **Status reason:** There is one write routine and one deferred path. SaveLoadManager._forceSave writes through the standalone saveGame(state), and the 1 s leading throttle, its lastSaveTime argument and UI_CONFIG.SAVE_DEBOUNCE_MS are deleted. saveGame() now cancels any pending debounced write, writes immediately, and returns true or false honestly. The docstring says so. Managers still use markDirty(). The non-manager callers are gone: game-navigation.js with F-7, App.jsx's call after updateShipName (which already calls markDirty), and the unused saveGame on useGameAction. A premise check found no write that was actually lost, because the only production caller followed a markDirty. The one throttle-only unit test was deleted.
- **Status date:** 2026-11-27 16:34 UTC
- **Status commit:** 1e0eda9

### [F-12] Steering files and in-code docs contradict the code
- **Category:** 22 Configuration sprawl (documentation drift)
- **Impact:** Low
- **Explanation:** CLAUDE.md and DEVELOPMENT.md describe a save call that no manager makes. The capabilities header claims an isolation the wiring does not provide. A constants comment refers to a UIManager that no longer exists.
- **Evidence:**
  - `CLAUDE.md:53` and `DEVELOPMENT.md:208` say "this.gameStateManager.markDirty()". Managers actually call `this.capabilities.markDirty()` (`events.js:146`, `info-broker.js:55`).
  - `src/game/state/capabilities.js:47-48` is contradicted by `game-coordinator.js:154`.
  - `src/game/constants.js:586`: "before creating the UIManager".
- **Found by:** Coupling & Dependencies

### [F-13] A getter with side effects is called during render
- **Category:** 12 Hidden side effects
- **Impact:** Low
- **Explanation:** `getNPCState` creates a default record and calls `markDirty()`, which schedules a save timer. It is called inside `useMemo` during render, so rendering a component can schedule a save.
- **Evidence:** `src/game/state/managers/npc.js:74-98` (`getNPCState` → `this.capabilities.markDirty()`). Called from `src/features/station/StationMenu.jsx:64` and `src/features/endgame/PostCreditsStation.jsx:16`.
- **Found by:** Error Handling & Observability
- **Status:** Fixed
- **Status reason:** New side-effect-free NPCManager.getNPCRep (and facade game.getNPCRep) returns the stored rep, or the NPC's initialRep, without creating a record. StationMenu and PostCreditsStation use it. UAT found three more render-time callers: RefuelPanel, RepairPanel and InfoBrokerPanel reached getNPCState through getServiceDiscount and canGetFreeRepair, so both getters now read rep through getNPCRep. Rendering no longer writes NPC state or schedules a save. getNPCState is unchanged for its write-path callers. Behaviour check: an NPC first seen at a station now gets its record on first real interaction instead of on render. Nothing reads lastInteraction for logic, and the epilogue's trusted-NPC count can't change, because the highest initialRep is 10 (the threshold is 60). Decided by Claude under a delegated session (developer unavailable). Follow-ups: canGetFreeRepair reads lastFreeRepairDay through a new read-only getStoredNPCState, so it never creates a record even for an NPC whose initial rep is Trusted or higher. StationMenu, RepairPanel and PostCreditsStation subscribe to NPCS_CHANGED so tier badges and free repair tiers follow rep changes made while they are open, and the StationMenu and PostCreditsStation useMemos, which never memoized, are gone. requestLoan and checkLoanDefaults now emit NPCS_CHANGED, since they change rep.
- **Status date:** 2026-11-28 11:22 UTC
- **Status commit:** 19f44d7, 8edd047, 6706b0c, 680617d, 30e92bf

### [F-14] Magic numbers in components and managers, and rounding done in JSX
- **Category:** 28 Magic numbers/strings everywhere
- **Impact:** Low
- **Explanation:** Several components hard-code the values of existing constants, so the UI breaks silently when a constant changes. Percentages are also rounded inline in JSX, which contradicts the CLAUDE.md "round at the calculation layer" rule.
- **Evidence:**
  - Hard-coded constants:
    - `src/features/repair/RepairPanel.jsx:557`: "availability.maxHullPercent === 25 ? 'Family' : 'Trusted'", against `NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family` (constants.js:1191).
    - `src/features/missions/MissionCompleteNotifier.jsx:7-13`: 80/60/40/20, against `PASSENGER_CONFIG.SATISFACTION_THRESHOLDS`.
    - `src/features/danger/DangerWarningDialog.jsx:152, 170`: `engine < 50`.
    - `src/game/state/managers/quest-manager.js:323`: `tanakaState.stage !== 2`.
  - Rounding in JSX: `{Math.round(x)}%` in `SystemPanel.jsx:310, 413`, `RefuelPanel.jsx:154, 195`, `CombatPanel.jsx:160, 171`.
- **Found by:** Error Handling & Observability
- **Status:** Fixed
- **Status reason:** The three components that hard-coded constant values now read the constants. RepairPanel's tier label uses NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family. MissionCompleteNotifier's labels use PASSENGER_CONFIG.SATISFACTION_THRESHOLDS. DangerWarningDialog's engine risk factor uses DANGER_CONFIG.ENGINE_CONDITION_MODIFIER.POOR_CONDITION_THRESHOLD, the threshold danger.js applies. A grep found no other copies. Boundary tests pin each label. Deliberately left: (1) quest-manager.js `stage !== 2`, since quest stage numbers are stage identifiers used as literals in about 12 places (game-coordinator.js, the dialogue files), and replacing one would make the code less consistent; (2) `Math.round` in JSX, which turns fractions into percentages for display; the resolvers need the fractions, and the displayed value is already an integer, so nothing shown is a raw float. Revisit (2) only if the project wants percent-valued display getters. Decided by Claude under a delegated session (developer unavailable). Marked Fixed on 2026-11-28 at the developer's request, with (1) and (2) left as they are. A later review found one more copy, contradicting the grep above: DevAdminPanel's mechanical failure trigger hard-coded the FAILURE_CONFIG.CONDITION_THRESHOLDS values; it now reads them.
- **Status date:** 2026-11-28 11:22 UTC
- **Status commit:** 82303f6, 9313583, 0dee1bf

### [F-15] No observability plan, and logging conventions are inconsistent
- **Category:** 21 No observability plan (also 34)
- **Impact:** Low
- **Explanation:**
  - Nothing captures errors beyond the console, and there is no global error hook.
  - There are 45 direct `console.*` calls alongside the manager and dev-logger helpers.
  - Real load-failure reasons go through DEV-gated logging, so production failures leave no trace.
  - Some errors are logged twice.
- **Evidence:**
  - A grep for `window.onerror` and `unhandledrejection` returns 0.
  - DEV-gated load failures: `src/game/state/managers/save-load.js:151, 166, 170` use `this.log`, which is DEV-gated (`base-manager.js:38-42`).
  - Double logging: `src/game/engine/scene.js:86` and `src/features/navigation/StarMapCanvas.jsx:409`.
- **Found by:** Error Handling & Observability

### [F-16] Duplicated view-mode strings, and documented path aliases that are barely used
- **Category:** 22 Configuration sprawl
- **Impact:** Low
- **Explanation:** View-mode strings are redefined outside App.jsx with a "must match" comment, and page titles are keyed on the same raw strings. The path aliases in CLAUDE.md are configured but almost unused, so import style varies.
- **Evidence:** `src/hooks/useEncounterOrchestration.js:10-13` ("Must match the VIEW_MODES values in App.jsx"). `src/game/utils/page-title.js:3-8`. There are 4 `@game/...` alias imports against about 89 `../../game` relative imports.
- **Found by:** Error Handling & Observability, Coupling & Dependencies

### [F-17] Module-level mutable state, and grab-bag modules
- **Category:** 1 Global mutable state (also 11 Low cohesion, 29 Utility dumping ground)
- **Impact:** Low
- **Explanation:**
  - The starmap's selection state lives at module scope, which makes the starmap a de facto singleton. Its test-only reset function is used in production.
  - `constants.js` holds formulas, a network fetch, a mutable flag and state selectors as well as constants.
  - `calculators.js` groups unrelated trading, mission, event and danger helpers.
- **Evidence:**
  - Starmap state: `src/game/engine/interaction.js:13-16` (`let selectedStar` …) and `:156` (`_resetState`, documented "for testing"), imported by `src/features/navigation/StarMapCanvas.jsx:27`.
  - `src/game/constants.js:169-188` (`calculateDistanceFromSol`, `calculateBaseJumpTime`) and `:2002-2069` (selectors).
  - `src/game/utils/calculators.js:19-115`.
- **Found by:** Structure & Boundaries

### [F-18] Dead and vestigial code, some of it hidden from the dead-code tool
- **Category:** 31 Dead code / unused dependencies (also 7, 8, 32)
- **Impact:** Low
- **Explanation:**
  - `capabilities.js` is 554 lines of typedefs that nothing references. knip ignores the file, its only test is a text match, and it has drifted from the real wiring.
  - Other leftovers:
    - a no-op `validateState()` that is still called everywhere;
    - a dynamic import that makes dialogue async for no benefit;
    - an unused `http-server` devDependency that knip is told to ignore;
    - a test-only branch in production context code that turns a missing provider into silent no-ops.
- **Evidence:**
  - `src/game/state/capabilities.js:58, 299` declare `getOwnState` for Combat and Repair; the wiring at `game-coordinator.js:203-232` provides none. `knip.json` `ignore`.
  - `src/game/state/managers/base-manager.js:30`.
  - `src/game/state/managers/dialogue.js:87, 120` ("await import('../../game-dialogue.js')").
  - `package.json:33` and `knip.json:13`.
  - `src/context/StarmapContext.jsx:25-30` ("process.env.NODE_ENV === 'test'").
- **Found by:** Security & Code Quality, Coupling & Dependencies

### [F-19] Some event payloads are live mutated references, which React's Object.is check treats as unchanged
- **Category:** 24 Inconsistent API contracts
- **Impact:** Low
- **Explanation:** Some emitters send fresh copies and others mutate the array in place and emit the same reference. `useGameEvent` stores the payload with `setState`, so React sees an unchanged value and skips the update. Whether a screen updates then depends on some other event firing in the same action. The quest path for the same event copies the array.
- **Evidence:** `src/game/state/managers/ship.js:199` ("ship.upgrades.push(upgradeId)") then `emit(UPGRADES_CHANGED, ship.upgrades)` at 223, 275 and 480. `src/game/state/managers/trading.js:304, 327, 381` (live `priceKnowledge`). `src/hooks/useGameEvent.js:39-41`. The copy: `game-coordinator.js:443-445` (`[...this.state.ship.upgrades]`).
- **Found by:** Integration & Data
- **Status:** Fixed
- **Status reason:** Every emitter that mutates a slice in place now emits a copy: UPGRADES_CHANGED (ship.js, 3 sites), QUIRKS_CHANGED (ship.js addQuirk/removeQuirk, not in the original evidence) and PRICE_KNOWLEDGE_CHANGED (trading.js, 3 sites, plus info-broker.js purchaseIntelligence, also not in the original evidence). A hook-level test pins that each one hands useGameEvent subscribers a new value. Load-time re-emits in _emitAllStateEvents were left as they are, since they send a freshly loaded state, not one mutated in place. Decided by Claude under a delegated session (developer unavailable): only one sound approach; fixing it in useGameEvent instead would mask the problem for every event.
- **Status date:** 2026-11-28 00:36 UTC
- **Status commit:** a178f00

### [F-20] Result shapes drift at the edges, and the bridge hook has a subscribe gap
- **Category:** 24 Inconsistent API contracts
- **Impact:** Low
- **Explanation:**
  - Navigation and dialogue return different result shapes from the `{success, reason}` convention that managers use.
  - `buyGood` does not validate its quantity or price and trusts the price the caller passes, while `sellGood` does validate.
  - `useGameEvent` reads its initial value during render but subscribes later, in an effect, so an event emitted between the two is missed.
- **Evidence:**
  - Result shapes: `src/game/game-navigation.js:314-397, 422, 450` (`{valid, error}`, `{success, error}`). `src/game/state/managers/dialogue.js:130` (`{success, message}`).
  - `src/game/state/managers/trading.js:30-71` (`buyGood`) against `:89-97` (`sellGood`).
  - `src/hooks/useGameEvent.js:33-50`.
- **Found by:** Integration & Data

### [F-21] Mutations that can be half-applied or repeated
- **Category:** 26 Poor transactional boundaries (also 19 Lack of idempotency)
- **Impact:** Low
- **Explanation:** Refuel takes the credits before a safety check that can throw, and buying takes the credits before an unguarded lookup. `advanceQuest` adds one to the stage with no check of which stage the caller expected, so calling it twice skips a stage.
- **Evidence:** `src/game/state/managers/refuel.js:141` (`updateCredits(...)`) runs before the "CRITICAL BUG" throw at 152-157. `src/game/state/managers/trading.js:44-50` (debit, then `currentSystemObj.name`). `src/game/state/managers/quest-manager.js:45-72` ("const nextStage = questState.stage + 1"), called from seven sites in `tanaka-dialogue.js`.
- **Found by:** Integration & Data
- **Status:** Fixed
- **Status reason:** Refuel and buyGood now take credits only after every step that can throw: refuel after the fuel-reduction guard, buyGood after the system lookup and the new cargo are computed, right beside the cargo write. The order of emitted events is unchanged. Tests pin both cases: credits survive the throw. advanceQuest was left alone after a premise check: every call site is an offer-node choice that the player can only reach at the matching stage, and a repeat click lands on the next node's choices, so no input advances twice. A stage guard would mean editing 7 content call sites for a path that can't be reached. Neither debit throw is known to be reachable in play either; the reorder was taken because it costs nothing. Decided by Claude under a delegated session (developer unavailable). Marked Fixed on 2026-11-28 at the developer's request, with advanceQuest left as it is.
- **Status date:** 2026-11-28 09:19 UTC
- **Status commit:** ca60519, 9313583

### [F-22] Gaps in the local persistence lifecycle
- **Category:** 17 No clear ownership of data
- **Impact:** Low
- **Explanation:**
  - A pending save is flushed only on `beforeunload`, which mobile browsers do not reliably fire, even though mobile is supported.
  - Two open tabs silently overwrite each other's save.
  - TradePanel reads and writes its own `localStorage` key without a try/catch, outside the preferences store.
- **Evidence:** `src/main.jsx:77-81` is the only unload hook; a grep for `pagehide`, `visibilitychange`, `storage` listeners and `BroadcastChannel` returns 0. `src/game/constants.js:843` (`SAVE_KEY`). `src/features/trade/TradePanel.jsx:113-119` ("localStorage.getItem('restrictedExplained')").
- **Found by:** Integration & Data

### [F-23] IDs use the wall clock, and gameplay functions default to Math.random
- **Category:** 12 Hidden side effects (also 28)
- **Impact:** Low
- **Explanation:** The mission board, favour missions, distress calls and encounters are seeded, but their IDs come from `Date.now()`, so regenerating the same content gives different IDs. Several gameplay functions default `rng = Math.random`, so a new caller that leaves out the argument breaks the "no Math.random in gameplay" rule without any error.
- **Evidence:**
  - `Date.now()` IDs: `src/game/mission-generator.js:193, 288`, `src/game/state/managers/debt.js:429`, `src/game/state/managers/distress.js:32`, `src/game/state/managers/encounter-trigger.js:174, 185, 196` (moved from the deleted `src/hooks/useEventTriggers.js`).
  - `rng = Math.random` defaults: `mission-generator.js:111, 231, 322`, `managers/event-engine.js:62`, `managers/ship.js:39`, `game-coordinator.js:513`.
- **Found by:** Error Handling & Observability

2 security finding(s) written to paad/security/agentic-architecture-2026-11-27-tramp-freighter.md

## Coverage Checklist

Statuses count this report's findings only; routed findings are in the security file's checklist.

### Flaw/Risk Types 1–34
| # | Type | Status | Finding |
|---|------|--------|---------|
| 1 | Global mutable state | Observed | #F-17 |
| 2 | God object | Observed | #F-9 |
| 3 | Tight coupling | Observed | #F-7 |
| 4 | High/unstable dependencies | Not observed | — |
| 5 | Circular dependencies | Not observed | — |
| 6 | Leaky abstractions | Observed | #F-4, #F-5, #F-9 |
| 7 | Over-abstraction | Observed | #F-18 |
| 8 | Premature optimization | Observed | #F-18 |
| 9 | Shotgun surgery | Observed | #F-3, #F-6, #F-10 |
| 10 | Feature envy / anemic domain model | Observed | #F-4 |
| 11 | Low cohesion | Observed | #F-17 |
| 12 | Hidden side effects | Observed | #F-13, #F-23 |
| 13 | Inconsistent boundaries | Observed | #F-2, #F-4, #F-7 |
| 14 | Distributed monolith | Not applicable | Single-process browser app; no services |
| 15 | Chatty service calls | Not applicable | No network calls |
| 16 | Synchronous-only integration | Not applicable | No inter-service integration; the in-process bus is synchronous by design |
| 17 | No clear ownership of data | Observed | #F-5, #F-22 |
| 18 | Shared database across services | Not applicable | No database or services |
| 19 | Lack of idempotency | Observed | #F-21 |
| 20 | Weak error handling strategy | Observed | #F-1, #F-8 |
| 21 | No observability plan | Observed | #F-15 |
| 22 | Configuration sprawl | Observed | #F-11, #F-12, #F-16 |
| 23 | Dependency injection misuse | Observed | #F-5 |
| 24 | Inconsistent API contracts | Observed | #F-11, #F-19, #F-20 |
| 25 | Business logic in the UI | Observed | #F-3, #F-6 |
| 26 | Poor transactional boundaries | Observed | #F-1, #F-4, #F-7, #F-21 |
| 27 | Temporal coupling | Observed | #F-2 |
| 28 | Magic numbers/strings everywhere | Observed | #F-14, #F-23 |
| 29 | "Utility" dumping ground | Observed | #F-17 |
| 30 | Security as an afterthought | See security file | see paad/security/ |
| 31 | Dead code / unused dependencies | Observed | #F-18 |
| 32 | Missing or inadequate test coverage for critical paths | Observed | #F-1, #F-18 |
| 33 | Hard-coded credentials or secrets in source | See security file | see paad/security/ |
| 34 | Inconsistent error/logging conventions | Observed | #F-8, #F-15 |

### Strength Categories S1–S14
| # | Category | Status | Finding |
|---|----------|--------|---------|
| S1 | Clear modular boundaries | Observed | #S-1, #S-15 |
| S2 | High cohesion | Observed | #S-11 |
| S3 | Loose coupling | Observed | #S-1, #S-9 |
| S4 | Dependency direction is stable | Observed | #S-2 |
| S5 | Dependency management hygiene | Observed | #S-12 |
| S6 | Consistent API contracts | Observed | #S-7, #S-8 |
| S7 | Robust error handling | Observed | #S-4, #S-5, #S-13 |
| S8 | Observability present | Observed (partial) | #S-14 |
| S9 | Configuration discipline | Observed | #S-6 |
| S10 | Security built-in | See security file | see paad/security/ |
| S11 | Testability & coverage | Observed | #S-3, #S-6 |
| S12 | Resilience patterns | Observed (local persistence only; no network) | #S-4, #S-5 |
| S13 | Domain modeling strength | Observed | #S-10 |
| S14 | Simple, pragmatic abstractions | Observed | #S-9, #S-15 |

## Hotspots

1. `src/hooks/useEventTriggers.js`, `src/hooks/useEncounterOrchestration.js`, `src/features/danger/` — the encounter pipeline. Trigger rules, escalation, outcome application and displayed odds are spread across hooks, a feature module, panels and the combat manager (F-2, F-3, F-4, F-8).
2. `src/game/state/game-coordinator.js` and `src/game/state/capabilities.js` — the strong core (S-1, S-7, S-8), and also where ownership leaks, the `coordinatorRef` escape hatch, facade bypass and drifting state-shape lists all meet (F-5, F-9, F-10, F-18).
3. The save lifecycle: `src/main.jsx`, `src/App.jsx` (`handleStartGame`), `src/game/state/managers/save-load.js`, `src/game/state/save-load.js` — solid validation (S-4, S-5) undercut by a silent fallback to a new game, two save paths and gaps in the persistence lifecycle (F-1, F-11, F-22).

## Next Questions

1. Which layer is meant to own the decision of when and how an encounter fires: the hooks, the danger and event managers, or NavigationSystem?
2. Is `getState()` returning the live root a deliberate contract that callers may rely on (applyEncounterOutcome's hull re-reads do), or an accident of the implementation?
3. Is the static "System" class layer (`game-trading.js`, `game-navigation.js`, `game-information-broker.js`) meant to remain beside the managers, and if so, what decides which layer a new rule goes in?
4. What should a player see when their save cannot be loaded, and should "Continue" ever be offered for a save that will be rejected?
5. Is `capabilities.js` meant to be an enforced contract or reference documentation, and who is expected to keep it in sync?

## Analysis Metadata

- **Agents dispatched:** Structure & Boundaries (types 1, 2, 9, 10, 11, 13, 29; S1, S2, S13, S14); Coupling & Dependencies (3–8, 23, 27; S3–S5); Integration & Data (14–19, 24, 26; S6, S12); Error Handling & Observability (12, 20–22, 25, 28, 34; S7–S9); Security & Code Quality (30–33; S10, S11); 1 Verifier
- **Scope:** full repository — 179 source files under `src/` (~43k lines), with `tests/` (475 files) consulted for coverage
- **Raw findings:** 89 (before verification)
- **Verified findings:** 48 (16 strengths, 32 flaws). For this report they were consolidated into 15 strengths, 23 flaws and 2 routed security findings by merging closely related low-impact items.
- **Filtered out:** 41 (40 merged as cross-specialist duplicates; 1 dropped as a false positive, the wormhole-data identity check, which is an intentional cache fast path; the behavioural sub-claims of 4 more were dropped because confirming them needs runtime tests)
- **By impact:** 3 high, 7 medium, 13 low flaws; 3 high, 10 medium, 2 low strengths (this report's findings only; routed findings are excluded)
- **Security:** 2 finding(s) written to paad/security/agentic-architecture-2026-11-27-tramp-freighter.md
- **Steering files consulted:** CLAUDE.md, AGENTS.md, DEVELOPMENT.md, paad/adrs/0001-dialogue-engine-owns-picker-choices.md, paad/adrs/0002-gameplay-targets-wormhole-connected-systems.md, paad/config/paad.md, prior reports in paad/architecture-reviews/, project memory (GameCoordinator facade is intentional)
