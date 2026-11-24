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
