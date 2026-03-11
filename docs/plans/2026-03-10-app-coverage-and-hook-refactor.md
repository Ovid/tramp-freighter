# App.jsx Coverage + Hook Refactor Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Increase App.jsx test coverage from ~73% to ~90%+, exclude main.jsx from coverage, then refactor flaws #3 (useGameAction monolith), #4 (useGameEvent manual mapping), and #5 (App.jsx orchestration complexity).

**Architecture:** Phase 1 adds coverage as a safety net. Phase 2 extracts encounter orchestration from App.jsx into a `useEncounterOrchestration` hook. Phase 3 splits `useGameAction` into domain-specific hooks. Phase 4 replaces the manual event mapping in `useGameEvent` with an auto-derivation pattern.

**Tech Stack:** React 18, Vitest, @testing-library/react, fast-check

---

## Phase 1: Coverage Foundation

### Task 1: Exclude main.jsx from coverage

`main.jsx` is the application entry point (ReactDOM.createRoot, CSS imports, async init). It cannot be meaningfully unit tested — it requires a real DOM, browser APIs, and CSS loading. Excluding it from coverage prevents a permanent 0% drag on metrics.

**Files:**
- Modify: `vitest.config.js:24`

**Step 1: Add main.jsx to coverage exclude list**

```js
// In vitest.config.js, coverage.exclude array:
exclude: ['node_modules/', 'tests/', '*.config.js', 'dist/', 'src/main.jsx'],
```

**Step 2: Verify coverage still runs**

Run: `npx vitest run --coverage 2>&1 | grep -E "main\.jsx|All files"`
Expected: main.jsx no longer appears in coverage output

**Step 3: Commit**

```
git add vitest.config.js
git commit -m "Exclude main.jsx from coverage (entry point, not unit-testable)"
```

---

### Task 2: App.jsx coverage — Load existing game path

Covers: lines 162-175 (`handleStartGame` else branch — load game, post-credits check, Yumi reset)

**Files:**
- Create: `tests/integration/app-load-game.integration.test.jsx`

**Step 1: Write the test**

This test needs:
- A saved game in localStorage
- Click "Load Game" button
- Verify transition to ORBIT mode

The test also needs the standard scene/animation mocks used by other App integration tests. Use the same mock pattern as `encounter-resolution.integration.test.jsx`.

Key behaviors to test:
1. Load Game button appears when save exists, clicking it transitions to ORBIT
2. Post-credits load resets Yumi interaction counter

**Step 2: Run test to verify it passes**

Run: `npx vitest run tests/integration/app-load-game.integration.test.jsx`
Expected: PASS

**Step 3: Verify coverage improved**

Run: `npx vitest run --coverage 2>&1 | grep "App.jsx"`
Expected: Lines 162-175 now covered

**Step 4: Commit**

```
git add tests/integration/app-load-game.integration.test.jsx
git commit -m "Add integration test for load game path in App.jsx"
```

---

### Task 3: App.jsx coverage — Save failed + exotic matter notifications

Covers: lines 116-119 (save failed notification), lines 123-147 (exotic matter scanner feedback)

**Files:**
- Create: `tests/integration/app-notifications.integration.test.jsx`

**Step 1: Write the tests**

Test save-failed notification:
- Navigate to orbit
- Emit `EVENT_NAMES.SAVE_FAILED` with `{ message: 'Test save error' }`
- Verify error notification appears

Test exotic matter collected:
- Navigate to orbit, dock
- Emit `EVENT_NAMES.EXOTIC_MATTER_COLLECTED` with `{ count: 1, total: 5 }`
- Verify info notification appears with expected text

Test exotic matter already sampled:
- Navigate to orbit, dock
- Emit `EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED`
- Verify info notification appears

Test cleanup on unmount:
- Render, then unmount
- Verify unsubscribe called for exotic matter events

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-notifications.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-notifications.integration.test.jsx
git commit -m "Add integration tests for save-failed and exotic matter notifications"
```

---

### Task 4: App.jsx coverage — Pirate flee path

Covers: lines 296-325 (`handleEncounterChoice` — flee from initial pirate panel)

**Files:**
- Create: `tests/integration/app-pirate-flee.integration.test.jsx`

**Step 1: Write the tests**

Test successful flee:
- Navigate to orbit with devMode
- Trigger pirate encounter via dev admin
- Choose "Flee" → "Confirm Flee"
- Mock `game.resolveCombatChoice` to return `{ success: true, description: 'Escaped!' }`
- Verify OutcomePanel appears

Test failed flee escalates to combat:
- Navigate to orbit with devMode
- Trigger pirate encounter
- Choose "Flee" → "Confirm Flee"
- Mock `game.resolveCombatChoice` to return `{ success: false, costs: { hull: 10 }, description: 'Failed escape' }`
- Verify CombatPanel appears with flee context

Test flee error handling:
- Mock `game.resolveCombatChoice` to throw
- Choose flee, verify return to orbit

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-pirate-flee.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-pirate-flee.integration.test.jsx
git commit -m "Add integration tests for pirate flee path in App.jsx"
```

---

### Task 5: App.jsx coverage — Combat and negotiation resolution

Covers: lines 345-363 (combat/negotiation sub-choice resolution), lines 370-391 (escalation), lines 407-413 (error path)

**Files:**
- Create: `tests/integration/app-encounter-resolution-paths.integration.test.jsx`

**Step 1: Write the tests**

Test combat choice resolution:
- Trigger pirate encounter → Fight → confirm → CombatPanel
- Choose "Return Fire", verify outcome panel appears

Test negotiation flee (maps to evasive):
- Trigger pirate encounter → Negotiate → confirm → NegotiationPanel
- Choose flee from negotiation, verify it calls `resolveCombatChoice` with 'evasive'

Test negotiation counter-proposal:
- Trigger pirate encounter → Negotiate → confirm
- Choose counter-proposal, verify `resolveNegotiation` called

Test failed negotiation escalation:
- Mock `game.resolveNegotiation` to return `{ escalate: true }`
- Verify encounter phase transitions to escalated_combat
- Verify threat level is bumped
- Click Continue on outcome → verify return to pirate encounter with negotiate disabled

Test encounter resolution error:
- Mock `game.resolveEncounter` to throw
- Verify console.error called and view returns to ORBIT

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-encounter-resolution-paths.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-encounter-resolution-paths.integration.test.jsx
git commit -m "Add integration tests for combat/negotiation resolution paths"
```

---

### Task 6: App.jsx coverage — Non-pirate encounter types

Covers: lines 659-663 (InspectionPanel), 666-670 (MechanicalFailurePanel), 673-677 (DistressCallPanel), 418-422 (handleEncounterClose)

**Files:**
- Create: `tests/integration/app-non-pirate-encounters.integration.test.jsx`

**Step 1: Write the tests**

For each encounter type (inspection, mechanical_failure, distress_call):
- Navigate to orbit
- Emit `EVENT_NAMES.ENCOUNTER_TRIGGERED` with appropriate encounter data
- Verify the correct panel renders
- Close the encounter, verify return to orbit

Encounter data shapes:
```js
// Inspection
{ type: 'inspection', encounter: { id: 'insp_1', title: 'Customs Inspection', description: '...', choices: [...] } }
// Mechanical failure
{ type: 'mechanical_failure', encounter: { id: 'mech_1', title: 'Engine Malfunction', systemType: 'engine', severity: 'minor', choices: [...] } }
// Distress call
{ type: 'distress_call', encounter: { id: 'dist_1', title: 'Distress Signal', description: '...', choices: [...] } }
```

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-non-pirate-encounters.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-non-pirate-encounters.integration.test.jsx
git commit -m "Add integration tests for inspection, mechanical failure, and distress call encounters"
```

---

### Task 7: App.jsx coverage — Narrative events and system panel handlers

Covers: lines 496-497 (handleNarrativeClose), 237-242 (system selected/deselected), 251-252 (close system panel)

**Files:**
- Create: `tests/integration/app-narrative-and-system.integration.test.jsx`

**Step 1: Write the tests**

Test narrative event overlay:
- Navigate to orbit
- Emit `EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED` with event data
- Verify NarrativeEventPanel appears
- Close it, verify it disappears
- Verify narrative doesn't change viewMode (it's an overlay)

Test system selection/deselection:
- These are callback props passed to StarMapCanvas
- May need to mock SystemPanel to expose the system selection callbacks
- Or test via the System Info button which calls handleOpenSystemInfo (line 226-234)

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-narrative-and-system.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-narrative-and-system.integration.test.jsx
git commit -m "Add integration tests for narrative events and system panel interactions"
```

---

### Task 8: App.jsx coverage — Endgame flows

Covers: lines 500-506 (Pavonis run start/complete), 509-516 (credits complete), 520-522 (return to title), 526-535 (pavonisRun/epiloguePreview effects), 578-581 (PostCreditsStation), 710-718 (PavonisRun/Epilogue rendering)

**Files:**
- Create: `tests/integration/app-endgame-flow.integration.test.jsx`

**Step 1: Write the tests**

These endgame components (PavonisRun, Epilogue) likely have complex internal rendering. Mock them to simple stubs that expose their callbacks:

```js
vi.mock('../../src/features/endgame/PavonisRun.jsx', () => ({
  PavonisRun: ({ onComplete, onCancel }) => (
    <div data-testid="pavonis-run">
      <button onClick={onComplete}>Complete Run</button>
      <button onClick={onCancel}>Cancel Run</button>
    </div>
  ),
}));

vi.mock('../../src/features/endgame/Epilogue.jsx', () => ({
  Epilogue: ({ onCreditsComplete }) => (
    <div data-testid="epilogue">
      <button onClick={onCreditsComplete}>Credits Done</button>
    </div>
  ),
}));

vi.mock('../../src/features/endgame/PostCreditsStation.jsx', () => ({
  PostCreditsStation: ({ onOpenPanel, onReturnToTitle }) => (
    <div data-testid="post-credits-station">
      <button onClick={onReturnToTitle}>Return to Title</button>
    </div>
  ),
}));
```

Test Pavonis Run flow:
- Navigate to orbit
- Emit `EVENT_NAMES.PAVONIS_RUN_TRIGGERED`
- Verify PavonisRun renders
- Click "Complete Run" → verify Epilogue renders
- Click "Credits Done" → verify PostCreditsStation renders
- Click "Return to Title" → verify title screen renders

Test Pavonis Run cancel:
- Emit PAVONIS_RUN_TRIGGERED
- Click "Cancel Run" → verify return to STATION mode

Test epilogue preview (dev):
- Emit `EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED`
- Verify Epilogue renders directly (skipping Pavonis Run)

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/app-endgame-flow.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/app-endgame-flow.integration.test.jsx
git commit -m "Add integration tests for endgame flows (Pavonis Run, Epilogue, post-credits)"
```

---

### Task 9: App.jsx coverage — Jump complete and salvage messages

Covers: lines 266-278 (handleJumpComplete), 442-443 (salvage messages in handleApplyOutcome)

**Files:**
- Modify: `tests/integration/encounter-buffering.integration.test.jsx` (add test cases)

**Step 1: Write additional tests**

Test handleJumpComplete clears selection:
- Mock SystemPanel with onJumpComplete callback
- Trigger jump start, then trigger jump complete
- Verify viewingSystemId cleared and deselectStar called

Test salvage messages:
- In an encounter resolution test, mock the outcome to include salvageMessages
- Verify notifications appear for each message

**Step 2: Run and verify**

Run: `npx vitest run tests/integration/encounter-buffering.integration.test.jsx`
Expected: PASS

**Step 3: Commit**

```
git add tests/integration/encounter-buffering.integration.test.jsx
git commit -m "Add tests for jump complete handler and salvage notification messages"
```

---

### Task 10: Coverage checkpoint

Run full coverage and verify App.jsx improvement.

Run: `npx vitest run --coverage 2>&1 | grep "App.jsx"`
Expected: Coverage should be ~85-92% statements, up from 72.89%

If specific lines are still uncovered, assess whether they're worth pursuing or are edge cases that would require disproportionate test complexity.

**Step 1: Commit any remaining adjustments**

---

## Phase 2: Extract Encounter Orchestration from App.jsx (Flaw #5)

This is the highest-value refactor. App.jsx currently manages encounter state machine, encounter buffering during jumps, and encounter resolution — all interleaved with view mode management, system selection, narrative events, and endgame flows. Extracting encounter orchestration into a dedicated hook reduces App.jsx from ~724 lines to ~450 and eliminates 3 of the 4 mutable refs.

### Task 11: Create useEncounterOrchestration hook

**Files:**
- Create: `src/hooks/useEncounterOrchestration.js`
- Create: `tests/unit/use-encounter-orchestration.test.jsx`

**Step 1: Write failing tests for the hook**

Test the hook's public API:
- `encounterState` — contains `currentEncounter`, `encounterOutcome`, `encounterPhase`, `combatContext`
- `handleEncounterTriggered(encounterData)` — sets encounter state
- `handleEncounterChoice(choice)` — routes to combat/negotiation/resolution
- `handleEncounterClose()` — clears encounter state
- `handleOutcomeContinue()` — handles escalation or clears state
- `handleJumpStart()` — sets jump-in-progress flag
- `handleJumpComplete()` — clears flag, reveals buffered encounter
- `isEncounterActive` — boolean derived from currentEncounter !== null
- `viewMode` returns to ORBIT should be signaled to the parent via a callback

Test encounter buffering:
- During jump, encounters are buffered
- On JUMP_ANIMATION_NEAR_END, buffered encounter is revealed

**Step 2: Implement the hook**

Extract lines 90-93 (encounter state), 94-96 (refs), 280-443 (all encounter handlers), 446-481 (encounter/animation effects) from App.jsx into the new hook.

The hook receives `game` and `notificationCtx` as parameters (or gets them from context internally).

It returns:
```js
{
  // State
  currentEncounter, encounterOutcome, encounterPhase, combatContext,
  // Handlers
  handleEncounterTriggered, handleEncounterChoice,
  handleEncounterClose, handleOutcomeContinue,
  // Jump coordination
  handleJumpStart, handleJumpComplete,
  jumpInProgressRef,
  // Derived
  isEncounterActive: currentEncounter !== null,
}
```

**Step 3: Run tests**

Run: `npx vitest run tests/unit/use-encounter-orchestration.test.jsx`
Expected: PASS

**Step 4: Commit**

```
git add src/hooks/useEncounterOrchestration.js tests/unit/use-encounter-orchestration.test.jsx
git commit -m "Extract encounter orchestration from App.jsx into useEncounterOrchestration hook"
```

---

### Task 12: Wire useEncounterOrchestration into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Replace inline encounter logic with hook**

Replace ~160 lines of encounter state + handlers + effects with:
```js
const {
  currentEncounter, encounterOutcome, encounterPhase, combatContext,
  handleEncounterTriggered, handleEncounterChoice,
  handleEncounterClose, handleOutcomeContinue,
  handleJumpStart, handleJumpComplete,
  jumpInProgressRef,
} = useEncounterOrchestration();
```

Remove:
- `currentEncounter`, `encounterOutcome`, `encounterPhase`, `combatContext` useState
- `lastHandledEncounter`, `jumpInProgressRef`, `pendingEncounterRef` useRef
- `handleEncounterTriggered`, `handleEncounterChoice`, `handleEncounterClose`, `handleOutcomeContinue`, `handleApplyOutcome` functions
- The 3 encounter-related useEffect blocks (lines 446-481)
- Import of `transformOutcomeForDisplay`, `applyEncounterOutcome`, `NEGOTIATION_CONFIG`

Keep the JSX rendering of encounter panels in App.jsx — it still reads the state from the hook.

**Step 2: Run ALL existing tests**

Run: `npm test`
Expected: ALL tests pass (the integration tests exercise App.jsx end-to-end)

**Step 3: Run coverage**

Run: `npx vitest run --coverage 2>&1 | grep "App.jsx"`
Expected: App.jsx coverage should remain the same or improve (fewer lines to cover)

**Step 4: Commit**

```
git add src/App.jsx
git commit -m "Wire useEncounterOrchestration hook into App.jsx, removing ~160 lines"
```

---

## Phase 3: Split useGameAction into Domain Hooks (Flaw #3)

`useGameAction()` returns 60+ methods mixing trading, navigation, missions, quests, debt, NPC, and utility queries. Components receive far more API surface than they use.

Split into focused hooks while keeping `useGameAction()` as a convenience re-export for backward compatibility (avoids touching 65+ components).

### Task 13: Create domain-specific action hooks

**Files:**
- Create: `src/hooks/useTradeActions.js`
- Create: `src/hooks/useNavigationActions.js`
- Create: `src/hooks/useMissionActions.js`
- Create: `src/hooks/useShipActions.js`
- Create: `src/hooks/useNPCActions.js`
- Create: `src/hooks/useQuestActions.js`
- Create: `src/hooks/useDebtActions.js`
- Create: `tests/unit/domain-action-hooks.test.jsx`
- Modify: `src/hooks/useGameAction.js`

**Step 1: Write failing tests**

Test each domain hook returns exactly its expected methods and delegates to game correctly. Example:

```js
describe('useTradeActions', () => {
  it('returns buyGood, sellGood, getCurrentSystemPrices, recordVisitedPrices, calculateTradeWithholding', () => {
    const { result } = renderHook(() => useTradeActions(), { wrapper });
    expect(Object.keys(result.current).sort()).toEqual([
      'buyGood', 'calculateTradeWithholding', 'getCurrentSystemPrices',
      'recordVisitedPrices', 'sellGood',
    ]);
  });
});
```

**Step 2: Implement domain hooks**

Each hook follows the same pattern:
```js
export function useTradeActions() {
  const game = useGame();
  return useMemo(() => ({
    buyGood: (goodType, quantity, price) => game.buyGood(goodType, quantity, price),
    sellGood: (stackIndex, quantity, salePrice) => game.sellGood(stackIndex, quantity, salePrice),
    getCurrentSystemPrices: () => game.getCurrentSystemPrices(),
    recordVisitedPrices: () => game.recordVisitedPrices(),
    calculateTradeWithholding: (amount) => game.calculateTradeWithholding(amount),
  }), [game]);
}
```

Domain groupings:
- **useTradeActions**: buyGood, sellGood, getCurrentSystemPrices, recordVisitedPrices, calculateTradeWithholding
- **useNavigationActions**: executeJump
- **useShipActions**: refuel, repair, applyEmergencyPatch, cannibalizeSystem, purchaseUpgrade, updateShipName, moveToHiddenCargo, moveToRegularCargo, validateRefuel, getFuelPrice
- **useNPCActions**: canGetFreeRepair, getFreeRepair, getServiceDiscount, purchaseIntelligence, generateRumor
- **useMissionActions**: acceptMission, completeMission, abandonMission, refreshMissionBoard, getActiveMissions, getCompletableMissions, updatePassengerSatisfaction, dismissMissionFailureNotice
- **useQuestActions**: getQuestStage, advanceQuest, isQuestComplete, getQuestState, canStartQuestStage, checkQuestObjectives, getNarrativeFlags, getEpilogueData, getEpilogueStats
- **useDebtActions**: getDebtInfo, borrowFromCole, makeDebtPayment

**Step 3: Refactor useGameAction to compose from domain hooks**

```js
export function useGameAction() {
  const trade = useTradeActions();
  const navigation = useNavigationActions();
  const ship = useShipActions();
  const npc = useNPCActions();
  const missions = useMissionActions();
  const quests = useQuestActions();
  const debt = useDebtActions();
  const game = useGame();

  return useMemo(() => ({
    ...trade, ...navigation, ...ship, ...npc, ...missions, ...quests, ...debt,
    // Remaining actions that don't fit a domain:
    dock: () => game.dock(),
    undock: () => game.undock(),
    saveGame: () => game.saveGame(),
    newGame: () => game.initNewGame(),
    updateCredits: (n) => game.updateCredits(n),
  }), [trade, navigation, ship, npc, missions, quests, debt, game]);
}
```

**Step 4: Run ALL tests**

Run: `npm test`
Expected: ALL 4,108+ tests pass — useGameAction still returns the same interface

**Step 5: Commit**

```
git add src/hooks/useTradeActions.js src/hooks/useNavigationActions.js src/hooks/useMissionActions.js src/hooks/useShipActions.js src/hooks/useNPCActions.js src/hooks/useQuestActions.js src/hooks/useDebtActions.js src/hooks/useGameAction.js tests/unit/domain-action-hooks.test.jsx
git commit -m "Split useGameAction into domain-specific hooks, preserve backward compatibility"
```

---

### Task 14: Migrate one component to use domain hook (proof of concept)

**Files:**
- Modify: `src/features/trade/TradePanel.jsx` (or whichever component is simplest)

**Step 1: Replace useGameAction with useTradeActions**

Change:
```js
const { buyGood, sellGood, getCurrentSystemPrices } = useGameAction();
```
To:
```js
const { buyGood, sellGood, getCurrentSystemPrices } = useTradeActions();
```

**Step 2: Run tests**

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```
git add src/features/trade/TradePanel.jsx
git commit -m "Migrate TradePanel to useTradeActions domain hook"
```

Note: Migrating remaining components is optional and can be done incrementally. The backward-compatible `useGameAction` ensures nothing breaks.

---

## Phase 4: Replace Manual Event Mapping in useGameEvent (Flaw #4)

`extractStateForEvent()` manually maps 37 event names to state slices. Adding a new event requires updating this function; forgetting causes silent UI staleness.

Replace with a declarative mapping object defined alongside EVENT_NAMES in constants.js, so event-to-state mappings are co-located with event name definitions.

### Task 15: Create EVENT_STATE_MAP in constants.js

**Files:**
- Modify: `src/game/constants.js`
- Create: `tests/unit/event-state-map.test.js`

**Step 1: Write failing tests**

```js
describe('EVENT_STATE_MAP', () => {
  it('has a mapping for every EVENT_NAME', () => {
    const eventNames = Object.values(EVENT_NAMES);
    const mappedEvents = Object.keys(EVENT_STATE_MAP);
    // Events that pass data directly (no state extraction needed)
    const directDataEvents = [
      EVENT_NAMES.CONDITION_WARNING,
      EVENT_NAMES.ENCOUNTER_TRIGGERED,
      EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED,
      EVENT_NAMES.SAVE_FAILED,
      EVENT_NAMES.JUMP_ANIMATION_NEAR_END,
      EVENT_NAMES.EXOTIC_MATTER_COLLECTED,
      EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED,
      EVENT_NAMES.PAVONIS_RUN_TRIGGERED,
      EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED,
    ];
    for (const name of eventNames) {
      if (!directDataEvents.includes(name)) {
        expect(mappedEvents).toContain(name);
      }
    }
  });

  it('each mapping is a function that accepts state and returns a value', () => {
    for (const [eventName, extractor] of Object.entries(EVENT_STATE_MAP)) {
      expect(typeof extractor).toBe('function');
    }
  });
});
```

**Step 2: Define EVENT_STATE_MAP**

In `constants.js`, near EVENT_NAMES:
```js
export const EVENT_STATE_MAP = {
  [EVENT_NAMES.CREDITS_CHANGED]: (state) => state.player.credits,
  [EVENT_NAMES.DEBT_CHANGED]: (state) => state.player.debt,
  [EVENT_NAMES.FUEL_CHANGED]: (state) => state.ship.fuel,
  [EVENT_NAMES.LOCATION_CHANGED]: (state) => state.player.currentSystem,
  // ... all 28 state-extracting events
};
```

**Step 3: Run test**

Run: `npx vitest run tests/unit/event-state-map.test.js`
Expected: PASS

**Step 4: Commit**

```
git add src/game/constants.js tests/unit/event-state-map.test.js
git commit -m "Add EVENT_STATE_MAP declarative mapping co-located with EVENT_NAMES"
```

---

### Task 16: Refactor useGameEvent to use EVENT_STATE_MAP

**Files:**
- Modify: `src/hooks/useGameEvent.js`

**Step 1: Replace extractStateForEvent with EVENT_STATE_MAP lookup**

```js
import { EVENT_STATE_MAP } from '../game/constants.js';

function extractStateForEvent(eventName, state) {
  if (!state) return null;
  if (!state.player) throw new Error('Invalid game state: player object missing');
  if (!state.ship) throw new Error('Invalid game state: ship object missing');
  if (!state.world) throw new Error('Invalid game state: world object missing');
  if (!state.dialogue) throw new Error('Invalid game state: dialogue object missing');

  const extractor = EVENT_STATE_MAP[eventName];
  if (extractor) return extractor(state);
  return null; // Direct-data events (encounter, narrative, etc.)
}
```

This reduces `extractStateForEvent` from ~70 lines to ~10 lines, and makes the mapping maintainable alongside EVENT_NAMES.

**Step 2: Run ALL tests**

Run: `npm test`
Expected: ALL tests pass

**Step 3: Commit**

```
git add src/hooks/useGameEvent.js
git commit -m "Refactor useGameEvent to use declarative EVENT_STATE_MAP"
```

---

## Summary

| Phase | Tasks | Lines of App.jsx affected | Risk |
|-------|-------|--------------------------|------|
| 1 | Tasks 1-10 | 0 (tests only) | Low — only adds tests |
| 2 | Tasks 11-12 | ~160 lines extracted | Medium — core orchestration |
| 3 | Tasks 13-14 | 0 in App.jsx | Low — backward compatible |
| 4 | Tasks 15-16 | 0 in App.jsx | Low — same behavior, different structure |

**Dependencies:**
- Phase 1 MUST complete before Phase 2 (coverage is the safety net)
- Phases 3 and 4 are independent of each other and of Phase 2
- Phase 2 should come before 3/4 because it's highest impact

**Expected outcomes:**
- App.jsx: ~724 → ~450 lines (Phase 2)
- useGameAction: single 288-line file → 7 focused domain hooks + thin composition layer
- useGameEvent: 70-line manual mapping → 10-line lookup against co-located declarative map
- App.jsx coverage: ~73% → ~90%+
