---
inclusion: always
---

# JavaScript Coding Standards

## Strict Mode

**REQUIRED: All JavaScript files MUST begin with `"use strict";`**

```javascript
'use strict';

// Module code follows...
```

This enables strict mode which:

- Catches common coding mistakes and throws exceptions
- Prevents use of problematic language features
- Makes code run faster by enabling optimizations
- Prevents accidental global variable creation

## Performance Best Practices

### Object Allocation in Hot Loops

**CRITICAL: Never create objects inside frequently-executed loops unless absolutely necessary**

```javascript
// BAD - Creates new object on every iteration
for (let i = 0; i < 1000; i++) {
  const point = { x: i, y: i * 2 };
  processPoint(point);
}

// GOOD - Reuse object
const point = { x: 0, y: 0 };
for (let i = 0; i < 1000; i++) {
  point.x = i;
  point.y = i * 2;
  processPoint(point);
}

// GOOD - Use primitives when possible
for (let i = 0; i < 1000; i++) {
  processPoint(i, i * 2);
}
```

Hot loops include:

- Animation frames (requestAnimationFrame callbacks)
- Event handlers that fire frequently (mousemove, scroll, resize)
- Rendering loops
- Large data processing iterations

### Array and String Operations

**Avoid creating intermediate arrays/strings in performance-critical code**

```javascript
// BAD - Creates intermediate arrays
const result = array
  .map((x) => x * 2)
  .filter((x) => x > 10)
  .map((x) => x.toString());

// GOOD - Single pass when performance matters
const result = [];
for (let i = 0; i < array.length; i++) {
  const doubled = array[i] * 2;
  if (doubled > 10) {
    result.push(doubled.toString());
  }
}
```

**Note**: Readability often trumps micro-optimizations. Use chaining for clarity unless profiling shows it's a bottleneck.

### Function Declarations

**Hoist function declarations to avoid repeated creation**

```javascript
// BAD - Creates new function on every call
function processItems(items) {
  items.forEach(function (item) {
    // process item
  });
}

// GOOD - Function declared once
function processItem(item) {
  // process item
}

function processItems(items) {
  items.forEach(processItem);
}
```

### Cache DOM Queries

**Never query the DOM repeatedly in loops or frequent operations**

```javascript
// BAD - Queries DOM on every iteration
for (let i = 0; i < 100; i++) {
  document.getElementById('status').textContent = i;
}

// GOOD - Cache the element
const statusElement = document.getElementById('status');
for (let i = 0; i < 100; i++) {
  statusElement.textContent = i;
}
```

**UI Manager Pattern**: Cache all frequently-accessed DOM elements in an object during initialization:

```javascript
const ui = {
  status: document.getElementById('status'),
  credits: document.getElementById('credits'),
  fuel: document.getElementById('fuel'),
};

// Later use cached references
ui.status.textContent = 'Ready';
ui.credits.textContent = player.credits;
```

## Code Organization

### Module Pattern

**Use revealing module pattern for encapsulation**

```javascript
'use strict';

const GameModule = (function () {
  // Private variables
  let privateState = 0;

  // Private functions
  function privateHelper() {
    return privateState * 2;
  }

  // Public API
  return {
    publicMethod: function () {
      return privateHelper();
    },

    publicProperty: 42,
  };
})();
```

### Avoid Global Pollution

**Minimize global variables - use namespacing**

```javascript
// BAD - Multiple globals
let playerCredits = 0;
let playerFuel = 100;
let currentSystem = 'Sol';

// GOOD - Single namespace
const Game = {
  player: {
    credits: 0,
    fuel: 100,
    currentSystem: 'Sol',
  },
};
```

## Variable Declarations

### Use const and let, Never var

```javascript
// GOOD - Immutable reference
const MAX_FUEL = 100;
const config = { speed: 10 };

// GOOD - Mutable when needed
let currentFuel = 50;

// BAD - Never use var
var oldStyle = 'no';
```

### Declare Variables at Appropriate Scope

```javascript
// BAD - Unnecessarily wide scope
let result;
if (condition) {
  result = calculateValue();
}

// GOOD - Narrow scope
if (condition) {
  const result = calculateValue();
  useResult(result);
}
```

## Function Design

### Keep Functions Small and Focused

**Each function should do one thing well**

```javascript
// BAD - Does too much
function updateGameState(player, system, time) {
  player.fuel -= calculateFuelCost(system);
  player.credits += calculateProfit(system);
  player.location = system;
  updateUI(player);
  saveGame(player);
  logAnalytics(player, system);
}

// GOOD - Separated concerns
function consumeFuel(player, system) {
  player.fuel -= calculateFuelCost(system);
}

function updatePlayerLocation(player, system) {
  player.location = system;
}

function processJump(player, system) {
  consumeFuel(player, system);
  updatePlayerLocation(player, system);
  return player;
}
```

### Pure Functions When Possible

**Prefer functions without side effects**

```javascript
// GOOD - Pure function
function calculatePrice(basePrice, modifier) {
  return Math.round(basePrice * modifier);
}

// ACCEPTABLE - Side effects clearly named
function applyPriceModifier(priceData, modifier) {
  priceData.current = Math.round(priceData.base * modifier);
}
```

### Early Returns

**Use early returns to reduce nesting**

```javascript
// BAD - Deep nesting
function processTransaction(player, amount) {
  if (player) {
    if (amount > 0) {
      if (player.credits >= amount) {
        player.credits -= amount;
        return true;
      }
    }
  }
  return false;
}

// GOOD - Early returns
function processTransaction(player, amount) {
  if (!player) return false;
  if (amount <= 0) return false;
  if (player.credits < amount) return false;

  player.credits -= amount;
  return true;
}
```

## Error Handling

### Validate Inputs

**Check preconditions and fail fast**

```javascript
function calculateDistance(system1, system2) {
  if (!system1 || !system2) {
    throw new Error('Both systems required for distance calculation');
  }

  const dx = system1.x - system2.x;
  const dy = system1.y - system2.y;
  const dz = system1.z - system2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
```

### Handle Edge Cases

**Consider null, undefined, empty arrays, zero, negative numbers**

```javascript
function getAveragePrice(prices) {
  if (!prices || prices.length === 0) {
    return 0;
  }

  const sum = prices.reduce((acc, price) => acc + price, 0);
  return sum / prices.length;
}
```

### Avoid Defensive Null Checks for Guaranteed-to-Exist Variables

**CRITICAL: Do not add defensive null checks for variables that should always exist after initialization**

This is a common LLM-ism that adds unnecessary defensive programming for variables that are guaranteed to exist by design.

**ANTI-PATTERN: Optional chaining (?.) and nullish coalescing (??) for required properties**

Using `?.` or `??` on properties that MUST exist after initialization is a code smell. It silently hides bugs instead of exposing them during development.

```javascript
// BAD - Defensive check for variable that should always exist
class UIManager {
  constructor() {
    this.cachedButtons = document.querySelectorAll('.btn');
  }

  updateButtons() {
    // Silent failure hides initialization bugs
    if (!this.cachedButtons) return;

    this.cachedButtons.forEach((btn) => updateButton(btn));
  }
}

// BAD - Optional chaining for required property
class GameStateManager {
  getPlayer() {
    return this.state?.player; // Silently returns undefined if state is null
  }

  getCredits() {
    return this.state?.player?.credits ?? 0; // Returns 0 instead of exposing bug
  }
}

// GOOD - Fail loudly if initialization failed
class UIManager {
  constructor() {
    this.cachedButtons = document.querySelectorAll('.btn');
  }

  updateButtons() {
    // Throw error to expose initialization bugs immediately
    if (!this.cachedButtons) {
      throw new Error(
        'Buttons not initialized - constructor must cache DOM elements'
      );
    }

    this.cachedButtons.forEach((btn) => updateButton(btn));
  }
}

// BEST - No check needed if guaranteed by design
class UIManager {
  constructor() {
    this.cachedButtons = document.querySelectorAll('.btn');
    if (this.cachedButtons.length === 0) {
      throw new Error('No buttons found in DOM');
    }
  }

  updateButtons() {
    // No check needed - constructor guarantees cachedButtons exists
    this.cachedButtons.forEach((btn) => updateButton(btn));
  }
}

// GOOD - Fail loudly for required properties
class GameStateManager {
  getPlayer() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getPlayer called before game initialization'
      );
    }
    return this.state.player; // No optional chaining - state MUST exist
  }

  getCredits() {
    if (!this.state) {
      throw new Error(
        'Invalid state: getCredits called before game initialization'
      );
    }
    return this.state.player.credits; // Throws if player or credits missing
  }
}
```

**When to use defensive checks:**

- External data (user input, API responses, localStorage)
- Optional parameters
- Data from untrusted sources

**When NOT to use defensive checks:**

- Variables initialized in constructor
- Required parameters (use validation instead)
- Internal state that should always be valid
- Variables set by initialization methods called in constructor

### Throw Exceptions for "Impossible" Conditions

**CRITICAL: When encountering conditions that "can't happen" in valid program execution, throw exceptions immediately**

Silent failures or defensive returns hide critical bugs. If internal state is invalid, the program should fail loudly to expose the root cause.

```javascript
// BAD - Silent failure hides corrupted state
function refreshTradePanel() {
  const state = gameStateManager.getState();
  const system = starData.find((s) => s.id === state.player.currentSystem);

  if (!system) return; // Silently fails - bug goes unnoticed

  renderMarketGoods(system);
}

// GOOD - Fail loudly to expose state corruption
function refreshTradePanel() {
  const state = gameStateManager.getState();
  const system = starData.find((s) => s.id === state.player.currentSystem);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
    );
  }

  renderMarketGoods(system);
}
```

**When to throw exceptions:**

- Internal state is corrupted (invalid IDs, missing required data)
- Invariants are violated (array index out of bounds when size was checked)
- Required data structures are malformed
- "Impossible" code paths are reached (unreachable switch cases)

**Benefits:**

- Bugs are discovered immediately during development
- Stack traces point to the exact location of state corruption
- Prevents cascading failures from invalid state
- Makes debugging significantly easier

**Example - Invalid System ID:**

```javascript
// Player's current system should always be valid
const currentSystem = starData.find((s) => s.id === state.player.currentSystem);
if (!currentSystem) {
  throw new Error(
    `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
  );
}
```

**Example - Unreachable Code Path:**

```javascript
function getSystemType(system) {
  switch (system.type) {
    case 'G':
      return 'Yellow Dwarf';
    case 'M':
      return 'Red Dwarf';
    case 'K':
      return 'Orange Dwarf';
    default:
      throw new Error(`Unknown spectral type: ${system.type}`);
  }
}
```

## Naming Conventions

### Clear, Descriptive Names

```javascript
// BAD
let d = 10;
let calc = (a, b) => a * b;

// GOOD
let distanceInLightYears = 10;
let calculateFuelCost = (distance, efficiency) => distance * efficiency;
```

### Naming Patterns

- **Variables**: camelCase (`playerCredits`, `currentSystem`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FUEL`, `BASE_PRICE`)
- **Functions**: camelCase, verb-based (`calculatePrice`, `updateUI`)
- **Classes/Constructors**: PascalCase (`GameState`, `TradingSystem`)
- **Private members**: prefix with underscore (`_internalState`)
- **Boolean variables**: use is/has/can prefix (`isValid`, `hasStation`, `canJump`)

## Comments and Documentation

### Function Documentation

**Document public functions with purpose, parameters, and return values**

```javascript
/**
 * Calculates the fuel cost for jumping between two systems.
 * Uses Euclidean distance scaled by ship efficiency.
 *
 * @param {Object} fromSystem - Origin system with x, y, z coordinates
 * @param {Object} toSystem - Destination system with x, y, z coordinates
 * @param {number} shipEfficiency - Ship's fuel efficiency multiplier
 * @returns {number} Fuel units required for the jump
 */
function calculateJumpCost(fromSystem, toSystem, shipEfficiency) {
  const distance = calculateDistance(fromSystem, toSystem);
  return distance * shipEfficiency;
}
```

### Explain Why, Not What

```javascript
// BAD - Describes what the code does (obvious)
// Multiply price by 1.5
const adjustedPrice = basePrice * 1.5;

// GOOD - Explains why
// Station markup is 50% above base commodity price
const adjustedPrice = basePrice * STATION_MARKUP_MULTIPLIER;

// GOOD - Explains non-obvious behavior
// Use floor instead of round to prevent players from exploiting
// fractional credit gains through repeated small transactions
const finalPrice = Math.floor(basePrice * modifier);
```

### TODO Comments

**Use TODO comments for future work, with context**

```javascript
// TODO: Add distance-based price variation once economy system is implemented
// Currently using flat base prices for all systems

// TODO: Optimize this loop - profiling shows 15% of frame time spent here
// Consider spatial partitioning or caching results
```

### Spec References

**Any references to properties or requirements in docs must also include the spec name. Otherwise, we don't know which spec provides the property**

## Type Safety (Runtime Checks)

### Defensive Programming

**Check types when accepting external data**

```javascript
function loadGameState(savedData) {
  if (typeof savedData !== 'object' || savedData === null) {
    throw new Error('Invalid save data: expected object');
  }

  if (typeof savedData.player?.credits !== 'number') {
    throw new Error('Invalid save data: player.credits must be a number');
  }

  // Continue validation...
}
```

### Type Coercion Awareness

```javascript
// BAD - Implicit coercion can cause bugs
if (value) {
  /* ... */
} // Fails for 0, "", false

// GOOD - Explicit checks
if (value !== null && value !== undefined) {
  /* ... */
}
if (typeof value === 'number') {
  /* ... */
}
if (Array.isArray(value)) {
  /* ... */
}
```

## Testing Considerations

### Write Testable Code

**Separate pure logic from side effects**

```javascript
// GOOD - Pure calculation, easy to test
function calculateProfit(buyPrice, sellPrice, quantity) {
  return (sellPrice - buyPrice) * quantity;
}

// GOOD - Side effects isolated
function executeTransaction(player, profit) {
  player.credits += profit;
  saveGame(player);
  updateUI(player);
}
```

### Avoid Hidden Dependencies

```javascript
// BAD - Hidden global dependency
function getCurrentPrice() {
  return globalGameState.prices[globalGameState.currentSystem];
}

// GOOD - Explicit dependencies
function getCurrentPrice(gameState) {
  return gameState.prices[gameState.currentSystem];
}
```

### Clean Test Output

**CRITICAL: Tests MUST produce clean output with no stderr messages**

Tests should not pollute the console with error messages, warnings, or debug output. This makes it difficult to identify real issues and creates noise in CI/CD pipelines.

**Guidelines:**

1. **Mock console methods when testing error handling**
2. **Capture and verify expected errors instead of letting them print**
3. **Restore mocked console methods in finally blocks**
4. **Use test assertions to verify error behavior**

```javascript
// BAD - Lets errors print to stderr during test
it('should handle invalid input', async () => {
  await functionThatLogsErrors(invalidInput); // Prints to stderr
  expect(result).toBe(expectedValue);
});

// GOOD - Captures errors and verifies them
it('should handle invalid input', async () => {
  // Mock console.error to capture expected errors
  const originalConsoleError = console.error;
  const errorMessages = [];
  console.error = (...args) => {
    errorMessages.push(args);
  };

  try {
    await functionThatLogsErrors(invalidInput);

    // Verify the error was logged
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0][0]).toContain('Expected error message');

    // Verify the function handled the error correctly
    expect(result).toBe(expectedValue);
  } finally {
    // Always restore console.error
    console.error = originalConsoleError;
  }
});
```

**When to mock console methods:**

- Testing error handling that logs to console.error
- Testing warning messages that log to console.warn
- Testing debug output that logs to console.log
- Any test that intentionally triggers errors or warnings

**Benefits of clean test output:**

- Easy to spot real failures in test runs
- Clean CI/CD logs
- Professional test reports
- Easier debugging when tests fail
- No confusion about whether errors are expected or actual failures

**Test output checklist:**

- [ ] No stderr messages during test runs
- [ ] No console.error output (unless explicitly testing console output)
- [ ] No console.warn output
- [ ] No console.log debug statements left in tests
- [ ] Expected errors are captured and verified, not printed

## Browser Compatibility

### Use Standard APIs

**Stick to well-supported JavaScript features**

- Avoid experimental features
- Use MDN to verify browser support
- Target Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Polyfills Not Required

**Modern browser targets mean we can use:**

- `const` and `let`
- Arrow functions
- Template literals
- Destructuring
- `Array.prototype` methods (map, filter, reduce, etc.)
- `Object.assign`, spread operator
- Promises and async/await
- `localStorage` API

## Security Considerations

### Sanitize User Input

**Never trust user input, even from localStorage**

```javascript
function loadPlayerName(savedName) {
  // Sanitize to prevent XSS if displayed in HTML
  const sanitized = savedName
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 50); // Limit length

  return sanitized;
}
```

### Avoid eval and Function Constructor

**Never use eval() or new Function() with user data**

```javascript
// BAD - Security risk
const result = eval(userInput);

// GOOD - Parse safely
const result = JSON.parse(userInput);
```

## localStorage Best Practices

### Versioning

**Always version saved data for migration**

```javascript
const SAVE_VERSION = 2;

function saveGame(gameState) {
  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state: gameState,
  };

  localStorage.setItem('tramp-freighter-save', JSON.stringify(saveData));
}

function loadGame() {
  const saved = JSON.parse(localStorage.getItem('tramp-freighter-save'));

  if (saved.version !== SAVE_VERSION) {
    return migrateOldSave(saved);
  }

  return saved.state;
}
```

### Error Handling

**localStorage can fail (quota exceeded, private browsing)**

```javascript
function saveGame(gameState) {
  try {
    const saveData = JSON.stringify(gameState);
    localStorage.setItem('game-save', saveData);
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    showErrorMessage('Unable to save game. Storage may be full.');
    return false;
  }
}
```

## Code Review Checklist

Before committing code, verify:

- [ ] `"use strict";` at top of file
- [ ] No object allocation in hot loops
- [ ] DOM queries cached appropriately
- [ ] Constants defined in `game-constants.js`
- [ ] Functions are small and focused
- [ ] Early returns used to reduce nesting
- [ ] Input validation for public functions
- [ ] Comments explain why, not what
- [ ] No magic numbers (use named constants)
- [ ] No global variables (use namespacing)
- [ ] Error cases handled gracefully
- [ ] Code is testable (pure functions, explicit dependencies)
- [ ] Browser compatibility considered
- [ ] localStorage errors handled

## Performance Profiling

**When optimizing, always measure first**

```javascript
// Use browser DevTools Performance tab
// Or simple timing for specific functions:

console.time('expensive-operation');
expensiveOperation();
console.timeEnd('expensive-operation');
```

**Optimization priorities:**

1. Fix algorithmic inefficiencies (O(n²) → O(n))
2. Reduce object allocation in hot paths
3. Cache expensive calculations
4. Minimize DOM manipulation
5. Defer non-critical work

Remember: Premature optimization is the root of all evil. Write clear code first, optimize when profiling shows a need.
