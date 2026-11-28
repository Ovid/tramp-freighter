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

Give that `passenger` object a `type` from `PASSENGER_CONFIG.TYPES` too.
Without one, `passenger_complaint_comfort`'s `generateContent`
(`src/game/data/narrative-events.js`) returns `{}`, and the complaint shows
the static `narrative/passenger_business` portrait for Cole's associate.

Found during rethink on issue #57. Portrait note added during rethink of
the `ovid/images-2` agentic review.

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

## Gameplay RNG parameters default to `Math.random`

`generateMissionBoard` and its helpers (`mission-generator.js`),
`EventEngineManager.checkEvents` (`event-engine.js`) and `assignShipQuirks`
(`ship.js` and the `game-coordinator.js` facade) take an `rng` argument that
defaults to `Math.random`. Every current caller passes a seeded RNG, but a new
caller that omits it silently loses determinism, against the project rule. Make
the argument required, or throw when it is missing.

Found during the 2026-11-27 CLAUDE.md pushback review.

## Save-failure toasts are invisible on the title and ship-naming screens

`<NotificationContainer />` is only mounted inside the in-game view branch of
`App.jsx`. A `SAVE_FAILED` from `handleShipNamed`'s `saveGame()` shows only if
the player is still in ORBIT within the toast duration.

Found during the 2026-11-27 rethink of the F-1 fix options.

## Dev admin panel hand-builds encounter payloads

`DevAdminPanel.jsx` (~340-405) calls the danger chance calculators and emits
`ENCOUNTER_TRIGGERED` with its own payloads (`threatLevel: 'moderate'`
hard-coded), duplicating the shapes built by
`EncounterTriggerManager.generateEncounter` (`managers/encounter-trigger.js`). They
will drift from the real encounter shapes. Possible fix: have the panel ask the
same generator the trigger pipeline uses.

Found during rethink on the F-2 architecture fix (2026-11-27 report).

## Coordinator facade methods left with only test callers

After the F-2 fix moved trigger rules into `EncounterTriggerManager`,
`GameCoordinator.checkMechanicalFailure` and `GameCoordinator.checkEvents` have
no callers in `src/` (tests only). knip does not see unused class methods.
Possible fix: point those tests at the managers and delete the two facade
methods (see F-18 in the 2026-11-27 architecture report).

Found during the F-2 architecture fix (2026-11-27 report).

## Kidnap penalties apply even when abandoning the passenger mission fails

In `OutcomeManager` (`src/game/state/managers/outcome.js`, ~134-143),
`costs.kidnappedPassengerId` calls `abandonMission` and then applies the faction and karma penalties
regardless of its `{success: false}` result (missing or non-abandonable
mission). Decide whether the penalties should depend on the abandon succeeding.

Found during rethink on the F-4 architecture fix (2026-11-27 report).

## Narrative choices have no error handling

`NarrativeEventPanel.jsx` `handleChoice` has no try/catch. A throw while applying
effects leaves the panel open and the event not marked fired, and the effects
partly applied.

Found during rethink on the F-4 architecture fix (2026-11-27 report).

## Encounter hook still imports a display helper from the features layer

`src/hooks/useEncounterOrchestration.js` imports `transformOutcomeForDisplay`
from `src/features/danger/transformOutcome`. After the F-4 fix this is the only
`src/hooks` -> `src/features` import. It is display-only, so either move it
beside the hook or accept the dependency and say so in DEVELOPMENT.md.

Found during the F-4 architecture fix (2026-11-27 report).

## Service-panel repair discount test never checks anything

`tests/integration/service-panel-discounts.integration.test.jsx` calls
`game.setNPCReputation`, which does not exist on GameCoordinator, and its
RepairPanel cases look for a repair NPC at system 1 and `return` early when none
is found. The only repair NPC is at Procyon (system 19), so those cases pass
without asserting. Repair discounts are now covered by
`repair-panel-charge-matches-display.integration.test.jsx`; this file should be
fixed or the hollow cases removed.

Found during the F-6 architecture fix (2026-11-27 report).

## Early-repayment reduce-to-fit underpays by 1 credit on float boundaries

`DebtManager.quotePayment` reduces a payment that can't cover its fee with
`Math.floor(credits / (1 + EARLY_REPAYMENT_FEE_RATE))`. Floating point makes
`33 / 1.1` come out as `29.999…`, so with 33 credits the player is offered ₡29
(+₡3 fee) when ₡30 (+₡3) is affordable. The label still matches the charge; the
player just pays slightly less than they could. An integer search for the
largest `a` with `a + ceil(a * rate) <= credits` would fix it. The property
test `debt-payment-quote.property.test.js` pins the old formula and would need
its oracle updated alongside.

Found during the F-6 architecture fix (2026-11-27 report).

## The coordinator's updateCredits does not mark state dirty

`StateManager.updateCredits` (`src/game/state/managers/state.js`) sets credits
and emits CREDITS_CHANGED but never calls `markDirty`; every current caller
marks dirty itself. A new caller that relies on `game.updateCredits` alone
would lose the change on reload unless something else marks dirty first.

Found while writing the F-11 safety net (2026-11-27 report).

## Tests still reset lastSaveTime "to avoid debouncing"

The 1 s save throttle is gone, so `lastSaveTime` is now only a record of the
last write. `npc-extensibility.test.js`, `manager-coverage-gaps.test.js` and
`danger-state-persistence.property.test.js` still set it to 0 with comments
about debouncing. The resets are harmless but misleading; remove them, and
consider dropping the `lastSaveTime` accessor from GameCoordinator if nothing
else reads it.

Found during the F-11 architecture fix (2026-11-27 report).

## Critical-damage design doc says day advance triggers degradation

`docs/plans/2026-02-18-critical-damage-confinement-design.md:25` says the
emergency patch's days "advance through normal day-advance logic (triggers
degradation, loan checks, etc.)". `EventsManager.updateTime`
(`src/game/state/managers/events.js:95-145`) runs loan, debt, market and
mission-deadline checks but no ship degradation. Either the doc is wrong or
degradation was meant to happen there.

Possible fix: correct the doc, unless degradation on idle days is intended.

Found during rethink on `paad/code-reviews/ovid-architecture-2026-11-27-18-12-55-86f198a.md`.
