# Test Suite Fixes

Audit of 257 test files (2,046 tests, all passing) against `test-best-practices.md`.

**Baseline:** All tests pass. No stderr noise. No flaky tests detected.

---

## Phase 1: Standards Compliance (CLAUDE.md violations)

### 1A. Property test iterations below minimum 100

CLAUDE.md requires minimum 100 iterations. 58 of 104 property tests are below that.

- [x] Fix `numRuns: 50` tests (39 files) — bump to 100
- [x] Fix `numRuns: 20` tests (17 files) — bump to 100
- [x] Fix `numRuns: 10` tests (2 files) — bump to 100
- [x] Verify all 104 property tests have explicit `numRuns: 100` or higher

*Done: 52 files changed (some had multiple numRuns values). 2 async tests in use-game-event.property.test.jsx needed timeout bump to 15000ms.*

### 1B. Missing afterEach cleanup

124 test files have `beforeEach` but no `afterEach`. While Vitest creates fresh module scope per file, explicit cleanup prevents subtle cross-test leakage within a file.

- [x] Add `afterEach(() => { vi.restoreAllMocks(); })` to files that use `vi.spyOn` or `vi.fn` without cleanup
- [x] Move module-level console spies into `beforeEach` in: `apply-encounter-outcome.test.js`, `debt-manager.test.js`, `passenger-effect-resolution.test.js`
- [x] Audit remaining files — skip those where no mocks/spies are created (no cleanup needed)

*Done: 45 files changed (3 high-priority + 8 integration + 18 property + 15 unit + 1 nested describe). Files using only module-level vi.mock() or no mocks were correctly skipped.*

### 1C. Console mocking standardization

3 different console mocking patterns in use. CLAUDE.md: "Tests must produce no stderr warnings."

- [x] Standardize on `vi.spyOn(console, 'X').mockImplementation(() => {})` pattern
- [x] Replace manual save/restore (`const original = console.error; ... finally { console.error = original }`) with `vi.spyOn`
- [x] Replace `console.log = vi.fn()` reassignment with `vi.spyOn`
- [x] Audit for tests that trigger console output without mocking (155 files don't explicitly mock — most probably don't need it, but verify)

*Done: 31 files changed — 29 Pattern A (manual save/restore) and 1 Pattern B (vi.fn reassignment) converted to standard vi.spyOn pattern. Audit confirmed: zero stdout/stderr sections in test output. The 155 unmocked files don't trigger console calls — no action needed.*

---

## Phase 2: Assertion Quality

### 2A. Weak assertions

Tests that check existence/type instead of behavior.

- [x] `critical-damage-delegation.test.js` — replace `typeof gsm.X === 'function'` with actual invocation + behavior checks
- [x] `label-opacity-visibility.test.js` — replace `.toBeDefined()` / `typeof === 'number'` with value-range assertions
- [x] `star-selection-integration.test.js` — replace `.toBeDefined()` / `.not.toBeNull()` with structural or behavioral assertions
- [x] `modal-dialog.test.js` — replace `.classList.contains()` boolean checks with behavior-focused assertions
- [x] Scan for other `.toBeDefined()` / `.toBeTruthy()` assertions that should be more specific

*Done: 14 files strengthened. Scan found 10 additional files with weak assertions (event-engine, narrative-event-data, danger-events, passenger-events, passenger-generator, mission-generator, passenger-cargo-pirate, debt-manager, save-load, mission-board-refresh).*

### 2B. Opaque property test failures

Property tests using `return false` give no diagnostic info on failure.

- [x] `reputation-tier-classification.property.test.js` — replace `return false` with `expect()` assertions that show which condition failed
- [x] `cargo-retrieval-completeness.property.test.js` — already used `expect()` throughout, no changes needed
- [x] `dialogue-navigation.property.test.js` — replace `return false` with named `expect()` calls
- [x] `combat-modifier-application.property.test.js` — already used `expect()` throughout, no changes needed
- [x] Scan all property tests for `return false` pattern and replace with `expect()`

*Done: 20 property test files fixed. Scan found 16 additional files with `return false` patterns (npc-location-filtering, faction-reputation-clamping, timestamp-updates, interaction-count, dialogue-validation-consistency, dialogue-choice-filtering, dialogue-dynamic-text, dialogue-reputation-timing, dialogue-flag-idempotence, dialogue-flag-timing, ship-name-persistence, ship-naming-default-name, ship-name-sanitization-dialog, ship-naming-enter-key-submission, ship-naming-dialog-display, title-screen-display, ship-naming-after-new-game, new-game-confirmation, game-initialization-on-continue).*

### 2C. Tests asserting too many things

Single test cases that verify 5+ independent behaviors.

- [x] `mission-completion.test.js` — split "should complete a delivery mission" into separate success/state/reward tests
- [x] `captain-vasquez-npc-data.test.js` (and similar NPC data tests) — reviewed all 7 NPC files, already well-structured; no changes needed
- [x] `hud-condition-bar-display.property.test.js` — split into per-system property tests (fuel, hull, engine, life support)

*Done: 2 files split (mission-completion 1→4, hud-condition-bar 1→4). NPC data tests already followed the recommended pattern.*

---

## Phase 3: Test Data & Fixtures

### 3A. Consolidate duplicated factory functions

148 files independently create `new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA)` + `initNewGame()`. Multiple files define their own `createMockGameStateManager()`.

- [x] Add `createTestGameStateManager(stateOverrides?)` to `tests/test-utils.js` that handles the standard init pattern
- [x] ~~Add `createMockGameStateManager(stateOverrides?)` to `tests/test-utils.js`~~ — only 1 file uses this pattern (event-engine.test.js); not worth centralizing
- [x] Migrate highest-duplication files to use shared factories (start with unit tests that do `new GameStateManager` + `initNewGame`)
- [x] ~~Deduplicate `createMinimalStarData()`~~ — false positive, only exists in test-utils.js

*Done: 21 of 24 files migrated to shared factory. 3 save-load files intentionally skipped (separate manager/init lifecycle). 1 file skipped (uses custom test data).*

### 3B. Parameterize repeated test patterns

NPC data validation tests repeat the same structure across 7+ files.

- [x] Create a parameterized NPC data validation test that iterates over all NPCs instead of per-NPC test files
- [x] `label-opacity-visibility.test.js` — convert 4 nearly-identical distance tests to `it.each()`
- [x] Identify other candidates for `it.each()` or `describe.each()`

*Done: 7 per-NPC files replaced with 1 parameterized file (68 tests). Also parameterized: star-visuals (24 tests), critical-damage-constants (5 tests), distance-calculations (4 tests), economy-config-constants (6 tests), npc-data-definitions (15 tests). File count: 257→251.*

---

## Phase 4: Coverage Gaps

### 4A. Untested managers

7+ core managers have zero or minimal direct tests. These are tested indirectly through GameStateManager delegation, but direct tests catch bugs earlier.

- [x] `RefuelManager` — add unit tests for fuel calculation, refuel costs, partial refueling
- [x] `ShipManager` — add unit tests for ship configuration, upgrade effects, system status
- [x] `NavigationManager` — add unit tests for jump validation, route calculation, wormhole traversal
- [x] `InspectionManager` — add unit tests for customs inspection resolution (cooperate, bribe, flee)
- [x] `DistressManager` — add unit tests for civilian distress call encounters
- [x] `NegotiationManager` — add unit tests for pirate negotiation resolution
- [x] `InfoBrokerManager` — add unit tests for intelligence purchase, price data management
- [x] `EventSystemManager` — add unit tests for subscribe/unsubscribe, event dispatch, cleanup

*Done: 8 new test files created (202 tests total). RefuelManager (21), ShipManager (42), NavigationManager (21), InspectionManager (25), DistressManager (36), NegotiationManager (32), InfoBrokerManager (14), EventSystemManager (11). File count: 251→259.*

### 4B. Edge case gaps

- [x] Audit `danger/` feature tests — encounter system is core gameplay but has fewer tests than trading/missions
- [x] Add negative/error tests for managers that only have happy-path coverage
- [x] Add boundary tests for numeric values (0, max, overflow) in finance/trading calculations

*Done: 2 new test files. danger-edge-cases.test.js (15 tests): combat with empty cargo, negotiation with 0 cargo/credits, inspection with stacked violations, distress with minimal state, reputation boundaries. finance-boundary-tests.test.js (36 tests): trading buy/sell at capacity limits, refuel epsilon tolerance, repair at 0%/100%, debt heat tier boundaries, payment edge cases. File count: 259→261. Total tests: 2303.*

---

## Phase 5: Structural Improvements

### 5A. Exception assertions

Generic `.toThrow()` without type/message checking.

- [x] `all-npc-data-validation.test.js` — change `.toThrow()` to `.toThrow(/specific message/)` or `.toThrow(ErrorType)`
- [x] Scan for other bare `.toThrow()` calls and add specificity

*Done: 4 files fixed. all-npc-data-validation (/Invalid NPC definition/), dialogue-validation-consistency (/Dialogue tree must/, /Dialogue node/, /Choice/), dialogue-faction-karma-integration (TypeError), engine-failure-repair-options (/Unknown failure type/, /Unknown engine failure repair choice/).*

### 5B. Over-mocking

Some tests mock things unnecessarily or test mock behavior rather than real behavior.

- [x] `dev-mode-detection.test.js` — removed fetch call-structure assertions, kept behavioral outcome assertions
- [x] `star-selection-integration.test.js` — removed 5 mock-verifying-mock tests and unused StarmapBridge mock (StarmapBridge doesn't exist in production code)
- [x] `cargo-retrieval-completeness.property.test.js` — removed unnecessary localStorage mock (debounced save never fires in synchronous tests)

*Done: 3 files fixed. Net -5 tests (all were testing mock fixtures, not production code).*

### 5C. Global afterEach safety net

No global `afterEach` in `setup.js` to catch stray mocks.

- [x] Add `afterEach(() => { vi.clearAllMocks(); })` to `tests/setup.js` as a safety net
- [x] Verify this doesn't interfere with tests that manage their own mock lifecycle

*Done: Added to setup.js. Uses clearAllMocks (not restoreAllMocks) to preserve module-level vi.mock() declarations. All 251 files pass.*

---

## Out of Scope (noted but not planned)

- **No E2E tests**: The game is client-side only with no server. E2E tests via Playwright could catch rendering regressions but represent a significant investment for uncertain ROI. Revisit if UI bugs become a pattern.
- **Contract tests**: No external APIs to contract-test against. The game is self-contained.
- **Performance tripwires**: Could add timing assertions to property tests (e.g., "100 trades complete in < 500ms") but this is a stretch goal, not a fix.
