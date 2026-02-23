# Tanaka Research Supply Runs - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a repeatable "Contribute to Research" mechanic so players can earn +1 Tanaka rep by donating 5 electronics or medicine at Barnard's Star, with a 7-day cooldown.

**Architecture:** New constants define supply run parameters. QuestManager gets a `contributeSupply` method that checks eligibility (cargo, cooldown, tanaka_met) and processes the donation (deduct cargo, add rep, set cooldown). A new dialogue node in tanaka-dialogue.js wires the UI through the existing dialogue action pattern. Cooldown timestamp stored in quest data, persists via save.

**Tech Stack:** Vitest (TDD), existing GameStateManager/QuestManager/ShipManager, dialogue engine

---

### Task 1: Add constants

**Files:**
- Modify: `src/game/constants.js` (after ENDGAME_CONFIG block, ~line 603)

**Step 1: Write the failing test**

Create `tests/unit/tanaka-supply-runs.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { TANAKA_SUPPLY_CONFIG } from '../../src/game/constants.js';

describe('Tanaka Supply Run constants', () => {
  it('exports TANAKA_SUPPLY_CONFIG with required fields', () => {
    expect(TANAKA_SUPPLY_CONFIG).toBeDefined();
    expect(TANAKA_SUPPLY_CONFIG.QUANTITY).toBe(5);
    expect(TANAKA_SUPPLY_CONFIG.REP_GAIN).toBe(1);
    expect(TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS).toBe(7);
    expect(TANAKA_SUPPLY_CONFIG.GOODS).toEqual(['electronics', 'medicine']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: FAIL — `TANAKA_SUPPLY_CONFIG` is not exported

**Step 3: Write minimal implementation**

Add to `src/game/constants.js` after the `ENDGAME_CONFIG` export (~line 603):

```javascript
/**
 * Tanaka Research Supply Run Configuration
 */
export const TANAKA_SUPPLY_CONFIG = {
  QUANTITY: 5,
  REP_GAIN: 1,
  COOLDOWN_DAYS: 7,
  GOODS: ['electronics', 'medicine'],
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/tanaka-supply-runs.test.js
git commit -m "feat: add Tanaka supply run constants"
```

---

### Task 2: Add eligibility check to QuestManager

**Files:**
- Modify: `tests/unit/tanaka-supply-runs.test.js`
- Modify: `src/game/state/managers/quest-manager.js`

**Step 1: Write the failing tests**

Append to `tests/unit/tanaka-supply-runs.test.js`:

```javascript
import { createTestGameStateManager } from '../test-utils.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

describe('QuestManager.canContributeSupply', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    // Set tanaka_met flag
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags.push('tanaka_met');
    // Dock at Barnard's Star
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
  });

  it('returns true when player has 5+ electronics, is at Barnard\'s Star, tanaka_met, and no cooldown', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns true when player has 5+ medicine', () => {
    manager.state.ship.cargo = [
      { good: 'medicine', qty: 7, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns false when player has fewer than 5 of any qualifying good', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 3, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 4, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when tanaka_met flag is not set', () => {
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags = [];
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when not at Barnard\'s Star', () => {
    manager.state.player.currentSystem = 0; // Sol
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when cooldown has not expired', () => {
    manager.state.player.daysElapsed = 10;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 5 days ago, cooldown is 7
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns true when cooldown has expired', () => {
    manager.state.player.daysElapsed = 15;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 10 days ago, cooldown is 7
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('prefers electronics when both goods are available', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 5, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    const result = manager.canContributeSupply();
    expect(result).toBe(true);
  });
});
```

Update the imports at the top of the file to include `beforeEach`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: FAIL — `manager.canContributeSupply is not a function`

**Step 3: Write minimal implementation**

Add to `src/game/state/managers/quest-manager.js`, import at top:

```javascript
import { ENDGAME_CONFIG, SHIP_CONFIG, EVENT_NAMES, TANAKA_SUPPLY_CONFIG } from '../../constants.js';
```

Add method to QuestManager class (before the `onJump` method):

```javascript
  canContributeSupply() {
    const state = this.getState();

    // Must be at Barnard's Star
    if (state.player.currentSystem !== ENDGAME_CONFIG.TANAKA_SYSTEM) return false;

    // Must have met Tanaka
    const npcState = this.gameStateManager.getNPCState('tanaka_barnards');
    if (!npcState || !npcState.flags.includes('tanaka_met')) return false;

    // Check cooldown
    const questState = this.getQuestState('tanaka');
    if (questState?.data?.lastSupplyDay != null) {
      const daysSince = state.player.daysElapsed - questState.data.lastSupplyDay;
      if (daysSince < TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS) return false;
    }

    // Check cargo - need QUANTITY of any qualifying good
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = state.ship.cargo
        .filter((c) => c.good === goodType)
        .reduce((sum, c) => sum + c.qty, 0);
      if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) return true;
    }

    return false;
  }
```

Add delegation method to `src/game/state/game-state-manager.js` (find the quest delegation section):

```javascript
  canContributeSupply() {
    return this.questManager.canContributeSupply();
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/unit/tanaka-supply-runs.test.js src/game/state/managers/quest-manager.js src/game/state/game-state-manager.js
git commit -m "feat: add canContributeSupply eligibility check"
```

---

### Task 3: Add contributeSupply action to QuestManager

**Files:**
- Modify: `tests/unit/tanaka-supply-runs.test.js`
- Modify: `src/game/state/managers/quest-manager.js`
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Write the failing tests**

Append to `tests/unit/tanaka-supply-runs.test.js`:

```javascript
describe('QuestManager.contributeSupply', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags.push('tanaka_met');
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
  });

  it('deducts 5 electronics and adds 1 rep on success', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 8, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    const repBefore = manager.getNPCState('tanaka_barnards').rep;
    const result = manager.contributeSupply();
    expect(result.success).toBe(true);
    expect(result.goodDonated).toBe('electronics');

    // Cargo reduced
    const remaining = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(remaining).toBe(3);

    // Rep increased
    expect(manager.getNPCState('tanaka_barnards').rep).toBe(repBefore + 1);
  });

  it('sets lastSupplyDay cooldown on success', () => {
    manager.state.player.daysElapsed = 42;
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    manager.contributeSupply();
    expect(manager.state.quests.tanaka.data.lastSupplyDay).toBe(42);
  });

  it('prefers electronics over medicine when both available', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 5, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    const result = manager.contributeSupply();
    expect(result.goodDonated).toBe('electronics');

    // Electronics deducted, medicine untouched
    const electronicsLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    const medicineLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'medicine')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(electronicsLeft).toBe(0);
    expect(medicineLeft).toBe(5);
  });

  it('falls back to medicine when electronics insufficient', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 2, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 6, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    const result = manager.contributeSupply();
    expect(result.goodDonated).toBe('medicine');
  });

  it('fails when not eligible', () => {
    manager.state.ship.cargo = []; // No cargo
    const result = manager.contributeSupply();
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: FAIL — `manager.contributeSupply is not a function`

**Step 3: Write minimal implementation**

Add to QuestManager class in `src/game/state/managers/quest-manager.js`:

```javascript
  contributeSupply() {
    if (!this.canContributeSupply()) {
      return { success: false, reason: 'Not eligible' };
    }

    const state = this.getState();

    // Find first qualifying good with enough quantity (GOODS array order = preference)
    let goodToDonate = null;
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = state.ship.cargo
        .filter((c) => c.good === goodType)
        .reduce((sum, c) => sum + c.qty, 0);
      if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) {
        goodToDonate = goodType;
        break;
      }
    }

    if (!goodToDonate) {
      return { success: false, reason: 'No qualifying cargo' };
    }

    // Deduct cargo
    this.gameStateManager.removeCargoForMission(goodToDonate, TANAKA_SUPPLY_CONFIG.QUANTITY);

    // Add rep
    this.gameStateManager.modifyRep('tanaka_barnards', TANAKA_SUPPLY_CONFIG.REP_GAIN, 'supply_contribution');

    // Set cooldown
    const questState = this.getQuestState('tanaka');
    questState.data.lastSupplyDay = state.player.daysElapsed;

    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...state.quests });
    this.gameStateManager.markDirty();

    return { success: true, goodDonated: goodToDonate };
  }
```

Add delegation method to `src/game/state/game-state-manager.js`:

```javascript
  contributeSupply() {
    return this.questManager.contributeSupply();
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/unit/tanaka-supply-runs.test.js src/game/state/managers/quest-manager.js src/game/state/game-state-manager.js
git commit -m "feat: add contributeSupply action with cargo deduction and rep gain"
```

---

### Task 4: Add dialogue context wiring

**Files:**
- Modify: `src/game/game-dialogue.js` (~line 46-86, `buildDialogueContext`)
- Modify: `tests/unit/tanaka-supply-runs.test.js`

**Step 1: Write the failing test**

Append to `tests/unit/tanaka-supply-runs.test.js`:

```javascript
import { buildDialogueContext } from '../../src/game/game-dialogue.js';

describe('Dialogue context for supply runs', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
  });

  it('exposes canContributeSupply on dialogue context', () => {
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    expect(typeof context.canContributeSupply).toBe('function');
  });

  it('exposes contributeSupply on dialogue context', () => {
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    expect(typeof context.contributeSupply).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: FAIL — `context.canContributeSupply` is undefined

**Step 3: Write minimal implementation**

In `src/game/game-dialogue.js`, add to the `buildDialogueContext` return object (inside the action callbacks section, ~line 75-85):

```javascript
    contributeSupply: () => gameStateManager.contributeSupply(),
    canContributeSupply: () => gameStateManager.canContributeSupply(),
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/game-dialogue.js tests/unit/tanaka-supply-runs.test.js
git commit -m "feat: expose supply run functions on dialogue context"
```

---

### Task 5: Add research_supply dialogue node

**Files:**
- Modify: `src/game/data/dialogue/tanaka-dialogue.js`
- Modify: `tests/unit/tanaka-supply-runs.test.js`

**Step 1: Write the failing test**

Append to `tests/unit/tanaka-supply-runs.test.js`:

```javascript
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

describe('research_supply dialogue node', () => {
  it('exists in Tanaka dialogue tree', () => {
    expect(YUKI_TANAKA_DIALOGUE.research_supply).toBeDefined();
  });

  it('has text function that returns a string', () => {
    expect(typeof YUKI_TANAKA_DIALOGUE.research_supply.text).toBe('function');
    const text = YUKI_TANAKA_DIALOGUE.research_supply.text(0, {});
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('has a single choice that returns to greeting', () => {
    const choices = YUKI_TANAKA_DIALOGUE.research_supply.choices;
    expect(choices.length).toBe(1);
    expect(choices[0].next).toBe('greeting');
  });

  it('choice action calls contributeSupply', () => {
    let called = false;
    const mockContext = {
      contributeSupply: () => { called = true; return { success: true, goodDonated: 'electronics' }; },
    };
    YUKI_TANAKA_DIALOGUE.research_supply.choices[0].action(mockContext);
    expect(called).toBe(true);
  });
});

describe('greeting choices include supply run option', () => {
  it('has a supply run choice with canContributeSupply condition', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    expect(supplyChoice).toBeDefined();
    expect(typeof supplyChoice.condition).toBe('function');
  });

  it('supply run choice is visible when canContributeSupply returns true', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    const context = { canContributeSupply: () => true };
    expect(supplyChoice.condition(0, context)).toBe(true);
  });

  it('supply run choice is hidden when canContributeSupply returns false', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    const context = { canContributeSupply: () => false };
    expect(supplyChoice.condition(0, context)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: FAIL — `YUKI_TANAKA_DIALOGUE.research_supply` is undefined

**Step 3: Write minimal implementation**

Add the `research_supply` node to `src/game/data/dialogue/tanaka-dialogue.js` (before the closing `};` of the YUKI_TANAKA_DIALOGUE export):

```javascript
  research_supply: {
    text: (_rep, _context) => {
      const lines = [
        '"Electronics. Good quality. These will work for the coupling array."',
        '"Medical-grade sealant compounds. Useful for the containment housing. Thank you."',
        '"I can use these. The drive prototype consumes components faster than I projected."',
        '"You didn\'t have to do this. But I won\'t pretend it doesn\'t help."',
        '"Every delivery gets me closer. I won\'t forget that."',
        '"This saves me weeks of requisition paperwork. Appreciated."',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    },
    choices: [
      {
        text: '"Glad to help."',
        next: 'greeting',
        action: (context) => {
          return context.contributeSupply();
        },
      },
    ],
  },
```

Add the supply run choice to the `greeting.choices` array. Insert it just before the `about_work` choice (~line 142, before `{ text: 'Tell me about your work.'`):

```javascript
      {
        text: '"I brought supplies for your research."',
        next: 'research_supply',
        condition: (_rep, context) =>
          context && typeof context.canContributeSupply === 'function' && context.canContributeSupply(),
      },
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS

**Step 5: Run the full test suite**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 6: Commit**

```bash
git add src/game/data/dialogue/tanaka-dialogue.js tests/unit/tanaka-supply-runs.test.js
git commit -m "feat: add research_supply dialogue node and greeting choice for Tanaka"
```

---

### Task 6: Integration test — full supply run flow

**Files:**
- Modify: `tests/unit/tanaka-supply-runs.test.js`

**Step 1: Write the integration test**

Append to `tests/unit/tanaka-supply-runs.test.js`:

```javascript
describe('Full supply run flow (integration)', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags.push('tanaka_met');
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
    manager.state.player.daysElapsed = 20;
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 10, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
  });

  it('completes a supply run: eligible → donate → cooldown → ineligible → wait → eligible again', () => {
    // 1. Eligible
    expect(manager.canContributeSupply()).toBe(true);

    // 2. Donate
    const result = manager.contributeSupply();
    expect(result.success).toBe(true);
    expect(result.goodDonated).toBe('electronics');

    // 3. Cargo reduced by 5
    const cargoLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(cargoLeft).toBe(5);

    // 4. On cooldown — not eligible
    expect(manager.canContributeSupply()).toBe(false);

    // 5. Advance time past cooldown
    manager.state.player.daysElapsed = 28; // 8 days later, cooldown is 7
    expect(manager.canContributeSupply()).toBe(true);

    // 6. Second donation works
    const result2 = manager.contributeSupply();
    expect(result2.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-supply-runs.test.js`
Expected: PASS (this is a green-on-first-run integration test confirming the pieces work together)

**Step 3: Run the full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/unit/tanaka-supply-runs.test.js
git commit -m "test: add integration test for full supply run flow"
```
