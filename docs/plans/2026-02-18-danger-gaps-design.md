# Danger Spec Gaps — Design Document

**Date:** 2026-02-18
**Branch:** ovid/danger
**Spec:** notes/tramp-freighter-05-danger.md

## Problem

The `ovid/danger` branch implements all major features from Spec 05 (danger zones, pirate encounters, combat logic, negotiation logic, inspections, mechanical failures, distress calls, karma, factions). However, six gaps prevent the spec from being fully realized at runtime.

## Gaps

1. **CombatPanel not routed** — Component exists and is tested but never rendered. Fight/Flee from PirateEncounterPanel resolve directly to `return_fire`/`evasive`, skipping the 4-option combat screen.
2. **NegotiationPanel not routed** — Component exists and is tested but never rendered. Negotiate maps directly to `counter_proposal`, so medicine_claim and intel_offer are unreachable.
3. **Inspection flee doesn't chain to patrol combat** — `resolveInspectionFlee()` returns `{ triggerPatrolCombat: true }` but nothing reads the flag.
4. **`countRestrictedGoods()` is a placeholder** — Counts all cargo as restricted instead of checking against `RESTRICTED_GOODS_CONFIG` for the current zone.
5. **`dangerFlags` counters never incremented or read** — 7 flags initialized in world state but no code writes to or reads from them.
6. **Karma/faction events missing from save-load** — `emitLoadedStateEvents()` doesn't emit `karmaChanged` or `factionRepChanged`, causing stale UI after mid-session loads.

## Design

### 1. Two-Step Encounter Flow (Gaps 1 & 2)

**Approach:** Add `encounterPhase` state to App.jsx.

- New state: `encounterPhase` — `null | 'initial' | 'combat' | 'negotiation'`
- When pirate encounter begins: `encounterPhase = 'initial'` → renders PirateEncounterPanel
- Player chooses "Fight" or "Flee": `encounterPhase = 'combat'` → renders CombatPanel (all 4 tactics: evasive, return_fire, dump_cargo, distress_call)
- Player chooses "Negotiate": `encounterPhase = 'negotiation'` → renders NegotiationPanel (all 4 options: counter_proposal, medicine_claim, intel_offer, accept_demand)
- Player chooses "Surrender": resolves immediately via `resolveNegotiation('accept_demand')` — no sub-panel needed (100% guaranteed outcome)

**GameStateManager.resolvePirateEncounter changes:**
- Remove the `fight → return_fire` and `negotiate → counter_proposal` shortcut mappings
- Accept actual sub-choices directly and route combat sub-choices to `resolveCombatChoice()`, negotiation sub-choices to `resolveNegotiation()`

**JSX rendering logic:**
```
pirate encounter + phase='initial'      → PirateEncounterPanel
pirate encounter + phase='combat'       → CombatPanel
pirate encounter + phase='negotiation'  → NegotiationPanel
```

### 2. Patrol Combat Chain (Gap 3)

- `applyEncounterOutcome()` in App.jsx checks for `outcome.triggerPatrolCombat === true`
- Instead of returning to ORBIT, creates a new patrol-type encounter using a `PATROL_ENCOUNTER_TEMPLATE` from constants.js
- Sets `encounterPhase = 'combat'` directly (skip initial pirate screen — player is already in a chase)
- CombatPanel renders with patrol encounter. All 4 combat options available.
- Resolution flows through normal outcome → OutcomePanel path.

### 3. countRestrictedGoods Fix (Gap 4)

- Change `countRestrictedGoods(cargo)` to be zone-aware
- Look up current system's danger zone via `getDangerZone()`
- Get restricted goods list from `RESTRICTED_GOODS_CONFIG` for that zone
- Count only cargo items whose `good` type appears in the zone's restricted list
- Update call site in `calculateInspectionChance()` accordingly

### 4. dangerFlags Wire-Up (Gap 5)

**Increment points:**

| Flag | Increment When |
|---|---|
| `piratesFought` | Any combat resolution (evasive, return_fire, dump_cargo, distress_call) |
| `piratesNegotiated` | Any negotiation resolution (counter_proposal, medicine_claim, intel_offer, accept_demand) |
| `civiliansSaved` | Distress call: respond |
| `civiliansLooted` | Distress call: loot |
| `inspectionsPassed` | Inspection: cooperate with no contraband found |
| `inspectionsBribed` | Inspection: bribe (successful or not) |
| `inspectionsFled` | Inspection: flee |

**Reader effects:**

- `inspectionsFled` increases future inspection chance (watchlist effect) in `calculateInspectionChance()`
- `piratesFought` reduces future pirate encounter chance slightly (tough target reputation) in `calculatePirateEncounterChance()`
- `piratesNegotiated` (high count) increases pirate encounter chance slightly (easy mark) in `calculatePirateEncounterChance()`
- `civiliansSaved` / `civiliansLooted` affect NPC dialogue tone via DialogueManager

**Constants:** New entries in `DANGER_CONFIG` for flag effect scales (e.g., per-fled-inspection chance increase, per-fight pirate avoidance).

### 5. Save/Load Bridge Events (Gap 6)

Add two lines to `SaveLoadManager.emitLoadedStateEvents()`:
```javascript
this.emit('karmaChanged', loadedState.player.karma || 0);
this.emit('factionRepChanged', loadedState.player.factions || {});
```

Note: `useGameEvent` has initial-value fallbacks that cover first mount. These events are needed for mid-session loads where components are already mounted.

## Files Affected

| File | Changes |
|---|---|
| `src/App.jsx` | encounterPhase state, two-step routing, patrol combat chain |
| `src/game/state/game-state-manager.js` | Revised resolvePirateEncounter routing |
| `src/game/state/managers/danger.js` | countRestrictedGoods fix, dangerFlags increments, dangerFlags reader effects |
| `src/game/state/managers/save-load.js` | 2 new event emissions |
| `src/game/state/managers/dialogue.js` | NPC attitude adjustments from dangerFlags |
| `src/game/constants.js` | PATROL_ENCOUNTER_TEMPLATE, dangerFlags effect constants |

## Testing

TDD per CLAUDE.md: RED → GREEN → REFACTOR for each change. Property tests for probability calculations, unit tests for routing logic, integration tests for the two-step flow.
