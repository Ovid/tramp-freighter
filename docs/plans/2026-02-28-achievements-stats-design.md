# Achievements & Stats System Design

## Overview

Add an Achievements & Stats panel accessible from the gear menu. Achievements are checked continuously during gameplay with toast notifications on unlock. A modal overlay displays stats (including previously hidden faction reputation) and achievement progress with `<current>/<target>` format.

## Data & Constants

### Achievement Definitions

New file: `src/game/data/achievements-data.js`

Each achievement has:
- `id` — unique string identifier
- `name` — display name
- `description` — flavor text
- `category` — one of: Exploration, Trading, Social, Survival, Danger, Moral
- `tier` — 1 through 4
- `target` — imported from `constants.js`, never a magic number
- `statPath` — dot-notation path into game state for current value (e.g., `"world.visitedSystems.length"`, `"stats.creditsEarned"`)

### Constants (`constants.js`)

All 24 achievement tier thresholds. Example structure:

```
ACHIEVEMENT_EXPLORATION_TIER_1: 5
ACHIEVEMENT_EXPLORATION_TIER_2: 15
ACHIEVEMENT_EXPLORATION_TIER_3: 30
ACHIEVEMENT_EXPLORATION_TIER_4: 48  // 47 wormhole-reachable + Delta Pavonis (quest)
```

Also includes:
- Karma label thresholds and names
- Faction standing label thresholds and names
- Toast display duration

### Categories & Tiers (24 achievements total)

**Exploration** — Systems visited (`world.visitedSystems.length`), target max: 48

**Trading** — Credits earned (`stats.creditsEarned`)

**Social** — NPC reputation milestones (count of NPCs at/above tier thresholds)

**Survival** — Jumps completed (`stats.jumpsCompleted`)

**Danger** — Danger encounters resolved (sum of `world.dangerFlags` counters)

**Moral** — Karma thresholds (`player.karma`)

4 tiers per category. Exact threshold values to be determined during implementation based on typical gameplay ranges.

## Achievement Evaluation & Notifications

### AchievementsManager

New manager extending `BaseManager` in `src/game/state/managers/`.

- Subscribes to relevant game events: `jumpCompleted`, `tradingComplete`, `encounterResolved`, `karmaChanged`, `npcRepChanged`, etc.
- On event, evaluates only achievements in the relevant category (not all 24)
- Already-unlocked achievements are skipped
- On unlock: records in `gameState.achievements`, calls `markDirty()`, emits `achievementUnlocked` event

### Game State

```javascript
gameState.achievements = {
  [achievementId]: {
    unlocked: true,
    unlockedOnDay: number
  }
}
```

Persisted via existing save system.

### Toast Notification

HUD picks up `achievementUnlocked` via `useGameEvent` and shows a toast notification.

### Key Rule

Achievements can only be unlocked, never re-locked.

## Stats Display

Top section of the modal, read-only from existing game state. Three groups:

### Reputation & Standing
- Karma — numeric value + descriptive label (e.g., "Virtuous", "Neutral", "Ruthless")
- Faction standings — Authorities, Traders, Outlaws, Civilians — numeric + label

### Gameplay Counters
- Systems visited (`<current>/48`)
- Jumps completed
- Days survived
- Credits earned
- Cargo hauled
- Charitable acts

### Danger History
- Pirates fought / negotiated
- Inspections passed / bribed / fled
- Civilians saved / looted

No new tracking needed — all values from existing game state. Karma and faction label thresholds defined in `constants.js`.

## UI Components & Integration

### Gear Menu

Add "Achievements" button to `CameraControls.jsx`, positioned after the GitHub link. Opens the modal.

### New Components

- `src/features/achievements/AchievementsModal.jsx` — Modal container with Stats (top) and Achievements (bottom) sections
- `src/features/achievements/StatsSection.jsx` — Renders the three stats groups
- `src/features/achievements/AchievementsList.jsx` — Renders achievements grouped by category with name, description, progress bar (`<current>/<target>`), visual indicator when complete
- `src/features/achievements/AchievementToast.jsx` — Notification on unlock

### Styling

New `css/achievements.css`:
- ID-based selectors following existing patterns
- CSS variables from `variables.css`
- `--z-modal` for overlay

### State Flow

All data flows through the Bridge Pattern:
- `useGameEvent('achievementsChanged')` drives the modal
- `useGameEvent('achievementUnlocked')` drives the toast
- No direct `GameStateManager.getState()` calls

## Dead Code Cleanup

Remove `smugglingRuns`:
- Delete initialization from state setup
- Remove any references in epilogue conditions
- Clean removal, no replacement

## Test Coverage

### Unit Tests
- `AchievementsManager` evaluation logic
- Unlock tracking and idempotency (unlocking twice is a no-op)
- Every achievement target validated against game data:
  - Wormhole graph reachability from Sol (must equal 47)
  - Exploration tier 4 target === 47 + 1 (Delta Pavonis)
  - NPC count matches social achievement max
  - etc.
- Every `statPath` resolves to a valid field in game state
- Karma and faction label mappings

### Integration Tests
- Simulate game event sequence, verify correct achievements unlock

## Not In Scope

- Smuggling mechanic implementation
- Multiple achievement tracks per category
- Achievement icons/badges
