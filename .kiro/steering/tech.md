---
inclusion: always
---

# Technology Stack

## Core Framework

- **Three.js**: 3D rendering framework for hardware-accelerated graphics (starmap)
- **Vanilla JavaScript**: Primary development language (no framework dependencies for game logic)
- **localStorage**: Browser-based persistence for save games (REQUIRED - all game state must be stored in browser localStorage, no server-side storage)

## Architecture

- Client-side application (no backend required)
- Hardware-accelerated 3D rendering via WebGL (starmap)
- Event-driven game state management
- Data-driven content system for narrative events
- Controller pattern for UI panel management
- Module-based code organization with clear separation of concerns

### Controller Architecture

The application uses a controller pattern for UI panel management:

**UIManager (Coordinator)**:
- Caches all DOM elements during initialization
- Creates panel controller instances with dependency injection
- Delegates panel show/hide operations to controllers
- Manages HUD updates, notifications, and quick access buttons
- Subscribes to GameStateManager events

**Panel Controllers**:
- Each UI panel has a dedicated controller class
- Controllers receive dependencies through constructor injection
- Controllers encapsulate all logic for their panel (display, validation, transactions)
- Controllers validate required DOM elements in constructor
- Controllers throw exceptions for invalid state (fail fast)

**Example Controller Structure**:

```javascript
class TradePanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate dependencies
    // Store references
    // Bind event handlers
  }

  show() { /* Display panel and initialize */ }
  hide() { /* Hide panel and cleanup */ }
  refresh() { /* Update panel display */ }
  handleTransaction() { /* Process user actions */ }
}
```

**Benefits**:
- Improved testability (controllers can be tested in isolation)
- Better maintainability (panel logic contained in single file)
- Clear separation of concerns (coordinator vs. panel logic)
- Explicit dependencies (no hidden globals)

### Module Organization

Code is organized by feature and responsibility:

**Controllers** (`js/controllers/`):
- One file per UI panel controller
- Trade, refuel, repair, upgrades, info-broker, cargo-manifest

**Views** (`js/views/`):
- Rendering modules organized by visual component
- Starmap modules: coordinator, scene, stars, wormholes, interaction

**Data** (`js/data/`):
- Static game data separated from logic
- Star system data, wormhole connections

**Utils** (`js/utils/`):
- Reusable utility functions
- Seeded random, string utilities

**Core Systems** (js/ root):
- Game logic modules: state, trading, navigation, animation, events
- UI coordinator, constants

**Starmap Module Pattern**:

The starmap is split into focused modules coordinated by a main module:

- `starmap.js`: Main coordinator, initializes all modules, manages shared state
- `scene.js`: Scene setup, camera, renderer, controls
- `stars.js`: Star sprite creation, labels, selection feedback
- `wormholes.js`: Wormhole line rendering, connection colors
- `interaction.js`: Raycasting, mouse/touch events, selection callbacks

Each module exports focused functions and receives dependencies as parameters.

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

**Vendor Libraries**:
- `vendor/three/` - Three.js library (never edit)

**Application JavaScript** (`js/`):

**Controllers** (`js/controllers/`):
- `trade.js` - Trade panel controller
- `refuel.js` - Refuel panel controller
- `repair.js` - Repair panel controller
- `upgrades.js` - Upgrades panel controller
- `info-broker.js` - Information broker panel controller
- `cargo-manifest.js` - Cargo manifest panel controller

**Views** (`js/views/starmap/`):
- `starmap.js` - Main starmap coordinator
- `scene.js` - Scene initialization
- `stars.js` - Star rendering
- `wormholes.js` - Wormhole rendering
- `interaction.js` - User interaction handling

**Data** (`js/data/`):
- `star-data.js` - Star system data
- `wormhole-data.js` - Wormhole connection data

**Utils** (`js/utils/`):
- `seeded-random.js` - Deterministic random number generation
- `string-utils.js` - String manipulation utilities

**Core Systems** (js/ root):
- `game-constants.js` - Configuration objects (prices, modifiers, colors, version)
- `game-state.js` - State management and initialization
- `game-trading.js` - Trading logic and price calculations
- `game-navigation.js` - Jump mechanics and distance calculations
- `game-ui.js` - UI coordinator (delegates to controllers)
- `game-animation.js` - Animation system with input locking
- `game-events.js` - Economic events system
- `game-information-broker.js` - Intelligence trading system

**Stylesheets** (`css/`):
- `base.css` - Global styles and resets
- `hud.css` - HUD overlay styles
- `panel/` - Panel-specific styles (trade, refuel, repair, upgrades, info-broker, cargo-manifest, ship-status)
- `modals.css` - Modal dialog styles
- `starmap-scene.css` - Starmap visualization styles

**Entry Point**:
- `starmap.html` - Main application HTML

### Future Phases

- `game-npcs.js` - NPC and relationship system
- `game-combat.js` - Tactical combat choices
- `content/` - Data-driven event and dialogue content

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

- **Three.js** - 3D rendering. Located in `vendor/three/` directory. NEVER EDIT THIS CODE.
- **No additional dependencies** - Vanilla JS for game logic to minimize complexity

## Import Paths

When importing modules, use the correct paths based on the new directory structure:

```javascript
// Controllers
import { TradePanelController } from './controllers/trade.js';

// Views
import { initializeStarmap } from './views/starmap/starmap.js';

// Data
import { STAR_DATA } from './data/star-data.js';
import { WORMHOLE_DATA } from './data/wormhole-data.js';

// Utils
import { SeededRandom } from './utils/seeded-random.js';

// Core systems
import { GameStateManager } from './game-state.js';
import { SHIP_CONFIG, ECONOMY_CONFIG } from './game-constants.js';

// Vendor
import * as THREE from '../vendor/three/build/three.module.js';
```

## Comments and Documentation

- If comments are used, they MUST explain WHY the code behaves the way it does, not just what it does.
- Comments MUST not be used to describe the code's structure unless the structure is unclear.
- All public functions or data must have documentation or comments
- NEVER MENTION TASK NUMBERS IN COMMENTS!
