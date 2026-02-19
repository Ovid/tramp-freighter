# Encounter Resolution Flow Design

**Date:** 2026-02-18
**Branch:** ovid/danger
**Status:** Approved

## Problem

The danger system's encounter panels (pirate, inspection, mechanical failure, distress call) are fully built, and the resolution logic in DangerManager is complete and tested. However, the UI flow from "player makes a choice" to "player sees what happened" is incomplete. Currently App.jsx resolves encounters and immediately returns to orbit with only a toast notification.

An OutcomePanel component already exists that can display a detailed breakdown of what happened (modifiers, karma changes, faction rep changes, resource changes). It is not wired in.

## Design

### State Machine

Add an intermediate state between encounter choice and return to orbit:

```
ENCOUNTER (panel with choices)
  → player confirms choice
  → resolve encounter via GameStateManager
  → apply outcome to game state
  → transform outcome for display
ENCOUNTER (OutcomePanel showing results)
  → player clicks "Continue"
  → clear encounter state
  → return to ORBIT
```

This is achieved with a new `encounterOutcome` state variable in App.jsx. When in VIEW_MODES.ENCOUNTER:
- If `encounterOutcome` is null → render the encounter-type panel (pirate, inspection, etc.)
- If `encounterOutcome` is set → render OutcomePanel

### Data Shape Transform

DangerManager resolution methods return:
```javascript
{
  success: boolean,
  costs: { fuel?, hull?, engine?, lifeSupport?, credits?, cargoLoss?, cargoPercent?, days? },
  rewards: { credits?, karma?, factionRep?: { [faction]: number }, cargo?: [] },
  description: string
}
```

OutcomePanel expects:
```javascript
{
  success: boolean,
  encounterType: string,
  choiceMade: string,
  explanation: string,
  modifiers: [],           // empty for now; panels show these pre-choice
  consequences: {},
  karmaChanges: [{ amount, reason }],
  reputationChanges: [{ faction, amount, reason }],
  resourceChanges: { [resource]: number }
}
```

A `transformOutcomeForDisplay(rawOutcome, encounterType, choice)` function maps between them:
- `encounterType` from `currentEncounter.type`
- `choiceMade` from the choice string
- `explanation` from `rawOutcome.description`
- `resourceChanges` computed from costs (negative) and credit rewards (positive)
- `karmaChanges` extracted from `rawOutcome.rewards.karma`
- `reputationChanges` extracted from `rawOutcome.rewards.factionRep`
- `modifiers` left as empty array (probability breakdowns already shown on encounter panels)

### Changes Required

1. **App.jsx** — Add `encounterOutcome` state. In ENCOUNTER view, conditionally render OutcomePanel when outcome is set. Update `handleEncounterChoice` to set outcome instead of returning to orbit. Add `handleOutcomeContinue` to clear state and return to orbit. Import OutcomePanel.

2. **App.jsx** — Write `transformOutcomeForDisplay()` helper to convert raw outcome shape to OutcomePanel shape.

3. **App.jsx** — Keep `applyEncounterOutcome()` as-is (it works). Remove toast notification calls (OutcomePanel replaces them). Remove `useNotification` import and `NotificationArea` if not used elsewhere.

4. **Integration test** — Update `encounter-resolution.integration.test.jsx` to expect the OutcomePanel step before returning to orbit.

### What Stays The Same

- All DangerManager resolution methods (tested, no changes)
- All encounter panel components (PirateEncounterPanel, etc.)
- OutcomePanel component (already built)
- GameStateManager update methods (updateFuel, updateCredits, etc.)
