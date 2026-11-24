# NPC Cargo Storage Picker — Design

Date: 2026-11-24

## Goal

1. NPC cargo storage never takes mission cargo (stacks with `missionId`).
2. A modal picker lets the player choose what to store and what to retrieve.
   Today `storeCargo` silently takes the first 10 units in hold order and
   `retrieveCargo` takes everything that fits.
3. `CARGO_STORAGE_LIMIT` (10) caps the **total** an NPC holds, matching the
   constant's comment and the NPC dialogue ("Up to ten units"). Today it only
   caps each individual store, so storage grows without bound across favors.

Side fix: today `repGain` is granted even when nothing was stored, and the
player never sees the result message.

## Section 1: Dialogue integration

- The storage and retrieval choices in the 7 NPC dialogue files
  (`src/game/data/dialogue/`: rusty-rodriguez, dr-sarah-kim, whisper,
  station-master-kowalski, captain-vasquez, zara-osman, lucky-liu) drop
  `action` and gain a declarative `picker: 'store' | 'retrieve'`.
- `showDialogue` (`src/game/game-dialogue.js`) passes `picker` through on each
  displayed choice.
- `DialoguePanel` opens a `Modal` containing `CargoStoragePicker` when a picker
  choice is clicked, instead of advancing.
- Confirm calls `storeCargo(npcId, selections)` / `retrieveCargo(npcId, selections)`.
  - Success: close the modal, then `selectChoice(npcId, choiceIndex)`. This works
    because `selectChoice` reads the current node from dialogue state when it
    runs, and the node does not change while the modal is open. `repGain` and
    `next` apply as normal.
  - Failure: show `result.message` in the modal and do not advance.
- Cancel: close the modal. No reputation gain, no cooldown, and the dialogue
  stays on the same node.
- `storeCargo` / `retrieveCargo` are removed from `buildDialogueContext`,
  because nothing uses them any more.

Rejected:
- Having the action emit an "open picker" event. The dialogue advances and
  grants `repGain` before the player picks, so Cancel would give free reputation.
- Special-casing node IDs in `DialoguePanel`. That is brittle across 7 files.

## Section 2: Picker component and data flow

New folder: `src/features/cargo-storage/`.

- `CargoStoragePicker.jsx`. Props: `mode` (`'store'|'retrieve'`), `npcId`,
  `npcName`, `onConfirm(selections)`, `onCancel`.
- `cargoStorageUtils.js`: pure functions for clamping, totals, per-row max
  against the remaining limit, and building the selections list.

Data sources:
- Store: ship cargo via `useGameEvent(CARGO_CHANGED)`. The limit is
  `CARGO_STORAGE_LIMIT` minus units already stored with this NPC.
- Retrieve: `useGameEvent(NPCS_CHANGED)[npcId].storedCargo`. The limit is
  `getCargoRemaining()`.

Local `useState({ [stackIndex]: qty })` holds in-progress UI choices only. It
is not copied game state.

Rows reuse the `TradePanel` stack display: `formatCargoDisplayName(stack.good)`,
the `.cargo-stack` / `.stack-info` classes, and the quantity held. Controls are
`[−] n [+] [Max]`, and `−`/`+` get aria-labels (e.g. "Store one less Grain").
When storing, a mission stack shows "Mission Cargo (cannot be stored)" in the
`mission-cargo-label` style and has no controls.

Footer: "Selected: 3 / 7 (3 already stored)", then `[Cancel]` and
`[Store 3 units]` / `[Retrieve 3 units]`. The confirm button is disabled at 0.

Actions go through `useNPCActions` (gains `storeCargo` and `retrieveCargo`),
following the Bridge Pattern. `GameCoordinator.storeCargo` / `retrieveCargo`
pass `selections` through.

Left out: an "Everything" button and a slider. Per-row `Max` covers both.

## Section 3: Manager validation

`selections = [{ stackIndex, qty }]`, the same shape as the hidden-cargo moves.

`storeCargo(npcId, selections)`:
1. `canRequestFavor(npcId, 'storage')`, which now also returns
   `{ available: false, reason: 'Storage full' }` when stored units have
   reached `CARGO_STORAGE_LIMIT`. That hides the dialogue choice.
2. `selections` is a non-empty array, with unique `stackIndex` values and
   positive integer `qty` values.
3. Each stack exists, has no `missionId`, and `qty <= stack.qty`.
4. The total is no more than `CARGO_STORAGE_LIMIT - storedUnits`.
5. Apply the change: lower each selected stack's quantity, drop stacks that
   reach 0, append `{ ...stack, qty }` to `storedCargo`, set `lastFavorDay` and
   `interactions`, then call `markDirty()`.

`retrieveCargo(npcId, selections)`: the same shape checks against
`storedCargo`, plus a total no more than `getCargoRemaining()`. Merges into the
hold through `addToCargoArray`, which keeps `missionId`. Does not set the
cooldown.

Every check returns `{ success: false, message }` before any change, so
nothing is half-applied. A missing or non-string `npcId` still throws.

## Section 4: Testing

TDD, one failing test at a time, with a separate commit per group:

1. Manager (`tests/unit/npc-cargo-storage-selections.test.js`):
   - Stores exactly the selected quantities.
   - Removes stacks that reach 0.
   - Refuses mission cargo, quantities above `stack.qty`, missing indexes,
     duplicate indexes, zero or negative quantities, non-integer quantities,
     and totals over the remaining cap.
   - Returns "Storage full" at the cap.
   - Retrieval: takes the selected stacks, respects capacity, keeps
     `missionId`, and does not start the cooldown.
2. Property tests:
   - Rewrite `cargo-storage-transfer` and `cargo-retrieval-completeness`
     around selections.
   - New property: total units across hold plus storage stay the same, mission
     cargo never ends up in storage, and stored units never exceed the limit.
   - At least 100 iterations each.
3. Dialogue:
   - `picker` passes through `showDialogue`.
   - Every storage and retrieval choice in `ALL_DIALOGUE_TREES` has `picker`
     and no `action`.
   - Update `dialogue-context.test.js`.
4. `cargoStorageUtils` pure functions.
5. `CargoStoragePicker` (React Testing Library):
   - Mission row is shown as disabled.
   - `+`/`−` change the quantity and `+` stops at the limit.
   - Confirm is disabled at 0 and its label shows the count.
   - `onConfirm` receives the right selections.
6. `DialoguePanel`:
   - A picker choice opens the modal and does not advance.
   - Cancel stays on the same node and grants no reputation.
   - Confirm stores, then advances with `repGain`.
   - A failure keeps the modal open and shows the message.

Existing tests that use the old no-argument API (`npc-manager-coverage`,
`game-dialogue-coverage`, `vasquez-whisper-coverage`, `npc-manager-markdirty`)
are updated in the same commit as the change that breaks them. The full suite
and `npm run lint` stay clean after every commit.
