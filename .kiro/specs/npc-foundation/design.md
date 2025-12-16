# Design Document

## Overview

The NPC Foundation system introduces persistent, memorable characters to Tramp Freighter Blues. Players can meet NPCs at specific stations, engage in branching dialogue, and build relationships through conversation choices. The system tracks reputation on a scale from -100 to 100, categorized into seven relationship tiers (Hostile, Cold, Neutral, Warm, Friendly, Trusted, Family). Each NPC has a unique personality defined by four traits (trust, greed, loyalty, morality) and a distinct speech style.

This foundation implements three initial NPCs: Wei Chen (a dock worker at Barnard's Star), Marcus Cole (a loan shark at Sol), and Father Okonkwo (a chaplain at Ross 154). Each NPC has branching dialogue trees that adapt based on the player's reputation, with choices that affect the relationship. The system persists all NPC state across game sessions through the existing save/load system.

## Architecture

The NPC system follows a data-driven architecture with clear separation between static NPC definitions, dynamic NPC state, and the dialogue engine. The system integrates with the existing GameStateManager singleton for state management and the station menu UI for player interaction.

### Component Layers

1. **Data Layer**: Static NPC definitions and dialogue trees stored as JavaScript objects
2. **State Layer**: Dynamic NPC state managed by GameStateManager (reputation, flags, interaction count)
3. **Logic Layer**: Reputation calculation, dialogue tree traversal, and condition evaluation
4. **UI Layer**: React components for station menu NPC list and dialogue interface

### Integration Points

- **GameStateManager**: Stores NPC state in `gameState.npcs` object
- **Save/Load System**: Serializes/deserializes NPC state with version 4 schema
- **Station Menu**: Displays NPCs in a "PEOPLE" section with reputation tiers
- **Ship Quirks**: `smooth_talker` quirk provides 5% bonus to positive reputation gains

## Components and Interfaces

### NPC Data Structure

Each NPC is defined as a static JavaScript object with the following structure:

```javascript
{
  id: string,              // Unique identifier (e.g., 'chen_barnards')
  name: string,            // Display name (e.g., 'Wei Chen')
  role: string,            // Job title (e.g., 'Dock Worker')
  system: number,          // Star system ID where NPC is located
  station: string,         // Station name (e.g., 'Bore Station 7')
  personality: {
    trust: number,         // 0-1, multiplier for positive reputation gains
    greed: number,         // 0-1, money motivation (reserved for future use)
    loyalty: number,       // 0-1, relationship value (reserved for future use)
    morality: number       // 0-1, ethical flexibility (reserved for future use)
  },
  speechStyle: {
    greeting: string,      // 'casual', 'formal', 'gruff', 'warm'
    vocabulary: string,    // 'simple', 'educated', 'technical', 'slang'
    quirk: string          // Unique speech pattern description
  },
  description: string,     // Character description for UI
  initialRep: number       // Starting reputation (-100 to 100)
}
```

### NPC State Structure

Dynamic NPC state is stored in `gameState.npcs` as a map of NPC ID to state object:

```javascript
gameState.npcs = {
  [npcId]: {
    rep: number,              // Current reputation (-100 to 100)
    lastInteraction: number,  // Game day of last interaction
    flags: string[],          // Story flags (e.g., ['chen_backstory_1'])
    interactions: number      // Total conversation count
  }
}
```

### Dialogue Tree Structure

Dialogue trees are defined as nested objects with nodes and choices:

```javascript
{
  [nodeId]: {
    text: string | function(rep: number) => string,  // NPC dialogue text
    flags: string[],                                  // Optional story flags to set
    choices: [
      {
        text: string,                                 // Player choice text
        next: string | null,                          // Next node ID or null to end
        repGain: number,                              // Optional reputation change
        condition: function(rep: number) => boolean   // Optional visibility condition
      }
    ]
  }
}
```

### Reputation Tier Structure

Reputation tiers are defined as a constant object:

```javascript
const REP_TIERS = {
  hostile: { min: -100, max: -50, name: 'Hostile' },
  cold: { min: -49, max: -10, name: 'Cold' },
  neutral: { min: -9, max: 9, name: 'Neutral' },
  warm: { min: 10, max: 29, name: 'Warm' },
  friendly: { min: 30, max: 59, name: 'Friendly' },
  trusted: { min: 60, max: 89, name: 'Trusted' },
  family: { min: 90, max: 100, name: 'Family' }
};
```

### Core Functions

**Reputation Management:**
- `modifyRep(npcId, amount, reason)`: Modifies NPC reputation with personality and quirk modifiers
- `getRepTier(rep)`: Returns reputation tier object for a given reputation value

**Dialogue Engine:**
- `showDialogue(npcId, nodeId)`: Displays dialogue node with filtered choices
- `selectChoice(npcId, choice)`: Processes player choice, applies effects, advances dialogue

**NPC Queries:**
- `getNPCsAtSystem(systemId)`: Returns array of NPCs at a given star system
- `getNPCState(npcId)`: Returns NPC state or creates default state with initialRep

**UI Rendering:**
- `renderStationNPCs()`: Generates NPC list for station menu
- `renderDialogueUI(npc, text, choices, tier)`: Renders dialogue interface

## Data Models

### NPC Definitions

Three NPCs are defined in `src/game/data/npc-data.js`:

**Wei Chen (Barnard's Star)**
- ID: `chen_barnards`
- System: 4 (Barnard's Star)
- Station: Bore Station 7
- Initial Rep: 0
- Personality: trust 0.3, greed 0.2, loyalty 0.8, morality 0.6
- Speech: casual greeting, simple vocabulary, drops articles
- Backstory: Former ship captain who lost her ship in a bad deal

**Marcus Cole (Sol)**
- ID: `cole_sol`
- System: 0 (Sol)
- Station: Sol Central
- Initial Rep: -20 (starts cold due to player's debt)
- Personality: trust 0.1, greed 0.9, loyalty 0.3, morality 0.2
- Speech: formal greeting, educated vocabulary, short clipped sentences
- Role: Player's creditor, cold and calculating

**Father Okonkwo (Ross 154)**
- ID: `okonkwo_ross154`
- System: 11 (Ross 154)
- Station: Ross 154 Medical
- Initial Rep: 10 (starts warm, welcoming to all)
- Personality: trust 0.7, greed 0.0, loyalty 0.9, morality 0.9
- Speech: warm greeting, educated vocabulary, religious metaphors
- Role: Station chaplain and medic, moral compass

### Dialogue Trees

Each NPC has a dialogue tree in `src/game/data/dialogue-trees.js`:

**Wei Chen Dialogue Flow:**
- greeting → small_talk → (boring_response | honest_work) → greeting
- greeting → backstory (rep >= 30) → backstory_2 → greeting

**Marcus Cole Dialogue Flow:**
- greeting → debt_talk → (payment_plan | defiant_response) → greeting
- greeting → business (rep >= 0) → business_details → greeting

**Father Okonkwo Dialogue Flow:**
- greeting → faith_talk → (agree | skeptical) → greeting
- greeting → help (rep >= 10) → help_details → greeting

### Game State Schema

The save data schema is updated to version 4:

```javascript
{
  version: 4,
  timestamp: number,
  state: {
    player: { /* existing player state */ },
    ship: { /* existing ship state */ },
    world: { /* existing world state */ },
    npcs: {
      [npcId]: {
        rep: number,
        lastInteraction: number,
        flags: string[],
        interactions: number
      }
    }
  }
}
```

Migration from version 3 initializes `npcs` as an empty object.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: NPC Location Filtering

*For any* star system ID and set of NPC definitions, when querying NPCs at that system, all returned NPCs should have their system field equal to the queried system ID, and no NPCs with that system ID should be omitted.

**Validates: Requirements 1.1**

### Property 2: NPC Display Information Completeness

*For any* NPC with a reputation value, when rendering the NPC for display, the output should contain the NPC name, role, and the correct reputation tier name corresponding to that reputation value.

**Validates: Requirements 1.2, 2.1**

### Property 3: Save/Load NPC State Preservation

*For any* game state with NPC data, when saving and then loading the game, all NPC state (reputation, last interaction day, flags array, and interaction count) should be identical to the original state.

**Validates: Requirements 1.3, 5.5, 8.2, 8.4**

### Property 4: Reputation Tier Classification

*For any* reputation value between -100 and 100, the reputation tier classification function should return exactly one tier, and that tier's min and max bounds should contain the reputation value.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

### Property 5: Reputation Clamping Invariant

*For any* initial reputation value and reputation change amount, after applying the change, the final reputation value should be between -100 and 100 inclusive.

**Validates: Requirements 3.4**

### Property 6: Trust Modifier Application

*For any* positive reputation gain and NPC trust value, when modifying reputation, the applied gain should equal the original gain multiplied by the trust value (before quirk bonuses and clamping).

**Validates: Requirements 3.2**

### Property 7: Smooth Talker Quirk Bonus

*For any* positive reputation gain, when the ship has the smooth_talker quirk, the final reputation change should be 1.05 times larger than without the quirk (before clamping).

**Validates: Requirements 3.3**

### Property 8: Interaction Count Monotonicity

*For any* NPC, when modifying reputation multiple times, the interaction count should increase by exactly the number of modifications.

**Validates: Requirements 5.3**

### Property 9: Story Flag Idempotence

*For any* NPC and story flag, when adding the same flag multiple times, the NPC flags array should contain that flag exactly once.

**Validates: Requirements 5.4**

### Property 10: Dialogue Choice Filtering

*For any* dialogue node with choices that have condition functions, when displaying the node with a given reputation value, all visible choices should have their condition functions return true for that reputation, and all hidden choices should have their condition functions return false.

**Validates: Requirements 9.1, 9.2, 10.6**

### Property 11: Dialogue Navigation

*For any* dialogue choice with a next node ID, when the player selects that choice, the dialogue system should display the node with that ID.

**Validates: Requirements 2.4, 10.4**

### Property 12: Reputation Update Before Navigation

*For any* dialogue choice with a reputation gain, when the player selects that choice, the reputation should be updated before the next dialogue node is displayed.

**Validates: Requirements 10.2**

### Property 13: Flag Setting Before Navigation

*For any* dialogue node with story flags, when displaying that node, the flags should be added to NPC state before the node text is displayed.

**Validates: Requirements 10.3**

### Property 14: Dynamic Dialogue Text Generation

*For any* dialogue node with function-based text, when displaying the node with different reputation values that map to different tiers, the generated text should be different for at least some tier combinations.

**Validates: Requirements 2.6, 9.3**

### Property 15: Timestamp Update on Reputation Change

*For any* NPC and game day, when modifying reputation, the NPC last interaction timestamp should be set to the current game day.

**Validates: Requirements 3.5**

### Property 16: Numbered Choice List Format

*For any* dialogue node with multiple choices, when rendering the choices, each choice should be prefixed with a unique sequential number starting from 1.

**Validates: Requirements 2.3**

## Error Handling

### Invalid NPC References

When an NPC ID is referenced that doesn't exist in the NPC data definitions:
- `modifyRep`: Throw error "Unknown NPC ID: {npcId}"
- `showDialogue`: Throw error "Unknown NPC ID: {npcId}"
- `getNPCState`: Throw error "Unknown NPC ID: {npcId}"

### Invalid Dialogue Nodes

When a dialogue choice references a next node that doesn't exist:
- `selectChoice`: Throw error "Unknown dialogue node: {nodeId} for NPC: {npcId}"

### Invalid Reputation Values

When attempting to set reputation outside the valid range:
- The system should clamp to [-100, 100] rather than throwing an error
- Log a warning if the unclamped value would exceed bounds

### Missing Required Fields

When an NPC definition is missing required fields:
- Throw error during initialization: "Invalid NPC definition for {npcId}: missing {fieldName}"

### Save/Load Errors

When loading a save file with corrupted NPC data:
- Log error and initialize empty NPC state object
- Continue game with fresh NPC relationships

### Condition Function Errors

When a dialogue choice condition function throws an error:
- Log error and treat the choice as hidden
- Continue dialogue display with remaining valid choices

## Testing Strategy

The NPC Foundation system will be tested using both unit tests and property-based tests to ensure correctness across all scenarios.

### Unit Testing Approach

Unit tests will verify specific examples and integration points:

**NPC Data Definitions:**
- Verify Wei Chen has correct personality traits and initial reputation
- Verify Marcus Cole has correct personality traits and initial reputation
- Verify Father Okonkwo has correct personality traits and initial reputation
- Verify each NPC is assigned to the correct system and station

**Dialogue Tree Structure:**
- Verify Wei Chen dialogue tree has greeting node with expected choices
- Verify backstory choice is locked behind reputation >= 30 condition
- Verify dialogue trees for Marcus Cole and Father Okonkwo exist

**Save/Load Migration:**
- Verify version 3 save migrates to version 4 with empty npcs object
- Verify version 4 save includes npcs field in schema

**Station Menu Integration:**
- Verify station menu shows "PEOPLE" section when NPCs present
- Verify station menu omits "PEOPLE" section when no NPCs present
- Verify clicking NPC opens dialogue interface

**Edge Cases:**
- Verify dialogue ending when choice has no next node
- Verify empty NPC list at station with no NPCs
- Verify uninitialized NPC uses initialRep for dialogue display

### Property-Based Testing Approach

Property-based tests will verify universal properties across all inputs using the fast-check library. Each test will run a minimum of 100 iterations with randomly generated inputs.

**Reputation System Properties:**
- Property 4: Reputation tier classification (test with arbitrary reputation values -100 to 100)
- Property 5: Reputation clamping invariant (test with arbitrary initial rep and changes)
- Property 6: Trust modifier application (test with arbitrary trust values 0-1 and gains)
- Property 7: Smooth talker quirk bonus (test with arbitrary gains and quirk on/off)
- Property 8: Interaction count monotonicity (test with arbitrary number of modifications)
- Property 15: Timestamp update (test with arbitrary game days and reputation changes)

**Dialogue System Properties:**
- Property 10: Dialogue choice filtering (test with arbitrary reputation and condition functions)
- Property 11: Dialogue navigation (test with arbitrary dialogue trees)
- Property 12: Reputation update before navigation (test with arbitrary choices and gains)
- Property 13: Flag setting before navigation (test with arbitrary flags)
- Property 14: Dynamic text generation (test with arbitrary reputation values)
- Property 16: Numbered choice list (test with arbitrary number of choices)

**Data Persistence Properties:**
- Property 3: Save/load preservation (test with arbitrary NPC state)
- Property 9: Story flag idempotence (test with arbitrary flags and repetitions)

**NPC Query Properties:**
- Property 1: NPC location filtering (test with arbitrary system IDs and NPC sets)
- Property 2: NPC display information (test with arbitrary NPCs and reputations)

**Test Data Generators:**

The property-based tests will use custom generators for:
- `arbNPC()`: Generates random NPC definitions with valid structure
- `arbReputation()`: Generates reputation values between -100 and 100
- `arbNPCState()`: Generates random NPC state objects
- `arbDialogueNode()`: Generates random dialogue nodes with choices
- `arbDialogueTree()`: Generates random dialogue trees with valid structure
- `arbGameState()`: Generates random game state with NPC data

Each property-based test will be tagged with a comment explicitly referencing the correctness property:

```javascript
// Feature: npc-foundation, Property 4: Reputation tier classification
test('reputation tier classification', () => {
  fc.assert(
    fc.property(arbReputation(), (rep) => {
      const tier = getRepTier(rep);
      return rep >= tier.min && rep <= tier.max;
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify the complete flow of NPC interactions:

**Complete Dialogue Flow:**
- Player docks at station → sees NPC in menu → opens dialogue → makes choices → reputation changes → dialogue ends

**Reputation Progression:**
- Start with neutral NPC → have multiple conversations → verify tier changes → verify dialogue options unlock

**Save/Load Cycle:**
- Create NPC relationships → save game → load game → verify all state preserved → continue interactions

**Multi-NPC Interactions:**
- Interact with all three NPCs → verify independent state → verify no cross-contamination

