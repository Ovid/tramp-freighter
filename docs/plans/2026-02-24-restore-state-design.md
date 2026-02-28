# restoreState() API Design

## Problem

Game state restoration from saves bypasses encapsulation. `main.jsx` calls a standalone `loadGame()` function that returns raw, unvalidated state, then assigns it directly: `gameStateManager.state = savedGame`. This skips version migration, structure validation, defaults, and UI event emission.

Meanwhile, `SaveLoadManager.loadGame()` does all of those steps internally but also directly assigns `this.gameStateManager.state = loadedState` — the coordinator doesn't own its own state lifecycle.

## Solution

Add a `restoreState(rawState)` method on `GameStateManager` that owns the full restore pipeline. Both `main.jsx` and `SaveLoadManager.loadGame()` use it as the single canonical path for state restoration.

## restoreState() Pipeline

```
rawState → version check → migrations → structure validation → defaults
         → this.state = validatedState → event engine registration → emit UI events
```

Returns `{ success: true, state }` or `{ success: false, reason: string }`.

## Changes by File

### game-state-manager.js

- Add `restoreState(rawState)` method:
  - Import validation/migration functions from `state-validators.js`
  - Version compatibility check → return failure if incompatible
  - Apply migration chain
  - Validate structure → return failure if invalid
  - Add defaults using `addStateDefaults(state, this.starData)`
  - Assign `this.state = validatedState`
  - Register event engine (narrative events, danger events, quests)
  - Emit all UI state events
- Extract `_registerEventEngine()` private method (shared by `restoreState()` and `initNewGame()`)
- Extract `_emitAllStateEvents(state)` private method (shared by both paths)
- Remove `loadGame()` import from `state-validators.js` functions (already available via SaveLoadManager, but now GSM imports them directly)

### managers/save-load.js

- `loadGame()` simplifies to: load from localStorage → call `this.gameStateManager.restoreState(rawState)` → handle NPC recovery on failure
- Delete `applyMigrations()` (moved to GSM)
- Delete `emitLoadedStateEvents()` (moved to GSM)
- NPC recovery calls `restoreState()` with wiped NPC data

### main.jsx

- Remove import of standalone `loadGame` from `save-load.js`
- Replace the `loadGame()` + bare assignment block with `gameStateManager.loadGame()` (which delegates to SaveLoadManager → restoreState())

### state-validators.js

No changes. All existing functions reused as-is.

### save-load.js (standalone)

No changes. Still provides raw localStorage I/O.

## What Doesn't Change

- All validation/migration logic in `state-validators.js`
- Standalone `save-load.js` raw I/O functions
- Event system, Bridge Pattern, all other managers
- `initNewGame()` still assigns `this.state = completeState` internally (GSM owning its own state is fine)
- External API surface (loadGame/saveGame/etc. still work the same from callers' perspective)

## Testing Strategy

- Unit test `restoreState()` with: valid current-version state, old-version state needing migration, invalid structure, missing fields needing defaults
- Verify SaveLoadManager.loadGame() delegates to restoreState()
- Verify NPC recovery path still works
- Existing test suite must continue passing
