# Architecture Refactor Design Document

## Overview

This design document outlines the architectural refactoring of the Tramp Freighter Blues codebase to improve maintainability, testability, and organization. The refactoring addresses several key issues:

1. **Large monolithic files**: `game-ui.js` (3075 lines), `starmap.js` (3368 lines), and `starmap.css` (2649 lines) are difficult to navigate and maintain
2. **Mixed concerns**: UI logic, rendering logic, and data are intermingled
3. **Flat constant structure**: Game constants are exported individually rather than grouped by domain
4. **Vendor code mixed with application code**: Three.js is in `js/vendor/` but should be at top level
5. **Outdated steering documents**: Architecture patterns are not documented

The refactoring will extract focused controllers for UI panels, organize starmap rendering into modules, group constants by domain, separate vendor code, split CSS by component, and update steering documents.

**Key Principle**: This is a pure refactoring - no functionality changes, only structural improvements. All existing tests must pass without modification to test logic.

## Architecture

### Current Architecture

```
js/
├── game-animation.js (JumpAnimationSystem, InputLockManager)
├── game-constants.js (all constants exported individually)
├── game-events.js (EconomicEventsSystem)
├── game-information-broker.js (InformationBroker)
├── game-navigation.js (NavigationSystem)
├── game-state.js (GameStateManager)
├── game-trading.js (TradingSystem)
├── game-ui.js (UIManager - 3075 lines, handles all UI panels)
├── seeded-random.js (SeededRandom)
├── starmap.js (3368 lines - scene, rendering, interaction, data)
└── vendor/
    └── three/ (Three.js library)

css/
└── starmap.css (2649 lines - all styles)
```

### Target Architecture

```
vendor/
└── three/ (Three.js library - moved from js/vendor/)

js/
├── controllers/ (UI panel controllers)
│   ├── trade-panel-controller.js
│   ├── refuel-panel-controller.js
│   ├── repair-panel-controller.js
│   ├── upgrade-panel-controller.js
│   ├── info-broker-panel-controller.js
│   └── cargo-manifest-panel-controller.js
├── view/ (Starmap rendering modules)
│   ├── starmap-coordinator.js (main coordinator)
│   ├── starmap-scene.js (scene initialization)
│   ├── starmap-stars.js (star rendering)
│   ├── starmap-wormholes.js (wormhole line rendering)
│   └── starmap-interaction.js (user interaction handling)
├── data/ (Static game data)
│   ├── star-data.js (star system data)
│   └── wormhole-data.js (wormhole connections)
├── game-animation.js (unchanged)
├── game-constants.js (constants grouped into config objects)
├── game-events.js (unchanged)
├── game-information-broker.js (unchanged)
├── game-navigation.js (unchanged)
├── game-state.js (unchanged)
├── game-trading.js (unchanged)
├── game-ui.js (UIManager - coordinator only, delegates to controllers)
└── seeded-random.js (unchanged)

css/
├── base.css (global styles, resets)
├── hud.css (HUD styles)
├── cargo-manifest-panel.css
├── info-broker-panel.css
├── modals.css
├── refuel-panel.css
├── repair-panel.css
├── starmap-scene.css
├── trade-panel.css
└── upgrades-panel.css
```

## Components and Interfaces

### Panel Controller Pattern

Each UI panel will be extracted into a focused controller class that manages a single panel's lifecycle, display, and interactions.

**Base Controller Interface** (conceptual - not implemented as a class):

```javascript
class PanelController {
  constructor(elements, gameStateManager, starData) {
    // elements: Object containing cached DOM elements for this panel
    // gameStateManager: Reference to GameStateManager
    // starData: Reference to star system data
  }

  show() {
    // Display the panel and initialize its state
  }

  hide() {
    // Hide the panel and clean up
  }

  update() {
    // Update panel display based on current game state
  }
}
```

### Trade Panel Controller

**Responsibilities**:

- Display market goods with prices and purchase metadata
- Display cargo stacks with sale prices
- Handle buy/sell transactions
- Update cargo capacity display
- Validate transactions against credits and cargo capacity

**Interface**:

```javascript
class TradePanelController {
  constructor(elements, gameStateManager, starData)
  show()
  hide()
  refreshTradePanel()
  handleBuyGood(goodType, quantity)
  handleSellStack(stackIndex, quantity)
}
```

**DOM Elements Required**:

- `tradePanel`, `tradeSystemName`, `tradeCloseBtn`, `tradeBackBtn`
- `marketGoods`, `cargoStacks`
- `tradeCargoUsed`, `tradeCargoCapacity`, `tradeCargoRemaining`

### Refuel Panel Controller

**Responsibilities**:

- Display current fuel and refuel pricing
- Calculate refuel costs based on input
- Validate refuel amount against credits and capacity
- Display validation messages
- Execute refuel transactions

**Interface**:

```javascript
class RefuelPanelController {
  constructor(elements, gameStateManager, starData)
  show()
  hide()
  updateRefuelCost()
  handleRefuelMax()
  handleRefuelConfirm()
}
```

**DOM Elements Required**:

- `refuelPanel`, `refuelSystemName`, `refuelCloseBtn`, `refuelBackBtn`
- `refuelCurrentFuel`, `refuelPricePerPercent`, `refuelAmountInput`
- `refuelTotalCost`, `refuelConfirmBtn`, `refuelMaxBtn`
- `refuelValidationMessage`

### Repair Panel Controller

**Responsibilities**:

- Display ship condition for all systems
- Calculate repair costs for individual systems and "Repair All"
- Validate repair transactions against credits
- Execute repair transactions
- Update condition displays

**Interface**:

```javascript
class RepairPanelController {
  constructor(elements, gameStateManager, starData)
  show()
  hide()
  updateRepairCosts()
  handleRepairSystem(systemType)
  handleRepairAll()
}
```

**DOM Elements Required**:

- `repairPanel`, `repairSystemName`, `repairCloseBtn`, `repairBackBtn`
- `repairHullPercent`, `repairHullCost`, `repairHullBtn`
- `repairEnginePercent`, `repairEngineCost`, `repairEngineBtn`
- `repairLifeSupportPercent`, `repairLifeSupportCost`, `repairLifeSupportBtn`
- `repairAllCost`, `repairAllBtn`

### Upgrade Panel Controller

**Responsibilities**:

- Display available ship upgrades
- Show upgrade costs and effects
- Validate upgrade purchases against credits
- Execute upgrade transactions
- Display owned upgrades

**Interface**:

```javascript
class UpgradePanelController {
  constructor(elements, gameStateManager, starData)
  show()
  hide()
  refreshUpgradePanel()
  handlePurchaseUpgrade(upgradeId)
}
```

**DOM Elements Required**:

- `upgradesPanel`, `upgradesSystemName`, `upgradesCloseBtn`, `upgradesBackBtn`
- `upgradesList`

### Info Broker Panel Controller

**Responsibilities**:

- Display connected systems list
- Calculate intelligence costs
- Handle intelligence purchases
- Display market data and rumors
- Manage purchase/market data tabs

**Interface**:

```javascript
class InfoBrokerPanelController {
  constructor(elements, gameStateManager, starData, informationBroker)
  show()
  hide()
  refreshInfoBrokerPanel()
  handlePurchaseIntelligence(systemId)
  handleBuyRumor()
  switchTab(tabName)
}
```

**DOM Elements Required**:

- `infoBrokerPanel`, `infoBrokerSystemName`, `infoBrokerCloseBtn`, `infoBrokerBackBtn`
- `buyRumorBtn`, `rumorText`, `intelligenceList`, `infoBrokerValidationMessage`
- `purchaseTab`, `marketDataTab`, `purchaseIntelContent`, `marketDataContent`
- `marketDataList`

### Cargo Manifest Panel Controller

**Responsibilities**:

- Display all cargo stacks with purchase metadata
- Calculate total cargo value
- Show cargo capacity usage

**Interface**:

```javascript
class CargoManifestPanelController {
  constructor(elements, gameStateManager, starData)
  show()
  hide()
  refreshCargoManifest()
}
```

**DOM Elements Required**:

- `cargoManifestPanel`, `cargoManifestCloseBtn`
- `cargoManifestList`, `cargoManifestTotalValue`

### UIManager (Refactored)

The UIManager will become a coordinator that:

- Caches all DOM elements during initialization
- Creates controller instances, passing relevant DOM elements
- Delegates panel show/hide to controllers
- Subscribes to GameStateManager events and notifies controllers
- Manages HUD updates (not extracted to controller)
- Manages notifications (not extracted to controller)
- Manages quick access buttons (not extracted to controller)

**Why HUD/notifications stay in UIManager**:

- HUD is always visible and updates reactively to many state changes
- Notifications are a cross-cutting concern used by many systems
- Quick access buttons are simple toggles that don't warrant a controller
- Extracting these would add complexity without improving maintainability

### Starmap Module Organization

The starmap will be split into focused modules:

**starmap-coordinator.js** (Main module):

- Initializes Three.js scene, camera, renderer
- Creates and coordinates all starmap modules
- Manages shared state (selected system, camera, scene)
- Handles animation loop
- Exports initialization function

**starmap-scene.js**:

- Scene setup (lighting, fog, background)
- Camera initialization
- Renderer configuration
- OrbitControls setup

**starmap-stars.js**:

- Star sprite creation and rendering
- Star label creation and management
- Distance-based label scaling
- Star selection visual feedback

**starmap-wormholes.js**:

- Wormhole line rendering
- Connection color calculation based on fuel
- Line material management

**starmap-interaction.js**:

- Raycasting for star selection
- Mouse/touch event handling
- System selection callbacks
- Camera transition animations

**star-data.js**:

- Exports STAR_DATA array
- Exports WORMHOLE_DATA array
- Pure data module with no logic

**wormhole-data.js**:

- Exports wormhole connection pairs
- Pure data module with no logic

### Constants Reorganization

Constants will be grouped into configuration objects by domain:

**Existing Config Objects** (preserve):

- `ECONOMY_CONFIG` - Economy simulation parameters
- `VISUAL_CONFIG` - Starmap visual settings
- `LABEL_CONFIG` - Label display settings
- `NOTIFICATION_CONFIG` - Notification timing
- `ANIMATION_CONFIG` - Animation durations

**New Config Objects**:

```javascript
export const SHIP_CONFIG = {
  DEFAULT_NAME: 'Serendipity',
  NAME_SUGGESTIONS: [...],
  FUEL_CAPACITY: 100,
  CARGO_CAPACITY: 100,
  DEGRADATION: {
    HULL_PER_JUMP: 2,
    ENGINE_PER_JUMP: 1,
    LIFE_SUPPORT_PER_DAY: 0.5,
  },
  CONDITION_BOUNDS: {
    MIN: 0,
    MAX: 100,
  },
  CONDITION_WARNING_THRESHOLDS: {
    HULL: 50,
    ENGINE: 30,
    LIFE_SUPPORT: 20,
  },
  ENGINE_CONDITION_PENALTIES: {
    THRESHOLD: 60,
    FUEL_PENALTY_MULTIPLIER: 1.2,
    TIME_PENALTY_MULTIPLIER: 1.3,
  },
  QUIRKS: { ... },
  UPGRADES: { ... },
};

export const NAVIGATION_CONFIG = {
  LY_PER_UNIT: 20 / 279.3190870671033,
  FUEL_CAPACITY_EPSILON: 0.01,
};

export const REPAIR_CONFIG = {
  COST_PER_PERCENT: 5,
};

export const INTELLIGENCE_CONFIG = {
  PRICES: {
    RECENT_VISIT: 50,
    NEVER_VISITED: 100,
    STALE_VISIT: 75,
    RUMOR: 25,
  },
  RECENT_THRESHOLD: 30,
  MAX_AGE: 100,
  RELIABILITY: {
    MANIPULATION_CHANCE: 0.1,
    MIN_MANIPULATION_MULTIPLIER: 0.7,
    MAX_MANIPULATION_MULTIPLIER: 0.85,
  },
};

export const FUEL_PRICING_CONFIG = {
  CORE_SYSTEMS: {
    IDS: [SOL_SYSTEM_ID, ALPHA_CENTAURI_SYSTEM_ID],
    PRICE_PER_PERCENT: 2,
  },
  INNER_SYSTEMS: {
    DISTANCE_THRESHOLD: 4.5,
    PRICE_PER_PERCENT: 3,
  },
  OUTER_SYSTEMS: {
    PRICE_PER_PERCENT: 5,
  },
};
```

**Constants that remain top-level** (frequently used, simple values):

- `SOL_SYSTEM_ID`, `ALPHA_CENTAURI_SYSTEM_ID`
- `COMMODITY_TYPES`
- `BASE_PRICES`
- `SPECTRAL_COLORS`
- `GAME_VERSION`, `SAVE_KEY`
- `calculateDistanceFromSol()` function

### CSS Organization

CSS will be split by component with a specific import order:

1. **base.css** - Global styles, resets, CSS variables
2. **hud.css** - HUD overlay styles
3. **Panel stylesheets** (alphabetically):
   - cargo-manifest-panel.css
   - info-broker-panel.css
   - refuel-panel.css
   - repair-panel.css
   - trade-panel.css
   - upgrades-panel.css
4. **modals.css** - Modal dialog styles
5. **starmap-scene.css** - Starmap canvas and 3D scene styles

**Import order rationale**:

- Base styles first to establish defaults
- HUD next as it's always visible
- Panels alphabetically for predictability
- Modals after panels (higher z-index)
- Starmap last (lowest z-index, background)

## Data Models

### Panel Controller Constructor Parameters

```javascript
{
  elements: {
    // Panel-specific DOM elements cached by UIManager
    // Example for RefuelPanelController:
    refuelPanel: HTMLElement,
    refuelSystemName: HTMLElement,
    refuelCurrentFuel: HTMLElement,
    // ... other panel elements
  },
  gameStateManager: GameStateManager,
  starData: Array<StarSystem>,
  // Optional dependencies:
  informationBroker: InformationBroker // Only for InfoBrokerPanelController
}
```

### Starmap Module Shared State

```javascript
{
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  selectedSystemId: number | null,
  starSprites: Map<number, THREE.Sprite>,
  starLabels: Map<number, HTMLElement>,
  wormholeLines: Array<THREE.Line>,
}
```

## Error Handling

### Controller Initialization Errors

Controllers must validate that required DOM elements exist during construction:

```javascript
constructor(elements, gameStateManager, starData) {
  if (!elements.refuelPanel) {
    throw new Error('RefuelPanelController: refuelPanel element required');
  }
  // Validate other required elements

  this.elements = elements;
  this.gameStateManager = gameStateManager;
  this.starData = starData;
}
```

**Rationale**: Fail fast during initialization rather than silently failing during runtime. Missing DOM elements indicate a configuration error that should be caught immediately.

### Module Import Errors

All modules must use explicit imports and fail if dependencies are missing:

```javascript
import { GameStateManager } from './game-state.js';
import { SHIP_CONFIG } from './game-constants.js';

// If imports fail, module loading fails - no silent fallbacks
```

### Refactoring Validation

After refactoring, the application must:

1. Load without module resolution errors
2. Initialize all controllers successfully
3. Pass all existing tests without modification
4. Maintain identical functionality

**Validation strategy**:

- Run full test suite after each major refactoring step
- Manually test each UI panel to verify functionality
- Check browser console for errors during initialization
- Verify save/load still works correctly

## Testing Strategy

### Unit Testing

**No new unit tests required** - this is a pure refactoring. Existing unit tests will continue to work with updated import paths.

**Import path updates required in**:

- All test files that import from moved modules
- Test setup files that mock modules

**Example import path update**:

```javascript
// Before
import { STAR_DATA } from '../js/starmap.js';

// After
import { STAR_DATA } from '../js/data/star-data.js';
```

### Property-Based Testing

**No new property tests required** - existing property tests validate behavior that must be preserved.

**Property tests will validate**:

- Controllers maintain same transaction logic (buy/sell/refuel/repair)
- Price calculations unchanged
- Validation logic unchanged
- State transitions unchanged

**Import path updates required** - same as unit tests.

### Integration Testing

**No new integration tests required** - existing integration tests validate end-to-end flows.

**Integration tests will validate**:

- UI panels still show/hide correctly
- Transactions still execute correctly
- State changes still propagate to UI
- Save/load still works

**Import path updates required** - same as unit tests.

### Manual Testing Checklist

After refactoring, manually verify:

- [ ] Application loads without errors
- [ ] Starmap renders correctly
- [ ] Star selection works
- [ ] Station interface opens
- [ ] Trade panel shows market goods and cargo
- [ ] Buy/sell transactions work
- [ ] Refuel panel calculates costs correctly
- [ ] Refuel transactions work
- [ ] Repair panel shows condition and costs
- [ ] Repair transactions work
- [ ] Upgrade panel shows available upgrades
- [ ] Upgrade purchases work
- [ ] Info broker panel shows systems and intelligence
- [ ] Intelligence purchases work
- [ ] Cargo manifest shows all stacks
- [ ] HUD updates reactively
- [ ] Notifications display correctly
- [ ] Save/load works
- [ ] All tests pass

### Test Execution Strategy

1. **Before refactoring**: Run full test suite to establish baseline (all tests passing)
2. **After each refactoring step**: Run tests to catch regressions early
3. **After completing refactoring**: Run full test suite and manual testing
4. **Test output must be clean**: No stderr messages, no console errors

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several redundant properties were identified and consolidated:

- **Controller delegation (1.4, 1.5)**: Combined into single property about UIManager delegation pattern
- **Controller initialization (1.2, 1.3)**: Combined into single property about constructor parameters
- **Import path updates (8.3, 8.4, 9.1, 9.2, 9.3)**: Combined into single property about import correctness
- **Test preservation (8.1, 8.2)**: 8.2 subsumes 8.1 - passing tests implies coverage maintained

The following properties provide comprehensive validation without redundancy:

### Property 1: Controller Delegation

_For any_ UI panel (trade, refuel, repair, upgrade, info broker, cargo manifest), when UIManager's show/hide method is called for that panel, the corresponding controller's show/hide method should be invoked.

**Validates: Requirements 1.4, 1.5**

**Rationale**: This property ensures the delegation pattern is correctly implemented. UIManager should not contain panel-specific logic but should delegate to focused controllers.

### Property 2: Controller Initialization

_For any_ panel controller, when instantiated by UIManager, the controller should receive all required dependencies (DOM elements, gameStateManager, starData) as constructor parameters.

**Validates: Requirements 1.2, 1.3**

**Rationale**: Controllers must be properly initialized with their dependencies. This property ensures the dependency injection pattern is correctly implemented.

### Property 3: Test Suite Preservation

_For any_ test in the existing test suite, after the refactoring is complete, the test should pass without modifications to test logic (only import path updates allowed).

**Validates: Requirements 8.2**

**Rationale**: This is the fundamental correctness property for refactoring - behavior must be preserved. If all tests pass, the refactoring has not introduced regressions.

### Property 4: Import Path Correctness

_For any_ module that was moved during refactoring, all import statements referencing that module should use the new correct path, and the application should load without module resolution errors.

**Validates: Requirements 8.3, 9.1, 9.2, 9.3, 9.4**

**Rationale**: When files are moved, all references must be updated. This property ensures the module graph remains valid after reorganization.

### Property 5: Application Load Success

_For any_ valid game state, after the refactoring is complete, the application should initialize successfully without errors and render the starmap.

**Validates: Requirements 9.4**

**Rationale**: The application must continue to function after refactoring. This property ensures the refactoring hasn't broken initialization or rendering.

### Example-Based Validation

The following acceptance criteria are best validated through specific examples rather than universal properties:

**Example 1: Controller Instances Created**

- Verify UIManager creates instances of TradePanelController, RefuelPanelController, RepairPanelController, UpgradePanelController, InfoBrokerPanelController, CargoManifestPanelController
- **Validates: Requirements 1.1**

**Example 2: Config Objects Exist**

- Verify ECONOMY_CONFIG, VISUAL_CONFIG, LABEL_CONFIG, NOTIFICATION_CONFIG, ANIMATION_CONFIG still exist with same properties
- Verify SHIP_CONFIG, NAVIGATION_CONFIG, REPAIR_CONFIG, INTELLIGENCE_CONFIG, FUEL_PRICING_CONFIG exist with expected properties
- **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

**Example 3: Vendor Directory Organization**

- Verify vendor/ directory exists at project root
- Verify vendor/three/ contains Three.js library
- Verify js/ directory contains application code
- **Validates: Requirements 3.1, 3.2, 3.3**

**Example 4: Controller Directory Organization**

- Verify js/controllers/ directory exists
- Verify controller files exist: trade-panel-controller.js, refuel-panel-controller.js, repair-panel-controller.js, upgrade-panel-controller.js, info-broker-panel-controller.js, cargo-manifest-panel-controller.js
- Verify UIManager imports from js/controllers/
- **Validates: Requirements 4.1, 4.2, 4.4**

**Example 5: Starmap Module Organization**

- Verify js/data/ directory contains star-data.js and wormhole-data.js
- Verify js/views/ directory contains starmap-coordinator.js, starmap-scene.js, starmap-stars.js, starmap-wormholes.js, starmap-interaction.js
- **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8**

**Example 6: CSS File Organization**

- Verify css/ directory contains: base.css, hud.css, cargo-manifest-panel.css, info-broker-panel.css, modals.css, refuel-panel.css, repair-panel.css, starmap-scene.css, trade-panel.css, upgrades-panel.css
- Verify HTML imports CSS files in correct order
- **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

**Example 7: Steering Documents Updated**

- Verify coding-standards.md contains controller patterns and module organization
- Verify structure.md contains new directory layout
- Verify tech.md contains controller architecture documentation
- **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Example 8: HTML Script Tags Updated**

- Verify starmap.html script tags reference correct module paths
- Verify vendor libraries referenced from vendor/ directory
- **Validates: Requirements 3.4, 9.3**

### Non-Testable Requirements

The following requirements are guidelines for code organization and cannot be automatically tested:

- **Requirement 1.7**: Controllers using only provided DOM elements (requires code inspection)
- **Requirement 2.4, 2.5**: Code accessing constants through config objects (requires code inspection)
- **Requirement 3.5**: Future vendor library placement (guideline for future development)
- **Requirement 4.3**: Future controller placement (guideline for future development)

These will be validated through code review during implementation.
