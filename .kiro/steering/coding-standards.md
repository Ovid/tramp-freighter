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

**Note**: React JSX files (.jsx) do not require explicit `"use strict";` as they are automatically in strict mode when compiled by Vite.

## Task Completion Standards

### Test Suite Requirements

**CRITICAL: No task is complete until the entire test suite passes**

```bash
npm test
```

Every task must leave the codebase in a working state with all tests passing. This ensures:

- No regressions are introduced
- New functionality integrates correctly
- The system remains stable and deployable

### Self-Contained Tasks

**CRITICAL: All tasks must be self-contained and leave the system in a working or improved state**

Do NOT:
- Schedule tests for a later task
- Leave new components unintegrated "to be hooked up later"
- Create incomplete features that break existing functionality
- Leave the system in a transition state

DO:
- Complete all aspects of a feature in the current task
- Write and pass tests as part of the task
- Integrate new components immediately
- Ensure the system is stable before marking the task complete

**Why this matters**: Projects may be paused and resumed later. When returning to a project, it must be clear that the system is stable, not in an unstable transition state.

### Single Purpose Per File

**Each .js file should have a single, clear purpose**

```javascript
// GOOD - Single purpose: trade panel controller
// js/controllers/trade.js
class TradePanelController {
  // All trade panel logic
}

// BAD - Multiple unrelated purposes in one file
// js/game-stuff.js
class TradePanelController { }
class RefuelPanelController { }
function calculateDistance() { }
```

Benefits:
- Easier to locate functionality
- Clearer dependencies
- Better testability
- Simpler code review

### Avoid Unnecessary Wrapper Functions

**Don't create wrapper functions that just call another function without adding value**

```javascript
// BAD - Unnecessary wrapper
function getPlayerCredits(state) {
  return state.player.credits;
}

// GOOD - Direct access
const credits = state.player.credits;

// BAD - Wrapper adds no value
function updateHUD() {
  hudManager.update();
}

// GOOD - Call directly
hudManager.update();

// GOOD - Wrapper adds value (transformation, validation, error handling)
function getPlayerCredits(state) {
  if (!state?.player) {
    throw new Error('Invalid state: player not initialized');
  }
  return Math.floor(state.player.credits); // Ensures integer
}
```

**When wrappers ARE appropriate:**
- Adding validation or error handling
- Transforming data format
- Providing a stable API over changing implementation
- Abstracting complex operations into a clear interface

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

### Controller Pattern

**Use focused controllers for UI panel management**

Controllers encapsulate all logic for a single UI panel, improving maintainability and testability. Each controller receives its dependencies through constructor injection.

```javascript
'use strict';

/**
 * Controller for managing the trade panel UI and interactions.
 * Handles displaying market goods, cargo stacks, and buy/sell transactions.
 */
class TradePanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!elements.tradePanel) {
      throw new Error('TradePanelController: tradePanel element required');
    }
    if (!gameStateManager) {
      throw new Error('TradePanelController: gameStateManager required');
    }

    // Store dependencies
    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;

    // Bind event handlers
    this.elements.tradeCloseBtn.addEventListener('click', () => this.hide());
  }

  show() {
    this.elements.tradePanel.classList.add('visible');
    this.refreshTradePanel();
  }

  hide() {
    this.elements.tradePanel.classList.remove('visible');
  }

  refreshTradePanel() {
    const state = this.gameStateManager.getState();
    const system = this.starData.find(
      (s) => s.id === state.player.currentSystem
    );

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
      );
    }

    this.renderMarketGoods(system);
    this.renderCargoStacks(state.ship.cargo);
  }

  handleBuyGood(goodType, quantity) {
    // Transaction logic
  }

  handleSellStack(stackIndex, quantity) {
    // Transaction logic
  }

  // Private helper methods
  renderMarketGoods(system) {
    // Rendering logic
  }

  renderCargoStacks(cargo) {
    // Rendering logic
  }
}
```

**Controller Pattern Benefits:**

- **Separation of concerns**: Each controller manages one panel
- **Testability**: Controllers can be tested in isolation
- **Dependency injection**: Dependencies are explicit and passed in constructor
- **Maintainability**: Panel logic is contained in a single file

**UIManager as Coordinator:**

The UIManager creates controller instances and delegates panel operations to them:

```javascript
class UIManager {
  constructor(gameStateManager, starData, informationBroker) {
    // Cache all DOM elements
    this.elements = this.cacheElements();

    // Create panel controllers
    this.tradeController = new TradePanelController(
      {
        tradePanel: this.elements.tradePanel,
        tradeSystemName: this.elements.tradeSystemName,
        tradeCloseBtn: this.elements.tradeCloseBtn,
        // ... other trade panel elements
      },
      gameStateManager,
      starData
    );

    this.refuelController = new RefuelPanelController(
      {
        refuelPanel: this.elements.refuelPanel,
        // ... refuel panel elements
      },
      gameStateManager,
      starData
    );

    // ... other controllers
  }

  showTradePanel() {
    this.tradeController.show();
  }

  hideTradePanel() {
    this.tradeController.hide();
  }

  // UIManager retains HUD, notifications, and quick access logic
  updateHUD() {
    // HUD update logic stays in UIManager
  }
}
```

### Module Organization

**Organize code by feature and responsibility**

```
js/
├── controllers/           # UI panel controllers
│   ├── trade.js
│   ├── refuel.js
│   ├── repair.js
│   ├── upgrades.js
│   ├── info-broker.js
│   └── cargo-manifest.js
├── views/                 # Rendering modules
│   └── starmap/
│       ├── starmap.js     # Main coordinator
│       ├── scene.js       # Scene initialization
│       ├── stars.js       # Star rendering
│       ├── wormholes.js   # Wormhole rendering
│       └── interaction.js # User interaction
├── data/                  # Static game data
│   ├── star-data.js
│   └── wormhole-data.js
├── utils/                 # Utility functions
│   ├── seeded-random.js
│   └── string-utils.js
├── game-constants.js      # Configuration objects
├── game-state.js          # State management
├── game-trading.js        # Trading logic
├── game-navigation.js     # Navigation logic
├── game-ui.js             # UI coordinator
└── game-animation.js      # Animation system
```

**Module Organization Principles:**

- **Controllers**: One file per UI panel controller
- **Views**: Rendering logic organized by visual component
- **Data**: Static data separated from logic
- **Utils**: Reusable utility functions
- **Core systems**: Game logic modules at root level

**Starmap Module Coordinator Pattern:**

```javascript
'use strict';

import { initializeScene } from './starmap/scene.js';
import { createStarSprites } from './starmap/stars.js';
import { createWormholeLines } from './starmap/wormholes.js';
import { setupInteraction } from './starmap/interaction.js';

/**
 * Initializes and coordinates all starmap modules.
 * Manages shared state and orchestrates rendering.
 */
export function initializeStarmap(container, starData, wormholeData) {
  // Initialize scene
  const { scene, camera, renderer, controls } = initializeScene(container);

  // Create visual elements
  const starSprites = createStarSprites(scene, starData);
  const wormholeLines = createWormholeLines(scene, wormholeData);

  // Setup interaction
  const interaction = setupInteraction(camera, starSprites, (systemId) => {
    // Selection callback
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    scene,
    camera,
    renderer,
    starSprites,
    wormholeLines,
    interaction,
  };
}
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

**Before writing a defensive check, ask: "Is this variable guaranteed to exist?"**

Check the code path:
1. Is it initialized in the constructor? → No check needed
2. Is it set by an initialization method called in constructor? → No check needed
3. Is it a required parameter that should be validated once at entry? → Validate at entry, not at every use
4. Is it internal state that should always be valid? → No check needed, throw if invalid

**When to use defensive checks:**

- External data (user input, API responses, localStorage)
- Optional parameters explicitly marked as optional
- Data from untrusted sources
- Public API boundaries where callers might pass invalid data

**When NOT to use defensive checks:**

- Variables initialized in constructor
- Required parameters (validate once at function entry, not at every use)
- Internal state that should always be valid
- Variables set by initialization methods called in constructor
- Properties that are guaranteed to exist by design

**Example - Trace the guarantee:**

```javascript
class GameStateManager {
  constructor() {
    // state is guaranteed to exist after this line
    this.state = this.initializeNewGame();
  }

  getCredits() {
    // BAD - state is guaranteed to exist, no check needed
    if (!this.state) {
      throw new Error('State not initialized');
    }
    return this.state.player.credits;

    // GOOD - state is guaranteed, access directly
    return this.state.player.credits;
  }

  loadGame(savedData) {
    // GOOD - savedData is external, validate it
    if (!savedData || typeof savedData !== 'object') {
      throw new Error('Invalid save data');
    }
    this.state = savedData;
  }
}
```

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

## React-Specific Standards

### Component Structure

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

  return (
    <div className="trade-panel">
      {/* JSX */}
    </div>
  );
}

// BAD - Class components (avoid unless necessary)
class TradePanel extends React.Component {
  // Don't use class components
}
```

### Component File Organization

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

```javascript
import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { Button } from '../../components/Button';
import { validateTrade } from './tradeUtils';

export function TradePanel({ onClose }) {
  // 1. Local state
  const [selectedGood, setSelectedGood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // 2. Context access
  const gameStateManager = useGameState();

  // 3. Event subscriptions
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');

  // 4. Actions
  const { buyGood, sellGood } = useGameAction();

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Event handlers
  const handleBuy = () => {
    // Handler logic
  };

  // 7. Derived values
  const validation = validateTrade('buy', selectedGood, quantity, gameStateManager.getState());

  // 8. Return JSX
  return (
    <div className="trade-panel">
      {/* JSX */}
    </div>
  );
}
```

### Bridge Pattern Usage

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

// BAD - Direct GameStateManager access without subscription
function ResourceBar() {
  const gameStateManager = useGameState();
  const state = gameStateManager.getState(); // Won't re-render on changes!

  return (
    <div>
      <div>Credits: {state.player.credits}</div>
    </div>
  );
}

// GOOD - Use useGameAction for triggering actions
function RefuelButton() {
  const { refuel } = useGameAction();

  return <button onClick={() => refuel(50)}>Refuel</button>;
}

// BAD - Direct GameStateManager method calls
function RefuelButton() {
  const gameStateManager = useGameState();

  return <button onClick={() => gameStateManager.refuel(50)}>Refuel</button>;
}
```

### Hook Rules

**Follow React's Rules of Hooks**

1. Only call hooks at the top level (not in loops, conditions, or nested functions)
2. Only call hooks from React functions (components or custom hooks)
3. Custom hooks must start with "use"

```javascript
// GOOD - Hooks at top level
function TradePanel() {
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');

  if (cargo.length === 0) {
    return <div>No cargo</div>;
  }

  return <div>{/* JSX */}</div>;
}

// BAD - Conditional hook call
function TradePanel() {
  const cargo = useGameEvent('cargoChanged');

  if (cargo.length > 0) {
    const credits = useGameEvent('creditsChanged'); // WRONG!
  }

  return <div>{/* JSX */}</div>;
}
```

### State Management

**Use local state for UI-only state, GameStateManager for game state**

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

// BAD - Duplicating game state in React state
function RefuelPanel() {
  const [fuel, setFuel] = useState(0); // DON'T duplicate game state!
  const { refuel } = useGameAction();

  // This creates two sources of truth
}
```

### Effect Dependencies

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

// BAD - Missing dependencies
function TradePanel({ systemId }) {
  const gameStateManager = useGameState();

  useEffect(() => {
    const prices = gameStateManager.getKnownPrices(systemId);
    // Use prices
  }, []); // WRONG - missing dependencies
}

// BAD - Unnecessary dependencies causing re-runs
function TradePanel({ onClose }) {
  useEffect(() => {
    // Effect doesn't use onClose
  }, [onClose]); // WRONG - unnecessary dependency
}
```

### Component Props

**Destructure props in function signature**

```javascript
// GOOD - Destructured props
function TradePanel({ onClose, systemId }) {
  return <button onClick={onClose}>Close</button>;
}

// BAD - Props object
function TradePanel(props) {
  return <button onClick={props.onClose}>Close</button>;
}
```

### Event Handlers

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

// BAD - Binding in render
function TradePanel() {
  function handleBuy() {
    // Logic
  }

  return <button onClick={handleBuy.bind(this)}>Buy</button>; // WRONG
}
```

### Conditional Rendering

**Use clear conditional rendering patterns**

```javascript
// GOOD - Logical AND for simple conditions
function Panel() {
  return (
    <div>
      {isLoading && <Spinner />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
}

// GOOD - Ternary for if-else
function Panel() {
  return <div>{isLoading ? <Spinner /> : <Content />}</div>;
}

// GOOD - Early return for complex conditions
function Panel() {
  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return <Content />;
}

// BAD - Nested ternaries
function Panel() {
  return (
    <div>
      {isLoading ? <Spinner /> : error ? <ErrorMessage /> : <Content />}
    </div>
  );
}
```

### Lists and Keys

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

// BAD - Index as key (only acceptable if list never reorders)
function CargoList({ cargo }) {
  return (
    <ul>
      {cargo.map((item, index) => (
        <li key={index}>{item.type}</li>
      ))}
    </ul>
  );
}

// BAD - Non-unique key
function CargoList({ cargo }) {
  return (
    <ul>
      {cargo.map((item) => (
        <li key={item.type}>{item.type}</li> // Multiple items can have same type!
      ))}
    </ul>
  );
}
```

### Performance Optimization

**Use React.memo, useMemo, and useCallback judiciously**

```javascript
// GOOD - Memo for expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>{/* Complex JSX */}</div>;
});

// GOOD - useMemo for expensive calculations
function TradePanel() {
  const cargo = useGameEvent('cargoChanged');

  const totalValue = useMemo(() => {
    return cargo.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }, [cargo]);

  return <div>Total: {totalValue}</div>;
}

// GOOD - useCallback for stable function references
function TradePanel() {
  const { buyGood } = useGameAction();

  const handleBuy = useCallback(
    (goodType, quantity) => {
      buyGood(goodType, quantity);
    },
    [buyGood]
  );

  return <ExpensiveChild onBuy={handleBuy} />;
}

// BAD - Premature optimization
function SimpleComponent({ text }) {
  // Don't memo everything!
  const uppercased = useMemo(() => text.toUpperCase(), [text]);
  return <div>{uppercased}</div>;
}
```

### CSS and Styling

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

// ACCEPTABLE - Inline styles for dynamic values only
function ProgressBar({ percentage }) {
  return <div style={{ width: `${percentage}%` }} className="progress-bar" />;
}

// BAD - Inline styles for static styling
function TradePanel() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      {/* Content */}
    </div>
  );
}
```

### Error Boundaries

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

// GOOD - Multiple boundaries for isolation
function App() {
  return (
    <div>
      <ErrorBoundary>
        <StarMapCanvas />
      </ErrorBoundary>
      <ErrorBoundary>
        <HUD />
      </ErrorBoundary>
    </div>
  );
}
```

### Testing React Components

**Use React Testing Library for component tests**

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { TradePanel } from './TradePanel';

describe('TradePanel', () => {
  it('should display cargo items', () => {
    const mockGameStateManager = createMockGameStateManager();

    render(
      <GameProvider gameStateManager={mockGameStateManager}>
        <TradePanel onClose={() => {}} />
      </GameProvider>
    );

    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('should call buyGood when buy button clicked', () => {
    const mockGameStateManager = createMockGameStateManager();
    const buySpy = vi.spyOn(mockGameStateManager, 'buyGood');

    render(
      <GameProvider gameStateManager={mockGameStateManager}>
        <TradePanel onClose={() => {}} />
      </GameProvider>
    );

    fireEvent.click(screen.getByText('Buy'));

    expect(buySpy).toHaveBeenCalledWith('electronics', 1);
  });
});
```

### React Anti-Patterns to Avoid

**Common mistakes to avoid:**

1. **Don't mutate state directly**

```javascript
// BAD
const [items, setItems] = useState([]);
items.push(newItem); // WRONG - mutating state

// GOOD
setItems([...items, newItem]);
```

2. **Don't use index as key for dynamic lists**

```javascript
// BAD - List can reorder
{
  items.map((item, index) => <Item key={index} {...item} />);
}

// GOOD
{
  items.map((item) => <Item key={item.id} {...item} />);
}
```

3. **Don't create components inside components**

```javascript
// BAD
function Parent() {
  function Child() {
    // This creates a new component on every render!
    return <div>Child</div>;
  }
  return <Child />;
}

// GOOD
function Child() {
  return <div>Child</div>;
}

function Parent() {
  return <Child />;
}
```

4. **Don't forget cleanup in useEffect**

```javascript
// BAD
useEffect(() => {
  const subscription = gameStateManager.subscribe('event', handler);
  // Missing cleanup!
});

// GOOD
useEffect(() => {
  const subscription = gameStateManager.subscribe('event', handler);
  return () => subscription.unsubscribe();
}, []);
```

5. **Don't duplicate game state in React state**

```javascript
// BAD
function HUD() {
  const [credits, setCredits] = useState(0);
  // Duplicates GameStateManager state!
}

// GOOD
function HUD() {
  const credits = useGameEvent('creditsChanged');
  // Single source of truth
}
```
