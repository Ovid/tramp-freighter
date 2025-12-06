# Refuel Max Button Fix

## Problem
When clicking the "Max" button in the refuel panel with fractional fuel values (e.g., 57.1%), the refuel would fail silently. The button would be disabled and clicking "Confirm Refuel" would do nothing.

## Root Cause
Floating point precision issue in the max calculation:

1. **Actual fuel**: 57.1%
2. **UI calculation**: `Math.round(57.1)` = 57, then `100 - 57` = 43%
3. **Validation check**: `57.1 + 43 = 100.1%` > 100% ❌ FAIL
4. **Result**: Button disabled, no error message shown

The mismatch between using rounded fuel for calculation but actual fuel for validation caused the failure.

## Solution

### Code Changes

**js/game-ui.js - `setRefuelAmountToMax()`:**
```javascript
// Before:
const currentFuel = Math.round(state.ship.fuel);
const maxCapacity = 100 - currentFuel;

// After:
const currentFuel = state.ship.fuel; // Use actual value
const maxCapacity = Math.floor(100 - currentFuel); // Floor to be safe
```

**js/game-state.js - `validateRefuel()`:**
```javascript
// Before:
if (currentFuel + amount > 100) {

// After:
if (currentFuel + amount > 100.01) { // Small epsilon for floating point
```

### Why This Works

1. **Use actual fuel value**: No rounding means calculation matches validation
2. **Floor the max capacity**: `Math.floor(100 - 57.1)` = 42%, which is safe
3. **Add epsilon to validation**: Handles floating point precision (0.01% tolerance)

### Example
With 57.1% fuel and 441 credits at Sol (2 cr/% fuel price):

- Max capacity: `Math.floor(100 - 57.1)` = 42%
- Max affordable: `Math.floor(441 / 2)` = 220%
- Max amount: `min(42, 220)` = 42%
- Validation: `57.1 + 42 = 99.1%` ≤ 100.01% ✅ PASS
- Cost: 42 × 2 = 84 cr
- Result: Button enabled, refuel succeeds

## Test Coverage

Added comprehensive test file: `tests/property/refuel-max-calculation.property.test.js`

**7 new tests (all passing):**

1. ✅ Calculate max refuel amount without exceeding 100% capacity
   - Tests multiple fractional fuel values (57.1%, 57.9%, 50.5%, etc.)
   - Verifies max calculation matches expected values
   - Confirms validation passes for calculated max

2. ✅ Handle refuel validation with fractional fuel values
   - Tests exact amount to reach 100%
   - Verifies amounts exceeding capacity are rejected

3. ✅ Successfully refuel with max amount from fractional fuel
   - Tests complete refuel transaction
   - Verifies fuel and credits update correctly

4. ✅ Limit max refuel by available credits when credits are low
   - Tests credit constraint takes precedence over capacity
   - Verifies one more unit would fail due to insufficient credits

5. ✅ Handle edge case of nearly full tank with fractional fuel
   - Tests 99.1%, 99.5%, 99.9%, 99.01%, 99.99%
   - Verifies max capacity is 0 for all cases
   - Confirms validation rejects 0 amount (must be positive)

6. ✅ Handle floating point precision in capacity check
   - Tests with many decimal places (57.123456789%)
   - Verifies floor operation prevents precision issues

7. ✅ Maintain consistency between max calculation and validation
   - Tests 8 different fractional fuel values
   - Verifies calculated max always passes validation
   - Confirms refuel succeeds and doesn't exceed 100%

## Test Statistics

- **Total Tests**: 166 (up from 159)
- **New Tests**: 7
- **Pass Rate**: 100%
- **Test Files**: 34

## User Impact

**Before:**
- Click "Max" with fractional fuel → Button disabled
- No error message
- Confusing user experience

**After:**
- Click "Max" with fractional fuel → Correct amount calculated
- Button enabled
- Refuel works as expected
- Shows correct cost

## Edge Cases Handled

- ✅ Fractional fuel values (57.1%, 57.9%, etc.)
- ✅ Nearly full tank (99.x%)
- ✅ Low credits limiting max refuel
- ✅ Floating point precision issues
- ✅ Exact refuel to 100%
- ✅ Multiple decimal places
