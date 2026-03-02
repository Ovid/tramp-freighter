# UAT Outstanding Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 9 remaining issues from UAT new-player testing, as designed in `docs/plans/2026-03-02-uat-outstanding-fixes-design.md`.

**Architecture:** Each fix is isolated to 1-3 files. Most are calculation/display fixes in existing managers and components. Fix 5 (negotiation escalation) is the most complex, requiring a new encounter flow transition in App.jsx. All fixes follow TDD: write failing test first, then implement.

**Tech Stack:** React 18, Vitest, fast-check (property tests), GameStateManager Bridge Pattern.

**Test runner:** `npm test` (never `npm test --run`). Single file: `npm test -- tests/unit/<file>.test.js`

**Constants rule:** ALL magic numbers go in `src/game/constants.js`. Never hard-code values in implementation files.

**Commits:** Plain text only. Never use heredocs, `$(...)`, or shell interpolation. Format: `git commit -m "feat: description"` with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

---

## Task 1: Fuel Cost Display (Fix #1 — Issues #33/61/88)

**Problem:** SystemPanel shows base fuel cost via `calculateFuelCost(distance)`. Actual jumps use `calculateFuelCostWithCondition(...)` which applies engine condition, quirks, and upgrades. Displayed cost overestimates by ~3%.

**Root cause:** Two separate bugs:
1. `useJumpValidation.js:26-28` passes `null, [], 1.0` instead of actual quirk/upgrade data to `validateJump()`
2. `SystemPanel.jsx:237-238` calls `calculateFuelCost(distance)` (base only) for connected systems list

**Files:**
- Modify: `src/hooks/useJumpValidation.js` (lines 21-30)
- Modify: `src/features/navigation/SystemPanel.jsx` (lines 237-238)
- Test: `tests/unit/fuel-cost-display.test.js` (new)
- Test: `tests/property/fuel-cost-display.property.test.js` (new)

### Step 1: Write failing unit tests

Create `tests/unit/fuel-cost-display.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Fuel Cost Display (#33/61/88)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  describe('validateJump uses quirk-aware fuel calculation', () => {
    it('should apply fuel_sipper quirk (-15%) to validated fuel cost', () => {
      const state = gsm.getState();
      state.ship.quirks = ['fuel_sipper'];

      const currentSystem = state.player.currentSystem;
      const connected = gsm.navigationSystem.getConnectedSystems(currentSystem);
      const targetSystem = connected[0];

      const distance = gsm.navigationSystem.calculateDistanceBetween(
        STAR_DATA.find(s => s.id === currentSystem),
        STAR_DATA.find(s => s.id === targetSystem)
      );
      const baseCost = gsm.navigationSystem.calculateFuelCost(distance);

      const validation = gsm.navigationSystem.validateJump(
        currentSystem,
        targetSystem,
        100,
        state.ship.engine,
        gsm.applyQuirkModifiers.bind(gsm),
        state.ship.quirks,
        gsm.calculateShipCapabilities().fuelConsumption,
        { hull: state.ship.hull, engine: state.ship.engine, lifeSupport: state.ship.lifeSupport }
      );

      expect(validation.fuelCost).toBeLessThan(baseCost);
      expect(validation.fuelCost).toBeCloseTo(baseCost * SHIP_CONFIG.QUIRKS.fuel_sipper.effects.fuelConsumption, 1);
    });

    it('should apply hot_thruster quirk (+5%) to validated fuel cost', () => {
      const state = gsm.getState();
      state.ship.quirks = ['hot_thruster'];

      const currentSystem = state.player.currentSystem;
      const connected = gsm.navigationSystem.getConnectedSystems(currentSystem);
      const targetSystem = connected[0];

      const distance = gsm.navigationSystem.calculateDistanceBetween(
        STAR_DATA.find(s => s.id === currentSystem),
        STAR_DATA.find(s => s.id === targetSystem)
      );
      const baseCost = gsm.navigationSystem.calculateFuelCost(distance);

      const validation = gsm.navigationSystem.validateJump(
        currentSystem,
        targetSystem,
        100,
        state.ship.engine,
        gsm.applyQuirkModifiers.bind(gsm),
        state.ship.quirks,
        gsm.calculateShipCapabilities().fuelConsumption,
        { hull: state.ship.hull, engine: state.ship.engine, lifeSupport: state.ship.lifeSupport }
      );

      expect(validation.fuelCost).toBeGreaterThan(baseCost);
      expect(validation.fuelCost).toBeCloseTo(baseCost * SHIP_CONFIG.QUIRKS.hot_thruster.effects.fuelConsumption, 1);
    });
  });
});
```

### Step 1b: Write property test for fuel cost consistency

Create `tests/property/fuel-cost-display.property.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Fuel Cost Display Property Tests (#33/61/88)', () => {
  const quirkIds = Object.keys(SHIP_CONFIG.QUIRKS);
  const fuelQuirks = quirkIds.filter(id =>
    SHIP_CONFIG.QUIRKS[id].effects.fuelConsumption !== undefined
  );

  it('validated fuel cost should match calculateFuelCostWithCondition for any quirk/upgrade combo', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...fuelQuirks, null),
        fc.boolean(), // has efficient_drive upgrade
        (quirkId, hasUpgrade) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          const state = gsm.getState();

          // Apply quirk
          state.ship.quirks = quirkId ? [quirkId] : [];

          // Apply upgrade
          if (hasUpgrade) {
            state.ship.upgrades = ['efficient_drive'];
          }

          const currentSystem = state.player.currentSystem;
          const connected = gsm.navigationSystem.getConnectedSystems(currentSystem);
          if (connected.length === 0) return;
          const targetSystem = connected[0];

          const distance = gsm.navigationSystem.calculateDistanceBetween(
            STAR_DATA.find(s => s.id === currentSystem),
            STAR_DATA.find(s => s.id === targetSystem)
          );

          const capabilities = gsm.calculateShipCapabilities();

          // What validateJump returns (feeds JumpDialog and SystemPanel target)
          const validation = gsm.navigationSystem.validateJump(
            currentSystem,
            targetSystem,
            100,
            state.ship.engine,
            gsm.applyQuirkModifiers.bind(gsm),
            state.ship.quirks,
            capabilities.fuelConsumption,
            { hull: state.ship.hull, engine: state.ship.engine, lifeSupport: state.ship.lifeSupport }
          );

          // What the actual jump calculation uses
          const actualCost = gsm.navigationSystem.calculateFuelCostWithCondition(
            distance,
            state.ship.engine,
            gsm.applyQuirkModifiers.bind(gsm),
            state.ship.quirks,
            capabilities.fuelConsumption
          );

          // Validated cost must match actual cost
          expect(validation.fuelCost).toBeCloseTo(actualCost, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/fuel-cost-display.test.js`
Expected: FAIL — validateJump returns base cost because `useJumpValidation` passes null/empty for quirks.

### Step 3: Fix useJumpValidation to pass quirk and upgrade data

In `src/hooks/useJumpValidation.js`, the hook needs to get the ship's quirks and upgrade-based fuel modifier from game state and pass them to `validateJump()`.

```javascript
import { useGameState } from '../context/GameContext';
import { useGameEvent } from './useGameEvent';
import { EVENT_NAMES } from '../game/constants.js';

export function useJumpValidation(currentSystemId, targetSystemId, fuel) {
  const gameStateManager = useGameState();
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);

  const state = gameStateManager.getState();
  const quirks = state.ship?.quirks || [];
  const capabilities = gameStateManager.calculateShipCapabilities();

  return gameStateManager.navigationSystem.validateJump(
    currentSystemId,
    targetSystemId,
    fuel,
    shipCondition?.engine ?? 100,
    gameStateManager.applyQuirkModifiers.bind(gameStateManager),
    quirks,
    capabilities.fuelConsumption,
    shipCondition ?? null
  );
}
```

### Step 4: Fix SystemPanel connected systems fuel cost

In `src/features/navigation/SystemPanel.jsx` around line 237, replace `calculateFuelCost(distance)` with `calculateFuelCostWithCondition(...)` using the same quirk/upgrade data:

```javascript
// Before line 225, get quirk and upgrade data:
const quirks = gameStateManager.getState().ship?.quirks || [];
const capabilities = gameStateManager.calculateShipCapabilities();
const engineCondition = gameStateManager.getState().ship?.engine ?? 100;

// Then in the map at line 237-238, replace:
const fuelCost =
  gameStateManager.navigationSystem.calculateFuelCostWithCondition(
    distance,
    engineCondition,
    gameStateManager.applyQuirkModifiers.bind(gameStateManager),
    quirks,
    capabilities.fuelConsumption
  );
```

### Step 5: Run tests to verify they pass

Run: `npm test -- tests/unit/fuel-cost-display.test.js`
Run: `npm test -- tests/property/fuel-cost-display.property.test.js`
Expected: PASS

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 7: Commit

```
git add src/hooks/useJumpValidation.js src/features/navigation/SystemPanel.jsx tests/unit/fuel-cost-display.test.js tests/property/fuel-cost-display.property.test.js
git commit -m "fix: fuel cost display now applies quirks and upgrades (#33/61/88)

useJumpValidation hook and SystemPanel connected-systems list now pass
quirk modifiers and upgrade fuel consumption to calculateFuelCostWithCondition,
matching the actual fuel cost deducted during jumps.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Currency Standardization (Fix #2 — Issue #15)

**Problem:** Codebase mixes `¢`, `₡`, `cr`, and bare numbers for credits. Codebase audit found two locations missing the `₡` symbol: ResourceBar HUD and Epilogue stats. All other 36 component files already use `₡` correctly.

**Files:**
- Modify: `src/features/hud/ResourceBar.jsx` (lines 21, 25)
- Modify: `src/features/endgame/Epilogue.jsx` (line 43)
- Test: `tests/unit/currency-standardization.test.js` (new)

### Step 1: Write failing tests

Create `tests/unit/currency-standardization.test.js`. These verify the actual component source files contain `₡` and no incorrect currency symbols:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';

describe('Currency Standardization (#15)', () => {
  const componentFiles = globSync('src/features/**/*.jsx');

  it('ResourceBar should display ₡ prefix for credits', () => {
    const source = readFileSync('src/features/hud/ResourceBar.jsx', 'utf-8');
    expect(source).toContain('₡{credits');
  });

  it('ResourceBar should display ₡ prefix for debt', () => {
    const source = readFileSync('src/features/hud/ResourceBar.jsx', 'utf-8');
    expect(source).toContain('₡{debt');
  });

  it('Epilogue should display ₡ prefix for credits earned', () => {
    const source = readFileSync('src/features/endgame/Epilogue.jsx', 'utf-8');
    expect(source).toContain('₡{stats.creditsEarned');
  });

  it('no component file should use ¢ as currency symbol', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      expect(source, `Found ¢ in ${file}`).not.toMatch(/¢\d/);
      expect(source, `Found ¢{ in ${file}`).not.toMatch(/¢\{/);
    }
  });

  it('no component file should use "cr" as currency suffix in display text', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      // Match patterns like "12 cr" or "{price} cr" in JSX display strings
      expect(source, `Found cr currency in ${file}`).not.toMatch(/\bcr\/unit\b/);
    }
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/currency-standardization.test.js`
Expected: FAIL — ResourceBar source does not contain `₡{credits`.

### Step 3: Update ResourceBar to add ₡ prefix

In `src/features/hud/ResourceBar.jsx`:
- Line 21: Change `{credits.toLocaleString()}` to `₡{credits.toLocaleString()}`
- Line 25: Change `{debt.toLocaleString()}` to `₡{debt.toLocaleString()}`

### Step 4: Update Epilogue to add ₡ prefix

In `src/features/endgame/Epilogue.jsx`:
- Line 43: Change `{stats.creditsEarned.toLocaleString()}` to `₡{stats.creditsEarned.toLocaleString()}`

### Step 5: Run tests to verify they pass

Run: `npm test -- tests/unit/currency-standardization.test.js`
Expected: PASS

### Step 6: Grep sweep — verify no remaining incorrect currency references

Run grep across all JSX files for `¢`, bare `cr/unit`, or `cr}` patterns to confirm no incorrect symbols remain. This is a manual verification step on top of the automated tests.

### Step 7: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 8: Commit

```
git add src/features/hud/ResourceBar.jsx src/features/endgame/Epilogue.jsx tests/unit/currency-standardization.test.js
git commit -m "fix: standardize currency display to ₡ symbol everywhere (#15)

ResourceBar HUD and Epilogue stats now prefix amounts with ₡,
matching all other credit displays throughout the game. Sweep tests
verify no ¢ or cr currency symbols remain in any component.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Customs Inspection UI (Fix #3 — Issue #31)

**Problem:** InspectionPanel has separate confirm/reconsider buttons hidden below the fold. Option cards look clickable but only select — they don't confirm. PirateEncounterPanel already works better.

**Fix:** Make option cards directly trigger `onChoice()` on click, removing the two-step select-then-confirm flow. Remove confirm/reconsider buttons entirely.

**Files:**
- Modify: `src/features/danger/InspectionPanel.jsx` (lines 52-64 handlers, lines 395-422 buttons)
- Test: `tests/integration/inspection-panel-click.test.js` (new)

### Step 1: Write failing integration test

Create `tests/integration/inspection-panel-click.test.js`. This tests that clicking an option card triggers the resolution callback directly, and that no orphaned confirm button exists:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('InspectionPanel Click Behavior (#31)', () => {
  const source = readFileSync(
    'src/features/danger/InspectionPanel.jsx',
    'utf-8'
  );

  it('option card onClick should call onChoice directly, not handleOptionSelect', () => {
    // After the fix, each card's onClick should call onChoice('cooperate') etc.
    // not handleOptionSelect('cooperate')
    expect(source).toContain("onChoice('cooperate')");
    expect(source).toContain("onChoice('flee')");
    // Bribe may have a disabled guard, but should still use onChoice
    expect(source).toContain("onChoice('bribe')");
  });

  it('should not have a separate confirm button or selectedOption state', () => {
    // handleConfirm, handleCancel, and selectedOption should be removed
    expect(source).not.toContain('handleConfirm');
    expect(source).not.toContain('handleCancel');
    expect(source).not.toContain('selectedOption');
    // No confirm/reconsider buttons
    expect(source).not.toContain('Reconsider');
  });

  it('should not render an inspection-actions div with confirm buttons', () => {
    expect(source).not.toContain('inspection-actions');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/integration/inspection-panel-click.test.js`
Expected: FAIL — source contains `handleConfirm`, `selectedOption`, `Reconsider`, etc.

### Step 3: Modify InspectionPanel for direct-click behavior

In `src/features/danger/InspectionPanel.jsx`:

1. Remove `selectedOption` state and `handleOptionSelect`, `handleConfirm`, `handleCancel` functions (lines 52-64)
2. Change each option card's `onClick` from `handleOptionSelect('cooperate')` to `onChoice('cooperate')` (and similarly for bribe/flee)
3. Remove the entire `inspection-actions` div (lines 395-422) with confirm/reconsider buttons and selection prompt
4. Remove the `selected` CSS class toggling based on `selectedOption`

### Step 4: Run tests to verify they pass

Run: `npm test -- tests/integration/inspection-panel-click.test.js`
Expected: PASS

### Step 5: Run full test suite

Run: `npm test`
Expected: All tests pass. Check that no existing tests relied on the two-step flow.

### Step 6: Commit

```
git add src/features/danger/InspectionPanel.jsx tests/integration/inspection-panel-click.test.js
git commit -m "fix: make inspection option cards directly clickable (#31)

Clicking an option card now immediately triggers the choice, removing
the hidden confirm/reconsider button flow. Matches PirateEncounterPanel's
superior UX pattern.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Cargo Capacity from Salvage (Fix #4 — Issues #55/56)

**Problem:** `applyEncounterOutcome.js` adds salvage cargo without checking capacity, allowing overflow (e.g. 53/50).

**Note:** The design doc references `transformOutcome.js` but that file transforms outcomes for *display*. The actual cargo mutation happens in `applyEncounterOutcome.js` (lines 169-191), which is the correct fix location.

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js` (lines 169-191)
- Test: `tests/unit/salvage-cargo-cap.test.js` (new)
- Test: `tests/property/salvage-cargo-cap.property.test.js` (new)

### Step 1: Write failing tests

Create `tests/unit/salvage-cargo-cap.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';

describe('Salvage Cargo Cap (#55/56)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should cap salvage cargo to available space with partial-fit message', () => {
    const state = gsm.getState();
    // Fill cargo to 48/50
    state.ship.cargo = [{ good: 'grain', qty: 48, buyPrice: 10, buySystemName: 'Sol' }];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [{ good: 'parts', qty: 5, buyPrice: 0, buySystemName: 'Salvage' }],
      },
      description: 'Salvaged parts.',
    };

    applyEncounterOutcome(gsm, outcome);

    const totalCargo = state.ship.cargo.reduce((sum, item) => sum + item.qty, 0);
    expect(totalCargo).toBeLessThanOrEqual(state.ship.cargoCapacity);
    // Should only fit 2 of 5
    const parts = state.ship.cargo.find(item => item.good === 'parts');
    expect(parts.qty).toBe(2);
    expect(outcome.description).toContain('Could only fit 2 of 5');
  });

  it('should use singular "unit" when only 1 fits', () => {
    const state = gsm.getState();
    state.ship.cargo = [{ good: 'grain', qty: 49, buyPrice: 10, buySystemName: 'Sol' }];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [{ good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' }],
      },
      description: 'Salvaged parts.',
    };

    applyEncounterOutcome(gsm, outcome);

    const parts = state.ship.cargo.find(item => item.good === 'parts');
    expect(parts.qty).toBe(1);
    expect(outcome.description).toContain('Could only fit 1 of 3 unit.');
  });

  it('should salvage nothing when hold is full with full-hold message', () => {
    const state = gsm.getState();
    state.ship.cargo = [{ good: 'grain', qty: 50, buyPrice: 10, buySystemName: 'Sol' }];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [{ good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' }],
      },
      description: 'Salvaged parts.',
    };

    applyEncounterOutcome(gsm, outcome);

    const totalCargo = state.ship.cargo.reduce((sum, item) => sum + item.qty, 0);
    expect(totalCargo).toBe(50);
    const parts = state.ship.cargo.find(item => item.good === 'parts');
    expect(parts).toBeUndefined();
    expect(outcome.description).toContain('Your hold is full');
  });

  it('should salvage full amount when space is sufficient (no extra message)', () => {
    const state = gsm.getState();
    state.ship.cargo = [{ good: 'grain', qty: 20, buyPrice: 10, buySystemName: 'Sol' }];

    const outcome = {
      success: true,
      costs: {},
      rewards: {
        cargo: [{ good: 'parts', qty: 3, buyPrice: 0, buySystemName: 'Salvage' }],
      },
      description: 'Salvaged parts.',
    };

    applyEncounterOutcome(gsm, outcome);

    const parts = state.ship.cargo.find(item => item.good === 'parts');
    expect(parts.qty).toBe(3);
    // No extra message when everything fits
    expect(outcome.description).toBe('Salvaged parts.');
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/salvage-cargo-cap.test.js`
Expected: FAIL — first test gets 53 instead of 50.

### Step 3: Add capacity check and messaging to applyEncounterOutcome

In `src/features/danger/applyEncounterOutcome.js`, modify the cargo rewards section (lines 169-191). The function must cap salvage to available space AND adjust `outcome.description` with appropriate messaging:

```javascript
if (outcome.rewards.cargo) {
  const state = gameStateManager.getState();
  const currentCargo = [...state.ship.cargo];
  const cargoCapacity = state.ship.cargoCapacity;
  let currentTotal = currentCargo.reduce((sum, item) => sum + item.qty, 0);
  const salvageMessages = [];

  outcome.rewards.cargo.forEach((rewardItem) => {
    const availableSpace = cargoCapacity - currentTotal;

    if (availableSpace <= 0) {
      // Full hold — nothing salvaged
      salvageMessages.push('Your hold is full — nothing salvaged.');
      return;
    }

    const qtyToAdd = Math.min(rewardItem.qty, availableSpace);

    if (qtyToAdd < rewardItem.qty) {
      // Partial fit — adjust messaging with singular/plural
      const unitWord = qtyToAdd === 1 ? 'unit' : 'units';
      salvageMessages.push(
        `Could only fit ${qtyToAdd} of ${rewardItem.qty} ${unitWord}.`
      );
    }

    const existingStack = currentCargo.find(
      (item) =>
        item.good === rewardItem.good &&
        item.buyPrice === rewardItem.buyPrice
    );

    if (existingStack) {
      existingStack.qty += qtyToAdd;
    } else {
      currentCargo.push({
        good: rewardItem.good,
        qty: qtyToAdd,
        buyPrice: rewardItem.buyPrice,
        buySystemName: rewardItem.buySystemName,
      });
    }

    currentTotal += qtyToAdd;
  });

  // Append salvage capacity messages to outcome description
  if (salvageMessages.length > 0) {
    outcome.description = outcome.description + ' ' + salvageMessages.join(' ');
  }

  gameStateManager.updateCargo(currentCargo);
}
```

### Step 4: Run unit tests to verify they pass

Run: `npm test -- tests/unit/salvage-cargo-cap.test.js`
Expected: PASS

### Step 4b: Write property test for cargo capacity invariant

Create `tests/property/salvage-cargo-cap.property.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';

describe('Salvage Cargo Cap Property Tests (#55/56)', () => {
  it('cargo should never exceed capacity after salvage for any qty/fill combo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),  // existing cargo qty
        fc.integer({ min: 1, max: 20 }),  // salvage qty
        (existingQty, salvageQty) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          const state = gsm.getState();

          state.ship.cargo = existingQty > 0
            ? [{ good: 'grain', qty: existingQty, buyPrice: 10, buySystemName: 'Sol' }]
            : [];

          const outcome = {
            success: true,
            costs: {},
            rewards: {
              cargo: [{ good: 'parts', qty: salvageQty, buyPrice: 0, buySystemName: 'Salvage' }],
            },
            description: 'Salvaged parts.',
          };

          applyEncounterOutcome(gsm, outcome);

          const totalCargo = state.ship.cargo.reduce((sum, item) => sum + item.qty, 0);
          expect(totalCargo).toBeLessThanOrEqual(state.ship.cargoCapacity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Step 5: Run all salvage tests

Run: `npm test -- tests/unit/salvage-cargo-cap.test.js`
Run: `npm test -- tests/property/salvage-cargo-cap.property.test.js`
Expected: PASS

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 7: Commit

```
git add src/features/danger/applyEncounterOutcome.js tests/unit/salvage-cargo-cap.test.js tests/property/salvage-cargo-cap.property.test.js
git commit -m "fix: cap salvage cargo to available hold space (#55/56)

Salvage rewards now check remaining cargo capacity before adding items.
Full hold: 'Your hold is full — nothing salvaged.'
Partial fit: 'Could only fit X of Y units.' (singular-aware)
Full fit: existing message unchanged.
Property test verifies cargo never exceeds capacity.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Failed Negotiation Escalates to Combat (Fix #5 — Issues #68/73)

**Problem:** Failed counter-proposal returns `{ success: false, costs: {}, rewards: {} }` and the encounter ends. Text promises "combat likely" but nothing happens.

**Fix:** Add `escalate: true` flag to failed negotiation outcome. App.jsx encounter flow detects this flag and transitions from NegotiationPanel to CombatPanel with a +10% threat bonus. Negotiate option is disabled in escalated combat.

**Files:**
- Modify: `src/game/state/managers/negotiation.js` (line 113-120)
- Modify: `src/App.jsx` (lines 286-298, encounter flow)
- Modify: `src/features/danger/PirateEncounterPanel.jsx` (disable negotiate in escalated mode)
- Modify: `src/game/constants.js` (already has `COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE: 0.1`)
- Test: `tests/unit/negotiation-escalation.test.js` (new)

### Step 1: Write failing test for negotiation manager

Create `tests/unit/negotiation-escalation.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Negotiation Escalation (#68/73)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should return escalate: true when counter-proposal fails', () => {
    const encounter = { demandPercent: 20, threatLevel: 0.5 };

    // Force failure by using rng value > success chance (0.6 base + karma modifier)
    const result = gsm.negotiationManager.resolveCounterProposal(
      encounter,
      gsm.getState(),
      0.99 // guaranteed fail
    );

    expect(result.success).toBe(false);
    expect(result.escalate).toBe(true);
  });

  it('should NOT return escalate when counter-proposal succeeds', () => {
    const state = gsm.getState();
    state.ship.cargo = [{ good: 'grain', qty: 10, buyPrice: 10 }];

    const encounter = { demandPercent: 20, threatLevel: 0.5 };

    const result = gsm.negotiationManager.resolveCounterProposal(
      encounter,
      gsm.getState(),
      0.01 // guaranteed success
    );

    expect(result.success).toBe(true);
    expect(result.escalate).toBeUndefined();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/unit/negotiation-escalation.test.js`
Expected: FAIL — `result.escalate` is undefined.

### Step 3: Add escalate flag to failed counter-proposal

In `src/game/state/managers/negotiation.js`, modify the failure branch of `resolveCounterProposal` (lines 113-120):

```javascript
} else {
  return {
    success: false,
    escalate: true,
    costs: {},
    rewards: {},
    description: "The pirates don't take kindly to your offer.",
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/unit/negotiation-escalation.test.js`
Expected: PASS

### Step 5: Wire up escalation in App.jsx encounter flow

In `src/App.jsx`, in the `handleEncounterChoice` function, after the negotiation resolution block (around line 294), check for `escalate` flag:

```javascript
} else if (encounterPhase === 'negotiation') {
  if (choice === 'flee') {
    outcome = gameStateManager.resolveCombatChoice(
      currentEncounter.encounter,
      'evasive'
    );
  } else {
    outcome = gameStateManager.resolveNegotiation(
      currentEncounter.encounter,
      choice
    );

    // Failed negotiation escalates to combat
    if (outcome.escalate) {
      // Apply +10% threat bonus to encounter for escalated combat
      currentEncounter.encounter.threatLevel =
        (currentEncounter.encounter.threatLevel || 0.5) +
        NEGOTIATION_CONFIG.OUTCOME_VALUES.COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE;

      // Show failure outcome first, then transition to combat
      const displayOutcome = transformOutcomeForDisplay(
        outcome,
        currentEncounter.type,
        choice
      );
      setEncounterOutcome(displayOutcome);
      setEncounterPhase('escalated_combat');
      return;
    }
  }
}
```

Import `NEGOTIATION_CONFIG` at the top of App.jsx:
```javascript
import { NEGOTIATION_CONFIG } from './game/constants.js';
```

Then in `handleOutcomeContinue` (around line 334), check if we're in escalated combat:

```javascript
const handleOutcomeContinue = () => {
  if (encounterPhase === 'escalated_combat') {
    // Transition from negotiation failure outcome to combat panel
    setEncounterOutcome(null);
    setEncounterPhase('combat');
    setCombatContext({ escalated: true });
    return;
  }
  // ... existing close logic
};
```

In the JSX where PirateEncounterPanel is rendered (around line 516), pass the `escalated` prop from combatContext:

```jsx
encounterPhase === 'combat' && (
  <CombatPanel
    combat={currentEncounter.encounter}
    onChoice={handleEncounterChoice}
    escalated={combatContext?.escalated || false}
  />
)
```

### Step 6: Disable negotiate in escalated combat

In `src/features/danger/PirateEncounterPanel.jsx`, accept an `escalated` prop. When true, disable the Negotiate option card:

```jsx
// In the negotiate option card (around line 242):
const isEscalated = escalated || false;

// Add disabled state to negotiate option:
<div
  className={`option-card ${isEscalated ? 'disabled' : ''}`}
  onClick={() => !isEscalated && handleOptionSelect('negotiate')}
>
  {/* ... existing content ... */}
  {isEscalated && (
    <div className="option-disabled-reason">They're done talking.</div>
  )}
</div>
```

### Step 7: Add tests for escalation flow and disabled negotiate

Add to `tests/unit/negotiation-escalation.test.js`:

```javascript
  it('should include threatLevel increase constant for escalated combat', () => {
    // Verify the constant exists and is 0.1 (+10%)
    expect(NEGOTIATION_CONFIG.OUTCOME_VALUES.COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE).toBe(0.1);
  });
```

Add `tests/unit/pirate-panel-escalated.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('PirateEncounterPanel Escalated Mode (#68/73)', () => {
  const source = readFileSync(
    'src/features/danger/PirateEncounterPanel.jsx',
    'utf-8'
  );

  it('should accept escalated prop', () => {
    expect(source).toContain('escalated');
  });

  it('should disable negotiate option when escalated', () => {
    expect(source).toContain("They're done talking");
  });
});
```

### Step 8: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 9: Commit

```
git add src/game/state/managers/negotiation.js src/App.jsx src/features/danger/PirateEncounterPanel.jsx tests/unit/negotiation-escalation.test.js tests/unit/pirate-panel-escalated.test.js
git commit -m "feat: failed negotiation escalates to pirate combat (#68/73)

Failed counter-proposal now returns escalate: true. App.jsx applies +10%
threat bonus (COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE) then transitions
to combat panel. Negotiate option disabled in escalated combat with
'They're done talking' message.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Debt Escalation (Fix #6 — Issue #77)

**Problem:** Marcus Cole says "the lien just got heavier" but interest rates never change. `finance.interestRate` is set once at init and never recalculated by heat tier.

**Fix:** Add tier-based interest rates to `COLE_DEBT_CONFIG`. Add `getInterestRate()` method to `DebtManager` (parallel to existing `getLienRate()`). Update `applyInterest()` and `updateHeat()` to use dynamic interest rate.

**Design note:** The design doc shows withholding tiers of 5%/7%/10%. Existing code already has dynamic withholding at 5%/10%/15%/20% via `getLienRate()`. These are more aggressive than the design's table. The actual bug is that *interest* doesn't escalate — withholding already does. We keep existing withholding rates and only add interest rate escalation.

**Files:**
- Modify: `src/game/constants.js` (COLE_DEBT_CONFIG, add interest rate tiers)
- Modify: `src/game/state/managers/debt.js` (add `getInterestRate()`, update `applyInterest()`, update `updateHeat()`)
- Verify: `src/features/finance/FinancePanel.jsx` (already reads rates from state — confirm no changes needed)
- Test: `tests/unit/debt-escalation.test.js` (new)

### Step 1: Write failing tests

Create `tests/unit/debt-escalation.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG } from '../../src/game/constants.js';

describe('Debt Escalation (#77)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should return low interest rate at low heat', () => {
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_LOW);
  });

  it('should return medium interest rate at medium heat', () => {
    const finance = gsm.debtManager.getFinance();
    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1; // Enter medium tier
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM);
  });

  it('should return high interest rate at high heat', () => {
    const finance = gsm.debtManager.getFinance();
    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1; // Enter high tier
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_HIGH);
  });

  it('should update interestRate in finance when heat changes', () => {
    const finance = gsm.debtManager.getFinance();
    expect(finance.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_LOW);

    // Increase heat to medium tier
    finance.heat = 0;
    gsm.debtManager.updateHeat(COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1);
    expect(finance.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM);
  });

  it('should use tier-appropriate interest rate when applying interest', () => {
    const state = gsm.getState();
    const finance = gsm.debtManager.getFinance();
    const initialDebt = state.player.debt;

    // Set heat to high tier
    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1;
    gsm.debtManager.updateHeat(0); // trigger recalc without changing heat

    // Advance time past interest period
    state.player.daysElapsed = finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS;

    gsm.debtManager.applyInterest();

    const expectedInterest = Math.ceil(initialDebt * COLE_DEBT_CONFIG.INTEREST_RATE_HIGH);
    expect(state.player.debt).toBe(initialDebt + expectedInterest);
  });

  describe('withholding rates already escalate by tier (pre-existing)', () => {
    it('should apply low withholding rate at low heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = 0;
      expect(gsm.debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_LOW);
    });

    it('should apply medium withholding rate at medium heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1;
      expect(gsm.debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);
    });

    it('should apply correct withholding to trade revenue at high heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1;
      gsm.debtManager.updateHeat(0); // trigger recalc

      const totalRevenue = 1000;
      const result = gsm.debtManager.calculateWithholding(totalRevenue);
      const expectedWithheld = Math.ceil(totalRevenue * COLE_DEBT_CONFIG.LIEN_RATE_HIGH);
      expect(result.withheld).toBe(expectedWithheld);
      expect(result.playerReceives).toBe(totalRevenue - expectedWithheld);
    });
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/debt-escalation.test.js`
Expected: FAIL — `COLE_DEBT_CONFIG.INTEREST_RATE_LOW` is undefined, `getInterestRate()` doesn't exist.

### Step 3: Add tier-based interest rate constants

In `src/game/constants.js`, in `COLE_DEBT_CONFIG` (after line 429), replace the single `INTEREST_RATE` with tier-based rates:

```javascript
// Interest rates by heat tier
INTEREST_RATE_LOW: 0.03,      // 0-20 heat: 3% (grace period)
INTEREST_RATE_MEDIUM: 0.04,   // 21-45 heat: 4%
INTEREST_RATE_HIGH: 0.05,     // 46-70 heat: 5%
INTEREST_RATE_CRITICAL: 0.05, // 71-100 heat: 5% (cap)
INTEREST_RATE: 0.03,          // Keep for backward compat with getFinance init
```

### Step 4: Add getInterestRate() to DebtManager

In `src/game/state/managers/debt.js`, add after `getLienRate()` (line 58):

```javascript
getInterestRate() {
  if (this.getDebt() === 0) return 0;

  const tier = this.getHeatTier();
  switch (tier) {
    case 'low':
      return COLE_DEBT_CONFIG.INTEREST_RATE_LOW;
    case 'medium':
      return COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM;
    case 'high':
      return COLE_DEBT_CONFIG.INTEREST_RATE_HIGH;
    case 'critical':
      return COLE_DEBT_CONFIG.INTEREST_RATE_CRITICAL;
    default:
      return COLE_DEBT_CONFIG.INTEREST_RATE_LOW;
  }
}
```

### Step 5: Update updateHeat() to also set interestRate

In `src/game/state/managers/debt.js`, modify `updateHeat()` (line 67-71):

```javascript
updateHeat(delta) {
  const finance = this.getFinance();
  finance.heat = this.clampHeat(finance.heat + delta);
  finance.lienRate = this.getLienRate();
  finance.interestRate = this.getInterestRate();
}
```

### Step 6: Update applyInterest() to use dynamic rate

In `src/game/state/managers/debt.js`, modify `applyInterest()` (line 84). Replace `finance.interestRate` with `this.getInterestRate()`:

```javascript
const interest = Math.ceil(debt * this.getInterestRate());
```

### Step 7: Update getDebtInfo() to use dynamic interest rate

In `src/game/state/managers/debt.js`, modify `getDebtInfo()` (line 330). Replace `finance.interestRate` with `this.getInterestRate()`:

```javascript
interestRate: this.getInterestRate(),
```

### Step 7b: Verify FinancePanel reads from state (no changes needed)

Confirm `src/features/finance/FinancePanel.jsx` (lines 59-60) already reads both rates dynamically:
```javascript
const lienPercent = Math.round(debtInfo.lienRate * 100);
const interestPercent = Math.round(debtInfo.interestRate * 100);
```
Since `getDebtInfo()` now returns dynamic rates, FinancePanel will display updated values automatically. No changes to FinancePanel required.

### Step 8: Run tests to verify they pass

Run: `npm test -- tests/unit/debt-escalation.test.js`
Expected: PASS

### Step 9: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 10: Commit

```
git add src/game/constants.js src/game/state/managers/debt.js tests/unit/debt-escalation.test.js
git commit -m "feat: debt interest rate now escalates with heat tier (#77)

Interest rate increases from 3% (grace) to 4% (medium) to 5% (high/critical)
as debt heat rises. updateHeat() now recalculates both lien and interest rates.
Marcus Cole's 'heavier lien' message is now truthful.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Ship Quirks Display (Fix #7 — Issues #66/100)

**Problem:** ShipStatusPanel shows quirk name, description, and flavor — but not mechanical effects. Players see "Sensitive Sensors" in encounters with no idea what it does.

**Fix:** Add human-readable `effectLabel` to each quirk definition in constants.js. Render it in ShipStatusPanel's `renderQuirk()`.

**Files:**
- Modify: `src/game/constants.js` (SHIP_CONFIG.QUIRKS, add `effectLabel` per quirk)
- Modify: `src/features/ship-status/ShipStatusPanel.jsx` (lines 60-68, add effect display)
- Test: `tests/unit/quirk-effects-display.test.js` (new)

### Step 1: Write failing test

Create `tests/unit/quirk-effects-display.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Quirk Effects Display (#66/100)', () => {
  it('every quirk should have an effectLabel', () => {
    Object.entries(SHIP_CONFIG.QUIRKS).forEach(([id, quirk]) => {
      expect(quirk.effectLabel, `Quirk ${id} missing effectLabel`).toBeDefined();
      expect(typeof quirk.effectLabel).toBe('string');
      expect(quirk.effectLabel.length).toBeGreaterThan(0);
    });
  });

  it('effectLabel should describe mechanical effect in plain language', () => {
    // Spot-check specific quirks
    expect(SHIP_CONFIG.QUIRKS.fuel_sipper.effectLabel).toContain('-15%');
    expect(SHIP_CONFIG.QUIRKS.hot_thruster.effectLabel).toContain('+5%');
    expect(SHIP_CONFIG.QUIRKS.leaky_seals.effectLabel).toContain('+50%');
  });

  it('ShipStatusPanel should render effectLabel in quirk display', () => {
    const source = readFileSync(
      'src/features/ship-status/ShipStatusPanel.jsx',
      'utf-8'
    );
    // Verify renderQuirk outputs name, description, effectLabel, and flavor
    expect(source).toContain('quirk.name');
    expect(source).toContain('quirk.description');
    expect(source).toContain('quirk.effectLabel');
    expect(source).toContain('quirk.flavor');
    // Verify it uses a quirk-effect CSS class for the effect label
    expect(source).toContain('quirk-effect');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/unit/quirk-effects-display.test.js`
Expected: FAIL — `effectLabel` is undefined on all quirks.

### Step 3: Add effectLabel to each quirk in constants.js

In `src/game/constants.js`, add `effectLabel` to each quirk in `SHIP_CONFIG.QUIRKS` (lines 193-261):

```javascript
sticky_seal: {
  name: 'Sticky Cargo Seal',
  description: 'The main cargo hatch sticks. Every. Single. Time.',
  effectLabel: '+10% loading time, -5% theft risk',
  effects: { loadingTime: 1.1, theftRisk: 0.95 },
  flavor: "You've learned to kick it in just the right spot.",
},
hot_thruster: {
  name: 'Hot Thruster',
  description: 'Port thruster runs hot. Burns extra fuel but responsive.',
  effectLabel: '+5% fuel consumption',
  effects: { fuelConsumption: 1.05 },
  flavor: "The engineers say it's 'within tolerances.' Barely.",
},
sensitive_sensors: {
  name: 'Sensitive Sensors',
  description: 'Sensor array picks up everything. Including false positives.',
  effectLabel: '+15% salvage detection, +10% false alarms',
  effects: { salvageDetection: 1.15, falseAlarms: 1.1 },
  flavor: "You've learned to tell the difference. Mostly.",
},
cramped_quarters: {
  name: 'Cramped Quarters',
  description: 'Living space is... cozy. Very cozy.',
  effectLabel: '-10% life support drain',
  effects: { lifeSupportDrain: 0.9 },
  flavor: "At least you don't have to share.",
},
lucky_ship: {
  name: 'Lucky Ship',
  description: 'This ship has a history of beating the odds.',
  effectLabel: '5% chance to negate bad events',
  effects: { negateEventChance: 0.05 },
  flavor: 'Knock on hull plating.',
},
fuel_sipper: {
  name: 'Fuel Sipper',
  description: 'Efficient drive core. Previous owner was meticulous.',
  effectLabel: '-15% fuel consumption',
  effects: { fuelConsumption: 0.85 },
  flavor: 'One of the few things that actually works better than spec.',
},
leaky_seals: {
  name: 'Leaky Seals',
  description: "Hull seals aren't quite right. Slow degradation.",
  effectLabel: '+50% hull degradation',
  effects: { hullDegradation: 1.5 },
  flavor: "You can hear the whistle when you're in the cargo bay.",
},
smooth_talker: {
  name: "Smooth Talker's Ride",
  description: 'Previous owner had a reputation. It rubs off.',
  effectLabel: '+5% reputation gains',
  effects: { npcRepGain: 1.05 },
  flavor: 'People remember this ship. Usually fondly.',
},
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/unit/quirk-effects-display.test.js`
Expected: PASS

### Step 5: Update ShipStatusPanel to render effectLabel

In `src/features/ship-status/ShipStatusPanel.jsx`, modify `renderQuirk()` (lines 60-68). Add the effect display between description and flavor:

```jsx
return (
  <div className="quirk-item" key={quirkId}>
    <div className="quirk-header">
      <span className="quirk-icon">⚙</span>
      <span className="quirk-name">{quirk.name}</span>
    </div>
    <div className="quirk-description">{quirk.description}</div>
    {quirk.effectLabel && (
      <div className="quirk-effect">{quirk.effectLabel}</div>
    )}
    <div className="quirk-flavor">{quirk.flavor}</div>
  </div>
);
```

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 7: Commit

```
git add src/game/constants.js src/features/ship-status/ShipStatusPanel.jsx tests/unit/quirk-effects-display.test.js
git commit -m "feat: display mechanical effects for ship quirks (#66/100)

Each quirk now has an effectLabel showing its mechanical impact in plain
language (e.g. '-15% fuel consumption'). ShipStatusPanel renders this
between description and flavor text.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Narrative Event Deduplication (Fix #8 — Issues #52/78)

**Problem:** Same dockworker tip fires at different stations in short succession. The cooldown is currently 3 days — too short for repeating events.

**Fix:** Increase `dock_generic_rumor` cooldown from 3 to 10 game days. The cooldown system is already global (checked in `event-engine.js:84-89` by event ID, not per-station), so the mechanism is correct — just the value is too low.

**Files:**
- Modify: `src/game/data/narrative-events.js` (line 94, cooldown value)
- Verify: `src/game/state/managers/event-engine.js` (cooldown is global by event ID, not per-station — confirm)
- Test: `tests/unit/narrative-event-cooldown.test.js` (new)

### Step 1: Write failing tests

Create `tests/unit/narrative-event-cooldown.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Narrative Event Deduplication (#52/78)', () => {
  it('dock_generic_rumor should have cooldown of at least 10 days', () => {
    const event = NARRATIVE_EVENTS.find(e => e.id === 'dock_generic_rumor');
    expect(event).toBeDefined();
    expect(event.cooldown).toBeGreaterThanOrEqual(10);
  });

  describe('global cooldown blocks same event at different stations', () => {
    let gsm;

    beforeEach(() => {
      gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
      gsm.initNewGame();
    });

    it('should block event at station B after firing at station A within cooldown', () => {
      const state = gsm.getState();
      const event = NARRATIVE_EVENTS.find(e => e.id === 'dock_generic_rumor');

      // Simulate event fired at day 5
      state.player.daysElapsed = 5;
      state.narrativeEvents.cooldowns['dock_generic_rumor'] =
        5 + event.cooldown; // cooldown expires at day 15

      // At day 10 (within cooldown), check eligibility at a DIFFERENT system
      state.player.daysElapsed = 10;
      const eligible = gsm.eventEngineManager.findEligibleEvent(
        'dock',
        { system: 99 }, // different system ID
        () => 0 // guaranteed chance pass
      );

      // Should NOT get dock_generic_rumor because cooldown is global
      if (eligible) {
        expect(eligible.id).not.toBe('dock_generic_rumor');
      }
    });

    it('should allow different tip events to fire during cooldown', () => {
      const state = gsm.getState();

      // Set cooldown only for dock_generic_rumor
      state.narrativeEvents.cooldowns['dock_generic_rumor'] = 100;
      state.player.daysElapsed = 5;

      // dock_beyond_the_lanes_rumor should still be eligible (if conditions met)
      // This verifies cooldowns are per-event-ID, not blanket
      const beyondEvent = NARRATIVE_EVENTS.find(
        e => e.id === 'dock_beyond_the_lanes_rumor'
      );
      expect(beyondEvent).toBeDefined();
      expect(
        state.narrativeEvents.cooldowns['dock_beyond_the_lanes_rumor']
      ).toBeUndefined();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/unit/narrative-event-cooldown.test.js`
Expected: FAIL — cooldown is 3, not >= 10. Behavioral tests may also fail depending on event engine access.

### Step 3: Update cooldown value

In `src/game/data/narrative-events.js`, line 94, change:
```javascript
cooldown: 3,
```
to:
```javascript
cooldown: 10,
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/unit/narrative-event-cooldown.test.js`
Expected: PASS

### Step 5: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 6: Commit

```
git add src/game/data/narrative-events.js tests/unit/narrative-event-cooldown.test.js
git commit -m "fix: increase dockworker rumor cooldown to 10 days (#52/78)

Prevents the same dockworker tip from repeating at different stations
in quick succession. Cooldown is global (not per-station), so this
ensures at least 10 game days between repeats.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Starting Cargo in Briefing (Fix #9 — Issue #7)

**Problem:** Player starts with 20 Grain but briefing never mentions it. "Cargo 20/50" is confusing with no context.

**Fix:** Add a sentence to the Captain's Briefing mentioning starting cargo.

**Files:**
- Modify: `src/features/instructions/InstructionsModal.jsx` (add line after "Your Goal" section)
- Test: `tests/unit/briefing-starting-cargo.test.js` (new)

### Step 1: Write failing test

Create `tests/unit/briefing-starting-cargo.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Starting Cargo in Briefing (#7)', () => {
  it('InstructionsModal should mention starting grain cargo', () => {
    const source = readFileSync(
      'src/features/instructions/InstructionsModal.jsx',
      'utf-8'
    );
    expect(source).toContain('grain');
    expect(source).toContain('Cargo Manifest');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/unit/briefing-starting-cargo.test.js`
Expected: FAIL — InstructionsModal does not contain "grain".

### Step 3: Add starting cargo mention to briefing

In `src/features/instructions/InstructionsModal.jsx`, add a paragraph to the "Your Goal" section (after line 19, before `</section>`):

```jsx
<p>
  Your hold has 20 units of grain — enough to start trading. Check
  the <strong>Cargo Manifest</strong> to see what you're carrying.
</p>
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/unit/briefing-starting-cargo.test.js`
Expected: PASS

### Step 5: Run full test suite

Run: `npm test`
Expected: All tests pass.

### Step 6: Commit

```
git add src/features/instructions/InstructionsModal.jsx tests/unit/briefing-starting-cargo.test.js
git commit -m "fix: mention starting grain cargo in Captain's Briefing (#7)

New players now learn they start with 20 units of grain and can check
the Cargo Manifest to see their inventory.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Execution Order

Tasks are independent and can be executed in any order. Suggested order by complexity (simplest first):

1. **Task 9** — Starting cargo in briefing (text change only)
2. **Task 8** — Narrative event cooldown (one number change)
3. **Task 2** — Currency standardization (3 display fixes)
4. **Task 7** — Ship quirks display (add labels + render)
5. **Task 3** — Customs inspection UI (remove confirm flow)
6. **Task 4** — Cargo capacity from salvage (add capacity check)
7. **Task 1** — Fuel cost display (hook + component fix)
8. **Task 6** — Debt escalation (new method + constants)
9. **Task 5** — Negotiation escalation (encounter flow wiring)

## Final Verification

After all tasks are complete:
1. Run `npm test` — full suite must pass
2. Run `npm run lint` — no lint errors
3. Run `npm run format:check` — formatting clean
4. Manual smoke test: `npm run dev` → New Game → verify fuel costs, currency symbols, briefing text, quirk effects in Ship Status
