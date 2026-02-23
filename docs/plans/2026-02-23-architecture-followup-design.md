# Architecture Follow-Up: Event Constants, Dialogue Decoupling, Pure Calculators

**Date:** 2026-02-23
**Scope:** Items 1A, 2A, 2B from `architecture-followup.md`
**Branch:** `ovid/architecture-fixes-next-steps`

---

## 1A. Event Name Constants

Add a frozen `EVENT_NAMES` constant object to `src/game/constants.js` containing all ~33 event names currently hardcoded as string literals across the codebase.

**Changes:**
- Add `EVENT_NAMES` to `constants.js` mapping UPPER_SNAKE keys to camelCase string values
- Replace ~94 `emit()` string literals across 15 manager files with constant references
- Replace ~4 `subscribe()` string literals in hooks with constant references
- Build `EventSystemManager.subscribers` registry from `EVENT_NAMES` values instead of hardcoded strings
- Add dev-mode validation in `EventSystemManager.emit()`: warn if event name is not in `EVENT_NAMES`

**Files:** `constants.js`, `event-system.js`, all managers with `this.emit()`, `useGameEvent.js`, `useEventTriggers.js`, `DevAdminPanel.jsx`

---

## 2A. Dialogue Data Decoupling

Change dialogue function signatures from `(rep, gameStateManager, npcId)` to `(rep, context)` where `context` is a flat plain object built by `DialogueManager`.

**Context object:** Built once per dialogue interaction in `DialogueManager.startDialogue()` and `selectDialogueChoice()`. Contains all values that dialogue files currently extract from `gameStateManager` (karma, heat, canGetTip, credits, cargo, etc.). Exact properties determined by auditing all 7 dialogue files.

**Result:** Dialogue data files become pure functions testable with a plain object. No singleton dependency in data files. `DialogueManager` is the sole bridge between game state and dialogue data.

**Files:** 7 NPC dialogue files in `src/game/data/dialogue/`, `dialogue.js` manager, shared helpers like `faction-karma-conditions.js` if applicable

---

## 2B. Extract Pure Calculators

Extract pure calculation logic from manager methods into standalone functions in a new `src/game/utils/calculators.js`. Each function takes state as input and returns a changeset.

**Extractions:**

1. **`calculateTimeEffects(state, newDays)`** from `EventsManager.updateTime()` (9 responsibilities). Returns a changeset describing: stale price knowledge, intelligence cleanup, market recovery, economic event changes, loan defaults, Cole debt updates, mission deadline changes.

2. **`calculateDockPrices(system, commodityTypes, economicEvents)`** from `NavigationManager.dock()`. Pure price calculation loop. Returns a price map. Same extraction applies to `updateLocation()` snapshot pricing.

3. **`checkMissionDeadlines(missions, currentDay)`** from mission deadline checking in `updateTime()`. Returns which missions have expired or changed status.

**Pattern:** Manager methods become thin orchestrators: calculate changeset, apply mutations, emit events.

**Testing:** Unit tests for each pure function. Property-based tests where appropriate (prices always positive integers, deadlines monotonic).

**Files:** New `src/game/utils/calculators.js`, `events.js`, `navigation.js`, `mission.js`. New test file `tests/unit/calculators.test.js`.

---

## Execution

Items 1A, 2A, and 2B are independent and can be implemented in parallel. Each gets its own TDD cycle. Full test suite must pass after each item.
