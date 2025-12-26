# Requirements Document

## Introduction

This specification expands the NPC system with tangible gameplay benefits, additional memorable characters, and reward systems for building relationships. Building on the foundation established in the npc-foundation spec, this system introduces tier-based benefits including discounts, free services, trading tips, and special favors. Players can interact with 7 additional NPCs (bringing the total to 10+) across the sector, each offering unique benefits and personality-driven interactions.

## Glossary

- **Tier Benefit**: A gameplay advantage (discount, free service, tip) granted based on reputation tier with an NPC
- **Service Discount**: A percentage reduction in the cost of station services (refuel, repair, upgrades) based on NPC relationship
- **Free Service**: A station service provided at no cost when relationship tier requirements are met
- **Trading Tip**: Market intelligence or advice provided by NPCs to help players make profitable trading decisions
- **Market Intel**: Information about price trends, supply/demand, or economic events shared by NPCs
- **Special Favor**: A unique service or assistance that NPCs provide to trusted players, with cooldown periods
- **Favor Cooldown**: A 30-day waiting period between requests for special favors from the same NPC
- **Emergency Loan**: A special favor providing ₡500 in credits to trusted players in financial difficulty
- **Cargo Storage**: A special favor allowing temporary storage of up to 10 cargo units with friendly NPCs
- **Information Broker**: An NPC role specializing in selling market intelligence and rumors
- **Station Administrator**: An NPC role with authority over station operations and regulations
- **Mechanic**: An NPC role specializing in ship repairs and maintenance services

## Requirements

### Requirement 1

**User Story:** As a player, I want to receive tangible benefits from building NPC relationships, so that investing time in conversations has meaningful gameplay rewards.

#### Acceptance Criteria

1. WHEN an NPC relationship is Hostile THEN the system SHALL refuse service, may report smuggling, and tip off pirates
2. WHEN an NPC relationship is Cold THEN the system SHALL provide minimal interaction, no tips, and standard prices
3. WHEN an NPC relationship is Neutral THEN the system SHALL provide standard service and generic dialogue
4. WHEN an NPC relationship is Warm THEN the system SHALL provide occasional tips, 5% discount on services, and hints about events
5. WHEN an NPC relationship is Friendly THEN the system SHALL provide regular tips, 10% discount on services, and personal dialogue
6. WHEN an NPC relationship is Trusted THEN the system SHALL provide free minor repairs up to 10% hull damage, 15% discount on services, safe harbor, and advance warnings
7. WHEN an NPC relationship is Family THEN the system SHALL provide free minor repairs up to 25% hull damage, 20% discount on services, willingness to take risks, and unique content

### Requirement 2

**User Story:** As a player, I want NPCs to share trading tips and market intelligence, so that building relationships helps me make better trading decisions.

#### Acceptance Criteria

1. WHEN an NPC relationship is Warm or higher THEN the system SHALL occasionally provide trading tips during dialogue
2. WHEN an NPC provides a tip THEN the system SHALL record the tip date to prevent duplicate tips within 7 days
3. WHEN an NPC has no available tips THEN the system SHALL not offer tip-related dialogue options
4. WHEN displaying tips THEN the system SHALL select randomly from the NPC's available tip pool
5. WHEN an NPC specializes in information brokering THEN the system SHALL provide more frequent and detailed market intelligence

### Requirement 3

**User Story:** As a player, I want to request special favors from trusted NPCs, so that close relationships provide unique assistance during difficult situations.

#### Acceptance Criteria

1. WHEN an NPC relationship is Trusted or Family THEN the system SHALL allow requests for emergency loans of ₡500
2. WHEN an NPC relationship is Friendly or higher THEN the system SHALL allow requests for temporary cargo storage of up to 10 units
3. WHEN a special favor is granted THEN the system SHALL impose a 30-day cooldown before the same favor can be requested again
4. WHEN a favor cooldown is active THEN the system SHALL display the remaining days until the favor becomes available
5. WHEN granting an emergency loan THEN the system SHALL increase the NPC reputation by 5 points for accepting help

### Requirement 4

**User Story:** As a player, I want to interact with Whisper at Sirius A, so that I can access specialized information brokering services.

#### Acceptance Criteria

1. WHEN the player docks at system 7 (Sirius A) THEN the system SHALL make Whisper available for interaction at Sirius Exchange
2. WHEN Whisper is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Whisper is defined THEN the system SHALL set trust to 0.5, greed to 0.7, loyalty to 0.5, and morality to 0.4
4. WHEN Whisper dialogue is displayed THEN the system SHALL use formal greeting style, educated vocabulary, and cryptic measured tones quirk
5. WHEN Whisper reaches Warm tier THEN the system SHALL provide 10% discount on intel purchases
6. WHEN Whisper reaches Friendly tier THEN the system SHALL provide free rumors once per visit
7. WHEN Whisper reaches Trusted tier THEN the system SHALL provide advance warning of inspections

### Requirement 5

**User Story:** As a player, I want to interact with Captain Vasquez at Epsilon Eridani, so that I can learn from an experienced trader and mentor figure.

#### Acceptance Criteria

1. WHEN the player docks at system 10 (Epsilon Eridani) THEN the system SHALL make Captain Vasquez available for interaction at Eridani Hub
2. WHEN Captain Vasquez is first encountered THEN the system SHALL initialize reputation to 5
3. WHEN Captain Vasquez is defined THEN the system SHALL set trust to 0.6, greed to 0.3, loyalty to 0.7, and morality to 0.7
4. WHEN Captain Vasquez dialogue is displayed THEN the system SHALL use warm greeting style, simple vocabulary, and trading stories quirk
5. WHEN Captain Vasquez reaches Warm tier THEN the system SHALL provide trading tips and route suggestions
6. WHEN Captain Vasquez reaches Friendly tier THEN the system SHALL provide old star charts that reveal profitable routes
7. WHEN Captain Vasquez reaches Trusted tier THEN the system SHALL offer co-investment opportunities with 50/50 profit splits

### Requirement 6

**User Story:** As a player, I want to interact with Dr. Sarah Kim at Tau Ceti, so that I can build relationships with station administration for operational benefits.

#### Acceptance Criteria

1. WHEN the player docks at system 12 (Tau Ceti) THEN the system SHALL make Dr. Sarah Kim available for interaction at Tau Ceti Station
2. WHEN Dr. Sarah Kim is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Dr. Sarah Kim is defined THEN the system SHALL set trust to 0.4, greed to 0.5, loyalty to 0.6, and morality to 0.8
4. WHEN Dr. Sarah Kim dialogue is displayed THEN the system SHALL use formal greeting style, technical vocabulary, and regulation citations quirk
5. WHEN Dr. Sarah Kim reaches Warm tier THEN the system SHALL provide expedited docking clearance
6. WHEN Dr. Sarah Kim reaches Friendly tier THEN the system SHALL waive docking fees
7. WHEN Dr. Sarah Kim reaches Trusted tier THEN the system SHALL provide advance notice of customs inspections

### Requirement 7

**User Story:** As a player, I want to interact with "Rusty" Rodriguez at Procyon, so that I can access specialized mechanical services and ship maintenance expertise.

#### Acceptance Criteria

1. WHEN the player docks at system 13 (Procyon) THEN the system SHALL make "Rusty" Rodriguez available for interaction at Procyon Depot
2. WHEN "Rusty" Rodriguez is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN "Rusty" Rodriguez is defined THEN the system SHALL set trust to 0.7, greed to 0.4, loyalty to 0.8, and morality to 0.5
4. WHEN "Rusty" Rodriguez dialogue is displayed THEN the system SHALL use gruff greeting style, technical vocabulary, and ship personification quirk
5. WHEN "Rusty" Rodriguez reaches Warm tier THEN the system SHALL provide 5% discount on repairs
6. WHEN "Rusty" Rodriguez reaches Friendly tier THEN the system SHALL provide 15% discount on repairs
7. WHEN "Rusty" Rodriguez reaches Trusted tier THEN the system SHALL provide free diagnostics and minor ship repairs

### Requirement 8

**User Story:** As a player, I want to interact with Zara Osman at Luyten's Star, so that I can access competitive trading opportunities and market insights.

#### Acceptance Criteria

1. WHEN the player docks at system 9 (Luyten's Star) THEN the system SHALL make Zara Osman available for interaction at Luyten's Outpost
2. WHEN Zara Osman is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Zara Osman is defined THEN the system SHALL set trust to 0.5, greed to 0.6, loyalty to 0.6, and morality to 0.5
4. WHEN Zara Osman dialogue is displayed THEN the system SHALL use casual greeting style, slang vocabulary, and trading jargon quirk
5. WHEN Zara Osman reaches Warm tier THEN the system SHALL provide market price hints
6. WHEN Zara Osman reaches Friendly tier THEN the system SHALL provide advance notice of price shifts
7. WHEN Zara Osman reaches Trusted tier THEN the system SHALL offer to purchase player cargo at 105% market rate

### Requirement 9

**User Story:** As a player, I want to interact with Station Master Kowalski at Alpha Centauri, so that I can access hub station privileges and operational benefits.

#### Acceptance Criteria

1. WHEN the player docks at system 1 (Alpha Centauri) THEN the system SHALL make Station Master Kowalski available for interaction at Centauri Station
2. WHEN Station Master Kowalski is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Station Master Kowalski is defined THEN the system SHALL set trust to 0.3, greed to 0.4, loyalty to 0.7, and morality to 0.7
4. WHEN Station Master Kowalski dialogue is displayed THEN the system SHALL use gruff greeting style, simple vocabulary, and no-nonsense directness quirk
5. WHEN Station Master Kowalski reaches Warm tier THEN the system SHALL provide priority docking
6. WHEN Station Master Kowalski reaches Friendly tier THEN the system SHALL provide access to station storage for 10 cargo units
7. WHEN Station Master Kowalski reaches Trusted tier THEN the system SHALL provide emergency fuel at cost

### Requirement 10

**User Story:** As a player, I want to interact with "Lucky" Liu at Wolf 359, so that I can access high-risk, high-reward trading opportunities and gambling-related services.

#### Acceptance Criteria

1. WHEN the player docks at system 8 (Wolf 359) THEN the system SHALL make "Lucky" Liu available for interaction at Wolf 359 Station
2. WHEN "Lucky" Liu is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN "Lucky" Liu is defined THEN the system SHALL set trust to 0.6, greed to 0.8, loyalty to 0.4, and morality to 0.3
4. WHEN "Lucky" Liu dialogue is displayed THEN the system SHALL use casual greeting style, slang vocabulary, and gambling metaphors quirk
5. WHEN "Lucky" Liu reaches Warm tier THEN the system SHALL provide gambling tips
6. WHEN "Lucky" Liu reaches Friendly tier THEN the system SHALL offer to stake ₡500 for cargo runs
7. WHEN "Lucky" Liu reaches Trusted tier THEN the system SHALL share insider information on risky opportunities

### Requirement 11

**User Story:** As a player, I want service prices to reflect my relationships with NPCs, so that building friendships provides tangible economic benefits.

#### Acceptance Criteria

1. WHEN calculating refuel costs THEN the system SHALL apply NPC discounts based on the highest relationship tier at the current station
2. WHEN calculating repair costs THEN the system SHALL apply NPC discounts based on the highest relationship tier at the current station
3. WHEN calculating upgrade costs THEN the system SHALL apply NPC discounts based on the highest relationship tier at the current station
4. WHEN displaying service prices THEN the system SHALL show both original price and discounted price when applicable
5. WHEN no NPCs are present at a station THEN the system SHALL charge standard prices without discounts

### Requirement 12

**User Story:** As a player, I want to receive free services from trusted NPCs, so that deep relationships provide significant value beyond discounts.

#### Acceptance Criteria

1. WHEN requesting repairs from a Trusted NPC THEN the system SHALL provide free repairs if hull damage is 10% or less
2. WHEN requesting repairs from a Family NPC THEN the system SHALL provide free repairs if hull damage is 25% or less
3. WHEN free repair conditions are met THEN the system SHALL restore hull to 100% at no cost
4. WHEN free repair conditions are not met THEN the system SHALL apply standard discount rates to the repair cost
5. WHEN multiple NPCs are present THEN the system SHALL use the most beneficial free repair threshold available

### Requirement 13

**User Story:** As a player, I want dialogue trees for all new NPCs to follow established patterns, so that conversations feel consistent with the existing system.

#### Acceptance Criteria

1. WHEN any new NPC dialogue is displayed THEN the system SHALL use reputation-dependent greeting text
2. WHEN any new NPC dialogue is displayed THEN the system SHALL provide numbered choice lists
3. WHEN any new NPC reaches sufficient reputation THEN the system SHALL unlock backstory dialogue options
4. WHEN any new NPC dialogue includes tips THEN the system SHALL only show tip options for Warm or higher relationships
5. WHEN any new NPC dialogue is completed THEN the system SHALL properly update reputation and interaction counts

### Requirement 14

**User Story:** As a player, I want the expanded NPC system to integrate seamlessly with existing save/load functionality, so that all relationship progress and benefits persist across game sessions.

#### Acceptance Criteria

1. WHEN saving the game THEN the system SHALL persist all new NPC states including reputation, last interaction, and favor cooldowns
2. WHEN loading the game THEN the system SHALL restore all new NPC states and make them available at their designated stations
3. WHEN loading an older save without new NPC data THEN the system SHALL initialize all new NPCs with their default reputation values
4. WHEN favor cooldowns are active THEN the system SHALL persist cooldown timestamps and restore them on game load
5. WHEN tip timestamps are recorded THEN the system SHALL persist tip dates and restore them to prevent duplicate tips after reload

### Requirement 15

**User Story:** As a system administrator, I want the benefits system to be data-driven and extensible, so that additional NPCs and benefits can be added without core system changes.

#### Acceptance Criteria

1. WHEN defining NPC benefits THEN the system SHALL support discount percentages, free service thresholds, and tip pools in NPC data
2. WHEN adding new benefit types THEN the system SHALL require only data definition changes without modifying core benefit calculation logic
3. WHEN defining special favors THEN the system SHALL support favor types, tier requirements, and cooldown periods in configuration data
4. WHEN calculating benefits THEN the system SHALL use NPC data definitions rather than hardcoded values
5. WHEN extending the system THEN the system SHALL maintain backward compatibility with existing NPC definitions from the foundation spec