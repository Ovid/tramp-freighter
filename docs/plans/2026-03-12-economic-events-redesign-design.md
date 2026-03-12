# Economic Events Redesign

## Problem

Two UX failures in the current economic events system:

1. **Events are not profitable trade signals.** Event modifiers multiply the local
   base price, but tech bias dominates. A Medical Emergency doubling medicine
   prices at Sol still results in a price lower than frontier systems' normal
   medicine prices, because Sol's baseline is so low. Players who haul goods to
   meet "demand" lose money.

2. **Event UI is unclear.** The event card says "Celebration drives luxury demand"
   but doesn't name which commodities are affected, doesn't say where the event
   is, and doesn't indicate how long it lasts. Players can't make informed
   decisions.

3. **Events only show at the current system.** Since the pricing model means
   "bring goods here," showing the event where you already are is useless — you
   can't buy and sell at the same station. Events need to be visible at
   destination systems so players can travel toward them.

## Design

### Remove Supply Glut

The Supply Glut event (commodity price crash, x0.6) is removed entirely. It
creates a "don't sell here" signal which is confusing and unlike the other three
"bring goods here" events. Three event types remain:

- Medical Emergency
- Cultural Festival
- Mining Strike

### Guaranteed Profit Pricing

Event-affected commodity prices are no longer calculated with the normal formula.
Instead:

```
P_event = galaxyMaxNormalPrice(commodity) × EVENT_PREMIUM
```

Where:

- `galaxyMaxNormalPrice(commodity)` = `BASE_PRICE × worstCaseTechMod × 1.15`
  (precomputed once at startup; 1.15 accounts for temporal oscillation peak)
- `EVENT_PREMIUM` = 1.5 (new constant in `constants.js`)

This guarantees that event prices exceed the highest price a commodity could
naturally reach at any system. Profit from anywhere, every time.

Non-affected commodities at the same system continue to use the normal price
formula.

### Longer Event Durations

Current durations are too short for players to travel to the event system.
Updated durations:

| Event              | Old Duration | New Duration |
|--------------------|-------------|-------------|
| Medical Emergency  | 3–5 days    | 8–14 days   |
| Cultural Festival  | 2–4 days    | 7–12 days   |
| Mining Strike      | 5–10 days   | 10–18 days  |

### Clearer Event Descriptions

Event descriptions now name the specific commodities:

| Event              | Old Description                      | New Description                                      |
|--------------------|--------------------------------------|------------------------------------------------------|
| Medical Emergency  | "Outbreak requires urgent supplies"  | "Outbreak requires urgent medicine"                  |
| Cultural Festival  | "Celebration drives luxury demand"   | "Celebration drives demand for electronics and grain" |
| Mining Strike      | "Workers demand better conditions"   | "Workers strike — ore and tritium in short supply"   |

### Event Visibility on Destination Systems

Events move from the current system panel to the destination system cards in the
neighbor list. Each event card shows:

1. **Event name and system** — "Medical Emergency at Sol"
2. **Commodities needed** — "Medicine needed"
3. **Time remaining** — "3 days left"

The player can compare time remaining against the travel time already shown on
each destination card (e.g., "3d") to decide whether they can reach it.

Events are removed from the current system panel display.

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/constants.js` | Add `EVENT_PREMIUM: 1.5`, update event duration ranges |
| `src/game/game-events.js` | Remove Supply Glut, update descriptions and durations |
| `src/game/game-trading.js` | Add `getGalaxyMaxNormalPrice()`, change event price calc |
| `src/features/navigation/SystemPanel.jsx` | Move events to destination cards, add system name + time remaining + commodity names |
| `tests/unit/game-events.test.js` | Update for new durations, remove Supply Glut tests |
| `tests/unit/game-trading.test.js` | New tests: event price exceeds galaxy max for all commodities |

## Testing

- Event price for every commodity/event combo exceeds `galaxyMaxNormalPrice`
- Supply Glut references removed cleanly (no dead code)
- Event durations within new ranges
- UI shows event on destination cards with system name, commodities, and time remaining
