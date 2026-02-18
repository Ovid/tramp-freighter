# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real star systems within 20 light-years of Sol, connected by wormhole networks. Core gameplay: commodity trading, ship resource management, NPC relationships, and danger encounters.

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

The `GameStateManager` delegates to 14+ focused domain managers in `src/game/state/managers/`:
- `EventSystemManager`: Event pub/sub for Bridge Pattern
- `StateManager`: Core state access/mutations
- `TradingManager`, `ShipManager`, `NavigationManager`, `RefuelManager`, `RepairManager`, `DialogueManager`, `EventsManager`, `InfoBrokerManager`, `DangerManager`, `NPCManager`, `SaveLoadManager`, `InitializationManager`

Each manager extends `BaseManager` and receives the GameStateManager reference. Public API is maintained through delegation methods on GameStateManager.

### Source Organization

```
src/
├── features/          # Feature modules (component + utils co-located)
│   ├── danger/        # Encounter system (pirates, inspections, distress calls)
│   ├── navigation/    # StarMapCanvas (Three.js), JumpDialog, SystemPanel
│   ├── trade/         # TradePanel + tradeUtils
│   ├── hud/           # HUD overlay components
│   ├── station/       # StationMenu, PanelContainer
│   └── [refuel|repair|upgrades|cargo|info-broker|ship-status|dialogue|title-screen|dev-admin]/
├── components/        # Shared: Button, Modal, Card, ErrorBoundary
├── hooks/             # useGameEvent, useGameAction, useAnimationLock, useNotification, etc.
├── context/           # GameContext, StarmapContext
└── game/
    ├── constants.js   # ALL game configuration values (prices, capacities, thresholds)
    ├── state/
    │   ├── game-state-manager.js  # Central singleton
    │   └── managers/              # 14+ domain managers
    ├── engine/        # Three.js: scene.js, stars.js, wormholes.js, interaction.js, game-animation.js
    ├── data/          # star-data.js (117 systems), wormhole-data.js, dialogue-trees.js
    └── utils/         # seeded-random.js, string-utils.js, star-visuals.js
```

Path aliases available: `@` → `src/`, `@components`, `@features`, `@hooks`, `@context`, `@game`, `@assets`

## Coding Standards

### Constants
**ALL magic numbers must go in `src/game/constants.js`.** Never hard-code numeric values in implementation files. This includes percentages, multipliers, ranges, thresholds, prices, distances, timeouts.

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

### Style
- ES Modules, 2-space indentation
- `const`/`let` only, never `var`
- Comments explain WHY, not WHAT. Never mention task numbers in comments.
- Import order: external libraries → internal modules → components → utilities → data/constants → styles
