# Illegal Cargo Rumors & Encounter Dismiss Fix

## Summary

Two changes: (1) a rumors mechanic that gives visible feedback and increases pirate encounter probability when carrying illegal mission cargo, and (2) making encounter panel close buttons trigger "flee" instead of dismissing the encounter.

## Rumors Feature

### Trigger

Rumors are active when the player's cargo hold contains any item with a `missionId` AND a `good` in `MISSION_CARGO_TYPES.illegal` (unmarked_crates, prohibited_tech, black_market_goods). This is a flat binary state -- active while carrying, gone when delivered/dropped/confiscated.

### Mechanical Impact

- **Inspections**: Already handled. `countRestrictedGoods()` in DangerManager already counts illegal mission cargo, adding +10% per item to inspection probability.
- **Pirates**: New. Add `ILLEGAL_CARGO_PIRATE_MULTIPLIER: 1.3` to `DANGER_CONFIG`. When `hasIllegalMissionCargo()` returns true, multiply pirate encounter probability by 1.3 (30% increase).

### Detection

New method on DangerManager:

```
hasIllegalMissionCargo(cargo) -> boolean
```

Returns true if any cargo item has both `missionId` and `good` in `MISSION_CARGO_TYPES.illegal`. Exposed via GSM delegation so the HUD can call it.

### HUD Visibility

Two indicators:

1. **Active Missions panel**: For missions with `missionCargo.isIllegal === true` that still have cargo in the hold (matching `missionId` in cargo array), show a warning line: `"Rumors spreading"` in `--color-danger`.

2. **Jump arrival notification**: When arriving at a new system while `hasIllegalMissionCargo()` is true, fire a toast notification with flavor text like "Word of your illicit cargo is spreading..."

## Encounter Dismiss Bug Fix

### Problem

All encounter panels (pirate, inspection, distress, combat, negotiation) render a close button (`<button class="close-btn">`) that calls `onClose`, allowing the player to dismiss the encounter without consequence.

### Fix

For encounter panels that represent forced interactions, change the close button to call `onChoice('flee')` instead of `onClose`. This triggers the flee action with all its normal consequences (engine damage risk, reputation loss, etc.).

Affected panels:
- `PirateEncounterPanel.jsx` -- X triggers flee
- `InspectionPanel.jsx` -- X triggers flee
- `DistressCallPanel.jsx` -- X triggers flee (ignore the call)
- `CombatPanel.jsx` -- X triggers flee
- `NegotiationPanel.jsx` -- X triggers flee

NOT affected (informational panels with proper resolution paths):
- `MechanicalFailurePanel.jsx` -- keep as-is (Acknowledge button)
- `OutcomePanel.jsx` -- keep as-is (Continue button)

## Approach

Detection logic lives in DangerManager, following the existing pattern where `countRestrictedGoods()` already inspects cargo for restricted items. No new state to track -- the rumor status is computed from cargo contents on demand.
