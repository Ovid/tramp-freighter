---
inclusion: fileMatch
fileMatchPattern: "{src/**,tests/**,*.js,*.mjs,*.ts,*.jsx,*.tsx}"
---

# JavaScript Coding Standards

## Strict Mode

**ES Modules and React files are automatically in strict mode** - no explicit `"use strict";` directive is needed.

Modern JavaScript using ES Modules (files with `import`/`export` statements) and React JSX files compiled by Vite automatically run in strict mode. This provides:

- Automatic catching of common coding mistakes
- Prevention of problematic language features
- Optimized code execution
- Prevention of accidental global variable creation

**Note**: All files use ES Modules and are automatically in strict mode.

## Task Completion Standards

### Test Suite Requirements

**CRITICAL: No task is complete until the entire test suite passes**

```bash
npm test
```

Every task must leave the codebase in a working state with all tests passing. This ensures:

- Our version of npm DOES NOT accept a `--run` argument.
- No regressions are introduced
- New functionality integrates correctly
- The system remains stable and deployable

### RED/GREEN/REFACTOR (Test-Driven Development)

**Use TDD for new functionality: write the test first, then the implementation**

1. **RED**: Write a failing test for functionality that doesn't exist yet
2. **GREEN**: Write minimal code to make the test pass  
3. **REFACTOR**: Improve code while keeping tests passing

**When to use TDD:**
- New utility functions and calculations
- Business logic (trading, pricing, validation)
- State management methods

**TDD Checklist:**
- [ ] Test written before implementation
- [ ] Test fails initially (confirms test is valid)
- [ ] Minimal code written to pass test
- [ ] All tests pass after implementation
- [ ] Code refactored while tests stay green

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
// GOOD - Single purpose: trade panel component
// src/features/trade/TradePanel.jsx
export function TradePanel({ onClose }) {
  // All trade panel logic
}

// BAD - Multiple unrelated purposes in one file
// src/features/game-stuff.jsx
export function TradePanel() {}
export function RefuelPanel() {}
export function calculateDistance() {}
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

### Import Statements

**CRITICAL: All imports must be at the top of the file**

Import statements should always be placed at the top of the file, immediately after any file-level comments or directives. This ensures:

- Clear visibility of all dependencies
- Easier dependency management
- Better static analysis and tree-shaking
- Consistent code structure across the project

```javascript
// GOOD - All imports at the top
import * as THREE from 'three';
import {
  GameStateManager,
  sanitizeShipName,
} from '../state/game-state-manager.js';
import { NavigationSystem } from '../game-navigation.js';
import { UIManager } from '../ui/ui-manager.js';
import { STAR_DATA } from '../data/star-data.js';

// ... rest of the code

function myFunction() {
  const name = sanitizeShipName(input);
  // Use imported functions directly
}

// BAD - Dynamic imports in function bodies (unless code-splitting is required)
function myFunction() {
  import('../state/game-state-manager.js').then((module) => {
    const name = module.sanitizeShipName(input);
  });
}

// BAD - Imports scattered throughout the file
import { GameStateManager } from '../state/game-state-manager.js';

function someFunction() {
  // ... code
}

import { NavigationSystem } from '../game-navigation.js'; // WRONG - not at top

function anotherFunction() {
  // ... code
}
```

**When dynamic imports ARE appropriate:**

- Code-splitting for large modules that aren't always needed
- Lazy-loading features that are rarely used
- Loading modules conditionally based on runtime configuration

**Example of acceptable dynamic import:**

```javascript
// Acceptable - Loading a large visualization library only when needed
async function showAdvancedChart() {
  const { Chart } = await import('./heavy-chart-library.js');
  return new Chart(data);
}
```

**Import Organization:**

Group imports in the following order:

1. External libraries (React, Three.js, etc.)
2. Internal modules (game logic, state management)
3. Components (if applicable)
4. Utilities
5. Data/constants
6. Styles (CSS imports)

```javascript
// 1. External libraries
import { useState, useEffect } from 'react';
import * as THREE from 'three';

// 2. Internal modules
import { GameStateManager } from '../state/game-state-manager.js';
import { NavigationSystem } from '../game-navigation.js';

// 3. Components
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

// 4. Utilities
import { validateInput } from './utils';

// 5. Data/constants
import { STAR_DATA } from '../data/star-data.js';
import { GAME_CONFIG } from '../game-constants.js';

// 6. Styles
import './styles.css';
```

### Module Organization

**Organize code by feature and responsibility**

```
src/
├── features/              # Feature modules
│   ├── trade/
│   │   ├── TradePanel.jsx
│   │   └── tradeUtils.js
│   ├── refuel/
│   │   ├── RefuelPanel.jsx
│   │   └── refuelUtils.js
│   ├── repair/
│   │   ├── RepairPanel.jsx
│   │   └── repairUtils.js
│   ├── navigation/
│   │   ├── StarMapCanvas.jsx
│   │   ├── JumpDialog.jsx
│   │   └── SystemPanel.jsx
│   └── hud/
│       ├── HUD.jsx
│       ├── ResourceBar.jsx
│       └── hudUtils.js
├── components/            # Shared UI components
│   ├── Button.jsx
│   ├── Modal.jsx
│   └── Card.jsx
├── hooks/                 # Custom React hooks
│   ├── useGameEvent.js
│   └── useGameAction.js
├── context/               # React Context
│   └── GameContext.jsx
└── game/                  # Game logic
    ├── constants.js
    ├── game-trading.js
    ├── game-navigation.js
    ├── state/
    │   └── game-state-manager.js
    ├── engine/
    │   ├── scene.js
    │   ├── stars.js
    │   └── wormholes.js
    ├── data/
    │   ├── star-data.js
    │   └── wormhole-data.js
    └── utils/
        ├── seeded-random.js
        └── string-utils.js
```

**Module Organization Principles:**

- **Features**: Feature-based organization with components and utilities co-located
- **Components**: Shared UI components used across features
- **Hooks**: Custom React hooks for common patterns
- **Context**: React Context providers
- **Game**: Game logic separated from UI

**Scene Initialization Pattern:**

```javascript
import { initScene } from '../../game/engine/scene.js';
import { createStarSystems } from '../../game/engine/stars.js';
import { createWormholeLines } from '../../game/engine/wormholes.js';

/**
 * Initializes Three.js scene for starmap rendering.
 * Called once on component mount.
 */
export function StarMapCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
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

### Avoid Defensive Null Checks for Guaranteed Variables

**CRITICAL: Do not add defensive null checks for variables that should always exist after initialization**

Using `?.` or `??` on properties that MUST exist after initialization silently hides bugs instead of exposing them during development.

**When to use defensive checks:**
- External data (user input, API responses, localStorage)
- Optional parameters explicitly marked as optional
- Data from untrusted sources

**When NOT to use defensive checks:**
- Variables initialized in constructor
- Required parameters (validate once at function entry)
- Internal state that should always be valid

### Throw Exceptions for "Impossible" Conditions

**CRITICAL: When encountering conditions that "can't happen" in valid program execution, throw exceptions immediately**

```javascript
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

- Mock console methods when testing error handling
- Capture and verify expected errors instead of letting them print
- Restore mocked console methods in finally blocks
- Use test assertions to verify error behavior

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
