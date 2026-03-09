# Project Structure

## Directory Layout

```
.
├── .git/              # Git version control
├── .gitignore         # Ignores notes/ and vim swap files
├── .kiro/             # Kiro AI assistant configuration
│   ├── specs/         # Feature specifications
│   │   ├── architecture-refactor/       # Completed: Code organization
│   │   ├── react-migration/             # Completed: React migration
│   │   ├── sol-sector-starmap/          # Completed: 3D starmap foundation
│   │   └── tramp-freighter-core-loop/   # Completed: Game MVP
│   └── steering/      # AI steering rules and guidelines
├── src/               # React application source
│   ├── main.jsx       # Application entry point
│   ├── App.jsx        # Root component
│   ├── assets/        # Images and static resources
│   ├── components/    # Shared UI components
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   └── ErrorBoundary.jsx
│   ├── context/       # React Context providers
│   │   └── GameContext.jsx
│   ├── hooks/         # Custom React hooks
│   │   ├── useGameEvent.js
│   │   ├── useGameAction.js
│   │   ├── useAnimationLock.js
│   │   └── useNotification.js
│   ├── features/      # Feature modules
│   │   ├── hud/
│   │   │   ├── HUD.jsx
│   │   │   ├── ResourceBar.jsx
│   │   │   ├── DateDisplay.jsx
│   │   │   ├── ShipStatus.jsx
│   │   │   └── QuickAccessButtons.jsx
│   │   ├── navigation/
│   │   │   ├── StarMapCanvas.jsx
│   │   │   └── navigationUtils.js
│   │   ├── station/
│   │   │   ├── StationMenu.jsx
│   │   │   └── PanelContainer.jsx
│   │   ├── trade/
│   │   │   ├── TradePanel.jsx
│   │   │   └── tradeUtils.js
│   │   ├── refuel/
│   │   │   ├── RefuelPanel.jsx
│   │   │   └── refuelUtils.js
│   │   ├── repair/
│   │   │   ├── RepairPanel.jsx
│   │   │   └── repairUtils.js
│   │   ├── upgrades/
│   │   │   ├── UpgradesPanel.jsx
│   │   │   └── upgradesUtils.js
│   │   ├── info-broker/
│   │   │   ├── InfoBrokerPanel.jsx
│   │   │   └── infoBrokerUtils.js
│   │   ├── cargo/
│   │   │   ├── CargoManifestPanel.jsx
│   │   │   └── cargoUtils.js
│   │   ├── ship-status/
│   │   │   └── ShipStatusPanel.jsx
│   │   └── dev-admin/
│   │       └── DevAdminPanel.jsx
│   └── game/          # Game logic
│       ├── constants.js
│       ├── game-trading.js
│       ├── game-navigation.js
│       ├── game-events.js
│       ├── game-information-broker.js
│       ├── state/
│       │   ├── game-state-manager.js
│       │   ├── save-load.js
│       │   └── state-validators.js
│       ├── engine/
│       │   ├── game-animation.js
│       │   └── scene.js
│       ├── data/
│       │   ├── star-data.js
│       │   └── wormhole-data.js
│       └── utils/
│           ├── seeded-random.js
│           └── string-utils.js
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
├── index.html         # Vite entry point
├── vite.config.js     # Vite configuration
├── vitest.config.js   # Vitest configuration
├── package.json       # Dependencies and scripts
└── package-lock.json  # Dependency lock file
```

## Organization Principles

- **Root level**: Build configuration (vite.config.js, vitest.config.js, package.json) and HTML entry point (index.html)
- **src/**: React application source code organized by feature
  - **features/**: Feature-based organization with components, hooks, and utilities co-located
  - **components/**: Shared UI components used across features
  - **context/**: React Context providers (GameContext)
  - **hooks/**: Custom React hooks (useGameEvent, useGameAction, etc.)
  - **game/**: Game logic organized by category
    - **state/**: State management (GameCoordinator, save/load)
    - **engine/**: Scene and animation logic
    - **data/**: Static game data (star systems, wormhole connections)
    - **utils/**: Reusable utility functions
  - **assets/**: Images and static resources
  - **main.jsx**: Application entry point
  - **App.jsx**: Root component
- **css/**: Component stylesheets
  - **panel/**: Panel-specific styles in subdirectory
  - Base, HUD, modals, and starmap styles at root level
- **tests/**: Test suite organized by test type
- **notes/**: Documentation and specifications (excluded from version control)
- **.kiro/specs/**: Formal feature specifications with requirements, design, and tasks
- **.kiro/steering/**: AI assistant configuration and steering rules

## Key Files

- `index.html`: Vite entry point for React application
- `src/main.jsx`: Application entry point, initializes GameCoordinator, imports global CSS
- `src/App.jsx`: Root component, manages view mode state
- `src/context/GameContext.jsx`: Provides GameCoordinator to all components
- `src/hooks/useGameEvent.js`: Custom hook for subscribing to GameCoordinator events
- `src/hooks/useGameAction.js`: Custom hook for triggering game actions
- `src/game/state/game-state-manager.js`: Central state management
- `src/game/constants.js`: Configuration objects for all game constants
- `src/features/`: Feature modules with React components and utilities
- `vite.config.js`: Vite build configuration
- `vitest.config.js`: Vitest test configuration
- `notes/tramp-freighter.md`: Complete product requirements document for full game
- `.kiro/specs/react-migration/`: React migration specification
- `.kiro/specs/tramp-freighter-core-loop/`: Core game loop specification

## Development Status

- **Starmap Foundation**: Complete (v1.1)
- **Game Core Loop**: Complete (Phase 1)
- **Architecture Refactor**: Complete (improved code organization)
- **React Migration**: Complete (React 18+ with Vite)
- **Current Phase**: Feature development and polish

## Development Phases

1. **Phase 1 (Current)**: Core Loop - Navigation, trading, fuel, save/load
2. **Phase 2**: Ship condition, dynamic prices, price discovery
3. **Phase 3**: NPCs, relationships, events
4. **Phase 4**: Danger systems (pirates, inspections, failures)
5. **Phase 5**: Content expansion and polish
6. **Phase 6**: Endgame (Range Extender, Pavonis Run)
