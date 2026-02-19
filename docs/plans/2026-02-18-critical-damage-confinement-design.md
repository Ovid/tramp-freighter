# Critical Damage Confinement

## Problem

Ship systems (hull, engine, life support) can degrade to 0% with no consequences. Players can fly indefinitely with completely destroyed systems.

## Solution

When any ship system is at or below 20%, the player cannot jump to another system. They must repair above 20% before departing. Two safety-net mechanics prevent deadlock when the player can't afford repairs.

## Jump Confinement

- New constant: `CRITICAL_SYSTEM_THRESHOLD = 20`
- `validateJump()` in `game-navigation.js` checks all three systems after existing fuel/connection validation
- Returns invalid with message listing all critical systems, e.g.: "Hull critically damaged (5%). Repairs required before departure."
- JumpDialog already disables the button and shows validation errors — no UI changes needed there

## Emergency Patch

Available when a system is at or below 20% and the player cannot afford to repair it above the threshold.

- Brings the system to exactly 21%
- Time penalty: +3 days (`EMERGENCY_PATCH_DAYS_PENALTY = 3`)
- Available per-system (patching hull and engine costs 6 days total)
- Days advance through normal day-advance logic (triggers degradation, loan checks, etc.)
- New method: `RepairManager.applyEmergencyPatch(systemType)`
- UI: amber-styled option in RepairPanel, shown only when system is critical and player can't afford minimum repair

## System Cannibalization

Sacrifice condition from healthy systems to boost a critical one, at a 50% waste penalty.

- Player selects a target system (must be <= 20%) and one or more donor systems (must be > 20%)
- Waste ratio: donors lose 1.5x what the target gains (`CANNIBALIZE_WASTE_MULTIPLIER = 1.5`)
- Donor floor: donors cannot be drained below 21% (`CANNIBALIZE_DONOR_MIN = 21`)
- Target is repaired to exactly 21%
- Example: Hull at 5% needs 16% to reach 21%. At 1.5x, that costs 24% from donors. Player could take 12% from engine and 12% from life support.
- New method: `RepairManager.cannibalizeSystem(targetType, donations)`
- `donations` format: `[{ system: 'engine', amount: 12 }, { system: 'lifeSupport', amount: 12 }]`
- UI: section in RepairPanel, shown only when a system is critical, with controls for donor allocation

## Constants (all in `src/game/constants.js`)

| Constant | Value | Description |
|---|---|---|
| `CRITICAL_SYSTEM_THRESHOLD` | 20 | Systems at or below this % block jumping |
| `EMERGENCY_PATCH_TARGET` | 21 | Emergency patch restores to this % |
| `EMERGENCY_PATCH_DAYS_PENALTY` | 3 | Days consumed per emergency patch |
| `CANNIBALIZE_WASTE_MULTIPLIER` | 1.5 | Donor loses 1.5x what target gains |
| `CANNIBALIZE_DONOR_MIN` | 21 | Donors cannot be drained below this % |

## Edge Cases

1. **All three systems critical** — Emergency patch available for each (9 days total). Cannibalization impossible (no viable donors).
2. **System degrades to critical mid-jump** — Player arrives confined. Intentional and thematic.
3. **Encounters damage systems below 20%** — Same: player arrives at destination confined.
4. **Arrive at system with no station** — Nearly all systems have stations. Jump confinement message directs player to dock and repair.

## Test Plan

- Unit: `validateJump()` returns invalid when any system <= 20%
- Unit: `applyEmergencyPatch()` sets system to 21%, advances 3 days, only available when player can't afford repair
- Unit: `cannibalizeSystem()` applies 1.5x waste, respects donor floor of 21%, target reaches 21%
- Property-based: cannibalization never produces negative values, never drains donor below floor, cost is exactly 1.5x gain
- Integration: full flow — system critical, jump blocked, emergency patch applied, jump succeeds
