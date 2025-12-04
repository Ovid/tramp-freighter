# Implementation Plan

- [x] 1. Set up game state management foundation
  - Create GameStateManager class with initialization, state queries, and mutation methods
  - Implement new game initialization with default values (500 credits, 10000 debt, Sol system, 100% fuel, 50 cargo capacity, 20 grain)
  - Add state change event system for UI reactivity:
    - Implement event emitter pattern (subscribe/notify)
    - Emit events on all state mutations (credits, debt, fuel, cargo, location, time)
    - Support multiple subscribers per event type
    - Event types: 'creditsChanged', 'debtChanged', 'fuelChanged', 'cargoChanged', 'locationChanged', 'timeChanged'
  - _Requirements: 1.4, 1.5, 2.8_


- [x] 1.1 Write property test for save/load round trip and new game initialization
  - **Property 0: New game initialization creates correct default state**
  - **Validates: Requirements 1.4, 1.5**
  - **Property 1: Save/Load Round Trip Preservation**
  - **Validates: Requirements 1.6, 10.8**

- [x] 2. Implement distance and jump calculations
  - Create NavigationSystem class with distance calculation methods
  - Implement distance from Sol calculation: sqrt(x² + y² + z²) / 10
  - Implement distance between systems calculation: sqrt((x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²) / 10
  - Implement jump time calculation: max(1, ceil(distance × 0.5))
  - Implement fuel cost calculation: 10 + (distance × 2)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.1 Write property tests for distance calculations
  - **Property 4: Distance from Sol Calculation**
  - **Property 5: Distance Between Systems Calculation**
  - **Validates: Requirements 3.1, 3.2**

- [x] 2.2 Write property tests for jump calculations
  - **Property 6: Jump Time Calculation**
  - **Property 7: Fuel Cost Calculation**
  - **Validates: Requirements 3.3, 3.4**

- [x] 3. Implement wormhole connection validation and jump mechanics
  - Add wormhole connection lookup to NavigationSystem
  - Implement connection validation (verify wormhole exists between systems)
  - Implement fuel validation (check sufficient fuel for jump)
  - Implement jump execution (update current system, decrease fuel, increase days, add to visited systems)
  - Add error handling for invalid jumps (no connection, insufficient fuel)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 3.1 Write property test for wormhole connection validation
  - **Property 9: Wormhole Connection Validation**
  - **Validates: Requirements 4.1, 4.2**

- [x] 3.2 Write property test for insufficient fuel prevention
  - **Property 10: Insufficient Fuel Prevention**
  - **Validates: Requirements 4.3**

- [x] 3.3 Write property test for jump state transition
  - **Property 11: Jump State Transition**
  - **Validates: Requirements 4.4, 4.5, 4.6**

- [x] 3.4 Write property test for visited systems tracking
  - **Property 12: Visited Systems Tracking**
  - **Validates: Requirements 4.7**

- [x] 4. Implement trading system with price calculations
  - Create TradingSystem class with price calculation methods
  - Define base prices for all six goods (grain: 10, ore: 15, tritium: 50, parts: 30, medicine: 40, electronics: 35)
  - Define spectral class modifiers for each good type
  - Implement price calculation: basePrice × spectralModifier
  - Add cargo capacity calculation (sum of all stack quantities)
  - _Requirements: 7.1, 7.2, 7.7_

- [x] 4.1 Write property test for good price calculation
  - **Property 15: Good Price Calculation**
  - **Validates: Requirements 7.2**

- [x] 4.2 Write property test for cargo capacity calculation
  - **Property 20: Cargo Capacity Calculation**
  - **Validates: Requirements 7.7**

- [x] 5. Implement buy mechanics with validation
  - Implement purchase validation (check credits, check cargo space)
  - Implement buy transaction (decrease credits, create cargo stack with good type, quantity, purchase price)
  - Implement separate stack creation for different purchase prices
  - Add error handling for insufficient credits and cargo space
  - _Requirements: 7.4, 7.5, 7.6, 7.11, 7.12_

- [x] 5.1 Write property test for purchase credits deduction
  - **Property 17: Purchase Credits Deduction**
  - **Validates: Requirements 7.4**

- [x] 5.2 Write property test for purchase cargo stack creation
  - **Property 18: Purchase Cargo Stack Creation**
  - **Validates: Requirements 7.5**

- [x] 5.3 Write property test for separate stack for different prices
  - **Property 19: Separate Stack for Different Prices**
  - **Validates: Requirements 7.6**

- [x] 5.4 Write property test for resource constraint validation
  - **Property 23: Resource Constraint Validation**
  - **Validates: Requirements 7.11, 7.12**

- [ ] 6. Implement sell mechanics
  - Implement sell transaction (increase credits, decrease cargo stack quantity)
  - Add logic to remove empty cargo stacks after selling all units
  - Calculate and display profit margin (sale price - purchase price)
  - _Requirements: 7.3, 7.9, 7.10_

- [ ] 6.1 Write property test for sale credits addition
  - **Property 21: Sale Credits Addition**
  - **Validates: Requirements 7.9**

- [ ] 6.2 Write property test for sale cargo reduction
  - **Property 22: Sale Cargo Reduction**
  - **Validates: Requirements 7.10**

- [ ] 7. Implement refuel system with pricing
  - Implement fuel price calculation based on system distance from Sol
  - Set fuel prices: Sol/Alpha Centauri = 2 credits/%, mid-range (4.5-10 LY) = 3 credits/%, outer (≥10 LY) = 4 credits/%
  - Implement refuel cost calculation: amount × price
  - Implement refuel validation (check credits, check capacity limit)
  - Implement refuel transaction (decrease credits, increase fuel)
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 7.0.1 Write property test for core system fuel pricing
  - **Property 25.5: Core System Fuel Pricing**
  - **Validates: Requirements 8.3**

- [ ] 7.1 Write property test for mid-range system fuel pricing
  - **Property 26: Mid-Range System Fuel Pricing**
  - **Validates: Requirements 8.4**

- [ ] 7.2 Write property test for outer system fuel pricing
  - **Property 27: Outer System Fuel Pricing**
  - **Validates: Requirements 8.5**

- [ ] 7.3 Write property test for refuel cost calculation
  - **Property 28: Refuel Cost Calculation**
  - **Validates: Requirements 8.6**

- [ ] 7.4 Write property test for refuel capacity constraint
  - **Property 29: Refuel Capacity Constraint**
  - **Validates: Requirements 8.7**

- [ ] 7.5 Write property test for refuel credit validation
  - **Property 30: Refuel Credit Validation**
  - **Validates: Requirements 8.8**

- [ ] 7.6 Write property test for refuel state mutation
  - **Property 31: Refuel State Mutation**
  - **Validates: Requirements 8.9**

- [ ] 8. Implement save/load system with localStorage
  - Create SaveLoadManager class with serialization methods
  - Implement save to localStorage with version number and timestamp
  - Implement load from localStorage with parsing and validation
  - Add version compatibility checking
  - Add corrupted data handling (fallback to new game)
  - Implement hasSavedGame check for initial menu
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 10.1, 10.2, 10.7, 10.8, 10.9, 10.10_

- [ ] 8.1 Write property test for save data completeness
  - **Property 33: Save Data Completeness**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 9. Implement auto-save triggers
  - Add auto-save call after jump completion
  - Add auto-save call after trade transactions
  - Add auto-save call after refuel transactions
  - Add auto-save call after dock/undock operations
  - Implement save debouncing (max 1 save per second)
  - _Requirements: 4.8, 7.15, 8.10, 10.3, 10.4, 10.5, 10.6_

- [ ] 9.1 Write property test for auto-save triggers
  - **Property 34: Auto-Save Triggers**
  - **Validates: Requirements 4.8, 7.15, 8.10, 10.3, 10.4, 10.5, 10.6**

- [ ] 10. Create HUD overlay UI
  - Create DOM overlay positioned over Three.js canvas
  - Implement HUD display with all required fields (credits, debt, days, fuel, cargo, system name, distance from Sol)
  - Subscribe to state change events for reactive updates:
    - Subscribe to 'creditsChanged' to update credits display
    - Subscribe to 'debtChanged' to update debt display
    - Subscribe to 'timeChanged' to update days display
    - Subscribe to 'fuelChanged' to update fuel bar
    - Subscribe to 'cargoChanged' to update cargo display
    - Subscribe to 'locationChanged' to update system name and distance
  - Style HUD with game aesthetic (monospace font, green/black theme)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 10.1 Write property test for HUD display completeness
  - **Property 2: HUD Display Completeness**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [ ] 10.2 Write property test for HUD reactivity
  - **Property 3: HUD Reactivity**
  - **Validates: Requirements 2.8**

- [ ] 11. Create station interface UI
  - Create station modal/panel with system name and distance from Sol
  - Add Trade, Refuel, and Undock buttons
  - Implement show/hide logic for station interface
  - Hook station interface to current system click event
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11.1 Write property test for station interface display
  - **Property 14: Station Interface Display**
  - **Validates: Requirements 6.2**

- [ ] 12. Create trade panel UI
  - Display all six goods with current prices at station
  - Display all cargo stacks separately with good type, quantity, and purchase price
  - Show profit margin for each cargo stack (station price vs purchase price)
  - Add buy buttons with quantity options (1, 10, max affordable)
  - Add sell buttons with quantity options (1, all from stack)
  - Implement stack selection for selling
  - Connect to trading system methods
  - _Requirements: 7.1, 7.3, 7.13, 7.14, 7.16_

- [ ] 12.1 Write property test for cargo stack display
  - **Property 16: Cargo Stack Display**
  - **Validates: Requirements 7.3**

- [ ] 12.2 Write property test for cargo stack display completeness
  - **Property 24: Cargo Stack Display Completeness**
  - **Validates: Requirements 7.16**

- [ ] 13. Create refuel panel UI
  - Display current fuel percentage
  - Display fuel price per percentage point
  - Add refuel amount input/buttons
  - Display total cost calculation
  - Add refuel confirmation button
  - Connect to refuel system methods
  - _Requirements: 8.1, 8.2_

- [ ] 13.1 Write property test for refuel price display
  - **Property 25: Refuel Price Display**
  - **Validates: Requirements 8.2**

- [ ] 14. Implement error notification system
  - Create notification area in UI
  - Implement error message display with auto-dismiss (3 seconds)
  - Implement message queue for sequential display without overlap
  - Style notifications for visibility
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 14.1 Write property test for error message sequencing
  - **Property 32: Error Message Sequencing**
  - **Validates: Requirements 9.3**

- [ ] 15. Integrate visual feedback into starmap
  - Add pulsing ring indicator around current system
  - Implement connection line color coding based on fuel availability (green: sufficient, yellow: 10-20% remaining, red: insufficient)
  - Add hover tooltip showing distance, jump time, and fuel cost for connected systems
  - Update connection colors when fuel changes
  - _Requirements: 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15.1 Write property test for connection visual fuel feedback
  - **Property 13: Connection Visual Fuel Feedback**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [ ] 15.2 Write property test for jump information display
  - **Property 8: Jump Information Display**
  - **Validates: Requirements 3.5, 5.5**

- [ ] 16. Create initial game menu
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ] 16.1 Implement menu UI and save detection
  - Create start screen modal/overlay
  - Check for saved game using hasSavedGame function
  - Show appropriate buttons based on save existence (Continue + New Game, or Start Game only)
  - Style menu with game aesthetic
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 16.2 Implement Continue functionality
  - Connect Continue button to loadGame function
  - Display loading state during restore operation
  - Handle corrupted save data gracefully (show error message, offer New Game option)
  - Handle incompatible save version (notify user, offer New Game option)
  - Transition to game view on successful load
  - _Requirements: 1.6, 10.9, 10.10_

- [ ] 16.3 Implement New Game functionality
  - Connect New Game button to initNewGame function
  - Show confirmation dialog if save exists (warn about overwrite)
  - Initialize game state with default values
  - Transition to game view
  - _Requirements: 1.4, 1.5_

- [ ] 17. Wire all systems together and test complete game loop
  - Connect all UI components to game state manager
  - Connect all game systems to auto-save triggers
  - Test complete flow: start game → view HUD → dock → trade → refuel → undock → jump → dock at new system → trade → verify profit
  - Verify all state changes trigger appropriate UI updates
  - Verify all transactions trigger auto-save
  - Test save/load preserves complete game state
  - _Requirements: All_

- [ ] 17.1 Write integration tests for complete game flow
  - Test new game → jump → trade → refuel → save → load cycle
  - Test error scenarios (invalid jumps, insufficient resources)
  - Test UI integration (clicks trigger correct state changes)

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

