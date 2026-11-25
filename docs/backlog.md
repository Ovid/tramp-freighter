# Backlog

## Free reputation from declining cargo storage

In all 7 NPC `request_storage` dialogue nodes, the decline choice ("I
appreciate the offer, Rusty.", "Good to know that service exists.", and so on)
gives `repGain: 1` and returns to `greeting`. It has no cooldown. While the
storage choice is visible, the player can repeat greeting → storage → decline
without limit and gain unlimited reputation.

Files: `src/game/data/dialogue/` rusty-rodriguez, dr-sarah-kim, whisper,
station-master-kowalski, captain-vasquez, zara-osman, lucky-liu.

Possible fixes: drop the `repGain` from the decline choice, or grant it only
once (for example, gated on a flag). Check other nodes, such as loan offers,
for the same loop.

Found during pushback on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Tanaka supply donation can take mission cargo

`contributeSupply` in `src/game/state/managers/quest-manager.js` counts and
removes goods by `good` alone, through `removeCargoForMission`
(`src/game/state/managers/ship.js`), which ignores `missionId`. If an active
cargo-run mission is carrying `electronics` or `medicine` (the
`TANAKA_SUPPLY_CONFIG.GOODS`), donating can use up the mission cargo, and the
mission then fails for lost cargo. The legacy branch of `completeMission` uses
the same removal.

Possible fix: skip stacks with a `missionId` when counting and removing in
`canContributeSupply`, `contributeSupply` and `removeCargoForMission`.

Found during pushback on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Cargo-loss mission failures are silent and not saved

`failMissionsDueToCargoLoss` in `src/game/state/managers/mission.js` never
calls `markDirty()` and never adds an entry to `missions.pendingFailureNotices`.
`checkMissionDeadlines` does both. A mission failed by an encounter is not
saved until something else marks the state dirty, and the player gets no
failure notice when they next dock.

Possible fix: queue a notice and call `markDirty()`, the same way
`checkMissionDeadlines` does.

Found during rethink on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Cargo-loss mission failures skip some penalties

`failMissionsDueToCargoLoss` (`src/game/state/managers/mission.js`) applies
only `penalties.failure.faction`. The deadline and abandon paths also apply
`penalties.failure.rep` and `karma`, and the deadline path applies Cole's rep
penalty for Cole favor missions. This may be on purpose (losing cargo to
pirates is not the player's fault). Confirm, then either match the other paths
or add a comment explaining why.

Found during rethink on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Delivery missions pay in full after partial cargo loss

`getCompletableMissions` in `src/game/state/managers/mission.js` treats a
`missionCargo` delivery as completable when any stack with its `missionId`
exists (`hasMissionCargo`), whatever the quantity. If an encounter's
`cargoPercent` loss takes some of the mission's units, the player can still
deliver what is left for the full reward. This may be on purpose (forgiving
design). Confirm, then either check quantity or add a comment explaining why.

Found during rethink on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Mission Complete dialog ignores a failed claim

`handleComplete` in `src/features/missions/MissionCompleteNotifier.jsx` calls
`completeMission` and discards the result, then advances as though the claim
succeeded. `getCompletableMissions` already pre-filters with the same checks,
so a failure needs state to change between listing and clicking. Low risk, but
a failed claim should show its `reason` rather than vanish silently.

Found during rethink on issue #57.

## Cole passenger favor template would crash on completion

A Cole favor passenger template in `src/game/state/managers/debt.js` has no
`passenger` object, so `calculatePassengerPayment` would throw on
`mission.passenger.satisfaction`. Unreachable today: the `favorMission` from
`checkCheckpoint` is discarded (`events.js`) and never reaches
`missions.active`. Fix before wiring favor missions up.

Found during rethink on issue #57.

## Contested-zone config points at the wrong star

`DANGER_CONFIG` in `src/game/constants.js` (around line 1192) has
`systems: [7, 10], // Sirius, Epsilon Eridani`. Id 10 is `L 726-8 B`, an
unreachable companion star. Epsilon Eridani is id 13. As a result, Epsilon
Eridani never gets the contested pirate and inspection rates.

Possible fix: change `10` to `13`. Add a test that looks up each contested id
in `STAR_DATA` and checks its name.

Found during rethink on multi-star merging (GitHub #56).
