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
