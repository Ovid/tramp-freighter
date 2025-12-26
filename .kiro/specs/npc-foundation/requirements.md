# Requirements Document

## Introduction

This specification establishes the foundation for a Non-Player Character (NPC) system in Tramp Freighter Blues. The system enables persistent relationships between the player and memorable NPCs stationed throughout the sector. Players can engage in dialogue, make choices that affect relationships, and build reputation over time. This foundation supports three initial NPCs with distinct personalities, dialogue trees, and relationship tracking.

## Glossary

- **NPC (Non-Player Character)**: A character in the game controlled by the system rather than the player
- **Reputation**: A numeric value from -100 to 100 representing the relationship strength between the player and an NPC
- **Reputation Tier**: A named category (Hostile, Cold, Neutral, Warm, Friendly, Trusted, Family) based on reputation value ranges
- **Dialogue Tree**: A branching conversation structure where player choices lead to different dialogue nodes
- **Dialogue Node**: A single point in a conversation containing NPC text and available player response choices
- **Story Flag**: A persistent boolean marker indicating the player has experienced a specific story event
- **Game State Manager**: The singleton object responsible for managing all game state including NPC data
- **Station**: A location in a star system where the player can dock and interact with NPCs
- **Personality Trait**: A numeric value from 0 to 1 representing an NPC's behavioral characteristic (trust, greed, loyalty, morality)

## Requirements

### Requirement 1

**User Story:** As a player, I want to meet NPCs at specific stations, so that I can build relationships with memorable characters throughout the sector.

#### Acceptance Criteria

1. WHEN the player docks at a station THEN the system SHALL display all NPCs located at that station
2. WHEN displaying an NPC THEN the system SHALL show the NPC name, role, and current reputation tier
3. WHEN an NPC is located at a station THEN the system SHALL persist the NPC location across game sessions
4. WHEN the player views the station menu THEN the system SHALL group NPCs in a dedicated "PEOPLE" section
5. WHEN no NPCs are present at a station THEN the system SHALL omit the "PEOPLE" section from the station menu

### Requirement 2

**User Story:** As a player, I want to engage in dialogue with NPCs, so that I can learn about their personalities and stories.

#### Acceptance Criteria

1. WHEN the player selects an NPC THEN the system SHALL display a dialogue interface showing the NPC name, role, station, and current reputation tier
2. WHEN displaying dialogue THEN the system SHALL show the NPC greeting text appropriate to the current reputation tier
3. WHEN displaying dialogue THEN the system SHALL present available player response choices as a numbered list
4. WHEN the player selects a response choice THEN the system SHALL advance to the next dialogue node specified by that choice
5. WHEN a dialogue choice specifies no next node THEN the system SHALL close the dialogue interface
6. WHEN dialogue text is a function THEN the system SHALL evaluate the function with the current reputation value to generate the displayed text

### Requirement 3

**User Story:** As a player, I want my dialogue choices to affect NPC relationships, so that my interactions have meaningful consequences.

#### Acceptance Criteria

1. WHEN the player selects a dialogue choice with a reputation gain THEN the system SHALL increase the NPC reputation by the specified amount
2. WHEN reputation increases THEN the system SHALL apply the NPC personality trust modifier to the gain amount
3. WHEN the player ship has the smooth_talker quirk THEN the system SHALL multiply positive reputation gains by 1.05
4. WHEN reputation changes THEN the system SHALL clamp the final value between -100 and 100
5. WHEN reputation changes THEN the system SHALL update the NPC last interaction timestamp to the current game day

### Requirement 4

**User Story:** As a player, I want to see my relationship status with NPCs, so that I understand how my actions have affected our relationship.

#### Acceptance Criteria

1. WHEN reputation is between -100 and -50 THEN the system SHALL classify the relationship as Hostile
2. WHEN reputation is between -49 and -10 THEN the system SHALL classify the relationship as Cold
3. WHEN reputation is between -9 and 9 THEN the system SHALL classify the relationship as Neutral
4. WHEN reputation is between 10 and 29 THEN the system SHALL classify the relationship as Warm
5. WHEN reputation is between 30 and 59 THEN the system SHALL classify the relationship as Friendly
6. WHEN reputation is between 60 and 89 THEN the system SHALL classify the relationship as Trusted
7. WHEN reputation is between 90 and 100 THEN the system SHALL classify the relationship as Family

### Requirement 5

**User Story:** As a player, I want NPCs to remember our previous conversations, so that the relationship feels persistent and meaningful.

#### Acceptance Criteria

1. WHEN modifying reputation for an NPC without existing state THEN the system SHALL initialize NPC state with reputation set to zero, last interaction set to current game day, flags as empty array, and interactions set to zero
2. WHEN displaying dialogue for an NPC without existing state THEN the system SHALL use the NPC initial reputation value for reputation-dependent text and conditions
3. WHEN modifying reputation for an NPC THEN the system SHALL increment the interaction count by one
4. WHEN a dialogue node contains story flags THEN the system SHALL add those flags to the NPC state flags array if not already present
5. WHEN the player saves the game THEN the system SHALL persist all NPC state including reputation, last interaction day, flags, and interaction count

### Requirement 6

**User Story:** As a player, I want to interact with three distinct NPCs, so that I can experience different personalities and relationship dynamics.

#### Acceptance Criteria

1. WHEN the player docks at Barnard's Star system THEN the system SHALL make Wei Chen (Dock Worker) available for interaction at Bore Station 7
2. WHEN the player docks at Sol system THEN the system SHALL make Marcus Cole (Loan Shark) available for interaction at Sol Central
3. WHEN the player docks at Ross 154 system THEN the system SHALL make Father Okonkwo (Chaplain) available for interaction at Ross 154 Medical
4. WHEN Wei Chen is first encountered THEN the system SHALL initialize reputation to 0
5. WHEN Marcus Cole is first encountered THEN the system SHALL initialize reputation to -20
6. WHEN Father Okonkwo is first encountered THEN the system SHALL initialize reputation to 10

### Requirement 7

**User Story:** As a player, I want each NPC to have a unique personality and speech style, so that characters feel distinct and memorable.

#### Acceptance Criteria

1. WHEN Wei Chen is defined THEN the system SHALL set trust to 0.3, greed to 0.2, loyalty to 0.8, and morality to 0.6
2. WHEN Marcus Cole is defined THEN the system SHALL set trust to 0.1, greed to 0.9, loyalty to 0.3, and morality to 0.2
3. WHEN Father Okonkwo is defined THEN the system SHALL set trust to 0.7, greed to 0.0, loyalty to 0.9, and morality to 0.9
4. WHEN Wei Chen dialogue is displayed THEN the system SHALL use casual greeting style, simple vocabulary, and article-dropping quirk
5. WHEN Marcus Cole dialogue is displayed THEN the system SHALL use formal greeting style, educated vocabulary, and short clipped sentences quirk
6. WHEN Father Okonkwo dialogue is displayed THEN the system SHALL use warm greeting style, educated vocabulary, and religious metaphors quirk

### Requirement 8

**User Story:** As a player, I want NPC data to persist across game sessions, so that my relationships continue when I reload my save.

#### Acceptance Criteria

1. WHEN the player saves the game THEN the system SHALL serialize all NPC state to the save data structure with version 4
2. WHEN the player loads a game THEN the system SHALL restore all NPC state from the save data structure
3. WHEN loading a save from version 3 or earlier THEN the system SHALL migrate the save by initializing an empty NPC state object
4. WHEN loading a save with NPC data THEN the system SHALL restore reputation, last interaction day, flags array, and interaction count for each NPC
5. WHEN the save data version is 4 or higher THEN the system SHALL include NPC state in the save data schema

### Requirement 9

**User Story:** As a player, I want dialogue trees to branch based on my relationship level, so that conversations evolve as relationships deepen.

#### Acceptance Criteria

1. WHEN a dialogue choice has a condition function THEN the system SHALL hide that choice if the condition evaluates to false
2. WHEN a dialogue choice has a condition function THEN the system SHALL show that choice if the condition evaluates to true
3. WHEN dialogue text is a function of reputation THEN the system SHALL generate different text for different reputation tiers
4. WHEN the player has reputation of 30 or higher with Wei Chen THEN the system SHALL unlock the backstory dialogue choice
5. WHEN the player completes a backstory dialogue sequence THEN the system SHALL set story flags indicating completion

### Requirement 10

**User Story:** As a player, I want the dialogue system to handle conversation flow naturally, so that interactions feel smooth and responsive.

#### Acceptance Criteria

1. WHEN the player initiates dialogue with an NPC THEN the system SHALL display the greeting node by default
2. WHEN the player selects a dialogue choice with reputation gain THEN the system SHALL apply the reputation gain before advancing to the next node
3. WHEN the player selects a dialogue choice THEN the system SHALL add any story flags from the current node to NPC state before advancing
4. WHEN a dialogue choice specifies a next node THEN the system SHALL display that node
5. WHEN a dialogue choice specifies no next node THEN the system SHALL close the dialogue interface
6. WHEN displaying a dialogue node THEN the system SHALL filter choices to show only those without condition functions or whose condition functions evaluate to true

### Requirement 11

**User Story:** As a system administrator, I want NPC data structures to be extensible, so that additional NPCs can be added in future updates.

#### Acceptance Criteria

1. WHEN defining a new NPC THEN the system SHALL require an id, name, role, system, station, personality object, speech style object, description, and initial reputation
2. WHEN defining a new NPC dialogue tree THEN the system SHALL require a greeting node with text and choices array
3. WHEN defining a dialogue node THEN the system SHALL support text as a string or function, and choices as an array of objects
4. WHEN defining a dialogue choice THEN the system SHALL support text, next node id, optional reputation gain, and optional condition function
5. WHEN adding a new NPC THEN the system SHALL not require modifications to the save/load system beyond adding the NPC data definition
