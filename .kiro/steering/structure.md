---
inclusion: always
---

# Project Structure

## Directory Layout

```
.
├── .git/              # Git version control
├── .gitignore         # Ignores notes/ and vim swap files
├── .kiro/             # Kiro AI assistant configuration
│   ├── specs/         # Feature specifications
│   │   ├── architecture-refactor/       # Completed: Code organization
│   │   ├── sol-sector-starmap/          # Completed: 3D starmap foundation
│   │   └── tramp-freighter-core-loop/   # Completed: Game MVP
│   └── steering/      # AI steering rules and guidelines
├── vendor/            # Third-party libraries
│   └── three/         # Three.js library
├── js/                # Application JavaScript
│   ├── controllers/   # UI panel controllers
│   │   ├── trade.js
│   │   ├── refuel.js
│   │   ├── repair.js
│   │   ├── upgrades.js
│   │   ├── info-broker.js
│   │   └── cargo-manifest.js
│   ├── views/         # Rendering modules
│   │   └── starmap/
│   │       ├── starmap.js     # Main coordinator
│   │       ├── scene.js       # Scene initialization
│   │       ├── stars.js       # Star rendering
│   │       ├── wormholes.js   # Wormhole rendering
│   │       └── interaction.js # User interaction
│   ├── data/          # Static game data
│   │   ├── star-data.js
│   │   └── wormhole-data.js
│   ├── utils/         # Utility functions
│   │   ├── seeded-random.js
│   │   └── string-utils.js
│   ├── game-animation.js      # Animation system
│   ├── game-constants.js      # Configuration objects
│   ├── game-events.js         # Economic events system
│   ├── game-information-broker.js  # Intelligence system
│   ├── game-navigation.js     # Navigation logic
│   ├── game-state.js          # State management
│   ├── game-trading.js        # Trading logic
│   └── game-ui.js             # UI coordinator
├── css/               # Component stylesheets
│   ├── base.css       # Global styles and resets
│   ├── hud.css        # HUD overlay styles
│   ├── panel/         # Panel-specific styles
│   │   ├── cargo-manifest.css
│   │   ├── info-broker.css
│   │   ├── refuel.css
│   │   ├── repair.css
│   │   ├── ship-status.css
│   │   ├── trade.css
│   │   └── upgrades.css
│   ├── modals.css     # Modal dialog styles
│   └── starmap-scene.css  # Starmap visualization
├── tests/             # Test suite
│   ├── unit/          # Unit tests
│   ├── property/      # Property-based tests
│   └── integration/   # Integration tests
├── notes/             # Project documentation (gitignored)
│   ├── tramp-freighter.md           # Complete PRD for full game
│   ├── tramp-freighter-01-core-loop.md  # Phase 1 spec
│   └── [other design docs]
└── starmap.html       # Main application entry point
```

## Organization Principles

- **Root level**: Application entry point (starmap.html)
- **vendor/**: Third-party libraries (Three.js) separated from application code
- **js/**: Application JavaScript organized by responsibility
  - **controllers/**: UI panel controllers (one per panel)
  - **views/**: Rendering modules (starmap visualization)
  - **data/**: Static game data (star systems, wormhole connections)
  - **utils/**: Reusable utility functions
  - **Core systems**: Game logic modules at root level
- **css/**: Component stylesheets organized by UI component
  - **panel/**: Panel-specific styles in subdirectory
  - Base, HUD, modals, and starmap styles at root level
- **tests/**: Test suite organized by test type
- **notes/**: Documentation and specifications (excluded from version control)
- **.kiro/specs/**: Formal feature specifications with requirements, design, and tasks
- **.kiro/steering/**: AI assistant configuration and steering rules

## Key Files

- `starmap.html`: Main application entry point with 3D visualization
- `js/game-state.js`: Central state management and game initialization
- `js/game-ui.js`: UI coordinator that delegates to panel controllers
- `js/game-constants.js`: Configuration objects for all game constants
- `js/controllers/`: UI panel controllers (trade, refuel, repair, upgrades, info-broker, cargo-manifest)
- `js/views/starmap/starmap.js`: Starmap coordinator module
- `notes/tramp-freighter.md`: Complete product requirements document for full game
- `.kiro/specs/architecture-refactor/`: Architecture refactoring specification
- `.kiro/specs/tramp-freighter-core-loop/`: Core game loop specification

## Development Status

- **Starmap Foundation**: Complete (v1.1)
- **Game Core Loop**: Complete (Phase 1)
- **Architecture Refactor**: Complete (improved code organization)
- **Current Phase**: Ready for Phase 2 features

## Development Phases

1. **Phase 1 (Current)**: Core Loop - Navigation, trading, fuel, save/load
2. **Phase 2**: Ship condition, dynamic prices, price discovery
3. **Phase 3**: NPCs, relationships, events
4. **Phase 4**: Danger systems (pirates, inspections, failures)
5. **Phase 5**: Content expansion and polish
6. **Phase 6**: Endgame (Range Extender, Pavonis Run)
