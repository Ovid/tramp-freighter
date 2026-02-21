# Cole Debt System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Marcus Cole's loan shark debt system — borrowing, repayment, auto-withholding on trades, hidden heat escalation, periodic interest, checkpoints, and unpaid favor missions.

**Architecture:** New `DebtManager` extends `BaseManager`, follows existing manager delegation pattern. Finance state lives on `player.finance`. Integrates with `TradingManager.sellGood()` for withholding, `EventsManager.updateTime()` for interest/checkpoints, and a new `FinancePanel` for UI. Hidden heat score drives Cole's escalation behavior.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern hooks (`useGameEvent`, `useGameAction`)

**Design doc:** `docs/plans/2026-02-21-cole-debt-system-design.md`

---

### Task 1: Add Cole Debt Constants

**Files:**
- Modify: `src/game/constants.js` (after `NEW_GAME_DEFAULTS` around line 421)

**Step 1: Add COLE_DEBT_CONFIG constant block**

Add after `NEW_GAME_DEFAULTS`:

```js
/**
 * Cole debt system configuration
 * All numeric values for the loan shark mechanics
 */
export const COLE_DEBT_CONFIG = {
  // Interest
  INTEREST_RATE: 0.02,           // 2% monthly interest on principal
  INTEREST_PERIOD_DAYS: 30,      // Days between interest applications

  // Lien rates by heat tier
  LIEN_RATE_LOW: 0.05,           // 0-20 heat: 5% withholding
  LIEN_RATE_MEDIUM: 0.10,        // 21-45 heat: 10%
  LIEN_RATE_HIGH: 0.15,          // 46-70 heat: 15%
  LIEN_RATE_CRITICAL: 0.20,      // 71-100 heat: 20% (cap)

  // Heat thresholds
  HEAT_MIN: 0,
  HEAT_MAX: 100,
  HEAT_TIER_LOW_MAX: 20,
  HEAT_TIER_MEDIUM_MAX: 45,
  HEAT_TIER_HIGH_MAX: 70,

  // Heat changes
  HEAT_BORROW_BASE: 8,
  HEAT_BORROW_PER_500: 2,
  HEAT_MISSED_CHECKPOINT: 10,
  HEAT_VOLUNTARY_PAYMENT: -3,
  HEAT_NATURAL_DECAY: -1,
  HEAT_DECLINE_FAVOR: 5,
  HEAT_FAIL_MANDATORY: 15,

  // Checkpoint intervals (days) by heat tier
  CHECKPOINT_INTERVAL_LOW: 30,
  CHECKPOINT_INTERVAL_MEDIUM: 21,
  CHECKPOINT_INTERVAL_HIGH: 14,
  CHECKPOINT_INTERVAL_CRITICAL: 7,

  // Borrowing
  MIN_DRAW: 100,
  DEFAULT_DRAW: 200,
  NET_WORTH_DRAW_PERCENT: 0.08,
  DRAW_TIERS: [100, 250, 500],
  BORROW_CHECKPOINT_ACCELERATION_DAYS: 7,

  // Starting values
  STARTING_LIEN_RATE: 0.05,
  STARTING_HEAT: 0,
  STARTING_CHECKPOINT_DAY: 30,
};
```

**Step 2: Verify no lint errors**

Run: `npm run lint`
Expected: PASS (no new errors)

**Step 3: Commit**

```bash
git add src/game/constants.js
git commit -m "feat: add COLE_DEBT_CONFIG constants for debt system"
```

---

### Task 2: Add Finance State to Player Initialization

**Files:**
- Test: `tests/unit/debt-manager.test.js` (create)
- Modify: `src/game/state/managers/initialization.js:77-92`
- Modify: `src/game/state/managers/initialization.js:252-277` (emitInitialEvents)
- Modify: `src/game/state/managers/event-system.js:17-49` (add financeChanged)

**Step 1: Write failing test for finance state initialization**

Create `tests/unit/debt-manager.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG, NEW_GAME_DEFAULTS } from '../../src/game/constants.js';

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Cole Debt System', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  describe('Finance State Initialization', () => {
    it('initializes player.finance with correct defaults', () => {
      const state = gsm.state;
      expect(state.player.finance).toBeDefined();
      expect(state.player.finance.heat).toBe(COLE_DEBT_CONFIG.STARTING_HEAT);
      expect(state.player.finance.lienRate).toBe(COLE_DEBT_CONFIG.STARTING_LIEN_RATE);
      expect(state.player.finance.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE);
      expect(state.player.finance.lastInterestDay).toBe(0);
      expect(state.player.finance.nextCheckpoint).toBe(COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY);
      expect(state.player.finance.totalBorrowed).toBe(0);
      expect(state.player.finance.totalRepaid).toBe(0);
    });

    it('player.debt still exists at starting value', () => {
      expect(gsm.state.player.debt).toBe(NEW_GAME_DEFAULTS.STARTING_DEBT);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `state.player.finance` is undefined

**Step 3: Add finance state to initialization**

In `src/game/state/managers/initialization.js`, import the constant:

```js
import { COLE_DEBT_CONFIG } from '../../constants.js';
```

Then in `initializePlayerState()` (around line 86), add `finance` to the returned object:

```js
return {
  credits: NEW_GAME_DEFAULTS.STARTING_CREDITS,
  debt: NEW_GAME_DEFAULTS.STARTING_DEBT,
  currentSystem: SOL_SYSTEM_ID,
  daysElapsed: 0,
  karma: KARMA_CONFIG.INITIAL,
  factions,
  finance: {
    heat: COLE_DEBT_CONFIG.STARTING_HEAT,
    lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
    interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
    lastInterestDay: 0,
    nextCheckpoint: COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
    totalBorrowed: 0,
    totalRepaid: 0,
  },
};
```

**Step 4: Register `financeChanged` event**

In `src/game/state/managers/event-system.js`, add to the subscribers object (around line 44):

```js
financeChanged: [],
```

**Step 5: Emit finance state in emitInitialEvents**

In `src/game/state/managers/initialization.js`, in `emitInitialEvents()` (around line 256), add:

```js
this.gameStateManager.emit('financeChanged', player.finance);
```

**Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 7: Run full test suite**

Run: `npm test`
Expected: All existing tests still pass. If any fail because they don't expect `finance` in player state, fix those tests to accommodate the new field.

**Step 8: Commit**

```bash
git add tests/unit/debt-manager.test.js src/game/state/managers/initialization.js src/game/state/managers/event-system.js
git commit -m "feat: add finance state to player initialization with financeChanged event"
```

---

### Task 3: Create DebtManager — Heat Tier and Lien Rate

**Files:**
- Create: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests for heat tier calculation and lien rate**

Append to `tests/unit/debt-manager.test.js`:

```js
import { DebtManager } from '../../src/game/state/managers/debt.js';

describe('DebtManager', () => {
  let gsm;
  let debtManager;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    debtManager = new DebtManager(gsm);
  });

  describe('getHeatTier', () => {
    it('returns "low" for heat 0-20', () => {
      gsm.state.player.finance.heat = 0;
      expect(debtManager.getHeatTier()).toBe('low');
      gsm.state.player.finance.heat = 20;
      expect(debtManager.getHeatTier()).toBe('low');
    });

    it('returns "medium" for heat 21-45', () => {
      gsm.state.player.finance.heat = 21;
      expect(debtManager.getHeatTier()).toBe('medium');
      gsm.state.player.finance.heat = 45;
      expect(debtManager.getHeatTier()).toBe('medium');
    });

    it('returns "high" for heat 46-70', () => {
      gsm.state.player.finance.heat = 46;
      expect(debtManager.getHeatTier()).toBe('high');
      gsm.state.player.finance.heat = 70;
      expect(debtManager.getHeatTier()).toBe('high');
    });

    it('returns "critical" for heat 71-100', () => {
      gsm.state.player.finance.heat = 71;
      expect(debtManager.getHeatTier()).toBe('critical');
      gsm.state.player.finance.heat = 100;
      expect(debtManager.getHeatTier()).toBe('critical');
    });
  });

  describe('getLienRate', () => {
    it('returns correct lien rate for each heat tier', () => {
      gsm.state.player.finance.heat = 10;
      expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_LOW);

      gsm.state.player.finance.heat = 30;
      expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);

      gsm.state.player.finance.heat = 50;
      expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_HIGH);

      gsm.state.player.finance.heat = 80;
      expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_CRITICAL);
    });

    it('returns 0 when debt is 0', () => {
      gsm.state.player.debt = 0;
      gsm.state.player.finance.heat = 80;
      expect(debtManager.getLienRate()).toBe(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — DebtManager doesn't exist

**Step 3: Create DebtManager with heat tier and lien rate**

Create `src/game/state/managers/debt.js`:

```js
import { BaseManager } from './base-manager.js';
import { COLE_DEBT_CONFIG } from '../../constants.js';

export class DebtManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  getFinance() {
    return this.getState().player.finance;
  }

  getDebt() {
    return this.getState().player.debt;
  }

  getHeatTier() {
    const heat = this.getFinance().heat;
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX) return 'low';
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX) return 'medium';
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_HIGH_MAX) return 'high';
    return 'critical';
  }

  getLienRate() {
    if (this.getDebt() === 0) return 0;

    const tier = this.getHeatTier();
    switch (tier) {
      case 'low': return COLE_DEBT_CONFIG.LIEN_RATE_LOW;
      case 'medium': return COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM;
      case 'high': return COLE_DEBT_CONFIG.LIEN_RATE_HIGH;
      case 'critical': return COLE_DEBT_CONFIG.LIEN_RATE_CRITICAL;
      default: return COLE_DEBT_CONFIG.LIEN_RATE_LOW;
    }
  }

  clampHeat(heat) {
    return Math.max(COLE_DEBT_CONFIG.HEAT_MIN, Math.min(COLE_DEBT_CONFIG.HEAT_MAX, heat));
  }

  updateHeat(delta) {
    const finance = this.getFinance();
    finance.heat = this.clampHeat(finance.heat + delta);
    finance.lienRate = this.getLienRate();
    this.emitFinanceChanged();
  }

  emitFinanceChanged() {
    this.emit('financeChanged', { ...this.getFinance() });
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: create DebtManager with heat tier and lien rate calculation"
```

---

### Task 4: DebtManager — Interest Accrual

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests for interest accrual**

Append to the DebtManager describe block:

```js
describe('applyInterest', () => {
  it('applies interest when period has elapsed', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.lastInterestDay = 0;
    gsm.state.player.daysElapsed = 30;

    debtManager.applyInterest();

    // 10000 * 0.02 = 200, ceil = 200
    expect(gsm.state.player.debt).toBe(10200);
    expect(gsm.state.player.finance.lastInterestDay).toBe(30);
  });

  it('does not apply interest before period elapses', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.lastInterestDay = 0;
    gsm.state.player.daysElapsed = 29;

    debtManager.applyInterest();

    expect(gsm.state.player.debt).toBe(10000);
    expect(gsm.state.player.finance.lastInterestDay).toBe(0);
  });

  it('does not apply interest when debt is 0', () => {
    gsm.state.player.debt = 0;
    gsm.state.player.finance.lastInterestDay = 0;
    gsm.state.player.daysElapsed = 30;

    debtManager.applyInterest();

    expect(gsm.state.player.debt).toBe(0);
  });

  it('rounds interest up with Math.ceil', () => {
    gsm.state.player.debt = 150;
    gsm.state.player.finance.lastInterestDay = 0;
    gsm.state.player.daysElapsed = 30;

    debtManager.applyInterest();

    // 150 * 0.02 = 3, ceil = 3
    expect(gsm.state.player.debt).toBe(153);
  });

  it('applies natural heat decay when no new borrowing in period', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 25;
    gsm.state.player.finance.lastInterestDay = 0;
    gsm.state.player.finance.borrowedThisPeriod = false;
    gsm.state.player.daysElapsed = 30;

    debtManager.applyInterest();

    expect(gsm.state.player.finance.heat).toBe(24);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `applyInterest` not defined

**Step 3: Implement applyInterest**

Add to `DebtManager`:

```js
applyInterest() {
  this.validateState();
  const state = this.getState();
  const finance = this.getFinance();
  const debt = this.getDebt();

  if (debt === 0) return;

  const daysSinceLast = state.player.daysElapsed - finance.lastInterestDay;
  if (daysSinceLast < COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS) return;

  const interest = Math.ceil(debt * finance.interestRate);
  this.gameStateManager.updateDebt(debt + interest);
  finance.lastInterestDay = state.player.daysElapsed;

  // Natural heat decay if player hasn't borrowed this period
  if (!finance.borrowedThisPeriod) {
    this.updateHeat(COLE_DEBT_CONFIG.HEAT_NATURAL_DECAY);
  }
  finance.borrowedThisPeriod = false;

  this.emitFinanceChanged();
}
```

Also add `borrowedThisPeriod: false` to the finance initialization in `initialization.js`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js src/game/state/managers/initialization.js tests/unit/debt-manager.test.js
git commit -m "feat: add interest accrual with natural heat decay"
```

---

### Task 5: DebtManager — Emergency Borrowing

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests for borrowing**

```js
describe('getMaxDraw', () => {
  it('calculates max draw based on net worth', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.debt = 10000;
    gsm.state.ship.cargo = [{ good: 'water', qty: 10, buyPrice: 50 }];

    const maxDraw = debtManager.getMaxDraw();
    // netWorth = 5000 + (10*50) - 10000 = -4500, negative
    // max(200, round(-4500 * 0.08)) = max(200, -360) = 200
    expect(maxDraw).toBe(200);
  });

  it('returns minimum 200 even with negative net worth', () => {
    gsm.state.player.credits = 0;
    gsm.state.player.debt = 50000;
    gsm.state.ship.cargo = [];

    expect(debtManager.getMaxDraw()).toBe(200);
  });
});

describe('borrow', () => {
  it('increases debt and credits by draw amount', () => {
    const initialDebt = gsm.state.player.debt;
    const initialCredits = gsm.state.player.credits;

    const result = debtManager.borrow(250);

    expect(result.success).toBe(true);
    expect(gsm.state.player.debt).toBe(initialDebt + 250);
    expect(gsm.state.player.credits).toBe(initialCredits + 250);
  });

  it('increases heat by base + per-500 formula', () => {
    gsm.state.player.finance.heat = 0;

    debtManager.borrow(100);
    // heat += 8 + floor(100/500)*2 = 8 + 0 = 8
    expect(gsm.state.player.finance.heat).toBe(8);
  });

  it('increases heat more for larger draws', () => {
    gsm.state.player.finance.heat = 0;

    debtManager.borrow(500);
    // heat += 8 + floor(500/500)*2 = 8 + 2 = 10
    expect(gsm.state.player.finance.heat).toBe(10);
  });

  it('accelerates next checkpoint', () => {
    gsm.state.player.finance.nextCheckpoint = 60;
    gsm.state.player.daysElapsed = 10;

    debtManager.borrow(100);

    // min(60, 10 + 7) = 17
    expect(gsm.state.player.finance.nextCheckpoint).toBe(17);
  });

  it('tracks totalBorrowed', () => {
    debtManager.borrow(250);
    expect(gsm.state.player.finance.totalBorrowed).toBe(250);

    debtManager.borrow(100);
    expect(gsm.state.player.finance.totalBorrowed).toBe(350);
  });

  it('rejects draw amount exceeding maxDraw', () => {
    gsm.state.player.credits = 0;
    gsm.state.player.debt = 50000;
    gsm.state.ship.cargo = [];

    const result = debtManager.borrow(500);
    expect(result.success).toBe(false);
  });

  it('sets borrowedThisPeriod flag', () => {
    debtManager.borrow(100);
    expect(gsm.state.player.finance.borrowedThisPeriod).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Implement getMaxDraw and borrow**

Add to `DebtManager`:

```js
getMaxDraw() {
  this.validateState();
  const state = this.getState();
  const credits = state.player.credits;
  const debt = this.getDebt();

  // Estimate cargo liquidation value
  const cargoValue = (state.ship.cargo || []).reduce(
    (sum, stack) => sum + stack.qty * stack.buyPrice, 0
  );

  const netWorth = credits + cargoValue - debt;
  const calculated = Math.round(netWorth * COLE_DEBT_CONFIG.NET_WORTH_DRAW_PERCENT);

  return Math.max(COLE_DEBT_CONFIG.DEFAULT_DRAW, calculated);
}

getAvailableDrawTiers() {
  const maxDraw = this.getMaxDraw();
  const tiers = COLE_DEBT_CONFIG.DRAW_TIERS.filter(t => t <= maxDraw);
  if (maxDraw > tiers[tiers.length - 1]) {
    tiers.push(maxDraw);
  }
  return tiers;
}

borrow(amount) {
  this.validateState();
  const state = this.getState();
  const finance = this.getFinance();
  const maxDraw = this.getMaxDraw();

  if (amount > maxDraw) {
    return { success: false, reason: 'Amount exceeds maximum draw' };
  }

  if (amount < COLE_DEBT_CONFIG.MIN_DRAW) {
    return { success: false, reason: 'Amount below minimum draw' };
  }

  // Increase debt
  this.gameStateManager.updateDebt(this.getDebt() + amount);

  // Give credits
  this.gameStateManager.updateCredits(state.player.credits + amount);

  // Increase heat
  const heatIncrease = COLE_DEBT_CONFIG.HEAT_BORROW_BASE +
    Math.floor(amount / 500) * COLE_DEBT_CONFIG.HEAT_BORROW_PER_500;
  this.updateHeat(heatIncrease);

  // Accelerate next checkpoint
  const accelerated = state.player.daysElapsed + COLE_DEBT_CONFIG.BORROW_CHECKPOINT_ACCELERATION_DAYS;
  finance.nextCheckpoint = Math.min(finance.nextCheckpoint, accelerated);

  // Track
  finance.totalBorrowed += amount;
  finance.borrowedThisPeriod = true;

  this.emitFinanceChanged();
  this.gameStateManager.saveGame();

  return { success: true, amount };
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: add emergency borrowing with heat increase and checkpoint acceleration"
```

---

### Task 6: DebtManager — Voluntary Payment

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests**

```js
describe('makePayment', () => {
  it('reduces debt and deducts credits', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.debt = 10000;

    const result = debtManager.makePayment(1000);

    expect(result.success).toBe(true);
    expect(gsm.state.player.debt).toBe(9000);
    expect(gsm.state.player.credits).toBe(4000);
  });

  it('reduces heat by 3 per payment action', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 30;

    debtManager.makePayment(100);

    expect(gsm.state.player.finance.heat).toBe(27);
  });

  it('caps payment at current debt', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.debt = 300;

    debtManager.makePayment(500);

    expect(gsm.state.player.debt).toBe(0);
    expect(gsm.state.player.credits).toBe(4700);
  });

  it('resets heat to 0 when debt reaches 0', () => {
    gsm.state.player.credits = 15000;
    gsm.state.player.debt = 1000;
    gsm.state.player.finance.heat = 50;

    debtManager.makePayment(1000);

    expect(gsm.state.player.debt).toBe(0);
    expect(gsm.state.player.finance.heat).toBe(0);
  });

  it('rejects payment when credits insufficient', () => {
    gsm.state.player.credits = 50;

    const result = debtManager.makePayment(100);

    expect(result.success).toBe(false);
  });

  it('rejects payment when debt is 0', () => {
    gsm.state.player.debt = 0;
    gsm.state.player.credits = 5000;

    const result = debtManager.makePayment(100);

    expect(result.success).toBe(false);
  });

  it('tracks totalRepaid', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.debt = 10000;

    debtManager.makePayment(500);

    expect(gsm.state.player.finance.totalRepaid).toBe(500);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Implement makePayment**

Add to `DebtManager`:

```js
makePayment(amount) {
  this.validateState();
  const state = this.getState();
  const finance = this.getFinance();
  const debt = this.getDebt();

  if (debt === 0) {
    return { success: false, reason: 'No outstanding debt' };
  }

  if (state.player.credits < amount) {
    return { success: false, reason: 'Insufficient credits' };
  }

  // Cap at actual debt
  const actualPayment = Math.min(amount, debt);

  this.gameStateManager.updateDebt(debt - actualPayment);
  this.gameStateManager.updateCredits(state.player.credits - actualPayment);

  finance.totalRepaid += actualPayment;

  // Heat reduction per payment action
  this.updateHeat(COLE_DEBT_CONFIG.HEAT_VOLUNTARY_PAYMENT);

  // If debt is now 0, reset heat
  if (this.getDebt() === 0) {
    finance.heat = 0;
    finance.lienRate = 0;
  }

  this.emitFinanceChanged();
  this.gameStateManager.saveGame();

  return { success: true, amount: actualPayment };
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: add voluntary debt payment with heat reduction"
```

---

### Task 7: DebtManager — Trade Withholding

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests for withholding calculation**

```js
describe('calculateWithholding', () => {
  it('calculates withholding based on current lien rate', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 10; // low tier, 5%

    const result = debtManager.calculateWithholding(1000);

    expect(result.withheld).toBe(50); // ceil(1000 * 0.05) = 50
    expect(result.playerReceives).toBe(950);
  });

  it('caps withholding at current debt', () => {
    gsm.state.player.debt = 20;
    gsm.state.player.finance.heat = 10;

    const result = debtManager.calculateWithholding(1000);

    expect(result.withheld).toBe(20);
    expect(result.playerReceives).toBe(980);
  });

  it('returns 0 withholding when debt is 0', () => {
    gsm.state.player.debt = 0;

    const result = debtManager.calculateWithholding(1000);

    expect(result.withheld).toBe(0);
    expect(result.playerReceives).toBe(1000);
  });

  it('uses higher lien rate at higher heat', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 80; // critical, 20%

    const result = debtManager.calculateWithholding(1000);

    expect(result.withheld).toBe(200);
    expect(result.playerReceives).toBe(800);
  });
});

describe('applyWithholding', () => {
  it('reduces debt by withheld amount and tracks totalRepaid', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 10;

    debtManager.applyWithholding(1000);

    expect(gsm.state.player.debt).toBe(9950);
    expect(gsm.state.player.finance.totalRepaid).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Implement calculateWithholding and applyWithholding**

Add to `DebtManager`:

```js
calculateWithholding(totalRevenue) {
  const debt = this.getDebt();
  if (debt === 0) {
    return { withheld: 0, playerReceives: totalRevenue };
  }

  const lienRate = this.getLienRate();
  let withheld = Math.ceil(totalRevenue * lienRate);
  withheld = Math.min(withheld, debt);

  return {
    withheld,
    playerReceives: totalRevenue - withheld,
  };
}

applyWithholding(totalRevenue) {
  const { withheld } = this.calculateWithholding(totalRevenue);
  if (withheld === 0) return { withheld: 0 };

  const finance = this.getFinance();
  this.gameStateManager.updateDebt(this.getDebt() - withheld);
  finance.totalRepaid += withheld;

  if (this.getDebt() === 0) {
    finance.heat = 0;
    finance.lienRate = 0;
  }

  this.emitFinanceChanged();

  return { withheld };
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: add trade withholding calculation for Cole's lien"
```

---

### Task 8: DebtManager — Checkpoint Logic

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing tests for checkpoint processing**

```js
describe('checkCheckpoint', () => {
  it('does not trigger before checkpoint day', () => {
    gsm.state.player.finance.nextCheckpoint = 30;
    gsm.state.player.daysElapsed = 29;

    const result = debtManager.checkCheckpoint();

    expect(result).toBeNull();
  });

  it('does not trigger when debt is 0', () => {
    gsm.state.player.debt = 0;
    gsm.state.player.finance.nextCheckpoint = 30;
    gsm.state.player.daysElapsed = 30;

    const result = debtManager.checkCheckpoint();

    expect(result).toBeNull();
  });

  it('triggers on checkpoint day with payment made', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.nextCheckpoint = 30;
    gsm.state.player.finance.totalRepaid = 500;
    gsm.state.player.finance.lastCheckpointRepaid = 0;
    gsm.state.player.daysElapsed = 30;

    const result = debtManager.checkCheckpoint();

    expect(result).not.toBeNull();
    expect(result.madePayments).toBe(true);
  });

  it('increases heat when no payments made since last checkpoint', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.nextCheckpoint = 30;
    gsm.state.player.finance.totalRepaid = 0;
    gsm.state.player.finance.lastCheckpointRepaid = 0;
    gsm.state.player.finance.heat = 10;
    gsm.state.player.daysElapsed = 30;

    debtManager.checkCheckpoint();

    expect(gsm.state.player.finance.heat).toBe(20); // +10
  });

  it('schedules next checkpoint based on heat tier', () => {
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.nextCheckpoint = 30;
    gsm.state.player.finance.totalRepaid = 500;
    gsm.state.player.finance.lastCheckpointRepaid = 0;
    gsm.state.player.finance.heat = 10; // low tier
    gsm.state.player.daysElapsed = 30;

    debtManager.checkCheckpoint();

    // low tier: +30 days
    expect(gsm.state.player.finance.nextCheckpoint).toBe(60);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Implement checkCheckpoint**

Add `lastCheckpointRepaid: 0` to the finance state in `initialization.js`.

Add to `DebtManager`:

```js
getCheckpointInterval() {
  const tier = this.getHeatTier();
  switch (tier) {
    case 'low': return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_LOW;
    case 'medium': return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_MEDIUM;
    case 'high': return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_HIGH;
    case 'critical': return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_CRITICAL;
    default: return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_LOW;
  }
}

checkCheckpoint() {
  this.validateState();
  const state = this.getState();
  const finance = this.getFinance();
  const debt = this.getDebt();

  if (debt === 0) return null;
  if (state.player.daysElapsed < finance.nextCheckpoint) return null;

  const madePayments = finance.totalRepaid > finance.lastCheckpointRepaid;

  if (!madePayments) {
    this.updateHeat(COLE_DEBT_CONFIG.HEAT_MISSED_CHECKPOINT);
  }

  // Record repayment level at this checkpoint
  finance.lastCheckpointRepaid = finance.totalRepaid;

  // Schedule next checkpoint
  const interval = this.getCheckpointInterval();
  finance.nextCheckpoint = state.player.daysElapsed + interval;

  const tier = this.getHeatTier();
  const requiresFavor = tier === 'high' || tier === 'critical';
  const favorMandatory = tier === 'critical';

  this.emitFinanceChanged();

  return {
    madePayments,
    tier,
    requiresFavor,
    favorMandatory,
    debt,
    heat: finance.heat,
  };
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js src/game/state/managers/initialization.js tests/unit/debt-manager.test.js
git commit -m "feat: add checkpoint logic with heat escalation"
```

---

### Task 9: DebtManager — getDebtInfo Summary Method

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing test**

```js
describe('getDebtInfo', () => {
  it('returns complete debt summary for UI', () => {
    gsm.state.player.debt = 8000;
    gsm.state.player.credits = 3000;
    gsm.state.player.finance.heat = 25;
    gsm.state.player.finance.totalBorrowed = 2000;
    gsm.state.player.finance.totalRepaid = 4000;
    gsm.state.player.daysElapsed = 15;

    const info = debtManager.getDebtInfo();

    expect(info.debt).toBe(8000);
    expect(info.lienRate).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);
    expect(info.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE);
    expect(info.nextInterestDay).toBeDefined();
    expect(info.maxDraw).toBeGreaterThanOrEqual(COLE_DEBT_CONFIG.DEFAULT_DRAW);
    expect(info.availableDrawTiers).toBeInstanceOf(Array);
    expect(info.canBorrow).toBe(true);
    expect(info.canPay).toBe(true);
    expect(info.totalBorrowed).toBe(2000);
    expect(info.totalRepaid).toBe(4000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Implement getDebtInfo**

Add to `DebtManager`:

```js
getDebtInfo() {
  this.validateState();
  const state = this.getState();
  const finance = this.getFinance();
  const debt = this.getDebt();

  return {
    debt,
    lienRate: this.getLienRate(),
    interestRate: finance.interestRate,
    nextInterestDay: finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS,
    maxDraw: this.getMaxDraw(),
    availableDrawTiers: this.getAvailableDrawTiers(),
    canBorrow: debt > 0 || true, // can always borrow (anti-soft-lock)
    canPay: debt > 0 && state.player.credits > 0,
    totalBorrowed: finance.totalBorrowed,
    totalRepaid: finance.totalRepaid,
    nextCheckpoint: finance.nextCheckpoint,
  };
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: add getDebtInfo summary method for Finance panel"
```

---

### Task 10: Wire DebtManager into GameStateManager

**Files:**
- Modify: `src/game/state/game-state-manager.js`
- Modify: `src/game/state/managers/events.js:77-114`
- Modify: `src/game/state/managers/trading.js:77-132`
- Modify: `src/hooks/useGameAction.js`

**Step 1: Write integration test for withholding in sellGood**

Append to `tests/unit/debt-manager.test.js`:

```js
describe('Trading Integration', () => {
  it('applies withholding when selling goods', () => {
    // Set up trade scenario
    gsm.state.player.credits = 500;
    gsm.state.player.debt = 10000;
    gsm.state.player.finance.heat = 10; // 5% lien
    gsm.state.ship.cargo = [
      { good: 'water', qty: 10, buyPrice: 50 },
    ];

    // Lock prices for current system so sellGood works
    gsm.state.world.currentSystemPrices =
      gsm.tradingManager.getCurrentSystemPrices() || {};
    gsm.lockPricesForSystem(gsm.state.player.currentSystem);

    const result = gsm.sellGood(0, 10, 100);

    expect(result.success).toBe(true);
    // Revenue = 10 * 100 = 1000
    // Withholding = ceil(1000 * 0.05) = 50
    // Player gets 500 + 950 = 1450
    expect(gsm.state.player.credits).toBe(1450);
    // Debt reduced by 50
    expect(gsm.state.player.debt).toBe(9950);
    expect(result.withheld).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL

**Step 3: Import and instantiate DebtManager in GameStateManager**

In `src/game/state/game-state-manager.js`:

Add import:
```js
import { DebtManager } from './managers/debt.js';
```

In constructor (after line 103):
```js
this.debtManager = new DebtManager(this);
```

Add delegation methods (in the STATE MUTATIONS section, after `updateDebt`):

```js
// ========================================================================
// COLE DEBT SYSTEM
// ========================================================================

getDebtInfo() {
  return this.debtManager.getDebtInfo();
}

borrowFromCole(amount) {
  const result = this.debtManager.borrow(amount);
  if (result.success) {
    this.saveGame();
  }
  return result;
}

makeDebtPayment(amount) {
  const result = this.debtManager.makePayment(amount);
  if (result.success) {
    this.saveGame();
  }
  return result;
}

calculateTradeWithholding(totalRevenue) {
  return this.debtManager.calculateWithholding(totalRevenue);
}

applyTradeWithholding(totalRevenue) {
  return this.debtManager.applyWithholding(totalRevenue);
}

processDebtTick() {
  this.debtManager.applyInterest();
  return this.debtManager.checkCheckpoint();
}
```

**Step 4: Modify TradingManager.sellGood to apply withholding**

In `src/game/state/managers/trading.js`, modify the `sellGood` method. After line 103 (`const totalRevenue = quantity * salePrice;`), replace the credit update:

Change:
```js
this.gameStateManager.updateCredits(state.player.credits + totalRevenue);
```

To:
```js
// Apply Cole's lien withholding before crediting player
const { withheld } = this.gameStateManager.applyTradeWithholding(totalRevenue);
const playerReceives = totalRevenue - withheld;
this.gameStateManager.updateCredits(state.player.credits + playerReceives);
```

And update the return value to include `withheld`:

```js
return {
  success: true,
  profitMargin: profitMargin,
  withheld,
};
```

**Step 5: Hook into daily tick**

In `src/game/state/managers/events.js`, in `updateTime()` after line 105 (`this.gameStateManager.checkLoanDefaults();`), add:

```js
// Process Cole debt: interest accrual and checkpoint checks
this.gameStateManager.processDebtTick();
```

**Step 6: Add actions to useGameAction**

In `src/hooks/useGameAction.js`, add to the actions object:

```js
getDebtInfo: () => gameStateManager.getDebtInfo(),
borrowFromCole: (amount) => gameStateManager.borrowFromCole(amount),
makeDebtPayment: (amount) => gameStateManager.makeDebtPayment(amount),
```

**Step 7: Run integration test**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS (the integration test may need adjustment based on how `lockPricesForSystem` works — adapt as needed)

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests pass. Watch for existing trade tests that might not expect the `withheld` field — update return value expectations if needed.

**Step 9: Commit**

```bash
git add src/game/state/game-state-manager.js src/game/state/managers/trading.js src/game/state/managers/events.js src/hooks/useGameAction.js tests/unit/debt-manager.test.js
git commit -m "feat: wire DebtManager into GameStateManager, trading, and daily tick"
```

---

### Task 11: Finance Panel — React Component

**Files:**
- Create: `src/features/finance/FinancePanel.jsx`
- Modify: `src/features/station/PanelContainer.jsx`
- Modify: `src/features/station/StationMenu.jsx`

**Step 1: Create FinancePanel component**

Create `src/features/finance/FinancePanel.jsx`:

```jsx
import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { COLE_DEBT_CONFIG } from '../../game/constants.js';

export function FinancePanel({ onClose }) {
  const debt = useGameEvent('debtChanged');
  const credits = useGameEvent('creditsChanged');
  const finance = useGameEvent('financeChanged');
  const currentDay = useGameEvent('timeChanged');

  const { getDebtInfo, borrowFromCole, makeDebtPayment } = useGameAction();

  const [message, setMessage] = useState(null);

  const debtInfo = useMemo(() => {
    // Re-derive when debt/finance/credits change
    if (debt === undefined || !finance) return null;
    return getDebtInfo();
  }, [debt, finance, credits, getDebtInfo]);

  if (!debtInfo) return null;

  const handleBorrow = (amount) => {
    const result = borrowFromCole(amount);
    if (result.success) {
      setMessage({ type: 'info', text: `Borrowed ₡${amount} from Cole` });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const handlePayment = (amount) => {
    const result = makeDebtPayment(amount);
    if (result.success) {
      setMessage({
        type: 'info',
        text: result.amount === debt
          ? 'Debt paid in full!'
          : `Paid ₡${result.amount} toward debt`,
      });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const payAll = () => handlePayment(Math.min(credits, debt));

  const lienPercent = Math.round(debtInfo.lienRate * 100);
  const interestPercent = Math.round(debtInfo.interestRate * 100);
  const daysUntilInterest = Math.max(0, debtInfo.nextInterestDay - currentDay);

  return (
    <div id="finance-panel" className="visible">
      <button className="close-btn" onClick={onClose}>×</button>
      <h2>Cole Credit Line</h2>

      <div className="finance-content">
        <div className="finance-section">
          <h3>Debt Overview</h3>
          <div className="info-row">
            <span className="label">Outstanding:</span>
            <span className="value">₡{debtInfo.debt.toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="label">Withholding:</span>
            <span className="value">{lienPercent}% of trade sales</span>
          </div>
          <div className="info-row">
            <span className="label">Interest:</span>
            <span className="value">{interestPercent}% every 30 days</span>
          </div>
          <div className="info-row">
            <span className="label">Next interest:</span>
            <span className="value">
              {debtInfo.debt > 0 ? `${daysUntilInterest} days` : 'N/A'}
            </span>
          </div>
        </div>

        {debtInfo.debt > 0 && (
          <div className="finance-section">
            <h3>Make Payment</h3>
            <div className="finance-buttons">
              {[100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  className="station-btn"
                  disabled={credits < amount || debtInfo.debt === 0}
                  onClick={() => handlePayment(Math.min(amount, debtInfo.debt))}
                >
                  Pay ₡{amount}
                </button>
              ))}
              <button
                className="station-btn"
                disabled={credits === 0 || debtInfo.debt === 0}
                onClick={payAll}
              >
                Pay All (₡{Math.min(credits, debtInfo.debt).toLocaleString()})
              </button>
            </div>
          </div>
        )}

        <div className="finance-section">
          <h3>Emergency Credit</h3>
          <p className="finance-warning">
            Borrowing increases withholding and draws Cole&apos;s attention.
          </p>
          <div className="info-row">
            <span className="label">Available:</span>
            <span className="value">up to ₡{debtInfo.maxDraw.toLocaleString()}</span>
          </div>
          <div className="finance-buttons">
            {debtInfo.availableDrawTiers.map((amount) => (
              <button
                key={amount}
                className="station-btn borrow-btn"
                onClick={() => handleBorrow(amount)}
              >
                Borrow ₡{amount}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`validation-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Add to PanelContainer**

In `src/features/station/PanelContainer.jsx`:

Add import:
```js
import { FinancePanel } from '../finance/FinancePanel';
```

Add case to switch (before `default`):
```js
case 'finance':
  return <FinancePanel onClose={onClose} />;
```

**Step 3: Add Finance button to StationMenu**

In `src/features/station/StationMenu.jsx`, add a button in the `station-actions` div (after the Mission Board button is a good spot):

```jsx
<button className="station-btn" onClick={() => onOpenPanel('finance')}>
  Finance
</button>
```

**Step 4: Run full test suite to verify nothing breaks**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/features/finance/FinancePanel.jsx src/features/station/PanelContainer.jsx src/features/station/StationMenu.jsx
git commit -m "feat: add Finance panel to station menu with borrow and payment UI"
```

---

### Task 12: Finance Panel CSS

**Files:**
- Create: `css/panel/finance.css`
- Modify: CSS import (check how other panel CSS is imported — likely via `index.html` or a main CSS file)

**Step 1: Find CSS import pattern**

Check how other panel CSS files are imported (e.g., `css/panel/trade.css`). Look for `@import` statements or `<link>` tags in `index.html`.

**Step 2: Create finance.css**

Create `css/panel/finance.css` following the same pattern as `css/panel/refuel.css`:

```css
@import '../variables.css';

#finance-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--panel-width-small);
  padding: var(--panel-padding);
  background-color: var(--bg-panel);
  border: var(--panel-border-width) solid var(--border-primary);
  border-radius: var(--panel-border-radius);
  color: var(--color-white);
  font-size: var(--font-size-large);
  display: none;
  z-index: var(--z-panel);
}

#finance-panel.visible {
  display: block;
}

#finance-panel h2 {
  margin-bottom: var(--section-gap);
  color: var(--color-primary);
  font-size: var(--font-size-title);
  text-align: center;
}

#finance-panel h3 {
  margin-bottom: var(--grid-gap-medium);
  color: var(--color-primary);
  font-size: var(--font-size-xlarge);
  border-bottom: var(--section-border-width) solid rgba(0, 255, 136, 0.3);
  padding-bottom: 5px;
}

#finance-panel .close-btn {
  position: absolute;
  top: var(--close-button-top);
  right: var(--close-button-right);
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--close-button-size);
  cursor: pointer;
  padding: var(--close-button-padding);
  line-height: 1;
  transition: var(--transition-fast);
}

#finance-panel .close-btn:hover {
  color: var(--color-white);
}

.finance-content {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

.finance-section {
  background-color: var(--bg-section-primary);
  border: var(--section-border-width) solid rgba(0, 255, 136, 0.2);
  border-radius: var(--section-border-radius);
  padding: var(--section-padding);
}

.finance-section .info-row {
  display: flex;
  justify-content: space-between;
  margin: var(--grid-gap-small) 0;
}

.finance-section .label {
  color: var(--color-primary);
  font-weight: bold;
}

.finance-section .value {
  color: var(--color-white);
}

.finance-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.finance-buttons .station-btn {
  flex: 1;
  min-width: 80px;
}

.finance-warning {
  color: #ff6b6b;
  font-size: var(--font-size-small);
  margin-bottom: 10px;
  font-style: italic;
}

.borrow-btn {
  border-color: #ff6b6b !important;
  color: #ff6b6b !important;
}

.borrow-btn:hover {
  background-color: rgba(255, 107, 107, 0.2) !important;
}
```

**Step 3: Add import**

Add the CSS import in the same location/file as other panel CSS imports.

**Step 4: Verify visually**

Run: `npm run dev`
Navigate to a station, click Finance. Verify the panel renders correctly.

**Step 5: Commit**

```bash
git add css/panel/finance.css
git commit -m "feat: add Finance panel CSS styling"
```

---

### Task 13: Trade Receipt — Show Withholding

**Files:**
- Modify: `src/features/trade/TradePanel.jsx`

This task modifies the TradePanel to display Cole's withholding when a sale occurs. The exact implementation depends on how TradePanel currently shows sale results. Look for where `sellGood` results are displayed or where a success message appears after a sale, and add the withheld amount there.

**Step 1: Read the full TradePanel to find the sale result display**

Read `src/features/trade/TradePanel.jsx` completely to find where sale results are shown.

**Step 2: Modify the sale handler to capture and display withholding**

Where the sale result is processed, capture `result.withheld` and display it:

```jsx
// After sellGood returns:
if (result.withheld > 0) {
  // Show "Cole's cut: -₡{withheld}" in the sale feedback
}
```

The exact implementation depends on the current TradePanel UI pattern. Follow whatever notification/message pattern already exists.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/features/trade/TradePanel.jsx
git commit -m "feat: show Cole's withholding in trade sale feedback"
```

---

### Task 14: Save/Load Compatibility

**Files:**
- Modify: `src/game/state/managers/save-load.js` (or wherever save migration happens)
- Test: `tests/unit/debt-manager.test.js` (append)

**Step 1: Write failing test for loading old save without finance state**

```js
describe('Save/Load Compatibility', () => {
  it('initializes finance state when loading old save without it', () => {
    // Simulate loading an old save that lacks player.finance
    gsm.initNewGame();
    delete gsm.state.player.finance;

    // The system should gracefully handle missing finance state
    // by providing defaults when DebtManager methods are called
    const info = gsm.getDebtInfo();
    expect(info).toBeDefined();
    expect(info.debt).toBe(gsm.state.player.debt);
  });
});
```

**Step 2: Find save/load migration pattern**

Read `src/game/state/managers/save-load.js` to understand how the game handles loading old saves. There may be a migration or validation step.

**Step 3: Add finance state migration**

When loading a save that lacks `player.finance`, initialize it with defaults. This should happen in the save-load flow, or in `DebtManager.getFinance()` as a fallback:

```js
getFinance() {
  const state = this.getState();
  if (!state.player.finance) {
    state.player.finance = {
      heat: COLE_DEBT_CONFIG.STARTING_HEAT,
      lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
      interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
      lastInterestDay: 0,
      nextCheckpoint: state.player.daysElapsed + COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
      totalBorrowed: 0,
      totalRepaid: 0,
      borrowedThisPeriod: false,
      lastCheckpointRepaid: 0,
    };
  }
  return state.player.finance;
}
```

**Step 4: Run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "feat: add save/load compatibility for finance state migration"
```

---

### Task 15: Cole Favor Missions

**Files:**
- Create: `src/game/data/cole-missions.js`
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js` (append)

This task creates the mission templates for Cole's favor missions and integrates them with the checkpoint system.

**Step 1: Create cole-missions.js with mission templates**

```js
export const COLE_FAVOR_MISSIONS = [
  {
    id: 'cole_courier',
    type: 'delivery',
    source: 'cole',
    title: 'Sealed Package',
    description: 'Cole needs a sealed package delivered. No questions asked.',
    requirements: {
      deadline: 21,
      cargoSpace: 1,
    },
    missionCargo: {
      good: 'sealed_package',
      quantity: 1,
    },
    reward: 0,
    abandonable: false,
  },
  {
    id: 'cole_passenger',
    type: 'passenger',
    source: 'cole',
    title: 'Discreet Passenger',
    description: 'One of Cole\'s associates needs quiet transport.',
    requirements: {
      deadline: 14,
      cargoSpace: 5,
    },
    reward: 0,
    abandonable: false,
  },
  {
    id: 'cole_intimidation',
    type: 'delivery',
    source: 'cole',
    title: 'Show of Presence',
    description: 'Dock at the specified station. Your arrival is the message.',
    requirements: {
      deadline: 21,
      cargoSpace: 0,
    },
    reward: 0,
    abandonable: false,
  },
];
```

The destination system for each mission should be randomly selected from systems the player hasn't visited recently. Add a method to `DebtManager` to generate a Cole favor mission:

```js
generateFavorMission() {
  // Pick a random template, assign a random destination
  // Return a mission object compatible with MissionManager.acceptMission()
}
```

**Step 2: Write tests for favor mission generation**

```js
describe('generateFavorMission', () => {
  it('returns a mission with source cole and 0 reward', () => {
    const mission = debtManager.generateFavorMission();

    expect(mission).toBeDefined();
    expect(mission.source).toBe('cole');
    expect(mission.reward).toBe(0);
    expect(mission.abandonable).toBe(false);
  });

  it('assigns a valid destination system', () => {
    const mission = debtManager.generateFavorMission();

    expect(mission.requirements.destination).toBeDefined();
    expect(typeof mission.requirements.destination).toBe('number');
  });
});
```

**Step 3: Implement and run tests**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 4: Integrate favor missions with checkpoint resolution**

Modify the `checkCheckpoint` method to return the generated mission when `requiresFavor` is true:

```js
if (requiresFavor) {
  result.favorMission = this.generateFavorMission();
}
```

The UI layer (Finance panel or a checkpoint narrative event) is responsible for calling `acceptMission` with the returned mission.

**Step 5: Update MissionManager to prevent abandoning Cole missions**

In `src/game/state/managers/mission.js`, in the `abandonMission` method, check for `source: 'cole'`:

```js
if (mission.abandonable === false) {
  return { success: false, reason: 'This mission cannot be abandoned.' };
}
```

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/game/data/cole-missions.js src/game/state/managers/debt.js src/game/state/managers/mission.js tests/unit/debt-manager.test.js
git commit -m "feat: add Cole favor missions with checkpoint integration"
```

---

### Task 16: Cole Dialogue — Heat-Conditional Branches

**Files:**
- Modify: `src/game/data/dialogue/marcus-cole.js`

This task expands Cole's dialogue tree with heat-dependent responses. Read the existing dialogue file completely before making changes.

**Step 1: Read the existing Marcus Cole dialogue**

Read `src/game/data/dialogue/marcus-cole.js` to understand the current tree structure and style.

**Step 2: Add heat-conditional dialogue branches**

The dialogue system needs to check the current heat tier to select appropriate responses. Look at how other dialogues use conditions/flags.

Add greeting variants for each heat tier:
- **Low heat:** Professional, brief. Financial tips.
- **Medium heat:** Curt. Mentions "pattern" of behavior.
- **High heat:** Threatening. References consequences.
- **Critical heat:** Cold fury. Mandatory mission delivery.

The exact implementation depends on how the dialogue tree system handles conditional branching. Follow existing patterns.

**Step 3: Test manually (dialogue trees are hard to unit test)**

Run: `npm run dev`
Visit Sol, talk to Cole, verify dialogue changes based on heat state.

**Step 4: Commit**

```bash
git add src/game/data/dialogue/marcus-cole.js
git commit -m "feat: add heat-conditional dialogue branches for Marcus Cole"
```

---

### Task 17: Property Tests

**Files:**
- Create: `tests/property/cole-debt.property.test.js`

**Step 1: Write property tests for debt system invariants**

```js
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DebtManager } from '../../src/game/state/managers/debt.js';
import { COLE_DEBT_CONFIG } from '../../src/game/constants.js';

vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Cole Debt System Properties', () => {
  it('heat is always clamped to 0-100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -200, max: 200 }),
        (delta) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          const dm = new DebtManager(gsm);

          dm.updateHeat(delta);

          const heat = gsm.state.player.finance.heat;
          return heat >= 0 && heat <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('withholding never exceeds debt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 0, max: 100 }),
        (revenue, debt, heat) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          gsm.state.player.debt = debt;
          gsm.state.player.finance.heat = Math.min(heat, 100);
          const dm = new DebtManager(gsm);

          const { withheld } = dm.calculateWithholding(revenue);

          return withheld <= debt && withheld >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('payment never makes debt negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000 }),
        fc.integer({ min: 1, max: 100000 }),
        (payment, initialDebt) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          gsm.state.player.debt = initialDebt;
          gsm.state.player.credits = payment;
          const dm = new DebtManager(gsm);

          dm.makePayment(payment);

          return gsm.state.player.debt >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('borrowing always increases debt', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 200 }),
        (amount) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          const initialDebt = gsm.state.player.debt;
          const dm = new DebtManager(gsm);

          const result = dm.borrow(amount);

          return !result.success || gsm.state.player.debt > initialDebt;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Step 2: Run property tests**

Run: `npm test -- tests/property/cole-debt.property.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/property/cole-debt.property.test.js
git commit -m "test: add property tests for Cole debt system invariants"
```

---

### Task 18: Final Integration Test and Full Suite

**Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass with zero stderr warnings

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 3: Run format check**

Run: `npm run format:check`
Expected: PASS (or run `npm run format:write` to fix)

**Step 4: Manual UAT**

Run: `npm run dev`
Test the following scenarios:
- Open Finance panel at any station
- Borrow ₡100 — verify debt increases, credits increase
- Sell cargo — verify "Cole's cut" appears in trade feedback
- Make voluntary payment — verify debt decreases
- Advance time (dev tools) to trigger interest
- Advance time past checkpoint — verify checkpoint fires
- Borrow repeatedly to push heat up — verify lien rate increases

**Step 5: Final commit if any fixes needed**

```bash
git commit -m "fix: address integration test issues from UAT"
```
