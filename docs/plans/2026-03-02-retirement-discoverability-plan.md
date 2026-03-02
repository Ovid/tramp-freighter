# Retirement Discoverability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve discoverability of the Tanaka quest endgame through better briefing content, dockworker breadcrumb events, Info Broker hints, and a Barnard's Star pre-Tanaka event.

**Architecture:** Add new constants for breadcrumb gates, a new `FLAG_NOT_SET` condition type, three new narrative events, a conditional Tanaka rumor in the Info Broker, and rewrite the Captain's Briefing to cover debt/finance/missions/NPCs/endgame hints.

**Tech Stack:** React (JSX), Vitest, ES Modules

---

### Task 1: Add New Constants and FLAG_NOT_SET Condition Type

**Files:**
- Modify: `src/game/constants.js:587-615` (ENDGAME_CONFIG)
- Modify: `src/game/constants.js:1626-1650` (CONDITION_TYPES)
- Modify: `src/game/event-conditions.js:58-59` (add FLAG_NOT_SET case)
- Test: `tests/unit/event-conditions.test.js`

**Step 1: Write the failing tests**

Add to `tests/unit/event-conditions.test.js`, after the `flag_set` describe block (after line 210):

```javascript
  describe('flag_not_set', () => {
    it('should return true when flag is not set', () => {
      expect(
        evaluateCondition({ type: 'flag_not_set', flag: 'unknown_flag' }, baseState)
      ).toBe(true);
    });

    it('should return false when flag exists in narrativeEvents.flags', () => {
      expect(
        evaluateCondition({ type: 'flag_not_set', flag: 'met_chen' }, baseState)
      ).toBe(false);
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/event-conditions.test.js`
Expected: FAIL — `flag_not_set` returns false (unknown condition type)

**Step 3: Add constants and implementation**

In `src/game/constants.js`, add to `ENDGAME_CONFIG` (after line 614, before the closing `}`):

```javascript
  BARNARDS_ENGINEER_RUMOR_SYSTEMS: 5,
  BEYOND_LANES_RUMOR_SYSTEMS: 3,
  INFO_BROKER_TANAKA_CHANCE: 0.3,
```

In `src/game/constants.js`, add to `CONDITION_TYPES` (after the `FLAG_SET` line 1638):

```javascript
  FLAG_NOT_SET: 'flag_not_set',
```

In `src/game/event-conditions.js`, add after the `FLAG_SET` case (after line 59):

```javascript
    case CONDITION_TYPES.FLAG_NOT_SET:
      return !gameState.world.narrativeEvents.flags[condition.flag];
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/event-conditions.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/constants.js src/game/event-conditions.js tests/unit/event-conditions.test.js
git commit -m "feat: add FLAG_NOT_SET condition type and breadcrumb constants"
```

---

### Task 2: Add Dockworker Breadcrumb Narrative Events

**Files:**
- Modify: `src/game/data/narrative-events.js:141` (insert after `dock_generic_rumor`, before `dock_cheap_fuel`)
- Test: `tests/unit/narrative-event-data.test.js`

**Step 1: Write the failing tests**

Add to `tests/unit/narrative-event-data.test.js`, after the `cargo reward schema` describe block (after line 103):

```javascript
  describe('breadcrumb events', () => {
    it('should include dock_barnards_engineer_rumor event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_engineer_rumor'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
    });

    it('should include dock_beyond_the_lanes_rumor event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_beyond_the_lanes_rumor'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
    });

    it('should include dock_barnards_pre_tanaka event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_pre_tanaka'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
      expect(event.trigger.system).toBe(4);
    });

    it('dock_barnards_engineer_rumor requires 5+ systems and tanaka_met not set', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_engineer_rumor'
      );
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const systemsCondition = conditions.find(
        (c) => c.type === 'systems_visited_count'
      );
      const flagCondition = conditions.find(
        (c) => c.type === 'flag_not_set'
      );
      expect(systemsCondition).toBeDefined();
      expect(systemsCondition.value).toBe(5);
      expect(flagCondition).toBeDefined();
      expect(flagCondition.flag).toBe('tanaka_met');
    });

    it('dock_beyond_the_lanes_rumor requires 3+ systems visited', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_beyond_the_lanes_rumor'
      );
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const systemsCondition = conditions.find(
        (c) => c.type === 'systems_visited_count'
      );
      expect(systemsCondition).toBeDefined();
      expect(systemsCondition.value).toBe(3);
    });

    it('dock_barnards_pre_tanaka requires Barnard\'s Star and tanaka_met not set', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_pre_tanaka'
      );
      expect(event.trigger.system).toBe(4);
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const flagCondition = conditions.find(
        (c) => c.type === 'flag_not_set'
      );
      expect(flagCondition).toBeDefined();
      expect(flagCondition.flag).toBe('tanaka_met');
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: FAIL — events not found

**Step 3: Add the three narrative events**

In `src/game/data/narrative-events.js`, insert after the `dock_generic_rumor` event (after line 141, before `dock_cheap_fuel`):

```javascript
  {
    id: 'dock_beyond_the_lanes_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        {
          type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT,
          value: ENDGAME_CONFIG.BEYOND_LANES_RUMOR_SYSTEMS,
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'A dockworker sidles up while you wait for clearance.',
        '"You ever talk to the old hands? Some of them swear there are routes that don\'t show on any starmap. Places beyond the wormhole network."',
        'She shrugs. "Probably just spacer talk. But who knows?"',
      ],
      speaker: null,
      mood: 'mysterious',
      choices: [
        {
          text: '"Interesting. Where would I hear more?"',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"I\'ve got enough to worry about on the known routes."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_engineer_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        {
          type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT,
          value: ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS,
        },
        {
          type: CONDITION_TYPES.FLAG_NOT_SET,
          flag: 'tanaka_met',
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'A dockworker sidles up while you wait for clearance.',
        '"Hey, you run a Tanaka drive, right? Heard the designer\'s daughter works out of Barnard\'s Star. Does something with experimental drive mods."',
        'He lowers his voice. "Picky about who she works with, though."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"Thanks. Might be worth a visit."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"Mind your own business."',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },
```

Then, in the `// === QUEST EVENTS ===` section (before `tanaka_intro`), add the pre-Tanaka Barnard's event:

```javascript
  {
    id: 'dock_barnards_pre_tanaka',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: ENDGAME_CONFIG.TANAKA_SYSTEM,
      condition: [
        {
          type: CONDITION_TYPES.FLAG_NOT_SET,
          flag: 'tanaka_met',
        },
        {
          type: CONDITION_TYPES.QUEST_STAGE,
          questId: 'tanaka',
          value: 0,
        },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'You ask around about an engineer who works on drive modifications.',
        'A dock tech looks you over. "Tanaka? Yeah, she\'s here. But she doesn\'t talk to green pilots."',
        '"Come back when you\'ve got some real flight time. She wants to see you\'ve been around — visited plenty of systems, know the lanes."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"How much flight time are we talking?"',
          next: 'dock_barnards_pre_tanaka_followup',
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"I\'ll be back."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_pre_tanaka_followup',
    type: 'chain',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 0,
    content: {
      text: [
        '"More than you\'ve got." The dock tech counts on her fingers.',
        '"Visit more systems. Get to know the network. She\'ll notice when you\'ve earned your stripes."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"Got it. I\'ll explore more first."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/data/narrative-events.js tests/unit/narrative-event-data.test.js
git commit -m "feat: add dockworker breadcrumb events and Barnard's pre-Tanaka event"
```

---

### Task 3: Add Info Broker Tanaka Rumor

**Files:**
- Modify: `src/game/game-information-broker.js:1-3` (add ENDGAME_CONFIG import)
- Modify: `src/game/game-information-broker.js:156-163` (add Tanaka rumor logic at start of generateRumor)
- Test: `tests/unit/info-broker-manager.test.js`

**Step 1: Write the failing tests**

Add to `tests/unit/info-broker-manager.test.js`, inside the `generateRumor` describe block (after line 135):

```javascript
    it('returns Tanaka hint when player has 5+ systems visited and tanaka_met not set', () => {
      const state = gsm.getState();
      // Set up 5+ visited systems
      state.world.visitedSystems = [0, 1, 4, 5, 7];
      // Ensure tanaka_met flag is NOT set
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags = state.world.narrativeEvents.flags || {};
      delete state.world.narrativeEvents.flags.tanaka_met;

      // Run generateRumor many times — at least one should mention Tanaka/Barnard's
      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes("Barnard")
      );
      expect(hasTanakaRumor).toBe(true);
    });

    it('does not return Tanaka hint when tanaka_met flag is set', () => {
      const state = gsm.getState();
      state.world.visitedSystems = [0, 1, 4, 5, 7];
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags = state.world.narrativeEvents.flags || {};
      state.world.narrativeEvents.flags.tanaka_met = true;

      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes("Barnard")
      );
      expect(hasTanakaRumor).toBe(false);
    });

    it('does not return Tanaka hint when fewer than 5 systems visited', () => {
      const state = gsm.getState();
      state.world.visitedSystems = [0, 1];
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags = state.world.narrativeEvents.flags || {};

      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes("Barnard")
      );
      expect(hasTanakaRumor).toBe(false);
    });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/info-broker-manager.test.js`
Expected: FAIL — no Tanaka rumor generated

**Step 3: Implement the Tanaka rumor logic**

In `src/game/game-information-broker.js`, update the import (line 1):

```javascript
import { COMMODITY_TYPES, INTELLIGENCE_CONFIG, ENDGAME_CONFIG } from './constants.js';
```

In `generateRumor()`, add after the seeded random initialization (after line 162, before the active events check):

```javascript
    // Conditional Tanaka hint for mid-game players
    const visitedCount = gameState.world.visitedSystems?.length ?? 0;
    const tanakaFlag = gameState.world.narrativeEvents?.flags?.tanaka_met;
    if (
      !tanakaFlag &&
      visitedCount >= ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS &&
      rng.next() < ENDGAME_CONFIG.INFO_BROKER_TANAKA_CHANCE
    ) {
      return "There's an engineer at Barnard's Star — Tanaka, I think. Works on experimental drive tech. Doesn't talk to just anyone, though.";
    }
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/info-broker-manager.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/game-information-broker.js tests/unit/info-broker-manager.test.js
git commit -m "feat: add conditional Tanaka hint to Info Broker rumors"
```

---

### Task 4: Rewrite Captain's Briefing

**Files:**
- Modify: `src/features/instructions/InstructionsModal.jsx` (full content rewrite)

**Step 1: Rewrite the InstructionsModal**

Replace the "Your Goal" section (lines 7-22) with:

```jsx
        <section className="instructions-section">
          <h3>Your Goal</h3>
          <p>
            You owe Marcus Cole ten thousand credits — and he's not the
            patient type. Check the <strong>Finance</strong> menu at any
            station to see your debt terms: interest, withholding, and
            payment options.
          </p>
          <p>
            Trade smart, pay down the debt, and build a reputation. The
            traders who last longest out here aren't just rich — they know
            the right people. There are rumors of routes beyond the known
            lanes, but nobody's going to share those with a stranger. Earn
            your way in.
          </p>
        </section>
```

Replace the "Stations" section (lines 35-44) with:

```jsx
        <section className="instructions-section">
          <h3>Stations</h3>
          <p>
            When you're in a system with a station, click the{' '}
            <strong>Dock</strong> button in the Quick Access panel to go
            aboard. From there you can trade goods, refuel, and repair your
            ship. Each system has different prices — buy low, sell high.
          </p>
          <p>
            The <strong>Info Broker</strong> sells market intelligence —
            rumors and price data for nearby systems. Worth the credits if
            you want to trade smart instead of flying blind.
          </p>
          <p>
            The <strong>Mission Board</strong> posts cargo runs and
            passenger contracts. Missions pay on delivery and don't cost
            anything upfront — good supplemental income alongside trading.
          </p>
          <p>
            Talk to <strong>People</strong> at stations. Build
            relationships and they'll share tips, offer favors, and open
            doors you didn't know existed.
          </p>
        </section>
```

**Step 2: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```
git add src/features/instructions/InstructionsModal.jsx
git commit -m "feat: rewrite Captain's Briefing to cover debt, Info Broker, missions, NPCs"
```

---

### Task 5: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Final commit (if any lint fixes needed)**

Only if lint produces fixable issues:
```
npm run lint:fix
git add -A
git commit -m "chore: lint fixes"
```

---
