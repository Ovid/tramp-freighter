# Implementation Plan

- [x] 1. Reorganize project structure and move files
  - Move vendor/ directory from js/vendor/ to top-level vendor/
  - Create new directory structure: js/controllers/, js/views/, js/data/, css/ (multiple files)
  - Move Three.js from js/vendor/three/ to vendor/three/
  - Update HTML script tags to reference vendor/three/ instead of js/vendor/three/
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Extract star and wormhole data into dedicated modules
  - Create js/data/star-data.js and export STAR_DATA array from starmap.js
  - Create js/data/wormhole-data.js and export WORMHOLE_DATA array from starmap.js
  - Update starmap.js to import from js/data/ modules
  - _Requirements: 5.1, 5.2_

- [x] 3. Reorganize game constants into configuration objects
  - Create SHIP_CONFIG object grouping ship-related constants
  - Create NAVIGATION_CONFIG object grouping navigation constants
  - Create REPAIR_CONFIG object for repair costs
  - Create INTELLIGENCE_CONFIG object grouping intelligence broker constants
  - Create FUEL_PRICING_CONFIG object grouping fuel pricing constants
  - Preserve existing config objects (ECONOMY_CONFIG, VISUAL_CONFIG, LABEL_CONFIG, NOTIFICATION_CONFIG, ANIMATION_CONFIG)
  - Update all imports across codebase to use new config object paths
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3.1 Write example-based test for config object structure
  - **Example 2: Config Objects Exist**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

- [x] 4. Extract Trade Panel Controller
  - Create js/controllers/trade-panel-controller.js
  - Extract trade panel logic from UIManager into TradePanelController class
  - Implement constructor accepting elements, gameStateManager, starData
  - Implement show(), hide(), refreshTradePanel() methods
  - Implement handleBuyGood() and handleSellStack() methods
  - Update UIManager to create TradePanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 4.1 Write property test for controller delegation
  - **Property 1: Controller Delegation**
  - **Validates: Requirements 1.4, 1.5**

- [x] 4.2 Write property test for controller initialization
  - **Property 2: Controller Initialization**
  - **Validates: Requirements 1.2, 1.3**

- [x] 5. Extract Refuel Panel Controller
  - Create js/controllers/refuel-panel-controller.js
  - Extract refuel panel logic from UIManager into RefuelPanelController class
  - Implement constructor accepting elements, gameStateManager, starData
  - Implement show(), hide(), updateRefuelCost() methods
  - Implement handleRefuelMax() and handleRefuelConfirm() methods
  - Update UIManager to create RefuelPanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 6. Extract Repair Panel Controller
  - Create js/controllers/repair-panel-controller.js
  - Extract repair panel logic from UIManager into RepairPanelController class
  - Implement constructor accepting elements, gameStateManager, starData
  - Implement show(), hide(), updateRepairCosts() methods
  - Implement handleRepairSystem() and handleRepairAll() methods
  - Update UIManager to create RepairPanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 7. Extract Upgrade Panel Controller
  - Create js/controllers/upgrade-panel-controller.js
  - Extract upgrade panel logic from UIManager into UpgradePanelController class
  - Implement constructor accepting elements, gameStateManager, starData
  - Implement show(), hide(), refreshUpgradePanel() methods
  - Implement handlePurchaseUpgrade() method
  - Update UIManager to create UpgradePanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 8. Extract Info Broker Panel Controller
  - Create js/controllers/info-broker-panel-controller.js
  - Extract info broker panel logic from UIManager into InfoBrokerPanelController class
  - Implement constructor accepting elements, gameStateManager, starData, informationBroker
  - Implement show(), hide(), refreshInfoBrokerPanel() methods
  - Implement handlePurchaseIntelligence(), handleBuyRumor(), switchTab() methods
  - Update UIManager to create InfoBrokerPanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 9. Extract Cargo Manifest Panel Controller
  - Create js/controllers/cargo-manifest-panel-controller.js
  - Extract cargo manifest logic from UIManager into CargoManifestPanelController class
  - Implement constructor accepting elements, gameStateManager, starData
  - Implement show(), hide(), refreshCargoManifest() methods
  - Update UIManager to create CargoManifestPanelController instance and delegate to it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4_

- [x] 10. Refactor UIManager to coordinator pattern
  - Remove extracted panel logic from UIManager
  - Keep HUD update logic in UIManager (not extracted)
  - Keep notification logic in UIManager (not extracted)
  - Keep quick access button logic in UIManager (not extracted)
  - Update UIManager to delegate panel operations to controllers
  - Verify UIManager is now a coordinator rather than containing panel logic
  - _Requirements: 1.4, 1.5_

- [x] 11. Split starmap.js into focused modules
  - Create js/views/starmap-scene.js for scene initialization
  - Create js/views/starmap-stars.js for star rendering
  - Create js/views/starmap-wormholes.js for wormhole line rendering
  - Create js/views/starmap-interaction.js for user interaction handling
  - Create js/views/starmap-coordinator.js as main coordinator module
  - Extract corresponding logic from starmap.js into each module
  - Update starmap-coordinator.js to initialize and coordinate all modules
  - Update starmap.html to import starmap-coordinator.js instead of starmap.js
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 12. Split CSS into component stylesheets
  - Create css/base.css for global styles and resets
  - Create css/hud.css for HUD styles
  - Create css/trade-panel.css for trade panel styles
  - Create css/refuel-panel.css for refuel panel styles
  - Create css/repair-panel.css for repair panel styles
  - Create css/upgrades-panel.css for upgrades panel styles
  - Create css/info-broker-panel.css for info broker panel styles
  - Create css/cargo-manifest-panel.css for cargo manifest panel styles
  - Create css/modals.css for modal dialog styles
  - Create css/starmap-scene.css for starmap visualization styles
  - Extract corresponding styles from css/starmap.css into each file
  - Update starmap.html to import CSS files in correct order: base.css, hud.css, panels (alphabetically), modals.css, starmap-scene.css
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 13. Update all import paths in application code
  - Update imports in all js/ files to reflect new module locations
  - Update imports for moved data modules (star-data.js, wormhole-data.js)
  - Update imports for new controller modules
  - Update imports for new starmap view modules
  - Update imports for reorganized constants (config objects)
  - Verify no module resolution errors when loading application
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 13.1 Write property test for import path correctness
  - **Property 4: Import Path Correctness**
  - **Validates: Requirements 8.3, 9.1, 9.2, 9.3, 9.4**

- [x] 14. Update all import paths in test files
  - Update imports in all test files to reflect new module locations
  - Update imports for moved data modules
  - Update imports for new controller modules
  - Update imports for new starmap view modules
  - Update imports for reorganized constants
  - Verify tests can load modules without resolution errors
  - _Requirements: 8.3, 8.4_

- [x] 15. Run full test suite and verify all tests pass
  - Execute npm test to run all unit, property, and integration tests
  - Verify all tests pass without modifications to test logic
  - Verify test output is clean (no stderr messages)
  - Fix any import path issues discovered by tests
  - _Requirements: 8.1, 8.2_

- [x] 15.1 Write property test for test suite preservation
  - **Property 3: Test Suite Preservation**
  - **Validates: Requirements 8.2**

- [x] 15.2 Write property test for application load success
  - **Property 5: Application Load Success**
  - **Validates: Requirements 9.4**

- [ ] 16. Update steering documents
  - Update .kiro/steering/coding-standards.md with controller pattern examples
  - Update .kiro/steering/coding-standards.md with module organization patterns
  - Update .kiro/steering/structure.md with new directory layout (js/controllers/, js/views/, js/data/, vendor/, css/ with multiple files)
  - Update .kiro/steering/tech.md with controller architecture description
  - Update .kiro/steering/tech.md with module organization description
  - Add examples of controller usage and module organization
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 17. Final validation and manual testing
  - Load application in browser and verify no console errors
  - Verify starmap renders correctly
  - Test all UI panels (trade, refuel, repair, upgrade, info broker, cargo manifest)
  - Test all transactions (buy, sell, refuel, repair, upgrade, intelligence purchase)
  - Test HUD updates reactively to state changes
  - Test notifications display correctly
  - Test save/load functionality
  - Verify all quick access buttons work
  - _Requirements: All_
