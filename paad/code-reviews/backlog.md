# Out-of-Scope Findings Backlog

> **These items were flagged by `/agentic-review` as out of scope for the branch
> on which they were found.** They may be stale, may already have been fixed by other
> means, may no longer apply after refactors, or may simply have been judged not worth
> addressing. Verify each entry against the current code before acting on it. Entries
> are removed only when explicitly addressed — no automatic cleanup.

---

## `b13080d6` — Continue ignores the result of the second loadGame call
- **File (at first sighting):** `src/App.jsx:229`
- **Symbol:** `handleStartGame`
- **Bug class:** Error Handling
- **Description:** The Continue branch calls game.loadGame() again, ignores the return value and getLoadError(), and always switches to ORBIT. If the second load is rejected (save changed since boot) or throws after assigning state, the error is never shown and the next markDirty write overwrites the save. The title-screen guard only covers the boot load.
- **Suggested fix:** Check the return value; on null stay on TITLE and show getLoadError(). Or skip the reload when the boot load already succeeded.
- **Confidence:** Medium
- **Found by:** Error Handling, Spec Compliance (`claude-opus-5-5`)
- **First seen:** 2026-11-27 on branch `ovid/architecture` at `0801a90`
- **Last seen:** 2026-11-27 on branch `ovid/architecture` at `0801a90`
- **Severity:** Suggestion
