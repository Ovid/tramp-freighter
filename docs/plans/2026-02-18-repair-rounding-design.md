# Repair Rounding Design

## Problem

Floating-point arithmetic produces ugly display values in the Repair panel:
- `Full (₡103.49999999999994)` — cost from `20.7 * 5`
- `Repair All to Full (₡678.5)` — sum of fractional costs
- `max 58.30000000000001%` — donation from `79.3 - 21`

## Root Cause

Several functions in `repairUtils.js` return raw floating-point results. Some functions already round (`calculateDiscountedRepairCost` uses `Math.round()`), but others don't, creating inconsistency.

## Approach

Round at the calculation layer. Every function that produces a value for display or comparison rounds its own output. No display-layer changes needed.

## Rounding Rules

- **Credits (costs):** `Math.ceil()` — always round up so players never pay less than true cost.
- **Percentages:** `Math.round()` — standard rounding for display clarity.

## Changes

All in `src/features/repair/repairUtils.js`:

| Function | Current | Change to |
|---|---|---|
| `calculateRepairCost` | raw `amount * COST_PER_PERCENT` | `Math.ceil()` |
| `calculateDiscountedRepairCost` | `Math.round()` | `Math.ceil()` |
| `calculateDiscountedRepairAllCost` | `Math.round()` | `Math.ceil()` |
| `calculateMaxDonation` | raw `donorCondition - DONOR_MIN` | `Math.round()` |
| `canAffordRepairAboveThreshold` | raw `needed * COST_PER_PERCENT` | `Math.ceil()` |

## Testing

Update existing unit tests to expect integer outputs. Add cases with fractional inputs (e.g., condition 79.3) to confirm rounding.
