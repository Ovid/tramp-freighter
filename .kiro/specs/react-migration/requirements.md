# Requirements Document

## Introduction

This document specifies the requirements for migrating the Tramp Freighter Blues UI layer from Vanilla JavaScript to React 18+ using JavaScript (ES Modules), while preserving all existing game logic, state management, and Three.js rendering functionality. The migration aims to improve UI maintainability and scalability without affecting game behavior or performance. The migration will use Vite as the build tool and Vitest for testing.

## Glossary

- **System**: The Tramp Freighter Blues game application
- **UI Layer**: The presentation components responsible for rendering game information and accepting user input, located in `js/ui/` and portions of `js/controllers/`
- **Game Logic**: The core game systems including state management, trading calculations, navigation mechanics, and event processing, located in `js/state/`, `js/game-*.js`
- **Rendering Engine**: The Three.js-based 3D starmap visualization system, located in `js/views/starmap/`
- **GameStateManager**: The existing singleton class that manages all game state and provides event subscription mechanisms
- **Bridge Pattern**: The architectural pattern connecting the imperative GameStateManager to React's declarative component model
- **View Mode**: The current UI state determining which panels are visible (ORBIT, STATION, PANEL)
- **Vite**: The build tool and development server used for the React application
- **Vitest**: The testing framework used for unit and property-based tests
- **React 18+**: The target version of the React framework for the migration
- **Error Boundary**: A React component that catches JavaScript errors in child components and displays fallback UI
- **index.html**: The new HTML entry point for the Vite-based React application
- **localStorage Format**: The structure of saved game data stored in browser localStorage
- **GameContext**: The React Context that holds the GameStateManager instance
- **useGameEvent**: A custom React hook that subscribes to GameStateManager events
- **useGameAction**: A custom React hook that provides methods to trigger game actions
- **StarMapCanvas**: The React component that wraps the Three.js rendering engine
- **Feature Module**: A directory containing related components, hooks, and utilities for a specific game feature
- **Assets Directory**: The directory containing images and static resources (src/assets)
- **Components Directory**: The directory containing shared UI components (src/components)
- **Context Directory**: The directory containing React Context providers (src/context)
- **Features Directory**: The directory containing feature-specific modules (src/features)
- **Game Directory**: The directory containing migrated game logic (src/game)
- **Hooks Directory**: The directory containing custom React hooks (src/hooks)
- **Engine Directory**: The subdirectory of game containing scene and animation logic (src/game/engine)
- **ES Modules**: The JavaScript module system using import/export syntax
- **initScene**: The existing function from scene.js that initializes the Three.js scene
- **initNewGame**: The GameStateManager method that creates a new game state
- **loadGame**: The GameStateManager method that loads a saved game state

## Requirements

### Requirement 1

**User Story:** As a player, I want the game to function identically after the React migration, so that my gameplay experience is unchanged.

#### Acceptance Criteria

1. WHEN the player performs any game action THEN the System SHALL produce the same game state changes as the pre-migration version
2. WHEN the player navigates between systems THEN the System SHALL consume fuel and update position identically to the pre-migration version
3. WHEN the player executes trades THEN the System SHALL calculate prices and update cargo identically to the pre-migration version
4. WHEN the player saves and loads games THEN the System SHALL persist and restore state identically to the pre-migration version
5. WHEN the player views any UI panel THEN the System SHALL display the same information as the pre-migration version

### Requirement 2

**User Story:** As a developer, I want all manual DOM manipulation removed from the codebase, so that the UI is managed through React's declarative model.

#### Acceptance Criteria

1. WHEN the codebase is searched for DOM manipulation methods THEN the System SHALL contain no instances of `document.querySelector` in UI code
2. WHEN the codebase is searched for DOM manipulation methods THEN the System SHALL contain no instances of `innerHTML` assignments in UI code
3. WHEN the codebase is searched for DOM manipulation methods THEN the System SHALL contain no instances of `createElement` in UI code
4. WHEN the codebase is searched for DOM manipulation methods THEN the System SHALL contain no instances of `appendChild` in UI code
5. WHEN UI updates occur THEN the System SHALL use React component re-renders exclusively

### Requirement 3

**User Story:** As a developer, I want the GameStateManager to remain the single source of truth, so that game logic is not duplicated in React state.

#### Acceptance Criteria

1. WHEN game state changes occur THEN the System SHALL update state only through GameStateManager methods
2. WHEN React components need game state THEN the System SHALL read state from GameStateManager exclusively
3. WHEN the application initializes THEN the System SHALL create exactly one GameStateManager instance
4. WHEN React components subscribe to state changes THEN the System SHALL use GameStateManager event subscription mechanisms
5. WHEN game state is modified THEN the System SHALL not duplicate state in React Context or Redux stores

### Requirement 4

**User Story:** As a player, I want the Three.js starmap to render smoothly at 60 FPS, so that navigation remains responsive after the React migration.

#### Acceptance Criteria

1. WHEN the starmap renders THEN the System SHALL maintain 60 frames per second during camera movement
2. WHEN React components re-render THEN the System SHALL not trigger Three.js scene re-initialization
3. WHEN the starmap initializes THEN the System SHALL execute scene setup exactly once per application load
4. WHEN the animation loop runs THEN the System SHALL execute outside React render cycle
5. WHEN the player interacts with the starmap THEN the System SHALL respond to input within 100 milliseconds

### Requirement 5

**User Story:** As a developer, I want a Bridge Pattern connecting GameStateManager to React, so that components can reactively respond to game state changes.

#### Acceptance Criteria

1. WHEN a React component needs game state THEN the System SHALL provide a GameContext containing the GameStateManager instance
2. WHEN a React component subscribes to game events THEN the System SHALL provide a useGameEvent hook
3. WHEN a game event fires THEN the System SHALL trigger re-renders only in subscribed components
4. WHEN a component unmounts THEN the System SHALL automatically unsubscribe from GameStateManager events
5. WHEN multiple components subscribe to the same event THEN the System SHALL notify all subscribers

### Requirement 34

**User Story:** As a developer, I want useGameEvent to implement the subscription mechanism correctly, so that components react to GameStateManager events.

#### Acceptance Criteria

1. WHEN useGameEvent is called with an event name THEN the System SHALL call gameStateManager.subscribe with that event name
2. WHEN the subscription callback fires THEN the System SHALL update a local useState in the hook
3. WHEN the local useState updates THEN the System SHALL trigger a re-render of only the calling component
4. WHEN the component unmounts THEN the System SHALL call the unsubscribe cleanup function
5. WHEN useGameEvent is used THEN the System SHALL return the current state value to the component

### Requirement 6

**User Story:** As a developer, I want the project structured with feature-based organization, so that related UI and logic are co-located.

#### Acceptance Criteria

1. WHEN the project structure is examined THEN the System SHALL organize components in feature directories
2. WHEN shared UI components exist THEN the System SHALL place them in a components directory
3. WHEN game logic files are migrated THEN the System SHALL preserve them in a game directory under src
4. WHEN custom hooks are created THEN the System SHALL place them in a hooks directory
5. WHEN the build executes THEN the System SHALL use Vite as the build tool

### Requirement 7

**User Story:** As a developer, I want the HUD to display game resources reactively, so that players see real-time updates without manual DOM manipulation.

#### Acceptance Criteria

1. WHEN player credits change THEN the System SHALL update the HUD credits display
2. WHEN ship fuel changes THEN the System SHALL update the HUD fuel display
3. WHEN game time advances THEN the System SHALL update the HUD date display
4. WHEN ship condition changes THEN the System SHALL update the HUD condition bars
5. WHEN the HUD subscribes to events THEN the System SHALL use the useGameEvent hook

### Requirement 8

**User Story:** As a developer, I want UI panels converted to React components, so that panel logic uses declarative rendering.

#### Acceptance Criteria

1. WHEN the trade panel displays THEN the System SHALL render it as a React component
2. WHEN the refuel panel displays THEN the System SHALL render it as a React component
3. WHEN the repair panel displays THEN the System SHALL render it as a React component
4. WHEN the upgrades panel displays THEN the System SHALL render it as a React component
5. WHEN the information broker panel displays THEN the System SHALL render it as a React component
6. WHEN the cargo manifest panel displays THEN the System SHALL render it as a React component
7. WHEN the ship status panel displays THEN the System SHALL render it as a React component

### Requirement 9

**User Story:** As a developer, I want view mode management in React, so that panel visibility is controlled through React state.

#### Acceptance Criteria

1. WHEN the application renders THEN the System SHALL manage view mode in App component state
2. WHEN view mode is ORBIT THEN the System SHALL display the starmap and HUD only
3. WHEN view mode is STATION THEN the System SHALL display the station menu
4. WHEN view mode is PANEL THEN the System SHALL display the active panel
5. WHEN view mode changes THEN the System SHALL update visible components accordingly

### Requirement 10

**User Story:** As a developer, I want existing CSS styles preserved, so that visual appearance remains consistent after migration.

#### Acceptance Criteria

1. WHEN components render THEN the System SHALL use existing CSS class names from css directory
2. WHEN the application loads THEN the System SHALL import existing CSS files
3. WHEN styled components are needed THEN the System SHALL prefer CSS modules over inline styles
4. WHEN layout changes occur THEN the System SHALL maintain existing visual hierarchy
5. WHEN animations play THEN the System SHALL use existing CSS animation definitions

### Requirement 11

**User Story:** As a developer, I want all existing tests migrated to Vitest, so that test coverage is preserved.

#### Acceptance Criteria

1. WHEN tests execute THEN the System SHALL use Vitest as the test runner
2. WHEN unit tests run THEN the System SHALL verify the same functionality as pre-migration tests
3. WHEN property-based tests run THEN the System SHALL verify the same properties as pre-migration tests
4. WHEN integration tests run THEN the System SHALL verify the same workflows as pre-migration tests
5. WHEN the test suite completes THEN the System SHALL report identical coverage metrics to pre-migration

### Requirement 12

**User Story:** As a developer, I want game logic files moved to src/game, so that they are organized within the Vite project structure.

#### Acceptance Criteria

1. WHEN game constants are imported THEN the System SHALL resolve them from src/game/constants.js
2. WHEN state management is imported THEN the System SHALL resolve it from src/game/state directory
3. WHEN trading logic is imported THEN the System SHALL resolve it from src/game directory
4. WHEN navigation logic is imported THEN the System SHALL resolve it from src/game directory
5. WHEN all imports are resolved THEN the System SHALL maintain correct module dependencies

### Requirement 13

**User Story:** As a developer, I want the GameContext to handle initialization gracefully, so that components do not render with null state.

#### Acceptance Criteria

1. WHEN the application starts THEN the System SHALL initialize GameStateManager before rendering components
2. WHEN GameStateManager is null THEN the System SHALL display a loading state
3. WHEN GameStateManager initialization fails THEN the System SHALL display an error message
4. WHEN GameStateManager is ready THEN the System SHALL render the main application
5. WHEN components access GameContext THEN the System SHALL provide a non-null GameStateManager instance

### Requirement 14

**User Story:** As a developer, I want the StarMapCanvas component to wrap Three.js rendering, so that the 3D scene integrates with React lifecycle.

#### Acceptance Criteria

1. WHEN StarMapCanvas mounts THEN the System SHALL initialize the Three.js scene once
2. WHEN StarMapCanvas renders THEN the System SHALL use a ref to target the container element
3. WHEN the scene initializes THEN the System SHALL append the renderer DOM element to the ref
4. WHEN StarMapCanvas unmounts THEN the System SHALL dispose of Three.js resources
5. WHEN React re-renders THEN the System SHALL not re-initialize the Three.js scene

### Requirement 15

**User Story:** As a developer, I want panel controllers extracted to utility functions, so that business logic is separated from React components.

#### Acceptance Criteria

1. WHEN trade validation occurs THEN the System SHALL use pure utility functions
2. WHEN refuel calculations occur THEN the System SHALL use pure utility functions
3. WHEN repair cost calculations occur THEN the System SHALL use pure utility functions
4. WHEN upgrade validation occurs THEN the System SHALL use pure utility functions
5. WHEN utility functions execute THEN the System SHALL not depend on React hooks or component state

### Requirement 16

**User Story:** As a developer, I want a useGameAction hook, so that components can trigger game actions through a consistent interface.

#### Acceptance Criteria

1. WHEN a component needs to trigger game actions THEN the System SHALL provide a useGameAction hook
2. WHEN useGameAction is called THEN the System SHALL return methods that call GameStateManager functions
3. WHEN a game action is triggered THEN the System SHALL execute the corresponding GameStateManager method
4. WHEN a game action completes THEN the System SHALL trigger appropriate GameStateManager events
5. WHEN multiple components use useGameAction THEN the System SHALL provide the same action methods to all

### Requirement 17

**User Story:** As a developer, I want the src directory structure to match the specified organization, so that files are located predictably.

#### Acceptance Criteria

1. WHEN the src directory is examined THEN the System SHALL contain an assets subdirectory
2. WHEN the src directory is examined THEN the System SHALL contain a components subdirectory
3. WHEN the src directory is examined THEN the System SHALL contain a context subdirectory
4. WHEN the src directory is examined THEN the System SHALL contain a features subdirectory
5. WHEN the src directory is examined THEN the System SHALL contain a game subdirectory
6. WHEN the src directory is examined THEN the System SHALL contain a hooks subdirectory
7. WHEN the src directory is examined THEN the System SHALL contain App.jsx
8. WHEN the src directory is examined THEN the System SHALL contain main.jsx

### Requirement 18

**User Story:** As a developer, I want the game directory to organize migrated logic by category, so that related files are grouped together.

#### Acceptance Criteria

1. WHEN the game directory is examined THEN the System SHALL contain constants.js migrated from game-constants.js
2. WHEN the game directory is examined THEN the System SHALL contain a state subdirectory
3. WHEN the game directory is examined THEN the System SHALL contain an engine subdirectory
4. WHEN the game directory is examined THEN the System SHALL contain a data subdirectory
5. WHEN the state subdirectory is examined THEN the System SHALL contain game-state-manager.js and save-load.js
6. WHEN the engine subdirectory is examined THEN the System SHALL contain scene.js and game-animation.js
7. WHEN the data subdirectory is examined THEN the System SHALL contain star-data.js and wormhole-data.js

### Requirement 19

**User Story:** As a developer, I want the features directory to contain all feature modules, so that feature-specific code is co-located.

#### Acceptance Criteria

1. WHEN the features directory is examined THEN the System SHALL contain a hud subdirectory
2. WHEN the features directory is examined THEN the System SHALL contain a navigation subdirectory
3. WHEN the features directory is examined THEN the System SHALL contain a station subdirectory
4. WHEN the features directory is examined THEN the System SHALL contain a trade subdirectory
5. WHEN the features directory is examined THEN the System SHALL contain a refuel subdirectory
6. WHEN the features directory is examined THEN the System SHALL contain a ship-status subdirectory

### Requirement 20

**User Story:** As a developer, I want React 18+ as the target framework, so that the migration uses stable and well-supported React features.

#### Acceptance Criteria

1. WHEN package.json is examined THEN the System SHALL specify React version 18 or higher
2. WHEN package.json is examined THEN the System SHALL specify ReactDOM version 18 or higher
3. WHEN React features are used THEN the System SHALL use only features available in React 18+
4. WHEN the build executes THEN the System SHALL compile with React 18+ compatibility
5. WHEN the application runs THEN the System SHALL use React 18+ runtime

### Requirement 21

**User Story:** As a developer, I want exact event names from GameStateManager.subscribers used, so that subscriptions match existing event emissions.

#### Acceptance Criteria

1. WHEN components subscribe to credit changes THEN the System SHALL use the event name creditsChanged as defined in GameStateManager.subscribers
2. WHEN components subscribe to fuel changes THEN the System SHALL use the event name fuelChanged as defined in GameStateManager.subscribers
3. WHEN components subscribe to location changes THEN the System SHALL use the event name locationChanged as defined in GameStateManager.subscribers
4. WHEN components subscribe to time changes THEN the System SHALL use the event name timeChanged as defined in GameStateManager.subscribers
5. WHEN components subscribe to cargo changes THEN the System SHALL use the event name cargoChanged as defined in GameStateManager.subscribers
6. WHEN components subscribe to ship condition changes THEN the System SHALL use the event name shipConditionChanged as defined in GameStateManager.subscribers

### Requirement 22

**User Story:** As a developer, I want Vite project scaffolding created, so that the build system is properly configured.

#### Acceptance Criteria

1. WHEN the project root is examined THEN the System SHALL contain package.json with Vite dependencies
2. WHEN the project root is examined THEN the System SHALL contain vite.config.js with proper configuration
3. WHEN the build command runs THEN the System SHALL use Vite to bundle the application
4. WHEN the dev server starts THEN the System SHALL use Vite dev server
5. WHEN the project is built THEN the System SHALL output to a dist directory

### Requirement 23

**User Story:** As a developer, I want CSS files imported globally in main.jsx, so that existing styles are available to all components.

#### Acceptance Criteria

1. WHEN main.jsx is examined THEN the System SHALL import CSS files from the css directory
2. WHEN the application loads THEN the System SHALL apply imported CSS styles globally
3. WHEN components render THEN the System SHALL have access to all imported CSS classes
4. WHEN CSS files are updated THEN the System SHALL hot-reload styles in development
5. WHEN the build executes THEN the System SHALL bundle CSS files into the output

### Requirement 24

**User Story:** As a developer, I want the HUD to contain ResourceBar, DateDisplay, and ShipStatus components, so that the HUD is properly decomposed.

#### Acceptance Criteria

1. WHEN the HUD feature is examined THEN the System SHALL contain a ResourceBar component
2. WHEN the HUD feature is examined THEN the System SHALL contain a DateDisplay component
3. WHEN the HUD feature is examined THEN the System SHALL contain a ShipStatus component
4. WHEN ResourceBar renders THEN the System SHALL display credits and fuel
5. WHEN DateDisplay renders THEN the System SHALL display game time
6. WHEN ShipStatus renders THEN the System SHALL display ship condition

### Requirement 25

**User Story:** As a developer, I want the App component to render StarMapCanvas, HUD, StationMenu, and PanelContainer conditionally, so that view mode controls visibility.

#### Acceptance Criteria

1. WHEN App renders THEN the System SHALL always render StarMapCanvas
2. WHEN App renders THEN the System SHALL always render HUD
3. WHEN view mode is STATION THEN the System SHALL render StationMenu
4. WHEN view mode is PANEL THEN the System SHALL render PanelContainer
5. WHEN StarMapCanvas renders THEN the System SHALL apply z-index 0 for layering

### Requirement 26

**User Story:** As a developer, I want the trade panel to call GameStateManager methods directly, so that trade logic is not duplicated.

#### Acceptance Criteria

1. WHEN the trade panel needs known prices THEN the System SHALL call gameManager.getKnownPrices
2. WHEN the player buys goods THEN the System SHALL call gameManager.buyGood
3. WHEN the player sells goods THEN the System SHALL call gameManager.sellGood
4. WHEN the trade panel validates transactions THEN the System SHALL use extracted utility functions
5. WHEN the trade panel subscribes to cargo changes THEN the System SHALL use useGameEvent with cargoChanged

### Requirement 27

**User Story:** As a developer, I want the refuel panel to use local React state for the amount slider, so that UI state is managed appropriately.

#### Acceptance Criteria

1. WHEN the refuel panel renders THEN the System SHALL maintain slider value in local React state
2. WHEN the slider value changes THEN the System SHALL update local state only
3. WHEN refuel is validated THEN the System SHALL call gameManager.validateRefuel
4. WHEN refuel is submitted THEN the System SHALL call gameManager.refuel
5. WHEN refuel completes THEN the System SHALL reset local slider state

### Requirement 28

**User Story:** As a developer, I want Phase 1 deliverables clearly defined, so that the initial migration scope is understood.

#### Acceptance Criteria

1. WHEN Phase 1 is complete THEN the System SHALL have Vite project scaffolding with package.json and vite.config.js
2. WHEN Phase 1 is complete THEN the System SHALL have game logic moved to src/game preserving references
3. WHEN Phase 1 is complete THEN the System SHALL have Bridge Pattern implemented with GameContext and useGameEvent
4. WHEN Phase 1 is complete THEN the System SHALL have StarMapCanvas component rendering the star field
5. WHEN Phase 1 is complete THEN the System SHALL have basic HUD displaying credits and fuel using the Bridge

### Requirement 29

**User Story:** As a developer, I want existing game logic preserved without reimplementation, so that tested and correct code is not duplicated.

#### Acceptance Criteria

1. WHEN trading calculations are needed THEN the System SHALL import and use existing functions from game-trading.js
2. WHEN navigation calculations are needed THEN the System SHALL import and use existing functions from game-navigation.js
3. WHEN fuel consumption is calculated THEN the System SHALL import and use existing functions from game-state-manager.js
4. WHEN game logic is migrated THEN the System SHALL not reimplement mathematics in Redux or React reducers
5. WHEN game logic is migrated THEN the System SHALL preserve all existing function signatures and behavior

### Requirement 30

**User Story:** As a developer, I want JavaScript ES Modules used throughout, so that the codebase uses modern module syntax.

#### Acceptance Criteria

1. WHEN modules are defined THEN the System SHALL use export keyword for public functions and classes
2. WHEN modules are consumed THEN the System SHALL use import keyword for dependencies
3. WHEN the application builds THEN the System SHALL resolve ES Module imports correctly
4. WHEN modules are organized THEN the System SHALL use named exports for utilities and default exports for components
5. WHEN the codebase is examined THEN the System SHALL contain no CommonJS require statements

### Requirement 31

**User Story:** As a developer, I want the StarMapCanvas to call initScene from scene.js, so that existing scene initialization is reused.

#### Acceptance Criteria

1. WHEN StarMapCanvas initializes THEN the System SHALL import initScene from scene.js
2. WHEN StarMapCanvas mounts THEN the System SHALL call initScene inside a useEffect hook
3. WHEN the useEffect hook is defined THEN the System SHALL use an empty dependency array
4. WHEN initScene is called THEN the System SHALL pass the container ref as a parameter
5. WHEN initScene returns THEN the System SHALL receive the renderer domElement and append it to the ref

### Requirement 32

**User Story:** As a developer, I want the GameStateManager initialized in main.jsx, so that it is ready before components render.

#### Acceptance Criteria

1. WHEN main.jsx executes THEN the System SHALL call either initNewGame or loadGame
2. WHEN initNewGame is called THEN the System SHALL create a new GameStateManager instance
3. WHEN loadGame is called THEN the System SHALL restore GameStateManager from localStorage
4. WHEN GameStateManager is initialized THEN the System SHALL pass the instance to GameContext provider
5. WHEN the provider is ready THEN the System SHALL render the App component

### Requirement 33

**User Story:** As a developer, I want shared UI components for common patterns, so that UI elements are reusable across features.

#### Acceptance Criteria

1. WHEN the components directory is examined THEN the System SHALL contain a Button component
2. WHEN the components directory is examined THEN the System SHALL contain a Modal component
3. WHEN the components directory is examined THEN the System SHALL contain a Card component
4. WHEN features need common UI elements THEN the System SHALL import components from the components directory
5. WHEN shared components are used THEN the System SHALL maintain consistent styling and behavior

### Requirement 35

**User Story:** As a developer, I want a new HTML entry point for the React application, so that Vite can properly serve the application.

#### Acceptance Criteria

1. WHEN the project root is examined THEN the System SHALL contain an index.html file
2. WHEN index.html is examined THEN the System SHALL contain a root div element for React mounting
3. WHEN index.html is examined THEN the System SHALL include a script tag importing main.jsx
4. WHEN the dev server starts THEN the System SHALL serve index.html as the entry point
5. WHEN the application builds THEN the System SHALL use index.html as the template for the output

### Requirement 36

**User Story:** As a developer, I want React Error Boundaries implemented, so that errors are handled gracefully without crashing the entire application.

#### Acceptance Criteria

1. WHEN a React component throws an error THEN the System SHALL catch it with an Error Boundary
2. WHEN an Error Boundary catches an error THEN the System SHALL display a fallback UI
3. WHEN an Error Boundary catches an error THEN the System SHALL log the error details
4. WHEN GameStateManager initialization fails THEN the System SHALL display an error message with recovery options
5. WHEN Three.js rendering fails THEN the System SHALL display an error message without crashing other UI components

### Requirement 37

**User Story:** As a player, I want my existing saved games to work after the migration, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL read localStorage using the same keys as pre-migration
2. WHEN saved game data is loaded THEN the System SHALL validate the data format
3. WHEN saved game data format is incompatible THEN the System SHALL attempt migration to new format
4. WHEN migration fails THEN the System SHALL preserve the original save and display an error message
5. WHEN new saves are created THEN the System SHALL use a format compatible with the migration version

### Requirement 38

**User Story:** As a developer, I want the development server to coexist with the existing setup, so that migration can be incremental.

#### Acceptance Criteria

1. WHEN the Vite dev server starts THEN the System SHALL run on a different port than the existing setup
2. WHEN both servers are running THEN the System SHALL not conflict with each other
3. WHEN the dev server is accessed THEN the System SHALL serve the React version of the application
4. WHEN the original starmap.html is accessed THEN the System SHALL continue to work with the vanilla JS version
5. WHEN development is complete THEN the System SHALL provide a clear cutover path from old to new

### Requirement 39

**User Story:** As a developer, I want CSS imported strategically, so that styles are maintainable and performant.

#### Acceptance Criteria

1. WHEN feature components are created THEN the System SHALL prefer CSS modules for component-specific styles
2. WHEN global styles are needed THEN the System SHALL import them in main.jsx
3. WHEN CSS modules are used THEN the System SHALL generate scoped class names
4. WHEN the build executes THEN the System SHALL tree-shake unused CSS
5. WHEN CSS conflicts occur THEN the System SHALL resolve them through module scoping

### Requirement 40

**User Story:** As a developer, I want test migration strategy documented, so that test coverage is maintained during migration.

#### Acceptance Criteria

1. WHEN existing tests are examined THEN the System SHALL identify which tests need migration
2. WHEN property-based tests are migrated THEN the System SHALL use fast-check library for Vitest
3. WHEN test setup is migrated THEN the System SHALL configure Vitest to match existing test environment
4. WHEN mocking is needed THEN the System SHALL use Vitest mocking utilities
5. WHEN tests are migrated THEN the System SHALL maintain the same test coverage percentage

### Requirement 41

**User Story:** As a developer, I want useGameEvent optimized for performance, so that React updates are efficient.

#### Acceptance Criteria

1. WHEN multiple events fire rapidly THEN the System SHALL batch state updates when possible
2. WHEN useGameEvent updates state THEN the System SHALL use React 18 automatic batching
3. WHEN components subscribe to the same event THEN the System SHALL not cause redundant re-renders
4. WHEN event data is large THEN the System SHALL avoid unnecessary object cloning
5. WHEN profiling the application THEN the System SHALL show minimal overhead from the Bridge Pattern

### Requirement 42

**User Story:** As a developer, I want modal dialogs implemented as React components, so that critical confirmations and messages are displayed consistently.

#### Acceptance Criteria

1. WHEN modal components are created THEN the System SHALL use React Portals for rendering
2. WHEN a modal is displayed THEN the System SHALL block interaction with underlying UI elements
3. WHEN a modal is dismissed THEN the System SHALL remove the portal and restore focus appropriately
4. WHEN modal patterns are implemented THEN the System SHALL maintain the existing modal behavior from modal-manager.js
5. WHEN modals are open THEN the System SHALL not block GameStateManager state updates

### Requirement 43

**User Story:** As a developer, I want the animation system to integrate with React without interfering with animations, so that jump sequences remain smooth and input is properly locked.

#### Acceptance Criteria

1. WHEN animations execute THEN the System SHALL run the animation loop outside React render cycle
2. WHEN an animation starts THEN the System SHALL provide a useAnimationLock hook that disables UI interactions
3. WHEN an animation completes THEN the System SHALL trigger React updates through GameStateManager events
4. WHEN animation state changes THEN the System SHALL not trigger React component re-renders
5. WHEN the useAnimationLock hook is used THEN the System SHALL automatically unlock when animations complete

### Requirement 44

**User Story:** As a developer, I want a notification system implemented in React, so that success messages, errors, and game events are displayed to players.

#### Acceptance Criteria

1. WHEN the notification system is implemented THEN the System SHALL provide a useNotification custom hook
2. WHEN useNotification is called THEN the System SHALL provide showError, showSuccess, and showNotification methods
3. WHEN notifications are displayed THEN the System SHALL maintain the existing timing and behavior from notification-manager.js
4. WHEN multiple notifications are triggered THEN the System SHALL queue them appropriately
5. WHEN notifications expire THEN the System SHALL remove them with fade animations matching existing CSS

### Requirement 45

**User Story:** As a developer, I want the dev admin panel migrated to React, so that development tools are available in the React version.

#### Acceptance Criteria

1. WHEN dev mode is enabled THEN the System SHALL detect the .dev file using the same approach as the vanilla version
2. WHEN dev mode is enabled THEN the System SHALL render the DevAdminPanel component
3. WHEN dev mode is disabled THEN the System SHALL not render dev-only components
4. WHEN the production build executes THEN the System SHALL exclude dev admin code through tree-shaking
5. WHEN the dev admin panel is used THEN the System SHALL provide the same functionality as DevAdminPanelController

### Requirement 46

**User Story:** As a player, I want quick access buttons in the HUD, so that I can quickly access common actions without navigating through menus.

#### Acceptance Criteria

1. WHEN the HUD renders THEN the System SHALL display quick access buttons for system info and station docking
2. WHEN the player location changes THEN the System SHALL update quick access button enabled/disabled state
3. WHEN an animation is running THEN the System SHALL disable quick access buttons using the animation lock
4. WHEN a quick access button is clicked THEN the System SHALL trigger the appropriate view mode change
5. WHEN quick access buttons are implemented THEN the System SHALL maintain the same behavior as the vanilla version
