# Mission Reward Rebalancing Design

## Problem

UAT testing revealed that debt payoff is practically impossible for new players.
Starting debt of 10,000 credits compounds at 3% per 30 days (~300/month), while
mission income is too low to outpace it. A 1-hop safe cargo run pays 120 credits
-- less than a single interest tick. The UAT tester's debt grew from 10,000 to
12,354 over ~240 game days despite active trading and one voluntary 1,000 credit
payment. Players rationally abandon debt management for the more engaging Tanaka
questline.

## Target

A competent player should be able to pay off 10,000 credits of debt in ~120-150
game days (~20-25 round-trip trade cycles), assuming they balance trading,
missions, and voluntary debt payments.

## Design

### Cargo Run Mission Rewards

Increase base fees and fix the flat 2-hop multiplier:

| Constant                      | Current | Proposed |
|-------------------------------|---------|----------|
| `CARGO_RUN_BASE_FEE`         | 120     | 250      |
| `CARGO_RUN_ILLEGAL_BASE_FEE` | 150     | 400      |
| `HOP_MULTIPLIERS`            | [1.0, 1.0, 2.0, 3.5] | [1.0, 1.5, 2.5, 4.0] |

Expected cargo mission payouts (hopCount indexes HOP_MULTIPLIERS directly):

| Hops | Multiplier | Safe | Contested | Dangerous |
|------|------------|------|-----------|-----------|
| 1    | 1.5        | 375  | 563       | 750       |
| 2    | 2.5        | 625  | 938       | 1,250     |
| 3    | 4.0        | 1,000| 1,500     | 2,000     |

Illegal missions at 400 base are ~60% higher, making customs risk a genuine
gamble (600 credit reward vs 1,000 credit fine) instead of an automatic loss
(225 vs 1,000).

### Passenger Mission Rewards

Current formula (`bestMargin * cargoSpace * 1.25`) produces 7-75 credits.
Two fixes:

1. Add `PASSENGER_BASE_FEE: 100` to guarantee a floor.
2. Apply hop multipliers (currently missing from passenger formula entirely).

New formula:
```
reward = (PASSENGER_BASE_FEE + bestMargin * cargoSpace * PASSENGER_PREMIUM)
       * hopMultiplier * saturationMultiplier
```

Expected passenger payouts (margin=5):

| Type (cargo space) | 1-hop | 2-hop | 3-hop |
|--------------------|-------|-------|-------|
| Refugee (1)        | 106   | 159   | 265   |
| Business (2)       | 138   | 206   | 344   |
| Wealthy (3)        | 169   | 253   | 422   |

Passengers pay less than cargo runs (no contraband risk) but are no longer
negligible.

### Mission Board Size

Raise the cap so hub stations offer more missions:

| Constant     | Current | Proposed |
|--------------|---------|----------|
| `BOARD_SIZE` | 3       | 6        |

Existing formula `Math.min(Math.max(connectionCount + 1, MIN_BOARD_SIZE), BOARD_SIZE)`
scales by station connectivity:

- Sol (8 connections): 6 missions
- Barnard's Star (3 connections): 4 missions
- Wolf 1061 (1 connection): 2 missions

## Economic Validation

Per-cycle income (6-day Sol to Barnard's Star round trip):

| Source                          | Current | Proposed |
|---------------------------------|---------|----------|
| Cargo mission (1-hop safe, 75%) | 90 avg  | 281 avg  |
| Passenger (occasional)          | 10 avg  | 50 avg   |
| Trade profit                    | 200     | 200      |
| **Gross income**                | **300** | **531**  |
| Fuel + repairs                  | -130    | -130     |
| **Net per cycle**               | **170** | **401**  |

Over 150 days (25 cycles):

- Proposed gross debt payments: ~10,025
- Interest accrued (~250/mo avg on declining balance): ~1,250
- Net debt reduction: ~8,775

This comfortably covers the 10,000 starting debt within the target window.
Occasional 2-hop missions and Tanaka quest bonuses provide additional margin.

Edge cases:
- Death spiral recovery: a player at 0 credits can take a free-cargo mission
  worth 375 (vs 120 currently), enough to refuel at Sol and restart.
- Illegal mission risk/reward: 1-hop contested illegal pays 600 (400 * 1.5).
  At 18% inspection rate, EV = 600 - (0.18 * 1,000) = 420. A genuine
  calculated risk.

## Implementation

### Files Changed

**`src/game/constants.js`** -- constant value updates:
- `MISSION_CONFIG.CARGO_RUN_BASE_FEE`: 120 to 250
- `MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE`: 150 to 400
- `MISSION_CONFIG.HOP_MULTIPLIERS`: [1.0, 1.0, 2.0, 3.5] to [1.0, 1.5, 2.5, 4.0]
- `MISSION_CONFIG.BOARD_SIZE`: 3 to 6
- Add `MISSION_CONFIG.PASSENGER_BASE_FEE`: 100

**`src/game/mission-generator.js`** -- passenger formula fix:
- Add hop multiplier lookup in `generatePassengerMission`
- Change reward formula to include `PASSENGER_BASE_FEE` and `hopMultiplier`

### What Doesn't Change

- Debt mechanics (interest, lien, heat system)
- Trade pricing / dynamic pricing
- Mission generation logic (cargo types, deadlines, danger zones, saturation)
- Mission board refresh rate
- Cole missions

### Tests

Existing tests will need updated expected values for mission rewards. No new
test files needed.
