---
name: ovid-uat
description: You MUST use this skill when the user asks for UAT (user acceptance testing)
---

## Start

Announce: **"Ovid UAT commencing"**

## 1. Understand the Intent

Before touching the browser, determine *what* you are testing. In priority order:

1. If the user provided an explanation, use that.
2. Otherwise run `git log --oneline -10` and `git diff HEAD~1` to understand recent changes.
3. Ask for spec files for additional context, if you're not sure. The user may not have them.

**Do not rely on reading implementation code to infer intent** — code may have diverged from intent. You are a black-box tester.

From this, produce an explicit **Test Plan** as a numbered list before doing anything else. Show it to the user. Each item should be a concrete, observable behaviour (e.g. "Clicking 'New Game' resets the score to 0 and deals fresh cards"), not a vague goal. If you cannot construct a reasonable test plan, ask the user for clarification.

## 2. Start the Dev Server

Check if something is already listening on port 5173. If not, run `npm run dev` in the background and wait until the server is ready before proceeding.

## 3. Open the Browser

Use your Chrome skill to open `http://localhost:5173/`. **Take a screenshot immediately.** You are testing what a human *sees*, not what the DOM contains — always prefer visual evidence (screenshots) over DOM inspection alone. If the page looks wrong before you even begin, note it as a finding.

## 4. Execute the Test Plan

Work through each item in your test plan one at a time:

- Interact with the UI as a real user would.
- **Take a screenshot after each meaningful action** to capture what is actually rendered.
- You may also read Chrome console output and server logs to support your findings, but visual confirmation is primary.
- If you struggle to complete a task, as the user for guidance.
- Mark each test item as ✅ PASS or ❌ FAIL with a brief note on what you observed.

## 5. Handling Failures

When a test fails:

- Document exactly what you observed (include a screenshot reference) and what you expected.
- Use the `/ovid-vibe` skill to fix it. Ovid-vibe will write a failing test first (RED), then fix it
  (GREEN), then refactor — this is intentional, so that the bug cannot silently return.
- After the fix, re-run using **Minimum Regression Scope** (see below), not the full plan.
- If the same test fails **3 times** after attempted fixes, stop the fix loop. Report the failure
  clearly and ask the user how to proceed rather than continuing to spiral.

### Minimum Regression Scope

After a fix, you do not need to re-run the entire test plan. Instead:

1. **Re-run the failed test** — confirm the fix worked.
2. **Identify affected neighbours** — look at what the fix actually changed (files, functions,
   systems). Re-run only the test plan items that plausibly touch those same systems. For example,
   if a pirate combat fix touched `CombatResolver`, re-run combat and negotiation tests but not
   customs or mechanical failures.
3. **Flag deferred items** — if you cannot confidently rule out a side effect on a test you are
   skipping, mark it with ⚠️ DEFERRED in the final report so the user knows it needs a follow-up
   pass.

**Full re-run is only triggered if:**
- The fix touched a shared/central system (e.g. event dispatcher, game state manager, RNG seed),
  where side effects are genuinely unpredictable.
- You notice something visually unexpected during targeted re-testing that wasn't on your radar.

In those cases, announce that you are doing a full re-run and why, so the user can decide whether
to let it proceed or override.

## 6. Game Balancing

Activities often involve trade-offs. Players need to be able understand them or else they will be unsatisfied.

### A) Economic Sanity (always-on lens)
For any feature that moves money/items (missions, trading, repairs, fees):
- Capture **before/after**: cash, cargo (type/qty), and any mission terms shown.
- Compute **Net Δ** in the notes: cash change + value/qty changes that the UI clearly implies.

**Auto-FAIL** unless explicitly warned as a challenge/penalty:
- Player **pays** for cargo, cargo is **forcibly removed**, and success yields **net loss**.
- Surprise costs/clawbacks not disclosed at acceptance.

### B) Mandatory mission test plan items (when missions involved)
Include these in the Test Plan:
1. Accept mission: UI clearly shows **rewards**, **up-front cost (if any)**, and ideally **net profit** (or states uncertainty).
2. Complete mission (success path): post-completion **cash_after ≥ cash_before** (and matches advertised profit if shown).
3. Mission cargo handling is unambiguous: either **client-provided** or **player-owned + compensated**.

## 7. UAT Improvements

Read the @notes/uat.md file for notes on common issues in UAT testing slow you
down. If you find something that you think will make UAT better in the future,
feel free to add to that file.

## 8. Final Report

When all tests pass (or you have reached an escalation point), produce a summary:
```
UAT COMPLETE
============
Tested against: [brief description of intent]

✅ PASSED (n)
  1. ...

❌ FAILED / ESCALATED (n)
  1. ...

Fixes applied: [list of what ovid-vibe changed, or "none"]
```

If everything passed and fixes were applied, confirm that `make all` (or equivalent) is green before declaring success.
