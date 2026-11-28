# Rethink log

## 2026-11-27 — F-1 fix options (failed save load becomes a new game)

**Verdict:** Premise false (conclusion survives in modified form) + Lucky.

**What went wrong:** The recommended option said "stay on the title screen and
show an error notification." Toasts are only rendered inside the in-game view
branch of `App.jsx` (`<NotificationContainer />` sits under
`viewMode !== TITLE && !== SHIP_NAMING`), so the error would have been invisible.
The remaining premises (no writes while on the title screen, `flushSave` is a
no-op unless dirty, New Game confirms and only writes at ship naming) were true
but had not been checked before recommending. The cost of the alternative that
checks the save on the title screen was overstated without reading the tests.

**Guidance for future sessions:**

- Before proposing "show a notification/toast" for any flow, confirm the
  notification container is mounted in the view mode where it fires. On the
  title screen and during ship naming it is not; use inline UI or mount the
  container outside the view-mode switch.
- Before claiming "nothing writes to the save until X", trace every
  `markDirty`/`saveGame`/`flushSave` caller reachable in that view mode,
  including getters with side effects (`getNPCState`, `checkAchievements` after
  a successful restore). Don't rely on a grep of one function.
- Before stating a test-cost tradeoff for an option ("these tests would need
  revisiting"), open the tests and check what fixture data they use. Here every
  Continue-visibility test used a real, loadable save, so the cost was near zero.
- Any stored error or failure flag must have a stated clearing rule (on
  successful load, successful save, or New Game) as part of the option, or it
  goes stale.
- Never re-run `loadGame()` as a "probe": on success it assigns state, emits to
  subscribers and can mark dirty. Record the result of the boot-time load and
  read that instead.

## 2026-11-27 — F-2 fix options (encounter trigger pipeline)

**Verdict:** Wrong reason + Lucky. The recommended option (move trigger rules
into a game-layer manager) survives, but option 2 was described with a false
premise and the recommendation's comparison rested on an unchecked one.

**What went wrong:**
- Option 2 proposed "add a JUMP_COMPLETED event". That event already exists, is
  emitted inside `updateLocation` (before jump wear, and also on `markVictory`
  and `devTeleport`), and drives quest jump-count objectives. Moving it would
  have silently changed quest progress.
- Option 2's stated downside ("encounters only fire while App is mounted") has
  no practical effect: `useEventTriggers()` runs unconditionally in App, and App
  is never unmounted. Only headless/test use is affected.
- The "one behaviour change" in option 1 was undercounted: pirate chance, threat
  level and the hull-damage condition fallback also read pre-wear state today,
  not just the mechanical check. A post-credits New Game also runs a jump check
  at Sol today (stale `lastSystemRef`), which option 1 would stop.
- The direct call from `executeJump` loses the event bus's per-subscriber
  try/catch; a throw would surface as a failed jump.

**Guidance for future sessions:**
- Before proposing a new event name, grep `EVENT_NAMES` in `constants.js` and
  every `emit(`/`subscribe(` for it. An existing name with other consumers is
  not free to move.
- Before citing "only works while X is mounted" as a cost, find where X is
  mounted and whether that tree can ever unmount.
- When moving a check earlier or later in a sequence, list every input the
  check reads (not just the one the report named) and say which ones change.
- When replacing an event subscription with a direct call, keep the bus's
  error isolation (wrap the call) or say explicitly that a throw now
  propagates to the caller.
- Heuristics such as "skip the first emission" usually have a stale-state path
  (here: Return to Title after victory). Trace the reset paths before claiming
  a heuristic's replacement is behaviour-preserving.

## 2026-11-27 — F-4 fix options (encounter outcome application)

**Verdict:** Premise false + Lucky. The recommended "compute the whole result
from a snapshot first, then write" design rested on two false premises and
would have introduced a bug.

**What went wrong:**
- Claimed "most failures land before the first write". The writes are where
  the realistic throws are: `updateTime` runs a long chain (debt interest,
  mission deadlines, market updates), `modifyFactionRep` throws on bad faction
  names from mission penalty data, `modifyKarma` runs achievements. A pure
  compute step can pre-check only fuel bounds and the outcome's own faction
  keys.
- Claimed "markDirty in a finally means anything written still gets saved" as
  a benefit. Several writes already call markDirty, and the save serialises the
  whole live state, so a half-applied outcome is already persisted. The finally
  guarantees the half state is saved; it prevents nothing.
- Snapshot-merging salvage would resurrect mission cargo: `updateTime` ->
  `checkMissionDeadlines` -> `removeMissionCargo` filters `ship.cargo` in place
  mid-outcome (distress "loot" has both days and cargo rewards).
- Assumed the narrative panel's own markDirty was redundant; it is the only
  save trigger for choices without effects (`markFired`/`setCooldown`/`setFlag`
  do not mark dirty).
- Test-cost estimate missed that several tests use partial mock games or spy
  on facade methods, and that `use-encounter-orchestration.test.jsx`'s mock
  game would need the new facade method.

**Guidance for future sessions:**
- Before claiming a "compute first, write second" design prevents half-applied
  state, trace every write it calls for throw sites AND for side-effect chains
  (time ticks, achievements, mission checks) that mutate state the compute step
  read. If any write mutates its inputs, a snapshot is stale by construction.
- In this codebase `updateTime` is not a plain setter; treat it as an event
  that changes cargo, debt and missions, and keep its position in any sequence
  explicit.
- Before calling a save call redundant or a "finally markDirty" a benefit,
  check which callees already mark dirty and what the save serialises.
- Before estimating test churn for moving a free function behind the facade,
  grep for partial mock games, `vi.spyOn(game, ...)` on the callees, and
  `vi.mock` of the module path, not just direct call sites.

## 2026-11-27 — Review S1/S2 (post-jump condition warning, dev teleport)

**Verdict:** Lucky, with a mislabelled option. Both recommendations held, but
the load-bearing premise ("only one narrative popup shows per jump") was
asserted from a code comment before React batching and the synchronous jump
path were checked.

**What went wrong:**
- "Only the last narrative is shown" came from the comment in
  `encounter-trigger.js`, not from `useGameEvent`, the App narrative effect and
  `executeJump`'s pre-`await` section. It holds only because every emit lands
  in one synchronous run under React 18 batching; a narrative emitted in a
  later render is held and shown after the current one closes.
- Labelled an option "exact old behaviour" without checking timing. On main
  the jump-time checks ran at the ORIGIN system and before jump wear, so no
  option on the branch reproduces the old behaviour exactly.
- Described "call completeJump on teleport" as "behaves like the old teleport";
  it also runs a time check the old teleport never ran, and has no
  same-system skip.

**Guidance for future sessions:**
- Before claiming a player sees only one of several emitted events, check the
  receiving hook (setState of latest payload?), the consumer's guard, and
  whether the emits share one synchronous tick. Do not cite a code comment as
  proof.
- Before calling an option "the old behaviour", diff the event ORDER and the
  state each check saw (location, wear, day) on main versus the branch.
- When an option reuses an existing method for a new caller, list every check
  that method runs and compare it to what the old caller ran.

## 2026-11-27 — Premises of the Medium flaws F-5..F-10 (architecture report triage)

**Verdict:** Premise false (F-5 and F-10 impact) + Wrong reason (F-6) + Lucky
(F-7, F-8, F-9) + Ungrounded (F-7 half-applied jump).

**What went wrong:**
- F-10's load-bearing claim (events missing from `_emitAllStateEvents` leave the
  UI stale) was false: all game UI mounts outside TITLE/SHIP_NAMING, so every
  subscriber remounts after load and reads its initial value fresh. Hull/engine
  "omissions" don't exist in `EVENT_STATE_MAP`.
- F-5's bypasses all re-do the emit and markDirty; `updateCredits` does no
  validation, so the info-broker `credits -=` skips nothing. The implied fix
  (freeze/copy `getState`) is mis-aimed: writes leak through live `getOwnState`
  / `getShipCargo` / `getStats` capability getters, not `getState`.
- F-6 cited the wrong evidence: refuel cost is always integer and the finance
  fee formula matches `debt.js`. The real defect is repair-all with an NPC
  discount (display ceils once, charge ceils three times; `validateRepairAll`
  checks the undiscounted total → false "Insufficient credits").
- F-9 said "bypassed even where facade methods exist"; true only for
  `dangerManager`. The facade has no navigation equivalents.

**Guidance for future sessions:**
- Rate a flaw's impact by an observable defect, not by structural impurity. For
  every "X can drift" claim, check whether the two copies disagree TODAY, with a
  concrete input.
- For "missing event → stale UI" claims, find the subscribers and check whether
  any is mounted across the transition before calling it a bug.
- For ownership/bypass claims, compare the bypass to the sanctioned path line by
  line; if the sanctioned path adds nothing, the bypass is cosmetic.
- When a fix direction is implied ("return copies"), trace where mutation
  actually flows before endorsing it.
- "Facade bypassed" needs the facade method named for each call site.

## 2026-11-27 — F-6 fix options (repair pricing) and agentic-architecture skill review

**Verdict:** Wrong reason (F-6 option 1 survives) + Lucky (remaining premises).

**What went wrong:**
- Said option 2 "leaves the duplicate formulas"; false. The manager's
  `getRepairCost` already takes a discount (only the facade drops it), so
  option 2 can delete the duplicates too. The real difference is one charge vs
  three (up to ₡2).
- Called "all-or-nothing" a behaviour change; partial Repair All failure is
  unreachable once validation passes. The real symptom is a false
  "Insufficient credits" when credits sit between the discounted and
  undiscounted totals.
- "Manager owns all repair pricing" missed a third price copy:
  `canAffordRepairAboveThreshold` in repairUtils.js.
- Skill review: 3 of 5 earlier rethink entries were caused by fix-architecture's
  own fix options, not by the architecture report.

**Guidance for future sessions:**
- Before presenting fix options, grep each one's claimed differentiator. If
  "option B can't do X" is the case for A, check that B really can't.
- Don't list a behaviour change without showing the old behaviour is reachable:
  name the input that triggers it today.
- When an option claims to own "all" of something, grep every copy of the
  formula (including helpers that use the constant) before naming its scope.

## 2026-11-27 — Pushback I2 options (emergency patch affordability gate)

**Verdict:** Premise false (option 1 loses its standing) + Lucky (remaining premises) + Wrong reason (minor, savings cap).

**What went wrong:**
- Recommended deleting the "can't afford repair" gate without reading the
  feature's design doc. `docs/plans/2026-02-18-critical-damage-confinement-design.md:20,27,62`
  requires the patch be offered only when the player can't afford repair. The
  recommendation named this exact fact as its flip condition and never checked it.
- Said a rich player saves at most ₡105; the cheapest real button is +10 (₡50)
  or +25 (₡125), so the cap was computed against a repair the panel can't sell.
- Treated the 3-day penalty as cheap; time advance runs debt interest, loan
  default checks and mission deadlines.

**Guidance for future sessions:**
- Before recommending removal of a rule, grep `docs/plans/` for the feature
  and read its design doc. If a flip condition is checkable on disk, check it
  before presenting it.
- Price "what the player saves" against the actions the UI actually offers,
  not against an idealised exact amount.
- Before calling a time penalty cheap, read what `updateTime` triggers.

## 2026-11-28 — Drop the passenger_business fallback (agentic-review S1 on ovid/images-2)

**Verdict:** Premise false (the bug can't happen in play today) + the plan
was missing a step (it would break the art test it relies on).

**What went wrong:**
- The review flagged that Cole's favor passenger mission shows the business
  portrait. That mission never reaches `missions.active`, because
  `events.js:135` discards `processDebtTick()`'s `favorMission`.
  `docs/backlog.md` already said so ("Cole passenger favor template would
  crash on completion"). The specialist and the Verifier both traced the
  mission's shape and never asked whether it could be active.
- The planned fix didn't account for `tests/unit/portrait-assets.test.js:50-58`,
  which requires art on every event with no NPC speaker. Removing the fallback
  fails that test, and the Wiring section of `docs/extra-npcs.md` promises it.

**Guidance for future sessions:**
- Before acting on a finding about a data shape, check that a real producer
  can put that shape into live state. Grep for the push or assignment site.
- Grep `docs/backlog.md` for the symbol before treating a finding as new. It
  often records why a path is unreachable.
- Before removing a default, look for tests that assert the default exists.

## 2026-11-28 — F-10 fix proposal (fix-architecture, ovid/architecture)

**Verdict:** Wrong reason (part 2, and a missed test caller in part 3) +
Lucky (most other premises held but were checked only after proposing).

**What went wrong:**
- Proposed "add the 5 missing re-emits" by diffing `_emitAllStateEvents`
  against `EVENT_STATE_MAP`, without checking whether anything ever emits
  those events. `CURRENT_SYSTEM_CHANGED` and `INTELLIGENCE_CHANGED` are never
  emitted anywhere in `src`, and nothing writes `world.intelligence`. Adding
  them to the load re-emit, plus a test that every map key is re-emitted,
  would make two dead events look alive.
- Claimed `_applyMigrations` had no callers besides `restoreState`;
  `tests/unit/migration-registry.test.js:39,49` call it directly.
- Grepped only `src/game` and only the `subscribe(EVENT_NAMES.` form when
  claiming the new emits have no side effects.
- Said part 3 had "no behaviour change" without noting that, on a future
  version bump, derived compatibility keeps accepting old saves where the
  hard-coded guard rejected them.

**Guidance for future sessions:**
- Before adding an event to a "sync everything" list, grep for a runtime
  `emit(EVENT_NAMES.X` of it. A map entry is not proof the event is live.
- When claiming "no other callers", grep `tests/` as well as `src/`.
- When claiming an emit has no side effects, grep every subscriber form
  (`useGameEvent`, `subscribe`, string literals) across all of `src`.
- "No behaviour change" means today *and* at the next obvious change
  (a version bump, a new field); say which.
