# Implementation Plan: Dialogue Trees Refactor

## Overview

This plan breaks down the refactoring of `dialogue-trees.js` into incremental steps. Each task extracts specific content into dedicated modules while maintaining backward compatibility through the aggregator pattern.

## Tasks

- [x] 1. Create dialogue subdirectory and validation module
  - [x] 1.1 Create `src/game/data/dialogue/` directory
    - Create the new subdirectory for dialogue modules
    - _Requirements: 4.1_
  - [x] 1.2 Extract validation functions to `src/game/data/dialogue/validation.js`
    - Move `validateRequiredConstants()`, `validateDialogueTree()`, `validateDialogueNode()`, `validateDialogueChoice()` to new file
    - Add appropriate imports for `REPUTATION_BOUNDS` from constants
    - Export all four validation functions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 1.3 Write property test for validation function consistency
    - **Property 3: Validation Function Consistency**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 5.4**

- [x] 2. Extract first batch of NPC dialogue files (Wei Chen, Marcus Cole, Father Okonkwo)
  - [x] 2.1 Extract Wei Chen dialogue to `src/game/data/dialogue/wei-chen.js`
    - Move `WEI_CHEN_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.1_
  - [x] 2.2 Extract Marcus Cole dialogue to `src/game/data/dialogue/marcus-cole.js`
    - Move `MARCUS_COLE_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.2_
  - [x] 2.3 Extract Father Okonkwo dialogue to `src/game/data/dialogue/father-okonkwo.js`
    - Move `FATHER_OKONKWO_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.3_

- [x] 3. Extract second batch of NPC dialogue files (Whisper, Captain Vasquez, Dr. Sarah Kim)
  - [x] 3.1 Extract Whisper dialogue to `src/game/data/dialogue/whisper.js`
    - Move `WHISPER_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.4_
  - [x] 3.2 Extract Captain Vasquez dialogue to `src/game/data/dialogue/captain-vasquez.js`
    - Move `CAPTAIN_VASQUEZ_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.5_
  - [x] 3.3 Extract Dr. Sarah Kim dialogue to `src/game/data/dialogue/dr-sarah-kim.js`
    - Move `DR_SARAH_KIM_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.6_

- [ ] 4. Extract third batch of NPC dialogue files (Rusty Rodriguez, Zara Osman)
  - [ ] 4.1 Extract Rusty Rodriguez dialogue to `src/game/data/dialogue/rusty-rodriguez.js`
    - Move `RUSTY_RODRIGUEZ_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.7_
  - [ ] 4.2 Extract Zara Osman dialogue to `src/game/data/dialogue/zara-osman.js`
    - Move `ZARA_OSMAN_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.8_

- [ ] 5. Extract final batch of NPC dialogue files (Station Master Kowalski, Lucky Liu)
  - [ ] 5.1 Extract Station Master Kowalski dialogue to `src/game/data/dialogue/station-master-kowalski.js`
    - Move `STATION_MASTER_KOWALSKI_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.9_
  - [ ] 5.2 Extract Lucky Liu dialogue to `src/game/data/dialogue/lucky-liu.js`
    - Move `LUCKY_LIU_DIALOGUE` constant with all nodes and JSDoc
    - Add imports for `REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG` from constants
    - Export the dialogue tree constant
    - _Requirements: 1.10_
  - [ ] 5.3 Write property test for file size constraint
    - **Property 2: File Size Constraint**
    - **Validates: Requirements 1.11**

- [ ] 6. Convert dialogue-trees.js to aggregator module
  - [ ] 6.1 Replace dialogue-trees.js content with aggregator pattern
    - Remove all dialogue tree definitions and validation function implementations
    - Add re-exports for all validation functions from `./dialogue/validation.js`
    - Add re-exports for all 11 NPC dialogue trees from their individual files
    - Construct `ALL_DIALOGUE_TREES` from imported dialogue trees
    - Keep `validateAllDialogueTrees()` in aggregator (needs `ALL_DIALOGUE_TREES`)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.3_
  - [ ] 6.2 Write property test for export equivalence
    - **Property 1: Export Equivalence**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 5.1, 5.2, 5.3**

- [ ] 7. Final verification checkpoint
  - Run full test suite to verify all existing tests pass
  - Verify no import errors in application startup
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 3.4_

## Notes

- Each NPC extraction follows the same pattern for consistency
- The aggregator pattern ensures zero changes to existing import statements
- Property tests verify the refactoring preserves all functionality
