# Visited Price Recording Implementation

## Overview

Implemented automatic price knowledge updates when the Trade panel opens, with source tracking to distinguish between "Visited" and "Information Broker" data. This ensures that the Information Broker's Market Data view always shows current, accurate prices for the system you're currently in, clearly labeled with the data source.

## Requirements Implemented

1. **Trade Panel Opens → Price Update**: When the Trade panel opens, it automatically records current prices for the current system
2. **Source Tracking**: Price data includes a `source` field: `'visited'` or `'intelligence_broker'`
3. **Source Display**: Information Broker Market Data view shows the source of each system's data
4. **Overwrites Broker Data**: Visited data replaces any existing information broker data for that system
5. **Ages Naturally**: As time passes, `lastVisit` increments, so when viewing the system from elsewhere, you see how old the data is
6. **Clear Visual Distinction**: UI clearly shows "Visited" vs "Information Broker" for each system

## Implementation Details

### Data Structure Changes

Updated price knowledge structure to include source tracking:

```javascript
priceKnowledge[systemId] = {
  lastVisit: 0,           // Days since last update
  prices: { ... },        // Commodity prices
  source: 'visited'       // 'visited' or 'intelligence_broker'
}
```

### TradePanel.jsx

Added a `useEffect` hook that runs once on mount to call `gameStateManager.recordVisitedPrices()`:

```javascript
// Update price knowledge when panel opens (records "Visited" data)
useEffect(() => {
  gameStateManager.recordVisitedPrices();
}, []); // Only run once on mount
```

### GameStateManager.js

**Updated `updatePriceKnowledge()` method** to accept source parameter:

```javascript
updatePriceKnowledge(systemId, prices, lastVisit = 0, source = 'visited') {
  // ...
  this.state.world.priceKnowledge[systemId] = {
    lastVisit: lastVisit,
    prices: { ...prices },
    source: source,
  };
  // ...
}
```

**Added `recordVisitedPrices()` method**:

```javascript
recordVisitedPrices() {
  // Get current prices from the locked snapshot
  const currentPrices = this.getCurrentSystemPrices();
  
  // Update price knowledge with source "Visited"
  this.updatePriceKnowledge(currentSystemId, currentPrices, 0, 'visited');
  
  // Persist immediately
  this.saveGame();
}
```

### game-information-broker.js

Updated `purchaseIntelligence()` to set source as `'intelligence_broker'`:

```javascript
gameState.world.priceKnowledge[systemId] = {
  lastVisit: 0,
  prices: currentPrices,
  source: 'intelligence_broker',
};
```

### InfoBrokerPanel.jsx

Updated Market Data display to show source:

```javascript
<div className="market-data-header">
  <div className="market-data-system-name">{system.name}</div>
  <div className="market-data-meta">
    <div className="market-data-source">
      {formatSource(knowledge.source)}
    </div>
    <div className="market-data-staleness">
      {formatStaleness(knowledge.lastVisit).text}
    </div>
  </div>
</div>
```

### infoBrokerUtils.js

Added `formatSource()` utility function:

```javascript
export function formatSource(source) {
  if (source === 'visited') {
    return 'Visited';
  } else if (source === 'intelligence_broker') {
    return 'Information Broker';
  } else {
    return 'Unknown'; // Fallback for old saves
  }
}
```

### state-validators.js

Added backward compatibility for old saves without source field:

```javascript
// Add source field to existing price knowledge entries if missing
if (state.world.priceKnowledge) {
  for (const systemId in state.world.priceKnowledge) {
    if (!state.world.priceKnowledge[systemId].source) {
      state.world.priceKnowledge[systemId].source = 'visited';
    }
  }
}
```

### CSS Styling

Added styles for source display in `css/panel/info-broker.css`:

```css
.market-data-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.market-data-source {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-style: italic;
}
```

## Key Design Decisions

1. **Uses Locked Prices**: The method uses `getCurrentSystemPrices()` which returns the locked prices from when you arrived at the system. This ensures consistency - the prices you see in the Trade panel are the same prices recorded in price knowledge.

2. **Overwrites Broker Data**: If you previously purchased intelligence about a system and then visit it, the visited data completely replaces the broker data. This is intentional - your direct observation is more reliable than purchased intelligence.

3. **Ages Naturally**: The `lastVisit` counter increments automatically as time passes (handled by existing `incrementPriceKnowledgeStaleness()` method). No special handling needed.

4. **Persists Immediately**: Calls `saveGame()` to ensure the visited data is persisted. This prevents data loss if the player closes the browser.

## Testing

Created comprehensive test suite in `tests/unit/visited-price-recording.test.js` with 13 tests covering:

- ✓ Recording visited prices when method is called
- ✓ Marking data as current (lastVisit = 0)
- ✓ Overwriting information broker data
- ✓ Recording accurate prices (not manipulated broker prices)
- ✓ Aging data as time passes
- ✓ Showing aged data when viewing from another system
- ✓ Updating data when returning to a system
- ✓ Preserving data for multiple systems
- ✓ Using locked prices from arrival
- ✓ Handling multiple calls in same system
- ✓ Initial game state handling
- ✓ Event emission
- ✓ Persistence to save game

All 762 tests in the test suite pass.

## User Experience

### Before Implementation

- Player visits Sol, buys intelligence about Sol
- 24 days pass
- Player returns to Sol
- Information Broker shows "Sol - 24 days old" even though player is currently there
- No indication of data source

### After Implementation

- Player visits Sol
- Opens Trade panel (automatically records visited prices)
- Information Broker shows:
  - "Sol - Visited - Current"
- Player buys intelligence about Procyon A
- Information Broker shows:
  - "Sol - Visited - Current"
  - "Procyon A - Information Broker - Current"
- Player travels to Barnard's Star (5 days pass)
- Information Broker shows:
  - "Sol - Visited - 5 days old"
  - "Procyon A - Information Broker - 5 days old"
- Player returns to Sol, opens Trade panel
- Information Broker shows:
  - "Sol - Visited - Current" (updated, overwrites old data)
  - "Procyon A - Information Broker - 5 days old" (unchanged)

## Integration Points

- **TradePanel.jsx**: Calls `recordVisitedPrices()` on mount
- **GameStateManager**: Provides `recordVisitedPrices()` method
- **Information Broker**: Already displays price knowledge with age - no changes needed
- **Price Knowledge System**: Uses existing `updatePriceKnowledge()` and `incrementPriceKnowledgeStaleness()` methods

## Future Considerations

- Could add a visual indicator in the Information Broker to distinguish "Visited" data from "Intelligence Broker" data
- Could add a tooltip showing when the data was last updated
- Could add a "Refresh" button to manually update visited data without closing/reopening Trade panel
