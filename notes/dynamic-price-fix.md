# Dynamic Price Fluctuation Fix

## Problem

Prices were not changing visibly day-to-day despite the dynamic economy system being implemented. The user reported seeing no price changes between Sol and Barnard's Star over 18 days of gameplay.

## Root Causes

### 1. UI Not Passing Current Day
The primary issue was in `js/game-ui.js`. The `renderMarketGoods()` and `createCargoStackItem()` methods were calling `TradingSystem.calculatePrice()` using the Phase 1 API (passing only the spectral class string), which meant `currentDay` defaulted to 0 and prices were never recalculated as days passed.

**Before:**
```javascript
const price = TradingSystem.calculatePrice(goodType, system.type);
```

**After:**
```javascript
const currentDay = state.player.daysElapsed;
const activeEvents = state.world.activeEvents || [];
const price = TradingSystem.calculatePrice(goodType, system, currentDay, activeEvents);
```

### 2. Insufficient Fluctuation Range
The daily fluctuation range was ±30% (0.70 to 1.30), which was too small for low-priced goods. With grain's base price of 10 credits, a ±30% fluctuation only varied by ±3 credits. After applying other modifiers and rounding to integers, price changes were often invisible.

**Example with ±30% range:**
- Day 1: 10 × 1.2 (spectral) × 1.05 (station) × 0.85 (daily) = 10.71 → **11 credits**
- Day 2: 10 × 1.2 (spectral) × 1.05 (station) × 0.90 (daily) = 11.34 → **11 credits**
- Result: No visible change!

## Solution

### 1. Fixed UI to Pass Current Day
Updated both `renderMarketGoods()` and `createCargoStackItem()` in `js/game-ui.js` to use the Phase 2 API with `currentDay` and `activeEvents` parameters.

### 2. Increased Fluctuation Range to ±50%
Changed the daily fluctuation range from ±30% to ±50% (0.50 to 1.50).

**Updated in:**
- `js/game-constants.js`: Changed `DAILY_FLUCTUATION` constants
- `.kiro/specs/dynamic-economy/requirements.md`: Updated requirement 2.7
- `.kiro/specs/dynamic-economy/design.md`: Updated Property 5
- `tests/property/daily-fluctuation-range.property.test.js`: Updated test assertions

**Example with ±50% range:**
- Day 1: 10 × 1.2 (spectral) × 1.05 (station) × 0.70 (daily) = 8.82 → **9 credits**
- Day 2: 10 × 1.2 (spectral) × 1.05 (station) × 1.20 (daily) = 15.12 → **15 credits**
- Result: Clear 6 credit difference!

### 3. Added Comprehensive Tests
Created `tests/property/price-changes-over-time.property.test.js` with 6 property tests that validate:
- Prices differ on consecutive days
- Visible changes occur within a week for low-priced goods
- Substantial variation over 30 days
- Determinism (same day = same price)
- Most consecutive days have different prices after rounding
- All commodity types show visible changes

### 4. Fixed Existing Tests
Updated `tests/property/cargo-stack-display.property.test.js` to use the Phase 2 API with `currentDay` and `activeEvents` parameters.

## Verification

All 282 tests pass, including:
- 6 new property tests for price changes over time
- Updated daily fluctuation range tests
- All existing property and integration tests

## Impact

Players will now clearly see:
- Prices changing day-to-day as they travel
- Meaningful trading opportunities based on timing
- A dynamic economy that feels alive and responsive

The ±50% range ensures that even the lowest-priced commodity (grain at 10 credits) will show visible price swings of 5-15 credits, making the dynamic economy perceptible and engaging.
