# Development Guide - React Migration

## Overview

This guide documents the React migration of Tramp Freighter Blues from vanilla JavaScript to React 18+ using Vite as the build tool. The migration preserves all existing game logic while modernizing the UI layer with React's declarative component model.

## Running the Application

### React Version (Vite)

The React version uses Vite as the build tool and development server.

```bash
# Start the Vite dev server (React version)
npm run dev
```

The React application will be available at: http://localhost:5173/

Features:

- Hot Module Replacement (HMR) for instant updates
- Fast build times with Vite
- React 18+ with modern features
- Optimized development experience

### Vanilla JavaScript Version

The original vanilla JavaScript version is still available during the migration period.

```bash
# Start the vanilla version server
npm run dev:vanilla
```

The vanilla application will be available at: http://localhost:8080/starmap.html

### Running Both Versions Simultaneously

During the migration, you can run both versions at the same time for comparison and testing:

**Terminal 1 - React Version:**

```bash
npm run dev
```

Access at: http://localhost:5173/

**Terminal 2 - Vanilla Version:**

```bash
npm run dev:vanilla
```

Access at: http://localhost:8080/starmap.html

This allows you to:

- Compare behavior between versions
- Test feature parity
- Validate behavioral equivalence
- Debug migration issues

## Build Commands

### Development

```bash
npm run dev          # Start Vite dev server (React)
npm run dev:vanilla  # Start vanilla JS server
```

### Production

```bash
npm run build        # Build React app for production
npm run preview      # Preview production build locally
```

The production build outputs to the `dist/` directory with:

- Optimized and minified JavaScript bundles
- Minified CSS with unused styles removed
- Static assets with cache-busting hashes
- Source maps for debugging

### Testing

```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

Test output includes:

- Pass/fail status for all tests
- Coverage percentages by file
- Detailed error messages for failures
- Property-based test statistics

### Code Quality

```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
npm run format:check # Check code formatting
npm run format:write # Format code automatically
npm run clean        # Lint and format all code
npm run all          # Clean and test
```

## Port Configuration

- **React (Vite)**: Port 5173 (default Vite port)
- **Vanilla JS**: Port 8080 (http-server)

These ports are configured to avoid conflicts, allowing both servers to run simultaneously during the migration period.

## Directory Structure

The React migration introduces a new directory structure organized by feature and responsibility:

```
project-root/
├── index.html                    # Vite entry point (React)
├── starmap.html                  # Vanilla JS entry point (legacy)
├── vite.config.js               # Vite build configuration
├── vitest.config.js             # Vitest test configuration
├── package.json                 # Dependencies and scripts
│
├── src/                         # React application source
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Root component with view mode management
│   │
│   ├── assets/                  # Images and static resources
│   │
│   ├── components/              # Shared UI components
│   │   ├── Button.jsx           # Reusable button component
│   │   ├── Modal.jsx            # Modal dialog with React Portals
│   │   ├── Card.jsx             # Card container component
│   │   └── ErrorBoundary.jsx    # Error boundary for graceful failures
│   │
│   ├── context/                 # React Context providers
│   │   └── GameContext.jsx      # Provides GameStateManager to all components
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useGameEvent.js      # Subscribe to GameStateManager events
│   │   ├── useGameAction.js     # Trigger game actions
│   │   ├── useAnimationLock.js  # Animation state management
│   │   └── useNotification.js   # Notification system
│   │
│   ├── features/                # Feature modules (components + utilities)
│   │   ├── hud/                 # Heads-up display
│   │   │   ├── HUD.jsx
│   │   │   ├── ResourceBar.jsx
│   │   │   ├── DateDisplay.jsx
│   │   │   ├── ShipStatus.jsx
│   │   │   ├── QuickAccessButtons.jsx
│   │   │   └── hudUtils.js
│   │   │
│   │   ├── navigation/          # Starmap and navigation
│   │   │   ├── StarMapCanvas.jsx
│   │   │   ├── JumpDialog.jsx
│   │   │   ├── SystemPanel.jsx
│   │   │   └── CameraControls.jsx
│   │   │
│   │   ├── station/             # Station interface
│   │   │   ├── StationMenu.jsx
│   │   │   └── PanelContainer.jsx
│   │   │
│   │   ├── trade/               # Trading panel
│   │   │   ├── TradePanel.jsx
│   │   │   └── tradeUtils.js
│   │   │
│   │   ├── refuel/              # Refueling panel
│   │   │   ├── RefuelPanel.jsx
│   │   │   └── refuelUtils.js
│   │   │
│   │   ├── repair/              # Repair panel
│   │   │   ├── RepairPanel.jsx
│   │   │   └── repairUtils.js
│   │   │
│   │   ├── upgrades/            # Upgrades panel
│   │   │   ├── UpgradesPanel.jsx
│   │   │   └── upgradesUtils.js
│   │   │
│   │   ├── info-broker/         # Information broker panel
│   │   │   ├── InfoBrokerPanel.jsx
│   │   │   └── infoBrokerUtils.js
│   │   │
│   │   ├── cargo/               # Cargo manifest panel
│   │   │   ├── CargoManifestPanel.jsx
│   │   │   └── cargoUtils.js
│   │   │
│   │   ├── ship-status/         # Ship status panel
│   │   │   └── ShipStatusPanel.jsx
│   │   │
│   │   ├── title-screen/        # Title screen and ship naming
│   │   │   ├── TitleScreen.jsx
│   │   │   └── ShipNamingDialog.jsx
│   │   │
│   │   └── dev-admin/           # Development admin panel
│   │       └── DevAdminPanel.jsx
│   │
│   └── game/                    # Migrated game logic (preserved)
│       ├── constants.js         # Game configuration constants
│       ├── game-trading.js      # Trading calculations
│       ├── game-navigation.js   # Navigation mechanics
│       ├── game-events.js       # Event system
│       ├── game-information-broker.js
│       │
│       ├── state/               # State management
│       │   ├── game-state-manager.js  # Central state manager (singleton)
│       │   ├── save-load.js           # Save/load functionality
│       │   └── state-validators.js    # State validation
│       │
│       ├── engine/              # Rendering and animation
│       │   ├── game-animation.js      # Animation system
│       │   ├── scene.js               # Three.js scene setup
│       │   ├── stars.js               # Star rendering
│       │   ├── wormholes.js           # Wormhole rendering
│       │   └── interaction.js         # User interaction
│       │
│       ├── data/                # Static game data
│       │   ├── star-data.js           # Star system data
│       │   └── wormhole-data.js       # Wormhole connections
│       │
│       └── utils/               # Utility functions
│           ├── seeded-random.js       # Deterministic RNG
│           ├── string-utils.js        # String utilities
│           └── star-visuals.js        # Star visualization
│
├── css/                         # Stylesheets (preserved from vanilla)
│   ├── base.css                 # Global styles and resets
│   ├── hud.css                  # HUD overlay styles
│   ├── modals.css               # Modal dialog styles
│   ├── starmap-scene.css        # Starmap visualization
│   └── panel/                   # Panel-specific styles
│       ├── trade.css
│       ├── refuel.css
│       ├── repair.css
│       ├── upgrades.css
│       ├── info-broker.css
│       ├── cargo-manifest.css
│       ├── ship-status.css
│       └── dev-admin.css
│
├── tests/                       # Test suite (migrated to Vitest)
│   ├── unit/                    # Unit tests
│   ├── property/                # Property-based tests
│   ├── integration/             # Integration tests
│   ├── setup.js                 # Test setup
│   ├── react-test-utils.jsx     # React testing utilities
│   └── test-utils.js            # General test utilities
│
└── vendor/                      # Third-party libraries
    └── three/                   # Three.js library
```

### Directory Organization Principles

- **Feature-based organization**: Related components, hooks, and utilities are co-located in feature directories
- **Separation of concerns**: UI components (src/features/) are separate from game logic (src/game/)
- **Shared components**: Reusable UI components live in src/components/
- **Custom hooks**: React hooks for common patterns live in src/hooks/
- **Preserved game logic**: All game logic from vanilla version is preserved in src/game/

## Bridge Pattern Architecture

The React migration uses a **Bridge Pattern** to connect the imperative GameStateManager (single source of truth) to React's declarative component model. This ensures zero behavioral changes to game mechanics while enabling reactive UI updates.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    App Component                        │ │
│  │  - View Mode State (ORBIT/STATION/PANEL)              │ │
│  │  - Conditional Rendering Logic                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                   ▼            │
│  ┌──────────┐      ┌──────────┐       ┌──────────┐        │
│  │StarMapCanvas│    │   HUD    │       │ Panels   │        │
│  │(Three.js)│      │Components│       │Components│        │
│  └──────────┘      └──────────┘       └──────────┘        │
│         │                  │                   │            │
│         └──────────────────┼───────────────────┘            │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Bridge Pattern Layer                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ GameContext  │  │ useGameEvent │  │useGameAction │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              GameStateManager (Singleton)                    │
│  - Single Source of Truth                                   │
│  - Event Subscription System                                │
│  - Game Logic Methods                                       │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Trading    │   │  Navigation  │   │   Events     │
│   Logic      │   │    Logic     │   │   System     │
└──────────────┘   └──────────────┘   └──────────────┘
```

### Bridge Pattern Components

#### 1. GameContext

Provides the GameStateManager instance to all React components via React Context.

**Location**: `src/context/GameContext.jsx`

**Purpose**: Makes GameStateManager available throughout the component tree without prop drilling.

**Usage**:

```javascript
import { useGameState } from '../context/GameContext';

function MyComponent() {
  const gameStateManager = useGameState();
  // Access GameStateManager methods
}
```

#### 2. useGameEvent Hook

Subscribes to GameStateManager events and triggers React re-renders when events fire.

**Location**: `src/hooks/useGameEvent.js`

**Purpose**: Enables reactive UI updates based on game state changes.

**Usage**:

```javascript
import { useGameEvent } from '../hooks/useGameEvent';

function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');

  return (
    <div>
      <div>Credits: {credits}</div>
      <div>Fuel: {fuel}%</div>
    </div>
  );
}
```

**How it works**:

1. Component calls `useGameEvent('creditsChanged')`
2. Hook subscribes to GameStateManager's 'creditsChanged' event
3. When credits change, GameStateManager fires event
4. Hook updates local state, triggering React re-render
5. Component automatically unsubscribes on unmount

#### 3. useGameAction Hook

Provides methods to trigger game actions through GameStateManager.

**Location**: `src/hooks/useGameAction.js`

**Purpose**: Enables components to trigger game actions without direct GameStateManager access.

**Usage**:

```javascript
import { useGameAction } from '../hooks/useGameAction';

function RefuelButton() {
  const { refuel } = useGameAction();

  const handleRefuel = () => {
    refuel(50); // Refuel 50 units
  };

  return <button onClick={handleRefuel}>Refuel</button>;
}
```

**Available actions**:

- `jump(targetSystemId)` - Jump to another system
- `buyGood(goodType, quantity)` - Buy goods
- `sellGood(stackIndex, quantity)` - Sell goods
- `refuel(amount)` - Refuel ship
- `repair(component, amount)` - Repair ship component
- `purchaseUpgrade(upgradeId)` - Purchase upgrade
- `purchaseIntelligence(systemId, goodType)` - Buy intelligence
- `saveGame()` - Save game state
- `newGame()` - Start new game

### Bridge Pattern Benefits

1. **Single Source of Truth**: GameStateManager remains the only source of game state
2. **No State Duplication**: React components don't duplicate game state in local state
3. **Automatic Cleanup**: Subscriptions automatically cleaned up on component unmount
4. **Selective Re-rendering**: Only components subscribed to specific events re-render
5. **Preserved Game Logic**: All game logic remains unchanged in GameStateManager
6. **Testability**: Components can be tested with mock GameStateManager

### Example: Complete Component

```javascript
import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

function TradePanel({ onClose }) {
  // Local UI state (not game state)
  const [selectedGood, setSelectedGood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to game events
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');

  // Get action methods
  const { buyGood, sellGood } = useGameAction();

  // Get current state for calculations
  const state = gameStateManager.getState();
  const knownPrices = gameStateManager.getKnownPrices(
    state.player.currentSystem
  );

  const handleBuy = () => {
    buyGood(selectedGood, quantity);
    setQuantity(1); // Reset UI state
  };

  return (
    <div className="trade-panel">
      {/* UI rendering */}
      <button onClick={handleBuy}>Buy</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Migration Status

The React migration is in progress. The vanilla version remains functional and serves as the reference implementation for behavioral equivalence testing.

### Completed Phases

- ✅ **Phase 1: Foundation** - Vite scaffolding, Bridge Pattern, StarMapCanvas
- ✅ **Phase 2: Core UI** - All panels migrated to React components
- ✅ **Phase 3: Animation & Polish** - Animation integration, dev admin panel
- ✅ **Phase 4: Testing** - All tests migrated to Vitest

### Current Phase

**Phase 5: Documentation and Cleanup**

- Updating documentation
- Preparing for vanilla code removal
- Final QA and validation

### Next Steps

- Complete documentation updates
- Remove vanilla JavaScript version
- Final production build optimization
- Deploy React version

## Development Workflow

1. **Start Development Server**: `npm run dev`
2. **Make Changes**: Edit files in `src/`
3. **Hot Reload**: Changes appear instantly in browser (HMR)
4. **Run Tests**: `npm test` to verify changes
5. **Check Linting**: `npm run lint` to check code quality
6. **Commit**: Ensure tests pass and linting is clean before committing

### Best Practices

- **Use Bridge Pattern hooks**: Always use `useGameEvent` and `useGameAction` to interact with game state
- **Keep UI state local**: Only store UI-specific state in React state (slider values, form inputs)
- **Don't duplicate game state**: Never copy game state into React state
- **Clean up subscriptions**: useGameEvent handles cleanup automatically
- **Test behavioral equivalence**: Compare React behavior to vanilla version

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual functions and components in isolation
2. **Property-Based Tests**: Test universal properties with generated inputs using fast-check
3. **Integration Tests**: Test complete workflows across multiple components
4. **Behavioral Equivalence Tests**: Compare React vs Vanilla behavior to ensure identical game mechanics

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js

# Run tests matching pattern
npm test -- --grep "Bridge Pattern"
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage of utility functions and hooks
- **Property Tests**: All correctness properties from design document implemented
- **Integration Tests**: All major workflows covered (trade, refuel, navigation, etc.)
- **Behavioral Equivalence**: All game actions verified to produce identical results

### Writing Tests

#### Unit Test Example

```javascript
// src/features/trade/tradeUtils.test.js
import { describe, it, expect } from 'vitest';
import { validateTrade } from './tradeUtils';

describe('validateTrade', () => {
  it('should reject trades with insufficient credits', () => {
    const state = {
      player: { credits: 100 },
      ship: { cargo: [] },
    };

    const result = validateTrade('buy', 'electronics', 10, state);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient credits');
  });
});
```

#### Property-Based Test Example

```javascript
// tests/property/bridge-pattern.property.test.js
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react';
import { useGameEvent } from '../../src/hooks/useGameEvent';

/**
 * React Migration Spec, Property 9: Automatic unsubscription on unmount
 */
describe('Property: Automatic unsubscription on unmount', () => {
  it('should unsubscribe from all events when component unmounts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('creditsChanged', 'fuelChanged', 'cargoChanged'),
        (eventName) => {
          const mockGSM = createMockGameStateManager();
          const { unmount } = renderHook(() => useGameEvent(eventName), {
            wrapper: createWrapper(mockGSM),
          });

          const beforeCount = mockGSM.getSubscriptionCount(eventName);
          unmount();
          const afterCount = mockGSM.getSubscriptionCount(eventName);

          return afterCount === beforeCount - 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Troubleshooting

### Port Already in Use

If you see "Port 5173 is already in use":

```bash
# Find and kill the process using port 5173
lsof -ti:5173 | xargs kill -9
```

If you see "Port 8080 is already in use":

```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Module Not Found Errors

If you see module resolution errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite Cache Issues

If you experience strange build issues:

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### React DevTools Not Working

If React DevTools don't detect the app:

1. Ensure you're running the development build (`npm run dev`)
2. Check that React DevTools extension is installed
3. Refresh the page
4. Check browser console for errors

### Tests Failing After Changes

If tests fail after making changes:

1. Run tests in watch mode: `npm run test:watch`
2. Check test output for specific failures
3. Verify game logic hasn't changed unintentionally
4. Check that Bridge Pattern hooks are used correctly
5. Ensure subscriptions are cleaned up properly

### Three.js Scene Not Rendering

If the starmap doesn't appear:

1. Check browser console for WebGL errors
2. Verify StarMapCanvas component is mounted
3. Check that initScene is called only once
4. Verify Three.js resources are not disposed prematurely
5. Check that container ref is properly attached

## Performance Optimization

### React Rendering

- **React.memo**: Wrap expensive components to prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **useCallback**: Stabilize callback references for memoized components
- **React 18 Automatic Batching**: Multiple state updates are automatically batched

### Three.js Integration

- **Single Initialization**: Scene initialized once, never re-initialized
- **Animation Loop Outside React**: requestAnimationFrame runs outside React render cycle
- **Resource Cleanup**: All Three.js resources properly disposed on unmount
- **Ref-based DOM Access**: Use refs to access container, avoid querying DOM

### Bundle Size

- **Tree Shaking**: Unused code automatically eliminated in production build
- **Code Splitting**: Features split into separate chunks for lazy loading
- **CSS Optimization**: Unused CSS removed, styles minified
- **Asset Optimization**: Images and static assets optimized

## Resources

### Documentation

- [Vite Documentation](https://vitejs.dev/) - Build tool and dev server
- [React Documentation](https://react.dev/) - React framework
- [Vitest Documentation](https://vitest.dev/) - Testing framework
- [React Testing Library](https://testing-library.com/react) - Component testing
- [fast-check](https://fast-check.dev/) - Property-based testing
- [Three.js Documentation](https://threejs.org/docs/) - 3D rendering

### Migration Specification

For detailed migration requirements, design, and tasks, see:

- `.kiro/specs/react-migration/requirements.md` - Detailed requirements with acceptance criteria
- `.kiro/specs/react-migration/design.md` - Architecture and design decisions
- `.kiro/specs/react-migration/tasks.md` - Implementation task list

### Project Documentation

- `notes/tramp-freighter.md` - Complete product requirements
- `.kiro/steering/` - Development guidelines and standards
