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
