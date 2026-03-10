---
inclusion: fileMatch
fileMatchPattern: "**/*.jsx"
---

# React-Specific Coding Standards

## Component Structure

**Functional components with hooks are the standard**

```javascript
// GOOD - Functional component with hooks
function TradePanel({ onClose }) {
  const gameStateManager = useGameState();
  const cargo = useGameEvent('cargoChanged');
  const { buyGood, sellGood } = useGameAction();

  const handleBuy = () => {
    // Handler logic
  };

  return <div className="trade-panel">{/* JSX */}</div>;
}
```

## Component File Organization

**Standard order for component file contents:**

1. Imports (React, hooks, components, utilities, styles)
2. Component function declaration
3. State declarations (useState, useReducer)
4. Context access (useContext, useGameState)
5. Event subscriptions (useGameEvent)
6. Actions (useGameAction)
7. Effects (useEffect)
8. Event handlers
9. Derived values (useMemo, calculations)
10. Return statement with JSX

## Bridge Pattern Usage

**Always use the Bridge Pattern to access game state**

```javascript
// GOOD - Use Bridge Pattern hooks
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

// GOOD - Use useGameAction for triggering actions
function RefuelButton() {
  const { refuel } = useGameAction();
  return <button onClick={() => refuel(50)}>Refuel</button>;
}
```

## Hook Rules

**Follow React's Rules of Hooks**

1. Only call hooks at the top level (not in loops, conditions, or nested functions)
2. Only call hooks from React functions (components or custom hooks)
3. Custom hooks must start with "use"

## State Management

**Use local state for UI-only state, GameCoordinator for game state**

```javascript
// GOOD - Local state for UI concerns
function RefuelPanel() {
  const [sliderValue, setSliderValue] = useState(0); // UI state
  const fuel = useGameEvent('fuelChanged'); // Game state
  const { refuel } = useGameAction();

  const handleRefuel = () => {
    refuel(sliderValue);
    setSliderValue(0); // Reset UI state
  };

  return (
    <input
      type="range"
      value={sliderValue}
      onChange={(e) => setSliderValue(Number(e.target.value))}
    />
  );
}
```

## Effect Dependencies

**Always specify correct dependencies for useEffect**

```javascript
// GOOD - Correct dependencies
function TradePanel({ systemId }) {
  const gameStateManager = useGameState();

  useEffect(() => {
    const prices = gameStateManager.getKnownPrices(systemId);
    // Use prices
  }, [gameStateManager, systemId]); // Correct dependencies
}
```

## Component Props

**Destructure props in function signature**

```javascript
// GOOD - Destructured props
function TradePanel({ onClose, systemId }) {
  return <button onClick={onClose}>Close</button>;
}
```

## Event Handlers

**Use arrow functions for inline handlers, named functions for complex logic**

```javascript
// GOOD - Simple inline handler
function Button() {
  return <button onClick={() => console.log('clicked')}>Click</button>;
}

// GOOD - Named handler for complex logic
function TradePanel() {
  const handleBuy = () => {
    // Complex logic
    validateTransaction();
    updateInventory();
    showNotification();
  };

  return <button onClick={handleBuy}>Buy</button>;
}
```

## Lists and Keys

**Always provide stable keys for lists**

```javascript
// GOOD - Stable unique key
function CargoList({ cargo }) {
  return (
    <ul>
      {cargo.map((item, index) => (
        <li key={`${item.type}-${item.purchaseDate}-${index}`}>
          {item.type}: {item.quantity}
        </li>
      ))}
    </ul>
  );
}
```

## CSS and Styling

**Prefer existing CSS classes, use CSS modules for new component-specific styles**

```javascript
// GOOD - Use existing CSS classes
function TradePanel() {
  return <div className="trade-panel">{/* Content */}</div>;
}

// GOOD - CSS modules for new component-specific styles
import styles from './TradePanel.module.css';

function TradePanel() {
  return <div className={styles.container}>{/* Content */}</div>;
}
```

## Error Boundaries

**Wrap features in Error Boundaries**

```javascript
// GOOD - Error boundary around feature
function App() {
  return (
    <ErrorBoundary>
      <StarMapCanvas />
    </ErrorBoundary>
  );
}
```

## React Anti-Patterns to Avoid

1. **Don't mutate state directly**
2. **Don't use index as key for dynamic lists**
3. **Don't create components inside components**
4. **Don't forget cleanup in useEffect**
5. **Don't duplicate game state in React state**
6. **Don't use isMountedRef pattern - React handles unmounted components gracefully**

```javascript
// BAD - isMountedRef anti-pattern
const isMountedRef = useRef(true);
useEffect(() => {
  fetchData().then(data => {
    if (isMountedRef.current) setState(data);
  });
  return () => { isMountedRef.current = false; };
}, []);

// GOOD - Trust React's cleanup
useEffect(() => {
  fetchData().then(setState); // React ignores updates on unmounted components
}, []);
```