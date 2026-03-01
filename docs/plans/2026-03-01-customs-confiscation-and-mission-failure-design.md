# Design: Customs Confiscation & Mission Failure Notification

## Problems

1. **Customs bug**: Cooperating with a customs inspection fines the player and sets `restrictedGoodsConfiscated = true`, but never removes the restricted goods from `state.ship.cargo`. Hidden cargo is cleared correctly; regular restricted cargo is not.

2. **Mission failure is silent**: `checkMissionDeadlines()` does apply penalties (faction rep, cargo removal) but fires mid-travel with no player-visible feedback. Players don't know missions expired.

---

## Fix 1: Actually Confiscate Restricted Goods

### New method: `GameStateManager.removeRestrictedCargo()`

Add a method (delegated from a manager — InspectionManager or StateManager) that:
- Reads `state.player.currentSystem` and derives the danger zone
- Filters `state.ship.cargo` to remove goods restricted in that zone/system
- Calls `updateCargo()` with the filtered list
- Emits `CARGO_CHANGED`

### Change in `applyEncounterOutcome.js`

Add a block parallel to the hidden cargo handling, **before** `failMissionsDueToCargoLoss()`:

```js
if (outcome.costs.restrictedGoodsConfiscated) {
  gameStateManager.removeRestrictedCargo();
}
```

**Order matters**: cargo must be removed before `failMissionsDueToCargoLoss()` runs, so missions correctly detect their cargo is gone.

---

## Fix 2: Mission Failure Notification on Docking

### State: `pendingFailureNotices`

`checkMissionDeadlines()` pushes a notice into `state.missions.pendingFailureNotices` for each expired mission:

```js
{ id: mission.id, title: mission.title, destination: mission.destination.name }
```

Initialize `pendingFailureNotices: []` in mission state if not present.

### UI: modal on station entry

When the player enters the station view, a component checks `pendingFailureNotices`. For each notice, it shows a modal (using the existing `Modal` component):

> *"Mission Failed: [title]. You missed the deadline. The contact won't be working with you again."*

Player dismisses → notice removed from queue → next notice shown (if any).

The component subscribes via `useGameEvent('missionsChanged')` and reads the queue on mount/update. No new events required.

---

## Files to Change

| File | Change |
|------|--------|
| `src/game/state/managers/inspection.js` or `state-manager.js` | Add `removeRestrictedCargo()` |
| `src/game/state/game-state-manager.js` | Delegate `removeRestrictedCargo()` |
| `src/features/danger/applyEncounterOutcome.js` | Call `removeRestrictedCargo()` before `failMissionsDueToCargoLoss()` |
| `src/game/state/managers/mission.js` | Push to `pendingFailureNotices` in `checkMissionDeadlines()` |
| Station entry component (TBD) | Show modal for each pending notice, clear on dismiss |
| `src/game/constants.js` | Any new config if needed |
| Tests | Unit tests for confiscation and notice queue |
