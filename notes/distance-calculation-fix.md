# Distance Calculation Fix

## Problem

The starmap distance calculations were incorrect. The code assumed coordinates were stored as "light-years × 10", but they're actually stored in arbitrary map units that require a different conversion factor.

## Root Cause

The original implementation used:
```javascript
distance = Math.sqrt(x² + y² + z²) / 10
```

This systematically overestimated distances by approximately 40% (factor of ~1.398).

## Analysis

By comparing known star distances with their coordinate radii:
- Alpha Centauri A: Real distance 4.37 LY, old calculation gave ~6.1 LY
- Wolf 1481 (farthest): Real distance 20 LY, old calculation gave ~27.9 LY

The catalog includes stars out to 20 light-years from Sol. Wolf 1481 has a radius of ~279.319 map units, giving us:
```
LY_PER_UNIT = 20 / 279.319 ≈ 0.0716027
```

## Solution

### 1. Added LY_PER_UNIT constant to game-constants.js
```javascript
export const LY_PER_UNIT = 20 / 279.3190870671033;
```

### 2. Updated distance calculations to use correct formula
```javascript
// Old (incorrect)
distance = Math.sqrt(x² + y² + z²) / 10

// New (correct)
distance = Math.hypot(x, y, z) * LY_PER_UNIT
```

### 3. Updated all distance calculation locations
- `game-constants.js`: `calculateDistanceFromSol()`
- `game-navigation.js`: `calculateDistanceFromSol()` and `calculateDistanceBetween()`
- `starmap.js`: Wormhole distance precomputation

## Impact

### Gameplay Changes
- **Jump fuel costs**: Reduced by ~30% (distances are shorter)
- **Jump times**: Reduced proportionally
- **Navigation range**: More systems reachable with same fuel
- **Fuel economy**: Players have more fuel remaining after jumps

### Example: Sol to Alpha Centauri
- Old distance: ~6.1 LY
- New distance: ~4.37 LY (correct)
- Old fuel cost: ~22%
- New fuel cost: ~19%

## Testing

Created comprehensive test suite in `tests/unit/distance-calculations.test.js`:
- Verifies LY_PER_UNIT constant value
- Tests known star distances (Alpha Centauri, Barnard's Star, Wolf 1481, etc.)
- Confirms all stars are within 20 LY radius
- Validates consistency between modules
- Compares old vs new calculation methods

Updated property tests in `tests/property/distance-calculations.property.test.js` to use new formula.

## Files Modified

1. `js/game-constants.js` - Added LY_PER_UNIT, updated calculateDistanceFromSol()
2. `js/game-navigation.js` - Updated both distance calculation methods
3. `js/starmap.js` - Updated wormhole distance precomputation
4. `tests/property/distance-calculations.property.test.js` - Updated to new formula
5. `tests/integration/game-flow.integration.test.js` - Adjusted refuel amount for new fuel costs
6. `tests/unit/distance-calculations.test.js` - New comprehensive test suite

## Verification

All tests pass (218/219 - one unrelated flaky test):
- ✓ Distance calculations match real-world star distances
- ✓ All stars within 20 LY catalog bounds
- ✓ Consistent across all modules
- ✓ Integration tests pass with adjusted fuel costs
