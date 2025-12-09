# Unreliable Intelligence Feature

## Overview

The Information Broker now provides unreliable intelligence data, reflecting the shady nature of black market information. Additionally, old market data is automatically cleaned up to prevent clutter.

## Features Implemented

### 1. Unreliable Price Data

**Behavior**: When purchasing intelligence, each commodity price has a 10% chance of being manipulated to show a false profit opportunity.

**Implementation**:
- Uses seeded random based on `systemId` and `currentDay` for deterministic behavior
- Manipulated prices are multiplied by a factor between 0.7 and 0.85
- This makes them appear cheaper than actual prices, creating false buying opportunities
- Players who act on this intelligence will find the actual prices are higher when they arrive

**Constants** (in `game-constants.js`):
```javascript
export const INTELLIGENCE_RELIABILITY = {
  MANIPULATION_CHANCE: 0.1,  // 10% chance per commodity
  MIN_MANIPULATION_MULTIPLIER: 0.7,
  MAX_MANIPULATION_MULTIPLIER: 0.85,
};
```

**Determinism**: The same system on the same day will always produce the same manipulated prices, ensuring consistent gameplay and testability.

### 2. Automatic Data Cleanup

**Behavior**: Market data older than 100 days is automatically deleted when time advances.

**Implementation**:
- `InformationBroker.cleanupOldIntelligence()` removes systems where `lastVisit > 100`
- Called automatically in `GameStateManager.updateTime()` when days advance
- Prevents stale information from cluttering the player's knowledge base

**Constant** (in `game-constants.js`):
```javascript
export const INTELLIGENCE_MAX_AGE = 100;
```

## Files Modified

### Core Implementation
- `js/game-constants.js` - Added `INTELLIGENCE_RELIABILITY` and `INTELLIGENCE_MAX_AGE` constants
- `js/game-information-broker.js`:
  - Updated `purchaseIntelligence()` to add price manipulation
  - Added `cleanupOldIntelligence()` method
- `js/game-state.js` - Integrated cleanup into `updateTime()` method

### Tests
- `tests/unit/intelligence-reliability.test.js` - New test file (6 tests)
  - Verifies ~10% manipulation rate
  - Confirms manipulated prices are lower than actual
  - Tests determinism and variation
- `tests/unit/intelligence-cleanup.test.js` - New test file (9 tests)
  - Tests cleanup logic
  - Integration tests with GameStateManager
  - Verifies threshold behavior

## Gameplay Impact

### Strategic Considerations

**Risk vs Reward**:
- Intelligence is cheaper than traveling to check prices yourself
- But 10% of the time, the data will mislead you
- Players must decide: trust the intel or verify in person?

**False Profit Opportunities**:
- Manipulated prices appear 15-30% cheaper than actual
- This can make a system look very profitable when it's not
- Experienced players will learn to be skeptical of "too good to be true" deals

**Data Freshness**:
- Old data (>100 days) is automatically removed
- Encourages players to keep intelligence current
- Reduces clutter in the market data interface

### Example Scenario

1. Player purchases intelligence for Alpha Centauri on day 50
2. Intel shows grain at ₡8 (manipulated from actual ₡10)
3. Player thinks: "I can buy grain at Sol for ₡10 and sell at Alpha Centauri for ₡12, but this intel says I can buy there for ₡8!"
4. Player jumps to Alpha Centauri
5. Actual price is ₡10 - the intel was wrong
6. Player learns to be more cautious with intelligence data

## Testing

All 535 tests pass, including:
- 6 new tests for intelligence reliability
- 9 new tests for data cleanup
- All existing tests continue to pass

The implementation is fully deterministic and well-tested.

## Future Enhancements

Potential improvements:
- Add a "reliability rating" for the information broker that improves over time
- Allow players to "verify" intelligence by visiting systems, building trust
- Add different tiers of intelligence with varying reliability
- Show a warning icon for intelligence that's getting old (>50 days)
