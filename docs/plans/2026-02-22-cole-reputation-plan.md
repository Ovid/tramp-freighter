# Cole Reputation from Debt Interactions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Cole's NPC reputation respond to debt interactions — payments, withholding, borrowing, checkpoints, and favor missions — so players can progress from COLD (-20) through NEUTRAL and toward FRIENDLY through financial reliability.

**Architecture:** All Cole rep changes bypass the NPC trust modifier (0.1) by using `setNpcRep(id, currentRep + delta)` directly, wrapped in a `modifyColeRep(delta)` helper on DebtManager. This is delegated from GameStateManager so MissionManager can also call it for favor mission outcomes. No new state fields needed — uses existing NPC rep and Cole debt infrastructure.

**Tech Stack:** Vitest, GameStateManager, DebtManager, MissionManager, constants.js, cole-missions.js

---

### Task 1: Add Cole Reputation Constants

**Files:**
- Modify: `src/game/constants.js:427-475` (COLE_DEBT_CONFIG block)

**Step 1: Write the failing test**

Add to `tests/unit/debt-manager.test.js`, inside the top-level `describe('Cole Debt System')`:

```js
describe('Cole Reputation Constants', () => {
  it('exports all Cole reputation constants', () => {
    expect(COLE_DEBT_CONFIG.COLE_NPC_ID).toBe('cole_sol');
    expect(COLE_DEBT_CONFIG.REP_PER_CREDIT_DIVISOR).toBe(500);
    expect(COLE_DEBT_CONFIG.REP_BORROW_BONUS).toBe(1);
    expect(COLE_DEBT_CONFIG.REP_MISSED_CHECKPOINT).toBe(-3);
    expect(COLE_DEBT_CONFIG.REP_WITHHOLDING_THRESHOLD).toBe(500);
    expect(COLE_DEBT_CONFIG.REP_FAVOR_FAIL).toBe(-5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `COLE_NPC_ID` is undefined

**Step 3: Write minimal implementation**

Add to `COLE_DEBT_CONFIG` in `src/game/constants.js`, after the `PAYMENT_TIERS` line (468) and before the `// Starting values` comment:

```js
  // Cole NPC reputation from debt interactions
  COLE_NPC_ID: 'cole_sol',
  REP_PER_CREDIT_DIVISOR: 500,
  REP_BORROW_BONUS: 1,
  REP_MISSED_CHECKPOINT: -3,
  REP_WITHHOLDING_THRESHOLD: 500,
  REP_FAVOR_FAIL: -5,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/debt-manager.test.js
git commit -m "feat: add Cole reputation constants to COLE_DEBT_CONFIG"
```

---

### Task 2: Add modifyColeRep() Helper + GSM Delegation

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Modify: `src/game/state/game-state-manager.js`
- Test: `tests/unit/debt-manager.test.js`

**Context:** `setNpcRep(npcId, value)` sets absolute rep and clamps to [-100, 100]. We need a helper that reads current rep, adds a delta, and calls `setNpcRep`. This bypasses Cole's trust modifier (0.1) — financial reliability, not charm.

**Step 1: Write the failing test**

Add a new `describe` block inside the `describe('DebtManager')` block:

```js
describe('modifyColeRep', () => {
  it('changes Cole rep by delta, bypassing trust modifier', () => {
    // Cole starts at -20 (COLD)
    const coleBefore = gsm.getNPCState('cole_sol');
    expect(coleBefore.rep).toBe(-20);

    debtManager.modifyColeRep(5);

    const coleAfter = gsm.getNPCState('cole_sol');
    expect(coleAfter.rep).toBe(-15);
  });

  it('clamps rep to [-100, 100] range', () => {
    gsm.setNpcRep('cole_sol', 98);

    debtManager.modifyColeRep(10);

    const coleAfter = gsm.getNPCState('cole_sol');
    expect(coleAfter.rep).toBe(100);
  });

  it('handles negative deltas', () => {
    gsm.setNpcRep('cole_sol', 0);

    debtManager.modifyColeRep(-5);

    const coleAfter = gsm.getNPCState('cole_sol');
    expect(coleAfter.rep).toBe(-5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `debtManager.modifyColeRep is not a function`

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, add this method to `DebtManager` (before `emitFinanceChanged()`):

```js
  modifyColeRep(delta) {
    const npcState = this.gameStateManager.getNPCState(COLE_DEBT_CONFIG.COLE_NPC_ID);
    this.gameStateManager.setNpcRep(
      COLE_DEBT_CONFIG.COLE_NPC_ID,
      npcState.rep + delta
    );
  }
```

Then in `src/game/state/game-state-manager.js`, add a delegation method alongside the other debt methods (after `getHeatTier()` around line 488):

```js
  modifyColeRep(delta) {
    this.debtManager.modifyColeRep(delta);
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js src/game/state/game-state-manager.js tests/unit/debt-manager.test.js
git commit -m "feat: add modifyColeRep helper bypassing trust modifier"
```

---

### Task 3: Voluntary Payment Rep

**Files:**
- Modify: `src/game/state/managers/debt.js` (makePayment method, ~line 168)
- Test: `tests/unit/debt-manager.test.js`

**Context:** `makePayment(amount)` caps at actual debt, deducts credits, reduces heat. We add: `+floor(amount / 500)`, minimum +1 rep per payment action (not per credit).

**Step 1: Write the failing test**

Add inside the existing `describe('makePayment')` block:

```js
it('improves Cole rep by floor(amount/500), min +1 per payment', () => {
  gsm.state.player.credits = 15000;
  gsm.state.player.debt = 15000;

  // Cole starts at -20
  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  // Pay 500 → floor(500/500) = 1 → +1
  debtManager.makePayment(500);
  expect(gsm.getNPCState('cole_sol').rep).toBe(-19);

  // Pay 100 → floor(100/500) = 0, but min +1 → +1
  debtManager.makePayment(100);
  expect(gsm.getNPCState('cole_sol').rep).toBe(-18);

  // Pay 1000 → floor(1000/500) = 2 → +2
  debtManager.makePayment(1000);
  expect(gsm.getNPCState('cole_sol').rep).toBe(-16);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `makePayment()`, after the `this.updateHeat(...)` line (191) and before the debt-cleared check (193), add:

```js
    // Cole respects payers: +floor(actualPayment/divisor), min +1
    const repGain = Math.max(
      1,
      Math.floor(actualPayment / COLE_DEBT_CONFIG.REP_PER_CREDIT_DIVISOR)
    );
    this.modifyColeRep(repGain);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 6: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: voluntary debt payments improve Cole reputation"
```

---

### Task 4: Withholding Rep

**Files:**
- Modify: `src/game/state/managers/debt.js` (applyWithholding method, ~line 221)
- Test: `tests/unit/debt-manager.test.js`

**Context:** Auto-withholding is passive income for Cole — he's not impressed unless ≥500 is withheld. Formula: `+floor(withheld / 500)`, min +0 (no guarantee of rep gain unlike voluntary payments).

**Step 1: Write the failing test**

Add inside the existing `describe('applyWithholding')` block:

```js
it('does not improve Cole rep when withholding < 500', () => {
  gsm.state.player.debt = 10000;
  gsm.state.player.finance.heat = 10;

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  // Revenue 1000, 5% lien = 50 withheld (< 500)
  debtManager.applyWithholding(1000);

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);
});

it('improves Cole rep by floor(withheld/500) when withholding >= 500', () => {
  gsm.state.player.debt = 100000;
  gsm.state.player.finance.heat = 80; // critical, 20% lien

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  // Revenue 5000, 20% lien = 1000 withheld → floor(1000/500) = +2
  debtManager.applyWithholding(5000);

  expect(gsm.getNPCState('cole_sol').rep).toBe(-18);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20 for the second test

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `applyWithholding()`, after `finance.totalRepaid += withheld;` (line 227) and before the debt-cleared check (229), add:

```js
    // Cole's cut: only counts if ≥ threshold
    if (withheld >= COLE_DEBT_CONFIG.REP_WITHHOLDING_THRESHOLD) {
      const repGain = Math.floor(
        withheld / COLE_DEBT_CONFIG.REP_PER_CREDIT_DIVISOR
      );
      this.modifyColeRep(repGain);
    }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: large withholding amounts improve Cole reputation"
```

---

### Task 5: Borrow Rep

**Files:**
- Modify: `src/game/state/managers/debt.js` (borrow method, ~line 125)
- Test: `tests/unit/debt-manager.test.js`

**Context:** Cole likes customers. Every borrow gives a flat +1 rep regardless of amount.

**Step 1: Write the failing test**

Add inside the existing `describe('borrow')` block:

```js
it('improves Cole rep by +1 per borrow', () => {
  gsm.state.player.credits = 5000;
  gsm.state.player.debt = 0;

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  debtManager.borrow(100);
  expect(gsm.getNPCState('cole_sol').rep).toBe(-19);

  debtManager.borrow(250);
  expect(gsm.getNPCState('cole_sol').rep).toBe(-18);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `borrow()`, after `finance.borrowedThisPeriod = true;` (line 160) and before `this.emitFinanceChanged();` (line 162), add:

```js
    // Cole likes customers
    this.modifyColeRep(COLE_DEBT_CONFIG.REP_BORROW_BONUS);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: borrowing from Cole gives +1 reputation"
```

---

### Task 6: Missed Checkpoint Penalty

**Files:**
- Modify: `src/game/state/managers/debt.js` (checkCheckpoint method, ~line 255)
- Test: `tests/unit/debt-manager.test.js`

**Context:** When a checkpoint fires and the player made no payments, Cole gets -3 rep in addition to the existing +10 heat penalty.

**Step 1: Write the failing test**

Add inside the existing `describe('checkCheckpoint')` block:

```js
it('reduces Cole rep by 3 when no payments made at checkpoint', () => {
  gsm.state.player.debt = 10000;
  gsm.state.player.finance.nextCheckpoint = 30;
  gsm.state.player.finance.totalRepaid = 0;
  gsm.state.player.finance.lastCheckpointRepaid = 0;
  gsm.state.player.finance.heat = 10;
  gsm.state.player.daysElapsed = 30;

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  debtManager.checkCheckpoint();

  expect(gsm.getNPCState('cole_sol').rep).toBe(-23);
});

it('does not reduce Cole rep when payments were made at checkpoint', () => {
  gsm.state.player.debt = 10000;
  gsm.state.player.finance.nextCheckpoint = 30;
  gsm.state.player.finance.totalRepaid = 500;
  gsm.state.player.finance.lastCheckpointRepaid = 0;
  gsm.state.player.finance.heat = 10;
  gsm.state.player.daysElapsed = 30;

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  debtManager.checkCheckpoint();

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20 for the missed checkpoint test

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `checkCheckpoint()`, inside the `if (!madePayments)` block (line 266), after the `this.updateHeat(...)` call (line 267), add:

```js
      this.modifyColeRep(COLE_DEBT_CONFIG.REP_MISSED_CHECKPOINT);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: missed debt checkpoints reduce Cole reputation"
```

---

### Task 7: Cole Mission Rep Rewards on Completion

**Files:**
- Modify: `src/game/data/cole-missions.js` (add `coleRepReward` to each template)
- Modify: `src/game/state/managers/mission.js` (completeMission, ~line 216)
- Test: `tests/unit/debt-manager.test.js`

**Context:** Cole favor missions have `source: 'cole'` and `reward: 0` (no credits). We add a `coleRepReward` field to each template with values +8, +10, +12. On completion, `completeMission` detects `source === 'cole'` and calls `gsm.modifyColeRep(mission.coleRepReward)` — bypassing the trust modifier.

**Step 1: Write the failing test**

Add a new `describe` block inside `describe('Cole Debt System')`:

```js
describe('Cole Mission Reputation', () => {
  it('completes cole mission and applies direct rep reward', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.currentSystem = 0;

    // Create a Cole mission at destination = current system (so it can complete)
    const coleMission = {
      id: 'cole_courier_test',
      type: 'delivery',
      source: 'cole',
      title: 'Sealed Package',
      description: 'Test delivery',
      giverSystem: 1,
      requirements: { destination: 0, deadline: 21, cargoSpace: 1 },
      destination: { systemId: 0, name: 'Sol' },
      missionCargo: { good: 'sealed_package', quantity: 1 },
      rewards: { credits: 0 },
      reward: 0,
      abandonable: false,
      coleRepReward: 8,
    };

    gsm.state.missions.active.push(coleMission);
    gsm.state.ship.cargo.push({
      good: 'sealed_package',
      qty: 1,
      buyPrice: 0,
      missionId: 'cole_courier_test',
    });

    expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

    gsm.completeMission('cole_courier_test');

    expect(gsm.getNPCState('cole_sol').rep).toBe(-12); // -20 + 8
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20

**Step 3: Add coleRepReward to mission templates**

In `src/game/data/cole-missions.js`, add `coleRepReward` to each template:

- `cole_courier`: `coleRepReward: 8`
- `cole_passenger`: `coleRepReward: 10`
- `cole_intimidation`: `coleRepReward: 12`

Add the field after `abandonable` in each object.

**Step 4: Hook into completeMission**

In `src/game/state/managers/mission.js`, after the `if (mission.rewards.rep)` block (lines 216-220) and before `if (mission.rewards.karma)` (line 222), add:

```js
    // Cole favor missions: apply direct rep bypassing trust modifier
    if (mission.source === 'cole' && mission.coleRepReward) {
      this.gameStateManager.modifyColeRep(mission.coleRepReward);
    }
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/game/data/cole-missions.js src/game/state/managers/mission.js tests/unit/debt-manager.test.js
git commit -m "feat: completing Cole favor missions improves reputation"
```

---

### Task 8: Cole Mission Failure Rep Penalty (Deadline Expiry)

**Files:**
- Modify: `src/game/state/managers/mission.js` (checkMissionDeadlines, ~line 388)
- Test: `tests/unit/debt-manager.test.js`

**Context:** When a Cole favor mission expires (deadline passes), Cole gets -5 rep. This applies in `checkMissionDeadlines()` for any expired mission with `source === 'cole'`.

**Step 1: Write the failing test**

Add inside the `describe('Cole Mission Reputation')` block from Task 7:

```js
it('applies -5 rep when Cole mission deadline expires', () => {
  gsm.state.player.daysElapsed = 50;

  const coleMission = {
    id: 'cole_courier_fail_test',
    type: 'delivery',
    source: 'cole',
    title: 'Sealed Package',
    description: 'Test delivery',
    giverSystem: 1,
    requirements: { destination: 5, deadline: 21, cargoSpace: 1 },
    destination: { systemId: 5, name: 'Alpha Centauri' },
    missionCargo: { good: 'sealed_package', quantity: 1 },
    rewards: { credits: 0 },
    reward: 0,
    abandonable: false,
    deadlineDay: 40, // Already past
  };

  gsm.state.missions.active.push(coleMission);
  gsm.state.ship.cargo.push({
    good: 'sealed_package',
    qty: 1,
    buyPrice: 0,
    missionId: 'cole_courier_fail_test',
  });

  expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

  gsm.checkMissionDeadlines();

  expect(gsm.getNPCState('cole_sol').rep).toBe(-25); // -20 + (-5)
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — Cole rep stays at -20

**Step 3: Write minimal implementation**

In `src/game/state/managers/mission.js`, inside the `for (const mission of expired)` loop in `checkMissionDeadlines()`, after the existing penalty handling block (`if (mission.penalties && mission.penalties.failure)`, ending around line 413), add:

```js
      // Cole favor mission failure: direct rep penalty
      if (mission.source === 'cole') {
        this.gameStateManager.modifyColeRep(COLE_DEBT_CONFIG.REP_FAVOR_FAIL);
      }
```

Also add the import at the top of `mission.js`:

```js
import { COLE_DEBT_CONFIG } from '../../constants.js';
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js tests/unit/debt-manager.test.js
git commit -m "feat: expired Cole missions apply reputation penalty"
```

---

### Task 9: Progression Integration Test

**Files:**
- Test: `tests/unit/debt-manager.test.js`

**Context:** Verify the full progression math from the design: paying off 10K starting debt via voluntary payments should move Cole from -20 (COLD) to roughly 0 (NEUTRAL).

**Step 1: Write the integration test**

Add a new `describe` block inside `describe('Cole Debt System')`:

```js
describe('Cole Reputation Progression', () => {
  let debtManager;

  beforeEach(() => {
    debtManager = new DebtManager(gsm);
  });

  it('paying off 10K in voluntary payments moves Cole from COLD to NEUTRAL', () => {
    gsm.state.player.credits = 20000;
    gsm.state.player.debt = 10000;

    expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

    // Pay 10 x ₡1000 payments
    for (let i = 0; i < 10; i++) {
      debtManager.makePayment(1000);
    }

    const coleRep = gsm.getNPCState('cole_sol').rep;
    // Each ₡1000 payment → floor(1000/500) = +2 rep → 10 * 2 = +20
    // -20 + 20 = 0 (NEUTRAL)
    expect(coleRep).toBe(0);
  });

  it('borrow-and-repay cycle builds rep over time', () => {
    gsm.state.player.credits = 10000;
    gsm.state.player.debt = 0;

    gsm.setNpcRep('cole_sol', 0); // Start at NEUTRAL for this test

    // Borrow 500 → +1 rep
    debtManager.borrow(500);
    // Repay 500 → +1 rep (floor(500/500))
    debtManager.makePayment(500);

    // +1 (borrow) + 1 (payment) = +2
    expect(gsm.getNPCState('cole_sol').rep).toBe(2);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS (this should pass if Tasks 1-6 are implemented correctly)

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/unit/debt-manager.test.js
git commit -m "test: add Cole reputation progression integration tests"
```

---

### Task 10: generateFavorMission Includes coleRepReward

**Files:**
- Modify: `src/game/state/managers/debt.js` (generateFavorMission, ~line 320)
- Test: `tests/unit/debt-manager.test.js`

**Context:** `generateFavorMission()` creates mission objects from templates but doesn't copy `coleRepReward`. The generated mission must include it so `completeMission` can use it.

**Step 1: Write the failing test**

Add inside the existing `describe('generateFavorMission')` block:

```js
it('includes coleRepReward from template', () => {
  const mission = debtManager.generateFavorMission();

  expect(mission.coleRepReward).toBeDefined();
  expect(typeof mission.coleRepReward).toBe('number');
  expect(mission.coleRepReward).toBeGreaterThanOrEqual(8);
  expect(mission.coleRepReward).toBeLessThanOrEqual(12);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `mission.coleRepReward` is undefined

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `generateFavorMission()`, in the returned object (around line 345-365), add `coleRepReward`:

```js
      coleRepReward: template.coleRepReward,
```

Add it after `abandonable: template.abandonable,` (line 364).

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: generated favor missions include coleRepReward"
```

---

## Notes

**Not implemented (future work):**
- **Decline favor mission (-2 rep):** The checkpoint system generates favor missions but currently has no UI to decline them. The `REP_DECLINE_FAVOR` constant can be added when the checkpoint dialog is built. Cole missions are `abandonable: false` so the existing abandon flow doesn't apply.
- **Favor mission rep values per template** could be tuned later. Current: courier +8, passenger +10, intimidation +12 — reflecting difficulty/risk.

**Design doc preserved:** The original design spec is at `docs/plans/2026-02-22-cole-reputation-design.md`. The implementation matches it exactly except for the decline mechanism (deferred).
