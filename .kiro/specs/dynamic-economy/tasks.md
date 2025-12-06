# Implementation Plan

- [x] 1. Implement seeded random number generator
  - Create SeededRandom class with deterministic generation
  - Implement string-to-hash conversion using formula: hash = ((hash << 5) - hash) + charCode
  - Implement random number generation using formula: hash = (hash × 9301 + 49297) % 233280
  - Normalize output by dividing by 233280 to produce values between 0 and 1
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write property test for seeded random determinism
  - **Property 1: Seeded Random Determinism**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 2. Extend price calculation system with multiple modifiers
  - Extend TradingSystem.calculatePrice() to accept currentDay and activeEvents parameters
  - Implement getProductionModifier() using spectral class lookup
  - Implement getStationCountModifier() using formula: 1.0 + (stationCount × 0.05)
  - Implement getDailyFluctuation() using seeded random with seed format: "systemId_goodType_day"
  - Implement getEventModifier() to apply active event multipliers
  - Multiply all modifiers together: basePrice × production × stationCount × daily × event
  - Round final price to nearest integer
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 2.1 Write property test for price calculation with all modifiers
  - **Property 2: Price Calculation with All Modifiers**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.8**

- [x] 2.2 Write property test for station count modifier formula
  - **Property 3: Station Count Modifier Formula**
  - **Validates: Requirements 2.4**

- [x] 2.3 Write property test for daily fluctuation range
  - **Property 4: Daily Fluctuation Range**
  - **Validates: Requirements 2.7**

- [x] 2.4 Write property test for price rounding
  - **Property 5: Price Rounding**
  - **Validates: Requirements 2.9**

- [x] 3. Implement price knowledge database system
  - Add priceKnowledge object to world state: { [systemId]: { lastVisit, prices } }
  - Initialize Sol's prices in priceKnowledge at new game start with lastVisit = 0
  - Implement updatePriceKnowledge() to record prices on first visit
  - Implement updatePriceKnowledge() to update prices and reset lastVisit on dock
  - Implement incrementPriceKnowledgeStaleness() to increment lastVisit for all systems on day change
  - Wire price recalculation to day advancement (trigger when daysElapsed changes)
  - Filter trade interface to display only prices from priceKnowledge
  - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.1 Write property test for first visit price recording
  - **Property 6: First Visit Price Recording**
  - **Validates: Requirements 3.2**

- [x] 3.2 Write property test for dock price update
  - **Property 7: Dock Price Update**
  - **Validates: Requirements 3.3**

- [x] 3.3 Write property test for display only known prices
  - **Property 8: Display Only Known Prices**
  - **Validates: Requirements 3.4, 3.5**

- [x] 3.4 Write property test for price knowledge staleness increment
  - **Property 9: Price Knowledge Staleness Increment**
  - **Validates: Requirements 3.6**

- [x] 3.5 Implement automatic price recalculation on day advancement
  - Add event listener for daysElapsed changes in GameStateManager
  - Trigger price recalculation for all systems in priceKnowledge when day changes
  - Update priceKnowledge with new calculated prices
  - Emit priceKnowledgeChanged event to update UI
  - _Requirements: 2.1_

- [ ] 4. Implement economic events system
  - Create EconomicEventsSystem class with EVENT_TYPES definitions
  - Define event types: mining_strike, medical_emergency, festival, supply_glut
  - Implement updateEvents() to evaluate event triggers each day based on chance percentages
  - Implement isSystemEligible() to check system matches event target criteria
  - Implement createEvent() to generate event with unique ID, type, systemId, startDay, endDay, modifiers
  - Implement removeExpiredEvents() to clean up events where currentDay > endDay
  - Implement getActiveEventForSystem() to retrieve active event for a system
  - Apply event modifiers in price calculation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10, 4.11_

- [ ] 4.1 Write property test for event trigger evaluation
  - **Property 10: Event Trigger Evaluation**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 4.2 Write property test for event creation completeness
  - **Property 11: Event Creation Completeness**
  - **Validates: Requirements 4.3**

- [ ] 4.3 Write property test for event modifier application
  - **Property 12: Event Modifier Application**
  - **Validates: Requirements 4.4, 4.7**

- [ ] 4.4 Write property test for event expiration cleanup
  - **Property 13: Event Expiration Cleanup**
  - **Validates: Requirements 4.5**

- [ ] 5. Implement event notification UI
  - Create event notification modal component
  - Display event name, description, and expected duration
  - Show notification when docking at system with active event
  - Add dismiss button to close notification
  - _Requirements: 4.6_

- [ ] 5.1 Write property test for event notification display
  - **Property 14: Event Notification Display**
  - **Validates: Requirements 4.6**

- [ ] 6. Implement information broker system
  - Create InformationBroker class with pricing constants
  - Define PRICES: RECENT_VISIT = 50, NEVER_VISITED = 100, STALE_VISIT = 75, RUMOR = 25
  - Define RECENT_THRESHOLD = 30 days
  - Implement getIntelligenceCost() to calculate cost based on lastVisit
  - Implement purchaseIntelligence() to deduct credits and update priceKnowledge
  - Implement generateRumor() to create hints about prices or events
  - Implement validatePurchase() to check sufficient credits
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 6.1 Write property test for information broker system listing
  - **Property 15: Information Broker System Listing**
  - **Validates: Requirements 5.2**

- [ ] 6.2 Write property test for intelligence purchase transaction
  - **Property 16: Intelligence Purchase Transaction**
  - **Validates: Requirements 5.3**

- [ ] 6.3 Write property test for intelligence cost calculation
  - **Property 17: Intelligence Cost Calculation**
  - **Validates: Requirements 5.4, 5.5, 5.6**

- [ ] 6.4 Write property test for market rumor generation
  - **Property 18: Market Rumor Generation**
  - **Validates: Requirements 5.7, 5.8**

- [ ] 6.5 Write property test for intelligence purchase validation
  - **Property 19: Intelligence Purchase Validation**
  - **Validates: Requirements 5.9**

- [ ] 7. Implement information broker UI
  - Add "Info Broker" option to station menu
  - Create information broker interface panel
  - List all systems with intelligence costs and last visit information
  - Add purchase buttons for each system
  - Add "Market Rumor" option with ₡25 cost
  - Display validation messages for insufficient credits
  - _Requirements: 5.1, 5.2_

- [ ] 8. Implement ship condition degradation system
  - Add hull, engine, lifeSupport fields to ship state (default 100)
  - Implement applyJumpDegradation() in NavigationSystem
  - Apply degradation on jump: hull -2%, engine -1%, lifeSupport -(0.5% × jumpDays)
  - Clamp all condition values to [0, 100] range
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8.1 Write property test for jump degradation application
  - **Property 20: Jump Degradation Application**
  - **Validates: Requirements 6.1**

- [ ] 8.2 Write property test for ship condition clamping
  - **Property 21: Ship Condition Clamping**
  - **Validates: Requirements 6.2, 6.3**

- [ ] 9. Implement engine condition penalties
  - Extend calculateFuelCostWithCondition() to apply +20% penalty when engine < 60%
  - Extend calculateJumpTimeWithCondition() to add +1 day penalty when engine < 60%
  - Update executeJump() to use condition-aware calculations
  - _Requirements: 6.4, 6.5_

- [ ] 9.1 Write property test for engine condition fuel penalty
  - **Property 22: Engine Condition Fuel Penalty**
  - **Validates: Requirements 6.4**

- [ ] 9.2 Write property test for engine condition time penalty
  - **Property 23: Engine Condition Time Penalty**
  - **Validates: Requirements 6.5**

- [ ] 10. Implement ship repair system
  - Implement getRepairCost() to calculate cost at ₡5 per 1% restored
  - Implement validateRepair() to check credits, current condition, and prevent over-repair
  - Implement repairShipSystem() to deduct credits and increase condition
  - Add repair methods to GameStateManager
  - _Requirements: 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 10.1 Write property test for repair transaction execution
  - **Property 24: Repair Transaction Execution**
  - **Validates: Requirements 7.5**

- [ ] 10.2 Write property test for repair validation
  - **Property 25: Repair Validation**
  - **Validates: Requirements 7.6, 7.7, 7.8**

- [ ] 11. Implement repair UI
  - Add "Repairs" option to station menu
  - Create repair interface panel
  - Display current condition percentages with visual progress bars
  - Show repair options for 10% increments for each system
  - Show full restoration option for each system
  - Display costs for each repair option
  - Show "Repair All to Full" option with total cost
  - Display validation messages for insufficient credits or invalid repairs
  - _Requirements: 7.1, 7.2, 7.3, 7.9_

- [ ] 11.1 Write property test for repair interface display completeness
  - **Property 26: Repair Interface Display Completeness**
  - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 11.2 Write property test for repair all cost calculation
  - **Property 27: Repair All Cost Calculation**
  - **Validates: Requirements 7.9**

- [ ] 12. Implement ship condition warnings
  - Implement checkConditionWarnings() to evaluate thresholds
  - Display warning when hull < 50%: "Risk of cargo loss during jumps"
  - Display warning when engine < 30%: "Jump failure risk - immediate repairs recommended"
  - Display critical warning when life support < 20%: "Critical condition - urgent repairs required"
  - Trigger warnings on condition changes
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 12.1 Write property test for ship condition warning thresholds
  - **Property 28: Ship Condition Warning Thresholds**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 13. Implement ship condition HUD display
  - Add condition bars to HUD for fuel, hull, engine, life support
  - Display labels and percentage values for each condition
  - Update bar visual width on condition changes
  - Use distinct visual styling for each condition type
  - Subscribe to shipConditionChanged events for reactivity
  - _Requirements: 8.4, 8.5, 8.6_

- [ ] 13.1 Write property test for HUD condition bar display
  - **Property 29: HUD Condition Bar Display**
  - **Validates: Requirements 8.4**

- [ ] 13.2 Write property test for condition bar reactivity
  - **Property 30: Condition Bar Reactivity**
  - **Validates: Requirements 8.5**

- [ ] 13.3 Write property test for condition bar visual distinction
  - **Property 31: Condition Bar Visual Distinction**
  - **Validates: Requirements 8.6**

- [ ] 14. Extend cargo stack structure with purchase metadata
  - Add purchaseSystem field to cargo stack structure
  - Add purchaseDay field to cargo stack structure
  - Update addCargoStack() to accept and store systemId and day parameters
  - Update buyGood() to pass current system and day to addCargoStack()
  - _Requirements: 9.1_

- [ ] 14.1 Write property test for cargo purchase metadata storage
  - **Property 32: Cargo Purchase Metadata Storage**
  - **Validates: Requirements 9.1**

- [ ] 15. Implement cargo display with purchase context
  - Display purchase price for each cargo stack
  - Display system name where cargo was purchased
  - Calculate and display days since purchase (currentDay - purchaseDay)
  - Update trade interface to show all purchase context
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 15.1 Write property test for cargo display with purchase context
  - **Property 33: Cargo Display with Purchase Context**
  - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 16. Implement profit calculation with context
  - Calculate profit amount: salePrice - purchasePrice
  - Calculate profit percentage: (profit / purchasePrice) × 100
  - Display profit amount and percentage when cargo is selected for sale
  - Update sellGood() to show profit calculations
  - _Requirements: 9.5, 9.6, 9.7_

- [ ] 16.1 Write property test for profit calculation and display
  - **Property 34: Profit Calculation and Display**
  - **Validates: Requirements 9.5, 9.6, 9.7**

- [ ] 17. Extend save/load system for Phase 2 data
  - Update save version to '2.0.0'
  - Extend save schema to include ship condition (hull, engine, lifeSupport)
  - Extend save schema to include cargo metadata (purchaseSystem, purchaseDay)
  - Extend save schema to include priceKnowledge object
  - Extend save schema to include activeEvents array
  - Implement migration from v1.0.0 to v2.0.0
  - Add defaults for missing Phase 2 data on load
  - Validate extended state structure
  - _Requirements: All (persistence)_

- [ ] 17.1 Write unit tests for save/load migration
  - Test v1.0.0 save loads and migrates correctly
  - Test v2.0.0 save loads without migration
  - Test missing Phase 2 data gets defaults
  - Test corrupted Phase 2 data handled gracefully

- [ ] 18. Integrate all systems and test complete flow
  - Wire seeded random into price calculations
  - Wire price knowledge into trade interface
  - Wire events into price calculations and notifications
  - Wire ship condition into jump mechanics and HUD
  - Wire repairs into station interface
  - Wire information broker into station interface
  - Test complete flow: start game → advance days → observe price changes → visit systems → purchase intelligence → make jumps → repair ship → trade with profit context
  - _Requirements: All_

- [ ] 18.1 Write integration tests for dynamic economy flow
  - Test price changes over time
  - Test price discovery and staleness
  - Test intelligence purchases
  - Test event triggering and price effects
  - Test ship degradation and repairs
  - Test cargo purchase context and profit calculations

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
