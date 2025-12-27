# Implementation Plan: NPC Benefits System

## Overview

This implementation adds tier-based benefits, trading tips, special favors, and 7 new NPCs to the existing NPC foundation. The work is organized to build core functionality first, then add NPCs, and finally integrate with UI components.

## Tasks

- [x] 1. Add NPC benefits configuration constants
  - Add `NPC_BENEFITS_CONFIG` to `src/game/constants.js`
  - Include tip cooldown (7 days), favor cooldown (30 days), loan amount (500), storage limit (10)
  - Include tier discount percentages and free repair limits
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 2.6, 3.3, 3.5, 3.6, 11.3_

- [x] 2. Extend NPC state structure in GameStateManager
  - [x] 2.1 Add new NPC state fields to `getNPCState()` initialization
    - Add `lastTipDay`, `lastFavorDay`, `loanAmount`, `loanDay`, `storedCargo`, `lastFreeRepairDay` fields
    - Ensure backward compatibility with existing NPC state
    - _Requirements: 2.2, 3.5, 3.6, 3.7, 1.6, 1.7_

  - [x] 2.2 Write property test for NPC state initialization
    - **Property: NPC state includes all benefit tracking fields**
    - **Validates: Requirements 2.2, 3.5, 3.6, 3.7**

- [x] 3. Implement tip system in GameStateManager
  - [x] 3.1 Implement `canGetTip(npcId)` method
    - Check reputation tier >= Warm (rep >= 10)
    - Check NPC has non-empty tips array
    - Check tip cooldown (7 days since lastTipDay)
    - Return `{ available: boolean, reason: string | null }`
    - _Requirements: 2.1, 2.3, 2.5, 2.6_

  - [x] 3.2 Implement `getTip(npcId)` method
    - Return null if `canGetTip()` returns false
    - Select random tip from NPC's tips array
    - Update `lastTipDay` to current game day
    - _Requirements: 2.2, 2.4_

  - [x] 3.3 Write property test for tip availability rules
    - **Property 2: Tip Availability Rules**
    - **Validates: Requirements 2.1, 2.3, 2.5, 2.6**

  - [x] 3.4 Write property test for tip cooldown tracking
    - **Property 3: Tip Cooldown Tracking**
    - **Validates: Requirements 2.2, 2.6**

  - [x] 3.5 Write property test for tip pool membership
    - **Property 4: Tip Pool Membership**
    - **Validates: Requirements 2.4**

- [x] 4. Implement discount system in GameStateManager
  - [x] 4.1 Implement `getServiceDiscount(npcId, serviceType)` method
    - Get NPC's reputation tier
    - Check if NPC's discountService matches serviceType
    - Return discount percentage based on tier (0/5/10/15/20%)
    - Return `{ discount: number, npcName: string | null }`
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 11.3, 11.4_

  - [x] 4.2 Write property test for tier discount calculation
    - **Property 1: Tier Discount Calculation**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.7, 11.3**

  - [x] 4.3 Write property test for NPC-specific discount application
    - **Property 12: NPC-Specific Discount Application**
    - **Validates: Requirements 11.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement favor system - Loans (TDD)
  
  **RED Phase - Write failing tests first:**
  
  - [ ] 6.1 Write property test for favor tier requirements
    - **Property 5: Favor Tier Requirements**
    - Test that loan requires Trusted tier, storage requires Friendly tier
    - Test returns unavailable with reason when tier too low
    - **Validates: Requirements 3.1, 3.2, 3.9, 3.10**

  - [ ] 6.2 Write property test for favor cooldown enforcement
    - **Property 6: Favor Cooldown Enforcement**
    - Test 30-day cooldown between favors
    - Test returns daysRemaining when on cooldown
    - **Validates: Requirements 3.3, 3.7**

  - [ ] 6.3 Write property test for loan grant effects
    - **Property 7: Loan Grant Effects**
    - Test player receives 500 credits
    - Test loanAmount and loanDay are set
    - Test NPC reputation increases by 5
    - **Validates: Requirements 3.5**

  - [ ] 6.4 Write property test for loan repayment effects
    - **Property 8: Loan Repayment Effects**
    - Test 500 credits deducted from player
    - Test loanAmount and loanDay are cleared
    - **Validates: Requirements 3.14, 3.15**

  - [ ] 6.5 Write property test for loan default penalty
    - **Property 9: Loan Default Penalty**
    - Test reputation reduced by one tier after 30 days
    - Test loan record cleared after default
    - **Validates: Requirements 3.16**

  **GREEN Phase - Minimal implementation to pass tests:**

  - [ ] 6.6 Implement `canRequestFavor(npcId, favorType)` method
    - Check NPC has been met
    - Check reputation tier meets requirement (Trusted for loan, Friendly for storage)
    - Check favor cooldown (30 days since lastFavorDay)
    - Check no outstanding loan for loan requests
    - Return `{ available: boolean, reason: string, daysRemaining?: number }`
    - _Requirements: 3.1, 3.2, 3.3, 3.8, 3.9, 3.10_

  - [ ] 6.7 Implement `requestLoan(npcId)` method
    - Validate with `canRequestFavor(npcId, 'loan')`
    - Add 500 credits to player
    - Set loanAmount to 500, loanDay to current day
    - Increase NPC reputation by 5
    - Set lastFavorDay to current day
    - _Requirements: 3.1, 3.5, 3.7_

  - [ ] 6.8 Implement `repayLoan(npcId)` method
    - Check player has 500 credits
    - Deduct 500 credits from player
    - Clear loanAmount and loanDay
    - _Requirements: 3.14, 3.15_

  - [ ] 6.9 Implement `checkLoanDefaults()` method
    - Called on day advance in `updateTime()`
    - For each NPC with outstanding loan where daysSinceLoan > 30
    - Reduce reputation by one tier (approximately 20-30 points)
    - Clear loan record
    - _Requirements: 3.16, 3.17_

  **REFACTOR Phase - Improve while keeping tests green**

- [ ] 7. Implement favor system - Cargo Storage (TDD)
  
  **RED Phase - Write failing tests first:**

  - [ ] 7.1 Write property test for cargo storage transfer
    - **Property 10: Cargo Storage Transfer**
    - Test up to 10 cargo units removed from ship
    - Test cargo added to NPC's storedCargo array
    - Test lastFavorDay updated
    - **Validates: Requirements 3.6**

  - [ ] 7.2 Write property test for cargo retrieval completeness
    - **Property 11: Cargo Retrieval Completeness**
    - Test retrieval limited by ship capacity
    - Test partial retrieval leaves remainder in storage
    - Test full retrieval when capacity allows
    - **Validates: Requirements 3.11, 3.12, 3.13**

  **GREEN Phase - Minimal implementation to pass tests:**

  - [ ] 7.3 Implement `storeCargo(npcId, cargo)` method
    - Validate with `canRequestFavor(npcId, 'storage')`
    - Remove up to 10 cargo units from ship
    - Add to NPC's storedCargo array
    - Set lastFavorDay to current day
    - Return `{ success: boolean, stored: number, message: string }`
    - _Requirements: 3.2, 3.6, 3.7_

  - [ ] 7.4 Implement `retrieveCargo(npcId)` method
    - Calculate available ship capacity
    - Transfer min(storedCargo, availableCapacity) to ship
    - Leave remainder in NPC storage
    - Return `{ success: boolean, retrieved: CargoStack[], remaining: CargoStack[] }`
    - _Requirements: 3.11, 3.12, 3.13_

  **REFACTOR Phase - Improve while keeping tests green**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement free repair system (TDD)
  
  **RED Phase - Write failing tests first:**

  - [ ] 9.1 Write property test for free repair tier limits
    - **Property: Free Repair Tier Limits**
    - *For any* NPC at Trusted tier, free repair SHALL be limited to 10% hull damage
    - *For any* NPC at Family tier, free repair SHALL be limited to 25% hull damage
    - Test returns unavailable for lower tiers
    - Test once-per-visit limitation (lastFreeRepairDay check)
    - **Validates: Requirements 1.6, 1.7**

  **GREEN Phase - Minimal implementation to pass tests:**

  - [ ] 9.2 Implement `canGetFreeRepair(npcId)` method
    - Check NPC's reputation tier is Trusted or Family
    - Check lastFreeRepairDay is not current day (once per visit)
    - Return max hull percent based on tier (10% for Trusted, 25% for Family)
    - Return `{ available: boolean, maxHullPercent: number, reason: string | null }`
    - _Requirements: 1.6, 1.7_

  - [ ] 9.3 Implement `applyFreeRepair(npcId, hullDamagePercent)` method
    - Validate with `canGetFreeRepair(npcId)`
    - Repair up to maxHullPercent of hull damage
    - Set lastFreeRepairDay to current game day
    - Return `{ success: boolean, repairedPercent: number, message: string }`
    - _Requirements: 1.6, 1.7_

  **REFACTOR Phase - Improve while keeping tests green**

  **UI Integration (after core logic is tested):**

  - [ ] 9.4 Integrate free repair into RepairPanel UI
    - Show "Free repair available" when `canGetFreeRepair()` returns available
    - Add button to apply free repair with tier-appropriate limits
    - Display repaired amount and remaining free repair eligibility
    - _Requirements: 1.6, 1.7_

  - [ ] 9.5 Add free repair validation and feedback
    - Show validation messages for free repair availability
    - Display "Once per visit" limitation clearly
    - Show tier-based repair limits (10% for Trusted, 25% for Family)
    - _Requirements: 1.6, 1.7_

  - [ ] 9.6 Write integration test for free repair UI
    - Verify free repair button appears when available
    - Verify free repair button hidden when unavailable
    - Verify repair limits are enforced in UI
    - _Requirements: 1.6, 1.7_

- [ ] 10. Add new NPC definitions (TDD)
  
  **RED Phase - Write failing tests first:**

  - [ ] 10.1 Write unit test for NPC data validation
    - Verify all 7 new NPCs have required fields
    - Verify personality values match specification
    - Verify tips arrays are non-empty (except Father Okonkwo)
    - **Validates: Requirements 4.1-10.10**

  - [ ] 10.2 Write property test for NPC data validation
    - **Property 13: NPC Data Validation**
    - *For all* new NPCs, verify required fields exist and values match specification ranges
    - **Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**

  **GREEN Phase - Add NPC definitions to pass tests:**

  - [ ] 10.3 Add Whisper NPC definition to npc-data.js
    - Add to Sirius A (system 2), Sirius Exchange station
    - Include personality, speechStyle, tips array, discountService: 'intel'
    - Include tierBenefits configuration
    - _Requirements: 4.1-4.15_

  - [ ] 10.4 Add Captain Vasquez NPC definition to npc-data.js
    - Add to Epsilon Eridani (system 3), Eridani Hub station
    - Include personality, speechStyle, tips array, discountService: null
    - Include tierBenefits configuration
    - _Requirements: 5.1-5.11_

  - [ ] 10.5 Add Dr. Sarah Kim NPC definition to npc-data.js
    - Add to Tau Ceti (system 5), Tau Ceti Station
    - Include personality, speechStyle, tips array, discountService: 'docking'
    - Include tierBenefits configuration
    - _Requirements: 6.1-6.10_

  - [ ] 10.6 Add "Rusty" Rodriguez NPC definition to npc-data.js
    - Add to Procyon (system 6), Procyon Depot station
    - Include personality, speechStyle, tips array, discountService: 'repair'
    - Include tierBenefits configuration
    - _Requirements: 7.1-7.10_

  - [ ] 10.7 Add Zara Osman NPC definition to npc-data.js
    - Add to Luyten's Star (system 7), Luyten's Outpost station
    - Include personality, speechStyle, tips array, discountService: 'trade'
    - Include tierBenefits configuration
    - _Requirements: 8.1-8.10_

  - [ ] 10.8 Add Station Master Kowalski NPC definition to npc-data.js
    - Add to Alpha Centauri (system 1), Centauri Station
    - Include personality, speechStyle, tips array, discountService: 'docking'
    - Include tierBenefits configuration
    - _Requirements: 9.1-9.10_

  - [ ] 10.9 Add "Lucky" Liu NPC definition to npc-data.js
    - Add to Wolf 359 (system 8), Wolf 359 Station
    - Include personality, speechStyle, tips array, discountService: null
    - Include tierBenefits configuration
    - _Requirements: 10.1-10.10_

  **REFACTOR Phase - Improve while keeping tests green**

- [ ] 11. Extend existing NPC definitions
  - [ ] 11.1 Add tips and benefits to Wei Chen
    - Add tips array with dock worker tips
    - Add discountService: 'docking'
    - Add tierBenefits configuration
    - _Requirements: 13.1-13.4_

  - [ ] 11.2 Add tips and benefits to Marcus Cole
    - Add tips array with financial tips
    - Add discountService: 'debt'
    - Add tierBenefits configuration
    - _Requirements: 13.5-13.8_

  - [ ] 11.3 Add benefits to Father Okonkwo (no tips)
    - Keep tips array empty
    - Add discountService: 'medical'
    - Add tierBenefits configuration
    - _Requirements: 13.9-13.11_

- [ ] 12. Add dialogue trees for new NPCs
  - [ ] 12.1 Create Whisper dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option (conditional on canGetTip)
    - Add favor dialogue options (conditional on tier)
    - _Requirements: 4.11-4.15, 12.1-12.6_

  - [ ] 12.2 Create Captain Vasquez dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - Add backstory with Pavonis route hints
    - _Requirements: 5.6-5.11, 12.1-12.6_

  - [ ] 12.3 Create Dr. Sarah Kim dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - _Requirements: 6.6-6.10, 12.1-12.6_

  - [ ] 12.4 Create "Rusty" Rodriguez dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - _Requirements: 7.6-7.10, 12.1-12.6_

  - [ ] 12.5 Create Zara Osman dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - _Requirements: 8.6-8.10, 12.1-12.6_

  - [ ] 12.6 Create Station Master Kowalski dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - _Requirements: 9.6-9.10, 12.1-12.6_

  - [ ] 12.7 Create "Lucky" Liu dialogue tree
    - Add tier-based greeting text (Neutral/Warm/Friendly/Trusted/Family)
    - Add tip dialogue option
    - _Requirements: 10.6-10.10, 12.1-12.6_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Integrate discounts into service panels
  - [ ] 14.1 Update RepairPanel to show NPC discounts
    - Get discount from `getServiceDiscount()` for 'repair' service
    - Display discounted price and discount percentage
    - Show source NPC name
    - _Requirements: 11.1, 11.2_

  - [ ] 14.2 Update RefuelPanel to show NPC discounts
    - Get discount from `getServiceDiscount()` for 'refuel' service
    - Display discounted price and discount percentage
    - _Requirements: 11.1, 11.2_

  - [ ] 14.3 Update InfoBrokerPanel to show NPC discounts
    - Get discount from `getServiceDiscount()` for 'intel' service
    - Display discounted price and discount percentage
    - _Requirements: 11.1, 11.2_

  - [ ] 14.4 Write integration test for service panel discounts
    - Verify discounts display correctly in panels
    - Verify discount source NPC is shown
    - _Requirements: 11.1, 11.2_

- [ ] 15. Integrate tips into DialoguePanel
  - [ ] 15.1 Add tip dialogue option to DialoguePanel
    - Show "Ask for trading tip" option when `canGetTip()` returns true
    - Call `getTip()` when option selected
    - Display tip in dialogue
    - _Requirements: 2.1, 2.3_

  - [ ] 15.2 Write integration test for dialogue tips
    - Verify tip option appears when available
    - Verify tip option hidden when unavailable
    - Verify displayed tip text comes from correct NPC's tips array
    - Verify different NPCs show different tips
    - _Requirements: 2.1, 2.3, 2.4_

- [ ] 16. Integrate favors into DialoguePanel
  - [ ] 16.1 Add loan request dialogue option
    - Show "Request emergency loan" when `canRequestFavor('loan')` returns available
    - Show cooldown message when unavailable
    - Call `requestLoan()` when confirmed
    - _Requirements: 3.1, 3.4, 3.9_

  - [ ] 16.2 Add loan repayment dialogue option
    - Show "Repay loan" when NPC has outstanding loan
    - Call `repayLoan()` when confirmed
    - _Requirements: 3.14_

  - [ ] 16.3 Add cargo storage dialogue option
    - Show "Store cargo" when `canRequestFavor('storage')` returns available
    - Open cargo selection UI
    - Call `storeCargo()` with selected cargo
    - _Requirements: 3.2, 3.6, 3.10_

  - [ ] 16.4 Add cargo retrieval dialogue option
    - Show "Retrieve stored cargo" when NPC has storedCargo
    - Call `retrieveCargo()` when selected
    - Show partial retrieval message if capacity limited
    - _Requirements: 3.11, 3.12, 3.13_

  - [ ] 16.5 Add loan status display to NPC dialogue
    - Show outstanding loan amount and days remaining for repayment
    - Display "Loan overdue" warning when past 30-day deadline
    - Show favor cooldown status with days remaining
    - _Requirements: 3.4, 3.17_

- [ ] 17. Update save/load for new NPC state fields (TDD)
  
  **RED Phase - Write failing tests first:**

  - [ ] 17.1 Write unit test for save/load migration
    - Verify old saves load with default benefit fields
    - Verify new saves preserve all benefit state
    - _Requirements: 2.2, 3.5, 3.6, 3.7_

  **GREEN Phase - Minimal implementation to pass tests:**

  - [ ] 17.2 Update state-validators.js for NPC benefits migration
    - Add migration from v4.0.0 to v4.1.0
    - Add default values for new NPC state fields
    - _Requirements: 2.2, 3.5, 3.6, 3.7_

  **REFACTOR Phase - Improve while keeping tests green**

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **TDD Approach**: Tasks 6, 7, 9, 10, and 17 follow RED/GREEN/REFACTOR methodology
  - RED: Write failing tests first to define expected behavior
  - GREEN: Write minimal implementation to pass tests
  - REFACTOR: Improve code while keeping tests green
- All tasks including tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- UI integration tasks (11-16) follow traditional approach since component tests are written after implementation
