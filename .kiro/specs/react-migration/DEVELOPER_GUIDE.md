# React Migration Developer Guide

## Overview

This guide helps new developers understand the React migration project for Tramp Freighter Blues. The migration transforms the UI layer from Vanilla JavaScript to React 18+ while preserving all game logic and Three.js rendering.

## Project Context

### What We're Migrating

**Migrating (UI Layer):**
- `js/ui/` - All UI management code
- Portions of `js/controllers/` - Panel controller logic
- DOM manipulation code throughout

**Preserving (Game Logic & Rendering):**
- `js/state/` - Game state management
- `js/game-*.js` - Trading, navigation, events logic
- `js/views/starmap/` - Three.js rendering engine
- All game mathematics and calculations

### Why React?

- **Maintainability**: Declarative UI is easier to understand and modify
- **Scalability**: Component-based architecture supports future features
- **Developer Experience**: Better tooling, hot reload, and debugging
- **No Rewrites**: We're wrapping existing logic, not replacing it

## Architecture Overview

### The Bridge Pattern

The core architectural pattern connecting imperative GameStateManager to declarative React:

```
GameStateManager (Imperative)
        ↓
    GameContext (React Context)
        ↓
   useGameEvent (Custom Hook)
        ↓
  React Components (Declarative)
```

**How it works:**
1. GameStateManager remains the single source of truth
2. GameContext holds the GameStateManager instance
3. useGameEvent subscribes to GameStateManager events
4. When events fire, useGameEvent triggers React re-renders
5. Components stay in sync with game state

### Directory Structure

```
src/
├── assets/             # Images, static resources
├── components/         # Shared UI (Button, Modal, Card)
├── context/            # GameContext provider
├── features/           # Feature-based modules
│   ├── hud/           # HUD components
│   ├── navigation/    # Navigation UI
│   ├── station/       # Station interface
│   ├── trade/         # Trade panel
│   ├── refuel/        # Refuel panel
│   └── ship-status/   # Ship status display
├── game/              # Migrated game logic (from js/)
│   ├── constants.js   # Game constants
│   ├── state/         # State management
│   ├── engine/        # Three.js scene & animation
│   └── data/          # Star data, wormholes
├── hooks/             # Custom React hooks
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## Key Concepts

### 1. GameStateManager Integration

**DO:**
- Read state from GameStateManager
- Call GameStateManager methods for actions
- Subscribe to events via useGameEvent
- Keep GameStateManager as single source of truth

**DON'T:**
- Duplicate state in React state
- Reimplement game logic in components
- Use Redux or other state management
- Modify GameStateManager internals

**Example:**
```jsx
// GOOD
function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');
  
  return (
    <div>
      <span>Credits: {credits}</span>
      <span>Fuel: {fuel}</span>
    </div>
  );
}

// BAD
function ResourceBar() {
  const [credits, setCredits] = useState(0);
  // Duplicating state - don't do this!
}
```

### 2. Three.js Integration

Three.js must run outside React's render cycle for 60 FPS performance.

**Pattern:**
```jsx
function StarMapCanvas() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Initialize once with empty dependency array
    const { renderer, scene, camera } = initScene(containerRef.current);
    containerRef.current.appendChild(renderer.domElement);
    
    // Cleanup on unmount
    return () => {
      renderer.dispose();
      // ... other cleanup
    };
  }, []); // Empty array = run once
  
  return <div ref={containerRef} />;
}
```

**Key Points:**
- Use `useRef` to target container
- Call existing `initScene()` from `scene.js`
- Empty dependency array prevents re-initialization
- Cleanup Three.js resources on unmount

### 3. Event Subscription Pattern

Components subscribe to specific GameStateManager events:

**Available Events:**
- `creditsChanged` - Player credits updated
- `fuelChanged` - Ship fuel updated
- `locationChanged` - Player moved systems
- `timeChanged` - Game time advanced
- `cargoChanged` - Cargo modified
- `shipConditionChanged` - Ship condition updated

**Usage:**
```jsx
function TradePanel() {
  const cargo = useGameEvent('cargoChanged');
  const { buyGood, sellGood } = useGameAction();
  
  const handleBuy = (goodType, quantity) => {
    buyGood(goodType, quantity);
    // GameStateManager handles state update
    // cargoChanged event fires automatically
    // Component re-renders with new cargo
  };
  
  return (
    <div>
      {/* Render cargo */}
      <button onClick={() => handleBuy('water', 10)}>Buy Water</button>
    </div>
  );
}
```

### 4. View Mode Management

The App component manages which UI panels are visible:

**View Modes:**
- `ORBIT` - Starmap + HUD only
- `STATION` - Station menu visible
- `PANEL` - Specific panel visible (trade, refuel, etc.)

**Rendering Logic:**
```jsx
function App() {
  const [viewMode, setViewMode] = useState('ORBIT');
  
  return (
    <>
      <StarMapCanvas /> {/* Always rendered, z-index: 0 */}
      <HUD /> {/* Always rendered, overlays starmap */}
      {viewMode === 'STATION' && <StationMenu />}
      {viewMode === 'PANEL' && <PanelContainer />}
    </>
  );
}
```

### 5. CSS Strategy

**Global Styles:**
- Import existing CSS files in `main.jsx`
- Maintains visual consistency
- Reuses existing class names

**CSS Modules:**
- Use for component-specific styles
- Prevents naming conflicts
- Enables tree-shaking

**Example:**
```jsx
// main.jsx
import '../css/base.css';
import '../css/hud.css';
import '../css/starmap-scene.css';

// Component with CSS module
import styles from './TradePanel.module.css';

function TradePanel() {
  return <div className={styles.panel}>...</div>;
}
```

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start Vite dev server (runs on different port than existing setup)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Incremental Migration

The migration is designed to be incremental:

1. **Phase 1**: Scaffolding + Bridge + Basic HUD
2. **Phase 2**: Convert all panels to React
3. **Phase 3**: Remove vanilla JS UI code
4. **Phase 4**: Optimize and polish

During migration, both versions can coexist:
- Vite dev server: `http://localhost:5173` (React version)
- Original: `starmap.html` (Vanilla JS version)

### Testing Strategy

**Unit Tests:**
- Test individual components in isolation
- Mock GameStateManager for predictable state
- Use Vitest + React Testing Library

**Property-Based Tests:**
- Migrate existing property tests to fast-check
- Maintain same properties and coverage
- Test game logic, not React components

**Integration Tests:**
- Test complete workflows (trade, refuel, navigation)
- Use real GameStateManager instance
- Verify UI updates match state changes

## Common Patterns

### Pattern 1: Display Component

Components that only display data:

```jsx
function DateDisplay() {
  const gameTime = useGameEvent('timeChanged');
  
  return (
    <div className="date-display">
      Day {gameTime.day}
    </div>
  );
}
```

### Pattern 2: Action Component

Components that trigger game actions:

```jsx
function RefuelPanel() {
  const [amount, setAmount] = useState(0);
  const { refuel, validateRefuel } = useGameAction();
  
  const validation = validateRefuel(amount);
  
  const handleRefuel = () => {
    if (validation.valid) {
      refuel(amount);
      setAmount(0); // Reset local UI state
    }
  };
  
  return (
    <div>
      <input 
        type="range" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      {!validation.valid && <p>{validation.reason}</p>}
      <button onClick={handleRefuel} disabled={!validation.valid}>
        Refuel
      </button>
    </div>
  );
}
```

### Pattern 3: Utility Extraction

Extract controller logic to pure functions:

```jsx
// utils/tradeValidation.js
export function validateTrade(gameState, goodType, quantity, action) {
  if (action === 'buy') {
    const cost = calculateCost(goodType, quantity);
    if (gameState.player.credits < cost) {
      return { valid: false, reason: 'Insufficient credits' };
    }
    if (gameState.ship.cargo.length >= gameState.ship.cargoCapacity) {
      return { valid: false, reason: 'Cargo hold full' };
    }
  }
  return { valid: true };
}

// TradePanel.jsx
import { validateTrade } from '../utils/tradeValidation';

function TradePanel() {
  const gameState = useGameState();
  const validation = validateTrade(gameState, 'water', 10, 'buy');
  // ...
}
```

## Error Handling

### Error Boundaries

Wrap components in Error Boundaries to prevent crashes:

```jsx
function App() {
  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <GameProvider>
        <StarMapCanvas />
        <HUD />
      </GameProvider>
    </ErrorBoundary>
  );
}
```

### Initialization Errors

Handle GameStateManager initialization failures:

```jsx
function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      const state = loadGame() || initNewGame();
      setGameState(state);
    } catch (err) {
      setError(err);
    }
  }, []);
  
  if (error) return <ErrorScreen error={error} />;
  if (!gameState) return <LoadingScreen />;
  
  return (
    <GameContext.Provider value={gameState}>
      {children}
    </GameContext.Provider>
  );
}
```

## Performance Considerations

### 1. Avoid Unnecessary Re-renders

```jsx
// GOOD - Only re-renders when credits change
function CreditsDisplay() {
  const credits = useGameEvent('creditsChanged');
  return <span>{credits}</span>;
}

// BAD - Re-renders on every game state change
function CreditsDisplay() {
  const gameState = useGameState();
  return <span>{gameState.player.credits}</span>;
}
```

### 2. Batch Updates

React 18 automatically batches updates:

```jsx
// These updates are automatically batched
function handleJump() {
  updateFuel(newFuel);      // Triggers fuelChanged
  updateLocation(newSystem); // Triggers locationChanged
  updateTime(newTime);       // Triggers timeChanged
  // Only one re-render for all three changes
}
```

### 3. Memoization

Use React.memo for expensive components:

```jsx
const StarSprite = React.memo(({ star }) => {
  // Expensive rendering logic
  return <div>...</div>;
});
```

## Debugging Tips

### 1. React DevTools

Install React DevTools browser extension:
- Inspect component tree
- View props and state
- Profile performance

### 2. GameStateManager Events

Log events to understand data flow:

```jsx
useEffect(() => {
  const unsubscribe = gameStateManager.subscribe('*', (event, data) => {
    console.log('Event:', event, 'Data:', data);
  });
  return unsubscribe;
}, []);
```

### 3. Vite HMR

Hot Module Replacement preserves state during development:
- Edit components without losing game state
- Fast feedback loop
- Automatic browser refresh

## Migration Checklist

When migrating a UI component:

- [ ] Identify the vanilla JS code to replace
- [ ] Extract business logic to utility functions
- [ ] Create React component structure
- [ ] Identify required GameStateManager events
- [ ] Implement useGameEvent subscriptions
- [ ] Implement useGameAction calls
- [ ] Preserve existing CSS class names
- [ ] Add Error Boundary if needed
- [ ] Write/migrate tests
- [ ] Verify functionality matches original
- [ ] Remove vanilla JS code

## Common Pitfalls

### ❌ Pitfall 1: Reimplementing Game Logic

```jsx
// BAD - Reimplementing trade logic
function TradePanel() {
  const handleBuy = (good, qty) => {
    const cost = good.price * qty * 1.1; // Don't recalculate!
    if (credits >= cost) {
      setCredits(credits - cost);
      setCargo([...cargo, { good, qty }]);
    }
  };
}

// GOOD - Using existing logic
function TradePanel() {
  const { buyGood } = useGameAction();
  const handleBuy = (good, qty) => {
    buyGood(good, qty); // GameStateManager handles everything
  };
}
```

### ❌ Pitfall 2: Re-initializing Three.js

```jsx
// BAD - Re-initializes on every render
function StarMapCanvas() {
  const scene = initScene(); // Don't do this!
  return <div />;
}

// GOOD - Initializes once
function StarMapCanvas() {
  useEffect(() => {
    const scene = initScene();
    return () => scene.dispose();
  }, []); // Empty array!
  return <div />;
}
```

### ❌ Pitfall 3: Duplicating State

```jsx
// BAD - Duplicating GameStateManager state
function HUD() {
  const [credits, setCredits] = useState(0);
  
  useEffect(() => {
    const unsubscribe = gameStateManager.subscribe('creditsChanged', (newCredits) => {
      setCredits(newCredits); // Unnecessary duplication
    });
    return unsubscribe;
  }, []);
}

// GOOD - Using useGameEvent
function HUD() {
  const credits = useGameEvent('creditsChanged');
  // Hook handles subscription and state
}
```

## Resources

### Documentation
- [React 18 Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Docs](https://vitest.dev/)
- [Three.js Docs](https://threejs.org/docs/)

### Project Files
- `requirements.md` - Complete requirements specification
- `design.md` - Technical design document
- `tasks.md` - Implementation task list

### Getting Help

1. Check this guide first
2. Review requirements and design docs
3. Look at existing migrated components
4. Ask in team chat with specific questions
5. Include code snippets and error messages

## Next Steps

1. Read `requirements.md` for complete specification
2. Review `design.md` for technical details
3. Set up development environment
4. Start with Phase 1 tasks in `tasks.md`
5. Follow the migration checklist for each component

Welcome to the team! 🚀
