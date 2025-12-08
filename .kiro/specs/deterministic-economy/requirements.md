# Requirements Document

## Introduction

This specification defines the Deterministic Economy system for Tramp Freighter Blues, replacing the random price fluctuation model with a predictable, simulation-based economy. Prices are determined by three factors: distance from Sol (Technology Level), temporal drift (sine wave patterns), and local market saturation from player actions. This creates intuitive trade routes where players can predict price trends and understand cause-and-effect relationships between their trading activities and market conditions.

## Glossary

- **Game System**: The Tramp Freighter Blues application
- **Player**: The human user playing the game
- **Technology Level**: A numeric value from 1.0 to 10.0 assigned to each system based on its distance from Sol, representing technological advancement
- **Tech Modifier**: A price multiplier based on the Technology Level and commodity tech bias
- **Temporal Modifier**: A price multiplier based on sine wave patterns over time
- **Local Modifier**: A price multiplier based on player buy/sell activity in a specific system
- **Market Conditions**: The tracked surplus and deficit values for each commodity in each system
- **Surplus**: A positive market condition value indicating the player has sold goods, lowering local prices
- **Deficit**: A negative market condition value indicating the player has bought goods, raising local prices
- **Market Recovery**: The daily percentage-based healing of market conditions toward zero
- **Tech Bias**: A commodity-specific constant determining whether it is cheaper at high-tech or low-tech systems
- **Distance from Sol**: The Euclidean distance in light years from Sol to another system
- **Market Capacity**: The number of units that can be traded before prices approach extreme values
- **Economic Event**: A temporary market condition that modifies commodity prices in specific systems

## Requirements

### Requirement 1

**User Story:** As a player, I want prices to be based on distance from Sol, so that I can intuitively understand trade routes and predict profitable opportunities.

#### Acceptance Criteria

1. WHEN calculating Technology Level for a system THEN the Game System SHALL compute the Euclidean distance from Sol using the system coordinates
2. WHEN the distance from Sol is calculated THEN the Game System SHALL use the formula Technology Level equals 10.0 minus 9.0 times the minimum of distance and 21 divided by 21
3. WHEN a system is at Sol THEN the Game System SHALL assign Technology Level 10.0
4. WHEN a system is at 21 light years or more from Sol THEN the Game System SHALL assign Technology Level 1.0
5. WHEN a system is between Sol and 21 light years THEN the Game System SHALL assign a Technology Level linearly interpolated between 10.0 and 1.0

### Requirement 2

**User Story:** As a player, I want different commodities to have different price patterns based on technology, so that trade routes feel logical and consistent.

#### Acceptance Criteria

1. WHEN calculating the tech modifier for grain THEN the Game System SHALL use tech bias negative 0.6 making grain cheaper at low-tech systems
2. WHEN calculating the tech modifier for ore THEN the Game System SHALL use tech bias negative 0.8 making ore cheaper at low-tech systems
3. WHEN calculating the tech modifier for tritium THEN the Game System SHALL use tech bias negative 0.3 making tritium cheaper at low-tech systems
4. WHEN calculating the tech modifier for parts THEN the Game System SHALL use tech bias positive 0.5 making parts cheaper at high-tech systems
5. WHEN calculating the tech modifier for medicine THEN the Game System SHALL use tech bias positive 0.7 making medicine cheaper at high-tech systems
6. WHEN calculating the tech modifier for electronics THEN the Game System SHALL use tech bias positive 1.0 making electronics cheaper at high-tech systems
7. WHEN calculating the tech modifier THEN the Game System SHALL use the formula 1.0 plus tech bias times 5.0 minus Technology Level times 0.08

### Requirement 3

**User Story:** As a player, I want prices to drift smoothly over time, so that I can observe trends and plan multi-day trading strategies.

#### Acceptance Criteria

1. WHEN calculating the temporal modifier THEN the Game System SHALL use a sine wave function based on the current game day
2. WHEN calculating the temporal modifier THEN the Game System SHALL use the formula 1.0 plus 0.15 times sine of current day divided by wave period plus system identifier times 0.15
3. WHEN calculating the temporal modifier THEN the Game System SHALL use a wave period of 30 days
4. WHEN calculating the temporal modifier THEN the Game System SHALL add the system identifier to the sine function to create phase differences between systems
5. WHEN the temporal modifier is calculated THEN the Game System SHALL produce values that vary prices by plus or minus 15 percent from baseline

### Requirement 4

**User Story:** As a player, I want my buying and selling to affect local prices, so that I must rotate trade routes and cannot exploit a single route indefinitely.

#### Acceptance Criteria

1. WHEN the Player sells a commodity at a station THEN the Game System SHALL increase the surplus value for that commodity in that system by the quantity sold
2. WHEN the Player buys a commodity at a station THEN the Game System SHALL decrease the surplus value for that commodity in that system by the quantity bought creating a deficit
3. WHEN calculating the local modifier THEN the Game System SHALL use the formula 1.0 minus surplus value divided by market capacity
4. WHEN the local modifier is calculated THEN the Game System SHALL clamp the result between 0.25 and 2.0 to prevent negative prices or infinite costs
5. WHEN the market capacity constant is 1000 THEN the Game System SHALL use 1000 as the divisor for local modifier calculations
6. WHEN a surplus exists THEN the Game System SHALL reduce the local price below baseline
7. WHEN a deficit exists THEN the Game System SHALL increase the local price above baseline

### Requirement 5

**User Story:** As a player, I want markets to recover over time, so that I can return to profitable routes after waiting or exploring other systems.

#### Acceptance Criteria

1. WHEN a game day passes THEN the Game System SHALL multiply all market condition values by the daily recovery factor
2. WHEN the daily recovery factor is 0.90 THEN the Game System SHALL reduce market impacts by 10 percent per day
3. WHEN a market condition value falls between negative 1 and positive 1 THEN the Game System SHALL remove that entry from market conditions to optimize save file size
4. WHEN market conditions are updated THEN the Game System SHALL preserve the sign of surplus and deficit values during recovery
5. WHEN multiple days pass THEN the Game System SHALL apply the recovery factor for each day that elapsed

### Requirement 6

**User Story:** As a player, I want the Sol to Barnard's Star route to remain profitable, so that I have a safe starter route for early game income.

#### Acceptance Criteria

1. WHEN calculating prices at Sol THEN the Game System SHALL use Technology Level 10.0
2. WHEN calculating prices at Barnard's Star THEN the Game System SHALL use Technology Level approximately 7.4 based on its distance of approximately 6 light years
3. WHEN buying electronics at Sol and selling at Barnard's Star THEN the Game System SHALL produce a profit based on the Technology Level difference
4. WHEN buying ore at Barnard's Star and selling at Sol THEN the Game System SHALL produce a profit based on the Technology Level difference
5. WHEN temporal modifiers are unfavorable THEN the Game System SHALL still maintain a baseline profit margin on the Sol to Barnard's Star route due to the static Technology Level difference

### Requirement 7

**User Story:** As a developer, I want all economy configuration values centralized, so that I can easily tune the economic model without searching through code.

#### Acceptance Criteria

1. WHEN the Game System initializes THEN the Game System SHALL load economy configuration from a centralized ECONOMY_CONFIG object
2. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include MAX_COORD_DISTANCE set to 21
3. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include MAX_TECH_LEVEL set to 10.0
4. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include MIN_TECH_LEVEL set to 1.0
5. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include MARKET_CAPACITY set to 1000
6. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include DAILY_RECOVERY_FACTOR set to 0.90
7. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include TEMPORAL_WAVE_PERIOD set to 30
8. WHEN the ECONOMY_CONFIG is defined THEN the Game System SHALL include TECH_BIASES object with values for all six commodities

### Requirement 8

**User Story:** As a player, I want prices to combine all modifiers correctly, so that the economy feels cohesive and predictable.

#### Acceptance Criteria

1. WHEN calculating the final price THEN the Game System SHALL multiply the base price by the tech modifier
2. WHEN calculating the final price THEN the Game System SHALL multiply the result by the temporal modifier
3. WHEN calculating the final price THEN the Game System SHALL multiply the result by the local modifier
4. WHEN calculating the final price THEN the Game System SHALL multiply the result by the economic event modifier
5. WHEN calculating the final price THEN the Game System SHALL round the result to the nearest integer credit value
6. WHEN all modifiers are 1.0 THEN the Game System SHALL produce a price equal to the base price rounded to nearest integer

### Requirement 9

**User Story:** As a developer, I want market conditions stored efficiently, so that save files remain small even after extensive trading.

#### Acceptance Criteria

1. WHEN initializing a new game THEN the Game System SHALL create an empty market conditions object in the world state
2. WHEN the Player first trades at a system THEN the Game System SHALL create a market conditions entry for that system with the traded commodity and quantity
3. WHEN storing market conditions THEN the Game System SHALL use system identifier as the first level key
4. WHEN storing market conditions THEN the Game System SHALL use commodity name as the second level key
5. WHEN storing market conditions THEN the Game System SHALL store the net quantity as a numeric value
6. WHEN a market condition value becomes insignificant THEN the Game System SHALL remove that entry from the market conditions object
7. WHEN a system has no significant market conditions THEN the Game System SHALL remove that system entry from the market conditions object

### Requirement 10

**User Story:** As a player, I want prices to update when time passes, so that I see the effects of temporal drift and market recovery.

#### Acceptance Criteria

1. WHEN time advances THEN the Game System SHALL trigger a price recalculation event
2. WHEN the price recalculation event fires THEN the Game System SHALL update all displayed prices in the trade interface
3. WHEN market recovery occurs THEN the Game System SHALL recalculate prices to reflect the reduced market impact
4. WHEN the Player is viewing the trade interface THEN the Game System SHALL show prices that reflect the current game day and current market conditions
5. WHEN the Player advances time while viewing prices THEN the Game System SHALL update the displayed prices immediately

### Requirement 11

**User Story:** As a developer, I want to replace the old random economy with the new deterministic system, so that the codebase reflects the new predictable pricing model.

#### Acceptance Criteria

1. WHEN implementing the deterministic economy THEN the Game System SHALL remove the daily fluctuation system that uses seeded random for price variation
2. WHEN implementing the deterministic economy THEN the Game System SHALL remove the station count modifier that increases prices by 5 percent per station
3. WHEN implementing the deterministic economy THEN the Game System SHALL remove all spectral class modifiers from price calculations
4. WHEN implementing the deterministic economy THEN the Game System SHALL preserve the economic events system that applies temporary price modifiers to specific systems
5. WHEN calculating prices THEN the Game System SHALL use the formula base price times tech modifier times temporal modifier times local modifier times economic event modifier
