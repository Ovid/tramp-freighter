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

- The storage mechanics in the 7 NPC dialogue files
  (`src/game/data/dialogue/`: rusty-rodriguez, dr-sarah-kim, whisper,
  station-master-kowalski, captain-vasquez, zara-osman, lucky-liu) move into
  one shared helper in `src/game/data/dialogue/` (for example
  `storage-dialogue.js`). It builds, from per-NPC text only:
  - the two greeting choices: "store", gated on
    `context.canRequestStorage.available`, and "retrieve", gated on stored
    cargo being non-empty;
  - the `request_storage` and `retrieve_cargo` nodes, with their flags, their
    confirm and decline choices, `next: 'greeting'`, and `repGain`.

  Each NPC file passes its own lines and flag names. The helper writes the
  mechanics once. Node text that states the limit takes it from
  `CARGO_STORAGE_LIMIT` rather than spelling out "ten". The helper drops the
  separate Friendly-tier check, because `canRequestFavor` already does it, and
  the "no context" fallback that only 2 of the 7 files have.
- The confirm choices are declarative: they have no `action` and carry
  `picker: 'store' | 'retrieve'`.
- The retrieve confirm choice has no `repGain`. Getting your own cargo back
  is not a favor to the NPC, and since retrieval has no cooldown, a per-retrieve
  gain could be farmed one unit at a time. The store confirm keeps `repGain: 2`.
- The retrieve confirm text is the same for every NPC and is set in the
  helper: "Let me choose what to take." The old "Transfer what you can to my
  ship." described automatic retrieval, but the picker opens with nothing
  selected.
- `showDialogue` (`src/game/game-dialogue.js`) passes `picker` through on each
  displayed choice.
- `DialoguePanel` opens a `Modal` containing `CargoStoragePicker` when a picker
  choice is clicked, instead of advancing.
- The dialogue engine, not the UI, runs the picker operation (see
  `paad/adrs/0001-dialogue-engine-owns-picker-choices.md`).
  `selectChoice(npcId, choiceIndex, gameStateManager, { selections })`: when
  the selected choice has `picker`, the engine calls
  `storeCargo(npcId, selections)` or `retrieveCargo(npcId, selections)`. It
  applies `repGain` and `next` only if that call succeeds. A `picker` choice
  selected without `selections`, or whose manager call fails, grants no
  reputation and does not advance: the engine returns before
  `modifyRepRaw` and before `showDialogue`, so it changes no dialogue state.
  This way, a caller that skips the picker (for example, a future number-key
  shortcut) cannot get the store `repGain` without storing anything.
- `selectChoice` returns one shape for every choice, picker or not:
  `{ success, message, display }`. `display` is the next node's display
  object, or `null` when the dialogue ends. `message` is the manager's
  message for picker choices (on success and on failure) and is omitted
  otherwise. A failed picker choice returns
  `{ success: false, message, display: null }`.
  - `DialogueManager.selectDialogueChoice(npcId, choiceIndex, options)`
    passes the options through. When `success` is false it changes nothing
    and emits nothing. When `success` is true it behaves as today, using
    `display` where it used the old return value: a non-null `display` is
    stored and emitted, and `null` clears the dialogue. It returns
    `{ success, message }`. `GameCoordinator.selectDialogueChoice` passes the
    options through and returns the same.
  - `useDialogue().selectChoice(npcId, choiceIndex, options)` returns
    `{ success, message }`, or `{ success: false }` if the call throws (as
    it returns `false` today).
  - `DialoguePanel` treats `success: false` from a non-picker choice as it
    treats `false` today (clear and close). A picker confirm with
    `success: false` keeps the panel and modal open (see below).
  - Reason: `DialogueManager` stores any truthy return from `selectChoice`
    as `dialogue.display`, so a bare `{ success, message }` would be drawn
    as a dialogue node and crash the app to the error boundary.
- Confirm calls `selectChoice(npcId, choiceIndex, { selections })` through
  `useDialogue`. This works because `selectChoice` reads the current node from
  dialogue state when it runs, and the node does not change while the modal is
  open.
  - Success: show `result.message` with the existing notification system and
    close the modal. Follow the existing null-safe pattern
    (`App.jsx`, `NarrativeEventPanel.jsx`):
    `const notificationCtx = useNotificationContext()`, then
    `notificationCtx?.showSuccess(result.message)`. The context is `null`
    outside `NotificationProvider`, and existing `DialoguePanel` tests render
    without one.
  - Failure: show `result.message` in the modal. The dialogue does not
    advance.
- Cancel: close the modal. No reputation gain, no cooldown, and the dialogue
  stays on the same node.
- `storeCargo` / `retrieveCargo` are removed from `buildDialogueContext`,
  because dialogue files no longer call them. The engine calls the
  `gameStateManager` methods directly.

Rejected:
- Having the action emit an "open picker" event. The dialogue advances and
  grants `repGain` before the player picks, so Cancel would give free reputation.
- Special-casing node IDs in `DialoguePanel`. That is brittle across 7 files.

## Section 2: Picker component and data flow

New folder: `src/features/cargo-storage/`.

- `CargoStoragePicker.jsx`. Props: `mode` (`'store'|'retrieve'`), `npcId`,
  `npcName`, `onConfirm(selections)`, `onCancel`.
- `cargoStorageUtils.js`: pure functions for clamping, totals, per-row max,
  and building the selections list. A row's max is
  `min(stack.qty, limit - unitsSelectedInOtherRows)`, clamped to 0. Both `+`
  and `Max` use it, so the total can never pass the limit. The selections
  builder leaves out rows whose quantity is 0 (for example, after `+` then
  `−`), because the manager rejects any `qty` that is not a positive integer.

Data sources:
- Store: ship cargo via `useGameEvent(CARGO_CHANGED)`. The limit is
  `Math.max(0, CARGO_STORAGE_LIMIT - unitsAlreadyStored)`. Older saves can
  hold more than the cap, so the subtraction can be negative.
- Retrieve: `useGameEvent(NPCS_CHANGED)[npcId].storedCargo`. The limit is
  `Math.max(0, getCargoRemaining())`. `getCargoRemaining()` already subtracts
  passenger space, so this limit matches the hold space shown in
  `TradePanel` and `ShipStatus`.

Local `useState({ [stackIndex]: qty })` holds in-progress UI choices only. It
is not copied game state.

Rows reuse the `TradePanel` stack display: `formatCargoDisplayName(stack.good)`,
the `.cargo-stack` / `.stack-info` classes, and the `stack-details` line
(`Qty: n | Bought at: X ₡/unit`). The buy price tells apart stacks of the
same good bought at different prices, which `addToCargoArray` keeps as
separate stacks. Controls are `[−] n [+] [Max]`, and `−`/`+` get aria-labels
that include the buy price (e.g. "Store one less Grain bought at 10 credits"),
so two Grain rows do not share a label.
When storing, a mission stack shows "Mission Cargo (cannot be stored)" in the
`mission-cargo-label` style and has no controls.

The modal gets a `title` so the dialog has an accessible name (`Modal` sets
`aria-labelledby` only when a title is passed): "Store cargo with {npcName}" or
"Retrieve cargo from {npcName}".

Footer: when storing, "Selected: 3 / 7 (3 already stored)". When retrieving,
"Selected: 3 / 5 (hold space)". Then `[Cancel]` and
`[Store 3 units]` / `[Retrieve 3 units]`. The confirm button is disabled at 0.
Unit counts in labels go through `pluralizeUnit` (`src/game/utils/string-utils.js`),
so a count of 1 reads "Store 1 unit".

When storing, the footer also warns: "Storing uses "Rusty" Rodriguez's
favor: no more storage or loans from them for 30 days." The number comes from
`FAVOR_COOLDOWN_DAYS`. Storage and loans share `lastFavorDay`, and the picker
starts with nothing selected, so without the warning a 1-unit store would use
up the favor without the player knowing.

Empty states: when storing and either the (clamped) remaining limit is 0 or no stack can
be stored, the picker shows "No cargo you can store". When retrieving with
`getCargoRemaining()` at 0, it shows "No room in your hold". The dialogue
choice conditions do not change.

The picker does not call the manager itself. It hands `selections` to
`onConfirm`, and `DialoguePanel` passes them to `selectChoice` through
`useDialogue`, following the Bridge Pattern. `useNPCActions` does not change.
`GameCoordinator.storeCargo` / `retrieveCargo` pass `selections` through to
the manager for the engine to use.

Left out: an "Everything" button and a slider. Per-row `Max` covers both.

## Section 3: Manager validation

`selections = [{ stackIndex, qty }]`, the same shape as the hidden-cargo moves.

`storeCargo(npcId, selections)`:
1. `canRequestFavor(npcId, 'storage')`, which now also returns
   `{ available: false, reason: 'Storage full' }` when stored units are at or
   over `CARGO_STORAGE_LIMIT` (`>=`; older saves can be over it). That hides
   the dialogue choice. Units over the cap stay stored and can be retrieved
   normally.
2. `selections` is a non-empty array. Each `stackIndex` is a non-negative
   integer (`Number.isInteger`), the `stackIndex` values are unique, and each
   `qty` is a positive integer. The integer check matters: `0` and `'0'` are
   different values in a `Set` but name the same array slot.
3. Each stack exists, has no `missionId`, and `qty <= stack.qty`.
4. The total is no more than `CARGO_STORAGE_LIMIT - storedUnits`.
5. Apply the change: lower each selected stack's quantity, drop stacks that
   reach 0, merge each selection into `storedCargo` through `addToCargoArray`
   (the same call retrieval uses, so a stack with the same good, `buyPrice`
   and `missionId` gets one row), set `lastFavorDay` and
   `interactions`, then call `markDirty()`.

`retrieveCargo(npcId, selections)`: the same shape checks against
`storedCargo`, plus a total no more than `getCargoRemaining()`. Merges into the
hold through `addToCargoArray`. Does not set the cooldown.

Hold space: retrieval uses `getCargoRemaining()`, which already subtracts
passenger space (`src/game/state/managers/state.js`). No change is needed.

Every check returns `{ success: false, message }` before any change, so
nothing is half-applied. A missing or non-string `npcId` still throws.

Both methods return a `message` on success as well, which `DialoguePanel`
shows: for example `Stored 3 units with "Rusty" Rodriguez` and
`Retrieved 3 units from "Rusty" Rodriguez`. The count goes through
`pluralizeUnit`, so 1 reads `Stored 1 unit with "Rusty" Rodriguez`. Today
`retrieveCargo` returns no `message`.

NPC names: the success messages, the picker title and the favor warning all
use the NPC's display `name` from `npc-data.js` as it is (for example
`"Rusty" Rodriguez`, `Station Master Kowalski`), the same name today's
`storeCargo` message uses. No short-name field is added. Tests read the
expected name from the NPC data instead of hard-coding it.

Apply against a copy: build the new hold and storage arrays from the original
indices, then assign them once. Never splice in place while going through the
selections, because removing an earlier stack shifts the indices of later ones.

Save migration: on load, `state-validators.js` drops every `storedCargo`
stack that has a `missionId`, whether or not its mission is still active.
Older saves could store mission cargo. With this rule NPC storage never holds
mission cargo, so `removeMissionCargo` and mission completion never need to
look there. A mission whose cargo is dropped can no longer be completed. It
ends through its deadline, through abandonment, or through
`failMissionsDueToCargoLoss` after the next encounter that takes cargo. This is accepted because few or no
players have such saves.

Known old-save quirk: older saves can hold duplicate stored stacks that match
on `good`, `buyPrice` and `missionId`, because the old `storeCargo` appended
stacks without merging them. The retrieve picker shows these as identical rows
with identical aria-labels. Retrieval still works, because each row has its
own index. The migration does not merge them. This is accepted for the same
reason as above: few or no players have such saves, and they can start a new
game.

## Section 4: Testing

TDD, one failing test at a time, with a separate commit per group:

1. Manager (`tests/unit/npc-cargo-storage-selections.test.js`):
   - Stores exactly the selected quantities.
   - Removes stacks that reach 0.
   - Storing the same good at the same `buyPrice` twice gives one stored
     stack.
   - Refuses mission cargo, quantities above `stack.qty`, missing indexes,
     duplicate indexes, non-integer indexes (including `'0'` alongside `0`),
     zero or negative quantities, non-integer quantities, and totals over the
     remaining cap.
   - Returns "Storage full" at the cap and over it (for example, 15 already
     stored).
   - Both methods return a `message` on success, singular for 1 unit
     (`Stored 1 unit with ${npcData.name}`).
   - Retrieval: takes the selected stacks, respects capacity, and does not
     start the cooldown.
   - With a passenger aboard, retrieve refuses a total that fits capacity
     minus cargo but not capacity minus cargo minus passenger space.
   - Several selections where an earlier stack reaches 0 and a later stack is
     partly taken, for both store and retrieve. The right stacks change.
   - Migration (`state-validators`): stored stacks with a `missionId` are
     dropped, for both active and inactive missions. Stacks without a
     `missionId` are kept.
2. Property tests:
   - Rewrite `cargo-storage-transfer` and `cargo-retrieval-completeness`
     around selections.
   - New property: total units across hold plus storage stay the same, mission
     cargo never ends up in storage, and stored units never exceed the limit.
   - At least 100 iterations each.
3. Dialogue:
   - `picker` passes through `showDialogue`.
   - `selectChoice` on a `picker` choice without `selections` grants no
     reputation, does not advance, and returns failure.
   - `selectChoice` on a `picker` choice whose manager call fails (for
     example, a total over the cap) grants no reputation and does not
     advance.
   - `selectChoice` on the store `picker` choice with valid `selections`
     stores the cargo, applies `repGain`, advances to `next`, and returns
     `{ success: true, message, display }` with the manager's `message`.
   - `selectChoice` on a non-picker choice returns
     `{ success: true, display }`, with `display: null` when the dialogue
     ends.
   - `DialogueManager.selectDialogueChoice` on a failed picker choice leaves
     dialogue state unchanged and emits no `DIALOGUE_CHANGED`.
   - The shared storage helper: builds both greeting choices with the right
     conditions, builds both nodes with `picker` and no `action`, gives the
     retrieve confirm no `repGain` and the shared "Let me choose what to
     take." text, and puts `CARGO_STORAGE_LIMIT` in the text.
   - All 7 storage NPCs get their storage choices and nodes from the helper
     (checked through `ALL_DIALOGUE_TREES`).
   - Update `dialogue-context.test.js`.
4. `cargoStorageUtils` pure functions, including a remaining limit clamped to
   0 when more than the cap is already stored, or when hold space is negative,
   and a row set back to 0 is left out of the selections.
5. `CargoStoragePicker` (React Testing Library):
   - Mission row is shown as disabled.
   - Two stacks of the same good at different buy prices show their prices
     and have different aria-labels.
   - `+`/`−` change the quantity and `+` stops at the limit.
   - After `Max` on one row, `Max` on another row fills only what is left.
   - The store footer shows the favor-cooldown warning with the day count.
   - Confirm is disabled at 0 and its label shows the count ("Store 1
     unit", "Store 3 units").
   - `onConfirm` receives the right selections.
   - Empty states: "No cargo you can store" and "No room in your hold".
   - The dialog has an accessible name
     (`getByRole('dialog', { name: /Store cargo/ })`), and the retrieve footer
     reads "(hold space)".
6. `DialoguePanel` (new tests wrap it in `NotificationProvider` so they can
   check the success message; existing tests that render it without one keep
   passing):
   - A picker choice opens the modal and does not advance.
   - Cancel stays on the same node and grants no reputation.
   - Confirm stores, shows the success message, then advances with `repGain`.
   - Confirming a retrieve shows the retrieve success message.
   - A failure keeps the modal open and shows the message.

Existing tests that use the old no-argument API (`npc-manager-coverage`,
`game-dialogue-coverage`, `vasquez-whisper-coverage`, `npc-manager-markdirty`),
and tests of the old storage dialogue (`npc-dialogue-greetings`, which expects
the storage choices to have an `action`, and `dialogue-tree-structure`), are
updated in the same commit as the change that breaks them. So are the tests
that read `selectChoice`'s return value as a display or `null`
(`dialogue-edge-cases`, `game-dialogue-coverage`, `dialogue-navigation`,
`dialogue-flag-timing`, and the `toBeDefined`-only checks in
`dialogue-reputation-timing`); they move to `result.display`. In
`dialogue-tree-structure`, the assertion that the storage choice's condition
is false below the Friendly tier moves to a `canRequestFavor` test, because
the helper drops the duplicate tier check. Do not put that check back in the
helper to keep the old test passing. The full suite
and `npm run lint` stay clean after every commit.
