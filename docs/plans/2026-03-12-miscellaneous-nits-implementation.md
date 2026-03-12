# Miscellaneous Nits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 4 gameplay fixes/features: orbit-only visit tracking, Cole early repayment fee, Tanaka quest in mission system, and star finder dropdown.

**Architecture:** Each item is independent — they touch different managers, components, and constants. Tasks are ordered so earlier items don't create merge conflicts with later ones. All changes follow the Bridge Pattern (game state → event emission → React hook → UI re-render).

**Tech Stack:** React 18, Vitest, ES Modules, Three.js (star finder only)

---

### Task 1: Add orbit source constant and early repayment constants

**Files:**
- Modify: `src/game/constants.js`

**Step 1: Write the failing test**

Create `tests/unit/orbit-visit-tracking.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { INTELLIGENCE_CONFIG, COLE_DEBT_CONFIG } from '@game/constants.js';

describe('Orbit visit tracking constants', () => {
  it('should define ORBIT source identifier', () => {
    expect(INTELLIGENCE_CONFIG.SOURCES.ORBIT).toBe('orbit');
    expect(INTELLIGENCE_CONFIG.SOURCES.VISITED).toBe('visited');
    expect(INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER).toBe('intelligence_broker');
  });
});

describe('Cole early repayment constants', () => {
  it('should define early repayment fee rate', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE).toBe(0.10);
  });

  it('should define early repayment window in days', () => {
    expect(COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS).toBe(20);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: FAIL — `INTELLIGENCE_CONFIG.SOURCES` is undefined, `COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE` is undefined

**Step 3: Write minimal implementation**

In `src/game/constants.js`, add to `INTELLIGENCE_CONFIG` (after the `RELIABILITY` block around line 88):

```javascript
  SOURCES: {
    ORBIT: 'orbit',
    VISITED: 'visited',
    INTELLIGENCE_BROKER: 'intelligence_broker',
  },
```

In `src/game/constants.js`, add to `COLE_DEBT_CONFIG` (after `STARTING_CHECKPOINT_DAY: 30,` around line 543):

```javascript
  // Early repayment fee
  EARLY_REPAYMENT_FEE_RATE: 0.10,     // 10% surcharge
  EARLY_REPAYMENT_WINDOW_DAYS: 20,    // Days after borrowing
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: PASS

**Step 5: Commit**

```
git add tests/unit/orbit-visit-tracking.test.js src/game/constants.js
git commit -m "Add orbit source and early repayment constants"
```

---

### Task 2: Track orbit-only visits in NavigationManager

When a player jumps to a system, create a `priceKnowledge` entry with `source: 'orbit'` and `prices: null` — but only if no entry already exists (don't overwrite dock or intel data).

**Files:**
- Modify: `src/game/state/managers/navigation.js`
- Test: `tests/unit/orbit-visit-tracking.test.js`

**Step 1: Write the failing test**

Append to `tests/unit/orbit-visit-tracking.test.js`:

```javascript
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SOL_SYSTEM_ID } from '@game/constants.js';

describe('NavigationManager orbit tracking', () => {
  let game;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  it('should create orbit priceKnowledge entry on jump to unvisited system', () => {
    // Sol already has priceKnowledge from init. Find a connected system.
    const connectedSystems = navigationSystem.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    // Verify no priceKnowledge exists for target
    const pkBefore = game.getPriceKnowledge();
    expect(pkBefore[targetSystem]).toBeUndefined();

    // Jump to target (this calls updateLocation)
    game.jump(targetSystem);

    // Verify orbit entry was created
    const pkAfter = game.getPriceKnowledge();
    expect(pkAfter[targetSystem]).toBeDefined();
    expect(pkAfter[targetSystem].source).toBe('orbit');
    expect(pkAfter[targetSystem].prices).toBeNull();
    expect(pkAfter[targetSystem].lastVisit).toBe(0);
  });

  it('should NOT overwrite existing priceKnowledge on jump', () => {
    const connectedSystems = navigationSystem.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    // First jump and dock to create a 'visited' entry
    game.jump(targetSystem);
    game.dock();
    const pkAfterDock = game.getPriceKnowledge();
    expect(pkAfterDock[targetSystem].source).toBe('visited');

    // Jump away and back
    game.jump(SOL_SYSTEM_ID);
    game.jump(targetSystem);

    // Should still have 'visited' source, not overwritten to 'orbit'
    const pkAfterReturn = game.getPriceKnowledge();
    expect(pkAfterReturn[targetSystem].source).toBe('visited');
  });

  it('should NOT overwrite intelligence_broker data on jump', () => {
    const connectedSystems = navigationSystem.getConnectedSystems(SOL_SYSTEM_ID);
    const targetSystem = connectedSystems[0];

    // Purchase intelligence for target system
    game.purchaseIntelligence(targetSystem);
    const pkAfterIntel = game.getPriceKnowledge();
    expect(pkAfterIntel[targetSystem].source).toBe('intelligence_broker');

    // Jump to target
    game.jump(targetSystem);

    // Should still have intel source
    const pkAfterJump = game.getPriceKnowledge();
    expect(pkAfterJump[targetSystem].source).toBe('intelligence_broker');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: FAIL — orbit entry not created on jump

**Step 3: Write minimal implementation**

In `src/game/state/managers/navigation.js`, in the `updateLocation` method, after the `visitedSystems.push` block (around line 35) and before the price snapshot, add:

```javascript
    // Create orbit-only priceKnowledge entry if none exists
    // This ensures the Info Broker shows "Visited but never docked" instead of "Never visited"
    const priceKnowledge = this.capabilities.getPriceKnowledge();
    if (!priceKnowledge[newSystemId]) {
      this.capabilities.updatePriceKnowledge(newSystemId, null, 0, 'orbit');
    }
```

This requires `getPriceKnowledge` to be available in navigation capabilities. Check if it exists already; if not, it needs to be added to the capabilities object in `game-coordinator.js`.

In `src/game/state/game-coordinator.js`, find the navigation capabilities block and add `getPriceKnowledge` if missing:

```javascript
getPriceKnowledge: () => this.state.world.priceKnowledge,
```

The `updatePriceKnowledge` method in `TradingManager` currently does `prices: { ...prices }`. We need to handle `null` prices:

In `src/game/state/managers/trading.js`, modify `updatePriceKnowledge` (line 278-291):

Change `prices: { ...prices }` to `prices: prices ? { ...prices } : null`.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. The `null` prices change may affect `validateStateStructure` in `state-validators.js` — check line 350 which validates `typeof knowledge.prices !== 'object'`. Since `typeof null === 'object'`, this check passes, so no validator changes needed.

**Step 6: Commit**

```
git add src/game/state/managers/navigation.js src/game/state/managers/trading.js src/game/state/game-coordinator.js tests/unit/orbit-visit-tracking.test.js
git commit -m "Track orbit-only visits in priceKnowledge on jump"
```

---

### Task 3: Update Info Broker display for orbit-only entries

**Files:**
- Modify: `src/features/info-broker/infoBrokerUtils.js`
- Modify: `src/game/game-information-broker.js`
- Test: `tests/unit/orbit-visit-tracking.test.js`

**Step 1: Write the failing test**

Append to `tests/unit/orbit-visit-tracking.test.js`:

```javascript
import {
  formatVisitInfo,
  formatSource,
  getKnownSystemsSortedByStaleness,
} from '../../src/features/info-broker/infoBrokerUtils.js';
import { InformationBroker } from '@game/game-information-broker.js';

describe('Info Broker display for orbit-only entries', () => {
  it('formatVisitInfo should return "Visited but never docked" for orbit source', () => {
    expect(formatVisitInfo(5, 'orbit')).toBe('Visited but never docked');
    expect(formatVisitInfo(0, 'orbit')).toBe('Visited but never docked');
  });

  it('formatVisitInfo should behave normally for non-orbit sources', () => {
    expect(formatVisitInfo(null)).toBe('Never visited');
    expect(formatVisitInfo(0)).toBe('Current prices');
    expect(formatVisitInfo(5)).toBe('Last visited 5 days ago');
    expect(formatVisitInfo(1)).toBe('Last visited 1 day ago');
  });

  it('formatSource should handle orbit source', () => {
    expect(formatSource('orbit')).toBe('Orbit only');
  });

  it('getIntelligenceCost should treat orbit-only as never-visited pricing', () => {
    const priceKnowledge = {
      5: { lastVisit: 3, prices: null, source: 'orbit' },
    };
    const cost = InformationBroker.getIntelligenceCost(5, priceKnowledge);
    expect(cost).toBe(100); // NEVER_VISITED price
  });

  it('getKnownSystemsSortedByStaleness should exclude orbit-only entries (no prices)', () => {
    const starData = [
      { id: 0, name: 'Sol' },
      { id: 5, name: 'Wolf 359' },
    ];
    const priceKnowledge = {
      0: { lastVisit: 0, prices: { grain: 10 }, source: 'visited' },
      5: { lastVisit: 3, prices: null, source: 'orbit' },
    };
    const result = getKnownSystemsSortedByStaleness(priceKnowledge, starData);
    expect(result).toHaveLength(1);
    expect(result[0].system.id).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

In `src/features/info-broker/infoBrokerUtils.js`:

Modify `formatVisitInfo` (line 129) to accept an optional `source` parameter:

```javascript
export function formatVisitInfo(lastVisit, source) {
  if (source === 'orbit') {
    return 'Visited but never docked';
  }
  if (lastVisit === null) {
    return 'Never visited';
  } else if (lastVisit === 0) {
    return 'Current prices';
  } else if (lastVisit === 1) {
    return 'Last visited 1 day ago';
  } else {
    return `Last visited ${lastVisit} days ago`;
  }
}
```

Modify `formatSource` (line 89) to handle 'orbit':

```javascript
export function formatSource(source) {
  if (source === 'visited') {
    return 'Visited';
  } else if (source === 'intelligence_broker') {
    return 'Information Broker';
  } else if (source === 'orbit') {
    return 'Orbit only';
  } else {
    return 'Unknown';
  }
}
```

Modify `getKnownSystemsSortedByStaleness` to filter out entries with null prices (line 161+):

Add a filter before the sort:

```javascript
const knownSystemIds = Object.keys(priceKnowledge)
  .map(Number)
  .filter((id) => priceKnowledge[id].prices !== null);
```

In `src/game/game-information-broker.js`, modify `getIntelligenceCost` (line 24) to treat orbit-only as never-visited:

```javascript
static getIntelligenceCost(systemId, priceKnowledge) {
  const knowledge = priceKnowledge[systemId];

  // Never visited or orbit-only (no price data)
  if (!knowledge || knowledge.source === 'orbit') {
    return INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED;
  }

  // Recently visited (within threshold)
  if (knowledge.lastVisit <= INTELLIGENCE_CONFIG.RECENT_THRESHOLD) {
    return INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT;
  }

  // Stale visit (beyond threshold)
  return INTELLIGENCE_CONFIG.PRICES.STALE_VISIT;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/orbit-visit-tracking.test.js`
Expected: PASS

**Step 5: Update InfoBrokerPanel to pass source to formatVisitInfo**

In `src/game/game-information-broker.js`, in `listAvailableIntelligence` (line 266+), add `source` to the returned object:

```javascript
const result = {
  systemId: system.id,
  systemName: system.name,
  cost: cost,
  lastVisit: lastVisit,
  source: knowledge ? knowledge.source : null,
};
```

In `src/features/info-broker/InfoBrokerPanel.jsx`, in `renderIntelligenceItem` (line 192), pass source:

```javascript
<div className="intelligence-visit-info">
  {formatVisitInfo(option.lastVisit, option.source)}
</div>
```

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```
git add src/features/info-broker/infoBrokerUtils.js src/game/game-information-broker.js src/features/info-broker/InfoBrokerPanel.jsx tests/unit/orbit-visit-tracking.test.js
git commit -m "Display 'Visited but never docked' for orbit-only systems"
```

---

### Task 4: Cole early repayment fee — track lastBorrowDay

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Modify: `src/game/state/state-validators.js`
- Test: `tests/unit/debt-manager.test.js`

**Step 1: Write the failing test**

Add a new describe block to `tests/unit/debt-manager.test.js`:

```javascript
describe('Early repayment fee', () => {
  let debtManager;

  beforeEach(() => {
    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    debtManager = new DebtManager(buildDebtCapabilities(gsm));
  });

  it('should track lastBorrowDay when borrowing', () => {
    gsm.state.player.daysElapsed = 10;
    debtManager.borrow(200);
    const finance = debtManager.getFinance();
    expect(finance.lastBorrowDay).toBe(10);
  });

  it('should update lastBorrowDay on each borrow', () => {
    gsm.state.player.daysElapsed = 5;
    debtManager.borrow(200);
    gsm.state.player.daysElapsed = 15;
    debtManager.borrow(200);
    const finance = debtManager.getFinance();
    expect(finance.lastBorrowDay).toBe(15);
  });

  it('should initialize lastBorrowDay to null', () => {
    const finance = debtManager.getFinance();
    expect(finance.lastBorrowDay).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — `lastBorrowDay` is undefined

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, in `getFinance()` (line 11-31), add `lastBorrowDay: null` to the default `financeObj`:

```javascript
lastBorrowDay: null,
```

In `borrow()` method (around line 179), add after `finance.borrowedThisPeriod = true;`:

```javascript
finance.lastBorrowDay = daysElapsed;
```

In `src/game/state/state-validators.js`, in `addStateDefaults`, after the finance initialization block, add migration for existing saves:

After the `state.missions` block (around line 868), or better, check if `player.finance` exists and add `lastBorrowDay` if missing. This is handled automatically by `getFinance()` initializing with `lastBorrowDay: null` for new games, and existing saves that already have a `finance` object will need `lastBorrowDay` added. Add to `addStateDefaults`:

```javascript
// Add lastBorrowDay to finance if missing (pre-early-repayment-fee saves)
if (state.player.finance && state.player.finance.lastBorrowDay === undefined) {
  state.player.finance.lastBorrowDay = null;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/state/managers/debt.js src/game/state/state-validators.js tests/unit/debt-manager.test.js
git commit -m "Track lastBorrowDay in finance state for early repayment fee"
```

---

### Task 5: Cole early repayment fee — apply fee in makePayment

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Test: `tests/unit/debt-manager.test.js`

**Step 1: Write the failing test**

Add to the 'Early repayment fee' describe block:

```javascript
  it('should charge 10% fee when repaying within 20 days of borrowing', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.daysElapsed = 10;
    debtManager.borrow(1000);

    // Still within 20-day window (day 10 + 20 = day 30)
    gsm.state.player.daysElapsed = 25;
    const creditsBefore = gsm.state.player.credits;
    const debtBefore = gsm.state.player.debt;

    const result = debtManager.makePayment(500);
    expect(result.success).toBe(true);

    // Fee = ceil(500 * 0.10) = 50
    // Total deducted from credits: 500 + 50 = 550
    expect(gsm.state.player.credits).toBe(creditsBefore - 550);
    // Debt reduced by payment amount only (fee goes to Cole)
    expect(gsm.state.player.debt).toBe(debtBefore - 500);
    expect(result.fee).toBe(50);
  });

  it('should NOT charge fee when repaying after 20 days', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.daysElapsed = 10;
    debtManager.borrow(1000);

    // Outside 20-day window (day 10 + 20 = day 30, we're at day 31)
    gsm.state.player.daysElapsed = 31;
    const creditsBefore = gsm.state.player.credits;

    const result = debtManager.makePayment(500);
    expect(result.success).toBe(true);

    // No fee — only payment deducted
    expect(gsm.state.player.credits).toBe(creditsBefore - 500);
    expect(result.fee).toBe(0);
  });

  it('should NOT charge fee when lastBorrowDay is null (starting debt)', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.daysElapsed = 5;

    const creditsBefore = gsm.state.player.credits;
    const result = debtManager.makePayment(500);
    expect(result.success).toBe(true);
    expect(gsm.state.player.credits).toBe(creditsBefore - 500);
    expect(result.fee).toBe(0);
  });

  it('should fail payment if credits insufficient for payment plus fee', () => {
    gsm.state.player.credits = 5000;
    gsm.state.player.daysElapsed = 10;
    debtManager.borrow(1000);

    // Set credits to exactly the payment amount (can't cover fee)
    gsm.state.player.credits = 500;
    gsm.state.player.daysElapsed = 15;

    const result = debtManager.makePayment(500);
    // Should reduce payment so total (payment + fee) fits in credits
    // Max payment where payment + ceil(payment * 0.1) <= 500:
    // payment + ceil(payment * 0.1) <= 500
    // For payment=454: 454 + ceil(45.4) = 454 + 46 = 500 ✓
    expect(result.success).toBe(true);
    expect(gsm.state.player.credits).toBe(0);
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: FAIL — no fee applied

**Step 3: Write minimal implementation**

In `src/game/state/managers/debt.js`, modify `makePayment()` (line 192+):

Add early repayment fee calculation after the `actualPayment` calculation (line 201) and before the credits check (line 209):

```javascript
  makePayment(amount) {
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) {
      return { success: false, reason: 'No outstanding debt' };
    }

    let actualPayment = Math.min(amount, debt);

    if (actualPayment <= 0) {
      return { success: false, reason: 'Invalid payment amount' };
    }

    const credits = this.capabilities.getCredits();
    const daysElapsed = this.capabilities.getDaysElapsed();

    // Calculate early repayment fee
    let fee = 0;
    if (
      finance.lastBorrowDay !== null &&
      daysElapsed - finance.lastBorrowDay < COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS
    ) {
      fee = Math.ceil(actualPayment * COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE);
    }

    const totalCost = actualPayment + fee;

    // If can't afford payment + fee, reduce payment to fit
    if (credits < totalCost) {
      // Find max payment where payment + ceil(payment * rate) <= credits
      if (fee > 0) {
        actualPayment = Math.floor(credits / (1 + COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE));
        actualPayment = Math.min(actualPayment, debt);
        if (actualPayment <= 0) {
          return { success: false, reason: 'Insufficient credits' };
        }
        fee = Math.ceil(actualPayment * COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE);
      } else {
        if (credits < actualPayment) {
          return { success: false, reason: 'Insufficient credits' };
        }
      }
    }

    this.capabilities.updateDebt(debt - actualPayment);
    this.capabilities.updateCredits(credits - actualPayment - fee);

    // ... rest of the method unchanged ...
```

The `return` object at the end should include `fee`:

```javascript
    return { success: true, amount: actualPayment, fee };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/debt-manager.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. Existing debt tests should still pass since they don't borrow (starting debt has `lastBorrowDay: null`, so no fee applies).

**Step 6: Commit**

```
git add src/game/state/managers/debt.js tests/unit/debt-manager.test.js
git commit -m "Apply 10% early repayment fee within 20-day borrow window"
```

---

### Task 6: Update FinancePanel to show early repayment fee

**Files:**
- Modify: `src/features/finance/FinancePanel.jsx`
- Modify: `src/game/state/managers/debt.js` (getDebtInfo)

**Step 1: Update getDebtInfo to include fee info**

In `src/game/state/managers/debt.js`, modify `getDebtInfo()` (line 335+) to include early repayment fee info:

```javascript
  getDebtInfo() {
    const finance = this.getFinance();
    const debt = this.getDebt();
    const credits = this.capabilities.getCredits();
    const daysElapsed = this.capabilities.getDaysElapsed();

    const isEarlyRepayment =
      finance.lastBorrowDay !== null &&
      daysElapsed - finance.lastBorrowDay < COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS;

    return {
      debt,
      lienRate: this.getLienRate(),
      interestRate: this.getInterestRate(),
      nextInterestDay:
        finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS,
      maxDraw: this.getMaxDraw(),
      availableDrawTiers: this.getAvailableDrawTiers(),
      canPay: debt > 0 && credits > 0,
      totalBorrowed: finance.totalBorrowed,
      totalRepaid: finance.totalRepaid,
      nextCheckpoint: finance.nextCheckpoint,
      earlyRepaymentFeeRate: isEarlyRepayment ? COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE : 0,
    };
  }
```

**Step 2: Update FinancePanel to show fee in payment buttons**

In `src/features/finance/FinancePanel.jsx`, update the payment buttons section (line 96-122):

```javascript
        {debtInfo.debt > 0 && (
          <div className="finance-section">
            <h3>Make Payment</h3>
            {debtInfo.earlyRepaymentFeeRate > 0 && (
              <p className="finance-warning">
                Early repayment: {Math.round(debtInfo.earlyRepaymentFeeRate * 100)}% processing fee applies.
              </p>
            )}
            <div className="finance-buttons">
              {COLE_DEBT_CONFIG.PAYMENT_TIERS.map((amount) => {
                const payAmount = Math.min(amount, debtInfo.debt);
                const fee = debtInfo.earlyRepaymentFeeRate > 0
                  ? Math.ceil(payAmount * debtInfo.earlyRepaymentFeeRate)
                  : 0;
                return (
                  <button
                    key={amount}
                    className="station-btn"
                    disabled={credits < payAmount + fee || debtInfo.debt === 0}
                    onClick={() => handlePayment(payAmount)}
                  >
                    Pay ₡{amount}{fee > 0 ? ` (+₡${fee} fee)` : ''}
                  </button>
                );
              })}
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
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```
git add src/game/state/managers/debt.js src/features/finance/FinancePanel.jsx
git commit -m "Show early repayment fee in Finance panel payment buttons"
```

---

### Task 7: Tanaka quest — add mission slot counting

Make the mission acceptance logic count an active Tanaka quest as occupying one mission slot.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/managers/quest-manager.js`
- Test: `tests/unit/tanaka-mission-slot.test.js` (new)

**Step 1: Write the failing test**

Create `tests/unit/tanaka-mission-slot.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { MISSION_CONFIG } from '@game/constants.js';

describe('Tanaka quest mission slot', () => {
  let game;
  let navigationSystem;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isTanakaQuestActive should return false when quest not started', () => {
    expect(game.isTanakaQuestActive()).toBe(false);
  });

  it('isTanakaQuestActive should return true when quest is at stage 1+', () => {
    // Manually set quest stage to 1 for testing
    const state = game.getState();
    state.quests.tanaka = { stage: 1, data: { _rewardsClaimedStage: 0 }, startedDay: 0, completedDay: null };
    expect(game.isTanakaQuestActive()).toBe(true);
  });

  it('isTanakaQuestActive should return false when stage 5 rewards claimed', () => {
    const state = game.getState();
    state.quests.tanaka = { stage: 5, data: { _rewardsClaimedStage: 5 }, startedDay: 0, completedDay: null };
    expect(game.isTanakaQuestActive()).toBe(false);
  });

  it('should count Tanaka quest as occupying a mission slot', () => {
    expect(game.getEffectiveMissionCount()).toBe(0);

    // Start Tanaka quest
    const state = game.getState();
    state.quests.tanaka = { stage: 1, data: { _rewardsClaimedStage: 0 }, startedDay: 0, completedDay: null };
    expect(game.getEffectiveMissionCount()).toBe(1);
  });

  it('should reject mission acceptance when Tanaka + regular missions fill all slots', () => {
    const state = game.getState();
    // Tanaka quest active = 1 slot used
    state.quests.tanaka = { stage: 1, data: { _rewardsClaimedStage: 0 }, startedDay: 0, completedDay: null };

    // Add 2 regular missions (fills remaining 2 of 3 slots)
    state.missions.active = [
      { id: 'test1', type: 'delivery', title: 'Test 1', requirements: { deadline: 10, destination: 5 }, destination: { systemId: 5, name: 'Wolf 359' }, rewards: { credits: 100 } },
      { id: 'test2', type: 'delivery', title: 'Test 2', requirements: { deadline: 10, destination: 5 }, destination: { systemId: 5, name: 'Wolf 359' }, rewards: { credits: 100 } },
    ];

    // Try to accept a 3rd regular mission — should fail
    const result = game.acceptMission({
      id: 'test3', type: 'delivery', title: 'Test 3',
      requirements: { deadline: 10, destination: 5 },
      destination: { systemId: 5, name: 'Wolf 359' },
      rewards: { credits: 100 },
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tanaka-mission-slot.test.js`
Expected: FAIL — `isTanakaQuestActive` and `getEffectiveMissionCount` don't exist

**Step 3: Write minimal implementation**

In `src/game/state/managers/quest-manager.js`, add a new method:

```javascript
  isTanakaQuestActive() {
    const questState = this.getQuestState('tanaka');
    if (!questState || questState.stage === 0) return false;
    // Active until stage 5 rewards are claimed
    if ((questState.data._rewardsClaimedStage || 0) >= 5) return false;
    return true;
  }
```

In `src/game/state/game-coordinator.js`, add delegation methods:

```javascript
  isTanakaQuestActive() {
    return this.questManager.isTanakaQuestActive();
  }

  getEffectiveMissionCount() {
    const regularCount = this.state.missions.active.length;
    const tanakaSlot = this.isTanakaQuestActive() ? 1 : 0;
    return regularCount + tanakaSlot;
  }
```

In `src/game/state/managers/mission.js`, modify `acceptMission()` (line 20) to use effective count:

Change:
```javascript
if (missions.active.length >= MISSION_CONFIG.MAX_ACTIVE) {
```
To:
```javascript
const effectiveCount = missions.active.length + (this.capabilities.isTanakaQuestActive() ? 1 : 0);
if (effectiveCount >= MISSION_CONFIG.MAX_ACTIVE) {
```

Add `isTanakaQuestActive` to mission capabilities in `game-coordinator.js`:

```javascript
isTanakaQuestActive: () => this.questManager.isTanakaQuestActive(),
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tanaka-mission-slot.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/game/state/managers/quest-manager.js src/game/state/managers/mission.js src/game/state/game-coordinator.js tests/unit/tanaka-mission-slot.test.js
git commit -m "Count active Tanaka quest as occupying a mission slot"
```

---

### Task 8: Tanaka quest — display in ActiveMissions HUD

Show the Tanaka quest as a visually distinct entry in the active missions list with stage-specific progress.

**Files:**
- Modify: `src/features/hud/ActiveMissions.jsx`
- Modify: `src/game/state/game-coordinator.js` (expose quest data helper)

**Step 1: Add a helper to get Tanaka mission display data**

In `src/game/state/game-coordinator.js`, add:

```javascript
  getTanakaMissionDisplay() {
    if (!this.isTanakaQuestActive()) return null;
    const questState = this.questManager.getQuestState('tanaka');
    const questDef = this.questManager.getQuestDefinition('tanaka');
    if (!questState || !questDef) return null;

    const stageDef = questDef.stages.find((s) => s.stage === questState.stage);
    const stageName = stageDef ? stageDef.name : 'Unknown';

    let progress = null;
    if (questState.stage === 1) {
      progress = `${questState.data.jumpsCompleted || 0}/3 jumps`;
    } else if (questState.stage === 2) {
      progress = `${questState.data.exoticMaterials || 0}/5 samples`;
    } else if (questState.stage === 4) {
      progress = questState.data.messageDelivered ? 'Delivered' : 'In progress';
    }

    return {
      title: `Tanaka: ${stageName}`,
      progress,
      stage: questState.stage,
    };
  }
```

**Step 2: Update ActiveMissions component**

In `src/features/hud/ActiveMissions.jsx`:

Add imports:
```javascript
import { useGame } from '../../context/GameContext';
import { useGameEvent as useQuestEvent } from '../../hooks/useGameEvent';
```

Inside the component, add:
```javascript
const game = useGame();
const questState = useGameEvent(EVENT_NAMES.QUEST_CHANGED);
const tanakaMission = game.getTanakaMissionDisplay();
```

Before the regular missions map, render the Tanaka entry if active:

```javascript
{tanakaMission && (
  <div className="mission-hud-item quest-mission">
    <div className="mission-hud-title">{tanakaMission.title}</div>
    {tanakaMission.progress && (
      <div className="mission-hud-cargo">{tanakaMission.progress}</div>
    )}
    <div className="mission-hud-deadline">Ongoing</div>
  </div>
)}
```

No abandon button for quest missions.

The `quest-mission` CSS class provides visual distinction. Add to the existing CSS file for active missions (find the relevant CSS file):

```css
.mission-hud-item.quest-mission {
  border-left: 3px solid #ffd700;
}
```

**Step 3: Update the guard clause**

The component currently returns `null` if `!missions?.active?.length`. This needs to also check for Tanaka quest:

Change:
```javascript
if (!missions?.active?.length) return null;
```
To:
```javascript
if (!missions?.active?.length && !tanakaMission) return null;
```

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add src/features/hud/ActiveMissions.jsx src/game/state/game-coordinator.js
git commit -m "Display Tanaka quest in active missions HUD with stage progress"
```

---

### Task 9: Update MissionBoardPanel to show effective slot count

**Files:**
- Modify: `src/features/missions/MissionBoardPanel.jsx`

**Step 1: Update disabled reason logic**

In `src/features/missions/MissionBoardPanel.jsx`, the `disabledReasons` useMemo (line 47) currently checks `missions.active?.length`. Update to use effective count:

```javascript
const activeCount = game.getEffectiveMissionCount();
```

Replace the existing `const activeCount = missions.active?.length ?? 0;` line.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```
git add src/features/missions/MissionBoardPanel.jsx
git commit -m "Use effective mission count (including Tanaka) on mission board"
```

---

### Task 10: Star finder dropdown

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx`
- Modify: `src/game/constants.js` (add `calculateDistanceFromSol` to exports if needed — already exported)

**Step 1: Write the failing test**

Create `tests/unit/star-finder.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { calculateDistanceFromSol } from '@game/constants.js';

describe('Star finder sorting', () => {
  it('should sort stars by distance from Sol', () => {
    const sorted = [...STAR_DATA].sort(
      (a, b) => calculateDistanceFromSol(a) - calculateDistanceFromSol(b)
    );
    expect(sorted[0].name).toBe('Sol');
    expect(calculateDistanceFromSol(sorted[0])).toBe(0);
    // Each subsequent star should be >= previous distance
    for (let i = 1; i < sorted.length; i++) {
      expect(calculateDistanceFromSol(sorted[i])).toBeGreaterThanOrEqual(
        calculateDistanceFromSol(sorted[i - 1])
      );
    }
  });

  it('Sol should have distance 0', () => {
    const sol = STAR_DATA.find((s) => s.id === 0);
    expect(calculateDistanceFromSol(sol)).toBe(0);
  });
});
```

**Step 2: Run test to verify it passes** (this is a validation test, should pass immediately)

Run: `npm test -- tests/unit/star-finder.test.js`
Expected: PASS

**Step 3: Implement the dropdown in CameraControls**

In `src/features/navigation/CameraControls.jsx`, add imports:

```javascript
import { useStarmap } from '../../context/StarmapContext';
import { useStarData } from '../../hooks/useStarData';
import { calculateDistanceFromSol } from '../../game/constants';
```

Add inside the component function:

```javascript
const { selectStarById } = useStarmap();
const starData = useStarData();
const visitedSystems = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
```

Need to also get `visitedSystems` from game state. Add:

```javascript
const gameState = game.getState();
const visitedSet = new Set(gameState?.world?.visitedSystems || []);
```

Create sorted star list (memoize):

```javascript
import { useMemo } from 'react'; // already imported as useState
```

```javascript
const sortedStars = useMemo(() => {
  if (!starData) return [];
  return [...starData].sort(
    (a, b) => calculateDistanceFromSol(a) - calculateDistanceFromSol(b)
  );
}, [starData]);
```

Add the dropdown in the settings panel, after the Jump Warnings toggle and before the divider (around line 110):

```javascript
<div className="settings-divider" />

<div className="settings-star-finder">
  <span className="settings-label">Find Star</span>
  <select
    className="star-finder-select"
    onChange={(e) => {
      const systemId = parseInt(e.target.value, 10);
      if (!isNaN(systemId)) {
        selectStarById(systemId);
      }
    }}
    defaultValue=""
    aria-label="Find star system"
  >
    <option value="" disabled>
      -- Select --
    </option>
    {sortedStars.map((star) => {
      const visited = visitedSet.has(star.id);
      return (
        <option key={star.id} value={star.id}>
          {visited ? '✓ ' : '  '}{star.name}
        </option>
      );
    })}
  </select>
</div>
```

**Step 4: Add CSS styling**

Find the CSS file for camera controls. Search for existing `.camera-controls` or `#camera-controls` styles:

```css
.settings-star-finder {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}

.star-finder-select {
  background: rgba(0, 0, 0, 0.6);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  max-height: 200px;
}

.star-finder-select option {
  background: #1a1a2e;
  color: #e0e0e0;
}

.star-finder-select option.visited {
  color: #4ade80;
}
```

Note: HTML `<select>` `<option>` elements have very limited CSS styling. The checkmark character and color approach may vary by browser. The checkmark prefix in the option text is the accessible fallback.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/features/navigation/CameraControls.jsx tests/unit/star-finder.test.js
git commit -m "Add star finder dropdown to settings panel"
```

---

### Task 11: Final integration test and cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Run format check**

Run: `npm run format:check`
Expected: No formatting issues (or run `npm run format:write` to fix)

**Step 4: Build check**

Run: `npm run build`
Expected: Successful build with no errors

**Step 5: Final commit if any formatting changes**

```
git add -A
git commit -m "Format and lint cleanup"
```
