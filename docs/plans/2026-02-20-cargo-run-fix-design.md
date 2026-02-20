# Cargo Run Mission Fix — Design

## Problem

Cargo run missions are economically broken. The player must buy cargo at full market price, the cargo is deleted on delivery, and the mission reward (30% of base price) doesn't cover the cost. Every cargo run is a net loss.

## Solution

Redesign cargo runs to use **client-provided, mission-only goods** that don't exist in the normal trade system. Some cargo is illegal, creating risk/reward tension with the existing customs inspection system.

## Mission Cargo Types

Cargo runs no longer use tradeable goods (ore, grain, etc.). Instead they use unique mission-only goods.

### Legal Cargo

| ID                   | Display Name       | Description                            |
| -------------------- | ------------------ | -------------------------------------- |
| `sealed_containers`  | Sealed Containers  | Sealed freight containers              |
| `diplomatic_pouches` | Diplomatic Pouches | Official inter-system correspondence   |
| `scientific_samples` | Scientific Samples | Research specimens, handle with care    |

### Illegal Cargo

| ID                   | Display Name       | Description                            |
| -------------------- | ------------------ | -------------------------------------- |
| `unmarked_crates`    | Unmarked Crates    | No questions asked                     |
| `prohibited_tech`    | Prohibited Tech    | Restricted technology components       |
| `black_market_goods` | Black Market Goods | Goods best kept out of sight           |

## Mission Lifecycle

1. Player accepts a cargo run from the mission board.
2. Mission cargo is **instantly placed in the player's hold** — zero upfront cost (client-provided).
3. Cargo is **locked**: marked with `missionId`, cannot be sold at trade panels.
4. Cargo **occupies hold space** (legal: 5-15 units, illegal: 5-10 units; 1 space each).
5. Player jumps to the destination system — illegal cargo may trigger customs inspections.
6. On arrival and delivery: cargo removed from hold, credits + faction rep awarded.
7. On mission failure (deadline expired or cargo confiscated): cargo removed, small rep penalty.

## Reward Structure

Rewards are distance-based delivery fees. No cargo purchase or reimbursement involved.

### Legal Cargo Runs

- `CARGO_RUN_BASE_FEE`: 75 credits
- `CARGO_RUN_PER_LY_RATE`: 25 credits per light-year
- Typical payout: 150-375 credits
- Zero risk

### Illegal Cargo Runs

- `CARGO_RUN_ILLEGAL_BASE_FEE`: 150 credits
- `CARGO_RUN_ILLEGAL_PER_LY_RATE`: 40 credits per light-year
- Typical payout: 270-630 credits
- Risk: increased customs inspection chance, confiscation, fines

### Context

- Starting credits: 500, starting debt: 10,000
- Passenger missions: 200-1,500 credits (with satisfaction risk)
- Cargo runs slot below passengers as steady, predictable income

## Zone-Weighted Distribution

The ratio of legal vs. illegal cargo runs on the mission board is weighted by danger zone.

| Zone       | Legal % | Illegal % |
| ---------- | ------- | --------- |
| Safe       | 85%     | 15%       |
| Contested  | 50%     | 50%       |
| Dangerous  | 25%     | 75%       |

## Customs Integration

Illegal mission cargo hooks into the existing inspection system:

- Counts as restricted goods for `calculateInspectionChance()` — each illegal cargo unit adds +10% inspection chance (existing `RESTRICTED_GOODS_INSPECTION_INCREASE` constant).
- **Cooperate**: cargo confiscated, mission fails, fine applied via existing `RESTRICTED_GOODS_FINE`.
- **Bribe/Flee**: existing mechanics apply unchanged.
- Mission failure on confiscation triggers rep penalty with mission giver.

Legal mission cargo does NOT count as restricted and does not affect inspection chance.

## Reputation Rewards

| Outcome                     | Merchants | Outlaws |
| --------------------------- | --------- | ------- |
| Complete legal cargo run     | +2        | —       |
| Complete illegal cargo run   | +2        | +3      |
| Fail any cargo run           | -2        | —       |
| Fail illegal cargo run       | —         | -2      |

## Data Model Changes

### Mission cargo in ship state

Mission cargo entries in `state.ship.cargo[]` gain a `missionId` field:

```js
{
  good: 'unmarked_crates',  // mission-only good type
  qty: 8,
  missionId: 'cargo_1234',  // links to active mission; prevents selling
}
```

### New constants

```js
// In MISSION_CONFIG
CARGO_RUN_BASE_FEE: 75,
CARGO_RUN_PER_LY_RATE: 25,
CARGO_RUN_ILLEGAL_BASE_FEE: 150,
CARGO_RUN_ILLEGAL_PER_LY_RATE: 40,
CARGO_RUN_LEGAL_QUANTITY: { MIN: 5, MAX: 15 },
CARGO_RUN_ILLEGAL_QUANTITY: { MIN: 5, MAX: 10 },
CARGO_RUN_ZONE_ILLEGAL_CHANCE: { safe: 0.15, contested: 0.50, dangerous: 0.75 },
```

### Mission cargo type definitions

```js
// New export in constants.js or mission-generator.js
MISSION_CARGO_TYPES: {
  legal: ['sealed_containers', 'diplomatic_pouches', 'scientific_samples'],
  illegal: ['unmarked_crates', 'prohibited_tech', 'black_market_goods'],
}
```

## Files to Modify

| File | Change |
| ---- | ------ |
| `src/game/constants.js` | Add cargo run fee constants, mission cargo type definitions |
| `src/game/mission-generator.js` | Rewrite `generateCargoRun()` to use new cargo types and distance-based rewards |
| `src/game/state/managers/mission.js` | Add cargo to hold on accept, remove on complete/fail, check missionId |
| `src/game/state/managers/ship.js` | Update `removeCargoForMission()` to work with missionId |
| `src/game/state/managers/trading.js` | Block selling cargo that has a `missionId` |
| `src/game/state/managers/danger.js` | Count illegal mission cargo as restricted goods |
| `src/features/missions/MissionBoardPanel.jsx` | Display mission cargo type (legal/illegal indicator) |
| `src/features/trade/tradeUtils.js` | Filter out mission cargo from sellable goods |
| `src/game/state/state-validators.js` | Validate missionId field on cargo entries |
| Tests | Update existing cargo run tests, add new tests for all behaviors |
