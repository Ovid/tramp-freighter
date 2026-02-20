# Passenger System Design

**Spec:** notes/tramp-freighter-06.3-passengers.md
**Date:** 2026-02-20
**Status:** Approved

## Approach

Extend existing MissionManager with passenger logic. No new manager — passengers are missions with extra state (satisfaction, type, dialogue).

## Key Decisions

- **Passenger logic in MissionManager** — keeps it simple, avoids new manager boilerplate for ~3 functions
- **Spec used as-is** — 337 lines, no need to split into sub-specs

## Components

### Constants (constants.js)

Add `PASSENGER_CONFIG` with all 5 types (refugee, business, wealthy, scientist, family), satisfaction weights, cargo space requirements, payment tier thresholds, and satisfaction multipliers.

### Generation (mission-generator.js)

`generatePassengerMission()` creates passenger missions for the board. Each has a generated name, type, dialogue, destination, and cargo space requirement. Appears alongside cargo runs on the mission board.

### Satisfaction (MissionManager)

- Tracked as 0-100 value on the mission object (starts at 50)
- Updated by MissionManager methods responding to game events (delays, combat, low life support)
- Weights per passenger type determine impact magnitude
- Clamped to 0-100

### Payment (MissionManager)

- Satisfaction-based multiplier: very satisfied (>=80) 1.3x, satisfied (>=60) 1.15x, neutral (>=40) 1.0x, dissatisfied (>=20) 0.7x, very dissatisfied (<20) 0.5x
- On-time bonus: +0.1x if delivered before deadline
- Reputation effect on `civilians` faction based on final satisfaction

### Passenger Events (EventEngine integration)

3 narrative events registered with existing EventEngine:
- Comfort complaint (jump trigger, 15% chance, any passenger)
- Wealthy tip (dock trigger, satisfaction >= 70, wealthy passenger)
- Family children (jump trigger, 20% chance, family passenger)

New condition evaluators: `has_passenger`, `has_wealthy_passenger`, `has_family_passenger`

### UI

- Passenger missions on MissionBoardPanel with type/dialogue display
- Satisfaction indicator during transit
- Delivery summary modal on completion showing satisfaction, payment breakdown, reputation effect
