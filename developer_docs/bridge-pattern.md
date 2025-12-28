# Bridge Pattern in Tramp Freighter Blues

## Overview

The Bridge Pattern is a core architectural pattern in Tramp Freighter Blues
that connects React's declarative UI components to the imperative
GameStateManager. This pattern ensures clean separation of concerns, prevents
state duplication, and maintains a single source of truth for all game state.

## Why the Bridge Pattern?

### The Problem

React components are declarative and functional, while game logic often needs
to be imperative and stateful. Without proper separation:

- Components might duplicate game state in React state
- Business logic could leak into UI components
- State synchronization becomes complex and error-prone
- Testing becomes difficult due to tight coupling

### The Solution

The Bridge Pattern provides a clean interface between these two paradigms:

```
    ┌─────────────────┐    Bridge Pattern   ┌──────────────────┐
    │ React Components│ ◄─────────────────► │ GameStateManager │
    │ (Declarative)   │                     │ (Imperative)     │
    └─────────────────┘                     └──────────────────┘
```

## Core Components

### 1. GameStateManager (Single Source of Truth)

The GameStateManager is an imperative singleton that:
- Maintains all game state
- Implements business logic
- Emits events when state changes
- Provides methods for state mutations

```javascript
class GameStateManager {
  constructor() {
    this.state = { /* game state */ };
    this.subscribers = { /* event subscribers */ };
  }

  // State mutations
  updateCredits(newCredits) {
    this.state.player.credits = newCredits;
    this.emit('creditsChanged', newCredits);
  }

  // Event system
  subscribe(eventType, callback) { /* ... */ }
  emit(eventType, data) { /* ... */ }
}
```

### 2. Custom Hooks (Bridge Interface)

Custom hooks provide the bridge between React and GameStateManager:

#### useGameEvent() - Subscribe to State Changes

```javascript
import { useGameEvent } from '../hooks/useGameEvent';

function MyComponent() {
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

#### useGameAction() - Trigger State Changes

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

### 3. GameContext (Dependency Injection)

React Context provides the GameStateManager instance to all components:

```javascript
// GameContext.jsx
const GameContext = createContext();

export function GameProvider({ children, gameStateManager }) {
  return (
    <GameContext.Provider value={gameStateManager}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameContext);
}
```

## Implementation Rules

### ✅ DO: Use Bridge Pattern Hooks

```javascript
// CORRECT: Use useGameEvent for state subscriptions
function TradePanel() {
  const credits = useGameEvent('creditsChanged');
  const cargo = useGameEvent('cargoChanged');
  const { buyGood } = useGameAction();
  
  return (
    <div>
      <div>Credits: {credits}</div>
      <button onClick={() => buyGood('grain', 1, 100)}>
        Buy Grain
      </button>
    </div>
  );
}
```

### ❌ DON'T: Access GameStateManager Directly

```javascript
// WRONG: Direct GameStateManager access
function TradePanel() {
  const gameStateManager = useGameState();
  const state = gameStateManager.getState(); // ❌ Bridge Pattern violation
  
  return <div>Credits: {state.player.credits}</div>;
}
```

### ✅ DO: Handle Undefined State Gracefully

```javascript
// CORRECT: Handle undefined state during initialization
function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');
  
  // Events may not have fired yet during initialization
  const displayCredits = credits ?? 0;
  const displayFuel = fuel ?? 100;
  
  return (
    <div>
      <div>Credits: {displayCredits}</div>
      <div>Fuel: {displayFuel}%</div>
    </div>
  );
}
```

### ❌ DON'T: Duplicate State in React State

```javascript
// WRONG: Duplicating game state in React state
function TradePanel() {
  const [credits, setCredits] = useState(0); // ❌ State duplication
  const gameStateManager = useGameState();
  
  useEffect(() => {
    const state = gameStateManager.getState();
    setCredits(state.player.credits); // ❌ Manual synchronization
  }, []);
  
  return <div>Credits: {credits}</div>;
}
```

## Event System

### Available Events

The GameStateManager emits these events for component subscriptions:

```javascript
// Player state
'creditsChanged'     // (number) - Player's current credits
'debtChanged'        // (number) - Player's current debt
'locationChanged'    // (number) - Current system ID
'timeChanged'        // (number) - Days elapsed since game start

// Ship state
'fuelChanged'        // (number) - Ship fuel percentage (0-100)
'cargoChanged'       // (Array) - Ship cargo array with stacks
'cargoCapacityChanged' // (number) - Ship cargo capacity in units
'shipConditionChanged' // (Object) - {hull, engine, lifeSupport} percentages
'shipNameChanged'    // (string) - Ship name
'upgradesChanged'    // (Array) - Installed upgrade IDs
'quirksChanged'      // (Array) - Ship quirk IDs

// World state
'priceKnowledgeChanged' // (Object) - Price knowledge database
'activeEventsChanged'   // (Array) - Active economic events

// UI state
'dialogueChanged'    // (Object) - Current dialogue state
'conditionWarning'   // (Array) - Warning objects for low condition systems
```

### Event Subscription Pattern

```javascript
function MyComponent() {
  // Subscribe to multiple events
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');
  const cargo = useGameEvent('cargoChanged');
  
  // Derived state calculations
  const cargoUsed = cargo?.reduce((sum, stack) => sum + stack.qty, 0) ?? 0;
  
  return (
    <div>
      <div>Credits: {credits}</div>
      <div>Fuel: {fuel}%</div>
      <div>Cargo Used: {cargoUsed}</div>
    </div>
  );
}
```

## Action System

### Available Actions

The useGameAction hook provides these methods:

```javascript
const {
  // Trading actions
  buyGood,           // (goodType, quantity, price) => result
  sellGood,          // (stackIndex, quantity, price) => result
  
  // Ship actions
  refuel,            // (amount) => result
  repair,            // (systemType, amount) => result
  purchaseUpgrade,   // (upgradeId) => result
  
  // Navigation actions
  jump,              // (targetSystemId) => result
  
  // Cargo actions
  moveToHiddenCargo, // (goodType, quantity) => result
  moveToRegularCargo, // (goodType, quantity) => result
  
  // Information actions
  purchaseIntelligence, // (systemId) => result
} = useGameAction();
```

### Action Usage Pattern

```javascript
function RefuelPanel() {
  const fuel = useGameEvent('fuelChanged');
  const credits = useGameEvent('creditsChanged');
  const { refuel } = useGameAction();
  
  const [amount, setAmount] = useState(0);
  
  const handleRefuel = () => {
    const result = refuel(amount);
    if (!result.success) {
      console.error('Refuel failed:', result.reason);
    }
  };
  
  return (
    <div>
      <div>Current Fuel: {fuel}%</div>
      <div>Credits: {credits}</div>
      <input 
        type="number" 
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={handleRefuel}>Refuel</button>
    </div>
  );
}
```

## Testing with Bridge Pattern

### Component Testing

Test components by mocking the hooks:

```javascript
import { vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock the hooks
vi.mock('../hooks/useGameEvent', () => ({
  useGameEvent: vi.fn()
}));

vi.mock('../hooks/useGameAction', () => ({
  useGameAction: vi.fn()
}));

test('displays credits correctly', () => {
  // Setup mock return values
  useGameEvent.mockReturnValue(1000); // credits
  useGameAction.mockReturnValue({ buyGood: vi.fn() });
  
  render(<TradePanel />);
  
  expect(screen.getByText('Credits: 1000')).toBeInTheDocument();
});
```

### Integration Testing

Test the full bridge by providing a real GameStateManager:

```javascript
import { GameStateManager } from '../game/state/game-state-manager';
import { GameProvider } from '../context/GameContext';

test('integration with GameStateManager', () => {
  const gameStateManager = new GameStateManager(starData, wormholeData);
  gameStateManager.initNewGame();
  
  render(
    <GameProvider gameStateManager={gameStateManager}>
      <TradePanel />
    </GameProvider>
  );
  
  // Test real interactions
  fireEvent.click(screen.getByText('Buy Grain'));
  
  expect(gameStateManager.getState().player.credits).toBeLessThan(1000);
});
```

## Common Patterns

### Loading States

Handle loading states when events haven't fired yet:

```javascript
function ShipStatus() {
  const condition = useGameEvent('shipConditionChanged');
  
  if (!condition) {
    return <div>Loading ship status...</div>;
  }
  
  return (
    <div>
      <div>Hull: {condition.hull}%</div>
      <div>Engine: {condition.engine}%</div>
      <div>Life Support: {condition.lifeSupport}%</div>
    </div>
  );
}
```

### Derived State

Calculate derived values from multiple events:

```javascript
function CargoSummary() {
  const cargo = useGameEvent('cargoChanged');
  const cargoCapacity = useGameEvent('cargoCapacityChanged');
  
  const cargoUsed = cargo?.reduce((sum, stack) => sum + stack.qty, 0) ?? 0;
  const cargoRemaining = (cargoCapacity ?? 50) - cargoUsed;
  
  return (
    <div>
      <div>Used: {cargoUsed}/{cargoCapacity}</div>
      <div>Remaining: {cargoRemaining}</div>
    </div>
  );
}
```

### Conditional Rendering

Use event data for conditional rendering:

```javascript
function UpgradeButton({ upgradeId }) {
  const credits = useGameEvent('creditsChanged');
  const upgrades = useGameEvent('upgradesChanged');
  const { purchaseUpgrade } = useGameAction();
  
  const isInstalled = upgrades?.includes(upgradeId) ?? false;
  const canAfford = (credits ?? 0) >= UPGRADE_COSTS[upgradeId];
  
  if (isInstalled) {
    return <span>✓ Installed</span>;
  }
  
  return (
    <button 
      disabled={!canAfford}
      onClick={() => purchaseUpgrade(upgradeId)}
    >
      Purchase (₡{UPGRADE_COSTS[upgradeId]})
    </button>
  );
}
```

## Benefits

### 1. Single Source of Truth
- All game state lives in GameStateManager
- No state duplication or synchronization issues
- Consistent state across all components

### 2. Clean Separation of Concerns
- Business logic stays in GameStateManager
- UI components focus on presentation
- Easy to test each layer independently

### 3. Reactive Updates
- Components automatically re-render when relevant state changes
- No manual state synchronization required
- Efficient updates through React's reconciliation

### 4. Type Safety
- Events are strongly typed
- Actions return structured results
- Clear interfaces between layers

### 5. Testability
- Components can be tested with mocked hooks
- GameStateManager can be tested independently
- Integration tests verify the bridge works correctly

## Migration Checklist

When converting components to use Bridge Pattern:

- [ ] Remove direct `gameStateManager.getState()` calls
- [ ] Replace with appropriate `useGameEvent()` subscriptions
- [ ] Use `useGameAction()` for triggering state changes
- [ ] Handle undefined state during initialization
- [ ] Remove any React state that duplicates game state
- [ ] Update tests to mock the bridge hooks
- [ ] Verify component re-renders on state changes

## Troubleshooting

### Component Not Re-rendering

**Problem**: Component doesn't update when game state changes.

**Solution**: Ensure you're using `useGameEvent()` instead of direct state access:

```javascript
// ❌ Won't re-render
const gameStateManager = useGameState();
const credits = gameStateManager.getState().player.credits;

// ✅ Will re-render
const credits = useGameEvent('creditsChanged');
```

### Stale State in Event Handlers

**Problem**: Event handlers use old state values.

**Solution**: Use `useGameAction()` instead of capturing state in closures:

```javascript
// ❌ May use stale state
const credits = useGameEvent('creditsChanged');
const handleBuy = () => {
  if (credits >= price) { // May be stale
    // ...
  }
};

// ✅ Always uses current state
const { buyGood } = useGameAction();
const handleBuy = () => {
  const result = buyGood('grain', 1, price);
  if (!result.success) {
    console.error(result.reason); // Includes current state validation
  }
};
```

### Performance Issues

**Problem**: Too many re-renders or expensive calculations.

**Solution**: Use React.memo and useMemo for optimization:

```javascript
const ExpensiveComponent = React.memo(function ExpensiveComponent() {
  const cargo = useGameEvent('cargoChanged');
  
  const expensiveCalculation = useMemo(() => {
    return cargo?.reduce((total, stack) => {
      // Expensive calculation
      return total + calculateValue(stack);
    }, 0) ?? 0;
  }, [cargo]);
  
  return <div>Total Value: {expensiveCalculation}</div>;
});
```

## Conclusion

The Bridge Pattern is essential for maintaining clean architecture in Tramp
Freighter Blues. By following these patterns and rules, you ensure:

- Maintainable and testable code
- Consistent state management
- Clear separation between UI and business logic
- Efficient React re-rendering
- Type-safe interfaces

Always use `useGameEvent()` for state subscriptions and `useGameAction()` for
state mutations. Never access GameStateManager directly from React components.