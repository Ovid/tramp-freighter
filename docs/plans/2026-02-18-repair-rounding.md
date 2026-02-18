# Repair Rounding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate floating-point display artifacts in the Repair panel by rounding at the calculation layer.

**Architecture:** Five functions in `src/features/repair/repairUtils.js` return raw floating-point values. Wrap credit-producing functions with `Math.ceil()` (costs always round up) and percentage-producing functions with `Math.round()`. No display-layer changes needed.

**Tech Stack:** Vitest, fast-check for property tests

---

### Task 1: Add rounding tests for `calculateRepairCost`

**Files:**
- Modify: `tests/unit/cannibalize-utils.test.js`

**Step 1: Write the failing tests**

Add a new `describe` block at the end of the file, before the final closing `});`:

```js
describe('calculateRepairCost rounding', () => {
  it('returns an integer when amount is fractional', () => {
    // 20.7 * 5 = 103.5 → should ceil to 104
    const result = calculateRepairCost(20.7, 0);
    expect(result).toBe(104);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns an integer for whole-number amounts', () => {
    // 10 * 5 = 50 → already integer, unchanged
    const result = calculateRepairCost(10, 0);
    expect(result).toBe(50);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('rounds up fractional costs (ceil)', () => {
    // 10.1 * 5 = 50.5 → should ceil to 51
    const result = calculateRepairCost(10.1, 0);
    expect(result).toBe(51);
  });
});
```

Also add `calculateRepairCost` to the import at the top of the file:

```js
import {
  calculateCannibalizeRequired,
  calculateMaxDonation,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateRepairCost,
} from '../../src/features/repair/repairUtils.js';
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: 3 FAIL — `calculateRepairCost(20.7, 0)` returns `103.49999...` not `104`

**Step 3: Implement rounding in `calculateRepairCost`**

Modify: `src/features/repair/repairUtils.js:19`

Change:
```js
  return amount * REPAIR_CONFIG.COST_PER_PERCENT;
```

To:
```js
  return Math.ceil(amount * REPAIR_CONFIG.COST_PER_PERCENT);
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/features/repair/repairUtils.js tests/unit/cannibalize-utils.test.js
git commit -m "fix: round calculateRepairCost with Math.ceil"
```

---

### Task 2: Add rounding tests for `calculateMaxDonation`

**Files:**
- Modify: `tests/unit/cannibalize-utils.test.js`

**Step 1: Write the failing test**

Add to the existing `calculateMaxDonation` describe block:

```js
    it('returns an integer when donor condition is fractional', () => {
      // 79.3 - 21 = 58.3 → should round to 58
      expect(calculateMaxDonation(79.3)).toBe(58);
      expect(Number.isInteger(calculateMaxDonation(79.3))).toBe(true);
    });

    it('rounds correctly at .5 boundary', () => {
      // 79.5 - 21 = 58.5 → should round to 59
      expect(calculateMaxDonation(79.5)).toBe(59);
    });
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: 2 FAIL — `calculateMaxDonation(79.3)` returns `58.30000000000001`

**Step 3: Implement rounding in `calculateMaxDonation`**

Modify: `src/features/repair/repairUtils.js:231`

Change:
```js
  return Math.max(0, donorCondition - REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN);
```

To:
```js
  return Math.max(0, Math.round(donorCondition - REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN));
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/features/repair/repairUtils.js tests/unit/cannibalize-utils.test.js
git commit -m "fix: round calculateMaxDonation with Math.round"
```

---

### Task 3: Add rounding tests for `canAffordRepairAboveThreshold`

**Files:**
- Modify: `tests/unit/cannibalize-utils.test.js`

**Step 1: Write the failing test**

Add to the existing `canAffordRepairAboveThreshold` describe block:

```js
    it('uses ceiled cost for affordability check with fractional condition', () => {
      // Condition 4.3, needs 16.7% to reach 21. Cost = 16.7 * 5 = 83.5 → ceil to 84
      // With exactly 83 credits: should NOT be affordable
      expect(canAffordRepairAboveThreshold(4.3, 83)).toBe(false);
      // With exactly 84 credits: should be affordable
      expect(canAffordRepairAboveThreshold(4.3, 84)).toBe(true);
    });
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: FAIL — raw cost is 83.5, so `83 >= 83.5` is false (accidentally correct) but `84 >= 83.5` is true. Actually the first assertion passes by accident. Let me use a case that actually fails:

The real test is that the boundary is at 84, not 83.5. With raw math, `canAffordRepairAboveThreshold(4.3, 83.5)` would return `true` (83.5 >= 83.5). With ceil, it returns `false` (83.5 < 84). But credits are always integers so this edge case won't actually trigger in practice. The test should verify the ceiled cost value indirectly:

```js
    it('uses ceiled cost for affordability check with fractional condition', () => {
      // Condition 4.7, needs 16.3% to reach 21. Cost = 16.3 * 5 = 81.5 → ceil to 82
      // With 81 credits: should NOT be affordable (81 < 82)
      expect(canAffordRepairAboveThreshold(4.7, 81)).toBe(false);
      // With 82 credits: should be affordable (82 >= 82)
      expect(canAffordRepairAboveThreshold(4.7, 82)).toBe(true);
    });
```

**Step 2 (corrected): Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: FAIL — with raw math cost is 81.5, so `81 >= 81.5` is false (accidentally passes), but `82 >= 81.5` is true (passes). Both pass by accident with raw math too! The rounding only matters at the exact boundary. Use a different approach — test that the internal cost is an integer by testing the exact boundary:

Actually, the simplest test:

```js
    it('uses ceiled cost for affordability check with fractional condition', () => {
      // Condition 4.7, needs 16.3% to reach 21. Raw cost = 81.5
      // Without ceil: 82 >= 81.5 = true (correct)
      // With ceil: cost becomes 82, so 82 >= 82 = true (correct)
      // The real difference: someone with 81.5 credits (impossible since credits are int)
      // Just verify the function returns boolean and handles fractional conditions
      expect(canAffordRepairAboveThreshold(4.7, 82)).toBe(true);
      expect(canAffordRepairAboveThreshold(4.7, 81)).toBe(false);
    });
```

This test passes either way. Since `canAffordRepairAboveThreshold` is a comparison function and credits are always integers, the ceil only matters for internal consistency. Just apply the fix without a dedicated test — the existing tests still pass.

**Step 3: Implement rounding in `canAffordRepairAboveThreshold`**

Modify: `src/features/repair/repairUtils.js:244`

Change:
```js
  const cost = needed * REPAIR_CONFIG.COST_PER_PERCENT;
```

To:
```js
  const cost = Math.ceil(needed * REPAIR_CONFIG.COST_PER_PERCENT);
```

**Step 4: Run tests to verify existing tests still pass**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/features/repair/repairUtils.js
git commit -m "fix: round canAffordRepairAboveThreshold cost with Math.ceil"
```

---

### Task 4: Switch discounted functions from `Math.round` to `Math.ceil`

**Files:**
- Modify: `src/features/repair/repairUtils.js:36,84`

**Step 1: Write the failing test**

Add to `tests/unit/cannibalize-utils.test.js`:

```js
describe('Discounted repair cost rounding', () => {
  it('calculateDiscountedRepairCost uses ceil not round', () => {
    // 10 * 5 = 50, discount 0.15 → 50 * 0.85 = 42.5 → ceil = 43
    const result = calculateDiscountedRepairCost(10, 0, 0.15);
    expect(result).toBe(43);
  });

  it('calculateDiscountedRepairAllCost uses ceil not round', () => {
    // hull needs 10%, engine needs 10%, LS at 100%
    // hull cost: ceil(10 * 5) = 50, engine cost: ceil(10 * 5) = 50, total = 100
    // discount 0.15 → 100 * 0.85 = 85 → ceil = 85 (exact, no difference)
    // Use a discount that produces a fraction:
    // total 100, discount 0.33 → 100 * 0.67 = 67 → ceil = 67 (exact)
    // total 100, discount 0.1 → 100 * 0.9 = 90 (exact)
    // Need: amount that gives fractional discounted total
    // hull needs 7%, engine needs 7%, LS at 100%
    // hull cost: ceil(7*5)=35, engine: ceil(7*5)=35, total=70
    // discount 0.15 → 70 * 0.85 = 59.5 → ceil = 60
    const condition = { hull: 93, engine: 93, lifeSupport: 100 };
    const result = calculateDiscountedRepairAllCost(condition, 0.15);
    expect(result).toBe(60);
  });
});
```

Also add to the import:

```js
import {
  calculateCannibalizeRequired,
  calculateMaxDonation,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateRepairCost,
  calculateDiscountedRepairCost,
  calculateDiscountedRepairAllCost,
} from '../../src/features/repair/repairUtils.js';
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: FAIL — `calculateDiscountedRepairCost(10, 0, 0.15)` returns `43` with `Math.round(42.5)` which is... 43. Actually `Math.round(42.5)` is 43 in JS (round half to even? No, JS rounds .5 up). So this passes! Use a value where round and ceil differ:

```js
  it('calculateDiscountedRepairCost uses ceil not round', () => {
    // 10 * 5 = 50, discount 0.17 → 50 * 0.83 = 41.5 → round = 42, ceil = 42
    // 10 * 5 = 50, discount 0.03 → 50 * 0.97 = 48.5 → round = 49, ceil = 49
    // round and ceil agree on .5 (both go up). They disagree on .1-.4:
    // 10 * 5 = 50, discount 0.14 → 50 * 0.86 = 43.0 (exact)
    // Need: baseCost * (1 - discount) to end in .1-.4
    // 15 * 5 = 75, discount 0.12 → 75 * 0.88 = 66.0 (exact)
    // 13 * 5 = 65, discount 0.12 → 65 * 0.88 = 57.2 → round = 57, ceil = 58
    const result = calculateDiscountedRepairCost(13, 0, 0.12);
    expect(result).toBe(58);
  });
```

**Step 2 (corrected): Run tests to verify they fail**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: FAIL — `Math.round(57.2)` returns `57`, but we expect `58`

**Step 3: Implement the change**

Modify: `src/features/repair/repairUtils.js:36`

Change:
```js
  return Math.round(baseCost * (1 - discountPercentage));
```

To:
```js
  return Math.ceil(baseCost * (1 - discountPercentage));
```

Modify: `src/features/repair/repairUtils.js:84`

Change:
```js
  return Math.round(baseCost * (1 - discountPercentage));
```

To:
```js
  return Math.ceil(baseCost * (1 - discountPercentage));
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/features/repair/repairUtils.js tests/unit/cannibalize-utils.test.js
git commit -m "fix: switch discounted repair costs from Math.round to Math.ceil"
```

---

### Task 5: Add property test for integer outputs

**Files:**
- Modify: `tests/property/repair-utils-purity.property.test.js`

**Step 1: Write the property test**

Add at the end of the file, inside the top-level `describe`:

```js
  it('calculateRepairCost always returns an integer', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (amount, currentCondition) => {
          const result = calculateRepairCost(amount, currentCondition);
          expect(Number.isInteger(result)).toBe(true);
          return Number.isInteger(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateRepairAllCost always returns an integer', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        fc.float({ min: 0, max: 99, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const condition = { hull, engine, lifeSupport };
          const result = calculateRepairAllCost(condition);
          expect(Number.isInteger(result)).toBe(true);
          return Number.isInteger(result);
        }
      ),
      { numRuns: 100 }
    );
  });
```

Also add `calculateRepairAllCost` to the import if not already there.

**Step 2: Run tests to verify they pass**

Run: `npm test -- tests/property/repair-utils-purity.property.test.js`
Expected: ALL PASS (these should pass now that Task 1 already fixed `calculateRepairCost`)

**Step 3: Commit**

```bash
git add tests/property/repair-utils-purity.property.test.js
git commit -m "test: add property tests for integer repair cost outputs"
```

---

### Task 6: Run full test suite and verify

**Step 1: Run all tests**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run lint and format**

Run: `npm run lint && npm run format:check`
Expected: No errors

**Step 3: Fix any issues if needed**

If format check fails: `npx prettier --write <file>`
If lint fails: fix the issue

**Step 4: Commit any fixes**

Only if needed from Step 3.
