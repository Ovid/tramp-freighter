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
- **Emergency Loan**: A special favor providing ₡500 in credits to trusted players in financial difficulty, tracked per-NPC with a 30-day repayment deadline
- **Cargo Storage**: A special favor allowing temporary storage of up to 10 cargo units with friendly NPCs, retrievable anytime at the NPC's station
- **Loan Repayment**: The act of returning borrowed credits to an NPC before the 30-day deadline to avoid relationship penalties
- **Information Broker**: An NPC role specializing in selling market intelligence and rumors
- **Station Administrator**: An NPC role with authority over station operations and regulations
- **Mechanic**: An NPC role specializing in ship repairs and maintenance services
- **Retired Trader**: An NPC role representing experienced traders who serve as mentor figures
- **Trader**: An NPC role specializing in commodity trading with sector-wide connections
- **Station Master**: An NPC role with authority over station operations and docking procedures
- **Gambler**: An NPC role specializing in high-risk opportunities and chance-based ventures
- **NPC-Specific Discount**: A discount that applies only to services matching the NPC's specialty (e.g., Mechanic discounts apply to repairs only)

## Requirements

### Requirement 1

**User Story:** As a player, I want to receive tangible benefits from building NPC relationships, so that investing time in conversations has meaningful gameplay rewards.

#### Acceptance Criteria

1. WHEN an NPC relationship is Hostile THEN the system SHALL refuse service, may report smuggling, and tip off pirates
2. WHEN an NPC relationship is Cold THEN the system SHALL provide minimal interaction, no tips, and standard prices
3. WHEN an NPC relationship is Neutral THEN the system SHALL provide standard service and generic dialogue
4. WHEN an NPC relationship is Warm THEN the system SHALL provide occasional tips, 5% discount on services, and hints about events
5. WHEN an NPC relationship is Friendly THEN the system SHALL provide regular tips, 10% discount on services, and personal dialogue
6. WHEN an NPC relationship is Trusted THEN the system SHALL provide free minor repairs up to 10% hull damage once per visit, 15% discount on services, safe harbor, and advance warnings
7. WHEN an NPC relationship is Family THEN the system SHALL provide free minor repairs up to 25% hull damage once per visit, 20% discount on services, willingness to take risks, and unique content

### Requirement 2

**User Story:** As a player, I want NPCs to share trading tips and market intelligence, so that building relationships helps me make better trading decisions.

#### Acceptance Criteria

1. WHEN an NPC relationship is Warm or higher THEN the system SHALL provide trading tips during dialogue if no tip was given in the last 7 days
2. WHEN an NPC provides a tip THEN the system SHALL record the tip date as lastTipDay to prevent duplicate tips within 7 days
3. WHEN an NPC has no available tips THEN the system SHALL not offer tip-related dialogue options
4. WHEN displaying tips THEN the system SHALL select randomly from the NPC's available tip pool
5. WHEN an NPC relationship is Neutral, Cold, or Hostile THEN the system SHALL not provide any tips
6. WHEN calculating tip availability THEN the system SHALL check if daysSinceLastTip is less than 7 and return null if true

### Requirement 3

**User Story:** As a player, I want to request special favors from trusted NPCs, so that close relationships provide unique assistance during difficult situations.

#### Acceptance Criteria

1. WHEN an NPC relationship is Trusted or Family THEN the system SHALL allow requests for emergency loans of ₡500
2. WHEN an NPC relationship is Friendly or higher THEN the system SHALL allow requests for temporary cargo storage of up to 10 units
3. WHEN a special favor is granted THEN the system SHALL impose a 30-day cooldown before the same favor can be requested again
4. WHEN a favor cooldown is active THEN the system SHALL display "Favor used recently (wait 30 days)" and show remaining days until available
5. WHEN granting an emergency loan THEN the system SHALL increase the NPC reputation by 5 points for accepting help and record the loan amount and loanDay
6. WHEN granting cargo storage THEN the system SHALL remove up to 10 cargo units from the ship and store them with the NPC as storedCargo
7. WHEN a favor is granted THEN the system SHALL record lastFavorDay to track the 30-day cooldown period
8. WHEN an NPC has not been met THEN the system SHALL return "NPC not met" when checking favor availability
9. WHEN an emergency loan is requested from an NPC below Trusted tier THEN the system SHALL return "Requires Trusted relationship"
10. WHEN cargo storage is requested from an NPC below Friendly tier THEN the system SHALL return "Requires Friendly relationship"
11. WHEN the player visits an NPC with storedCargo THEN the system SHALL allow retrieval of stored cargo at any time
12. WHEN the player retrieves stored cargo and has sufficient capacity THEN the system SHALL transfer all cargo back to the ship
13. WHEN the player retrieves stored cargo and has insufficient capacity THEN the system SHALL transfer as much cargo as fits and leave the remainder stored with the NPC
14. WHEN an emergency loan is outstanding THEN the system SHALL allow repayment by deducting ₡500 from player credits
15. WHEN an emergency loan is repaid THEN the system SHALL clear the loan record for that NPC
16. WHEN an emergency loan remains unpaid after 30 days THEN the system SHALL reduce the NPC relationship by 1 tier
17. WHEN checking loan status THEN the system SHALL calculate days remaining as 30 minus daysSinceLoan

### Requirement 4

**User Story:** As a player, I want to interact with Whisper at Sirius A, so that I can access specialized information brokering services.

#### Acceptance Criteria

1. WHEN the player docks at Sirius A THEN the system SHALL make Whisper available for interaction at Sirius Exchange
2. WHEN Whisper is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Whisper is defined THEN the system SHALL set role to "Information Broker"
4. WHEN Whisper is defined THEN the system SHALL set trust to 0.5, greed to 0.7, loyalty to 0.5, and morality to 0.4
5. WHEN Whisper is defined THEN the system SHALL set description to "Mysterious info broker. Knows everyone's secrets. Including yours."
6. WHEN Whisper dialogue is displayed THEN the system SHALL use formal greeting style, educated vocabulary, and cryptic measured tones quirk
7. WHEN Whisper provides tips THEN the system SHALL randomly select from: "Procyon is buying ore at premium prices this week.", "Avoid Tau Ceti. Inspections are up 300%.", "Someone at Ross 154 is looking for electronics. Big buyer."
8. WHEN Whisper reaches Warm tier THEN the system SHALL provide 10% discount on intel purchases
9. WHEN Whisper reaches Friendly tier THEN the system SHALL provide free rumors once per visit
10. WHEN Whisper reaches Trusted tier THEN the system SHALL provide advance warning of inspections
11. WHEN Whisper greets a Neutral player THEN the system SHALL display "Welcome. I deal in information. What do you need?"
12. WHEN Whisper greets a Warm player THEN the system SHALL display "Ah, a familiar face. Looking for intel?"
13. WHEN Whisper greets a Friendly player THEN the system SHALL display "Good to see you. I have something interesting."
14. WHEN Whisper greets a Trusted player THEN the system SHALL display "I've been expecting you. We need to talk."
15. WHEN Whisper greets a Cold or Hostile player THEN the system SHALL display "Information costs credits."

### Requirement 5

**User Story:** As a player, I want to interact with Captain Vasquez at Epsilon Eridani, so that I can learn from an experienced trader and mentor figure.

#### Acceptance Criteria

1. WHEN the player docks at Epsilon Eridani THEN the system SHALL make Captain Vasquez available for interaction at Eridani Hub
2. WHEN Captain Vasquez is first encountered THEN the system SHALL initialize reputation to 5
3. WHEN Captain Vasquez is defined THEN the system SHALL set role to "Retired Trader"
4. WHEN Captain Vasquez is defined THEN the system SHALL set trust to 0.6, greed to 0.3, loyalty to 0.7, and morality to 0.7
5. WHEN Captain Vasquez is defined THEN the system SHALL set description to "Retired freighter captain. Mentor figure. Knows the old routes."
6. WHEN Captain Vasquez dialogue is displayed THEN the system SHALL use warm greeting style, simple vocabulary, and trading stories quirk
7. WHEN Captain Vasquez provides tips THEN the system SHALL randomly select from: "Barnard's Star always needs ore. Mining station, you know.", "Sirius A pays top credit for luxury goods. Rich folks.", "The Procyon run is profitable if you can afford the fuel."
8. WHEN Captain Vasquez reaches Warm tier THEN the system SHALL provide trading tips and route suggestions
9. WHEN Captain Vasquez reaches Friendly tier THEN the system SHALL provide old star charts that reveal profitable routes
10. WHEN Captain Vasquez reaches Trusted tier THEN the system SHALL offer co-investment opportunities with 50/50 profit splits
11. WHEN Captain Vasquez dialogue includes backstory THEN the system SHALL include hints about the Pavonis route and Range Extender as endgame content

### Requirement 6

**User Story:** As a player, I want to interact with Dr. Sarah Kim at Tau Ceti, so that I can build relationships with station administration for operational benefits.

#### Acceptance Criteria

1. WHEN the player docks at Tau Ceti THEN the system SHALL make Dr. Sarah Kim available for interaction at Tau Ceti Station
2. WHEN Dr. Sarah Kim is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Dr. Sarah Kim is defined THEN the system SHALL set role to "Station Administrator"
4. WHEN Dr. Sarah Kim is defined THEN the system SHALL set trust to 0.4, greed to 0.5, loyalty to 0.6, and morality to 0.8
5. WHEN Dr. Sarah Kim is defined THEN the system SHALL set description to "Efficient station administrator. By-the-book. Respects professionalism."
6. WHEN Dr. Sarah Kim dialogue is displayed THEN the system SHALL use formal greeting style, technical vocabulary, and regulation citations quirk
7. WHEN Dr. Sarah Kim provides tips THEN the system SHALL randomly select from: "We have strict customs here. Keep your cargo manifest accurate.", "Medicine prices are stable at Ross 154. Good for planning.", "Fuel efficiency matters on long routes. Upgrade your engine."
8. WHEN Dr. Sarah Kim reaches Warm tier THEN the system SHALL provide expedited docking clearance
9. WHEN Dr. Sarah Kim reaches Friendly tier THEN the system SHALL waive docking fees
10. WHEN Dr. Sarah Kim reaches Trusted tier THEN the system SHALL provide advance notice of customs inspections

### Requirement 7

**User Story:** As a player, I want to interact with "Rusty" Rodriguez at Procyon, so that I can access specialized mechanical services and ship maintenance expertise.

#### Acceptance Criteria

1. WHEN the player docks at Procyon THEN the system SHALL make "Rusty" Rodriguez available for interaction at Procyon Depot
2. WHEN "Rusty" Rodriguez is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN "Rusty" Rodriguez is defined THEN the system SHALL set role to "Mechanic"
4. WHEN "Rusty" Rodriguez is defined THEN the system SHALL set trust to 0.7, greed to 0.4, loyalty to 0.8, and morality to 0.5
5. WHEN "Rusty" Rodriguez is defined THEN the system SHALL set description to "Gruff but skilled mechanic. Loves ships more than people."
6. WHEN "Rusty" Rodriguez dialogue is displayed THEN the system SHALL use gruff greeting style, technical vocabulary, and ship personification quirk
7. WHEN "Rusty" Rodriguez provides tips THEN the system SHALL randomly select from: "Don't let your hull drop below 50%. Expensive to fix after that.", "Engine degradation is real. Budget for maintenance.", "Life support is critical. Never skip those repairs."
8. WHEN "Rusty" Rodriguez reaches Warm tier THEN the system SHALL provide 5% discount on repairs
9. WHEN "Rusty" Rodriguez reaches Friendly tier THEN the system SHALL provide 15% discount on repairs
10. WHEN "Rusty" Rodriguez reaches Trusted tier THEN the system SHALL provide free diagnostics and minor ship repairs

### Requirement 8

**User Story:** As a player, I want to interact with Zara Osman at Luyten's Star, so that I can access trading expertise and market connections across the sector.

#### Acceptance Criteria

1. WHEN the player docks at Luyten's Star THEN the system SHALL make Zara Osman available for interaction at Luyten's Outpost
2. WHEN Zara Osman is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Zara Osman is defined THEN the system SHALL set role to "Trader"
4. WHEN Zara Osman is defined THEN the system SHALL set trust to 0.5, greed to 0.6, loyalty to 0.6, and morality to 0.5
5. WHEN Zara Osman is defined THEN the system SHALL set description to "Sharp trader with connections across the sector. Competitive but fair."
6. WHEN Zara Osman dialogue is displayed THEN the system SHALL use casual greeting style, slang vocabulary, and trading jargon quirk
7. WHEN Zara Osman provides tips THEN the system SHALL randomly select from: "Buy low at mining stations, sell high at rich systems.", "Luxury goods have the best margins if you can afford the capital.", "Watch for economic events. They shift prices dramatically."
8. WHEN Zara Osman reaches Warm tier THEN the system SHALL provide market price hints
9. WHEN Zara Osman reaches Friendly tier THEN the system SHALL provide advance notice of price shifts
10. WHEN Zara Osman reaches Trusted tier THEN the system SHALL buy player cargo at 105% market rate

### Requirement 9

**User Story:** As a player, I want to interact with Station Master Kowalski at Alpha Centauri, so that I can build relationships with station authority for operational advantages.

#### Acceptance Criteria

1. WHEN the player docks at Alpha Centauri THEN the system SHALL make Station Master Kowalski available for interaction at Centauri Station
2. WHEN Station Master Kowalski is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN Station Master Kowalski is defined THEN the system SHALL set role to "Station Master"
4. WHEN Station Master Kowalski is defined THEN the system SHALL set trust to 0.3, greed to 0.4, loyalty to 0.7, and morality to 0.7
5. WHEN Station Master Kowalski is defined THEN the system SHALL set description to "Veteran station master. Seen everything. Respects competence."
6. WHEN Station Master Kowalski dialogue is displayed THEN the system SHALL use gruff greeting style, simple vocabulary, and no-nonsense direct quirk
7. WHEN Station Master Kowalski provides tips THEN the system SHALL randomly select from: "Alpha Centauri is a hub. Good for buying and selling most goods.", "We get a lot of traffic. Prices are competitive.", "Keep your ship in good shape. We have standards here."
8. WHEN Station Master Kowalski reaches Warm tier THEN the system SHALL provide priority docking
9. WHEN Station Master Kowalski reaches Friendly tier THEN the system SHALL provide access to station storage of 10 units
10. WHEN Station Master Kowalski reaches Trusted tier THEN the system SHALL provide emergency fuel at cost

### Requirement 10

**User Story:** As a player, I want to interact with "Lucky" Liu at Wolf 359, so that I can access high-risk high-reward opportunities and gambling connections.

#### Acceptance Criteria

1. WHEN the player docks at Wolf 359 THEN the system SHALL make "Lucky" Liu available for interaction at Wolf 359 Station
2. WHEN "Lucky" Liu is first encountered THEN the system SHALL initialize reputation to 0
3. WHEN "Lucky" Liu is defined THEN the system SHALL set role to "Gambler"
4. WHEN "Lucky" Liu is defined THEN the system SHALL set trust to 0.6, greed to 0.8, loyalty to 0.4, and morality to 0.3
5. WHEN "Lucky" Liu is defined THEN the system SHALL set description to "Professional gambler and risk-taker. Loves long odds. Respects bold moves."
6. WHEN "Lucky" Liu dialogue is displayed THEN the system SHALL use casual greeting style, slang vocabulary, and gambling metaphors quirk
7. WHEN "Lucky" Liu provides tips THEN the system SHALL randomly select from: "Sometimes you gotta take risks. Big risks, big rewards.", "I heard about a high-stakes cargo run. Interested?", "Don't play it safe all the time. Fortune favors the bold."
8. WHEN "Lucky" Liu reaches Warm tier THEN the system SHALL provide gambling tips
9. WHEN "Lucky" Liu reaches Friendly tier THEN the system SHALL stake the player ₡500 for cargo runs
10. WHEN "Lucky" Liu reaches Trusted tier THEN the system SHALL share insider information on risky opportunities

### Requirement 11

**User Story:** As a player, I want to see NPC discounts reflected in the service UI, so that I understand the value of my relationships when making purchases.

#### Acceptance Criteria

1. WHEN displaying service prices THEN the system SHALL show the discounted price based on NPC relationship tier
2. WHEN a discount applies THEN the system SHALL indicate the discount percentage and source NPC in the UI
3. WHEN calculating service prices THEN the system SHALL apply 5% discount for Warm tier, 10% for Friendly, 15% for Trusted, and 20% for Family tier
4. WHEN multiple NPCs are at the same station THEN the system SHALL apply each NPC's discount only to their specialty services (e.g., Mechanic discounts apply to repairs only)

### Requirement 12

**User Story:** As a player, I want NPC dialogue to change based on my relationship tier, so that conversations feel more personal as relationships develop.

#### Acceptance Criteria

1. WHEN displaying NPC greeting dialogue THEN the system SHALL select text dynamically based on the current reputation tier
2. WHEN an NPC relationship is Neutral THEN the system SHALL display generic professional greetings
3. WHEN an NPC relationship is Warm THEN the system SHALL display familiar recognition greetings
4. WHEN an NPC relationship is Friendly THEN the system SHALL display warm personal greetings
5. WHEN an NPC relationship is Trusted THEN the system SHALL display intimate trusted greetings
6. WHEN dialogue choices are displayed THEN the system SHALL conditionally show options based on reputation thresholds
7. WHEN a dialogue choice requires reputation of 10 or higher THEN the system SHALL hide that choice for lower reputation values
8. WHEN a dialogue choice requires reputation of 30 or higher THEN the system SHALL hide that choice for lower reputation values
9. WHEN a dialogue choice has a repGain value THEN the system SHALL increase NPC reputation by that amount when the choice is selected
10. WHEN a dialogue choice leads to null THEN the system SHALL end the conversation

### Requirement 13

**User Story:** As a player, I want existing NPCs (Wei Chen and Marcus Cole) to provide tips and benefits matching their roles, so that all NPCs feel integrated into the benefits system.

#### Acceptance Criteria

1. WHEN Wei Chen relationship is Warm or higher THEN the system SHALL provide dock worker tips about cargo handling and station operations
2. WHEN Wei Chen provides tips THEN the system SHALL randomly select from: "Heavy cargo shifts during transit. Secure it properly.", "Dock fees vary by station. Sol and Alpha Centauri charge premium.", "Some captains overload their holds. Bad idea in rough space."
3. WHEN Wei Chen reaches Friendly tier THEN the system SHALL provide 5% discount on docking-related services
4. WHEN Wei Chen reaches Trusted tier THEN the system SHALL provide advance warning about dock inspections
5. WHEN Marcus Cole relationship is Warm or higher THEN the system SHALL provide financial tips about debt management and credit
6. WHEN Marcus Cole provides tips THEN the system SHALL randomly select from: "Debt compounds. Pay early when you can.", "Credit is a tool. Use it wisely, not desperately.", "Some traders leverage debt for bigger hauls. Risky but effective."
7. WHEN Marcus Cole reaches Friendly tier THEN the system SHALL reduce interest on outstanding debt by 10%
8. WHEN Marcus Cole reaches Trusted tier THEN the system SHALL offer debt restructuring options
9. WHEN Father Okonkwo is interacted with THEN the system SHALL NOT provide trading tips (role is spiritual guidance, not commerce)
10. WHEN Father Okonkwo reaches Friendly tier THEN the system SHALL provide free medical supplies once per visit
11. WHEN Father Okonkwo reaches Trusted tier THEN the system SHALL provide sanctuary (safe harbor) benefits
