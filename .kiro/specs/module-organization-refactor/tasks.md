# Implementation Plan

- [x] 1. Create directory structure for new modules
  - Create `js/state/` directory
  - Create `js/ui/` directory
  - _Requirements: 5.1, 5.2_

- [x] 2. Extract save/load system from game-state.js
  - Create `js/state/save-load.js`
  - Extract `saveGame()` method into standalone function
  - Extract `loadGame()` method into standalone function
  - Export `saveGame(state, lastSaveTime, isTestEnvironment)` function
  - Export `loadGame(isTestEnvironment)` function
  - Add JSDoc comments describing purpose and parameters
  - Begin file with `"use strict";` directive
  - _Requirements: 1.2, 4.2, 4.3, 4.4, 5.3_

- [x] 2.1 Review save-load.js for single responsibility
  - Verify module only handles save/load operations and debouncing
  - Check for any validation or state management logic that belongs elsewhere
  - Confirm module has one focused responsibility
  - _Requirements: 4.1_

- [x] 3. Extract state validation system from game-state.js
  - Create `js/state/state-validators.js`
  - Extract `isVersionCompatible()` method into standalone function
  - Extract `validateStateStructure()` method into standalone function
  - Extract `migrateFromV1ToV2()` method into standalone function
  - Extract `migrateFromV2ToV2_1()` method into standalone function
  - Extract state defaults logic into `addStateDefaults()` function
  - Export all validation and migration functions with named exports
  - Add JSDoc comments for each exported function
  - Begin file with `"use strict";` directive
  - _Requirements: 1.3, 4.2, 4.3, 4.4, 5.3_

- [x] 3.1 Review state-validators.js for single responsibility
  - Verify module only handles validation and migration logic
  - Check for any state management or save/load logic that belongs elsewhere
  - Confirm module has one focused responsibility
  - _Requirements: 4.1_

- [ ] 4. Refactor GameStateManager to use extracted modules
  - Update `js/game-state.js` to import from `save-load.js`
  - Update `js/game-state.js` to import from `state-validators.js`
  - Modify `saveGame()` method to call imported `saveGame()` function
  - Modify `loadGame()` method to call imported `loadGame()` function
  - Modify `loadGame()` to use imported validation and migration functions
  - Remove extracted code from `game-state.js`
  - Verify GameStateManager still exports all public methods
  - _Requirements: 1.4, 1.5, 4.2_

- [ ] 5. Move game-state.js to js/state/ directory
  - Move `js/game-state.js` to `js/state/game-state-manager.js`
  - Update imports within `game-state-manager.js` to reflect new location
  - Update relative import paths for `save-load.js` and `state-validators.js`
  - _Requirements: 1.1, 5.1_

- [ ] 5.1 Review game-state-manager.js for single responsibility
  - Verify module only handles state management and game operations
  - Check that save/load and validation logic has been fully extracted
  - Confirm module has one focused responsibility
  - _Requirements: 4.1_

- [ ] 6. Extract HUD management from game-ui.js
  - Create `js/ui/hud-manager.js`
  - Extract `updateHUD()` method into standalone function
  - Extract `updateCredits()` method into standalone function
  - Extract `updateDebt()` method into standalone function
  - Extract `updateDays()` method into standalone function
  - Extract `updateShipName()` method into standalone function
  - Extract `updateFuel()` method into standalone function
  - Extract `updateShipCondition()` method into standalone function
  - Extract `updateCargo()` method into standalone function
  - Extract `updateLocation()` method into standalone function
  - Extract `updateConditionDisplay()` method into standalone function
  - Export all HUD update functions with named exports
  - Add JSDoc comments for each exported function
  - Begin file with `"use strict";` directive
  - _Requirements: 2.2, 4.2, 4.3, 4.4, 5.3_

- [ ] 7. Extract notification system from game-ui.js
  - Create `js/ui/notification-manager.js`
  - Extract notification queue logic into `createNotificationSystem()` function
  - Extract `showNotification()` method into standalone function
  - Extract `showError()` method into standalone function
  - Extract `showSuccess()` method into standalone function
  - Extract `showInfo()` method into standalone function
  - Export all notification functions with named exports
  - Add JSDoc comments for each exported function
  - Begin file with `"use strict";` directive
  - _Requirements: 2.3, 4.2, 4.3, 4.4, 5.3_

- [ ] 8. Extract modal system from game-ui.js
  - Create `js/ui/modal-manager.js`
  - Extract `showEventModal()` method into standalone function
  - Extract `hideEventModal()` method into standalone function
  - Extract `showConfirmModal()` method into standalone function
  - Extract `setupEventModalHandlers()` method into standalone function
  - Export all modal functions with named exports
  - Add JSDoc comments for each exported function
  - Begin file with `"use strict";` directive
  - _Requirements: 2.4, 4.2, 4.3, 4.4, 5.3_

- [ ] 8.1 Review hud-manager.js, notification-manager.js, and modal-manager.js for single responsibility
  - Verify hud-manager.js only handles HUD display updates
  - Verify notification-manager.js only handles notification system
  - Verify modal-manager.js only handles modal dialogs
  - Check for any overlapping concerns between UI modules
  - Confirm each module has one focused responsibility
  - _Requirements: 4.1_

- [ ] 9. Refactor UIManager to use extracted modules
  - Update `js/game-ui.js` to import from `hud-manager.js`
  - Update `js/game-ui.js` to import from `notification-manager.js`
  - Update `js/game-ui.js` to import from `modal-manager.js`
  - Modify HUD update methods to call imported functions
  - Modify notification methods to call imported functions
  - Modify modal methods to call imported functions
  - Remove extracted code from `game-ui.js`
  - Verify UIManager still exports all public methods
  - _Requirements: 2.5, 2.6, 4.2_

- [ ] 10. Move game-ui.js to js/ui/ directory
  - Move `js/game-ui.js` to `js/ui/ui-manager.js`
  - Update imports within `ui-manager.js` to reflect new location
  - Update relative import paths for `hud-manager.js`, `notification-manager.js`, `modal-manager.js`
  - Update relative import paths for panel controllers (now `../controllers/`)
  - _Requirements: 2.1, 5.2_

- [ ] 10.1 Review ui-manager.js for single responsibility
  - Verify module only handles UI coordination and delegation
  - Check that HUD, notification, and modal logic has been fully extracted
  - Confirm module has one focused responsibility
  - _Requirements: 4.1_

- [ ] 11. Update all application code import paths
  - Update `starmap.html` script imports:
    - Change GameStateManager import from `./js/game-state.js` to `./js/state/game-state-manager.js`
    - Change UIManager import from `./js/game-ui.js` to `./js/ui/ui-manager.js`
    - Verify initialization code still creates instances correctly
  - Update all `js/` files that import GameStateManager to use new path `./state/game-state-manager.js`
  - Update all `js/` files that import UIManager to use new path `./ui/ui-manager.js`
  - Update panel controllers to import from `../state/game-state-manager.js`
  - Load application in browser and verify no module resolution errors
  - Check browser console for any import/initialization errors
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Update all test file import paths
  - Update all test files that import from `game-state.js` to use `state/game-state-manager.js`
  - Update all test files that import from `game-ui.js` to use `ui/ui-manager.js`
  - Update test setup files to use new import paths
  - Verify tests can load modules without resolution errors
  - _Requirements: 3.4_

- [ ] 13. Remove original monolithic files
  - Delete `js/game-state.js` (now at `js/state/game-state-manager.js`)
  - Delete `js/game-ui.js` (now at `js/ui/ui-manager.js`)
  - Verify application still loads without errors
  - _Requirements: 6.4_

- [ ] 13.1 Final architecture review
  - Verify all modules have single, focused responsibilities
  - Check for clear boundaries between state, UI, and controller modules
  - Confirm no overlapping concerns between modules
  - Validate dependency graph is clear and unidirectional
  - Review module sizes are reasonable (no new monoliths created)
  - _Requirements: 4.1, 4.5_

- [ ] 14. Run full test suite and verify all tests pass
  - Execute `npm test` to run all unit, property, and integration tests
  - Verify all tests pass without modifications to test logic
  - Verify test output is clean (no stderr messages)
  - Fix any import path issues discovered by tests
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 15. Manual validation and testing
  - Load application in browser and verify no console errors
  - Verify new game initializes correctly
  - Test save game functionality
  - Test load game functionality
  - Verify HUD updates reactively to state changes
  - Verify notifications display correctly
  - Verify modal dialogs work
  - Test all panel controllers function correctly
  - Test all game operations (trade, refuel, repair, upgrade)
  - _Requirements: All_
