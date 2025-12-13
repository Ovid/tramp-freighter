# Requirements Document

## Introduction

This specification defines the architectural refactoring needed to improve maintainability and organization of the Tramp Freighter Blues codebase. The refactoring addresses code organization issues (3000+ line files), improves separation of concerns through controller extraction, reorganizes constants into grouped configuration objects, separates vendor code from application code, and updates steering documents to reflect the new structure.

## Glossary

- **UIManager**: The main UI coordination class that manages all user interface panels and interactions
- **Panel Controller**: A focused class responsible for managing a single UI panel (trade, refuel, repair, upgrade, info broker)
- **GameStateManager**: The central state management class that maintains all game state and coordinates state changes
- **Configuration Object**: A nested object structure that groups related constants by domain
- **Vendor Code**: Third-party libraries (Three.js) that should be separated from application code
- **Starmap Module**: A focused module responsible for a specific aspect of starmap rendering (scene management, star rendering, wormhole rendering, interaction handling)
- **Star Data**: The static array of star system information (coordinates, names, spectral types, wormhole counts, station counts)
- **Component Stylesheet**: A CSS file containing styles for a single UI component or panel

## Requirements

### Requirement 1

**User Story:** As a developer, I want UI panel logic extracted into focused controllers, so that the codebase is more maintainable and testable.

#### Acceptance Criteria

1. WHEN the UIManager is initialized THEN the system SHALL create separate controller instances for each UI panel (trade, refuel, repair, upgrade, info broker)
2. WHEN a controller is instantiated THEN the UIManager SHALL pass specific DOM element references cached by UIManager to the controller constructor
3. WHEN a panel needs to be shown THEN the UIManager SHALL delegate to the appropriate controller's show method
4. WHEN a panel needs to be hidden THEN the UIManager SHALL delegate to the appropriate controller's hide method
5. WHEN user interactions occur within a panel THEN the system SHALL route the interaction to the appropriate controller's handler method
6. WHEN a controller needs to update its display THEN the system SHALL use only the DOM elements and game state provided during initialization

### Requirement 2

**User Story:** As a developer, I want game constants grouped by domain, so that related configuration values are organized together and easier to understand.

#### Acceptance Criteria

1. WHEN constants are defined THEN the system SHALL group related constants into nested configuration objects
2. WHEN existing configuration objects are present THEN the system SHALL preserve them (ECONOMY_CONFIG, VISUAL_CONFIG, LABEL_CONFIG, NOTIFICATION_CONFIG, ANIMATION_CONFIG)
3. WHEN ungrouped constants exist THEN the system SHALL organize them into new configuration objects (SHIP_CONFIG, NAVIGATION_CONFIG)
4. WHEN ship-related constants are needed THEN the system SHALL access them through the SHIP_CONFIG object
5. WHEN navigation-related constants are needed THEN the system SHALL access them through the NAVIGATION_CONFIG object

### Requirement 3

**User Story:** As a developer, I want vendor libraries separated from application code, so that the project structure clearly distinguishes third-party code from application code.

#### Acceptance Criteria

1. WHEN the project is organized THEN the system SHALL place vendor libraries in a top-level vendor/ directory
2. WHEN Three.js is referenced THEN the system SHALL import it from the vendor/three/ directory
3. WHEN application JavaScript is organized THEN the system SHALL place it in the js/ directory separate from vendor code
4. WHEN HTML files reference vendor libraries THEN the system SHALL use paths pointing to the vendor/ directory
5. WHEN additional vendor libraries are added THEN the system SHALL place them in the vendor/ directory with appropriate subdirectories

### Requirement 4

**User Story:** As a developer, I want panel controllers organized in a dedicated directory, so that UI controller code is clearly separated from other game logic.

#### Acceptance Criteria

1. WHEN panel controllers are created THEN the system SHALL place them in the js/controllers/ directory
2. WHEN the UIManager needs a controller THEN the system SHALL import it from js/controllers/
3. WHEN a new panel is added THEN the system SHALL create its controller in js/controllers/
4. WHEN controllers are organized THEN the system SHALL use consistent naming (trade-panel-controller.js, refuel-panel-controller.js, etc.)

### Requirement 5

**User Story:** As a developer, I want starmap rendering logic organized into focused modules, so that the 3000+ line starmap.js file is more maintainable.

#### Acceptance Criteria

1. WHEN star system data is needed THEN the system SHALL access it from a dedicated data file (star-data.js)
2. WHEN wormhole connection data is needed THEN the system SHALL access it from a dedicated data file (wormhole-data.js)
3. WHEN scene initialization is needed THEN the system SHALL use a dedicated scene management module (starmap-scene.js)
4. WHEN star rendering is needed THEN the system SHALL use a dedicated star rendering module (starmap-stars.js)
5. WHEN wormhole line rendering is needed THEN the system SHALL use a dedicated wormhole rendering module (starmap-wormholes.js)
6. WHEN user interaction handling is needed THEN the system SHALL use a dedicated interaction module (starmap-interaction.js)
7. WHEN starmap modules are organized THEN the system SHALL place them in the js/starmap/ directory

### Requirement 6

**User Story:** As a developer, I want CSS organized by UI component, so that the 2600+ line stylesheet is more maintainable.

#### Acceptance Criteria

1. WHEN CSS is organized THEN the system SHALL create separate stylesheets for each major UI component
2. WHEN base styles are needed THEN the system SHALL use a base.css file for global styles and resets
3. WHEN HUD styles are needed THEN the system SHALL use a hud.css file
4. WHEN panel styles are needed THEN the system SHALL use separate files for each panel (trade-panel.css, refuel-panel.css, repair-panel.css, info-broker-panel.css, upgrades-panel.css, cargo-manifest-panel.css)
5. WHEN modal styles are needed THEN the system SHALL use a modals.css file
6. WHEN starmap visualization styles are needed THEN the system SHALL use a starmap-scene.css file
7. WHEN all CSS files are created THEN the HTML SHALL import them in the correct order

### Requirement 7

**User Story:** As a developer, I want steering documents updated with new architectural patterns, so that future development follows the improved structure.

#### Acceptance Criteria

1. WHEN architectural patterns are documented THEN the system SHALL update coding-standards.md with controller patterns and module organization patterns
2. WHEN file organization is documented THEN the system SHALL update structure.md with the new directory layout (js/controllers/, js/starmap/, js/data/, vendor/, css/ with multiple files)
3. WHEN technology stack is documented THEN the system SHALL update tech.md with the controller architecture and module organization
4. WHEN new patterns are introduced THEN the system SHALL provide examples in the steering documents
