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

## NPC storage changes don't emit `NPCS_CHANGED`

`storeCargo` and `retrieveCargo` in `src/game/state/managers/npc.js` change
`storedCargo` (and `interactions`/`lastFavorDay`) but never emit
`EVENT_NAMES.NPCS_CHANGED`. Only `modifyRep` and `setNpcRep` emit it. Any
component subscribed with `useGameEvent(NPCS_CHANGED)` keeps showing old NPC
state until something else emits. Today that is `DevAdminPanel`. A component
that reads the event only on mount (like the planned cargo storage picker) is
unaffected.

Possible fix: emit `NPCS_CHANGED` with a copy of NPC state after each storage
mutation, the same way `modifyRep` does.

Found during pushback on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.

## Hidden cargo moves accept zero, negative or fractional quantities

`moveToHiddenCargo` and `moveToRegularCargo` in
`src/game/state/managers/ship.js` check only `qty > stack.qty` and the capacity
limit. A negative `qty` passes both checks, so cargo moves the opposite way
without any capacity check, and a fractional `qty` leaves fractional stacks.
Today only the UI calls these functions.

Possible fix: reject `qty` unless `Number.isInteger(qty) && qty > 0`, the same
rule as the NPC storage selections.

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

## Moving cargo out of the hidden compartment ignores passenger space

`moveToRegularCargo` in `src/game/state/managers/ship.js` checks free space as
`ship.cargoCapacity - cargoUsed`, where `cargoUsed` sums cargo stacks only.
`getCargoRemaining()` (`src/game/state/managers/state.js`) also subtracts
passenger space. With a passenger aboard, moving hidden cargo into the main
hold can fill it past capacity.

Possible fix: use `getCargoRemaining()` for the capacity check.

Found during pushback on `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`.
