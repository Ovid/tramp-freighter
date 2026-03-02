# UAT Remaining Fixes Design

**Date:** 2026-03-01
**Branch:** `ovid/full-uat-from-player-perspective`
**Related:** `uat-new-player-notes.md`, `2026-03-01-uat-new-player-fixes-design.md`

Addresses UAT issues 3, 4 (remainder), 5, 6, and 7 from `uat-new-player-notes.md`.

## 1. Wormhole Graph Cache (foundation)

New module `src/game/utils/wormhole-graph.js`. Builds cached data structures
from static wormhole data once, replaces all current O(n) scans.

**Data structures:**

- `adjacencyMap`: `Map<systemId, Set<systemId>>` — O(1) neighbor lookups
- `shortestPaths`: `Map<"fromId-toId", { hops, path }>` — pre-computed BFS
  shortest paths between all reachable system pairs

**API:**

- `getConnectedSystems(systemId)` -> `number[]`
- `getShortestPath(fromId, toId)` -> `{ hops, path, systemNames }`
- `getReachableSystems(systemId, maxHops)` -> `{ systemId, hopCount }[]`

**Integration:**

- `mission-generator.js` drops its local `getConnectedSystems`/`getReachableSystems`,
  imports from the cache module
- `game-navigation.js` (`NavigationSystem.getConnectedSystems`) delegates to cache
- New consumers: mission board (route display), mission acceptance (feasibility)

Lazy initialization on first access. Never recomputed (wormhole data is static).

## 2. Route Indicator on Mission Cards (Issue 3)

Display hop count and estimated travel time on each mission card in the board.

**Format:**

- `"1 hop — direct jump"`
- `"2 hops — ~12 days travel"`
- `"3 hops — ~18 days travel"`

No waypoint system names revealed — player must research routes themselves.

**Implementation:**

- `MissionBoardPanel.jsx` calls `getShortestPath()` from wormhole graph cache
- Estimated travel time: sum actual jump times per hop using
  `calculateJumpTime()` from `game-navigation.js`
- Rendered as secondary text line below destination name on mission card

## 3. Debt-Cleared Narrative Event (Issue 4 remainder)

When debt reaches 0, immediately trigger a narrative popup modal.

**Trigger points:**

- `DebtManager.makePayment()` — voluntary payment brings debt to 0
- `DebtManager.applyWithholding()` — trade withholding brings debt to 0

**Content:** 3-4 sentences. Tone: relief, quiet triumph. Ends with gentle nudge
to seek opportunities at stations (no specific names or locations).

**Mechanism:** Emit new `DEBT_CLEARED` event in `EVENT_NAMES`. A component
listens and shows the modal. Player dismisses manually.

## 4. Passenger Mission Rebalance (Issue 5)

Replace fixed payment tier ranges (200-1500 credits) with trade-margin-based
calculation.

**Formula:**

```
passengerPay = bestRouteMargin * cargoSlots * PASSENGER_PREMIUM
```

- `bestRouteMargin` = highest per-unit profit across all 6 goods between origin
  and destination (using existing price formulas)
- `cargoSlots` = passenger's space requirement (1-3 by type)
- `PASSENGER_PREMIUM` = 1.25 (new constant in `MISSION_CONFIG`)
- Floor: 5 cr/unit if no good is profitable on the route

**What changes:**

- Remove `PAYMENT_TIERS` and `paymentTier` from `PASSENGER_CONFIG`
- Passenger type retains: satisfaction weights, cargo space, dialogue,
  kidnap weights, narrative event triggers
- Satisfaction multiplier (0.5x to 1.3x) and on-time bonus (+0.1x) still apply

**Example outcomes:**

- Frontier->Core, Electronics 30 cr margin: `30 * 3 * 1.25 = 112 credits`
- Short hop, 8 cr margin: `8 * 3 * 1.25 = 30 credits`
- Bad route, floor: `5 * 3 * 1.25 = 19 credits`

## 5. Interest Rate Bump (Issue 6)

Change `COLE_DEBT_CONFIG.INTEREST_RATE` from `0.02` to `0.03` (3% monthly).

- Monthly interest on 10,000 debt: 200 -> 300 credits
- Combined with passenger nerf, one trading run barely covers interest
- Creates intended survival pressure

## 6. Mission Feasibility Warning (Issue 7)

Compare estimated travel time against mission deadline on the mission card.

**Calculation:**

- `getShortestPath()` for hop count
- Sum actual jump times per hop via `calculateJumpTime()`
- Compare against `mission.requirements.deadline`

**Warning tiers:**

- No warning: travel time <= 70% of deadline
- "Tight deadline" (yellow): travel time > 70% of deadline
- "Deadline likely impossible" (red): travel time >= deadline

**Display:** Small colored label on mission card near the deadline line. Same
visual style as "Discreet Delivery" warning. Informational only — no blocking.

## Constants Summary

New/changed constants:

```
MISSION_CONFIG.PASSENGER_PREMIUM = 1.25
MISSION_CONFIG.PASSENGER_MARGIN_FLOOR = 5
MISSION_CONFIG.FEASIBILITY_WARNING_THRESHOLD = 0.7
COLE_DEBT_CONFIG.INTEREST_RATE = 0.03
```

Removed constants:

```
PASSENGER_CONFIG.PAYMENT_TIERS (low/medium/high ranges)
PASSENGER_CONFIG.TYPES[*].paymentTier
```
