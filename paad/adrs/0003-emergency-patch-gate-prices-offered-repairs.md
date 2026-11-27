# ADR 0003: The emergency patch gate prices the repairs the panel offers

Date: 2026-11-27
Status: Accepted

## Context

The critical-damage design
(`docs/plans/2026-02-18-critical-damage-confinement-design.md:20,27`) offers
the Emergency Patch only when a system is at or below 20% and the player
cannot afford to repair it above that threshold. Its purpose (`:9`) is to
prevent deadlock when the player cannot pay for repairs.

`canAffordStandardRepair` priced an exact repair of `21 - condition` points
(₡5–₡105). The RepairPanel never sells that amount: it offers
`UI_CONFIG.REPAIR_AMOUNTS` (+10, +25, +50, Full) at the best NPC discount, so
the cheapest way out of the red is +10 (₡50) or +25 (₡125). A player with
credits between the two figures saw no patch and no enabled repair button.
The same gap existed on main.

## Decision

Keep the design's rule, and define "can afford" against what the panel
actually sells. `canAffordStandardRepair` takes the repair discount, and it
prices the smallest `REPAIR_AMOUNTS` entry (or Full) that lifts the system to
`EMERGENCY_PATCH_TARGET`. The manager guard and the panel use the same check.

## Alternatives rejected

- **Always offer the patch when critical**: simpler, but it contradicts the
  design's rule. It also gives rich players a credit-free repair for 3 days,
  and those days carry real costs: debt interest, loan checks, mission
  deadlines.
- **Add an exact "+N% to 21%" repair button**: makes the old formula true,
  but adds a button to every system for a rare case.

## Consequences

- A game rule now depends on `UI_CONFIG.REPAIR_AMOUNTS`. Anyone who changes
  the repair buttons changes when the patch appears. That is intended: the
  rule is about what the player can buy.
- If the panel ever offers an arbitrary repair amount, this check can go back
  to pricing exactly `21 - condition`.
