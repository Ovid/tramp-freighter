# Implementation Plan

- [x] 1. Create NPC data structures and constants
  - Create `src/game/data/npc-data.js` with NPC definitions for Wei Chen, Marcus Cole, and Father Okonkwo
  - Create reputation tier constants in `src/game/constants.js`
  - Define NPC schema with id, name, role, system, station, personality, speechStyle, description, and initialRep
  - Add validation function to check NPC definitions have all required fields (throw error if missing)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 11.1_

- [x] 1.1 Write unit tests for NPC data definitions
  - Test Wei Chen has correct personality traits (trust: 0.3, greed: 0.2, loyalty: 0.8, morality: 0.6)
  - Test Marcus Cole has correct personality traits (trust: 0.1, greed: 0.9, loyalty: 0.3, morality: 0.2)
  - Test Father Okonkwo has correct personality traits (trust: 0.7, greed: 0.0, loyalty: 0.9, morality: 0.9)
  - Test each NPC has correct initial reputation (Wei Chen: 0, Marcus Cole: -20, Father Okonkwo: 10)
  - Test each NPC is assigned to correct system and station
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

- [x] 2. Implement reputation system
  - Add `npcs` object to game state schema in `src/game/state/game-state-manager.js`
  - Implement `modifyRep(npcId, amount, reason)` function with trust modifier and smooth_talker quirk support
  - Implement `getRepTier(rep)` function to classify reputation into tiers
  - Implement `getNPCState(npcId)` function to get or initialize NPC state
  - Initialize NPC state with rep: 0, lastInteraction: current day, flags: [], interactions: 0
  - Add error handling: throw "Unknown NPC ID: {npcId}" for invalid NPC references
  - Add error handling: clamp reputation values to [-100, 100] and log warnings if exceeded
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1-4.7, 5.1, 5.3_

- [x] 2.1 Write property test for reputation tier classification
  - **Property 4: Reputation tier classification**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

- [x] 2.2 Write property test for reputation clamping
  - **Property 5: Reputation clamping invariant**
  - **Validates: Requirements 3.4**

- [x] 2.3 Write property test for trust modifier
  - **Property 6: Trust modifier application**
  - **Validates: Requirements 3.2**

- [x] 2.4 Write property test for smooth talker quirk
  - **Property 7: Smooth talker quirk bonus**
  - **Validates: Requirements 3.3**

- [x] 2.5 Write property test for interaction count
  - **Property 8: Interaction count monotonicity**
  - **Validates: Requirements 5.3**

- [x] 2.6 Write property test for timestamp updates
  - **Property 15: Timestamp update on reputation change**
  - **Validates: Requirements 3.5**

- [x] 3. Create dialogue tree data structures
  - Create `src/game/data/dialogue-trees.js` with dialogue trees for all three NPCs
  - Implement Wei Chen dialogue tree with greeting, small_talk, backstory nodes
  - Implement Marcus Cole dialogue tree with greeting, debt_talk, business nodes
  - Implement Father Okonkwo dialogue tree with greeting, faith_talk, help nodes
  - Use function-based text for reputation-dependent greetings
  - Add condition functions for reputation-gated choices (e.g., backstory requires rep >= 30)
  - _Requirements: 2.2, 2.6, 9.3, 9.4, 11.2, 11.3, 11.4_

- [x] 3.1 Write unit tests for dialogue tree structure
  - Test Wei Chen dialogue tree has greeting node with expected choices
  - Test backstory choice has condition function requiring rep >= 30
  - Test Marcus Cole and Father Okonkwo dialogue trees exist and have greeting nodes
  - _Requirements: 9.4, 11.2_

- [x] 4. Implement dialogue engine
  - Create `src/game/game-dialogue.js` with dialogue engine functions
  - Implement `showDialogue(npcId, nodeId)` to display dialogue with filtered choices
  - Implement `selectChoice(npcId, choice)` to process player choice and advance dialogue
  - Filter choices based on condition functions
  - Apply reputation gains before advancing to next node
  - Add story flags to NPC state before advancing
  - Close dialogue when choice has no next node
  - Use initialRep for uninitialized NPCs when displaying dialogue
  - Add error handling: throw "Unknown NPC ID: {npcId}" for invalid NPC references
  - Add error handling: throw "Unknown dialogue node: {nodeId} for NPC: {npcId}" for invalid nodes
  - Add error handling: log errors and hide choices when condition functions throw exceptions
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 5.2, 5.4, 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 4.1 Write property test for choice filtering
  - **Property 10: Dialogue choice filtering**
  - **Validates: Requirements 9.1, 9.2, 10.6**

- [x] 4.2 Write property test for dialogue navigation
  - **Property 11: Dialogue navigation**
  - **Validates: Requirements 2.4, 10.4**

- [x] 4.3 Write property test for reputation update timing
  - **Property 12: Reputation update before navigation**
  - **Validates: Requirements 10.2**

- [x] 4.4 Write property test for flag setting timing
  - **Property 13: Flag setting before navigation**
  - **Validates: Requirements 10.3**

- [x] 4.5 Write property test for dynamic text generation
  - **Property 14: Dynamic dialogue text generation**
  - **Validates: Requirements 2.6, 9.3**

- [x] 4.6 Write property test for story flag idempotence
  - **Property 9: Story flag idempotence**
  - **Validates: Requirements 5.4**

- [x] 4.7 Write unit tests for dialogue edge cases
  - Test dialogue ending when choice has no next node
  - Test greeting node is displayed by default
  - Test uninitialized NPC uses initialRep for dialogue display
  - _Requirements: 2.5, 5.2, 10.1, 10.5_

- [x] 5. Create NPC query functions
  - Create `src/game/game-npcs.js` with NPC query functions
  - Implement `getNPCsAtSystem(systemId)` to filter NPCs by system
  - Implement `renderNPCListItem(npc, npcState)` to format NPC display with name, role, and tier
  - Add error handling: throw "Unknown NPC ID: {npcId}" for invalid NPC references in getNPCState
  - _Requirements: 1.1, 1.2_

- [x] 5.1 Write property test for NPC location filtering
  - **Property 1: NPC location filtering**
  - **Validates: Requirements 1.1**

- [x] 5.2 Write property test for NPC display information
  - **Property 2: NPC display information completeness**
  - **Validates: Requirements 1.2, 2.1**

- [x] 6. Create dialogue UI components
  - Create `src/features/dialogue/DialoguePanel.jsx` React component
  - Display NPC name, role, station, and reputation tier in header
  - Display dialogue text (evaluate functions with current reputation)
  - Display numbered list of available choices
  - Handle choice selection and dialogue advancement
  - Close dialogue when choice has no next node
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6.1 Write property test for numbered choice list
  - **Property 16: Numbered choice list format**
  - **Validates: Requirements 2.3**

- [x] 7. Integrate NPCs into station menu
  - Update `src/features/station/StationMenu.jsx` to display NPCs
  - Add "PEOPLE" section with list of NPCs at current system
  - Show NPC name, role, and reputation tier for each NPC
  - Omit "PEOPLE" section when no NPCs present
  - Handle NPC selection to open dialogue
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7.1 Write unit tests for station menu NPC integration
  - Test "PEOPLE" section appears when NPCs present
  - Test "PEOPLE" section omitted when no NPCs present
  - Test clicking NPC opens dialogue interface
  - _Requirements: 1.4, 1.5_

- [x] 8. Update save/load system
  - Update `src/game/state/save-load.js` to version 4
  - Add `npcs` field to save data schema
  - Implement migration from version 3 to version 4 (initialize empty npcs object)
  - Serialize all NPC state (reputation, lastInteraction, flags, interactions)
  - Deserialize all NPC state on load
  - Add error handling: log errors and initialize empty NPC state if save data is corrupted
  - Add error handling: continue game with fresh NPC relationships if NPC data cannot be loaded
  - _Requirements: 5.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8.1 Write property test for save/load preservation
  - **Property 3: Save/load NPC state preservation**
  - **Validates: Requirements 1.3, 5.5, 8.2, 8.4**

- [x] 8.2 Write unit tests for save/load migration
  - Test version 3 save migrates to version 4 with empty npcs object
  - Test version 4 save includes npcs field in schema
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 9. Add CSS styling for dialogue interface
  - Create `css/panel/dialogue.css` with dialogue panel styles
  - Style dialogue header with NPC info and reputation tier
  - Style dialogue text area
  - Style numbered choice list
  - Match existing panel styling patterns
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 10. Validate NPC system extensibility
  - Create a test NPC definition (e.g., "Test Trader" at Alpha Centauri) using the same data structure as the three main NPCs
  - Create a minimal dialogue tree for the test NPC with greeting and one choice
  - Verify the test NPC appears in station menu when at the correct system
  - Verify dialogue system works with the test NPC
  - Verify save/load preserves test NPC state without modifying core systems
  - Remove test NPC after validation (cleanup)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 10.1 Write unit tests for NPC extensibility
  - Test creating new NPC definition with all required fields
  - Test new NPC integrates with existing query functions
  - Test new dialogue tree follows required structure
  - Test new NPC state persists in save/load cycle
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

