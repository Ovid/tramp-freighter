---
inclusion: always
---

# Technology Stack

## Core Framework

- **Three.js**: 3D rendering framework for hardware-accelerated graphics (starmap)
- **Vanilla JavaScript**: Primary development language (no framework dependencies for game logic)
- **localStorage**: Browser-based persistence for save games

## Architecture

- Client-side application (no backend required)
- Hardware-accelerated 3D rendering via WebGL (starmap)
- Event-driven game state management
- Data-driven content system for narrative events

## Key Technical Components

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

- **Three.js** (existing) - 3D rendering
- **No additional dependencies** - Vanilla JS for game logic to minimize complexity
