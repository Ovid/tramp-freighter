# Tanaka Narrative Breadcrumbs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add narrative breadcrumbs through Wei Chen and Captain Vasquez dialogue trees so players discover Yuki Tanaka's quest and know how to progress through it.

**Architecture:** New conditional dialogue nodes in Wei Chen and Vasquez dialogue trees, gated by narrative flags, quest state, and systems-visited count. The dialogue context (`buildDialogueContext`) gets new fields: `systemsVisited`, `narrativeFlags`, `shipHull`, `shipEngine`, `debt`. The `TANAKA_UNLOCK_SYSTEMS_VISITED` constant changes from 5 to 10.

**Tech Stack:** Vitest (TDD), existing dialogue engine, existing constants/quest/NPC systems

**Key Reference Files:**
- `src/game/constants.js:575-613` — ENDGAME_CONFIG + TANAKA_SUPPLY_CONFIG
- `src/game/game-dialogue.js:46-88` — `buildDialogueContext()`
- `src/game/data/dialogue/wei-chen.js` — Wei Chen dialogue tree (290 lines)
- `src/game/data/dialogue/captain-vasquez.js` — Vasquez dialogue tree (473 lines)
- `src/game/data/narrative-events.js:550-595` — `tanaka_intro` event
- `tests/unit/dialogue-context.test.js` — context builder tests
- `tests/unit/dialogue-tree-structure.test.js` — structural validation tests

**Flag Stores:**
- `tanaka_met` is set via `gameStateManager.setNarrativeFlag('tanaka_met')` by NarrativeEventPanel when the player picks a choice in the tanaka_intro event. Stored in `state.world.narrativeEvents.flags.tanaka_met`.
- Also checked via `npcState.flags.includes('tanaka_met')` in quest-manager. Two separate stores.
- For dialogue conditions, use narrative flags: `context.narrativeFlags.tanaka_met`.

---

### Task 1: Update TANAKA_UNLOCK_SYSTEMS_VISITED Constant

**Files:**
- Modify: `src/game/constants.js:578`
- Modify: `src/game/data/narrative-events.js:557`

**Step 1: Change the constant from 5 to 10**

In `src/game/constants.js:578`, change:
```js
TANAKA_UNLOCK_SYSTEMS_VISITED: 5,
```
to:
```js
TANAKA_UNLOCK_SYSTEMS_VISITED: 10,
```

**Step 2: Update narrative event to use constant**

In `src/game/data/narrative-events.js:557`, the `tanaka_intro` event condition currently hardcodes `value: 5`. Change it to use the constant.

First, add to the imports at the top of narrative-events.js:
```js
import { ENDGAME_CONFIG } from '../constants.js';
```
(Check if this import already exists — it might.)

Then change line 557 from:
```js
{ type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
```
to:
```js
{ type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED },
```

**Step 3: Run tests to verify nothing breaks**

Run: `npm test`
Expected: All existing tests pass (no tests directly reference `tanaka_intro` or the hardcoded value 5)

**Step 4: Commit**

```bash
git add src/game/constants.js src/game/data/narrative-events.js
git commit -m "chore: increase Tanaka unlock threshold to 10 systems visited

Use ENDGAME_CONFIG constant in narrative event instead of hardcoded value."
```

---

### Task 2: Extend buildDialogueContext with New Fields

**Files:**
- Modify: `src/game/game-dialogue.js:46-88`
- Test: `tests/unit/dialogue-context.test.js`

**Step 1: Write failing tests for new context fields**

Add these tests to `tests/unit/dialogue-context.test.js`:

```js
it('includes systemsVisited count', () => {
  const ctx = buildDialogueContext(mockGSM, 'test_npc');
  expect(ctx.systemsVisited).toBe(3);
});

it('includes narrativeFlags', () => {
  const ctx = buildDialogueContext(mockGSM, 'test_npc');
  expect(ctx.narrativeFlags).toEqual({ tanaka_met: true });
});

it('includes ship hull and engine conditions', () => {
  const ctx = buildDialogueContext(mockGSM, 'test_npc');
  expect(ctx.shipHull).toBe(85);
  expect(ctx.shipEngine).toBe(90);
});

it('includes player debt', () => {
  const ctx = buildDialogueContext(mockGSM, 'test_npc');
  expect(ctx.debt).toBe(5000);
});
```

Also update the `mockGSM` at the top of the test file to include the new method stubs and state:

In the `getState` return value, add:
```js
ship: {
  cargo: [{ type: 'food', quantity: 5 }],
  hull: 85,
  engine: 90,
},
```
(Replace the existing `ship` line.)

Also add `debt: 5000` to the `player` object in `getState`.

Add `world` to the state return:
```js
world: { visitedSystems: [0, 1, 4] },
```

Add `getNarrativeFlags` method to the mock:
```js
getNarrativeFlags: () => ({ tanaka_met: true }),
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/dialogue-context.test.js`
Expected: FAIL — `systemsVisited`, `narrativeFlags`, `shipHull`, `shipEngine`, `debt` are undefined

**Step 3: Add new fields to buildDialogueContext**

In `src/game/game-dialogue.js`, in the `buildDialogueContext` function, add these fields to the returned object (after the existing `cargo` line):

```js
// Ship condition
shipHull: state.ship.hull,
shipEngine: state.ship.engine,

// Player financial state
debt: state.player.debt,

// World state
systemsVisited: state.world.visitedSystems.length,

// Narrative flags (for cross-NPC condition checks)
narrativeFlags: gameStateManager.getNarrativeFlags(),
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/dialogue-context.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/game-dialogue.js tests/unit/dialogue-context.test.js
git commit -m "feat: extend dialogue context with ship, world, and narrative flag data

Adds systemsVisited, narrativeFlags, shipHull, shipEngine, and debt
to the dialogue context object for cross-NPC breadcrumb conditions."
```

---

### Task 3: Add Wei Chen Breadcrumb Dialogue Nodes

**Files:**
- Modify: `src/game/data/dialogue/wei-chen.js`
- Test: `tests/unit/tanaka-breadcrumbs.test.js` (new file)

**Step 1: Write failing tests for Wei Chen breadcrumb conditions**

Create `tests/unit/tanaka-breadcrumbs.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { WEI_CHEN_DIALOGUE } from '../../src/game/data/dialogue/wei-chen.js';
import { ENDGAME_CONFIG, REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Unit tests for Tanaka quest narrative breadcrumbs.
 * Feature: tanaka-breadcrumbs
 *
 * Validates that Wei Chen and Captain Vasquez dialogue trees provide
 * narrative guidance for discovering and progressing through the Tanaka quest.
 */

function makeContext(overrides = {}) {
  return {
    karma: 0,
    canGetTip: { available: false },
    narrativeFlags: {},
    systemsVisited: 0,
    getQuestStage: () => 0,
    getQuestState: () => null,
    canStartQuestStage: () => false,
    canContributeSupply: () => false,
    shipHull: 100,
    shipEngine: 100,
    debt: 0,
    credits: 0,
    ...overrides,
  };
}

describe('Wei Chen Tanaka Breadcrumbs', () => {
  const greeting = WEI_CHEN_DIALOGUE.greeting;

  function findChoice(text, rep, context) {
    return greeting.choices.find((c) => {
      if (!c.text.includes(text)) return false;
      if (c.condition) return c.condition(rep, context);
      return true;
    });
  }

  describe('Pre-Discovery: station_gossip choice', () => {
    it('appears when tanaka_met is NOT set', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears once tanaka_met is set', () => {
      const ctx = makeContext({
        systemsVisited: 3,
        narrativeFlags: { tanaka_met: true },
      });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeUndefined();
    });

    it('has no rep requirement (available at rep 0)', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeDefined();
    });
  });

  describe('station_gossip node text', () => {
    it('mentions needing more experience when systems < threshold', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const text = WEI_CHEN_DIALOGUE.station_gossip.text(0, ctx);
      expect(text).toMatch(/been around/i);
    });

    it('encourages talking to Tanaka when systems >= threshold', () => {
      const ctx = makeContext({
        systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
      });
      const text = WEI_CHEN_DIALOGUE.station_gossip.text(0, ctx);
      expect(text).toMatch(/talk to you|worth/i);
    });
  });

  describe('Post-Meeting: tanaka_gossip choice', () => {
    it('appears when tanaka_met AND quest stage 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 0,
      });
      const choice = findChoice('Tanaka', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when quest stage > 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
      });
      // Should not match the tanaka_gossip choice (stage 0 only)
      const choices = greeting.choices.filter((c) => {
        if (!c.text.includes('Tanaka') || !c.text.includes('know')) return false;
        if (c.condition) return c.condition(0, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('tanaka_gossip node text', () => {
    it('mentions electronics and medicine', () => {
      const text = WEI_CHEN_DIALOGUE.tanaka_gossip.text(0);
      expect(text).toMatch(/electronics/i);
      expect(text).toMatch(/medicine/i);
    });
  });

  describe('Mid-Quest: tanaka_progress choice', () => {
    it('appears when quest active but next stage blocked', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
        canStartQuestStage: () => false,
      });
      const choice = findChoice('Tanaka', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when next stage is available', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
        canStartQuestStage: () => true,
      });
      // The mid-quest hint should hide when the player CAN advance
      const choices = greeting.choices.filter((c) => {
        if (!c.next || c.next !== 'tanaka_progress') return false;
        if (c.condition) return c.condition(0, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('tanaka_progress node text', () => {
    it('encourages bringing research supplies', () => {
      const text = WEI_CHEN_DIALOGUE.tanaka_progress.text(0);
      expect(text).toMatch(/supplies|electronics|medicine/i);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/tanaka-breadcrumbs.test.js`
Expected: FAIL — nodes and choices don't exist yet

**Step 3: Add import and new nodes to Wei Chen dialogue**

In `src/game/data/dialogue/wei-chen.js`, add to imports:
```js
import { ENDGAME_CONFIG } from '../../constants.js';
```

Add three new choices to the `greeting.choices` array (insert before the last "Nothing right now" choice):

```js
{
  text: '"What\'s the deal with Bore Station 7?"',
  next: 'station_gossip',
  condition: (_rep, context) =>
    context && !context.narrativeFlags?.tanaka_met,
},
{
  text: '"Know anything about Tanaka?"',
  next: 'tanaka_gossip',
  condition: (_rep, context) =>
    context &&
    context.narrativeFlags?.tanaka_met &&
    context.getQuestStage('tanaka') === 0,
},
{
  text: '"How\'s Tanaka doing these days?"',
  next: 'tanaka_progress',
  condition: (_rep, context) => {
    if (!context || !context.narrativeFlags?.tanaka_met) return false;
    const stage = context.getQuestStage('tanaka');
    if (stage < 1 || stage >= 5) return false;
    const nextStage = stage + 1;
    return !context.canStartQuestStage('tanaka', nextStage);
  },
},
```

Add three new dialogue nodes to the `WEI_CHEN_DIALOGUE` object:

```js
station_gossip: {
  text: (_rep, context) => {
    if (
      context &&
      context.systemsVisited >=
        ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
    ) {
      return '"Engineer works in the back bay. Tanaka. Keeps to herself mostly. Does something with drive systems — way over my head." She glances toward the engineering section. "You\'ve been around enough, she might actually talk to you. Worth checking in next time you dock."';
    }
    return '"Engineer works in the back bay. Tanaka. Keeps to herself mostly. Does something with drive systems — way over my head." She shrugs. "Doesn\'t talk to just anyone though. Wants to see you\'ve actually been around the network before she\'ll give you the time of day. Can\'t blame her."';
  },
  choices: [
    {
      text: '"I\'ll keep that in mind."',
      next: 'greeting',
    },
    {
      text: '"What kind of drive systems?"',
      next: 'greeting',
    },
  ],
},

tanaka_gossip: {
  text: '"She\'s always short on supplies for her research. Electronics, medicine — that kind of thing. Bring her five units of either and she\'ll notice." Wei Chen lowers her voice. "Not the type to ask for help, but she won\'t turn it down."',
  choices: [
    {
      text: '"Good to know. Thanks."',
      next: 'greeting',
    },
    {
      text: '"Five units? I can manage that."',
      next: 'greeting',
    },
  ],
},

tanaka_progress: {
  text: '"Tanaka\'s been mentioning your name. She\'s warming up, but she\'s careful. Keep bringing her research supplies — electronics or medicine. She notices, even if she doesn\'t say it."',
  choices: [
    {
      text: '"I\'ll keep at it."',
      next: 'greeting',
    },
    {
      text: '"Thanks for the heads up."',
      next: 'greeting',
    },
  ],
},
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/tanaka-breadcrumbs.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/data/dialogue/wei-chen.js tests/unit/tanaka-breadcrumbs.test.js
git commit -m "feat: add Wei Chen Tanaka breadcrumb dialogue nodes

Three new conditional dialogue nodes guide players toward discovering
and progressing through Yuki Tanaka's quest arc:
- station_gossip: pre-discovery hints with eligibility awareness
- tanaka_gossip: post-meeting supply run guidance
- tanaka_progress: mid-quest encouragement between stages"
```

---

### Task 4: Add Captain Vasquez Breadcrumb Dialogue Nodes

**Files:**
- Modify: `src/game/data/dialogue/captain-vasquez.js`
- Test: `tests/unit/tanaka-breadcrumbs.test.js` (append)

**Step 1: Write failing tests for Vasquez breadcrumb conditions**

Append to `tests/unit/tanaka-breadcrumbs.test.js`:

```js
import { CAPTAIN_VASQUEZ_DIALOGUE } from '../../src/game/data/dialogue/captain-vasquez.js';

describe('Captain Vasquez Tanaka Breadcrumbs', () => {
  const greeting = CAPTAIN_VASQUEZ_DIALOGUE.greeting;

  function findChoice(text, rep, context) {
    return greeting.choices.find((c) => {
      if (!c.text.includes(text)) return false;
      if (c.condition) return c.condition(rep, context);
      return true;
    });
  }

  describe('Pre-Discovery: barnards_engineer choice', () => {
    it('appears when systems >= threshold and tanaka_met NOT set', () => {
      const ctx = makeContext({
        systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
      });
      const choice = findChoice('Tanaka', 5, ctx);
      expect(choice).toBeDefined();
    });

    it('shows exploration nudge when systems < threshold', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const choice = findChoice('green', 5, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears once tanaka_met is set', () => {
      const ctx = makeContext({
        systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
        narrativeFlags: { tanaka_met: true },
      });
      const choices = greeting.choices.filter((c) => {
        if (c.next !== 'barnards_engineer' && c.next !== 'explore_more')
          return false;
        if (c.condition) return c.condition(5, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('Post-Meeting: tanaka_advice choice', () => {
    it('appears when tanaka_met AND quest stage 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 0,
      });
      const choice = findChoice('engineer', 5, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when quest stage > 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
      });
      const choices = greeting.choices.filter((c) => {
        if (c.next !== 'tanaka_advice') return false;
        if (c.condition) return c.condition(5, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('tanaka_advice node text', () => {
    it('mentions supplies, electronics, or medicine', () => {
      const text = CAPTAIN_VASQUEZ_DIALOGUE.tanaka_advice.text;
      expect(typeof text === 'string' || typeof text === 'function').toBe(true);
      const resolved = typeof text === 'function' ? text(5) : text;
      expect(resolved).toMatch(/supplies|electronics|medicine/i);
    });
  });

  describe('Mid-Quest: tanaka_patience choice', () => {
    it('appears when quest active but next stage blocked', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 2,
        canStartQuestStage: () => false,
      });
      const choice = findChoice('Tanaka', 5, ctx);
      expect(choice).toBeDefined();
    });
  });

  describe('Stage 5 prep: pavonis_prep choice', () => {
    it('appears when quest stage 4 complete but material requirements not met', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 4,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        shipHull: 50,
        shipEngine: 60,
        debt: 10000,
        credits: 5000,
      });
      const choice = findChoice('ready', 5, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when player can start stage 5', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 4,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => true,
        shipHull: 90,
        shipEngine: 95,
        debt: 0,
        credits: 30000,
      });
      const choices = greeting.choices.filter((c) => {
        if (c.next !== 'pavonis_prep') return false;
        if (c.condition) return c.condition(5, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('pavonis_prep node text', () => {
    it('mentions ship condition, credits, and debt', () => {
      const text = CAPTAIN_VASQUEZ_DIALOGUE.pavonis_prep.text;
      const resolved = typeof text === 'function' ? text(5) : text;
      expect(resolved).toMatch(/ship|hull|engine/i);
      expect(resolved).toMatch(/debt|credit|money/i);
    });
  });
});
```

Also add `hasClaimedStageRewards: () => false,` to the `makeContext` defaults.

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/tanaka-breadcrumbs.test.js`
Expected: FAIL — Vasquez nodes and choices don't exist yet

**Step 3: Add import and new nodes to Vasquez dialogue**

In `src/game/data/dialogue/captain-vasquez.js`, add to imports:
```js
import { ENDGAME_CONFIG } from '../../constants.js';
```
(Note: `ENDGAME_CONFIG` may not be imported yet — check. `REPUTATION_BOUNDS` and `NPC_BENEFITS_CONFIG` are already imported.)

Add four new choices to `greeting.choices` (insert before the last "Just checking in" choice):

```js
{
  text: '"I\'m still pretty green out here."',
  next: 'explore_more',
  condition: (_rep, context) =>
    context &&
    !context.narrativeFlags?.tanaka_met &&
    context.systemsVisited < ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
},
{
  text: '"Know anyone interesting at Barnard\'s?"',
  next: 'barnards_engineer',
  condition: (_rep, context) =>
    context &&
    !context.narrativeFlags?.tanaka_met &&
    context.systemsVisited >= ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
},
{
  text: '"I met that engineer at Barnard\'s. She barely talked to me."',
  next: 'tanaka_advice',
  condition: (_rep, context) =>
    context &&
    context.narrativeFlags?.tanaka_met &&
    context.getQuestStage('tanaka') === 0,
},
{
  text: '"Any advice on building trust with Tanaka?"',
  next: 'tanaka_patience',
  condition: (_rep, context) => {
    if (!context || !context.narrativeFlags?.tanaka_met) return false;
    const stage = context.getQuestStage('tanaka');
    if (stage < 1 || stage >= 4) return false;
    const nextStage = stage + 1;
    return !context.canStartQuestStage('tanaka', nextStage);
  },
},
{
  text: '"Tanaka says she\'s ready when I am."',
  next: 'pavonis_prep',
  condition: (_rep, context) => {
    if (!context || !context.narrativeFlags?.tanaka_met) return false;
    const stage = context.getQuestStage('tanaka');
    if (stage !== 4) return false;
    if (!context.hasClaimedStageRewards?.('tanaka')) return false;
    return !context.canStartQuestStage('tanaka', 5);
  },
},
```

Add five new dialogue nodes:

```js
explore_more: {
  text: '"You\'re still green. Get a few more systems under your belt — see how the network flows. There are interesting people out there, but they want to see you\'ve earned your stripes first."',
  choices: [
    {
      text: '"Any systems you\'d recommend?"',
      next: 'route_advice',
      repGain: 1,
    },
    {
      text: '"I\'ll get out there."',
      next: 'greeting',
    },
  ],
},

barnards_engineer: {
  text: '"Your ship\'s got a Tanaka Mark III drive, doesn\'t it? Heard the designer\'s daughter works at Barnard\'s. Engineer named Tanaka — does something with drive modifications." He leans in. "Engineers like that don\'t grow on trees. Worth introducing yourself."',
  choices: [
    {
      text: '"I\'ll look her up next time I\'m at Barnard\'s."',
      next: 'greeting',
      repGain: 1,
    },
    {
      text: '"Thanks for the tip, Captain."',
      next: 'greeting',
    },
  ],
},

tanaka_advice: {
  text: '"Tanaka? Yeah, she doesn\'t hand out trust for free. Bring her research supplies — electronics or medicine. Five units at a time." He taps the bar. "Show up consistently. She\'ll come around when she sees you\'re serious."',
  choices: [
    {
      text: '"That\'s helpful. Thanks, Captain."',
      next: 'greeting',
      repGain: 1,
    },
    {
      text: '"I\'ll keep bringing her supplies."',
      next: 'greeting',
    },
  ],
},

tanaka_patience: {
  text: '"Building trust with someone like Tanaka takes time. Keep showing up, keep helping with her research. Bring supplies when you can — electronics, medicine. That\'s how it works with the stubborn ones."',
  choices: [
    {
      text: '"Patience isn\'t my strong suit, but I hear you."',
      next: 'greeting',
      repGain: 1,
    },
    {
      text: '"I\'ll keep at it."',
      next: 'greeting',
    },
  ],
},

pavonis_prep: {
  text: '"She\'s ready when you are. But a run like that — you\'ll need your ship in top shape. Hull solid, engine running near perfect, enough credits for fuel and supplies, and no debts hanging over you. Get your house in order first."',
  choices: [
    {
      text: '"I\'ll make sure everything\'s squared away."',
      next: 'greeting',
      repGain: 1,
    },
    {
      text: '"How much credits are we talking?"',
      next: 'pavonis_prep_credits',
    },
  ],
},

pavonis_prep_credits: {
  text: '"Twenty-five thousand, at least. That\'s fuel, supplies, and margin for the unexpected. Plus your ship needs to be debt-free. No lender\'s going to let you fly off into the void owing them money."',
  choices: [
    {
      text: '"That\'s a lot. I\'d better get trading."',
      next: 'greeting',
      repGain: 1,
    },
    {
      text: '"Got it. Thanks, Captain."',
      next: 'greeting',
    },
  ],
},
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/tanaka-breadcrumbs.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/data/dialogue/captain-vasquez.js tests/unit/tanaka-breadcrumbs.test.js
git commit -m "feat: add Captain Vasquez Tanaka breadcrumb dialogue nodes

Five new conditional dialogue nodes across the Tanaka quest timeline:
- explore_more: encourages exploration when systems < threshold
- barnards_engineer: points player to Tanaka at Barnard's
- tanaka_advice: post-meeting supply run guidance
- tanaka_patience: mid-quest encouragement between stages
- pavonis_prep: Stage 5 material requirements guidance"
```

---

### Task 5: Update Existing Dialogue Structure Tests

**Files:**
- Modify: `tests/unit/dialogue-tree-structure.test.js`

The existing dialogue structure tests validate choice conditions with mock contexts. After adding new choices, the mock contexts need the new fields (`narrativeFlags`, `systemsVisited`, etc.) to prevent condition function errors.

**Step 1: Run existing dialogue structure tests**

Run: `npm test -- tests/unit/dialogue-tree-structure.test.js`
Check if any tests fail due to the new condition functions trying to access `context.narrativeFlags` or `context.systemsVisited` on the existing mock context.

**Step 2: If tests fail, update mock contexts**

Find the mock context objects in `dialogue-tree-structure.test.js` and add the new fields:

```js
narrativeFlags: {},
systemsVisited: 5,
getQuestStage: () => 0,
getQuestState: () => null,
canStartQuestStage: () => false,
hasClaimedStageRewards: () => false,
shipHull: 100,
shipEngine: 100,
debt: 0,
```

Add these to any `mockContext` objects used in Wei Chen and Captain Vasquez test sections.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/unit/dialogue-tree-structure.test.js
git commit -m "test: update dialogue structure test mocks for breadcrumb fields

Add narrativeFlags, systemsVisited, and ship condition fields to mock
contexts so new breadcrumb conditions don't throw in structural tests."
```

---

### Task 6: Format and Final Verification

**Step 1: Run formatter**

Run: `npm run clean`
Expected: All files formatted, no lint errors

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass with zero stderr warnings

**Step 3: Fix any issues found in steps 1-2**

**Step 4: Commit any formatting changes**

```bash
git add -A
git commit -m "chore: format breadcrumb dialogue changes"
```
