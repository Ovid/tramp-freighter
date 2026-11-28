# Out-of-Scope Findings Backlog

> **These items were flagged by `/agentic-review` as out of scope for the branch
> on which they were found.** They may be stale, may already have been fixed by other
> means, may no longer apply after refactors, or may simply have been judged not worth
> addressing. Verify each entry against the current code before acting on it. Entries
> are removed only when explicitly addressed — no automatic cleanup.

---

## `c79b2f70` — Dev admin hidden-cargo list goes stale after hidden-cargo writes
- **File (at first sighting):** `src/features/dev-admin/DevAdminPanel.jsx:75`
- **Symbol:** `DevAdminPanel`
- **Bug class:** Logic
- **Description:** DevAdminPanel reads game.getHiddenCargo() during render but does not subscribe to HIDDEN_CARGO_CHANGED; adding hidden cargo emits only that event, so the hidden list is not re-rendered.
- **Suggested fix:** const hiddenCargo = useGameEvent(EVENT_NAMES.HIDDEN_CARGO_CHANGED) ?? [];
- **Confidence:** Medium
- **Found by:** Logic & Correctness (`claude-opus-5-5`)
- **First seen:** 2026-11-28 on branch `ovid/architecture` at `fe2fca39`
- **Last seen:** 2026-11-28 on branch `ovid/architecture` at `fe2fca39`
- **Severity:** Suggestion
