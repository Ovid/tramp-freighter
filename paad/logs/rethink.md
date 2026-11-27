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
