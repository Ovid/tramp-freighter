# New Player Economy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve new player survival by raising mission payouts ~60%, showing restricted goods in the Trade UI, routing unpaid fines into Cole's debt, and adding a trade hint to the Captain's Briefing.

**Architecture:** Four independent changes touching constants, one utility function, one React component, and one JSX template. Each change has its own test(s). No new files created — all edits to existing files.

**Tech Stack:** Vitest, React 18, existing GameStateManager Bridge Pattern

---

### Task 1: Update mission reward base fees

**Files:**
- Modify: `src/game/constants.js:576-577`
- Modify: `tests/unit/cargo-run-constants.test.js:10,14`

**Step 1: Update the test expectations**

In `tests/unit/cargo-run-constants.test.js`, change the two base fee assertions:

```js
// line 10: change 75 to 120
expect(MISSION_CONFIG.CARGO_RUN_BASE_FEE).toBe(120);

// line 14: change 150 to 225
expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE).toBe(225);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-constants.test.js`
Expected: FAIL — expected 120 but got 75, expected 225 but got 150

**Step 3: Update the constants**

In `src/game/constants.js:576-577`:

```js
CARGO_RUN_BASE_FEE: 120,
CARGO_RUN_ILLEGAL_BASE_FEE: 225,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-constants.test.js`
Expected: PASS

**Step 5: Check for cascading test failures**

Run: `npm test -- tests/unit/mission-generator.test.js`

If any mission generator tests have hardcoded expected reward values based on the old base fees (75/150), update those assertions to reflect the new fees (120/225). The reward formula is `baseFee * hopMultiplier * dangerMultiplier * saturationMultiplier` — multiply old expected values by 120/75 (= 1.6) for legal or 225/150 (= 1.5) for illegal missions, then `Math.ceil`.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 7: Commit**

```
git add src/game/constants.js tests/unit/cargo-run-constants.test.js tests/unit/mission-generator.test.js
git commit -m "feat: increase mission base fees ~60% for new player economy balance"
```

---

### Task 2: Unpaid fines roll into Cole's debt

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js:57-63`
- Modify: `tests/unit/apply-encounter-outcome.test.js`

**Step 1: Write the failing test for debt absorption**

In `tests/unit/apply-encounter-outcome.test.js`, inside the `credit costs and rewards` describe block, add a new test after the existing "subtracts credit costs clamped to zero" test:

```js
it('rolls unpaid fine remainder into debt when credits insufficient', () => {
  const state = gsm.getState();
  state.player.credits = 10;
  state.player.debt = 5000;

  applyEncounterOutcome(gsm, {
    costs: { credits: 1000 },
  });

  expect(gsm.getState().player.credits).toBe(0);
  expect(gsm.getState().player.debt).toBe(5990);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: FAIL — debt is still 5000 (unpaid portion not added)

**Step 3: Update the existing "clamped to zero" test**

The existing test at line 183 asserts `Math.max(0, before - 200)`. If the test setup gives the player enough credits to cover 200, this test should still pass unchanged. But verify — if the player starts with fewer than 200 credits in the test fixture, the assertion needs to account for debt absorption. Read the test fixture's starting credits to confirm.

If starting credits >= 200: no change needed (fine is fully paid, no debt absorption).
If starting credits < 200: update the assertion to also check that debt increased by the unpaid remainder.

**Step 4: Implement the change**

In `src/features/danger/applyEncounterOutcome.js`, replace lines 57-63:

Old:
```js
if (outcome.costs.credits) {
  const newCredits = Math.max(
    0,
    state.player.credits - outcome.costs.credits
  );
  gameStateManager.updateCredits(newCredits);
}
```

New:
```js
if (outcome.costs.credits) {
  const fine = outcome.costs.credits;
  const currentCredits = state.player.credits;
  const paid = Math.min(currentCredits, fine);
  const unpaid = fine - paid;
  gameStateManager.updateCredits(currentCredits - paid);
  if (unpaid > 0) {
    gameStateManager.updateDebt(state.player.debt + unpaid);
  }
}
```

`updateDebt` already exists on `StateManager` (see `src/game/state/managers/state.js:109`) and is delegated through `GameStateManager`. It updates `state.player.debt` and emits `DEBT_CHANGED`.

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: PASS

**Step 6: Write a test for the no-debt case (fine fully covered)**

Add another test to confirm existing behavior is preserved:

```js
it('does not increase debt when credits fully cover the fine', () => {
  const state = gsm.getState();
  state.player.credits = 2000;
  state.player.debt = 5000;

  applyEncounterOutcome(gsm, {
    costs: { credits: 500 },
  });

  expect(gsm.getState().player.credits).toBe(1500);
  expect(gsm.getState().player.debt).toBe(5000);
});
```

**Step 7: Run tests**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: PASS

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 9: Commit**

```
git add src/features/danger/applyEncounterOutcome.js tests/unit/apply-encounter-outcome.test.js
git commit -m "feat: unpaid fines roll into Cole's debt instead of evaporating"
```

---

### Task 3: Show restricted goods badge in Trade panel

**Files:**
- Modify: `src/features/trade/TradePanel.jsx:176-233` (market goods render loop)
- Modify: `src/game/constants.js` (add tooltip text constant)
- Create test: `tests/unit/trade-restricted-badge.test.jsx`

**Step 1: Add restricted tooltip constant**

In `src/game/constants.js`, inside `RESTRICTED_GOODS_CONFIG` (after `CORE_SYSTEM_RESTRICTED` at line 1618), add:

```js
RESTRICTED_TOOLTIP: 'Regulated in this zone. Risk of fines and confiscation during customs inspections.',
```

**Step 2: Write the failing test**

Create `tests/unit/trade-restricted-badge.test.jsx`. This tests the logic layer, not the full component render (which would need too much mocking). Test the restriction lookup:

```jsx
import { describe, it, expect } from 'vitest';
import { RESTRICTED_GOODS_CONFIG } from '../../src/game/constants.js';

describe('Restricted goods badge logic', () => {
  it('medicine is restricted in contested zones', () => {
    expect(
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.contested
    ).toContain('medicine');
  });

  it('electronics is restricted in safe zones', () => {
    expect(
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.safe
    ).toContain('electronics');
  });

  it('tritium is restricted in dangerous zones', () => {
    expect(
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.dangerous
    ).toContain('tritium');
  });

  it('has a restricted tooltip text', () => {
    expect(RESTRICTED_GOODS_CONFIG.RESTRICTED_TOOLTIP).toBeTruthy();
  });

  describe('zone-based restriction check', () => {
    const isRestrictedInZone = (goodType, zone) => {
      const zoneRestrictions = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
      return zoneRestrictions.includes(goodType);
    };

    it('medicine is not restricted in safe zones', () => {
      expect(isRestrictedInZone('medicine', 'safe')).toBe(false);
    });

    it('medicine is restricted in contested zones', () => {
      expect(isRestrictedInZone('medicine', 'contested')).toBe(true);
    });

    it('grain is not restricted anywhere', () => {
      expect(isRestrictedInZone('grain', 'safe')).toBe(false);
      expect(isRestrictedInZone('grain', 'contested')).toBe(false);
      expect(isRestrictedInZone('grain', 'dangerous')).toBe(false);
    });
  });
});
```

**Step 3: Run test to verify it passes (constants already exist)**

Run: `npm test -- tests/unit/trade-restricted-badge.test.jsx`
Expected: PASS for restriction lookups, FAIL for tooltip (not yet added)

**Step 4: Add the tooltip constant**

Add the `RESTRICTED_TOOLTIP` line as described in Step 1.

**Step 5: Run test**

Run: `npm test -- tests/unit/trade-restricted-badge.test.jsx`
Expected: All PASS

**Step 6: Update TradePanel.jsx to show badge**

In `src/features/trade/TradePanel.jsx`:

Add import at top:
```js
import { RESTRICTED_GOODS_CONFIG } from '../../game/constants.js';
```

Add the `useDangerZone` hook import:
```js
import { useDangerZone } from '../../hooks/useDangerZone';
```

Inside the component, after `const system = starData.find(...)` (line 64), add:
```js
const dangerZone = useDangerZone(currentSystemId);
```

In the `COMMODITY_TYPES.map` block (line 176-233), after `const validation = validateBuy(...)` (line 180), add:
```js
const isRestricted = (
  RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[dangerZone] || []
).includes(goodType);
```

After the `good-price` div (line 186), add the badge:
```jsx
{isRestricted && (
  <span
    className="restricted-badge"
    title={RESTRICTED_GOODS_CONFIG.RESTRICTED_TOOLTIP}
  >
    RESTRICTED
  </span>
)}
```

**Step 7: Add CSS for the badge**

Find the trade panel CSS file (likely `src/features/trade/TradePanel.css` or in a shared styles file). Add:

```css
.restricted-badge {
  color: #ffcc00;
  font-size: 0.75em;
  font-weight: bold;
  padding: 1px 6px;
  border: 1px solid #ffcc00;
  border-radius: 3px;
  margin-left: 8px;
  cursor: help;
}
```

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 9: Manual verification**

Run: `npm run dev`
- Navigate to a contested zone station (e.g., L 726-8 A)
- Open Trade panel
- Verify "RESTRICTED" badge appears next to Medicine
- Verify tooltip shows on hover
- Verify badge does NOT appear for non-restricted goods
- Navigate to Sol (safe zone), verify Medicine has no badge but Electronics does

**Step 10: Commit**

```
git add src/game/constants.js src/features/trade/TradePanel.jsx tests/unit/trade-restricted-badge.test.jsx
git commit -m "feat: show RESTRICTED badge on trade goods regulated in current zone"
```

Include any CSS file that was modified in the git add.

---

### Task 4: Add trade hint to Captain's Briefing

**Files:**
- Modify: `src/features/instructions/InstructionsModal.jsx:20-23`

**Step 1: Update the briefing text**

In `src/features/instructions/InstructionsModal.jsx`, find the grain mention (line 20-23):

Old:
```jsx
Your hold has 20 units of grain — enough to start trading. Check the{' '}
<strong>Cargo Manifest</strong> to see what you're carrying.
```

New:
```jsx
Your hold has 20 units of grain — enough to start trading, but raw
commodities like grain and ore have thin margins. The real money is
in manufactured goods: <strong>electronics</strong>,{' '}
<strong>parts</strong>, <strong>medicine</strong>. Check the{' '}
<strong>Cargo Manifest</strong> to see what you're carrying.
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS (no tests directly assert briefing text content)

**Step 3: Manual verification**

Run: `npm run dev`
- Start a new game
- Read the Captain's Briefing / Instructions modal
- Verify the updated text mentions manufactured goods

**Step 4: Commit**

```
git add src/features/instructions/InstructionsModal.jsx
git commit -m "feat: add trade margin hint to Captain's Briefing for new players"
```

---

### Task 5: Final verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Manual smoke test**

Run: `npm run dev`
- Start new game
- Verify briefing mentions manufactured goods
- Accept a cargo mission, verify payout is ~60% higher than before
- Buy medicine at Sol, verify no RESTRICTED badge (safe zone)
- Check Trade panel at a contested system, verify RESTRICTED badge on medicine
- Trigger a customs inspection with low credits, verify debt increases

**Step 4: Final commit (if any lint fixes needed)**

```
git add -A
git commit -m "chore: lint fixes for new player economy changes"
```
