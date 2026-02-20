# Mission Arbitrage Fix Design

## Problem

Dead-end systems (38 of 117 systems) have only one wormhole connection. The mission generator only picks destinations from direct neighbors, so all missions at dead-end systems point to the same destination. Players can accept 3 missions, make one jump, complete all 3, jump back, and repeat daily. This "print money" exploit breaks the game's economic tension by allowing wealth accumulation that outpaces money sinks.

## Solution: Three Reinforcing Mechanics

### 1. Risk-Scaled Reward Formula

Replace the current distance-based reward formula with hop-count and danger-zone scaling.

**Current:** `baseFee + (distance x perLyRate)`

**New:** `baseFee x hopMultiplier x dangerMultiplier x saturationMultiplier`

Constants:
- `HOP_MULTIPLIERS: [1.0, 1.0, 2.0, 3.5]` (index = hop count)
- `DANGER_MULTIPLIERS: { safe: 1.0, contested: 1.5, dangerous: 2.0 }`

Example - CD-37 15492 to Lacaille 9352 (1 hop, safe):
- Current: 75 + (18 x 25) = 525 credits
- New: 75 x 1.0 x 1.0 = 75 credits

A 3-hop dangerous run: 75 x 3.5 x 2.0 = 525 credits (same payout, real effort required).

### 2. Multi-Hop Mission Destinations

Add `getReachableSystems(systemId, wormholeData, maxHops)` using BFS to find systems up to 3 hops away.

Destination weighting: inverse hop-count squared (1-hop 9x more likely than 3-hop, 2-hop ~2x more likely than 3-hop).

Deadline: `hops x DAYS_PER_HOP_ESTIMATE + DEADLINE_BUFFER_DAYS` (hop-based instead of raw distance).

Board size scales with connectivity: `min(connectionCount + 1, BOARD_SIZE)`. Dead-end systems get 2 missions instead of 3.

### 3. Route Saturation (Diminishing Returns)

Track completed missions as `{ from, to, day }` entries in `state.missions.completionHistory`.

Saturation formula:
```
saturationPenalty = completionsToDestination x SATURATION_PENALTY_PER_RUN
reward x max(1.0 - saturationPenalty, SATURATION_FLOOR)
```

Constants:
- `SATURATION_WINDOW_DAYS: 30`
- `SATURATION_PENALTY_PER_RUN: 0.25`
- `SATURATION_FLOOR: 0.25`
- `SATURATION_MAX_HISTORY: 50`

Timing validation: Jump time = max(1, ceil(distance x 0.5)). CD-37 15492 to Lacaille 9352 (~18 LY) = 9 days per hop. Round trip = 18 days. At most 2 completions per 30-day window, so rewards hover 50-75% of the already-low 75-credit base.

Player-facing: saturated missions show dimmed rewards with tooltip "Haulers on this route are plentiful - reduced pay."

## State Changes

New field in `state.missions`:
```js
completionHistory: []  // [{ from: systemId, to: systemId, day: number }]
```

## New Constants

```js
// In MISSION_CONFIG
HOP_MULTIPLIERS: [1.0, 1.0, 2.0, 3.5],
DANGER_MULTIPLIERS: { safe: 1.0, contested: 1.5, dangerous: 2.0 },
MAX_MISSION_HOPS: 3,
MIN_BOARD_SIZE: 1,
DAYS_PER_HOP_ESTIMATE: 6,
SATURATION_WINDOW_DAYS: 30,
SATURATION_PENALTY_PER_RUN: 0.25,
SATURATION_FLOOR: 0.25,
SATURATION_MAX_HISTORY: 50,
```

## Code Changes

### mission-generator.js
- Add `getReachableSystems(systemId, wormholeData, maxHops)` (BFS)
- `generateCargoRun` and `generatePassengerMission`: use `getReachableSystems` instead of `getConnectedSystems`, accept `completionHistory`, apply new reward formula
- `generateMissionBoard`: scale board size with connectivity, pass `completionHistory` through

### MissionManager (src/game/state/managers/mission.js)
- On mission completion: push `{ from, to, day }` to `completionHistory`
- On board refresh: prune history entries older than `SATURATION_WINDOW_DAYS`

### constants.js
- Add new constants listed above
- Remove `CARGO_RUN_PER_LY_RATE` and `CARGO_RUN_ILLEGAL_PER_LY_RATE` (replaced by hop/danger multipliers)

## What Doesn't Change
- Mission acceptance flow (MAX_ACTIVE stays 3)
- Mission completion logic (beyond adding history entry)
- Board refresh timing (still daily)
- Passenger reward tiers (keep existing tier system, apply saturation multiplier on top)
