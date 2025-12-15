# Implementation Plan

- [x] 1. Set up Vite project scaffolding and build configuration
  - Create package.json with React 18+, Vite, Vitest, and testing dependencies
  - Create vite.config.js with proper configuration for React and path aliases
  - Create vitest.config.js with jsdom environment and test setup
  - Create index.html as the new entry point with root div and script tag
  - Verify Vite dev server runs on port 5173 (different from vanilla setup)
  - Test that vanilla starmap.html still works with existing server
  - Document commands to run both servers simultaneously for testing
  - Verify dev server starts and builds successfully
  - _Requirements: 6.5, 22.1, 22.2, 22.3, 22.4, 22.5, 35.1, 35.2, 35.3, 35.4, 35.5, 20.1, 20.2, 20.3, 20.4, 20.5, 38.1, 38.2, 38.3, 38.4_

- [x] 2. Create directory structure and migrate game logic
  - Create src directory with subdirectories: assets, components, context, features, game, hooks
  - Create game subdirectories: state, engine, data, utils
  - Move game-constants.js to src/game/constants.js
  - Move game-state-manager.js to src/game/state/game-state-manager.js
  - Move save-load.js to src/game/state/save-load.js
  - Move state-validators.js to src/game/state/state-validators.js
  - Move game-animation.js to src/game/engine/game-animation.js
  - Move scene.js to src/game/engine/scene.js
  - Move star-data.js to src/game/data/star-data.js
  - Move wormhole-data.js to src/game/data/wormhole-data.js
  - Move seeded-random.js to src/game/utils/seeded-random.js
  - Move string-utils.js to src/game/utils/string-utils.js
  - Move game-trading.js, game-navigation.js, game-events.js, game-information-broker.js to src/game/
  - Update all import paths to use new locations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 12.1, 12.2, 12.3, 12.4, 12.5, 30.1, 30.2, 30.3, 30.4, 30.5_

- [x] 2.1 Write property test for import resolution
  - **Property 35: Import resolution correctness**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

- [x] 3. Implement Bridge Pattern foundation
- [x] 3.1 Create GameContext provider
  - Create src/context/GameContext.jsx with GameProvider and useGameState hook
  - Implement null check and loading state handling
  - Add error handling for missing context
  - _Requirements: 5.1, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 3.2 Write property test for GameContext
  - **Property 7: GameContext provides valid instance**
  - **Validates: Requirements 5.1, 13.5**

- [x] 3.3 Create useGameEvent hook
  - Create src/hooks/useGameEvent.js with subscription logic
  - Implement useState for local state management
  - Implement useEffect for subscription and cleanup
  - Add event name to state extraction mapping
  - _Requirements: 5.2, 5.3, 5.4, 34.1, 34.2, 34.3, 34.4, 34.5_

- [x] 3.4 Write property test for useGameEvent subscription
  - **Property 11: useGameEvent subscription correctness**
  - **Validates: Requirements 34.1**

- [x] 3.5 Write property test for useGameEvent state updates
  - **Property 12: useGameEvent state updates**
  - **Validates: Requirements 34.2, 34.5**

- [x] 3.6 Write property test for automatic unsubscription
  - **Property 9: Automatic unsubscription on unmount**
  - **Validates: Requirements 5.4, 34.4**

- [x] 3.7 Write property test for selective re-rendering
  - **Property 8: Selective re-rendering on events**
  - **Validates: Requirements 5.3, 34.3**

- [x] 3.8 Write property test for all subscribers notified
  - **Property 10: All subscribers notified**
  - **Validates: Requirements 5.5**

- [x] 3.9 Create useGameAction hook
  - Create src/hooks/useGameAction.js with action methods
  - Implement methods that delegate to GameStateManager
  - Return object with all game action methods
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 3.10 Write property test for useGameAction delegation
  - **Property 13: useGameAction delegates to GameStateManager**
  - **Validates: Requirements 16.2, 16.3**

- [x] 3.11 Write property test for actions trigger events
  - **Property 14: Actions trigger events**
  - **Validates: Requirements 16.4**

- [x] 3.12 Write property test for useGameAction consistency
  - **Property 15: useGameAction consistency**
  - **Validates: Requirements 16.5**

- [x] 4. Create application entry point and root component
- [x] 4.1 Create main.jsx
  - Create src/main.jsx with GameStateManager initialization
  - Import all global CSS files
  - Implement error handling for initialization failures
  - Render App wrapped in GameProvider
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 32.1, 32.2, 32.3, 32.4, 32.5_

- [x] 4.2 Create App.jsx
  - Create src/App.jsx with view mode state management
  - Implement conditional rendering for ORBIT, STATION, PANEL modes
  - Add handlers for view mode transitions
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5_

- [x] 4.3 Write property test for ORBIT mode rendering
  - **Property 26: ORBIT mode displays starmap and HUD**
  - **Validates: Requirements 9.2, 25.1, 25.2**

- [x] 4.4 Write property test for STATION mode rendering
  - **Property 27: STATION mode displays station menu**
  - **Validates: Requirements 9.3, 25.3**

- [x] 4.5 Write property test for PANEL mode rendering
  - **Property 28: PANEL mode displays active panel**
  - **Validates: Requirements 9.4, 25.4**

- [x] 4.6 Write property test for view mode transitions
  - **Property 29: View mode changes update visibility**
  - **Validates: Requirements 9.5**

- [x] 4.7 Implement TitleScreen component
  - Create src/features/title-screen/TitleScreen.jsx
  - Check for saved game using gameStateManager.hasSavedGame()
  - Display Continue Game button only if save exists
  - Display New Game button always
  - Show confirmation modal if starting new game with existing save
  - Handle Continue and New Game button clicks
  - Display game title, subtitle, and version
  - _Requirements: 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 47.7_

- [x] 4.8 Write property test for title screen display
  - **Property 51: Title screen displays on load**
  - **Validates: Requirements 47.1**

- [x] 4.9 Write property test for continue button visibility
  - **Property 52: Continue button visibility**
  - **Validates: Requirements 47.2, 47.3**

- [x] 4.10 Write property test for new game confirmation
  - **Property 53: New game confirmation**
  - **Validates: Requirements 47.5**

- [x] 4.11 Write property test for game initialization on continue
  - **Property 54: Game initialization on continue**
  - **Validates: Requirements 47.4**

- [x] 4.12 Write property test for ship naming after new game
  - **Property 55: Ship naming after new game**
  - **Validates: Requirements 47.6**

- [x] 4.13 Implement ShipNamingDialog component
  - Create src/features/title-screen/ShipNamingDialog.jsx
  - Display input field for ship name
  - Display suggested ship names from SHIP_CONFIG.NAME_SUGGESTIONS
  - Handle suggestion button clicks to populate input
  - Sanitize ship name on submission using sanitizeShipName
  - Use default ship name if input is empty
  - Handle Enter key to submit
  - Call onSubmit callback with sanitized name
  - _Requirements: 48.1, 48.2, 48.3, 48.4, 48.5, 48.6, 48.7_

- [x] 4.14 Write property test for ship naming dialog display
  - **Property 56: Ship naming dialog displays**
  - **Validates: Requirements 48.1**

- [x] 4.15 Write property test for ship name sanitization
  - **Property 57: Ship name sanitization**
  - **Validates: Requirements 48.4**

- [x] 4.16 Write property test for default ship name
  - **Property 58: Default ship name on empty input**
  - **Validates: Requirements 48.5**

- [x] 4.17 Write property test for Enter key submission
  - **Property 59: Enter key submits ship name**
  - **Validates: Requirements 48.6**

- [x] 4.18 Write property test for ship name persistence
  - **Property 60: Ship name persists after submission**
  - **Validates: Requirements 48.7**

- [x] 4.19 Update App.jsx to include title screen flow
  - Add TITLE and SHIP_NAMING view modes
  - Initialize with TITLE view mode
  - Implement handleStartGame to handle continue vs new game
  - Implement handleShipNamed to update ship name and transition to game
  - Conditionally render TitleScreen and ShipNamingDialog
  - Only render game components after title screen flow completes
  - _Requirements: 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 48.1, 48.7_

- [x] 5. Create shared UI components
  - Create src/components/Button.jsx
  - Create src/components/Modal.jsx with React Portals
  - Create src/components/Card.jsx
  - ErrorBoundary.jsx already created in task 4
  - **Consider adding more granular error boundaries around StarMapCanvas and individual panels**
  - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5, 36.1, 36.2, 36.3, 36.4, 36.5, 42.1, 42.2, 42.3, 42.4, 42.5_

- [x] 5.1 Write property test for error boundaries
  - **Property 38: Error boundaries catch component errors**
  - **Validates: Requirements 36.1, 36.2, 36.3**

- [x] 5.2 Write property test for modal UI blocking
  - **Property 42: Modals block underlying UI**
  - **Validates: Requirements 42.2**

- [x] 5.3 Write property test for modal state updates
  - **Property 43: Modals don't block state updates**
  - **Validates: Requirements 42.5**

- [x] 6. Implement StarMapCanvas component
- [x] 6.1 Create StarMapCanvas component
  - Create src/features/navigation/StarMapCanvas.jsx
  - Use useRef for container element
  - Call initScene from src/game/engine/scene.js in useEffect
  - Implement resource cleanup on unmount
  - **CRITICAL:** Ensure THREE.js scene initializes only once in useEffect with empty dependency array
  - **CRITICAL:** Verify no object allocation in animation loop (requestAnimationFrame)
  - **CRITICAL:** Dispose of all THREE.js resources (geometries, materials, renderer) on unmount
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 31.1, 31.2, 31.3, 31.4, 31.5_

- [x] 6.2 Write property test for scene initialization
  - **Property 16: Scene initialization once per mount**
  - **Property 17: No scene re-initialization on re-render**
  - **Validates: Requirements 4.3, 14.1, 14.5**

- [x] 6.3 Write property test for resource cleanup
  - **Property 18: Resource cleanup on unmount**
  - **Validates: Requirements 14.4**

- [x] 7. Checkpoint - Verify foundation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement HUD components
- [x] 8.1 Create ResourceBar component
  - Create src/features/hud/ResourceBar.jsx
  - Use useGameEvent for creditsChanged and fuelChanged
  - Display credits and fuel with proper formatting
  - **Remove test buttons and placeholder divs from App.jsx** (Dock button, View Mode display)
  - _Requirements: 7.1, 7.2, 24.4_

- [x] 8.2 Write property test for HUD credit updates
  - **Property 19: HUD updates on credit changes**
  - **Validates: Requirements 7.1**

- [x] 8.3 Write property test for HUD fuel updates
  - **Property 20: HUD updates on fuel changes**
  - **Validates: Requirements 7.2**

- [x] 8.4 Create DateDisplay component
  - Create src/features/hud/DateDisplay.jsx
  - Use useGameEvent for timeChanged
  - Display game time with proper formatting
  - _Requirements: 7.3, 24.5_

- [x] 8.5 Write property test for HUD time updates
  - **Property 21: HUD updates on time changes**
  - **Validates: Requirements 7.3**

- [x] 8.6 Create ShipStatus component
  - Create src/features/hud/ShipStatus.jsx
  - Use useGameEvent for shipConditionChanged
  - Display hull, engine, and life support condition bars
  - _Requirements: 7.4, 24.6_

- [x] 8.7 Write property test for HUD condition updates
  - **Property 22: HUD updates on condition changes**
  - **Validates: Requirements 7.4**

- [x] 8.8 Create QuickAccessButtons component
  - Create src/features/hud/QuickAccessButtons.jsx
  - Implement system info and dock buttons
  - Use useGameEvent for location changes to update button state
  - _Requirements: 46.1, 46.2, 46.4, 46.5_

- [x] 8.9 Write property test for quick access button state
  - **Property 48: Quick access button state updates**
  - **Validates: Requirements 46.2**

- [x] 8.10 Create HUD component
  - Create src/features/hud/HUD.jsx
  - Compose ResourceBar, DateDisplay, ShipStatus, QuickAccessButtons
  - _Requirements: 7.5, 24.1, 24.2, 24.3_

- [x] 9. Implement station menu and panel container
- [x] 9.1 Create StationMenu component
  - Create src/features/station/StationMenu.jsx
  - Display station options (Trade, Refuel, Repair, etc.)
  - Handle panel opening and undocking
  - **Remove test buttons from App.jsx station menu placeholder** (Open Trade Panel, Undock buttons)
  - _Requirements: 9.3_

- [x] 9.2 Create PanelContainer component
  - Create src/features/station/PanelContainer.jsx
  - Conditionally render active panel based on prop
  - Handle panel closing
  - _Requirements: 9.4_

- [x] 10. Implement Trade panel
- [x] 10.1 Create trade utility functions
  - Create src/features/trade/tradeUtils.js
  - Implement validateTrade function
  - Implement other pure trade calculation functions
  - _Requirements: 15.1, 15.5, 26.4_

- [x] 10.2 Write property test for utility function purity
  - **Property 36: Utility functions are pure**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 10.3 Create TradePanel component
  - Create src/features/trade/TradePanel.jsx
  - Use useGameEvent for cargo and credits
  - Use useGameAction for buyGood and sellGood
  - Call gameStateManager.getKnownPrices for price data
  - Display market goods and cargo stacks
  - _Requirements: 8.1, 26.1, 26.2, 26.3, 26.5_

- [x] 10.4 Write property test for trade panel delegation
  - **Property 24: Trade panel delegates to GameStateManager**
  - **Validates: Requirements 26.1, 26.2, 26.3**

- [x] 10.5 Write property test for panels as React components
  - **Property 23: Panels rendered as React components**
  - **Validates: Requirements 8.1**

- [x] 11. Implement Refuel panel
- [x] 11.1 Create refuel utility functions
  - Create src/features/refuel/refuelUtils.js
  - Implement calculateRefuelCost function
  - Implement validateRefuel function
  - _Requirements: 15.2, 15.5_

- [x] 11.2 Create RefuelPanel component
  - Create src/features/refuel/RefuelPanel.jsx
  - Use local state for slider amount
  - Use useGameEvent for fuel and credits
  - Use useGameAction for refuel
  - Display validation messages
  - _Requirements: 8.2, 27.1, 27.2, 27.3, 27.4, 27.5_

- [x] 11.3 Write property test for refuel local state
  - **Property 25: Refuel panel manages local state**
  - **Validates: Requirements 27.1, 27.2**

- [x] 12. Implement Repair panel
- [x] 12.1 Create repair utility functions
  - Create src/features/repair/repairUtils.js
  - Implement repair cost calculation functions
  - Implement repair validation functions
  - _Requirements: 15.3, 15.5_

- [x] 12.2 Create RepairPanel component
  - Create src/features/repair/RepairPanel.jsx
  - Use useGameEvent for ship condition and credits
  - Use useGameAction for repair
  - Display repair options and costs
  - _Requirements: 8.3_

- [x] 13. Implement Upgrades panel
- [x] 13.1 Create upgrades utility functions
  - Create src/features/upgrades/upgradesUtils.js
  - Implement upgrade validation functions
  - _Requirements: 15.4, 15.5_

- [x] 13.2 Create UpgradesPanel component
  - Create src/features/upgrades/UpgradesPanel.jsx
  - Use useGameEvent for credits and upgrades
  - Use useGameAction for purchaseUpgrade
  - Display available upgrades
  - _Requirements: 8.4_

- [x] 14. Implement Information Broker panel
- [x] 14.1 Create info broker utility functions
  - Create src/features/info-broker/infoBrokerUtils.js
  - Implement intelligence validation functions
  - _Requirements: 15.5_

- [x] 14.2 Create InfoBrokerPanel component
  - Create src/features/info-broker/InfoBrokerPanel.jsx
  - Use useGameEvent for credits and intelligence data
  - Use useGameAction for purchaseIntelligence
  - Display available intelligence
  - _Requirements: 8.5_

- [x] 15. Implement Cargo Manifest panel
- [x] 15.1 Create cargo utility functions
  - Create src/features/cargo/cargoUtils.js
  - Implement cargo calculation functions
  - _Requirements: 15.5_

- [x] 15.2 Create CargoManifestPanel component
  - Create src/features/cargo/CargoManifestPanel.jsx
  - Use useGameEvent for cargo
  - Display cargo stacks with purchase metadata
  - _Requirements: 8.6_

- [x] 16. Implement Ship Status panel
- [x] 16.1 Create ShipStatusPanel component
  - Create src/features/ship-status/ShipStatusPanel.jsx
  - Use useGameEvent for ship data
  - Display ship name, condition, upgrades, quirks
  - _Requirements: 8.7_

- [x] 17. Implement animation system integration
- [x] 17.1 Create useAnimationLock hook
  - Create src/hooks/useAnimationLock.js
  - Subscribe to animation state from GameStateManager
  - Return lock state and methods
  - _Requirements: 43.2, 43.5_

- [x] 17.2 Write property test for animation lock
  - **Property 44: Animation loop outside React**
  - **Property 45: useAnimationLock disables interactions**
  - **Validates: Requirements 43.1, 43.2, 43.5**

- [x] 17.3 Update QuickAccessButtons to use animation lock
  - Import useAnimationLock in QuickAccessButtons
  - Disable buttons when animation is locked
  - _Requirements: 46.3_

- [x] 17.4 Write property test for animation lock disables quick access
  - **Property 49: Animation lock disables quick access**
  - **Validates: Requirements 46.3**

- [x] 18. Implement notification system
- [x] 18.1 Create useNotification hook
  - Create src/hooks/useNotification.js
  - Implement showError, showSuccess, showNotification methods
  - Manage notification queue and timing
  - _Requirements: 44.1, 44.2, 44.3, 44.4, 44.5_

- [x] 18.2 Write property test for notification queueing
  - **Property 46: Notification queueing**
  - **Property 47: Notification expiration**
  - **Validates: Requirements 44.4, 44.5**

- [x] 19. Implement Dev Admin panel
- [x] 19.1 Create DevAdminPanel component
  - Create src/features/dev-admin/DevAdminPanel.jsx
  - Detect .dev file using same approach as vanilla version
  - Provide same functionality as DevAdminPanelController
  - _Requirements: 45.1, 45.2, 45.3, 45.4, 45.5_

- [x] 20. Checkpoint - Verify all UI components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Migrate unit tests to Vitest
- [x] 21.1 Migrate state management tests
  - Migrate tests from tests/unit/save-load.test.js
  - Migrate tests from tests/unit/state-validators.test.js
  - Migrate tests from tests/unit/new-game-initialization.test.js
  - Update imports to use new paths
  - _Requirements: 11.1, 11.2, 40.1, 40.2, 40.3, 40.4, 40.5_

- [x] 21.2 Migrate trading tests
  - Migrate tests from tests/unit/economy-config-constants.test.js
  - Migrate tests from tests/unit/price-neutral-modifiers.test.js
  - Update imports to use new paths
  - _Requirements: 11.1, 11.2_

- [x] 21.3 Migrate UI tests
  - Migrate tests from tests/unit/modal-dialog.test.js
  - Migrate tests from tests/unit/quick-access-buttons.unit.test.js
  - Migrate tests from tests/unit/hud-condition-display-update.unit.test.js
  - Update to use React Testing Library
  - _Requirements: 11.1, 11.2_

- [x] 21.4 Migrate remaining unit tests
  - Migrate all other unit tests from tests/unit/
  - Update imports and test syntax for Vitest
  - _Requirements: 11.1, 11.2_

- [x] 21.5 Write property test for unit test equivalence
  - **Property 32: Unit test equivalence**
  - **Validates: Requirements 11.2**

- [x] 22. Migrate property-based tests to Vitest
- [x] 22.1 Migrate core game logic property tests
  - Migrate distance, jump, fuel, navigation property tests
  - Update to use fast-check with Vitest
  - _Requirements: 11.1, 11.3, 40.2_

- [x] 22.2 Migrate trading property tests
  - Migrate price calculation, cargo, trade validation property tests
  - Update to use fast-check with Vitest
  - _Requirements: 11.1, 11.3_

- [x] 22.3 Migrate UI property tests
  - Migrate HUD, panel, validation message property tests
  - Update to use React Testing Library with fast-check
  - _Requirements: 11.1, 11.3_

- [x] 22.4 Migrate remaining property tests
  - Migrate all other property tests from tests/property/
  - Update to use fast-check with Vitest
  - _Requirements: 11.1, 11.3_

- [ ] 23. Migrate integration tests to Vitest
- [x] 23.1 Migrate game flow integration tests
  - Migrate tests from tests/integration/game-flow.integration.test.js
  - Update to use React Testing Library
  - _Requirements: 11.1, 11.4_

- [x] 23.2 Migrate navigation integration tests
  - Migrate tests from tests/integration/navigation-ux.integration.test.js
  - Update to use React Testing Library
  - _Requirements: 11.1, 11.4_

- [ ] 23.3 Migrate panel integration tests
  - Migrate tests from tests/integration/trade-panel-animation-hide.integration.test.js
  - Migrate tests from tests/integration/quick-access-integration.test.js
  - Update to use React Testing Library
  - _Requirements: 11.1, 11.4_

- [ ] 23.4 Migrate remaining integration tests
  - Migrate all other integration tests from tests/integration/
  - Update to use React Testing Library
  - _Requirements: 11.1, 11.4_

- [ ] 23.5 Write property test for integration test equivalence
  - **Property 34: Integration test equivalence**
  - **Validates: Requirements 11.4**

- [ ] 24. Write behavioral equivalence tests
- [ ] 24.1 Write property test for game state behavioral equivalence
  - **Property 1: Game state behavioral equivalence**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ] 24.2 Write property test for save/load round trip
  - **Property 2: Save/load round trip**
  - **Validates: Requirements 1.4**

- [ ] 24.3 Write property test for UI rendering equivalence
  - **Property 3: UI rendering equivalence**
  - **Validates: Requirements 1.5**

- [ ] 24.4 Write property test for single GameStateManager instance
  - **Property 4: Single GameStateManager instance**
  - **Validates: Requirements 3.3**

- [ ] 24.5 Write property test for state updates through GameStateManager
  - **Property 5: State updates through GameStateManager**
  - **Validates: Requirements 3.1**

- [ ] 24.6 Write property test for component state matches GameStateManager
  - **Property 6: Component state matches GameStateManager**
  - **Validates: Requirements 3.2, 3.5**

- [ ] 24.7 Write property test for correct event names
  - **Property 37: Correct event names used**
  - **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6**

- [ ] 24.8 Write property test for game logic preservation
  - **Property 50: Game logic not reimplemented**
  - **Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5**

- [ ] 24.9 Write property test for old saves compatibility
  - **Property 39: Old saves load correctly**
  - **Validates: Requirements 37.1, 37.2, 37.3**

- [ ] 25. Implement CSS strategy
- [ ] 25.1 Import global CSS in main.jsx
  - Import all existing CSS files from css/ directory
  - Verify styles apply correctly
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

- [ ] 25.2 Create CSS modules for new component-specific styles
  - Create CSS modules for any new component-specific styles
  - Use scoped class names
  - _Requirements: 39.1, 39.3, 39.5_

- [ ] 25.3 Write property test for CSS class names preserved
  - **Property 30: CSS class names preserved**
  - **Validates: Requirements 10.1**

- [ ] 25.4 Write property test for CSS animations preserved
  - **Property 31: CSS animations preserved**
  - **Validates: Requirements 10.5**

- [ ] 26. Performance optimization
- [ ] 26.1 Add React.memo to expensive components
  - Identify components that render frequently
  - Wrap with React.memo where appropriate
  - **Add FPS counter in development mode to verify 60 FPS target for starmap**
  - **Profile THREE.js rendering to ensure no frame drops during camera movement**
  - _Requirements: 41.1, 41.2, 41.3, 41.5_

- [ ] 26.2 Add useMemo for expensive calculations
  - Identify expensive calculations in components
  - Wrap with useMemo where appropriate
  - _Requirements: 41.1, 41.2, 41.5_

- [ ] 26.3 Add useCallback for stable function references
  - Identify callback props passed to memoized components
  - Wrap with useCallback where appropriate
  - _Requirements: 41.1, 41.2, 41.5_

- [ ] 26.4 Write property test for performance optimization
  - **Property 40: No redundant re-renders**
  - **Property 41: No unnecessary object cloning**
  - **Validates: Requirements 41.3, 41.4**

- [ ] 27. Verify DOM manipulation removal
- [ ] 27.1 Search codebase for manual DOM manipulation
  - Search for document.querySelector in UI code
  - Search for innerHTML assignments in UI code
  - Search for createElement in UI code
  - Search for appendChild in UI code
  - Verify all instances are removed or in game logic only
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 27.2 Verify all UI functionality migrated to React
  - Verify every UI panel has a corresponding React component
  - Verify all HUD elements are React components
  - Confirm no DOM manipulation remains in files that will be kept (game logic)
  - Verify all UI updates use React component re-renders
  - Document any remaining DOM manipulation with justification
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 28. Final testing and validation
- [ ] 28.1 Run full test suite
  - Execute npm test to run all tests
  - Verify all tests pass
  - Generate coverage report
  - _Requirements: 11.5_

- [ ] 28.2 Verify test coverage
  - Compare coverage to vanilla version
  - Ensure coverage >= vanilla version
  - _Requirements: 11.5, 40.5_

- [ ] 28.3 Performance benchmarking
  - Measure starmap FPS
  - Measure UI response time
  - Measure bundle size
  - Measure initial load time
  - _Requirements: 4.1, 4.5_

- [ ] 28.4 Manual QA testing
  - Test all game actions (navigation, trading, refuel, repair, upgrades)
  - Test all UI panels
  - Test view mode transitions
  - Test save/load functionality
  - Test with old save files
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 37.1, 37.2, 37.3, 37.4, 37.5_

- [ ] 29. Documentation and cleanup
- [ ] 29.1 Update README
  - Document new build commands
  - Document new directory structure
  - Document Bridge Pattern architecture
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 29.2 Add JSDoc comments
  - Document all public functions and components
  - Document custom hooks
  - Document utility functions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 29.3 Create migration guide
  - Document migration process
  - Document lessons learned
  - Document rollback procedure
  - _Requirements: 38.1, 38.2, 38.3, 38.4, 38.5_

- [ ] 29.4 Remove vanilla JavaScript version files
  - Remove starmap.html (vanilla entry point)
  - Remove js/ directory containing vanilla UI code
  - Update package.json dev script to only use Vite
  - Verify index.html is the sole entry point
  - Document cutover in migration guide
  - _Requirements: 38.5_

- [ ] 30. Final checkpoint - Verify complete migration
  - Ensure all tests pass, ask the user if questions arise
