# Correctness and Maintainability Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 19 identified correctness and maintainability issues across the codebase, grouped into 10 focused tasks ordered by severity.

**Architecture:** This is a surgical fix plan — no new features, no refactoring beyond what is required to fix each issue. Every task follows TDD: write a failing test, verify it fails, implement the fix, verify it passes, commit. All tasks must leave the full test suite green.

**Tech Stack:** React 18, Vitest, fast-check (property tests). Run tests with `npm test`. Run a single file with `npm test -- tests/path/file.test.js`.

---

## Background: Key Patterns

Before starting, understand these two patterns used throughout:

**Bridge Pattern:** React components must never call `gameStateManager.getState()` directly. All state flows through hooks:
- `useGameEvent(EVENT_NAMES.FOO)` — subscribes to an event, returns current value, re-renders on change.
- `useGameAction()` — returns action functions that trigger mutations.

Events must emit **new object references** (spread) or React's `Object.is` comparison will skip re-renders.

**SeededRandom:** All gameplay RNG uses `SeededRandom` from `src/game/utils/seeded-random.js`. Never use `Math.random()` in gameplay paths. Seed format: `"descriptor-${day}-${systemId}"`. The `.next()` method returns a float in [0, 1). Pass `() => rng.next()` where a plain function is expected.

---

## Task 1: Fix reference-equality event emission (FACTION_REP and MISSIONS)

**Severity:** High — React skips re-renders when the same object reference is re-emitted.

**Files:**
- Modify: `src/game/state/managers/danger.js` (lines 398, 430)
- Modify: `src/game/state/game-state-manager.js` (line 323)
- Test: `tests/unit/game-danger.test.js` (or create `tests/unit/event-emission.test.js`)

### Step 1: Write a failing test

Find or create a test file. Add:

```js
// tests/unit/event-emission.test.js
import { describe, it, expect, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';

function makeGSM() {
  // Minimal setup — check existing test files for the standard test factory.
  // Look at tests/unit/game-danger.test.js for the pattern used there.
  // The factory is likely `makeTestGSM()` or similar.
}

describe('Event emission reference equality', () => {
  it('FACTION_REP_CHANGED emits a new object reference each time', () => {
    const gsm = makeGSM();
    const received = [];
    gsm.subscribe('factionRepChanged', (data) => received.push(data));

    gsm.modifyFactionRep('authorities', 5, 'test');
    gsm.modifyFactionRep('authorities', 5, 'test');

    expect(received.length).toBe(2);
    expect(received[0]).not.toBe(received[1]); // Must be distinct references
  });

  it('MISSIONS_CHANGED emits a new object reference from _emitAllStateEvents', () => {
    const gsm = makeGSM();
    // Load a game to trigger _emitAllStateEvents
    const received = [];
    gsm.subscribe('missionsChanged', (data) => received.push(data));

    // Force _emitAllStateEvents by loading a minimal save
    // Check existing load tests for how to call this; look in tests/integration/
    gsm._emitAllStateEvents(gsm.getState());
    gsm._emitAllStateEvents(gsm.getState());

    expect(received.length).toBe(2);
    expect(received[0]).not.toBe(received[1]);
  });
});
```

> **Note:** Look at `tests/unit/game-danger.test.js` and `tests/integration/` for the standard `GameStateManager` test setup. The event name strings are in `EVENT_NAMES` from `src/game/constants.js`.

**Step 2: Run to verify it fails**

```
npm test -- tests/unit/event-emission.test.js
```

Expected: FAIL — `received[0]` and `received[1]` are the same reference.

**Step 3: Fix the three emission sites**

In `src/game/state/managers/danger.js`, change both lines (398 and 430) from:
```js
this.emit(EVENT_NAMES.FACTION_REP_CHANGED, this.getState().player.factions);
```
to:
```js
this.emit(EVENT_NAMES.FACTION_REP_CHANGED, { ...this.getState().player.factions });
```

In `src/game/state/game-state-manager.js`, change line ~323 from:
```js
this.emit(EVENT_NAMES.MISSIONS_CHANGED, state.missions);
```
to:
```js
this.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...state.missions });
```

**Step 4: Run to verify it passes**

```
npm test -- tests/unit/event-emission.test.js
```

**Step 5: Run full suite**

```
npm test
```

**Step 6: Commit**

```
git add src/game/state/managers/danger.js src/game/state/game-state-manager.js tests/unit/event-emission.test.js
git commit -m "fix: spread faction rep and missions objects before emitting to prevent React ref-equality skips"
```

---

## Task 2: Fix modifyRep not emitting NPCS_CHANGED

**Severity:** High — NPC rep changes during normal gameplay (missions, dialogue, quests) are invisible to any React component subscribed to `NPCS_CHANGED`.

**Files:**
- Modify: `src/game/state/managers/npc.js` (end of `modifyRep`, line ~150)
- Modify: `src/hooks/useGameEvent.js` (`extractStateForEvent` map, ~line 95)
- Test: `tests/unit/game-npc.test.js` (or create)

### Step 1: Write a failing test

```js
// In tests/unit/game-npc.test.js — add to existing suite or create new
it('modifyRep emits NPCS_CHANGED event', () => {
  const gsm = makeGSM(); // use your standard test factory
  const received = [];
  gsm.subscribe(EVENT_NAMES.NPCS_CHANGED, (data) => received.push(data));

  gsm.modifyRep('chen', 10, 'test'); // 'chen' is a valid NPC id — check npc-data.js for real ids

  expect(received.length).toBe(1);
  expect(received[0]).toBeDefined();
});

it('useGameEvent NPCS_CHANGED initializes to current npcs state (not null)', () => {
  // This is an extractStateForEvent test — verify the map returns state.npcs
  // Check existing tests for how extractStateForEvent is tested, or test via
  // the public behavior: subscribe, check initial value is not null after game init.
  const gsm = makeGSM();
  gsm.initNewGame();
  // Simulate what useGameEvent does: call extractStateForEvent via getState
  const state = gsm.getState();
  expect(state.npcs).toBeDefined(); // The map entry must return this
});
```

> **Note:** Find a valid NPC id by reading `src/game/data/npc-data.js`.

**Step 2: Run to verify it fails**

```
npm test -- tests/unit/game-npc.test.js
```

**Step 3: Fix modifyRep in npc.js**

At the end of `modifyRep` (after `this.gameStateManager.achievementsManager.checkAchievements()`), add:

```js
this.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.getState().npcs });
```

**Step 4: Fix extractStateForEvent in useGameEvent.js**

In the `eventStateMap` object in `extractStateForEvent`, add an entry after `ACHIEVEMENTS_CHANGED`:

```js
[EVENT_NAMES.NPCS_CHANGED]: state.npcs || {},
```

**Step 5: Run to verify it passes**

```
npm test -- tests/unit/game-npc.test.js
```

**Step 6: Run full suite**

```
npm test
```

**Step 7: Commit**

```
git add src/game/state/managers/npc.js src/hooks/useGameEvent.js tests/unit/game-npc.test.js
git commit -m "fix: emit NPCS_CHANGED from modifyRep and add to extractStateForEvent initializer"
```

---

## Task 3: Fix mission board generation using SeededRandom

**Severity:** High — every mission board refresh is non-deterministic, making the game unreplayable and tests unreliable.

**Files:**
- Modify: `src/game/state/managers/mission.js` (`refreshMissionBoard`, line ~470)
- Test: `tests/unit/game-missions.test.js` (or create)

### Step 1: Write a failing test

```js
it('refreshMissionBoard produces the same board for the same day and system', () => {
  // Create two identical GSMs, call refreshMissionBoard on both.
  // Without seeding, they produce different boards. With seeding, same.
  const gsm1 = makeGSM();
  gsm1.initNewGame();
  const gsm2 = makeGSM();
  gsm2.initNewGame();

  const board1 = gsm1.refreshMissionBoard();
  const board2 = gsm2.refreshMissionBoard();

  // Mission IDs will differ (they contain Date.now) — compare structure
  expect(board1.length).toBe(board2.length);
  board1.forEach((m, i) => {
    expect(m.type).toBe(board2[i].type);
    expect(m.destination?.id).toBe(board2[i].destination?.id);
    expect(m.good).toBe(board2[i].good);
  });
});
```

**Step 2: Run to verify it fails**

```
npm test -- tests/unit/game-missions.test.js
```

Expected: FAIL — boards differ between runs.

**Step 3: Fix refreshMissionBoard in mission.js**

Import `SeededRandom` at the top of the file:

```js
import { SeededRandom } from '../../utils/seeded-random.js';
```

In `refreshMissionBoard`, replace the `undefined` rng argument with a seeded instance:

```js
// Before (line ~470):
const board = generateMissionBoard(
  state.player.currentSystem,
  this.gameStateManager.starData,
  this.gameStateManager.wormholeData,
  dangerZone,
  undefined,           // <-- this is the rng parameter
  destinationDangerZoneFn,
  state.missions.completionHistory,
  currentDay
);

// After:
const rng = new SeededRandom(`mission-board-${currentDay}-${state.player.currentSystem}`);
const board = generateMissionBoard(
  state.player.currentSystem,
  this.gameStateManager.starData,
  this.gameStateManager.wormholeData,
  dangerZone,
  () => rng.next(),
  destinationDangerZoneFn,
  state.missions.completionHistory,
  currentDay
);
```

**Step 4: Run to verify it passes**

```
npm test -- tests/unit/game-missions.test.js
```

**Step 5: Run full suite**

```
npm test
```

**Step 6: Commit**

```
git add src/game/state/managers/mission.js tests/unit/game-missions.test.js
git commit -m "fix: seed mission board generation with SeededRandom for deterministic output"
```

---

## Task 4: Fix narrative/danger event RNG

**Severity:** High — every encounter probability check uses `Math.random()`, making encounter triggers non-deterministic.

**Files:**
- Modify: `src/hooks/useEventTriggers.js` (`handleTrigger`, line ~153)
- Modify: `src/game/state/game-state-manager.js` (`checkEvents` delegation, if needed)
- Test: `tests/unit/event-engine.test.js` (or create)

### Step 1: Understand the call chain

`useEventTriggers.js` calls `gameStateManager.checkEvents(eventType, context)` at lines ~153 and ~158. `GameStateManager.checkEvents` delegates to `EventEngineManager.checkEvents(eventType, context, rngFn)`. The `rngFn` defaults to `Math.random` if not passed.

The fix: create a `SeededRandom` from the current game state in `handleTrigger` and pass it through.

Check `src/game/state/game-state-manager.js` to confirm `checkEvents` already accepts and passes through an `rngFn` parameter. If not, add it.

### Step 2: Write a failing test

```js
// tests/unit/event-engine.test.js — add to existing or create
it('checkEvents with the same seed always returns the same result', () => {
  const gsm = makeGSM();
  gsm.initNewGame();

  // Force a specific game day and system
  const state = gsm.getState();
  state.player.daysElapsed = 10;
  state.player.currentSystem = 0;

  const seed = `event-dock-10-0`;
  const rng1 = new SeededRandom(seed);
  const rng2 = new SeededRandom(seed);

  const result1 = gsm.checkEvents('dock', { system: 0 }, () => rng1.next());
  const result2 = gsm.checkEvents('dock', { system: 0 }, () => rng2.next());

  // Both results must be identical (both null, or both the same event)
  expect(result1?.id ?? null).toBe(result2?.id ?? null);
});
```

**Step 3: Run to verify it passes already (or identify what's missing)**

```
npm test -- tests/unit/event-engine.test.js
```

This test may already pass since it passes an explicit rng. The issue is that the *call site* in `useEventTriggers.js` doesn't pass one. The next step addresses the call site.

### Step 4: Fix useEventTriggers.js

In `handleTrigger` (around line 149), import `SeededRandom` and create a seeded rng before each call:

```js
import { SeededRandom } from '../game/utils/seeded-random.js';
```

```js
const handleTrigger = useCallback(
  (eventType, context) => {
    if (!gameStateManager) return;

    const state = gameStateManager.getState();
    if (!state) return;
    const day = Math.floor(state.player.daysElapsed);
    const system = state.player.currentSystem;
    const rng = new SeededRandom(`event-${eventType}-${day}-${system}`);
    const rngFn = () => rng.next();

    const event = gameStateManager.checkEvents(eventType, context, rngFn);

    if (!event) {
      if (eventType !== 'condition') {
        // Re-use the same rng instance for the condition check
        const condEvent = gameStateManager.checkEvents('condition', context, rngFn);
        if (condEvent) {
          emitNarrativeEvent(condEvent);
        }
      }
      return;
    }
    // ... rest of handleTrigger unchanged
  },
  // deps array — leave unchanged
);
```

> **Note:** Read the full `handleTrigger` in `useEventTriggers.js` before editing to ensure you don't accidentally remove any logic. The above only shows the rng threading.

**Step 5: Verify gameStateManager.checkEvents passes rngFn through**

Check `src/game/state/game-state-manager.js` for the `checkEvents` delegation method. It must pass `rngFn` to the manager. If it looks like this:

```js
checkEvents(eventType, context) {
  return this.eventEngineManager.checkEvents(eventType, context);
}
```

Fix it to:

```js
checkEvents(eventType, context, rngFn) {
  return this.eventEngineManager.checkEvents(eventType, context, rngFn);
}
```

**Step 6: Run full suite**

```
npm test
```

**Step 7: Commit**

```
git add src/hooks/useEventTriggers.js src/game/state/game-state-manager.js tests/unit/event-engine.test.js
git commit -m "fix: seed event trigger RNG with SeededRandom for deterministic encounter checks"
```

---

## Task 5: Fix ship quirk assignment using SeededRandom

**Severity:** Medium — new-game quirk assignment is non-deterministic; tests cannot assert on quirk values.

**Files:**
- Modify: `src/game/state/game-state-manager.js` (`initNewGame`)
- Modify: `src/game/state/managers/initialization.js` (`initializeShipState`)
- Test: `tests/unit/game-ship.test.js` (or create)

### Step 1: Write a failing test

```js
it('same ship seed always produces the same quirks', () => {
  const gsm1 = makeGSM();
  const gsm2 = makeGSM();

  // Pass the same seed to both
  gsm1.initNewGame('test-seed-abc');
  gsm2.initNewGame('test-seed-abc');

  expect(gsm1.getState().ship.quirks).toEqual(gsm2.getState().ship.quirks);
});

it('different seeds produce different quirks (probabilistically)', () => {
  const gsm1 = makeGSM();
  const gsm2 = makeGSM();

  gsm1.initNewGame('seed-alpha');
  gsm2.initNewGame('seed-beta');

  // These will differ unless extremely unlucky — fine for a unit test
  // If this flakes, use a stronger assertion
  const q1 = [...gsm1.getState().ship.quirks].sort().join(',');
  const q2 = [...gsm2.getState().ship.quirks].sort().join(',');
  expect(q1).not.toBe(q2);
});
```

**Step 2: Run to verify the first test fails**

```
npm test -- tests/unit/game-ship.test.js
```

**Step 3: Modify initNewGame to accept a seed**

In `src/game/state/game-state-manager.js`:

```js
// Before:
initNewGame() {
  const completeState = this.initializationManager.createInitialState();
  // ...

// After:
initNewGame(gameSeed = Date.now().toString()) {
  const completeState = this.initializationManager.createInitialState(gameSeed);
  // ...
```

**Step 4: Thread seed through InitializationManager**

In `src/game/state/managers/initialization.js`:

```js
import { SeededRandom } from '../../utils/seeded-random.js';

// Change createInitialState:
createInitialState(gameSeed = Date.now().toString()) {
  // ...
  const shipState = this.initializeShipState(gameSeed);
  // ...
}

// Change initializeShipState:
initializeShipState(gameSeed = Date.now().toString()) {
  const rng = new SeededRandom(`quirks-${gameSeed}`);
  const shipQuirks = this.gameStateManager.assignShipQuirks(() => rng.next());
  // ... rest unchanged
}
```

**Step 5: Run to verify tests pass**

```
npm test -- tests/unit/game-ship.test.js
```

**Step 6: Run full suite**

```
npm test
```

**Step 7: Commit**

```
git add src/game/state/game-state-manager.js src/game/state/managers/initialization.js tests/unit/game-ship.test.js
git commit -m "fix: seed ship quirk assignment with SeededRandom via gameSeed parameter"
```

---

## Task 6: Fix MissionCompleteNotifier missing MISSIONS_CHANGED subscription

**Severity:** Medium — the notifier only runs once on mount. Missions completing after the first check are never shown.

**Files:**
- Modify: `src/features/missions/MissionCompleteNotifier.jsx`
- Test: `tests/unit/MissionCompleteNotifier.test.jsx` (create)

### Step 1: Write a failing test

```jsx
// tests/unit/MissionCompleteNotifier.test.jsx
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MissionCompleteNotifier } from '../../src/features/missions/MissionCompleteNotifier.jsx';
// Check existing component tests for how GameContext is mocked

it('re-checks completable missions when MISSIONS_CHANGED fires', () => {
  // Render notifier with a mock gameStateManager that starts with no completable missions.
  // Fire MISSIONS_CHANGED.
  // Assert getCompletableMissions is called again (the notifier reacts).

  // Look at tests/unit/ for the pattern used to mock useGameAction and useGameEvent.
  // The key assertion: after MISSIONS_CHANGED fires, getCompletableMissions() must be called.
  const getCompletableMissions = vi.fn().mockReturnValue([]);
  // ... set up mock and render
  // ... fire event
  expect(getCompletableMissions).toHaveBeenCalledTimes(2); // once on mount, once on event
});
```

> **Note:** Check `tests/unit/` for existing component test patterns. The mock setup for `useGameAction` and `useGameEvent` varies by test file.

**Step 2: Run to verify it fails**

```
npm test -- tests/unit/MissionCompleteNotifier.test.jsx
```

**Step 3: Fix MissionCompleteNotifier.jsx**

The component needs to re-check completable missions whenever missions state changes. Import `useGameEvent` and subscribe to `MISSIONS_CHANGED`. Use the returned value to trigger recomputation:

```jsx
import { useState, useEffect } from 'react';
import { useGameAction } from '../../hooks/useGameAction';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';

export function MissionCompleteNotifier() {
  const { completeMission, getCompletableMissions } = useGameAction();
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);  // subscribe for re-renders
  const [completable, setCompletable] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const found = getCompletableMissions();
    if (found.length > 0) {
      setCompletable(found);
      setCurrentIndex(0);
    }
  }, [missions, getCompletableMissions]);  // re-run when missions change

  // ... rest of component unchanged
```

**Step 4: Run to verify it passes**

```
npm test -- tests/unit/MissionCompleteNotifier.test.jsx
```

**Step 5: Run full suite**

```
npm test
```

**Step 6: Commit**

```
git add src/features/missions/MissionCompleteNotifier.jsx tests/unit/MissionCompleteNotifier.test.jsx
git commit -m "fix: subscribe MissionCompleteNotifier to MISSIONS_CHANGED for reactive re-check"
```

---

## Task 7: Fix checkMissionDeadlines missing markDirty

**Severity:** Medium — deadline failures update state and fire events but don't persist until an unrelated mutation triggers a save.

**Files:**
- Modify: `src/game/state/managers/mission.js` (end of `checkMissionDeadlines`)
- Test: `tests/unit/game-missions.test.js`

### Step 1: Read checkMissionDeadlines

Open `src/game/state/managers/mission.js` around line 363. Confirm it never calls `markDirty()`. Note where the method ends (look for the last mutation).

### Step 2: Write a failing test

```js
it('checkMissionDeadlines calls markDirty when missions expire', () => {
  const gsm = makeGSM();
  gsm.initNewGame();

  // Create an active mission with a past deadline
  // Check existing mission tests for how to inject a test mission into state
  const state = gsm.getState();
  state.missions.active.push({
    id: 'test-mission-1',
    title: 'Expired Test Mission',
    deadline: 0,           // day 0 deadline
    destination: null,
    missionCargo: null,
    penalties: {},
  });
  state.player.daysElapsed = 5; // past the deadline

  const markDirty = vi.spyOn(gsm, 'markDirty');
  gsm.checkMissionDeadlines();

  expect(markDirty).toHaveBeenCalled();
});
```

**Step 3: Run to verify it fails**

```
npm test -- tests/unit/game-missions.test.js
```

**Step 4: Fix checkMissionDeadlines**

At the very end of `checkMissionDeadlines` (after all the mutations, just before the closing brace), add:

```js
this.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...state.missions });
this.gameStateManager.markDirty();
```

> **Note:** Check whether `checkMissionDeadlines` already emits `MISSIONS_CHANGED`. If it does, just add `markDirty()`. If not, add both. Read the full method before editing.

**Step 5: Run to verify it passes**

```
npm test -- tests/unit/game-missions.test.js
```

**Step 6: Run full suite**

```
npm test
```

**Step 7: Commit**

```
git add src/game/state/managers/mission.js tests/unit/game-missions.test.js
git commit -m "fix: call markDirty in checkMissionDeadlines so deadline failures are persisted"
```

---

## Task 8: Fix calculateProfit returning a string instead of a number

**Severity:** Medium — `toFixed()` returns a string; any comparison with the result type-coerces silently.

**Files:**
- Modify: `src/features/trade/tradeUtils.js` (line ~128)
- Test: `tests/unit/game-trading.test.js` (or `tradeUtils.test.js`)

### Step 1: Write a failing test

```js
it('calculateProfit percentage is a number, not a string', () => {
  const { percentage } = calculateProfit(
    { buyPrice: 100 },
    120
  );
  expect(typeof percentage).toBe('number');
  expect(percentage).toBe(20); // (120-100)/100 * 100 = 20%, rounded
});

it('calculateProfit percentage rounds to integer', () => {
  const { percentage } = calculateProfit(
    { buyPrice: 3 },
    4
  );
  // (4-3)/3 * 100 = 33.333... → rounds to 33
  expect(percentage).toBe(33);
});
```

**Step 2: Run to verify it fails**

```
npm test -- tests/unit/game-trading.test.js
```

**Step 3: Fix calculateProfit**

In `src/features/trade/tradeUtils.js`, change line ~128:

```js
// Before:
const percentage = ((margin / stack.buyPrice) * 100).toFixed(1);

// After:
const percentage = Math.round((margin / stack.buyPrice) * 100);
```

**Step 4: Check all callers of calculateProfit**

Run this search to find every caller:

```
grep -rn "calculateProfit\|\.percentage" src/features/trade/
```

Check each caller. Any that appended `%` after the value (e.g., `${profit.percentage}%`) will still work correctly with a number. Any that called `.toFixed` or `.toString` on the result should be updated.

**Step 5: Run to verify it passes**

```
npm test -- tests/unit/game-trading.test.js
```

**Step 6: Run full suite**

```
npm test
```

**Step 7: Commit**

```
git add src/features/trade/tradeUtils.js tests/unit/game-trading.test.js
git commit -m "fix: calculateProfit returns integer percentage instead of toFixed string"
```

---

## Task 9: Add ErrorBoundary around encounter panels

**Severity:** Medium — a render error in any encounter panel crashes the entire UI with no recovery path.

**Files:**
- Modify: the component that renders the encounter panel (find it — search for `EncounterPanel` or `ENCOUNTER_TRIGGERED` in JSX files)
- Test: manual verification (error boundaries are difficult to unit test; smoke test is sufficient)

### Step 1: Find where encounter panels are rendered

```
grep -rn "EncounterPanel\|viewMode.*ENCOUNTER\|ENCOUNTER_TRIGGERED" src/
```

Identify the JSX that renders the encounter subtree. It's likely in `src/App.jsx` or `src/features/danger/`.

### Step 2: Check existing ErrorBoundary

Run:
```
grep -rn "ErrorBoundary" src/
```

There is already an `ErrorBoundary` component (check `src/components/`). Note its import path and props.

### Step 3: Wrap the encounter subtree

In the file that renders encounter panels, wrap the encounter subtree with `<ErrorBoundary>`:

```jsx
import { ErrorBoundary } from '../../components/ErrorBoundary'; // adjust path

// Before:
{viewMode === VIEW_MODES.ENCOUNTER && (
  <EncounterPanel ... />
)}

// After:
<ErrorBoundary>
  {viewMode === VIEW_MODES.ENCOUNTER && (
    <EncounterPanel ... />
  )}
</ErrorBoundary>
```

> **Note:** Read the `ErrorBoundary` component signature to see what props it accepts and whether it shows a fallback UI.

**Step 4: Manual smoke test**

Run `npm run dev`. Navigate to a system and trigger an encounter. Verify the encounter UI renders correctly. The boundary should be invisible in normal operation.

**Step 5: Run full suite**

```
npm test
```

**Step 6: Commit**

```
git add <files changed>
git commit -m "fix: wrap encounter panel subtree in ErrorBoundary to prevent full-UI crash on render error"
```

---

## Task 10: Low-severity cleanup batch

Commit each sub-item separately.

### 10a: Deduplicate sanitizeShipName

**Files:**
- `src/game/state/game-state-manager.js` (exported standalone function, line ~54)
- `src/game/state/managers/ship.js` (method, line ~272)
- `src/features/title-screen/ShipNamingDialog.jsx` (imports from game-state-manager)

**Plan:** Keep the standalone export in `game-state-manager.js` as the canonical source (it's already exported and imported by `ShipNamingDialog`). Delete the duplicate method from `ShipManager` and replace the one internal call in `ship.js` with an import of the standalone function.

Check: in `ship.js` at line ~254, `this.sanitizeShipName(newName)` — change to `sanitizeShipName(newName)` after adding the import.

```
// In ship.js, add import:
import { sanitizeShipName } from '../game-state-manager.js';

// Then remove the sanitizeShipName method from ShipManager entirely.
```

Write a quick unit test confirming both callers produce identical results for the same input before deleting:

```js
it('sanitizeShipName trims and strips HTML', () => {
  expect(sanitizeShipName('<b>Hero</b>')).toBe('Hero');
  expect(sanitizeShipName('  ')).toBe('Unnamed'); // check DEFAULT_NAME value
  expect(sanitizeShipName('')).toBe('Unnamed');
});
```

Commit:
```
git add src/game/state/managers/ship.js src/game/state/game-state-manager.js
git commit -m "fix: remove duplicate sanitizeShipName from ShipManager, use canonical export from game-state-manager"
```

---

### 10b: Fix ShipStatus.jsx display rounding

**Files:**
- `src/features/hud/ShipStatus.jsx` (lines 62, 73, 85, 97)

The project standard is: integer display, round at the display layer only when the event data is already a float that cannot be rounded upstream without precision loss. Here, the event emits raw floats. The correct fix is to round in the component using `Math.round()` rather than `toFixed(1)`:

```jsx
// Before (4 occurrences):
{safeFuel.toFixed(1)}%
{safeCondition.hull.toFixed(1)}%
{safeCondition.engine.toFixed(1)}%
{safeCondition.lifeSupport.toFixed(1)}%

// After:
{Math.round(safeFuel)}%
{Math.round(safeCondition.hull)}%
{Math.round(safeCondition.engine)}%
{Math.round(safeCondition.lifeSupport)}%
```

Also update the `style={{ width: ... }}` values to remain as raw floats (CSS handles sub-pixel precision well — do NOT round there). The display text and the bar width are separate concerns.

Write a snapshot or value test if your test suite has component rendering tests. Otherwise, verify visually with `npm run dev`.

Commit:
```
git add src/features/hud/ShipStatus.jsx
git commit -m "fix: round condition display values with Math.round instead of toFixed in ShipStatus"
```

---

### 10c: Move magic constants to constants.js

**Files:**
- `src/game/state/managers/negotiation.js` (line ~102, the `0.5` multiplier)
- `src/game/state/managers/distress.js` (line ~148, `qty: 2`)
- `src/game/constants.js`

In `constants.js`, find `PIRATE_CREDIT_DEMAND_CONFIG` and add:
```js
COUNTER_PROPOSAL_DISCOUNT: 0.5,
```

Find `DISTRESS_CONFIG` (or create it) and add:
```js
LOOT_SALVAGE_PARTS_QTY: 2,
```

Update the call sites to use these named constants.

Write a test that the counter-proposal cost equals `MIN_CREDIT_DEMAND * COUNTER_PROPOSAL_DISCOUNT` to pin the behavior.

Commit:
```
git add src/game/constants.js src/game/state/managers/negotiation.js src/game/state/managers/distress.js
git commit -m "fix: move negotiation discount and distress salvage quantity to named constants"
```

---

### 10d: Fix App.jsx missing useEffect dependency

**Files:**
- `src/App.jsx` (line ~415)

```jsx
// Before:
useEffect(() => {
  if (pavonisRunEvent) {
    handleStartPavonisRun();
  }
}, [pavonisRunEvent]);

// After:
useEffect(() => {
  if (pavonisRunEvent) {
    handleStartPavonisRun();
  }
}, [pavonisRunEvent, handleStartPavonisRun]);
```

If `handleStartPavonisRun` is not already wrapped in `useCallback`, wrap it:

```jsx
const handleStartPavonisRun = useCallback(() => {
  // existing body
}, [/* deps */]);
```

Check what `handleStartPavonisRun` uses to determine its `useCallback` deps. Run `npm run lint` — it should no longer warn about exhaustive-deps for this hook.

Commit:
```
git add src/App.jsx
git commit -m "fix: add handleStartPavonisRun to useEffect dependency array in App.jsx"
```

---

### 10e: Remove hudUtils.js re-export indirection

**Files:**
- `src/features/hud/hudUtils.js`
- Any file importing from `hudUtils.js`

Find all callers:
```
grep -rn "hudUtils" src/
```

For each caller, update the import to come directly from `../../game/constants` (or `@game/constants` using the path alias). Then delete `hudUtils.js`.

Commit:
```
git add src/features/hud/ <other changed files>
git commit -m "fix: remove hudUtils.js indirection, import calculateDistanceFromSol directly from constants"
```

---

### 10f: Document AchievementsList re-render pattern

**Files:**
- `src/features/achievements/AchievementsList.jsx`

The current pattern (call `useGameEvent` and discard the return value; read data directly from `gameStateManager`) is a valid but fragile pattern that looks like a mistake. Add a comment to make the intent explicit:

```jsx
// Subscribe to trigger re-renders when achievements change.
// The return value is not used directly because getAchievementProgress()
// returns a computed view that cannot be reconstructed from raw event data alone.
useGameEvent(EVENT_NAMES.ACHIEVEMENTS_CHANGED);
```

No test needed — this is a comment-only change.

Commit:
```
git add src/features/achievements/AchievementsList.jsx
git commit -m "fix: document intentional useGameEvent discard pattern in AchievementsList"
```

---

## Verification

After all tasks, run:

```bash
npm run all
```

This runs `npm run clean` (lint + format) followed by `npm test`. The output must show zero lint errors, zero test failures, and zero stderr warnings.

---

## Notes for the implementer

- **Test factory pattern:** Every test file that needs a `GameStateManager` uses a local factory function. Before writing a new test, search for `makeGSM\|makeTestGSM\|new GameStateManager` in existing test files to find the established pattern.
- **EVENT_NAMES constants:** All event name strings live in `src/game/constants.js` under `EVENT_NAMES`. Never hard-code event name strings in tests.
- **Valid NPC IDs:** Look in `src/game/data/npc-data.js` for the `ALL_NPCS` array to find valid NPC ids for test fixtures.
- **Tasks 3–5 may reveal downstream test failures** caused by tests that previously relied on `Math.random()` being mockable. If so, update those tests to pass an explicit `rng` parameter.
- **Task 9 (ErrorBoundary)** may require reading `src/components/ErrorBoundary.jsx` first to understand its API before wrapping.
