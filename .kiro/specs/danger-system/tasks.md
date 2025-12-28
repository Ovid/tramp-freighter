# Implementation Plan: Danger System

## Overview

This implementation plan breaks down the Danger System into incremental tasks that build on each other. Each task produces working, testable code. The plan follows the existing manager-based architecture and integrates with the navigation system to trigger encounters during jumps.

**TDD Approach**: All tasks follow RED/GREEN/REFACTOR methodology:
- **RED**: Write ONE failing test first
- **GREEN**: Write minimal code to make the test pass
- **REFACTOR**: Improve code while keeping tests green
- Never batch multiple failing tests - complete each cycle before starting the next

## Tasks

- [x] 1. Add danger system constants to game constants
  - Add DANGER_CONFIG with zone definitions, probabilities, and system lists
  - Add COMBAT_CONFIG with base chances, outcomes, and quirk/upgrade modifiers (all combat modifier values must be in constants for consistency and tuning per Req 3.18)
  - Add NEGOTIATION_CONFIG with dialogue success rates and cargo percentages
  - Add INSPECTION_CONFIG with fines, bribery costs, reputation penalties, and security level multipliers
  - Add FAILURE_CONFIG with condition thresholds and repair options
  - Add DISTRESS_CONFIG with resource costs and karma/reputation values
  - Add KARMA_CONFIG and FACTION_CONFIG with bounds and initial values
  - Add RESTRICTED_GOODS_CONFIG with zone restrictions for existing commodities (electronics in safe, medicine in contested, tritium in dangerous, parts in core systems)
  - _Requirements: 1.4-1.12, 3.2-3.18, 4.2-4.10, 5.2-5.12, 6.2-6.9, 7.7-7.10, 8.1-8.3, 9.1-9.8, 11.1, 11.2, 11.8_

- [x] 2. Extend game state with karma and faction reputation (TDD)
  - [x] 2.1 RED: Write property test for karma initialization
    - **Property 12: Karma Clamping (initialization)**
    - Test that karma initializes to 0 and stays within bounds
    - **Validates: Requirements 9.1, 9.8**
  - [x] 2.2 GREEN: Add karma field to InitializationManager.createInitialState()
    - Add player.karma initialized to 0
    - _Requirements: 9.1, 9.8_
  - [x] 2.3 RED: Write property test for faction initialization
    - **Property 13: Faction Reputation Clamping (initialization)**
    - Test that all factions initialize to 0 and stay within bounds
    - **Validates: Requirements 8.1, 8.2**
  - [x] 2.4 GREEN: Add factions field to InitializationManager.createInitialState()
    - Add player.factions object with authorities, traders, outlaws, civilians all at 0
    - _Requirements: 8.1, 8.2_

- [x] 3. Create DangerManager base structure (TDD)
  - [x] 3.1 RED: Write property test for danger zone classification
    - **Property 1: Danger Zone Classification Consistency**
    - Test that every system maps to exactly one zone type
    - **Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12**
  - [x] 3.2 GREEN: Create src/game/state/managers/danger.js with getDangerZone(systemId)
    - Extend BaseManager
    - Implement getDangerZone(systemId) using DANGER_CONFIG
    - _Requirements: 1.1, 1.2, 1.10, 1.11, 1.12_
  - [x] 3.3 RED: Write property test for karma clamping
    - **Property 12: Karma Clamping**
    - Test that karma modifications stay within [-100, 100] bounds
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [x] 3.4 GREEN: Implement modifyKarma(amount, reason) with clamping
    - Clamp result to [-100, 100]
    - Implement getKarma() getter
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 3.5 RED: Write property test for faction reputation clamping
    - **Property 13: Faction Reputation Clamping**
    - Test that faction rep modifications stay within [-100, 100] bounds
    - **Validates: Requirements 8.3**
  - [x] 3.6 GREEN: Implement modifyFactionRep(faction, amount, reason) with clamping
    - Clamp result to [-100, 100]
    - Implement getFactionRep(faction) getter
    - _Requirements: 8.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement pirate encounter probability calculation (TDD)
  - [x] 5.1 RED: Write property test for zone-specific encounter rates
    - **Property 2: Zone-Specific Encounter Rates**
    - Test that dangerous zones have higher base rates than safe zones
    - **Validates: Requirements 1.4, 1.5, 1.6**
  - [x] 5.2 GREEN: Add calculatePirateEncounterChance base implementation
    - Use zone-specific base rates from DANGER_CONFIG
    - _Requirements: 2.1_
  - [x] 5.3 RED: Write property test for encounter probability modifiers
    - **Property 3: Encounter Probability Modifiers**
    - Test cargo value, engine condition, sensors, and faction modifiers
    - **Validates: Requirements 2.7, 2.8, 2.9, 2.10, 8.8**
  - [x] 5.4 GREEN: Complete calculatePirateEncounterChance with all modifiers
    - Apply cargo value modifiers (1.2x at ₡5,000, 1.5x at ₡10,000)
    - Apply engine condition modifier (1.1x below 50%)
    - Apply advanced sensors modifier (0.8x)
    - Apply faction reputation modifier (outlaw rep reduces chance, authority rep increases chance)
    - Clamp final probability to [0, 1]
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 8.8_

- [x] 6. Implement inspection probability calculation (TDD)
  - [x] 6.1 RED: Write property test for inspection probability scaling
    - **Property 8: Inspection Probability Scaling**
    - Test zone rates, restricted goods modifier, core systems multiplier, faction modifier
    - **Validates: Requirements 5.2, 5.12, 8.8**
  - [x] 6.2 GREEN: Add calculateInspectionChance(systemId, gameState) to DangerManager
    - Use zone-specific base rates from DANGER_CONFIG
    - Apply restricted goods modifier (1 + count * 0.1)
    - Apply core systems multiplier (2x for systems 0, 1)
    - Apply faction reputation modifier (authority rep reduces chance)
    - _Requirements: 5.1, 5.2, 5.12, 8.8_

- [x] 7. Implement combat resolution system (TDD)
  - [x] 7.1 RED: Write property test for combat resolution outcomes
    - **Property 4: Combat Resolution Outcomes**
    - Test that each choice produces valid outcome structure
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11**
  - [x] 7.2 GREEN: Add resolveCombatChoice base implementation
    - Implement evasive maneuvers (70% base, engine modifier)
    - Implement return fire (45% base, +5 outlaw rep on success for fighting pirates)
    - Implement dump cargo (guaranteed escape)
    - Implement distress call (30% base)
    - Return outcome object with success, costs, and rewards
    - _Requirements: 3.1-3.11, 8.7_
  - [x] 7.3 RED: Write property test for combat modifier application
    - **Property 5: Combat Modifier Application**
    - Test quirk/upgrade modifiers and karma hidden modifier
    - **Validates: Requirements 3.12, 3.13, 3.14, 3.15, 3.16, 3.17**
  - [x] 7.4 GREEN: Add modifier application to resolveCombatChoice
    - Apply quirk/upgrade modifiers from COMBAT_CONFIG.MODIFIERS
    - Apply karma as hidden modifier on success rates (±5% at extreme karma)
    - Apply karma scaling to Lucky Ship quirk effectiveness (5% base + karma * LUCKY_SHIP_KARMA_SCALE)
    - _Requirements: 3.12-3.17, 9.4, 9.6, 9.10_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement negotiation system (TDD)
  - [x] 9.1 RED: Write property test for negotiation outcomes
    - **Property 6: Negotiation Outcomes**
    - Test each negotiation choice produces valid outcomes
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.10**
  - [x] 9.2 GREEN: Add resolveNegotiation(choice, gameState, rng) to DangerManager
    - Implement counter-proposal (60% base, 10% cargo on success)
    - Implement medicine claim (40% sympathy if medicine in cargo)
    - Implement intel offer (requires prior intel, +3 outlaw rep for cooperating with pirates)
    - Implement accept demand (20% cargo)
    - Apply karma as hidden modifier on negotiation success rates (±5% at extreme karma)
    - _Requirements: 4.1-4.11, 8.7, 9.4, 9.10_

- [ ] 10. Implement inspection resolution system (TDD)
  - [ ] 10.1 RED: Write property test for inspection outcomes
    - **Property 7: Inspection Outcomes**
    - Test cooperate, hidden cargo discovery, bribery, and flee outcomes
    - Test that flee triggers patrol combat encounter
    - Test security level scaling for hidden cargo discovery (2x core, 1.5x safe, 1x contested, 0.5x dangerous)
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11, 11.8**
  - [ ] 10.2 GREEN: Add resolveInspection(choice, gameState, rng) to DangerManager
    - Implement cooperate (confiscate restricted, ₡1,000 fine, +5 authority rep for cooperation)
    - Implement hidden cargo discovery (10% base chance, scaled by security level: 2x core, 1.5x safe, 1x contested, 0.5x dangerous)
    - Hidden cargo discovery costs ₡2,000 fine, -20 authority rep
    - Implement bribery (60% success, ₡500 cost, -10 authority rep on attempt for resisting)
    - Implement flee (trigger patrol combat, -15 authority rep for resisting/fleeing)
    - Apply reputation penalties for restricted goods (-10 authority rep)
    - Update outlaw rep when smuggling is discovered (+5 outlaw rep for smuggling activity)
    - _Requirements: 5.3-5.11, 8.4, 8.5, 8.7, 11.8_

- [ ] 11. Implement mechanical failure system (TDD)
  - [ ] 11.1 RED: Write property test for mechanical failure thresholds
    - **Property 9: Mechanical Failure Thresholds**
    - Test failure chances at different condition levels
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  - [ ] 11.2 GREEN: Add checkMechanicalFailure(gameState, rng) to DangerManager
    - Check hull breach (below 50%, 10% chance)
    - Check engine failure (below 30%, 15% chance)
    - Check life support emergency (below 30%, 5% chance)
    - Return failure type or null
    - _Requirements: 6.1-6.4_
  - [ ] 11.3 RED: Write property test for engine failure repair options
    - **Property 10: Engine Failure Repair Options**
    - Test restart, help, and jury-rig outcomes
    - **Validates: Requirements 6.7, 6.8, 6.9**
  - [ ] 11.4 GREEN: Add resolveMechanicalFailure(failureType, choice, gameState, rng)
    - Implement hull breach outcome (-5% hull, cargo loss)
    - Implement engine failure options (restart, help, jury-rig)
    - _Requirements: 6.5-6.11_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement distress call system (TDD)
  - [ ] 13.1 RED: Write property test for distress call outcomes
    - **Property 11: Distress Call Outcomes**
    - Test respond, ignore, and loot outcomes with karma/rep changes
    - **Validates: Requirements 7.7, 7.8, 7.9, 7.10**
  - [ ] 13.2 GREEN: Add checkDistressCall(rng) to DangerManager
    - 10% chance to generate distress call
    - Return distress call object or null
    - _Requirements: 7.1_
  - [ ] 13.3 GREEN: Add resolveDistressCall(choice, gameState) to DangerManager
    - Implement respond (2 days, 15% fuel, 5% life support, +₡500, +10 civilian rep for helping civilians, +1 karma)
    - Implement ignore (-1 karma)
    - Implement loot (1 day, -3 karma, -15 civilian rep, +5 outlaw rep for piracy, cargo reward)
    - _Requirements: 7.2-7.10, 8.6, 8.7_

- [ ] 14. Extend hidden cargo system (TDD)
  - [ ] 14.1 RED: Write property test for hidden cargo separation
    - **Property 14: Hidden Cargo Separation**
    - Test that hidden cargo is separate from regular cargo
    - **Validates: Requirements 11.4, 11.5, 11.6, 11.7**
  - [ ] 14.2 GREEN: Add hiddenCargo array to ship state in InitializationManager
    - Separate from regular cargo array
    - _Requirements: 11.4, 11.5_
  - [ ] 14.3 GREEN: Update ShipManager with hidden cargo methods
    - Add getHiddenCargo() getter
    - Update moveToHiddenCargo() to use new state structure
    - Update moveToRegularCargo() to use new state structure
    - _Requirements: 11.3, 11.4_

- [ ] 15. Integrate restricted goods with trading system (TDD)
  - [ ] 15.1 RED: Write property test for restricted goods premium pricing
    - **Property 16: Restricted Goods Premium Pricing**
    - Test premium multiplier (1.5x) when selling restricted goods in legal zones
    - Test trade blocking for restricted goods in restricted zones
    - Test black market contact bypass for restricted zone sales
    - **Validates: Requirements 11.10, 11.11, 11.12**
  - [ ] 15.2 GREEN: Add isGoodRestricted(goodType, systemId) to TradingManager
    - Check zone restrictions from RESTRICTED_GOODS_CONFIG
    - Check core system restrictions for systems 0, 1
    - Return boolean indicating if good is restricted at location
    - _Requirements: 11.1, 11.2_
  - [ ] 15.3 GREEN: Update calculateSellPrice to apply premium multiplier
    - Apply PREMIUM_MULTIPLIER (1.5x) when selling restricted goods in legal zones
    - _Requirements: 11.10_
  - [ ] 15.4 GREEN: Add canSellGood(goodType, systemId, hasBlackMarketContact) to TradingManager
    - Block normal trade for restricted goods in restricted zones
    - Allow trade if player has black market contacts (NPC benefit)
    - _Requirements: 11.11, 11.12_

- [ ] 16. Integrate DangerManager with GameStateManager (TDD)
  - [ ] 16.1 RED: Write property test for state persistence round-trip
    - **Property 15: State Persistence Round-Trip**
    - Test that karma, factions, hiddenCargo, dangerFlags survive save/load
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  - [ ] 16.2 GREEN: Add DangerManager to GameStateManager constructor
    - Import and instantiate DangerManager
    - Add delegation methods for danger operations
    - _Requirements: All_
  - [ ] 16.3 GREEN: Update SaveLoadManager for danger state
    - Add karma and factions to save/load
    - Add hiddenCargo to save/load
    - Add dangerFlags to save/load
    - _Requirements: 10.1-10.5_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create danger warning dialog component
  - [ ] 18.1 Create src/features/danger/DangerWarningDialog.jsx
    - Display danger zone classification
    - Show pirate and inspection probabilities
    - Provide proceed/cancel options
    - _Requirements: 1.3, 12.3_

- [ ] 19. Create pirate encounter panel component
  - [ ] 19.1 Create src/features/danger/PirateEncounterPanel.jsx
    - Display pirate threat level and ship status
    - Show tactical options (fight, flee, negotiate, surrender)
    - Display success probabilities for each option
    - _Requirements: 2.2, 2.11, 2.12, 12.1, 12.2, 12.4, 12.5_

- [ ] 20. Create combat resolution panel component
  - [ ] 20.1 Create src/features/danger/CombatPanel.jsx
    - Display combat options (evasive, return fire, dump cargo, distress)
    - Display current ship status affecting outcomes (hull, engine, fuel, upgrades, quirks)
    - Show success probabilities with modifier breakdown
    - Display potential outcomes for each choice
    - _Requirements: 3.1, 12.1, 12.2, 12.4, 12.5_

- [ ] 21. Create negotiation panel component
  - [ ] 21.1 Create src/features/danger/NegotiationPanel.jsx
    - Display contextual dialogue options
    - Show conditional options (medicine claim, intel offer)
    - Display success probabilities and consequences
    - _Requirements: 4.1, 4.5, 4.8, 4.11, 12.1, 12.5_

- [ ] 22. Create inspection panel component
  - [ ] 22.1 Create src/features/danger/InspectionPanel.jsx
    - Display cargo manifest with restricted items marked
    - Show inspection options (cooperate, bribe, flee)
    - Display costs and consequences for each option
    - _Requirements: 5.3, 5.13, 12.1, 12.5_

- [ ] 23. Create mechanical failure panel component
  - [ ] 23.1 Create src/features/danger/MechanicalFailurePanel.jsx
    - Display failure type and severity
    - Show repair options with success rates and costs
    - _Requirements: 6.6, 6.11, 12.1, 12.5_

- [ ] 24. Create distress call panel component
  - [ ] 24.1 Create src/features/danger/DistressCallPanel.jsx
    - Display distress call description
    - Show moral choice options (respond, ignore, loot)
    - Display costs and consequences for each choice
    - _Requirements: 7.2, 7.6, 12.1, 12.5_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Integrate danger system with navigation
  - [ ] 26.1 Create useJumpEncounters hook
    - Hook into jump completion events
    - Check for pirate encounters, inspections, failures, distress calls
    - Trigger appropriate panel display
    - _Requirements: 2.1, 5.1, 6.1, 7.1_
  - [ ] 26.2 Update JumpDialog to show danger warnings
    - Check destination danger zone
    - Display warning for contested/dangerous systems
    - _Requirements: 1.3_

- [ ] 27. Add outcome feedback system
  - [ ] 27.1 Create src/features/danger/OutcomePanel.jsx
    - Display encounter outcome with explanation
    - Show what modifiers affected the result
    - Display karma/reputation changes
    - _Requirements: 9.9, 12.6_

- [ ] 28. Integrate faction reputation and karma with dialogue system
  - [ ] 28.1 Update dialogue condition checks to include faction reputation and karma
    - Add faction reputation checks to dialogue choice conditions
    - Add karma checks to influence NPC first impressions
    - NPCs should have different attitudes based on player's faction standing and karma
    - Unlock/lock dialogue options based on reputation and karma thresholds
    - _Requirements: 8.9, 9.5_

- [ ] 29. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **TDD Approach**: All core logic tasks follow RED/GREEN/REFACTOR methodology
  - Each subtask is a complete TDD cycle: write ONE failing test, then implement to pass
  - Never batch multiple failing tests - complete each cycle before starting the next
  - RED tasks write the failing test first
  - GREEN tasks implement minimal code to make the test pass
- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The danger system integrates with existing navigation without modifying core jump logic
- Requirement 10.6 (reference past actions in future interactions) uses dangerFlags (piratesFought, civiliansSaved, etc.) which should be checked in dialogue conditions to unlock special dialogue options or modify NPC responses - deferred to future dialogue enhancement spec (see notes/future-work.md)
- Requirement 9.7 (ending epilogues based on karma) is deferred to a future endgame spec - see notes/future-work.md
