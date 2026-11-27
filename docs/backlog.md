# Backlog

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

## Stacked Modals would all close on one Escape

`src/components/Modal.jsx` listens for Escape on the document without
stopping propagation, so if two Modals were open at once, one Escape would
close both. No current flow stacks Modals, and `useFocusTrap` already notes
the same one-at-a-time assumption.

Possible fix: a shared stack so only the top Modal (and trap) handles keys.
Do it when a flow first needs nested dialogs.

Found during the SystemPanel accessibility audit
(`paad/a11y-reviews/a11y-2026-11-25-15-35-10.md`).

## Trade sale feedback is not announced

`src/features/trade/TradePanel.jsx` shows Cole's withholding breakdown after a
sale in a `validation-message` div with no `role`, so screen readers don't
announce it. The other panels use `role="alert"` for this pattern.

Possible fix: `role="status"` on that div. Testing it needs the mocked
`sellGood` to return `withheld > 0` together with a sellable stack.

Found while fixing the SystemPanel accessibility audit.

## Close buttons across panels are all named "Close"

Most panels' `×` buttons use `aria-label="Close"` (Trade, Refuel, Repair,
Upgrades, Missions, Finance, Info Broker, Ship Status, Cargo, Outcome,
Mechanical Failure, Dev Admin, the jump warning). When two are on screen,
screen reader and voice control users can't tell them apart. SystemPanel now
uses `Close <system> panel`.

Possible fix: name each after its panel, e.g. `Close trade panel`.

Found while fixing the SystemPanel accessibility audit.

## Loading a save can resume a stale active dialogue

`state.dialogue` is saved and restored as-is, so a save written while a
conversation was open loads with `isActive: true` and no panel showing it.
Only the NPC-recovery path in `src/game/state/managers/save-load.js` resets it.
`clearDialogueState` in `src/game/state/managers/dialogue.js` also skips
`markDirty()`, so a cleared dialogue isn't saved until something else dirties
the state. `DialoguePanel` now tolerates the stale state (see `fb5f280`), so
nothing visible breaks today, but anything else reading `dialogue.isActive`
after a load would see a conversation that isn't happening.

Possible fix: reset `dialogue` to its inactive defaults on every load, the
same way the recovery path does.

Found while debugging NPC dialogue not opening under StrictMode on `ovid/images`.

## Dialogue panel sits flush left between 500px and 600px wide

At viewport widths from 500px to 600px, the dialogue panel is pinned to the
left edge at its 500px `max-width` (from the `@media (max-width: 900px)` rule
in `css/panel/dialogue.css`), so the station menu shows in the gap on the
right. Real phones are narrower than 500px and get a full-width panel, so
this mostly affects narrow desktop windows and small tablets.

Possible fix: drop the `max-width` inside the 600px mobile rule so the panel
fills the width there.

Found during UAT of the `ovid/images` branch (NPC portraits).

## "Continue" after a rejected save starts a fresh game and overwrites the save

When `loadGame()` rejects a save (bad JSON, incompatible version, failed
validation), `src/main.jsx` falls back to `initNewGame()` and only logs in dev
mode. `TitleScreen` still offers Continue because `hasSavedGame()` only checks
that the key exists. `handleStartGame` in `src/App.jsx` ignores the return
value of `game.loadGame()`, goes straight to ORBIT (skipping ship naming), and
the first `markDirty()` overwrites the unreadable save.

Found during the 2026-11-27 architecture review (F-1).

## Combat panels show different evasion odds from the resolver

`CombatPanel.jsx` and `PirateEncounterPanel.jsx` add
`COMBAT_CONFIG.ENGINE_PENALTY_VALUE` when the engine is degraded, but
`CombatManager.resolveEvasiveManeuvers` (`managers/combat.js`) never applies
it. The resolver subtracts `encounter.strengthModifier`, which neither panel
includes, so displayed odds are wrong after an escalation.

Found during the 2026-11-27 architecture review (F-3).

## Refuel charges credits before a check that can throw

`refuel()` in `src/game/state/managers/refuel.js` calls `updateCredits` before
the "CRITICAL BUG" guard that throws if fuel would decrease. If the guard ever
fires, the player has paid and got no fuel. `buyGood` in `trading.js`
similarly debits before an unguarded `currentSystemObj.name` lookup.

Found during the 2026-11-27 architecture review (F-21).

## UPGRADES_CHANGED emits the live upgrades array

`ShipManager` pushes to `ship.upgrades` in place and then emits the same array
(`ship.js` install, remove and purchase paths). `useGameEvent` stores it with
`setState`, and React's `Object.is` check treats it as unchanged, so
subscribers update only if another event fires in the same action (dev-admin
install and remove have none). The quest path in `game-coordinator.js` copies
the array. `trading.js` does the same with `priceKnowledge`.

Found during the 2026-11-27 architecture review (F-19).

## Salvage merge mutates a live cargo stack

`applyEncounterOutcome.js` copies the cargo array shallowly, then does
`existingStack.qty += qtyToAdd` on the stored object before `updateCargo`
runs, so the stored state changes outside the manager.

Found during the 2026-11-27 architecture review (F-4).

## `saveGame()` docstring contradicts its return value

`saveGame()` in `src/game/state/managers/save-load.js` is documented as
returning true when the save "succeeded or was debounced", but it returns
false when the write is debounced, the same value as a real failure.

Found during the 2026-11-27 architecture review (F-11).

## Gameplay RNG parameters default to `Math.random`

`generateMissionBoard` and its helpers (`mission-generator.js`),
`EventEngineManager.checkEvents` (`event-engine.js`) and `assignShipQuirks`
(`ship.js` and the `game-coordinator.js` facade) take an `rng` argument that
defaults to `Math.random`. Every current caller passes a seeded RNG, but a new
caller that omits it silently loses determinism, against the project rule. Make
the argument required, or throw when it is missing.

Found during the 2026-11-27 CLAUDE.md pushback review.
