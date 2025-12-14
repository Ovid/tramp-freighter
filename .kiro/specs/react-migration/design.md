# Design Document

## Overview

This design document specifies the architecture for migrating the Tramp Freighter Blues UI layer from Vanilla JavaScript to React 18+, while preserving all existing game logic, state management, and Three.js rendering. The migration uses a Bridge Pattern to connect the imperative GameStateManager to React's declarative component model, ensuring zero behavioral changes to game mechanics while improving UI maintainability.

The migration will be executed incrementally using Vite as the build tool and Vitest for testing. The existing vanilla JavaScript version will remain functional during development, allowing for parallel testing and validation.

## Architecture

### High-Level Architecture

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

### Bridge Pattern Design

The Bridge Pattern connects the imperative GameStateManager to React's declarative model:

1. **GameContext**: Provides GameStateManager instance to all components
2. **useGameEvent**: Custom hook for subscribing to GameStateManager events
3. **useGameAction**: Custom hook for triggering game actions

This pattern ensures:
- GameStateManager remains the single source of truth
- React components reactively respond to state changes
- No state duplication in React Context or Redux
- Automatic cleanup of subscriptions on unmount

### Directory Structure

```
project-root/
├── index.html                    # Vite entry point
├── vite.config.js               # Vite configuration
├── vitest.config.js             # Vitest configuration
├── package.json                 # Dependencies
├── src/
│   ├── main.jsx                 # Application entry, GameStateManager init
│   ├── App.jsx                  # Root component, view mode management
│   ├── assets/                  # Images and static resources
│   ├── components/              # Shared UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   └── ErrorBoundary.jsx
│   ├── context/                 # React Context providers
│   │   └── GameContext.jsx      # GameStateManager provider
│   ├── hooks/                   # Custom React hooks
│   │   ├── useGameEvent.js      # Subscribe to GameStateManager events
│   │   ├── useGameAction.js     # Trigger game actions
│   │   ├── useAnimationLock.js  # Animation state management
│   │   └── useNotification.js   # Notification system
│   ├── features/                # Feature modules
│   │   ├── hud/
│   │   │   ├── HUD.jsx
│   │   │   ├── ResourceBar.jsx
│   │   │   ├── DateDisplay.jsx
│   │   │   ├── ShipStatus.jsx
│   │   │   └── QuickAccessButtons.jsx
│   │   ├── navigation/
│   │   │   ├── StarMapCanvas.jsx
│   │   │   └── navigationUtils.js
│   │   ├── station/
│   │   │   ├── StationMenu.jsx
│   │   │   └── PanelContainer.jsx
│   │   ├── trade/
│   │   │   ├── TradePanel.jsx
│   │   │   └── tradeUtils.js
│   │   ├── refuel/
│   │   │   ├── RefuelPanel.jsx
│   │   │   └── refuelUtils.js
│   │   ├── repair/
│   │   │   ├── RepairPanel.jsx
│   │   │   └── repairUtils.js
│   │   ├── upgrades/
│   │   │   ├── UpgradesPanel.jsx
│   │   │   └── upgradesUtils.js
│   │   ├── info-broker/
│   │   │   ├── InfoBrokerPanel.jsx
│   │   │   └── infoBrokerUtils.js
│   │   ├── cargo/
│   │   │   ├── CargoManifestPanel.jsx
│   │   │   └── cargoUtils.js
│   │   ├── ship-status/
│   │   │   └── ShipStatusPanel.jsx
│   │   └── dev-admin/
│   │       └── DevAdminPanel.jsx
│   └── game/                    # Migrated game logic
│       ├── constants.js         # From game-constants.js
│       ├── game-trading.js      # Trading calculations
│       ├── game-navigation.js   # Navigation calculations
│       ├── game-events.js       # Event system
│       ├── game-information-broker.js
│       ├── state/
│       │   ├── game-state-manager.js
│       │   ├── save-load.js
│       │   └── state-validators.js
│       ├── engine/
│       │   ├── game-animation.js
│       │   └── scene.js
│       ├── data/
│       │   ├── star-data.js
│       │   └── wormhole-data.js
│       └── utils/
│           ├── seeded-random.js
│           └── string-utils.js
├── css/                         # Existing CSS (preserved)
│   ├── base.css
│   ├── hud.css
│   ├── modals.css
│   ├── starmap-scene.css
│   └── panel/
│       ├── trade.css
│       ├── refuel.css
│       └── ...
└── tests/                       # Migrated to Vitest
    ├── unit/
    ├── property/
    └── integration/
```

## Components and Interfaces

### Core Bridge Components

#### GameContext

```javascript
// src/context/GameContext.jsx
import { createContext, useContext } from 'react';

const GameContext = createContext(null);

export function GameProvider({ gameStateManager, children }) {
  if (!gameStateManager) {
    return <div>Loading game...</div>;
  }

  return (
    <GameContext.Provider value={gameStateManager}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within GameProvider');
  }
  return context;
}
```

#### useGameEvent Hook

```javascript
// src/hooks/useGameEvent.js
import { useState, useEffect } from 'react';
import { useGameState } from '../context/GameContext';

/**
 * Subscribe to GameStateManager events and trigger re-renders on changes.
 * 
 * @param {string} eventName - Event name from GameStateManager.subscribers
 * @returns {any} Current state value from the event
 */
export function useGameEvent(eventName) {
  const gameStateManager = useGameState();
  const [state, setState] = useState(() => {
    // Initialize with current state
    const currentState = gameStateManager.getState();
    return extractStateForEvent(eventName, currentState);
  });

  useEffect(() => {
    const unsubscribe = gameStateManager.subscribe(eventName, (data) => {
      setState(data);
    });

    return unsubscribe;
  }, [gameStateManager, eventName]);

  return state;
}

function extractStateForEvent(eventName, state) {
  // Map event names to state extraction logic
  const eventStateMap = {
    creditsChanged: state.player.credits,
    fuelChanged: state.ship.fuel,
    locationChanged: state.player.currentSystem,
    timeChanged: state.player.daysElapsed,
    cargoChanged: state.ship.cargo,
    shipConditionChanged: {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport
    }
  };

  return eventStateMap[eventName] || null;
}
```

#### useGameAction Hook

```javascript
// src/hooks/useGameAction.js
import { useGameState } from '../context/GameContext';

/**
 * Provides methods to trigger game actions through GameStateManager.
 * 
 * @returns {Object} Object containing action methods
 */
export function useGameAction() {
  const gameStateManager = useGameState();

  return {
    jump: (targetSystemId) => gameStateManager.jump(targetSystemId),
    buyGood: (goodType, quantity) => gameStateManager.buyGood(goodType, quantity),
    sellGood: (stackIndex, quantity) => gameStateManager.sellGood(stackIndex, quantity),
    refuel: (amount) => gameStateManager.refuel(amount),
    repair: (component, amount) => gameStateManager.repair(component, amount),
    purchaseUpgrade: (upgradeId) => gameStateManager.purchaseUpgrade(upgradeId),
    purchaseIntelligence: (systemId, goodType) => 
      gameStateManager.purchaseIntelligence(systemId, goodType),
    saveGame: () => gameStateManager.saveGame(),
    newGame: () => gameStateManager.initNewGame()
  };
}
```

### Application Entry Point

#### main.jsx

```javascript
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameProvider } from './context/GameContext';
import { GameStateManager } from './game/state/game-state-manager';
import { loadGame } from './game/state/save-load';

// Import global CSS
import '../css/base.css';
import '../css/hud.css';
import '../css/modals.css';
import '../css/starmap-scene.css';
import '../css/system-event-info.css';

// Import panel CSS
import '../css/panel/trade.css';
import '../css/panel/refuel.css';
import '../css/panel/repair.css';
import '../css/panel/upgrades.css';
import '../css/panel/info-broker.css';
import '../css/panel/cargo-manifest.css';
import '../css/panel/ship-status.css';
import '../css/panel/dev-admin.css';

// Initialize GameStateManager
let gameStateManager;
try {
  const savedGame = loadGame();
  if (savedGame) {
    gameStateManager = new GameStateManager(savedGame);
  } else {
    gameStateManager = new GameStateManager();
    gameStateManager.initNewGame();
  }
} catch (error) {
  console.error('Failed to initialize game:', error);
  // Render error UI
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div>Failed to load game. Please refresh the page.</div>
  );
  throw error;
}

// Render application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider gameStateManager={gameStateManager}>
      <App />
    </GameProvider>
  </React.StrictMode>
);
```

#### App.jsx

```javascript
// src/App.jsx
import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StarMapCanvas } from './features/navigation/StarMapCanvas';
import { HUD } from './features/hud/HUD';
import { StationMenu } from './features/station/StationMenu';
import { PanelContainer } from './features/station/PanelContainer';

const VIEW_MODES = {
  ORBIT: 'ORBIT',
  STATION: 'STATION',
  PANEL: 'PANEL'
};

export default function App() {
  const [viewMode, setViewMode] = useState(VIEW_MODES.ORBIT);
  const [activePanel, setActivePanel] = useState(null);

  const handleDock = () => {
    setViewMode(VIEW_MODES.STATION);
  };

  const handleUndock = () => {
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleOpenPanel = (panelName) => {
    setActivePanel(panelName);
    setViewMode(VIEW_MODES.PANEL);
  };

  const handleClosePanel = () => {
    setViewMode(VIEW_MODES.STATION);
    setActivePanel(null);
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <StarMapCanvas />
        <HUD onDock={handleDock} />
        
        {viewMode === VIEW_MODES.STATION && (
          <StationMenu 
            onOpenPanel={handleOpenPanel}
            onUndock={handleUndock}
          />
        )}
        
        {viewMode === VIEW_MODES.PANEL && (
          <PanelContainer 
            activePanel={activePanel}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
```

### Feature Components

#### HUD Component

```javascript
// src/features/hud/HUD.jsx
import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { QuickAccessButtons } from './QuickAccessButtons';

export function HUD({ onDock }) {
  return (
    <div className="hud-overlay">
      <ResourceBar />
      <DateDisplay />
      <ShipStatus />
      <QuickAccessButtons onDock={onDock} />
    </div>
  );
}
```

```javascript
// src/features/hud/ResourceBar.jsx
import { useGameEvent } from '../../hooks/useGameEvent';

export function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');

  return (
    <div className="resource-bar">
      <div className="credits">
        Credits: {credits?.toLocaleString() || 0}
      </div>
      <div className="fuel">
        Fuel: {fuel?.toFixed(1) || 0}%
      </div>
    </div>
  );
}
```

#### StarMapCanvas Component

```javascript
// src/features/navigation/StarMapCanvas.jsx
import { useEffect, useRef } from 'react';
import { initScene } from '../../game/engine/scene';
import { useGameState } from '../../context/GameContext';

export function StarMapCanvas() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const gameStateManager = useGameState();

  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;

    // Initialize Three.js scene once
    const { renderer, cleanup } = initScene(
      containerRef.current,
      gameStateManager
    );

    sceneRef.current = { renderer, cleanup };

    // Cleanup on unmount
    return () => {
      if (sceneRef.current?.cleanup) {
        sceneRef.current.cleanup();
      }
    };
  }, []); // Empty dependency array - initialize once

  return (
    <div 
      ref={containerRef} 
      className="starmap-container"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    />
  );
}
```

#### TradePanel Component

```javascript
// src/features/trade/TradePanel.jsx
import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { validateTrade } from './tradeUtils';

export function TradePanel({ onClose }) {
  const gameStateManager = useGameState();
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');
  const { buyGood, sellGood } = useGameAction();

  const [selectedGood, setSelectedGood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const state = gameStateManager.getState();
  const knownPrices = gameStateManager.getKnownPrices(state.player.currentSystem);

  const handleBuy = () => {
    const validation = validateTrade('buy', selectedGood, quantity, state);
    if (validation.valid) {
      buyGood(selectedGood, quantity);
      setQuantity(1);
    }
  };

  const handleSell = (stackIndex) => {
    const validation = validateTrade('sell', stackIndex, quantity, state);
    if (validation.valid) {
      sellGood(stackIndex, quantity);
      setQuantity(1);
    }
  };

  return (
    <div className="trade-panel">
      <h2>Trade</h2>
      {/* Market goods display */}
      {/* Cargo stacks display */}
      {/* Buy/Sell controls */}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

#### RefuelPanel Component

```javascript
// src/features/refuel/RefuelPanel.jsx
import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { calculateRefuelCost, validateRefuel } from './refuelUtils';

export function RefuelPanel({ onClose }) {
  const gameStateManager = useGameState();
  const fuel = useGameEvent('fuelChanged');
  const credits = useGameEvent('creditsChanged');
  const { refuel } = useGameAction();

  const [amount, setAmount] = useState(0);

  const state = gameStateManager.getState();
  const cost = calculateRefuelCost(amount, state);
  const validation = validateRefuel(amount, state);

  const handleRefuel = () => {
    if (validation.valid) {
      refuel(amount);
      setAmount(0);
    }
  };

  return (
    <div className="refuel-panel">
      <h2>Refuel</h2>
      <div>Current Fuel: {fuel?.toFixed(1)}%</div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <div>Cost: {cost} credits</div>
      {!validation.valid && (
        <div className="validation-message error">
          {validation.reason}
        </div>
      )}
      <button onClick={handleRefuel} disabled={!validation.valid}>
        Confirm Refuel
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Utility Functions

Utility functions extract business logic from components, making them pure and testable:

```javascript
// src/features/trade/tradeUtils.js

/**
 * Validates a trade transaction.
 * 
 * @param {string} type - 'buy' or 'sell'
 * @param {string|number} item - Good type or stack index
 * @param {number} quantity - Amount to trade
 * @param {Object} state - Current game state
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateTrade(type, item, quantity, state) {
  if (quantity <= 0) {
    return { valid: false, reason: 'Quantity must be positive' };
  }

  if (type === 'buy') {
    const price = calculateGoodPrice(item, state);
    const totalCost = price * quantity;
    
    if (state.player.credits < totalCost) {
      return { valid: false, reason: 'Insufficient credits' };
    }

    const cargoSpace = calculateAvailableCargoSpace(state.ship);
    if (cargoSpace < quantity) {
      return { valid: false, reason: 'Insufficient cargo space' };
    }
  }

  if (type === 'sell') {
    const stack = state.ship.cargo[item];
    if (!stack || stack.quantity < quantity) {
      return { valid: false, reason: 'Insufficient cargo' };
    }
  }

  return { valid: true };
}
```

## Data Models

### Game State Structure (Preserved)

The existing game state structure is preserved without modification:

```javascript
{
  player: {
    credits: number,
    currentSystem: number,
    daysElapsed: number
  },
  ship: {
    name: string,
    fuel: number,
    hull: number,
    engine: number,
    lifeSupport: number,
    cargo: Array<{
      type: string,
      quantity: number,
      purchasePrice: number,
      purchaseSystem: number,
      purchaseDate: number
    }>,
    upgrades: Array<string>,
    quirks: Array<{
      id: string,
      name: string,
      effect: Object
    }>
  },
  world: {
    visitedSystems: Set<number>,
    priceSnapshots: Map<number, Object>,
    activeEvents: Array<Object>,
    marketConditions: Map<number, Object>,
    flags: Object
  }
}
```

### React Component State

React components maintain minimal local state:

1. **View Mode State** (App.jsx): Current view mode and active panel
2. **Form Input State** (Panel components): Temporary input values (slider positions, text inputs)
3. **UI State** (Modal, Notification): Transient UI state not related to game logic

All game state remains in GameStateManager.

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining the correctness properties, I need to analyze the acceptance criteria to determine which are testable as properties, examples, or edge cases.


### Core Migration Properties

Property 1: Game state behavioral equivalence
*For any* game action (navigation, trade, refuel, repair, upgrade), executing that action in the React version should produce the same game state changes as the vanilla version
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Save/load round trip
*For any* game state, saving then loading should produce an equivalent state in both vanilla and React versions
**Validates: Requirements 1.4**

Property 3: UI rendering equivalence
*For any* game state and UI panel, the React version should display the same information as the vanilla version
**Validates: Requirements 1.5**

### Bridge Pattern Properties

Property 4: Single GameStateManager instance
*For any* application initialization, exactly one GameStateManager instance should be created
**Validates: Requirements 3.3**

Property 5: State updates through GameStateManager
*For any* game state change, the change should occur only through GameStateManager methods, not through direct mutations
**Validates: Requirements 3.1**

Property 6: Component state matches GameStateManager
*For any* React component reading game state, the component's state should match the corresponding GameStateManager state
**Validates: Requirements 3.2, 3.5**

Property 7: GameContext provides valid instance
*For any* component accessing GameContext, the context should provide a non-null GameStateManager instance
**Validates: Requirements 5.1, 13.5**

Property 8: Selective re-rendering on events
*For any* game event, only components subscribed to that event should re-render
**Validates: Requirements 5.3, 34.3**

Property 9: Automatic unsubscription on unmount
*For any* component using useGameEvent, unmounting the component should automatically unsubscribe from GameStateManager events
**Validates: Requirements 5.4, 34.4**

Property 10: All subscribers notified
*For any* game event with multiple subscribers, all subscribers should receive the event notification
**Validates: Requirements 5.5**

Property 11: useGameEvent subscription correctness
*For any* call to useGameEvent with an event name, the hook should call gameStateManager.subscribe with that event name
**Validates: Requirements 34.1**

Property 12: useGameEvent state updates
*For any* subscription callback firing, the useGameEvent hook should update its local state and return the updated value
**Validates: Requirements 34.2, 34.5**

Property 13: useGameAction delegates to GameStateManager
*For any* action triggered through useGameAction, the corresponding GameStateManager method should be called
**Validates: Requirements 16.2, 16.3**

Property 14: Actions trigger events
*For any* game action completing, the appropriate GameStateManager events should be fired
**Validates: Requirements 16.4**

Property 15: useGameAction consistency
*For any* multiple components using useGameAction, they should all receive the same action methods
**Validates: Requirements 16.5**

### Three.js Integration Properties

Property 16: Scene initialization once per mount
*For any* StarMapCanvas mount, the Three.js scene should be initialized exactly once
**Validates: Requirements 4.3, 14.1**

Property 17: No scene re-initialization on re-render
*For any* React component re-render, the Three.js scene should not be re-initialized
**Validates: Requirements 4.2, 14.5**

Property 18: Resource cleanup on unmount
*For any* StarMapCanvas unmount, all Three.js resources should be disposed
**Validates: Requirements 14.4**

### UI Reactivity Properties

Property 19: HUD updates on credit changes
*For any* change to player credits, the HUD credits display should update to reflect the new value
**Validates: Requirements 7.1**

Property 20: HUD updates on fuel changes
*For any* change to ship fuel, the HUD fuel display should update to reflect the new value
**Validates: Requirements 7.2**

Property 21: HUD updates on time changes
*For any* change to game time, the HUD date display should update to reflect the new value
**Validates: Requirements 7.3**

Property 22: HUD updates on condition changes
*For any* change to ship condition (hull, engine, life support), the HUD condition bars should update to reflect the new values
**Validates: Requirements 7.4**

### Panel Component Properties

Property 23: Panels rendered as React components
*For any* UI panel (trade, refuel, repair, upgrades, info-broker, cargo-manifest, ship-status), the panel should be rendered as a React component
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

Property 24: Trade panel delegates to GameStateManager
*For any* trade operation (buy, sell, price query), the trade panel should call the corresponding GameStateManager method
**Validates: Requirements 26.1, 26.2, 26.3**

Property 25: Refuel panel manages local state
*For any* refuel slider interaction, the slider value should be managed in local React state until submission
**Validates: Requirements 27.1, 27.2**

### View Mode Properties

Property 26: ORBIT mode displays starmap and HUD
*For any* view mode set to ORBIT, only the starmap and HUD should be displayed
**Validates: Requirements 9.2**

Property 27: STATION mode displays station menu
*For any* view mode set to STATION, the station menu should be displayed
**Validates: Requirements 9.3**

Property 28: PANEL mode displays active panel
*For any* view mode set to PANEL, the active panel should be displayed
**Validates: Requirements 9.4**

Property 29: View mode changes update visibility
*For any* view mode change, the visible components should update to match the new view mode
**Validates: Requirements 9.5, 25.1, 25.2, 25.3, 25.4**

### CSS and Styling Properties

Property 30: CSS class names preserved
*For any* component rendering, the component should use the same CSS class names as the vanilla version
**Validates: Requirements 10.1**

Property 31: CSS animations preserved
*For any* animation playing, the animation should use the existing CSS animation definitions
**Validates: Requirements 10.5**

### Test Migration Properties

Property 32: Unit test equivalence
*For any* unit test in the vanilla version, the React version should have an equivalent test verifying the same functionality
**Validates: Requirements 11.2**

Property 33: Property test equivalence
*For any* property-based test in the vanilla version, the React version should have an equivalent test verifying the same property
**Validates: Requirements 11.3**

Property 34: Integration test equivalence
*For any* integration test in the vanilla version, the React version should have an equivalent test verifying the same workflow
**Validates: Requirements 11.4**

### Import Path Properties

Property 35: Import resolution correctness
*For any* module import, the import should resolve to the correct file path in the new src directory structure
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

### Utility Function Properties

Property 36: Utility functions are pure
*For any* utility function (trade validation, refuel calculation, repair cost, upgrade validation), the function should be pure (same inputs produce same outputs)
**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

### Event Name Properties

Property 37: Correct event names used
*For any* component subscribing to GameStateManager events, the component should use the exact event names defined in GameStateManager.subscribers
**Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6**

### Error Handling Properties

Property 38: Error boundaries catch component errors
*For any* React component throwing an error, an Error Boundary should catch it and display a fallback UI
**Validates: Requirements 36.1, 36.2, 36.3**

### Save Compatibility Properties

Property 39: Old saves load correctly
*For any* saved game from the vanilla version, the React version should be able to load and restore the game state
**Validates: Requirements 37.1, 37.2, 37.3**

### Performance Properties

Property 40: No redundant re-renders
*For any* multiple events firing rapidly, components should not re-render redundantly when subscribed to the same event
**Validates: Requirements 41.3**

Property 41: No unnecessary object cloning
*For any* event data being passed to subscribers, the data should not be unnecessarily cloned if it's not being mutated
**Validates: Requirements 41.4**

### Modal Properties

Property 42: Modals block underlying UI
*For any* modal being displayed, interaction with underlying UI elements should be blocked
**Validates: Requirements 42.2**

Property 43: Modals don't block state updates
*For any* modal being open, GameStateManager state updates should continue to function normally
**Validates: Requirements 42.5**

### Animation Integration Properties

Property 44: Animation loop outside React
*For any* animation executing, the animation loop should run outside the React render cycle
**Validates: Requirements 43.1**

Property 45: useAnimationLock disables interactions
*For any* animation starting, the useAnimationLock hook should disable UI interactions until the animation completes
**Validates: Requirements 43.2, 43.5**

### Notification Properties

Property 46: Notification queueing
*For any* multiple notifications triggered, they should be queued and displayed appropriately
**Validates: Requirements 44.4**

Property 47: Notification expiration
*For any* notification expiring, it should be removed with fade animations matching existing CSS
**Validates: Requirements 44.5**

### Quick Access Properties

Property 48: Quick access button state updates
*For any* player location change, quick access button enabled/disabled state should update accordingly
**Validates: Requirements 46.2**

Property 49: Animation lock disables quick access
*For any* animation running, quick access buttons should be disabled
**Validates: Requirements 46.3**

### Game Logic Preservation Properties

Property 50: Game logic not reimplemented
*For any* game calculation (trading, navigation, fuel consumption), the React version should use the existing game logic functions, not reimplemented versions
**Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5**

## Error Handling

### Error Boundary Strategy

The application uses React Error Boundaries to catch and handle errors gracefully:

1. **Root Error Boundary**: Wraps the entire App component to catch catastrophic errors
2. **Feature Error Boundaries**: Wrap major features (starmap, panels) to isolate failures
3. **Fallback UI**: Displays user-friendly error messages with recovery options

```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### GameStateManager Initialization Errors

If GameStateManager fails to initialize:

1. Display error message with details
2. Offer to start a new game
3. Preserve corrupted save data for debugging
4. Log error details to console

### Three.js Rendering Errors

If Three.js scene initialization fails:

1. Catch error in StarMapCanvas component
2. Display fallback UI (text-based system list)
3. Allow game to continue without 3D visualization
4. Log error details for debugging

### Save/Load Errors

If save or load operations fail:

1. Display error message to user
2. Preserve existing game state
3. Offer retry option
4. Log error details for debugging

## Testing Strategy

### Testing Framework

- **Vitest**: Test runner and assertion library
- **@testing-library/react**: React component testing utilities
- **fast-check**: Property-based testing library
- **jsdom**: DOM environment for tests

### Test Categories

#### 1. Unit Tests

Unit tests verify individual functions and components in isolation:

- **Utility Functions**: Test pure functions (validation, calculations)
- **Custom Hooks**: Test useGameEvent, useGameAction, useAnimationLock
- **Components**: Test individual components with mocked dependencies

Example:
```javascript
// src/features/trade/tradeUtils.test.js
import { describe, it, expect } from 'vitest';
import { validateTrade } from './tradeUtils';

describe('validateTrade', () => {
  it('should reject trades with insufficient credits', () => {
    const state = {
      player: { credits: 100 },
      ship: { cargo: [] }
    };
    
    const result = validateTrade('buy', 'electronics', 10, state);
    
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient credits');
  });
});
```

#### 2. Property-Based Tests

Property-based tests verify universal properties across many generated inputs:

- **Bridge Pattern**: Test useGameEvent subscription/unsubscription
- **State Equivalence**: Compare vanilla vs React state changes
- **UI Reactivity**: Verify UI updates on state changes
- **Resource Cleanup**: Verify no memory leaks on mount/unmount

Example:
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
          const mockGameStateManager = createMockGameStateManager();
          const { unmount } = renderHook(
            () => useGameEvent(eventName),
            { wrapper: createWrapper(mockGameStateManager) }
          );

          const subscriptionCount = mockGameStateManager.getSubscriptionCount(eventName);
          unmount();
          const afterUnmountCount = mockGameStateManager.getSubscriptionCount(eventName);

          return afterUnmountCount === subscriptionCount - 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### 3. Integration Tests

Integration tests verify complete workflows across multiple components:

- **Game Flow**: Test complete game actions (jump, trade, refuel)
- **View Mode Transitions**: Test navigation between views
- **Panel Workflows**: Test complete panel interactions
- **Save/Load**: Test save/load round trips

Example:
```javascript
// tests/integration/trade-workflow.integration.test.js
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { TradePanel } from '../../src/features/trade/TradePanel';

describe('Trade Workflow Integration', () => {
  it('should complete a buy transaction and update state', async () => {
    const gameStateManager = createTestGameStateManager();
    
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <TradePanel onClose={() => {}} />
      </GameProvider>
    );

    // Select good and quantity
    fireEvent.click(screen.getByText('Electronics'));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    
    // Execute buy
    fireEvent.click(screen.getByText('Buy'));

    // Verify state updated
    const state = gameStateManager.getState();
    expect(state.ship.cargo).toHaveLength(1);
    expect(state.ship.cargo[0].type).toBe('electronics');
    expect(state.ship.cargo[0].quantity).toBe(5);
  });
});
```

#### 4. Behavioral Equivalence Tests

These tests compare vanilla and React versions to ensure identical behavior:

- **State Changes**: Compare state after same actions
- **Calculations**: Compare calculation results
- **UI Output**: Compare rendered output

Example:
```javascript
// tests/integration/behavioral-equivalence.test.js
import { describe, it, expect } from 'vitest';
import { VanillaGameStateManager } from '../../js/state/game-state-manager';
import { ReactGameStateManager } from '../../src/game/state/game-state-manager';

/**
 * React Migration Spec, Property 1: Game state behavioral equivalence
 */
describe('Property: Game state behavioral equivalence', () => {
  it('should produce identical state changes for navigation', () => {
    const vanillaGSM = new VanillaGameStateManager();
    const reactGSM = new ReactGameStateManager();

    vanillaGSM.initNewGame();
    reactGSM.initNewGame();

    // Execute same navigation action
    vanillaGSM.jump(2); // Jump to Alpha Centauri
    reactGSM.jump(2);

    // Compare states
    const vanillaState = vanillaGSM.getState();
    const reactState = reactGSM.getState();

    expect(reactState.player.currentSystem).toBe(vanillaState.player.currentSystem);
    expect(reactState.ship.fuel).toBeCloseTo(vanillaState.ship.fuel, 2);
    expect(reactState.player.daysElapsed).toBe(vanillaState.player.daysElapsed);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage of utility functions and hooks
- **Property Tests**: All correctness properties implemented
- **Integration Tests**: All major workflows covered
- **Behavioral Equivalence**: All game actions verified

### Test Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- bridge-pattern.property.test.js
```

## Migration Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish build system and bridge pattern

Deliverables:
1. Vite project scaffolding (package.json, vite.config.js, vitest.config.js)
2. Directory structure (src/, features/, game/, hooks/, context/)
3. Game logic moved to src/game/ with preserved imports
4. Bridge Pattern implemented (GameContext, useGameEvent, useGameAction)
5. StarMapCanvas component rendering Three.js scene
6. Basic HUD displaying credits and fuel using Bridge Pattern
7. Error Boundary implementation
8. Initial test setup with Vitest

Success Criteria:
- Vite dev server runs without errors
- Three.js scene renders in React
- HUD updates reactively when credits/fuel change
- All existing tests pass in Vitest

### Phase 2: Core UI Migration (Week 3-4)

**Goal**: Migrate all UI panels to React components

Deliverables:
1. Complete HUD with all components (ResourceBar, DateDisplay, ShipStatus, QuickAccessButtons)
2. View mode management in App component
3. StationMenu component
4. PanelContainer component
5. All panel components (Trade, Refuel, Repair, Upgrades, InfoBroker, CargoManifest, ShipStatus)
6. Panel utility functions extracted
7. Modal component with React Portals
8. Notification system with useNotification hook

Success Criteria:
- All panels render correctly
- All panels interact with GameStateManager correctly
- View mode transitions work smoothly
- No manual DOM manipulation in UI code

### Phase 3: Animation and Polish (Week 5)

**Goal**: Integrate animation system and polish UX

Deliverables:
1. useAnimationLock hook
2. Animation system integration with React
3. Dev admin panel migration
4. CSS modules for component-specific styles
5. Accessibility improvements (ARIA labels, keyboard navigation)
6. Performance optimization (React.memo, useMemo where needed)

Success Criteria:
- Jump animations work smoothly
- Input locking during animations works correctly
- Dev admin panel functional
- No performance regressions

### Phase 4: Testing and Validation (Week 6)

**Goal**: Achieve test parity and validate behavioral equivalence

Deliverables:
1. All unit tests migrated to Vitest
2. All property-based tests migrated to fast-check
3. All integration tests migrated
4. Behavioral equivalence tests for all game actions
5. Test coverage report matching or exceeding vanilla version
6. Performance benchmarks comparing vanilla vs React

Success Criteria:
- All tests pass
- Test coverage >= vanilla version
- All behavioral equivalence tests pass
- Performance within 10% of vanilla version

### Phase 5: Cutover and Cleanup (Week 7)

**Goal**: Complete migration and remove vanilla code

Deliverables:
1. Save migration utility for old saves
2. Updated documentation
3. Vanilla code removal
4. Production build optimization
5. Final QA and bug fixes

Success Criteria:
- Production build works correctly
- Old saves load successfully
- No vanilla code remains
- All documentation updated

## Performance Considerations

### React Rendering Optimization

1. **React.memo**: Wrap expensive components to prevent unnecessary re-renders
2. **useMemo**: Cache expensive calculations
3. **useCallback**: Stabilize callback references
4. **React 18 Automatic Batching**: Leverage automatic batching for multiple state updates

### Three.js Integration

1. **Single Initialization**: Initialize scene once, never re-initialize
2. **Animation Loop Outside React**: Run requestAnimationFrame outside React render cycle
3. **Resource Cleanup**: Properly dispose of Three.js resources on unmount
4. **Ref-based DOM Access**: Use refs to access container, avoid querying DOM

### Event Subscription Optimization

1. **Selective Subscriptions**: Only subscribe to events actually needed
2. **Automatic Cleanup**: Ensure all subscriptions cleaned up on unmount
3. **Batched Updates**: Leverage React 18 batching for multiple event handlers
4. **Minimal State**: Keep component state minimal, derive values when possible

### Bundle Size Optimization

1. **Tree Shaking**: Ensure unused code is eliminated
2. **Code Splitting**: Split features into separate chunks
3. **Lazy Loading**: Lazy load panels and features
4. **CSS Optimization**: Use CSS modules to eliminate unused styles

## Security Considerations

### XSS Prevention

1. **React's Built-in Escaping**: Rely on React's automatic escaping of text content
2. **Sanitize User Input**: Sanitize ship names and any user-provided text
3. **Avoid dangerouslySetInnerHTML**: Never use unless absolutely necessary
4. **Content Security Policy**: Configure CSP headers in production

### localStorage Security

1. **Validate Loaded Data**: Always validate data loaded from localStorage
2. **Version Checking**: Check save version before loading
3. **Error Handling**: Handle corrupted saves gracefully
4. **No Sensitive Data**: Never store sensitive data in localStorage

### Dependency Security

1. **Regular Updates**: Keep dependencies updated
2. **Audit Dependencies**: Run npm audit regularly
3. **Minimal Dependencies**: Only include necessary dependencies
4. **Lock File**: Commit package-lock.json for reproducible builds

## Deployment Strategy

### Development Environment

- Vite dev server on port 5173
- Hot module replacement enabled
- Source maps enabled
- React DevTools integration

### Production Build

```bash
npm run build
```

Output:
- Optimized bundle in dist/
- Minified JavaScript and CSS
- Source maps for debugging
- Static assets with cache busting

### Deployment Options

1. **Static Hosting**: Deploy dist/ to any static host (Netlify, Vercel, GitHub Pages)
2. **CDN**: Serve assets from CDN for better performance
3. **Caching Strategy**: Configure cache headers for optimal performance

### Rollback Plan

During migration, maintain both versions:

1. **Vanilla Version**: Keep starmap.html functional
2. **React Version**: New index.html with Vite
3. **Feature Flag**: Use .dev file or environment variable to switch
4. **Gradual Rollout**: Test React version with subset of users first

## Documentation Updates

### Code Documentation

1. **JSDoc Comments**: Document all public functions and components
2. **README Updates**: Update README with new build instructions
3. **Architecture Docs**: Document Bridge Pattern and component structure
4. **Migration Guide**: Document migration process for future reference

### User Documentation

1. **No User-Facing Changes**: Migration is transparent to users
2. **Save Compatibility**: Document save format compatibility
3. **Browser Requirements**: Update browser requirements if needed

## Success Metrics

### Functional Metrics

- [ ] All game actions produce identical state changes
- [ ] All UI panels render correctly
- [ ] All tests pass
- [ ] Test coverage >= vanilla version
- [ ] No manual DOM manipulation in UI code

### Performance Metrics

- [ ] Starmap renders at 60 FPS
- [ ] UI response time < 100ms
- [ ] Bundle size < 500KB (gzipped)
- [ ] Initial load time < 3 seconds

### Code Quality Metrics

- [ ] No console errors or warnings
- [ ] ESLint passes with no errors
- [ ] All components have PropTypes or TypeScript types
- [ ] All functions documented with JSDoc

### Migration Completeness

- [ ] All vanilla UI code removed
- [ ] All tests migrated to Vitest
- [ ] All CSS preserved and working
- [ ] All features functional
- [ ] Documentation updated
