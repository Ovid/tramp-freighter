# Economic Events Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make economic events reliable, profitable trade signals with clear UI showing what commodities are needed and where.

**Architecture:** Remove Supply Glut event type. Replace event price calculation with guaranteed-profit formula based on galaxy-wide max normal price. Move event display from current system panel to destination system cards.

**Tech Stack:** React 18, Vitest, existing TradingSystem/EconomicEventsSystem classes

---

### Task 1: Add EVENT_PREMIUM constant and precomputed galaxy max prices

**Files:**
- Modify: `src/game/constants.js` (add EVENT_PREMIUM to ECONOMY_CONFIG)
- Modify: `src/game/game-trading.js` (add `getGalaxyMaxNormalPrice` and `getEventPrice`)
- Test: `tests/unit/game-trading.test.js`

**Step 1: Write failing tests for galaxy max price and event price**

Add to the end of `tests/unit/game-trading.test.js`:

```javascript
describe('TradingSystem.getGalaxyMaxNormalPrice', () => {
  it('returns a positive integer for each commodity', () => {
    for (const goodType of COMMODITY_TYPES) {
      const price = TradingSystem.getGalaxyMaxNormalPrice(goodType);
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });

  it('exceeds the base price for every commodity', () => {
    for (const goodType of COMMODITY_TYPES) {
      const maxPrice = TradingSystem.getGalaxyMaxNormalPrice(goodType);
      expect(maxPrice).toBeGreaterThan(BASE_PRICES[goodType]);
    }
  });

  it('throws for unknown good type', () => {
    expect(() => TradingSystem.getGalaxyMaxNormalPrice('unobtainium')).toThrow();
  });
});

describe('TradingSystem.getEventPrice', () => {
  it('exceeds galaxy max normal price for every commodity', () => {
    for (const goodType of COMMODITY_TYPES) {
      const eventPrice = TradingSystem.getEventPrice(goodType);
      const maxNormal = TradingSystem.getGalaxyMaxNormalPrice(goodType);
      expect(eventPrice).toBeGreaterThan(maxNormal);
    }
  });

  it('returns a positive integer for each commodity', () => {
    for (const goodType of COMMODITY_TYPES) {
      const price = TradingSystem.getEventPrice(goodType);
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });
});
```

Also add this import at the top of the test file (it should already have `COMMODITY_TYPES` imported, also add `BASE_PRICES`):

```javascript
import { EVENT_NAMES, COMMODITY_TYPES, BASE_PRICES } from '../../src/game/constants.js';
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/game-trading.test.js`
Expected: FAIL — `TradingSystem.getGalaxyMaxNormalPrice is not a function`

**Step 3: Add EVENT_PREMIUM to constants.js**

In `src/game/constants.js`, add `EVENT_PREMIUM: 1.5,` inside the `ECONOMY_CONFIG` object, after the `MARKET_CONDITION_PRUNE_THRESHOLD` line.

**Step 4: Implement getGalaxyMaxNormalPrice and getEventPrice**

In `src/game/game-trading.js`, add these two static methods to the `TradingSystem` class:

```javascript
  /**
   * Calculate the highest price a commodity could naturally reach at any system.
   *
   * Uses the worst-case tech modifier (the tech level that maximizes price
   * for this commodity's bias) and peak temporal oscillation (1.15).
   * Local modifier is excluded since it's player-driven.
   *
   * @param {string} goodType - Commodity type
   * @returns {number} Galaxy max normal price (rounded integer)
   */
  static getGalaxyMaxNormalPrice(goodType) {
    const basePrice = BASE_PRICES[goodType];
    if (basePrice === undefined) {
      throw new Error(`Unknown good type: ${goodType}`);
    }

    const bias = ECONOMY_CONFIG.TECH_BIASES[goodType];
    // Worst-case tech level: frontier (1.0) for positive bias, core (10.0) for negative bias
    const worstTechLevel = bias > 0
      ? ECONOMY_CONFIG.MIN_TECH_LEVEL
      : ECONOMY_CONFIG.MAX_TECH_LEVEL;
    const techMod = TradingSystem.getTechModifier(goodType, worstTechLevel);
    const peakTemporal = 1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE;

    return Math.ceil(basePrice * techMod * peakTemporal);
  }

  /**
   * Calculate guaranteed-profit event price for a commodity.
   *
   * Returns galaxyMaxNormalPrice × EVENT_PREMIUM, ensuring the event price
   * exceeds the highest price this commodity could naturally reach anywhere.
   *
   * @param {string} goodType - Commodity type
   * @returns {number} Event price (rounded integer)
   */
  static getEventPrice(goodType) {
    const maxNormal = TradingSystem.getGalaxyMaxNormalPrice(goodType);
    return Math.ceil(maxNormal * ECONOMY_CONFIG.EVENT_PREMIUM);
  }
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/game-trading.test.js`
Expected: PASS

**Step 6: Commit**

```
git add src/game/constants.js src/game/game-trading.js tests/unit/game-trading.test.js
git commit -m "Add guaranteed-profit event pricing: getGalaxyMaxNormalPrice and getEventPrice"
```

---

### Task 2: Wire event pricing into calculatePrice

**Files:**
- Modify: `src/game/game-trading.js` (change `calculatePrice` to use event prices)
- Test: `tests/unit/game-trading.test.js`

**Step 1: Write failing test for event price override in calculatePrice**

Add to the `TradingSystem.calculatePrice` describe block in `tests/unit/game-trading.test.js`:

```javascript
  it('uses guaranteed event price when event affects the commodity', () => {
    // Sol system — electronics normally cheap here due to tech bias
    const solSystem = { id: 0, x: 0, y: 0, z: 0 };
    const events = [{ systemId: 0, modifiers: { electronics: 1.75 } }];

    const eventPrice = TradingSystem.calculatePrice(
      'electronics', solSystem, 10, events
    );
    const expectedEventPrice = TradingSystem.getEventPrice('electronics');

    expect(eventPrice).toBe(expectedEventPrice);
  });

  it('uses normal price for commodities NOT affected by the event', () => {
    const solSystem = { id: 0, x: 0, y: 0, z: 0 };
    // Event only affects electronics
    const events = [{ systemId: 0, modifiers: { electronics: 1.75 } }];

    const eventPrice = TradingSystem.calculatePrice(
      'ore', solSystem, 10, events
    );
    const normalPrice = TradingSystem.calculatePrice(
      'ore', solSystem, 10, []
    );

    expect(eventPrice).toBe(normalPrice);
  });
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/game-trading.test.js`
Expected: FAIL — the first test will fail because `calculatePrice` still uses the old multiplicative formula

**Step 3: Modify calculatePrice to use event price override**

In `src/game/game-trading.js`, modify the `calculatePrice` method. Replace the body after the system validation with:

```javascript
    // Check if an economic event overrides this commodity's price at this system.
    // IMPORTANT: All event modifiers must be > 1.0. A sub-1.0 modifier (e.g. 0.6)
    // would incorrectly trigger guaranteed-premium pricing instead of reducing prices.
    // Supply Glut (the only sub-1.0 event) was removed for this reason.
    const eventMod = TradingSystem.getEventModifier(
      system.id,
      goodType,
      activeEvents
    );
    if (eventMod !== 1.0) {
      // Event active for this commodity — use guaranteed-profit price
      return TradingSystem.getEventPrice(goodType);
    }

    // Calculate all modifiers (normal formula)
    const techLevel = TradingSystem.calculateTechLevel(system);
    const techMod = TradingSystem.getTechModifier(goodType, techLevel);
    const temporalMod = TradingSystem.getTemporalModifier(
      system.id,
      currentDay
    );
    const localMod = TradingSystem.getLocalModifier(
      system.id,
      goodType,
      marketConditions
    );

    // Apply complete formula (no event modifier — it's been handled above)
    const price = basePrice * techMod * temporalMod * localMod;
    return Math.round(price);
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/game-trading.test.js`
Expected: PASS. The existing test `applies event modifiers when active events affect the system` should still pass because the event price is guaranteed to be greater than the normal price.

**Step 5: Commit**

```
git add src/game/game-trading.js tests/unit/game-trading.test.js
git commit -m "Wire guaranteed event pricing into calculatePrice"
```

---

### Task 3: Remove Supply Glut event type

**Files:**
- Modify: `src/game/game-events.js` (remove supply_glut from EVENT_TYPES and createEvent)
- Modify: `src/game/game-information-broker.js` (remove supply_glut description)
- Test: `tests/unit/game-events.test.js`
- Test: `tests/unit/events-manager-coverage.test.js`
- Test: `tests/unit/economic-events-lifecycle.test.js`
- Test: `tests/unit/information-broker-coverage.test.js`

**Step 1: Update game-events.js — remove supply_glut**

In `src/game/game-events.js`:

1. Remove the entire `supply_glut` entry from `EVENT_TYPES` (lines 53-62).
2. Remove the supply_glut special case in `createEvent` (lines 196-204). The code block starting with `if (eventTypeKey === 'supply_glut')` and ending before the `return` statement.
3. In `removeExpiredEvents`, also filter out events whose type is not in `EVENT_TYPES`. This handles save compatibility — old saves may have active `supply_glut` events that would otherwise persist and (incorrectly) trigger guaranteed premium pricing via the `!== 1.0` check. Update the method to:

```javascript
  static removeExpiredEvents(activeEvents, currentDay) {
    if (!Array.isArray(activeEvents)) {
      return [];
    }

    return activeEvents.filter((event) => {
      // Remove expired events
      if (event.endDay < currentDay) return false;
      // Remove events whose type no longer exists (e.g. supply_glut from old saves)
      if (!EconomicEventsSystem.EVENT_TYPES[event.type]) return false;
      return true;
    });
  }
```

**Step 1b: Add test for save compatibility filter**

Add to the `removeExpiredEvents` describe block in `tests/unit/game-events.test.js`:

```javascript
    it('removes events with unknown type (save compatibility)', () => {
      const events = [
        { id: 'e1', type: 'supply_glut', endDay: 200 },
        { id: 'e2', type: 'mining_strike', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e2');
    });
```

**Step 2: Remove supply_glut from information broker**

In `src/game/game-information-broker.js`, remove the line `supply_glut: 'oversupply issues',` from the `eventDescriptions` object (around line 191).

**Step 3: Update test files — remove supply_glut tests and references**

In `tests/unit/game-events.test.js`:
- Remove the test `creates supply_glut event with single commodity at 0.6` (lines 158-165)
- Remove the test `triggers a supply_glut event when roll is below chance threshold` (lines 377-389)
- Remove the test `supply_glut event has a single commodity modifier at 0.6` (lines 391-405)
- In the test `can trigger different event types on different systems in same update` (line 513-529): This test expects `supply_glut` to trigger on system 0 day 1. Update it to verify two non-supply_glut events fire. Since supply_glut won't exist, the seeded rolls may trigger different events. The simplest fix is to change this test to just verify that result contains events on different systems:
```javascript
    it('can trigger different event types on different systems in same update', () => {
      // Multiple systems can each get different event types in the same update
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 15, type: 'M3V' },
      ];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // mining_strike should trigger on system 15 (M-class, eligible)
      const miningStrike = result.find((e) => e.type === 'mining_strike');
      expect(miningStrike).toBeDefined();
      expect(miningStrike.systemId).toBe(15);
    });
```
- In the test `expired event on a system allows new event on that system`: Update the expired event type from `supply_glut` to `medical_emergency` and update the expected new event type. The key assertion is that after an expired event is removed, a new event can trigger. Update to:
```javascript
    it('expired event on a system allows new event on that system', () => {
      const starData = [{ id: 0, type: 'G2V' }];
      const expiredEvent = {
        id: 'old_event',
        type: 'medical_emergency',
        systemId: 0,
        endDay: 0,
      };
      const state = makeGameState(1, [expiredEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // Old event gone
      expect(result.find((e) => e.id === 'old_event')).toBeUndefined();
      // System 0 is now eligible for new events since the old one expired
    });
```
- In the `EVENT_TYPES constant` describe: remove `supply_glut` from the `has all expected event types` test (line 669). Change from:
```javascript
      expect(types).toContain('supply_glut');
```
to just remove that line.

In `tests/unit/events-manager-coverage.test.js`:
- Change the test data `{ systemId: 3, type: 'supply_glut' }` to `{ systemId: 3, type: 'mining_strike' }`.

In `tests/unit/economic-events-lifecycle.test.js`:
- Remove the test `copies modifiers from event type definition for non-supply_glut events` — rename it to `copies modifiers from event type definition` and keep the body the same.
- Remove the test `gives supply_glut events exactly one random commodity at 0.6 modifier`.
- Remove the test `picks supply_glut commodity from COMMODITY_TYPES`.

In `tests/unit/information-broker-coverage.test.js`:
- Remove `'supply_glut'` from the expected event types array (line 289), and remove `'oversupply issues'` from the expected descriptions array if it exists nearby.

**Step 4: Run all tests to verify**

Run: `npm test`
Expected: PASS (all tests)

**Step 5: Commit**

```
git add -A
git commit -m "Remove Supply Glut event type"
```

---

### Task 4: Update event durations and descriptions

**Files:**
- Modify: `src/game/game-events.js` (update durations and descriptions)
- Test: `tests/unit/game-events.test.js`

**Step 1: Write failing test for new durations**

Add to `tests/unit/game-events.test.js` in the `createEvent` describe block:

```javascript
    it('medical_emergency duration is between 8 and 14 days', () => {
      const event = EconomicEventsSystem.createEvent('medical_emergency', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(8);
      expect(duration).toBeLessThanOrEqual(14);
    });

    it('festival duration is between 7 and 12 days', () => {
      const event = EconomicEventsSystem.createEvent('festival', SOL_SYSTEM_ID, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(7);
      expect(duration).toBeLessThanOrEqual(12);
    });

    it('mining_strike duration is between 10 and 18 days', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThanOrEqual(18);
    });
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/game-events.test.js`
Expected: FAIL — durations still use old ranges

**Step 3: Update durations and descriptions in game-events.js**

In `src/game/game-events.js`, update `EVENT_TYPES`:

- `mining_strike.duration`: change `[5, 10]` to `[10, 18]`
- `mining_strike.description`: change `'Workers demand better conditions'` to `'Workers strike — ore and tritium in short supply'`
- `medical_emergency.duration`: change `[3, 5]` to `[8, 14]`
- `medical_emergency.description`: change `'Outbreak requires urgent supplies'` to `'Outbreak requires urgent medicine'`
- `festival.duration`: change `[2, 4]` to `[7, 12]`
- `festival.description`: change `'Celebration drives luxury demand'` to `'Celebration drives demand for electronics and grain'`

Also remove the `grain: 0.9` and `ore: 0.9` modifiers from `medical_emergency` — those were "demand reduction" modifiers for a supply-based system. With guaranteed profit pricing, they're no longer meaningful (they'd trigger guaranteed event prices on unrelated goods, which is wrong).

**Step 4: Update the existing duration test for mining_strike**

The test `generates duration within configured range` (line 179-186) checks `[5, 10]`. Update it to check `[10, 18]`:

```javascript
    it('generates duration within configured range', () => {
      const eventType = EconomicEventsSystem.EVENT_TYPES.mining_strike;
      const [minDuration, maxDuration] = eventType.duration;
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(minDuration);
      expect(duration).toBeLessThanOrEqual(maxDuration);
    });
```

This test references the event type dynamically, so it should pass after the constant change. But also update the `triggered event has correct endDay within duration range` test (line 466-478) which hardcodes `[5, 10]`:

Change:
```javascript
      expect(duration).toBeGreaterThanOrEqual(5);
      expect(duration).toBeLessThanOrEqual(10);
```
To:
```javascript
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThanOrEqual(18);
```

Also update the `creates medical_emergency event with correct modifiers` test — remove assertions for `grain` and `ore`:

```javascript
    it('creates medical_emergency event with correct modifiers', () => {
      const event = EconomicEventsSystem.createEvent(
        'medical_emergency',
        10,
        100
      );
      expect(event.modifiers.medicine).toBe(2.0);
    });
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/game-events.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 7: Commit**

```
git add src/game/game-events.js tests/unit/game-events.test.js
git commit -m "Update event durations (longer for reachability) and descriptions (name commodities)"
```

---

### Task 5: Move event display to destination system cards in SystemPanel

**Files:**
- Modify: `src/features/navigation/SystemPanel.jsx`
- Modify: `css/system-event-info.css` (adjust styles for inline event display on destination cards)

**Step 1: Remove event display from current system section**

In `src/features/navigation/SystemPanel.jsx`, remove the event lookup and display from the current-system view:

1. Remove the block that checks for advanced sensors and looks up events (lines 260-270):
```javascript
  // Check for active economic event (if Advanced Sensors installed)
  const hasAdvancedSensors = upgrades.includes('advanced_sensors');
  let activeEvent = null;
  let eventType = null;

  if (hasAdvancedSensors) {
    activeEvent = game.getActiveEventForSystem(currentSystemId);
    if (activeEvent) {
      eventType = game.getEventType(activeEvent.type);
    }
  }
```

2. Remove the JSX block that renders the event card (lines 313-321):
```jsx
        {/* Economic Event Info (if Advanced Sensors installed) */}
        {hasAdvancedSensors && activeEvent && eventType && (
          <div className="system-event-info">
            <div className="event-indicator">
              <span className="event-icon">📊</span>
              <span className="event-name">{eventType.name}</span>
            </div>
            <div className="event-description">{eventType.description}</div>
          </div>
        )}
```

**Step 2: Add event display to destination system cards**

In the `connectedSystems.map` section where destination systems are rendered, look up events for each connected system and display them. The `hasAdvancedSensors` check needs to be computed once above the map.

Add this line before the `connectedSystems` computation (around line 227, after `const engineCondition`):

```javascript
  const hasAdvancedSensors = upgrades.includes('advanced_sensors');
  const currentDay = game.getState().player.daysElapsed;
```

Then update the destination system button rendering. Replace the existing `connectedSystems.map` block:

```jsx
              {connectedSystems.map((system) => {
                // Look up event for this destination system
                let destinationEvent = null;
                let destinationEventType = null;
                if (hasAdvancedSensors) {
                  destinationEvent = game.getActiveEventForSystem(system.id);
                  if (destinationEvent) {
                    destinationEventType = game.getEventType(destinationEvent.type);
                  }
                }
                const daysRemaining = destinationEvent
                  ? destinationEvent.endDay - currentDay
                  : 0;

                return (
                  <button
                    key={system.id}
                    className="connection-item"
                    onClick={() => {
                      if (selectStarById) {
                        selectStarById(system.id);
                      }
                    }}
                  >
                    <div className="connection-name">{system.name}</div>
                    <div className="connection-details">
                      {system.distance.toFixed(1)} LY •{' '}
                      {system.fuelCost.toFixed(1)}% fuel • {system.jumpTime}d
                    </div>
                    {destinationEventType && daysRemaining > 0 && (
                      <div className="system-event-info destination-event">
                        <div className="event-indicator">
                          <span className="event-icon">📊</span>
                          <span className="event-name">
                            {destinationEventType.name} at {system.name}
                          </span>
                        </div>
                        <div className="event-description">
                          {destinationEventType.description}
                        </div>
                        <div className="event-time-remaining">
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
```

**Step 3: Add CSS for destination event display and time remaining**

In `css/system-event-info.css`, add styles for the destination event variant and time remaining:

```css
.destination-event {
  margin: var(--grid-gap-small) 0 0 0;
}

.event-time-remaining {
  font-size: var(--font-size-small);
  color: #ffcc66;
  margin-top: var(--grid-gap-small);
}
```

**Step 4: Verify visually**

Run: `npm run dev`
Manual check: Navigate to a system, verify events appear on destination cards with commodity names and time remaining.

**Step 5: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```
git add src/features/navigation/SystemPanel.jsx css/system-event-info.css
git commit -m "Move event display to destination system cards with commodity names and time remaining"
```

---

### Task 6: Final verification — full test suite and cleanup

**Files:**
- All modified files from previous tasks

**Step 1: Run full test suite**

Run: `npm test`
Expected: PASS (all tests, zero warnings)

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 3: Search for stale supply_glut references**

Run: `grep -r "supply_glut" src/ tests/` — there should be zero hits.

**Step 4: Verify no stale imports**

Check that `COMMODITY_TYPES` is no longer imported in `game-events.js` if the only usage was for supply_glut's random commodity selection. If so, remove the import.

**Step 5: Commit any cleanup**

```
git add -A
git commit -m "Clean up stale supply_glut references"
```
