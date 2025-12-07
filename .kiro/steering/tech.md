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

### Starmap (Existing)

- Three.js scene management
- Camera controls (orbit, pan, zoom/dolly)
- Material system for visual effects (glow, volumetric fog)
- Sprite-based star rendering
- Dynamic label system with distance-based scaling
- EdgesGeometry for wireframe boundaries

### Game Systems (To Be Implemented)

- Game state management (player, ship, world)
- Trading system with price calculation
- Navigation system with fuel/distance calculations
- Event system with trigger conditions and effects
- NPC relationship tracking
- Save/load manager with versioning
- UI overlay system (HUD, station interface, dialogue)

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

### Phase 1 (Core Loop)

- `starmap.html` (existing, to be enhanced)
- `game-constants.js` - Centralized game data (prices, modifiers, colors, version)
- `game-state.js` - State management and initialization
- `game-trading.js` - Trading logic and price calculations
- `game-navigation.js` - Jump mechanics and distance calculations
- `game-ui.js` - HUD and interface rendering
- `game-save.js` - localStorage persistence

### Future Phases

- `game-events.js` - Event system
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

- **Three.js** (existing) - 3D rendering. This is in js/vendor directory. NEVER EDIT THIS CODE.
- **No additional dependencies** - Vanilla JS for game logic to minimize complexity

## Comments and Documentation

- If comments are used, they MUST explain WHY the code behaves the way it does, not just what it does.
- Comments MUST not be used to describe the code's structure unless the structure is unclear.
- All public functions or data must have documentation or comments
- NEVER MENTION TASK NUMBERS IN COMMENTS!
