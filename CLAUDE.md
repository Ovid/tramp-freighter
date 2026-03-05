# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Worktree Directory

Use `.worktrees/` (project-local, hidden) for all git worktrees.

## Project Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real star systems within 20 light-years of Sol, connected by wormhole networks. Core gameplay: commodity trading, ship resource management, NPC relationships, and danger encounters.

IMPORTANT: you must NEVER BE SYCOPHANTIC or a "yes man." You have to think about what's being asked and offer honest feedback. After that, if the user insists, assume there's a reason for and you go with it.

## Commands

```bash
npm run dev              # Vite dev server (port 5173, HMR)
npm run build            # Production build to dist/
npm test                 # Run all tests once (vitest --run)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8, HTML)
npm run lint             # ESLint check
npm run lint:fix         # ESLint autofix
npm run format:check     # Prettier check
npm run format:write     # Prettier format
npm run clean            # Lint + format all files
npm run all              # Clean + test

# Run a single test file
npm test -- tests/unit/game-trading.test.js

# Run tests matching a pattern
npm test -- --grep "Bridge Pattern"
```

**Important:** This project's npm version does NOT accept the `--run` argument. Use `npm test` not `npm test --run`.

## Architecture

### Bridge Pattern (Core Architectural Decision)

The app uses a **Bridge Pattern** to connect the imperative `GameStateManager` singleton to React's declarative model. This is the most important pattern to understand:

- **`GameContext`** (`src/context/GameContext.jsx`): Provides GameStateManager via React Context
- **`useGameEvent(eventName)`** (`src/hooks/useGameEvent.js`): Subscribes to state changes, triggers re-renders. Auto-unsubscribes on unmount.
- **`useGameAction()`** (`src/hooks/useGameAction.js`): Returns methods to trigger game actions (jump, buyGood, sellGood, refuel, etc.)

**Critical rule:** Components must NEVER call `GameStateManager.getState()` directly or duplicate game state in React state. All game state flows through the Bridge Pattern hooks.

### View Mode State Machine (App.jsx)

No router. App.jsx manages a view mode state machine:
```
TITLE → SHIP_NAMING → ORBIT ↔ STATION ↔ PANEL
                         ↕
                      ENCOUNTER
```

### Manager Delegation (GameStateManager)

The `GameStateManager` delegates to 15+ focused domain managers in `src/game/state/managers/`:
- `EventSystemManager`: Event pub/sub for Bridge Pattern
- `StateManager`: Core state access/mutations
- `TradingManager`, `ShipManager`, `NavigationManager`, `RefuelManager`, `RepairManager`, `DialogueManager`, `EventsManager`, `EventEngineManager`, `InfoBrokerManager`, `NPCManager`, `MissionManager`, `SaveLoadManager`, `InitializationManager`
- `DangerManager`: Danger zones, karma, faction reputation, encounter probability calculations
- `CombatManager`: Pirate combat resolution (evasive, return fire, dump cargo, distress call)
- `NegotiationManager`: Pirate negotiation resolution (counter-proposal, medicine, intel, surrender)
- `InspectionManager`: Customs inspection resolution (cooperate, bribe, flee)
- `DistressManager`: Civilian distress call encounters (respond, ignore, loot)
- `MechanicalFailureManager`: Ship system failure checks and repair options

Each manager extends `BaseManager` and receives the GameStateManager reference. Public API is maintained through delegation methods on GameStateManager.

**Save pattern:** Managers call `this.gameStateManager.markDirty()` after mutations (not `saveGame()` directly). SaveLoadManager debounces saves with a 500ms trailing timer.

**Encounter RNG:** Combat/encounter paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`). Do not use `Math.random()` in gameplay paths.

### Source Organization

```
src/
├── features/          # Feature modules (component + utils co-located)
│   ├── danger/        # Encounter system (pirates, inspections, distress calls)
│   ├── navigation/    # StarMapCanvas (Three.js), JumpDialog, SystemPanel
│   ├── trade/         # TradePanel + tradeUtils
│   ├── hud/           # HUD overlay components
│   ├── station/       # StationMenu, PanelContainer
│   └── [refuel|repair|upgrades|cargo|info-broker|ship-status|dialogue|title-screen|dev-admin|missions|narrative|system-info]/
├── components/        # Shared: Button, Modal, Card, ErrorBoundary
├── hooks/             # useGameEvent, useGameAction, useAnimationLock, useNotification, useDangerZone, useDialogue, useEncounterProbabilities, useEventTriggers, useJumpValidation, useStarData
├── context/           # GameContext, StarmapContext
└── game/
    ├── constants.js   # ALL game configuration values (prices, capacities, thresholds)
    ├── state/
    │   ├── game-state-manager.js  # Central singleton
    │   └── managers/              # 15+ domain managers
    ├── engine/        # Three.js: scene.js, stars.js, wormholes.js, interaction.js, game-animation.js
    ├── data/          # star-data.js (117 systems), wormhole-data.js, dialogue-trees.js, danger-events.js, narrative-events.js, npc-data.js
    └── utils/         # seeded-random.js, string-utils.js, star-visuals.js, dev-logger.js
```

Path aliases available: `@` → `src/`, `@components`, `@features`, `@hooks`, `@context`, `@game`, `@assets`

## Coding Standards

### Constants
**ALL magic numbers must go in `src/game/constants.js`.** Never hard-code numeric values in implementation files. This includes percentages, multipliers, ranges, thresholds, prices, distances, timeouts.

### Numeric Display
**Round at the calculation layer, not the display layer.** Utility functions must return integers — never raw floating-point values that will be displayed to the player.
- **Credits (costs):** `Math.ceil()` — always round up so the player never pays less than the true cost.
- **Percentages (conditions, capacities):** `Math.round()` — standard rounding for display clarity.
- Never interpolate a calculation result directly into JSX without ensuring the underlying function already rounds.

### Testing
- **Test types:** Unit (`tests/unit/`), property-based with fast-check (`tests/property/`), integration (`tests/integration/`)
- **TDD required:** RED (one failing test) → GREEN (minimal passing code) → REFACTOR. Never batch multiple failing tests.
- **Clean output:** Tests must produce no stderr warnings. Mock `console` methods when testing error conditions.
- **Property tests:** Minimum 100 iterations, tag with feature and property references.
- **All tasks must leave the full test suite passing.**

### React Patterns
- Functional components with hooks only
- Feature utility files contain pure functions for validation/calculations
- Three.js scenes initialize once in `useEffect` with empty deps; dispose on unmount
- Never create objects in hot loops (animation frames, frequent events)

### Accessibility (a11y)
Full a11y pass is planned. In the meantime, new and modified components should include basic accessibility: `aria-label` on icon-only buttons, semantic HTML elements, and keyboard-navigable interactive controls. Accessibility suggestions from code review are welcome and should be applied when low-effort.

### Git Commits
- Commit messages must be plain text strings passed directly to `git commit -m "plain text here"`. **NEVER** use shell interpolation (`$(...)`), heredocs (`<<EOF`, `<<'EOF'`), command substitution, or `$(cat ...)` wrappers in commit messages. This means **NO** `git commit -m "$(cat <<'EOF' ... EOF)"` — just a simple quoted string. Multi-line messages should use multiple `-m` flags: `git commit -m "subject" -m "body"`.

### Style
- ES Modules, 2-space indentation
- `const`/`let` only, never `var`
- Comments explain WHY, not WHAT. Never mention task numbers in comments.
- Import order: external libraries → internal modules → components → utilities → data/constants → styles

IMPORTANT: after reading this file, you MUST say "CLAUDE.md read and understood. Ready to assist with code tasks."
