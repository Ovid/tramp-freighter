# Salvage Goods State Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix salvaged goods displaying undefined qty/price/NaN capacity by enforcing canonical cargo field names at the source and adding validation at the state boundary.

**Architecture:** Fix three field name mismatches in `danger.js:resolveDistressLoot()`, one in `narrative-events.js`, remove the `type`→`good` translation from the encounter outcome mapper, and add dev-mode cargo validation in `StateManager.updateCargo()`.

**Tech Stack:** Vitest, ES Modules, devWarn from `src/game/utils/dev-logger.js`

---

### Task 1: Fix resolveDistressLoot field names

**Files:**
- Modify: `src/game/state/managers/danger.js:1562-1567`
- Test: `tests/property/distress-call-outcomes.property.test.js:121-123`

**Step 1: Write the failing test**

Add a cargo schema assertion to the existing property test. In `tests/property/distress-call-outcomes.property.test.js`, after line 122 (`expect(outcome.rewards).toHaveProperty('cargo');`), add:

```js
              outcome.rewards.cargo.forEach((item) => {
                expect(item).toHaveProperty('good');
                expect(item).toHaveProperty('qty');
                expect(item).toHaveProperty('buyPrice');
                expect(item).toHaveProperty('buySystemName', 'Salvaged');
                expect(item).not.toHaveProperty('type');
                expect(item).not.toHaveProperty('quantity');
                expect(item).not.toHaveProperty('purchasePrice');
              });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/property/distress-call-outcomes.property.test.js`
Expected: FAIL — cargo items have `type`/`quantity`/`purchasePrice` instead of `good`/`qty`/`buyPrice`

**Step 3: Write minimal implementation**

In `src/game/state/managers/danger.js`, replace lines 1562-1568:

```js
        cargo: [
          {
            good: 'parts',
            qty: 2,
            buyPrice: 0,
            buySystemName: 'Salvaged',
          },
        ],
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/property/distress-call-outcomes.property.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/danger.js tests/property/distress-call-outcomes.property.test.js
git commit -m "fix: use canonical cargo field names in resolveDistressLoot"
```

---

### Task 2: Fix narrative-events cargo field name

**Files:**
- Modify: `src/game/data/narrative-events.js:201`
- Test: `tests/unit/narrative-event-data.test.js`

**Step 1: Write the failing test**

In `tests/unit/narrative-event-data.test.js`, after the existing `forEach` block (after line 51), add a new test:

```js
  describe('cargo reward schema', () => {
    const eventsWithCargo = NARRATIVE_EVENTS.flatMap((event) =>
      event.content.choices
        .filter((c) => c.effects?.rewards?.cargo)
        .map((c) => ({
          eventId: event.id,
          choiceText: c.text,
          cargo: c.effects.rewards.cargo,
        }))
    );

    eventsWithCargo.forEach(({ eventId, choiceText, cargo }) => {
      it(`${eventId} choice "${choiceText}" uses canonical cargo fields`, () => {
        cargo.forEach((item) => {
          expect(item).toHaveProperty('good');
          expect(item).toHaveProperty('qty');
          expect(item).toHaveProperty('buyPrice');
          expect(item).not.toHaveProperty('type');
          expect(item).not.toHaveProperty('quantity');
          expect(item).not.toHaveProperty('purchasePrice');
        });
      });
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: FAIL — `jump_salvage_result` cargo uses `type` instead of `good`

**Step 3: Write minimal implementation**

In `src/game/data/narrative-events.js`, replace line 201:

```js
            rewards: { cargo: [{ good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvaged' }] },
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/data/narrative-events.js tests/unit/narrative-event-data.test.js
git commit -m "fix: use canonical cargo field names in narrative event salvage reward"
```

---

### Task 3: Remove type→good translation from encounter outcome mapper

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js:146-167`
- Test: `tests/unit/apply-encounter-outcome.test.js:81-110`

**Step 1: Update existing tests to use canonical field names**

In `tests/unit/apply-encounter-outcome.test.js`, the cargo reward tests on lines 87 and 101 use `type` in the reward objects. Update them to use `good`:

Line 87: change `{ type: 'food', qty: 3, buyPrice: 50 }` to `{ good: 'food', qty: 3, buyPrice: 50 }`
Line 101: change `{ type: 'minerals', qty: 2, buyPrice: 80 }` to `{ good: 'minerals', qty: 2, buyPrice: 80 }`

Also add a new test for `buySystemName` pass-through after line 110:

```js
    it('passes through buySystemName for salvaged cargo', () => {
      applyEncounterOutcome(gsm, {
        rewards: {
          cargo: [{ good: 'parts', qty: 2, buyPrice: 0, buySystemName: 'Salvaged' }],
        },
      });

      const cargo = gsm.getState().ship.cargo;
      expect(cargo).toHaveLength(1);
      expect(cargo[0].buySystemName).toBe('Salvaged');
    });
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: FAIL — the mapper still reads `rewardItem.type`, so `good` field on rewards won't match existing stacks, and the new stack will have `good: undefined`

**Step 3: Write minimal implementation**

In `src/features/danger/applyEncounterOutcome.js`, replace lines 146-167:

```js
    if (outcome.rewards.cargo) {
      const currentCargo = [...state.ship.cargo];
      outcome.rewards.cargo.forEach((rewardItem) => {
        const existingStack = currentCargo.find(
          (item) =>
            item.good === rewardItem.good &&
            item.buyPrice === rewardItem.buyPrice
        );

        if (existingStack) {
          existingStack.qty += rewardItem.qty;
        } else {
          currentCargo.push({
            good: rewardItem.good,
            qty: rewardItem.qty,
            buyPrice: rewardItem.buyPrice,
            buySystemName: rewardItem.buySystemName,
          });
        }
      });

      gameStateManager.updateCargo(currentCargo);
    }
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/danger/applyEncounterOutcome.js tests/unit/apply-encounter-outcome.test.js
git commit -m "fix: remove type->good translation, use canonical cargo fields in mapper"
```

---

### Task 4: Add dev-mode cargo validation in updateCargo

**Files:**
- Modify: `src/game/state/managers/state.js:1-2,138-142`
- Test: `tests/unit/apply-encounter-outcome.test.js` (add new describe block)

**Step 1: Write the failing test**

Add a new describe block at the end of `tests/unit/apply-encounter-outcome.test.js`:

```js
describe('updateCargo validation', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('warns on cargo items missing required fields', () => {
    gsm.updateCargo([{ type: 'food', quantity: 5, purchasePrice: 50 }]);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Cargo item 0 missing required fields'),
      expect.stringContaining('good'),
      expect.objectContaining({ type: 'food' })
    );
  });

  it('does not warn on well-formed cargo items', () => {
    gsm.updateCargo([{ good: 'food', qty: 5, buyPrice: 50 }]);

    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Cargo item'),
      expect.any(String),
      expect.any(Object)
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: FAIL — `updateCargo` has no validation yet

**Step 3: Write minimal implementation**

In `src/game/state/managers/state.js`, add the import at line 2:

```js
import { devWarn } from '../../utils/dev-logger.js';
```

Replace lines 138-142:

```js
  updateCargo(newCargo) {
    this.validateState();
    const requiredFields = ['good', 'qty', 'buyPrice'];
    newCargo.forEach((item, i) => {
      const missing = requiredFields.filter((f) => item[f] === undefined);
      if (missing.length > 0) {
        devWarn(
          `Cargo item ${i} missing required fields:`,
          missing.join(', '),
          item
        );
      }
    });
    this.gameStateManager.state.ship.cargo = newCargo;
    this.emit('cargoChanged', newCargo);
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/state.js tests/unit/apply-encounter-outcome.test.js
git commit -m "feat: add dev-mode cargo validation in updateCargo"
```

---

### Task 5: Run full test suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass, no stderr warnings

**Step 2: Commit if any formatting needed**

Run: `npm run clean`
Then commit any formatting changes.
