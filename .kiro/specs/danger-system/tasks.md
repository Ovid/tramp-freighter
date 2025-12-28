# Implementation Plan: Danger System

## Overview

This implementation plan breaks down the Danger System into incremental tasks that build on each other. Each task produces working, testable code. The plan follows the existing manager-based architecture and integrates with the navigation system to trigger encounters during jumps.

## Tasks

- [ ] 1. Add danger system constants to game constants
  - Add DANGER_CONFIG with zone definitions, probabilities, and system lists
  - Add COMBAT_CONFIG with base chances, outcomes, and quirk/upgrade modifiers
  - Add NEGOTIATION_CONFIG with dialogue success rates and cargo percentages
  - Add INSPECTION_CONFIG with fines, bribery costs, and reputation penalties
  - Add FAILURE_CONFIG with condition thresholds and repair options
  - Add DISTRESS_CONFIG with resource costs and karma/reputation values
  - Add KARMA_CONFIG and FACTION_CONFIG with bounds and initial values
  - _Requirements: 1.4-1.12, 3.2-3.18, 4.2-4.10, 5.2-5.12, 6.2-6.9, 7.7-7.10, 8.1-8.3, 9.1-9.8_

- [ ] 2. Extend game state with karma and faction reputation
  - [ ] 2.1 Add karma and factions fields to InitializationManager.createInitialState()
    - Add player.karma initialized to 0
    - Add player.factions object with authorities, traders, outlaws, civilians all at 0
    - _Requirements: 8.1, 8.2, 9.1, 9.8_
  - [ ] 2.2 Write property test for karma initialization
    - **Property 12: Karma Clamping (initialization)**
    - **Validates: Requirements 9.1, 9.8**
  - [ ] 2.3 Write property test for faction initialization
    - **Property 13: Faction Reputation Clamping (initialization)**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 3. Create DangerManager base structure
  - [ ] 3.1 Create src/game/state/managers/danger.js with BaseManager extension
    - Implement getDangerZone(systemId) using DANGER_CONFIG
    - Implement modifyKarma(amount, reason) with clamping
    - Implement modifyFactionRep(faction, amount, reason) with clamping
    - Implement getKarma() and getFactionRep(faction) getters
    - _Requirements: 1.1, 1.2, 1.10, 1.11, 1.12, 8.3, 9.1-9.3_
  - [ ] 3.2 Write property test for danger zone classification
    - **Property 1: Danger Zone Classification Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12**
  - [ ] 3.3 Write property test for karma clamping
    - **Property 12: Karma Clamping**
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [ ] 3.4 Write property test for faction reputation clamping
    - **Property 13: Faction Reputation Clamping**
    - **Validates: Requirements 8.3**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement pirate encounter probability calculation
  - [ ] 5.1 Add calculatePirateEncounterChance(fromSystem, toSystem, gameState) to DangerManager
    - Use zone-specific base rates from DANGER_CONFIG
    - Apply cargo value modifiers (1.2x at ₡5,000, 1.5x at ₡10,000)
    - Apply engine condition modifier (1.1x below 50%)
    - Apply advanced sensors modifier (0.8x)
    - Clamp final probability to [0, 1]
    - _Requirements: 2.1, 2.7, 2.8, 2.9, 2.10_
  - [ ] 5.2 Write property test for zone-specific encounter rates
    - **Property 2: Zone-Specific Encounter Rates**
    - **Validates: Requirements 1.4, 1.5, 1.6**
  - [ ] 5.3 Write property test for encounter probability modifiers
    - **Property 3: Encounter Probability Modifiers**
    - **Validates: Requirements 2.7, 2.8, 2.9, 2.10**

- [ ] 6. Implement inspection probability calculation
  - [ ] 6.1 Add calculateInspectionChance(systemId, gameState) to DangerManager
    - Use zone-specific base rates from DANGER_CONFIG
    - Apply restricted goods modifier (1 + count * 0.1)
    - Apply core systems multiplier (2x for systems 0, 1)
    - _Requirements: 5.1, 5.2, 5.12_
  - [ ] 6.2 Write property test for inspection probability scaling
    - **Property 8: Inspection Probability Scaling**
    - **Validates: Requirements 5.2, 5.12**

- [ ] 7. Implement combat resolution system
  - [ ] 7.1 Add resolveCombatChoice(choice, gameState, rng) to DangerManager
    - Implement evasive maneuvers (70% base, engine modifier)
    - Implement return fire (45% base)
    - Implement dump cargo (guaranteed escape)
    - Implement distress call (30% base)
    - Apply quirk/upgrade modifiers from COMBAT_CONFIG.MODIFIERS
    - Return outcome object with success, costs, and rewards
    - _Requirements: 3.1-3.11_
  - [ ] 7.2 Write property test for combat resolution outcomes
    - **Property 4: Combat Resolution Outcomes**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11**
  - [ ] 7.3 Write property test for combat modifier application
    - **Property 5: Combat Modifier Application**
    - **Validates: Requirements 3.12, 3.13, 3.14, 3.15, 3.16, 3.17**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement negotiation system
  - [ ] 9.1 Add resolveNegotiation(choice, gameState, rng) to DangerManager
    - Implement counter-proposal (60% base, 10% cargo on success)
    - Implement medicine claim (40% sympathy if medicine in cargo)
    - Implement intel offer (requires prior intel)
    - Implement accept demand (20% cargo)
    - _Requirements: 4.1-4.11_
  - [ ] 9.2 Write property test for negotiation outcomes
    - **Property 6: Negotiation Outcomes**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.10**

- [ ] 10. Implement inspection resolution system
  - [ ] 10.1 Add resolveInspection(choice, gameState, rng) to DangerManager
    - Implement cooperate (confiscate restricted, ₡1,000 fine)
    - Implement hidden cargo discovery (10% chance, ₡2,000 fine)
    - Implement bribery (60% success, ₡500 cost)
    - Implement flee (trigger patrol combat)
    - Apply reputation penalties
    - _Requirements: 5.3-5.11_
  - [ ] 10.2 Write property test for inspection outcomes
    - **Property 7: Inspection Outcomes**
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.11**

- [ ] 11. Implement mechanical failure system
  - [ ] 11.1 Add checkMechanicalFailure(gameState, rng) to DangerManager
    - Check hull breach (below 50%, 10% chance)
    - Check engine failure (below 30%, 15% chance)
    - Check life support emergency (below 30%, 5% chance)
    - Return failure type or null
    - _Requirements: 6.1-6.4_
  - [ ] 11.2 Add resolveMechanicalFailure(failureType, choice, gameState, rng) to DangerManager
    - Implement hull breach outcome (-5% hull, cargo loss)
    - Implement engine failure options (restart, help, jury-rig)
    - _Requirements: 6.5-6.11_
  - [ ] 11.3 Write property test for mechanical failure thresholds
    - **Property 9: Mechanical Failure Thresholds**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  - [ ] 11.4 Write property test for engine failure repair options
    - **Property 10: Engine Failure Repair Options**
    - **Validates: Requirements 6.7, 6.8, 6.9**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement distress call system
  - [ ] 13.1 Add checkDistressCall(rng) to DangerManager
    - 10% chance to generate distress call
    - Return distress call object or null
    - _Requirements: 7.1_
  - [ ] 13.2 Add resolveDistressCall(choice, gameState) to DangerManager
    - Implement respond (2 days, 15% fuel, 5% life support, +₡500, +10 rep, +1 karma)
    - Implement ignore (-1 karma)
    - Implement loot (1 day, -3 karma, -15 rep, cargo reward)
    - _Requirements: 7.2-7.10_
  - [ ] 13.3 Write property test for distress call outcomes
    - **Property 11: Distress Call Outcomes**
    - **Validates: Requirements 7.7, 7.8, 7.9, 7.10**

- [ ] 14. Extend hidden cargo system
  - [ ] 14.1 Add hiddenCargo array to ship state in InitializationManager
    - Separate from regular cargo array
    - _Requirements: 11.4, 11.5_
  - [ ] 14.2 Update ShipManager with hidden cargo methods
    - Add getHiddenCargo() getter
    - Update moveToHiddenCargo() to use new state structure
    - Update moveToRegularCargo() to use new state structure
    - _Requirements: 11.3, 11.4_
  - [ ] 14.3 Write property test for hidden cargo separation
    - **Property 14: Hidden Cargo Separation**
    - **Validates: Requirements 11.4, 11.5, 11.6, 11.7**

- [ ] 15. Integrate DangerManager with GameStateManager
  - [ ] 15.1 Add DangerManager to GameStateManager constructor
    - Import and instantiate DangerManager
    - Add delegation methods for danger operations
    - _Requirements: All_
  - [ ] 15.2 Update SaveLoadManager for danger state
    - Add karma and factions to save/load
    - Add hiddenCargo to save/load
    - Add dangerFlags to save/load
    - _Requirements: 10.1-10.5_
  - [ ] 15.3 Write property test for state persistence round-trip
    - **Property 15: State Persistence Round-Trip**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Create danger warning dialog component
  - [ ] 17.1 Create src/features/danger/DangerWarningDialog.jsx
    - Display danger zone classification
    - Show pirate and inspection probabilities
    - Provide proceed/cancel options
    - _Requirements: 1.3, 12.3_

- [ ] 18. Create pirate encounter panel component
  - [ ] 18.1 Create src/features/danger/PirateEncounterPanel.jsx
    - Display pirate threat level and ship status
    - Show tactical options (fight, flee, negotiate, surrender)
    - Display success probabilities for each option
    - _Requirements: 2.2, 2.11, 2.12, 12.1, 12.2, 12.4, 12.5_

- [ ] 19. Create combat resolution panel component
  - [ ] 19.1 Create src/features/danger/CombatPanel.jsx
    - Display combat options (evasive, return fire, dump cargo, distress)
    - Show success probabilities with modifier breakdown
    - Display potential outcomes for each choice
    - _Requirements: 3.1, 12.1, 12.4, 12.5_

- [ ] 20. Create negotiation panel component
  - [ ] 20.1 Create src/features/danger/NegotiationPanel.jsx
    - Display contextual dialogue options
    - Show conditional options (medicine claim, intel offer)
    - Display success probabilities and consequences
    - _Requirements: 4.1, 4.5, 4.8, 4.11, 12.1, 12.5_

- [ ] 21. Create inspection panel component
  - [ ] 21.1 Create src/features/danger/InspectionPanel.jsx
    - Display cargo manifest with restricted items marked
    - Show inspection options (cooperate, bribe, flee)
    - Display costs and consequences for each option
    - _Requirements: 5.3, 5.13, 12.1, 12.5_

- [ ] 22. Create mechanical failure panel component
  - [ ] 22.1 Create src/features/danger/MechanicalFailurePanel.jsx
    - Display failure type and severity
    - Show repair options with success rates and costs
    - _Requirements: 6.6, 6.11, 12.1, 12.5_

- [ ] 23. Create distress call panel component
  - [ ] 23.1 Create src/features/danger/DistressCallPanel.jsx
    - Display distress call description
    - Show moral choice options (respond, ignore, loot)
    - Display costs and consequences for each choice
    - _Requirements: 7.2, 7.6, 12.1, 12.5_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Integrate danger system with navigation
  - [ ] 25.1 Create useJumpEncounters hook
    - Hook into jump completion events
    - Check for pirate encounters, inspections, failures, distress calls
    - Trigger appropriate panel display
    - _Requirements: 2.1, 5.1, 6.1, 7.1_
  - [ ] 25.2 Update JumpDialog to show danger warnings
    - Check destination danger zone
    - Display warning for contested/dangerous systems
    - _Requirements: 1.3_

- [ ] 26. Add outcome feedback system
  - [ ] 26.1 Create src/features/danger/OutcomePanel.jsx
    - Display encounter outcome with explanation
    - Show what modifiers affected the result
    - Display karma/reputation changes
    - _Requirements: 9.9, 12.6_

- [ ] 27. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The danger system integrates with existing navigation without modifying core jump logic
