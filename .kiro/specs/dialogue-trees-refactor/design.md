# Design Document: Dialogue Trees Refactor

## Overview

This design describes the refactoring of the monolithic `dialogue-trees.js` file (2,808 lines, 96KB) into focused, maintainable modules. The refactoring follows the same successful pattern used for the GameStateManager breakdown, organizing dialogue content by NPC while preserving the existing public API through an aggregator module.

The key principle is that the main `dialogue-trees.js` file becomes a thin aggregator that imports from individual NPC files and re-exports everything, ensuring zero changes to existing import statements throughout the codebase.

## Architecture

```
src/game/data/
├── dialogue-trees.js          # Aggregator module (re-exports everything)
└── dialogue/                   # New subdirectory for dialogue modules
    ├── validation.js           # Validation functions
    ├── wei-chen.js             # Wei Chen dialogue tree
    ├── marcus-cole.js          # Marcus Cole dialogue tree
    ├── father-okonkwo.js       # Father Okonkwo dialogue tree
    ├── whisper.js              # Whisper dialogue tree
    ├── captain-vasquez.js      # Captain Vasquez dialogue tree
    ├── dr-sarah-kim.js         # Dr. Sarah Kim dialogue tree
    ├── rusty-rodriguez.js      # Rusty Rodriguez dialogue tree
    ├── zara-osman.js           # Zara Osman dialogue tree
    ├── station-master-kowalski.js  # Station Master Kowalski dialogue tree
    └── lucky-liu.js            # Lucky Liu dialogue tree
```

## Components and Interfaces

### Individual NPC Dialogue Modules

Each NPC dialogue file follows a consistent structure:

```javascript
/**
 * @fileoverview [NPC Name] Dialogue Tree
 * 
 * [Brief description of NPC personality and role]
 * 
 * @module dialogue/[npc-name]
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';

/**
 * [NPC Name] Dialogue Tree - [Location]
 * 
 * [Detailed description of NPC character, speech patterns, and dialogue flow]
 */
export const [NPC_NAME]_DIALOGUE = {
  greeting: { /* ... */ },
  // ... other nodes
};
```

Each module:
- Imports only the constants it needs (`REPUTATION_BOUNDS`, `NPC_BENEFITS_CONFIG`)
- Exports a single named constant for the dialogue tree
- Contains comprehensive JSDoc documentation
- Stays under 500 lines

### Validation Module

The `validation.js` module contains all dialogue structure validation functions:

```javascript
/**
 * @fileoverview Dialogue Tree Validation Functions
 * 
 * Provides validation utilities for dialogue tree structure integrity.
 * Used during game initialization to catch configuration errors early.
 * 
 * @module dialogue/validation
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

export function validateRequiredConstants() { /* ... */ }
export function validateDialogueTree(tree) { /* ... */ }
export function validateDialogueNode(nodeId, node) { /* ... */ }
export function validateDialogueChoice(nodeId, choiceIndex, choice) { /* ... */ }
```

Note: `validateAllDialogueTrees()` remains in the aggregator module since it needs access to `ALL_DIALOGUE_TREES`.

### Aggregator Module (dialogue-trees.js)

The main `dialogue-trees.js` becomes a thin aggregator:

```javascript
/**
 * @fileoverview Dialogue Tree Data Structures - Aggregator Module
 * 
 * This module re-exports all dialogue trees and validation functions
 * from their individual modules. Existing imports continue to work
 * without modification.
 * 
 * @module DialogueTrees
 */

// Re-export validation functions
export {
  validateRequiredConstants,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
} from './dialogue/validation.js';

// Re-export individual dialogue trees
export { WEI_CHEN_DIALOGUE } from './dialogue/wei-chen.js';
export { MARCUS_COLE_DIALOGUE } from './dialogue/marcus-cole.js';
export { FATHER_OKONKWO_DIALOGUE } from './dialogue/father-okonkwo.js';
export { WHISPER_DIALOGUE } from './dialogue/whisper.js';
export { CAPTAIN_VASQUEZ_DIALOGUE } from './dialogue/captain-vasquez.js';
export { DR_SARAH_KIM_DIALOGUE } from './dialogue/dr-sarah-kim.js';
export { RUSTY_RODRIGUEZ_DIALOGUE } from './dialogue/rusty-rodriguez.js';
export { ZARA_OSMAN_DIALOGUE } from './dialogue/zara-osman.js';
export { STATION_MASTER_KOWALSKI_DIALOGUE } from './dialogue/station-master-kowalski.js';
export { LUCKY_LIU_DIALOGUE } from './dialogue/lucky-liu.js';

// Construct ALL_DIALOGUE_TREES from imported modules
export const ALL_DIALOGUE_TREES = {
  chen_barnards: WEI_CHEN_DIALOGUE,
  cole_sol: MARCUS_COLE_DIALOGUE,
  okonkwo_ross154: FATHER_OKONKWO_DIALOGUE,
  whisper_sirius: WHISPER_DIALOGUE,
  vasquez_epsilon: CAPTAIN_VASQUEZ_DIALOGUE,
  kim_tau_ceti: DR_SARAH_KIM_DIALOGUE,
  rodriguez_procyon: RUSTY_RODRIGUEZ_DIALOGUE,
  osman_luyten: ZARA_OSMAN_DIALOGUE,
  kowalski_alpha_centauri: STATION_MASTER_KOWALSKI_DIALOGUE,
  liu_wolf359: LUCKY_LIU_DIALOGUE,
};

// validateAllDialogueTrees stays here since it needs ALL_DIALOGUE_TREES
export function validateAllDialogueTrees() {
  validateRequiredConstants();
  Object.entries(ALL_DIALOGUE_TREES).forEach(([npcId, tree]) => {
    try {
      validateDialogueTree(tree);
    } catch (error) {
      throw new Error(`Invalid dialogue tree for NPC '${npcId}': ${error.message}`);
    }
  });
}
```

## Data Models

### Dialogue Tree Structure

Each dialogue tree is an object mapping node IDs to dialogue nodes:

```javascript
{
  greeting: DialogueNode,
  small_talk: DialogueNode,
  backstory: DialogueNode,
  // ... other nodes
}
```

### Dialogue Node Structure

```javascript
{
  text: string | ((rep: number, gameStateManager?: object, npcId?: string) => string),
  choices: DialogueChoice[],
  flags?: string[]  // Optional flags to set when node is visited
}
```

### Dialogue Choice Structure

```javascript
{
  text: string,
  next: string | null,  // null ends dialogue
  repGain?: number,     // Optional reputation change
  condition?: (rep: number, gameStateManager: object, npcId: string) => boolean,
  action?: (gameStateManager: object, npcId: string) => any
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Export Equivalence

*For any* named export from the original `dialogue-trees.js` (dialogue tree constants, validation functions, `ALL_DIALOGUE_TREES`), the refactored aggregator module SHALL export an identical value with the same name.

This property ensures backward compatibility by verifying that:
- All 11 NPC dialogue constants are exported with identical names and values
- All validation functions are exported and callable
- `ALL_DIALOGUE_TREES` contains all 11 NPC ID mappings with equivalent dialogue trees

**Validates: Requirements 3.1, 3.2, 3.3, 3.5, 5.1, 5.2, 5.3**

### Property 2: File Size Constraint

*For any* individual NPC dialogue file in `src/game/data/dialogue/`, the file SHALL contain fewer than 500 lines.

**Validates: Requirements 1.11**

### Property 3: Validation Function Consistency

*For any* dialogue tree (valid or invalid), calling validation functions SHALL produce the same result (pass or throw the same error type) as before refactoring.

This ensures that:
- Valid dialogue trees pass validation
- Invalid dialogue trees produce the same error messages
- Validation behavior is deterministic and unchanged

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 5.4**

## Error Handling

### Validation Errors

Validation functions throw descriptive errors when dialogue structure is invalid:

- `validateRequiredConstants()`: Throws if `REPUTATION_BOUNDS` is missing or malformed
- `validateDialogueTree()`: Throws if tree lacks required `greeting` node
- `validateDialogueNode()`: Throws if node lacks `text` or `choices`
- `validateDialogueChoice()`: Throws if choice lacks required `text` or has invalid types

All error messages include context (node ID, choice index) to aid debugging.

### Import Errors

If an individual dialogue module fails to load (syntax error, missing file), the aggregator module will fail to load, surfacing the error immediately during application startup.

## Testing Strategy

### Unit Tests

Existing unit tests in `tests/unit/dialogue-tree-structure.test.js` and `tests/unit/npc-extensibility.test.js` verify:
- Dialogue tree structure validation
- Individual NPC dialogue tree validity
- Validation function behavior

These tests should pass without modification after refactoring.

### Property-Based Tests

Existing property tests in `tests/property/dialogue-*.property.test.js` verify:
- Dialogue navigation correctness
- Choice filtering based on reputation
- Dynamic text generation
- Flag timing and idempotence
- Reputation timing

These tests import from `dialogue-trees.js` and should pass without modification.

### Integration Tests

Existing integration tests in `tests/integration/dialogue-tips.integration.test.jsx` verify end-to-end dialogue functionality.

### New Tests

Add a simple verification test that confirms:
1. All expected exports are present from `dialogue-trees.js`
2. Each individual NPC file exports the expected constant
3. File line counts are under 500 lines

## Notes

- The refactoring is purely structural—no dialogue content changes
- Import paths in existing code remain unchanged
- The aggregator pattern ensures backward compatibility
- Individual files can be edited independently without merge conflicts
- Future NPC additions follow the established pattern
