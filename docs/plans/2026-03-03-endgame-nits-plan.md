# Endgame Nits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix five remaining issues from fixes.md — three balance fixes, one UX hint, one discoverability improvement.

**Architecture:** Two constant changes (smuggling fee, distress reward), one text edit (briefing), one manager change with UI update (mission withholding), and one dialogue/quest-manager addition (requirement hints).

**Tech Stack:** Vitest, React, GameStateManager / manager delegation pattern

---

### Task 1: Reduce smuggling base fee

**Files:**
- Modify: `src/game/constants.js:578`
- Test: `tests/unit/mission-constants.test.js`

**Step 1: Write the failing test**

In `tests/unit/mission-constants.test.js`, add:

```js
it('should set smuggling base fee to 150', () => {
  expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE).toBe(150);
});
```

Import `MISSION_CONFIG` if not already imported.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: FAIL — value is 225, expected 150

**Step 3: Change the constant**

In `src/game/constants.js:578`, change:
```js
CARGO_RUN_ILLEGAL_BASE_FEE: 150,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: PASS

**Step 5: Run full suite**

Run: `npm test`
Expected: All pass (no other tests depend on the exact value 225)

**Step 6: Commit**

```
git add src/game/constants.js tests/unit/mission-constants.test.js
git commit -m "fix: reduce smuggling base fee from 225 to 150 to narrow legal/illegal trade gap"
```

---

### Task 2: Reduce distress call respond reward

**Files:**
- Modify: `src/game/constants.js:1493`
- Test: `tests/unit/mission-constants.test.js`

**Step 1: Write the failing test**

In `tests/unit/mission-constants.test.js`, add:

```js
import { DISTRESS_CONFIG } from '@game/constants.js';

it('should set distress respond reward to 150', () => {
  expect(DISTRESS_CONFIG.RESPOND.CREDITS_REWARD).toBe(150);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: FAIL — value is 500, expected 150

**Step 3: Change the constant**

In `src/game/constants.js:1493`, change:
```js
CREDITS_REWARD: 150,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: PASS

**Step 5: Run full suite**

Run: `npm test`
Expected: All pass

**Step 6: Commit**

```
git add src/game/constants.js tests/unit/mission-constants.test.js
git commit -m "fix: reduce distress respond reward from 500 to 150 for genuine risk/reward tradeoff"
```

---

### Task 3: Add retirement hint to Captain's Briefing

**Files:**
- Modify: `src/features/instructions/InstructionsModal.jsx:18-19`

**Step 1: Add the hint line**

In `src/features/instructions/InstructionsModal.jsx`, after the paragraph ending "Earn your way in." (line 18), add a new paragraph:

```jsx
<p>
  Clear your debt and the sector may have more to offer than you
  expect.
</p>
```

This goes inside the "Your Goal" section, after the existing second `<p>` tag.

**Step 2: Run full suite**

Run: `npm test`
Expected: All pass (text-only change, no logic tests)

**Step 3: Commit**

```
git add src/features/instructions/InstructionsModal.jsx
git commit -m "fix: add retirement hint to Captain's Briefing goal section"
```

---

### Task 4: Apply Cole's withholding to mission rewards

This is the most complex task. The pattern to follow is `sellGood()` in `src/game/state/managers/trading.js:107-111`.

**Files:**
- Modify: `src/game/state/managers/mission.js:208-215`
- Modify: `src/features/missions/MissionCompleteNotifier.jsx`
- Modify: `src/hooks/useGameAction.js` (expose `calculateTradeWithholding`)
- Test: `tests/unit/mission-completion.test.js`

**Step 1: Write failing tests for mission withholding**

Add a new describe block in `tests/unit/mission-completion.test.js`:

```js
describe('Cole withholding on mission rewards', () => {
  it('should apply withholding to delivery mission credit rewards', () => {
    const mission = {
      id: 'test_withholding',
      type: 'delivery',
      title: 'Test Withholding',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    const debtBefore = manager.getState().player.debt;
    const creditsBefore = manager.getState().player.credits;
    const result = manager.completeMission('test_withholding');

    // 5% lien at low heat: ceil(500 * 0.05) = 25
    expect(result.withheld).toBe(25);
    expect(manager.getState().player.credits).toBe(creditsBefore + 475);
    expect(manager.getState().player.debt).toBe(debtBefore - 25);
  });

  it('should not withhold when debt is zero', () => {
    // Clear debt first
    manager.getState().player.debt = 0;
    const mission = {
      id: 'test_no_withholding',
      type: 'delivery',
      title: 'No Debt',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    const creditsBefore = manager.getState().player.credits;
    const result = manager.completeMission('test_no_withholding');

    expect(result.withheld).toBe(0);
    expect(manager.getState().player.credits).toBe(creditsBefore + 500);
  });

  it('should apply withholding to passenger payment', () => {
    const mission = {
      id: 'test_passenger_wh',
      type: 'passenger',
      title: 'Passenger Withholding',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 80 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    const debtBefore = manager.getState().player.debt;
    const result = manager.completeMission('test_passenger_wh');

    expect(result.withheld).toBeGreaterThan(0);
    expect(manager.getState().player.debt).toBeLessThan(debtBefore);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/mission-completion.test.js`
Expected: FAIL — `result.withheld` is undefined, credits are full amount

**Step 3: Implement withholding in completeMission()**

In `src/game/state/managers/mission.js`, modify the credit-awarding section (lines 208-215).

Replace:
```js
    if (mission.type === 'passenger') {
      const payment = this.calculatePassengerPayment(mission);
      state.player.credits += payment;
      this.emit(EVENT_NAMES.CREDITS_CHANGED, state.player.credits);
    } else if (mission.rewards.credits) {
      state.player.credits += mission.rewards.credits;
      this.emit(EVENT_NAMES.CREDITS_CHANGED, state.player.credits);
    }
```

With:
```js
    let grossCredits = 0;
    if (mission.type === 'passenger') {
      grossCredits = this.calculatePassengerPayment(mission);
    } else if (mission.rewards.credits) {
      grossCredits = mission.rewards.credits;
    }

    let withheld = 0;
    if (grossCredits > 0) {
      const result = this.gameStateManager.applyTradeWithholding(grossCredits);
      withheld = result.withheld;
      const playerReceives = grossCredits - withheld;
      state.player.credits += playerReceives;
      this.emit(EVENT_NAMES.CREDITS_CHANGED, state.player.credits);
    }
```

And update the return statement (line 259) from:
```js
    return { success: true, rewards: mission.rewards };
```
To:
```js
    return { success: true, rewards: mission.rewards, withheld };
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/mission-completion.test.js`
Expected: New tests PASS. But the old test "should award credits on completion" may FAIL because it expects `creditsBefore + 500` but now gets `creditsBefore + 475`.

**Step 5: Update the existing credit test**

In `tests/unit/mission-completion.test.js`, update the existing test (line 47-49):

```js
    it('should award credits on completion minus withholding', () => {
      // 5% lien at low heat: ceil(500 * 0.05) = 25 withheld
      expect(manager.getState().player.credits).toBe(creditsBefore + 475);
    });
```

**Step 6: Run full suite**

Run: `npm test`
Expected: All pass

**Step 7: Update MissionCompleteNotifier UI to show withholding**

In `src/hooks/useGameAction.js`, expose `calculateTradeWithholding` by adding to the returned object:

```js
calculateTradeWithholding: (amount) =>
  gameStateManager.calculateTradeWithholding(amount),
```

In `src/features/missions/MissionCompleteNotifier.jsx`, update to show Cole's cut:

1. Add `calculateTradeWithholding` to the `useGameAction()` destructure
2. Compute withholding for the current mission's reward
3. Show a breakdown like trade does

Replace the rewards section (lines 64-68):
```jsx
{current.rewards && current.rewards.credits > 0 && (() => {
  const gross = current.type === 'passenger'
    ? current.rewards.credits
    : current.rewards.credits;
  const { withheld, playerReceives } = calculateTradeWithholding(gross);
  return (
    <div className="mission-complete-rewards">
      <h4>Rewards:</h4>
      <div>₡{gross}</div>
      {withheld > 0 && (
        <>
          <div className="withholding-line">Cole&apos;s cut: -₡{withheld}</div>
          <div>You receive: ₡{playerReceives}</div>
        </>
      )}
    </div>
  );
})()}
```

**Step 8: Run full suite**

Run: `npm test`
Expected: All pass

**Step 9: Commit**

```
git add src/game/state/managers/mission.js src/features/missions/MissionCompleteNotifier.jsx src/hooks/useGameAction.js tests/unit/mission-completion.test.js
git commit -m "fix: apply Cole's withholding to mission rewards, matching trade sale behavior"
```

---

### Task 5: Add quest requirement hints to Tanaka dialogue

**Files:**
- Modify: `src/game/state/managers/quest-manager.js`
- Modify: `src/game/state/game-state-manager.js` (delegate new method)
- Modify: `src/game/game-dialogue.js` (expose in context)
- Modify: `src/game/data/dialogue/tanaka-dialogue.js`
- Test: `tests/unit/quest-requirement-hints.test.js` (new)

**Step 1: Write failing test for getUnmetRequirements**

Create `tests/unit/quest-requirement-hints.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { ENDGAME_CONFIG } from '@game/constants.js';

describe('Quest Requirement Hints', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    // Set up Tanaka quest at stage 0 with low rep
    manager.getState().npcs.tanaka_barnards = {
      rep: 5,
      flags: ['tanaka_met'],
      interactions: 0,
      lastInteraction: null,
    };
  });

  describe('getUnmetRequirements', () => {
    it('should return rep when NPC reputation is below threshold', () => {
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toContain('rep');
    });

    it('should return engine when engine condition is below threshold', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
      manager.getState().ship.engine = 50;
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toContain('engine');
      expect(unmet).not.toContain('rep');
    });

    it('should return empty array when all requirements are met', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_1_ENGINE;
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toEqual([]);
    });

    it('should return debt when debt is not zero for stage 5', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_5_REP;
      manager.getState().ship.hull = ENDGAME_CONFIG.STAGE_5_HULL;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_5_ENGINE;
      manager.getState().player.credits = ENDGAME_CONFIG.VICTORY_CREDITS;
      const unmet = manager.getUnmetRequirements('tanaka', 5);
      expect(unmet).toContain('debt');
    });

    it('should return credits when credits are insufficient for stage 5', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_5_REP;
      manager.getState().player.debt = 0;
      manager.getState().ship.hull = ENDGAME_CONFIG.STAGE_5_HULL;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_5_ENGINE;
      manager.getState().player.credits = 100;
      const unmet = manager.getUnmetRequirements('tanaka', 5);
      expect(unmet).toContain('credits');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/quest-requirement-hints.test.js`
Expected: FAIL — `manager.getUnmetRequirements` is not a function

**Step 3: Add getUnmetRequirements to QuestManager**

In `src/game/state/managers/quest-manager.js`, add after `canStartStage()` (after line 207):

```js
  getUnmetRequirements(questId, stage) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return [];

    const stageDef = questDef.stages.find((s) => s.stage === stage);
    if (!stageDef?.requirements) return [];

    const state = this.getState();
    const reqs = stageDef.requirements;
    const unmet = [];

    if (reqs.npcRep) {
      const [npcId, threshold] = reqs.npcRep;
      const npcState = state.npcs[npcId];
      if (!npcState || npcState.rep < threshold) unmet.push('rep');
    }
    if (reqs.engineCondition != null && state.ship.engine < reqs.engineCondition)
      unmet.push('engine');
    if (reqs.hullCondition != null && state.ship.hull < reqs.hullCondition)
      unmet.push('hull');
    if (reqs.debt != null && state.player.debt !== reqs.debt)
      unmet.push('debt');
    if (reqs.credits != null && state.player.credits < reqs.credits)
      unmet.push('credits');

    return unmet;
  }
```

**Step 4: Delegate through GameStateManager**

In `src/game/state/game-state-manager.js`, add a delegation method (near other quest methods):

```js
  getUnmetRequirements(questId, stage) {
    return this.questManager.getUnmetRequirements(questId, stage);
  }
```

**Step 5: Expose in dialogue context**

In `src/game/game-dialogue.js`, inside `buildDialogueContext()`, add to the quest accessors section (after line 78):

```js
    getUnmetRequirements: (questId, stage) =>
      gameStateManager.getUnmetRequirements(questId, stage),
```

**Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/quest-requirement-hints.test.js`
Expected: PASS

**Step 7: Add requirement hint text to Tanaka greeting**

In `src/game/data/dialogue/tanaka-dialogue.js`, add a helper function before the export:

```js
function getRequirementHint(context, nextStage) {
  const unmet = context.getUnmetRequirements('tanaka', nextStage);
  if (unmet.includes('engine'))
    return '"Your drive\'s running rough. I wouldn\'t trust my firmware on an engine in that shape." She glances at your ship. "Get it tuned up and we\'ll talk."';
  if (unmet.includes('hull'))
    return '"Your hull\'s taken a beating. Get that patched up before we talk next steps." She runs a hand along a dent in your ship\'s plating.';
  if (unmet.includes('debt'))
    return '"You\'re still in Cole\'s pocket. Settle that first." She crosses her arms. "I don\'t work with people who have strings attached."';
  if (unmet.includes('credits'))
    return '"What I have in mind isn\'t cheap. You\'ll need deeper pockets before we proceed." She glances at your ship. "Keep trading."';
  if (unmet.includes('rep'))
    return '"I like you, captain. But I don\'t know you well enough yet for what comes next." She turns back to her work. "Keep visiting. Bring supplies. We\'ll get there."';
  return null;
}
```

Then modify the greeting `text` function. After each stage's "rewards claimed" check, add the hint. Insert the following block after the `if (stage === 1)` block (line 40) and before the rep-based greetings (line 43):

```js
      // Hint when between stages: rewards claimed but can't start next
      if (stage >= 1 && stage < 5 && context.hasClaimedStageRewards('tanaka')) {
        const nextStage = stage + 1;
        if (!context.canStartQuestStage('tanaka', nextStage)) {
          const hint = getRequirementHint(context, nextStage);
          if (hint) return hint;
        }
      }

      // Stage 0 with requirements not met for stage 1
      if (stage === 0 && !context.canStartQuestStage('tanaka', 1)) {
        const hint = getRequirementHint(context, 1);
        if (hint) return hint;
      }
```

This goes right before the `if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN)` line.

**Step 8: Write a test for hint appearing in greeting**

Add to `tests/unit/quest-requirement-hints.test.js`:

```js
import { buildDialogueContext, showDialogue } from '@game/game-dialogue.js';
import { TANAKA_QUEST } from '@game/data/quest-definitions.js';

describe('Tanaka dialogue hints', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    manager.getState().npcs.tanaka_barnards = {
      rep: 5,
      flags: ['tanaka_met'],
      interactions: 0,
      lastInteraction: null,
    };
    // Register the quest so getQuestState works
    manager.questManager.registerQuest(TANAKA_QUEST);
  });

  it('should show engine hint when stage 0 and engine below threshold', () => {
    manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
    manager.getState().ship.engine = 50;
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    const text = YUKI_TANAKA_DIALOGUE.greeting.text(
      manager.getState().npcs.tanaka_barnards.rep,
      context
    );
    expect(text).toContain('engine');
  });

  it('should show rep hint when stage 0 and rep below threshold', () => {
    manager.getState().npcs.tanaka_barnards.rep = 3;
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    const text = YUKI_TANAKA_DIALOGUE.greeting.text(3, context);
    expect(text).toContain("don't know you well enough");
  });
});
```

Add import for `YUKI_TANAKA_DIALOGUE`:
```js
import { YUKI_TANAKA_DIALOGUE } from '@game/data/dialogue/tanaka-dialogue.js';
```

**Step 9: Run all tests**

Run: `npm test`
Expected: All pass

**Step 10: Commit**

```
git add src/game/state/managers/quest-manager.js src/game/state/game-state-manager.js src/game/game-dialogue.js src/game/data/dialogue/tanaka-dialogue.js tests/unit/quest-requirement-hints.test.js
git commit -m "fix: add NPC hints when quest stage requirements are not met"
```

---

### Task 6: Update fixes.md and final verification

**Files:**
- Modify: `fixes.md`

**Step 1: Run full test suite**

Run: `npm test`
Expected: All pass

**Step 2: Update fixes.md**

Move items 3, 7, 11, 12, 13 to the Fixed section with brief notes.

**Step 3: Commit**

```
git add fixes.md
git commit -m "chore: update fixes.md with all resolved issues"
```
