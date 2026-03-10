# Retirement Hints & Quest Progression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve retirement discoverability and quest progression feedback so players can find and follow the Tanaka quest chain without external help.

**Architecture:** Eight changes across two categories: discovery (text revisions + Marcus Cole hint) and progression (exotic matter feedback, Tanaka greeting fix, Stage 4 fix, Ready indicator fix). All changes use existing systems — narrative events, dialogue trees, notification hooks, and the quest manager.

**Tech Stack:** React 18, Vitest, existing game event system (Bridge Pattern)

---

## Task 1: Discovery Text Revisions (Changes 2, 3, 4)

Three simple text edits to existing code. No new files, no new logic.

**Files:**
- Modify: `src/game/data/narrative-events.js` (dockworker event ~line 199, gating event ~line 688)
- Modify: `src/game/game-information-broker.js` (~line 176)
- Modify: `tests/unit/information-broker-coverage.test.js` (if assertions match exact text)

### Step 1: Update dockworker hint text

In `src/game/data/narrative-events.js`, find the `dock_barnards_engineer_rumor` event. Replace the content text array with:

```javascript
text: [
  'A dockworker sidles up while you wait for clearance.',
  '"Hey, you run a Tanaka drive, right? Heard the designer\'s daughter works out of Barnard\'s Star. Does something with experimental drive tech — pushing ships further than the wormhole network was meant to go."',
  'He lowers his voice. "Picky about who she works with, though."',
],
```

The key change: "experimental drive mods" → "experimental drive tech — pushing ships further than the wormhole network was meant to go". This connects to the briefing's "routes beyond the known lanes."

### Step 2: Update Barnard's Star gating text

In the same file, find the `dock_barnards_pre_tanaka` event. Replace the content text array with:

```javascript
text: [
  'You ask around about an engineer who works on drive modifications.',
  'A dock tech looks you over. "Tanaka? Yeah, she\'s here. But she doesn\'t talk to green pilots."',
  '"She wants pilots who\'ve seen the sector — been to enough ports to prove they\'re not just running one lane back and forth."',
],
```

The key change: "Come back when you've got some real flight time" → "She wants pilots who've seen the sector — been to enough ports." This tells the player to visit more systems.

Also check the `dock_barnards_pre_tanaka_followup` event (the chained follow-up event). If it has a "How much flight time?" choice response mentioning flight time, update it similarly to reference visiting more systems/ports.

### Step 3: Update Info Broker Tanaka rumor text

In `src/game/game-information-broker.js`, find the Tanaka hint in `generateRumor()`. Replace the return string with:

```javascript
return "There's an engineer at Barnard's Star — Tanaka. Works on drive tech that could push ships beyond the known lanes. Doesn't talk to just anyone, though.";
```

The key change: "experimental drive tech" → "drive tech that could push ships beyond the known lanes." Connects to briefing language.

### Step 4: Run tests to check for broken assertions

```bash
npm test -- tests/unit/narrative-event-data.test.js tests/unit/information-broker-coverage.test.js
```

The narrative event tests check structure (event exists, has correct type/conditions) but not exact text, so they should pass. The Info Broker tests check that rumors contain "Tanaka" — the new text still does, so they should pass. If any test asserts on the exact old text, update the assertion to match the new text.

### Step 5: Run full test suite

```bash
npm test
```

Expected: All tests pass.

### Step 6: Commit

```bash
git add src/game/data/narrative-events.js src/game/game-information-broker.js
git commit -m "Revise discovery hint text to connect Tanaka to routes beyond known lanes" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Marcus Cole First Payment Hint (Change 1)

When the player makes their first debt payment, Cole's message bridges debt repayment to the retirement path. Uses narrative flag system: set flag on first payment, show dock narrative event conditioned on that flag.

**Files:**
- Modify: `src/game/state/game-coordinator.js` (~line 455, DebtManager capabilities)
- Modify: `src/game/state/managers/debt.js` (~line 211)
- Modify: `src/game/data/narrative-events.js` (add new event)
- Create: `tests/unit/cole-first-payment-hint.test.js`

### Step 1: Write failing test for flag-setting on first payment

Create `tests/unit/cole-first-payment-hint.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtManager } from '../../src/game/state/managers/debt.js';

describe('Cole first payment hint', () => {
  let manager;
  let capabilities;

  beforeEach(() => {
    capabilities = {
      getOwnState: () => ({
        debt: 10000,
        finance: {
          totalRepaid: 0,
          heat: 50,
          lienRate: 0.05,
          interestRate: 0.03,
          gracePeriod: 30,
        },
      }),
      getCredits: () => 5000,
      getDaysElapsed: () => 40,
      getShipCargo: () => [],
      getCurrentSystem: () => 0,
      updateDebt: vi.fn(),
      updateCredits: vi.fn(),
      modifyRepRaw: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
      setNarrativeFlag: vi.fn(),
      starData: [],
      isTestEnvironment: true,
      initFinance: vi.fn(),
    };
    manager = new DebtManager(capabilities);
  });

  it('sets cole_first_payment_hint flag on first debt payment', () => {
    manager.makePayment(500);
    expect(capabilities.setNarrativeFlag).toHaveBeenCalledWith(
      'cole_first_payment_hint'
    );
  });

  it('does not set flag on subsequent payments', () => {
    // Simulate totalRepaid already > 0
    capabilities.getOwnState = () => ({
      debt: 9500,
      finance: {
        totalRepaid: 500,
        heat: 45,
        lienRate: 0.05,
        interestRate: 0.03,
        gracePeriod: 30,
      },
    });
    manager = new DebtManager(capabilities);
    manager.makePayment(500);
    expect(capabilities.setNarrativeFlag).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/unit/cole-first-payment-hint.test.js
```

Expected: FAIL — `setNarrativeFlag` is not called.

### Step 3: Add setNarrativeFlag to DebtManager capabilities

In `src/game/state/game-coordinator.js`, find the DebtManager construction (~line 455). Add `setNarrativeFlag` to the capabilities object:

```javascript
this.debtManager = new DebtManager({
  // ... existing capabilities ...
  setNarrativeFlag: (flag) => this.setNarrativeFlag(flag),
});
```

### Step 4: Set flag on first payment in DebtManager

In `src/game/state/managers/debt.js`, in the `makePayment()` method, add the flag-setting logic BEFORE the `totalRepaid` increment (around line 211, before `finance.totalRepaid += actualPayment`):

```javascript
// First payment hint for Marcus Cole narrative
if (finance.totalRepaid === 0 && this.capabilities.setNarrativeFlag) {
  this.capabilities.setNarrativeFlag('cole_first_payment_hint');
}

finance.totalRepaid += actualPayment;
```

### Step 5: Run test to verify it passes

```bash
npm test -- tests/unit/cole-first-payment-hint.test.js
```

Expected: PASS

### Step 6: Write test for Cole narrative event existence

Add to the same test file:

```javascript
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Cole first payment narrative event', () => {
  it('should include cole_first_payment_hint event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'cole_first_payment_hint'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('dock');
    expect(event.once).toBe(true);
  });

  it('requires cole_first_payment_hint flag', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'cole_first_payment_hint'
    );
    const conditions = event.trigger.condition;
    const flagCondition = conditions.find(
      (c) => c.type === 'flag_set' && c.flag === 'cole_first_payment_hint'
    );
    expect(flagCondition).toBeDefined();
  });
});
```

### Step 7: Run test to verify it fails

```bash
npm test -- tests/unit/cole-first-payment-hint.test.js
```

Expected: FAIL — event not found.

### Step 8: Add Cole narrative event

In `src/game/data/narrative-events.js`, add a new event (near the other Cole-related events like `time_debt_warning`):

```javascript
{
  id: 'cole_first_payment_hint',
  type: 'dock',
  category: 'narrative',
  trigger: {
    system: null,
    condition: [
      { type: CONDITION_TYPES.FLAG_SET, flag: 'cole_first_payment_hint' },
    ],
    chance: 1.0,
  },
  once: true,
  cooldown: 0,
  priority: NARRATIVE_PRIORITY_HIGH,
  content: {
    text: [
      'A message from Marcus Cole.',
      '"Good. You\'re learning." A pause. "But clearing your slate is just the first step — the captains who really get out of this life? They made the right friends along the way."',
    ],
    speaker: 'Marcus Cole',
    mood: 'neutral',
    choices: [
      {
        text: '"I\'ll keep that in mind."',
        next: null,
      },
    ],
  },
},
```

Note: Import `CONDITION_TYPES` and `NARRATIVE_PRIORITY_HIGH` if not already imported at the top of the file (they likely are since other events use them).

### Step 9: Run tests

```bash
npm test -- tests/unit/cole-first-payment-hint.test.js
```

Expected: PASS

### Step 10: Run full test suite

```bash
npm test
```

Expected: All tests pass.

### Step 11: Commit

```bash
git add src/game/state/game-coordinator.js src/game/state/managers/debt.js src/game/data/narrative-events.js tests/unit/cole-first-payment-hint.test.js
git commit -m "Add Marcus Cole hint on first debt payment bridging debt to retirement path" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Exotic Matter Scanner Feedback (Change 5)

When exotic matter is collected during docking, show a notification. When visiting a previously-sampled station, show a different notification. Uses the existing game event system and notification infrastructure.

**Files:**
- Modify: `src/game/constants.js` (add event names)
- Modify: `src/game/state/managers/quest-manager.js` (~line 308, `onDock()`)
- Modify: `src/App.jsx` or a suitable always-mounted component (add event listener)
- Modify: `tests/unit/quest-manager.test.js` (add tests for new events)

### Step 1: Write failing test for exotic matter collection event

In `tests/unit/quest-manager.test.js`, add a new describe block (or create a new file `tests/unit/exotic-matter-feedback.test.js`):

```javascript
describe('exotic matter scanner feedback', () => {
  it('emits EXOTIC_MATTER_COLLECTED when exotic matter is found', () => {
    // Set up quest at stage 2 with scanner
    const emitSpy = vi.fn();
    // ... set up QuestManager with capabilities including emit: emitSpy
    // ... register tanaka quest, advance to stage 2
    // ... call onDock with a system >15 LY from Sol
    // ... use rngFn that always returns 0 (guarantees collection)

    expect(emitSpy).toHaveBeenCalledWith(
      'exoticMatterCollected',
      expect.objectContaining({
        count: expect.any(Number),
        total: expect.any(Number),
      })
    );
  });

  it('emits EXOTIC_MATTER_ALREADY_SAMPLED for previously sampled stations', () => {
    // Set up quest at stage 2
    // Pre-populate exoticStations with the target system
    // Call onDock with that system
    // Should emit already-sampled event

    expect(emitSpy).toHaveBeenCalledWith('exoticMatterAlreadySampled');
  });

  it('does not emit scanner events when not at stage 2', () => {
    // Quest at stage 1, dock at distant station
    // Should not emit exotic matter events
  });
});
```

Note: Adapt the test setup to match the existing test patterns in `quest-manager.test.js`. Look at how existing tests construct capabilities and register quests. The test should be consistent with the existing style.

### Step 2: Run test to verify it fails

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: FAIL — events not emitted.

### Step 3: Add event name constants

In `src/game/constants.js`, find `EVENT_NAMES` and add:

```javascript
EXOTIC_MATTER_COLLECTED: 'exoticMatterCollected',
EXOTIC_MATTER_ALREADY_SAMPLED: 'exoticMatterAlreadySampled',
```

### Step 4: Modify QuestManager.onDock() to emit feedback events

In `src/game/state/managers/quest-manager.js`, modify the `onDock()` method (~line 308):

```javascript
onDock(systemId, rngFn = Math.random) {
  const tanakaState = this.getQuestState('tanaka');
  if (!tanakaState || tanakaState.stage !== 2) return;

  const starData = this.capabilities.starData;
  const system = starData.find((s) => s.id === systemId);
  const sol = starData.find((s) => s.id === 0);
  if (!system || !sol) return;

  const distance = Math.sqrt(
    (system.x - sol.x) ** 2 +
      (system.y - sol.y) ** 2 +
      (system.z - sol.z) ** 2
  );
  if (distance < ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE) return;

  if (!tanakaState.data.exoticStations) tanakaState.data.exoticStations = [];
  if (tanakaState.data.exoticStations.includes(systemId)) {
    // Already sampled — scanner feedback
    this.capabilities.emit(EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED);
    return;
  }

  if (rngFn() >= ENDGAME_CONFIG.STAGE_2_EXOTIC_CHANCE) return;

  tanakaState.data.exoticStations.push(systemId);
  tanakaState.data.exoticMaterials =
    (tanakaState.data.exoticMaterials || 0) + 1;

  // Scanner feedback — new collection
  this.capabilities.emit(EVENT_NAMES.EXOTIC_MATTER_COLLECTED, {
    count: tanakaState.data.exoticMaterials,
    total: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED,
  });

  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();
}
```

Key changes:
- Added `EXOTIC_MATTER_ALREADY_SAMPLED` emission when re-visiting a sampled station (before the existing early return)
- Added `EXOTIC_MATTER_COLLECTED` emission with count/total data (after collection, before the existing QUEST_CHANGED emission)

### Step 5: Run tests to verify they pass

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: PASS (new tests and existing tests).

### Step 6: Add React-side notification listener

Find the component that handles dock-related notifications. Look at `src/App.jsx` or the station view for an appropriate place to add a `useGameEvent` listener. Add a hook that listens for the scanner events and shows notifications.

In the station view component (or App.jsx), add:

```javascript
useGameEvent('exoticMatterCollected', (data) => {
  showInfo(
    `Scanner: Exotic matter detected. Sample collected. [${data.count}/${data.total}]`
  );
});

useGameEvent('exoticMatterAlreadySampled', () => {
  showInfo('Scanner: Already sampled this station.');
});
```

Note: The exact component depends on where `useNotification` / `showInfo` is already used in the dock flow. Check which component currently handles dock notifications and add the listeners there. If no existing component fits, create a small `ExoticMatterListener` component mounted inside the station view.

### Step 7: Run full test suite

```bash
npm test
```

Expected: All tests pass.

### Step 8: Commit

```bash
git add src/game/constants.js src/game/state/managers/quest-manager.js tests/unit/quest-manager.test.js
git commit -m "Add scanner feedback notifications for exotic matter collection" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

If React-side changes were made, include those files too.

---

## Task 4: Stage 4 Greeting Fix (Changes 6 & 7)

The Stage 4 greeting says "A message that needs delivering" which sounds like a new request, but the player has ALREADY accepted the delivery. Fix to remind the player where to deliver.

Note: The acceptance mechanism in `mission_4_offer` already works correctly — the choice at stage 3 leads to `mission_4_offer` where the player accepts and advances to stage 4. The issue is only the greeting TEXT at stage 4.

**Files:**
- Modify: `src/game/data/dialogue/tanaka-dialogue.js` (~line 39)
- Modify: `tests/unit/tanaka-dialogue-progression.test.js` (if it asserts on stage 4 text)

### Step 1: Write failing test for revised stage 4 greeting

In `tests/unit/tanaka-dialogue-progression.test.js` (or create `tests/unit/tanaka-stage4-greeting.test.js`), add:

```javascript
it('stage 4 greeting reminds player about delivery destination when message not delivered', () => {
  const context = {
    getQuestStage: () => 4,
    getQuestState: () => ({ data: { messageDelivered: false } }),
    hasClaimedStageRewards: () => false,
    canStartQuestStage: () => false,
    getUnmetRequirements: () => [],
  };

  const greeting = YUKI_TANAKA_DIALOGUE.greeting.text(50, context);
  expect(greeting).toContain('Vasquez');
  expect(greeting).toContain('Epsilon Eridani');
  expect(greeting).not.toContain('something personal I need to ask');
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/unit/tanaka-stage4-greeting.test.js
```

Expected: FAIL — greeting still contains "something personal I need to ask."

### Step 3: Update stage 4 greeting text

In `src/game/data/dialogue/tanaka-dialogue.js`, find the stage 4 greeting (~line 39-45). Replace:

```javascript
if (stage === 4) {
  const delivered =
    context.getQuestState('tanaka')?.data?.messageDelivered;
  if (delivered) {
    return '"You delivered the message. Thank you." Her voice is steady, but her eyes say more. "When you are ready for the final preparations, we should talk."';
  }
  return '"My message for Captain Vasquez — have you delivered it yet?" She meets your eyes briefly. "They\'re at Eridani Hub. Epsilon Eridani."';
}
```

The key change: "There is something personal I need to ask of you. A message that needs delivering." → "My message for Captain Vasquez — have you delivered it yet? They're at Eridani Hub. Epsilon Eridani." This tells the player WHERE to go.

### Step 4: Run tests

```bash
npm test -- tests/unit/tanaka-dialogue-progression.test.js tests/unit/tanaka-stage4-greeting.test.js
```

Expected: PASS. Check that existing tests in `tanaka-dialogue-progression.test.js` still pass. If any test asserts on the old "something personal" text, update it.

### Step 5: Run full test suite

```bash
npm test
```

Expected: All tests pass.

### Step 6: Commit

```bash
git add src/game/data/dialogue/tanaka-dialogue.js tests/unit/tanaka-stage4-greeting.test.js
git commit -m "Fix Tanaka stage 4 greeting to remind player about delivery destination" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: "(Ready!)" Indicator Fix (Change 8)

Show relationship tier name (e.g. "Family") when trust threshold is met but other requirements aren't. Reserve "(Ready!)" for when ALL requirements for the next stage are met.

**Files:**
- Modify: `src/game/game-dialogue.js` (~line 223, questProgress construction)
- Modify: `src/features/dialogue/DialoguePanel.jsx` (~line 130, quest progress display)
- Modify: `tests/integration/dialogue-quest-progress.integration.test.jsx`

### Step 1: Write failing test for Ready indicator logic

In `tests/integration/dialogue-quest-progress.integration.test.jsx`, add a new test:

```javascript
it('should show tier name instead of "Ready!" when rep meets threshold but other requirements are not met', async () => {
  // Set rep above stage 1 threshold but don't meet engine requirement
  game.modifyRepRaw(
    'tanaka_barnards',
    ENDGAME_CONFIG.STAGE_1_REP + 5,
    'test'
  );
  // Ensure engine is below required 80%
  // (check how existing tests set ship conditions)

  render(
    <GameProvider game={game}>
      <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
    </GameProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
  });

  // Should show tier name, NOT "Ready!"
  expect(screen.queryByText(/Ready!/)).not.toBeInTheDocument();
  // Should show the reputation tier name (e.g., "Warm" or "Friendly")
  // The exact tier depends on the rep value set above
});
```

Note: Check how the existing test sets up the game instance and ship conditions. The existing test `'should show "Ready!" label when rep meets threshold'` is the one to model from and add the inverse condition (rep met, engine not met).

### Step 2: Run test to verify it fails

```bash
npm test -- tests/integration/dialogue-quest-progress.integration.test.jsx
```

Expected: FAIL — still shows "Ready!" regardless of other requirements.

### Step 3: Add allRequirementsMet to questProgress in game-dialogue.js

In `src/game/game-dialogue.js`, find the quest progress construction (~line 223-237). Add `allRequirementsMet`:

```javascript
let questProgress = null;
if (npcData.questId) {
  const questStage = gameStateManager.getQuestStage(npcData.questId);
  const questDef = gameStateManager.getQuestDefinition?.(npcData.questId);
  if (questDef && questDef.stages) {
    const nextStage = questDef.stages.find((s) => s.stage === questStage + 1);
    const nextRepThreshold = nextStage?.requirements?.npcRep?.[1] ?? null;
    const allRequirementsMet = nextStage
      ? gameStateManager.canStartQuestStage(
          npcData.questId,
          nextStage.stage
        )
      : false;
    questProgress = {
      currentRep,
      questStage,
      nextRepThreshold,
      stageName: nextStage?.name ?? null,
      allRequirementsMet,
    };
  }
}
```

### Step 4: Update DialoguePanel.jsx to use allRequirementsMet

In `src/features/dialogue/DialoguePanel.jsx`, find the quest progress display (~line 130-174). Replace the condition:

```jsx
{dialogueDisplay.questProgress.currentRep >=
dialogueDisplay.questProgress.nextRepThreshold ? (
  <>
    Trust: {dialogueDisplay.questProgress.nextRepThreshold} /{' '}
    {dialogueDisplay.questProgress.nextRepThreshold}
    <span className="quest-stage-name">
      {dialogueDisplay.questProgress.allRequirementsMet
        ? ' (Ready!)'
        : ` (${dialogueDisplay.reputationTier.name})`}
    </span>
  </>
) : (
```

The key change: When rep threshold is met, check `allRequirementsMet`. If true, show "(Ready!)". If false, show the reputation tier name from `dialogueDisplay.reputationTier.name` (already available in the component).

### Step 5: Run tests

```bash
npm test -- tests/integration/dialogue-quest-progress.integration.test.jsx
```

Expected: PASS (new test and existing tests).

The existing "Ready!" test should still pass because when rep meets threshold AND all other requirements are met (which the existing test likely sets up), "(Ready!)" still appears.

### Step 6: Run full test suite

```bash
npm test
```

Expected: All tests pass.

### Step 7: Commit

```bash
git add src/game/game-dialogue.js src/features/dialogue/DialoguePanel.jsx tests/integration/dialogue-quest-progress.integration.test.jsx
git commit -m "Show tier name instead of Ready when non-rep quest requirements are unmet" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Final Verification

### Step 1: Run full test suite

```bash
npm test
```

Expected: All tests pass with zero warnings.

### Step 2: Run lint and format

```bash
npm run clean
```

Fix any issues.

### Step 3: Manual smoke test (optional)

Start the dev server and verify:
1. First debt payment shows Cole's message on next dock
2. Dockworker hint mentions "beyond the wormhole network"
3. Barnard's gating mentions "seen the sector"
4. Tanaka stage 4 greeting mentions Vasquez at Epsilon Eridani
5. Trust indicator shows tier name when rep met but requirements not met

```bash
npm run dev
```

### Step 4: Final commit if lint/format changes were needed

```bash
git add -A
git commit -m "Apply lint and format fixes" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
