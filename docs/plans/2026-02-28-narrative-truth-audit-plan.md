# Narrative Truth Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 12 findings where player-facing text implies things that don't mechanically happen.

**Architecture:** Data fixes in event definitions, new reward handler in applyEncounterOutcome, text updates in manager outcome methods, and discount wiring in transaction methods. All changes are backwards-compatible.

**Tech Stack:** Vitest, fast-check, GameStateManager, applyEncounterOutcome, narrative-events.js, manager classes.

---

### Task 1: Add `fuelMinimum` reward type to applyEncounterOutcome

The `dock_cheap_fuel` event charges 50 credits but gives no fuel. We need a new reward type that sets fuel to at least a given percentage.

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js:126-190` (rewards section)
- Modify: `src/game/data/narrative-events.js:141` (dock_cheap_fuel Deal choice effects)
- Test: `tests/unit/apply-encounter-outcome.test.js`

**Step 1: Write the failing test**

Add to `tests/unit/apply-encounter-outcome.test.js` inside the existing describe block:

```javascript
describe('fuelMinimum reward', () => {
  it('sets fuel to minimum when current fuel is below', () => {
    gsm.updateFuel(15);
    applyEncounterOutcome(gsm, {
      rewards: { fuelMinimum: 30 },
    });
    expect(gsm.getState().ship.fuel).toBe(30);
  });

  it('does not reduce fuel when current fuel is above minimum', () => {
    gsm.updateFuel(50);
    applyEncounterOutcome(gsm, {
      rewards: { fuelMinimum: 30 },
    });
    expect(gsm.getState().ship.fuel).toBe(50);
  });

  it('handles fuelMinimum at exactly current fuel', () => {
    gsm.updateFuel(30);
    applyEncounterOutcome(gsm, {
      rewards: { fuelMinimum: 30 },
    });
    expect(gsm.getState().ship.fuel).toBe(30);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: FAIL — `fuelMinimum` is not handled, fuel stays at original value.

**Step 3: Implement fuelMinimum handler**

In `src/features/danger/applyEncounterOutcome.js`, add after the `rewards.credits` handler (after line 130):

```javascript
    if (outcome.rewards.fuelMinimum) {
      const newFuel = Math.max(state.ship.fuel, outcome.rewards.fuelMinimum);
      gameStateManager.updateFuel(newFuel);
    }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/apply-encounter-outcome.test.js`
Expected: PASS

**Step 5: Update dock_cheap_fuel event data**

In `src/game/data/narrative-events.js`, line 141, change:
```javascript
effects: { costs: { credits: 50 }, rewards: {} },
```
To:
```javascript
effects: { costs: { credits: 50 }, rewards: { fuelMinimum: 30 } },
```

**Step 6: Add data validation test**

Add to `tests/unit/narrative-event-data.test.js`:

```javascript
describe('dock_cheap_fuel event', () => {
  const cheapFuel = NARRATIVE_EVENTS.find((e) => e.id === 'dock_cheap_fuel');

  it('Deal choice should reward fuel when costing credits', () => {
    const dealChoice = cheapFuel.content.choices.find(
      (c) => c.effects.costs.credits > 0
    );
    expect(dealChoice.effects.rewards.fuelMinimum).toBeGreaterThan(0);
  });
});
```

**Step 7: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 8: Commit**

```
fix: dock_cheap_fuel now actually gives fuel when player pays

Added fuelMinimum reward type to applyEncounterOutcome. The "Deal"
choice now tops fuel up to 30% for 50 credits instead of charging
credits and giving nothing.
```

---

### Task 2: Wire NPC discounts into refuel transactions

RefuelPanel displays NPC discounts but `RefuelManager.refuel()` ignores them. Fix by accepting a discount parameter.

**Files:**
- Modify: `src/game/state/managers/refuel.js:123-167` (refuel method)
- Modify: `src/features/refuel/RefuelPanel.jsx:128` (pass discount to refuel)
- Test: `tests/unit/refuel-npc-discount.test.js` (new file)

**Step 1: Write the failing test**

Create `tests/unit/refuel-npc-discount.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Refuel NPC discount', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  it('applies discount to refuel cost when discount is provided', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;
    const discount = 0.15; // 15% discount

    gsm.refuel(amount, discount);

    const expectedCost = Math.ceil(amount * fuelPrice * (1 - discount));
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when no discount provided', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;

    gsm.refuel(amount);

    const expectedCost = Math.ceil(amount * fuelPrice);
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when discount is 0', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;

    gsm.refuel(amount, 0);

    const expectedCost = Math.ceil(amount * fuelPrice);
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/refuel-npc-discount.test.js`
Expected: FAIL — discount parameter is ignored.

**Step 3: Implement discount in refuel**

In `src/game/state/managers/refuel.js`, change method signature at line 123:
```javascript
refuel(amount, discount = 0) {
```

At line 130, after getting `pricePerPercent`, apply the discount:
```javascript
    const effectivePrice = discount > 0
      ? pricePerPercent * (1 - discount)
      : pricePerPercent;
```

Then use `effectivePrice` instead of `pricePerPercent` in the validation call (line 132-137):
```javascript
    const validation = this.validateRefuel(
      currentFuel,
      amount,
      credits,
      effectivePrice
    );
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/refuel-npc-discount.test.js`
Expected: PASS

**Step 5: Update RefuelPanel to pass discount**

In `src/features/refuel/RefuelPanel.jsx`, line 128, change:
```javascript
      refuel(amount);
```
To:
```javascript
      refuel(amount, bestDiscount.discount);
```

**Step 6: Update useGameAction refuel delegation**

Check `src/hooks/useGameAction.js` — the `refuel` function it returns must also pass through the discount parameter. Update the refuel delegation to accept and forward the discount:

```javascript
refuel: (amount, discount) => gameStateManager.refuel(amount, discount),
```

**Step 7: Remove the panel's duplicate validation override**

In `src/features/refuel/RefuelPanel.jsx`, lines 82-97 can be simplified since the transaction now handles discounts. The re-validation with discounted price is no longer needed as the primary validation path — but keep it for now to avoid regressions. The panel can pass the discount to `validateRefuel` directly:

```javascript
  const validation = validateRefuel(
    fuel,
    amount,
    credits,
    fuelPrice * (1 - bestDiscount.discount)
  );
```

Remove the override block (lines 82-97) and replace lines 79-80 with the above.

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 9: Commit**

```
fix: refuel transactions now apply NPC discounts

RefuelPanel was displaying discounted prices but charging full price.
Now passes discount through to RefuelManager.refuel() so the
transaction cost matches what the player sees.
```

---

### Task 3: Wire NPC discounts into repair transactions

Same pattern as refuel — RepairPanel displays discounts but `repairShipSystem` ignores them.

**Files:**
- Modify: `src/game/state/managers/repair.js:32-40` (getRepairCost) and `49-84` (repairShipSystem)
- Modify: `src/features/repair/RepairPanel.jsx:107` (pass discount to repair)
- Test: `tests/unit/repair-npc-discount.test.js` (new file)

**Step 1: Write the failing test**

Create `tests/unit/repair-npc-discount.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { REPAIR_CONFIG } from '@game/constants.js';

describe('Repair NPC discount', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
    // Damage hull to allow repair
    const state = gsm.getState();
    gsm.updateShipCondition(50, state.ship.engine, state.ship.lifeSupport);
  });

  it('applies discount to repair cost when discount is provided', () => {
    const initialCredits = gsm.getState().player.credits;
    const amount = 20;
    const discount = 0.15;

    gsm.repairShipSystem('hull', amount, discount);

    const fullCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    const expectedCost = Math.ceil(fullCost * (1 - discount));
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when no discount provided', () => {
    const initialCredits = gsm.getState().player.credits;
    const amount = 20;

    gsm.repairShipSystem('hull', amount);

    const expectedCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/repair-npc-discount.test.js`
Expected: FAIL

**Step 3: Implement discount in repair**

In `src/game/state/managers/repair.js`:

Update `getRepairCost` signature (line 32):
```javascript
getRepairCost(systemType, amount, currentCondition, discount = 0) {
```

Update cost calculation (line 39):
```javascript
    const baseCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    return discount > 0 ? Math.ceil(baseCost * (1 - discount)) : baseCost;
```

Update `repairShipSystem` signature (line 49):
```javascript
repairShipSystem(systemType, amount, discount = 0) {
```

Update cost call (line 61):
```javascript
    const cost = this.getRepairCost(systemType, amount, currentCondition, discount);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/repair-npc-discount.test.js`
Expected: PASS

**Step 5: Update RepairPanel to pass discount**

In `src/features/repair/RepairPanel.jsx`, line 107, change:
```javascript
    const repairOutcome = repair(systemType, amount);
```
To:
```javascript
    const repairOutcome = repair(systemType, amount, bestDiscount.discount);
```

Also update useGameAction's `repair` delegation to forward the discount parameter.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
fix: repair transactions now apply NPC discounts

RepairPanel was displaying discounted prices but charging full price.
Now passes discount through to RepairManager so the transaction cost
matches what the player sees.
```

---

### Task 4: Wire NPC discounts into intelligence purchases

InfoBrokerPanel handles rumor discounts manually (works), but `purchaseIntelligence` ignores discounts.

**Files:**
- Modify: `src/game/game-information-broker.js:48-80` (purchaseIntelligence)
- Modify: `src/game/state/managers/info-broker.js:38-45` (purchaseIntelligence delegation)
- Modify: `src/features/info-broker/InfoBrokerPanel.jsx:139` (pass discount)
- Test: `tests/unit/intel-npc-discount.test.js` (new file)

**Step 1: Write the failing test**

Create `tests/unit/intel-npc-discount.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InformationBroker } from '@game/game-information-broker.js';
import { INTELLIGENCE_CONFIG } from '@game/constants.js';

describe('Intelligence NPC discount', () => {
  it('applies discount to intelligence purchase cost', () => {
    const gameState = {
      player: { credits: 1000, daysElapsed: 50, currentSystem: 0 },
      world: {
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };
    const starData = [{ id: 5, name: 'Test System', x: 1, y: 0, z: 0, type: 'G', st: 1 }];
    const discount = 0.15;

    const result = InformationBroker.purchaseIntelligence(
      gameState,
      5,
      starData,
      discount
    );

    expect(result.success).toBe(true);

    const baseCost = INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED;
    const discountedCost = Math.ceil(baseCost * (1 - discount));
    expect(result.cost).toBe(discountedCost);
  });

  it('charges full price when no discount', () => {
    const gameState = {
      player: { credits: 1000, daysElapsed: 50, currentSystem: 0 },
      world: {
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };
    const starData = [{ id: 5, name: 'Test System', x: 1, y: 0, z: 0, type: 'G', st: 1 }];

    const result = InformationBroker.purchaseIntelligence(
      gameState,
      5,
      starData
    );

    expect(result.success).toBe(true);
    expect(result.cost).toBe(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED);
  });
});
```

Note: This test may need adjustments based on the exact return shape of `purchaseIntelligence`. Check the function's return value and adjust assertions.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/intel-npc-discount.test.js`
Expected: FAIL

**Step 3: Implement discount in InformationBroker**

In `src/game/game-information-broker.js`, update `purchaseIntelligence` signature (line 48):
```javascript
static purchaseIntelligence(gameState, systemId, starData, discount = 0) {
```

After calculating cost (line 53-56), apply discount:
```javascript
    let cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
    if (discount > 0) {
      cost = Math.ceil(cost * (1 - discount));
    }
```

Update the manager delegation in `src/game/state/managers/info-broker.js` (line 38):
```javascript
purchaseIntelligence(systemId, discount = 0) {
```

And pass it through (line 41):
```javascript
    const result = InformationBroker.purchaseIntelligence(
      state,
      systemId,
      this.starData,
      discount
    );
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/intel-npc-discount.test.js`
Expected: PASS

**Step 5: Update InfoBrokerPanel**

In `src/features/info-broker/InfoBrokerPanel.jsx`, line 139, change:
```javascript
    const intelligenceOutcome = purchaseIntelligence(systemId);
```
To:
```javascript
    const intelligenceOutcome = purchaseIntelligence(systemId, bestDiscount.discount);
```

Update useGameAction's `purchaseIntelligence` delegation to forward the discount.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
fix: intelligence purchases now apply NPC discounts

InformationBroker.purchaseIntelligence was ignoring NPC relationship
discounts. Now accepts and applies discount parameter so the charged
cost matches the discounted price shown in the UI.
```

---

### Task 5: Remove dead `strengthIncrease` field and fix negotiation text

Three negotiation failure outcomes return `strengthIncrease` which nothing processes.

**Files:**
- Modify: `src/game/state/managers/negotiation.js:116,147-148,204-205` (remove field, update text)
- Test: `tests/unit/negotiation-outcomes.test.js` (new or existing)

**Step 1: Write the test**

Create or update test to verify negotiation failures don't return unhandled fields:

```javascript
import { describe, it, expect } from 'vitest';
import { NegotiationManager } from '@game/state/managers/negotiation.js';

describe('Negotiation outcome schema', () => {
  const HANDLED_COST_FIELDS = [
    'fuel', 'hull', 'engine', 'lifeSupport', 'credits',
    'cargoLoss', 'cargoPercent', 'days', 'passengerSatisfaction',
    'kidnappedPassengerId', 'restrictedGoodsConfiscated', 'hiddenCargoConfiscated',
  ];

  const HANDLED_REWARD_FIELDS = [
    'credits', 'karma', 'factionRep', 'cargo', 'passengerSatisfaction',
    'fuelMinimum',
  ];

  it('counter-proposal failure should not return unhandled cost fields', () => {
    // Create a minimal negotiation manager to test
    // The failure outcome should only contain handled fields
    const manager = new NegotiationManager({ getState: () => ({}) });
    const encounter = { strength: 0.5 };
    const gameState = { player: { karma: 0, credits: 500 } };

    const result = manager.resolveCounterProposal(encounter, gameState, 0.99);

    if (result.costs) {
      Object.keys(result.costs).forEach((key) => {
        expect(HANDLED_COST_FIELDS).toContain(key);
      });
    }
  });
});
```

Note: Adjust the test setup based on how NegotiationManager is actually instantiated. The key assertion is that returned cost/reward fields are all in the handled set.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/negotiation-outcomes.test.js`
Expected: FAIL — `strengthIncrease` is not in the handled list.

**Step 3: Remove strengthIncrease and update text**

In `src/game/state/managers/negotiation.js`:

**Line 113-120** (counter-proposal failure): Change to:
```javascript
      return {
        success: false,
        costs: {},
        rewards: {},
        description: "The pirates don't take kindly to your offer.",
      };
```

**Lines 143-153** (medicine lie detected): Change to:
```javascript
      return {
        success: false,
        costs: {},
        rewards: {},
        description: 'Pirates discovered you have no medicine. They see through the lie.',
      };
```

**Lines 200-209** (intel offer no intel): Change to:
```javascript
      return {
        success: false,
        costs: {},
        rewards: {},
        description: 'You have nothing the pirates want.',
      };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/negotiation-outcomes.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
fix: remove dead strengthIncrease from negotiation outcomes

The field was returned by 3 negotiation failure paths but never
processed by applyEncounterOutcome. Removed the field and updated
text to not claim pirates become more aggressive.
```

---

### Task 6: Convert `reputationPenalty` to `factionRep`

One negotiation failure returns `reputationPenalty` (dead) instead of `factionRep` (handled).

**Files:**
- Modify: `src/game/state/managers/negotiation.js:231-241`
- Test: `tests/unit/negotiation-outcomes.test.js`

**Step 1: Write the failing test**

Add to the negotiation outcomes test:

```javascript
it('intel offer failure should use factionRep for authority penalty', () => {
  const manager = new NegotiationManager({ getState: () => ({}) });
  const encounter = { strength: 0.5 };
  const gameState = {
    player: { karma: 0, credits: 500 },
    world: { flags: { hasPriorIntel: true } },
  };

  // Force failure with high rng
  const result = manager.resolveIntelOffer(encounter, gameState, 0.99);

  // Should use factionRep, not reputationPenalty
  expect(result.costs).not.toHaveProperty('reputationPenalty');
  expect(result.rewards.factionRep).toBeDefined();
  expect(result.rewards.factionRep.authorities).toBeLessThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/negotiation-outcomes.test.js`
Expected: FAIL

**Step 3: Fix the outcome**

In `src/game/state/managers/negotiation.js`, lines 231-241, change:
```javascript
    } else {
      return {
        success: false,
        costs: {},
        rewards: {
          factionRep: {
            authorities: INTEL_OFFER.SUCCESS_REP_PENALTY,
          },
        },
        description:
          'Pirates rejected your intelligence offer and became suspicious.',
      };
    }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/negotiation-outcomes.test.js`
Expected: PASS

**Step 5: Commit**

```
fix: intel offer failure now correctly penalizes authority reputation

Converted dead reputationPenalty field to factionRep structure which
applyEncounterOutcome actually processes.
```

---

### Task 7: Fix inspection flee — remove triggerPatrolCombat, add real costs

**Files:**
- Modify: `src/game/state/managers/inspection.js:186-198`
- Modify: `src/game/constants.js` (add FLEE cost constants)
- Test: `tests/unit/inspection-flee-costs.test.js` (new)

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { InspectionManager } from '@game/state/managers/inspection.js';

describe('Inspection flee outcome', () => {
  it('should have fuel and hull costs for fleeing', () => {
    const manager = new InspectionManager({ getState: () => ({}) });
    const result = manager.resolveInspectionFlee();

    expect(result.costs.fuel).toBeGreaterThan(0);
    expect(result.costs.hull).toBeGreaterThan(0);
  });

  it('should not contain unhandled fields', () => {
    const manager = new InspectionManager({ getState: () => ({}) });
    const result = manager.resolveInspectionFlee();

    expect(result).not.toHaveProperty('triggerPatrolCombat');
  });

  it('should have honest description without pursuit claim', () => {
    const manager = new InspectionManager({ getState: () => ({}) });
    const result = manager.resolveInspectionFlee();

    expect(result.description).not.toContain('pursuit');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/inspection-flee-costs.test.js`
Expected: FAIL

**Step 3: Add constants**

In `src/game/constants.js`, in the `INSPECTION_CONFIG.FLEE` section (around line 1354), add:
```javascript
  FLEE: {
    AUTHORITY_REP_PENALTY: -15,
    FUEL_COST: 5,
    HULL_COST: 5,
  },
```

**Step 4: Implement the fix**

In `src/game/state/managers/inspection.js`, lines 186-198, change to:
```javascript
  resolveInspectionFlee() {
    return {
      success: false,
      costs: {
        fuel: INSPECTION_CONFIG.FLEE.FUEL_COST,
        hull: INSPECTION_CONFIG.FLEE.HULL_COST,
      },
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY,
        },
      },
      description:
        'You punch the throttle and break away. The emergency burn costs fuel and rattles the hull.',
    };
  }
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/inspection-flee-costs.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
fix: inspection flee now has real costs instead of empty threat

Replaced dead triggerPatrolCombat with actual fuel and hull costs.
Updated text to honestly describe the emergency burn consequences
instead of claiming pursuit that never happens.
```

---

### Task 8: Fix misleading outcome text (combat, bribe, cooperate)

Four text changes in manager outcome methods.

**Files:**
- Modify: `src/game/state/managers/combat.js:168`
- Modify: `src/game/state/managers/inspection.js:123,157-158`
- Test: `tests/unit/outcome-text-honesty.test.js` (new)

**Step 1: Write tests for honest text**

Create `tests/unit/outcome-text-honesty.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { CombatManager } from '@game/state/managers/combat.js';
import { InspectionManager } from '@game/state/managers/inspection.js';

describe('Outcome text honesty', () => {
  describe('combat return fire success', () => {
    it('should mention hull damage in description', () => {
      const manager = new CombatManager({ getState: () => ({}) });
      const encounter = { strength: 0.3 };
      const gameState = {
        player: { karma: 10 },
        ship: { quirks: [] },
      };

      // Force success with low rng
      const result = manager.resolveReturnFire(encounter, gameState, 0.01);

      if (result.success) {
        expect(result.description.toLowerCase()).toMatch(/hull|hits|damage|scoring/);
      }
    });
  });

  describe('inspection bribe success', () => {
    it('should hint at reputation consequences', () => {
      const manager = new InspectionManager({ getState: () => ({}) });

      // Force bribe success
      const result = manager.resolveInspectionBribe({}, 0.01);

      if (result.success) {
        expect(result.description).not.toBe(
          'Successfully bribed customs inspector and avoided inspection.'
        );
        expect(result.description.toLowerCase()).toMatch(/books|noted|reputation|record/);
      }
    });
  });

  describe('inspection cooperate', () => {
    it('should have different text for clean vs violation outcomes', () => {
      const manager = new InspectionManager({ getState: () => ({}) });
      const cleanState = { ship: { cargo: [], hiddenCargo: [] } };
      const violationState = {
        ship: {
          cargo: [{ good: 'electronics', qty: 5 }],
          hiddenCargo: [],
        },
      };

      const cleanResult = manager.resolveInspectionCooperate(cleanState);
      const violationResult = manager.resolveInspectionCooperate(violationState);

      // Text should differ based on outcome severity
      if (cleanResult.rewards?.factionRep?.authorities > 0 &&
          violationResult.rewards?.factionRep?.authorities < 0) {
        expect(cleanResult.description).not.toBe(violationResult.description);
      }
    });
  });
});
```

Note: Adjust test setup based on actual method signatures and state shapes. The key assertion is that different outcomes produce different, honest text.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/outcome-text-honesty.test.js`
Expected: FAIL

**Step 3: Update combat return fire text**

In `src/game/state/managers/combat.js`, line 168, change:
```javascript
description: 'Successfully drove off the pirates with return fire.',
```
To:
```javascript
description: 'You drove off the pirates, but not before taking some hits. Your hull shows fresh scoring.',
```

**Step 4: Update inspection bribe text**

In `src/game/state/managers/inspection.js`, line 157-158, change:
```javascript
      description =
        'Successfully bribed customs inspector and avoided inspection.';
```
To:
```javascript
      description =
        'The inspector pockets your credits and waves you through. You doubt this stays off the books.';
```

**Step 5: Update inspection cooperate with outcome-specific text**

In `src/game/state/managers/inspection.js`, line 123, the description is set before the outcome is fully determined. Move it after the restriction/hidden cargo checks. Replace the single description with branching:

After the outcome logic (around where `totalFine`, `authorityRepChange` etc. are determined), set description based on what was found:

```javascript
    let description;
    if (restrictedGoodsConfiscated || hiddenCargoConfiscated) {
      if (hiddenCargoConfiscated) {
        description = 'They found the hidden compartment. This is going to be expensive.';
      } else {
        description = "The inspector's expression hardens. Restricted goods. There will be a fine.";
      }
    } else {
      description = 'Inspection complete. Everything checks out. The inspector nods approvingly.';
    }
```

Replace the hardcoded `description: 'Cooperated with customs inspection.'` (line 123) with the computed `description` variable.

**Step 6: Run tests**

Run: `npm test -- tests/unit/outcome-text-honesty.test.js`
Expected: PASS

**Step 7: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 8: Commit**

```
fix: outcome text now honestly describes consequences

- Combat return fire mentions hull damage taken
- Bribe success hints at reputation cost
- Inspection cooperate shows different text based on outcome
```

---

### Task 9: Make dock rumor truthful

Replace hardcoded "electronics at Epsilon Eridani" with dynamic text based on actual market conditions.

**Files:**
- Modify: `src/game/data/narrative-events.js:88-116` (dock_generic_rumor)
- Modify: `src/game/state/managers/event-engine.js:62-113` (add generateContent support)
- Test: `tests/unit/dynamic-rumor.test.js` (new)

**Step 1: Write the failing test**

Create `tests/unit/dynamic-rumor.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NARRATIVE_EVENTS } from '@game/data/narrative-events.js';

describe('dock_generic_rumor', () => {
  const rumor = NARRATIVE_EVENTS.find((e) => e.id === 'dock_generic_rumor');

  it('should have a generateContent function', () => {
    expect(typeof rumor.generateContent).toBe('function');
  });

  it('should generate text referencing an active economic event', () => {
    const state = {
      world: {
        activeEvents: [
          {
            type: 'mining_strike',
            systemId: 3,
            modifiers: { ore: 1.5 },
          },
        ],
        priceKnowledge: {},
      },
    };
    const starData = [
      { id: 3, name: 'Tau Ceti' },
    ];

    const content = rumor.generateContent(state, starData);

    expect(content.text.length).toBeGreaterThan(0);
    // Should reference the actual system and commodity
    const fullText = content.text.join(' ');
    expect(fullText).toContain('Tau Ceti');
    expect(fullText.toLowerCase()).toMatch(/ore/i);
  });

  it('should generate vague text when no active events or knowledge', () => {
    const state = {
      world: {
        activeEvents: [],
        priceKnowledge: {},
      },
    };
    const starData = [];

    const content = rumor.generateContent(state, starData);

    expect(content.text.length).toBeGreaterThan(0);
    // Should be vague, not reference specific commodities or systems
    const fullText = content.text.join(' ');
    expect(fullText).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/dynamic-rumor.test.js`
Expected: FAIL — no `generateContent` function exists.

**Step 3: Add generateContent to dock_generic_rumor**

In `src/game/data/narrative-events.js`, add a `generateContent` function to the `dock_generic_rumor` event (after the `content` property):

```javascript
  generateContent(state, starData) {
    const activeEvents = state.world.activeEvents || [];

    // Check for active economic events
    if (activeEvents.length > 0) {
      const event = activeEvents[0];
      const system = starData.find((s) => s.id === event.systemId);
      const commodity = Object.keys(event.modifiers || {})[0];

      if (system && commodity) {
        return {
          text: [
            'A dockworker sidles up while you wait for clearance.',
            `"Heard ${commodity} prices are through the roof at ${system.name}. Just saying."`,
          ],
        };
      }
    }

    // Fallback: vague generic tip
    return {
      text: [
        'A dockworker sidles up while you wait for clearance.',
        '"Markets are shifting out there. Keep your eyes open."',
      ],
    };
  },
```

**Step 4: Add generateContent support to event engine**

In `src/game/state/managers/event-engine.js`, after `checkEvents` returns the winning event (line 113), the calling code needs to check for `generateContent`. This is handled in the component/hook that renders the narrative event — find where `content.text` is accessed and add:

```javascript
// If event has generateContent, call it to produce dynamic text
if (event.generateContent) {
  const dynamicContent = event.generateContent(state, starData);
  event = { ...event, content: { ...event.content, ...dynamicContent } };
}
```

Find the exact location where the event is consumed (likely in the NarrativeEventPanel or useEventTriggers hook) and apply this override there.

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/dynamic-rumor.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
feat: dock rumor now reflects actual market conditions

Added generateContent to dock_generic_rumor event. When active
economic events exist, the tip references the real system and
commodity. Falls back to vague text when no events are active.
```

---

### Task 10: Fix Cole debt warning text

**Files:**
- Modify: `src/game/data/narrative-events.js:301-304`

**Step 1: Write the test**

Add to narrative event data tests:

```javascript
describe('time_debt_warning text', () => {
  const debtWarning = NARRATIVE_EVENTS.find((e) => e.id === 'time_debt_warning');

  it('should not threaten actions that are not implemented', () => {
    const fullText = debtWarning.content.text.join(' ');
    expect(fullText).not.toMatch(/come looking|come find|hunt you/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: FAIL — text contains "come looking".

**Step 3: Update the text**

In `src/game/data/narrative-events.js`, lines 301-304, change:
```javascript
      text: [
        'A message from Marcus Cole.',
        '"Grace period\'s over. Interest starts accruing. Don\'t make me come looking for you."',
      ],
```
To:
```javascript
      text: [
        'A message from Marcus Cole.',
        '"Grace period\'s over. Interest starts accruing. And the lien on your trades just got heavier."',
      ],
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
fix: Cole debt warning text matches actual lien mechanic

Changed "don't make me come looking for you" (unimplemented threat)
to reference the lien system which is actually implemented.
```

---

### Task 11: Populate missing NPC tips

9 of 11 NPCs already have tips. Father Okonkwo and Yuki Tanaka have empty arrays.

**Files:**
- Modify: `src/game/data/npc-data.js` (Okonkwo tips ~line 221, Tanaka tips ~line 630)
- Test: `tests/unit/npc-data-definitions.test.js`

**Step 1: Write the failing test**

Add to NPC data tests:

```javascript
describe('NPC tips completeness', () => {
  ALL_NPCS.forEach((npc) => {
    it(`${npc.name} should have at least one tip`, () => {
      expect(npc.tips.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/npc-data-definitions.test.js`
Expected: FAIL for Okonkwo and Tanaka.

**Step 3: Add tips for Father Okonkwo**

In `src/game/data/npc-data.js`, replace Okonkwo's `tips: []` (~line 221) with:

```javascript
tips: [
  'The frontier stations pay more for medicine than you might think. Compassion and commerce are not always at odds.',
  'Many traders overlook grain as unprofitable. But hungry miners at the outer systems will pay what they must.',
  'If you must carry restricted goods, know that the authorities are less watchful beyond the core systems.',
],
```

**Step 4: Add tips for Yuki Tanaka**

In `src/game/data/npc-data.js`, replace Tanaka's `tips: []` (~line 630) with:

```javascript
tips: [
  'Your drive runs more efficiently when hull integrity is high. A damaged ship wastes fuel compensating for structural drag.',
  'The wormhole network has patterns. Some routes see less traffic, which means fewer pirates but also fewer rescue options.',
  'Parts are cheap at the core systems where they are manufactured. The further out you go, the more they cost.',
],
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/npc-data-definitions.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 7: Commit**

```
feat: add tips for Okonkwo and Tanaka NPCs

Both NPCs had empty tips arrays. Added 3 personality-appropriate,
mechanically truthful tips for each.
```

---

### Task 12: Update audit log and design doc

Mark all findings as resolved and clean up documentation.

**Files:**
- Modify: `docs/narrative-audit-log.md`
- Modify: `docs/plans/2026-02-28-narrative-truth-audit-design.md`

**Step 1: Update audit log**

Add "RESOLVED" status to each finding. Add a summary section at the top noting all 12 findings were addressed.

**Step 2: Update design doc**

Add implementation notes section referencing the commits.

**Step 3: Commit**

```
docs: mark all narrative audit findings as resolved
```
