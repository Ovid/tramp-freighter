# Architecture Follow-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three independent architecture improvements: event name constants (1A), dialogue data decoupling (2A), and pure calculator extraction (2B).

**Architecture:** All three items are independent and can be parallelized. Each follows TDD. Event constants replaces ~94 string literals with typed constants. Dialogue decoupling replaces `gameStateManager` parameter with a flat context object built by DialogueManager. Pure calculators extract calculation logic from manager methods into standalone testable functions.

**Tech Stack:** Vitest, ES Modules, existing Bridge Pattern architecture

---

## Workstream A: Event Name Constants (1A)

### Task 1: Define EVENT_NAMES constant and test

**Files:**
- Modify: `src/game/constants.js` (append after line 1616)
- Create: `tests/unit/event-names.test.js`

**Step 1: Write the failing test**

```js
// tests/unit/event-names.test.js
import { describe, it, expect } from 'vitest';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('EVENT_NAMES', () => {
  it('exports a frozen object of event name constants', () => {
    expect(EVENT_NAMES).toBeDefined();
    expect(Object.isFrozen(EVENT_NAMES)).toBe(true);
  });

  it('contains all required event names', () => {
    const requiredEvents = [
      'CREDITS_CHANGED', 'DEBT_CHANGED', 'FUEL_CHANGED', 'CARGO_CHANGED',
      'CARGO_CAPACITY_CHANGED', 'HIDDEN_CARGO_CHANGED', 'LOCATION_CHANGED',
      'TIME_CHANGED', 'PRICE_KNOWLEDGE_CHANGED', 'ACTIVE_EVENTS_CHANGED',
      'SHIP_CONDITION_CHANGED', 'CONDITION_WARNING', 'SHIP_NAME_CHANGED',
      'UPGRADES_CHANGED', 'QUIRKS_CHANGED', 'DIALOGUE_CHANGED',
      'FACTION_REP_CHANGED', 'FINANCE_CHANGED', 'ENCOUNTER_TRIGGERED',
      'NARRATIVE_EVENT_TRIGGERED', 'HULL_CHANGED', 'ENGINE_CHANGED',
      'LIFE_SUPPORT_CHANGED', 'KARMA_CHANGED', 'INTELLIGENCE_CHANGED',
      'CURRENT_SYSTEM_CHANGED', 'MISSIONS_CHANGED', 'NPCS_CHANGED',
      'DOCKED', 'QUEST_CHANGED', 'JUMP_COMPLETED', 'PAVONIS_RUN_TRIGGERED',
      'UNDOCKED',
    ];
    for (const key of requiredEvents) {
      expect(EVENT_NAMES).toHaveProperty(key);
    }
  });

  it('maps UPPER_SNAKE keys to camelCase string values', () => {
    expect(EVENT_NAMES.CREDITS_CHANGED).toBe('creditsChanged');
    expect(EVENT_NAMES.CARGO_CHANGED).toBe('cargoChanged');
    expect(EVENT_NAMES.DOCKED).toBe('docked');
    expect(EVENT_NAMES.JUMP_COMPLETED).toBe('jumpCompleted');
  });

  it('has no duplicate values', () => {
    const values = Object.values(EVENT_NAMES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/event-names.test.js`
Expected: FAIL — `EVENT_NAMES` is not exported from constants.js

**Step 3: Implement EVENT_NAMES in constants.js**

Append to `src/game/constants.js` after the closing `};` of `CONDITION_TYPES` (line 1616):

```js
/**
 * Event names for the Bridge Pattern event system.
 * Used by EventSystemManager, all managers with emit() calls,
 * and React hooks (useGameEvent, useEventTriggers).
 *
 * Keys are UPPER_SNAKE_CASE, values are the camelCase strings
 * that flow through the event system.
 */
export const EVENT_NAMES = Object.freeze({
  // Player resources
  CREDITS_CHANGED: 'creditsChanged',
  DEBT_CHANGED: 'debtChanged',
  FINANCE_CHANGED: 'financeChanged',

  // Ship systems
  FUEL_CHANGED: 'fuelChanged',
  SHIP_CONDITION_CHANGED: 'shipConditionChanged',
  HULL_CHANGED: 'hullChanged',
  ENGINE_CHANGED: 'engineChanged',
  LIFE_SUPPORT_CHANGED: 'lifeSupportChanged',
  SHIP_NAME_CHANGED: 'shipNameChanged',
  CONDITION_WARNING: 'conditionWarning',

  // Cargo & inventory
  CARGO_CHANGED: 'cargoChanged',
  CARGO_CAPACITY_CHANGED: 'cargoCapacityChanged',
  HIDDEN_CARGO_CHANGED: 'hiddenCargoChanged',

  // Navigation & location
  LOCATION_CHANGED: 'locationChanged',
  CURRENT_SYSTEM_CHANGED: 'currentSystemChanged',
  DOCKED: 'docked',
  UNDOCKED: 'undocked',
  JUMP_COMPLETED: 'jumpCompleted',

  // Time & events
  TIME_CHANGED: 'timeChanged',
  ACTIVE_EVENTS_CHANGED: 'activeEventsChanged',

  // Economy & trading
  PRICE_KNOWLEDGE_CHANGED: 'priceKnowledgeChanged',

  // Upgrades & quirks
  UPGRADES_CHANGED: 'upgradesChanged',
  QUIRKS_CHANGED: 'quirksChanged',

  // Dialogue & NPCs
  DIALOGUE_CHANGED: 'dialogueChanged',
  NPCS_CHANGED: 'npcsChanged',

  // Factions & karma
  FACTION_REP_CHANGED: 'factionRepChanged',
  KARMA_CHANGED: 'karmaChanged',

  // Missions & quests
  MISSIONS_CHANGED: 'missionsChanged',
  QUEST_CHANGED: 'questChanged',

  // Intelligence
  INTELLIGENCE_CHANGED: 'intelligenceChanged',

  // Encounters & narrative
  ENCOUNTER_TRIGGERED: 'encounterTriggered',
  NARRATIVE_EVENT_TRIGGERED: 'narrativeEventTriggered',

  // Special
  PAVONIS_RUN_TRIGGERED: 'pavonisRunTriggered',
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/event-names.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/event-names.test.js
git commit -m "feat: add EVENT_NAMES constants to constants.js"
```

---

### Task 2: Update EventSystemManager to use EVENT_NAMES

**Files:**
- Modify: `src/game/state/managers/event-system.js`
- Modify: `tests/unit/event-names.test.js` (add EventSystemManager integration test)

**Step 1: Write the failing test**

Add to `tests/unit/event-names.test.js`:

```js
import { EventSystemManager } from '../../src/game/state/managers/event-system.js';

describe('EventSystemManager integration with EVENT_NAMES', () => {
  it('subscriber keys match EVENT_NAMES values exactly', () => {
    const esm = new EventSystemManager({ state: null });
    const subscriberKeys = Object.keys(esm.getSubscribers());
    const eventValues = Object.values(EVENT_NAMES);

    // Every subscriber key must be an EVENT_NAMES value
    for (const key of subscriberKeys) {
      expect(eventValues).toContain(key);
    }
    // Every EVENT_NAMES value must have a subscriber
    for (const val of eventValues) {
      expect(subscriberKeys).toContain(val);
    }
  });

  it('warns on emit with unknown event name', () => {
    const esm = new EventSystemManager({ state: null });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    esm.emit('totallyFakeEvent', {});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('totallyFakeEvent')
    );
    warnSpy.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/event-names.test.js`
Expected: FAIL — subscribers are hardcoded, no warning on unknown emit

**Step 3: Update EventSystemManager**

In `src/game/state/managers/event-system.js`:

1. Import EVENT_NAMES at the top
2. Build subscribers from EVENT_NAMES values instead of hardcoded strings
3. Add dev-mode warning in emit() for unknown event names

```js
import { EVENT_NAMES } from '../../constants.js';

export class EventSystemManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;

    // Build subscriber registry from EVENT_NAMES constants
    this.subscribers = {};
    for (const eventName of Object.values(EVENT_NAMES)) {
      this.subscribers[eventName] = [];
    }
  }

  // ... subscribe() and unsubscribe() remain the same ...

  emit(eventType, data) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type in emit(): ${eventType}. Check EVENT_NAMES in constants.js.`);
      return;
    }

    this.subscribers[eventType].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} subscriber:`, error);
      }
    });
  }

  // ... getSubscribers() remains the same ...
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/event-names.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: ALL PASS (existing tests should still work since event name strings haven't changed)

**Step 6: Commit**

```bash
git add src/game/state/managers/event-system.js tests/unit/event-names.test.js
git commit -m "refactor: build EventSystemManager subscribers from EVENT_NAMES"
```

---

### Task 3: Replace all emit() and subscribe() string literals with EVENT_NAMES

**Files:** All manager files with `this.emit('...')` calls, hooks, and DevAdminPanel. The exact list (search for `this.emit('` and `emit('` across codebase):

- `src/game/state/managers/state.js`
- `src/game/state/managers/ship.js`
- `src/game/state/managers/navigation.js`
- `src/game/state/managers/trading.js`
- `src/game/state/managers/events.js`
- `src/game/state/managers/dialogue.js`
- `src/game/state/managers/initialization.js`
- `src/game/state/managers/save-load.js`
- `src/game/state/managers/danger.js`
- `src/game/state/managers/mission.js`
- `src/game/state/managers/info-broker.js`
- `src/game/state/managers/npc.js`
- `src/game/state/managers/quest-manager.js`
- `src/game/state/managers/debt.js`
- `src/game/game-state-manager.js`
- `src/hooks/useGameEvent.js` (extractStateForEvent keys)
- `src/hooks/useEventTriggers.js` (subscribe calls + emit calls)
- `src/features/dev-admin/DevAdminPanel.jsx` (emit calls)

**Step 1: No new tests needed**

Existing tests cover all event emission paths. This is a mechanical find-replace. The EventSystemManager warning (from Task 2) will catch any missed replacements at runtime.

**Step 2: Replace string literals in each file**

For every file above:
1. Add `import { EVENT_NAMES } from '../../constants.js';` (adjust relative path)
2. Replace every `this.emit('creditsChanged', ...)` with `this.emit(EVENT_NAMES.CREDITS_CHANGED, ...)`
3. Replace every `this.emit('cargoChanged', ...)` with `this.emit(EVENT_NAMES.CARGO_CHANGED, ...)`
4. Continue for all event names in that file

For hooks and DevAdminPanel:
1. Replace subscribe string literals: `'locationChanged'` → `EVENT_NAMES.LOCATION_CHANGED`
2. Replace extractStateForEvent keys: `creditsChanged:` → `[EVENT_NAMES.CREDITS_CHANGED]:`
3. Replace emit calls: `gameStateManager.emit('encounterTriggered', ...)` → `gameStateManager.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, ...)`

**Key mapping reference:**

| String Literal | Constant |
|---|---|
| `'creditsChanged'` | `EVENT_NAMES.CREDITS_CHANGED` |
| `'debtChanged'` | `EVENT_NAMES.DEBT_CHANGED` |
| `'fuelChanged'` | `EVENT_NAMES.FUEL_CHANGED` |
| `'cargoChanged'` | `EVENT_NAMES.CARGO_CHANGED` |
| `'cargoCapacityChanged'` | `EVENT_NAMES.CARGO_CAPACITY_CHANGED` |
| `'hiddenCargoChanged'` | `EVENT_NAMES.HIDDEN_CARGO_CHANGED` |
| `'locationChanged'` | `EVENT_NAMES.LOCATION_CHANGED` |
| `'timeChanged'` | `EVENT_NAMES.TIME_CHANGED` |
| `'priceKnowledgeChanged'` | `EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED` |
| `'activeEventsChanged'` | `EVENT_NAMES.ACTIVE_EVENTS_CHANGED` |
| `'shipConditionChanged'` | `EVENT_NAMES.SHIP_CONDITION_CHANGED` |
| `'conditionWarning'` | `EVENT_NAMES.CONDITION_WARNING` |
| `'shipNameChanged'` | `EVENT_NAMES.SHIP_NAME_CHANGED` |
| `'upgradesChanged'` | `EVENT_NAMES.UPGRADES_CHANGED` |
| `'quirksChanged'` | `EVENT_NAMES.QUIRKS_CHANGED` |
| `'dialogueChanged'` | `EVENT_NAMES.DIALOGUE_CHANGED` |
| `'factionRepChanged'` | `EVENT_NAMES.FACTION_REP_CHANGED` |
| `'financeChanged'` | `EVENT_NAMES.FINANCE_CHANGED` |
| `'encounterTriggered'` | `EVENT_NAMES.ENCOUNTER_TRIGGERED` |
| `'narrativeEventTriggered'` | `EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED` |
| `'hullChanged'` | `EVENT_NAMES.HULL_CHANGED` |
| `'engineChanged'` | `EVENT_NAMES.ENGINE_CHANGED` |
| `'lifeSupportChanged'` | `EVENT_NAMES.LIFE_SUPPORT_CHANGED` |
| `'karmaChanged'` | `EVENT_NAMES.KARMA_CHANGED` |
| `'intelligenceChanged'` | `EVENT_NAMES.INTELLIGENCE_CHANGED` |
| `'currentSystemChanged'` | `EVENT_NAMES.CURRENT_SYSTEM_CHANGED` |
| `'missionsChanged'` | `EVENT_NAMES.MISSIONS_CHANGED` |
| `'npcsChanged'` | `EVENT_NAMES.NPCS_CHANGED` |
| `'docked'` | `EVENT_NAMES.DOCKED` |
| `'questChanged'` | `EVENT_NAMES.QUEST_CHANGED` |
| `'jumpCompleted'` | `EVENT_NAMES.JUMP_COMPLETED` |
| `'pavonisRunTriggered'` | `EVENT_NAMES.PAVONIS_RUN_TRIGGERED` |
| `'undocked'` | `EVENT_NAMES.UNDOCKED` |

**Step 3: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 4: Run lint**

Run: `npm run lint:fix`
Expected: Clean (fix any import order issues)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: replace all event name string literals with EVENT_NAMES constants"
```

---

## Workstream B: Dialogue Data Decoupling (2A)

### Task 4: Refactor faction-karma-conditions.js to use context

**Files:**
- Modify: `src/game/data/dialogue/faction-karma-conditions.js`
- Create: `tests/unit/faction-karma-conditions.test.js`

**Context:** This helper file contains ~12 functions that take `gameStateManager` as a parameter to call `getKarma()` and `getFactionRep()`. Changing them to accept a context object makes them truly pure and testable without mocking.

**Step 1: Write the failing test**

```js
// tests/unit/faction-karma-conditions.test.js
import { describe, it, expect } from 'vitest';
import {
  hasFactionRep,
  hasKarma,
  hasMaxKarma,
  isTrustedByAuthorities,
  isKnownToOutlaws,
  isFriendToCivilians,
  hasGoodKarma,
  hasBadKarma,
  isWantedByAuthorities,
  hasMixedReputation,
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
} from '../../src/game/data/dialogue/faction-karma-conditions.js';

describe('faction-karma-conditions with context object', () => {
  const makeContext = (overrides = {}) => ({
    karma: 0,
    factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
    ...overrides,
  });

  it('hasFactionRep checks context.factionReps', () => {
    const ctx = makeContext({ factionReps: { authorities: 60 } });
    expect(hasFactionRep('authorities', 50, ctx)).toBe(true);
    expect(hasFactionRep('authorities', 70, ctx)).toBe(false);
  });

  it('hasKarma checks context.karma', () => {
    const ctx = makeContext({ karma: 30 });
    expect(hasKarma(25, ctx)).toBe(true);
    expect(hasKarma(35, ctx)).toBe(false);
  });

  it('hasMaxKarma checks context.karma is at or below max', () => {
    const ctx = makeContext({ karma: -30 });
    expect(hasMaxKarma(-25, ctx)).toBe(true);
    expect(hasMaxKarma(-35, ctx)).toBe(false);
  });

  it('isTrustedByAuthorities checks authority rep >= 50', () => {
    expect(isTrustedByAuthorities(makeContext({ factionReps: { authorities: 50 } }))).toBe(true);
    expect(isTrustedByAuthorities(makeContext({ factionReps: { authorities: 49 } }))).toBe(false);
  });

  it('isKnownToOutlaws checks outlaw rep >= 50', () => {
    expect(isKnownToOutlaws(makeContext({ factionReps: { outlaws: 50 } }))).toBe(true);
  });

  it('isFriendToCivilians checks civilian rep >= 50', () => {
    expect(isFriendToCivilians(makeContext({ factionReps: { civilians: 50 } }))).toBe(true);
  });

  it('hasGoodKarma checks karma >= 25', () => {
    expect(hasGoodKarma(makeContext({ karma: 25 }))).toBe(true);
    expect(hasGoodKarma(makeContext({ karma: 24 }))).toBe(false);
  });

  it('hasBadKarma checks karma <= -25', () => {
    expect(hasBadKarma(makeContext({ karma: -25 }))).toBe(true);
    expect(hasBadKarma(makeContext({ karma: -24 }))).toBe(false);
  });

  it('isWantedByAuthorities checks authority rep <= -25', () => {
    expect(isWantedByAuthorities(makeContext({ factionReps: { authorities: -25 } }))).toBe(true);
    expect(isWantedByAuthorities(makeContext({ factionReps: { authorities: -24 } }))).toBe(false);
  });

  it('hasMixedReputation checks high >= 25 and low <= -25', () => {
    const ctx = makeContext({ factionReps: { authorities: 30, outlaws: -30 } });
    expect(hasMixedReputation('authorities', 'outlaws', ctx)).toBe(true);
  });

  it('getFactionAttitudeModifier uses context.factionReps', () => {
    const ctx = makeContext({ factionReps: { civilians: 60 } });
    const result = getFactionAttitudeModifier('civilians', ctx);
    expect(typeof result).toBe('string');
  });

  // getKarmaFirstImpression is already pure — no change needed
  it('getKarmaFirstImpression remains pure (takes karma value, not context)', () => {
    const result = getKarmaFirstImpression(30, 'neutral');
    expect(typeof result).toBe('string');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/faction-karma-conditions.test.js`
Expected: FAIL — functions currently expect `gameStateManager`, not context

**Step 3: Update faction-karma-conditions.js**

Change every function that takes `gameStateManager` to take `context` instead:

- `hasFactionRep(faction, minRep, context)` → use `context.factionReps[faction]` instead of `gameStateManager.getFactionRep(faction)`
- `hasKarma(minKarma, context)` → use `context.karma` instead of `gameStateManager.getKarma()`
- `hasMaxKarma(maxKarma, context)` → use `context.karma` instead of `gameStateManager.getKarma()`
- `isTrustedByAuthorities(context)` → pass context to hasFactionRep
- `isKnownToOutlaws(context)` → pass context to hasFactionRep
- `isFriendToCivilians(context)` → pass context to hasFactionRep
- `hasGoodKarma(context)` → pass context to hasKarma
- `hasBadKarma(context)` → pass context to hasMaxKarma
- `isWantedByAuthorities(context)` → use `context.factionReps.authorities` instead of `gameStateManager.getFactionRep('authorities')`
- `hasMixedReputation(high, low, context)` → use `context.factionReps[high]` and `context.factionReps[low]`
- `getFactionAttitudeModifier(npcFaction, context)` → use `context.factionReps[npcFaction]`
- `getKarmaFirstImpression(karma, personality)` — **no change**, already pure

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/faction-karma-conditions.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/data/dialogue/faction-karma-conditions.js tests/unit/faction-karma-conditions.test.js
git commit -m "refactor: faction-karma-conditions takes context object instead of gameStateManager"
```

---

### Task 5: Update game-dialogue.js engine to build and pass context

**Files:**
- Modify: `src/game/game-dialogue.js`
- Modify: `src/game/state/managers/dialogue.js`

**Context:** The dialogue engine (`game-dialogue.js`) currently passes `gameStateManager` directly to text/condition/action functions. We need it to build a context object and pass that instead. The context is built by a new `buildDialogueContext()` function.

**Step 1: Write the failing test**

Add to `tests/unit/faction-karma-conditions.test.js` or create `tests/unit/dialogue-context.test.js`:

```js
// tests/unit/dialogue-context.test.js
import { describe, it, expect } from 'vitest';
import { buildDialogueContext } from '../../src/game/game-dialogue.js';

describe('buildDialogueContext', () => {
  const mockGSM = {
    getState: () => ({
      player: { daysElapsed: 42, credits: 1000 },
      ship: { cargo: [{ type: 'food', quantity: 5 }] },
    }),
    getKarma: () => 15,
    getHeatTier: () => 'low',
    getNPCState: (id) => ({ rep: 50, loanAmount: 0, loanDay: null, storedCargo: [], flags: [] }),
    canGetTip: (id) => ({ available: true }),
    canRequestFavor: (id, type) => ({ available: type === 'loan' }),
    getFactionRep: (f) => ({ authorities: 10, outlaws: -5, civilians: 20 }[f] || 0),
    getQuestStage: () => 0,
    getQuestState: () => null,
    canStartQuestStage: () => false,
    checkQuestObjectives: () => ({}),
    hasClaimedStageRewards: () => false,
    requestLoan: () => ({ success: true }),
    storeCargo: () => ({ success: true }),
    repayLoan: () => ({ success: true }),
    retrieveCargo: () => ({ success: true }),
    advanceQuest: () => ({ success: true }),
    claimStageRewards: () => ({ success: true }),
    startPavonisRun: () => {},
    updateQuestData: () => {},
    modifyColeRep: () => {},
  };

  it('builds context with data properties', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.karma).toBe(15);
    expect(ctx.heat).toBe('low');
    expect(ctx.daysElapsed).toBe(42);
    expect(ctx.credits).toBe(1000);
    expect(ctx.factionReps.authorities).toBe(10);
    expect(ctx.canGetTip).toEqual({ available: true });
  });

  it('builds context with npc state', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.npcState.rep).toBe(50);
  });

  it('builds context with action callbacks', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(typeof ctx.requestLoan).toBe('function');
    expect(typeof ctx.storeCargo).toBe('function');
    expect(typeof ctx.repayLoan).toBe('function');
    expect(typeof ctx.retrieveCargo).toBe('function');
  });

  it('builds context with quest accessors', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(typeof ctx.getQuestStage).toBe('function');
    expect(typeof ctx.getQuestState).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/dialogue-context.test.js`
Expected: FAIL — `buildDialogueContext` doesn't exist yet

**Step 3: Implement buildDialogueContext in game-dialogue.js**

Add this exported function to `src/game/game-dialogue.js`:

```js
/**
 * Build a flat context object for dialogue text/condition/action functions.
 * Replaces direct gameStateManager access in dialogue data files.
 */
export function buildDialogueContext(gameStateManager, npcId) {
  const state = gameStateManager.getState();
  return {
    // Read-only data
    karma: gameStateManager.getKarma(),
    heat: gameStateManager.getHeatTier(),
    npcState: gameStateManager.getNPCState(npcId),
    daysElapsed: state.player.daysElapsed,
    credits: state.player.credits,
    cargo: state.ship.cargo,
    canGetTip: gameStateManager.canGetTip(npcId),
    canRequestLoan: gameStateManager.canRequestFavor(npcId, 'loan'),
    canRequestStorage: gameStateManager.canRequestFavor(npcId, 'storage'),
    factionReps: {
      authorities: gameStateManager.getFactionRep('authorities'),
      outlaws: gameStateManager.getFactionRep('outlaws'),
      civilians: gameStateManager.getFactionRep('civilians'),
    },

    // Quest accessors (kept as functions since they take parameters)
    getQuestStage: (questId) => gameStateManager.getQuestStage(questId),
    getQuestState: (questId) => gameStateManager.getQuestState(questId),
    canStartQuestStage: (questId, stage) => gameStateManager.canStartQuestStage(questId, stage),
    checkQuestObjectives: (questId) => gameStateManager.checkQuestObjectives(questId),
    hasClaimedStageRewards: (questId) => gameStateManager.hasClaimedStageRewards(questId),

    // Action callbacks (bound to npcId where appropriate)
    requestLoan: () => gameStateManager.requestLoan(npcId),
    storeCargo: () => gameStateManager.storeCargo(npcId),
    repayLoan: () => gameStateManager.repayLoan(npcId),
    retrieveCargo: () => gameStateManager.retrieveCargo(npcId),
    advanceQuest: (questId) => gameStateManager.advanceQuest(questId),
    claimStageRewards: (questId) => gameStateManager.claimStageRewards(questId),
    startPavonisRun: () => gameStateManager.startPavonisRun(),
    updateQuestData: (...args) => gameStateManager.updateQuestData(...args),
    modifyColeRep: (...args) => gameStateManager.modifyColeRep(...args),
  };
}
```

Then update `showDialogue()` and `selectChoice()` in the same file to use it:

In `showDialogue()`:
- After getting `currentRep` (line 100), add: `const context = buildDialogueContext(gameStateManager, npcId);`
- Change text evaluation (line 105): `dialogueNode.text(currentRep, context)` (was `(currentRep, gameStateManager, npcId)`)
- Change condition evaluation (line 129): `choice.condition(currentRep, context)` (was `(currentRep, gameStateManager, npcId)`)

In `selectChoice()`:
- After getting `selectedChoice` (line 219), add: `const context = buildDialogueContext(gameStateManager, npcId);`
- Change action call (line 224): `selectedChoice.action(context)` (was `(gameStateManager, npcId)`)

**Important:** Keep `gameStateManager` as parameter to `showDialogue()` and `selectChoice()` — they still need it for `setDialogueState()`, `modifyRep()`, `clearDialogueState()`, etc. The context is only for what gets passed INTO dialogue data functions.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/dialogue-context.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/game-dialogue.js tests/unit/dialogue-context.test.js
git commit -m "feat: buildDialogueContext replaces gameStateManager in dialogue function signatures"
```

---

### Task 6: Update all NPC dialogue files to use context

**Files:** All 10 dialogue files in `src/game/data/dialogue/`:
- `marcus-cole.js`
- `wei-chen.js`
- `whisper.js`
- `captain-vasquez.js`
- `tanaka-dialogue.js`
- `dr-sarah-kim.js`
- `lucky-liu.js`
- `rusty-rodriguez.js`
- `station-master-kowalski.js`
- `zara-osman.js`
- `father-okonkwo.js` (likely no changes needed — verify)

**Step 1: No new tests — existing integration tests cover dialogue**

The dialogue system is tested through integration tests. The key verification is that the full test suite passes after changes.

**Step 2: Update each dialogue file**

**Pattern for standard NPC files** (dr-sarah-kim, lucky-liu, rusty-rodriguez, station-master-kowalski, zara-osman):

These files follow an identical pattern. For each:

1. Remove `gameStateManager` from function signatures
2. In `text` functions: change `(rep, gameStateManager, npcId)` → `(rep, context)`
   - `gameStateManager.getNPCState(npcId)` → `context.npcState`
   - `gameStateManager.getState().player.daysElapsed` → `context.daysElapsed`
3. In `condition` functions: change `(rep, gameStateManager, npcId)` → `(rep, context)`
   - `gameStateManager.canGetTip(npcId)` → `context.canGetTip`
   - `gameStateManager.canRequestFavor(npcId, 'loan')` → `context.canRequestLoan`
   - `gameStateManager.canRequestFavor(npcId, 'storage')` → `context.canRequestStorage`
   - `gameStateManager.getNPCState(npcId)` → `context.npcState`
4. In `action` functions: change `(gameStateManager, npcId)` → `(context)`
   - `gameStateManager.requestLoan(npcId)` → `context.requestLoan()`
   - `gameStateManager.storeCargo(npcId)` → `context.storeCargo()`
   - `gameStateManager.repayLoan(npcId)` → `context.repayLoan()`
   - `gameStateManager.retrieveCargo(npcId)` → `context.retrieveCargo()`

**Pattern for faction/karma NPC files** (wei-chen, whisper, captain-vasquez):

Same as above, plus:
- `gameStateManager.getKarma()` → `context.karma`
- Helper function calls change from `hasFactionRep('civilians', 50, gameStateManager)` → `hasFactionRep('civilians', 50, context)` (since Task 4 updated these helpers to take context)
- `hasGoodKarma(gameStateManager)` → `hasGoodKarma(context)`
- `hasBadKarma(gameStateManager)` → `hasBadKarma(context)`
- `isWantedByAuthorities(gameStateManager)` → `isWantedByAuthorities(context)`
- `getFactionAttitudeModifier('civilians', gameStateManager)` → `getFactionAttitudeModifier('civilians', context)`
- `getKarmaFirstImpression(karma, 'neutral')` — no change (already pure)

**Pattern for tanaka-dialogue.js** (quest-heavy):

Same patterns plus:
- `gameStateManager.getQuestStage('tanaka')` → `context.getQuestStage('tanaka')`
- `gameStateManager.getQuestState('tanaka')` → `context.getQuestState('tanaka')`
- `gameStateManager.canStartQuestStage('tanaka', 5)` → `context.canStartQuestStage('tanaka', 5)`
- `gameStateManager.checkQuestObjectives('tanaka')` → `context.checkQuestObjectives('tanaka')`
- `gameStateManager.hasClaimedStageRewards('tanaka')` → `context.hasClaimedStageRewards('tanaka')`
- `gameStateManager.advanceQuest('tanaka')` → `context.advanceQuest('tanaka')`
- `gameStateManager.claimStageRewards('tanaka')` → `context.claimStageRewards('tanaka')`
- `gameStateManager.startPavonisRun()` → `context.startPavonisRun()`

**Pattern for marcus-cole.js** (simplest):
- `gameStateManager.getHeatTier()` → `context.heat`
- `gameStateManager.canGetTip(npcId)` → `context.canGetTip`

**Step 3: Verify — grep for remaining gameStateManager references**

Run: `grep -r "gameStateManager" src/game/data/dialogue/ --include="*.js"`

Expected: ZERO hits (except possibly import lines if any existed — there should be none since dialogue files don't import gameStateManager).

**Step 4: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 5: Run lint**

Run: `npm run lint:fix`

**Step 6: Commit**

```bash
git add src/game/data/dialogue/
git commit -m "refactor: all dialogue files use context object instead of gameStateManager"
```

---

## Workstream C: Pure Calculator Extraction (2B)

### Task 7: Extract calculateSystemPrices pure function

**Files:**
- Create: `src/game/utils/calculators.js`
- Create: `tests/unit/calculators.test.js`

**Context:** Both `NavigationManager.dock()` and `NavigationManager.updateLocation()` contain identical price calculation loops iterating over `COMMODITY_TYPES` and calling `TradingSystem.calculatePrice()`. Extract this into a shared pure function.

**Step 1: Write the failing test**

```js
// tests/unit/calculators.test.js
import { describe, it, expect } from 'vitest';
import { calculateSystemPrices } from '../../src/game/utils/calculators.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

describe('calculateSystemPrices', () => {
  const mockSystem = { id: 1, x: 0, y: 0, z: 0 };

  it('returns a price for every commodity type', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const type of COMMODITY_TYPES) {
      expect(prices).toHaveProperty(type);
    }
  });

  it('returns integer prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(Number.isInteger(price)).toBe(true);
    }
  });

  it('returns positive prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('prices vary by day (temporal modifier)', () => {
    const pricesDay1 = calculateSystemPrices(mockSystem, 1, [], {});
    const pricesDay15 = calculateSystemPrices(mockSystem, 15, [], {});
    // At least one commodity should have a different price on different days
    const anyDifferent = COMMODITY_TYPES.some(
      (type) => pricesDay1[type] !== pricesDay15[type]
    );
    expect(anyDifferent).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: FAIL — `calculators.js` doesn't exist

**Step 3: Create calculators.js**

```js
// src/game/utils/calculators.js
import { COMMODITY_TYPES } from '../constants.js';
import { TradingSystem } from '../game-trading.js';

/**
 * Calculate prices for all commodities at a given system.
 * Pure function extracted from NavigationManager.dock() and updateLocation().
 *
 * @param {Object} system - Star system object with id, x, y, z properties
 * @param {number} currentDay - Current game day for temporal price modifiers
 * @param {Array} activeEvents - Active economic events affecting prices
 * @param {Object} marketConditions - Market condition modifiers per system
 * @returns {Object} Map of commodity type to integer price
 */
export function calculateSystemPrices(system, currentDay, activeEvents, marketConditions) {
  const prices = {};
  for (const goodType of COMMODITY_TYPES) {
    prices[goodType] = TradingSystem.calculatePrice(
      goodType,
      system,
      currentDay,
      activeEvents,
      marketConditions,
    );
  }
  return prices;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/utils/calculators.js tests/unit/calculators.test.js
git commit -m "feat: extract calculateSystemPrices pure function"
```

---

### Task 8: Refactor NavigationManager to use calculateSystemPrices

**Files:**
- Modify: `src/game/state/managers/navigation.js`

**Step 1: No new tests — existing tests cover navigation**

The refactor preserves behavior. Existing tests verify dock() and updateLocation() behavior.

**Step 2: Update navigation.js**

1. Add import: `import { calculateSystemPrices } from '../../utils/calculators.js';`
2. In `updateLocation()` (lines 52-62), replace the price calculation loop:

```js
// Before:
const snapshotPrices = {};
for (const goodType of COMMODITY_TYPES) {
  snapshotPrices[goodType] = TradingSystem.calculatePrice(
    goodType, system, currentDay, activeEvents, marketConditions
  );
}

// After:
const snapshotPrices = calculateSystemPrices(system, currentDay, activeEvents, marketConditions);
```

3. In `dock()` (lines 112-120), replace the price calculation loop:

```js
// Before:
const currentPrices = {};
for (const goodType of COMMODITY_TYPES) {
  currentPrices[goodType] = TradingSystem.calculatePrice(
    goodType, currentSystem, currentDay, activeEvents, marketConditions
  );
}

// After:
const currentPrices = calculateSystemPrices(currentSystem, currentDay, activeEvents, marketConditions);
```

4. Remove `COMMODITY_TYPES` and `TradingSystem` imports if they are no longer used elsewhere in the file. Check first.

**Step 3: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/game/state/managers/navigation.js
git commit -m "refactor: NavigationManager uses calculateSystemPrices"
```

---

### Task 9: Extract checkMissionDeadlines pure function

**Files:**
- Modify: `src/game/utils/calculators.js`
- Modify: `tests/unit/calculators.test.js`

**Context:** `MissionManager.checkMissionDeadlines()` (lines 361-435) mixes pure deadline logic with mutations (removing cargo, modifying rep/karma). Extract the pure part: given missions and current day, determine which are expired and which remain.

**Step 1: Write the failing test**

Add to `tests/unit/calculators.test.js`:

```js
import { partitionExpiredMissions } from '../../src/game/utils/calculators.js';

describe('partitionExpiredMissions', () => {
  it('returns empty expired when no missions have deadlines', () => {
    const missions = [{ id: 'm1' }, { id: 'm2' }];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual(missions);
  });

  it('partitions missions by deadline', () => {
    const missions = [
      { id: 'm1', deadlineDay: 50 },
      { id: 'm2', deadlineDay: 150 },
      { id: 'm3' }, // no deadline
    ];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([{ id: 'm1', deadlineDay: 50 }]);
    expect(result.remaining).toHaveLength(2);
    expect(result.remaining.map((m) => m.id)).toEqual(['m2', 'm3']);
  });

  it('does not expire missions on their exact deadline day', () => {
    const missions = [{ id: 'm1', deadlineDay: 100 }];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual(missions);
  });

  it('expires missions past their deadline day', () => {
    const missions = [{ id: 'm1', deadlineDay: 100 }];
    const result = partitionExpiredMissions(missions, 101);
    expect(result.expired).toEqual([{ id: 'm1', deadlineDay: 100 }]);
  });

  it('returns empty arrays for empty input', () => {
    const result = partitionExpiredMissions([], 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: FAIL — `partitionExpiredMissions` not exported

**Step 3: Add to calculators.js**

```js
/**
 * Partition active missions into expired and remaining.
 * Pure function extracted from MissionManager.checkMissionDeadlines().
 *
 * @param {Array} activeMissions - Active mission objects
 * @param {number} currentDay - Current game day
 * @returns {{ expired: Array, remaining: Array }}
 */
export function partitionExpiredMissions(activeMissions, currentDay) {
  const expired = [];
  const remaining = [];

  for (const mission of activeMissions) {
    if (mission.deadlineDay !== undefined && currentDay > mission.deadlineDay) {
      expired.push(mission);
    } else {
      remaining.push(mission);
    }
  }

  return { expired, remaining };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: PASS

**Step 5: Update MissionManager.checkMissionDeadlines() to use it**

In `src/game/state/managers/mission.js`:
1. Add import: `import { partitionExpiredMissions } from '../../utils/calculators.js';`
2. Replace the manual partition loop (lines 368-378) with:

```js
const { expired, remaining } = partitionExpiredMissions(state.missions.active, currentDay);
if (expired.length === 0) return;
state.missions.active = remaining;
```

The rest of the method (penalty application, cargo removal, event emission) stays as-is — those are mutations that belong in the manager.

**Step 6: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/game/utils/calculators.js tests/unit/calculators.test.js src/game/state/managers/mission.js
git commit -m "refactor: extract partitionExpiredMissions pure function"
```

---

### Task 10: Extract calculateTimeEffects pure function

**Files:**
- Modify: `src/game/utils/calculators.js`
- Modify: `tests/unit/calculators.test.js`

**Context:** `EventsManager.updateTime()` has 9 responsibilities, but most delegate to other managers. The pure extraction here focuses on what can be computed without side effects: determining which operations need to happen based on state.

After analyzing `updateTime()`, most steps are already delegated to other managers (`incrementPriceKnowledgeStaleness`, `applyMarketRecovery`, `checkLoanDefaults`, `processDebtTick`, `checkMissionDeadlines`). The one line that does inline computation is the `EconomicEventsSystem.updateEvents()` call.

The realistic extraction: create a `calculateUpdatedEvents()` wrapper that isolates the economic events calculation.

**Step 1: Write the failing test**

```js
import { calculateUpdatedEvents } from '../../src/game/utils/calculators.js';

describe('calculateUpdatedEvents', () => {
  it('returns array of active events', () => {
    // EconomicEventsSystem.updateEvents returns an array
    // We're wrapping it for testability
    const mockState = {
      player: { daysElapsed: 50 },
      world: { activeEvents: [], marketConditions: {} },
    };
    const mockStarData = [{ id: 1, x: 0, y: 0, z: 0 }];
    const result = calculateUpdatedEvents(mockState, mockStarData);
    expect(Array.isArray(result)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: FAIL

**Step 3: Add to calculators.js**

```js
import { EconomicEventsSystem } from '../game-trading.js';

/**
 * Calculate updated economic events based on current state.
 * Pure wrapper around EconomicEventsSystem.updateEvents().
 *
 * @param {Object} state - Game state with player.daysElapsed and world.activeEvents
 * @param {Array} starData - Star system data
 * @returns {Array} Updated active events array
 */
export function calculateUpdatedEvents(state, starData) {
  return EconomicEventsSystem.updateEvents(state, starData);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/calculators.test.js`
Expected: PASS

**Step 5: Update EventsManager.updateTime() to use it**

In `src/game/state/managers/events.js`:
1. Add import: `import { calculateUpdatedEvents } from '../../utils/calculators.js';`
2. Replace the inline call (line 96-99):

```js
// Before:
state.world.activeEvents = EconomicEventsSystem.updateEvents(state, this.starData);

// After:
state.world.activeEvents = calculateUpdatedEvents(state, this.starData);
```

3. Remove the `EconomicEventsSystem` import from events.js if it's no longer used.

**Step 6: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 7: Run lint and format**

Run: `npm run clean`

**Step 8: Commit**

```bash
git add src/game/utils/calculators.js tests/unit/calculators.test.js src/game/state/managers/events.js
git commit -m "refactor: extract calculateUpdatedEvents pure function"
```

---

## Final Verification

### Task 11: Full suite verification and cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run lint + format**

Run: `npm run clean`
Expected: Clean

**Step 3: Verify no remaining string literals for event names**

Search for any remaining raw event name strings that should be constants:
Run: `grep -r "emit('" src/ --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v EVENT_NAMES`

Expected: ZERO hits (all emits use EVENT_NAMES constants)

**Step 4: Verify no remaining gameStateManager in dialogue data files**

Run: `grep -r "gameStateManager" src/game/data/dialogue/ --include="*.js"`

Expected: ZERO hits

**Step 5: Update architecture-followup.md**

Mark items 1A, 2A, 2B as complete with `[x]` checkboxes.

**Step 6: Final commit**

```bash
git add architecture-followup.md
git commit -m "docs: mark 1A, 2A, 2B as complete in architecture-followup.md"
```
