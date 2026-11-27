# Out-of-Scope Findings Backlog

> **These items were flagged by `/agentic-review` as out of scope for the branch
> on which they were found.** They may be stale, may already have been fixed by other
> means, may no longer apply after refactors, or may simply have been judged not worth
> addressing. Verify each entry against the current code before acting on it. Entries
> are removed only when explicitly addressed — no automatic cleanup.

---

## `859deb84` — Intel Offer acceptance chance ignores the karma modifier the resolver applies
- **File (at first sighting):** `src/features/danger/NegotiationPanel.jsx:272`
- **Symbol:** `NegotiationPanel`
- **Bug class:** Contract
- **Description:** The panel shows NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE * 100, while resolveIntelOffer rolls against base + calculateKarmaModifier(karma), clamped to [0,1]. Shown odds differ from used odds whenever karma is nonzero (up to 5 points).
- **Suggested fix:** Add intelOffer {finalChance, modifiers} to getNegotiationOdds via a shared intelOfferChance(karma) helper used by the resolver, and render it in the panel.
- **Confidence:** Medium
- **Found by:** Contract & Integration (`claude-opus-5-5`)
- **First seen:** 2026-11-27 on branch `ovid/architecture` at `0801a90`
- **Last seen:** 2026-11-27 on branch `ovid/architecture` at `0801a90`
- **Severity:** Suggestion

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
