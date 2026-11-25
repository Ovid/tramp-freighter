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

## Economic events: at most one new event per type per day

In `EconomicEventsSystem.updateEvents` (`src/game/game-events.js`), the
`break` after `activeEvents.push(newEvent)` exits the inner loop over
systems, not just the current system. So each event type starts at most one
new event per day, and systems earlier in `starData` (low ids) always get
the first roll. The comment says "Only one event per system", and the
config says "5% per day per eligible system", so this probably isn't what
was intended. Systems late in the list rarely get events.

Possible fix: loop over systems on the outside and event types on the
inside, so the `break` means one event per system. Check the effect on
event frequency before changing it, because more events will fire.

Found during pushback on `docs/plans/2026-11-25-navigation-sphere-plan.md`.

## `npm run all` fails on knip

All tests pass, but the final `knip` step of `npm run all` exits 1. It
reports an unused file, `src/game/state/capabilities.js`, and an unused
export, `YUMI_TANAKA_POSTCREDITS_DIALOGUE` in
`src/game/data/dialogue-trees.js`. Commit `0f5fe1a` gives the same result,
so this predates the navigation sphere branch.

Possible fixes: delete what is truly unused, or tell knip about it (for
example, `capabilities.js` may be documentation-only by design; the GSM
refactor notes describe a capabilities object).

Found while executing `docs/plans/2026-11-25-navigation-sphere-plan.md`.

## System panel shows 0.0 LY, 0% fuel, 0 days for systems with no direct wormhole

When the selected system has no direct wormhole link to the current one,
the SystemPanel jump section shows "Jump Distance: 0.0 LY", "Fuel Cost: 0%"
and "Jump Time: 0 days" above the "No wormhole connection to target system"
error. The same panel can say "Status: Reachable" (reachable through the
network). The zeros read as real values. Seen with Procyon → Sirius and
Procyon → 82 Eridani. `SystemPanel.jsx`'s jump section and
`validateJump` in `src/game/game-navigation.js` are unchanged on the
navigation sphere branch, so this predates it.

Possible fix: hide the distance, fuel and time rows (or show "—") when
the jump is invalid because there is no connection.

Found during UAT of `docs/plans/2026-11-25-navigation-sphere-plan.md`.

## Missions in old saves still name "L 726-8 A" and similar

Missions store their destination name when created. A save made before
multi-star primaries were renamed keeps text such as "Cargo Run:
Registered Freight to L 726-8 A" until the mission ends. Cosmetic only; no
new mission uses the old name.

Possible fix: none needed, or resolve the name from the destination id at
display time.

Found during UAT of `docs/plans/2026-11-25-navigation-sphere-plan.md`.
