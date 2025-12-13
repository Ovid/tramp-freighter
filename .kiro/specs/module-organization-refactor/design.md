# Module Organization Refactor Design Document

## Overview

This design document outlines the refactoring of two large monolithic files (`game-state.js` at 73KB/2494 lines and `game-ui.js` at 54KB/1682 lines) into focused, maintainable modules. The refactoring addresses code organization issues without changing any functionality.

**Key Principle**: This is a pure refactoring - no functionality changes, only structural improvements. All existing tests must pass without modification to test logic.

**Problem Statement**:
- `game-state.js` contains state management, save/load logic, and state validation all in one file
- `game-ui.js` contains UI coordination, HUD updates, notifications, and modal dialogs all in one file
- Both files are difficult to navigate and maintain
- Related functionality is scattered across thousands of lines

**Solution**:
- Split `game-state.js` into: `game-state-manager.js`, `save-load.js`, `state-validators.js`
- Split `game-ui.js` into: `ui-manager.js`, `hud-manager.js`, `notification-manager.js`, `modal-manager.js`
- Maintain identical functionality through careful extraction and dependency injection

## Architecture

### Current Architecture

```
js/
├── game-state.js (2494 lines)
│   ├── GameStateManager class
│   ├── Save/load methods
│   ├── State validation methods
│   └── Migration methods
└── game-ui.js (1682 lines)
    ├── UIManager class
    ├── HUD update methods
    ├── Notification system
    └── Modal dialog system
```

### Target Architecture

```
js/
├── state/
│   ├── game-state-manager.js (GameStateManager class)
│   ├── save-load.js (save/load functions)
│   └── state-validators.js (validation and migration functions)
└── ui/
    ├── ui-manager.js (UIManager coordinator)
    ├── hud-manager.js (HUD update functions)
    ├── notification-manager.js (notification system)
    └── modal-manager.js (modal dialog system)
```

## Components and Interfaces

### State Module Split

#### game-state-manager.js

**Responsibilities**:
- GameStateManager class definition
- State initialization (initNewGame)
- State queries (getState, getPlayer, getShip, etc.)
- State mutations (updateCredits, updateFuel, etc.)
- Event system (subscribe, unsubscribe, emit)
- Game logic operations (trading, refueling, repairs, upgrades)
- Quirk and upgrade systems

**Exports**:
```javascript
export class GameStateManager {
  constructor(starData, wormholeData, navigationSystem)
  
  // Initialization
  initNewGame()
  
  // Event system
  subscribe(eventType, callback)
  unsubscribe(eventType, callback)
  emit(eventType, data)
  
  // State queries
  getState()
  getPlayer()
  getShip()
  getCurrentSystem()
  getCargoUsed()
  getCargoRemaining()
  getFuelCapacity()
  getShipCondition()
  // ... all other query methods
  
  // State mutations
  updateCredits(newCredits)
  updateFuel(newFuel)
  updateCargo(newCargo)
  updateLocation(newSystemId)
  updateTime(newDays)
  updateShipCondition(hull, engine, lifeSupport)
  // ... all other mutation methods
  
  // Game operations
  buyGood(goodType, quantity, price)
  sellGood(stackIndex, quantity, salePrice)
  refuel(amount)
  repairShipSystem(systemType, amount)
  purchaseUpgrade(upgradeId)
  // ... all other operation methods
}

export function sanitizeShipName(name)
```

**Dependencies**:
- `game-constants.js` - Configuration objects
- `game-trading.js` - TradingSystem
- `game-events.js` - EconomicEventsSystem
- `game-information-broker.js` - InformationBroker
- `save-load.js` - Save/load functions (NEW)
- `state-validators.js` - Validation functions (NEW)

**Size**: ~1800 lines (reduced from 2494)

#### save-load.js

**Responsibilities**:
- Save game state to localStorage
- Load game state from localStorage
- Save debouncing logic

**Exports**:
```javascript
/**
 * Save game state to localStorage with debouncing
 * @param {Object} state - Game state to save
 * @param {number} lastSaveTime - Timestamp of last save
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} { success: boolean, newLastSaveTime: number }
 */
export function saveGame(state, lastSaveTime, isTestEnvironment)

/**
 * Load game state from localStorage
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object|null} Loaded state or null if no save exists
 */
export function loadGame(isTestEnvironment)
```

**Dependencies**:
- `game-constants.js` - SAVE_KEY, SAVE_DEBOUNCE_MS, GAME_VERSION
- `state-validators.js` - Validation and migration functions

**Size**: ~100 lines

#### state-validators.js

**Responsibilities**:
- Validate state structure
- Check version compatibility
- Migrate saves between versions
- Add defaults for missing fields

**Exports**:
```javascript
/**
 * Check if save version is compatible with current game version
 * @param {string} saveVersion - Version from save file
 * @returns {boolean} True if compatible
 */
export function isVersionCompatible(saveVersion)

/**
 * Validate that loaded state has required structure
 * @param {Object} state - State to validate
 * @returns {boolean} True if valid
 */
export function validateStateStructure(state)

/**
 * Migrate save from v1.0.0 to v2.1.0
 * @param {Object} state - v1.0.0 state
 * @param {Array} starData - Star system data for lookups
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v2.1.0 state
 */
export function migrateFromV1ToV2(state, starData, isTestEnvironment)

/**
 * Migrate save from v2.0.0 to v2.1.0
 * @param {Object} state - v2.0.0 state
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v2.1.0 state
 */
export function migrateFromV2ToV2_1(state, isTestEnvironment)

/**
 * Add defaults for missing fields in loaded state
 * @param {Object} state - State to normalize
 * @param {Array} starData - Star system data for lookups
 * @returns {Object} Normalized state
 */
export function addStateDefaults(state, starData)
```

**Dependencies**:
- `game-constants.js` - GAME_VERSION, SHIP_CONFIG, NEW_GAME_DEFAULTS

**Size**: ~600 lines

### UI Module Split

#### ui-manager.js

**Responsibilities**:
- UIManager class definition
- DOM element caching
- Panel controller initialization
- Event subscription to GameStateManager
- Panel show/hide delegation
- Station interface handlers
- Quick access button handlers
- Ship status panel
- Upgrade confirmation handlers

**Exports**:
```javascript
export class UIManager {
  constructor(gameStateManager)
  
  // HUD management (delegates to hud-manager)
  showHUD()
  hideHUD()
  updateHUD()
  
  // Panel management (delegates to controllers)
  showStationInterface()
  hideStationInterface()
  showTradePanel()
  hideTradePanel()
  // ... other panel methods
  
  // Notifications (delegates to notification-manager)
  showNotification(message, duration, type)
  showError(message)
  showSuccess(message)
  
  // Modals (delegates to modal-manager)
  showEventModal(event)
  showConfirmModal(message, onConfirm)
}
```

**Dependencies**:
- `game-constants.js` - Configuration objects
- `controllers/*` - Panel controllers
- `hud-manager.js` - HUD update functions (NEW)
- `notification-manager.js` - Notification system (NEW)
- `modal-manager.js` - Modal dialog system (NEW)

**Size**: ~1000 lines (reduced from 1682)

#### hud-manager.js

**Responsibilities**:
- Update HUD display elements
- Format HUD values
- Update condition bars
- Update cargo display
- Update location display

**Exports**:
```javascript
/**
 * Update all HUD elements with current game state
 * @param {Object} elements - Cached DOM elements
 * @param {Object} state - Current game state
 * @param {Array} starData - Star system data
 */
export function updateHUD(elements, state, starData)

/**
 * Update credits display
 * @param {HTMLElement} element - Credits display element
 * @param {number} credits - Current credits
 */
export function updateCredits(element, credits)

/**
 * Update debt display
 * @param {HTMLElement} element - Debt display element
 * @param {number} debt - Current debt
 */
export function updateDebt(element, debt)

/**
 * Update days elapsed display
 * @param {HTMLElement} element - Days display element
 * @param {number} days - Days elapsed
 */
export function updateDays(element, days)

/**
 * Update ship name display
 * @param {HTMLElement} element - Ship name display element
 * @param {string} shipName - Ship name
 */
export function updateShipName(element, shipName)

/**
 * Update fuel bar and text
 * @param {Object} elements - Fuel bar and text elements
 * @param {number} fuel - Current fuel percentage
 */
export function updateFuel(elements, fuel)

/**
 * Update ship condition bars (hull, engine, life support)
 * @param {Object} elements - Condition bar and text elements
 * @param {Object} condition - Ship condition object
 */
export function updateShipCondition(elements, condition)

/**
 * Update cargo display
 * @param {HTMLElement} element - Cargo display element
 * @param {number} cargoUsed - Used cargo space
 * @param {number} cargoCapacity - Total cargo capacity
 */
export function updateCargo(element, cargoUsed, cargoCapacity)

/**
 * Update location display
 * @param {Object} elements - System and distance elements
 * @param {number} systemId - Current system ID
 * @param {Array} starData - Star system data
 */
export function updateLocation(elements, systemId, starData)

/**
 * Update a condition bar and text display
 * @param {Object} elements - Bar and text elements
 * @param {string} prefix - Element prefix ('' for HUD, 'repair' for repair panel)
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @param {number} conditionValue - Condition percentage (0-100)
 */
export function updateConditionDisplay(elements, prefix, systemType, conditionValue)
```

**Dependencies**:
- `game-constants.js` - calculateDistanceFromSol
- `utils/string-utils.js` - capitalizeFirst

**Size**: ~200 lines

#### notification-manager.js

**Responsibilities**:
- Display toast notifications
- Queue notifications for sequential display
- Auto-dismiss notifications
- Handle notification types (error, success, info)

**Exports**:
```javascript
/**
 * Initialize notification system
 * @param {HTMLElement} notificationArea - Notification container element
 * @returns {Object} Notification system instance
 */
export function createNotificationSystem(notificationArea)

/**
 * Show a notification
 * @param {Object} system - Notification system instance
 * @param {string} message - Notification message
 * @param {number} duration - Display duration in ms
 * @param {string} type - Notification type: 'error', 'success', 'info'
 */
export function showNotification(system, message, duration, type)

/**
 * Show an error notification
 * @param {Object} system - Notification system instance
 * @param {string} message - Error message
 */
export function showError(system, message)

/**
 * Show a success notification
 * @param {Object} system - Notification system instance
 * @param {string} message - Success message
 */
export function showSuccess(system, message)

/**
 * Show an info notification
 * @param {Object} system - Notification system instance
 * @param {string} message - Info message
 */
export function showInfo(system, message)
```

**Dependencies**:
- `game-constants.js` - NOTIFICATION_CONFIG

**Size**: ~150 lines

#### modal-manager.js

**Responsibilities**:
- Display modal dialogs
- Handle modal confirmation/cancellation
- Show event modals
- Show confirmation modals

**Exports**:
```javascript
/**
 * Show event modal with event details
 * @param {Object} elements - Modal DOM elements
 * @param {Object} event - Event object with title, description, duration
 * @param {Function} onDismiss - Callback when modal is dismissed
 */
export function showEventModal(elements, event, onDismiss)

/**
 * Hide event modal
 * @param {Object} elements - Modal DOM elements
 */
export function hideEventModal(elements)

/**
 * Show confirmation modal
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 */
export function showConfirmModal(message, onConfirm, onCancel)

/**
 * Setup event modal handlers
 * @param {Object} elements - Modal DOM elements
 */
export function setupEventModalHandlers(elements)
```

**Dependencies**: None

**Size**: ~100 lines

## Data Models

### GameStateManager Constructor Parameters

```javascript
{
  starData: Array<StarSystem>,
  wormholeData: Array<WormholeConnection>,
  navigationSystem: NavigationSystem | null
}
```

### Save/Load Function Parameters

```javascript
// saveGame
{
  state: Object,              // Complete game state
  lastSaveTime: number,       // Timestamp of last save
  isTestEnvironment: boolean  // Whether running in test mode
}

// loadGame
{
  isTestEnvironment: boolean  // Whether running in test mode
}
```

### Notification System Instance

```javascript
{
  notificationArea: HTMLElement,
  notificationQueue: Array<Notification>,
  isShowingNotification: boolean
}
```

## Error Handling

### Module Import Errors

All modules must use explicit imports and fail if dependencies are missing:

```javascript
import { GameStateManager } from './state/game-state-manager.js';
import { saveGame, loadGame } from './state/save-load.js';

// If imports fail, module loading fails - no silent fallbacks
```

### Refactoring Validation

After refactoring, the application must:

1. Load without module resolution errors
2. Initialize GameStateManager successfully
3. Pass all existing tests without modification
4. Maintain identical functionality

**Validation strategy**:
- Run full test suite after each major refactoring step
- Manually test save/load functionality
- Check browser console for errors during initialization
- Verify all UI updates work correctly

## Testing Strategy

### Unit Testing

**No new unit tests required** - this is a pure refactoring. Existing unit tests will continue to work with updated import paths.

**Import path updates required in**:
- All test files that import from `game-state.js` or `game-ui.js`
- Test setup files that mock modules

**Example import path update**:

```javascript
// Before
import { GameStateManager } from '../js/game-state.js';

// After
import { GameStateManager } from '../js/state/game-state-manager.js';
```

### Property-Based Testing

**No new property tests required** - existing property tests validate behavior that must be preserved.

**Property tests will validate**:
- State management logic unchanged
- Save/load round-trip still works
- UI updates still trigger correctly
- All game operations still function

**Import path updates required** - same as unit tests.

### Integration Testing

**No new integration tests required** - existing integration tests validate end-to-end flows.

**Integration tests will validate**:
- Game initialization still works
- State changes still propagate to UI
- Save/load still works
- All game flows still function

**Import path updates required** - same as unit tests.

### Manual Testing Checklist

After refactoring, manually verify:

- [ ] Application loads without errors
- [ ] New game initializes correctly
- [ ] Save game works
- [ ] Load game works
- [ ] HUD updates reactively
- [ ] Notifications display correctly
- [ ] Modal dialogs work
- [ ] All panel controllers function
- [ ] All game operations work (trade, refuel, repair, upgrade)
- [ ] All tests pass

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, the following properties provide comprehensive validation:

### Property 1: Module Exports Completeness

_For any_ function or class exported from the original monolithic file, the refactored modules should export that same function or class with identical signature and behavior.

**Validates: Requirements 1.5, 2.6**

**Rationale**: This ensures no functionality is lost during the split. Every public API from the original files must remain accessible from the new module structure.

### Property 2: Import Path Correctness

_For any_ module that imports from the refactored files, updating the import path to the new module location should result in the application loading without module resolution errors.

**Validates: Requirements 6.1, 6.2, 6.3**

**Rationale**: When files are split, all references must be updated. This property ensures the module graph remains valid after reorganization.

### Property 3: Test Suite Preservation

_For any_ test in the existing test suite, after updating import paths, the test should pass without modifications to test logic.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Rationale**: This is the fundamental correctness property for refactoring - behavior must be preserved. If all tests pass, the refactoring has not introduced regressions.

### Property 4: State Management Round Trip

_For any_ valid game state, saving and then loading should produce an equivalent state object.

**Validates: Requirements 1.2, 1.5**

**Rationale**: The save/load system must continue to work correctly after being extracted into a separate module. This property validates that the extraction preserves the round-trip behavior.

### Property 5: UI Update Reactivity

_For any_ state change event, the UI should update to reflect the new state within the expected time frame.

**Validates: Requirements 2.2, 2.3, 2.4, 2.6**

**Rationale**: The UI system must continue to react to state changes after being split into modules. This property validates that the event subscription and update logic remains intact.

### Example-Based Validation

The following acceptance criteria are best validated through specific examples rather than universal properties:

**Example 1: Module File Locations**

- Verify `js/state/game-state-manager.js` exists and exports GameStateManager
- Verify `js/state/save-load.js` exists and exports saveGame, loadGame
- Verify `js/state/state-validators.js` exists and exports validation functions
- Verify `js/ui/ui-manager.js` exists and exports UIManager
- Verify `js/ui/hud-manager.js` exists and exports HUD update functions
- Verify `js/ui/notification-manager.js` exists and exports notification functions
- Verify `js/ui/modal-manager.js` exists and exports modal functions
- **Validates: Requirements 5.1, 5.2**

**Example 2: Explicit Dependencies**

- Verify each module has import statements at the top
- Verify no hidden global dependencies
- Verify dependency graph is clear from imports
- **Validates: Requirements 4.2, 4.5**

**Example 3: Module Documentation**

- Verify each module has JSDoc comment describing its purpose
- Verify each exported function has JSDoc with parameters and return values
- **Validates: Requirements 4.4**

**Example 4: Code Style Consistency**

- Verify all modules begin with `"use strict";`
- Verify all modules use camelCase naming
- Verify all modules follow existing code style
- **Validates: Requirements 5.3, 5.4, 5.5**

**Example 5: Original Files Removed**

- Verify `js/game-state.js` no longer exists
- Verify `js/game-ui.js` no longer exists
- **Validates: Requirements 6.4**

**Example 6: Named Exports**

- Verify all modules use named exports (not default exports)
- Verify export names are descriptive
- **Validates: Requirements 4.3**

### Non-Testable Requirements

The following requirements are guidelines for code organization and cannot be automatically tested:

- **Requirement 4.1**: Single, focused responsibility (requires code review)
- **Requirement 5.5**: Maintain existing code style (requires code review)

These will be validated through code review during implementation.
