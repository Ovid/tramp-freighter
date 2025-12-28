# Requirements Document

## Introduction

The Danger System adds tension and risk to space travel through pirate encounters, customs inspections, mechanical failures, and moral choices. This system transforms routine jumps into potentially dangerous events that require tactical decision-making and create meaningful consequences for player actions.

## Glossary

- **Danger_Zone**: A classification system for star systems based on pirate activity and law enforcement presence
- **Pirate_Encounter**: A hostile interaction with criminal vessels during space travel
- **Customs_Inspection**: A law enforcement check for restricted or illegal cargo
- **Mechanical_Failure**: Ship system malfunctions based on condition and wear
- **Distress_Call**: Emergency signals from other vessels requiring moral choices
- **Combat_Resolution**: A choice-driven system for resolving hostile encounters
- **Faction_Reputation**: Standing with different groups (authorities, traders, outlaws, civilians)
- **Karma_System**: A moral alignment tracker affecting random event outcomes
- **Restricted_Goods**: Cargo items that are illegal or controlled in certain systems
- **Hidden_Cargo**: Concealed goods stored in secret compartments
- **Negotiation**: Dialogue-based resolution of pirate encounters through conversation choices
- **Threat_Level**: A visual indicator of enemy strength during combat encounters
- **Tactical_Choice**: Combat options presented to players with clear success probabilities and consequences

## Requirements

### Requirement 1: Danger Zone Classification

**User Story:** As a player, I want to understand the risk level of different star systems, so that I can make informed decisions about my travel routes.

#### Acceptance Criteria

1. WHEN viewing a star system, THE System SHALL display its danger classification (safe, contested, dangerous)
2. WHEN classifying a star system, THE System SHALL calculate danger levels based on distance from Sol and specific system designations
3. WHEN planning a jump to a dangerous system, THE System SHALL display a warning dialog with risk information
4. WHEN checking for pirate encounters in a safe zone, THE System SHALL use a 5% encounter rate
5. WHEN checking for pirate encounters in a contested zone, THE System SHALL use a 20% encounter rate
6. WHEN checking for pirate encounters in a dangerous zone, THE System SHALL use a 35% encounter rate
7. WHEN checking for inspections in a safe zone, THE System SHALL use a 10% inspection rate
8. WHEN checking for inspections in a contested zone, THE System SHALL use a 15% inspection rate
9. WHEN checking for inspections in a dangerous zone, THE System SHALL use a 5% inspection rate
10. WHEN classifying systems 0, 1, 4 (Sol, Alpha Centauri, Barnard's Star), THE System SHALL designate them as safe zones
11. WHEN classifying systems 7, 10 (Sirius, Epsilon Eridani), THE System SHALL designate them as contested zones
12. WHEN classifying systems beyond 15 light-years from Sol, THE System SHALL designate them as dangerous zones

### Requirement 2: Pirate Encounters

**User Story:** As a player, I want to face pirate encounters during dangerous jumps, so that I experience tension and must make tactical decisions.

#### Acceptance Criteria

1. WHEN jumping between systems, THE System SHALL check for pirate encounters based on danger zone probability
2. WHEN a pirate encounter occurs, THE System SHALL present tactical options (fight, flee, negotiate, surrender)
3. WHEN the player chooses to fight, THE System SHALL resolve combat using ship condition and equipment modifiers
4. WHEN the player chooses to flee, THE System SHALL calculate escape probability based on engine condition
5. WHEN the player chooses to negotiate, THE System SHALL provide dialogue options with success probabilities
6. WHEN the player surrenders, THE System SHALL transfer cargo or credits to pirates and allow safe passage
7. WHEN cargo value exceeds ₡5,000, THE System SHALL multiply pirate encounter chance by 1.2
8. WHEN cargo value exceeds ₡10,000, THE System SHALL multiply pirate encounter chance by 1.5
9. WHEN engine condition is below 50%, THE System SHALL multiply pirate encounter chance by 1.1
10. WHEN ship has advanced sensors upgrade, THE System SHALL multiply pirate encounter chance by 0.8
11. WHEN displaying a pirate encounter, THE System SHALL show pirate threat level and player ship status
12. WHEN presenting tactical choices during combat, THE System SHALL show clear success probabilities for each option

### Requirement 3: Combat Resolution System

**User Story:** As a player, I want combat to be resolved through tactical choices rather than reflexes, so that I can succeed through planning and decision-making.

#### Acceptance Criteria

1. WHEN combat begins, THE System SHALL present multiple tactical options with clear success probabilities
2. WHEN the player selects evasive maneuvers, THE System SHALL calculate success based on engine condition (70% base chance)
3. WHEN evasive maneuvers succeed, THE System SHALL allow escape with fuel and engine condition penalties (-15% fuel, -5% engine)
4. WHEN evasive maneuvers fail, THE System SHALL apply hull damage (-20% hull) and continue combat
5. WHEN the player chooses to return fire, THE System SHALL resolve combat based on ship equipment and condition (45% base chance)
6. WHEN return fire succeeds, THE System SHALL drive off attackers with minor hull damage (-10% hull) and provide salvage rewards
7. WHEN return fire fails, THE System SHALL apply heavy damage (-30% hull) and boarding consequences (lose all cargo and ₡500 credits)
8. WHEN the player dumps cargo, THE System SHALL guarantee escape but impose cargo and fuel losses (-50% cargo, -10% fuel)
9. WHEN the player broadcasts distress, THE System SHALL have a 30% chance for patrol response
10. WHEN distress call succeeds, THE System SHALL cause pirates to flee and provide reputation gain (+5 reputation)
11. WHEN distress call fails, THE System SHALL apply hull damage (-25% hull) and continue combat
12. WHEN resolving combat with hot_thruster quirk, THE System SHALL add +10% to evasive maneuver success chance
13. WHEN resolving combat with lucky_ship quirk, THE System SHALL use karma as a modifier to negate bad combat outcomes (5% base chance scaled by karma)
14. WHEN resolving combat with reinforced_hull upgrade, THE System SHALL reduce hull damage taken by 25%
15. WHEN resolving combat with efficient_drive upgrade, THE System SHALL add +10% to flee attempt success chance
16. WHEN resolving combat with sensitive_sensors quirk, THE System SHALL add +5% to distress call success chance
17. WHEN resolving combat with leaky_seals quirk, THE System SHALL increase hull damage taken by 10%
18. WHEN implementing combat resolution, THE System SHALL define all combat modifier values in game constants for consistency and tuning

### Requirement 4: Negotiation System

**User Story:** As a player, I want to negotiate with pirates using dialogue choices, so that I can resolve encounters through conversation and roleplay.

#### Acceptance Criteria

1. WHEN the player chooses to negotiate during a pirate encounter, THE System SHALL present contextual dialogue options
2. WHEN the player offers a counter-proposal, THE System SHALL calculate success based on charisma (60% base chance)
3. WHEN negotiation succeeds, THE System SHALL allow reduced payment (10% cargo instead of 20%)
4. WHEN negotiation fails, THE System SHALL increase enemy strength (+10%) and force combat
5. WHEN the player claims to carry medicine AND medicine is in cargo, THE System SHALL show this dialogue option
6. WHEN the medicine claim is made, THE System SHALL have a 40% chance of pirate sympathy
7. WHEN pirates show sympathy, THE System SHALL allow free passage
8. WHEN the player offers intelligence about other ships AND prior intel has been acquired, THE System SHALL allow this option
9. WHEN intelligence is offered successfully, THE System SHALL cause pirates to leave but impose reputation penalties if discovered
10. WHEN the player accepts the initial demand, THE System SHALL allow peaceful departure with 20% cargo payment
11. WHEN presenting dialogue choices, THE System SHALL display clear consequences and success probabilities for each option

### Requirement 5: Customs Inspections

**User Story:** As a player, I want to face customs inspections when carrying restricted goods, so that smuggling involves meaningful risk and reward.

#### Acceptance Criteria

1. WHEN arriving at a system, THE System SHALL check for customs inspections based on danger zone and cargo
2. WHEN carrying restricted goods, THE System SHALL multiply inspection probability by (1 + restrictedCount * 0.1)
3. WHEN an inspection occurs, THE System SHALL present options (cooperate, bribe, flee)
4. WHEN the player cooperates and carries restricted goods, THE System SHALL confiscate restricted goods and impose ₡1,000 fine
5. WHEN the player cooperates and inspection discovers hidden cargo, THE System SHALL confiscate hidden goods and impose ₡2,000 fine
6. WHEN the player attempts bribery, THE System SHALL calculate success probability (60% base chance) and cost ₡500
7. WHEN bribery succeeds, THE System SHALL allow passage without confiscation
8. WHEN bribery fails, THE System SHALL charge bribe cost (₡500), confiscate goods, and impose original fine plus ₡1,500 additional penalty
9. WHEN the player flees, THE System SHALL trigger a patrol combat encounter
10. WHEN inspecting cargo, THE System SHALL have a 10% base chance to discover hidden cargo compartments
11. WHEN smuggling violations occur, THE System SHALL apply faction reputation penalties (-10 authorities for restricted goods, -20 for hidden cargo)
12. WHEN inspecting in core systems (systems 0, 1: Sol, Alpha Centauri), THE System SHALL double inspection rates
13. WHEN displaying inspection screen, THE System SHALL show cargo manifest with restricted items clearly marked

### Requirement 6: Mechanical Failures

**User Story:** As a player, I want my ship to suffer mechanical failures when in poor condition, so that maintenance becomes strategically important.

#### Acceptance Criteria

1. WHEN ship systems are below 50% condition during a jump, THE System SHALL check for mechanical failures
2. WHEN hull condition is below 50%, THE System SHALL have a 10% chance for hull breach events causing cargo loss
3. WHEN engine condition is below 30%, THE System SHALL have a 15% chance for engine failure events requiring repair choices
4. WHEN life support condition is below 30%, THE System SHALL have a 5% chance for life support emergencies
5. WHEN hull breach occurs, THE System SHALL cause immediate cargo loss and reduce hull integrity by 5%
6. WHEN engine failure occurs, THE System SHALL strand the player and present repair options
7. WHEN the player chooses emergency restart for engine failure, THE System SHALL calculate 50% success chance with -10% engine condition cost
8. WHEN the player chooses call for help for engine failure, THE System SHALL impose ₡1,000 cost and +2 days delay
9. WHEN the player chooses jury-rig repair for engine failure, THE System SHALL calculate 75% success chance with -5% engine condition cost
10. WHEN a failure occurs, THE System SHALL apply immediate consequences (cargo loss, stranding, system damage)
11. WHEN presenting repair options, THE System SHALL display clear success rates and costs for each option

### Requirement 7: Distress Calls

**User Story:** As a player, I want to encounter distress calls from other ships, so that I can make moral choices that affect my reputation and karma.

#### Acceptance Criteria

1. WHEN jumping between systems, THE System SHALL randomly generate distress call events (10% chance)
2. WHEN a distress call occurs, THE System SHALL present moral choice options (respond, ignore, loot)
3. WHEN the player responds to help, THE System SHALL impose resource costs but provide reputation and karma rewards
4. WHEN the player ignores the call, THE System SHALL apply karma penalties
5. WHEN the player chooses to loot, THE System SHALL provide cargo rewards but impose severe karma and reputation penalties
6. WHEN presenting distress call options, THE System SHALL display clear costs and potential consequences for each choice
7. WHEN the player helps, THE System SHALL impose costs of 2 days delay, 15% fuel, and 5% life support
8. WHEN the player helps, THE System SHALL provide rewards of ₡500 credits, +10 reputation, and +1 karma
9. WHEN the player ignores a distress call, THE System SHALL impose -1 karma penalty
10. WHEN the player loots a distress call, THE System SHALL impose 1 day delay, -3 karma, and -15 reputation

### Requirement 8: Faction Reputation System

**User Story:** As a player, I want my actions to affect my standing with different factions, so that my choices have long-term consequences.

#### Acceptance Criteria

1. WHEN initializing game state, THE System SHALL track reputation with four factions (authorities, traders, outlaws, civilians)
2. WHEN starting a new game, THE System SHALL initialize all faction reputations to neutral (0)
3. WHEN modifying faction reputation, THE System SHALL clamp values between -100 and +100
4. WHEN the player cooperates with inspections, THE System SHALL maintain or improve authority reputation
5. WHEN the player resists inspections or bribes officials, THE System SHALL decrease authority reputation
6. WHEN the player helps civilians in distress, THE System SHALL increase civilian reputation
7. WHEN the player engages in piracy or smuggling, THE System SHALL increase outlaw reputation
8. WHEN calculating encounter probabilities, THE System SHALL modify them based on faction reputation levels
9. WHEN displaying NPC dialogue, THE System SHALL affect attitudes and options based on faction standing

### Requirement 9: Karma System

**User Story:** As a player, I want my moral choices to be tracked and influence future events, so that ethical behavior has mechanical significance.

#### Acceptance Criteria

1. WHEN initializing game state, THE System SHALL track player karma on a scale from -100 to +100
2. WHEN the player makes altruistic choices, THE System SHALL increase karma
3. WHEN the player makes selfish or harmful choices, THE System SHALL decrease karma
4. WHEN calculating random event outcomes, THE System SHALL use karma as a modifier
5. WHEN NPCs first meet the player, THE System SHALL influence their impressions based on karma level
6. WHEN calculating "Lucky Ship" quirk effectiveness, THE System SHALL use karma as a modifier
7. WHEN generating ending epilogues, THE System SHALL contribute different outcomes based on final karma score
8. WHEN starting a new game, THE System SHALL initialize karma to neutral (0)
9. WHEN significant moral choices are made, THE System SHALL display karma changes to players
10. WHEN calculating success rates in certain encounters, THE System SHALL use karma as a hidden modifier

### Requirement 10: Consequence Persistence

**User Story:** As a player, I want the consequences of dangerous encounters to persist in the game world, so that my choices have lasting impact.

#### Acceptance Criteria

1. WHEN faction reputation changes, THE System SHALL save changes to persistent game state
2. WHEN karma changes, THE System SHALL save changes to persistent game state
3. WHEN ship damage occurs from encounters, THE System SHALL persist condition changes
4. WHEN cargo is lost or gained from encounters, THE System SHALL update cargo manifest permanently
5. WHEN significant story events occur (helping civilians, fighting pirates), THE System SHALL maintain flags for these events
6. WHEN displaying future NPC interactions and events, THE System SHALL reference past actions

### Requirement 11: Restricted Goods and Hidden Cargo

**User Story:** As a player, I want to smuggle restricted goods using hidden cargo compartments, so that I can engage in high-risk, high-reward trading.

#### Acceptance Criteria

1. WHEN initializing the trading system, THE System SHALL define restricted goods and their restriction zones in game constants
2. WHEN defining goods, THE System SHALL mark specific goods as restricted in certain systems or danger zones based on the constants configuration
3. WHEN the player purchases hidden cargo compartment upgrade, THE System SHALL allow installation on the ship
4. WHEN loading cargo with hidden compartments installed, THE System SHALL allow players to choose between regular and hidden storage
5. WHEN tracking cargo, THE System SHALL maintain hidden cargo separately from regular cargo manifest
6. WHEN customs inspections occur, THE System SHALL only display regular cargo in the manifest
7. WHEN inspecting for hidden cargo, THE System SHALL have a base 10% chance to discover hidden compartments
8. WHEN system security level is higher, THE System SHALL increase hidden cargo discovery chance
9. WHEN hidden cargo is discovered, THE System SHALL impose severe penalties (₡2,000 fine, -20 authority reputation)
10. WHEN selling restricted goods in systems where they are legal, THE System SHALL allow premium prices
11. WHEN attempting to sell restricted goods in systems where they are illegal, THE System SHALL prevent normal trade
12. WHEN the player has black market contacts or special NPCs, THE System SHALL allow selling restricted goods in prohibited systems

### Requirement 12: Risk Communication

**User Story:** As a player, I want clear information about risks and probabilities, so that I can make informed tactical decisions.

#### Acceptance Criteria

1. WHEN presenting tactical choices, THE System SHALL display success probabilities for each option
2. WHEN showing encounter screens, THE System SHALL display current ship status affecting outcomes
3. WHEN warning about dangerous routes, THE System SHALL provide specific risk information
4. WHEN displaying combat or encounter options, THE System SHALL show modifiers from ship condition, equipment, and quirks
5. WHEN presenting choices, THE System SHALL display potential costs and rewards clearly
6. WHEN an outcome occurs, THE System SHALL provide feedback on why that outcome happened