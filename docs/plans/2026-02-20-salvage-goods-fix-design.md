# Salvage Goods State Fix

## Problem

Salvaged goods from distress calls display with `Qty: undefined`, `Bought at: undefined`, and `Capacity: NaN` in the trade panel. The root cause is field name mismatches between the cargo reward format and the canonical cargo schema.

## Canonical Cargo Schema

```js
{ good, qty, buyPrice, buySystem, buySystemName, buyDate }
```

## Broken Paths

| Path | File | Wrong Fields |
|------|------|-------------|
| Distress loot | `danger.js:resolveDistressLoot` | `type`/`quantity`/`purchasePrice` instead of `good`/`qty`/`buyPrice` |
| Narrative salvage | `narrative-events.js:199` | `type` instead of `good` |

## Changes

### 1. Fix data sources

**`danger.js:resolveDistressLoot()`** — Use canonical field names + sentinel metadata:
- `type` -> `good`
- `quantity` -> `qty`
- `purchasePrice` -> `buyPrice`
- Add `buySystemName: 'Salvaged'`

**`narrative-events.js`** — Same: `type` -> `good`, add `buySystemName: 'Salvaged'`

### 2. Remove field translation from mapper

**`applyEncounterOutcome.js`** — Stop mapping `rewardItem.type` to `good`. Reward items now use canonical names, so the mapper is a straight pass-through. Also pass through `buySystemName`.

### 3. Add dev-mode validation at state boundary

**`state.js:updateCargo()`** — In DEV mode, warn when cargo items are missing required fields (`good`, `qty`, `buyPrice`). Zero production cost.

### 4. Tests

- `resolveDistressLoot` returns canonical field names
- `applyEncounterOutcome` cargo rewards pass through correctly
- `updateCargo` validation warns on missing fields, stays silent for valid cargo
- Narrative event cargo rewards use canonical field names
