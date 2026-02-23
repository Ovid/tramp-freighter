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

- [ ] `critical-damage-delegation.test.js` — replace `typeof gsm.X === 'function'` with actual invocation + behavior checks
- [ ] `label-opacity-visibility.test.js` — replace `.toBeDefined()` / `typeof === 'number'` with value-range assertions
- [ ] `star-selection-integration.test.js` — replace `.toBeDefined()` / `.not.toBeNull()` with structural or behavioral assertions
- [ ] `modal-dialog.test.js` — replace `.classList.contains()` boolean checks with behavior-focused assertions
- [ ] Scan for other `.toBeDefined()` / `.toBeTruthy()` assertions that should be more specific

### 2B. Opaque property test failures

Property tests using `return false` give no diagnostic info on failure.

- [ ] `reputation-tier-classification.property.test.js` — replace `return false` with `expect()` assertions that show which condition failed
- [ ] `cargo-retrieval-completeness.property.test.js` — add context to assertions (amounts, transfer values)
- [ ] `dialogue-navigation.property.test.js` — replace `return false` with named `expect()` calls
- [ ] `combat-modifier-application.property.test.js` — include generated values in failure messages
- [ ] Scan all property tests for `return false` pattern and replace with `expect()`

### 2C. Tests asserting too many things

Single test cases that verify 5+ independent behaviors.

- [ ] `mission-completion.test.js` — split "should complete a delivery mission" into separate success/state/reward tests
- [ ] `captain-vasquez-npc-data.test.js` (and similar NPC data tests) — restructure field-existence checks vs value-correctness checks
- [ ] `hud-condition-bar-display.property.test.js` — split into per-system property tests (fuel, hull, engine, life support)

---

## Phase 3: Test Data & Fixtures

### 3A. Consolidate duplicated factory functions

148 files independently create `new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA)` + `initNewGame()`. Multiple files define their own `createMockGameStateManager()`.

- [ ] Add `createTestGameStateManager(stateOverrides?)` to `tests/test-utils.js` that handles the standard init pattern
- [ ] Add `createMockGameStateManager(stateOverrides?)` to `tests/test-utils.js` for tests that need a mock (not real) GSM
- [ ] Migrate highest-duplication files to use shared factories (start with unit tests that do `new GameStateManager` + `initNewGame`)
- [ ] Deduplicate `createMinimalStarData()` — exists in both `test-data.js` and `test-utils.js`

### 3B. Parameterize repeated test patterns

NPC data validation tests repeat the same structure across 7+ files.

- [ ] Create a parameterized NPC data validation test that iterates over all NPCs instead of per-NPC test files
- [ ] `label-opacity-visibility.test.js` — convert 4 nearly-identical distance tests to `it.each()`
- [ ] Identify other candidates for `it.each()` or `describe.each()`

---

## Phase 4: Coverage Gaps

### 4A. Untested managers

7+ core managers have zero or minimal direct tests. These are tested indirectly through GameStateManager delegation, but direct tests catch bugs earlier.

- [ ] `RefuelManager` — add unit tests for fuel calculation, refuel costs, partial refueling
- [ ] `ShipManager` — add unit tests for ship configuration, upgrade effects, system status
- [ ] `NavigationManager` — add unit tests for jump validation, route calculation, wormhole traversal
- [ ] `InspectionManager` — add unit tests for customs inspection resolution (cooperate, bribe, flee)
- [ ] `DistressManager` — add unit tests for civilian distress call encounters
- [ ] `NegotiationManager` — add unit tests for pirate negotiation resolution
- [ ] `InfoBrokerManager` — add unit tests for intelligence purchase, price data management
- [ ] `EventSystemManager` — add unit tests for subscribe/unsubscribe, event dispatch, cleanup

### 4B. Edge case gaps

- [ ] Audit `danger/` feature tests — encounter system is core gameplay but has fewer tests than trading/missions
- [ ] Add negative/error tests for managers that only have happy-path coverage
- [ ] Add boundary tests for numeric values (0, max, overflow) in finance/trading calculations

---

## Phase 5: Structural Improvements

### 5A. Exception assertions

Generic `.toThrow()` without type/message checking.

- [ ] `all-npc-data-validation.test.js` — change `.toThrow()` to `.toThrow(/specific message/)` or `.toThrow(ErrorType)`
- [ ] Scan for other bare `.toThrow()` calls and add specificity

### 5B. Over-mocking

Some tests mock things unnecessarily or test mock behavior rather than real behavior.

- [ ] `dev-mode-detection.test.js` — tests verify fetch call structure rather than behavioral outcome; consider testing "dev mode detected when .dev file exists" instead
- [ ] `star-selection-integration.test.js` — tests mock StarmapBridge then verify the mock exists; consider testing actual bridge behavior
- [ ] `cargo-retrieval-completeness.property.test.js` — mocks localStorage but never asserts on it; remove unnecessary mock or add assertion

### 5C. Global afterEach safety net

No global `afterEach` in `setup.js` to catch stray mocks.

- [ ] Add `afterEach(() => { vi.clearAllMocks(); })` to `tests/setup.js` as a safety net
- [ ] Verify this doesn't interfere with tests that manage their own mock lifecycle

---

## Out of Scope (noted but not planned)

- **No E2E tests**: The game is client-side only with no server. E2E tests via Playwright could catch rendering regressions but represent a significant investment for uncertain ROI. Revisit if UI bugs become a pattern.
- **Contract tests**: No external APIs to contract-test against. The game is self-contained.
- **Performance tripwires**: Could add timing assertions to property tests (e.g., "100 trades complete in < 500ms") but this is a stretch goal, not a fix.
