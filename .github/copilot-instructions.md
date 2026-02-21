# GitHub Copilot Custom Instructions for Tramp Freighter Blues

This file provides comprehensive custom instructions for GitHub Copilot when working with the Tramp Freighter Blues codebase.

## Project Overview

**Tramp Freighter Blues** is a character-driven space trading survival game where players navigate financial pressure, NPC relationships, and ship character through a realistic starmap.

- **Genre**: Single-player space trading survival game
- **Platform**: Browser-based (React 18 + Three.js + Vite)
- **Setting**: 117 real star systems within 20 light-years of Sol, connected by wormholes
- **Goal**: Reach Delta Pavonis (27.88 LY from Sol) with 25,000 credits and "Trusted" reputation with Yuki Tanaka
- **Emphasis**: Financial pressure, NPC relationships, ship character/personality

## Technology Stack

- **React 18+**: Declarative UI with functional components and hooks (NO class components)
- **Three.js**: Hardware-accelerated 3D starmap visualization (WebGL)
- **Vite**: Fast build tooling with Hot Module Replacement (HMR)
- **Vitest**: Testing framework with fast-check for property-based testing
- **JavaScript ES Modules**: NO TypeScript - pure JavaScript with JSDoc comments
- **localStorage**: Browser-based persistence (NO server-side storage)

## Architecture Patterns

### Bridge Pattern (Critical)

The app uses a **Bridge Pattern** to connect the imperative `GameStateManager` singleton to React's declarative model:

- **GameContext** (`src/context/GameContext.jsx`): Provides GameStateManager via React Context
- **useGameEvent(eventName)** (`src/hooks/useGameEvent.js`): Subscribe to state changes, auto-cleanup on unmount
- **useGameAction()** (`src/hooks/useGameAction.js`): Trigger game actions (jump, buyGood, sellGood, refuel, etc.)

**CRITICAL RULE**: Components must **NEVER** call `GameStateManager.getState()` directly or duplicate game state in React state. All state flows through Bridge Pattern hooks.

### Event-Driven State Management

- **GameStateManager**: Single source of truth for all game state
- **Event System**: Components subscribe via `useGameEvent`, trigger changes via `useGameAction`
- **Manager Delegation**: GameStateManager delegates to specialized managers in `src/game/state/managers/`
- **Event Emission Convention**: Low-level mutation helpers (e.g., `updateHeat`, `clampHeat`) intentionally do NOT emit events. Orchestrating methods (e.g., `borrow`, `makePayment`) perform all mutations first, then emit a single event at the end. This prevents double-emissions and broadcasting stale intermediate state. Do not flag missing event emissions in helper methods as bugs.

### Feature-Based Organization

Code is organized by feature in `src/features/` directories, with related components, hooks, and utilities co-located.

## Directory Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Root component with view mode state machine
├── features/             # Feature modules (co-located components + utils)
│   ├── hud/              # HUD overlay components
│   ├── navigation/       # StarMapCanvas, JumpDialog, SystemPanel
│   ├── station/          # StationMenu, PanelContainer
│   ├── trade/            # TradePanel + trade utilities
│   ├── danger/           # Encounter system (pirates, inspections, distress)
│   ├── refuel/           # Refuel panel
│   ├── repair/           # Repair panel
│   ├── upgrades/         # Ship upgrades panel
│   ├── cargo/            # Cargo manifest panel
│   ├── info-broker/      # Intelligence trading panel
│   ├── ship-status/      # Ship condition display
│   ├── dialogue/         # Dialogue system
│   ├── title-screen/     # Title screen and ship naming
│   ├── dev-admin/        # Development admin panel
│   └── system-info/      # System information display
├── components/           # Shared UI components
│   ├── Button.jsx
│   ├── Modal.jsx
│   ├── Card.jsx
│   ├── ErrorBoundary.jsx
│   └── NotificationArea.jsx
├── context/              # React Context providers
│   ├── GameContext.jsx
│   └── StarmapContext.jsx
├── hooks/                # Custom React hooks
│   ├── useGameEvent.js
│   ├── useGameAction.js
│   ├── useAnimationLock.js
│   ├── useNotification.js
│   ├── useStarData.js
│   ├── useDialogue.js
│   ├── useDangerZone.js
│   ├── useEncounterProbabilities.js
│   ├── useJumpEncounters.js
│   └── useJumpValidation.js
└── game/                 # Game logic (separate from UI)
    ├── constants.js      # ALL game configuration values
    ├── state/
    │   ├── game-state-manager.js  # Central singleton
    │   └── managers/              # Domain-specific managers
    │       ├── base-manager.js
    │       ├── event-system.js
    │       ├── state.js
    │       ├── initialization.js
    │       ├── save-load.js
    │       ├── trading.js
    │       ├── navigation.js
    │       ├── npc.js
    │       ├── refuel.js
    │       ├── repair.js
    │       ├── ship.js
    │       ├── dialogue.js
    │       ├── events.js
    │       ├── info-broker.js
    │       └── danger.js
    ├── engine/           # Three.js scene management
    │   ├── scene.js
    │   ├── stars.js
    │   ├── wormholes.js
    │   ├── interaction.js
    │   └── game-animation.js
    ├── data/             # Static game data
    │   ├── star-data.js
    │   ├── wormhole-data.js
    │   ├── npc-data.js
    │   └── dialogue-trees.js
    └── utils/            # Pure utility functions
        ├── seeded-random.js
        ├── string-utils.js
        └── star-visuals.js

css/                      # Stylesheets (base, hud, panels, modals)
tests/                    # Vitest tests (unit, property, integration)
notes/                    # Specifications and documentation
```

## Code Organization Principles

1. **Feature Co-location**: Keep related components, hooks, and utils together in feature directories
2. **Pure Functions**: Separate validation/calculation logic from components
3. **No Manual DOM Manipulation**: Use React's declarative rendering only
4. **Manager Delegation**: GameStateManager coordinates specialized domain managers
5. **Event System**: Components subscribe to changes, don't poll state

## File Naming Conventions

- React components: `.jsx` extension (e.g., `TradePanel.jsx`)
- Utility functions: `.js` extension (e.g., `trading-utils.js`)
- Tests: `.test.js` or `.property.test.js` suffix
- Managers: `.js` in `src/game/state/managers/`
- Constants: Single `constants.js` file in `src/game/`

## React Component Pattern

All components should follow this pattern:

```javascript
import { useGameState } from '@context/GameContext.jsx';
import { useGameEvent } from '@hooks/useGameEvent.js';
import { useGameAction } from '@hooks/useGameAction.js';

/**
 * Example panel component using Bridge Pattern.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Close callback
 */
function TradePanel({ onClose }) {
  // Access GameStateManager via context (rarely needed directly)
  const gameStateManager = useGameState();
  
  // Subscribe to state changes via events
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');
  const currentSystem = useGameEvent('locationChanged');
  
  // Get action methods
  const { buyGood, sellGood } = useGameAction();
  
  // Component logic - NO manual DOM manipulation
  // All rendering is declarative with JSX
  
  return (
    <div className="trade-panel">
      {/* Declarative UI based on subscribed state */}
    </div>
  );
}

export default TradePanel;
```

## CSS Conventions

- **Semantic class names**: `.hud-section`, `.modal-overlay`, `.condition-bar`
- **Monospace font**: Courier New for game UI elements
- **Primary color**: `#00ff88` (cyan-green for active elements)
- **Dark backgrounds**: `rgba(0, 0, 0, 0.85)` for panels/overlays
- **CSS variables**: Use `--close-button-top` and similar for common values
- **No inline styles**: Prefer CSS classes over inline styles

## Testing Requirements

### Test Types

- **Unit tests**: Specific examples and edge cases in `tests/unit/`
- **Property-based tests**: Complex calculations and invariants in `tests/property/`
- **Integration tests**: Component interactions in `tests/integration/`

### Testing Standards

- **NO HTML in tests**: Tests should not create HTML elements directly
- **Clean output**: Tests must produce no stderr warnings
- **Floating-point precision**: Use epsilon tolerance for comparisons
- **Mock console**: Mock `console` methods when testing error conditions
- **Mock localStorage**: Use Vitest `vi.stubGlobal()` for localStorage
- **Property tests**: Minimum 100 iterations with fast-check

### Test-Driven Development

Follow RED/GREEN/REFACTOR cycle:

1. **RED**: Write ONE failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve while keeping tests green
4. Repeat (never batch multiple failing tests)

## Game Systems (Domain Knowledge)

### Core Mechanics

- **Fuel**: Max 100%, consumed by jumps, refuel at stations
- **Ship Condition**: Hull, engine, and life support degrade over time
- **Commodity Trading**: Prices vary by spectral class with daily fluctuations
- **Wormhole Network**: No FTL drives - systems connected by wormholes only
- **Financial Pressure**: Start with debt, recurring costs create meaningful decisions

### NPC Reputation System

7 reputation tiers (from worst to best):
1. Hostile
2. Cold
3. Neutral
4. Warm
5. Friendly
6. Trusted
7. Family

### Danger System

Random encounter types:
- **Pirates**: Combat or negotiation
- **Inspections**: Cargo checks
- **Distress Calls**: Rescue opportunities
- **Mechanical Failures**: Ship breakdowns

### Cargo Data Structure

Cargo stacks use this shape (ALWAYS):

```javascript
{
  good: 'grain',           // Commodity type
  qty: 10,                 // Quantity
  buyPrice: 12,            // Price paid per unit
  buySystem: 0,            // System ID where purchased
  buySystemName: 'Sol',    // System name where purchased
  buyDate: 42              // Game day when purchased
}
```

**NEVER** use alternate field names like `type`, `quantity`, or `purchasePrice`.

### Win Condition

- Reach **Delta Pavonis** system (27.88 LY from Sol)
- Accumulate **25,000 credits**
- Achieve **"Trusted"** reputation with **Yuki Tanaka** NPC

## Critical Implementation Details

### State Management

GameStateManager is the **single source of truth** with this state structure:

```javascript
{
  player: {
    credits: number,
    debt: number,
    currentSystem: number,
    daysElapsed: number,
    karma: number,
    factions: Object
  },
  ship: {
    name: string,
    fuel: number,
    hull: number,
    engine: number,
    lifeSupport: number,
    cargo: Array<CargoStack>,
    hiddenCargo: Array<CargoStack>,
    cargoCapacity: number,
    upgrades: Array<string>,
    quirks: Array<string>
  },
  world: {
    priceKnowledge: Object,
    activeEvents: Array,
    intelligence: Object
  },
  npcs: Object,
  dialogue: Object,
  meta: Object
}
```

### Manager Responsibilities

- **EventSystemManager**: Event pub/sub for Bridge Pattern
- **StateManager**: Core state access/mutations
- **InitializationManager**: Game initialization and new game setup
- **SaveLoadManager**: Save/load with debouncing, validation, migration
- **TradingManager**: Trading operations, market conditions, price knowledge
- **NavigationManager**: Location tracking, docking, jump operations
- **NPCManager**: NPC reputation, benefits, loans, cargo storage
- **RefuelManager**: Fuel pricing and refueling operations
- **RepairManager**: Ship repair operations and costs
- **ShipManager**: Ship condition, quirks, upgrades, cargo management
- **DialogueManager**: Dialogue state management
- **EventsManager**: Economic events and time advancement
- **InfoBrokerManager**: Intelligence trading system
- **DangerManager**: Encounter system (pirates, inspections, etc.)

### Event Types

Components can subscribe to these events via `useGameEvent()`:

- `creditsChanged`: Player's current credits (number)
- `debtChanged`: Player's current debt (number)
- `fuelChanged`: Ship fuel percentage 0-100 (number)
- `cargoChanged`: Ship cargo array with stacks (Array)
- `cargoCapacityChanged`: Ship cargo capacity in units (number)
- `hiddenCargoChanged`: Ship hidden cargo array (Array)
- `locationChanged`: Current system ID (number)
- `currentSystemChanged`: Current system ID (number)
- `timeChanged`: Days elapsed since game start (number)
- `priceKnowledgeChanged`: Price knowledge database (Object)
- `activeEventsChanged`: Active economic events (Array)
- `shipConditionChanged`: Hull/engine/life support (Object)
- `conditionWarning`: System degradation warnings (Array)
- `shipNameChanged`: Ship name (string)
- `upgradesChanged`: Installed upgrades (Array)
- `quirksChanged`: Ship quirks (Array)
- `dialogueChanged`: Dialogue state (Object)
- `encounterTriggered`: Danger encounter data (Object)
- `hullChanged`: Hull condition (number)
- `engineChanged`: Engine condition (number)
- `lifeSupportChanged`: Life support condition (number)
- `karmaChanged`: Player karma (number)
- `intelligenceChanged`: Intelligence data (Object)
- `factionRepChanged`: Faction reputation (Object)

### Numeric Display Standards

**Round at the calculation layer, NOT the display layer:**

- **Credits (costs)**: `Math.ceil()` - always round up so player never pays less than true cost
- **Percentages (conditions)**: `Math.round()` - standard rounding for display clarity
- **Display format**:
  - Percentages: Integer display (e.g., "87%")
  - Credits: Integer with `₡` symbol (e.g., "₡1,234")
  - Coordinates: `.toFixed(2)` after dividing by scale factor

### Common Pitfalls

1. **Zero is falsy**: Use `?? 100` NOT `|| 100` for condition checks (0% is valid)
2. **Cargo shape**: Always use `good/qty/buyPrice` NOT `type/quantity/purchasePrice`
3. **Event emissions**: Emit events on save-load for karma/faction state
4. **Floating-point**: Use epsilon tolerance for comparisons (not strict equality)
5. **State mutation**: Avoid shallow copies - use `.map()` and `.filter()` for new objects
6. **Nullish coalescing**: Prefer `??` over `||` to handle zero values correctly

### One-Shot Events Are Intentional

Some events emit a constant primitive (e.g., `pavonisRunTriggered` emits `true`) because they are **designed to fire exactly once**. The Pavonis run is an irreversible endgame finale — React's deduplication of identical primitive state is irrelevant because the event cannot and should not fire twice. Do NOT flag one-shot terminal events as bugs due to primitive payload deduplication.

## Development Workflow

### Commands

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

**Important**: This project does NOT accept `--run` argument. Use `npm test` not `npm test --run`.

### Best Practices

1. **Break down specs**: Smaller specifications are better
2. **Fix architecture first**: Don't let god objects grow - refactor early
3. **TDD approach**: Write tests before implementation
4. **Property tests**: Use for invariants and complex calculations
5. **Code review**: Follow ESLint config (rules-of-hooks, exhaustive-deps, no-unused-vars)

## Important Constants

From `src/game/constants.js`:

```javascript
// System IDs
SOL_SYSTEM_ID = 0
ALPHA_CENTAURI_SYSTEM_ID = 1

// New game defaults
NEW_GAME_DEFAULTS.STARTING_CREDITS = 500
NEW_GAME_DEFAULTS.STARTING_DEBT = 10000
NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY = 50

// Ship configuration
SHIP_CONFIG.CONDITION_BOUNDS.MAX = 100
SHIP_CONFIG.DEFAULT_NAME = 'Serendipity'

// Commodity types
COMMODITY_TYPES = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics']

// Save/load
SAVE_DEBOUNCE_MS = 1000

// Repair costs
REPAIR_CONFIG.COST_PER_PERCENT = 5
REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD = 20
```

**CRITICAL**: ALL magic numbers must be defined in `src/game/constants.js`. Never hard-code numeric values in implementation files.

## Current Development State

- **Latest work**: Danger system (pirates, inspections, mechanical failures)
- **Completed**: Core trading loop, navigation, ship systems, NPC foundation
- **Active**: Danger system polish, encounter routing, cargo field consistency
- **Next planned**: Missions & events system expansion

## Key Documentation Files

- `DEVELOPMENT.md`: Full development guide (architecture, patterns, migration notes)
- `CLAUDE.md`: Claude AI coding instructions (architecture, standards, patterns)
- `AGENTS.md`: Agent-specific guidelines (TDD, testing, game architecture)
- `.kiro/steering/`: Tech stack, product overview, structure, UX patterns
- `notes/`: Game design specs and breakdown

## Interaction Preferences

### When Suggesting Code

1. **Follow Bridge Pattern**: Don't bypass GameStateManager
2. **Use custom hooks**: Leverage `useGameEvent`/`useGameAction`
3. **Avoid manual DOM**: React declarative rendering only
4. **Consider floating-point**: Use epsilon for comparisons
5. **Co-locate features**: Keep related code together
6. **Pure functions**: Extract validation/calculation logic from components
7. **Nullish coalescing**: Use `??` for zero values (not `||`)
8. **Consistent cargo shape**: Always `good/qty/buyPrice/buySystem/buySystemName/buyDate`

### When Debugging

1. Check known issues in recent commit messages
2. Review manager methods, not just GameStateManager
3. Consider event emission timing (especially for save-load)
4. Verify subscription cleanup in `useEffect` hooks
5. Check for 0-value handling (use `??` not `||`)

### When Refactoring

1. Extract god objects into specialized managers
2. Separate pure functions from components
3. Add property tests for invariants
4. Follow TDD: test → implement → refactor
5. Maintain backward compatibility for save files

## Path Aliases

Available import aliases in Vite config:

- `@` → `src/`
- `@components` → `src/components/`
- `@features` → `src/features/`
- `@hooks` → `src/hooks/`
- `@context` → `src/context/`
- `@game` → `src/game/`
- `@assets` → `src/assets/`

Use these consistently instead of relative paths.

## React-Specific Guidelines

### View Mode State Machine

`App.jsx` manages view modes (no router):

```
TITLE → SHIP_NAMING → ORBIT ↔ STATION ↔ PANEL
                         ↕
                      ENCOUNTER
```

### Component Guidelines

- **Functional components only**: No class components
- **Hooks**: Use React hooks for state and effects
- **useEffect cleanup**: Always clean up subscriptions, timers, Three.js resources
- **No object creation in loops**: Cache objects in `useRef` or `useState`
- **Three.js initialization**: Once in `useEffect` with empty deps `[]`
- **Accessibility**: Full a11y pass is planned. New/modified components should include basic a11y: `aria-label` on icon-only buttons, semantic HTML, and keyboard-navigable controls

### Import Order

Follow this import order consistently:

1. External libraries (React, Three.js, etc.)
2. Internal modules (managers, utilities)
3. Components (local and shared)
4. Utilities and helpers
5. Data and constants
6. Styles (CSS imports)

Example:

```javascript
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameState } from '@context/GameContext.jsx';
import { useGameEvent } from '@hooks/useGameEvent.js';
import Button from '@components/Button.jsx';
import { formatCredits } from '@game/utils/string-utils.js';
import { COMMODITY_TYPES } from '@game/constants.js';
import './TradePanel.css';
```

---

## Summary

This codebase prioritizes:

- **Clean architecture** through Bridge Pattern and manager delegation
- **Correctness** through property-based testing and TDD
- **Maintainability** through feature co-location and pure functions
- **Consistency** through centralized constants and naming conventions
- **Performance** through React best practices and Three.js optimization

When in doubt, refer to existing patterns in `DEVELOPMENT.md`, `CLAUDE.md`, and `AGENTS.md`.
