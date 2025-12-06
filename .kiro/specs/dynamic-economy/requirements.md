# Requirements Document

## Introduction

This specification defines the Dynamic Economy system for Tramp Freighter Blues, transforming the fixed-price trading system from Phase 1 into a living economy with price fluctuations, price discovery mechanics, economic events, information trading, and ship condition management. This system builds upon the core loop established in Spec 01 and adds depth through dynamic pricing, maintenance costs, and market intelligence gathering.

## Glossary

- **Game System**: The Tramp Freighter Blues application
- **Player**: The human user playing the game
- **Ship Condition**: The percentage-based health metrics for hull, engine, and life support systems
- **Price Discovery**: The mechanic where players only see prices for systems they have visited
- **Economic Event**: A temporary market condition affecting commodity prices in specific systems
- **Information Broker**: An NPC service that sells market intelligence to players
- **Daily Fluctuation**: The random walk price variation that occurs each game day
- **Seeded Random**: A deterministic random number generator using a seed value
- **Market Intelligence**: Price data for systems that can be purchased from information brokers
- **Degradation**: The reduction in ship condition values that occurs during jumps
- **Repair Cost**: The credit amount required to restore ship condition percentages
- **Spectral Class**: The stellar classification of a star system that affects commodity production
- **Production Modifier**: A multiplier applied to commodity prices based on the spectral class of the system
- **Station Count Modifier**: A multiplier applied to commodity prices based on the number of stations in a system

## Requirements

### Requirement 1

**User Story:** As a developer, I want a deterministic seeded random number generator, so that price calculations are reproducible and consistent across game sessions.

#### Acceptance Criteria

1. WHEN the seeded random function receives a seed string THEN the Game System SHALL convert the string to a numeric hash value
2. WHEN converting a seed string to a hash THEN the Game System SHALL iterate through each character and apply the formula hash equals hash left shift 5 minus hash plus character code
3. WHEN generating a random number THEN the Game System SHALL apply the formula hash equals hash multiplied by 9301 plus 49297 modulo 233280
4. WHEN returning a random value THEN the Game System SHALL divide the hash by 233280 to produce a value between 0 and 1
5. WHEN the same seed is provided multiple times THEN the Game System SHALL produce the same sequence of random numbers

### Requirement 2

**User Story:** As a player, I want commodity prices to change daily, so that trading feels dynamic and I must adapt my strategy over time.

#### Acceptance Criteria

1. WHEN a new game day begins THEN the Game System SHALL recalculate all commodity prices using a seeded random function
2. WHEN calculating a commodity price THEN the Game System SHALL apply base price, production modifier, station count modifier, daily fluctuation, and event modifier in sequence
3. WHEN calculating the production modifier THEN the Game System SHALL use the first character of the system spectral class to look up commodity-specific modifiers
4. WHEN calculating the station count modifier THEN the Game System SHALL use the formula 1.0 plus station count multiplied by 0.05
5. WHEN generating a seed for daily fluctuation THEN the Game System SHALL combine system identifier, commodity name, and current day number
6. WHEN using the same seed value for price calculation THEN the Game System SHALL produce identical price results
7. WHEN the daily fluctuation is calculated THEN the Game System SHALL vary prices by ±15% from the baseline using a multiplier between 0.85 and 1.15
8. WHEN calculating the final price THEN the Game System SHALL multiply all modifiers together with the base price
9. WHEN calculating the final price THEN the Game System SHALL round the result to the nearest integer credit value

### Requirement 3

**User Story:** As a player, I want to only see prices for systems I have visited, so that exploration and information gathering become valuable activities.

#### Acceptance Criteria

1. WHEN the Player visits a system for the first time THEN the Game System SHALL record current prices and last visit day in the price knowledge database
2. WHEN the Player docks at a station THEN the Game System SHALL update the price knowledge for that system with current prices and set last visit to zero
3. WHEN the Player views the trade interface THEN the Game System SHALL display only prices from systems in the price knowledge database
4. WHEN the Player has never visited a system THEN the Game System SHALL not display any price information for that system
5. WHEN time passes THEN the Game System SHALL increment the last visit day counter for all systems in the price knowledge database

### Requirement 4

**User Story:** As a player, I want economic events to occur randomly, so that market conditions create opportunities and challenges.

#### Acceptance Criteria

1. WHEN each game day passes THEN the Game System SHALL evaluate each system for potential economic event triggers based on event chance percentages
2. WHEN evaluating an event trigger THEN the Game System SHALL verify the system matches the event target system criteria
3. WHEN an economic event is triggered THEN the Game System SHALL create an event with a unique identifier, type, system identifier, start day, end day, and price modifiers
4. WHEN an economic event is active THEN the Game System SHALL apply price modifiers to affected commodities for the event duration
5. WHEN an economic event expires THEN the Game System SHALL remove the event from active events
6. WHEN the Player docks at a station with an active event THEN the Game System SHALL display an event notification dialog with event name, description, and expected duration
7. WHEN calculating prices THEN the Game System SHALL multiply the base price by any active event modifiers for that system and commodity
8. WHEN a mining strike event occurs THEN the Game System SHALL increase ore prices by 50% and tritium prices by 30% for 5-10 days
9. WHEN a medical emergency event occurs THEN the Game System SHALL increase medicine prices by 100% and decrease grain and ore prices by 10% for 3-5 days
10. WHEN a festival event occurs THEN the Game System SHALL increase electronics prices by 75% and grain prices by 20% for 2-4 days
11. WHEN a supply glut event occurs THEN the Game System SHALL decrease a random commodity price by 40% for 3-7 days

### Requirement 5

**User Story:** As a player, I want to purchase market intelligence from information brokers, so that I can make informed trading decisions without visiting every system.

#### Acceptance Criteria

1. WHEN the Player accesses the station menu THEN the Game System SHALL display an information broker option
2. WHEN the Player opens the information broker interface THEN the Game System SHALL list available systems with their intelligence costs and last visit information
3. WHEN the Player purchases market intelligence for a system THEN the Game System SHALL deduct the cost and update price knowledge with current prices for that system
4. WHEN calculating intelligence cost for a recently visited system THEN the Game System SHALL charge ₡50
5. WHEN calculating intelligence cost for a never visited system THEN the Game System SHALL charge ₡100
6. WHEN calculating intelligence cost for a long-ago visited system THEN the Game System SHALL charge ₡75
7. WHEN the Player purchases a market rumor THEN the Game System SHALL provide a hint about current market conditions for ₡25
8. WHEN generating a market rumor THEN the Game System SHALL provide information about commodity prices or economic events in a specific system
9. WHEN the Player has insufficient credits for intelligence THEN the Game System SHALL prevent the purchase and display a validation message

### Requirement 6

**User Story:** As a player, I want my ship's condition to degrade during jumps, so that maintenance becomes a meaningful cost and strategic consideration.

#### Acceptance Criteria

1. WHEN the Player completes a jump THEN the Game System SHALL reduce hull by 2%, engine by 1%, and life support by 0.5% per day traveled
2. WHEN any ship condition value reaches zero THEN the Game System SHALL clamp the value at zero and not allow negative values
3. WHEN any ship condition value reaches 100 THEN the Game System SHALL clamp the value at 100 and not allow values above maximum
4. WHEN engine condition falls below 60% THEN the Game System SHALL increase fuel consumption by 20%
5. WHEN engine condition falls below 60% THEN the Game System SHALL increase jump time by one additional day

### Requirement 7

**User Story:** As a player, I want to repair my ship at stations, so that I can restore condition and avoid performance penalties.

#### Acceptance Criteria

1. WHEN the Player accesses the station menu THEN the Game System SHALL display a repairs option
2. WHEN the Player opens the repair interface THEN the Game System SHALL display current condition percentages for hull, engine, and life support with visual progress bars
3. WHEN the Player opens the repair interface THEN the Game System SHALL display repair options for 10% increments and full restoration for each system
4. WHEN the Player opens the repair interface THEN the Game System SHALL display the cost for each repair option at ₡5 per 1% restored
5. WHEN the Player selects a repair option THEN the Game System SHALL deduct the calculated credits and increase the corresponding condition value
6. WHEN a system is already at 100% condition THEN the Game System SHALL display ₡0 cost for that system repair
7. WHEN the Player attempts to repair beyond 100% THEN the Game System SHALL prevent the repair and maintain the current condition value
8. WHEN the Player has insufficient credits for a repair THEN the Game System SHALL prevent the repair and display a validation message
9. WHEN the Player opens the repair interface THEN the Game System SHALL display a repair all to full option with the total cost

### Requirement 8

**User Story:** As a player, I want to see warnings when ship condition is low, so that I know when maintenance is urgent.

#### Acceptance Criteria

1. WHEN hull integrity falls below 50% THEN the Game System SHALL display a warning message stating risk of cargo loss during jumps
2. WHEN engine condition falls below 30% THEN the Game System SHALL display a warning message stating jump failure risk and recommending immediate repairs
3. WHEN life support falls below 20% THEN the Game System SHALL display a critical warning message stating critical condition and urging urgent repairs
4. WHEN the Player views the HUD THEN the Game System SHALL display condition bars for fuel, hull, engine, and life support with labels and percentage values
5. WHEN condition values change THEN the Game System SHALL update the visual width of condition bars to reflect current percentages
6. WHEN displaying condition bars THEN the Game System SHALL use distinct visual styling for each condition type

### Requirement 9

**User Story:** As a player, I want to see where and when I purchased cargo, so that I can calculate profit margins and make informed selling decisions.

#### Acceptance Criteria

1. WHEN the Player purchases cargo THEN the Game System SHALL store the purchase price, system identifier, and purchase day with the cargo stack
2. WHEN displaying cargo in the trade interface THEN the Game System SHALL show the purchase price for each cargo stack
3. WHEN displaying cargo in the trade interface THEN the Game System SHALL show the system name where the cargo was purchased
4. WHEN displaying cargo in the trade interface THEN the Game System SHALL calculate and show the number of days since the cargo was purchased
5. WHEN the Player selects a cargo item to sell THEN the Game System SHALL calculate and display the profit amount and percentage
6. WHEN calculating profit THEN the Game System SHALL subtract the purchase price from the current station price
7. WHEN calculating profit percentage THEN the Game System SHALL divide the profit by the purchase price and multiply by 100
