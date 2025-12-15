---
inclusion: always
---

# Technology Stack

## Core Framework

- **React 18+**: UI framework for declarative component-based interface
- **Three.js**: 3D rendering framework for hardware-accelerated graphics (starmap)
- **Vite**: Build tool and development server for fast development and optimized production builds
- **Vitest**: Testing framework for unit, property-based, and integration tests
- **JavaScript (ES Modules)**: Primary development language using modern module syntax
- **localStorage**: Browser-based persistence for save games (REQUIRED - all game state must be stored in browser localStorage, no server-side storage)

## Architecture

- Client-side application (no backend required)
- React-based declarative UI with component architecture
- Hardware-accelerated 3D rendering via WebGL (starmap)
- Event-driven game state management via GameStateManager singleton
- Bridge Pattern connecting imperative GameStateManager to React's declarative model
- Feature-based code organization with clear separation of concerns
- Custom hooks for game state subscription and actions

### React Component Architecture

The application uses React components with a Bridge Pattern to connect to game logic:

**Bridge Pattern**:

- **GameContext**: Provides GameStateManager instance to all components via React Context
- **useGameEvent**: Custom hook for subscribing to GameStateManager events and triggering re-renders
- **useGameAction**: Custom hook for triggering game actions through GameStateManager methods
- Ensures GameStateManager remains single source of truth
- Automatic cleanup of subscriptions on component unmount

**Component Structure**:

- **Feature Modules**: Related components, hooks, and utilities co-located in feature directories
- **Shared Components**: Reusable UI components (Button, Modal, Card, ErrorBoundary)
- **Panel Components**: React components for each UI panel (Trade, Refuel, Repair, etc.)
- **Utility Functions**: Pure functions for validation and calculations, separated from components

**Example Component Structure**:

```javascript
// Panel component using Bridge Pattern
function TradePanel({ onClose }) {
  const gameStateManager = useGameState();
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');
  const { buyGood, sellGood } = useGameAction();

  // Component logic using hooks
  // Declarative rendering
}
```

**Benefits**:

- Declarative UI updates through React's rendering model
- No manual DOM manipulation
- Improved testability with React Testing Library
- Clear data flow from GameStateManager to components
- Automatic re-rendering on state changes

### Module Organization

Code is organized by feature and responsibility in the `src/` directory:

**Features** (`src/features/`):

- Feature-based organization with related components, hooks, and utilities co-located
- Each feature directory contains: components (.jsx), utility functions (.js), and feature-specific hooks
- Examples: hud/, navigation/, station/, trade/, refuel/, repair/, upgrades/, info-broker/, cargo/, ship-status/

**Components** (`src/components/`):

- Shared UI components used across features
- Button, Modal, Card, ErrorBoundary

**Context** (`src/context/`):

- React Context providers
- GameContext provides GameStateManager instance to all components

**Hooks** (`src/hooks/`):

- Custom React hooks for common patterns
- useGameEvent, useGameAction, useAnimationLock, useNotification

**Game** (`src/game/`):

- Game logic and state management
- Subdirectories: state/, engine/, data/, utils/
- Game constants, trading logic, navigation logic, events system

**Assets** (`src/assets/`):

- Images and static resources

**Entry Points**:

- `src/main.jsx`: Application entry point, initializes GameStateManager, imports global CSS
- `src/App.jsx`: Root component, manages view mode state, conditional rendering

**Starmap Integration**:

The Three.js starmap is wrapped in a React component:

- `StarMapCanvas.jsx`: React component that initializes Three.js scene once on mount
- Uses refs to access DOM container
- Calls existing `initScene` from `src/game/engine/scene.js`
- Properly disposes resources on unmount

## Key Technical Components

### Game Constants (Centralized Data)

- `game-constants.js` - Single source of truth for all static game data
- Commodity base prices and spectral modifiers
- Spectral class color mappings for visualization
- Game version and localStorage keys
- Prevents duplication and ensures consistency across modules
- All modules import from this file rather than defining constants locally

**CRITICAL RULE: ALL numeric constants, configuration values, and magic numbers MUST be defined in `game-constants.js`**

- Never hard-code numeric values directly in implementation files
- If you find yourself typing a number that isn't 0, 1, or an obvious array index, it belongs in game-constants.js
- This includes: percentages, multipliers, ranges, thresholds, prices, distances, timeouts, etc.
- Export constants with descriptive names and documentation explaining their purpose
- Import constants from game-constants.js in implementation files
- This ensures all tunable values are in one place and prevents inconsistencies

### Starmap (Implemented)

- Three.js scene management
- Camera controls (orbit, pan, zoom/dolly)
- Material system for visual effects (glow, volumetric fog)
- Sprite-based star rendering
- Dynamic label system with distance-based scaling
- EdgesGeometry for wireframe boundaries
- Modular architecture with coordinator pattern

### Game Systems (Implemented)

- Game state management (player, ship, world)
- Trading system with price calculation and cargo management
- Navigation system with fuel/distance calculations
- Economic events system with trigger conditions and effects
- Information broker with intelligence trading
- Save/load manager with versioning and auto-save
- UI overlay system with panel controllers (HUD, station interface, panels)
- Animation system with input locking
- Ship condition and degradation system

## Data Structures

### Star Systems (Existing)

- `id`: integer identifier
- `x, y, z`: coordinates (light years × 10 scale)
- `name`: string
- `type`: spectral class string
- `wh`: wormhole count
- `st`: station count
- `r`: reachable boolean (1=true, 0=false)

Wormhole connections stored as array of ID pairs.

### Game State (To Be Implemented)

```javascript
{
  player: { credits, debt, currentSystem, daysElapsed },
  ship: { name, fuel, hull, engine, lifeSupport, cargo, upgrades, quirks },
  world: { visitedSystems, priceSnapshots, activeEvents, flags },
  npcs: { [npcId]: { rep, lastInteraction, flags, questState } },
  missions: { active, completed, failed }
}
```

## File Organization

### Current Structure

**React Application** (`src/`):

**Features** (`src/features/`):

- Feature-based organization with components, hooks, and utilities co-located
- `hud/` - HUD components (ResourceBar, DateDisplay, ShipStatus, QuickAccessButtons)
- `navigation/` - Starmap and navigation (StarMapCanvas, JumpDialog, SystemPanel, CameraControls)
- `station/` - Station interface (StationMenu, PanelContainer)
- `trade/` - Trading panel (TradePanel, tradeUtils)
- `refuel/` - Refueling panel (RefuelPanel, refuelUtils)
- `repair/` - Repair panel (RepairPanel, repairUtils)
- `upgrades/` - Upgrades panel (UpgradesPanel, upgradesUtils)
- `info-broker/` - Information broker panel (InfoBrokerPanel, infoBrokerUtils)
- `cargo/` - Cargo manifest panel (CargoManifestPanel, cargoUtils)
- `ship-status/` - Ship status panel (ShipStatusPanel)
- `title-screen/` - Title screen and ship naming (TitleScreen, ShipNamingDialog)
- `dev-admin/` - Development admin panel (DevAdminPanel)

**Components** (`src/components/`):

- Shared UI components used across features
- `Button.jsx` - Reusable button component
- `Modal.jsx` - Modal dialog with React Portals
- `Card.jsx` - Card container component
- `ErrorBoundary.jsx` - Error boundary for graceful failures

**Context** (`src/context/`):

- React Context providers
- `GameContext.jsx` - Provides GameStateManager to all components

**Hooks** (`src/hooks/`):

- Custom React hooks for common patterns
- `useGameEvent.js` - Subscribe to GameStateManager events
- `useGameAction.js` - Trigger game actions
- `useAnimationLock.js` - Animation state management
- `useNotification.js` - Notification system

**Game Logic** (`src/game/`):

- Core game logic and mechanics
- `constants.js` - Game configuration constants
- `game-trading.js` - Trading calculations
- `game-navigation.js` - Navigation mechanics
- `game-events.js` - Event system
- `game-information-broker.js` - Information broker logic

**State Management** (`src/game/state/`):

- `game-state-manager.js` - Central state manager (singleton)
- `save-load.js` - Save/load functionality
- `state-validators.js` - State validation

**Rendering Engine** (`src/game/engine/`):

- Three.js-based rendering and animation
- `game-animation.js` - Animation system
- `scene.js` - Three.js scene setup
- `stars.js` - Star rendering
- `wormholes.js` - Wormhole rendering
- `interaction.js` - User interaction

**Data** (`src/game/data/`):

- Static game data
- `star-data.js` - Star system data
- `wormhole-data.js` - Wormhole connections

**Utils** (`src/game/utils/`):

- Utility functions
- `seeded-random.js` - Deterministic RNG
- `string-utils.js` - String utilities
- `star-visuals.js` - Star visualization

**Stylesheets** (`css/`):

- `base.css` - Global styles and resets
- `hud.css` - HUD overlay styles
- `panel/` - Panel-specific styles (trade, refuel, repair, upgrades, info-broker, cargo-manifest, ship-status)
- `modals.css` - Modal dialog styles
- `starmap-scene.css` - Starmap visualization styles

**Entry Point**:

- `index.html` - React application entry point (served by Vite)
- `src/main.jsx` - Application initialization
- `src/App.jsx` - Root component with view mode management

### Future Phases

- NPC and relationship system
- Tactical combat choices
- Data-driven event and dialogue content

## Performance Targets

- Initial load time: < 4 seconds (including starmap)
- Save/load time: < 500ms
- UI response time: < 100ms
- Memory footprint: < 100MB
- localStorage usage: < 500KB

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **React 18+** - UI framework for declarative components
- **ReactDOM 18+** - React rendering for web
- **Three.js** - 3D rendering library (installed via npm)
- **Vite** - Build tool and development server
- **Vitest** - Testing framework
- **@testing-library/react** - React component testing utilities
- **fast-check** - Property-based testing library
- **jsdom** - DOM environment for tests

## Import Paths

When importing modules, use the correct paths based on the React/Vite directory structure:

```javascript
// React components
import { TradePanel } from './features/trade/TradePanel';
import { Button } from './components/Button';

// Hooks
import { useGameEvent } from './hooks/useGameEvent';
import { useGameAction } from './hooks/useGameAction';

// Context
import { useGameState } from './context/GameContext';

// Game logic
import { GameStateManager } from './game/state/game-state-manager';
import { SHIP_CONFIG, ECONOMY_CONFIG } from './game/constants';

// Data
import { STAR_DATA } from './game/data/star-data';
import { WORMHOLE_DATA } from './game/data/wormhole-data';

// Utils
import { SeededRandom } from './game/utils/seeded-random';

// External libraries
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// CSS (in main.jsx or component files)
import '../css/base.css';
import styles from './Component.module.css'; // CSS modules
```

## Comments and Documentation

- If comments are used, they MUST explain WHY the code behaves the way it does, not just what it does.
- Comments MUST not be used to describe the code's structure unless the structure is unclear.
- All public functions or data must have documentation or comments
- NEVER MENTION TASK NUMBERS IN COMMENTS!
